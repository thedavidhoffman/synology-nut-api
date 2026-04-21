//-----------------------------------------------------------------------------
// readEnv
//-----------------------------------------------------------------------------
function readEnv(name, fallback) {

  const value = process.env[name];
  return value && value.trim() ? value.trim() : fallback;
}

//-----------------------------------------------------------------------------
// readEnvAsNum
//-----------------------------------------------------------------------------
function readEnvAsNum(name, fallback) {

  const value = process.env[name];
  
  if (value) {
    value = value.trim();
  }

  if (!value) {
    if (typeof fallback !== "number" || Number.isNaN(fallback)) {
      throw new Error(`Fallback for ${name} must be a valid number.`);
    }
    return fallback;
  }

  const parsed = Number(value);
  
  if (Number.isNaN(parsed)) {
    throw new Error(`Environment variable ${name} must be a number.`);
  }

  return parsed;
}

//-----------------------------------------------------------------------------
// getSettings
//-----------------------------------------------------------------------------
export function getSettings() {

  const NUT_HOST = readEnv("NUT_HOST", "synology.local");
  const NUT_PORT = readEnvAsNum("NUT_PORT", 3493);
  const NUT_UPS_NAME = readEnv("NUT_UPS_NAME", "ups");
  const NUT_USERNAME = readEnv("NUT_USERNAME", null);
  const NUT_PASSWORD = readEnv("NUT_PASSWORD", null);
  const API_HOST = readEnv("API_HOST", "0.0.0.0");
  const API_PORT = readEnvAsNum("API_PORT", 8000);
  const NUT_TIMEOUT_SECONDS = readEnvAsNum("NUT_TIMEOUT_SECONDS", 5);
  const REFRESH_INTERVAL_SECONDS = readEnvAsNum("REFRESH_INTERVAL_SECONDS", 60);

  return {
    host: NUT_HOST,
    port: NUT_PORT,
    upsName: NUT_UPS_NAME,
    username: NUT_USERNAME,
    password: NUT_PASSWORD,
    apiHost: API_HOST,
    apiPort: API_PORT,
    timeoutSeconds: NUT_TIMEOUT_SECONDS,
    refreshIntervalSeconds: REFRESH_INTERVAL_SECONDS
  };
}
