import { useState, useEffect } from 'react';
import { useTheme } from '../theme';
import { getPunchStatus, punchIn, punchOut } from '../api';
import PunchButton from './PunchButton';

const pad = (n) => String(n).padStart(2, '0');

function useTimer(startTime) {
  const [display, setDisplay] = useState('00:00:00');
  useEffect(() => {
    if (!startTime) { setDisplay('00:00:00'); return; }
    const tick = () => {
      const diff = Math.floor((Date.now() - new Date(startTime).getTime()) / 1000);
      setDisplay(`${pad(Math.floor(diff / 3600))}:${pad(Math.floor((diff % 3600) / 60))}:${pad(diff % 60)}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startTime]);
  return display;
}

const fmtTime = (ts) => new Date(ts).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
};

export default function ClockScreen({ user }) {
  const { c } = useTheme();
  const [clockedIn, setClockedIn] = useState(false);
  const [clockInTime, setClockInTime] = useState(null);
  const [punching, setPunching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const timer = useTimer(clockedIn ? clockInTime : null);

  // Load punch status on mount
  useEffect(() => {
    getPunchStatus()
      .then((data) => {
        setClockedIn(data.clocked_in);
        if (data.clocked_in) setClockInTime(data.clock_in);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const punch = async () => {
    if (punching) return;
    setPunching(true);
    setError(null);
    try {
      if (clockedIn) {
        await punchOut();
        setClockedIn(false);
        setClockInTime(null);
      } else {
        const entry = await punchIn();
        setClockedIn(true);
        setClockInTime(entry.clock_in);
      }
    } catch (err) {
      setError(err.message);
    }
    setPunching(false);
  };

  const firstName = user?.name?.split(' ')[0] || 'there';

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 68px)', color: c.text3 }}>
        Loading...
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 68px)', padding: 24, gap: 28 }}>
      <div style={{ width: 40, height: 2, background: c.accent, borderRadius: 1, opacity: 0.5 }} />
      <div style={{ fontSize: 26, color: c.text2, fontWeight: 300 }}>
        {greeting()}, <span style={{ color: c.text, fontWeight: 600 }}>{firstName}</span>
      </div>

      <PunchButton isIn={clockedIn} punching={punching} onPunch={punch} />

      <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: '0.12em', color: c.text2, textTransform: 'uppercase' }}>
        {clockedIn ? 'Clock Out' : 'Clock In'}
      </div>

      {clockedIn ? (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 15, color: c.text3, marginBottom: 8 }}>
            Since <span style={{ color: c.accent, fontWeight: 500 }}>{fmtTime(clockInTime)}</span>
          </div>
          <div style={{ fontSize: 52, fontWeight: 200, color: c.text, letterSpacing: '0.05em', fontFamily: 'monospace', fontVariantNumeric: 'tabular-nums' }}>{timer}</div>
          <div style={{ width: 48, height: 2, background: c.accent, margin: '16px auto 0', borderRadius: 1, opacity: 0.4 }} />
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 16, color: c.text3, fontWeight: 400 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: c.text3, opacity: 0.5 }} /> Off duty
        </div>
      )}

      {error && (
        <div style={{ color: c.red, fontSize: 13, padding: '8px 16px', background: `${c.red}15`, borderRadius: 8 }}>{error}</div>
      )}
    </div>
  );
}
