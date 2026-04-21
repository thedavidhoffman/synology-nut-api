import http from "node:http";
import { getSettings } from "./config.js";
import { NutClientMock } from "./NutClientMock.js";
import { NutClient, NutError } from "./nutClient.js";
import { renderUpsWidget } from "./widget.js";

const settings = getSettings();
const useDevClient = process.argv.includes("dev");

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
// http server
//-----------------------------------------------------------------------------
const server = http.createServer(async (request, response) => {

  if (!request.url || request.method !== "GET") {
    sendJson(response, 404, { error: "Not found" });
    return;
  }

  const url = new URL(request.url, `http://${request.headers.host || "localhost"}`);

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
      sendJson(response, 502, { error: message });
    }
    return;
  }

  //- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  // widget/ups
  //- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  if (url.pathname === "/widget/ups") {

    sendHtml(response, 200, renderUpsWidget(settings.refreshIntervalSeconds));
    return;
  }

  sendJson(response, 404, { error: "Not found" });
});

server.listen(settings.apiPort, settings.apiHost, () => {

  console.log(
    `Starting Synology NUT API on ${settings.apiHost}:${settings.apiPort} ` +
      `for UPS '${settings.upsName}' via ${settings.host}:${settings.port}`
  );
});
