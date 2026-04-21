//-----------------------------------------------------------------------------
// writeLog
//-----------------------------------------------------------------------------
function writeLog(level, event, details) {

  const payload = {
    timestamp: new Date().toISOString(),
    level,
    event,
    ...details
  };

  const serializedPayload = JSON.stringify(payload);

  if (level === "error") {
    console.error(serializedPayload);
    return;
  }

  console.log(serializedPayload);
}

//-----------------------------------------------------------------------------
// serializeError
//-----------------------------------------------------------------------------
function serializeError(error) {

  if (!(error instanceof Error)) {
    return {
      message: String(error)
    };
  }

  return {
    message: error.message,
    name: error.name,
    stack: error.stack
  };
}

//-----------------------------------------------------------------------------
// logInfo
//-----------------------------------------------------------------------------
export function logInfo(event, details = {}) {

  writeLog("info", event, details);
}

//-----------------------------------------------------------------------------
// logError
//-----------------------------------------------------------------------------
export function logError(event, error, details = {}) {

  writeLog("error", event, {
    ...details,
    error: serializeError(error)
  });
}
