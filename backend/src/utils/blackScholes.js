
// Standard Normal cumulative distribution function
function CND(x) {
    var a1 = 0.31938153, a2 = -0.356563782, a3 = 1.781477937, a4 = -1.821255978, a5 = 1.330274429;
    var p = 0.2316419;
    var k = 1.0 / (1.0 + p * Math.abs(x));
    var w = 1.0 - 1.0 / Math.sqrt(2 * Math.PI) * Math.exp(-x * x / 2) * (a1 * k + a2 * k * k + a3 * Math.pow(k, 3) + a4 * Math.pow(k, 4) + a5 * Math.pow(k, 5));

    if (x < 0.0) {
        return 1.0 - w;
    }
    return w;
}

/**
 * Calculates the Black-Scholes option price.
 * Returns just the price (number).
 */
function blackScholes(s, k, t, v, r, type) {
    if (t <= 0) {
        if (type === 'CE') return Math.max(0, s - k);
        else return Math.max(0, k - s);
    }

    var d1 = (Math.log(s / k) + (r + v * v / 2.0) * t) / (v * Math.sqrt(t));
    var d2 = d1 - v * Math.sqrt(t);

    if (type === 'e') { // Legacy support if 'e' passed? Usually 'CE'. Fix logic below.
        // Assuming strict 'CE' or 'PE'
    }

    if (type === 'CE') {
        return s * CND(d1) - k * Math.exp(-r * t) * CND(d2);
    } else {
        return k * Math.exp(-r * t) * CND(-d2) - s * CND(-d1);
    }
}

/**
 * Returns full details of BS calculation.
 */
function blackScholesDetails(s, k, t, v, r, type) {
    if (t <= 0) {
        const val = type === 'CE' ? Math.max(0, s - k) : Math.max(0, k - s);
        return { price: val, d1: 0, d2: 0, nd1: 0, nd2: 0, s, k, t, v, r };
    }

    var d1 = (Math.log(s / k) + (r + v * v / 2.0) * t) / (v * Math.sqrt(t));
    var d2 = d1 - v * Math.sqrt(t);

    var nd1 = CND(d1);
    var nd2 = CND(d2);
    var n_d1 = CND(-d1);
    var n_d2 = CND(-d2);

    let price = 0;
    if (type === 'CE') {
        price = s * nd1 - k * Math.exp(-r * t) * nd2;
        return { price, d1, d2, nd1, nd2, term1: s * nd1, term2: k * Math.exp(-r * t) * nd2, s, k, t, v, r };
    } else {
        price = k * Math.exp(-r * t) * n_d2 - s * n_d1;
        return { price, d1, d2, nd1: n_d1, nd2: n_d2, term1: k * Math.exp(-r * t) * n_d2, term2: s * n_d1, s, k, t, v, r };
    }
}

const HOLIDAYS = new Set([
    "2024-01-26", "2024-05-01", "2024-08-15", "2024-10-02", "2024-12-25",
    "2025-01-26", "2025-05-01", "2025-08-15", "2025-10-02", "2025-12-25",
    "2026-01-26", "2026-05-01", "2026-08-15", "2026-10-02", "2026-12-25",
]);

function getNextExpiry(dateObj, index) {
    const targetDay = index === "SENSEX" ? 4 : 2;
    const currentDay = dateObj.getDay();

    let daysUntil = targetDay - currentDay;
    if (daysUntil < 0) {
        daysUntil += 7;
    }

    const expiry = new Date(dateObj);
    expiry.setDate(dateObj.getDate() + daysUntil);

    while (true) {
        const dateStr = expiry.toISOString().split('T')[0];
        const day = expiry.getDay();

        if (HOLIDAYS.has(dateStr) || day === 0 || day === 6) {
            expiry.setDate(expiry.getDate() - 1);
        } else {
            break;
        }
    }

    expiry.setHours(15, 30, 0, 0);
    return expiry;
}

module.exports = { blackScholes, blackScholesDetails, getNextExpiry };
