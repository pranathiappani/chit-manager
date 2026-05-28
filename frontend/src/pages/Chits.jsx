import React, { useState, useEffect } from 'react';
import { Box, Card, Typography, Button, Table, TableBody, TableCell, TableHead, TableRow, Chip, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Grid, IconButton, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { useForm, useWatch } from 'react-hook-form';
import { Plus, UserPlus, Settings2, Trash2 } from 'lucide-react';
import api from '../api/axiosConfig';

const Chits = () => {
  const [chits, setChits] = useState([]);
  const [allMembers, setAllMembers] = useState([]);
  const [open, setOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [selectedChitToAssign, setSelectedChitToAssign] = useState(null);
  const [selectedMemberToAssign, setSelectedMemberToAssign] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  const [planOpen, setPlanOpen] = useState(false);
  const [selectedChitForPlan, setSelectedChitForPlan] = useState(null);
  const [payoutPlansState, setPayoutPlansState] = useState([]);
  const [selectedSourceChit, setSelectedSourceChit] = useState('');

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm({
    defaultValues: {
      strategyType: 'FIXED_COMMISSION_PROGRESSIVE'
    }
  });

  const watchedStrategy = useWatch({ control, name: 'strategyType' });

  const fetchChits = async () => {
    try {
      const response = await api.get('/chits');
      setChits(response.data || []);
    } catch (error) {
      console.error('Failed to fetch chits', error);
    }
  };

  const fetchAllMembers = async () => {
    try {
      const response = await api.get('/members');
      setAllMembers(response.data || []);
    } catch (error) {
      console.error('Failed to fetch members', error);
    }
  };

  useEffect(() => {
    fetchChits();
    fetchAllMembers();
  }, []);

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    reset();
  };

  const onSubmit = async (data) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      // Ensure numeric fields are correctly parsed
      const payload = {
        name: data.name,
        totalAmount: Number(data.totalAmount),
        durationMonths: Number(data.durationMonths),
        memberCount: Number(data.memberCount),
        monthlyCollection: watchedStrategy === 'FIXED_COMMISSION_PROGRESSIVE' ? Number(data.monthlyCollection) : null,
        startMonth: data.startMonth,
        strategyType: data.strategyType,
        commissionPercentage: Number(data.commissionPercentage),
        baseContribution: watchedStrategy === 'INCREMENTAL_CONTRIBUTION' ? Number(data.baseContribution) : null,
        postPayoutContribution: watchedStrategy === 'INCREMENTAL_CONTRIBUTION' ? Number(data.postPayoutContribution) : null,
        payoutAdjustmentValue: watchedStrategy === 'INCREMENTAL_CONTRIBUTION' ? Number(data.payoutAdjustmentValue) : null
      };
      await api.post('/chits', payload);
      handleClose();
      fetchChits(); // Refresh list
    } catch (error) {
      console.error('Failed to create chit group', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignOpen = (chitId) => {
    setSelectedChitToAssign(chitId);
    setAssignOpen(true);
  };
  const handleAssignClose = () => {
    setAssignOpen(false);
    setSelectedMemberToAssign('');
    setSelectedChitToAssign(null);
  };

  const onAssignMember = async () => {
    if (!selectedMemberToAssign || !selectedChitToAssign) return;
    try {
      await api.post(`/chits/${selectedChitToAssign}/members/${selectedMemberToAssign}`);
      handleAssignClose();
      fetchChits(); // Refresh list to update member count
    } catch (error) {
      console.error('Failed to assign member', error);
    }
  };

  const handlePlanOpen = async (chit) => {
    setSelectedChitForPlan(chit);
    try {
      const response = await api.get(`/payouts/chit/${chit.id}/plans`);
      if (response.data && response.data.length > 0) {
        const sorted = [...response.data].sort((a, b) => a.monthNumber - b.monthNumber);
        const existingPlans = sorted.map(p => ({
          monthNumber: p.monthNumber,
          payoutAmount: p.payoutAmount || '',
          expectedPayoutCount: p.expectedPayoutCount || 1
        }));
        setPayoutPlansState(existingPlans);
      } else {
        const initialPlans = Array.from({ length: chit.durationMonths }, (_, i) => ({
          monthNumber: i + 1,
          payoutAmount: '',
          expectedPayoutCount: 1
        }));
        setPayoutPlansState(initialPlans);
      }
    } catch (error) {
      console.error("Failed to fetch existing payout plans", error);
      const initialPlans = Array.from({ length: chit.durationMonths }, (_, i) => ({
        monthNumber: i + 1,
        payoutAmount: '',
        expectedPayoutCount: 1
      }));
      setPayoutPlansState(initialPlans);
    }
    setPlanOpen(true);
  };

  const handlePlanClose = () => {
    setPlanOpen(false);
    setSelectedChitForPlan(null);
    setPayoutPlansState([]);
    setSelectedSourceChit('');
  };

  const handleCopyPlanFromChit = async (e) => {
    const sourceChitId = e.target.value;
    setSelectedSourceChit(sourceChitId);
    if (sourceChitId) {
      try {
        const response = await api.get(`/payouts/chit/${sourceChitId}/plans`);
        if (response.data && response.data.length > 0) {
          const sorted = [...response.data].sort((a, b) => a.monthNumber - b.monthNumber);
          const copiedPlans = sorted.map(p => ({
            monthNumber: p.monthNumber,
            payoutAmount: p.payoutAmount || '',
            expectedPayoutCount: p.expectedPayoutCount || 1
          }));
          setPayoutPlansState(copiedPlans);
        } else {
          alert("The selected chit group does not have any payout plans configured yet.");
          setSelectedSourceChit('');
        }
      } catch (error) {
        console.error("Failed to fetch source payout plans", error);
      }
    }
  };

  const handlePlanChange = (index, field, value) => {
    const updated = [...payoutPlansState];
    updated[index][field] = value;
    setPayoutPlansState(updated);
  };

  const onSavePlans = async () => {
    try {
      const payload = payoutPlansState.map(p => ({
        monthNumber: Number(p.monthNumber),
        payoutAmount: Number(p.payoutAmount),
        expectedPayoutCount: Number(p.expectedPayoutCount)
      }));
      await api.post(`/payouts/chit/${selectedChitForPlan.id}/plans`, payload);
      handlePlanClose();
      // Optionally show success toast here
    } catch (error) {
      console.error('Failed to save payout plans', error);
    }
  };

  const handleDeleteChit = async (chitId) => {
    if (window.confirm("Are you sure you want to delete this chit group? This action cannot be undone.")) {
      try {
        await api.delete(`/chits/${chitId}`);
        fetchChits(); // Refresh list after deletion
      } catch (error) {
        console.error('Failed to delete chit group', error);
        alert("Could not delete the chit group. It might have associated records like members or payouts.");
      }
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Chit Groups</Typography>
        <Button variant="contained" startIcon={<Plus size={20} />} onClick={handleOpen}>
          Create Chit Group
        </Button>
      </Box>

      <Card>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: 'background.default' }}>
              <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Total Amount</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Duration</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Members</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {chits.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                  No chit groups found. Create one to get started!
                </TableCell>
              </TableRow>
            ) : (
              chits.map((chit) => (
                <TableRow key={chit.id}>
                  <TableCell sx={{ fontWeight: 500 }}>{chit.name}</TableCell>
                  <TableCell>₹{chit.totalAmount.toLocaleString()}</TableCell>
                  <TableCell>{chit.durationMonths} months</TableCell>
                  <TableCell>{chit.memberCount}</TableCell>
                  <TableCell>
                    <Chip label={chit.status} color={chit.status === 'ACTIVE' ? 'success' : 'default'} size="small" />
                  </TableCell>
                  <TableCell>
                    <IconButton size="small" color="primary" onClick={() => handleAssignOpen(chit.id)} title="Assign Member">
                      <UserPlus size={18} />
                    </IconButton>
                    <IconButton size="small" color="secondary" onClick={() => handlePlanOpen(chit)} title="Configure Payout Plans">
                      <Settings2 size={18} />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDeleteChit(chit.id)} title="Delete Chit Group">
                      <Trash2 size={18} />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Create Chit Group Modal */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Chit Group</DialogTitle>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent dividers>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Chit Group Name"
                  {...register('name', { required: 'Name is required' })}
                  error={!!errors.name}
                  helperText={errors.name?.message}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Total Amount (₹)"
                  {...register('totalAmount', { required: 'Total amount is required', min: 1 })}
                  error={!!errors.totalAmount}
                  helperText={errors.totalAmount?.message}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Duration (Months)"
                  {...register('durationMonths', { required: 'Duration is required', min: 1 })}
                  error={!!errors.durationMonths}
                  helperText={errors.durationMonths?.message}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Number of Members"
                  {...register('memberCount', { required: 'Member count is required', min: 2 })}
                  error={!!errors.memberCount}
                  helperText={errors.memberCount?.message}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Strategy Type</InputLabel>
                  <Select
                    label="Strategy Type"
                    {...register('strategyType')}
                    defaultValue="FIXED_COMMISSION_PROGRESSIVE"
                  >
                    <MenuItem value="FIXED_COMMISSION_PROGRESSIVE">Fixed Commission Progressive</MenuItem>
                    <MenuItem value="INCREMENTAL_CONTRIBUTION">Incremental Contribution</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Commission Percentage (%)"
                  {...register('commissionPercentage', { required: 'Commission is required', min: 0, max: 100 })}
                  error={!!errors.commissionPercentage}
                  helperText={errors.commissionPercentage?.message}
                />
              </Grid>
              {watchedStrategy === 'FIXED_COMMISSION_PROGRESSIVE' && (
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Monthly Installment/Member (₹)"
                    {...register('monthlyCollection', { required: 'Installment amount is required', min: 1 })}
                    error={!!errors.monthlyCollection}
                    helperText={errors.monthlyCollection?.message}
                  />
                </Grid>
              )}
              {watchedStrategy === 'INCREMENTAL_CONTRIBUTION' && (
                <>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Base Contribution (₹)"
                      {...register('baseContribution', { required: 'Base contribution is required', min: 1 })}
                      error={!!errors.baseContribution}
                      helperText={errors.baseContribution?.message}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Post Payout Contribution (₹)"
                      {...register('postPayoutContribution', { required: 'Post payout is required', min: 1 })}
                      error={!!errors.postPayoutContribution}
                      helperText={errors.postPayoutContribution?.message}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Payout Adjustment Value (₹)"
                      {...register('payoutAdjustmentValue', { required: 'Adjustment value is required', min: 0 })}
                      error={!!errors.payoutAdjustmentValue}
                      helperText={errors.payoutAdjustmentValue?.message}
                    />
                  </Grid>
                </>
              )}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="month"
                  label="Start Month"
                  InputLabelProps={{ shrink: true }}
                  {...register('startMonth', { required: 'Start month is required' })}
                  error={!!errors.startMonth}
                  helperText={errors.startMonth?.message}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={handleClose} color="inherit" disabled={submitting}>Cancel</Button>
            <Button type="submit" variant="contained" color="primary" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Assign Member Modal */}
      <Dialog open={assignOpen} onClose={handleAssignClose} maxWidth="xs" fullWidth>
        <DialogTitle>Assign Member to Chit Group</DialogTitle>
        <DialogContent dividers>
          <FormControl fullWidth sx={{ mt: 1 }}>
            <InputLabel>Select Member</InputLabel>
            <Select
              value={selectedMemberToAssign}
              label="Select Member"
              onChange={(e) => setSelectedMemberToAssign(e.target.value)}
            >
              {allMembers.map((member) => (
                <MenuItem key={member.id} value={member.id}>
                  {member.name} - {member.phone}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleAssignClose} color="inherit">Cancel</Button>
          <Button onClick={onAssignMember} variant="contained" color="primary" disabled={!selectedMemberToAssign}>
            Assign
          </Button>
        </DialogActions>
      </Dialog>

      {/* Configure Payout Plan Modal */}
      <Dialog open={planOpen} onClose={handlePlanClose} maxWidth="md" fullWidth>
        <DialogTitle>
          Configure Payout Plans for {selectedChitForPlan?.name}
          <Typography variant="body2" color="text.secondary">
            Fill in the expected payout amount and number of persons for all {selectedChitForPlan?.durationMonths} months.
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          {selectedChitForPlan && (
            <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
              <FormControl sx={{ minWidth: 320 }} size="small">
                <InputLabel>Copy Configuration from Existing Group</InputLabel>
                <Select
                  value={selectedSourceChit}
                  label="Copy Configuration from Existing Group"
                  onChange={handleCopyPlanFromChit}
                >
                  <MenuItem value=""><em>None (Configure from scratch)</em></MenuItem>
                  {chits
                    .filter(c => c.id !== selectedChitForPlan.id && c.durationMonths === selectedChitForPlan.durationMonths)
                    .map(c => (
                      <MenuItem key={c.id} value={c.id}>
                        {c.name} ({c.durationMonths} months)
                      </MenuItem>
                    ))
                  }
                </Select>
              </FormControl>
              <Typography variant="body2" color="text.secondary">
                Select an existing group of the same duration to instantly copy its payout plan structure.
              </Typography>
            </Box>
          )}
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Month Number</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Payout Amount (₹)</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Number of Persons</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {payoutPlansState.map((plan, index) => (
                <TableRow key={index}>
                  <TableCell>Month {plan.monthNumber}</TableCell>
                  <TableCell>
                    <TextField
                      type="number"
                      size="small"
                      value={plan.payoutAmount}
                      onChange={(e) => handlePlanChange(index, 'payoutAmount', e.target.value)}
                      placeholder="e.g. 95000"
                      fullWidth
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      type="number"
                      size="small"
                      value={plan.expectedPayoutCount}
                      onChange={(e) => handlePlanChange(index, 'expectedPayoutCount', e.target.value)}
                      inputProps={{ min: 1 }}
                      fullWidth
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handlePlanClose} color="inherit">Cancel</Button>
          <Button onClick={onSavePlans} variant="contained" color="primary">
            Save Configuration
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Chits;
