import { useEffect, useState } from 'react';
import {
  Box, Card, CardContent, Typography, Switch, Chip, Avatar,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Alert, Button, Dialog, DialogTitle, DialogContent,
  DialogContentText, DialogActions, TextField, CircularProgress,
  Tooltip,
} from '@mui/material';
import {
  PeopleAlt, LockOpen, Lock, Info,
} from '@mui/icons-material';
import { userApi } from '../../api/userApi';
import { User, UserRole } from '../../types';
import { usePermissions } from '../../hooks/usePermissions';

const roleColors: Record<number, string> = {
  [UserRole.Manager]: '#0288D1',
  [UserRole.EntryStaff]: '#2E7D32',
  [UserRole.ExitStaff]: '#E65100',
  [UserRole.Auditor]: '#5D4037',
};

export const StaffAccessControl = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionUser, setActionUser] = useState<User | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pendingEnabled, setPendingEnabled] = useState(false);
  const [reason, setReason] = useState('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const { canToggleStaffLogin } = usePermissions();

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await userApi.getLoginStatus();
      if (res.success) setUsers(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUsers(); }, []);

  const handleToggleClick = (user: User, enabled: boolean) => {
    setActionUser(user);
    setPendingEnabled(enabled);
    setReason('');
    setDialogOpen(true);
  };

  const confirmToggle = async () => {
    if (!actionUser) return;
    try {
      const res = await userApi.toggleLogin(actionUser.id, pendingEnabled, reason);
      if (res.success) {
        setUsers(prev => prev.map(u =>
          u.id === actionUser.id ? { ...u, isLoginEnabled: pendingEnabled } : u
        ));
        setSuccessMsg(res.data?.message || 'Access updated successfully.');
      }
    } catch {
      setErrorMsg('Failed to update access. Please try again.');
    } finally {
      setDialogOpen(false);
      setActionUser(null);
    }
  };

  const activeCount = users.filter(u => u.isLoginEnabled && u.isActive).length;
  const disabledCount = users.filter(u => !u.isLoginEnabled).length;

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h5" fontWeight={700} display="flex" alignItems="center" gap={1}>
            <PeopleAlt sx={{ color: '#2E7D32' }} /> Staff Access Control
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Enable or disable login access for staff members
          </Typography>
        </Box>
      </Box>

      {/* Summary Cards */}
      <Box display="flex" gap={2} mb={3} flexWrap="wrap">
        <Card elevation={0} sx={{ border: '1px solid #E0E0E0', borderRadius: 2, flex: 1, minWidth: 160 }}>
          <CardContent sx={{ py: 2 }}>
            <Typography variant="body2" color="text.secondary">Active Staff</Typography>
            <Typography variant="h4" fontWeight={700} color="#2E7D32">{activeCount}</Typography>
            <Chip label="Can Login" size="small" icon={<LockOpen fontSize="small" />}
              sx={{ bgcolor: '#E8F5E9', color: '#2E7D32', mt: 0.5 }} />
          </CardContent>
        </Card>
        <Card elevation={0} sx={{ border: '1px solid #E0E0E0', borderRadius: 2, flex: 1, minWidth: 160 }}>
          <CardContent sx={{ py: 2 }}>
            <Typography variant="body2" color="text.secondary">Disabled Staff</Typography>
            <Typography variant="h4" fontWeight={700} color="#C62828">{disabledCount}</Typography>
            <Chip label="Login Blocked" size="small" icon={<Lock fontSize="small" />}
              sx={{ bgcolor: '#FFEBEE', color: '#C62828', mt: 0.5 }} />
          </CardContent>
        </Card>
        <Card elevation={0} sx={{ border: '1px solid #E0E0E0', borderRadius: 2, flex: 1, minWidth: 160 }}>
          <CardContent sx={{ py: 2 }}>
            <Typography variant="body2" color="text.secondary">Total Staff</Typography>
            <Typography variant="h4" fontWeight={700}>{users.length}</Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Info Banner */}
      <Alert severity="info" icon={<Info />} sx={{ mb: 3, borderRadius: 2 }}>
        <strong>Admin Feature:</strong> Toggle the switch to instantly enable or disable a staff member's login access.
        Disabled staff will see "Login access has been disabled" when they try to login.
        This does NOT delete their account or data.
      </Alert>

      {successMsg && <Alert severity="success" onClose={() => setSuccessMsg(null)} sx={{ mb: 2 }}>{successMsg}</Alert>}
      {errorMsg && <Alert severity="error" onClose={() => setErrorMsg(null)} sx={{ mb: 2 }}>{errorMsg}</Alert>}

      {/* Staff Table */}
      <Card elevation={0} sx={{ border: '1px solid #E0E0E0', borderRadius: 2 }}>
        <CardContent sx={{ p: 0 }}>
          {loading ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress sx={{ color: '#2E7D32' }} />
            </Box>
          ) : (
            <TableContainer component={Paper} elevation={0}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#F5F5F5' }}>
                    <TableCell><Typography fontWeight={600}>Staff Member</Typography></TableCell>
                    <TableCell><Typography fontWeight={600}>Role</Typography></TableCell>
                    <TableCell><Typography fontWeight={600}>Account Status</Typography></TableCell>
                    <TableCell><Typography fontWeight={600}>Last Login</Typography></TableCell>
                    <TableCell align="center"><Typography fontWeight={600}>Login Access</Typography></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                        No staff members found.
                      </TableCell>
                    </TableRow>
                  )}
                  {users.map(u => (
                    <TableRow key={u.id} sx={{ '&:hover': { bgcolor: '#F9F9F9' } }}>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1.5}>
                          <Avatar sx={{
                            width: 36, height: 36, fontSize: 14,
                            bgcolor: roleColors[u.role] || '#757575'
                          }}>
                            {u.firstName.charAt(0)}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight={600}>
                              {u.firstName} {u.lastName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">{u.email}</Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip label={u.roleName} size="small"
                          sx={{ bgcolor: `${roleColors[u.role] || '#757575'}20`,
                                color: roleColors[u.role] || '#757575', fontWeight: 600 }} />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={u.isActive ? 'Active' : 'Deactivated'}
                          size="small"
                          color={u.isActive ? 'success' : 'error'}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {u.lastLoginAt
                            ? new Date(u.lastLoginAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })
                            : 'Never'}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        {canToggleStaffLogin ? (
                          <Tooltip title={u.isLoginEnabled ? 'Click to DISABLE login' : 'Click to ENABLE login'}>
                            <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
                              {!u.isLoginEnabled && <Lock sx={{ fontSize: 16, color: '#C62828' }} />}
                              {u.isLoginEnabled && <LockOpen sx={{ fontSize: 16, color: '#2E7D32' }} />}
                              <Switch
                                checked={u.isLoginEnabled}
                                onChange={(e) => handleToggleClick(u, e.target.checked)}
                                color="success"
                                size="small"
                              />
                            </Box>
                          </Tooltip>
                        ) : (
                          <Chip label={u.isLoginEnabled ? 'Enabled' : 'Disabled'} size="small"
                            color={u.isLoginEnabled ? 'success' : 'error'} variant="outlined" />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Confirm Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight={700}>
          {pendingEnabled ? '✅ Enable Login Access' : '🔒 Disable Login Access'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText gutterBottom>
            {pendingEnabled
              ? `This will allow ${actionUser?.firstName} ${actionUser?.lastName} to log in to the system.`
              : `This will PREVENT ${actionUser?.firstName} ${actionUser?.lastName} from logging in. They will see "Login access has been disabled" when they try.`
            }
          </DialogContentText>
          <TextField
            fullWidth
            label="Reason (Optional)"
            placeholder="e.g., Staff on leave, Account review, etc."
            value={reason}
            onChange={e => setReason(e.target.value)}
            size="small"
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)} variant="outlined">Cancel</Button>
          <Button onClick={confirmToggle} variant="contained"
            sx={{ bgcolor: pendingEnabled ? '#2E7D32' : '#C62828',
                  '&:hover': { bgcolor: pendingEnabled ? '#1B5E20' : '#B71C1C' } }}>
            {pendingEnabled ? 'Enable Access' : 'Disable Access'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
