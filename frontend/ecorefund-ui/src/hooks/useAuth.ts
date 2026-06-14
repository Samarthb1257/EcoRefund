import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { selectUser, selectIsAuthenticated, selectUserRole, logout, loginSuccess } from '../store/authSlice';
import { authApi } from '../api/authApi';
import { UserRole } from '../types';

function getDashboardPath(role: UserRole): string {
  switch (role) {
    case UserRole.SuperAdmin:  return '/super-admin/dashboard';
    case UserRole.OrgAdmin:    return '/org-admin/dashboard';
    case UserRole.Manager:     return '/manager/dashboard';
    case UserRole.EntryStaff:  return '/entry-staff/dashboard';
    case UserRole.ExitStaff:   return '/exit-staff/dashboard';
    case UserRole.Auditor:     return '/auditor/dashboard';
    default:                   return '/login';
  }
}

export const useAuth = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const role = useSelector(selectUserRole);

  const login = async (email: string, password: string, selectedRole: UserRole) => {
    const response = await authApi.login(email, password, selectedRole);
    dispatch(loginSuccess({
      user: response.user,
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
    }));
    // role is normalized to number in authSlice
    const normalizedRole = Number(response.user.role) as UserRole;
    navigate(getDashboardPath(normalizedRole));
  };

  const signOut = async () => {
    try { await authApi.logout(); } catch { /* ignore */ }
    dispatch(logout());
    navigate('/login');
  };

  return { user, isAuthenticated, role, login, signOut };
};
