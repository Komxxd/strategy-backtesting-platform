
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

      const response = await fetch('http://localhost:5001/api/backtest/run', {
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
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-blue-500/30">

      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">A</div>
            <h1 className="text-lg font-bold tracking-tight">AlgoTerminal <span className="text-zinc-500 font-normal">Backtest</span></h1>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto p-6 grid grid-cols-1 lg:grid-cols-[1fr_3fr] gap-8">

        {/* Sidebar */}
        <div className="flex flex-col gap-6">
          <StrategyForm onRunBacktest={handleRunBacktest} loading={loading} />

          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 text-zinc-400 text-sm">
            <h3 className="text-zinc-200 font-semibold mb-2">Instructions</h3>
            <ul className="list-disc pl-4 space-y-1">
              <li>Select the index to trade (Nifty/BankNifty).</li>
              <li>Choose option type (CE/PE) and direction.</li>
              <li>Set precise entry/exit times.</li>
              <li>Stop Loss is checked on 1-min candles.</li>
            </ul>
          </div>
        </div>

        {/* Results Area */}
        <div className="flex flex-col gap-6">
          {loading && (
            <div className="flex-1 flex flex-col items-center justify-center bg-zinc-900/30 border-2 border-dashed border-zinc-800 rounded-xl min-h-[500px]">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <div className="text-zinc-400">Crunching historical data...</div>
            </div>
          )}

          {!loading && !results && (
            <div className="flex-1 flex flex-col items-center justify-center bg-zinc-900/30 border-2 border-dashed border-zinc-800 rounded-xl min-h-[500px]">
              <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mb-4 text-3xl">
                📊
              </div>
              <h3 className="text-xl font-medium text-zinc-300 mb-2">Ready to Backtest</h3>
              <p className="text-zinc-500 max-w-sm text-center">Configure your strategy parameters on the left and hit "Run Backtest" to see performance metrics.</p>
            </div>
          )}

          {!loading && results && (
            <div className="space-y-6">
              {/* KPI Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
                  <div className="text-zinc-500 text-xs uppercase font-medium">Total P&L</div>
                  <div className={`text-2xl font-bold font-mono ${results.totalPnL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {results.totalPnL >= 0 ? '+' : ''}{results.totalPnL.toFixed(2)}
                  </div>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
                  <div className="text-zinc-500 text-xs uppercase font-medium">Win Rate</div>
                  <div className="text-2xl font-bold text-blue-400 font-mono">
                    {results.winRate}%
                  </div>
                  <div className="text-xs text-zinc-500">{results.wins}W / {results.losses}L</div>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
                  <div className="text-zinc-500 text-xs uppercase font-medium">Total Trades</div>
                  <div className="text-2xl font-bold text-zinc-200 font-mono">
                    {results.totalTrades}
                  </div>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
                  <div className="text-zinc-500 text-xs uppercase font-medium">Max Drawdown</div>
                  <div className="text-2xl font-bold text-red-400 font-mono">
                    {results.maxDrawdown}
                  </div>
                </div>
              </div>

              {/* Trade List */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                <div className="px-6 py-4 border-b border-zinc-800 font-semibold text-zinc-200">Trade Log</div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-zinc-500 uppercase bg-zinc-950/50">
                      <tr>
                        <th className="px-6 py-3">Date</th>
                        <th className="px-6 py-3">Signal</th>
                        <th className="px-6 py-3">Entry Price</th>
                        <th className="px-6 py-3">Exit Price</th>
                        <th className="px-6 py-3">P&L</th>
                        <th className="px-6 py-3">Reason</th>
                        <th className="px-6 py-3">Data</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                      {results.trades.map((trade, i) => (
                        <tr key={i} className="hover:bg-zinc-800/50 transition-colors">
                          <td className="px-6 py-4 font-mono text-zinc-300">{trade.date}</td>
                          <td className="px-6 py-4 text-zinc-300">{trade.signal}</td>
                          <td className="px-6 py-4 font-mono text-zinc-400">{trade.entryPrice}</td>
                          <td className="px-6 py-4 font-mono text-zinc-400">{trade.exitPrice}</td>
                          <td className={`px-6 py-4 font-mono font-bold ${trade.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{trade.pnl}</td>
                          <td className="px-6 py-4 text-zinc-500 text-xs">{trade.exitReason}</td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => setDebugTrade(trade)}
                              className="text-xs text-blue-400 hover:text-blue-300 underline"
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setDebugTrade(null)}>
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900">
              <h3 className="font-semibold text-zinc-100">{debugTrade.date} Data Verification</h3>
              <button onClick={() => setDebugTrade(null)} className="text-zinc-500 hover:text-zinc-300">✕</button>
            </div>
            <div className="p-6 overflow-y-auto space-y-6">
              <div>
                <h4 className="text-sm font-medium text-blue-400 uppercase tracking-wider mb-2">Source Info</h4>
                <div className="bg-zinc-900 p-3 rounded-lg border border-zinc-800/50 text-xs text-zinc-300 grid grid-cols-2 gap-2">
                  <div><span className="text-zinc-500">Total Candles:</span> {debugTrade.debugData.totalCandles}</div>
                  <div><span className="text-zinc-500">Source:</span> Angel One Historical API</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-emerald-400 uppercase tracking-wider mb-2">First Candle (Open)</h4>
                  <pre className="bg-zinc-900 p-3 rounded-lg border border-zinc-800/50 text-xs text-zinc-400 overflow-x-auto font-mono">
                    {JSON.stringify(debugTrade.debugData.firstCandle, null, 2)}
                  </pre>
                  <div className="text-[10px] text-zinc-500 mt-1">* [Time, Open, High, Low, Close, Vol]</div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-red-400 uppercase tracking-wider mb-2">Last Candle (Close)</h4>
                  <pre className="bg-zinc-900 p-3 rounded-lg border border-zinc-800/50 text-xs text-zinc-400 overflow-x-auto font-mono">
                    {JSON.stringify(debugTrade.debugData.lastCandle, null, 2)}
                  </pre>
                </div>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg text-sm text-blue-200">
                <strong>Logic Verification:</strong><br />
                This trade used {debugTrade.debugData.totalCandles} minute candles to simulate the path.
                The prices shown above are the <strong>Spot Index</strong> prices used for calculation.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
