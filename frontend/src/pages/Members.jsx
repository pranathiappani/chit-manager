import React, { useState, useEffect } from 'react';
import { Box, Card, Typography, Button, Table, TableBody, TableCell, TableHead, TableRow, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Grid, Chip, Divider, CircularProgress, Collapse } from '@mui/material';
import { useForm } from 'react-hook-form';
import { Plus, Edit2, Trash2, Eye, Landmark, Wallet, ChevronDown, ChevronUp } from 'lucide-react';
import api from '../api/axiosConfig';

const MobileMemberRow = ({ member, handleViewDetails, handleEditClick, handleDeleteMember }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card sx={{ p: 2, mb: 1.5, borderRadius: 2, boxShadow: 1, border: '1px solid', borderColor: 'divider' }}>
      <Box 
        onClick={() => setExpanded(!expanded)} 
        sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
          {member.name}
        </Typography>
        <IconButton size="small">
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </IconButton>
      </Box>
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1.5, pt: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.2 }}>Phone Number</Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>{member.phone || '-'}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.2 }}>Physical Address</Typography>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>{member.address || '-'}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.2 }}>Joining Date</Typography>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>{member.joiningDate || '-'}</Typography>
          </Box>
          {member.nominee && (
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.2 }}>Nominee Name</Typography>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>{member.nominee}</Typography>
            </Box>
          )}
          {member.guarantor && (
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.2 }}>Guarantor Name</Typography>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>{member.guarantor}</Typography>
            </Box>
          )}
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 1 }}>
            <Button 
              variant="outlined" 
              color="info" 
              startIcon={<Eye size={16} />} 
              onClick={() => handleViewDetails(member.id)}
              size="small"
              sx={{ fontWeight: 'bold' }}
            >
              Portfolio
            </Button>
            <Button 
              variant="outlined" 
              color="primary" 
              startIcon={<Edit2 size={16} />} 
              onClick={() => handleEditClick(member)}
              size="small"
              sx={{ fontWeight: 'bold' }}
            >
              Edit
            </Button>
            <Button 
              variant="outlined" 
              color="error" 
              startIcon={<Trash2 size={16} />} 
              onClick={() => handleDeleteMember(member.id)}
              size="small"
              sx={{ fontWeight: 'bold' }}
            >
              Delete
            </Button>
          </Box>
        </Box>
      </Collapse>
    </Card>
  );
};

const Members = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedMemberDetails, setSelectedMemberDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const fetchMembers = async () => {
    try {
      const response = await api.get('/members');
      setMembers(response.data || []);
    } catch (error) {
      console.error('Failed to fetch members', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleOpen = () => {
    setEditingMember(null);
    reset({
      name: '',
      phone: '',
      joiningDate: '',
      nominee: '',
      guarantor: '',
      address: ''
    });
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingMember(null);
    reset();
  };

  const handleEditClick = (member) => {
    setEditingMember(member);
    reset({
      name: member.name,
      phone: member.phone,
      joiningDate: member.joiningDate,
      nominee: member.nominee || '',
      guarantor: member.guarantor || '',
      address: member.address || ''
    });
    setOpen(true);
  };

  const handleViewDetails = async (memberId) => {
    setLoadingDetails(true);
    setSelectedMemberDetails(null);
    setDetailsOpen(true);
    try {
      const res = await api.get(`/members/${memberId}/details`);
      setSelectedMemberDetails(res.data);
    } catch (error) {
      console.error("Failed to load member portfolio details", error);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleDetailsClose = () => {
    setDetailsOpen(false);
    setSelectedMemberDetails(null);
  };

  const onSubmit = async (data) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      if (editingMember) {
        await api.put(`/members/${editingMember.id}`, data);
      } else {
        await api.post('/members', data);
      }
      handleClose();
      fetchMembers(); // Refresh list
    } catch (error) {
      console.error('Failed to save member', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteMember = async (id) => {
    if (window.confirm("Are you sure you want to delete this member? This will automatically clear all their associated loans, payments, collections, and payouts.")) {
      try {
        await api.delete(`/members/${id}`);
        fetchMembers();
      } catch (error) {
        console.error('Failed to delete member', error);
        alert("Could not delete the member. It might have active dependencies.");
      }
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Members Directory</Typography>
        <Button variant="contained" startIcon={<Plus size={20} />} onClick={handleOpen} sx={{ width: { xs: '100%', sm: 'auto' } }}>
          Add Member
        </Button>
      </Box>

      {/* Desktop Table View */}
      <Box sx={{ display: { xs: 'none', md: 'block' } }}>
        <Card>
          <Box sx={{ overflowX: 'auto' }}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: 'background.default' }}>
                  <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Phone</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Address</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Joining Date</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                      <CircularProgress size={30} />
                    </TableCell>
                  </TableRow>
                ) : members.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                      No members found. Add your first member!
                    </TableCell>
                  </TableRow>
                ) : (
                  members.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>{member.name}</TableCell>
                      <TableCell>{member.phone}</TableCell>
                      <TableCell>{member.address}</TableCell>
                      <TableCell>{member.joiningDate}</TableCell>
                      <TableCell>
                        <IconButton size="small" color="info" onClick={() => handleViewDetails(member.id)} title="View Portfolio"><Eye size={18} /></IconButton>
                        <IconButton size="small" color="primary" onClick={() => handleEditClick(member)} title="Edit Member"><Edit2 size={18} /></IconButton>
                        <IconButton size="small" color="error" onClick={() => handleDeleteMember(member.id)} title="Delete Member"><Trash2 size={18} /></IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Box>
        </Card>
      </Box>

      {/* Mobile Collapsible Card View */}
      <Box sx={{ display: { xs: 'block', md: 'none' } }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress size={30} />
          </Box>
        ) : members.length === 0 ? (
          <Card sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>
            No members found. Add your first member!
          </Card>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            {members.map((member) => (
              <MobileMemberRow
                key={member.id}
                member={member}
                handleViewDetails={handleViewDetails}
                handleEditClick={handleEditClick}
                handleDeleteMember={handleDeleteMember}
              />
            ))}
          </Box>
        )}
      </Box>

      {/* Add Member Modal */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{editingMember ? 'Edit Member Details' : 'Add New Member'}</DialogTitle>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent dividers>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Full Name"
                  {...register('name', { required: 'Name is required' })}
                  inputRef={register('name').ref}
                  error={!!errors.name}
                  helperText={errors.name?.message}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone Number"
                  {...register('phone', { required: 'Phone is required' })}
                  inputRef={register('phone').ref}
                  error={!!errors.phone}
                  helperText={errors.phone?.message}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Joining Date"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  {...register('joiningDate', { required: 'Joining date is required' })}
                  inputRef={register('joiningDate').ref}
                  error={!!errors.joiningDate}
                  helperText={errors.joiningDate?.message}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Nominee Name"
                  {...register('nominee')}
                  inputRef={register('nominee').ref}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Guarantor Name"
                  {...register('guarantor')}
                  inputRef={register('guarantor').ref}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Address"
                  multiline
                  rows={2}
                  {...register('address')}
                  inputRef={register('address').ref}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={handleClose} color="inherit" disabled={submitting}>Cancel</Button>
            <Button type="submit" variant="contained" color="primary" disabled={submitting}>
              {editingMember ? (submitting ? 'Saving...' : 'Save Changes') : (submitting ? 'Adding...' : 'Add Member')}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* View Portfolio Dialog */}
      <Dialog open={detailsOpen} onClose={handleDetailsClose} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1.5 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Member Portfolio & History</Typography>
          <Button onClick={handleDetailsClose} color="inherit" size="small">Close</Button>
        </DialogTitle>
        <DialogContent dividers sx={{ backgroundColor: 'background.default', p: 3 }}>
          {loadingDetails && (
            <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', py: 8, gap: 2 }}>
              <CircularProgress size={40} />
              <Typography color="text.secondary" variant="body2">Loading member portfolio...</Typography>
            </Box>
          )}

          {!loadingDetails && selectedMemberDetails && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Member Profile Card */}
              <Card sx={{ p: 2.5, backgroundColor: 'background.paper', borderRadius: 3 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>Full Name</Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>{selectedMemberDetails.member.name}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>Phone Number</Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>{selectedMemberDetails.member.phone}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>Physical Address</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>{selectedMemberDetails.member.address || '-'}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>Nominee & Guarantor</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      Nominee: <strong>{selectedMemberDetails.member.nominee || '-'}</strong> | Guarantor: <strong>{selectedMemberDetails.member.guarantor || '-'}</strong>
                    </Typography>
                  </Grid>
                </Grid>
              </Card>

              {/* Chit Memberships */}
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Wallet size={18} style={{ color: '#4f46e5' }} /> Chit Group Memberships ({selectedMemberDetails.chits.length})
                </Typography>
                <Card sx={{ p: 0 }}>
                  <Box sx={{ overflowX: 'auto', width: '100%' }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ backgroundColor: 'action.hover' }}>
                          <TableCell sx={{ fontWeight: 'bold' }}>Chit Group</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>Total Value</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>Duration</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>Start Month</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedMemberDetails.chits.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} align="center" sx={{ py: 3, color: 'text.secondary', fontStyle: 'italic' }}>
                              Not assigned to any chit groups yet.
                            </TableCell>
                          </TableRow>
                        ) : (
                          selectedMemberDetails.chits.map(chit => (
                            <TableRow key={chit.id} hover>
                              <TableCell sx={{ fontWeight: 'bold' }}>{chit.name}</TableCell>
                              <TableCell>₹{chit.totalAmount?.toLocaleString()}</TableCell>
                              <TableCell>{chit.durationMonths} months</TableCell>
                              <TableCell>{chit.startMonth}</TableCell>
                              <TableCell>
                                <Chip 
                                  label={chit.status} 
                                  color={chit.status === 'ACTIVE' ? 'success' : 'default'} 
                                  size="small" 
                                  sx={{ fontSize: '0.7rem', fontWeight: 'bold', height: 20 }}
                                />
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </Box>
                </Card>
              </Box>

              {/* Loans Issued */}
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Landmark size={18} style={{ color: '#10b981' }} /> Loans Issued Portfolio ({selectedMemberDetails.loans.length})
                </Typography>
                <Card sx={{ p: 0 }}>
                  <Box sx={{ overflowX: 'auto', width: '100%' }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ backgroundColor: 'action.hover' }}>
                          <TableCell sx={{ fontWeight: 'bold' }}>Principal</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>Interest Rate</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>Interest Type</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>Start Date</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>End Date</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>Interest Collected</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedMemberDetails.loans.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} align="center" sx={{ py: 3, color: 'text.secondary', fontStyle: 'italic' }}>
                              No loans issued to this member yet.
                            </TableCell>
                          </TableRow>
                        ) : (
                          selectedMemberDetails.loans.map(loan => (
                            <TableRow key={loan.id} hover>
                              <TableCell sx={{ fontWeight: 'bold' }}>₹{loan.amount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                              <TableCell>{loan.interestRate}% / month</TableCell>
                              <TableCell>
                                <Chip 
                                  label={loan.interestType === 'MONTHLY' ? 'Monthly' : 'Accumulated'} 
                                  size="small" 
                                  variant="outlined"
                                  color={loan.interestType === 'MONTHLY' ? 'secondary' : 'default'}
                                  sx={{ fontSize: '0.65rem', height: 18, fontWeight: 'bold' }}
                                />
                              </TableCell>
                              <TableCell>{loan.startDate}</TableCell>
                              <TableCell>{loan.endDate || '-'}</TableCell>
                              <TableCell sx={{ color: 'success.main', fontWeight: 'bold' }}>
                                ₹{loan.collectedInterest?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </TableCell>
                              <TableCell>
                                <Chip 
                                  label={loan.status} 
                                  color={loan.status === 'ACTIVE' ? 'primary' : 'success'} 
                                  size="small" 
                                  sx={{ fontSize: '0.7rem', fontWeight: 'bold', height: 20 }}
                                />
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </Box>
                </Card>
              </Box>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default Members;
