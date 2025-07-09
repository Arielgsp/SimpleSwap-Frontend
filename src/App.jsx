import { useState } from "react";
import { ethers } from "ethers";
import SimpleSwapABI from "./contracts/SimpleSwapABI.json";

function App() {
  const [account, setAccount] = useState("");

  const connectWallet = async () => {
    if (window.ethereum) {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      setAccount(accounts[0]);
    } else {
      alert("¡Instala MetaMask!");
    }
  };

  return (
    <div>
      <h1>SimpleSwap</h1>
      {account ? (
        <p>
          Conectado: {account.slice(0, 6)}...{account.slice(-4)}
        </p>
      ) : (
        <button onClick={connectWallet}>Conectar MetaMask</button>
      )}
    </div>
  );
}

export default App;
