import React, { useState } from 'react';

export function GasChart({ blocks = [] }) {
  const [hoveredBlock, setHoveredBlock] = useState(null);

  if (!blocks || blocks.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-sm text-slate-400 bg-slate-900 border border-slate-700 rounded">
        Loading real-time block gas metrics from BOT Chain...
      </div>
    );
  }

  // Calculate chart boundaries
  const maxGasLimit = Math.max(...blocks.map((b) => b.gasLimit), 1);
  const maxGasUsed = Math.max(...blocks.map((b) => b.gasUsed), 1);
  const chartMax = Math.max(maxGasLimit, maxGasUsed * 1.1);

  const chartHeight = 220;
  const chartWidth = 700;
  const paddingX = 40;
  const paddingY = 25;

  const innerWidth = chartWidth - paddingX * 2;
  const innerHeight = chartHeight - paddingY * 2;

  const points = blocks.map((b, idx) => {
    const x = paddingX + (idx / Math.max(blocks.length - 1, 1)) * innerWidth;
    const yUsed = chartHeight - paddingY - (b.gasUsed / chartMax) * innerHeight;
    const yLimit = chartHeight - paddingY - (b.gasLimit / chartMax) * innerHeight;
    return { ...b, x, yUsed, yLimit };
  });

  const usedPathD = points.reduce((acc, curr, i) => {
    return `${acc} ${i === 0 ? 'M' : 'L'} ${curr.x.toFixed(1)} ${curr.yUsed.toFixed(1)}`;
  }, '');

  const limitPathD = points.reduce((acc, curr, i) => {
    return `${acc} ${i === 0 ? 'M' : 'L'} ${curr.x.toFixed(1)} ${curr.yLimit.toFixed(1)}`;
  }, '');

  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-3 text-xs">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 bg-blue-500 rounded-sm inline-block"></span>
            <span className="text-slate-300 font-medium">Gas Used</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-0.5 bg-slate-500 inline-block border-b border-dashed border-slate-400"></span>
            <span className="text-slate-400">Gas Limit</span>
          </div>
        </div>
        {hoveredBlock ? (
          <div className="bg-slate-900 border border-slate-700 px-2.5 py-1 rounded font-mono text-slate-200">
            Block #{hoveredBlock.blockNumber}: {hoveredBlock.gasUsed.toLocaleString()} gas ({hoveredBlock.fullnessPercent}% full)
          </div>
        ) : (
          <span className="text-slate-400">Hover over points to inspect block</span>
        )}
      </div>

      <div className="w-full overflow-x-auto bg-slate-900 border border-slate-700 rounded-lg p-2">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full h-56 select-none"
        >
          {/* Horizontal grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
            const y = chartHeight - paddingY - ratio * innerHeight;
            const val = ((chartMax * ratio) / 1e6).toFixed(1) + 'M';
            return (
              <g key={i}>
                <line
                  x1={paddingX}
                  y1={y}
                  x2={chartWidth - paddingX}
                  y2={y}
                  stroke="#334155"
                  strokeWidth="1"
                />
                <text
                  x={paddingX - 6}
                  y={y + 4}
                  fill="#94a3b8"
                  fontSize="10"
                  textAnchor="end"
                  fontFamily="monospace"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {/* Gas Limit Line (solid slate dashed) */}
          <path
            d={limitPathD}
            fill="none"
            stroke="#64748b"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />

          {/* Gas Used Line (solid blue, no gradient) */}
          <path
            d={usedPathD}
            fill="none"
            stroke="#2563eb"
            strokeWidth="2.5"
          />

          {/* Interactive data points */}
          {points.map((p, idx) => (
            <g
              key={idx}
              className="cursor-pointer"
              onMouseEnter={() => setHoveredBlock(p)}
              onMouseLeave={() => setHoveredBlock(null)}
            >
              <circle
                cx={p.x}
                cy={p.yUsed}
                r={hoveredBlock?.blockNumber === p.blockNumber ? '6' : '3.5'}
                fill="#2563eb"
                stroke="#0f172a"
                strokeWidth="2"
              />
              {/* Vertical hover line */}
              {hoveredBlock?.blockNumber === p.blockNumber && (
                <line
                  x1={p.x}
                  y1={paddingY}
                  x2={p.x}
                  y2={chartHeight - paddingY}
                  stroke="#38bdf8"
                  strokeWidth="1"
                  strokeDasharray="2 2"
                />
              )}
              {/* X Axis block labels (sample every few) */}
              {(idx === 0 || idx === Math.floor(points.length / 2) || idx === points.length - 1) && (
                <text
                  x={p.x}
                  y={chartHeight - 6}
                  fill="#94a3b8"
                  fontSize="10"
                  textAnchor="middle"
                  fontFamily="monospace"
                >
                  #{p.blockNumber}
                </text>
              )}
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}

