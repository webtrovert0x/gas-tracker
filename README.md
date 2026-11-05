# BOT GasTracker — BOT Chain Gas Analytics Platform

A dedicated, high-performance gas analytics platform for **BOT Chain Testnet** designed to help developers and users dissect transaction costs, gas consumption patterns, and expensive smart contract interactions.

---

## 🌐 Network Parameters (BOT Chain Testnet)

* **Network Name:** BOT Chain Testnet
* **Chain ID:** `968`
* **RPC Endpoint:** `https://rpc.bohr.life`
* **Native Token:** `BOT`
* **Block Explorer:** [https://scan.bohr.life/](https://scan.bohr.life/)

---

## ⚡ Deployed Smart Contract (`BOTGasTracker.sol`)

The `BOTGasTracker.sol` contract coordinates on-chain gas inspection requests and cryptographically seals verifiable report hashes.

* **Deployed Address:** [`0x85d1352195c58b1c9583156a7f5d3140f4a70d56`](https://scan.bohr.life/address/0x85d1352195c58b1c9583156a7f5d3140f4a70d56)
* **Deployment Block:** `29339232`
* **Deployment Tx Hash:** [`0x26f9d6ce94686f1c4d28c690ec6855986150ffda4639b27161e8d458f3af7e37`](https://scan.bohr.life/tx/0x26f9d6ce94686f1c4d28c690ec6855986150ffda4639b27161e8d458f3af7e37)
* **Gas Used for Deployment:** `941,979` gas

### Key Functions
* `requestGasAnalysis(address target, uint256 fromBlock, uint256 toBlock)`: Generates a unique request ID, logs requester, target contract, and block range, and emits `GasAnalysisRequested`.
* `getRequest(bytes32 requestId)`: Returns stored details of any registered analysis request.
* `publishResult(bytes32 requestId, bytes32 reportHash)`: Restricted to authorized analyzers and the owner to publish verified analysis report hashes.

---

## 🔍 Zero-Fake-Data Inspection Engine

> **Rule:** *Do not invent current gas prices or historical transaction information.*

All data in BOT GasTracker is queried directly from live JSON-RPC nodes on BOT Chain Testnet (`https://rpc.bohr.life`):
1. **Gas Price & Base Fees:** Fetched in real time via `eth_gasPrice` and `eth_getBlockByNumber`.
2. **Transaction Receipts:** Queried via `eth_getTransactionReceipt` and `eth_getTransactionByHash` to calculate accurate `gasUsed`, `effectiveGasPrice`, and `totalCostBOT`.
3. **Contract Analysis:** Evaluates logs and transactions interacting with target contracts across block windows, computing call frequency and method-by-method gas consumption heatmaps.

---

## 🎨 UI & Design Principles

* **Clean Flat Palette:** Uses solid slate surfaces (`#0f172a`, `#1e293b`), crisp borders (`#334155`), and accessible contrast.
* **No Glossy / No Gradients:** Conforms strictly to the flat, normal-color design requirement without blur, glassmorphism, or multi-color gradients.
* **SVG Trend Charts:** Lightweight, reactive vector charts visualizing Gas Used vs. Gas Limit without heavy canvas overhead.

---

## 📄 Application Pages

1. **Dashboard:**
   * Live gas price ticker (Base fee, standard, fast, safe low).
   * Average gas consumed per transaction.
   * Latest block fullness percentage (vs. 35M block limit).
   * Gas consumption trend chart across recent blocks.
   * List of recent transactions in the selected window with 1-click inspection.

2. **Gas Inspection:**
   * Target input: Transaction Hash (66 chars) or Contract Address (42 chars).
   * Range selection: Presets (10, 25, 50, 100 blocks) or custom start/end block numbers.
   * Analysis type: Comprehensive Gas Breakdown, Method Heatmap, or Trace Analysis.
   * Direct "Analyze Gas" execution with live RPC querying.

3. **Report:**
   * Transaction hash / contract target.
   * Gas used vs. Gas limit (% utilized).
   * Effective gas price and total transaction cost in `BOT`.
   * Contract and recipient addresses.
   * Block number and execution status (Success / Revert).
   * Benchmark comparison against standard transfers (21k), ERC-20 transfers (65k), DEX swaps (140k), and block averages.
   * Direct integration with `BOTGasTracker.sol` to submit requests or publish report hashes on-chain.

---

## 🔐 Security & Environment Variables

The project uses `.env` with strict separation between server-side credentials and client bundles:
* `PRIVATE_KEY`: Private key for deploying contracts (never exposed to client).
* `REOWN_ID`: Reown AppKit Project ID (kept server-side without the public `VITE_` prefix and served via dynamic server middleware `/api/config`).
* `BOT_GAS_TRACKER_ADDRESS`: Address of the deployed `BOTGasTracker.sol` contract.

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Check `.env`:
```env
PRIVATE_KEY=your_private_key_here
REOWN_ID=your_reown_project_id_here
RPC_URL=https://rpc.bohr.life
CHAIN_ID=968
NATIVE_TOKEN=BOT
EXPLORER_URL=https://scan.bohr.life/
BOT_GAS_TRACKER_ADDRESS=0x85d1352195c58b1c9583156a7f5d3140f4a70d56
```

### 3. Compile Smart Contract
```bash
npm run compile
```

### 4. Deploy Smart Contract (Optional / Already Deployed)
```bash
npm run deploy
```

### 5. Launch Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

