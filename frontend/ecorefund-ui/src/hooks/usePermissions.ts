import { useSelector } from 'react-redux';
import { selectUserRole } from '../store/authSlice';
import { UserRole } from '../types';

export const usePermissions = () => {
  const role = useSelector(selectUserRole);

  return {
    isSuperAdmin: role === UserRole.SuperAdmin,
    isOrgAdmin: role === UserRole.OrgAdmin,
    isManager: role === UserRole.Manager,
    isEntryStaff: role === UserRole.EntryStaff,
    isExitStaff: role === UserRole.ExitStaff,
    isAuditor: role === UserRole.Auditor,
    canManageOrg: role === UserRole.SuperAdmin || role === UserRole.OrgAdmin,
    canManageUsers: role === UserRole.SuperAdmin || role === UserRole.OrgAdmin,
    canGenerateQr: [UserRole.EntryStaff, UserRole.Manager, UserRole.OrgAdmin, UserRole.SuperAdmin].includes(role!),
    canScanQr: [UserRole.ExitStaff, UserRole.Manager, UserRole.OrgAdmin, UserRole.SuperAdmin].includes(role!),
    canProcessRefund: [UserRole.ExitStaff, UserRole.Manager, UserRole.OrgAdmin, UserRole.SuperAdmin].includes(role!),
    canViewReports: [UserRole.Auditor, UserRole.Manager, UserRole.OrgAdmin, UserRole.SuperAdmin].includes(role!),
    canExportReports: [UserRole.Auditor, UserRole.OrgAdmin, UserRole.SuperAdmin].includes(role!),
    canToggleStaffLogin: role === UserRole.SuperAdmin || role === UserRole.OrgAdmin,
  };
};
