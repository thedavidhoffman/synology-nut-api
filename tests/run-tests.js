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

    assert.match(html, /Synology NUT Monitor/);
    assert.match(html, /class="widget full"/);
    assert.match(compactHtml, /class="widget compact"/);
    assert.match(html, /fetch\("\/api\/ups"/);
    assert.match(html, /setInterval\(refreshWidget,\s*REFRESH_INTERVAL_SECONDS \* 1000\)/);
    assert.match(html, /const REFRESH_INTERVAL_SECONDS = 45/);
    assert.match(html, /Refreshes every 45 seconds/);
    assert.match(html, /prefers-color-scheme: dark/);
  }

  console.log("All tests passed.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
