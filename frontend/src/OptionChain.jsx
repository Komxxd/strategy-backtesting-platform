import { useEffect, useState, useMemo, useRef } from "react";
import { getOptionChain, initSocket, subscribeToTokens } from "./api";
import { calculateGreeks } from "./utils/analytics"; // We will create this
import { Info } from "lucide-react"; // install lucide-react or use simple SVG


import { createPortal } from "react-dom";

// Portal-based Tooltip to escape overflow clipping
const Tooltip = ({ text, children }) => {
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  const handleMouseEnter = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setCoords({
      top: rect.top - 10, // 10px above the element
      left: rect.left + rect.width / 2
    });
    setVisible(true);
  };

  const handleMouseLeave = () => setVisible(false);

  return (
    <div
      className="inline-flex items-center cursor-help"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {visible && createPortal(
        <div
          className="fixed z-[9999] px-3 py-2 bg-zinc-800 text-zinc-200 text-xs rounded border border-zinc-700 shadow-xl w-48 text-center whitespace-normal leading-relaxed backdrop-blur-sm pointer-events-none transition-opacity animate-in fade-in zoom-in-95 duration-200"
          style={{
            top: coords.top,
            left: coords.left,
            transform: 'translate(-50%, -100%)'
          }}
        >
          {text}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-zinc-700"></div>
        </div>,
        document.body
      )}
    </div>
  );
};

function OptionChain({ symbol, spotPrice }) {
  const [chain, setChain] = useState(null);
  const [expiry, setExpiry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [optionPrices, setOptionPrices] = useState({});
  const rowRefs = useRef({});

  // Memoized greeks calculation 
  const analytics = useMemo(() => {
    if (!chain || !spotPrice || !expiry) return { greeks: {}, pcr: 0 };

    const res = {};
    let totalCE_OI = 0;
    let totalPE_OI = 0;

    chain.chain.forEach(row => {
      // Use Live Option Price if available to solve for IV, else default vol
      // For now, simpler: pass optionPrice to calculateGreeks (which will solve IV internally if we update it)
      // OR calculate IV here.
      // Let's pass the market price to a new function `calculateAnalytics` that returns IV + Greeks

      if (row.CE) {
        const marketPrice = optionPrices[row.CE.token]; // Might be undefined
        // if marketPrice is present, we SHOULD calculate IV. 
        // For now, passing marketPrice to calculateGreeks if we update it to accept it.
        // But I'll stick to updating `calculateGreeks` to accept `marketPrice` and solve IV.
        res[row.CE.token] = calculateGreeks(spotPrice, row.strike, expiry, 'call', 0.10, 0.20, marketPrice);
      }
      if (row.PE) {
        const marketPrice = optionPrices[row.PE.token];
        res[row.PE.token] = calculateGreeks(spotPrice, row.strike, expiry, 'put', 0.10, 0.20, marketPrice);
      }
    });

    return { greeks: res, pcr: 0.85 };
  }, [chain, spotPrice, expiry, optionPrices]); // Re-calc when prices change

  // ATM Strike
  const atmStrike = chain && spotPrice ? chain.chain.reduce((prev, curr) => {
    return (Math.abs(curr.strike - spotPrice) < Math.abs(prev.strike - spotPrice) ? curr : prev);
  }).strike : null;

  // Scroll to ATM
  useEffect(() => {
    if (atmStrike && rowRefs.current[atmStrike]) {
      rowRefs.current[atmStrike].scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [atmStrike, loading]);

  // Fetch Chain
  useEffect(() => {
    if (!symbol) return;
    async function fetchChain() {
      setLoading(true);
      setError(null);
      setOptionPrices({});
      try {
        const res = await getOptionChain({ symbol, exchange: "NFO", expiry });
        if (res.success) {
          setChain(res.data);
          const tokens = [];
          if (res.data.chain) {
            res.data.chain.forEach(row => {
              if (row.CE) tokens.push(row.CE.token);
              if (row.PE) tokens.push(row.PE.token);
            });
          }
          if (tokens.length > 0) {
            await subscribeToTokens({ exchangeType: 2, tokens: tokens });
            const socket = initSocket();
            const handleTick = (data) => {
              const token = data.token?.replace(/"/g, '');
              const rawPrice = Number(data.last_traded_price || data.ltp);
              if (token && !isNaN(rawPrice)) {
                setOptionPrices(prev => ({ ...prev, [token]: rawPrice / 100 }));
              }
            };
            socket.on("tick", handleTick);
            return () => { socket.off("tick", handleTick); };
          }
        } else {
          setError("Failed to load option chain");
        }
      } catch (err) {
        setError("Error: " + err.message);
      } finally {
        setLoading(false);
      }
    }
    const cleanup = fetchChain();
    return () => { };
  }, [symbol, expiry]);

  // Socket Listener for Price Updates (Redundant if handled in fetchChain return, but ensures persistent listener)
  useEffect(() => {
    if (!chain) return;
    const socket = initSocket();
    const handleTick = (data) => {
      const token = data.token?.replace(/"/g, '');
      const rawPrice = Number(data.last_traded_price || data.ltp);
      if (token && !isNaN(rawPrice)) {
        setOptionPrices(prev => ({ ...prev, [token]: rawPrice / 100 }));
      }
    };
    socket.on("tick", handleTick);
    return () => { socket.off("tick", handleTick); };
  }, [chain]);


  if (loading) return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-12 mt-6 flex justify-center items-center">
      <div className="animate-spin text-zinc-500">Loading...</div>
    </div>
  );
  if (error) return <div className="p-8 mt-6 text-center text-red-500">{error}</div>;
  if (!chain || !chain.chain || chain.chain.length === 0) return <div className="text-zinc-500 mt-6 text-center">No Data</div>;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mt-6 shadow-xl w-full overflow-hidden">
      <div className="border-b border-zinc-800 pb-4 mb-4 flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold text-white">Option Chain</h3>
          {chain.expiries && (
            <select value={expiry || chain.expiry} onChange={(e) => setExpiry(e.target.value)} className="bg-zinc-800 text-zinc-300 text-xs border border-zinc-700 rounded px-2 py-1 outline-none">
              {chain.expiries.map((exp) => <option key={exp} value={exp}>{exp}</option>)}
            </select>
          )}
          {spotPrice && <span className="text-xs text-zinc-500">Spot: <span className="text-white font-mono">{spotPrice.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span></span>}
        </div>

        {/* Analytics Summary */}
        <div className="flex gap-6 items-center bg-zinc-950/50 px-4 py-2 rounded-lg border border-zinc-800/50">
          <div className="text-xs">
            <span className="text-zinc-500 mr-2">PCR</span>
            <span className={`font-mono font-bold ${analytics.pcr > 1 ? 'text-emerald-400' : 'text-red-400'}`}>{analytics.pcr}</span>
          </div>
          <div className="text-xs">
            <span className="text-zinc-500 mr-2">Max Pain</span>
            <span className="font-mono font-bold text-zinc-300">---</span>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-950 max-h-[600px] custom-scrollbar">
        <table className="w-full border-collapse text-xs">
          <thead className="sticky top-0 z-10 bg-zinc-900 text-zinc-400 uppercase tracking-wider font-medium shadow-sm">
            <tr>
              <th className="p-2 border-b border-zinc-800 text-center" colSpan={5}>CALLS</th>
              <th className="p-2 border-b border-zinc-800 bg-zinc-800/50 text-center border-x border-zinc-700/50">STRIKE</th>
              <th className="p-2 border-b border-zinc-800 text-center" colSpan={5}>PUTS</th>
            </tr>
            <tr className="text-[10px] text-zinc-500">
              <th className="p-2 w-12 font-normal text-right">Delta <Tooltip text="The rate of change of option price with respect to the underlying price."><Info className="w-3 h-3 inline pb-0.5 opacity-50" /></Tooltip></th>
              <th className="p-2 w-12 font-normal text-right">Theta <Tooltip text="Time decay: how much value the option loses per day."><Info className="w-3 h-3 inline pb-0.5 opacity-50" /></Tooltip></th>
              <th className="p-2 w-14 font-normal text-right">IV %</th>
              <th className="p-2 w-14 font-normal text-right">OI</th>
              <th className="p-2 font-normal text-right">LTP</th>

              <th className="p-2 bg-zinc-800/50 border-x border-zinc-700/50"></th>

              <th className="p-2 font-normal text-left">LTP</th>
              <th className="p-2 w-14 font-normal text-left">OI</th>
              <th className="p-2 w-14 font-normal text-left">IV %</th>
              <th className="p-2 w-12 font-normal text-left">Theta</th>
              <th className="p-2 w-12 font-normal text-left">Delta</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-900 font-mono">
            {chain.chain.map((row) => {
              const isATM = row.strike === atmStrike;
              const callGreeks = row.CE ? analytics.greeks[row.CE.token] : null;
              const putGreeks = row.PE ? analytics.greeks[row.PE.token] : null;

              return (
                <tr key={row.strike} ref={el => rowRefs.current[row.strike] = el} className={`group transition-all ${isATM ? 'bg-blue-500/10 hover:bg-blue-500/20' : 'hover:bg-zinc-900/40'}`}>
                  {/* CALLS */}
                  <td className="p-2 text-right text-zinc-500">{callGreeks?.delta.toFixed(2) || '-'}</td>
                  <td className="p-2 text-right text-zinc-500">{callGreeks?.theta.toFixed(2) || '-'}</td>
                  <td className={`p-2 text-right ${callGreeks?.iv > 0 ? 'text-zinc-400' : 'text-zinc-600'}`}>
                    {callGreeks?.iv ? `${callGreeks.iv.toFixed(1)}%` : '-'}
                  </td>
                  <td className="p-2 text-right text-zinc-400">-</td>
                  <td className={`p-2 text-right font-bold ${optionPrices[row.CE?.token] ? 'text-emerald-400' : 'text-zinc-600'}`}>
                    {optionPrices[row.CE?.token] ? optionPrices[row.CE.token].toFixed(2) : '-'}
                  </td>

                  {/* STRIKE */}
                  <td className={`p-2 text-center border-x border-zinc-800 font-bold text-sm select-none ${isATM ? 'text-blue-400 bg-blue-500/10' : 'text-zinc-300 bg-zinc-900'}`}>
                    {row.strike}
                  </td>

                  {/* PUTS */}
                  <td className={`p-2 text-left font-bold ${optionPrices[row.PE?.token] ? 'text-red-400' : 'text-zinc-600'}`}>
                    {optionPrices[row.PE?.token] ? optionPrices[row.PE.token].toFixed(2) : '-'}
                  </td>
                  <td className="p-2 text-left text-zinc-400">-</td>
                  <td className={`p-2 text-left ${putGreeks?.iv > 0 ? 'text-zinc-400' : 'text-zinc-600'}`}>
                    {putGreeks?.iv ? `${putGreeks.iv.toFixed(1)}%` : '-'}
                  </td>
                  <td className="p-2 text-left text-zinc-500">{putGreeks?.theta.toFixed(2) || '-'}</td>
                  <td className="p-2 text-left text-zinc-500">{putGreeks?.delta.toFixed(2) || '-'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default OptionChain;
