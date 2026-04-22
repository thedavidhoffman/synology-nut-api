import assert from "node:assert/strict";

import { NutClient, NutError, NutProtocolError, parseVarLine } from "../src/NutClient.js";
import { renderUpsWidget } from "../src/widget.js";

async function main() {
  {
    const parsed = parseVarLine('VAR ups battery.charge "100"', "ups");
    assert.deepEqual(parsed, { key: "battery.charge", value: "100" });
  }

  {
    assert.throws(
      () => parseVarLine('VAR other battery.charge "100"', "ups"),
      NutProtocolError
    );
  }

  {
    const client = new NutClient({
      host: "localhost",
      port: 3493,
      upsName: "ups",
      username: "user"
    });

    await assert.rejects(() => client.fetchUpsVariables(), NutError);
  }

  {
    const html = renderUpsWidget(45);
    const compactHtml = renderUpsWidget(45, "compact");
    const blueHtml = renderUpsWidget(45, "full", "blue");
    const homarrHtml = renderUpsWidget(45, "full", "homarr");
    const whiteHtml = renderUpsWidget(45, "full", "white");

    assert.match(html, /Synology NUT Monitor/);
    assert.match(html, /<body class="theme-blue">/);
    assert.match(html, /class="widget full"/);
    assert.match(blueHtml, /<body class="theme-blue">/);
    assert.match(blueHtml, /body\.theme-blue \.hero/);
    assert.match(homarrHtml, /<body class="theme-homarr">/);
    assert.match(homarrHtml, /body\.theme-homarr \.hero/);
    assert.match(whiteHtml, /<body class="theme-white">/);
    assert.match(whiteHtml, /body\.theme-white \.hero/);
    assert.match(compactHtml, /class="widget compact"/);
    assert.match(html, /fetch\("\/api\/ups"/);
    assert.match(html, /setInterval\(refreshWidget,\s*REFRESH_INTERVAL_SECONDS \* 1000\)/);
    assert.match(html, /const REFRESH_INTERVAL_SECONDS = 45/);
    assert.match(html, /Refreshes every 45 seconds/);
  }

  console.log("All tests passed.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
