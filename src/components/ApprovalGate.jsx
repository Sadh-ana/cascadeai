import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function ApprovalGate({ plan, scanResult, onApprove }) {
  const [loading, setLoading] = useState(false);
  const [done, setDone]       = useState(false);

  const handleApprove = async () => {
    setLoading(true);
    try {
      await supabase.from('rescues').insert({
        analysis:    scanResult,
        plan:        plan,
        meals:       plan.estimated_impact?.meals   || 0,
        co2_kg:      plan.estimated_impact?.co2_kg  || 0,
        families:    plan.estimated_impact?.families || 0,
        status:      'completed',
        approved_at: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('Supabase insert failed (demo continues):', err.message);
    }
    setDone(true);
    setTimeout(onApprove, 2200);
    setLoading(false);
  };

  if (done) return (
    <div className="page approval-done fade-in">
      <div className="done-icon">✅</div>
      <h2>Rescue Dispatched!</h2>
      <p>
        {plan.estimated_impact?.meals} meals rescued ·&nbsp;
        {plan.estimated_impact?.co2_kg?.toFixed(1)} kg CO₂ prevented
      </p>
      <p className="done-sub">Updating impact dashboard…</p>
    </div>
  );

  const { cascade, pickup_window, estimated_impact: impact } = plan;

  return (
    <div className="page approval-page">
      <div className="gate-card">
        <div className="gate-top">
          <span className="gate-icon">⚠️</span>
          <div>
            <h2 className="gate-title">Staff Approval Required</h2>
            <p className="gate-sub">Review this plan. You remain in control — nothing dispatches without your sign-off.</p>
          </div>
        </div>

        <div className="gate-summary">
          <div className="sum-row">
            <span className="sum-k">Food identified</span>
            <span className="sum-v">{scanResult?.summary}</span>
          </div>
          <div className="sum-row">
            <span className="sum-k">Pickup window</span>
            <span className="sum-v">{pickup_window}</span>
          </div>
          <div className="sum-row">
            <span className="sum-k">Meals rescued</span>
            <span className="sum-v green">{impact?.meals}</span>
          </div>
          <div className="sum-row">
            <span className="sum-k">CO₂ prevented</span>
            <span className="sum-v green">{impact?.co2_kg?.toFixed(1)} kg</span>
          </div>
          <div className="sum-row">
            <span className="sum-k">Families served</span>
            <span className="sum-v green">{impact?.families}</span>
          </div>
        </div>

        <div className="gate-cascade">
          {cascade?.map((node, i) => (
            <div key={i} className="gate-node">
              <span className="gate-num">{i + 1}</span>
              <div>
                <div className="gate-recip">{node.recipient}</div>
                <div className="gate-info">{node.quantity} · {node.address}</div>
              </div>
            </div>
          ))}
        </div>

        <button className="btn-approve" onClick={handleApprove} disabled={loading}>
          {loading ? 'Dispatching…' : '✓ Approve & Dispatch'}
        </button>
        <p className="gate-disclaimer">
          By approving, you confirm this food is safe to redistribute.
        </p>
      </div>
    </div>
  );
}