const fs = require("fs");
const path = require("path");

const INSTRUMENT_PATH = path.join(__dirname, "../data/instruments.json");

let instruments = [];
let loaded = false;

function loadInstruments() {
  if (loaded) return;
  instruments = JSON.parse(fs.readFileSync(INSTRUMENT_PATH, "utf-8"));
  loaded = true;
}

// Helper: sort expiry dates
function sortExpiry(a, b) {
  return new Date(a) - new Date(b);
}

function getOptionChain({ symbol, exchange, expiry }) {
  loadInstruments();

  // Filter only options for this underlying
  const options = instruments.filter(
    (inst) =>
      inst.exch_seg === exchange &&
      (inst.instrumenttype === "OPTIDX" ||
        inst.instrumenttype === "OPTSTK") &&
      inst.name === symbol
  );

  if (options.length === 0) {
    return null;
  }

  // Determine expiry
  const expiries = [
    ...new Set(options.map((o) => o.expiry).filter(Boolean)),
  ].sort(sortExpiry);

  const selectedExpiry = expiry || expiries[0];

  // Filter by expiry
  const expiryOptions = options.filter(
    (o) => o.expiry === selectedExpiry
  );

  // Group by strike
  const chainMap = {};

  for (const opt of expiryOptions) {
    const strike = Number(opt.strike);

    if (!chainMap[strike]) {
      chainMap[strike] = {
        strike,
        CE: null,
        PE: null,
      };
    }

    if (opt.symbol.endsWith("CE")) {
      chainMap[strike].CE = opt;
    } else if (opt.symbol.endsWith("PE")) {
      chainMap[strike].PE = opt;
    }
  }

  // Convert to sorted array
  const chain = Object.values(chainMap).sort(
    (a, b) => a.strike - b.strike
  );

  return {
    underlying: symbol,
    expiry: selectedExpiry,
    chain,
  };
}

module.exports = {
  getOptionChain,
};
