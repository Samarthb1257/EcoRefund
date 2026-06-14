import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { UserDto, UserRole } from '../types';

interface AuthState {
  user: UserDto | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Always coerce role to number to handle both string ("OrgAdmin") and int (2) from backend
function normalizeUser(user: UserDto): UserDto {
  return { ...user, role: Number(user.role) as UserRole };
}

const initialState: AuthState = {
  user: null,
  accessToken: localStorage.getItem('accessToken'),
  refreshToken: localStorage.getItem('refreshToken'),
  isAuthenticated: !!localStorage.getItem('accessToken'),
  isLoading: false,
};

const storedUser = localStorage.getItem('user');
if (storedUser) {
  try {
    const parsed = JSON.parse(storedUser);
    initialState.user = normalizeUser(parsed);
  } catch {
    localStorage.removeItem('user');
  }
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginSuccess: (state, action: PayloadAction<{ user: UserDto; accessToken: string; refreshToken: string }>) => {
      const user = normalizeUser(action.payload.user);
      state.user = user;
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.isAuthenticated = true;
      state.isLoading = false;

      localStorage.setItem('accessToken', action.payload.accessToken);
      localStorage.setItem('refreshToken', action.payload.refreshToken);
      localStorage.setItem('user', JSON.stringify(user));
    },
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      localStorage.clear();
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    updateTokens: (state, action: PayloadAction<{ accessToken: string; refreshToken: string }>) => {
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      localStorage.setItem('accessToken', action.payload.accessToken);
      localStorage.setItem('refreshToken', action.payload.refreshToken);
    },
  },
});

export const { loginSuccess, logout, setLoading, updateTokens } = authSlice.actions;

export const selectUser = (state: { auth: AuthState }) => state.auth.user;
export const selectIsAuthenticated = (state: { auth: AuthState }) => state.auth.isAuthenticated;
export const selectUserRole = (state: { auth: AuthState }) =>
  state.auth.user ? (Number(state.auth.user.role) as UserRole) : undefined;
export const selectOrgId = (state: { auth: AuthState }) => state.auth.user?.organizationId;
export const selectIsSuperAdmin = (state: { auth: AuthState }) =>
  Number(state.auth.user?.role) === UserRole.SuperAdmin;
export const selectIsOrgAdmin = (state: { auth: AuthState }) =>
  Number(state.auth.user?.role) === UserRole.OrgAdmin;

export default authSlice.reducer;
