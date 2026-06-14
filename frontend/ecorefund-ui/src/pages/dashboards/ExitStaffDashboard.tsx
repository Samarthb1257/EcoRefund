import { useNavigate } from 'react-router-dom';
import { Box, Button, Card, CardContent, Typography, Grid } from '@mui/material';
import { QrCodeScanner, Assessment } from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { selectUser } from '../../store/authSlice';

export const ExitStaffDashboard = () => {
  const navigate = useNavigate();
  const user = useSelector(selectUser);

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={1}>Exit Staff Dashboard</Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Welcome, {user?.fullName} — {user?.organizationName}
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card elevation={0} sx={{ border: '2px solid #E65100', borderRadius: 3, textAlign: 'center', p: 2 }}>
            <CardContent>
              <QrCodeScanner sx={{ fontSize: 64, color: '#E65100', mb: 2 }} />
              <Typography variant="h5" fontWeight={700} mb={1}>Scan QR & Refund</Typography>
              <Typography variant="body2" color="text.secondary" mb={3}>
                Scan the customer's QR label, verify the item, and process the deposit refund instantly
              </Typography>
              <Button fullWidth variant="contained" size="large"
                onClick={() => navigate('/exit-staff/scan-qr')}
                sx={{ bgcolor: '#E65100', '&:hover': { bgcolor: '#BF360C' }, py: 2, fontWeight: 700, fontSize: 16 }}>
                Scan QR Code
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card elevation={0} sx={{ border: '1px solid #E0E0E0', borderRadius: 3, textAlign: 'center', p: 2 }}>
            <CardContent>
              <Assessment sx={{ fontSize: 64, color: '#1976D2', mb: 2 }} />
              <Typography variant="h5" fontWeight={700} mb={1}>Today's Refunds</Typography>
              <Typography variant="body2" color="text.secondary" mb={3}>
                View all refunds processed by you today with transaction references
              </Typography>
              <Button fullWidth variant="outlined" size="large"
                onClick={() => navigate('/reports/refunds')}
                sx={{ borderColor: '#1976D2', color: '#1976D2', py: 2, fontWeight: 700, fontSize: 16 }}>
                View Refund History
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};
