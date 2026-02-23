import { useState } from 'react';
import { useTheme } from '../theme';

const PRESETS = ['#f97316', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#eab308', '#ef4444', '#06b6d4', '#10b981', '#6366f1'];

export default function SettingsPanel({ onClose }) {
  const { c, accent, setAccent, mode, setMode } = useTheme();
  const [hex, setHex] = useState(accent);

  const applyHex = (val) => {
    const clean = val.startsWith('#') ? val : '#' + val;
    if (/^#[0-9a-fA-F]{6}$/.test(clean)) { setAccent(clean); setHex(clean); }
    else { setHex(val); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: c.overlay, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 300 }}>
      <div style={{ background: c.surface, borderRadius: '20px 20px 0 0', padding: '20px 24px 32px', width: '100%', maxWidth: 460 }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: c.raised, margin: '0 auto 20px' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: c.text }}>Appearance</div>
          <div onClick={onClose} style={{ color: c.accent, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Done</div>
        </div>

        <div style={{ fontSize: 11, color: c.text3, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Theme</div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 28 }}>
          {['dark', 'light'].map((m) => (
            <div key={m} onClick={() => setMode(m)} style={{
              flex: 1, padding: '11px 0', textAlign: 'center', borderRadius: 12, cursor: 'pointer', fontSize: 14, fontWeight: 600,
              background: mode === m ? c.accent : c.surface2,
              color: mode === m ? '#fff' : c.text3,
            }}>{m === 'dark' ? 'Dark' : 'Light'}</div>
          ))}
        </div>

        <div style={{ fontSize: 11, color: c.text3, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Brand Color</div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
          <div style={{ position: 'relative' }}>
            <input
              type="color" value={accent}
              onChange={(e) => { setAccent(e.target.value); setHex(e.target.value); }}
              style={{ width: 48, height: 48, border: 'none', borderRadius: 12, cursor: 'pointer', background: 'transparent', padding: 0 }}
            />
            <div style={{ position: 'absolute', inset: 0, borderRadius: 12, border: `2px solid ${c.border}`, pointerEvents: 'none' }} />
          </div>
          <div style={{ flex: 1 }}>
            <input
              type="text" value={hex}
              onChange={(e) => applyHex(e.target.value)}
              placeholder="#f97316" maxLength={7}
              style={{
                width: '100%', padding: '11px 14px', background: c.surface2, border: `1px solid ${c.border}`,
                borderRadius: 12, color: c.text, fontSize: 15, fontFamily: 'monospace', boxSizing: 'border-box', letterSpacing: '0.04em',
              }}
            />
          </div>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: accent, flexShrink: 0 }} />
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {PRESETS.map((color) => (
            <div key={color} onClick={() => { setAccent(color); setHex(color); }} style={{
              width: 32, height: 32, borderRadius: 10, background: color, cursor: 'pointer',
              outline: accent === color ? `2px solid ${c.text}` : 'none', outlineOffset: 2,
            }} />
          ))}
        </div>
      </div>
    </div>
  );
}
