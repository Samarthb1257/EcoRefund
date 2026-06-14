import { useState, useEffect, useRef } from 'react';
import {
  Box, Button, Card, CardContent, Grid, MenuItem, TextField,
  Typography, Alert, CircularProgress, Chip, Stack,
} from '@mui/material';
import {
  QrCodeScanner, CheckCircle, Cancel, Warning,
  MonetizationOn, ArrowForward,
} from '@mui/icons-material';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { qrApi } from '../../api/qrApi';
import { refundApi } from '../../api/refundApi';
import { RefundMethod, ScanQrResponse, ScanResult } from '../../types';

type Step = 'scan' | 'result' | 'refund' | 'done';

const refundMethods = [
  { value: RefundMethod.Cash, label: 'Cash' },
  { value: RefundMethod.UPI, label: 'UPI' },
  { value: RefundMethod.Coupon, label: 'Coupon' },
  { value: RefundMethod.Wallet, label: 'Digital Wallet' },
];

export const ScanAndRefund = () => {
  const [step, setStep] = useState<Step>('scan');
  const [scanResult, setScanResult] = useState<ScanQrResponse | null>(null);
  const [refundMethod, setRefundMethod] = useState<RefundMethod>(RefundMethod.Cash);
  const [upiId, setUpiId] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [notes, setNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refundSuccess, setRefundSuccess] = useState<{ amount: number; txRef: string } | null>(null);
  const [manualQrInput, setManualQrInput] = useState('');
  const [useManualInput, setUseManualInput] = useState(false);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    if (step === 'scan' && !useManualInput) {
      const timer = setTimeout(() => {
        try {
          scannerRef.current = new Html5QrcodeScanner('qr-reader', {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1,
          }, false);

          scannerRef.current.render(
            async (decodedText) => {
              scannerRef.current?.clear();
              await handleScan(decodedText);
            },
            () => {}
          );
        } catch (e) {
          setUseManualInput(true);
        }
      }, 100);
      return () => clearTimeout(timer);
    }

    return () => {
      if (scannerRef.current) {
        try { scannerRef.current.clear(); } catch { /* ignore */ }
        scannerRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, useManualInput]);

  const handleScan = async (data: string) => {
    setError(null);
    try {
      const res = await qrApi.scan(data, navigator.userAgent);
      if (res.success) {
        setScanResult(res.data);
        setStep('result');
      }
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Scan failed.');
    }
  };

  const handleManualScan = () => {
    if (!manualQrInput.trim()) return;
    handleScan(manualQrInput.trim());
  };

  const handleProcessRefund = async () => {
    if (!scanResult?.qrCodeId) return;
    setIsProcessing(true);
    setError(null);
    try {
      const res = await refundApi.process({
        qrCodeId: scanResult.qrCodeId,
        refundMethod,
        upiId: refundMethod === RefundMethod.UPI ? upiId : undefined,
        couponCode: refundMethod === RefundMethod.Coupon ? couponCode : undefined,
        notes,
      });
      if (res.success) {
        setRefundSuccess({ amount: res.data.refundAmount, txRef: res.data.transactionReference });
        setStep('done');
      } else {
        setError(res.message);
      }
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Refund processing failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setStep('scan');
    setScanResult(null);
    setRefundSuccess(null);
    setError(null);
    setManualQrInput('');
    setNotes('');
    setUpiId('');
    setCouponCode('');
  };

  const getScanResultDisplay = () => {
    if (!scanResult) return null;
    switch (scanResult.result) {
      case ScanResult.AlreadyRedeemed:
        return { color: '#C62828', icon: <Cancel />, bg: '#FFEBEE', label: 'ALREADY REDEEMED' };
      case ScanResult.InvalidQr:
      case ScanResult.NotFound:
        return { color: '#E65100', icon: <Warning />, bg: '#FFF3E0', label: 'INVALID QR' };
      case ScanResult.WrongOrganization:
        return { color: '#7B1FA2', icon: <Warning />, bg: '#F3E5F5', label: 'WRONG ORGANIZATION' };
      case ScanResult.Expired:
        return { color: '#5D4037', icon: <Warning />, bg: '#EFEBE9', label: 'EXPIRED' };
      case ScanResult.Success:
        return { color: '#2E7D32', icon: <CheckCircle />, bg: '#E8F5E9', label: 'VALID' };
      default:
        return { color: '#757575', icon: <Warning />, bg: '#F5F5F5', label: 'UNKNOWN' };
    }
  };

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={1} display="flex" alignItems="center" gap={1}>
        <QrCodeScanner sx={{ color: '#E65100' }} /> Scan QR & Process Refund
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Scan a customer's QR code to verify and process refund
      </Typography>

      {/* STEP: Scan */}
      {step === 'scan' && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={7}>
            <Card elevation={0} sx={{ border: '1px solid #E0E0E0', borderRadius: 2 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={600} mb={2}>
                  📱 Scan QR Code
                </Typography>

                {!useManualInput ? (
                  <>
                    <div id="qr-reader" style={{ width: '100%' }} />
                    <Button fullWidth variant="text" onClick={() => setUseManualInput(true)}
                      sx={{ mt: 2, color: 'text.secondary' }}>
                      Camera not working? Enter QR data manually
                    </Button>
                  </>
                ) : (
                  <Box>
                    <Alert severity="info" sx={{ mb: 2 }}>
                      Camera unavailable. Enter the QR code data or JSON manually.
                    </Alert>
                    <TextField
                      fullWidth multiline rows={4}
                      label="QR Code Data (JSON)"
                      value={manualQrInput}
                      onChange={e => setManualQrInput(e.target.value)}
                      placeholder={'{"QrId":"...","OrgId":"...","QrNum":"QR-000001"}'}
                      sx={{ mb: 2 }}
                    />
                    <Button fullWidth variant="contained" size="large" onClick={handleManualScan}
                      sx={{ bgcolor: '#E65100', '&:hover': { bgcolor: '#BF360C' }, py: 1.5, fontWeight: 700 }}>
                      Verify QR Code
                    </Button>
                    <Button fullWidth variant="text" onClick={() => setUseManualInput(false)}
                      sx={{ mt: 1, color: 'text.secondary' }}>
                      Try camera again
                    </Button>
                  </Box>
                )}

                {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={5}>
            <Box sx={{ bgcolor: '#FFF3E0', borderRadius: 2, p: 3, border: '1px solid #FFE0B2' }}>
              <Typography variant="subtitle1" fontWeight={600} color="#E65100" mb={2}>
                📋 Exit Staff Instructions
              </Typography>
              {[
                'Ask customer to show their QR label',
                'Scan the QR code using the camera',
                'System verifies the QR automatically',
                'If valid — confirm deposit amount',
                'Select refund method (Cash/UPI/Coupon)',
                'Process refund and confirm to customer',
              ].map((s, i) => (
                <Box key={i} display="flex" gap={1} mb={1}>
                  <Typography variant="body2" fontWeight={700} color="#E65100">{i + 1}.</Typography>
                  <Typography variant="body2" color="text.secondary">{s}</Typography>
                </Box>
              ))}
            </Box>
          </Grid>
        </Grid>
      )}

      {/* STEP: Scan Result */}
      {step === 'result' && scanResult && (() => {
        const display = getScanResultDisplay();
        if (!display) return null;
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card elevation={0} sx={{ border: `2px solid ${display.color}`, borderRadius: 2 }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ bgcolor: display.bg, borderRadius: 2, p: 2, mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ color: display.color, fontSize: 36, display: 'flex' }}>{display.icon}</Box>
                    <Box>
                      <Chip label={display.label} sx={{ bgcolor: display.color, color: 'white', fontWeight: 700, fontSize: 14 }} />
                      <Typography variant="body2" sx={{ mt: 0.5, color: display.color }}>{scanResult.message}</Typography>
                    </Box>
                  </Box>

                  {scanResult.qrCodeNumber && (
                    <Box sx={{ bgcolor: '#F5F5F5', borderRadius: 2, p: 2 }}>
                      <Grid container spacing={1}>
                        <Grid item xs={6}><Typography variant="caption" color="text.secondary">QR Code</Typography>
                          <Typography variant="body2" fontWeight={600}>{scanResult.qrCodeNumber}</Typography></Grid>
                        {scanResult.itemTypeName && <Grid item xs={6}><Typography variant="caption" color="text.secondary">Item Type</Typography>
                          <Typography variant="body2" fontWeight={600}>{scanResult.itemTypeName}</Typography></Grid>}
                        {scanResult.depositAmount && <Grid item xs={6}><Typography variant="caption" color="text.secondary">Deposit Amount</Typography>
                          <Typography variant="h6" fontWeight={700} color="#2E7D32">₹{scanResult.depositAmount}</Typography></Grid>}
                        {scanResult.locationName && <Grid item xs={6}><Typography variant="caption" color="text.secondary">Registered At</Typography>
                          <Typography variant="body2">{scanResult.locationName}</Typography></Grid>}
                      </Grid>
                    </Box>
                  )}

                  <Stack direction="row" spacing={2} mt={3}>
                    <Button fullWidth variant="outlined" onClick={handleReset}>
                      Scan Another
                    </Button>
                    {scanResult.canRefund && (
                      <Button fullWidth variant="contained" endIcon={<ArrowForward />}
                        onClick={() => setStep('refund')}
                        sx={{ bgcolor: '#2E7D32', '&:hover': { bgcolor: '#1B5E20' }, fontWeight: 700 }}>
                        Process Refund
                      </Button>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        );
      })()}

      {/* STEP: Refund */}
      {step === 'refund' && scanResult && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card elevation={0} sx={{ border: '2px solid #2E7D32', borderRadius: 2 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={700} color="#2E7D32" mb={2}>
                  <MonetizationOn sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                  Process Refund — ₹{scanResult.depositAmount}
                </Typography>

                <Box sx={{ bgcolor: '#E8F5E9', borderRadius: 2, p: 2, mb: 3 }}>
                  <Typography variant="body2"><strong>QR:</strong> {scanResult.qrCodeNumber}</Typography>
                  <Typography variant="body2"><strong>Item:</strong> {scanResult.itemTypeName}</Typography>
                  <Typography variant="body2"><strong>Refund Amount:</strong> <strong>₹{scanResult.depositAmount}</strong></Typography>
                </Box>

                {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

                <TextField select fullWidth label="Refund Method *" value={refundMethod}
                  onChange={e => setRefundMethod(Number(e.target.value) as RefundMethod)} sx={{ mb: 2 }}>
                  {refundMethods.map(m => <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>)}
                </TextField>

                {refundMethod === RefundMethod.UPI && (
                  <TextField fullWidth label="UPI ID *" value={upiId}
                    onChange={e => setUpiId(e.target.value)} placeholder="customer@upi" sx={{ mb: 2 }} />
                )}

                {refundMethod === RefundMethod.Coupon && (
                  <TextField fullWidth label="Coupon Code *" value={couponCode}
                    onChange={e => setCouponCode(e.target.value)} sx={{ mb: 2 }} />
                )}

                <TextField fullWidth label="Notes (Optional)" value={notes}
                  onChange={e => setNotes(e.target.value)} multiline rows={2} sx={{ mb: 3 }} />

                <Stack direction="row" spacing={2}>
                  <Button fullWidth variant="outlined" onClick={() => setStep('result')}>Back</Button>
                  <Button fullWidth variant="contained" size="large" disabled={isProcessing}
                    onClick={handleProcessRefund}
                    sx={{ bgcolor: '#2E7D32', '&:hover': { bgcolor: '#1B5E20' }, fontWeight: 700 }}>
                    {isProcessing ? <CircularProgress size={22} color="inherit" /> : `Confirm Refund ₹${scanResult.depositAmount}`}
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* STEP: Done */}
      {step === 'done' && refundSuccess && (
        <Card elevation={0} sx={{ border: '2px solid #2E7D32', borderRadius: 2, maxWidth: 450 }}>
          <CardContent sx={{ p: 4, textAlign: 'center' }}>
            <CheckCircle sx={{ fontSize: 64, color: '#2E7D32', mb: 2 }} />
            <Typography variant="h5" fontWeight={700} color="#2E7D32" mb={1}>
              Refund Processed!
            </Typography>
            <Typography variant="h4" fontWeight={800} color="#1B5E20" mb={1}>
              ₹{refundSuccess.amount}
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={1}>
              Refunded successfully
            </Typography>
            <Chip label={`Ref: ${refundSuccess.txRef}`} size="small"
              sx={{ bgcolor: '#E8F5E9', color: '#2E7D32', mb: 3, fontFamily: 'monospace' }} />

            <Alert severity="success" sx={{ mb: 3, textAlign: 'left' }}>
              <strong>QR code is now INVALID.</strong> Any future scan attempt on this QR will show "QR ALREADY REDEEMED".
            </Alert>

            <Button fullWidth variant="contained" size="large" onClick={handleReset}
              sx={{ bgcolor: '#2E7D32', '&:hover': { bgcolor: '#1B5E20' }, py: 1.5, fontWeight: 700 }}>
              Scan Next QR
            </Button>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};
