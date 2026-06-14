import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Card, CardContent, Grid, Typography, Button,
  Chip, CircularProgress,
} from '@mui/material';
import {
  QrCode, MonetizationOn, Recycling, PeopleAlt,
  TrendingUp, Warning, QrCodeScanner, AddCircle,
} from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useSelector } from 'react-redux';
import { selectUser } from '../../store/authSlice';
import { organizationApi } from '../../api/organizationApi';
import { DashboardStats } from '../../types';

const StatCard = ({ title, value, subtitle, icon, color }: {
  title: string; value: string | number; subtitle?: string;
  icon: React.ReactNode; color: string;
}) => (
  <Card elevation={0} sx={{ border: '1px solid #E0E0E0', borderRadius: 2, height: '100%' }}>
    <CardContent>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start">
        <Box>
          <Typography variant="body2" color="text.secondary" gutterBottom>{title}</Typography>
          <Typography variant="h4" fontWeight={700} sx={{ color }}>{value}</Typography>
          {subtitle && <Typography variant="caption" color="text.secondary">{subtitle}</Typography>}
        </Box>
        <Box sx={{ bgcolor: `${color}15`, borderRadius: 2, p: 1.5, color }}>{icon}</Box>
      </Box>
    </CardContent>
  </Card>
);

export const OrgAdminDashboard = () => {
  const user = useSelector(selectUser);
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.organizationId) {
      organizationApi.getDashboard(user.organizationId)
        .then(res => { if (res.success) setStats(res.data); })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [user]);

  if (loading) return <Box display="flex" justifyContent="center" py={8}><CircularProgress sx={{ color: '#2E7D32' }} /></Box>;

  const refundMethodData = [
    { name: 'Cash', value: 40, color: '#2E7D32' },
    { name: 'UPI', value: 35, color: '#1976D2' },
    { name: 'Coupon', value: 15, color: '#F57C00' },
    { name: 'Wallet', value: 10, color: '#7B1FA2' },
  ];

  const weeklyData = [
    { day: 'Mon', deposits: 45, refunds: 38 },
    { day: 'Tue', deposits: 52, refunds: 44 },
    { day: 'Wed', deposits: 38, refunds: 30 },
    { day: 'Thu', deposits: 61, refunds: 55 },
    { day: 'Fri', deposits: 72, refunds: 68 },
    { day: 'Sat', deposits: 89, refunds: 82 },
    { day: 'Sun', deposits: 67, refunds: 60 },
  ];

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Dashboard</Typography>
          <Typography variant="body2" color="text.secondary">
            Welcome back, {user?.fullName} · {user?.organizationName}
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Button startIcon={<AddCircle />} variant="contained"
            sx={{ bgcolor: '#2E7D32', '&:hover': { bgcolor: '#1B5E20' } }}
            onClick={() => navigate('/entry-staff/generate-qr')}>
            Generate QR
          </Button>
          <Button startIcon={<QrCodeScanner />} variant="outlined"
            sx={{ borderColor: '#2E7D32', color: '#2E7D32' }}
            onClick={() => navigate('/exit-staff/scan-qr')}>
            Scan QR
          </Button>
        </Box>
      </Box>

      {/* Stats Grid */}
      {stats && (
        <Grid container spacing={2} mb={3}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard title="Active Items Today" value={stats.todayItems} subtitle={`${stats.activeItems} total active`}
              icon={<QrCode />} color="#2E7D32" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard title="Today's Refunds" value={stats.todayRefunds} subtitle={`${stats.totalRefunds} total`}
              icon={<Recycling />} color="#1976D2" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard title="Monthly Deposits" value={`₹${stats.monthlyDeposits.toLocaleString()}`}
              subtitle="This month" icon={<MonetizationOn />} color="#F57C00" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard title="Fraud Attempts" value={stats.fraudAttempts}
              subtitle="Blocked by system" icon={<Warning />} color="#C62828" />
          </Grid>
        </Grid>
      )}

      {/* Charts Row */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={8}>
          <Card elevation={0} sx={{ border: '1px solid #E0E0E0', borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={2}>Weekly Activity</Typography>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F5F5F5" />
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="deposits" fill="#2E7D32" name="Deposits" radius={[3,3,0,0]} />
                  <Bar dataKey="refunds" fill="#81C784" name="Refunds" radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card elevation={0} sx={{ border: '1px solid #E0E0E0', borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={2}>Refund Methods</Typography>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={refundMethodData} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                    dataKey="value" paddingAngle={4}>
                    {refundMethodData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val) => `${val}%`} />
                </PieChart>
              </ResponsiveContainer>
              <Box display="flex" flexWrap="wrap" gap={0.5} mt={1}>
                {refundMethodData.map(d => (
                  <Chip key={d.name} label={`${d.name} ${d.value}%`} size="small"
                    sx={{ bgcolor: `${d.color}20`, color: d.color, fontSize: 11 }} />
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Card elevation={0} sx={{ border: '1px solid #E0E0E0', borderRadius: 2 }}>
        <CardContent>
          <Typography variant="h6" fontWeight={600} mb={2}>Quick Actions</Typography>
          <Grid container spacing={2}>
            {[
              { label: 'Manage Staff', icon: <PeopleAlt />, path: '/org-admin/staff', color: '#1976D2' },
              { label: 'Staff Access Control', icon: <PeopleAlt />, path: '/org-admin/staff-access', color: '#7B1FA2' },
              { label: 'View Refunds', icon: <Recycling />, path: '/reports/refunds', color: '#2E7D32' },
              { label: 'Download Report', icon: <TrendingUp />, path: '/reports/refunds', color: '#F57C00' },
            ].map(a => (
              <Grid item xs={6} md={3} key={a.label}>
                <Button fullWidth variant="outlined" startIcon={a.icon}
                  onClick={() => navigate(a.path)}
                  sx={{ borderColor: a.color, color: a.color, py: 1.5,
                    '&:hover': { bgcolor: `${a.color}10`, borderColor: a.color } }}>
                  {a.label}
                </Button>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};
