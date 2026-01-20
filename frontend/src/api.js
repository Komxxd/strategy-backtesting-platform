
// API Service for Backtesting Platform
const BASE_URL = "http://localhost:5000/api";

export const healthCheck = async () => {
  try {
    const response = await fetch(`${BASE_URL}/health`);
    return await response.json();
  } catch (error) {
    console.error("Health check failed:", error);
    return { status: "error" };
  }
};
