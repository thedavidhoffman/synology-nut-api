//-----------------------------------------------------------------------------
// escapeHtml
//-----------------------------------------------------------------------------
function escapeHtml(value) {

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

//-----------------------------------------------------------------------------
// renderUpsWidget
//-----------------------------------------------------------------------------
export function renderUpsWidget(refreshIntervalSeconds, widgetSize = "full") {

  const normalizedWidgetSize = widgetSize === "compact" ? "compact" : "full";

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>UPS Widget</title>
    <style>
      :root {
        color-scheme: light dark;
        --bg: radial-gradient(circle at top, #f7f2e8 0%, #efe4d2 38%, #d9c4a7 100%);
        --panel: rgba(255, 251, 245, 0.86);
        --ink: #2a2116;
        --muted: #6c5a43;
        --line: rgba(90, 63, 31, 0.15);
        --accent: #b55d2f;
        --accent-soft: rgba(181, 93, 47, 0.12);
        --online: #3c7a47;
        --battery: #c05621;
        --warning: #8a3b2e;
      }

      @media (prefers-color-scheme: dark) {
        :root {
          --bg: radial-gradient(circle at top, #203044 0%, #111b28 42%, #090f17 100%);
          --panel: rgba(9, 15, 23, 0.82);
          --ink: #edf4ff;
          --muted: #9fb2c9;
          --line: rgba(173, 203, 239, 0.14);
          --accent: #f2a65a;
          --accent-soft: rgba(242, 166, 90, 0.14);
          --online: #5fd08c;
          --battery: #ffb357;
          --warning: #ff8e72;
        }
      }

      * { box-sizing: border-box; }
      body {
        margin: 0;
        min-height: 100vh;
        font-family: "Segoe UI", "Trebuchet MS", sans-serif;
        background: var(--bg);
        color: var(--ink);
        display: grid;
        place-items: center;
        padding: 24px;
      }

      .widget {
        width: min(920px, 100%);
        background: var(--panel);
        backdrop-filter: blur(18px);
        border: 1px solid var(--line);
        border-radius: 28px;
        overflow: hidden;
        box-shadow: 0 28px 80px rgba(60, 35, 10, 0.18);
      }

      .widget.compact {
        width: min(420px, 100%);
        border-radius: 22px;
      }

      .hero {
        position: relative;
        padding: 38px 28px 20px;
        background:
          linear-gradient(135deg, rgba(255,255,255,0.7), rgba(255,255,255,0.18)),
          linear-gradient(120deg, #efe0c4, #f9f5ee 56%, #e7d4b2);
      }

      .widget.compact .hero {
        padding: 36px 20px 14px;
      }

      @media (prefers-color-scheme: dark) {
        .hero {
          background:
            linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02)),
            linear-gradient(120deg, #1a2940, #102132 58%, #0c1521);
        }
      }

      .eyebrow {
        text-transform: uppercase;
        letter-spacing: 0.16em;
        font-size: 11px;
        color: var(--muted);
        margin-bottom: 10px;
      }

      .headline {
        display: flex;
        gap: 16px;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
      }

      h1 {
        margin: 0;
        font-size: 24px;
        line-height: 1;
      }

      .subhead {
        margin-top: 10px;
        color: var(--muted);
        font-size: 15px;
      }

      .widget.compact .subhead {
        font-size: 13px;
      }

      .status-pill {
        position: absolute;
        top: 14px;
        right: 16px;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        border-radius: 999px;
        padding: 8px 12px;
        font-size: 13px;
        font-weight: 700;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        background: var(--accent-soft);
        color: var(--accent);
      }

      .status-pill.online { background: rgba(60, 122, 71, 0.16); color: var(--online); }
      .status-pill.battery { background: rgba(138, 59, 46, 0.16); color: var(--warning); }
      .status-pill.warning { background: rgba(138, 59, 46, 0.12); color: var(--warning); }
      .status-pill.unknown { background: rgba(108, 90, 67, 0.12); color: var(--muted); }

      .content {
        display: grid;
        grid-template-columns: 1.1fr 0.9fr;
        gap: 22px;
        padding: 24px 28px 28px;
      }

      .widget.compact .content {
        display: block;
        padding: 18px 20px 20px;
      }

      .stats {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 14px;
      }

      .widget.compact .stats {
        gap: 10px;
      }

      .stat-card, .details {
        border: 1px solid var(--line);
        border-radius: 22px;
        background: rgba(255, 255, 255, 0.62);
      }

      @media (prefers-color-scheme: dark) {
        .stat-card, .details {
          background: rgba(14, 24, 36, 0.82);
        }
      }

      .stat-card {
        padding: 18px;
      }

      .widget.compact .stat-card {
        padding: 14px;
      }

      .stat-label {
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--muted);
      }

      .stat-value {
        margin-top: 8px;
        font-size: 28px;
        font-weight: 700;
      }

      .widget.compact .stat-value {
        font-size: 21px;
      }

      .meta {
        margin-top: 18px;
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
      }

      .widget.compact .meta {
        margin-top: 12px;
      }

      .meta-chip {
        padding: 10px 12px;
        border-radius: 14px;
        background: rgba(255,255,255,0.7);
        border: 1px solid var(--line);
        font-size: 13px;
        color: var(--muted);
      }

      @media (prefers-color-scheme: dark) {
        .meta-chip {
          background: rgba(20, 31, 46, 0.78);
        }
      }

      .meta-chip.live {
        background: rgba(181, 93, 47, 0.1);
        color: var(--accent);
      }

      .details {
        padding: 18px;
      }

      .widget.compact .details {
        display: none;
      }

      .details h2 {
        margin: 0 0 14px;
        font-size: 18px;
      }

      .detail-grid {
        display: grid;
        gap: 10px;
        max-height: 340px;
        overflow: auto;
        padding-right: 4px;
      }

      .detail-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 14px;
        padding: 10px 12px;
        border-radius: 14px;
        background: rgba(255,255,255,0.72);
      }

      @media (prefers-color-scheme: dark) {
        .detail-row {
          background: rgba(18, 29, 43, 0.86);
        }
      }

      .detail-key {
        color: var(--muted);
        font-size: 13px;
      }

      .detail-value {
        font-weight: 600;
        text-align: right;
      }

      .loading {
        display: grid;
        gap: 10px;
      }

      .loading-bar {
        height: 18px;
        border-radius: 999px;
        background: linear-gradient(90deg, rgba(181, 93, 47, 0.08), rgba(181, 93, 47, 0.24), rgba(181, 93, 47, 0.08));
        background-size: 200% 100%;
        animation: shimmer 1.6s linear infinite;
      }

      .loading-bar.small {
        width: 52%;
      }

      @keyframes shimmer {
        from { background-position: 200% 0; }
        to { background-position: -200% 0; }
      }

      @media (max-width: 760px) {
        .content {
          grid-template-columns: 1fr;
        }

        .stats {
          grid-template-columns: 1fr 1fr;
        }
      }

      @media (max-width: 520px) {
        body { padding: 12px; }
        .hero, .content { padding-left: 18px; padding-right: 18px; }
        .stats { grid-template-columns: 1fr; }
      }
    </style>
  </head>
  <body>
    <main class="widget ${escapeHtml(normalizedWidgetSize)}">
      <section class="hero">
        <div class="eyebrow">Synology NUT Monitor</div>
        <div class="headline">
          <div>
            <h1 id="ups-title">Loading UPS data</h1>
            <div class="subhead" id="ups-subhead">Connecting to the API and requesting current telemetry.</div>
          </div>
          <div class="status-pill unknown" id="ups-status">Loading</div>
        </div>
      </section>
      <section class="content">
        <div>
          <div class="stats" id="ups-stats">
            <article class="stat-card">
              <div class="stat-label">Battery</div>
              <div class="stat-value">--</div>
            </article>
            <article class="stat-card">
              <div class="stat-label">Runtime</div>
              <div class="stat-value">--</div>
            </article>
            <article class="stat-card">
              <div class="stat-label">Load</div>
              <div class="stat-value">--</div>
            </article>
            <article class="stat-card">
              <div class="stat-label">Input</div>
              <div class="stat-value">--</div>
            </article>
          </div>
          <div class="meta" id="ups-meta">
            <div class="meta-chip">UPS Name: --</div>
            <div class="meta-chip">Manufacturer: --</div>
            <div class="meta-chip">Model: --</div>
            <div class="meta-chip live" id="ups-refresh">Refreshes every ${escapeHtml(refreshIntervalSeconds)} seconds</div>
          </div>
        </div>
        <aside class="details">
          <h2>Telemetry</h2>
          <div class="detail-grid" id="ups-details">
            <div class="loading">
              <div class="loading-bar"></div>
              <div class="loading-bar small"></div>
              <div class="loading-bar"></div>
            </div>
          </div>
        </aside>
      </section>
    </main>
    <script>
      const REFRESH_INTERVAL_SECONDS = ${JSON.stringify(refreshIntervalSeconds)};

      function escapeHtml(value) {
        return String(value)
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#39;");
      }

      function pickValue(data, keys) {
        for (const key of keys) {
          if (data[key]) {
            return data[key];
          }
        }
        return null;
      }

      function formatLabel(key) {
        return key
          .split(".")
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join(" ");
      }

      function statusTone(status) {
        if (!status) return "unknown";
        if (status.includes("OL")) return "online";
        if (status.includes("OB")) return "battery";
        return "warning";
      }

      function statusLabel(status) {
        if (!status) return "Unknown";
        if (status.includes("OL")) return "🟢 ONLINE";
        if (status.includes("OB")) return "🔴 BATTERY";
        return status;
      }

      function renderStats(data) {
        const stats = [
          { label: "Battery", value: pickValue(data, ["battery.charge"]) ? pickValue(data, ["battery.charge"]) + "%" : "Unavailable" },
          { label: "Runtime", value: pickValue(data, ["battery.runtime"]) ? pickValue(data, ["battery.runtime"]) + " sec" : "Unavailable" },
          { label: "Load", value: pickValue(data, ["ups.load"]) ? pickValue(data, ["ups.load"]) + "%" : "Unavailable" },
          { label: "Input", value: pickValue(data, ["input.voltage"]) ? pickValue(data, ["input.voltage"]) + " V" : "Unavailable" }
        ];

        return stats.map((stat) => \`
          <article class="stat-card">
            <div class="stat-label">\${escapeHtml(stat.label)}</div>
            <div class="stat-value">\${escapeHtml(stat.value)}</div>
          </article>
        \`).join("");
      }

      function renderDetails(data) {
        return Object.entries(data)
          .sort(([left], [right]) => left.localeCompare(right))
          .map(([key, value]) => \`
            <div class="detail-row">
              <span class="detail-key">\${escapeHtml(formatLabel(key))}</span>
              <span class="detail-value">\${escapeHtml(value)}</span>
            </div>
          \`)
          .join("");
      }

      function updateWidget(payload) {
        const data = payload.data || {};
        const manufacturer = pickValue(data, ["device.mfr", "ups.mfr"]);
        const model = pickValue(data, ["device.model", "ups.model"]);
        const status = pickValue(data, ["ups.status"]);
        const outputVoltage = pickValue(data, ["output.voltage"]);

        document.getElementById("ups-title").textContent = model || payload.ups_name || "UPS";

        const subheadParts = [
          manufacturer || "Unknown manufacturer",
          outputVoltage ? "Output " + outputVoltage + " V" : null,
          payload.source?.host ? "Source " + payload.source.host + ":" + payload.source.port : null
        ].filter(Boolean);
        document.getElementById("ups-subhead").textContent = subheadParts.join(" | ");

        const statusEl = document.getElementById("ups-status");
        statusEl.textContent = statusLabel(status);
        statusEl.className = "status-pill " + statusTone(status);

        document.getElementById("ups-stats").innerHTML = renderStats(data);
        document.getElementById("ups-meta").innerHTML = \`
          <div class="meta-chip">UPS Name: \${escapeHtml(payload.ups_name || "--")}</div>
          <div class="meta-chip">Manufacturer: \${escapeHtml(manufacturer || "Unavailable")}</div>
          <div class="meta-chip">Model: \${escapeHtml(model || "Unavailable")}</div>
          <div class="meta-chip live" id="ups-refresh">Updated \${new Date().toLocaleTimeString()} | Every \${REFRESH_INTERVAL_SECONDS}s</div>
        \`;
        document.getElementById("ups-details").innerHTML = renderDetails(data);
      }

      function showError(message) {
        document.getElementById("ups-title").textContent = "UPS data unavailable";
        document.getElementById("ups-subhead").textContent = message;
        const statusEl = document.getElementById("ups-status");
        statusEl.textContent = "Unavailable";
        statusEl.className = "status-pill warning";
        document.getElementById("ups-details").innerHTML = \`
          <div class="detail-row">
            <span class="detail-key">Error</span>
            <span class="detail-value">\${escapeHtml(message)}</span>
          </div>
        \`;
      }

      async function refreshWidget() {
        try {
          const response = await fetch("/api/ups", { cache: "no-store" });
          const payload = await response.json();
          if (!response.ok) {
            throw new Error(payload.error || "Failed to load UPS data.");
          }
          updateWidget(payload);
        } catch (error) {
          showError(error.message || "Failed to load UPS data.");
        }
      }

      refreshWidget();
      setInterval(refreshWidget, REFRESH_INTERVAL_SECONDS * 1000);
    </script>
  </body>
</html>`;
}
