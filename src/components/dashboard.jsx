import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

function Counter({ target }) {
  const [val, setVal] = useState(0);
  const raf = useRef();

  useEffect(() => {
    if (!target) return;
    let start = 0;
    const duration = 1400;
    const step = target / (duration / 16);
    const tick = () => {
      start = Math.min(start + step, target);
      setVal(Math.floor(start));
      if (start < target) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target]);

  return <>{val}</>;
}

export default function Dashboard({ onNewScan }) {
  const [stats,   setStats]   = useState({ meals: 0, co2: 0, families: 0 });
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('rescues')
        .select('meals, co2_kg, families, analysis, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data?.length) {
        const meals    = data.reduce((s, r) => s + (r.meals    || 0), 0);
        const co2      = data.reduce((s, r) => s + (r.co2_kg   || 0), 0);
        const families = data.reduce((s, r) => s + (r.families || 0), 0);
        setStats({ meals, co2: parseFloat(co2.toFixed(1)), families });
        setHistory(data.slice(0, 6));
      }
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page dashboard-page">
      <div className="dash-header">
        <div>
          <h1>Impact Dashboard</h1>
          <p>Live community impact — all rescues by CascadeAI</p>
        </div>
        <button className="btn-sm" onClick={onNewScan}>+ New Scan</button>
      </div>

      <div className="stat-grid">
        <div className="stat-card green">
          <div className="stat-big"><Counter target={stats.meals} /></div>
          <div className="stat-name">Meals Rescued</div>
          <div className="stat-desc">from landfill to table</div>
        </div>
        <div className="stat-card teal">
          <div className="stat-big">
            <Counter target={stats.co2} />
            <span className="stat-unit">kg</span>
          </div>
          <div className="stat-name">CO₂ Prevented</div>
          <div className="stat-desc">methane diverted from landfill</div>
        </div>
        <div className="stat-card purple">
          <div className="stat-big"><Counter target={stats.families} /></div>
          <div className="stat-name">Families Served</div>
          <div className="stat-desc">same neighborhood</div>
        </div>
      </div>

      {loading && <p className="dash-loading">Loading impact data…</p>}

      {!loading && history.length > 0 && (
        <div className="history">
          <h2 className="history-title">Recent Rescues</h2>
          <div className="history-list">
            {history.map((r, i) => (
              <div key={i} className="history-row">
                <div>
                  <div className="history-summary">{r.analysis?.summary || 'Food rescued'}</div>
                  <div className="history-date">{new Date(r.created_at).toLocaleString()}</div>
                </div>
                <span className="history-meals">{r.meals} meals</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && history.length === 0 && (
        <div className="dash-empty">
          <div className="empty-icon">🌱</div>
          <p>No rescues yet. Start scanning surplus food.</p>
          <button className="btn-primary" onClick={onNewScan}>Scan Now</button>
        </div>
      )}
    </div>
  );
}