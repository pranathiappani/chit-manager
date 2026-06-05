import React, { useState, useEffect } from 'react';
import { Box, Card, CardContent, Typography, Grid, Table, TableBody, TableCell, TableHead, TableRow, MenuItem, Select, FormControl, InputLabel, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Chip } from '@mui/material';
import { useForm, useWatch, Controller } from 'react-hook-form';
import api from '../api/axiosConfig';
import { Wallet, CheckCircle, Clock, TrendingUp } from 'lucide-react';
import { formatMonth } from '../utils/dateUtils';

const StatCard = ({ title, value, icon, color }) => (
  <Card sx={{ width: '100%', height: '100%' }}>
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
  const [submitting, setSubmitting] = useState(false);
  
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

  const loadChitData = async (chitId) => {
    try {
      const [payoutsRes, membersRes, summaryRes, planRes] = await Promise.all([
        api.get(`/payouts/chit/${chitId}`),
        api.get(`/chits/${chitId}/members`),
        api.get(`/payouts/chit/${chitId}/summary`),
        api.get(`/payouts/chit/${chitId}/plans`)
      ]);
      setPayouts(payoutsRes.data || []);
      setMembers(membersRes.data || []);
      setSummary(summaryRes.data);
      setPayoutPlansConfig(planRes.data || []);
    } catch (error) {
      console.error('Failed to load chit details', error);
    }
  };

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

  const selectedChitData = chits.find(c => Number(c.id) === Number(selectedChit));

  const onSubmit = async (data) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const chosenMember = members.find(m => (m.chitMemberId || m.id) === data.chitMemberId);
      const payload = {
        chitGroupId: selectedChit,
        memberId: chosenMember ? chosenMember.id : null,
        chitMemberId: data.chitMemberId,
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
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePayout = async (id) => {
    if (window.confirm("Are you sure you want to delete this payout record? This will adjust the profit metrics and outstanding balances.")) {
      try {
        await api.delete(`/payouts/${id}`);
        loadChitData(selectedChit);
      } catch (error) {
        console.error('Failed to delete payout', error);
        alert("Could not delete the payout record.");
      }
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
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Dynamic Payout Management</Typography>
        <Box sx={{ display: 'flex', gap: 2, width: { xs: '100%', sm: 'auto' }, flexDirection: { xs: 'column', sm: 'row' } }}>
          {selectedChitData && selectedChitData.status !== 'COMPLETED' && (
            <Button 
              variant="contained" 
              color="error"
              onClick={handleCompleteChit}
              sx={{ fontWeight: 'bold', width: { xs: '100%', sm: 'auto' } }}
            >
              Chit Ended
            </Button>
          )}
          <Button 
            variant="contained" 
            disabled={!selectedChit || (selectedChitData && selectedChitData.status === 'COMPLETED')} 
            onClick={handleOpen}
            sx={{ width: { xs: '100%', sm: 'auto' } }}
          >
            Record New Payout
          </Button>
        </Box>
      </Box>

      <Card sx={{ mb: 4, p: 2 }}>
        <FormControl sx={{ minWidth: { xs: '100%', sm: 300 } }}>
          <InputLabel id="payouts-chit-label">Select Chit Group</InputLabel>
          <Select
            labelId="payouts-chit-label"
            value={selectedChit}
            label="Select Chit Group"
            onChange={(e) => setSelectedChit(e.target.value)}
          >
            <MenuItem value="" disabled>-- Select a Chit Group --</MenuItem>
            {chits.length === 0 ? (
              <MenuItem disabled value="">No chit groups found. Please create a chit group first.</MenuItem>
            ) : (
              chits.map(chit => (
                <MenuItem key={chit.id} value={chit.id}>{chit.name}</MenuItem>
              ))
            )}
          </Select>
        </FormControl>
      </Card>

      {summary && selectedChitData && (
        <Grid container spacing={3} sx={{ mb: 4, width: '100%' }}>
          <Grid item xs={12} sm={12} md={3} sx={{ width: { xs: '100%', md: 'auto' } }}>
            <StatCard 
              title="Total Expected Payouts" 
              value={summary.totalExpectedPayouts} 
              icon={<Wallet size={20} />} 
              color="#4f46e5" 
            />
          </Grid>
          <Grid item xs={12} sm={12} md={3} sx={{ width: { xs: '100%', md: 'auto' } }}>
            <StatCard 
              title="Completed Payouts" 
              value={summary.completedPayouts} 
              icon={<CheckCircle size={20} />} 
              color="#10b981" 
            />
          </Grid>
          <Grid item xs={12} sm={12} md={3} sx={{ width: { xs: '100%', md: 'auto' } }}>
            <StatCard 
              title="Estimated Profit" 
              value={`₹${selectedChitData.estimatedProfit?.toLocaleString() || 0}`} 
              icon={<TrendingUp size={20} />} 
              color="#f59e0b" 
            />
          </Grid>
          <Grid item xs={12} sm={12} md={3} sx={{ width: { xs: '100%', md: 'auto' } }}>
            <Card sx={{ width: '100%', height: '100%', backgroundColor: selectedChitData.status === 'COMPLETED' ? '#10b98108' : 'background.paper', border: selectedChitData.status === 'COMPLETED' ? '1px solid #10b98130' : 'none' }}>
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
            
            {/* Desktop Table View */}
            <Box sx={{ display: { xs: 'none', md: 'block' }, overflowX: 'auto' }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'background.default' }}>
                    <TableCell sx={{ fontWeight: 'bold' }}>Month</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Member</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Payout Amount</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Payout Date</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Remarks</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {payouts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
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
                        <TableCell>
                          <Button 
                            variant="contained" 
                            color="error" 
                            size="small" 
                            onClick={() => handleDeletePayout(payout.id)}
                            sx={{ fontWeight: 'bold' }}
                          >
                            Delete
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Box>

            {/* Mobile Stacked Card View */}
            <Box sx={{ display: { xs: 'block', md: 'none' } }}>
              {payouts.length === 0 ? (
                <Typography color="text.secondary" align="center" sx={{ py: 2 }}>
                  No payouts recorded yet for this group.
                </Typography>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {payouts.map((payout) => (
                    <Card key={payout.id} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                          {payout.memberName}
                        </Typography>
                        <Chip 
                          label={`Month ${payout.payoutMonth}`} 
                          size="small" 
                          color="secondary"
                          variant="outlined"
                          sx={{ fontWeight: 'bold' }}
                        />
                      </Box>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="text.secondary">Payout Amount</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                            ₹{payout.payoutAmount?.toLocaleString()}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="text.secondary">Payout Date</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>{payout.payoutDate}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          <Typography variant="body2" color="text.secondary">Remarks</Typography>
                          <Typography variant="body2">{payout.remarks || '-'}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 1, borderTop: '1px solid', borderColor: 'divider', mt: 1 }}>
                          <Button 
                            variant="outlined" 
                            color="error" 
                            size="small" 
                            onClick={() => handleDeletePayout(payout.id)}
                            sx={{ fontWeight: 'bold' }}
                          >
                            Delete Payout
                          </Button>
                        </Box>
                      </Box>
                    </Card>
                  ))}
                </Box>
              )}
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Record Payout Modal */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth disableEnforceFocus>
        <DialogTitle>Record New Payout</DialogTitle>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent dividers>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControl fullWidth error={!!errors.chitMemberId}>
                  <InputLabel id="payout-member-label">Select Member Spot</InputLabel>
                  <Controller
                    name="chitMemberId"
                    control={control}
                    rules={{ required: 'Member spot is required' }}
                    defaultValue=""
                    render={({ field }) => (
                      <Select
                        {...field}
                        labelId="payout-member-label"
                        label="Select Member Spot"
                      >
                        <MenuItem value="" disabled>-- Select a Member Spot --</MenuItem>
                        {members.length === 0 ? (
                          <MenuItem disabled value="">No members found in this chit group. Please assign members first.</MenuItem>
                        ) : (
                          members.map(m => (
                            <MenuItem key={m.chitMemberId || m.id} value={m.chitMemberId || m.id}>
                              {m.name} {m.slotIndex ? `(Spot #${m.slotIndex})` : ''}
                            </MenuItem>
                          ))
                        )}
                      </Select>
                    )}
                  />
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth error={!!errors.payoutMonth}>
                  <InputLabel id="payout-month-label">For Month Number</InputLabel>
                  <Controller
                    name="payoutMonth"
                    control={control}
                    rules={{ required: 'Month is required' }}
                    defaultValue=""
                    render={({ field }) => (
                      <Select
                        {...field}
                        labelId="payout-month-label"
                        label="For Month Number"
                      >
                        <MenuItem value="" disabled>-- Select a Month --</MenuItem>
                        {Array.from({ length: selectedChitData?.durationMonths || 0 }, (_, i) => i + 1).map(m => (
                          <MenuItem key={m} value={m}>
                            Month {m} ({formatMonth(selectedChitData?.startMonth, m)})
                          </MenuItem>
                        ))}
                      </Select>
                    )}
                  />
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="Payout Date"
                  InputLabelProps={{ shrink: true }}
                  {...register('payoutDate', { required: 'Date is required' })}
                  inputRef={register('payoutDate').ref}
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
                  inputRef={register('payoutAmount').ref}
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
                  inputRef={register('remarks').ref}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={handleClose} color="inherit" disabled={submitting}>Cancel</Button>
            <Button type="submit" variant="contained" color="primary" disabled={submitting}>
              {submitting ? 'Recording...' : 'Record Payout'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

    </Box>
  );
};

export default Payouts;
