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
  const trimmedValue = value ? value.trim() : value;

  if (!trimmedValue) {
    if (typeof fallback !== "number" || Number.isNaN(fallback)) {
      throw new Error(`Fallback for ${name} must be a valid number.`);
    }
    return fallback;
  }

  const parsed = Number(trimmedValue);
  
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
  const RATE_LIMIT_HEALTH = readEnvAsNum("RATE_LIMIT_HEALTH", 60);
  const RATE_LIMIT_API = readEnvAsNum("RATE_LIMIT_API", 12);
  const RATE_LIMIT_WIDGET = readEnvAsNum("RATE_LIMIT_WIDGET", 30);

  return {
    host: NUT_HOST,
    port: NUT_PORT,
    upsName: NUT_UPS_NAME,
    username: NUT_USERNAME,
    password: NUT_PASSWORD,
    apiHost: API_HOST,
    apiPort: API_PORT,
    rateLimitHealth: RATE_LIMIT_HEALTH,
    rateLimitApi: RATE_LIMIT_API,
    rateLimitWidget: RATE_LIMIT_WIDGET,
    timeoutSeconds: NUT_TIMEOUT_SECONDS,
    refreshIntervalSeconds: REFRESH_INTERVAL_SECONDS
  };
}
