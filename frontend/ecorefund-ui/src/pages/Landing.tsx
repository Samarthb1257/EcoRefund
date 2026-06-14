import { useNavigate } from 'react-router-dom';
import {
  Box, Button, Container, Typography, Grid, Card, CardContent,
  Chip, Stack,
} from '@mui/material';
import {
  QrCode, Security, Analytics, Business, ArrowForward,
  RecyclingOutlined, VerifiedUser, Speed,
} from '@mui/icons-material';

export const Landing = () => {
  const navigate = useNavigate();

  const features = [
    { icon: <QrCode fontSize="large" />, title: 'QR Code Tracking', desc: 'Generate, print, and scan QR labels for every waste item with instant refund processing.' },
    { icon: <Security fontSize="large" />, title: 'Fraud Prevention', desc: 'Every QR becomes INVALID after redemption. Duplicate scan attempts are blocked and logged.' },
    { icon: <Analytics fontSize="large" />, title: 'Smart Analytics', desc: 'Real-time dashboards, Excel/PDF reports, staff activity tracking, and deposit statistics.' },
    { icon: <Business fontSize="large" />, title: 'Multi-Tenant SaaS', desc: 'Zoos, hospitals, malls, airports, stadiums — each organization is completely isolated.' },
    { icon: <VerifiedUser fontSize="large" />, title: 'Role-Based Access', desc: 'Super Admin, Org Admin, Entry/Exit Staff, Auditor — each with precise permissions.' },
    { icon: <Speed fontSize="large" />, title: 'Mobile-First', desc: 'Staff scan QR codes using mobile cameras. No hardware required — works on any smartphone.' },
  ];

  const orgTypes = ['Zoo', 'Hospital', 'Cinema', 'Stadium', 'Airport', 'Mall', 'College', 'Railway Station', 'Smart City'];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#FAFAFA' }}>
      {/* Hero */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #1B5E20 0%, #2E7D32 40%, #388E3C 100%)',
          color: 'white',
          py: { xs: 8, md: 12 },
          px: 2,
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={7}>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <RecyclingOutlined fontSize="large" />
                <Typography variant="h4" fontWeight={800}>EcoRefund AI</Typography>
              </Box>
              <Typography variant="h3" fontWeight={700} sx={{ mb: 2, lineHeight: 1.2 }}>
                Waste Deposit &<br />Refund Platform
              </Typography>
              <Typography variant="h6" sx={{ opacity: 0.9, mb: 4 }}>
                Reduce waste. Reward responsibility. Track every plastic bottle, bag,
                and container from entry to exit with QR codes.
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => navigate('/login')}
                  endIcon={<ArrowForward />}
                  sx={{
                    bgcolor: 'white', color: '#2E7D32',
                    fontWeight: 700, px: 4,
                    '&:hover': { bgcolor: '#F1F8E9' },
                  }}
                >
                  Login
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => navigate('/register')}
                  sx={{ borderColor: 'white', color: 'white', fontWeight: 700, px: 4 }}
                >
                  Register Organization
                </Button>
              </Stack>
            </Grid>

            <Grid item xs={12} md={5}>
              <Box
                sx={{
                  bgcolor: 'rgba(255,255,255,0.1)',
                  borderRadius: 3,
                  p: 3,
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.2)',
                }}
              >
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  Trusted by Organizations
                </Typography>
                <Box display="flex" flexWrap="wrap" gap={1}>
                  {orgTypes.map(t => (
                    <Chip key={t} label={t} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }} />
                  ))}
                </Box>
                <Box sx={{ mt: 3, bgcolor: 'rgba(0,0,0,0.2)', borderRadius: 2, p: 2 }}>
                  <Typography variant="body2" sx={{ opacity: 0.8, fontFamily: 'monospace' }}>
                    QR-000001 — Plastic Bottle<br />
                    Deposit: ₹20 | Status: ACTIVE<br />
                    <span style={{ color: '#A5D6A7' }}>→ Scan to get REFUND</span>
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Features */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography variant="h4" fontWeight={700} textAlign="center" mb={1}>
          Everything You Need
        </Typography>
        <Typography variant="body1" textAlign="center" color="text.secondary" mb={6}>
          Complete waste deposit tracking from registration to refund
        </Typography>

        <Grid container spacing={3}>
          {features.map(f => (
            <Grid item xs={12} sm={6} md={4} key={f.title}>
              <Card elevation={0} sx={{ height: '100%', border: '1px solid #E0E0E0', borderRadius: 2,
                '&:hover': { boxShadow: '0 4px 20px rgba(46,125,50,0.15)', borderColor: '#2E7D32' }, transition: 'all 0.2s' }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ color: '#2E7D32', mb: 2 }}>{f.icon}</Box>
                  <Typography variant="h6" fontWeight={600} mb={1}>{f.title}</Typography>
                  <Typography variant="body2" color="text.secondary">{f.desc}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* CTA */}
      <Box sx={{ bgcolor: '#E8F5E9', py: 6, textAlign: 'center' }}>
        <Container maxWidth="sm">
          <Typography variant="h5" fontWeight={700} mb={2}>Ready to go green?</Typography>
          <Typography variant="body1" color="text.secondary" mb={3}>
            Join hundreds of organizations reducing plastic waste with EcoRefund AI.
          </Typography>
          <Stack direction="row" spacing={2} justifyContent="center">
            <Button variant="contained" size="large" onClick={() => navigate('/register')}
              sx={{ bgcolor: '#2E7D32', '&:hover': { bgcolor: '#1B5E20' }, px: 4 }}>
              Register Free
            </Button>
            <Button variant="outlined" size="large" onClick={() => navigate('/login')}
              sx={{ borderColor: '#2E7D32', color: '#2E7D32', px: 4 }}>
              Login
            </Button>
          </Stack>
        </Container>
      </Box>

      <Box sx={{ bgcolor: '#1B5E20', color: 'rgba(255,255,255,0.6)', py: 2, textAlign: 'center' }}>
        <Typography variant="caption">
          © 2024 EcoRefund AI · Waste Deposit & Refund Platform · Built for a greener tomorrow
        </Typography>
      </Box>
    </Box>
  );
};
