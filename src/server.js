import http from "node:http";
import { getSettings } from "./config.js";
import { NutClientMock } from "./NutClientMock.js";
import { NutClient, NutError } from "./NutClient.js";
import { logError, logInfo } from "./logger.js";
import { renderUpsWidget } from "./widget.js";

const settings = getSettings();
const useDevClient = process.argv.includes("dev");
const rateLimitStore = new Map();
const WIDGET_THEMES = ["blue", "creme", "homarr", "white"];
const RATE_LIMITS = {
  health: { windowMs: 60000, maxRequests: settings.rateLimitHealth },
  api: { windowMs: 60000, maxRequests: settings.rateLimitApi },
  widget: { windowMs: 60000, maxRequests: settings.rateLimitWidget }
};

process.on("uncaughtException", (error) => {
  logError("runtime.uncaughtException", error);
});

process.on("unhandledRejection", (reason) => {
  logError("runtime.unhandledRejection", reason);
});

//-----------------------------------------------------------------------------
// sendJson
//-----------------------------------------------------------------------------
function sendJson(response, statusCode, payload) {

  const body = JSON.stringify(payload);
  response.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(body)
  });
  response.end(body);
}

//-----------------------------------------------------------------------------
// sendHtml
//-----------------------------------------------------------------------------
function sendHtml(response, statusCode, html) {

  response.writeHead(statusCode, {
    "Content-Type": "text/html; charset=utf-8",
    "Content-Length": Buffer.byteLength(html)
  });
  response.end(html);
}

//-----------------------------------------------------------------------------
// getClientIp
//-----------------------------------------------------------------------------
function getClientIp(request) {

  const forwardedFor = request.headers["x-forwarded-for"];

  if (typeof forwardedFor === "string" && forwardedFor.trim()) {
    return forwardedFor.split(",")[0].trim();
  }

  return request.socket.remoteAddress || "unknown";
}

//-----------------------------------------------------------------------------
// buildNutClient
//-----------------------------------------------------------------------------
function buildNutClient() {

  if (useDevClient) {
    return new NutClientMock({
      upsName: settings.upsName
    });
  }

  return new NutClient({
    host: settings.host,
    port: settings.port,
    upsName: settings.upsName,
    timeoutSeconds: settings.timeoutSeconds,
    username: settings.username,
    password: settings.password
  });
}

//-----------------------------------------------------------------------------
// formatHealthTimestamp
//-----------------------------------------------------------------------------
function formatHealthTimestamp() {

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit"
  }).format(new Date());
}

//-----------------------------------------------------------------------------
// getRateLimitConfig
//-----------------------------------------------------------------------------
function getRateLimitConfig(pathname) {

  if (pathname === "/health") {
    return { key: "health", ...RATE_LIMITS.health };
  }

  if (pathname === "/api/ups" || pathname.startsWith("/api/ups/")) {
    return { key: "api", ...RATE_LIMITS.api };
  }

  if (pathname === "/widget/ups") {
    return { key: "widget", ...RATE_LIMITS.widget };
  }

  return null;
}

//-----------------------------------------------------------------------------
// getWidgetTheme
//-----------------------------------------------------------------------------
function getWidgetTheme(url) {

  const theme = url.searchParams.get("theme");
  return WIDGET_THEMES.includes(theme) ? theme : "blue";
}

//-----------------------------------------------------------------------------
// applyRateLimit
//-----------------------------------------------------------------------------
function applyRateLimit(request, response, pathname) {

  const config = getRateLimitConfig(pathname);
  if (!config) {
    return false;
  }

  const now = Date.now();
  const clientIp = getClientIp(request);
  const bucketKey = `${config.key}:${clientIp}`;
  const existingBucket = rateLimitStore.get(bucketKey);
  const bucket = existingBucket && existingBucket.resetAt > now ? existingBucket : { count: 0, resetAt: now + config.windowMs };

  bucket.count += 1;
  rateLimitStore.set(bucketKey, bucket);

  const retryAfterSeconds = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
  const remainingRequests = Math.max(0, config.maxRequests - bucket.count);

  response.setHeader("X-RateLimit-Limit", String(config.maxRequests));
  response.setHeader("X-RateLimit-Remaining", String(remainingRequests));
  response.setHeader("X-RateLimit-Reset", String(Math.ceil(bucket.resetAt / 1000)));

  if (bucket.count <= config.maxRequests) {
    return false;
  }

  logInfo("request.rateLimited", {
    clientIp,
    pathname,
    limit: config.maxRequests,
    retryAfterSeconds
  });

  response.setHeader("Retry-After", String(retryAfterSeconds));
  sendJson(response, 429, {
    error: "Rate limit exceeded.",
    retry_after_seconds: retryAfterSeconds
  });
  
  return true;
}

//-----------------------------------------------------------------------------
// http server
//-----------------------------------------------------------------------------
const server = http.createServer(async (request, response) => {

  if (!request.url || request.method !== "GET") {
    sendJson(response, 404, { error: "Not found" });
    return;
  }

  const url = new URL(request.url, `http://${request.headers.host || "localhost"}`);
  const clientIp = getClientIp(request);

  logInfo("request.received", {
    clientIp,
    method: request.method,
    path: url.pathname,
    query: url.search
  });

  if (applyRateLimit(request, response, url.pathname)) {
    return;
  }

  //- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  // health
  //- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  if (url.pathname === "/health") {
    sendJson(response, 200, {
      status: "ok",
      timestamp: formatHealthTimestamp()
    });
    return;
  }

  //- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  // api/ups
  //- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  if (url.pathname === "/api/ups") {
    try {
      const data = await buildNutClient().fetchUpsVariables();
      sendJson(response, 200, {
        ups_name: settings.upsName,
        source: {
          host: settings.host,
          port: settings.port
        },
        data
      });
    } catch (error) {
      const message = error instanceof NutError ? error.message : "Unexpected error";
      logError("api.ups.error", error, {
        clientIp,
        path: url.pathname
      });
      sendJson(response, 502, { error: message });
    }
    return;
  }


  //- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  // api/ups/ (variable request)
  //- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  if (url.pathname.startsWith("/api/ups/")) {

    const variable = decodeURIComponent(url.pathname.replace("/api/ups/", ""));
    if (!variable) {
      sendJson(response, 400, { error: "UPS variable name is required" });
      return;
    }

    try {
      const data = await buildNutClient().fetchUpsVariables();
      if (!(variable in data)) {
        sendJson(response, 404, {
          error: `UPS variable '${variable}' was not returned by the NUT server.`
        });
        return;
      }

      sendJson(response, 200, {
        name: variable,
        value: data[variable]
      });
    } catch (error) {
      const message = error instanceof NutError ? error.message : "Unexpected error";
      logError("api.ups.variable.error", error, {
        clientIp,
        path: url.pathname,
        variable
      });
      sendJson(response, 502, { error: message });
    }
    return;
  }

  //- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  // widget/ups
  //- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  if (url.pathname === "/widget/ups") {

    const widgetSize = url.searchParams.get("size") === "compact" ? "compact" : "full";
    const widgetTheme = getWidgetTheme(url);
    sendHtml(response, 200, renderUpsWidget(settings.refreshIntervalSeconds, widgetSize, widgetTheme));
    return;
  }

  sendJson(response, 404, { error: "Not found" });
});

server.listen(settings.apiPort, settings.apiHost, () => {

  logInfo("Starting Synology NUT API", {
    apiHost: settings.apiHost,
    apiPort: settings.apiPort,
    nutHost: settings.host,
    nutPort: settings.port,
    upsName: settings.upsName,
    devMode: useDevClient
  });

});
