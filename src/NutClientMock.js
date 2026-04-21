import { logInfo } from "./logger.js";

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

    logInfo("nut.mock.fetch", {
      upsName: this.upsName,
      variableCount: 14
    });

    return {
      "battery.charge": "98",
      "battery.runtime": "4125",
      "battery.voltage": "27.1",
      "device.mfr": "APC",
      "device.model": "Back-UPS Pro 1500",
      "input.voltage": "121.0",
      "output.voltage": "120.0",
      "ups.load": "17",
      "ups.mfr": "APC",
      "ups.model": "Back-UPS Pro 1500",
      "ups.status": "OL",
      "ups.test.result": "No test initiated",
      "ups.timer.shutdown": "0",
      "ups.timer.start": "0"
    };
  }
}
