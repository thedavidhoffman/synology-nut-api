import { logInfo } from "./logger.js";

//-----------------------------------------------------------------------------
// randomInt
//-----------------------------------------------------------------------------
function randomInt(min, max) {

  return Math.floor(Math.random() * (max - min + 1)) + min;
}

//-----------------------------------------------------------------------------
// randomDecimal
//-----------------------------------------------------------------------------
function randomDecimal(min, max, precision) {

  return (Math.random() * (max - min) + min).toFixed(precision);
}

export class NutClientMock {
  
  //-----------------------------------------------------------------------------
  // constructor
  //-----------------------------------------------------------------------------
  constructor({ upsName }) {

    this.upsName = upsName;
  }

  //-----------------------------------------------------------------------------
  // fetchUpsVariables
  //-----------------------------------------------------------------------------
  async fetchUpsVariables() {

    const batteryCharge = randomInt(0, 100);
    const batteryRuntime = randomInt(300, 7200);
    const batteryVoltage = randomDecimal(24.0, 27.6, 1);
    const upsLoad = randomInt(0, 100);
    const upsStatus = Math.random() >= 0.5 ? "OL" : "OB";

    logInfo("nut.mock.fetch", {
      upsName: this.upsName,
      variableCount: 14,
      batteryCharge,
      batteryRuntime,
      batteryVoltage,
      upsLoad,
      upsStatus
    });

    return {
      "battery.charge": String(batteryCharge),
      "battery.runtime": String(batteryRuntime),
      "battery.voltage": batteryVoltage,
      "device.mfr": "APC",
      "device.model": "Back-UPS Pro 1500",
      "input.voltage": "121.0",
      "output.voltage": "120.0",
      "ups.load": String(upsLoad),
      "ups.mfr": "APC",
      "ups.model": "Back-UPS Pro 1500",
      "ups.status": upsStatus,
      "ups.test.result": "No test initiated",
      "ups.timer.shutdown": "0",
      "ups.timer.start": "0"
    };
  }
}
