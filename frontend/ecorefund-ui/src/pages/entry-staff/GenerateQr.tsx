import { useEffect, useState } from 'react';
import {
  Box, Button, Card, CardContent, Grid, MenuItem, TextField,
  Typography, Alert, CircularProgress, Divider, Chip, Paper,
} from '@mui/material';
import { QrCode, Print, Download, AddCircle, CheckCircle } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import api from '../../api/axiosConfig';
import { qrApi } from '../../api/qrApi';
import { GenerateQrResponse, ItemType, Location } from '../../types';

const schema = yup.object({
  itemTypeId: yup.string().required('Select item type'),
  locationId: yup.string().required('Select location'),
  depositAmount: yup.number().min(1, 'Enter deposit amount').required('Required'),
  description: yup.string().optional(),
  validityDays: yup.number().min(1).max(365).default(30),
});

interface FormData {
  itemTypeId: string;
  locationId: string;
  depositAmount: number;
  description?: string;
  validityDays: number;
}

export const GenerateQr = () => {
  const [itemTypes, setItemTypes] = useState<ItemType[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generated, setGenerated] = useState<GenerateQrResponse | null>(null);

  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: yupResolver(schema),
    defaultValues: { validityDays: 30, depositAmount: 20 },
  });

  const selectedItemTypeId = watch('itemTypeId');

  useEffect(() => {
    api.get('/itemtypes').then(r => setItemTypes(r.data.data || [])).catch(() => {});
    api.get('/locations').then(r => setLocations(r.data.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    const selected = itemTypes.find(it => it.id === selectedItemTypeId);
    if (selected) setValue('depositAmount', selected.defaultDepositAmount);
  }, [selectedItemTypeId, itemTypes, setValue]);

  const onSubmit = async (data: FormData) => {
    setError(null);
    setIsLoading(true);
    try {
      const res = await qrApi.generate({
        itemTypeId: data.itemTypeId,
        locationId: data.locationId,
        depositAmount: data.depositAmount,
        description: data.description,
        validityDays: data.validityDays,
      });
      if (res.success) setGenerated(res.data);
      else setError(res.message);
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to generate QR.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    if (!generated?.printLabelBase64) return;
    const byteString = atob(generated.printLabelBase64);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
    const blob = new Blob([ab], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  const handleNewQr = () => { setGenerated(null); };

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={1} display="flex" alignItems="center" gap={1}>
        <QrCode sx={{ color: '#2E7D32' }} /> Generate QR Code
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Register a new item, collect deposit, and generate QR label
      </Typography>

      {generated ? (
        <Grid container spacing={3}>
          {/* QR Display */}
          <Grid item xs={12} md={5}>
            <Card elevation={0} sx={{ border: '2px solid #2E7D32', borderRadius: 2, textAlign: 'center' }}>
              <CardContent sx={{ p: 3 }}>
                <CheckCircle sx={{ fontSize: 36, color: '#2E7D32', mb: 1 }} />
                <Typography variant="h6" fontWeight={700} color="#2E7D32" mb={2}>
                  QR Generated Successfully!
                </Typography>

                <Box sx={{ bgcolor: '#F5F5F5', borderRadius: 2, p: 2, mb: 2 }}>
                  <img
                    src={`data:image/png;base64,${generated.qrImageBase64}`}
                    alt={generated.qrCodeNumber}
                    style={{ width: '100%', maxWidth: 200, height: 'auto' }}
                  />
                </Box>

                <Typography variant="h5" fontWeight={800} color="#1B5E20" mb={0.5}>
                  {generated.qrCodeNumber}
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={1}>
                  {generated.itemTypeName}
                </Typography>
                <Chip label={`Deposit: ₹${generated.depositAmount}`} size="medium"
                  sx={{ bgcolor: '#E8F5E9', color: '#2E7D32', fontWeight: 700, fontSize: 14 }} />

                <Divider sx={{ my: 2 }} />
                <Typography variant="caption" color="text.secondary">
                  Item: {generated.itemNumber}<br />
                  Expires: {new Date(generated.expiresAt).toLocaleDateString('en-IN')}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Actions */}
          <Grid item xs={12} md={7}>
            <Card elevation={0} sx={{ border: '1px solid #E0E0E0', borderRadius: 2 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={600} mb={3}>Next Steps</Typography>

                <Box sx={{ bgcolor: '#FFF9C4', borderRadius: 2, p: 2, mb: 3 }}>
                  <Typography variant="body2" fontWeight={600}>📋 Instructions</Typography>
                  <Typography variant="body2" color="text.secondary" mt={1}>
                    1. Print the QR label using the button below<br />
                    2. Stick the label on the customer's item<br />
                    3. Inform the customer to present this item at the exit for refund<br />
                    4. The QR becomes INVALID after one-time use
                  </Typography>
                </Box>

                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Button fullWidth variant="contained" startIcon={<Print />} size="large"
                      onClick={handlePrint}
                      sx={{ bgcolor: '#2E7D32', '&:hover': { bgcolor: '#1B5E20' }, py: 1.5, fontWeight: 700 }}>
                      Print QR Label (PDF)
                    </Button>
                  </Grid>
                  <Grid item xs={12}>
                    <Button fullWidth variant="outlined" startIcon={<Download />} size="large"
                      href={`data:image/png;base64,${generated.qrImageBase64}`}
                      download={`${generated.qrCodeNumber}.png`}
                      sx={{ borderColor: '#1976D2', color: '#1976D2', py: 1.5 }}>
                      Download QR Image (PNG)
                    </Button>
                  </Grid>
                  <Grid item xs={12}>
                    <Button fullWidth variant="outlined" startIcon={<AddCircle />} size="large"
                      onClick={handleNewQr}
                      sx={{ borderColor: '#E0E0E0', color: 'text.secondary', py: 1.5 }}>
                      Generate Another QR
                    </Button>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      ) : (
        <Grid container spacing={3}>
          <Grid item xs={12} md={7}>
            <Card elevation={0} sx={{ border: '1px solid #E0E0E0', borderRadius: 2 }}>
              <CardContent sx={{ p: 3 }}>
                {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

                <Box component="form" onSubmit={handleSubmit(onSubmit)}>
                  <Typography variant="subtitle1" fontWeight={600} mb={2}>Item Information</Typography>

                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Controller name="itemTypeId" control={control} render={({ field }) => (
                        <TextField select fullWidth label="Item Type *" {...field}
                          error={!!errors.itemTypeId} helperText={errors.itemTypeId?.message}>
                          {itemTypes.map(it => (
                            <MenuItem key={it.id} value={it.id}>
                              {it.typeName} (₹{it.defaultDepositAmount})
                            </MenuItem>
                          ))}
                        </TextField>
                      )} />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Controller name="locationId" control={control} render={({ field }) => (
                        <TextField select fullWidth label="Location *" {...field}
                          error={!!errors.locationId} helperText={errors.locationId?.message}>
                          {locations.map(l => (
                            <MenuItem key={l.id} value={l.id}>{l.locationName}</MenuItem>
                          ))}
                        </TextField>
                      )} />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField fullWidth label="Deposit Amount (₹) *" type="number"
                        {...register('depositAmount')}
                        error={!!errors.depositAmount} helperText={errors.depositAmount?.message}
                        InputProps={{ startAdornment: <Typography sx={{ mr: 1, color: 'text.secondary' }}>₹</Typography> }} />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField fullWidth label="Validity (Days)" type="number"
                        {...register('validityDays')}
                        error={!!errors.validityDays} helperText={errors.validityDays?.message || 'Default: 30 days'} />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField fullWidth label="Description (Optional)"
                        {...register('description')} multiline rows={2}
                        placeholder="e.g., Red plastic bottle, large size" />
                    </Grid>
                  </Grid>

                  <Button type="submit" fullWidth variant="contained" size="large" disabled={isLoading}
                    startIcon={isLoading ? <CircularProgress size={18} color="inherit" /> : <QrCode />}
                    sx={{ mt: 3, bgcolor: '#2E7D32', '&:hover': { bgcolor: '#1B5E20' }, py: 1.5, fontWeight: 700, fontSize: 16 }}>
                    {isLoading ? 'Generating...' : 'Generate QR & Collect Deposit'}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={5}>
            <Paper elevation={0} sx={{ border: '1px solid #E8F5E9', bgcolor: '#F9FBE7', borderRadius: 2, p: 3 }}>
              <Typography variant="subtitle1" fontWeight={600} color="#2E7D32" mb={2}>
                📱 Quick Guide
              </Typography>
              <Box component="ol" sx={{ pl: 2, m: 0 }}>
                {[
                  'Select the item type from the dropdown',
                  'Choose the entry location',
                  'Set deposit amount (auto-filled from item type)',
                  'Click Generate to create QR code',
                  'Print the label and attach to the item',
                  'Customer gets refund at exit by scanning QR',
                ].map((step, i) => (
                  <Typography component="li" variant="body2" color="text.secondary" key={i} sx={{ mb: 1 }}>
                    {step}
                  </Typography>
                ))}
              </Box>
            </Paper>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};
