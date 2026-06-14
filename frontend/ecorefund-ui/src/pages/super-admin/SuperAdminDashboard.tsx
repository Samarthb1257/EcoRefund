import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Box, Card, CardContent, Grid, Typography, Button, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  CircularProgress, Switch, Alert, Tabs, Tab, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, MenuItem, Select,
  FormControl, InputLabel, IconButton, Tooltip,
} from '@mui/material';
import {
  Business, PeopleAlt, CheckCircle, PersonAdd,
  LockOpen, Refresh,
} from '@mui/icons-material';
import { organizationApi } from '../../api/organizationApi';
import { userApi } from '../../api/userApi';
import { Organization, UserRole } from '../../types';

const ROLE_OPTIONS = [
  { value: UserRole.SuperAdmin, label: 'Super Admin' },
  { value: UserRole.OrgAdmin, label: 'Org Admin' },
  { value: UserRole.Manager, label: 'Manager' },
  { value: UserRole.EntryStaff, label: 'Entry Staff' },
  { value: UserRole.ExitStaff, label: 'Exit Staff' },
  { value: UserRole.Auditor, label: 'Auditor' },
];

interface UserRow {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: UserRole;
  roleName: string;
  isActive: boolean;
  isLoginEnabled: boolean;
  lastLoginAt?: string;
  createdAt: string;
}

export const SuperAdminDashboard = () => {
  const location = useLocation();
  const isUsersTab = location.pathname.includes('/users') || location.pathname.includes('platform');
  const [tab, setTab] = useState(isUsersTab ? 1 : 0);

  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loadingOrgs, setLoadingOrgs] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Create user dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', password: '',
    phone: '', role: UserRole.OrgAdmin, organizationId: '',
  });

  useEffect(() => {
    organizationApi.getAll()
      .then(res => { if (res.success) setOrgs(res.data); })
      .finally(() => setLoadingOrgs(false));
  }, []);

  useEffect(() => {
    if (tab === 1) {
      setLoadingUsers(true);
      userApi.getAll(1, 100)
        .then(res => { if (res.success) setUsers(res.data); })
        .finally(() => setLoadingUsers(false));
    }
  }, [tab]);

  const toggleOrgLogin = async (org: Organization) => {
    try {
      const res = await organizationApi.toggleLogin(org.id, !org.isLoginEnabled);
      if (res.success) {
        setOrgs(prev => prev.map(o => o.id === org.id ? { ...o, isLoginEnabled: !o.isLoginEnabled } : o));
        setMsg({ type: 'success', text: res.message });
      }
    } catch { setMsg({ type: 'error', text: 'Failed to update.' }); }
  };

  const toggleOrgActive = async (org: Organization) => {
    try {
      const res = await organizationApi.toggleActive(org.id, !org.isActive);
      if (res.success) {
        setOrgs(prev => prev.map(o => o.id === org.id ? { ...o, isActive: !o.isActive } : o));
        setMsg({ type: 'success', text: res.message });
      }
    } catch { setMsg({ type: 'error', text: 'Failed to update.' }); }
  };

  const toggleUserLogin = async (u: UserRow) => {
    try {
      const res = await userApi.toggleLogin(u.id, !u.isLoginEnabled);
      if (res.success) {
        setUsers(prev => prev.map(x => x.id === u.id ? { ...x, isLoginEnabled: !x.isLoginEnabled } : x));
        setMsg({ type: 'success', text: res.message });
      }
    } catch { setMsg({ type: 'error', text: 'Failed to update.' }); }
  };

  const handleCreate = async () => {
    if (!form.firstName || !form.lastName || !form.email || !form.password) {
      setMsg({ type: 'error', text: 'Fill in all required fields.' });
      return;
    }
    setCreating(true);
    try {
      const res = await userApi.create({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        password: form.password,
        phone: form.phone || null,
        role: form.role,
        organizationId: form.organizationId || null,
        assignedLocationId: null,
      });
      if (res.success) {
        setMsg({ type: 'success', text: `User "${form.firstName} ${form.lastName}" created successfully!` });
        setCreateOpen(false);
        setForm({ firstName: '', lastName: '', email: '', password: '', phone: '', role: UserRole.OrgAdmin, organizationId: '' });
        // Refresh users list
        userApi.getAll(1, 100).then(r => { if (r.success) setUsers(r.data); });
      } else {
        setMsg({ type: 'error', text: res.message || 'Failed to create user.' });
      }
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setMsg({ type: 'error', text: msg || 'Failed to create user.' });
    } finally {
      setCreating(false);
    }
  };

  const totalOrgs = orgs.length;
  const activeOrgs = orgs.filter(o => o.isActive).length;
  const loginEnabledOrgs = orgs.filter(o => o.isLoginEnabled).length;

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Super Admin Dashboard</Typography>
          <Typography variant="body2" color="text.secondary">Platform-wide management — all tenants visible here</Typography>
        </Box>
        {tab === 1 && (
          <Button variant="contained" startIcon={<PersonAdd />} onClick={() => setCreateOpen(true)}
            sx={{ bgcolor: '#2E7D32', '&:hover': { bgcolor: '#1B5E20' } }}>
            Create User
          </Button>
        )}
      </Box>

      {msg && <Alert severity={msg.type} onClose={() => setMsg(null)} sx={{ mb: 2 }}>{msg.text}</Alert>}

      {/* Stats */}
      <Grid container spacing={2} mb={3}>
        {[
          { label: 'Total Organizations', value: totalOrgs, icon: <Business />, color: '#1976D2' },
          { label: 'Active Orgs', value: activeOrgs, icon: <CheckCircle />, color: '#2E7D32' },
          { label: 'Login Enabled', value: loginEnabledOrgs, icon: <LockOpen />, color: '#7B1FA2' },
          { label: 'Total Users', value: users.length || '—', icon: <PeopleAlt />, color: '#E65100' },
        ].map(s => (
          <Grid item xs={6} md={3} key={s.label}>
            <Card elevation={0} sx={{ border: '1px solid #E0E0E0', borderRadius: 2 }}>
              <CardContent sx={{ py: 2 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="caption" color="text.secondary">{s.label}</Typography>
                    <Typography variant="h4" fontWeight={700} sx={{ color: s.color }}>{s.value}</Typography>
                  </Box>
                  <Box sx={{ color: s.color, bgcolor: `${s.color}15`, borderRadius: 2, p: 1.5 }}>{s.icon}</Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Tabs */}
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2, borderBottom: '1px solid #E0E0E0' }}>
        <Tab label="Organizations" icon={<Business />} iconPosition="start" />
        <Tab label="Users" icon={<PeopleAlt />} iconPosition="start" />
      </Tabs>

      {/* Organizations Tab */}
      {tab === 0 && (
        <Card elevation={0} sx={{ border: '1px solid #E0E0E0', borderRadius: 2 }}>
          <CardContent sx={{ p: 0 }}>
            <Box sx={{ p: 2, borderBottom: '1px solid #F5F5F5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" fontWeight={600}>All Organizations</Typography>
              <Button size="small" href="/register" variant="outlined" startIcon={<Business />}
                sx={{ borderColor: '#2E7D32', color: '#2E7D32' }}>
                Register New Org
              </Button>
            </Box>
            {loadingOrgs ? (
              <Box display="flex" justifyContent="center" py={4}><CircularProgress /></Box>
            ) : orgs.length === 0 ? (
              <Box textAlign="center" py={6}>
                <Business sx={{ fontSize: 48, color: '#BDBDBD', mb: 1 }} />
                <Typography color="text.secondary">No organizations yet.</Typography>
                <Button href="/register" variant="contained" sx={{ mt: 2, bgcolor: '#2E7D32' }}>
                  Register First Organization
                </Button>
              </Box>
            ) : (
              <TableContainer component={Paper} elevation={0}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#F5F5F5' }}>
                      <TableCell><strong>Code</strong></TableCell>
                      <TableCell><strong>Organization</strong></TableCell>
                      <TableCell><strong>Plan</strong></TableCell>
                      <TableCell><strong>Active</strong></TableCell>
                      <TableCell><strong>Login Access</strong></TableCell>
                      <TableCell><strong>Created</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {orgs.map(org => (
                      <TableRow key={org.id} sx={{ '&:hover': { bgcolor: '#F9F9F9' } }}>
                        <TableCell>
                          <Chip label={org.organizationCode} size="small" sx={{ bgcolor: '#E3F2FD', color: '#1565C0', fontFamily: 'monospace' }} />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>{org.organizationName}</Typography>
                          <Typography variant="caption" color="text.secondary">{org.email}</Typography>
                        </TableCell>
                        <TableCell>
                          <Chip label={['', 'Free', 'Starter', 'Pro', 'Enterprise'][org.subscriptionPlan] || 'Free'}
                            size="small" color={org.subscriptionPlan >= 3 ? 'success' : 'default'} variant="outlined" />
                        </TableCell>
                        <TableCell>
                          <Switch checked={org.isActive} onChange={() => toggleOrgActive(org)} color="success" size="small" />
                        </TableCell>
                        <TableCell>
                          <Switch checked={org.isLoginEnabled} onChange={() => toggleOrgLogin(org)} color="primary" size="small" />
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(org.createdAt).toLocaleDateString('en-IN')}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      )}

      {/* Users Tab */}
      {tab === 1 && (
        <Card elevation={0} sx={{ border: '1px solid #E0E0E0', borderRadius: 2 }}>
          <CardContent sx={{ p: 0 }}>
            <Box sx={{ p: 2, borderBottom: '1px solid #F5F5F5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" fontWeight={600}>All Platform Users</Typography>
              <Tooltip title="Refresh">
                <IconButton size="small" onClick={() => {
                  setLoadingUsers(true);
                  userApi.getAll(1, 100).then(r => { if (r.success) setUsers(r.data); }).finally(() => setLoadingUsers(false));
                }}>
                  <Refresh />
                </IconButton>
              </Tooltip>
            </Box>
            {loadingUsers ? (
              <Box display="flex" justifyContent="center" py={4}><CircularProgress /></Box>
            ) : (
              <TableContainer component={Paper} elevation={0}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#F5F5F5' }}>
                      <TableCell><strong>Name</strong></TableCell>
                      <TableCell><strong>Email</strong></TableCell>
                      <TableCell><strong>Role</strong></TableCell>
                      <TableCell><strong>Active</strong></TableCell>
                      <TableCell><strong>Login Access</strong></TableCell>
                      <TableCell><strong>Last Login</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {users.map(u => (
                      <TableRow key={u.id} sx={{ '&:hover': { bgcolor: '#F9F9F9' } }}>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>{u.firstName} {u.lastName}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption">{u.email}</Typography>
                        </TableCell>
                        <TableCell>
                          <Chip label={u.roleName} size="small"
                            sx={{
                              bgcolor: u.role === UserRole.SuperAdmin ? '#9C27B015' : u.role === UserRole.OrgAdmin ? '#1976D215' : '#E8F5E9',
                              color: u.role === UserRole.SuperAdmin ? '#9C27B0' : u.role === UserRole.OrgAdmin ? '#1976D2' : '#2E7D32',
                              fontWeight: 600,
                            }} />
                        </TableCell>
                        <TableCell>
                          <Chip label={u.isActive ? 'Active' : 'Inactive'} size="small"
                            color={u.isActive ? 'success' : 'error'} variant="outlined" />
                        </TableCell>
                        <TableCell>
                          <Tooltip title={u.isLoginEnabled ? 'Click to disable login' : 'Click to enable login'}>
                            <Switch checked={u.isLoginEnabled} onChange={() => toggleUserLogin(u)}
                              color="primary" size="small"
                              disabled={u.role === UserRole.SuperAdmin} />
                          </Tooltip>
                          {u.role === UserRole.SuperAdmin && (
                            <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>Always on</Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" color="text.secondary">
                            {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString('en-IN') : 'Never'}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      )}

      {/* Create User Dialog */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Create New User</DialogTitle>
        <DialogContent>
          <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2} mt={1}>
            <TextField label="First Name *" value={form.firstName}
              onChange={e => setForm(p => ({ ...p, firstName: e.target.value }))} fullWidth />
            <TextField label="Last Name *" value={form.lastName}
              onChange={e => setForm(p => ({ ...p, lastName: e.target.value }))} fullWidth />
            <TextField label="Email *" type="email" value={form.email}
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))} fullWidth sx={{ gridColumn: 'span 2' }} />
            <TextField label="Password *" type="password" value={form.password}
              onChange={e => setForm(p => ({ ...p, password: e.target.value }))} fullWidth />
            <TextField label="Phone" value={form.phone}
              onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} fullWidth />
            <FormControl fullWidth>
              <InputLabel>Role *</InputLabel>
              <Select value={form.role} label="Role *"
                onChange={e => setForm(p => ({ ...p, role: Number(e.target.value) as UserRole }))}>
                {ROLE_OPTIONS.map(r => (
                  <MenuItem key={r.value} value={r.value}>{r.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Organization</InputLabel>
              <Select value={form.organizationId} label="Organization"
                onChange={e => setForm(p => ({ ...p, organizationId: e.target.value }))}>
                <MenuItem value=""><em>None (Platform user)</em></MenuItem>
                {orgs.map(o => (
                  <MenuItem key={o.id} value={o.id}>{o.organizationName} ({o.organizationCode})</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            * Required fields. Leave Organization empty for platform-level users (SuperAdmin).
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setCreateOpen(false)} color="inherit">Cancel</Button>
          <Button onClick={handleCreate} variant="contained" disabled={creating}
            sx={{ bgcolor: '#2E7D32', '&:hover': { bgcolor: '#1B5E20' } }}>
            {creating ? <CircularProgress size={20} color="inherit" /> : 'Create User'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
