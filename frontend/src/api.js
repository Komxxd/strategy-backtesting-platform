import { io } from "socket.io-client";

const API_BASE = "http://localhost:5001/api";

let socket = null;

export function initSocket() {
  if (!socket) {
    socket = io("http://localhost:5001");
  }
  return socket;
}

export async function loginBackend() {
  const res = await fetch("http://localhost:5001/api/auth/login", {
    method: "POST",
  });
  return res.json();
}


export async function searchInstruments({ query, exchange, type }) {
  const params = new URLSearchParams();

  if (query) params.append("q", query);
  if (exchange) params.append("exchange", exchange);
  if (type) params.append("type", type);

  const res = await fetch(
    `http://localhost:5001/api/instruments/search?${params.toString()}`
  );

  return res.json();
}


export async function getLTP(payload) {
  const res = await fetch(`${API_BASE}/market/ltp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function getOptionChain({ symbol, exchange, expiry }) {
  const params = new URLSearchParams({ symbol, exchange });
  if (expiry) params.append("expiry", expiry);

  const res = await fetch(
    `http://localhost:5001/api/options/chain?${params.toString()}`
  );
  return res.json();
}

export async function subscribeToTokens({ exchangeType, tokens }) {
  const res = await fetch(`${API_BASE}/market-socket/subscribe`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ exchangeType, tokens }),
  });
  return res.json();
}

export async function fetchCandles({ exchange, symboltoken, interval, fromdate, todate }) {
  const res = await fetch(`${API_BASE}/market/candles`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ exchange, symboltoken, interval, fromdate, todate }),
  });
  return res.json();
}
