import { useEffect, useState } from 'react';
import {
  Box, Card, CardContent, Typography, Switch, Chip, Avatar,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Alert, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, MenuItem, CircularProgress, Tooltip,
  IconButton,
} from '@mui/material';
import {
  PeopleAlt, PersonAdd, LockOpen, Lock, Refresh, Edit, Delete, Close,
} from '@mui/icons-material';
import { userApi } from '../../api/userApi';
import { User, UserRole } from '../../types';

const STAFF_ROLES = [
  { value: UserRole.Manager,    label: 'Manager',     color: '#0288D1' },
  { value: UserRole.EntryStaff, label: 'Entry Staff', color: '#2E7D32' },
  { value: UserRole.ExitStaff,  label: 'Exit Staff',  color: '#E65100' },
  { value: UserRole.Auditor,    label: 'Auditor',     color: '#5D4037' },
];

const roleColor = (role: UserRole) =>
  STAFF_ROLES.find(r => r.value === role)?.color ?? '#757575';

const emptyCreate = { firstName: '', lastName: '', email: '', password: '', phone: '', role: UserRole.EntryStaff as UserRole };
const emptyEdit   = { firstName: '', lastName: '', email: '', phone: '', role: UserRole.EntryStaff as UserRole };

export const StaffManagement = () => {
  const [users, setUsers]     = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg]         = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating]     = useState(false);
  const [createForm, setCreateForm] = useState(emptyCreate);
  const [createErr, setCreateErr]   = useState('');

  // Edit dialog
  const [editOpen, setEditOpen]   = useState(false);
  const [editTarget, setEditTarget] = useState<User | null>(null);
  const [editForm, setEditForm]   = useState(emptyEdit);
  const [saving, setSaving]       = useState(false);

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [deleting, setDeleting]         = useState(false);

  // Login toggle confirm
  const [toggleUser, setToggleUser]     = useState<User | null>(null);
  const [pendingLogin, setPendingLogin] = useState(false);
  const [reason, setReason]            = useState('');

  const showMsg = (type: 'success' | 'error', text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 4000);
  };

  const load = async () => {
    setLoading(true);
    try {
      const res = await userApi.getLoginStatus();
      if (res.success) setUsers(res.data);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  // ── Create ──
  const handleCreate = async () => {
    setCreateErr('');
    if (!createForm.firstName || !createForm.lastName || !createForm.email || !createForm.password) {
      setCreateErr('First name, last name, email and password are required.'); return;
    }
    if (createForm.password.length < 6) {
      setCreateErr('Password must be at least 6 characters.'); return;
    }
    setCreating(true);
    try {
      const res = await userApi.create({
        firstName: createForm.firstName, lastName: createForm.lastName,
        email: createForm.email, password: createForm.password,
        phone: createForm.phone || null, role: createForm.role,
        organizationId: null, assignedLocationId: null,
      });
      if (res.success) {
        showMsg('success', `Staff member "${createForm.firstName} ${createForm.lastName}" created!`);
        setCreateOpen(false);
        setCreateForm(emptyCreate);
        load();
      } else {
        setCreateErr(res.message || 'Failed to create staff.');
      }
    } catch (e: unknown) {
      const m = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setCreateErr(m || 'Failed to create staff.');
    } finally { setCreating(false); }
  };

  // ── Edit ──
  const openEdit = (u: User) => {
    setEditTarget(u);
    setEditForm({ firstName: u.firstName, lastName: u.lastName, email: u.email, phone: u.phone ?? '', role: u.role });
    setEditOpen(true);
  };

  const handleEdit = async () => {
    if (!editTarget) return;
    setSaving(true);
    try {
      const res = await userApi.update(editTarget.id, editForm);
      if (res.success) {
        setUsers(prev => prev.map(u => u.id === editTarget.id
          ? { ...u, ...editForm, roleName: STAFF_ROLES.find(r => r.value === editForm.role)?.label ?? u.roleName }
          : u));
        showMsg('success', 'Staff member updated successfully.');
        setEditOpen(false);
      } else {
        showMsg('error', res.message || 'Update failed.');
      }
    } catch { showMsg('error', 'Failed to update staff member.'); }
    finally { setSaving(false); }
  };

  // ── Delete ──
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await userApi.delete(deleteTarget.id);
      if (res.success) {
        setUsers(prev => prev.filter(u => u.id !== deleteTarget.id));
        showMsg('success', `"${deleteTarget.firstName} ${deleteTarget.lastName}" deleted.`);
        setDeleteTarget(null);
      } else {
        showMsg('error', res.message || 'Delete failed.');
      }
    } catch { showMsg('error', 'Failed to delete staff member.'); }
    finally { setDeleting(false); }
  };

  // ── Toggle Login ──
  const confirmToggle = async () => {
    if (!toggleUser) return;
    try {
      const res = await userApi.toggleLogin(toggleUser.id, pendingLogin, reason);
      if (res.success) {
        setUsers(prev => prev.map(u => u.id === toggleUser.id ? { ...u, isLoginEnabled: pendingLogin } : u));
        showMsg('success', 'Login access updated.');
      }
    } catch { showMsg('error', 'Failed to update access.'); }
    finally { setToggleUser(null); setReason(''); }
  };

  const activeCount  = users.filter(u => u.isLoginEnabled && u.isActive).length;
  const blockedCount = users.filter(u => !u.isLoginEnabled).length;

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h5" fontWeight={700} display="flex" alignItems="center" gap={1}>
            <PeopleAlt sx={{ color: '#2E7D32' }} /> Staff Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Create, edit, delete staff accounts and control their login access
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Tooltip title="Refresh">
            <IconButton onClick={load} size="small"><Refresh /></IconButton>
          </Tooltip>
          <Button variant="contained" startIcon={<PersonAdd />} onClick={() => setCreateOpen(true)}
            sx={{ bgcolor: '#2E7D32', '&:hover': { bgcolor: '#1B5E20' } }}>
            Add Staff Member
          </Button>
        </Box>
      </Box>

      {/* Summary chips */}
      <Box display="flex" gap={2} mb={3} flexWrap="wrap">
        {[
          { label: `${users.length} Total Staff`,  color: '#1976D2' },
          { label: `${activeCount} Active`,          color: '#2E7D32' },
          { label: `${blockedCount} Login Blocked`,  color: '#C62828' },
        ].map(s => (
          <Chip key={s.label} label={s.label} size="medium"
            sx={{ bgcolor: `${s.color}15`, color: s.color, fontWeight: 600, px: 1 }} />
        ))}
      </Box>

      {msg && <Alert severity={msg.type} onClose={() => setMsg(null)} sx={{ mb: 2 }}>{msg.text}</Alert>}

      {/* Staff Table */}
      <Card elevation={0} sx={{ border: '1px solid #E0E0E0', borderRadius: 2 }}>
        <CardContent sx={{ p: 0 }}>
          {loading ? (
            <Box display="flex" justifyContent="center" py={4}><CircularProgress sx={{ color: '#2E7D32' }} /></Box>
          ) : (
            <TableContainer component={Paper} elevation={0}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#F5F5F5' }}>
                    <TableCell><strong>Staff Member</strong></TableCell>
                    <TableCell><strong>Role</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                    <TableCell><strong>Last Login</strong></TableCell>
                    <TableCell align="center"><strong>Login Access</strong></TableCell>
                    <TableCell align="center"><strong>Actions</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                        No staff members yet. Click "Add Staff Member" to create one.
                      </TableCell>
                    </TableRow>
                  )}
                  {users.map(u => (
                    <TableRow key={u.id} sx={{ '&:hover': { bgcolor: '#FAFAFA' } }}>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1.5}>
                          <Avatar sx={{ width: 36, height: 36, fontSize: 14, bgcolor: roleColor(u.role) }}>
                            {u.firstName.charAt(0)}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight={600}>{u.firstName} {u.lastName}</Typography>
                            <Typography variant="caption" color="text.secondary">{u.email}</Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip label={u.roleName} size="small"
                          sx={{ bgcolor: `${roleColor(u.role)}18`, color: roleColor(u.role), fontWeight: 600 }} />
                      </TableCell>
                      <TableCell>
                        <Chip label={u.isActive ? 'Active' : 'Deactivated'} size="small"
                          color={u.isActive ? 'success' : 'error'} variant="outlined" />
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {u.lastLoginAt
                            ? new Date(u.lastLoginAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })
                            : 'Never'}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title={u.isLoginEnabled ? 'Click to DISABLE login' : 'Click to ENABLE login'}>
                          <Box display="flex" alignItems="center" justifyContent="center" gap={0.5}>
                            {u.isLoginEnabled
                              ? <LockOpen sx={{ fontSize: 16, color: '#2E7D32' }} />
                              : <Lock sx={{ fontSize: 16, color: '#C62828' }} />}
                            <Switch checked={u.isLoginEnabled} color="success" size="small"
                              onChange={e => { setToggleUser(u); setPendingLogin(e.target.checked); }} />
                          </Box>
                        </Tooltip>
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="Edit Staff">
                          <IconButton size="small" onClick={() => openEdit(u)} sx={{ color: '#1976D2' }}>
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Staff">
                          <IconButton size="small" onClick={() => setDeleteTarget(u)} sx={{ color: '#C62828' }}>
                            <Delete fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* ── Create Staff Dialog ── */}
      <Dialog open={createOpen} onClose={() => { setCreateOpen(false); setCreateErr(''); }} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Add New Staff Member</DialogTitle>
        <DialogContent>
          {createErr && <Alert severity="error" sx={{ mb: 2 }}>{createErr}</Alert>}
          <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2} mt={1}>
            <TextField label="First Name *" value={createForm.firstName}
              onChange={e => setCreateForm(p => ({ ...p, firstName: e.target.value }))} />
            <TextField label="Last Name *" value={createForm.lastName}
              onChange={e => setCreateForm(p => ({ ...p, lastName: e.target.value }))} />
            <TextField label="Email *" type="email" value={createForm.email} sx={{ gridColumn: 'span 2' }}
              onChange={e => setCreateForm(p => ({ ...p, email: e.target.value }))} />
            <TextField label="Password *" type="password" value={createForm.password}
              onChange={e => setCreateForm(p => ({ ...p, password: e.target.value }))} helperText="Min 6 characters" />
            <TextField label="Phone (optional)" value={createForm.phone}
              onChange={e => setCreateForm(p => ({ ...p, phone: e.target.value }))} />
            <TextField select label="Role *" value={createForm.role} sx={{ gridColumn: 'span 2' }}
              onChange={e => setCreateForm(p => ({ ...p, role: Number(e.target.value) as UserRole }))}>
              {STAFF_ROLES.map(r => (
                <MenuItem key={r.value} value={r.value}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: r.color }} />
                    {r.label}
                  </Box>
                </MenuItem>
              ))}
            </TextField>
          </Box>
          <Alert severity="info" sx={{ mt: 2 }} icon={false}>
            The staff member can login immediately using this email and password.
          </Alert>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={() => { setCreateOpen(false); setCreateErr(''); }} color="inherit">Cancel</Button>
          <Button onClick={handleCreate} variant="contained" disabled={creating}
            sx={{ bgcolor: '#2E7D32', '&:hover': { bgcolor: '#1B5E20' }, minWidth: 140 }}>
            {creating ? <CircularProgress size={20} color="inherit" /> : 'Create Staff Member'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Edit Staff Dialog ── */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Edit Staff Member
          <IconButton onClick={() => setEditOpen(false)}><Close /></IconButton>
        </DialogTitle>
        <DialogContent>
          <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2} mt={1}>
            <TextField label="First Name *" value={editForm.firstName}
              onChange={e => setEditForm(p => ({ ...p, firstName: e.target.value }))} />
            <TextField label="Last Name *" value={editForm.lastName}
              onChange={e => setEditForm(p => ({ ...p, lastName: e.target.value }))} />
            <TextField label="Email *" type="email" value={editForm.email} sx={{ gridColumn: 'span 2' }}
              onChange={e => setEditForm(p => ({ ...p, email: e.target.value }))} />
            <TextField label="Phone" value={editForm.phone}
              onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))} />
            <TextField select label="Role *" value={editForm.role}
              onChange={e => setEditForm(p => ({ ...p, role: Number(e.target.value) as UserRole }))}>
              {STAFF_ROLES.map(r => (
                <MenuItem key={r.value} value={r.value}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: r.color }} />
                    {r.label}
                  </Box>
                </MenuItem>
              ))}
            </TextField>
          </Box>
          <Alert severity="info" sx={{ mt: 2 }} icon={false}>
            To change the password, use the reset password option separately.
          </Alert>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={() => setEditOpen(false)} color="inherit">Cancel</Button>
          <Button onClick={handleEdit} variant="contained" disabled={saving}
            sx={{ bgcolor: '#1976D2', '&:hover': { bgcolor: '#1565C0' }, minWidth: 120 }}>
            {saving ? <CircularProgress size={20} color="inherit" /> : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Delete Confirm Dialog ── */}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, color: '#C62828' }}>Delete Staff Member</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete <strong>"{deleteTarget?.firstName} {deleteTarget?.lastName}"</strong>?
          </Typography>
          <Alert severity="warning" sx={{ mt: 2 }}>
            Their account will be deactivated and login blocked. All their activity data is preserved (soft delete).
          </Alert>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteTarget(null)} color="inherit">Cancel</Button>
          <Button onClick={handleDelete} variant="contained" disabled={deleting}
            sx={{ bgcolor: '#C62828', '&:hover': { bgcolor: '#B71C1C' } }}>
            {deleting ? <CircularProgress size={20} color="inherit" /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Toggle Login Confirm ── */}
      <Dialog open={!!toggleUser} onClose={() => setToggleUser(null)} maxWidth="xs" fullWidth>
        <DialogTitle fontWeight={700}>
          {pendingLogin ? 'Enable Login Access' : 'Disable Login Access'}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" gutterBottom>
            {pendingLogin
              ? `${toggleUser?.firstName} ${toggleUser?.lastName} will be able to login.`
              : `${toggleUser?.firstName} ${toggleUser?.lastName} will NOT be able to login until re-enabled.`}
          </Typography>
          <TextField fullWidth label="Reason (optional)" value={reason}
            onChange={e => setReason(e.target.value)} size="small" sx={{ mt: 2 }} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setToggleUser(null)} variant="outlined">Cancel</Button>
          <Button onClick={confirmToggle} variant="contained"
            sx={{ bgcolor: pendingLogin ? '#2E7D32' : '#C62828',
                  '&:hover': { bgcolor: pendingLogin ? '#1B5E20' : '#B71C1C' } }}>
            {pendingLogin ? 'Enable' : 'Disable'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
