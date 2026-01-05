const { WebSocketV2 } = require("smartapi-javascript");

let socket = null;
let isConnected = false;

function initMarketSocket({ jwtToken , feedToken}) {
  if (socket) return socket;

  if (!jwtToken || !feedToken) {
    throw new Error("jwtToken and feedToken are required to init market socket");
  }

  socket = new WebSocketV2({
    jwttoken: jwtToken,
    feedtype: feedToken,
    apikey: process.env.SMARTAPI_API_KEY,
    clientcode: process.env.SMARTAPI_CLIENT_ID,
  });

  socket.connect().then(() => {
    isConnected = true;
    console.log("Market WebSocket connected");
  });

  socket.on("tick", (data) => {
    console.log("Tick:", data);
  });

  return socket;
}

function subscribeTokens({ exchangeType, tokens }) {
  if (!socket || !isConnected) {
    throw new Error("Socket not connected");
  }

  const request = {
    correlationID: "live_price",
    action: 1,        // subscribe
    mode: 1,          // LTP
    exchangeType,
    tokens,
  };

  socket.fetchData(request);
}

module.exports = {
  initMarketSocket,
  subscribeTokens
};
