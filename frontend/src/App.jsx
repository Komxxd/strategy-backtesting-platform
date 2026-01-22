
import { useState } from "react";
import StrategyForm from "./StrategyForm";
import { Play } from "lucide-react";

export default function App() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  // Debug Modal State
  const [debugTrade, setDebugTrade] = useState(null);

  const handleRunBacktest = async (params) => {
    setLoading(true);
    setResults(null);
    setDebugTrade(null);
    try {
      // Simulate API call for now or connect to backend
      console.log("Running backtest with:", params);

      const response = await fetch('/api/backtest/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      const data = await response.json();
      setResults(data);

    } catch (error) {
      console.error("Backtest error", error);
      alert("Failed to run backtest");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans selection:bg-purple-500/30">

      {/* Header */}
      <header className="border-b border-zinc-800/50 bg-[#09090b]/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-lg flex items-center justify-center text-black font-extrabold shadow-lg shadow-yellow-500/20">A</div>
            <h1 className="text-lg font-bold tracking-tight text-white">AlgoTerminal <span className="text-zinc-500 font-normal">Quantum</span></h1>
          </div>
        </div>
      </header>

      <StrategyForm onRunBacktest={handleRunBacktest} loading={loading} />

      <main className="max-w-[1600px] mx-auto p-4 md:p-6 pb-20">

        {/* Results Area */}
        <div className="flex flex-col gap-8">
          {loading && (
            <div className="flex-1 flex flex-col items-center justify-center min-h-[500px] animate-pulse">
              <div className="w-16 h-16 rounded-full border-2 border-yellow-500/50 border-t-yellow-400 animate-spin mb-6"></div>
              <h3 className="text-zinc-500 font-mono text-sm tracking-widest uppercase">Analyzing Market Data...</h3>
            </div>
          )}

          {!loading && !results && (
            <div className="flex flex-col items-center justify-center min-h-[600px] text-center space-y-4">
              <div className="w-20 h-20 bg-zinc-900 rounded-2xl flex items-center justify-center mb-4 shadow-2xl shadow-yellow-500/10 ring-1 ring-white/5">
                <span className="text-4xl">⚡️</span>
              </div>
              <h2 className="text-2xl font-bold text-white tracking-tight">Ready to Simulate</h2>
              <p className="text-zinc-500 max-w-md">Enter your strategy parameters above to initialize the quantum backtesting engine.</p>
            </div>
          )}

          {!loading && results && (
            <div className="space-y-8 animate-in fade-in duration-500 slide-in-from-bottom-4">

              {/* Performance Summary Header */}
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <div className="w-1 h-6 bg-yellow-500 rounded-full"></div>
                  Performance Summary
                </h2>
                <div className="flex gap-2">
                  <span className="px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs text-zinc-400">Monthly</span>
                </div>
              </div>

              {/* KPI Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total P&L */}
                <div className="bg-[#0A0A0A] border border-zinc-800/50 p-6 rounded-2xl relative overflow-hidden group hover:border-zinc-700/50 transition-colors">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <div className={`w-16 h-16 rounded-full blur-2xl ${results.totalPnL >= 0 ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                  </div>
                  <div className="text-zinc-500 text-xs font-medium uppercase tracking-wider mb-2">Total Revenue</div>
                  <div className={`text-3xl font-bold font-mono tracking-tight ${results.totalPnL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {results.totalPnL >= 0 ? '+' : ''}{results.totalPnL.toFixed(2)}
                  </div>
                </div>

                {/* Win Rate */}
                <div className="bg-[#0A0A0A] border border-zinc-800/50 p-6 rounded-2xl relative overflow-hidden group hover:border-zinc-700/50 transition-colors">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <div className="w-16 h-16 rounded-full blur-2xl bg-purple-500"></div>
                  </div>
                  <div className="text-zinc-500 text-xs font-medium uppercase tracking-wider mb-2">Win Rate</div>
                  <div className="text-3xl font-bold text-white font-mono tracking-tight">
                    {results.winRate}%
                  </div>
                  <div className="mt-3 w-full bg-zinc-900 rounded-full h-1.5 overflow-hidden">
                    <div className="h-full bg-purple-500" style={{ width: `${results.winRate}%` }}></div>
                  </div>
                  <div className="text-xs text-zinc-500 mt-2 flex justify-between">
                    <span>{results.wins} Wins</span>
                    <span>{results.losses} Losses</span>
                  </div>
                </div>

                {/* Total Trades */}
                <div className="bg-[#0A0A0A] border border-zinc-800/50 p-6 rounded-2xl group hover:border-zinc-700/50 transition-colors">
                  <div className="text-zinc-500 text-xs font-medium uppercase tracking-wider mb-2">Total Trades</div>
                  <div className="text-3xl font-bold text-white font-mono tracking-tight">{results.totalTrades}</div>
                  <div className="text-xs text-zinc-600 mt-2">Executed Orders</div>
                </div>

                {/* Max Drawdown */}
                <div className="bg-[#0A0A0A] border border-zinc-800/50 p-6 rounded-2xl group hover:border-zinc-700/50 transition-colors">
                  <div className="text-zinc-500 text-xs font-medium uppercase tracking-wider mb-2">Max Drawdown</div>
                  <div className="text-3xl font-bold text-yellow-500 font-mono tracking-tight">{results.maxDrawdown}</div>
                  <div className="text-xs text-zinc-600 mt-2">Peak to Valley</div>
                </div>
              </div>


              {/* Recent Orders / Trade Log */}
              <div className="bg-[#0A0A0A] border border-zinc-800/50 rounded-2xl overflow-hidden">
                <div className="px-6 py-5 border-b border-zinc-800/50 flex justify-between items-center">
                  <h3 className="font-semibold text-white text-sm">Recent Trades</h3>
                  <div className="flex gap-2">
                    <button className="p-1 hover:bg-zinc-800 rounded transition-colors text-zinc-500"><span className="sr-only">Filter</span>⚡️</button>
                  </div>
                </div>
                <div className="overflow-x-auto border-t border-zinc-800/50">
                  <table className="w-full text-sm text-left min-w-[1000px]">
                    <thead className="text-xs text-zinc-500 uppercase bg-[#0F0F0F] border-b border-zinc-800/50">
                      <tr>
                        <th className="px-6 py-4 font-medium sticky left-0 bg-[#0F0F0F] z-10">Date</th>
                        <th className="px-6 py-4 font-medium">Instrument</th>
                        <th className="px-6 py-4 font-medium">Spot Ref</th>
                        <th className="px-6 py-4 font-medium">Spot Move</th>
                        <th className="px-6 py-4 font-medium">Opt Pts</th>
                        <th className="px-6 py-4 font-medium">Net P&L</th>
                        <th className="px-6 py-4 font-medium">Status</th>
                        <th className="px-6 py-4 font-medium text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/30">
                      {results.trades.map((trade, i) => (
                        <tr key={i} className="group hover:bg-zinc-900/30 transition-colors">
                          <td className="px-6 py-4 font-mono text-zinc-400 text-xs sticky left-0 bg-[#0A0A0A] group-hover:bg-zinc-900/30 transition-colors z-10 border-r border-zinc-800/50">{trade.date}</td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-1">
                              <span className={`inline-flex w-fit items-center px-2 py-0.5 rounded text-[11px] font-mono font-bold tracking-tight border ${trade.symbol?.includes('CE')
                                ? 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                                : 'bg-purple-500/10 border-purple-500/20 text-purple-400'
                                }`}>
                                {trade.symbol || trade.strike || 'ATM'}
                              </span>
                              <span className="text-[10px] text-zinc-600 font-medium uppercase tracking-wider pl-0.5">{trade.signal}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 font-mono text-zinc-400 text-xs">{trade.entryPrice}</td>
                          <td className={`px-6 py-4 font-mono ${trade.spotMove >= 0 ? 'text-zinc-300' : 'text-zinc-500'}`}>
                            {trade.spotMove !== undefined ? (
                              <>
                                {trade.spotMove > 0 ? '+' : ''}{Number(trade.spotMove).toFixed(2)}
                              </>
                            ) : <span className="text-zinc-700">-</span>}
                          </td>
                          <td className={`px-6 py-4 font-mono font-medium ${trade.optionPoints >= 0 ? 'text-blue-400' : 'text-purple-400'}`}>
                            {trade.optionPoints !== undefined ? (
                              <>
                                {trade.optionPoints > 0 ? '+' : ''}{Number(trade.optionPoints).toFixed(2)}
                              </>
                            ) : <span className="text-zinc-700">-</span>}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`font-mono font-bold ${trade.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                              {trade.pnl >= 0 ? '+' : ''}{trade.pnl}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`text-[10px] uppercase tracking-wider font-semibold px-2 py-1 rounded-full ${trade.pnl >= 0
                              ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                              : 'bg-red-500/10 text-red-500 border border-red-500/20'
                              }`}>
                              {trade.pnl >= 0 ? 'PROFIT' : 'LOSS'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => setDebugTrade(trade)}
                              className="text-xs text-zinc-500 hover:text-white transition-colors underline decoration-zinc-700 underline-offset-4"
                            >
                              Verify
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Debug Modal */}
      {debugTrade && debugTrade.debugData && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setDebugTrade(null)}>
          <div className="bg-[#0A0A0A] border border-zinc-800 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col shadow-2xl ring-1 ring-white/10" onClick={e => e.stopPropagation()}>
            {/* ... header ... */}
            <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                {debugTrade.date} Verification
              </h3>
              <button onClick={() => setDebugTrade(null)} className="text-zinc-500 hover:text-white">✕</button>
            </div>
            {/* ... content ... */}
            <div className="p-6 overflow-y-auto space-y-6">

              {/* Params Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-zinc-900/50 p-3 rounded-xl border border-zinc-800">
                  <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Expiry</div>
                  <div className="text-sm font-mono text-white">{debugTrade.debugData.expiryDate || 'N/A'}</div>
                </div>
                <div className="bg-zinc-900/50 p-3 rounded-xl border border-zinc-800">
                  <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">IV</div>
                  <div className="text-sm font-mono text-zinc-300">{(debugTrade.debugData.iv ? (debugTrade.debugData.iv * 100).toFixed(0) : '-')} %</div>
                </div>
                <div className="bg-zinc-900/50 p-3 rounded-xl border border-zinc-800">
                  <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Risk Free</div>
                  <div className="text-sm font-mono text-zinc-300">{(debugTrade.debugData.riskFree ? (debugTrade.debugData.riskFree * 100).toFixed(0) : '-')} %</div>
                </div>
                <div className="bg-zinc-900/50 p-3 rounded-xl border border-zinc-800">
                  <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Candles</div>
                  <div className="text-sm font-mono text-zinc-300">{debugTrade.debugData.totalCandles}</div>
                </div>
              </div>

              {/* Detailed Math Cards */}
              {debugTrade.debugData.entryMath ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {['Entry', 'Exit'].map((type) => {
                    const math = type === 'Entry' ? debugTrade.debugData.entryMath : debugTrade.debugData.exitMath;
                    if (!math) return null;
                    return (
                      <div key={type} className="bg-zinc-900/30 rounded-xl border border-zinc-800 p-4">
                        <h4 className={`text-xs font-semibold uppercase tracking-wider mb-4 ${type === 'Entry' ? 'text-emerald-400' : 'text-red-400'}`}>{type} Math</h4>
                        <div className="space-y-1.5 text-[10px] font-mono">
                          <div className="flex justify-between border-b border-zinc-800 pb-1 mb-1"><span className="text-zinc-500">Spot (S)</span> <span className="text-zinc-200">{math.s}</span></div>
                          <div className="flex justify-between"><span className="text-zinc-500">Strike (K)</span> <span className="text-zinc-300">{math.k}</span></div>
                          <div className="flex justify-between"><span className="text-zinc-500">Time (T)</span> <span className="text-zinc-300">{math.t.toFixed(6)}</span></div>
                          <div className="h-px bg-zinc-800 my-2"></div>
                          <div className="flex justify-between"><span className="text-zinc-500">d1</span> <span className="text-zinc-400">{math.d1.toFixed(4)}</span></div>
                          <div className="flex justify-between"><span className="text-zinc-500">d2</span> <span className="text-zinc-400">{math.d2.toFixed(4)}</span></div>
                          <div className="flex justify-between"><span className="text-zinc-500">N(d1)</span> <span className="text-zinc-400">{math.nd1.toFixed(4)}</span></div>
                          <div className="flex justify-between"><span className="text-zinc-500">N(d2)</span> <span className="text-zinc-400">{math.nd2.toFixed(4)}</span></div>
                          <div className="h-px bg-zinc-800 my-2"></div>
                          <div className="flex justify-between font-bold text-xs bg-white/5 p-2 rounded mt-2 border border-white/10"><span className="text-blue-400">Premium</span> <span className="text-white">{math.price.toFixed(2)}</span></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center text-zinc-500 text-sm py-8 bg-zinc-900/30 rounded-xl border border-zinc-800 border-dashed">
                  Detailed Math data not available.<br />Please <span className="text-zinc-300 font-medium">Re-Run Backtest</span> to generate new verification data.
                </div>
              )}


              {/* Formula & Result */}
              <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl flex items-center justify-between">
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-blue-300 uppercase font-bold">Black-Scholes P&L</span>
                  <span className="text-[10px] text-blue-400/60 font-mono">Exit Prem - Entry Prem (if Buy)</span>
                </div>
                <div className="text-xl font-mono font-bold text-white">
                  {debugTrade.debugData.theoreticalPnl} pts
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
