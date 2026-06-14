import { useNavigate } from 'react-router-dom';
import { Box, Button, Card, CardContent, Typography, Grid } from '@mui/material';
import { QrCode, History } from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { selectUser } from '../../store/authSlice';

export const EntryStaffDashboard = () => {
  const navigate = useNavigate();
  const user = useSelector(selectUser);

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={1}>Entry Staff Dashboard</Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Welcome, {user?.fullName} — {user?.organizationName}
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card elevation={0} sx={{ border: '2px solid #2E7D32', borderRadius: 3, textAlign: 'center', p: 2 }}>
            <CardContent>
              <QrCode sx={{ fontSize: 64, color: '#2E7D32', mb: 2 }} />
              <Typography variant="h5" fontWeight={700} mb={1}>Generate QR Code</Typography>
              <Typography variant="body2" color="text.secondary" mb={3}>
                Register a new item, collect deposit, and generate a QR label for the customer
              </Typography>
              <Button fullWidth variant="contained" size="large"
                onClick={() => navigate('/entry-staff/generate-qr')}
                sx={{ bgcolor: '#2E7D32', '&:hover': { bgcolor: '#1B5E20' }, py: 2, fontWeight: 700, fontSize: 16 }}>
                Generate QR & Collect Deposit
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card elevation={0} sx={{ border: '1px solid #E0E0E0', borderRadius: 3, textAlign: 'center', p: 2 }}>
            <CardContent>
              <History sx={{ fontSize: 64, color: '#1976D2', mb: 2 }} />
              <Typography variant="h5" fontWeight={700} mb={1}>View QR History</Typography>
              <Typography variant="body2" color="text.secondary" mb={3}>
                View all QR codes you have generated today and their current status
              </Typography>
              <Button fullWidth variant="outlined" size="large"
                onClick={() => navigate('/reports/qr-codes')}
                sx={{ borderColor: '#1976D2', color: '#1976D2', py: 2, fontWeight: 700, fontSize: 16 }}>
                View My QR Codes
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};
