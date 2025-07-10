import { useState, useEffect } from "react";
import { ethers } from "ethers";
import SimpleSwapABI from "@/contracts/SimpleSwapABI";

function App() {
  const [account, setAccount] = useState("");
  const [contract, setContract] = useState(null);
  const [tokenA, setTokenA] = useState("");
  const [tokenB, setTokenB] = useState("");

  const contractAddress = "0x500B4Bcd4Bf8AdD8a3bE9934d930ab04592bc84d";

  // Inicializa el contrato cuando se conecta la wallet
  useEffect(() => {
    if (window.ethereum && account) {
      const initContract = async () => {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const contract = new ethers.Contract(
          contractAddress,
          SimpleSwapABI,
          signer
        );
        setContract(contract);

        try {
          const tokenAAddress = await contract.tokenA();
          const tokenBAddress = await contract.tokenB();
          setTokenA(tokenAAddress);
          setTokenB(tokenBAddress);
        } catch (e) {
          console.log("Error obteniendo tokens:", e);
        }
      };
      initContract();
    }
  }, [account]);

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.send("eth_requestAccounts", []);
        setAccount(accounts[0]);
      } catch (error) {
        console.error("Error conectando wallet:", error);
        alert("Error al conectar la wallet");
      }
    } else {
      alert("¡Instala MetaMask!");
    }
  };

  // Función para añadir liquidez
  const addLiquidity = async () => {
    if (!contract) return;

    try {
      const tx = await contract.addLiquidity(
        tokenA,
        tokenB,
        ethers.parseEther("1"), // Cantidad TokenA
        ethers.parseEther("1"), // Cantidad TokenB
        0, // amountAMin
        0, // amountBMin
        account,
        Math.floor(Date.now() / 1000) + 300 // Deadline (5 minutos)
      );
      await tx.wait();
      alert("¡Liquidez añadida exitosamente!");
    } catch (error) {
      console.error("Error añadiendo liquidez:", error);
      alert("Operación fallida");
    }
  };

  // Función para hacer swap
  const swapTokens = async () => {
    if (!contract) return;

    try {
      const tx = await contract.swapExactTokensForTokens(
        ethers.parseEther("0.1"), // amountIn
        0, // amountOutMin
        [tokenA, tokenB], // path
        account,
        Math.floor(Date.now() / 1000) + 300 // Deadline
      );
      await tx.wait();
      alert("¡Swap realizado exitosamente!");
    } catch (error) {
      console.error("Error en swap:", error);
      alert("Swap fallido");
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "600px", margin: "0 auto" }}>
      <h1>SimpleSwap</h1>

      {!account ? (
        <button
          onClick={connectWallet}
          style={{
            padding: "10px 15px",
            backgroundColor: "#f6851b",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          Conectar MetaMask
        </button>
      ) : (
        <div>
          <div style={{ marginBottom: "20px" }}>
            <p>
              Cuenta:{" "}
              <strong>
                {account.slice(0, 6)}...{account.slice(-4)}
              </strong>
            </p>
            <p>
              Contrato:{" "}
              <strong>
                {contractAddress.slice(0, 6)}...{contractAddress.slice(-4)}
              </strong>
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
            <h3>Administrar Liquidez</h3>
            <button
              onClick={addLiquidity}
              style={{
                padding: "10px 15px",
                backgroundColor: "#27ae60",
                color: "white",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
                marginRight: "10px",
              }}
            >
              Añadir Liquidez (1:1)
            </button>
          </div>

          <div
            style={{
              border: "1px solid #ddd",
              padding: "20px",
              borderRadius: "10px",
            }}
          >
            <h3>Intercambiar Tokens</h3>
            <button
              onClick={swapTokens}
              style={{
                padding: "10px 15px",
                backgroundColor: "#2d9cdb",
                color: "white",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
              }}
            >
              Swap 0.1 TokenA → TokenB
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
