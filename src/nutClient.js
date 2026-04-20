import net from "node:net";

export class NutError extends Error {}

export class NutProtocolError extends NutError {}

export class NutClient {
  constructor({
    host,
    port,
    upsName,
    timeoutMs = 5000,
    username = null,
    password = null
  }) {
    this.host = host;
    this.port = port;
    this.upsName = upsName;
    this.timeoutMs = timeoutMs;
    this.username = username;
    this.password = password;
  }

  async fetchUpsVariables() {
    if ((this.username && !this.password) || (!this.username && this.password)) {
      throw new NutError("Both NUT_USERNAME and NUT_PASSWORD must be set together.");
    }

    const connection = await this.#connect();

    try {
      if (this.username && this.password) {
        const usernameResponse = await connection.sendCommand(`USERNAME ${this.username}`);
        this.#expectOk(usernameResponse, "username");

        const passwordResponse = await connection.sendCommand(`PASSWORD ${this.password}`);
        this.#expectOk(passwordResponse, "password");
      }

      const lines = await connection.sendCommand(`LIST VAR ${this.upsName}`, {
        expectMultiline: true,
        endLine: `END LIST VAR ${this.upsName}`
      });

      return this.#parseVarLines(lines);
    } finally {
      connection.close();
    }
  }

  #expectOk(response, label) {
    if (response !== "OK") {
      throw new NutProtocolError(`Authentication failed during ${label} step: ${response}`);
    }
  }

  #parseVarLines(lines) {
    const expectedStart = `BEGIN LIST VAR ${this.upsName}`;
    if (lines[0] !== expectedStart) {
      throw new NutProtocolError(
        `Unexpected response from NUT server. Expected '${expectedStart}', got '${lines[0]}'.`
      );
    }

    const values = {};

    for (const line of lines.slice(1, -1)) {
      const parsed = parseVarLine(line, this.upsName);
      values[parsed.key] = parsed.value;
    }

    return values;
  }

  async #connect() {
    const socket = net.createConnection({
      host: this.host,
      port: this.port
    });

    socket.setEncoding("utf8");
    socket.setTimeout(this.timeoutMs);

    await new Promise((resolve, reject) => {
      const onConnect = () => {
        cleanup();
        resolve();
      };
      const onError = (error) => {
        cleanup();
        reject(new NutError(`Unable to connect to NUT server: ${error.message}`));
      };
      const onTimeout = () => {
        cleanup();
        socket.destroy();
        reject(new NutError("Timed out while connecting to the NUT server."));
      };
      const cleanup = () => {
        socket.off("connect", onConnect);
        socket.off("error", onError);
        socket.off("timeout", onTimeout);
      };

      socket.on("connect", onConnect);
      socket.on("error", onError);
      socket.on("timeout", onTimeout);
    });

    let buffer = "";
    const waiters = [];

    socket.on("data", (chunk) => {
      buffer += chunk;
      drainBuffer();
    });

    socket.on("close", () => {
      while (waiters.length > 0) {
        const waiter = waiters.shift();
        waiter.reject(new NutProtocolError("Connection closed before the NUT response completed."));
      }
    });

    socket.on("error", (error) => {
      while (waiters.length > 0) {
        const waiter = waiters.shift();
        waiter.reject(new NutError(`NUT socket error: ${error.message}`));
      }
    });

    socket.on("timeout", () => {
      socket.destroy();
      while (waiters.length > 0) {
        const waiter = waiters.shift();
        waiter.reject(new NutError("Timed out while waiting for the NUT server response."));
      }
    });

    function drainBuffer() {
      while (waiters.length > 0) {
        const next = waiters[0];
        const lines = extractCompleteResponse();
        if (!lines) {
          return;
        }

        waiters.shift();
        next.resolve(lines);
      }
    }

    function extractCompleteResponse() {
      const lineBreaks = buffer.split("\n");
      if (!buffer.includes("\n")) {
        return null;
      }

      const completeLines = lineBreaks.slice(0, -1).map((line) => line.replace(/\r$/, ""));
      const remainder = lineBreaks.at(-1);

      if (!waiters[0].expectMultiline) {
        if (completeLines.length === 0) {
          return null;
        }
        const [firstLine, ...rest] = completeLines;
        buffer = [...rest, remainder].join("\n");
        return firstLine;
      }

      const endIndex = completeLines.findIndex((line) => line === waiters[0].endLine);
      if (endIndex === -1) {
        return null;
      }

      const responseLines = completeLines.slice(0, endIndex + 1);
      const remainingLines = completeLines.slice(endIndex + 1);
      buffer = [...remainingLines, remainder].join("\n");
      return responseLines;
    }

    return {
      close() {
        socket.end();
      },
      sendCommand(command, options = {}) {
        return new Promise((resolve, reject) => {
          waiters.push({
            resolve,
            reject,
            expectMultiline: Boolean(options.expectMultiline),
            endLine: options.endLine || null
          });
          socket.write(`${command}\n`);
          drainBuffer();
        });
      }
    };
  }
}

export function parseVarLine(line, expectedUpsName) {
  const match = line.match(/^VAR\s+(\S+)\s+(\S+)\s+"((?:[^"\\]|\\.)*)"$/);
  if (!match) {
    throw new NutProtocolError(`Unexpected NUT response line: ${line}`);
  }

  const [, upsName, key, rawValue] = match;
  if (upsName !== expectedUpsName) {
    throw new NutProtocolError(`Unexpected NUT response line: ${line}`);
  }

  return {
    key,
    value: rawValue.replace(/\\(.)/g, "$1")
  };
}
