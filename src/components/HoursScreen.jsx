import { useState, useEffect } from 'react';
import { useTheme } from '../theme';
import { getMyEntries } from '../api';

const fmtTime = (ts) => new Date(ts).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
const fmtDay = (ts) => new Date(ts).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

function getRange(key) {
  const now = new Date();
  const start = new Date(now);
  if (key === 'week') start.setDate(now.getDate() - 7);
  else if (key === '2week') start.setDate(now.getDate() - 14);
  else start.setDate(now.getDate() - 31);
  return { start: start.toISOString(), end: now.toISOString() };
}

export default function HoursScreen() {
  const { c } = useTheme();
  const [range, setRange] = useState('week');
  const [entries, setEntries] = useState([]);
  const [totalHours, setTotalHours] = useState('0.00');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const { start, end } = getRange(range);
    getMyEntries(start, end)
      .then((data) => {
        setEntries(data.entries);
        setTotalHours(data.total_hours);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [range]);

  return (
    <div style={{ padding: '24px 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: c.text }}>My Timesheet</div>
        <div style={{ padding: '5px 14px', borderRadius: 20, fontSize: 14, fontWeight: 600, color: c.text, background: c.surface2 }}>
          {totalHours} hrs
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 24 }}>
        {[['week', 'This Week'], ['2week', '2 Weeks'], ['month', 'Month']].map(([k, l]) => (
          <div key={k} onClick={() => setRange(k)} style={{
            padding: '7px 16px', borderRadius: 20, cursor: 'pointer', fontSize: 13, fontWeight: 500,
            background: range === k ? c.accent : c.surface2,
            color: range === k ? '#fff' : c.text3,
          }}>{l}</div>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: c.text3 }}>Loading...</div>
      ) : entries.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: c.text3 }}>No entries</div>
      ) : entries.map((e) => (
        <div key={e.id} style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '14px 16px', background: c.surface, borderRadius: 12, marginBottom: 6,
          borderLeft: `3px solid ${!e.clock_out ? c.green : c.accent}`,
        }}>
          <div>
            <div style={{ fontSize: 11, color: c.text3, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
              {fmtDay(e.clock_in)}
            </div>
            <div style={{ fontSize: 15, display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontWeight: 500, color: c.text }}>{fmtTime(e.clock_in)}</span>
              <span style={{ color: c.accent, fontSize: 11 }}>→</span>
              <span style={{ color: c.text3 }}>{e.clock_out ? fmtTime(e.clock_out) : 'Active'}</span>
            </div>
          </div>
          <div style={{ fontSize: 15, fontWeight: 600, color: c.text2, fontFamily: 'monospace' }}>
            {e.duration_minutes
              ? `${Math.floor(e.duration_minutes / 60)}h ${e.duration_minutes % 60}m`
              : 'LIVE'}
          </div>
        </div>
      ))}
    </div>
  );
}
