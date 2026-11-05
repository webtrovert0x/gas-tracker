import { formatEther, formatGwei } from 'viem';

const DEFAULT_RPC = 'https://rpc.bohr.life';

/**
 * Generic JSON-RPC caller directly contacting BOT Chain Testnet
 */
export async function rpcCall(method, params = [], customRpc) {
  const rpcUrl = customRpc || DEFAULT_RPC;
  const res = await fetch(rpcUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: Date.now(),
      method,
      params,
    }),
  });

  if (!res.ok) {
    throw new Error(`RPC HTTP Error: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  if (data.error) {
    throw new Error(`RPC Call Error [${method}]: ${data.error.message || JSON.stringify(data.error)}`);
  }

  return data.result;
}

/**
 * Fetches current gas price from BOT Chain Testnet
 */
export async function getCurrentGasInfo() {
  const [gasPriceHex, blockNumHex] = await Promise.all([
    rpcCall('eth_gasPrice'),
    rpcCall('eth_blockNumber'),
  ]);

  const gasPriceWei = BigInt(gasPriceHex);
  const gasPriceGwei = Number(gasPriceWei) / 1e9;
  const blockNumber = parseInt(blockNumHex, 16);

  // Fetch the latest block to get baseFee (if EIP-1559) and gasLimit
  const latestBlock = await rpcCall('eth_getBlockByNumber', [blockNumHex, false]);
  const baseFeeWei = latestBlock?.baseFeePerGas ? BigInt(latestBlock.baseFeePerGas) : 0n;
  const baseFeeGwei = Number(baseFeeWei) / 1e9;
  const gasLimit = latestBlock?.gasLimit ? BigInt(latestBlock.gasLimit) : 0n;
  const gasUsed = latestBlock?.gasUsed ? BigInt(latestBlock.gasUsed) : 0n;

  // Real estimates based on current network gas price
  return {
    gasPriceWei: gasPriceWei.toString(),
    gasPriceGwei: gasPriceGwei.toFixed(4),
    baseFeeWei: baseFeeWei.toString(),
    baseFeeGwei: baseFeeGwei.toFixed(4),
    safeLowGwei: (gasPriceGwei * 0.9).toFixed(3),
    standardGwei: gasPriceGwei.toFixed(3),
    fastGwei: (gasPriceGwei * 1.25).toFixed(3),
    blockNumber,
    gasLimit: gasLimit.toString(),
    gasUsed: gasUsed.toString(),
    blockFullnessPercent: gasLimit > 0n ? ((Number(gasUsed) / Number(gasLimit)) * 100).toFixed(2) : '0.00',
    timestamp: latestBlock?.timestamp ? parseInt(latestBlock.timestamp, 16) : Math.floor(Date.now() / 1000),
  };
}

/**
 * Fetches a range of recent blocks with full transactions
 */
export async function getRecentBlocksWithStats(count = 10) {
  const blockNumHex = await rpcCall('eth_blockNumber');
  const latest = parseInt(blockNumHex, 16);

  const blockPromises = [];
  for (let i = 0; i < count; i++) {
    const bNum = latest - i;
    if (bNum < 0) break;
    blockPromises.push(
      rpcCall('eth_getBlockByNumber', ['0x' + bNum.toString(16), true]).catch(() => null)
    );
  }

  const rawBlocks = await Promise.all(blockPromises);
  const blocks = rawBlocks.filter(Boolean);

  let totalGasUsed = 0n;
  let totalTransactions = 0;
  const txCandidates = [];

  const trendData = blocks.map((b) => {
    const bNumber = parseInt(b.number, 16);
    const bGasUsed = BigInt(b.gasUsed || '0x0');
    const bGasLimit = BigInt(b.gasLimit || '0x1');
    const txCount = b.transactions ? b.transactions.length : 0;
    const fullness = ((Number(bGasUsed) / Number(bGasLimit)) * 100);

    totalGasUsed += bGasUsed;
    totalTransactions += txCount;

    if (b.transactions && b.transactions.length > 0) {
      b.transactions.forEach((tx) => {
        if (typeof tx === 'object') {
          txCandidates.push({
            hash: tx.hash,
            blockNumber: bNumber,
            from: tx.from,
            to: tx.to,
            gasLimit: BigInt(tx.gas || '0x0'),
            gasPrice: BigInt(tx.gasPrice || '0x0'),
            value: BigInt(tx.value || '0x0'),
          });
        }
      });
    }

    return {
      blockNumber: bNumber,
      gasUsed: Number(bGasUsed),
      gasLimit: Number(bGasLimit),
      fullnessPercent: Number(fullness.toFixed(2)),
      txCount,
      timestamp: parseInt(b.timestamp, 16),
    };
  }).reverse(); // chronological order for trend charts

  const avgGasPerTx = totalTransactions > 0
    ? (Number(totalGasUsed) / totalTransactions).toFixed(0)
    : '0';

  return {
    latestBlock: latest,
    blocks: trendData,
    totalTransactions,
    avgGasPerTx,
    txCandidates,
  };
}

/**
 * Inspects a specific transaction hash using receipts and RPC data
 */
export async function inspectTransaction(txHash) {
  const cleanHash = txHash.trim();
  if (!cleanHash.startsWith('0x') || cleanHash.length !== 66) {
    throw new Error('Invalid transaction hash format. Expected 0x prefixed 64 hex characters.');
  }

  const [tx, receipt] = await Promise.all([
    rpcCall('eth_getTransactionByHash', [cleanHash]),
    rpcCall('eth_getTransactionReceipt', [cleanHash]),
  ]);

  if (!tx || !receipt) {
    throw new Error(`Transaction ${cleanHash} not found on BOT Chain Testnet. It may be pending or the hash is invalid.`);
  }

  const gasUsed = BigInt(receipt.gasUsed || '0x0');
  const gasLimit = BigInt(tx.gas || '0x0');
  const effectiveGasPrice = BigInt(receipt.effectiveGasPrice || tx.gasPrice || '0x0');
  const totalCostWei = gasUsed * effectiveGasPrice;
  const totalCostBOT = formatEther(totalCostWei);
  const gasUsedRatio = gasLimit > 0n ? ((Number(gasUsed) / Number(gasLimit)) * 100).toFixed(2) : '0';

  // Attempt trace if debug API is enabled
  let traceData = null;
  let traceSupported = false;
  try {
    const trace = await rpcCall('debug_traceTransaction', [cleanHash, { tracer: 'callTracer' }]);
    if (trace) {
      traceData = trace;
      traceSupported = true;
    }
  } catch {
    // Debug API not enabled on public testnet node, fallback to opcode estimation
    traceSupported = false;
  }

  // Fetch block to compare with block average
  const block = await rpcCall('eth_getBlockByNumber', [receipt.blockNumber, false]);
  const blockGasUsed = block ? BigInt(block.gasUsed || '0x0') : 0n;
  const blockTxCount = block?.transactions?.length || 1;
  const blockAvgGas = blockTxCount > 0 ? Number(blockGasUsed) / blockTxCount : Number(gasUsed);

  // Standard benchmark comparisons
  const STANDARD_TRANSFER_GAS = 21000;
  const STANDARD_ERC20_GAS = 65000;
  const STANDARD_SWAP_GAS = 140000;

  return {
    hash: tx.hash,
    blockNumber: parseInt(receipt.blockNumber, 16),
    blockHash: receipt.blockHash,
    from: tx.from,
    to: tx.to,
    contractInvolved: receipt.contractAddress || tx.to || 'Contract Deployment',
    isContractCreation: !!receipt.contractAddress,
    status: receipt.status === '0x1' ? 'Success' : 'Reverted',
    statusCode: receipt.status,
    gasUsed: gasUsed.toString(),
    gasLimit: gasLimit.toString(),
    gasUsedPercent: gasUsedRatio,
    effectiveGasPriceWei: effectiveGasPrice.toString(),
    effectiveGasPriceGwei: formatGwei(effectiveGasPrice),
    totalCostWei: totalCostWei.toString(),
    totalCostBOT,
    cumulativeGasUsed: receipt.cumulativeGasUsed ? BigInt(receipt.cumulativeGasUsed).toString() : '0',
    logsCount: receipt.logs ? receipt.logs.length : 0,
    inputDataLength: tx.input ? (tx.input.length - 2) / 2 : 0,
    methodId: tx.input && tx.input.length >= 10 ? tx.input.slice(0, 10) : '0x (Standard Transfer)',
    nonce: parseInt(tx.nonce, 16),
    type: tx.type || '0x0',
    traceSupported,
    traceData,
    comparisons: {
      vsStandardTransfer: (Number(gasUsed) / STANDARD_TRANSFER_GAS).toFixed(2),
      vsErc20Transfer: (Number(gasUsed) / STANDARD_ERC20_GAS).toFixed(2),
      vsDexSwap: (Number(gasUsed) / STANDARD_SWAP_GAS).toFixed(2),
      vsBlockAverage: blockAvgGas > 0 ? (Number(gasUsed) / blockAvgGas).toFixed(2) : '1.00',
    },
  };
}

/**
 * Inspects a contract address across a block range
 */
export async function inspectContractGas(contractAddress, fromBlock, toBlock) {
  const cleanAddr = contractAddress.trim().toLowerCase();
  if (!cleanAddr.startsWith('0x') || cleanAddr.length !== 42) {
    throw new Error('Invalid contract address format. Expected 0x prefixed 40 hex characters.');
  }

  // Get bytecode to verify it is a contract
  const code = await rpcCall('eth_getCode', [cleanAddr, 'latest']);
  const isContract = code && code !== '0x' && code !== '0x0';

  const startBlock = Number(fromBlock);
  const endBlock = Number(toBlock);

  if (endBlock < startBlock) {
    throw new Error('End block must be greater than or equal to start block.');
  }

  // Cap scan range to prevent browser freezing / RPC throttling
  const maxRange = 100;
  const actualEnd = Math.min(endBlock, startBlock + maxRange);

  // Fetch block receipts or scan transactions in those blocks
  const blockPromises = [];
  for (let b = startBlock; b <= actualEnd; b++) {
    blockPromises.push(rpcCall('eth_getBlockByNumber', ['0x' + b.toString(16), true]).catch(() => null));
  }

  const blocks = (await Promise.all(blockPromises)).filter(Boolean);

  const matchedTxs = [];
  blocks.forEach((block) => {
    if (block.transactions) {
      block.transactions.forEach((tx) => {
        if (
          tx.to && tx.to.toLowerCase() === cleanAddr
        ) {
          matchedTxs.push(tx);
        }
      });
    }
  });

  // Fetch receipts for matched transactions to get accurate gasUsed
  const receiptPromises = matchedTxs.map(tx =>
    rpcCall('eth_getTransactionReceipt', [tx.hash]).catch(() => null)
  );
  const receipts = (await Promise.all(receiptPromises)).filter(Boolean);

  let totalGasUsed = 0n;
  let totalCostWei = 0n;
  const methodMap = {};
  const txDetails = [];

  receipts.forEach((r) => {
    const tx = matchedTxs.find(t => t.hash.toLowerCase() === r.transactionHash.toLowerCase());
    const gUsed = BigInt(r.gasUsed || '0x0');
    const gPrice = BigInt(r.effectiveGasPrice || tx?.gasPrice || '0x0');
    const cost = gUsed * gPrice;

    totalGasUsed += gUsed;
    totalCostWei += cost;

    const method = tx?.input && tx.input.length >= 10 ? tx.input.slice(0, 10) : '0x (Fallback/Transfer)';
    if (!methodMap[method]) {
      methodMap[method] = { count: 0, totalGas: 0n, methodId: method };
    }
    methodMap[method].count += 1;
    methodMap[method].totalGas += gUsed;

    txDetails.push({
      hash: r.transactionHash,
      blockNumber: parseInt(r.blockNumber, 16),
      gasUsed: gUsed.toString(),
      effectiveGasPriceGwei: formatGwei(gPrice),
      totalCostBOT: formatEther(cost),
      method,
      status: r.status === '0x1' ? 'Success' : 'Revert',
    });
  });

  // Calculate method breakdown
  const methodBreakdown = Object.values(methodMap).map(m => ({
    methodId: m.methodId,
    callCount: m.count,
    totalGasUsed: m.totalGas.toString(),
    avgGasUsed: (Number(m.totalGas) / m.count).toFixed(0),
  })).sort((a, b) => Number(b.totalGasUsed) - Number(a.totalGasUsed));

  const interactionCount = receipts.length;
  const avgGas = interactionCount > 0 ? (Number(totalGasUsed) / interactionCount).toFixed(0) : '0';

  return {
    contractAddress: cleanAddr,
    isContract,
    fromBlock: startBlock,
    toBlock: actualEnd,
    scannedBlocks: blocks.length,
    interactionsCount: interactionCount,
    totalGasUsed: totalGasUsed.toString(),
    totalCostBOT: formatEther(totalCostWei),
    avgGasPerInteraction: avgGas,
    methodBreakdown,
    transactions: txDetails,
  };
}

