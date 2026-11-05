import React, { useState } from 'react';
import {
  FileText,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Fuel,
  TrendingDown,
  Layers,
  ArrowRight,
  ShieldCheck,
  Send,
  Hash,
  Copy,
  Clock,
  Cpu
} from 'lucide-react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { keccak256, toHex, stringToBytes } from 'viem';
import { BOT_GAS_TRACKER_ABI } from '../contracts/BOTGasTrackerABI';

export function Report({ reportData, onInspectAnother, contractAddress }) {
  const { isConnected, address } = useAccount();
  const [copied, setCopied] = useState(false);
  const [onChainRequestId, setOnChainRequestId] = useState(null);
  const [publishHashInput, setPublishHashInput] = useState('');
  const [publishSuccess, setPublishSuccess] = useState(false);

  const { writeContract, data: txHash, isPending: isTxPending } = useWriteContract();
  const { isLoading: isWaitingForReceipt, isSuccess: isContractSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  if (!reportData) {
    return (
      <div className="max-w-4xl mx-auto bg-slate-800 border border-slate-700 rounded-lg p-10 text-center space-y-4">
        <FileText className="w-12 h-12 text-slate-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-200">No Gas Analysis Generated Yet</h2>
        <p className="text-sm text-slate-400 max-w-md mx-auto">
          Go to the Gas Inspection tab and enter a BOT Chain transaction hash or contract address to generate an in-depth audit report.
        </p>
        <button
          onClick={onInspectAnother}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium text-sm transition-colors"
        >
          Go to Gas Inspection
        </button>
      </div>
    );
  }

  const { type, data } = reportData;
  const isTx = type === 'transaction';

  // Compute a deterministic report hash for on-chain publishing
  const computedReportHash = keccak256(
    stringToBytes(
      JSON.stringify({
        target: isTx ? data.hash : data.contractAddress,
        gasUsed: isTx ? data.gasUsed : data.totalGasUsed,
        block: isTx ? data.blockNumber : `${data.fromBlock}-${data.toBlock}`,
      })
    )
  );

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Submit on-chain request to BOTGasTracker.sol
  const handleRequestOnChain = () => {
    if (!contractAddress) {
      alert('BOTGasTracker contract address is not configured yet. Deploy using "npm run deploy" or configure in .env');
      return;
    }

    const targetAddr = isTx ? (data.contractInvolved.startsWith('0x') && data.contractInvolved.length === 42 ? data.contractInvolved : data.from) : data.contractAddress;
    const fromBlock = isTx ? BigInt(data.blockNumber) : BigInt(data.fromBlock);
    const toBlock = isTx ? BigInt(data.blockNumber) : BigInt(data.toBlock);

    writeContract({
      address: contractAddress,
      abi: BOT_GAS_TRACKER_ABI,
      functionName: 'requestGasAnalysis',
      args: [targetAddr, fromBlock, toBlock],
    });
  };

  // Publish report hash on-chain (for authorized analyzer)
  const handlePublishResult = (reqId) => {
    if (!contractAddress) return;
    writeContract({
      address: contractAddress,
      abi: BOT_GAS_TRACKER_ABI,
      functionName: 'publishResult',
      args: [reqId, computedReportHash],
    });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Report Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-800 gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 text-xs bg-blue-900/60 text-blue-300 border border-blue-700 rounded font-mono">
              BOT Chain Testnet (968)
            </span>
            <span className="text-xs text-slate-400">
              Verified RPC Receipt Audit
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight mt-1">
            {isTx ? 'Transaction Gas Consumption Report' : 'Contract Gas Profile Report'}
          </h1>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={onInspectAnother}
            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-xs font-medium text-slate-300 transition-colors"
          >
            New Inspection
          </button>
        </div>
      </div>

      {isTx ? (
        /* SINGLE TRANSACTION REPORT */
        <div className="space-y-6">
          {/* Main Summary Card */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-700/80">
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded flex items-center justify-center ${
                  data.status === 'Success' ? 'bg-emerald-950 border border-emerald-700 text-emerald-400' : 'bg-red-950 border border-red-700 text-red-400'
                }`}>
                  {data.status === 'Success' ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Transaction Status</div>
                  <div className="text-base font-bold text-slate-100">{data.status}</div>
                </div>
              </div>

              <a
                href={`https://scan.bohr.life/tx/${data.hash}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center space-x-1.5 text-xs text-blue-400 hover:text-blue-300 underline font-medium"
              >
                <span>View on BOTScan</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Target Tx Hash Details */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              <div className="bg-slate-900 border border-slate-700/80 rounded p-3">
                <div className="text-slate-400 font-sans uppercase mb-1">Transaction Hash</div>
                <div className="text-slate-200 break-all flex items-center justify-between">
                  <span>{data.hash}</span>
                  <button onClick={() => handleCopy(data.hash)} className="text-slate-400 hover:text-slate-200 ml-2">
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-700/80 rounded p-3">
                <div className="text-slate-400 font-sans uppercase mb-1">Contract / Recipient Involved</div>
                <div className="text-slate-200 break-all flex items-center justify-between">
                  <span>{data.contractInvolved}</span>
                  <button onClick={() => handleCopy(data.contractInvolved)} className="text-slate-400 hover:text-slate-200 ml-2">
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Core Gas Metrics Grid */}
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-900 border border-slate-700 rounded">
                <div className="text-xs text-slate-400 uppercase">Gas Used</div>
                <div className="text-xl font-bold font-mono text-slate-100 mt-1">
                  {Number(data.gasUsed).toLocaleString()}
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  {data.gasUsedPercent}% of limit used
                </div>
              </div>

              <div className="p-4 bg-slate-900 border border-slate-700 rounded">
                <div className="text-xs text-slate-400 uppercase">Gas Limit</div>
                <div className="text-xl font-bold font-mono text-slate-100 mt-1">
                  {Number(data.gasLimit).toLocaleString()}
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  Allocated capacity
                </div>
              </div>

              <div className="p-4 bg-slate-900 border border-slate-700 rounded">
                <div className="text-xs text-slate-400 uppercase">Effective Gas Price</div>
                <div className="text-xl font-bold font-mono text-slate-100 mt-1">
                  {Number(data.effectiveGasPriceGwei).toFixed(2)} <span className="text-xs font-sans text-slate-400">Gwei</span>
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  {data.effectiveGasPriceWei} Wei
                </div>
              </div>

              <div className="p-4 bg-slate-900 border border-blue-900/60 rounded">
                <div className="text-xs text-blue-400 uppercase font-semibold">Total Tx Cost</div>
                <div className="text-xl font-bold font-mono text-blue-200 mt-1">
                  {Number(data.totalCostBOT).toFixed(6)} <span className="text-xs font-sans text-blue-300">BOT</span>
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  Native gas fee
                </div>
              </div>
            </div>

            {/* Supplementary Details */}
            <div className="mt-4 pt-4 border-t border-slate-700/80 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-slate-400">Block Number: </span>
                <span className="font-mono text-slate-200 font-semibold">#{data.blockNumber}</span>
              </div>
              <div>
                <span className="text-slate-400">Sender (From): </span>
                <span className="font-mono text-slate-200">{data.from.slice(0, 6)}...{data.from.slice(-4)}</span>
              </div>
              <div>
                <span className="text-slate-400">Method Selector: </span>
                <span className="font-mono text-slate-200">{data.methodId}</span>
              </div>
              <div>
                <span className="text-slate-400">Logs Emitted: </span>
                <span className="font-mono text-slate-200">{data.logsCount}</span>
              </div>
            </div>
          </div>

          {/* Benchmark Comparisons */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider mb-4 flex items-center space-x-2">
              <TrendingDown className="w-4 h-4 text-blue-400" />
              <span>Gas Comparison with Reference Benchmarks</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-900 border border-slate-700 rounded">
                <div className="text-xs text-slate-400">Vs Standard BOT Transfer (21,000 gas)</div>
                <div className="text-2xl font-bold font-mono text-slate-100 mt-1">
                  {data.comparisons.vsStandardTransfer}x
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  {Number(data.comparisons.vsStandardTransfer) > 1 ? 'Higher consumption than transfer' : 'Equal to standard transfer'}
                </div>
              </div>

              <div className="p-4 bg-slate-900 border border-slate-700 rounded">
                <div className="text-xs text-slate-400">Vs Standard Token Transfer (65,000 gas)</div>
                <div className="text-2xl font-bold font-mono text-slate-100 mt-1">
                  {data.comparisons.vsErc20Transfer}x
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  Standard ERC20 benchmark
                </div>
              </div>

              <div className="p-4 bg-slate-900 border border-slate-700 rounded">
                <div className="text-xs text-slate-400">Vs DEX Swap Execution (140,000 gas)</div>
                <div className="text-2xl font-bold font-mono text-slate-100 mt-1">
                  {data.comparisons.vsDexSwap}x
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  Automated Market Maker swap cost
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* CONTRACT-WIDE INSPECTION REPORT */
        <div className="space-y-6">
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <div className="pb-4 border-b border-slate-700/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Contract Target</span>
                <div className="font-mono text-base font-bold text-slate-100 break-all">{data.contractAddress}</div>
              </div>
              <a
                href={`https://scan.bohr.life/address/${data.contractAddress}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center space-x-1.5 text-xs text-blue-400 hover:text-blue-300 underline font-medium"
              >
                <span>View Contract on BOTScan</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-900 border border-slate-700 rounded">
                <div className="text-xs text-slate-400 uppercase">Total Interactions</div>
                <div className="text-xl font-bold font-mono text-slate-100 mt-1">
                  {data.interactionsCount}
                </div>
                <div className="text-xs text-slate-400 mt-1">In {data.scannedBlocks} scanned blocks</div>
              </div>

              <div className="p-4 bg-slate-900 border border-slate-700 rounded">
                <div className="text-xs text-slate-400 uppercase">Total Gas Consumed</div>
                <div className="text-xl font-bold font-mono text-slate-100 mt-1">
                  {Number(data.totalGasUsed).toLocaleString()}
                </div>
                <div className="text-xs text-slate-400 mt-1">Cumulative execution</div>
              </div>

              <div className="p-4 bg-slate-900 border border-slate-700 rounded">
                <div className="text-xs text-slate-400 uppercase">Avg Gas / Call</div>
                <div className="text-xl font-bold font-mono text-slate-100 mt-1">
                  {Number(data.avgGasPerInteraction).toLocaleString()}
                </div>
                <div className="text-xs text-slate-400 mt-1">Mean operation weight</div>
              </div>

              <div className="p-4 bg-slate-900 border border-blue-900/60 rounded">
                <div className="text-xs text-blue-400 uppercase font-semibold">Total Cost Incurred</div>
                <div className="text-xl font-bold font-mono text-blue-200 mt-1">
                  {Number(data.totalCostBOT).toFixed(6)} <span className="text-xs font-sans text-blue-300">BOT</span>
                </div>
                <div className="text-xs text-slate-400 mt-1">Network fees burned/paid</div>
              </div>
            </div>
          </div>

          {/* Method Gas Heatmap */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider mb-4 flex items-center space-x-2">
              <Cpu className="w-4 h-4 text-blue-400" />
              <span>Contract Function Gas Heatmap</span>
            </h2>

            {data.methodBreakdown && data.methodBreakdown.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 border-b border-slate-700 text-slate-400 font-mono uppercase">
                    <tr>
                      <th className="p-3">Method Selector</th>
                      <th className="p-3 text-center">Invocations</th>
                      <th className="p-3 text-right">Avg Gas</th>
                      <th className="p-3 text-right">Total Gas Consumed</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700 font-mono">
                    {data.methodBreakdown.map((m) => (
                      <tr key={m.methodId} className="hover:bg-slate-700/40">
                        <td className="p-3 text-blue-400 font-semibold">{m.methodId}</td>
                        <td className="p-3 text-center text-slate-200">{m.callCount}</td>
                        <td className="p-3 text-right text-slate-200">{Number(m.avgGasUsed).toLocaleString()}</td>
                        <td className="p-3 text-right text-slate-100 font-bold">{Number(m.totalGasUsed).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-4 bg-slate-900 border border-slate-700 rounded text-xs text-slate-400 text-center">
                No contract method calls recorded within blocks #{data.fromBlock} - #{data.toBlock}.
              </div>
            )}
          </div>
        </div>
      )}

      {/* On-Chain Coordinator: BOTGasTracker.sol Integration */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
        <div className="flex items-center space-x-2 mb-3">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
            BOTGasTracker.sol On-Chain Registry
          </h2>
        </div>
        <p className="text-xs text-slate-400 mb-4">
          Register this gas inspection request on-chain through the <code className="text-slate-300">BOTGasTracker</code> smart contract
          or publish a verifiable analysis report hash.
        </p>

        <div className="p-4 bg-slate-900 border border-slate-700 rounded space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs font-mono gap-2">
            <span className="text-slate-400 font-sans">Computed Report Hash (Keccak256):</span>
            <span className="text-blue-300 break-all">{computedReportHash}</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-2 border-t border-slate-800 gap-3">
            <div className="text-xs text-slate-400">
              Contract Address: {contractAddress ? (
                <span className="font-mono text-slate-200">{contractAddress.slice(0, 10)}...{contractAddress.slice(-8)}</span>
              ) : (
                <span className="text-amber-400">Not yet deployed (Run "npm run deploy")</span>
              )}
            </div>

            <button
              onClick={handleRequestOnChain}
              disabled={isTxPending || isWaitingForReceipt || !contractAddress}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded text-xs font-semibold transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              <span>
                {isTxPending || isWaitingForReceipt ? 'Submitting to BOT Chain...' : 'Submit Request On-Chain'}
              </span>
            </button>
          </div>

          {txHash && (
            <div className="mt-2 p-2.5 bg-emerald-950/60 border border-emerald-800 rounded text-xs text-emerald-300 flex items-center justify-between">
              <span>On-Chain Tx Submitted: {txHash.slice(0, 12)}...{txHash.slice(-8)}</span>
              <a
                href={`https://scan.bohr.life/tx/${txHash}`}
                target="_blank"
                rel="noreferrer"
                className="underline flex items-center space-x-1"
              >
                <span>BOTScan</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

