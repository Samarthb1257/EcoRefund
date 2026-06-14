import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Button, Card, CardContent, Container, Grid, MenuItem,
  TextField, Typography, Alert, CircularProgress, Divider,
} from '@mui/material';
import { RecyclingOutlined, CheckCircle } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { organizationApi } from '../api/organizationApi';

const orgTypes = [
  { value: 1, label: 'Zoo' },
  { value: 2, label: 'Museum' },
  { value: 3, label: 'Cinema Hall' },
  { value: 4, label: 'Hospital' },
  { value: 5, label: 'College' },
  { value: 6, label: 'Stadium' },
  { value: 7, label: 'Airport' },
  { value: 8, label: 'Railway Station' },
  { value: 9, label: 'Mall' },
  { value: 10, label: 'Amusement Park' },
  { value: 11, label: 'Event Organizer' },
  { value: 12, label: 'Smart City' },
  { value: 13, label: 'Government' },
  { value: 14, label: 'Other' },
];

const schema = yup.object({
  organizationName: yup.string().required('Organization name is required').min(3),
  organizationType: yup.number().required('Select organization type'),
  address: yup.string().required('Address is required'),
  city: yup.string().required('City is required'),
  state: yup.string().required('State is required'),
  pinCode: yup.string().required('PIN Code is required').matches(/^\d{6}$/, 'Invalid PIN code'),
  email: yup.string().email('Invalid email').required('Email is required'),
  phone: yup.string().required('Phone is required').matches(/^\d{10}$/, 'Invalid phone number'),
  gstNumber: yup.string().optional(),
  adminFirstName: yup.string().required('First name is required'),
  adminLastName: yup.string().required('Last name is required'),
  adminEmail: yup.string().email('Invalid email').required('Admin email is required'),
  adminPassword: yup.string().min(8, 'Password must be at least 8 characters').required('Password is required'),
  confirmPassword: yup.string()
    .oneOf([yup.ref('adminPassword')], 'Passwords must match')
    .required('Confirm password'),
});

interface FormData {
  organizationName: string;
  organizationType: number;
  address: string;
  city: string;
  state: string;
  pinCode: string;
  email: string;
  phone: string;
  gstNumber?: string;
  adminFirstName: string;
  adminLastName: string;
  adminEmail: string;
  adminPassword: string;
  confirmPassword: string;
}

export const Register = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ orgCode: string; adminEmail: string } | null>(null);

  const { register, handleSubmit, control, formState: { errors } } = useForm<FormData>({
    resolver: yupResolver(schema),
    defaultValues: { organizationType: 1 },
  });

  const onSubmit = async (data: FormData) => {
    setError(null);
    setIsLoading(true);
    try {
      const res = await organizationApi.register({
        organizationName: data.organizationName,
        organizationType: data.organizationType,
        address: data.address,
        city: data.city,
        state: data.state,
        pinCode: data.pinCode,
        email: data.email,
        phone: data.phone,
        gstNumber: data.gstNumber || null,
        adminFirstName: data.adminFirstName,
        adminLastName: data.adminLastName,
        adminEmail: data.adminEmail,
        adminPassword: data.adminPassword,
        subscriptionPlan: 1,
      });

      if (res.success) {
        setSuccess({ orgCode: res.data.organizationCode, adminEmail: res.data.adminEmail });
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', bgcolor: '#E8F5E9' }}>
        <Container maxWidth="sm">
          <Card elevation={3} sx={{ borderRadius: 3 }}>
            <CardContent sx={{ p: 4, textAlign: 'center' }}>
              <CheckCircle sx={{ fontSize: 64, color: '#2E7D32', mb: 2 }} />
              <Typography variant="h5" fontWeight={700} color="#2E7D32" mb={2}>
                Organization Registered!
              </Typography>
              <Box sx={{ bgcolor: '#F5F5F5', borderRadius: 2, p: 3, mb: 3 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>Your Organization ID</Typography>
                <Typography variant="h4" fontWeight={800} color="#2E7D32">{success.orgCode}</Typography>
                <Divider sx={{ my: 2 }} />
                <Typography variant="body2" color="text.secondary">Admin Account</Typography>
                <Typography variant="body1" fontWeight={600}>{success.adminEmail}</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" mb={3}>
                Save your Organization ID. You'll need it to login and identify your account.
              </Typography>
              <Button
                fullWidth variant="contained" size="large"
                onClick={() => navigate('/login')}
                sx={{ bgcolor: '#2E7D32', '&:hover': { bgcolor: '#1B5E20' }, py: 1.5, fontWeight: 700 }}
              >
                Proceed to Login
              </Button>
            </CardContent>
          </Card>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#F5F5F5', py: 4 }}>
      <Container maxWidth="md">
        <Box textAlign="center" mb={4}>
          <Box display="flex" alignItems="center" justifyContent="center" gap={1} mb={1}>
            <RecyclingOutlined sx={{ color: '#2E7D32', fontSize: 36 }} />
            <Typography variant="h4" fontWeight={800} color="#2E7D32">EcoRefund AI</Typography>
          </Box>
          <Typography variant="h5" fontWeight={700}>Register Your Organization</Typography>
          <Typography variant="body2" color="text.secondary">
            Set up your waste deposit & refund platform in minutes
          </Typography>
        </Box>

        <Card elevation={3} sx={{ borderRadius: 3 }}>
          <CardContent sx={{ p: 4 }}>
            {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>{error}</Alert>}

            <Box component="form" onSubmit={handleSubmit(onSubmit)}>
              {/* Organization Details */}
              <Typography variant="h6" fontWeight={700} mb={2} color="#2E7D32">
                Organization Details
              </Typography>
              <Grid container spacing={2} mb={3}>
                <Grid item xs={12} md={8}>
                  <TextField fullWidth label="Organization Name *" {...register('organizationName')}
                    error={!!errors.organizationName} helperText={errors.organizationName?.message} />
                </Grid>
                <Grid item xs={12} md={4}>
                  <Controller name="organizationType" control={control} render={({ field }) => (
                    <TextField select fullWidth label="Organization Type *" {...field}
                      error={!!errors.organizationType} helperText={errors.organizationType?.message}>
                      {orgTypes.map(t => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
                    </TextField>
                  )} />
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth label="Address *" {...register('address')}
                    error={!!errors.address} helperText={errors.address?.message} />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField fullWidth label="City *" {...register('city')}
                    error={!!errors.city} helperText={errors.city?.message} />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField fullWidth label="State *" {...register('state')}
                    error={!!errors.state} helperText={errors.state?.message} />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField fullWidth label="PIN Code *" {...register('pinCode')}
                    error={!!errors.pinCode} helperText={errors.pinCode?.message} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField fullWidth label="Organization Email *" type="email" {...register('email')}
                    error={!!errors.email} helperText={errors.email?.message} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField fullWidth label="Phone *" {...register('phone')}
                    error={!!errors.phone} helperText={errors.phone?.message} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField fullWidth label="GST Number (Optional)" {...register('gstNumber')} />
                </Grid>
              </Grid>

              <Divider sx={{ mb: 3 }} />

              {/* Admin Account */}
              <Typography variant="h6" fontWeight={700} mb={2} color="#1976D2">
                Admin Account Setup
              </Typography>
              <Grid container spacing={2} mb={3}>
                <Grid item xs={12} md={6}>
                  <TextField fullWidth label="First Name *" {...register('adminFirstName')}
                    error={!!errors.adminFirstName} helperText={errors.adminFirstName?.message} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField fullWidth label="Last Name *" {...register('adminLastName')}
                    error={!!errors.adminLastName} helperText={errors.adminLastName?.message} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField fullWidth label="Admin Email *" type="email" {...register('adminEmail')}
                    error={!!errors.adminEmail} helperText={errors.adminEmail?.message} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField fullWidth label="Password *" type="password" {...register('adminPassword')}
                    error={!!errors.adminPassword} helperText={errors.adminPassword?.message} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField fullWidth label="Confirm Password *" type="password" {...register('confirmPassword')}
                    error={!!errors.confirmPassword} helperText={errors.confirmPassword?.message} />
                </Grid>
              </Grid>

              <Button type="submit" fullWidth variant="contained" size="large" disabled={isLoading}
                sx={{ bgcolor: '#2E7D32', '&:hover': { bgcolor: '#1B5E20' }, py: 1.5, fontWeight: 700, fontSize: 16 }}>
                {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Register Organization'}
              </Button>

              <Box textAlign="center" mt={2}>
                <Typography variant="body2" color="text.secondary">
                  Already registered?{' '}
                  <Button onClick={() => navigate('/login')} sx={{ color: '#2E7D32', p: 0, fontWeight: 600 }} size="small">
                    Login here
                  </Button>
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};
