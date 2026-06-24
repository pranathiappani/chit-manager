import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Card, Typography, Button, Table, TableBody, TableCell, TableHead, TableRow, Chip, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Grid, IconButton, FormControl, InputLabel, Select, MenuItem, CircularProgress, useMediaQuery, useTheme } from '@mui/material';
import { useForm, useWatch, Controller } from 'react-hook-form';
import { Plus, X } from 'lucide-react';
import api from '../api/axiosConfig';

// Helper function to extract initials from a name
const getInitials = (name) => {
  if (!name) return 'CG';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

// Helper function to generate a unique gradient based on name hash
const getAvatarGradient = (name) => {
  const colors = [
    'linear-gradient(135deg, #4338ca 0%, #6366f1 100%)', // Indigo
    'linear-gradient(135deg, #059669 0%, #10b981 100%)', // Emerald
    'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)', // Sky Blue
    'linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)', // Violet
    'linear-gradient(135deg, #db2777 0%, #f472b6 100%)', // Pink
    'linear-gradient(135deg, #ea580c 0%, #fb923c 100%)', // Orange
    'linear-gradient(135deg, #2563eb 0%, #60a5fa 100%)', // Blue
  ];
  if (!name) return colors[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

const ChitRow = ({ chit, onClick }) => {
  const initials = getInitials(chit.name);
  const gradient = getAvatarGradient(chit.name);

  return (
    <TableRow hover onClick={onClick} sx={{ cursor: 'pointer' }}>
      <TableCell sx={{ fontWeight: 700, color: 'text.primary', pl: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {/* Custom Initials Branding Badge */}
          <Box sx={{
            width: 38,
            height: 38,
            borderRadius: '8px',
            background: gradient,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            fontWeight: 800,
            fontSize: '0.9rem',
            boxShadow: '0 4px 10px rgba(0, 0, 0, 0.05)',
            border: '2px solid',
            borderColor: 'background.paper'
          }}>
            {initials}
          </Box>
          <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
            {chit.name}
          </Typography>
        </Box>
      </TableCell>
      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' }, fontWeight: 600 }}>
        ₹{chit.totalAmount.toLocaleString()}
      </TableCell>
      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' }, color: 'text.secondary', fontWeight: 500 }}>
        {chit.durationMonths} months
      </TableCell>
      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
        <Chip 
          label={`${chit.assignedMemberCount || 0} / ${chit.memberCount} Assigned`}
          color={chit.assignedMemberCount === chit.memberCount ? 'success' : 'warning'}
          variant="outlined"
          size="small"
          sx={{ fontWeight: 700, fontSize: '0.75rem' }}
        />
      </TableCell>
      <TableCell sx={{ pr: 3 }}>
        <Chip 
          label={chit.status} 
          color={chit.status === 'ACTIVE' ? 'success' : 'default'} 
          size="small" 
          sx={{ fontWeight: 700, fontSize: '0.72rem', height: 22 }}
        />
      </TableCell>
    </TableRow>
  );
};

const MobileChitRow = ({ chit, onClick }) => {
  const initials = getInitials(chit.name);
  const gradient = getAvatarGradient(chit.name);

  return (
    <Card sx={{ p: 2, mb: 1.5, borderRadius: 2, boxShadow: 'none', border: '1px solid', borderColor: 'divider', backgroundColor: 'background.paper', cursor: 'pointer' }} onClick={onClick}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minWidth: 0, gap: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
          {/* Avatar branding badge */}
          <Box sx={{
            width: 38,
            height: 38,
            borderRadius: '8px',
            background: gradient,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            fontWeight: 800,
            fontSize: '0.9rem',
            boxShadow: '0 4px 10px rgba(0, 0, 0, 0.05)',
            border: '2px solid',
            borderColor: 'background.paper',
            flexShrink: 0
          }}>
            {initials}
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: 'text.primary', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {chit.name}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 0.3, flexWrap: 'wrap' }}>
              <Typography variant="caption" color="text.secondary">
                ₹{chit.totalAmount.toLocaleString()} • {chit.durationMonths}m
              </Typography>
              <Box sx={{ width: 4, height: 4, borderRadius: '50%', backgroundColor: 'text.secondary', flexShrink: 0 }} />
              <Typography variant="caption" color={chit.assignedMemberCount === chit.memberCount ? 'success.main' : 'warning.main'} sx={{ fontWeight: 700 }}>
                {chit.assignedMemberCount || 0}/{chit.memberCount} Members
              </Typography>
            </Box>
          </Box>
        </Box>
        <Chip 
          label={chit.status} 
          color={chit.status === 'ACTIVE' ? 'success' : 'default'} 
          size="small" 
          sx={{ fontWeight: 700, fontSize: '0.65rem', height: 18, flexShrink: 0 }}
        />
      </Box>
    </Card>
  );
};

const Chits = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();

  const [chits, setChits] = useState([]);
  const [loadingChits, setLoadingChits] = useState(true);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm({
    defaultValues: {
      strategyType: 'FIXED_COMMISSION_PROGRESSIVE'
    }
  });

  const watchedStrategy = useWatch({ control, name: 'strategyType' });

  const fetchChits = async () => {
    setLoadingChits(true);
    try {
      const response = await api.get('/chits');
      setChits(response.data || []);
    } catch (error) {
      console.error('Failed to fetch chits', error);
    } finally {
      setLoadingChits(false);
    }
  };

  useEffect(() => {
    fetchChits();
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
      fetchChits();
    } catch (error) {
      console.error('Failed to create chit group', error);
      alert('Failed to create chit group. Please check fields.');
    } finally {
      setSubmitting(false);
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

      {isMobile ? (
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          {loadingChits ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress size={30} />
            </Box>
          ) : chits.length === 0 ? (
            <Card sx={{ p: 3, textAlign: 'center', color: 'text.secondary', borderStyle: 'dashed', borderWidth: '2px', borderColor: 'divider' }}>
              No chit groups found. Create one to get started!
            </Card>
          ) : (
            chits.map((chit) => (
              <MobileChitRow
                key={chit.id}
                chit={chit}
                onClick={() => navigate(`/chits/${chit.id}`)}
              />
            ))
          )}
        </Box>
      ) : (
        <Card sx={{ display: { xs: 'none', md: 'block' } }}>
          <Box sx={{ overflowX: 'auto' }}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: 'background.default' }}>
                  <TableCell sx={{ fontWeight: 'bold', pl: 3 }}>Name</TableCell>
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' }, fontWeight: 'bold' }}>Total Amount</TableCell>
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' }, fontWeight: 'bold' }}>Duration</TableCell>
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' }, fontWeight: 'bold' }}>Members</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', pr: 3 }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loadingChits ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                      <CircularProgress size={30} />
                    </TableCell>
                  </TableRow>
                ) : chits.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                      No chit groups found. Create one to get started!
                    </TableCell>
                  </TableRow>
                ) : (
                  chits.map((chit) => (
                    <ChitRow
                      key={chit.id}
                      chit={chit}
                      onClick={() => navigate(`/chits/${chit.id}`)}
                    />
                  ))
                )}
              </TableBody>
            </Table>
          </Box>
        </Card>
      )}

      {/* Create Chit Group Modal */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth disableEnforceFocus>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 'bold' }}>
          <span>Create New Chit Group</span>
          <IconButton onClick={handleClose} color="inherit" size="small">
            <X size={20} />
          </IconButton>
        </DialogTitle>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent dividers>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Box sx={{ width: '100%' }}>
                  <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block', mb: 0.5 }}>
                    Chit Group Name *
                  </Typography>
                  <TextField
                    sx={{ width: '100%' }}
                    fullWidth
                    size="small"
                    placeholder="e.g. Alpha Savings"
                    {...register('name', { required: 'Name is required' })}
                    inputRef={register('name').ref}
                    error={!!errors.name}
                    helperText={errors.name?.message}
                  />
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ width: '100%' }}>
                  <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block', mb: 0.5 }}>
                    Total Amount (₹) *
                  </Typography>
                  <TextField
                    sx={{ width: '100%' }}
                    fullWidth
                    size="small"
                    type="number"
                    placeholder="e.g. 100000"
                    {...register('totalAmount', { required: 'Total amount is required', min: 1 })}
                    inputRef={register('totalAmount').ref}
                    error={!!errors.totalAmount}
                    helperText={errors.totalAmount?.message}
                  />
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ width: '100%' }}>
                  <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block', mb: 0.5 }}>
                    Duration (Months) *
                  </Typography>
                  <TextField
                    sx={{ width: '100%' }}
                    fullWidth
                    size="small"
                    type="number"
                    placeholder="e.g. 10"
                    {...register('durationMonths', { required: 'Duration is required', min: 1 })}
                    inputRef={register('durationMonths').ref}
                    error={!!errors.durationMonths}
                    helperText={errors.durationMonths?.message}
                  />
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ width: '100%' }}>
                  <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block', mb: 0.5 }}>
                    Number of Members *
                  </Typography>
                  <TextField
                    sx={{ width: '100%' }}
                    fullWidth
                    size="small"
                    type="number"
                    placeholder="e.g. 10"
                    {...register('memberCount', { required: 'Member count is required', min: 2 })}
                    inputRef={register('memberCount').ref}
                    error={!!errors.memberCount}
                    helperText={errors.memberCount?.message}
                  />
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ width: '100%' }}>
                  <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block', mb: 0.5 }}>
                    Strategy Type *
                  </Typography>
                  <FormControl fullWidth sx={{ width: '100%' }} size="small">
                    <Controller
                      name="strategyType"
                      control={control}
                      defaultValue="FIXED_COMMISSION_PROGRESSIVE"
                      render={({ field }) => (
                        <Select
                          {...field}
                          sx={{ width: '100%' }}
                        >
                          <MenuItem value="FIXED_COMMISSION_PROGRESSIVE">Fixed Commission Progressive</MenuItem>
                          <MenuItem value="INCREMENTAL_CONTRIBUTION">Incremental Contribution</MenuItem>
                        </Select>
                      )}
                    />
                  </FormControl>
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ width: '100%' }}>
                  <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block', mb: 0.5 }}>
                    Commission Percentage (%) *
                  </Typography>
                  <TextField
                    sx={{ width: '100%' }}
                    fullWidth
                    size="small"
                    type="number"
                    placeholder="e.g. 5"
                    {...register('commissionPercentage', { required: 'Commission is required', min: 0, max: 100 })}
                    inputRef={register('commissionPercentage').ref}
                    error={!!errors.commissionPercentage}
                    helperText={errors.commissionPercentage?.message}
                  />
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ width: '100%' }}>
                  <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block', mb: 0.5 }}>
                    Start Month *
                  </Typography>
                  <TextField
                    sx={{ width: '100%' }}
                    fullWidth
                    size="small"
                    type="month"
                    {...register('startMonth', { required: 'Start month is required' })}
                    inputRef={register('startMonth').ref}
                    error={!!errors.startMonth}
                    helperText={errors.startMonth?.message}
                  />
                </Box>
              </Grid>
              {watchedStrategy === 'FIXED_COMMISSION_PROGRESSIVE' && (
                <Grid item xs={12}>
                  <Box sx={{ width: '100%' }}>
                    <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block', mb: 0.5 }}>
                      Monthly Installment/Member (₹) *
                    </Typography>
                    <TextField
                      sx={{ width: '100%' }}
                      fullWidth
                      size="small"
                      type="number"
                      placeholder="e.g. 10000"
                      {...register('monthlyCollection', { required: 'Installment amount is required', min: 1 })}
                      inputRef={register('monthlyCollection').ref}
                      error={!!errors.monthlyCollection}
                      helperText={errors.monthlyCollection?.message}
                    />
                  </Box>
                </Grid>
              )}
              {watchedStrategy === 'INCREMENTAL_CONTRIBUTION' && (
                <>
                  <Grid item xs={12}>
                    <Box sx={{ width: '100%' }}>
                      <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block', mb: 0.5 }}>
                        Base Contribution (₹) *
                      </Typography>
                      <TextField
                        sx={{ width: '100%' }}
                        fullWidth
                        size="small"
                        type="number"
                        placeholder="e.g. 8000"
                        {...register('baseContribution', { required: 'Base contribution is required', min: 1 })}
                        inputRef={register('baseContribution').ref}
                        error={!!errors.baseContribution}
                        helperText={errors.baseContribution?.message}
                      />
                    </Box>
                  </Grid>
                  <Grid item xs={12}>
                    <Box sx={{ width: '100%' }}>
                      <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block', mb: 0.5 }}>
                        Post Payout Contribution (₹) *
                      </Typography>
                      <TextField
                        sx={{ width: '100%' }}
                        fullWidth
                        size="small"
                        type="number"
                        placeholder="e.g. 10000"
                        {...register('postPayoutContribution', { required: 'Post payout is required', min: 1 })}
                        inputRef={register('postPayoutContribution').ref}
                        error={!!errors.postPayoutContribution}
                        helperText={errors.postPayoutContribution?.message}
                      />
                    </Box>
                  </Grid>
                  <Grid item xs={12}>
                    <Box sx={{ width: '100%' }}>
                      <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block', mb: 0.5 }}>
                        Payout Adjustment Value (₹) *
                      </Typography>
                      <TextField
                        sx={{ width: '100%' }}
                        fullWidth
                        size="small"
                        type="number"
                        placeholder="e.g. 500"
                        {...register('payoutAdjustmentValue', { required: 'Adjustment value is required', min: 0 })}
                        inputRef={register('payoutAdjustmentValue').ref}
                        error={!!errors.payoutAdjustmentValue}
                        helperText={errors.payoutAdjustmentValue?.message}
                      />
                    </Box>
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
    </Box>
  );
};

export default Chits;
