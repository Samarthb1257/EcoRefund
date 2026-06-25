import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import {
  AppBar, Box, CssBaseline, Divider, Drawer, IconButton,
  List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  Toolbar, Typography, Avatar, Menu, MenuItem, Chip, Tooltip,
} from '@mui/material';
import {
  Menu as MenuIcon, Dashboard, QrCode, QrCodeScanner,
  PeopleAlt, Business, LocationOn, ExitToApp,
  Security, AdminPanelSettings, BarChart,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { selectUser } from '../../store/authSlice';
import { useAuth } from '../../hooks/useAuth';
import { usePermissions } from '../../hooks/usePermissions';
import { UserRole } from '../../types';

const DRAWER_WIDTH = 260;

const roleColors: Record<UserRole, string> = {
  [UserRole.SuperAdmin]: '#9C27B0',
  [UserRole.OrgAdmin]: '#1976D2',
  [UserRole.Manager]: '#0288D1',
  [UserRole.EntryStaff]: '#2E7D32',
  [UserRole.ExitStaff]: '#E65100',
  [UserRole.Auditor]: '#5D4037',
};

export const AppLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const user = useSelector(selectUser);
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const perms = usePermissions();

  const navItems = [
    {
      label: 'Dashboard',
      icon: <Dashboard />,
      path: getDashboardPath(user?.role),
      visible: true,
    },
    {
      label: 'Organizations',
      icon: <Business />,
      path: '/super-admin/organizations',
      visible: user?.role === UserRole.SuperAdmin,
    },
    {
      label: 'Staff Management',
      icon: <PeopleAlt />,
      path: '/org-admin/staff',
      visible: perms.canManageUsers && user?.role !== UserRole.SuperAdmin,
    },
    {
      label: 'Staff Access Control',
      icon: <Security />,
      path: '/org-admin/staff-access',
      visible: perms.canToggleStaffLogin,
    },
    {
      label: 'Locations',
      icon: <LocationOn />,
      path: '/org-admin/locations',
      visible: perms.canManageOrg && user?.role !== UserRole.SuperAdmin,
    },
    {
      label: 'Generate QR',
      icon: <QrCode />,
      path: '/entry-staff/generate-qr',
      visible: perms.canGenerateQr,
    },
    {
      label: 'Scan & Refund',
      icon: <QrCodeScanner />,
      path: '/exit-staff/scan-qr',
      visible: perms.canScanQr,
    },
    {
      label: 'Reports & Analytics',
      icon: <BarChart />,
      path: '/reports/deposits',
      visible: perms.canViewReports,
    },
    {
      label: 'Platform Admin',
      icon: <AdminPanelSettings />,
      path: '/super-admin/users',
      visible: user?.role === UserRole.SuperAdmin,
    },
  ].filter(item => item.visible);

  const drawerContent = (
    <Box>
      <Box sx={{ p: 2, background: 'linear-gradient(135deg, #2E7D32 0%, #1B5E20 100%)', color: 'white' }}>
        <Typography variant="h6" fontWeight={700} sx={{ letterSpacing: 0.5 }}>
          🌿 EcoRefund AI
        </Typography>
        <Typography variant="caption" sx={{ opacity: 0.8 }}>
          Waste Deposit Platform
        </Typography>
      </Box>

      {user && (
        <Box sx={{ p: 2, bgcolor: '#F5F5F5', borderBottom: '1px solid #E0E0E0' }}>
          <Box display="flex" alignItems="center" gap={1}>
            <Avatar sx={{ bgcolor: roleColors[user.role], width: 36, height: 36, fontSize: 14 }}>
              {user.fullName.charAt(0)}
            </Avatar>
            <Box>
              <Typography variant="body2" fontWeight={600} noWrap>
                {user.fullName}
              </Typography>
              <Chip
                label={user.roleName}
                size="small"
                sx={{
                  bgcolor: roleColors[user.role],
                  color: 'white',
                  fontSize: 10,
                  height: 18,
                }}
              />
            </Box>
          </Box>
          {user.organizationName && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
              {user.organizationName}
            </Typography>
          )}
        </Box>
      )}

      <List dense>
        {navItems.map((item) => (
          <ListItem key={item.label} disablePadding>
            <ListItemButton
              onClick={() => { navigate(item.path); setMobileOpen(false); }}
              sx={{
                mx: 1, borderRadius: 1, mb: 0.3,
                '&:hover': { bgcolor: '#E8F5E9' },
              }}
            >
              <ListItemIcon sx={{ minWidth: 36, color: '#2E7D32' }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: 14 }} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Divider />
      <List>
        <ListItem disablePadding>
          <ListItemButton onClick={signOut} sx={{ mx: 1, borderRadius: 1, color: '#C62828' }}>
            <ListItemIcon sx={{ minWidth: 36, color: '#C62828' }}><ExitToApp /></ListItemIcon>
            <ListItemText primary="Logout" primaryTypographyProps={{ fontSize: 14 }} />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{ width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` }, ml: { sm: `${DRAWER_WIDTH}px` }, bgcolor: '#2E7D32' }}
      >
        <Toolbar>
          <IconButton color="inherit" edge="start" onClick={() => setMobileOpen(!mobileOpen)} sx={{ mr: 2, display: { sm: 'none' } }}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap sx={{ flexGrow: 1, fontWeight: 600 }}>
            EcoRefund AI
          </Typography>
          <Tooltip title={user?.fullName || 'User'}>
            <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} color="inherit">
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'rgba(255,255,255,0.3)', fontSize: 14 }}>
                {user?.fullName.charAt(0)}
              </Avatar>
            </IconButton>
          </Tooltip>
          <Menu anchorEl={anchorEl} open={!!anchorEl} onClose={() => setAnchorEl(null)}>
            <MenuItem disabled>
              <Typography variant="body2">{user?.email}</Typography>
            </MenuItem>
            <Divider />
            <MenuItem onClick={signOut}>
              <ExitToApp fontSize="small" sx={{ mr: 1 }} /> Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { sm: DRAWER_WIDTH }, flexShrink: { sm: 0 } }}>
        <Drawer
          variant="temporary" open={mobileOpen} onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{ display: { xs: 'block', sm: 'none' }, '& .MuiDrawer-paper': { width: DRAWER_WIDTH } }}
        >
          {drawerContent}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{ display: { xs: 'none', sm: 'block' }, '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' } }}
          open
        >
          {drawerContent}
        </Drawer>
      </Box>

      <Box component="main" sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` }, mt: 8 }}>
        <Outlet />
      </Box>
    </Box>
  );
};

function getDashboardPath(role?: UserRole): string {
  switch (role) {
    case UserRole.SuperAdmin: return '/super-admin/dashboard';
    case UserRole.OrgAdmin: return '/org-admin/dashboard';
    case UserRole.Manager: return '/manager/dashboard';
    case UserRole.EntryStaff: return '/entry-staff/dashboard';
    case UserRole.ExitStaff: return '/exit-staff/dashboard';
    case UserRole.Auditor: return '/auditor/dashboard';
    default: return '/';
  }
}
