import { useEffect, useState } from 'react';
import {
  Box, Card, CardContent, Typography, Chip, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, MenuItem, CircularProgress,
  Alert, IconButton, Tooltip, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper,
} from '@mui/material';
import { LocationOn, Add, Edit, Refresh, Close } from '@mui/icons-material';
import api from '../../api/axiosConfig';

const LOCATION_TYPES = [
  { value: 1, label: 'Entry Gate' },
  { value: 2, label: 'Exit Gate' },
  { value: 3, label: 'Collection Point' },
  { value: 4, label: 'Storage' },
  { value: 5, label: 'Office' },
  { value: 6, label: 'Other' },
];

const TYPE_COLORS: Record<string, string> = {
  'EntryGate':       '#2E7D32',
  'ExitGate':        '#C62828',
  'CollectionPoint': '#1976D2',
  'Storage':         '#F57C00',
  'Office':          '#7B1FA2',
  'Other':           '#757575',
};

interface LocationRow {
  id: string;
  locationName: string;
  locationType: number;
  typeName: string;
  description?: string;
  isActive: boolean;
  itemCount: number;
}

const emptyForm = { locationName: '', locationType: 1, description: '' };

export const LocationsPage = () => {
  const [locations, setLocations] = useState<LocationRow[]>([]);
  const [loading, setLoading]     = useState(true);
  const [msg, setMsg]             = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<LocationRow | null>(null);
  const [form, setForm]             = useState(emptyForm);
  const [saving, setSaving]         = useState(false);
  const [formErr, setFormErr]       = useState('');

  const showMsg = (type: 'success' | 'error', text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 4000);
  };

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/locations');
      if (res.data.success) setLocations(res.data.data);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => {
    setEditTarget(null);
    setForm(emptyForm);
    setFormErr('');
    setDialogOpen(true);
  };

  const openEdit = (loc: LocationRow) => {
    setEditTarget(loc);
    setForm({ locationName: loc.locationName, locationType: loc.locationType, description: loc.description ?? '' });
    setFormErr('');
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setFormErr('');
    if (!form.locationName.trim()) { setFormErr('Location name is required.'); return; }
    setSaving(true);
    try {
      if (editTarget) {
        const res = await api.put(`/locations/${editTarget.id}`, form);
        if (res.data.success) {
          setLocations(prev => prev.map(l => l.id === editTarget.id
            ? { ...l, locationName: form.locationName, locationType: form.locationType,
                typeName: LOCATION_TYPES.find(t => t.value === form.locationType)?.label ?? l.typeName,
                description: form.description }
            : l));
          showMsg('success', 'Location updated.');
          setDialogOpen(false);
        } else { setFormErr(res.data.message ?? 'Update failed.'); }
      } else {
        const res = await api.post('/locations', form);
        if (res.data.success) {
          showMsg('success', 'Location created.');
          setDialogOpen(false);
          load();
        } else { setFormErr(res.data.message ?? 'Creation failed.'); }
      }
    } catch (e: unknown) {
      const m = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setFormErr(m ?? 'Something went wrong.');
    } finally { setSaving(false); }
  };

  const activeCount = locations.filter(l => l.isActive).length;

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h5" fontWeight={700} display="flex" alignItems="center" gap={1}>
            <LocationOn sx={{ color: '#2E7D32' }} /> Locations
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage entry gates, exit gates and collection points
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Tooltip title="Refresh">
            <IconButton onClick={load} size="small"><Refresh /></IconButton>
          </Tooltip>
          <Button variant="contained" startIcon={<Add />} onClick={openAdd}
            sx={{ bgcolor: '#2E7D32', '&:hover': { bgcolor: '#1B5E20' } }}>
            Add Location
          </Button>
        </Box>
      </Box>

      {/* Summary */}
      <Box display="flex" gap={2} mb={3} flexWrap="wrap">
        <Chip label={`${locations.length} Total Locations`} sx={{ bgcolor: '#E3F2FD', color: '#1565C0', fontWeight: 600 }} />
        <Chip label={`${activeCount} Active`} sx={{ bgcolor: '#E8F5E9', color: '#2E7D32', fontWeight: 600 }} />
      </Box>

      {msg && <Alert severity={msg.type} onClose={() => setMsg(null)} sx={{ mb: 2 }}>{msg.text}</Alert>}

      {/* Table */}
      <Card elevation={0} sx={{ border: '1px solid #E0E0E0', borderRadius: 2 }}>
        <CardContent sx={{ p: 0 }}>
          {loading ? (
            <Box display="flex" justifyContent="center" py={6}><CircularProgress sx={{ color: '#2E7D32' }} /></Box>
          ) : (
            <TableContainer component={Paper} elevation={0}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#F5F5F5' }}>
                    <TableCell><strong>Location Name</strong></TableCell>
                    <TableCell><strong>Type</strong></TableCell>
                    <TableCell><strong>Description</strong></TableCell>
                    <TableCell><strong>Active Items</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                    <TableCell align="center"><strong>Actions</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {locations.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                        <LocationOn sx={{ fontSize: 48, color: '#BDBDBD', mb: 1, display: 'block', mx: 'auto' }} />
                        <Typography color="text.secondary">No locations yet. Add your first entry/exit gate.</Typography>
                      </TableCell>
                    </TableRow>
                  )}
                  {locations.map(loc => (
                    <TableRow key={loc.id} sx={{ '&:hover': { bgcolor: '#FAFAFA' } }}>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <LocationOn sx={{ fontSize: 18, color: TYPE_COLORS[loc.typeName] ?? '#757575' }} />
                          <Typography variant="body2" fontWeight={600}>{loc.locationName}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip label={loc.typeName} size="small"
                          sx={{ bgcolor: `${TYPE_COLORS[loc.typeName] ?? '#757575'}18`,
                                color: TYPE_COLORS[loc.typeName] ?? '#757575', fontWeight: 600 }} />
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {loc.description || '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={`${loc.itemCount} items`} size="small"
                          color={loc.itemCount > 0 ? 'primary' : 'default'} variant="outlined" />
                      </TableCell>
                      <TableCell>
                        <Chip label={loc.isActive ? 'Active' : 'Inactive'} size="small"
                          color={loc.isActive ? 'success' : 'error'} variant="outlined" />
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="Edit Location">
                          <IconButton size="small" onClick={() => openEdit(loc)} sx={{ color: '#1976D2' }}>
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {editTarget ? 'Edit Location' : 'Add New Location'}
          <IconButton onClick={() => setDialogOpen(false)}><Close /></IconButton>
        </DialogTitle>
        <DialogContent>
          {formErr && <Alert severity="error" sx={{ mb: 2 }}>{formErr}</Alert>}
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField label="Location Name *" value={form.locationName} fullWidth
              placeholder="e.g. Main Entry Gate, North Exit"
              onChange={e => setForm(p => ({ ...p, locationName: e.target.value }))} />
            <TextField select label="Location Type *" value={form.locationType} fullWidth
              onChange={e => setForm(p => ({ ...p, locationType: Number(e.target.value) }))}>
              {LOCATION_TYPES.map(t => (
                <MenuItem key={t.value} value={t.value}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <LocationOn sx={{ fontSize: 16, color: TYPE_COLORS[t.label.replace(' ', '')] ?? '#757575' }} />
                    {t.label}
                  </Box>
                </MenuItem>
              ))}
            </TextField>
            <TextField label="Description (optional)" value={form.description} fullWidth multiline rows={2}
              placeholder="Brief description of this location"
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={() => setDialogOpen(false)} color="inherit">Cancel</Button>
          <Button onClick={handleSave} variant="contained" disabled={saving}
            sx={{ bgcolor: '#2E7D32', '&:hover': { bgcolor: '#1B5E20' }, minWidth: 120 }}>
            {saving ? <CircularProgress size={20} color="inherit" /> : editTarget ? 'Save Changes' : 'Add Location'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
