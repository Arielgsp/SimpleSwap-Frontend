import { useState, useEffect } from "react";
import { ethers } from "ethers";
import SimpleSwapABI from "./contracts/SimpleSwapABI";

function App() {
  const [account, setAccount] = useState("");
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(false);

  const tokenAAddress = "0x06de08ed84b3ca69117d9f725851d4311343392f";
  const tokenBAddress = "0xb96e56b1d76d11379c516374788ecdf0a72e1a05";
  const contractAddress = "0x500B4Bcd4Bf8AdD8a3bE9934d930ab04592bc84d";

  const connectWallet = async () => {
    try {
      setLoading(true);
      if (!window.ethereum) throw new Error("Instala MetaMask");

      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      setAccount(accounts[0]);
    } catch (error) {
      console.error("Error conectando wallet:", error);
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!account) return;

    const initContract = async () => {
      try {
        setLoading(true);
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();

        const contract = new ethers.Contract(
          contractAddress,
          SimpleSwapABI,
          signer
        );

        setContract(contract);
        console.log("Contrato listo");
      } catch (error) {
        console.error("Error inicializando contrato:", error);
        alert(`Error: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };
    initContract();
  }, [account]);

  const addLiquidity = async () => {
    if (!contract) return;

    try {
      setLoading(true);
      const tx = await contract.addLiquidity(
        tokenAAddress,
        tokenBAddress,
        ethers.parseEther("1"),
        ethers.parseEther("1"),
        0,
        0,
        account,
        Math.floor(Date.now() / 1000) + 300
      );
      await tx.wait();
      alert("Liquidez añadida exitosamente");
    } catch (error) {
      console.error("Error añadiendo liquidez:", error);
      alert(`Error: ${error.reason || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const swapTokens = async () => {
    if (!contract) return;

    try {
      setLoading(true);
      const tx = await contract.swapExactTokensForTokens(
        ethers.parseEther("0.1"),
        0,
        [tokenAAddress, tokenBAddress],
        account,
        Math.floor(Date.now() / 1000) + 300
      );
      await tx.wait();
      alert("Swap realizado exitosamente");
    } catch (error) {
      console.error("Error en swap:", error);
      alert(`Error: ${error.reason || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "600px", margin: "0 auto" }}>
      <h1>SimpleSwap</h1>

      {!account ? (
        <button
          onClick={connectWallet}
          disabled={loading}
          style={{
            padding: "10px 15px",
            backgroundColor: loading ? "#cccccc" : "#f6851b",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Conectando..." : "Conectar MetaMask"}
        </button>
      ) : (
        <div>
          <div style={{ marginBottom: "20px" }}>
            <p>
              Cuenta conectada: {account.slice(0, 6)}...{account.slice(-4)}
            </p>
          </div>

          <div
            style={{
              border: "1px solid #ddd",
              padding: "20px",
              borderRadius: "10px",
              marginBottom: "20px",
            }}
          >
            <button
              onClick={addLiquidity}
              disabled={loading}
              style={{
                padding: "10px 15px",
                backgroundColor: loading ? "#cccccc" : "#27ae60",
                color: "white",
                border: "none",
                borderRadius: "5px",
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Procesando..." : "Añadir Liquidez (1:1)"}
            </button>
          </div>

          <div
            style={{
              border: "1px solid #ddd",
              padding: "20px",
              borderRadius: "10px",
            }}
          >
            <button
              onClick={swapTokens}
              disabled={loading}
              style={{
                padding: "10px 15px",
                backgroundColor: loading ? "#cccccc" : "#2d9cdb",
                color: "white",
                border: "none",
                borderRadius: "5px",
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Procesando..." : "Swap 0.1 TokenA → TokenB"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
