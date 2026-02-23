import { useTheme } from '../theme';
import { ClockIcon, ListIcon, GearIcon } from './Icons';

const tabs = [
  { id: 'clock', Icon: ClockIcon, label: 'Clock' },
  { id: 'hours', Icon: ListIcon, label: 'Hours' },
  { id: 'admin', Icon: GearIcon, label: 'Admin' },
];

export default function Nav({ tab, setTab, isAdmin }) {
  const { c } = useTheme();

  const visibleTabs = isAdmin ? tabs : tabs.filter((t) => t.id !== 'admin');

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
      width: '100%', maxWidth: 460, display: 'flex', justifyContent: 'space-around',
      alignItems: 'center', background: c.navBg, borderTop: `1px solid ${c.navBorder}`,
      padding: '8px 0 12px', zIndex: 100,
    }}>
      {visibleTabs.map(({ id, Icon, label }) => (
        <div key={id} onClick={() => setTab(id)} style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
          padding: '4px 20px', cursor: 'pointer', position: 'relative',
        }}>
          {tab === id && (
            <div style={{ position: 'absolute', top: -9, width: 20, height: 2.5, background: c.accent, borderRadius: 2 }} />
          )}
          <Icon size={22} color={tab === id ? c.text : c.text3} />
          <span style={{ fontSize: 11, fontWeight: 500, color: tab === id ? c.text : c.text3 }}>{label}</span>
        </div>
      ))}
    </div>
  );
}
