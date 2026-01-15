
// Normal distribution functions
function std_n_cdf(x) {
    var b1 = 0.319381530;
    var b2 = -0.356563782;
    var b3 = 1.781477937;
    var b4 = -1.821255978;
    var b5 = 1.330274429;
    var p = 0.2316419;
    var c2 = 0.39894228;

    if (x > 6.0) return 1.0;
    if (x < -6.0) return 0.0;

    var t = 1.0 / (1.0 + p * Math.abs(x));
    var b = t * (b1 + t * (b2 + t * (b3 + t * (b4 + t * b5))));
    var n = c2 * Math.exp(-x * x / 2.0);
    var cdf = 1.0 - n * b;

    return x >= 0 ? cdf : 1.0 - cdf;
}

function std_n_pdf(x) {
    return Math.exp(-0.5 * x * x) / Math.sqrt(2.0 * Math.PI);
}

// ---------------------------------------------------------
// 1. PRICING FUNCTIONS (Black-Scholes)
// ---------------------------------------------------------

export function calculatebs(S, K, T, r, v, type) {
    if (T <= 0) return 0; // Expired

    var d1 = (Math.log(S / K) + (r + 0.5 * v * v) * T) / (v * Math.sqrt(T));
    var d2 = d1 - v * Math.sqrt(T);

    if (type === 'call') {
        return S * std_n_cdf(d1) - K * Math.exp(-r * T) * std_n_cdf(d2);
    } else {
        return K * Math.exp(-r * T) * std_n_cdf(-d2) - S * std_n_cdf(-d1);
    }
}

// Vega (Derivative of Price w.r.t Volatility)
function calculateVega(S, K, T, r, v) {
    var d1 = (Math.log(S / K) + (r + 0.5 * v * v) * T) / (v * Math.sqrt(T));
    return S * std_n_pdf(d1) * Math.sqrt(T);
}

// ---------------------------------------------------------
// 2. IMPLIED VOLATILITY (Numerical Solve)
// ---------------------------------------------------------

function getImpliedVolatility(marketPrice, S, K, T, r, type) {
    let sigma = 0.5; // Initial guess (50%)
    const MAX_ITERATIONS = 20;
    const PRECISION = 0.0001;

    for (let i = 0; i < MAX_ITERATIONS; i++) {
        const price = calculatebs(S, K, T, r, sigma, type);
        const vega = calculateVega(S, K, T, r, sigma);

        const diff = marketPrice - price;

        if (Math.abs(diff) < PRECISION) return sigma;
        if (Math.abs(vega) < 0.00001) return sigma; // Avoid divide by zero

        sigma = sigma + diff / vega;

        // Clamp sigma to reasonable bounds during iteration
        if (sigma <= 0.001) sigma = 0.001;
        if (sigma > 10) sigma = 10;
    }
    return sigma;
}

// ---------------------------------------------------------
// 3. GREEKS (Closed-form using solved Sigma)
// ---------------------------------------------------------

export function calculateGreeks(spot, strike, expiry, type, interestRate = 0.10, volatility = 0.20, marketPrice = null) {
    if (!spot || !strike || !expiry) return null;

    // Calculate T (years)
    const now = new Date();
    let expDate = new Date(expiry);

    if (isNaN(expDate.getTime())) return null;

    // Set expiry to 3:30 PM IST (market close)
    expDate.setHours(15, 30, 0, 0);

    let timeDiff = expDate.getTime() - now.getTime();

    // If expired
    if (timeDiff <= 0) {
        return { price: 0, delta: 0, theta: 0, gamma: 0, vega: 0, iv: 0 };
    }

    const T = timeDiff / (1000 * 60 * 60 * 24 * 365.25);
    // Prevent division by zero logic in formula for extremely small T
    const safeT = Math.max(T, 0.000001);

    // Step 2: Solve for IV if market price is provided
    let iv = volatility;

    if (marketPrice && marketPrice > 0.05) { // Only solve if price > 5 paise to avoid noise
        iv = getImpliedVolatility(marketPrice, spot, strike, safeT, interestRate, type);
    }

    // Ensure IV is sane (clamp between 1% and 500%)
    if (iv < 0.01) iv = 0.01;
    if (iv > 5.0) iv = 5.0;

    // Step 3: Compute Greeks using the (solved or default) IV
    var d1 = (Math.log(spot / strike) + (interestRate + 0.5 * iv * iv) * safeT) / (iv * Math.sqrt(safeT));
    var d2 = d1 - iv * Math.sqrt(safeT);

    var delta = 0;
    var theta = 0;

    // Gamma and Vega are same for Call/Put (approx)
    var gamma = std_n_pdf(d1) / (spot * iv * Math.sqrt(safeT));
    var vega = (spot * std_n_pdf(d1) * Math.sqrt(safeT)) / 100; // Divide by 100 for % change

    if (type === 'call') {
        delta = std_n_cdf(d1);
        theta = (- (spot * std_n_pdf(d1) * iv) / (2 * Math.sqrt(safeT)) - interestRate * strike * Math.exp(-interestRate * safeT) * std_n_cdf(d2)) / 365;
    } else {
        delta = std_n_cdf(d1) - 1;
        theta = (- (spot * std_n_pdf(d1) * iv) / (2 * Math.sqrt(safeT)) + interestRate * strike * Math.exp(-interestRate * safeT) * std_n_cdf(-d2)) / 365;
    }

    return {
        delta,
        gamma,
        theta,
        vega,
        iv: iv * 100 // Return as percentage for UI
    };
}
