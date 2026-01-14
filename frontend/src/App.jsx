import { useState, useEffect, useRef } from "react";
import { loginBackend, searchInstruments, getLTP, initSocket, subscribeToTokens } from "./api";
import OptionChain from "./OptionChain";
import { Chart } from "./Chart";

function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [watchlist, setWatchlist] = useState([]);
  const [livePrices, setLivePrices] = useState({});

  const [selected, setSelected] = useState(null);
  const [searchType, setSearchType] = useState("EQUITY");
  const [ltp, setLtp] = useState(null);

  // View State: 'quote', 'chart', 'optionChain'
  const [activeView, setActiveView] = useState("chart");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const socketRef = useRef(null);

  // ... (useEffect for socket, handleLogin, etc. - keep existing) ...
  // Re-pasting the socket effect and handlers to ensure context isn't lost if I replace the top part, 
  // but simpler to just replace the rendering part or use a smaller diff if possible.
  // Since I need to import Chart at the top, I will assume the previous imports are handled if I replace lines.
  // Actually, I will replace the component rendering mainly.

  useEffect(() => {
    if (loggedIn) {
      const socket = initSocket();
      socketRef.current = socket;

      socket.on("connect", () => {
        console.log("Socket connected");
      });

      socket.on("tick", (data) => {
        const token = data.token?.replace(/"/g, '');
        const rawPrice = Number(data.last_traded_price || data.ltp);

        if (token && !isNaN(rawPrice)) {
          const price = rawPrice / 100;
          setLivePrices(prev => ({
            ...prev,
            [token]: price
          }));
          if (selected && selected.token === token) {
            setLtp(price);
          }
        }
      });

      return () => {
        socket.off("tick");
        socket.off("connect");
      };
    }
  }, [loggedIn, selected]);

  function normalizeUnderlying(inst) {
    if (inst.name === "NIFTY") return "NIFTY";
    if (inst.name === "NIFTY BANK") return "BANKNIFTY";
    if (inst.name === "Nifty Bank") return "BANKNIFTY";
    return inst.name;
  }

  async function handleLogin() {
    setLoading(true);
    setError(null);
    try {
      const res = await loginBackend();
      if (res.success) {
        setLoggedIn(true);
        setError(null);
      } else {
        setError("Login failed. Please check your credentials.");
      }
    } catch (err) {
      setError("Login error: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSearch() {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const exchange = searchType === "OPTIONS" || searchType === "FUTURES" ? "NFO" : "NSE";
      const res = await searchInstruments({ query, exchange, type: searchType });
      setResults(res.data || []);
      if ((res.data || []).length === 0) setError("No instruments found");
    } catch (err) {
      setError("Search error: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function addToWatchlist(inst) {
    if (watchlist.find(w => w.token === inst.token)) return;
    const newWatchlist = [...watchlist, inst];
    setWatchlist(newWatchlist);

    if (loggedIn) {
      try {
        let exchCode = 1;
        if (inst.exch_seg === "NSE") exchCode = 1;
        else if (inst.exch_seg === "NFO") exchCode = 2;
        else if (inst.exch_seg === "BSE") exchCode = 3;

        await subscribeToTokens({
          exchangeType: exchCode,
          tokens: [inst.token]
        });
      } catch (err) {
        console.error("Failed to subscribe", err);
      }
    }

    try {
      const res = await getLTP({
        exchange: inst.exch_seg,
        tradingsymbol: inst.symbol,
        symboltoken: inst.token,
      });
      const fetched = res.data?.data?.fetched;
      if (fetched && fetched.length > 0 && typeof fetched[0].ltp === "number") {
        const price = fetched[0].ltp / 100;
        setLivePrices(prev => ({ ...prev, [inst.token]: price }));
      }
    } catch (err) {/* ignore */ }
  }

  function removeFromWatchlist(token) {
    setWatchlist(prev => prev.filter(i => i.token !== token));
  }

  return (
    <div className="max-w-[1600px] mx-auto p-6 min-h-screen text-zinc-100 font-sans">
      <header className="flex justify-between items-center mb-10 border-b border-zinc-800 pb-6">
        <div className="flex items-center gap-4">
          <div className={`w-3 h-3 rounded-full ${loggedIn ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]'}`}></div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            AlgoTerminal<span className="text-blue-500 text-3xl">.</span>
          </h1>
        </div>
        <div className="flex items-center gap-4">
          {loggedIn && (
            <span className="flex items-center px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-semibold uppercase tracking-wider backdrop-blur-sm">
              ● System Online
            </span>
          )}
          <button
            onClick={handleLogin}
            disabled={loading || loggedIn}
            className={`px-5 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 ${loggedIn
              ? 'bg-emerald-600 text-white cursor-default shadow-lg shadow-emerald-900/20'
              : 'bg-blue-600 hover:bg-blue-500 text-white hover:shadow-lg hover:shadow-blue-900/20 active:translate-y-px'
              }`}
          >
            {loggedIn ? "Connected" : "Connect Broker"}
          </button>
        </div>
      </header>

      {error && (
        <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3">
          <span className="text-red-500 text-lg">⚠</span>
          <span className="text-red-400 text-sm font-medium">{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-8 transition-all duration-300 ease-in-out">
        {/* Left Column */}
        <div className="flex flex-col gap-6">

          {/* Watchlist Section */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 shadow-xl backdrop-blur-sm flex flex-col h-[400px]">
            <h3 className="mb-4 text-lg font-semibold text-zinc-100 flex justify-between items-center">
              <span>Market Watch</span>
              <span className="text-xs bg-zinc-800 px-2 py-1 rounded text-zinc-400">{watchlist.length}</span>
            </h3>
            <div className="overflow-y-auto flex-1 pr-2 space-y-2 custom-scrollbar">
              {watchlist.length === 0 ? (
                <div className="text-zinc-500 text-sm text-center mt-10 italic">Your watchlist is empty.<br />Add symbols from search below.</div>
              ) : (
                watchlist.map(item => {
                  const price = livePrices[item.token];
                  return (
                    <div
                      key={item.token}
                      className={`flex justify-between items-center p-3 rounded-lg border cursor-pointer transition-all ${selected?.token === item.token ? 'bg-zinc-800 border-zinc-600' : 'bg-zinc-950/30 border-zinc-800/50 hover:bg-zinc-800/50'}`}
                      onClick={() => { setSelected(item); setLtp(price || null); }}
                    >
                      <div>
                        <div className="font-semibold text-zinc-200 text-sm">{item.symbol}</div>
                        <div className="text-[10px] text-zinc-500 uppercase">{item.exch_seg}</div>
                      </div>
                      <div className="text-right">
                        <div className={`font-mono font-medium ${price ? 'text-emerald-400' : 'text-zinc-600'}`}>
                          {price ? `₹${price.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "---.--"}
                        </div>
                        <button
                          className="text-[10px] text-red-500/50 hover:text-red-500 mt-1"
                          onClick={(e) => { e.stopPropagation(); removeFromWatchlist(item.token); }}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Search Section */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 shadow-xl backdrop-blur-sm">
            <h3 className="mb-4 text-base font-semibold text-zinc-300">Add Instrument</h3>
            <div className="flex gap-2 mb-4">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Search..."
                className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:border-blue-500 outline-none"
                disabled={loading}
              />
              <select
                value={searchType}
                onChange={(e) => setSearchType(e.target.value)}
                disabled={loading}
                className="w-20 bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-2 text-sm text-zinc-100 outline-none"
              >
                <option value="EQUITY">Eq</option>
                <option value="INDEX">Idx</option>
              </select>
            </div>
            <button
              onClick={handleSearch}
              disabled={loading || !query.trim()}
              className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 px-3 py-2 rounded-lg text-sm transition-all"
            >
              {loading ? "..." : "Search"}
            </button>

            {results.length > 0 && (
              <div className="mt-4 max-h-[200px] overflow-y-auto custom-scrollbar space-y-1">
                {results.map((r) => (
                  <div
                    key={r.token}
                    className="flex justify-between items-center p-2 rounded hover:bg-zinc-800 transition-all cursor-pointer group"
                  >
                    <div onClick={() => setSelected(r)}>
                      <div className="font-semibold text-zinc-200 text-xs">{r.symbol}</div>
                      <div className="text-[10px] text-zinc-500">{r.name}</div>
                    </div>
                    <button
                      onClick={() => addToWatchlist(r)}
                      className="text-xs bg-blue-500/10 text-blue-400 px-2 py-1 rounded border border-blue-500/20 hover:bg-blue-500 hover:text-white transition-all"
                    >
                      + Add
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Details & Option Chain */}
        <div className="flex flex-col gap-6 min-w-0">
          {selected ? (
            <>
              <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-8 shadow-xl backdrop-blur-md flex flex-wrap justify-between items-end gap-6 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -z-10 group-hover:bg-blue-500/10 transition-colors duration-500"></div>

                <div>
                  <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-white leading-none mb-2">
                    {selected.symbol}
                  </h2>
                  <div className="flex items-center gap-3 text-zinc-400 text-sm">
                    <span className="font-medium">{selected.name}</span>
                    <span className="w-1 h-1 rounded-full bg-zinc-600"></span>
                    <span className="font-mono text-zinc-500">{selected.exch_seg}</span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm font-medium text-zinc-500 mb-1 uppercase tracking-wider">Last Traded Price</div>
                  <div className={`font-mono text-5xl font-bold tracking-tight animate-in fade-in zoom-in ${livePrices[selected.token] ? 'text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.2)]' : 'text-zinc-700'}`}>
                    {livePrices[selected.token] ? `₹${livePrices[selected.token].toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : <span className="animate-pulse">---.--</span>}
                  </div>
                </div>
              </div>

              {/* View Toggles */}
              <div className="flex gap-4 border-b border-zinc-800 pb-2">
                <button
                  onClick={() => setActiveView("chart")}
                  className={`pb-2 text-sm font-medium transition-all ${activeView === "chart" ? "text-blue-500 border-b-2 border-blue-500" : "text-zinc-400 hover:text-zinc-200"}`}
                >
                  Chart
                </button>
                <button
                  onClick={() => setActiveView("optionChain")}
                  className={`pb-2 text-sm font-medium transition-all ${activeView === "optionChain" ? "text-blue-500 border-b-2 border-blue-500" : "text-zinc-400 hover:text-zinc-200"}`}
                >
                  Option Chain
                </button>
              </div>

              {/* View Content */}
              {activeView === "chart" && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                  <Chart
                    symbol={selected.symbol}
                    token={selected.token}
                    exchange={selected.exch_seg}
                  />
                </div>
              )}

              {activeView === "optionChain" && (
                <OptionChain
                  symbol={normalizeUnderlying(selected)}
                  spotPrice={ltp}
                />
              )}

              <div className="flex gap-4 mt-4">
                <button className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-all shadow-lg shadow-emerald-900/20">Buy</button>
                <button className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white rounded-lg font-medium transition-all shadow-lg shadow-red-900/20">Sell</button>
              </div>

            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center bg-zinc-900/30 border-2 border-dashed border-zinc-800 rounded-xl p-12 text-center">
              <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl">🔍</span>
              </div>
              <h3 className="text-xl font-medium text-zinc-300 mb-2">No Instrument Selected</h3>
              <p className="text-zinc-500 max-w-sm">Use the search panel on the left to add stocks to your Watchlist.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;


