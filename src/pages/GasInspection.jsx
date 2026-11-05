import React, { useState } from 'react';
import { Search, Sliders, Layers, ArrowRight, AlertCircle, CheckCircle2, Loader2, FileCode } from 'lucide-react';
import { inspectTransaction, inspectContractGas } from '../services/botchainRpc';

export function GasInspection({ onAnalysisComplete, initialInput = '', latestBlock = 0 }) {
  const [targetInput, setTargetInput] = useState(initialInput);
  const [analysisType, setAnalysisType] = useState('full_breakdown'); // 'full_breakdown' | 'method_heatmap' | 'trace_deep'
  const [rangePreset, setRangePreset] = useState('50');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [isCustomRange, setIsCustomRange] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Auto-detect input type (Tx Hash: 66 chars 0x..., Contract Address: 42 chars 0x...)
  const isTxHash = targetInput.trim().length === 66 && targetInput.trim().startsWith('0x');
  const isAddress = targetInput.trim().length === 42 && targetInput.trim().startsWith('0x');

  const handleAnalyze = async (e) => {
    e.preventDefault();
    const clean = targetInput.trim();
    if (!clean) {
      setError('Please enter a valid BOT Chain transaction hash or contract address.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (clean.length === 66 && clean.startsWith('0x')) {
        // Inspecting a specific transaction
        const result = await inspectTransaction(clean);
        onAnalysisComplete({
          type: 'transaction',
          data: result,
          analysisType,
        });
      } else if (clean.length === 42 && clean.startsWith('0x')) {
        // Inspecting a contract address across a block range
        const to = isCustomRange && customTo ? Number(customTo) : latestBlock || 29125000;
        const delta = Number(rangePreset);
        const from = isCustomRange && customFrom ? Number(customFrom) : Math.max(0, to - delta);

        const result = await inspectContractGas(clean, from, to);
        onAnalysisComplete({
          type: 'contract',
          data: result,
          analysisType,
        });
      } else {
        throw new Error('Input must be either a 66-character Transaction Hash (0x...) or a 42-character Contract Address (0x...).');
      }
    } catch (err) {
      console.error('Analysis error:', err);
      setError(err.message || 'Failed to inspect target on BOT Chain Testnet.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-slate-800">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight">
          Gas Inspection Engine
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Perform verifiable gas audits on BOT Chain transactions and contract execution patterns.
        </p>
      </div>

      <form onSubmit={handleAnalyze} className="space-y-6 bg-slate-800 border border-slate-700 rounded-lg p-6">
        {/* Input Target */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            Target Transaction Hash or Contract Address
          </label>
          <div className="relative">
            <input
              type="text"
              value={targetInput}
              onChange={(e) => {
                setTargetInput(e.target.value);
                setError(null);
              }}
              placeholder="0x... (e.g. 0xabcdef...)"
              className="w-full bg-slate-900 border border-slate-700 rounded px-4 py-3 text-sm text-slate-100 font-mono focus:outline-none focus:border-blue-500 transition-colors"
            />
            <div className="absolute right-3 top-3 text-xs text-slate-400">
              {isTxHash && (
                <span className="bg-blue-900/60 text-blue-300 border border-blue-700 px-2 py-0.5 rounded font-mono">
                  Transaction Hash
                </span>
              )}
              {isAddress && (
                <span className="bg-emerald-900/60 text-emerald-300 border border-emerald-700 px-2 py-0.5 rounded font-mono">
                  Contract Address
                </span>
              )}
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-1.5">
            Accepts standard 32-byte tx hashes (0x + 64 hex) or 20-byte contract addresses (0x + 40 hex).
          </p>
        </div>

        {/* Block Range Selection */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
              <Layers className="w-4 h-4 text-slate-400" />
              <span>Block Range Selection</span>
            </label>
            <button
              type="button"
              onClick={() => setIsCustomRange(!isCustomRange)}
              className="text-xs text-blue-400 hover:text-blue-300 underline font-medium"
            >
              {isCustomRange ? 'Use Presets' : 'Custom Block Range'}
            </button>
          </div>

          {!isCustomRange ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { label: 'Latest 10 Blocks', value: '10' },
                { label: 'Latest 25 Blocks', value: '25' },
                { label: 'Latest 50 Blocks', value: '50' },
                { label: 'Latest 100 Blocks', value: '100' },
              ].map((preset) => (
                <button
                  type="button"
                  key={preset.value}
                  onClick={() => setRangePreset(preset.value)}
                  className={`p-2.5 rounded border text-xs font-medium text-center transition-colors ${
                    rangePreset === preset.value
                      ? 'bg-blue-600 text-white border-blue-500'
                      : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-600'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-900 p-3 rounded border border-slate-700">
              <div>
                <label className="block text-xs text-slate-400 mb-1">From Block Number</label>
                <input
                  type="number"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  placeholder={latestBlock ? String(latestBlock - 50) : '29124000'}
                  className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-xs text-slate-200 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">To Block Number</label>
                <input
                  type="number"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  placeholder={latestBlock ? String(latestBlock) : '29125000'}
                  className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-xs text-slate-200 font-mono"
                />
              </div>
            </div>
          )}
        </div>

        {/* Analysis Type Selection */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
            <Sliders className="w-4 h-4 text-slate-400" />
            <span>Analysis Type</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              {
                id: 'full_breakdown',
                title: 'Comprehensive Gas Breakdown',
                desc: 'Receipt gas, base vs execution cost, limit utilization and benchmarks.',
              },
              {
                id: 'method_heatmap',
                title: 'Method Gas Heatmap',
                desc: 'Function selector analysis, average vs peak cost across contract calls.',
              },
              {
                id: 'trace_deep',
                title: 'Execution Trace Analysis',
                desc: 'Call stack depth, internal transactions and storage cost inspection.',
              },
            ].map((type) => (
              <div
                key={type.id}
                onClick={() => setAnalysisType(type.id)}
                className={`p-3.5 rounded border cursor-pointer transition-colors ${
                  analysisType === type.id
                    ? 'bg-slate-900 border-blue-500 ring-1 ring-blue-500'
                    : 'bg-slate-900 border-slate-700 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                    analysisType === type.id ? 'border-blue-500 bg-blue-500' : 'border-slate-500'
                  }`}>
                    {analysisType === type.id && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                  </div>
                  <span className="text-xs font-semibold text-slate-200">{type.title}</span>
                </div>
                <p className="text-xs text-slate-400 mt-2 pl-5">{type.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="p-3 bg-red-950/40 border border-red-800 rounded text-xs text-red-200 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Action Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 text-sm"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Querying BOT Chain RPC & Computing Gas...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>Analyze Gas</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Helpful Instructions & Examples */}
      <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-5 text-xs text-slate-400 space-y-2">
        <div className="text-slate-300 font-semibold uppercase tracking-wider flex items-center space-x-1.5">
          <FileCode className="w-4 h-4 text-slate-400" />
          <span>Real BOT Chain Inspection Data</span>
        </div>
        <p>
          This inspection tool communicates directly with the BOT Chain Testnet JSON-RPC node (<code className="text-slate-300">https://rpc.bohr.life</code>).
          It computes gas used directly from transaction receipts, checks effective gas prices, logs, and state storage touches.
        </p>
      </div>
    </div>
  );
}

