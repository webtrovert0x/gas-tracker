import React from 'react';

export function MetricCard({ title, value, unit, subtitle, icon: Icon, badge, alert }) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">{title}</span>
        {Icon && (
          <div className="w-8 h-8 rounded bg-slate-700/60 border border-slate-600 flex items-center justify-center text-slate-300">
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline space-x-2">
        <span className="text-2xl font-bold text-slate-100 font-mono tracking-tight">{value}</span>
        {unit && <span className="text-sm font-medium text-slate-400">{unit}</span>}
      </div>

      {(subtitle || badge) && (
        <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
          <span>{subtitle}</span>
          {badge && (
            <span className={`px-2 py-0.5 rounded font-mono ${
              alert ? 'bg-amber-950/80 text-amber-300 border border-amber-800' : 'bg-slate-700 text-slate-300'
            }`}>
              {badge}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

