const smartApi = require("../config/smartapi");

async function getLTP({ exchange, symboltoken }) {
  return await smartApi.marketData({
    mode: "LTP",
    exchangeTokens: {
      [exchange]: [symboltoken],
    },
  });
}

async function getHistoricalData({ exchange, symboltoken, interval, fromdate, todate }) {
  try {
    return await smartApi.getCandleData({
      exchange,
      symboltoken,
      interval,
      fromdate,
      todate,
    });
  } catch (error) {
    console.error("SmartAPI getCandleData error:", error);
    throw error;
  }
}

module.exports = {
  getLTP,
  getHistoricalData,
};
