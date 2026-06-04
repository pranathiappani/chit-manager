import React, { useState, useEffect } from 'react';
import { Box, Card, Typography, Button, Table, TableBody, TableCell, TableHead, TableRow, Chip, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Grid, IconButton, FormControl, InputLabel, Select, MenuItem, CircularProgress, Collapse } from '@mui/material';
import { useForm, useWatch, Controller } from 'react-hook-form';
import { Plus, UserPlus, Settings2, Trash2, Users, Clock, ChevronDown, ChevronUp, Receipt } from 'lucide-react';
import api from '../api/axiosConfig';
const ChitRow = ({ chit, handleViewMembers, handlePendingDuesOpen, handleAssignOpen, handlePlanOpen, handleDeleteChit, handleLedgerOpen }) => {
  const [open, setOpen] = useState(false);

  return (
    <React.Fragment>
      <TableRow hover onClick={() => setOpen(!open)} sx={{ cursor: 'pointer', '& > *': { borderBottom: 'unset' } }}>
        <TableCell sx={{ width: 50 }}>
          <IconButton size="small" onClick={(e) => { e.stopPropagation(); setOpen(!open); }}>
            {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </IconButton>
        </TableCell>
        <TableCell sx={{ fontWeight: 500 }}>{chit.name}</TableCell>
        <TableCell>₹{chit.totalAmount.toLocaleString()}</TableCell>
        <TableCell>{chit.durationMonths} months</TableCell>
        <TableCell>
          <Chip 
            label={`${chit.assignedMemberCount || 0} / ${chit.memberCount} Assigned`}
            color={chit.assignedMemberCount === chit.memberCount ? 'success' : 'warning'}
            variant="outlined"
            size="small"
            sx={{ fontWeight: 'bold' }}
            onClick={(e) => e.stopPropagation()}
          />
        </TableCell>
        <TableCell>
          <Chip 
            label={chit.status} 
            color={chit.status === 'ACTIVE' ? 'success' : 'default'} 
            size="small" 
            onClick={(e) => e.stopPropagation()}
          />
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 2, p: 2, borderRadius: 2, backgroundColor: 'action.hover', border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="subtitle2" gutterBottom component="div" sx={{ fontWeight: 'bold', mb: 1.5 }}>
                Group Actions & Management
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button 
                  variant="outlined" 
                  color="info" 
                  startIcon={<Users size={16} />} 
                  onClick={(e) => { e.stopPropagation(); handleViewMembers(chit); }}
                  size="small"
                >
                  View Members
                </Button>
                <Button 
                  variant="outlined" 
                  color="warning" 
                  startIcon={<Clock size={16} />} 
                  onClick={(e) => { e.stopPropagation(); handlePendingDuesOpen(chit); }}
                  size="small"
                >
                  Pending Dues
                </Button>
                <Button 
                  variant="outlined" 
                  color="primary" 
                  startIcon={<UserPlus size={16} />} 
                  onClick={(e) => { e.stopPropagation(); handleAssignOpen(chit.id); }}
                  size="small"
                >
                  Assign Member
                </Button>
                <Button 
                  variant="outlined" 
                  color="secondary" 
                  startIcon={<Settings2 size={16} />} 
                  onClick={(e) => { e.stopPropagation(); handlePlanOpen(chit); }}
                  size="small"
                >
                  Payout Plans
                </Button>
                <Button 
                  variant="outlined" 
                  color="success" 
                  startIcon={<Receipt size={16} />} 
                  onClick={(e) => { e.stopPropagation(); handleLedgerOpen(chit); }}
                  size="small"
                >
                  Chit Ledger
                </Button>
                <Button 
                  variant="outlined" 
                  color="error" 
                  startIcon={<Trash2 size={16} />} 
                  onClick={(e) => { e.stopPropagation(); handleDeleteChit(chit.id); }}
                  size="small"
                  sx={{ ml: 'auto' }}
                >
                  Delete Chit Group
                </Button>
              </Box>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </React.Fragment>
  );
};

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
  
  const [membersOpen, setMembersOpen] = useState(false);
  const [viewingChit, setViewingChit] = useState(null);
  const [assignedMembers, setAssignedMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  const [pendingDuesOpen, setPendingDuesOpen] = useState(false);
  const [selectedChitForPendingDues, setSelectedChitForPendingDues] = useState(null);
  const [pendingDuesData, setPendingDuesData] = useState(null);
  const [loadingPendingDues, setLoadingPendingDues] = useState(false);
  const [selectedDues, setSelectedDues] = useState({});
  const [recordingPayments, setRecordingPayments] = useState(false);
  const [pendingDuesRemarks, setPendingDuesRemarks] = useState('');

  const [ledgerOpen, setLedgerOpen] = useState(false);
  const [selectedChitForLedger, setSelectedChitForLedger] = useState(null);
  const [ledgerData, setLedgerData] = useState([]);
  const [loadingLedger, setLoadingLedger] = useState(false);

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm({
    defaultValues: {
      strategyType: 'FIXED_COMMISSION_PROGRESSIVE'
    }
  });

  const watchedStrategy = useWatch({ control, name: 'strategyType' });

  const handleViewMembers = async (chit) => {
    setViewingChit(chit);
    setLoadingMembers(true);
    setAssignedMembers([]);
    setMembersOpen(true);
    try {
      const res = await api.get(`/chits/${chit.id}/members`);
      setAssignedMembers(res.data || []);
    } catch (error) {
      console.error("Failed to load assigned members list", error);
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!viewingChit) return;
    if (window.confirm("Are you sure you want to remove this member from the chit group?")) {
      try {
        await api.delete(`/chits/${viewingChit.id}/members/${memberId}`);
        // Refresh assigned members in modal
        const res = await api.get(`/chits/${viewingChit.id}/members`);
        setAssignedMembers(res.data || []);
        // Refresh chits in the main table to update assigned counts
        fetchChits();
      } catch (error) {
        console.error("Failed to remove member from chit group", error);
        alert("Could not remove the member assignment. Please try again.");
      }
    }
  };

  const handleMembersClose = () => {
    setMembersOpen(false);
    setViewingChit(null);
    setAssignedMembers([]);
  };

  const handlePendingDuesOpen = async (chit) => {
    setSelectedChitForPendingDues(chit);
    setPendingDuesOpen(true);
    setLoadingPendingDues(true);
    setSelectedDues({});
    try {
      const res = await api.get(`/chits/${chit.id}/pending-dues`);
      setPendingDuesData(res.data);
    } catch (error) {
      console.error("Failed to fetch pending dues", error);
    } finally {
      setLoadingPendingDues(false);
    }
  };

  const handlePendingDuesClose = () => {
    setPendingDuesOpen(false);
    setSelectedChitForPendingDues(null);
    setPendingDuesData(null);
    setSelectedDues({});
    setPendingDuesRemarks('');
  };

  const handleCheckboxChange = (memberId, monthNumber, amountDue) => {
    const key = `${memberId}-${monthNumber}`;
    setSelectedDues(prev => {
      const next = { ...prev };
      if (next[key]) {
        delete next[key];
      } else {
        next[key] = { memberId, monthNumber, amountDue };
      }
      return next;
    });
  };

  const handlePastDuesToggle = (memberId, pastPendingItems, isAllChecked) => {
    setSelectedDues(prev => {
      const next = { ...prev };
      pastPendingItems.forEach(item => {
        const key = `${memberId}-${item.monthNumber}`;
        if (isAllChecked) {
          delete next[key];
        } else {
          next[key] = { memberId, monthNumber: item.monthNumber, amountDue: item.amountDue };
        }
      });
      return next;
    });
  };

  const handleRecordPayments = async () => {
    const duesToPay = Object.values(selectedDues);
    if (duesToPay.length === 0) return;

    setRecordingPayments(true);
    try {
      for (const due of duesToPay) {
        const payload = {
          chitGroupId: selectedChitForPendingDues.id,
          memberId: due.memberId,
          forMonth: due.monthNumber,
          amountPaid: due.amountDue,
          status: 'PAID',
          paymentDate: new Date().toISOString().split('T')[0],
          remarks: pendingDuesRemarks.trim() || `Paid via Pending Dues tab (Month ${due.monthNumber})`
        };
        await api.post('/collections', payload);
      }

      const res = await api.get(`/chits/${selectedChitForPendingDues.id}/pending-dues`);
      setPendingDuesData(res.data);
      setSelectedDues({});
      setPendingDuesRemarks('');
      fetchChits();
      alert("Successfully recorded payments for selected months!");
    } catch (error) {
      console.error("Failed to record payments", error);
      alert("An error occurred while recording payments. Please check logs.");
    } finally {
      setRecordingPayments(false);
    }
  };

  const handleLedgerOpen = async (chit) => {
    setSelectedChitForLedger(chit);
    setLedgerOpen(true);
    setLoadingLedger(true);
    setLedgerData([]);
    try {
      const res = await api.get(`/collections/chit/${chit.id}`);
      const groups = {};
      const list = res.data || [];
      list.forEach(c => {
        if (c.status === 'PAID') {
          const key = `${c.memberId}-${c.paymentDate}-${c.remarks || ''}`;
          if (!groups[key]) {
            groups[key] = {
              memberName: c.memberName,
              paymentDate: c.paymentDate,
              remarks: c.remarks || '-',
              totalAmountPaid: 0,
              clearedMonths: []
            };
          }
          groups[key].totalAmountPaid += c.amountPaid;
          groups[key].clearedMonths.push(c.forMonth);
        }
      });
      const sorted = Object.values(groups).sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate));
      setLedgerData(sorted);
    } catch (error) {
      console.error("Failed to load chit ledger data", error);
    } finally {
      setLoadingLedger(false);
    }
  };

  const handleLedgerClose = () => {
    setLedgerOpen(false);
    setSelectedChitForLedger(null);
    setLedgerData([]);
  };

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
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Chit Groups</Typography>
        <Button variant="contained" startIcon={<Plus size={20} />} onClick={handleOpen} sx={{ width: { xs: '100%', sm: 'auto' } }}>
          Create Chit Group
        </Button>
      </Box>

      <Card>
        <Box sx={{ overflowX: 'auto' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: 'background.default' }}>
                <TableCell sx={{ width: 50 }} />
                <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Total Amount</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Duration</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Members</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
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
                  <ChitRow
                    key={chit.id}
                    chit={chit}
                    handleViewMembers={handleViewMembers}
                    handlePendingDuesOpen={handlePendingDuesOpen}
                    handleAssignOpen={handleAssignOpen}
                    handlePlanOpen={handlePlanOpen}
                    handleDeleteChit={handleDeleteChit}
                    handleLedgerOpen={handleLedgerOpen}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </Box>
      </Card>

      {/* Create Chit Group Modal */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth disableEnforceFocus>
        <DialogTitle>Create New Chit Group</DialogTitle>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent dividers>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Chit Group Name"
                  {...register('name', { required: 'Name is required' })}
                  inputRef={register('name').ref}
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
                  inputRef={register('totalAmount').ref}
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
                  inputRef={register('durationMonths').ref}
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
                  inputRef={register('memberCount').ref}
                  error={!!errors.memberCount}
                  helperText={errors.memberCount?.message}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel id="strategy-type-label">Strategy Type</InputLabel>
                  <Controller
                    name="strategyType"
                    control={control}
                    defaultValue="FIXED_COMMISSION_PROGRESSIVE"
                    render={({ field }) => (
                      <Select
                        {...field}
                        labelId="strategy-type-label"
                        label="Strategy Type"
                      >
                        <MenuItem value="FIXED_COMMISSION_PROGRESSIVE">Fixed Commission Progressive</MenuItem>
                        <MenuItem value="INCREMENTAL_CONTRIBUTION">Incremental Contribution</MenuItem>
                      </Select>
                    )}
                  />
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Commission Percentage (%)"
                  {...register('commissionPercentage', { required: 'Commission is required', min: 0, max: 100 })}
                  inputRef={register('commissionPercentage').ref}
                  error={!!errors.commissionPercentage}
                  helperText={errors.commissionPercentage?.message}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="month"
                  label="Start Month"
                  InputLabelProps={{ shrink: true }}
                  {...register('startMonth', { required: 'Start month is required' })}
                  inputRef={register('startMonth').ref}
                  error={!!errors.startMonth}
                  helperText={errors.startMonth?.message}
                />
              </Grid>
              {watchedStrategy === 'FIXED_COMMISSION_PROGRESSIVE' && (
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Monthly Installment/Member (₹)"
                    {...register('monthlyCollection', { required: 'Installment amount is required', min: 1 })}
                    inputRef={register('monthlyCollection').ref}
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
                      inputRef={register('baseContribution').ref}
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
                      inputRef={register('postPayoutContribution').ref}
                      error={!!errors.postPayoutContribution}
                      helperText={errors.postPayoutContribution?.message}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Payout Adjustment Value (₹)"
                      {...register('payoutAdjustmentValue', { required: 'Adjustment value is required', min: 0 })}
                      inputRef={register('payoutAdjustmentValue').ref}
                      error={!!errors.payoutAdjustmentValue}
                      helperText={errors.payoutAdjustmentValue?.message}
                    />
                  </Grid>
                </>
              )}
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
      <Dialog open={assignOpen} onClose={handleAssignClose} maxWidth="xs" fullWidth disableEnforceFocus>
        <DialogTitle>Assign Member to Chit Group</DialogTitle>
        <DialogContent dividers>
          <FormControl fullWidth sx={{ mt: 1 }}>
            <InputLabel id="assign-member-label">Select Member</InputLabel>
            <Select
              labelId="assign-member-label"
              value={selectedMemberToAssign}
              label="Select Member"
              onChange={(e) => setSelectedMemberToAssign(e.target.value)}
            >
              <MenuItem value="" disabled>-- Select a Member --</MenuItem>
              {allMembers.length === 0 ? (
                <MenuItem disabled value="">No members found. Please add a member first.</MenuItem>
              ) : (
                allMembers.map((member) => (
                  <MenuItem key={member.id} value={member.id}>
                    {member.name} - {member.phone}
                  </MenuItem>
                ))
              )}
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
      <Dialog open={planOpen} onClose={handlePlanClose} maxWidth="md" fullWidth disableEnforceFocus>
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

      {/* View Assigned Members Dialog */}
      <Dialog open={membersOpen} onClose={handleMembersClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1.5 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Assigned Members ({assignedMembers.length} / {viewingChit?.memberCount})</Typography>
          <Button onClick={handleMembersClose} color="inherit" size="small">Close</Button>
        </DialogTitle>
        <DialogContent dividers sx={{ backgroundColor: 'background.default', p: 3 }}>
          {loadingMembers && (
            <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', py: 6, gap: 2 }}>
              <CircularProgress size={30} />
              <Typography color="text.secondary" variant="body2">Loading assigned members...</Typography>
            </Box>
          )}

          {!loadingMembers && (
            <Card sx={{ p: 0 }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'action.hover' }}>
                    <TableCell sx={{ fontWeight: 'bold', pl: 3 }}>Member Name</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', px: 2 }}>Phone Number</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', pr: 3 }} align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {assignedMembers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} align="center" sx={{ py: 3, color: 'text.secondary', fontStyle: 'italic' }}>
                        No members assigned to this chit group yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    assignedMembers.map(m => (
                      <TableRow key={m.id} hover>
                        <TableCell sx={{ fontWeight: 'bold', pl: 3 }}>{m.name}</TableCell>
                        <TableCell sx={{ px: 2 }}>{m.phone}</TableCell>
                        <TableCell sx={{ pr: 3 }} align="right">
                          <IconButton 
                            size="small" 
                            color="error" 
                            onClick={() => handleRemoveMember(m.id)} 
                            title="Remove from Chit Group"
                          >
                            <Trash2 size={16} />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>
          )}
        </DialogContent>
      </Dialog>

      {/* View Pending Dues Dialog */}
      <Dialog open={pendingDuesOpen} onClose={handlePendingDuesClose} maxWidth="md" fullWidth disableEnforceFocus>
        <DialogTitle sx={{ fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1.5 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Pending Dues Summary</Typography>
            <Typography variant="body2" color="text.secondary">
              Group: {selectedChitForPendingDues?.name} | Current Month: Month {pendingDuesData?.currentMonth}
            </Typography>
          </Box>
          <Button onClick={handlePendingDuesClose} color="inherit" size="small">Close</Button>
        </DialogTitle>
        <DialogContent dividers sx={{ backgroundColor: 'background.default', p: 3 }}>
          {loadingPendingDues && (
            <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', py: 6, gap: 2 }}>
              <CircularProgress size={30} />
              <Typography color="text.secondary" variant="body2">Loading pending dues...</Typography>
            </Box>
          )}

          {!loadingPendingDues && pendingDuesData && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Summary Stats */}
              <Card sx={{ p: 2, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, backgroundColor: 'background.paper' }}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Total Outstanding Dues (till Month {pendingDuesData.currentMonth})</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'error.main' }}>
                    ₹{pendingDuesData.totalPendingAmount?.toLocaleString()}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
                  <Typography variant="subtitle2" color="text.secondary">Total Selected to Pay</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                    ₹{Object.values(selectedDues).reduce((sum, d) => sum + Number(d.amountDue), 0).toLocaleString()}
                  </Typography>
                </Box>
              </Card>

              {/* Members List */}
              <Card sx={{ p: 0 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: 'action.hover' }}>
                      <TableCell sx={{ fontWeight: 'bold', pl: 3 }}>Member Name</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Phone</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Pending Months & Due Amount</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', pr: 3 }} align="right">Total Pending</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(!pendingDuesData.membersPending || pendingDuesData.membersPending.length === 0) ? (
                      <TableRow>
                        <TableCell colSpan={4} align="center" sx={{ py: 4, color: 'success.main', fontWeight: 'bold' }}>
                          🎉 No pending dues for this chit group up to Month {pendingDuesData.currentMonth}!
                        </TableCell>
                      </TableRow>
                    ) : (
                      pendingDuesData.membersPending.map(member => (
                        <TableRow key={member.memberId} hover>
                          <TableCell sx={{ fontWeight: 'bold', pl: 3 }}>{member.memberName}</TableCell>
                          <TableCell>{member.memberPhone || '-'}</TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, py: 1 }}>
                              {(() => {
                                const currentMonthNum = pendingDuesData.currentMonth;
                                const pastPending = member.pendingMonths.filter(pm => pm.monthNumber < currentMonthNum);
                                const currentOrFuturePending = member.pendingMonths.filter(pm => pm.monthNumber >= currentMonthNum);
                                
                                const pastTotal = pastPending.reduce((sum, pm) => sum + pm.amountDue, 0);
                                const isPastChecked = pastPending.length > 0 && pastPending.every(pm => !!selectedDues[`${member.memberId}-${pm.monthNumber}`]);
                                
                                return (
                                  <>
                                    {pastPending.length > 0 && (
                                      <Chip
                                        label={`Past Dues: ₹${pastTotal.toLocaleString()}`}
                                        color={isPastChecked ? "primary" : "default"}
                                        variant={isPastChecked ? "contained" : "outlined"}
                                        onClick={() => handlePastDuesToggle(member.memberId, pastPending, isPastChecked)}
                                        sx={{ 
                                          cursor: 'pointer',
                                          fontSize: '0.8rem',
                                          fontWeight: isPastChecked ? 'bold' : 'normal',
                                          borderColor: 'warning.light',
                                          '&:hover': {
                                            backgroundColor: isPastChecked ? 'primary.dark' : 'action.hover'
                                          }
                                        }}
                                      />
                                    )}
                                    {currentOrFuturePending.map(pm => {
                                      const key = `${member.memberId}-${pm.monthNumber}`;
                                      const isChecked = !!selectedDues[key];
                                      return (
                                        <Chip
                                          key={pm.monthNumber}
                                          label={`M${pm.monthNumber}: ₹${pm.amountDue.toLocaleString()}`}
                                          color={isChecked ? "primary" : "default"}
                                          variant={isChecked ? "contained" : "outlined"}
                                          onClick={() => handleCheckboxChange(member.memberId, pm.monthNumber, pm.amountDue)}
                                          sx={{ 
                                            cursor: 'pointer',
                                            fontSize: '0.8rem',
                                            fontWeight: isChecked ? 'bold' : 'normal',
                                            '&:hover': {
                                              backgroundColor: isChecked ? 'primary.dark' : 'action.hover'
                                            }
                                          }}
                                        />
                                      );
                                    })}
                                  </>
                                );
                              })()}
                            </Box>
                          </TableCell>
                          <TableCell sx={{ pr: 3, fontWeight: 'bold', color: 'error.main' }} align="right">
                            ₹{member.totalPending?.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </Card>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, alignItems: 'flex-start', flexGrow: 1, width: { xs: '100%', sm: 'auto' } }}>
            <Typography variant="body2" color="text.secondary" sx={{ pl: 1 }}>
              Click on the Month Chips to select/deselect them for payment.
            </Typography>
            <TextField
              size="small"
              placeholder="Payment method / remarks (e.g. PhonePe, Cash)"
              value={pendingDuesRemarks}
              onChange={(e) => setPendingDuesRemarks(e.target.value)}
              sx={{ width: { xs: '100%', sm: 320 }, mt: 0.5 }}
            />
          </Box>
          <Box sx={{ display: 'flex', gap: 1, width: { xs: '100%', sm: 'auto' }, justifyContent: 'flex-end' }}>
            <Button onClick={handlePendingDuesClose} color="inherit">Cancel</Button>
            <Button 
              onClick={handleRecordPayments} 
              variant="contained" 
              color="primary"
              disabled={recordingPayments || Object.keys(selectedDues).length === 0}
            >
              {recordingPayments ? "Recording Payments..." : `Mark Selected Dues as Paid (${Object.keys(selectedDues).length})`}
            </Button>
          </Box>
        </DialogActions>
      </Dialog>

      {/* Chit Ledger Dialog */}
      <Dialog 
        open={ledgerOpen} 
        onClose={handleLedgerClose} 
        maxWidth="md" 
        fullWidth 
        disableEnforceFocus
      >
        <DialogTitle sx={{ fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1.5 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Chit Ledger</Typography>
            <Typography variant="body2" color="text.secondary">
              Group: {selectedChitForLedger?.name}
            </Typography>
          </Box>
          <Button onClick={handleLedgerClose} color="inherit" size="small">Close</Button>
        </DialogTitle>
        <DialogContent dividers sx={{ backgroundColor: 'background.default', p: 3 }}>
          {loadingLedger && (
            <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', py: 6, gap: 2 }}>
              <CircularProgress size={30} />
              <Typography color="text.secondary" variant="body2">Loading ledger history...</Typography>
            </Box>
          )}

          {!loadingLedger && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Summary Stats */}
              <Card sx={{ p: 2, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, backgroundColor: 'background.paper' }}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Total Collected Amount</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                    ₹{ledgerData.reduce((sum, entry) => sum + entry.totalAmountPaid, 0).toLocaleString()}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
                  <Typography variant="subtitle2" color="text.secondary">Total Transactions</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                    {ledgerData.length}
                  </Typography>
                </Box>
              </Card>

              {/* Transactions List */}
              <Card sx={{ p: 0 }}>
                <Box sx={{ overflowX: 'auto' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ backgroundColor: 'action.hover' }}>
                        <TableCell sx={{ fontWeight: 'bold', pl: 3 }}>Payment Date</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Member Name</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Cleared Months</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Remarks</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', pr: 3 }} align="right">Amount Paid</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {ledgerData.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary', fontStyle: 'italic' }}>
                            No payment records found for this chit group yet.
                          </TableCell>
                        </TableRow>
                      ) : (
                        ledgerData.map((entry, idx) => (
                          <TableRow key={idx} hover>
                            <TableCell sx={{ pl: 3 }}>{entry.paymentDate || '-'}</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>{entry.memberName}</TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, py: 0.5 }}>
                                {entry.clearedMonths.sort((a, b) => a - b).map(m => (
                                  <Chip
                                    key={m}
                                    label={`Month ${m}`}
                                    size="small"
                                    color="secondary"
                                    variant="outlined"
                                    sx={{ fontSize: '0.75rem', height: 20 }}
                                  />
                                ))}
                              </Box>
                            </TableCell>
                            <TableCell>{entry.remarks || '-'}</TableCell>
                            <TableCell sx={{ pr: 3, fontWeight: 'bold', color: 'success.main' }} align="right">
                              ₹{entry.totalAmountPaid.toLocaleString()}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </Box>
              </Card>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleLedgerClose} variant="contained" color="primary">Done</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Chits;
