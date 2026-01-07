const API_BASE = "http://localhost:5000/api";

export async function loginBackend() {
  const res = await fetch("http://localhost:5000/api/auth/login", {
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
    `http://localhost:5000/api/instruments/search?${params.toString()}`
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
    `http://localhost:5000/api/options/chain?${params.toString()}`
  );
  return res.json();
}

