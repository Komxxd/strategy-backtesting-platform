
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
        <div className="w-full bg-[#09090b]/80 backdrop-blur-md border-b border-zinc-800/50 p-4 overflow-x-auto">
            <form onSubmit={handleSubmit} className="max-w-[1600px] mx-auto flex flex-col lg:flex-row lg:items-end gap-4 lg:gap-6 min-w-[300px]">

                {/* Top Row on Mobile: Index + Type + Side */}
                <div className="flex flex-wrap gap-4 w-full lg:w-auto">
                    {/* Index */}
                    <div className="flex flex-col gap-1.5 flex-1 lg:flex-none min-w-[100px]">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Index</label>
                        <div className="relative">
                            <select name="index" value={params.index} onChange={handleChange} className="w-full appearance-none bg-zinc-900/50 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-300 font-medium outline-none focus:border-yellow-500/50 focus:text-white transition-colors cursor-pointer hover:bg-zinc-900">
                                <option value="NIFTY">NIFTY</option>
                                <option value="SENSEX">SENSEX</option>
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">▾</div>
                        </div>
                    </div>

                    {/* Type & Side */}
                    <div className="flex gap-2 flex-1 lg:flex-none">
                        <div className="flex flex-col gap-1.5 flex-1">
                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Type</label>
                            <div className="flex bg-zinc-900/50 rounded-lg p-0.5 border border-zinc-800 h-[38px] w-full">
                                {['CE', 'PE'].map(type => (
                                    <button key={type} type="button" onClick={() => setParams(p => ({ ...p, optionType: type }))} className={`flex-1 px-2 text-xs font-bold rounded-md transition-all ${params.optionType === type ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-600 hover:text-zinc-400'}`}>{type}</button>
                                ))}
                            </div>
                        </div>
                        <div className="flex flex-col gap-1.5 flex-1">
                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Side</label>
                            <div className="flex bg-zinc-900/50 rounded-lg p-0.5 border border-zinc-800 h-[38px] w-full">
                                {['BUY', 'SELL'].map(pos => (
                                    <button key={pos} type="button" onClick={() => setParams(p => ({ ...p, position: pos }))} className={`flex-1 px-2 text-xs font-bold rounded-md transition-all ${params.position === pos ? (pos === 'BUY' ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-500/20' : 'bg-red-900/30 text-red-400 border border-red-500/20') : 'text-zinc-600 hover:text-zinc-400'}`}>{pos}</button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Config Group */}
                <div className="flex flex-wrap lg:flex-nowrap gap-4 lg:gap-6 lg:border-l border-zinc-800/50 lg:pl-6 w-full lg:w-auto">
                    <div className="flex gap-4 w-full sm:w-auto">
                        {/* Lots */}
                        <div className="flex flex-col gap-1.5 flex-1 sm:flex-none w-full sm:w-20">
                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Lots</label>
                            <input type="number" name="lots" min="1" value={params.lots || 1} onChange={handleChange} className="w-full bg-transparent border-b border-zinc-800 px-0 py-2 text-sm text-center text-zinc-200 font-mono outline-none focus:border-yellow-500 transition-colors placeholder-zinc-700 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" title="Number of lots" />
                        </div>

                        {/* SL */}
                        <div className="flex flex-col gap-1.5 flex-1 sm:flex-none w-full sm:w-20">
                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Stop Loss</label>
                            <div className="relative">
                                <input type="number" name="stopLoss" value={params.stopLoss} onChange={handleChange} className="w-full bg-transparent border-b border-zinc-800 px-0 py-2 text-sm text-center text-zinc-200 font-mono outline-none focus:border-red-500 transition-colors [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" />
                                <span className="absolute right-0 top-1/2 -translate-y-1/2 text-[10px] text-zinc-600">pts</span>
                            </div>
                        </div>
                    </div>

                    {/* Times */}
                    <div className="flex gap-4 w-full sm:w-auto">
                        <div className="flex flex-col gap-1.5 flex-1">
                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Entry</label>
                            <input type="time" name="entryTime" value={params.entryTime} onChange={handleChange} className="w-full bg-transparent border-b border-zinc-800 px-0 py-2 text-sm text-zinc-200 font-mono outline-none focus:border-blue-500 transition-colors cursor-pointer" />
                        </div>
                        <div className="flex flex-col gap-1.5 flex-1">
                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Exit</label>
                            <input type="time" name="exitTime" value={params.exitTime} onChange={handleChange} className="w-full bg-transparent border-b border-zinc-800 px-0 py-2 text-sm text-zinc-200 font-mono outline-none focus:border-blue-500 transition-colors cursor-pointer" />
                        </div>
                    </div>
                </div>

                {/* Action */}
                <button type="submit" disabled={loading} className="w-full lg:w-auto mt-2 lg:mt-0 h-[42px] px-8 bg-zinc-100 hover:bg-white text-black rounded-lg font-bold text-sm tracking-wide shadow-[0_0_20px_-5px_rgba(255,255,255,0.3)] active:scale-95 transition-all flex items-center justify-center gap-2 lg:ml-auto">
                    {loading ? <RotateCcw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
                    {loading ? "SIMULATING..." : "RUN"}
                </button>

            </form>

        </div>
    );
}
