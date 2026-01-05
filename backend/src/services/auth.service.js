const smartApi = require("../config/smartapi");
const speakeasy = require("speakeasy");
const marketSocketService = require("./marketSocket.service");

let sessionData = null;

async function login() {
    const totp = speakeasy.totp({
    secret: process.env.SMARTAPI_TOTP_SECRET,
    encoding: 'base32'
  });

  sessionData = await smartApi.generateSession(
    process.env.SMARTAPI_CLIENT_ID,
    process.env.SMARTAPI_PASSWORD,
    totp
  );

  console.log("LOGIN RESPONSE:", JSON.stringify(sessionData, null, 2));


    smartApi.setAccessToken(sessionData.data.jwtToken);

    //console.log("SmartAPI instance keys:", Object.keys(smartApi));

    marketSocketService.initMarketSocket({
      jwtToken: sessionData.data.jwtToken,
      feedToken: sessionData.data.feedToken,
    });

    return sessionData;
}

function getSession() {
  return sessionData;
}

module.exports = {
  login,
  getSession,
};
