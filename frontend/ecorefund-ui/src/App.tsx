import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { SnackbarProvider } from 'notistack';
import { store } from './store';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { AppLayout } from './components/common/AppLayout';
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { SuperAdminDashboard } from './pages/super-admin/SuperAdminDashboard';
import { OrgAdminDashboard } from './pages/dashboards/OrgAdminDashboard';
import { EntryStaffDashboard } from './pages/dashboards/EntryStaffDashboard';
import { ExitStaffDashboard } from './pages/dashboards/ExitStaffDashboard';
import { AuditorDashboard } from './pages/dashboards/AuditorDashboard';
import { ReportsPage } from './pages/reports/ReportsPage';
import { StaffAccessControl } from './pages/org-admin/StaffAccessControl';
import { StaffManagement } from './pages/org-admin/StaffManagement';
import { GenerateQr } from './pages/entry-staff/GenerateQr';
import { ScanAndRefund } from './pages/exit-staff/ScanAndRefund';
import { UserRole } from './types';

const theme = createTheme({
  palette: {
    primary: { main: '#2E7D32', light: '#4CAF50', dark: '#1B5E20' },
    secondary: { main: '#1976D2' },
    background: { default: '#FAFAFA' },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", sans-serif',
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { textTransform: 'none', borderRadius: 8, fontWeight: 600 },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: { borderRadius: 12 },
      },
    },
    MuiTextField: {
      defaultProps: { variant: 'outlined', size: 'small' },
    },
  },
});

function App() {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <SnackbarProvider maxSnack={3} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
          <BrowserRouter>
            <Routes>
              {/* Public */}
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Protected - App Layout */}
              <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>

                {/* Super Admin */}
                <Route path="/super-admin/dashboard"
                  element={<ProtectedRoute allowedRoles={[UserRole.SuperAdmin]}><SuperAdminDashboard /></ProtectedRoute>} />
                <Route path="/super-admin/organizations"
                  element={<ProtectedRoute allowedRoles={[UserRole.SuperAdmin]}><SuperAdminDashboard /></ProtectedRoute>} />
                <Route path="/super-admin/users"
                  element={<ProtectedRoute allowedRoles={[UserRole.SuperAdmin]}><SuperAdminDashboard /></ProtectedRoute>} />

                {/* Org Admin */}
                <Route path="/org-admin/dashboard"
                  element={<ProtectedRoute allowedRoles={[UserRole.OrgAdmin]}><OrgAdminDashboard /></ProtectedRoute>} />
                <Route path="/org-admin/staff-access"
                  element={<ProtectedRoute allowedRoles={[UserRole.OrgAdmin, UserRole.SuperAdmin]}><StaffAccessControl /></ProtectedRoute>} />
                <Route path="/org-admin/staff"
                  element={<ProtectedRoute allowedRoles={[UserRole.OrgAdmin, UserRole.Manager]}><StaffManagement /></ProtectedRoute>} />
                <Route path="/org-admin/locations"
                  element={<ProtectedRoute allowedRoles={[UserRole.OrgAdmin]}><OrgAdminDashboard /></ProtectedRoute>} />

                {/* Manager */}
                <Route path="/manager/dashboard"
                  element={<ProtectedRoute allowedRoles={[UserRole.Manager]}><OrgAdminDashboard /></ProtectedRoute>} />

                {/* Entry Staff */}
                <Route path="/entry-staff/dashboard"
                  element={<ProtectedRoute allowedRoles={[UserRole.EntryStaff]}><EntryStaffDashboard /></ProtectedRoute>} />
                <Route path="/entry-staff/generate-qr"
                  element={<ProtectedRoute allowedRoles={[UserRole.EntryStaff, UserRole.Manager, UserRole.OrgAdmin, UserRole.SuperAdmin]}><GenerateQr /></ProtectedRoute>} />

                {/* Exit Staff */}
                <Route path="/exit-staff/dashboard"
                  element={<ProtectedRoute allowedRoles={[UserRole.ExitStaff]}><ExitStaffDashboard /></ProtectedRoute>} />
                <Route path="/exit-staff/scan-qr"
                  element={<ProtectedRoute allowedRoles={[UserRole.ExitStaff, UserRole.Manager, UserRole.OrgAdmin, UserRole.SuperAdmin]}><ScanAndRefund /></ProtectedRoute>} />

                {/* Auditor */}
                <Route path="/auditor/dashboard"
                  element={<ProtectedRoute allowedRoles={[UserRole.Auditor]}><AuditorDashboard /></ProtectedRoute>} />

                {/* Reports (Shared) */}
                <Route path="/reports/refunds"
                  element={<ProtectedRoute allowedRoles={[UserRole.Auditor, UserRole.Manager, UserRole.OrgAdmin, UserRole.SuperAdmin]}><ReportsPage /></ProtectedRoute>} />
                <Route path="/reports/deposits"
                  element={<ProtectedRoute allowedRoles={[UserRole.Auditor, UserRole.Manager, UserRole.OrgAdmin, UserRole.SuperAdmin]}><ReportsPage /></ProtectedRoute>} />
                <Route path="/reports/qr-codes"
                  element={<ProtectedRoute allowedRoles={[UserRole.Auditor, UserRole.Manager, UserRole.OrgAdmin, UserRole.SuperAdmin, UserRole.EntryStaff]}><ReportsPage /></ProtectedRoute>} />
                <Route path="/reports/audit"
                  element={<ProtectedRoute allowedRoles={[UserRole.Auditor, UserRole.OrgAdmin, UserRole.SuperAdmin]}><ReportsPage /></ProtectedRoute>} />

              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </SnackbarProvider>
      </ThemeProvider>
    </Provider>
  );
}

export default App;
