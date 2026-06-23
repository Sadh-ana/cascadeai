import { useState, useEffect } from 'react';

const NODE_CONFIG = {
  family:  { emoji: '👨‍👩‍👧', color: '#22C55E', glow: 'rgba(34,197,94,0.18)' },
  fridge:  { emoji: '🧊',     color: '#3B82F6', glow: 'rgba(59,130,246,0.18)' },
  shelter: { emoji: '🏠',     color: '#7C3AED', glow: 'rgba(124,58,237,0.18)' },
  compost: { emoji: '🌱',     color: '#F59E0B', glow: 'rgba(245,158,11,0.18)' },
};

export default function RescueCascade({ scanResult, onComplete }) {
  const [plan, setPlan]           = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [visible, setVisible]     = useState([]);

  useEffect(() => { fetchPlan(); }, []);

  const fetchPlan = async () => {
    setLoading(true);
    setVisible([]);
    setPlan(null);
    setError(null);
    try {
      const res = await fetch('/api/rescue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analysis: scanResult }),
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setPlan(data);
      // Stagger cascade nodes appearing
      data.cascade?.forEach((_, i) => {
        setTimeout(() => setVisible(prev => [...prev, i]), 300 + i * 350);
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="page cascade-loading">
      <div className="pulse-orb" />
      <h2>AI agent is planning rescue…</h2>
      <p>Matching surplus to nearby recipients in priority order</p>
    </div>
  );

  if (error) return (
    <div className="page">
      <div className="error-box">⚠ {error} <button onClick={fetchPlan}>Retry</button></div>
    </div>
  );

  if (!plan) return null;

  const { cascade, pickup_window, estimated_impact: impact, notes } = plan;

  return (
    <div className="page cascade-page">
      <div className="page-header">
        <h1>Rescue Plan Ready</h1>
        <p>AI agent matched your surplus to {cascade?.length} recipient{cascade?.length !== 1 ? 's' : ''}</p>
      </div>

      <div className="impact-row">
        <div className="impact-cell">
          <span className="impact-big">{impact?.meals}</span>
          <span className="impact-lbl">meals</span>
        </div>
        <div className="impact-sep" />
        <div className="impact-cell">
          <span className="impact-big">{impact?.co2_kg?.toFixed(1)}</span>
          <span className="impact-lbl">kg CO₂ saved</span>
        </div>
        <div className="impact-sep" />
        <div className="impact-cell">
          <span className="impact-big">{impact?.families}</span>
          <span className="impact-lbl">families</span>
        </div>
      </div>

      <div className="cascade-list">
        {cascade?.map((node, i) => {
          const cfg = NODE_CONFIG[node.type] || NODE_CONFIG.compost;
          return (
            <div
              key={i}
              className={`cascade-card ${visible.includes(i) ? 'show' : ''}`}
              style={{ '--c': cfg.color, '--glow': cfg.glow }}
            >
              <div className="cascade-num">{node.priority}</div>
              <div className="cascade-emoji">{cfg.emoji}</div>
              <div className="cascade-detail">
                <div className="cascade-name">{node.recipient}</div>
                <div className="cascade-addr">{node.address}</div>
                <div className="cascade-qty">{node.quantity}</div>
                <div className="cascade-why">{node.reason}</div>
              </div>
            </div>
          );
        })}
      </div>

      {notes && <p className="cascade-notes"><strong>Notes:</strong> {notes}</p>}
      <p className="pickup-note">⏱ {pickup_window}</p>

      <button className="btn-primary" onClick={() => onComplete(plan)}>
        Review & Approve →
      </button>
    </div>
  );
}