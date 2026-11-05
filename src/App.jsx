import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Dashboard } from './pages/Dashboard';
import { GasInspection } from './pages/GasInspection';
import { Report } from './pages/Report';
import { getCurrentGasInfo } from './services/botchainRpc';
import { fetchServerConfig } from './config/wagmi';
import { ShieldAlert, ExternalLink } from 'lucide-react';

export function App({ initialConfig }) {
  const [activePage, setActivePage] = useState('dashboard');
  const [inspectionInput, setInspectionInput] = useState('');
  const [reportData, setReportData] = useState(null);
  const [liveGas, setLiveGas] = useState(null);
  const [latestBlock, setLatestBlock] = useState(0);
  const [serverConfig, setServerConfig] = useState(initialConfig || null);

  // Sync server-side config securely (REOWN_ID, Contract Address, RPC)
  useEffect(() => {
    if (!serverConfig) {
      fetchServerConfig().then((cfg) => {
        setServerConfig(cfg);
      });
    }
  }, [serverConfig]);

  // Poll for latest gas and block
  useEffect(() => {
    const updateStats = async () => {
      try {
        const gas = await getCurrentGasInfo();
        setLiveGas(gas);
        setLatestBlock(gas.blockNumber);
      } catch (err) {
        console.warn('Live ticker sync:', err);
      }
    };
    updateStats();
    const interval = setInterval(updateStats, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleInspectTxFromDashboard = (txHash) => {
    setInspectionInput(txHash);
    setActivePage('inspection');
  };

  const handleAnalysisComplete = (result) => {
    setReportData(result);
    setActivePage('report');
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        activePage={activePage}
        setActivePage={setActivePage}
        liveGas={liveGas}
        latestBlock={latestBlock}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activePage === 'dashboard' && (
          <Dashboard onInspectTx={handleInspectTxFromDashboard} />
        )}

        {activePage === 'inspection' && (
          <GasInspection
            initialInput={inspectionInput}
            latestBlock={latestBlock}
            onAnalysisComplete={handleAnalysisComplete}
          />
        )}

        {activePage === 'report' && (
          <Report
            reportData={reportData}
            onInspectAnother={() => setActivePage('inspection')}
            contractAddress={serverConfig?.contractAddress}
          />
        )}
      </main>

      {/* Clean Flat Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 py-6 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Connected to BOT Chain Testnet (Chain ID 968)</span>
            <span className="text-slate-600">|</span>
            <span className="font-mono text-slate-400">https://rpc.bohr.life</span>
          </div>

          <div className="flex items-center space-x-4">
            <a
              href="https://scan.bohr.life/"
              target="_blank"
              rel="noreferrer"
              className="text-slate-400 hover:text-slate-200 transition-colors flex items-center space-x-1"
            >
              <span>BOTScan Explorer</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <span className="text-slate-700">•</span>
            <span>BOTGasTracker v1.0</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
export default App;
