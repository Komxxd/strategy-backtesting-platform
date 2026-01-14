import { createChart, ColorType, CandlestickSeries } from 'lightweight-charts';
import { useEffect, useRef, useState } from 'react';
import { fetchCandles, initSocket, subscribeToTokens } from './api';

const INTERVALS = [
    { label: '1m', value: 'ONE_MINUTE', days: 10 },
    { label: '3m', value: 'THREE_MINUTE', days: 10 },
    { label: '5m', value: 'FIVE_MINUTE', days: 30 },
    { label: '10m', value: 'TEN_MINUTE', days: 30 },
    { label: '15m', value: 'FIFTEEN_MINUTE', days: 60 },
    { label: '30m', value: 'THIRTY_MINUTE', days: 60 },
    { label: '1h', value: 'ONE_HOUR', days: 100 },
    { label: '1d', value: 'ONE_DAY', days: 365 },
];

export const Chart = ({ symbol, exchange, token }) => {
    const chartContainerRef = useRef();
    const [loading, setLoading] = useState(false);
    const chartRef = useRef(null);
    const seriesRef = useRef(null);

    const [interval, setInterval] = useState(INTERVALS[7]); // Default 1d
    const [customInterval, setCustomInterval] = useState("");

    // Re-create chart when symbol or interval changes
    useEffect(() => {
        if (!symbol || !token) return;

        const container = chartContainerRef.current;
        if (!container) return;

        // Cleanup pre-check
        // Although the return function cleans up, strictly ensuring we start fresh is good practice
        if (chartRef.current) {
            chartRef.current.remove();
            chartRef.current = null;
        }

        const chartOptions = {
            layout: {
                textColor: '#d4d4d8',
                background: { type: ColorType.Solid, color: '#18181b' },
            },
            grid: {
                vertLines: { color: '#27272a' },
                horzLines: { color: '#27272a' },
            },
            width: container.clientWidth,
            height: 400,
            timeScale: {
                timeVisible: true,
                secondsVisible: false,
                borderColor: '#27272a',
            },
            rightPriceScale: {
                borderColor: '#27272a',
            },
        };

        const chart = createChart(container, chartOptions);
        chartRef.current = chart;

        const candleSeries = chart.addSeries(CandlestickSeries, {
            upColor: '#10b981',
            downColor: '#ef4444',
            borderVisible: false,
            wickUpColor: '#10b981',
            wickDownColor: '#ef4444',
        });
        seriesRef.current = candleSeries;

        let lastCandle = null;

        // Fetch Data
        const loadData = async () => {
            setLoading(true);
            try {
                const to = new Date();
                const from = new Date();
                from.setDate(to.getDate() - interval.days);

                const formatDate = (d) => d.toISOString().slice(0, 16).replace('T', ' ');

                const res = await fetchCandles({
                    exchange: exchange || 'NSE',
                    symboltoken: token,
                    interval: interval.value,
                    fromdate: formatDate(from),
                    todate: formatDate(to)
                });

                if (res.data && res.data.data) {
                    // Check if chart is still mounted before setting data
                    if (!chartRef.current) return;

                    const data = res.data.data.map(d => {
                        let time;
                        if (interval.value === 'ONE_DAY') {
                            time = d[0].split('T')[0];
                        } else {
                            time = Math.floor(new Date(d[0]).getTime() / 1000) + 19800; // IST shift
                        }

                        return {
                            time: time,
                            open: d[1],
                            high: d[2],
                            low: d[3],
                            close: d[4]
                        };
                    });

                    data.sort((a, b) => (typeof a.time === 'string' ? a.time.localeCompare(b.time) : a.time - b.time));

                    candleSeries.setData(data);
                    lastCandle = data[data.length - 1];
                    chart.timeScale().fitContent();
                }
            } catch (err) {
                console.error("Chart data fetch failed", err);
            } finally {
                if (chartRef.current) setLoading(false);
            }
        };

        loadData();

        // Subscribe to live updates
        const socket = initSocket();

        let exchCode = exchange === 'NFO' ? 2 : 1;
        if (exchange === 'BSE') exchCode = 3;

        subscribeToTokens({ exchangeType: exchCode, tokens: [token] });

        const handleTick = (data) => {
            // Guard clause: if chart is disposed, stop processing
            if (!chartRef.current || !seriesRef.current) return;

            if (data.token?.replace(/"/g, '') === token) {
                const price = Number(data.last_traded_price || data.ltp) / 100;
                if (!lastCandle || isNaN(price)) return;

                const updatedCandle = {
                    ...lastCandle,
                    close: price,
                    high: Math.max(lastCandle.high, price),
                    low: Math.min(lastCandle.low, price),
                };

                // Wrap update in try-catch to be safe against dispose race conditions
                try {
                    candleSeries.update(updatedCandle);
                    lastCandle = updatedCandle;
                } catch (e) {
                    // Chart likely disposed
                }
            }
        };

        socket.on("tick", handleTick);

        const handleResize = () => {
            if (chartRef.current) {
                chart.applyOptions({ width: container.clientWidth });
            }
        };

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            socket.off("tick", handleTick);

            if (chartRef.current) {
                chartRef.current.remove();
                chartRef.current = null;
                seriesRef.current = null;
            }
        };
    }, [symbol, token, interval]); // Re-run when interval changes

    return (
        <div className="flex flex-col gap-2">
            {/* Interval Selector */}
            <div className="flex flex-wrap gap-2 pb-2 border-b border-zinc-800">
                {INTERVALS.map((int) => (
                    <button
                        key={int.value}
                        onClick={() => setInterval(int)}
                        className={`px-3 py-1 text-xs font-medium rounded transition-all ${interval.value === int.value
                            ? 'bg-blue-600 text-white'
                            : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'
                            }`}
                    >
                        {int.label}
                    </button>
                ))}
            </div>

            <div className="relative">
                <div ref={chartContainerRef} className="w-full h-[400px] border border-zinc-800 rounded-lg overflow-hidden bg-zinc-950" />
                {loading && (
                    <div className="absolute inset-0 flex justify-center items-center bg-zinc-900/50 backdrop-blur-sm z-10">
                        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                    </div>
                )}
            </div>
        </div>
    );
};
