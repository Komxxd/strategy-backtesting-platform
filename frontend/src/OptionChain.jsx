import { useEffect, useState } from "react";
import { getOptionChain } from "./api";

function OptionChain({ symbol }) {
  const [chain, setChain] = useState(null);
  const [expiry, setExpiry] = useState(null);

  useEffect(() => {
    if (!symbol) return;

    async function fetchChain() {
      const res = await getOptionChain({
        symbol,
        exchange: "NFO",
        expiry,
      });

      if (res.success) {
        setChain(res.data);
      } else {
        console.error("Option chain error", res);
      }
    }

    fetchChain();
  }, [symbol, expiry]);

  if (!chain) return null;

  return (
    <div style={{ marginTop: 20 }}>
      <h2>Option Chain – {chain.underlying}</h2>

      <p>Expiry: {chain.expiry}</p>

      <table border="1" cellPadding="6">
        <thead>
          <tr>
            <th>CE</th>
            <th>Strike</th>
            <th>PE</th>
          </tr>
        </thead>
        <tbody>
          {chain.chain.map((row) => (
            <tr key={row.strike}>
              <td>{row.CE ? "CE" : "-"}</td>
              <td>{row.strike}</td>
              <td>{row.PE ? "PE" : "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default OptionChain;
