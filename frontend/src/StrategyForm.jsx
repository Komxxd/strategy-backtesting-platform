
import React, { useState } from 'react';
import { Play, RotateCcw, TrendingUp, Clock, AlertCircle } from 'lucide-react';

export default function StrategyForm({ onRunBacktest, loading }) {
    const [params, setParams] = useState({
        index: "NIFTY",
        optionType: "CE",
        position: "BUY",
        entryTime: "09:20",
        exitTime: "15:15",
        stopLoss: 30, // Default 30 points
        startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setParams(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onRunBacktest(params);
    };

    return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-xl w-full max-w-sm">
            <div className="flex items-center gap-2 mb-6 border-b border-zinc-800 pb-4">
                <TrendingUp className="text-blue-500 w-5 h-5" />
                <h2 className="text-lg font-semibold text-zinc-100">Strategy Parameters</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">

                {/* Index Selection */}
                <div className="space-y-1">
                    <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Index</label>
                    <select
                        name="index"
                        value={params.index}
                        onChange={handleChange}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-zinc-200 outline-none focus:border-blue-500 transition-colors"
                    >
                        <option value="NIFTY">NIFTY 50</option>
                        <option value="SENSEX">SENSEX</option>
                    </select>
                </div>

                {/* Option Type & Position */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Type</label>
                        <div className="flex bg-zinc-950 rounded-lg p-1 border border-zinc-800">
                            {['CE', 'PE'].map(type => (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() => setParams(p => ({ ...p, optionType: type }))}
                                    className={`flex-1 py-1.5 text-xs font-semibold rounded ${params.optionType === type ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Position</label>
                        <div className="flex bg-zinc-950 rounded-lg p-1 border border-zinc-800">
                            {['BUY', 'SELL'].map(pos => (
                                <button
                                    key={pos}
                                    type="button"
                                    onClick={() => setParams(p => ({ ...p, position: pos }))}
                                    className={`flex-1 py-1.5 text-xs font-semibold rounded ${params.position === pos ? (pos === 'BUY' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400') : 'text-zinc-500 hover:text-zinc-300'}`}
                                >
                                    {pos}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Trade Type */}
                <div className="space-y-1">
                    <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Trade Type</label>
                    <select
                        name="tradeType"
                        value={params.tradeType || "INTRADAY"}
                        onChange={handleChange}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-zinc-200 outline-none focus:border-blue-500 transition-colors"
                    >
                        <option value="INTRADAY">INTRADAY</option>

                    </select>
                </div>

                {/* Times */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Entry
                        </label>
                        <input
                            type="time"
                            name="entryTime"
                            value={params.entryTime}
                            onChange={handleChange}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-200 outline-none focus:border-blue-500 text-center"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Exit
                        </label>
                        <input
                            type="time"
                            name="exitTime"
                            value={params.exitTime}
                            onChange={handleChange}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-200 outline-none focus:border-blue-500 text-center"
                        />
                    </div>
                </div>

                {/* Lots */}
                <div className="space-y-1">
                    <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                        📦 Lots
                    </label>
                    <input
                        type="number"
                        name="lots"
                        min="1"
                        value={params.lots || 1}
                        onChange={handleChange}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-200 outline-none focus:border-blue-500"
                        placeholder="e.g. 1"
                    />
                </div>

                {/* Stop Loss */}
                <div className="space-y-1">
                    <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> Stop Loss (Pts)
                    </label>
                    <input
                        type="number"
                        name="stopLoss"
                        value={params.stopLoss}
                        onChange={handleChange}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-200 outline-none focus:border-blue-500"
                        placeholder="e.g. 30"
                    />
                </div>

                {/* Date Range (Fixed 30 Days) */}
                <div className="space-y-1 pt-2 border-t border-zinc-800/50">
                    <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Backtest Period (Last 30 Days)</label>
                    <div className="flex justify-between items-center bg-zinc-950/50 border border-zinc-800/50 rounded px-3 py-2">
                        <span className="text-zinc-400 font-mono text-xs">{params.startDate}</span>
                        <span className="text-zinc-600 text-xs">to</span>
                        <span className="text-zinc-400 font-mono text-xs">{params.endDate}</span>
                    </div>
                </div>


                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium shadow-lg shadow-blue-900/20 active:translate-y-px transition-all flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <RotateCcw className="w-5 h-5 animate-spin" />
                    ) : (
                        <Play className="w-5 h-5 fill-current" />
                    )}
                    {loading ? "Running Simulation..." : "Run Backtest"}
                </button>

            </form>
        </div>
    );
}
