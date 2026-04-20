function readOptional(name) {
  const value = process.env[name];
  return value && value.trim() ? value : null;
}

function readNumber(name, fallback) {
  const value = process.env[name];
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    throw new Error(`Environment variable ${name} must be a number.`);
  }
  return parsed;
}

export function getSettings() {
  return {
    host: process.env.NUT_HOST || "synology.local",
    port: readNumber("NUT_PORT", 3493),
    upsName: process.env.NUT_UPS_NAME || "ups",
    username: readOptional("NUT_USERNAME"),
    password: readOptional("NUT_PASSWORD"),
    apiHost: process.env.API_HOST || "0.0.0.0",
    apiPort: readNumber("API_PORT", 8000),
    timeoutMs: readNumber("NUT_TIMEOUT_SECONDS", 5) * 1000,
    refreshIntervalMs: readNumber("REFRESH_INTERVAL_MS", 60000)
  };
}
