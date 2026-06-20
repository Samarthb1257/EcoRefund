import { useEffect, useState, useCallback } from 'react';
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
  LockOpen, Refresh, Dashboard, FilterAlt,
  Edit, Delete, Close,
} from '@mui/icons-material';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartTooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import { organizationApi } from '../../api/organizationApi';
import { userApi } from '../../api/userApi';
import { Organization, UserRole, PlatformStats } from '../../types';

const ROLE_OPTIONS = [
  { value: UserRole.SuperAdmin, label: 'Super Admin' },
  { value: UserRole.OrgAdmin,   label: 'Org Admin' },
  { value: UserRole.Manager,    label: 'Manager' },
  { value: UserRole.EntryStaff, label: 'Entry Staff' },
  { value: UserRole.ExitStaff,  label: 'Exit Staff' },
  { value: UserRole.Auditor,    label: 'Auditor' },
];

const ROLE_COLORS: Record<number, { bg: string; text: string }> = {
  [UserRole.SuperAdmin]: { bg: '#9C27B015', text: '#9C27B0' },
  [UserRole.OrgAdmin]:   { bg: '#1976D215', text: '#1976D2' },
  [UserRole.Manager]:    { bg: '#00838F15', text: '#00838F' },
  [UserRole.EntryStaff]: { bg: '#2E7D3215', text: '#2E7D32' },
  [UserRole.ExitStaff]:  { bg: '#F57C0015', text: '#F57C00' },
  [UserRole.Auditor]:    { bg: '#C6282815', text: '#C62828' },
};

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
  organizationId?: string;
  organizationName?: string;
  organizationCode?: string;
}

const getInitialTab = (path: string) => {
  if (path.includes('/users')) return 2;
  if (path.includes('/organizations')) return 1;
  return 0;
};

const emptyEditOrg = { organizationName: '', email: '', phone: '', address: '', city: '', state: '' };
const emptyEditUser = { firstName: '', lastName: '', email: '', phone: '', role: UserRole.OrgAdmin as UserRole };
const emptyCreateUser = { firstName: '', lastName: '', email: '', password: '', phone: '', role: UserRole.OrgAdmin as UserRole, organizationId: '' };

export const SuperAdminDashboard = () => {
  const location = useLocation();
  const [tab, setTab] = useState(() => getInitialTab(location.pathname));

  const [orgs, setOrgs]             = useState<Organization[]>([]);
  const [users, setUsers]           = useState<UserRow[]>([]);
  const [platformStats, setPlatformStats] = useState<PlatformStats | null>(null);

  const [loadingOrgs, setLoadingOrgs]     = useState(true);
  const [loadingUsers, setLoadingUsers]   = useState(false);
  const [loadingStats, setLoadingStats]   = useState(true);

  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);

  // Create user dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating]     = useState(false);
  const [createForm, setCreateForm] = useState(emptyCreateUser);

  // Edit org dialog
  const [editOrgOpen, setEditOrgOpen]   = useState(false);
  const [editingOrg, setEditingOrg]     = useState<Organization | null>(null);
  const [editOrgForm, setEditOrgForm]   = useState(emptyEditOrg);
  const [savingOrg, setSavingOrg]       = useState(false);

  // Delete org dialog
  const [deleteOrgTarget, setDeleteOrgTarget] = useState<Organization | null>(null);
  const [deletingOrg, setDeletingOrg]         = useState(false);

  // Edit user dialog
  const [editUserOpen, setEditUserOpen] = useState(false);
  const [editingUser, setEditingUser]   = useState<UserRow | null>(null);
  const [editUserForm, setEditUserForm] = useState(emptyEditUser);
  const [savingUser, setSavingUser]     = useState(false);

  // Delete user dialog
  const [deleteUserTarget, setDeleteUserTarget] = useState<UserRow | null>(null);
  const [deletingUser, setDeletingUser]         = useState(false);

  const loadStats = useCallback(() => {
    organizationApi.getPlatformStats()
      .then(res => { if (res.success) setPlatformStats(res.data); })
      .finally(() => setLoadingStats(false));
  }, []);

  const loadOrgs = useCallback(() => {
    setLoadingOrgs(true);
    organizationApi.getAll()
      .then(res => { if (res.success) setOrgs(res.data); })
      .finally(() => setLoadingOrgs(false));
  }, []);

  const loadUsers = useCallback(() => {
    setLoadingUsers(true);
    userApi.getAll(1, 200)
      .then(res => { if (res.success) setUsers(res.data); })
      .finally(() => setLoadingUsers(false));
  }, []);

  // Initial loads
  useEffect(() => { loadStats(); loadOrgs(); }, [loadStats, loadOrgs]);
  useEffect(() => { if (tab === 2) loadUsers(); }, [tab, loadUsers]);

  // Auto-refresh dashboard stats every 30s
  useEffect(() => {
    if (tab !== 0) return;
    const id = setInterval(() => {
      organizationApi.getPlatformStats().then(res => { if (res.success) setPlatformStats(res.data); });
    }, 30000);
    return () => clearInterval(id);
  }, [tab]);

  const showMsg = (type: 'success' | 'error', text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 4000);
  };

  // ─── Org actions ───
  const toggleOrgLogin = async (org: Organization) => {
    try {
      const res = await organizationApi.toggleLogin(org.id, !org.isLoginEnabled);
      if (res.success) {
        setOrgs(prev => prev.map(o => o.id === org.id ? { ...o, isLoginEnabled: !o.isLoginEnabled } : o));
        showMsg('success', res.message);
      }
    } catch { showMsg('error', 'Failed to update.'); }
  };

  const toggleOrgActive = async (org: Organization) => {
    try {
      const res = await organizationApi.toggleActive(org.id, !org.isActive);
      if (res.success) {
        setOrgs(prev => prev.map(o => o.id === org.id ? { ...o, isActive: !o.isActive } : o));
        showMsg('success', res.message);
      }
    } catch { showMsg('error', 'Failed to update.'); }
  };

  const openEditOrg = (org: Organization) => {
    setEditingOrg(org);
    setEditOrgForm({
      organizationName: org.organizationName,
      email: org.email,
      phone: org.phone,
      address: '',
      city: '',
      state: '',
    });
    setEditOrgOpen(true);
  };

  const saveEditOrg = async () => {
    if (!editingOrg) return;
    setSavingOrg(true);
    try {
      const res = await organizationApi.update(editingOrg.id, editOrgForm);
      if (res.success) {
        setOrgs(prev => prev.map(o => o.id === editingOrg.id
          ? { ...o, organizationName: editOrgForm.organizationName || o.organizationName,
               email: editOrgForm.email || o.email, phone: editOrgForm.phone || o.phone }
          : o));
        showMsg('success', 'Organization updated successfully.');
        setEditOrgOpen(false);
      } else {
        showMsg('error', res.message || 'Update failed.');
      }
    } catch { showMsg('error', 'Failed to update organization.'); }
    finally { setSavingOrg(false); }
  };

  const confirmDeleteOrg = async () => {
    if (!deleteOrgTarget) return;
    setDeletingOrg(true);
    try {
      const res = await organizationApi.delete(deleteOrgTarget.id);
      if (res.success) {
        setOrgs(prev => prev.filter(o => o.id !== deleteOrgTarget.id));
        showMsg('success', `"${deleteOrgTarget.organizationName}" deleted.`);
        setDeleteOrgTarget(null);
        loadStats();
      } else {
        showMsg('error', res.message || 'Delete failed.');
      }
    } catch { showMsg('error', 'Failed to delete organization.'); }
    finally { setDeletingOrg(false); }
  };

  // ─── User actions ───
  const toggleUserLogin = async (u: UserRow) => {
    try {
      const res = await userApi.toggleLogin(u.id, !u.isLoginEnabled);
      if (res.success) {
        setUsers(prev => prev.map(x => x.id === u.id ? { ...x, isLoginEnabled: !x.isLoginEnabled } : x));
        showMsg('success', res.message);
      }
    } catch { showMsg('error', 'Failed to update.'); }
  };

  const openEditUser = (u: UserRow) => {
    setEditingUser(u);
    setEditUserForm({ firstName: u.firstName, lastName: u.lastName, email: u.email, phone: u.phone ?? '', role: u.role });
    setEditUserOpen(true);
  };

  const saveEditUser = async () => {
    if (!editingUser) return;
    setSavingUser(true);
    try {
      const res = await userApi.update(editingUser.id, editUserForm);
      if (res.success) {
        setUsers(prev => prev.map(x => x.id === editingUser.id
          ? { ...x, ...editUserForm, roleName: ROLE_OPTIONS.find(r => r.value === editUserForm.role)?.label ?? x.roleName }
          : x));
        showMsg('success', 'User updated successfully.');
        setEditUserOpen(false);
      } else {
        showMsg('error', res.message || 'Update failed.');
      }
    } catch { showMsg('error', 'Failed to update user.'); }
    finally { setSavingUser(false); }
  };

  const confirmDeleteUser = async () => {
    if (!deleteUserTarget) return;
    setDeletingUser(true);
    try {
      const res = await userApi.delete(deleteUserTarget.id);
      if (res.success) {
        setUsers(prev => prev.filter(x => x.id !== deleteUserTarget.id));
        showMsg('success', `"${deleteUserTarget.firstName} ${deleteUserTarget.lastName}" deleted.`);
        setDeleteUserTarget(null);
        loadStats();
      } else {
        showMsg('error', res.message || 'Delete failed.');
      }
    } catch { showMsg('error', 'Failed to delete user.'); }
    finally { setDeletingUser(false); }
  };

  // ─── Create user ───
  const handleCreate = async () => {
    if (!createForm.firstName || !createForm.lastName || !createForm.email || !createForm.password) {
      showMsg('error', 'Fill in all required fields.'); return;
    }
    setCreating(true);
    try {
      const res = await userApi.create({
        firstName: createForm.firstName, lastName: createForm.lastName,
        email: createForm.email, password: createForm.password,
        phone: createForm.phone || null, role: createForm.role,
        organizationId: createForm.organizationId || null, assignedLocationId: null,
      });
      if (res.success) {
        showMsg('success', `User "${createForm.firstName} ${createForm.lastName}" created!`);
        setCreateOpen(false);
        setCreateForm(emptyCreateUser);
        loadUsers();
        loadStats();
      } else {
        showMsg('error', res.message || 'Failed to create user.');
      }
    } catch (e: unknown) {
      const errMsg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      showMsg('error', errMsg || 'Failed to create user.');
    } finally { setCreating(false); }
  };

  const filteredUsers    = selectedOrgId ? users.filter(u => u.organizationId === selectedOrgId) : users;
  const selectedOrgName  = selectedOrgId ? orgs.find(o => o.id === selectedOrgId)?.organizationName : null;

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Super Admin Dashboard</Typography>
          <Typography variant="body2" color="text.secondary">Platform-wide management — all tenants visible here</Typography>
        </Box>
        <Box display="flex" gap={1}>
          {tab === 0 && (
            <Tooltip title="Refresh Stats">
              <IconButton size="small" onClick={() => { setLoadingStats(true); loadStats(); }}>
                <Refresh />
              </IconButton>
            </Tooltip>
          )}
          {tab === 2 && (
            <Button variant="contained" startIcon={<PersonAdd />} onClick={() => setCreateOpen(true)}
              sx={{ bgcolor: '#2E7D32', '&:hover': { bgcolor: '#1B5E20' } }}>
              Create User
            </Button>
          )}
        </Box>
      </Box>

      {msg && <Alert severity={msg.type} onClose={() => setMsg(null)} sx={{ mb: 2 }}>{msg.text}</Alert>}

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2, borderBottom: '1px solid #E0E0E0' }}>
        <Tab label="Dashboard" icon={<Dashboard />} iconPosition="start" />
        <Tab label="Organizations" icon={<Business />} iconPosition="start" />
        <Tab label="Users" icon={<PeopleAlt />} iconPosition="start" />
      </Tabs>

      {/* ═══════════════ DASHBOARD TAB ═══════════════ */}
      {tab === 0 && (
        <Box>
          {loadingStats ? (
            <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>
          ) : platformStats ? (
            <>
              <Grid container spacing={2} mb={3}>
                {[
                  { label: 'Total Organizations', value: platformStats.totalOrgs,   color: '#1976D2', icon: <Business /> },
                  { label: 'Active Orgs',         value: platformStats.activeOrgs,  color: '#2E7D32', icon: <CheckCircle /> },
                  { label: 'Total Users',          value: platformStats.totalUsers,  color: '#7B1FA2', icon: <PeopleAlt /> },
                  { label: 'Active Users',         value: platformStats.activeUsers, color: '#E65100', icon: <LockOpen /> },
                  { label: 'Total QR Codes',       value: platformStats.totalQrCodes,  color: '#00838F', icon: <CheckCircle /> },
                  { label: 'Total Refunds',        value: platformStats.totalRefunds,  color: '#C62828', icon: <CheckCircle /> },
                  { label: 'Monthly Deposits',     value: `₹${platformStats.monthlyDeposits.toLocaleString()}`,  color: '#F57C00', icon: <CheckCircle /> },
                  { label: 'Monthly Refunds',      value: `₹${platformStats.monthlyRefunds.toLocaleString()}`,   color: '#1565C0', icon: <CheckCircle /> },
                ].map(s => (
                  <Grid item xs={6} md={3} key={s.label}>
                    <Card elevation={0} sx={{ border: '1px solid #E0E0E0', borderRadius: 2 }}>
                      <CardContent sx={{ py: 2 }}>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Box>
                            <Typography variant="caption" color="text.secondary">{s.label}</Typography>
                            <Typography variant="h5" fontWeight={700} sx={{ color: s.color }}>{s.value}</Typography>
                          </Box>
                          <Box sx={{ color: s.color, bgcolor: `${s.color}15`, borderRadius: 2, p: 1 }}>{s.icon}</Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>

              <Grid container spacing={3}>
                <Grid item xs={12} md={7}>
                  <Card elevation={0} sx={{ border: '1px solid #E0E0E0', borderRadius: 2 }}>
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                        <Typography variant="h6" fontWeight={600}>Platform Activity (Last 7 Days)</Typography>
                        <Typography variant="caption" color="text.secondary">Auto-refreshes every 30s</Typography>
                      </Box>
                      {platformStats.weeklyData.every(d => d.deposits === 0 && d.refunds === 0) ? (
                        <Box display="flex" alignItems="center" justifyContent="center" height={220}>
                          <Typography color="text.secondary">No activity data yet</Typography>
                        </Box>
                      ) : (
                        <ResponsiveContainer width="100%" height={220}>
                          <BarChart data={platformStats.weeklyData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#F5F5F5" />
                            <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                            <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                            <RechartTooltip />
                            <Legend />
                            <Bar dataKey="deposits" fill="#2E7D32" name="Deposits" radius={[3, 3, 0, 0]} />
                            <Bar dataKey="refunds"  fill="#1976D2" name="Refunds"  radius={[3, 3, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} md={5}>
                  <Card elevation={0} sx={{ border: '1px solid #E0E0E0', borderRadius: 2 }}>
                    <CardContent>
                      <Typography variant="h6" fontWeight={600} mb={2}>Top Organizations (This Month)</Typography>
                      {platformStats.topOrgs.length === 0 ? (
                        <Box display="flex" alignItems="center" justifyContent="center" height={220}>
                          <Typography color="text.secondary">No refund data yet</Typography>
                        </Box>
                      ) : (
                        <ResponsiveContainer width="100%" height={220}>
                          <BarChart data={platformStats.topOrgs} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke="#F5F5F5" />
                            <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={v => `₹${Number(v).toLocaleString()}`} />
                            <YAxis type="category" dataKey="orgName" tick={{ fontSize: 11 }} width={90} />
                            <RechartTooltip formatter={v => [`₹${Number(v).toLocaleString()}`, 'Refund Amount']} />
                            <Bar dataKey="amount" fill="#1976D2" name="Refund Amount" radius={[0, 3, 3, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </>
          ) : (
            <Typography color="text.secondary">Could not load platform stats.</Typography>
          )}
        </Box>
      )}

      {/* ═══════════════ ORGANIZATIONS TAB ═══════════════ */}
      {tab === 1 && (
        <Card elevation={0} sx={{ border: '1px solid #E0E0E0', borderRadius: 2 }}>
          <CardContent sx={{ p: 0 }}>
            <Box sx={{ p: 2, borderBottom: '1px solid #F5F5F5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" fontWeight={600}>All Organizations ({orgs.length})</Typography>
              <Box display="flex" gap={1}>
                <Tooltip title="Refresh"><IconButton size="small" onClick={loadOrgs}><Refresh /></IconButton></Tooltip>
                <Button size="small" href="/register" variant="outlined" startIcon={<Business />}
                  sx={{ borderColor: '#2E7D32', color: '#2E7D32' }}>Register New Org</Button>
              </Box>
            </Box>
            {loadingOrgs ? (
              <Box display="flex" justifyContent="center" py={4}><CircularProgress /></Box>
            ) : orgs.length === 0 ? (
              <Box textAlign="center" py={6}>
                <Business sx={{ fontSize: 48, color: '#BDBDBD', mb: 1 }} />
                <Typography color="text.secondary">No organizations yet.</Typography>
                <Button href="/register" variant="contained" sx={{ mt: 2, bgcolor: '#2E7D32' }}>Register First Organization</Button>
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
                      <TableCell align="center"><strong>Actions</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {orgs.map(org => (
                      <TableRow key={org.id} sx={{ '&:hover': { bgcolor: '#F9F9F9' } }}>
                        <TableCell>
                          <Chip label={org.organizationCode} size="small"
                            sx={{ bgcolor: '#E3F2FD', color: '#1565C0', fontFamily: 'monospace' }} />
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
                        <TableCell align="center">
                          <Tooltip title="Edit Organization">
                            <IconButton size="small" onClick={() => openEditOrg(org)} sx={{ color: '#1976D2' }}>
                              <Edit fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Organization">
                            <IconButton size="small" onClick={() => setDeleteOrgTarget(org)} sx={{ color: '#C62828' }}>
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
      )}

      {/* ═══════════════ USERS TAB ═══════════════ */}
      {tab === 2 && (
        <Box>
          {!loadingOrgs && orgs.length > 0 && (
            <Card elevation={0} sx={{ border: '1px solid #E0E0E0', borderRadius: 2, mb: 2 }}>
              <CardContent sx={{ py: 1.5, px: 2 }}>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <FilterAlt sx={{ fontSize: 18, color: '#1976D2' }} />
                  <Typography variant="body2" fontWeight={600} color="text.secondary">
                    Filter by Organization — click to show only that org's users
                  </Typography>
                </Box>
                <Box display="flex" flexWrap="wrap" gap={1}>
                  <Chip label={`All (${users.length})`}
                    onClick={() => setSelectedOrgId(null)}
                    variant={selectedOrgId === null ? 'filled' : 'outlined'}
                    sx={{ bgcolor: selectedOrgId === null ? '#1976D2' : 'transparent',
                          color: selectedOrgId === null ? '#fff' : '#1976D2',
                          borderColor: '#1976D2', fontWeight: 600, cursor: 'pointer' }} />
                  {orgs.map(org => {
                    const cnt = users.filter(u => u.organizationId === org.id).length;
                    const sel = selectedOrgId === org.id;
                    return (
                      <Chip key={org.id}
                        label={`${org.organizationName} (${cnt})`}
                        onClick={() => setSelectedOrgId(sel ? null : org.id)}
                        variant={sel ? 'filled' : 'outlined'}
                        sx={{ bgcolor: sel ? '#2E7D32' : 'transparent',
                              color: sel ? '#fff' : '#2E7D32',
                              borderColor: '#2E7D32', fontWeight: 600, cursor: 'pointer',
                              '&:hover': { bgcolor: sel ? '#1B5E20' : '#E8F5E9' } }} />
                    );
                  })}
                </Box>
              </CardContent>
            </Card>
          )}

          <Card elevation={0} sx={{ border: '1px solid #E0E0E0', borderRadius: 2 }}>
            <CardContent sx={{ p: 0 }}>
              <Box sx={{ p: 2, borderBottom: '1px solid #F5F5F5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" fontWeight={600}>
                  {selectedOrgName ? `Users — ${selectedOrgName} (${filteredUsers.length})` : `All Platform Users (${filteredUsers.length})`}
                </Typography>
                <Tooltip title="Refresh">
                  <IconButton size="small" onClick={loadUsers}><Refresh /></IconButton>
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
                        <TableCell><strong>Organization</strong></TableCell>
                        <TableCell><strong>Status</strong></TableCell>
                        <TableCell><strong>Login</strong></TableCell>
                        <TableCell><strong>Last Login</strong></TableCell>
                        <TableCell align="center"><strong>Actions</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredUsers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                            <Typography color="text.secondary">No users found.</Typography>
                          </TableCell>
                        </TableRow>
                      ) : filteredUsers.map(u => {
                        const rc = ROLE_COLORS[u.role] ?? { bg: '#E0E0E0', text: '#757575' };
                        return (
                          <TableRow key={u.id} sx={{ '&:hover': { bgcolor: '#F9F9F9' } }}>
                            <TableCell>
                              <Typography variant="body2" fontWeight={600}>{u.firstName} {u.lastName}</Typography>
                            </TableCell>
                            <TableCell><Typography variant="caption">{u.email}</Typography></TableCell>
                            <TableCell>
                              <Chip label={u.roleName} size="small"
                                sx={{ bgcolor: rc.bg, color: rc.text, fontWeight: 600 }} />
                            </TableCell>
                            <TableCell>
                              {u.organizationName ? (
                                <Box>
                                  <Typography variant="body2" fontWeight={500}>{u.organizationName}</Typography>
                                  <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                                    {u.organizationCode}
                                  </Typography>
                                </Box>
                              ) : (
                                <Typography variant="caption" color="text.secondary" fontStyle="italic">Platform user</Typography>
                              )}
                            </TableCell>
                            <TableCell>
                              <Chip label={u.isActive ? 'Active' : 'Inactive'} size="small"
                                color={u.isActive ? 'success' : 'error'} variant="outlined" />
                            </TableCell>
                            <TableCell>
                              <Tooltip title={u.isLoginEnabled ? 'Disable login' : 'Enable login'}>
                                <Switch checked={u.isLoginEnabled} onChange={() => toggleUserLogin(u)}
                                  color="primary" size="small" disabled={u.role === UserRole.SuperAdmin} />
                              </Tooltip>
                            </TableCell>
                            <TableCell>
                              <Typography variant="caption" color="text.secondary">
                                {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString('en-IN') : 'Never'}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Tooltip title="Edit User">
                                <IconButton size="small" onClick={() => openEditUser(u)} sx={{ color: '#1976D2' }}>
                                  <Edit fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete User">
                                <IconButton size="small" onClick={() => setDeleteUserTarget(u)}
                                  sx={{ color: '#C62828' }} disabled={u.role === UserRole.SuperAdmin}>
                                  <Delete fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Box>
      )}

      {/* ── Create User Dialog ── */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Create New User</DialogTitle>
        <DialogContent>
          <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2} mt={1}>
            <TextField label="First Name *" value={createForm.firstName}
              onChange={e => setCreateForm(p => ({ ...p, firstName: e.target.value }))} fullWidth />
            <TextField label="Last Name *" value={createForm.lastName}
              onChange={e => setCreateForm(p => ({ ...p, lastName: e.target.value }))} fullWidth />
            <TextField label="Email *" type="email" value={createForm.email}
              onChange={e => setCreateForm(p => ({ ...p, email: e.target.value }))} fullWidth sx={{ gridColumn: 'span 2' }} />
            <TextField label="Password *" type="password" value={createForm.password}
              onChange={e => setCreateForm(p => ({ ...p, password: e.target.value }))} fullWidth />
            <TextField label="Phone" value={createForm.phone}
              onChange={e => setCreateForm(p => ({ ...p, phone: e.target.value }))} fullWidth />
            <FormControl fullWidth>
              <InputLabel>Role *</InputLabel>
              <Select value={createForm.role} label="Role *"
                onChange={e => setCreateForm(p => ({ ...p, role: Number(e.target.value) as UserRole }))}>
                {ROLE_OPTIONS.map(r => <MenuItem key={r.value} value={r.value}>{r.label}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Organization</InputLabel>
              <Select value={createForm.organizationId} label="Organization"
                onChange={e => setCreateForm(p => ({ ...p, organizationId: e.target.value }))}>
                <MenuItem value=""><em>None (Platform user)</em></MenuItem>
                {orgs.map(o => <MenuItem key={o.id} value={o.id}>{o.organizationName} ({o.organizationCode})</MenuItem>)}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setCreateOpen(false)} color="inherit">Cancel</Button>
          <Button onClick={handleCreate} variant="contained" disabled={creating}
            sx={{ bgcolor: '#2E7D32', '&:hover': { bgcolor: '#1B5E20' } }}>
            {creating ? <CircularProgress size={20} color="inherit" /> : 'Create User'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Edit Org Dialog ── */}
      <Dialog open={editOrgOpen} onClose={() => setEditOrgOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Edit Organization
          <IconButton onClick={() => setEditOrgOpen(false)}><Close /></IconButton>
        </DialogTitle>
        <DialogContent>
          <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2} mt={1}>
            <TextField label="Organization Name *" value={editOrgForm.organizationName} fullWidth sx={{ gridColumn: 'span 2' }}
              onChange={e => setEditOrgForm(p => ({ ...p, organizationName: e.target.value }))} />
            <TextField label="Email" value={editOrgForm.email} fullWidth
              onChange={e => setEditOrgForm(p => ({ ...p, email: e.target.value }))} />
            <TextField label="Phone" value={editOrgForm.phone} fullWidth
              onChange={e => setEditOrgForm(p => ({ ...p, phone: e.target.value }))} />
            <TextField label="Address" value={editOrgForm.address} fullWidth sx={{ gridColumn: 'span 2' }}
              onChange={e => setEditOrgForm(p => ({ ...p, address: e.target.value }))} />
            <TextField label="City" value={editOrgForm.city} fullWidth
              onChange={e => setEditOrgForm(p => ({ ...p, city: e.target.value }))} />
            <TextField label="State" value={editOrgForm.state} fullWidth
              onChange={e => setEditOrgForm(p => ({ ...p, state: e.target.value }))} />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setEditOrgOpen(false)} color="inherit">Cancel</Button>
          <Button onClick={saveEditOrg} variant="contained" disabled={savingOrg}
            sx={{ bgcolor: '#1976D2', '&:hover': { bgcolor: '#1565C0' } }}>
            {savingOrg ? <CircularProgress size={20} color="inherit" /> : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Delete Org Confirm ── */}
      <Dialog open={!!deleteOrgTarget} onClose={() => setDeleteOrgTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, color: '#C62828' }}>Delete Organization</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete <strong>"{deleteOrgTarget?.organizationName}"</strong>?
          </Typography>
          <Alert severity="warning" sx={{ mt: 2 }}>
            This will deactivate the organization and block all logins. All data will be preserved (soft delete).
          </Alert>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteOrgTarget(null)} color="inherit">Cancel</Button>
          <Button onClick={confirmDeleteOrg} variant="contained" disabled={deletingOrg}
            sx={{ bgcolor: '#C62828', '&:hover': { bgcolor: '#B71C1C' } }}>
            {deletingOrg ? <CircularProgress size={20} color="inherit" /> : 'Delete Organization'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Edit User Dialog ── */}
      <Dialog open={editUserOpen} onClose={() => setEditUserOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Edit User
          <IconButton onClick={() => setEditUserOpen(false)}><Close /></IconButton>
        </DialogTitle>
        <DialogContent>
          <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2} mt={1}>
            <TextField label="First Name *" value={editUserForm.firstName} fullWidth
              onChange={e => setEditUserForm(p => ({ ...p, firstName: e.target.value }))} />
            <TextField label="Last Name *" value={editUserForm.lastName} fullWidth
              onChange={e => setEditUserForm(p => ({ ...p, lastName: e.target.value }))} />
            <TextField label="Email *" type="email" value={editUserForm.email} fullWidth sx={{ gridColumn: 'span 2' }}
              onChange={e => setEditUserForm(p => ({ ...p, email: e.target.value }))} />
            <TextField label="Phone" value={editUserForm.phone} fullWidth
              onChange={e => setEditUserForm(p => ({ ...p, phone: e.target.value }))} />
            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select value={editUserForm.role} label="Role"
                onChange={e => setEditUserForm(p => ({ ...p, role: Number(e.target.value) as UserRole }))}>
                {ROLE_OPTIONS.map(r => <MenuItem key={r.value} value={r.value}>{r.label}</MenuItem>)}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setEditUserOpen(false)} color="inherit">Cancel</Button>
          <Button onClick={saveEditUser} variant="contained" disabled={savingUser}
            sx={{ bgcolor: '#1976D2', '&:hover': { bgcolor: '#1565C0' } }}>
            {savingUser ? <CircularProgress size={20} color="inherit" /> : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Delete User Confirm ── */}
      <Dialog open={!!deleteUserTarget} onClose={() => setDeleteUserTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, color: '#C62828' }}>Delete User</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete <strong>"{deleteUserTarget?.firstName} {deleteUserTarget?.lastName}"</strong>?
          </Typography>
          <Alert severity="warning" sx={{ mt: 2 }}>
            The user will be deactivated and their login will be blocked. Data is preserved (soft delete).
          </Alert>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteUserTarget(null)} color="inherit">Cancel</Button>
          <Button onClick={confirmDeleteUser} variant="contained" disabled={deletingUser}
            sx={{ bgcolor: '#C62828', '&:hover': { bgcolor: '#B71C1C' } }}>
            {deletingUser ? <CircularProgress size={20} color="inherit" /> : 'Delete User'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
