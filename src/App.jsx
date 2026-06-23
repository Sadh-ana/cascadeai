import { useState } from 'react';
import FoodScanner from './components/FoodScanner';
import RescueCascade from './components/RescueCascade';
import ApprovalGate from './components/ApprovalGate';
import Dashboard from './components/Dashboard';
import './index.css';

const PHASE = {
  SCAN: 'scan',
  CASCADE: 'cascade',
  APPROVE: 'approve',
  DASHBOARD: 'dashboard',
};

export default function App() {
  const [phase, setPhase] = useState(PHASE.SCAN);
  const [scanResult, setScanResult] = useState(null);
  const [rescuePlan, setRescuePlan] = useState(null);

  const reset = () => {
    setScanResult(null);
    setRescuePlan(null);
    setPhase(PHASE.SCAN);
  };

  const inFlow = phase !== PHASE.DASHBOARD;

  return (
    <div className="app">
      <header className="header">
        <div className="header-brand">
          <span className="brand-wave">🌊</span>
          <span className="brand-name">CascadeAI</span>
          <span className="brand-tag">Food Rescue</span>
        </div>
        <nav className="header-nav">
          <button
            className={`nav-btn ${inFlow ? 'active' : ''}`}
            onClick={reset}
          >
            Scan
          </button>
          <button
            className={`nav-btn ${phase === PHASE.DASHBOARD ? 'active' : ''}`}
            onClick={() => setPhase(PHASE.DASHBOARD)}
          >
            Dashboard
          </button>
        </nav>
      </header>

      {inFlow && (
        <div className="progress-bar">
          {[
            { key: PHASE.SCAN,     label: '1 · Scan' },
            { key: PHASE.CASCADE,  label: '2 · Plan' },
            { key: PHASE.APPROVE,  label: '3 · Approve' },
          ].map(({ key, label }, i, arr) => (
            <>
              <span
                key={key}
                className={`progress-step ${phase === key ? 'current' : ''} ${
                  [PHASE.CASCADE, PHASE.APPROVE].slice(-arr.length + i).includes(phase) && phase !== key
                    ? 'done' : ''
                }`}
              >
                {label}
              </span>
              {i < arr.length - 1 && <span key={`line-${i}`} className="progress-line" />}
            </>
          ))}
        </div>
      )}

      <main className="main">
        {phase === PHASE.SCAN && (
          <FoodScanner
            onComplete={(result) => { setScanResult(result); setPhase(PHASE.CASCADE); }}
          />
        )}
        {phase === PHASE.CASCADE && (
          <RescueCascade
            scanResult={scanResult}
            onComplete={(plan) => { setRescuePlan(plan); setPhase(PHASE.APPROVE); }}
          />
        )}
        {phase === PHASE.APPROVE && (
          <ApprovalGate
            plan={rescuePlan}
            scanResult={scanResult}
            onApprove={() => setPhase(PHASE.DASHBOARD)}
          />
        )}
        {phase === PHASE.DASHBOARD && (
          <Dashboard onNewScan={reset} />
        )}
      </main>
    </div>
  );
}