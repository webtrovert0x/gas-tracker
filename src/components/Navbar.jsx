import React from 'react';
import { Activity, Shield, Fuel, Search, FileText, CheckCircle2 } from 'lucide-react';
import { useAccount, useDisconnect } from 'wagmi';

export function Navbar({ activePage, setActivePage, liveGas, latestBlock }) {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();

  const handleWalletClick = () => {
    // If Reown modal is available globally or through w3m button
    if (window.appkit) {
      window.appkit.open();
    } else {
      // Injected browser wallet connector trigger
      const event = new CustomEvent('open-wallet-modal');
      window.dispatchEvent(event);
    }
  };

  const truncateAddress = (addr) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Network Tag */}
          <div className="flex items-center space-x-4">
            <div 
              onClick={() => setActivePage('dashboard')}
              className="flex items-center space-x-2 cursor-pointer"
            >
              <div className="w-9 h-9 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-lg">
                <Fuel className="w-5 h-5" />
              </div>
              <div>
                <span className="text-lg font-bold text-slate-100 tracking-tight">BOT GasTracker</span>
                <span className="hidden sm:inline-block ml-2 px-2 py-0.5 text-xs bg-slate-800 text-slate-300 border border-slate-700 rounded font-mono">
                  Testnet 968
                </span>
              </div>
            </div>

            {/* Navigation tabs */}
            <nav className="hidden md:flex space-x-1 pl-4">
              <button
                onClick={() => setActivePage('dashboard')}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                  activePage === 'dashboard'
                    ? 'bg-slate-800 text-white border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Activity className="w-4 h-4" />
                <span>Dashboard</span>
              </button>

              <button
                onClick={() => setActivePage('inspection')}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                  activePage === 'inspection'
                    ? 'bg-slate-800 text-white border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Search className="w-4 h-4" />
                <span>Gas Inspection</span>
              </button>

              <button
                onClick={() => setActivePage('report')}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                  activePage === 'report'
                    ? 'bg-slate-800 text-white border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Gas Report</span>
              </button>
            </nav>
          </div>

          {/* Right side live status & wallet */}
          <div className="flex items-center space-x-3">
            {/* Live RPC & Gas ticker */}
            <div className="hidden lg:flex items-center space-x-3 text-xs bg-slate-800 border border-slate-700 px-3 py-1.5 rounded">
              <div className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                <span className="text-slate-300 font-mono">Block #{latestBlock || '...'}</span>
              </div>
              <div className="h-3 w-px bg-slate-700"></div>
              <div className="text-slate-300">
                <span className="text-slate-400">Gas: </span>
                <span className="font-mono text-blue-400 font-semibold">{liveGas?.gasPriceGwei || '--'} Gwei</span>
              </div>
            </div>

            {/* Wallet button */}
            {isConnected ? (
              <div className="flex items-center space-x-2">
                <div className="bg-slate-800 border border-slate-700 px-3 py-1.5 rounded text-xs font-mono text-slate-200 flex items-center space-x-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{truncateAddress(address)}</span>
                </div>
                <button
                  onClick={() => disconnect()}
                  className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 px-2.5 py-1.5 rounded text-xs transition-colors"
                  title="Disconnect"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                onClick={handleWalletClick}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs sm:text-sm px-3.5 py-1.5 rounded transition-colors flex items-center space-x-1.5"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Connect Wallet</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile nav */}
      <div className="md:hidden flex border-t border-slate-800 px-4 py-2 space-x-2 bg-slate-900">
        <button
          onClick={() => setActivePage('dashboard')}
          className={`flex-1 py-1.5 text-xs text-center rounded font-medium ${
            activePage === 'dashboard' ? 'bg-slate-800 text-white' : 'text-slate-400'
          }`}
        >
          Dashboard
        </button>
        <button
          onClick={() => setActivePage('inspection')}
          className={`flex-1 py-1.5 text-xs text-center rounded font-medium ${
            activePage === 'inspection' ? 'bg-slate-800 text-white' : 'text-slate-400'
          }`}
        >
          Inspect
        </button>
        <button
          onClick={() => setActivePage('report')}
          className={`flex-1 py-1.5 text-xs text-center rounded font-medium ${
            activePage === 'report' ? 'bg-slate-800 text-white' : 'text-slate-400'
          }`}
        >
          Report
        </button>
      </div>
    </header>
  );
}

