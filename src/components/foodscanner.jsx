import { useState, useRef } from 'react';

const CONDITION = {
  good: { label: 'Fresh',    color: '#22C55E', bg: 'rgba(34,197,94,0.12)' },
  fair: { label: 'Use soon', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  poor: { label: 'Urgent!',  color: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
};

export default function FoodScanner({ onComplete }) {
  const [image, setImage]     = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState(null);
  const [error, setError]     = useState(null);
  const fileRef = useRef();

  const handleFile = (file) => {
    if (!file?.type.startsWith('image/')) return;
    setResult(null);
    setError(null);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target.result;
      setImage(dataUrl);
      await analyze(dataUrl.split(',')[1], file.type);
    };
    reader.readAsDataURL(file);
  };

  const analyze = async (base64, mimeType) => {
    setLoading(true);
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64, mimeType }),
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    handleFile(e.dataTransfer.files[0]);
  };

  return (
    <div className="page scanner-page">
      <div className="page-header">
        <h1>Scan Surplus Food</h1>
        <p>Take a photo of cafeteria leftovers. Claude identifies items and shelf life instantly.</p>
      </div>

      <div
        className={`camera-zone ${image ? 'has-image' : ''} ${loading ? 'scanning' : ''}`}
        onClick={() => !loading && fileRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        {image
          ? <img src={image} alt="Food scan" className="scan-preview" />
          : (
            <div className="camera-prompt">
              <div className="camera-icon-wrap">📷</div>
              <p className="camera-cta">Tap to scan food</p>
              <p className="camera-hint">Camera · File upload · Drag & drop</p>
            </div>
          )
        }

        {loading && (
          <div className="scan-overlay">
            <div className="spinner" />
            <p className="scan-status">Claude is analyzing…</p>
            <p className="scan-sub">Identifying items, quantities, shelf life</p>
          </div>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={(e) => handleFile(e.target.files[0])}
      />

      {error && (
        <div className="error-box">
          ⚠ {error} &nbsp;
          <button onClick={() => fileRef.current?.click()}>Try again</button>
        </div>
      )}

      {result && !loading && (
        <div className="results fade-in">
          <div className="results-top">
            <div>
              <h2 className="results-title">Analysis complete</h2>
              <p className="results-summary">{result.summary}</p>
            </div>
            <div className="meals-pill">
              <span className="meals-num">{result.total_meals}</span>
              <span className="meals-label">meals</span>
            </div>
          </div>

          {result.urgent && (
            <div className="urgent-notice">⚡ Items expiring soon — dispatch immediately</div>
          )}

          <div className="items-list">
            {result.items?.map((item, i) => {
              const c = CONDITION[item.condition] || CONDITION.fair;
              return (
                <div key={i} className="item-row">
                  <span className="item-name">{item.name}</span>
                  <span className="item-qty">{item.quantity} {item.unit}</span>
                  <span className="shelf-tag" style={{ color: c.color, background: c.bg }}>
                    {c.label} · {item.shelf_life_hours}h
                  </span>
                </div>
              );
            })}
          </div>

          <button className="btn-primary" onClick={() => onComplete(result)}>
            Plan Rescue →
          </button>
        </div>
      )}

      {!image && !loading && (
        <p className="scan-tip">Works best with good lighting. The entire tray should be visible.</p>
      )}
    </div>
  );
}