import { useState } from "react";
import { loginBackend, searchInstruments, getLTP } from "./api";
import OptionChain from "./OptionChain";

function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(null);
  const [searchType, setSearchType] = useState("EQUITY");
  const [ltp, setLtp] = useState(null);
  const [showOptionChain, setShowOptionChain] = useState(false);

  function normalizeUnderlying(inst) {
  if (inst.name === "NIFTY") return "NIFTY";
  if (inst.name === "NIFTY BANK") return "BANKNIFTY";
  if (inst.name === "Nifty Bank") return "BANKNIFTY";

  return inst.name;
}


  async function handleLogin() {
  const res = await loginBackend();
  console.log("LOGIN RESPONSE:", res);

  if (res.success) {
    setLoggedIn(true);
    alert("Backend logged in successfully");
  } else {
    alert("Login failed");
  }
}

  async function handleSearch() {
  const exchange =
    searchType === "OPTIONS" || searchType === "FUTURES"
      ? "NFO"
      : "NSE";

  const res = await searchInstruments({
    query,
    exchange,
    type: searchType,
  });

  setResults(res.data || []);
}

  async function handleSelect(inst) {
    
    setSelected(inst);
    console.log("SELECTED INSTRUMENT:", inst);
    const res = await getLTP({
      exchange: inst.exch_seg,
      tradingsymbol: inst.symbol,
      symboltoken: inst.token,
    });

    console.log("LTP RESPONSE FROM BACKEND:", res);

    const fetched = res.data.data.fetched;

    if (fetched && fetched.length > 0) {
      const row = fetched[0];
       console.log("FETCHED OBJECT:", row);

       if(typeof row.ltp === 'number') {
         setLtp(row.ltp);
       }else{
        console.error("unexpected LTP format", row);
       }
}
  }

  

  return (
    <div style={{ padding: 20 }}>
      <h1>Stock Viewer</h1>
      <button onClick={handleLogin}>
        Login Backend
      </button>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search stock"
      />
      <select
  value={searchType}
  onChange={(e) => setSearchType(e.target.value)}
>
  <option value="EQUITY">Stocks</option>
  <option value="INDEX">Index</option>
</select>

      <button onClick={handleSearch}>Search</button>

      <ul>
        {results.map((r) => (
          <li key={r.token} onClick={() => handleSelect(r)}>
            {r.symbol}
          </li>
        ))}
      </ul>

      {selected && ltp != null && (
        <div>
          <h3>{selected.symbol}</h3>
          <p>LTP: ₹{ltp}</p>
        </div>
      )}
      {selected && (
        <button onClick={() => setShowOptionChain(!showOptionChain)}>
          View Option Chain
        </button>
      )}
      {showOptionChain && (
        <OptionChain symbol={normalizeUnderlying(selected)} />
      )}
    </div>
  );
}

export default App;
