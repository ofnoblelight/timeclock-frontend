import { useState, useEffect } from 'react';
import { useTheme } from '../theme';
import { getAllEntries, getUsers, updateUser, editEntry, deleteEntry, createManualEntry, exportCsv, downloadCsv } from '../api';
import { PaletteIcon } from './Icons';

const fmtTime = (ts) => new Date(ts).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
const fmtDay = (ts) => new Date(ts).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

function getWeekRange() {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - 7);
  return { start: start.toISOString(), end: now.toISOString() };
}

function toLocalDatetime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

export default function AdminScreen({ onSettings }) {
  const { c } = useTheme();
  const [sub, setSub] = useState('team');
  const [entries, setEntries] = useState([]);
  const [summary, setSummary] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [editingEntry, setEditingEntry] = useState(null);
  const [showManual, setShowManual] = useState(false);
  const [formData, setFormData] = useState({ clock_in: '', clock_out: '', notes: '', user_id: '' });
  const [saving, setSaving] = useState(false);

  const range = getWeekRange();

  const loadData = async () => {
    setLoading(true);
    try {
      const [entryData, userData] = await Promise.all([
        getAllEntries(range.start, range.end),
        getUsers(),
      ]);
      setEntries(entryData.entries);
      setSummary(entryData.user_summary);
      setUsers(userData.users);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const handleExport = async () => {
    try {
      const csv = await exportCsv(range.start, range.end);
      const now = new Date();
      downloadCsv(csv, `timesheet_${now.toISOString().slice(0, 10)}.csv`);
    } catch (err) {
      alert('Export failed: ' + err.message);
    }
  };

  const openEdit = (entry) => {
    setEditingEntry(entry);
    setFormData({
      clock_in: toLocalDatetime(entry.clock_in),
      clock_out: toLocalDatetime(entry.clock_out),
      notes: entry.notes || '',
      user_id: '',
    });
  };

  const openManual = () => {
    setShowManual(true);
    setFormData({ clock_in: '', clock_out: '', notes: '', user_id: '' });
  };

  const closeModal = () => {
    setEditingEntry(null);
    setShowManual(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editingEntry) {
        await editEntry(editingEntry.id, {
          clock_in: new Date(formData.clock_in).toISOString(),
          clock_out: formData.clock_out ? new Date(formData.clock_out).toISOString() : undefined,
          notes: formData.notes || undefined,
        });
      } else {
        await createManualEntry({
          user_id: formData.user_id,
          clock_in: new Date(formData.clock_in).toISOString(),
          clock_out: new Date(formData.clock_out).toISOString(),
          notes: formData.notes || undefined,
        });
      }
      closeModal();
      loadData();
    } catch (err) {
      alert('Save failed: ' + err.message);
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this entry?')) return;
    try {
      await deleteEntry(id);
      loadData();
    } catch (err) {
      alert('Delete failed: ' + err.message);
    }
  };

  const handleRoleChange = async (userId, role) => {
    try {
      await updateUser(userId, { role });
      loadData();
    } catch (err) {
      alert('Update failed: ' + err.message);
    }
  };

  const inp = {
    width: '100%', padding: '10px 12px', background: c.surface2, border: `1px solid ${c.border}`,
    borderRadius: 10, color: c.text, fontSize: 14, boxSizing: 'border-box', marginBottom: 2, fontFamily: 'inherit',
  };
  const lab = {
    fontSize: 11, color: c.text3, marginBottom: 4, marginTop: 14,
    fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em',
  };

  return (
    <div style={{ padding: '24px 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: c.text }}>Admin</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div onClick={onSettings} style={{ width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: c.surface2 }}>
            <PaletteIcon size={18} color={c.text3} />
          </div>
          <div onClick={handleExport} style={{ background: c.surface2, color: c.text, padding: '7px 14px', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>
            Export
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 24 }}>
        {['team', 'entries', 'users'].map((t) => (
          <div key={t} onClick={() => setSub(t)} style={{
            padding: '7px 16px', borderRadius: 20, cursor: 'pointer', fontSize: 13, fontWeight: 500,
            background: sub === t ? c.accent : c.surface2,
            color: sub === t ? '#fff' : c.text3,
          }}>{t.charAt(0).toUpperCase() + t.slice(1)}</div>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: c.text3 }}>Loading...</div>
      ) : (
        <>
          {sub === 'team' && (
            <div>
              <div onClick={openManual} style={{ border: `1.5px dashed ${c.border}`, color: c.text3, padding: 12, borderRadius: 12, textAlign: 'center', cursor: 'pointer', fontSize: 13, marginBottom: 10, fontWeight: 500 }}>
                + Manual Entry
              </div>
              {summary.map((u) => (
                <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 16, background: c.surface, borderRadius: 12, marginBottom: 6 }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 15, color: c.text }}>{u.name}</div>
                    <div style={{ fontSize: 12, color: c.text3, marginTop: 3 }}>{u.email}</div>
                  </div>
                  <div style={{ fontSize: 17, fontWeight: 700, color: c.text, fontFamily: 'monospace' }}>
                    {u.total_hours}<span style={{ fontSize: 12, fontWeight: 400, color: c.text3, marginLeft: 3 }}>hrs</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {sub === 'entries' && (
            <div>
              {entries.map((e) => (
                <div key={e.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '14px 16px', background: c.surface, borderRadius: 12, marginBottom: 6,
                  borderLeft: `3px solid ${!e.clock_out ? c.green : c.accent}`,
                }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: c.text, marginBottom: 3 }}>{e.user_name}</div>
                    <div style={{ fontSize: 14, display: 'flex', gap: 6, alignItems: 'center' }}>
                      <span style={{ color: c.text2 }}>{fmtTime(e.clock_in)}</span>
                      <span style={{ color: c.accent, fontSize: 11 }}>→</span>
                      <span style={{ color: c.text3 }}>{e.clock_out ? fmtTime(e.clock_out) : 'Active'}</span>
                    </div>
                    <div style={{ fontSize: 11, color: c.text3, marginTop: 3 }}>{fmtDay(e.clock_in)}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: c.text2, fontFamily: 'monospace' }}>
                      {e.duration_minutes ? `${Math.floor(e.duration_minutes / 60)}h ${e.duration_minutes % 60}m` : 'LIVE'}
                    </span>
                    <span onClick={() => openEdit(e)} style={{ cursor: 'pointer', color: c.text3, fontSize: 15 }}>✎</span>
                    <span onClick={() => handleDelete(e.id)} style={{ cursor: 'pointer', color: c.red, fontSize: 13, opacity: 0.5 }}>✕</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {sub === 'users' && (
            <div>
              {users.map((u) => (
                <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 16, background: c.surface, borderRadius: 12, marginBottom: 6 }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 15, color: c.text }}>{u.name}</div>
                    <div style={{ fontSize: 12, color: c.text3, marginTop: 3 }}>{u.email} · {u.role}</div>
                  </div>
                  <select
                    value={u.role}
                    onChange={(e) => handleRoleChange(u.id, e.target.value)}
                    style={{ background: c.surface2, color: c.text, border: `1px solid ${c.border}`, padding: '5px 10px', borderRadius: 8, fontSize: 12, fontFamily: 'inherit' }}
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Edit / Manual Entry Modal */}
      {(editingEntry || showManual) && (
        <div style={{ position: 'fixed', inset: 0, background: c.overlay, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 20 }}>
          <div style={{ background: c.surface, borderRadius: 20, padding: 24, width: '100%', maxWidth: 360 }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: c.text, marginBottom: 16 }}>
              {editingEntry ? 'Edit Entry' : 'Manual Entry'}
            </div>

            {showManual && (
              <>
                <div style={lab}>Employee</div>
                <select
                  value={formData.user_id}
                  onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                  style={inp}
                >
                  <option value="">Select...</option>
                  {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </>
            )}

            <div style={lab}>Clock In</div>
            <input
              type="datetime-local"
              value={formData.clock_in}
              onChange={(e) => setFormData({ ...formData, clock_in: e.target.value })}
              style={inp}
            />

            <div style={lab}>Clock Out</div>
            <input
              type="datetime-local"
              value={formData.clock_out}
              onChange={(e) => setFormData({ ...formData, clock_out: e.target.value })}
              style={inp}
            />

            <div style={lab}>Notes</div>
            <input
              type="text"
              placeholder="Optional"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              style={inp}
            />

            <div style={{ display: 'flex', gap: 8, marginTop: 20, justifyContent: 'flex-end' }}>
              <div onClick={closeModal} style={{ color: c.text3, padding: '9px 20px', borderRadius: 10, cursor: 'pointer', fontSize: 14, fontWeight: 500 }}>
                Cancel
              </div>
              <div onClick={handleSave} style={{
                background: c.accent, color: '#fff', padding: '9px 24px', borderRadius: 10,
                cursor: saving ? 'wait' : 'pointer', fontWeight: 600, fontSize: 14, opacity: saving ? 0.6 : 1,
              }}>
                {saving ? 'Saving...' : 'Save'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
