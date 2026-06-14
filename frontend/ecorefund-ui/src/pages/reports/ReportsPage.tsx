import { useEffect, useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Box, Card, CardContent, Typography, Tabs, Tab, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Paper, Chip,
  Button, TextField, MenuItem, CircularProgress, Alert, Pagination,
  Stack, Tooltip,
} from '@mui/material';
import {
  MonetizationOn, Assessment, QrCode, Security,
  FileDownload, Refresh, CheckCircle, Cancel,
} from '@mui/icons-material';
import api from '../../api/axiosConfig';
import { refundApi } from '../../api/refundApi';
import { qrApi } from '../../api/qrApi';

// ── helpers ─────────────────────────────────────────────────────────────────

const fmtDate  = (d: string) => new Date(d).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' });
const fmtMoney = (n: number) => `₹${n.toLocaleString('en-IN')}`;

const statusColor = (s: string) => {
  const m: Record<string, string> = {
    Active: '#2E7D32', Refunded: '#1976D2', Generated: '#F57C00',
    Expired: '#757575', Invalid: '#C62828', Returned: '#7B1FA2',
  };
  return m[s] ?? '#757575';
};

// ── date range bar ───────────────────────────────────────────────────────────

const DateRange = ({
  from, to, onChange,
}: { from: string; to: string; onChange: (f: string, t: string) => void }) => (
  <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
    <TextField label="From" type="date" size="small" value={from}
      InputLabelProps={{ shrink: true }}
      onChange={e => onChange(e.target.value, to)} sx={{ minWidth: 150 }} />
    <TextField label="To" type="date" size="small" value={to}
      InputLabelProps={{ shrink: true }}
      onChange={e => onChange(from, e.target.value)} sx={{ minWidth: 150 }} />
  </Stack>
);

// ── tab index by route ───────────────────────────────────────────────────────

const TAB_ROUTES = ['/reports/deposits', '/reports/refunds', '/reports/qr-codes', '/reports/audit'];

// ── main component ───────────────────────────────────────────────────────────

export const ReportsPage = () => {
  const location  = useLocation();
  const initTab   = Math.max(TAB_ROUTES.indexOf(location.pathname), 0);
  const [tab, setTab] = useState(initTab);

  // shared date range (today-30d … today)
  const todayStr = new Date().toISOString().slice(0, 10);
  const past30   = new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10);
  const [from, setFrom] = useState(past30);
  const [to,   setTo]   = useState(todayStr);

  const handleDateChange = (f: string, t: string) => { setFrom(f); setTo(t); };

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={0.5}>Reports & Analytics</Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        View, filter and export data for deposits, refunds, QR codes and audit logs
      </Typography>

      <Tabs value={tab} onChange={(_, v) => setTab(v)}
        sx={{ mb: 3, borderBottom: '1px solid #E0E0E0' }}>
        <Tab label="Deposits"   icon={<MonetizationOn />} iconPosition="start" />
        <Tab label="Refunds"    icon={<Assessment />}     iconPosition="start" />
        <Tab label="QR Codes"   icon={<QrCode />}         iconPosition="start" />
        <Tab label="Audit Logs" icon={<Security />}       iconPosition="start" />
      </Tabs>

      {tab === 0 && <DepositsTab   from={from} to={to} onDateChange={handleDateChange} />}
      {tab === 1 && <RefundsTab    from={from} to={to} onDateChange={handleDateChange} />}
      {tab === 2 && <QrCodesTab />}
      {tab === 3 && <AuditTab      from={from} to={to} onDateChange={handleDateChange} />}
    </Box>
  );
};

// ── Deposits Tab ─────────────────────────────────────────────────────────────

const DepositsTab = ({ from, to, onDateChange }: { from: string; to: string; onDateChange: (f: string, t: string) => void }) => {
  const [rows,    setRows]    = useState<Record<string, unknown>[]>([]);
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(1);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [summary, setSummary] = useState<{ totalDeposits: number; totalAmount: number } | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [listRes, sumRes] = await Promise.all([
        api.get('/deposits', { params: { page, pageSize: 20, from, to } }),
        api.get('/deposits/summary', { params: { from, to } }),
      ]);
      if (listRes.data.success) { setRows(listRes.data.data); setTotal(listRes.data.total); }
      if (sumRes.data.success)    setSummary(sumRes.data.data);
    } catch { setError('Failed to load deposits.'); }
    finally  { setLoading(false); }
  }, [page, from, to]);

  useEffect(() => { load(); }, [load]);

  const exportExcel = () => {
    const url = `/api/v1/reports/deposits/excel?from=${from}&to=${to}`;
    const token = localStorage.getItem('accessToken');
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.blob()).then(blob => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `Deposits-${from}-${to}.xlsx`;
        a.click();
      });
  };

  return (
    <Box>
      <Card elevation={0} sx={{ border: '1px solid #E0E0E0', borderRadius: 2, mb: 2 }}>
        <CardContent sx={{ py: 1.5 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
            <DateRange from={from} to={to} onChange={onDateChange} />
            <Stack direction="row" spacing={1}>
              <Button startIcon={<Refresh />} size="small" variant="outlined" onClick={load}>Refresh</Button>
              <Button startIcon={<FileDownload />} size="small" variant="contained"
                onClick={exportExcel} sx={{ bgcolor: '#1976D2', '&:hover': { bgcolor: '#1565C0' } }}>
                Export Excel
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {summary && (
        <Stack direction="row" spacing={2} mb={2}>
          <Chip label={`${summary.totalDeposits} Deposits`} sx={{ bgcolor: '#E3F2FD', color: '#1565C0', fontWeight: 600 }} />
          <Chip label={`Total: ${fmtMoney(summary.totalAmount)}`} sx={{ bgcolor: '#E8F5E9', color: '#2E7D32', fontWeight: 600 }} />
        </Stack>
      )}

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Card elevation={0} sx={{ border: '1px solid #E0E0E0', borderRadius: 2 }}>
        {loading ? (
          <Box display="flex" justifyContent="center" py={5}><CircularProgress /></Box>
        ) : (
          <TableContainer component={Paper} elevation={0}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#F5F5F5' }}>
                  {['QR Code', 'Item Type', 'Location', 'Amount', 'Method', 'Collected By', 'Date'].map(h => (
                    <TableCell key={h}><strong>{h}</strong></TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.length === 0 && (
                  <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    No deposits found for this date range.
                  </TableCell></TableRow>
                )}
                {rows.map((r, i) => (
                  <TableRow key={String(r.id ?? i)} sx={{ '&:hover': { bgcolor: '#FAFAFA' } }}>
                    <TableCell><Chip label={String(r.qrCodeNumber ?? '—')} size="small" sx={{ fontFamily: 'monospace', bgcolor: '#E3F2FD', color: '#1565C0' }} /></TableCell>
                    <TableCell><Typography variant="body2">{String(r.itemTypeName ?? '—')}</Typography></TableCell>
                    <TableCell><Typography variant="body2">{String(r.locationName ?? '—')}</Typography></TableCell>
                    <TableCell><Typography variant="body2" fontWeight={600} color="#2E7D32">{fmtMoney(Number(r.amount))}</Typography></TableCell>
                    <TableCell><Chip label={String(r.paymentMethod ?? 'Cash')} size="small" variant="outlined" /></TableCell>
                    <TableCell><Typography variant="caption">{String(r.collectedByEmail ?? '—')}</Typography></TableCell>
                    <TableCell><Typography variant="caption">{fmtDate(String(r.collectedAt))}</Typography></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        {total > 20 && (
          <Box display="flex" justifyContent="center" py={2}>
            <Pagination count={Math.ceil(total / 20)} page={page} onChange={(_, v) => setPage(v)} color="primary" />
          </Box>
        )}
      </Card>
    </Box>
  );
};

// ── Refunds Tab ──────────────────────────────────────────────────────────────

const RefundsTab = ({ from, to, onDateChange }: { from: string; to: string; onDateChange: (f: string, t: string) => void }) => {
  const [rows,    setRows]    = useState<Record<string, unknown>[]>([]);
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(1);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [summary, setSummary] = useState<{ totalRefunds: number; totalAmount: number } | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [listRes, sumRes] = await Promise.all([
        refundApi.getAll(page, 20, from, to),
        refundApi.getSummary(from, to),
      ]);
      if (listRes.success) { setRows(listRes.data); setTotal(listRes.total); }
      if (sumRes.success)    setSummary(sumRes.data);
    } catch { setError('Failed to load refunds.'); }
    finally  { setLoading(false); }
  }, [page, from, to]);

  useEffect(() => { load(); }, [load]);

  const exportExcel = () => {
    const token = localStorage.getItem('accessToken');
    fetch(`/api/v1/reports/refunds/excel?from=${from}&to=${to}`,
      { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.blob()).then(blob => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `Refunds-${from}-${to}.xlsx`;
        a.click();
      });
  };

  const methodColors: Record<string, string> = {
    Cash: '#2E7D32', UPI: '#1976D2', Coupon: '#F57C00',
    Wallet: '#7B1FA2', BankTransfer: '#5D4037',
  };

  return (
    <Box>
      <Card elevation={0} sx={{ border: '1px solid #E0E0E0', borderRadius: 2, mb: 2 }}>
        <CardContent sx={{ py: 1.5 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
            <DateRange from={from} to={to} onChange={onDateChange} />
            <Stack direction="row" spacing={1}>
              <Button startIcon={<Refresh />} size="small" variant="outlined" onClick={load}>Refresh</Button>
              <Button startIcon={<FileDownload />} size="small" variant="contained"
                onClick={exportExcel} sx={{ bgcolor: '#2E7D32', '&:hover': { bgcolor: '#1B5E20' } }}>
                Export Excel
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {summary && (
        <Stack direction="row" spacing={2} mb={2}>
          <Chip label={`${summary.totalRefunds} Refunds`} sx={{ bgcolor: '#E8F5E9', color: '#2E7D32', fontWeight: 600 }} />
          <Chip label={`Total: ${fmtMoney(summary.totalAmount)}`} sx={{ bgcolor: '#E8F5E9', color: '#1B5E20', fontWeight: 700 }} />
        </Stack>
      )}

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Card elevation={0} sx={{ border: '1px solid #E0E0E0', borderRadius: 2 }}>
        {loading ? (
          <Box display="flex" justifyContent="center" py={5}><CircularProgress /></Box>
        ) : (
          <TableContainer component={Paper} elevation={0}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#F5F5F5' }}>
                  {['QR Code', 'Item Type', 'Amount', 'Method', 'Txn Ref', 'Processed By', 'Date'].map(h => (
                    <TableCell key={h}><strong>{h}</strong></TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.length === 0 && (
                  <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    No refunds found for this date range.
                  </TableCell></TableRow>
                )}
                {rows.map((r, i) => (
                  <TableRow key={String(r.id ?? i)} sx={{ '&:hover': { bgcolor: '#FAFAFA' } }}>
                    <TableCell><Chip label={String(r.qrCodeNumber ?? '—')} size="small" sx={{ fontFamily: 'monospace', bgcolor: '#E8F5E9', color: '#2E7D32' }} /></TableCell>
                    <TableCell><Typography variant="body2">{String(r.itemTypeName ?? '—')}</Typography></TableCell>
                    <TableCell><Typography variant="body2" fontWeight={600} color="#2E7D32">{fmtMoney(Number(r.amount))}</Typography></TableCell>
                    <TableCell>
                      <Chip label={String(r.refundMethodName ?? r.refundMethod)} size="small"
                        sx={{ bgcolor: `${methodColors[String(r.refundMethodName)] ?? '#757575'}18`,
                              color: methodColors[String(r.refundMethodName)] ?? '#757575', fontWeight: 600 }} />
                    </TableCell>
                    <TableCell><Typography variant="caption" sx={{ fontFamily: 'monospace' }}>{String(r.transactionReference ?? '—')}</Typography></TableCell>
                    <TableCell><Typography variant="caption">{String(r.processedByEmail ?? '—')}</Typography></TableCell>
                    <TableCell><Typography variant="caption">{fmtDate(String(r.processedAt))}</Typography></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        {total > 20 && (
          <Box display="flex" justifyContent="center" py={2}>
            <Pagination count={Math.ceil(total / 20)} page={page} onChange={(_, v) => setPage(v)} color="primary" />
          </Box>
        )}
      </Card>
    </Box>
  );
};

// ── QR Codes Tab ─────────────────────────────────────────────────────────────

const QrCodesTab = () => {
  const [rows,    setRows]    = useState<Record<string, unknown>[]>([]);
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(1);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const QR_STATUSES = [
    { value: '', label: 'All Status' },
    { value: '1', label: 'Generated' },
    { value: '2', label: 'Active' },
    { value: '3', label: 'Returned' },
    { value: '4', label: 'Refunded' },
    { value: '5', label: 'Invalid' },
    { value: '6', label: 'Expired' },
  ];

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await qrApi.getAll(page, 20, statusFilter ? Number(statusFilter) : undefined);
      if (res.success) { setRows(res.data); setTotal(res.total); }
    } catch { setError('Failed to load QR codes.'); }
    finally  { setLoading(false); }
  }, [page, statusFilter]);

  useEffect(() => { load(); }, [load]);

  return (
    <Box>
      <Card elevation={0} sx={{ border: '1px solid #E0E0E0', borderRadius: 2, mb: 2 }}>
        <CardContent sx={{ py: 1.5 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
            <Stack direction="row" spacing={2} alignItems="center">
              <TextField select size="small" label="Status" value={statusFilter}
                onChange={e => { setStatusFilter(e.target.value); setPage(1); }} sx={{ minWidth: 150 }}>
                {QR_STATUSES.map(s => (
                  <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>
                ))}
              </TextField>
              <Chip label={`${total} QR Codes`} sx={{ bgcolor: '#F3E5F5', color: '#7B1FA2', fontWeight: 600 }} />
            </Stack>
            <Button startIcon={<Refresh />} size="small" variant="outlined" onClick={load}>Refresh</Button>
          </Stack>
        </CardContent>
      </Card>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Card elevation={0} sx={{ border: '1px solid #E0E0E0', borderRadius: 2 }}>
        {loading ? (
          <Box display="flex" justifyContent="center" py={5}><CircularProgress /></Box>
        ) : (
          <TableContainer component={Paper} elevation={0}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#F5F5F5' }}>
                  {['QR Number', 'Item Type', 'Deposit', 'Status', 'Scan Attempts', 'Generated By', 'Generated At', 'Expires'].map(h => (
                    <TableCell key={h}><strong>{h}</strong></TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.length === 0 && (
                  <TableRow><TableCell colSpan={8} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    No QR codes found.
                  </TableCell></TableRow>
                )}
                {rows.map((r, i) => (
                  <TableRow key={String(r.id ?? i)} sx={{ '&:hover': { bgcolor: '#FAFAFA' } }}>
                    <TableCell>
                      <Chip label={String(r.qrCodeNumber)} size="small"
                        sx={{ fontFamily: 'monospace', bgcolor: '#F3E5F5', color: '#7B1FA2', fontWeight: 600 }} />
                    </TableCell>
                    <TableCell><Typography variant="body2">{String(r.itemTypeName ?? '—')}</Typography></TableCell>
                    <TableCell><Typography variant="body2" fontWeight={600} color="#2E7D32">
                      {r.depositAmount ? fmtMoney(Number(r.depositAmount)) : '—'}
                    </Typography></TableCell>
                    <TableCell>
                      <Chip label={String(r.statusName)} size="small"
                        sx={{ bgcolor: `${statusColor(String(r.statusName))}18`,
                              color: statusColor(String(r.statusName)), fontWeight: 600 }} />
                    </TableCell>
                    <TableCell align="center">
                      <Chip label={String(r.scanAttemptCount ?? 0)} size="small"
                        color={Number(r.scanAttemptCount) > 1 ? 'warning' : 'default'} variant="outlined" />
                    </TableCell>
                    <TableCell><Typography variant="caption">{String(r.generatedBy ?? '—')}</Typography></TableCell>
                    <TableCell><Typography variant="caption">{fmtDate(String(r.generatedAt))}</Typography></TableCell>
                    <TableCell>
                      <Typography variant="caption" color={r.expiresAt && new Date(String(r.expiresAt)) < new Date() ? 'error' : 'text.secondary'}>
                        {r.expiresAt ? fmtDate(String(r.expiresAt)) : '—'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        {total > 20 && (
          <Box display="flex" justifyContent="center" py={2}>
            <Pagination count={Math.ceil(total / 20)} page={page} onChange={(_, v) => setPage(v)} color="primary" />
          </Box>
        )}
      </Card>
    </Box>
  );
};

// ── Audit Logs Tab ────────────────────────────────────────────────────────────

const AuditTab = ({ from, to, onDateChange }: { from: string; to: string; onDateChange: (f: string, t: string) => void }) => {
  const [rows,    setRows]    = useState<Record<string, unknown>[]>([]);
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(1);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await api.get('/reports/audit', { params: { page, pageSize: 30, from, to } });
      if (res.data.success) { setRows(res.data.data); setTotal(res.data.total); }
    } catch { setError('Failed to load audit logs.'); }
    finally  { setLoading(false); }
  }, [page, from, to]);

  useEffect(() => { load(); }, [load]);

  const exportExcel = () => {
    const token = localStorage.getItem('accessToken');
    fetch(`/api/v1/reports/audit/excel?from=${from}&to=${to}`,
      { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.blob()).then(blob => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `AuditLog-${from}-${to}.xlsx`;
        a.click();
      });
  };

  return (
    <Box>
      <Card elevation={0} sx={{ border: '1px solid #E0E0E0', borderRadius: 2, mb: 2 }}>
        <CardContent sx={{ py: 1.5 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
            <DateRange from={from} to={to} onChange={onDateChange} />
            <Stack direction="row" spacing={1}>
              <Button startIcon={<Refresh />} size="small" variant="outlined" onClick={load}>Refresh</Button>
              <Button startIcon={<FileDownload />} size="small" variant="contained"
                onClick={exportExcel} sx={{ bgcolor: '#4A148C', '&:hover': { bgcolor: '#38006b' } }}>
                Export Excel
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Card elevation={0} sx={{ border: '1px solid #E0E0E0', borderRadius: 2 }}>
        {loading ? (
          <Box display="flex" justifyContent="center" py={5}><CircularProgress /></Box>
        ) : (
          <TableContainer component={Paper} elevation={0}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#F5F5F5' }}>
                  {['Action', 'Entity', 'User', 'Result', 'Description', 'IP', 'Timestamp'].map(h => (
                    <TableCell key={h}><strong>{h}</strong></TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.length === 0 && (
                  <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    No audit logs found for this date range.
                  </TableCell></TableRow>
                )}
                {rows.map((r, i) => (
                  <TableRow key={String(r.id ?? i)}
                    sx={{ '&:hover': { bgcolor: '#FAFAFA' }, bgcolor: !r.isSuccess ? '#FFF8F8' : 'inherit' }}>
                    <TableCell>
                      <Chip label={String(r.action)} size="small"
                        sx={{ bgcolor: '#EDE7F6', color: '#4A148C', fontWeight: 600 }} />
                    </TableCell>
                    <TableCell><Typography variant="caption">{String(r.entityType ?? '—')}</Typography></TableCell>
                    <TableCell><Typography variant="caption">{String(r.userEmail ?? 'System')}</Typography></TableCell>
                    <TableCell>
                      <Tooltip title={r.isSuccess ? 'Success' : 'Failed'}>
                        <Box display="flex" alignItems="center">
                          {r.isSuccess
                            ? <CheckCircle sx={{ fontSize: 16, color: '#2E7D32' }} />
                            : <Cancel sx={{ fontSize: 16, color: '#C62828' }} />}
                        </Box>
                      </Tooltip>
                    </TableCell>
                    <TableCell><Typography variant="caption">{String(r.description ?? '—')}</Typography></TableCell>
                    <TableCell><Typography variant="caption" sx={{ fontFamily: 'monospace' }}>{String(r.ipAddress ?? '—')}</Typography></TableCell>
                    <TableCell><Typography variant="caption">{fmtDate(String(r.createdAt))}</Typography></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        {total > 30 && (
          <Box display="flex" justifyContent="center" py={2}>
            <Pagination count={Math.ceil(total / 30)} page={page} onChange={(_, v) => setPage(v)} color="primary" />
          </Box>
        )}
      </Card>
    </Box>
  );
};
