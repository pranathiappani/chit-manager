import React, { useState, useEffect } from 'react';
import { Box, Card, CardContent, Typography, Grid, Table, TableBody, TableCell, TableHead, TableRow, MenuItem, Select, FormControl, InputLabel, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';
import { useForm, useWatch } from 'react-hook-form';
import api from '../api/axiosConfig';
import { Wallet, CheckCircle, Clock, TrendingUp } from 'lucide-react';
import { formatMonth } from '../utils/dateUtils';

const StatCard = ({ title, value, icon, color }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography color="text.secondary" variant="subtitle2" gutterBottom>
            {title}
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
            {value}
          </Typography>
        </Box>
        <Box sx={{ p: 1, borderRadius: 2, backgroundColor: `${color}15`, color: color }}>
          {icon}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

const Payouts = () => {
  const [chits, setChits] = useState([]);
  const [selectedChit, setSelectedChit] = useState('');
  const [members, setMembers] = useState([]);
  const [summary, setSummary] = useState(null);
  const [payouts, setPayouts] = useState([]);
  const [payoutPlansConfig, setPayoutPlansConfig] = useState([]);
  const [open, setOpen] = useState(false);
  
  const { register, handleSubmit, reset, setValue, control, formState: { errors } } = useForm();

  const watchedPayoutMonth = useWatch({ control, name: 'payoutMonth' });

  useEffect(() => {
    if (watchedPayoutMonth && payoutPlansConfig.length > 0) {
      const monthNum = Number(watchedPayoutMonth);
      const plan = payoutPlansConfig.find(p => p.monthNumber === monthNum);
      if (plan && plan.payoutAmount) {
        setValue('payoutAmount', plan.payoutAmount);
      }
    }
  }, [watchedPayoutMonth, payoutPlansConfig, setValue]);

  useEffect(() => {
    const fetchChits = async () => {
      try {
        const response = await api.get('/chits');
        setChits(response.data || []);
      } catch (error) {
        console.error('Failed to fetch chits', error);
      }
    };
    fetchChits();
  }, []);

  const loadChitData = async (chitId) => {
    try {
      const [membersRes, summaryRes, payoutsRes, plansRes] = await Promise.all([
        api.get(`/chits/${chitId}/members`),
        api.get(`/payouts/chit/${chitId}/summary`),
        api.get(`/payouts/chit/${chitId}`),
        api.get(`/payouts/chit/${chitId}/plans`)
      ]);
      setMembers(membersRes.data || []);
      setSummary(summaryRes.data || null);
      setPayouts(payoutsRes.data || []);
      setPayoutPlansConfig(plansRes.data || []);
    } catch (error) {
      console.error('Failed to load chit data', error);
    }
  };

  useEffect(() => {
    if (selectedChit) {
      loadChitData(selectedChit);
    } else {
      setSummary(null);
      setPayouts([]);
      setMembers([]);
      setPayoutPlansConfig([]);
    }
  }, [selectedChit]);

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    reset();
  };

  const selectedChitData = chits.find(c => c.id === selectedChit);

  const onSubmit = async (data) => {
    try {
      const payload = {
        chitGroupId: selectedChit,
        memberId: data.memberId,
        payoutMonth: Number(data.payoutMonth),
        payoutAmount: Number(data.payoutAmount),
        payoutDate: data.payoutDate,
        remarks: data.remarks
      };
      await api.post('/payouts', payload);
      handleClose();
      loadChitData(selectedChit); // Refresh engine summary and history
    } catch (error) {
      console.error('Failed to record payout', error);
    }
  };

  const handleCompleteChit = async () => {
    if (window.confirm("Are you sure you want to end this chit? This will calculate the final actual profit and lock payouts.")) {
      try {
        await api.post(`/chits/${selectedChit}/complete`);
        const response = await api.get('/chits');
        setChits(response.data);
        loadChitData(selectedChit);
      } catch (error) {
        console.error('Failed to end chit', error);
      }
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Dynamic Payout Management</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          {selectedChitData && selectedChitData.status !== 'COMPLETED' && (
            <Button 
              variant="contained" 
              color="error"
              onClick={handleCompleteChit}
              sx={{ fontWeight: 'bold' }}
            >
              Chit Ended
            </Button>
          )}
          <Button 
            variant="contained" 
            disabled={!selectedChit || (selectedChitData && selectedChitData.status === 'COMPLETED')} 
            onClick={handleOpen}
          >
            Record New Payout
          </Button>
        </Box>
      </Box>

      <Card sx={{ mb: 4, p: 2 }}>
        <FormControl sx={{ minWidth: 300 }}>
          <InputLabel>Select Chit Group</InputLabel>
          <Select
            value={selectedChit}
            label="Select Chit Group"
            onChange={(e) => setSelectedChit(e.target.value)}
          >
            {chits.map(chit => (
              <MenuItem key={chit.id} value={chit.id}>{chit.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Card>

      {summary && selectedChitData && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard 
              title="Total Expected Payouts" 
              value={summary.totalExpectedPayouts} 
              icon={<Wallet size={20} />} 
              color="#4f46e5" 
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard 
              title="Completed Payouts" 
              value={summary.completedPayouts} 
              icon={<CheckCircle size={20} />} 
              color="#10b981" 
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard 
              title="Estimated Profit" 
              value={`₹${selectedChitData.estimatedProfit?.toLocaleString() || 0}`} 
              icon={<TrendingUp size={20} />} 
              color="#f59e0b" 
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%', backgroundColor: selectedChitData.status === 'COMPLETED' ? '#10b98108' : 'background.paper', border: selectedChitData.status === 'COMPLETED' ? '1px solid #10b98130' : 'none' }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Typography color="text.secondary" variant="subtitle2" sx={{ fontWeight: 500 }} gutterBottom>
                  Actual Profit
                </Typography>
                {selectedChitData.status === 'COMPLETED' ? (
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'success.main', mb: 1 }}>
                      ₹{selectedChitData.actualProfit?.toLocaleString()}
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, pt: 1, borderTop: '1px solid', borderColor: 'divider' }}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Early Payouts:</span>
                        <strong style={{ color: '#10b981' }}>{summary.earlyPayoutsCount} (+₹{summary.totalEarlyAdjustment?.toLocaleString() || '0'})</strong>
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Late Payouts:</span>
                        <strong style={{ color: '#ef4444' }}>{summary.delayedPayoutsCount} (-₹{Math.abs(summary.totalDelayedAdjustment || 0).toLocaleString()})</strong>
                      </Typography>
                    </Box>
                  </Box>
                ) : (
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', mb: 1.5 }}>
                      Calculated at end of chit.
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, pt: 1, borderTop: '1px solid', borderColor: 'divider' }}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Current Early Payouts:</span>
                        <strong style={{ color: '#10b981' }}>{summary.earlyPayoutsCount}</strong>
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Current Late Payouts:</span>
                        <strong style={{ color: '#f59e0b' }}>{summary.delayedPayoutsCount}</strong>
                      </Typography>
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {selectedChit && (
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>Payout History</Typography>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: 'background.default' }}>
                  <TableCell sx={{ fontWeight: 'bold' }}>Month</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Member</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Payout Amount</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Payout Date</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Remarks</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {payouts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                      No payouts recorded yet for this group.
                    </TableCell>
                  </TableRow>
                ) : (
                  payouts.map((payout) => (
                    <TableRow key={payout.id}>
                      <TableCell>Month {payout.payoutMonth} ({formatMonth(selectedChitData?.startMonth, payout.payoutMonth)})</TableCell>
                      <TableCell sx={{ fontWeight: 500 }}>{payout.memberName}</TableCell>
                      <TableCell>₹{payout.payoutAmount?.toLocaleString()}</TableCell>
                      <TableCell>{payout.payoutDate}</TableCell>
                      <TableCell>{payout.remarks || '-'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Record Payout Modal */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Record New Payout</DialogTitle>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent dividers>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControl fullWidth error={!!errors.memberId}>
                  <InputLabel>Select Member</InputLabel>
                  <Select
                    label="Select Member"
                    {...register('memberId', { required: 'Member is required' })}
                    defaultValue=""
                  >
                    {members.map(m => (
                      <MenuItem key={m.id} value={m.id}>{m.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="For Month Number"
                  {...register('payoutMonth', { required: 'Month is required', min: 1 })}
                  error={!!errors.payoutMonth}
                  helperText={errors.payoutMonth?.message}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="Payout Date"
                  InputLabelProps={{ shrink: true }}
                  {...register('payoutDate', { required: 'Date is required' })}
                  error={!!errors.payoutDate}
                  helperText={errors.payoutDate?.message}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="number"
                  label="Actual Payout Amount (₹)"
                  helperText={errors.payoutAmount?.message || "Payout amount given to the winner for this month"}
                  {...register('payoutAmount', { required: 'Amount is required', min: 1 })}
                  error={!!errors.payoutAmount}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Remarks (Optional)"
                  multiline
                  rows={2}
                  {...register('remarks')}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={handleClose} color="inherit">Cancel</Button>
            <Button type="submit" variant="contained" color="primary">Record Payout</Button>
          </DialogActions>
        </form>
      </Dialog>

    </Box>
  );
};

export default Payouts;
