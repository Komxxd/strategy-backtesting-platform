

const smartApi = require("./smartApi.service");
const { blackScholes, blackScholesDetails, getNextExpiry } = require('../utils/blackScholes');

class BacktestService {
    /**
     * Run the backtest strategy
     * @param {Object} params 
     * @param {string} params.index - NIFTY, BANKNIFTY
     * @param {string} params.optionType - CE, PE
     * @param {string} params.position - BUY, SELL
     * @param {string} params.entryTime - HH:MM
     * @param {string} params.exitTime - HH:MM
     * @param {number} params.stopLoss - Points
     * @param {string} params.startDate - YYYY-MM-DD
     * @param {string} params.endDate - YYYY-MM-DD
     * @param {string} params.tradeType - INTRADAY (default) | POSITIONAL
     * @param {number} params.lots - Number of lots (default 1)
     */
    async run(params) {
        console.log("Starting Backtest with params:", params);

        const tradeType = params.tradeType || 'INTRADAY';

        const results = {
            totalPnL: 0,
            winRate: 0,
            wins: 0,
            losses: 0,
            totalTrades: 0,
            maxDrawdown: 0,
            trades: [],
        };

        // 1. Get Dates
        const dates = this.getBusinessDatesCount(params.startDate, params.endDate);
        console.log(`Processing ${dates.length} days...`);

        // 2. Map Index to Token
        const indexToken = smartApi.getIndexToken(params.index);
        const exchange = "NSE"; // Indices are on NSE (Cash)

        // 3. Process each day (For MVP, we might limit this to parallelize or do sequential)
        // We will do sequential to keep logic simple for now.

        let cumulativePnL = 0;
        let peakPnL = 0;

        for (const date of dates) {
            // Format time for API: "2023-10-01 09:15"
            // Note: SmartAPI expects "YYYY-MM-DD HH:MM"
            const fromDateStr = `${date} 09:15`;
            const toDateStr = `${date} 15:30`;

            const candles = await smartApi.getCandleData({
                exchange,
                symbolToken: indexToken,
                interval: "ONE_MINUTE",
                fromDate: fromDateStr,
                toDate: toDateStr
            });

            if (!candles || candles.length === 0) continue;

            const trade = this.processDay(candles, date, params);

            if (trade) {
                // Attach trade type to the record
                trade.type = tradeType;

                // Debug Info for user verification
                // We will attach the First and Last candle of the day processed to verify data range
                // And maybe the candle at Entry Time
                if (candles.length > 0) {
                    // trade.debugData already returned by processDay
                }

                results.totalTrades++;
                results.totalPnL += trade.pnl;

                if (trade.pnl > 0) results.wins++;
                else results.losses++;

                results.trades.push(trade);

                // Drawdown Calc
                cumulativePnL += trade.pnl;
                if (cumulativePnL > peakPnL) peakPnL = cumulativePnL;
                const dd = peakPnL - cumulativePnL;
                if (dd > results.maxDrawdown) results.maxDrawdown = dd;
            }

            // Rate Limit Protection: Delay 300ms between requests
            await new Promise(r => setTimeout(r, 1000));
        }

        if (results.totalTrades > 0) {
            results.winRate = ((results.wins / results.totalTrades) * 100).toFixed(1);
        }

        // Round numbers
        results.totalPnL = Math.round(results.totalPnL * 100) / 100;
        results.maxDrawdown = Math.round(results.maxDrawdown * 100) / 100;

        return results;
    }

    /**
     * Logic for a single day
     * @param {Array} candles - [timestamp, open, high, low, close, vol]
     * @param {string} dateString 
     * @param {Object} params 
     */
    processDay(candles, dateString, params) {
        // Parse Times
        const [entryH, entryM] = params.entryTime.split(':').map(Number);
        const [exitH, exitM] = params.exitTime.split(':').map(Number);

        // Find Entry Candle
        // Candle Timestamp format from SmartAPI: "2023-01-01T09:15:00+05:30" usually or similar string
        // We need to match HH:MM

        let entryCandleIndex = -1;
        let entryPrice = 0; // Index Price

        for (let i = 0; i < candles.length; i++) {
            const cTime = new Date(candles[i][0]);
            // Adjust for TZ if needed, but usually Date object handles it local
            // SmartAPI usually returns ISO string with offset or Z.
            // Let's rely on getHours/getMinutes
            if (cTime.getHours() === entryH && cTime.getMinutes() === entryM) {
                entryCandleIndex = i;
                // We enter at the OPEN of the minute candle requested.
                entryPrice = candles[i][1]; // Open Price
                break;
            }
        }

        if (entryCandleIndex === -1) return null; // Time not found (e.g. holiday or half day?)

        // Simulation parameters
        // We are trading 1 Lot of ATM Option.
        // Nifty Lot = 65.
        // Sensex Lot = 20.
        // Delta assumption = 0.5 (ATM).
        const LOT_SIZE = params.index === "NIFTY" ? 65 : 20; // Default to Sensex (20)
        const DELTA = 0.5;

        // Direction Multiplier: 
        // If Buying CE: Index Up = PnL Up -> +1
        // If Buying PE: Index Down = PnL Up -> -1
        // If Selling CE: Index Up = PnL Down -> -1 (Bearish)
        // If Selling PE: Index Down = PnL Down -> +1 (Bullish)

        let direction = 0;
        if (params.optionType === "CE") {
            direction = params.position === "BUY" ? 1 : -1;
        } else { // PE
            // For PE, if Index goes DOWN (Change is negative), Option goes UP.
            // Buy PE: Index -10 -> Option +5 -> PnL +5. (Neg * Neg = Pos)
            // So we want (IndexChange * -1) * 1
            direction = params.position === "BUY" ? -1 : 1;
        }

        // Monitoring
        // We track changes in SPOT price, and apply Delta.

        let exitPrice = 0;
        let exitReason = "End of Day"; // default
        let exitIndex = -1;

        // --- BLACK-SCHOLES SETUP ---
        const IV = 0.20;
        const RISK_FREE = 0.10;

        const strikeStep = params.index === "SENSEX" ? 100 : 50;
        const atmStrike = Math.round(entryPrice / strikeStep) * strikeStep;

        const entryDateObj = new Date(candles[entryCandleIndex][0]);
        const expiryDate = getNextExpiry(entryDateObj, params.index);

        const getT = (candleTime) => {
            const diff = expiryDate.getTime() - new Date(candleTime).getTime();
            return Math.max(0, diff / (1000 * 60 * 60 * 24 * 365.25));
        };

        const entryT = getT(candles[entryCandleIndex][0]);
        const entryPremium = blackScholes(entryPrice, atmStrike, entryT, IV, RISK_FREE, params.optionType);

        // Loop from Next Candle until End
        for (let i = entryCandleIndex + 1; i < candles.length; i++) {
            const c = candles[i];
            const cTime = new Date(c[0]);
            const currentSpot = c[4]; // Close

            // Check Time Exit
            if (cTime.getHours() > exitH || (cTime.getHours() === exitH && cTime.getMinutes() >= exitM)) {
                exitPrice = currentSpot;
                exitReason = "Time Exit";
                exitIndex = i;
                break;
            }

            // Check Stop Loss
            // We need to calculate current PnL in POINTS to check SL.
            // Spot Change
            const spotChange = currentSpot - entryPrice;

            // Premium Change approx = SpotChange * Delta * DirectionMultiplier (sort of)
            // Wait, standard Delta logic:
            // CE Delta ~ 0.5. Spot +10 -> CE +5.
            // PE Delta ~ -0.5. Spot -10 -> PE +5.

            // Let's simplify: 
            // Current PnL Points = (SpotPrice - EntrySpotPrice) * DirectionFactor * Delta
            // Where DirectionFactor is:
            // Buy CE: +1 (Long Underlying)
            // Buy PE: -1 (Short Underlying)
            // Sell CE: -1 (Short Underlying)
            // Sell PE: +1 (Long Underlying)

            // Only strictly true for Buy. Selling is inverse.

            // Let's refine Direction logic:
            // "Long Delta" strategy (Buy CE, Sell PE) benefits from Up move.
            // "Short Delta" strategy (Buy PE, Sell CE) benefits from Down move.

            // Black-Scholes Spot Price Check
            const currentT = getT(c[0]);
            const currentPremium = blackScholes(currentSpot, atmStrike, currentT, IV, RISK_FREE, params.optionType);

            let pointsChange = 0;
            if (params.position === "BUY") {
                pointsChange = currentPremium - entryPremium;
            } else {
                pointsChange = entryPremium - currentPremium;
            }

            // SL Check
            // SL is usually a negative number logic. e.g. if PointsChange < -SL
            // User inputs SL as positive "30 points". So if PnL is < -30.
            if (pointsChange <= -Number(params.stopLoss)) {
                exitPrice = currentSpot; // This assumes we exited exactly at close, practically maybe worse.
                exitReason = "Stop Loss";
                exitIndex = i;
                break;
            }
        }

        if (exitIndex === -1) {
            // Didn't exit by valid logic (maybe data ran out before exit time)
            exitPrice = candles[candles.length - 1][4];
        }

        // --- FINAL COMPUTE (BLACK-SCHOLES) ---
        const exitT = getT(candles[exitIndex][0]);
        const exitPremium = blackScholes(exitPrice, atmStrike, exitT, IV, RISK_FREE, params.optionType);

        let pointsPnL = 0;
        if (params.position === "BUY") {
            pointsPnL = exitPremium - entryPremium;
        } else {
            pointsPnL = entryPremium - exitPremium;
        }

        const totalSpotMove = exitPrice - entryPrice;
        const numLots = Number(params.lots) || 1;
        const totalPnL = pointsPnL * LOT_SIZE * numLots;

        const tradeSymbol = `${params.index} ${atmStrike} ${params.optionType}`;

        // Detailed Math for Verification
        const entryBS = blackScholesDetails(entryPrice, atmStrike, entryT, IV, RISK_FREE, params.optionType);
        const exitBS = blackScholesDetails(exitPrice, atmStrike, exitT, IV, RISK_FREE, params.optionType);

        const debugPayload = {
            totalCandles: candles.length,
            expiryDate: expiryDate.toISOString().split('T')[0],
            iv: IV,
            riskFree: RISK_FREE,
            entryT: entryT.toFixed(6),
            exitT: exitT.toFixed(6),
            entryPremium: entryPremium.toFixed(2),
            exitPremium: exitPremium.toFixed(2),
            theoreticalPnl: pointsPnL.toFixed(2),
            entryMath: entryBS,
            exitMath: exitBS
        };
        console.log("DEBUG PAYLOAD:", debugPayload);

        return {
            date: dateString,
            signal: `${params.position} ${params.optionType}`,
            symbol: tradeSymbol,
            strike: atmStrike,
            entryPrice: entryPrice.toFixed(2),
            exitPrice: exitPrice.toFixed(2),
            spotMove: totalSpotMove,
            optionPoints: pointsPnL,
            pnl: Math.round(totalPnL * 100) / 100,
            exitReason,
            debugData: debugPayload
        };
    }

    // Helper: Dates between 2 strings
    getBusinessDatesCount(startDate, endDate) {
        let count = 0;
        const curDate = new Date(startDate);
        const lastDate = new Date(endDate);
        const dates = [];

        while (curDate <= lastDate) {
            const dayOfWeek = curDate.getDay();
            if (dayOfWeek !== 0 && dayOfWeek !== 6) {
                dates.push(curDate.toISOString().split('T')[0]);
            }
            curDate.setDate(curDate.getDate() + 1);
        }
        return dates;
    }
}

module.exports = new BacktestService();
