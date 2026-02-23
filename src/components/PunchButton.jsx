import { useTheme } from '../theme';
import { Play, Stop } from './Icons';

export default function PunchButton({ isIn, punching, onPunch }) {
  const { c } = useTheme();
  const color = isIn ? c.red : c.green;
  const dk = isIn ? c.redDk : c.greenDk;

  return (
    <div
      onClick={onPunch}
      style={{
        width: 192, height: 192, borderRadius: '50%',
        background: `linear-gradient(160deg, ${color}40, ${dk}40)`,
        padding: 3, display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', transition: 'transform 0.15s',
        transform: punching ? 'scale(0.95)' : 'scale(1)',
      }}
    >
      <div style={{
        width: '100%', height: '100%', borderRadius: '50%',
        background: c.recess, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          width: 140, height: 140, borderRadius: '50%',
          background: `linear-gradient(160deg, ${color}, ${dk})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {isIn ? <Stop s={46} /> : <Play s={46} />}
        </div>
      </div>
    </div>
  );
}
