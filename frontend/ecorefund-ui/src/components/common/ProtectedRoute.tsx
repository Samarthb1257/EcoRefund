import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated, selectUserRole } from '../../store/authSlice';
import { UserRole } from '../../types';

interface Props {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

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

export const ProtectedRoute = ({ children, allowedRoles }: Props) => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const role = useSelector(selectUserRole); // already normalized to number
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && role !== undefined && !allowedRoles.includes(role)) {
    return <Navigate to={getDashboardPath(role)} replace />;
  }

  return <>{children}</>;
};
