import React, { useState, useEffect } from 'react';
import { Fuel, TrendingUp, BarChart2, Flame, ArrowUpRight, RefreshCw, Layers, Clock } from 'lucide-react';
import { MetricCard } from '../components/MetricCard';
import { GasChart } from '../components/GasChart';
import { getCurrentGasInfo, getRecentBlocksWithStats } from '../services/botchainRpc';

export function Dashboard({ onInspectTx }) {
  const [gasInfo, setGasInfo] = useState(null);
  const [blockTrends, setBlockTrends] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [rangeCount, setRangeCount] = useState(10);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchData = async (count = rangeCount) => {
    try {
      setError(null);
      const [gas, trends] = await Promise.all([
        getCurrentGasInfo(),
        getRecentBlocksWithStats(count),
      ]);
      setGasInfo(gas);
      setBlockTrends(trends);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      console.error('Error fetching BOT Chain dashboard data:', err);
      setError(err.message || 'Failed to connect to BOT Chain RPC');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      fetchData();
    }, 12000); // Poll every 12s matching BOT Chain block generation
    return () => clearInterval(interval);
  }, [rangeCount]);

  const handleManualRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-800 gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight">
            BOT Chain Gas Dashboard
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time gas consumption, block dynamics, and network fees on BOT Chain Testnet.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="text-xs text-slate-400 hidden sm:block">
            {lastUpdated && `Updated at ${lastUpdated}`}
          </div>

          <div className="flex items-center bg-slate-800 border border-slate-700 rounded p-1 text-xs">
            <span className="text-slate-400 px-2">Window:</span>
            {[5, 10, 20].map((c) => (
              <button
                key={c}
                onClick={() => setRangeCount(c)}
                className={`px-2 py-1 rounded font-medium transition-colors ${
                  rangeCount === c ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {c} blocks
              </button>
            ))}
          </div>

          <button
            onClick={handleManualRefresh}
            disabled={refreshing}
            className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-slate-300 transition-colors disabled:opacity-50"
            title="Refresh from RPC"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-blue-400' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-950/40 border border-red-800 rounded-lg text-sm text-red-200 flex items-center justify-between">
          <div>
            <span className="font-semibold">RPC Connection Notice: </span>
            {error}
          </div>
          <button
            onClick={handleManualRefresh}
            className="px-3 py-1 bg-red-800 hover:bg-red-700 text-white text-xs rounded"
          >
            Retry RPC
          </button>
        </div>
      )}

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Current Gas Price"
          value={gasInfo ? `${gasInfo.gasPriceGwei}` : '...'}
          unit="Gwei"
          subtitle={`Base: ${gasInfo?.baseFeeGwei || '0'} Gwei`}
          icon={Fuel}
          badge="Live RPC"
        />

        <MetricCard
          title="Avg Gas Per Tx"
          value={blockTrends ? Number(blockTrends.avgGasPerTx).toLocaleString() : '...'}
          unit="gas"
          subtitle={`Across last ${rangeCount} blocks`}
          icon={TrendingUp}
        />

        <MetricCard
          title="Latest Block Fullness"
          value={gasInfo ? `${gasInfo.blockFullnessPercent}%` : '...'}
          unit=""
          subtitle={`Block #${gasInfo?.blockNumber || '...'}`}
          icon={BarChart2}
          badge={`${gasInfo?.gasUsed ? (Number(gasInfo.gasUsed) / 1e6).toFixed(2) : '0'}M used`}
          alert={gasInfo && Number(gasInfo.blockFullnessPercent) > 75}
        />

        <MetricCard
          title="Block Gas Limit"
          value={gasInfo ? `${(Number(gasInfo.gasLimit) / 1e6).toFixed(0)}M` : '...'}
          unit="gas"
          subtitle="Fixed block ceiling"
          icon={Layers}
          badge="Target 35M"
        />
      </div>

      {/* Gas Price Speed Breakdown */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
        <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider mb-4 flex items-center space-x-2">
          <Fuel className="w-4 h-4 text-blue-400" />
          <span>Network Fee Estimates (BOT Chain Testnet)</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-900 border border-slate-700 rounded">
            <div className="flex justify-between items-center text-xs text-slate-400">
              <span className="font-medium text-emerald-400">Standard / Safe</span>
              <span>~12 sec</span>
            </div>
            <div className="mt-2 text-xl font-bold font-mono text-slate-100">
              {gasInfo?.safeLowGwei || '--'} <span className="text-xs text-slate-400 font-sans">Gwei</span>
            </div>
            <div className="text-xs text-slate-400 mt-1">Sufficient for 95% of transactions</div>
          </div>

          <div className="p-4 bg-slate-900 border border-blue-900 rounded">
            <div className="flex justify-between items-center text-xs text-slate-400">
              <span className="font-medium text-blue-400">Standard Priority</span>
              <span>~3-6 sec</span>
            </div>
            <div className="mt-2 text-xl font-bold font-mono text-slate-100">
              {gasInfo?.standardGwei || '--'} <span className="text-xs text-slate-400 font-sans">Gwei</span>
            </div>
            <div className="text-xs text-slate-400 mt-1">Recommended for standard contract calls</div>
          </div>

          <div className="p-4 bg-slate-900 border border-slate-700 rounded">
            <div className="flex justify-between items-center text-xs text-slate-400">
              <span className="font-medium text-amber-400">Fast / Next Block</span>
              <span>Immediate</span>
            </div>
            <div className="mt-2 text-xl font-bold font-mono text-slate-100">
              {gasInfo?.fastGwei || '--'} <span className="text-xs text-slate-400 font-sans">Gwei</span>
            </div>
            <div className="text-xs text-slate-400 mt-1">Prioritized by BOT Chain validators</div>
          </div>
        </div>
      </div>

      {/* Gas Consumption Trend Chart */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-blue-400" />
              <span>Recent Gas Consumption Trends</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Live block-by-block gas used vs maximum gas capacity (Target 35M gas).
            </p>
          </div>
          <span className="text-xs text-slate-400 font-mono mt-2 sm:mt-0">
            Source: RPC (eth_getBlockByNumber)
          </span>
        </div>

        <GasChart blocks={blockTrends?.blocks || []} />
      </div>

      {/* Recent Transactions in Selected Range */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center space-x-2">
              <Flame className="w-4 h-4 text-amber-400" />
              <span>Transactions in Selected Window ({blockTrends?.txCandidates?.length || 0} found)</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Select any transaction to run full gas inspection and breakdown report.
            </p>
          </div>
        </div>

        {blockTrends?.txCandidates && blockTrends.txCandidates.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 border-b border-slate-700 text-slate-400 uppercase font-mono">
                <tr>
                  <th className="p-3">Tx Hash</th>
                  <th className="p-3">Block</th>
                  <th className="p-3">From</th>
                  <th className="p-3">To / Contract</th>
                  <th className="p-3 text-right">Gas Limit</th>
                  <th className="p-3 text-right">Gas Price</th>
                  <th className="p-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60 font-mono">
                {blockTrends.txCandidates.map((tx) => (
                  <tr key={tx.hash} className="hover:bg-slate-700/40 transition-colors">
                    <td className="p-3 text-blue-400 font-medium">
                      {tx.hash.slice(0, 10)}...{tx.hash.slice(-8)}
                    </td>
                    <td className="p-3 text-slate-300">#{tx.blockNumber}</td>
                    <td className="p-3 text-slate-400">
                      {tx.from ? `${tx.from.slice(0, 6)}...${tx.from.slice(-4)}` : '--'}
                    </td>
                    <td className="p-3 text-slate-400">
                      {tx.to ? `${tx.to.slice(0, 6)}...${tx.to.slice(-4)}` : 'Deployment'}
                    </td>
                    <td className="p-3 text-right text-slate-200">
                      {Number(tx.gasLimit).toLocaleString()}
                    </td>
                    <td className="p-3 text-right text-slate-300">
                      {(Number(tx.gasPrice) / 1e9).toFixed(2)} Gwei
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => onInspectTx(tx.hash)}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded font-sans transition-colors"
                      >
                        <span>Inspect</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center bg-slate-900 border border-slate-700 rounded text-slate-400 text-sm">
            <p>No transactions detected in the latest {rangeCount} blocks on BOT Chain Testnet.</p>
            <p className="text-xs text-slate-400 mt-1">
              You can paste any specific transaction hash or contract address directly in the Gas Inspection tab.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

