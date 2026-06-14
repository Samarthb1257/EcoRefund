import { useNavigate } from 'react-router-dom';
import { Box, Button, Card, CardContent, Typography, Grid } from '@mui/material';
import { BarChart, Description, Security, TableChart } from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { selectUser } from '../../store/authSlice';

export const AuditorDashboard = () => {
  const navigate = useNavigate();
  const user = useSelector(selectUser);

  const actions = [
    { label: 'Deposit Report', icon: <TableChart sx={{ fontSize: 40 }} />, path: '/reports/deposits', color: '#1976D2' },
    { label: 'Refund Report', icon: <BarChart sx={{ fontSize: 40 }} />, path: '/reports/refunds', color: '#2E7D32' },
    { label: 'QR Code Tracker', icon: <Description sx={{ fontSize: 40 }} />, path: '/reports/qr-codes', color: '#7B1FA2' },
    { label: 'Audit Logs', icon: <Security sx={{ fontSize: 40 }} />, path: '/reports/audit', color: '#E65100' },
  ];

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={1}>Auditor Dashboard</Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Welcome, {user?.fullName} — View logs, reports, and track activities
      </Typography>

      <Grid container spacing={3}>
        {actions.map(a => (
          <Grid item xs={6} md={3} key={a.label}>
            <Card elevation={0} sx={{ border: `2px solid ${a.color}20`, borderRadius: 3, textAlign: 'center',
              '&:hover': { border: `2px solid ${a.color}`, boxShadow: `0 4px 20px ${a.color}20` }, transition: 'all 0.2s' }}>
              <CardContent>
                <Box sx={{ color: a.color, mb: 1 }}>{a.icon}</Box>
                <Typography variant="subtitle1" fontWeight={600} mb={1}>{a.label}</Typography>
                <Button variant="outlined" size="small" onClick={() => navigate(a.path)}
                  sx={{ borderColor: a.color, color: a.color, '&:hover': { bgcolor: `${a.color}10` } }}>
                  View & Export
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};
