import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Card, CardContent, Grid, Typography, Button, CircularProgress,
  Chip,
} from '@mui/material';
import {
  QrCode, MonetizationOn, Recycling, PeopleAlt,
  Warning, QrCodeScanner, AddCircle, Assessment,
} from '@mui/icons-material';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { useSelector } from 'react-redux';
import { selectUser } from '../../store/authSlice';
import { organizationApi } from '../../api/organizationApi';
import { DashboardStats } from '../../types';

const METHOD_COLORS: Record<string, string> = {
  Cash: '#2E7D32',
  UPI: '#1976D2',
  Coupon: '#F57C00',
  Wallet: '#7B1FA2',
  BankTransfer: '#00838F',
};

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

export const ManagerDashboard = () => {
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

  const weeklyChartData = stats?.weeklyData?.map(d => ({
    day: d.day,
    deposits: d.deposits,
    refunds: d.refunds,
  })) ?? [];

  const refundPieData = (stats?.refundMethods ?? []).map(m => ({
    name: m.method,
    value: m.count,
    color: METHOD_COLORS[m.method] ?? '#9E9E9E',
  }));

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Manager Dashboard</Typography>
          <Typography variant="body2" color="text.secondary">
            {user?.organizationName} · Operational Overview
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
            <StatCard title="Items Registered Today" value={stats.todayItems}
              subtitle={`${stats.activeItems} currently active`}
              icon={<QrCode />} color="#2E7D32" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard title="Today's Refunds" value={stats.todayRefunds}
              subtitle={`₹${stats.monthlyRefunds.toLocaleString()} this month`}
              icon={<Recycling />} color="#1976D2" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard title="Monthly Deposits" value={`₹${stats.monthlyDeposits.toLocaleString()}`}
              subtitle={`₹${stats.totalDepositsCollected.toLocaleString()} total`}
              icon={<MonetizationOn />} color="#F57C00" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard title="Active Staff" value={stats.activeStaff}
              subtitle={`${stats.fraudAttempts} fraud attempts blocked`}
              icon={<Warning />} color="#C62828" />
          </Grid>
        </Grid>
      )}

      {/* Charts Row */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={8}>
          <Card elevation={0} sx={{ border: '1px solid #E0E0E0', borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={2}>Weekly Activity (Last 7 Days)</Typography>
              {weeklyChartData.length === 0 ? (
                <Box display="flex" alignItems="center" justifyContent="center" height={220}>
                  <Typography color="text.secondary">No activity data yet</Typography>
                </Box>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={weeklyChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F5F5F5" />
                    <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="deposits" fill="#2E7D32" name="Deposits" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="refunds" fill="#81C784" name="Refunds" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card elevation={0} sx={{ border: '1px solid #E0E0E0', borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={2}>Refund Methods</Typography>
              {refundPieData.length === 0 ? (
                <Box display="flex" alignItems="center" justifyContent="center" height={180}>
                  <Typography color="text.secondary">No refunds yet</Typography>
                </Box>
              ) : (
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={refundPieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                      dataKey="value" paddingAngle={4}>
                      {refundPieData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(val, name) => [`${val} refunds`, name]} />
                  </PieChart>
                </ResponsiveContainer>
              )}
              <Box display="flex" flexWrap="wrap" gap={0.5} mt={1}>
                {refundPieData.map(d => (
                  <Chip key={d.name} label={`${d.name}: ${d.value}`} size="small"
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
              { label: 'View Staff', icon: <PeopleAlt />, path: '/org-admin/staff', color: '#1976D2' },
              { label: 'Deposits Report', icon: <Assessment />, path: '/reports/deposits', color: '#2E7D32' },
              { label: 'Refunds Report', icon: <Recycling />, path: '/reports/refunds', color: '#7B1FA2' },
              { label: 'Audit Logs', icon: <Assessment />, path: '/reports/audit', color: '#F57C00' },
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
