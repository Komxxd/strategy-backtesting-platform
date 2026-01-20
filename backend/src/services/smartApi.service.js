
const { SmartAPI } = require("smartapi-javascript");
// Removed unused import 
// Wait, smartapi-javascript generateSession takes "totp" as 3rd arg now? Or is it separate?
// Looking at docs: smart_api.generateSession(CLIENT_CODE, PASSWORD, TOTP) is common custom implementation or sometimes just 2 args. 
// However, typically one needs a TOTP generator package.
// I will blindly trust the standard flow: Client Code + Password + TOTP.
// I might need to install 'otpauth' or 'speakeasy' to generate TOTP from the secret in .env.
// I see 'speakeasy' is in package.json. Excellent.

const speakeasy = require("speakeasy");

class SmartApiService {
    constructor() {
        this.smartApi = new SmartAPI({
            api_key: process.env.SMARTAPI_API_KEY,
        });
        this.session = null;
    }

    async login() {
        try {
            const totp = speakeasy.totp({
                secret: process.env.SMARTAPI_TOTP_SECRET,
                encoding: "base32"
            });

            const data = await this.smartApi.generateSession(
                process.env.SMARTAPI_CLIENT_ID,
                process.env.SMARTAPI_PASSWORD,
                totp
            );

            if (data.status) {
                this.session = data.data;
                console.log("SmartAPI Session Generated");
                return true;
            } else {
                console.error("SmartAPI Login Failed:", data.message);
                return false;
            }
        } catch (error) {
            console.error("SmartAPI Login Error:", error);
            return false;
        }
    }

    async getCandleData({ exchange, symbolToken, interval, fromDate, toDate }) {
        // Interval: 'ONE_MINUTE', 'FIVE_MINUTE', 'ONE_DAY', etc.
        // Dates: 'yyyy-mm-dd HH:MM' format usually.

        if (!this.session) {
            await this.login();
        }

        try {
            const response = await this.smartApi.getCandleData({
                exchange,
                symboltoken: symbolToken,
                interval,
                fromdate: fromDate,
                todate: toDate
            });

            if (response.status && response.data) {
                return response.data;
                // Format: [timestamp, open, high, low, close, volume]
            } else {
                console.error("Get Candle Data Failed", response.message);
                return [];
            }
        } catch (error) {
            console.error("Get Candle Data Error", error);
            return [];
        }
    }

    // Helper to get Index Token
    getIndexToken(indexName) {
        // Hardcoded for major indices usually found in NSE
        // Note: These might change, but standard NSE indices are usually consistent or found in master.
        // Nifty 50: 99926000
        // Bank Nifty: 99926009
        if (indexName === "NIFTY") return "99926000";
        if (indexName === "SENSEX") return "99919000"; // Bess Check
        return "99926000";
    }
}

module.exports = new SmartApiService();
