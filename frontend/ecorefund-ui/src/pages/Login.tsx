import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Box, Button, Card, CardContent, Container, FormControl,
  FormControlLabel, FormLabel, Radio, RadioGroup, TextField,
  Typography, Alert, CircularProgress, InputAdornment, IconButton,
  Divider,
} from '@mui/material';
import { Visibility, VisibilityOff, RecyclingOutlined } from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAuth } from '../hooks/useAuth';
import { UserRole } from '../types';

const schema = yup.object({
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
});

interface FormData {
  email: string;
  password: string;
}

const roles = [
  { value: UserRole.SuperAdmin, label: 'Super Admin', color: '#9C27B0', desc: 'Platform administrator' },
  { value: UserRole.OrgAdmin, label: 'Organization Admin', color: '#1976D2', desc: 'Manage your organization' },
  { value: UserRole.Manager, label: 'Manager', color: '#0288D1', desc: 'Oversee operations' },
  { value: UserRole.EntryStaff, label: 'Entry Staff', color: '#2E7D32', desc: 'Register items & generate QR' },
  { value: UserRole.ExitStaff, label: 'Exit Staff', color: '#E65100', desc: 'Scan QR & process refunds' },
  { value: UserRole.Auditor, label: 'Auditor', color: '#5D4037', desc: 'View logs & reports' },
];

export const Login = () => {
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.OrgAdmin);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: yupResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setError(null);
    setIsLoading(true);
    try {
      await login(data.email, data.password, selectedRole);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #E8F5E9 0%, #F1F8E9 100%)',
        display: 'flex',
        alignItems: 'center',
        py: 4,
      }}
    >
      <Container maxWidth="sm">
        {/* Logo */}
        <Box textAlign="center" mb={3}>
          <Box display="flex" alignItems="center" justifyContent="center" gap={1} mb={1}>
            <RecyclingOutlined sx={{ color: '#2E7D32', fontSize: 36 }} />
            <Typography variant="h4" fontWeight={800} color="#2E7D32">
              EcoRefund AI
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            Waste Deposit & Refund Platform
          </Typography>
        </Box>

        <Card elevation={3} sx={{ borderRadius: 3 }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h5" fontWeight={700} textAlign="center" mb={3}>
              Login to Your Account
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                {error}
              </Alert>
            )}

            {/* Role Selector */}
            <FormControl component="fieldset" sx={{ mb: 3, width: '100%' }}>
              <FormLabel sx={{ fontWeight: 600, color: 'text.primary', mb: 1 }}>
                Select Your Role
              </FormLabel>
              <RadioGroup
                value={selectedRole}
                onChange={(e) => setSelectedRole(Number(e.target.value) as UserRole)}
              >
                <Box display="grid" gridTemplateColumns="1fr 1fr" gap={1}>
                  {roles.map(r => (
                    <Box
                      key={r.value}
                      sx={{
                        border: `2px solid ${selectedRole === r.value ? r.color : '#E0E0E0'}`,
                        borderRadius: 2,
                        p: 1.5,
                        cursor: 'pointer',
                        bgcolor: selectedRole === r.value ? `${r.color}10` : 'white',
                        transition: 'all 0.15s',
                        '&:hover': { borderColor: r.color },
                      }}
                      onClick={() => setSelectedRole(r.value)}
                    >
                      <FormControlLabel
                        value={r.value}
                        control={<Radio size="small" sx={{ color: r.color, '&.Mui-checked': { color: r.color }, p: 0, mr: 1 }} />}
                        label={
                          <Box>
                            <Typography variant="body2" fontWeight={600} sx={{ color: selectedRole === r.value ? r.color : 'text.primary' }}>
                              {r.label}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">{r.desc}</Typography>
                          </Box>
                        }
                        sx={{ m: 0 }}
                      />
                    </Box>
                  ))}
                </Box>
              </RadioGroup>
            </FormControl>

            <Divider sx={{ mb: 3 }} />

            {/* Login Form */}
            <Box component="form" onSubmit={handleSubmit(onSubmit)}>
              <TextField
                fullWidth
                label="Email Address"
                type="email"
                {...register('email')}
                error={!!errors.email}
                helperText={errors.email?.message}
                sx={{ mb: 2 }}
                autoComplete="email"
              />
              <TextField
                fullWidth
                label="Password"
                type={showPassword ? 'text' : 'password'}
                {...register('password')}
                error={!!errors.password}
                helperText={errors.password?.message}
                sx={{ mb: 3 }}
                autoComplete="current-password"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={isLoading}
                sx={{
                  bgcolor: '#2E7D32',
                  '&:hover': { bgcolor: '#1B5E20' },
                  py: 1.5,
                  fontWeight: 700,
                  fontSize: 16,
                }}
              >
                {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Login'}
              </Button>
            </Box>

            <Box textAlign="center" mt={3}>
              <Typography variant="body2" color="text.secondary">
                Don't have an organization account?{' '}
                <Link to="/register" style={{ color: '#2E7D32', fontWeight: 600, textDecoration: 'none' }}>
                  Register Organization
                </Link>
              </Typography>
              <Button onClick={() => navigate('/')} sx={{ mt: 1, color: 'text.secondary' }} size="small">
                ← Back to Home
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};
