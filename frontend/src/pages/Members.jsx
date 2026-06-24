import React, { useState, useEffect } from 'react';
import { Box, Card, Typography, Button, Table, TableBody, TableCell, TableHead, TableRow, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Grid, Chip, Divider, CircularProgress, Collapse, InputAdornment, useMediaQuery, useTheme } from '@mui/material';
import { useForm } from 'react-hook-form';
import { Plus, Edit2, Trash2, Eye, Landmark, Wallet, ChevronDown, ChevronUp, Search, X } from 'lucide-react';
import api from '../api/axiosConfig';

// Helper function to extract initials from a name
const getInitials = (name) => {
  if (!name) return 'M';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

// Helper function to generate a unique, vibrant gradient based on name hash
const getAvatarGradient = (name) => {
  const colors = [
    'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)', // Soft Pink
    'linear-gradient(135deg, #f6d365 0%, #fda085 100%)', // Sunny Peach
    'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)', // Soft Blue
    'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)', // Mint Blue
    'linear-gradient(135deg, #a6c0fe 0%, #f1eefc 100%)', // Lavender
    'linear-gradient(135deg, #fccb90 0%, #d5d114 100%)', // Sand Gold
    'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)', // Purple Blue
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', // Electric Blue
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', // Neon Mint
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', // Coral Sunset
  ];
  if (!name) return colors[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

const MobileMemberRow = ({ member, handleViewDetails, handleEditClick, handleDeleteMember }) => {
  const [expanded, setExpanded] = useState(false);
  const initials = getInitials(member.name);
  const gradient = getAvatarGradient(member.name);

  return (
    <Card sx={{ p: 2, mb: 1.5, borderRadius: 2, boxShadow: 'none', border: '1px solid', borderColor: 'divider', backgroundColor: 'background.paper' }}>
      <Box 
        onClick={() => setExpanded(!expanded)} 
        sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {/* Circular Initials Avatar */}
          <Box sx={{
            width: 38,
            height: 38,
            borderRadius: '50%',
            background: gradient,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            fontWeight: 800,
            fontSize: '0.95rem',
            boxShadow: '0 4px 10px rgba(0, 0, 0, 0.06)'
          }}>
            {initials}
          </Box>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: 'text.primary', lineHeight: 1.2 }}>
              {member.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {member.phone || 'No phone'}
            </Typography>
          </Box>
        </Box>
        <IconButton size="small">
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </IconButton>
      </Box>
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1.5, pt: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ p: 1.5, borderRadius: '8px', backgroundColor: (theme) => theme.palette.mode === 'light' ? 'rgba(0,0,0,0.01)' : 'rgba(255,255,255,0.02)', display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.2 }}>Physical Address</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>{member.address || '-'}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.2 }}>Joining Date</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>{member.joiningDate || '-'}</Typography>
            </Box>
            {member.nominee && (
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.2 }}>Nominee Name</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{member.nominee}</Typography>
              </Box>
            )}
            {member.guarantor && (
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.2 }}>Guarantor Name</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{member.guarantor}</Typography>
              </Box>
            )}
          </Box>
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 1 }}>
            <Button 
              variant="outlined" 
              color="info" 
              startIcon={<Eye size={16} />} 
              onClick={() => handleViewDetails(member.id)}
              size="small"
              sx={{ fontWeight: 'bold', fontSize: '0.75rem', py: 0.8 }}
            >
              Portfolio
            </Button>
            <Button 
              variant="outlined" 
              color="primary" 
              startIcon={<Edit2 size={16} />} 
              onClick={() => handleEditClick(member)}
              size="small"
              sx={{ fontWeight: 'bold', fontSize: '0.75rem', py: 0.8 }}
            >
              Edit
            </Button>
            <Button 
              variant="outlined" 
              color="error" 
              startIcon={<Trash2 size={16} />} 
              onClick={() => handleDeleteMember(member.id)}
              size="small"
              sx={{ fontWeight: 'bold', fontSize: '0.75rem', py: 0.8 }}
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedMemberDetails, setSelectedMemberDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const { ref: nameRef, ...nameRegister } = register('name', { required: 'Name is required' });
  const { ref: phoneRef, ...phoneRegister } = register('phone', { required: 'Phone is required' });
  const { ref: joiningDateRef, ...joiningDateRegister } = register('joiningDate', { required: 'Joining date is required' });
  const { ref: nomineeRef, ...nomineeRegister } = register('nominee');
  const { ref: guarantorRef, ...guarantorRegister } = register('guarantor');
  const { ref: addressRef, ...addressRegister } = register('address');

  const filteredMembers = members.filter(member =>
    member.name && member.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
      {/* Directory Title Section */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Members Directory</Typography>
        <Button variant="contained" startIcon={<Plus size={20} />} onClick={handleOpen} sx={{ width: { xs: '100%', sm: 'auto' } }}>
          Add Member
        </Button>
      </Box>

      {/* Search Bar */}
      <Box sx={{ mb: 4 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search members by name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search size={18} color={theme.palette.text.secondary} />
              </InputAdornment>
            ),
            endAdornment: searchQuery ? (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setSearchQuery('')}>
                  <X size={16} />
                </IconButton>
              </InputAdornment>
            ) : null,
          }}
          size="small"
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '8px',
              backgroundColor: 'background.paper',
              transition: 'all 0.2s ease-in-out',
              '&.Mui-focused': {
                boxShadow: `0 0 0 3px ${theme.palette.mode === 'light' ? 'rgba(99, 102, 241, 0.12)' : 'rgba(99, 102, 241, 0.25)'}`,
              }
            }
          }}
        />
      </Box>

      {/* Main Content Area */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress size={40} />
        </Box>
      ) : filteredMembers.length === 0 ? (
        <Card sx={{ p: 5, textAlign: 'center', color: 'text.secondary', borderStyle: 'dashed', borderWidth: '2px', borderColor: 'divider' }}>
          {members.length === 0 ? 'No members found. Add your first member to get started!' : 'No members match your search query.'}
        </Card>
      ) : (
        <>
          {/* DESKTOP VIEW (Classic Clean Table with Gradient Avatars) */}
          <Box sx={{ display: { xs: 'none', md: 'block' } }}>
            <Card>
              <Box sx={{ overflowX: 'auto' }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: 'background.default' }}>
                      <TableCell sx={{ fontWeight: 'bold', pl: 3 }}>Member</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Phone</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Address</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Joining Date</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', pr: 3 }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredMembers.map((member) => {
                      const initials = getInitials(member.name);
                      const gradient = getAvatarGradient(member.name);
                      return (
                        <TableRow key={member.id} sx={{ '&:hover': { backgroundColor: 'action.hover' } }}>
                          <TableCell sx={{ pl: 3 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              {/* Gradient Initials Profile Icon */}
                              <Box sx={{
                                width: 36,
                                height: 36,
                                borderRadius: '50%',
                                background: gradient,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#ffffff',
                                fontWeight: 800,
                                fontSize: '0.85rem',
                                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                                border: '2px solid',
                                borderColor: 'background.paper'
                              }}>
                                {initials}
                              </Box>
                              <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                                {member.name}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>{member.phone}</TableCell>
                          <TableCell sx={{ maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {member.address || '-'}
                          </TableCell>
                          <TableCell>{member.joiningDate}</TableCell>
                          <TableCell sx={{ pr: 3 }}>
                            <IconButton size="small" color="info" onClick={() => handleViewDetails(member.id)} title="View Portfolio"><Eye size={18} /></IconButton>
                            <IconButton size="small" color="primary" onClick={() => handleEditClick(member)} title="Edit Member"><Edit2 size={18} /></IconButton>
                            <IconButton size="small" color="error" onClick={() => handleDeleteMember(member.id)} title="Delete Member"><Trash2 size={18} /></IconButton>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </Box>
            </Card>
          </Box>

          {/* MOBILE VIEW (Vibrant Collapsible Cards View) */}
          <Box sx={{ display: { xs: 'block', md: 'none' } }}>
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              {filteredMembers.map((member) => (
                <MobileMemberRow
                  key={member.id}
                  member={member}
                  handleViewDetails={handleViewDetails}
                  handleEditClick={handleEditClick}
                  handleDeleteMember={handleDeleteMember}
                />
              ))}
            </Box>
          </Box>
        </>
      )}

      {/* Add Member Modal */}
      <Dialog 
        open={open} 
        onClose={handleClose} 
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          fontWeight: 'bold',
          px: { xs: 3, sm: 4 },
          py: 2.5,
          borderBottom: '1px solid',
          borderColor: 'divider',
          backgroundColor: 'background.paper'
        }}>
          <span>{editingMember ? 'Edit Member Details' : 'Add New Member'}</span>
          <IconButton onClick={handleClose} color="inherit" size="small">
            <X size={20} />
          </IconButton>
        </DialogTitle>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent sx={{ px: { xs: 3, sm: 4 }, py: 4 }}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Box sx={{ width: '100%' }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, display: 'block', mb: 1, color: 'text.secondary' }}>
                    Full Name *
                  </Typography>
                  <TextField
                    sx={{
                      width: '100%',
                      '& .MuiInputBase-root': { width: '100% !important' },
                      '& .MuiOutlinedInput-root': { width: '100% !important' },
                      '& .MuiInputBase-input': { width: '100% !important' }
                    }}
                    InputProps={{ sx: { width: '100%' } }}
                    inputProps={{ style: { width: '100%' } }}
                    fullWidth
                    placeholder="e.g. John Doe"
                    inputRef={nameRef}
                    {...nameRegister}
                    error={!!errors.name}
                    helperText={errors.name?.message}
                  />
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ width: '100%' }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, display: 'block', mb: 1, color: 'text.secondary' }}>
                    Phone Number *
                  </Typography>
                  <TextField
                    sx={{
                      width: '100%',
                      '& .MuiInputBase-root': { width: '100% !important' },
                      '& .MuiOutlinedInput-root': { width: '100% !important' },
                      '& .MuiInputBase-input': { width: '100% !important' }
                    }}
                    InputProps={{ sx: { width: '100%' } }}
                    inputProps={{ style: { width: '100%' } }}
                    fullWidth
                    placeholder="e.g. 9876543210"
                    inputRef={phoneRef}
                    {...phoneRegister}
                    error={!!errors.phone}
                    helperText={errors.phone?.message}
                  />
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ width: '100%' }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, display: 'block', mb: 1, color: 'text.secondary' }}>
                    Joining Date *
                  </Typography>
                  <TextField
                    sx={{
                      width: '100%',
                      '& .MuiInputBase-root': { width: '100% !important' },
                      '& .MuiOutlinedInput-root': { width: '100% !important' },
                      '& .MuiInputBase-input': { 
                        width: '100% !important',
                        minWidth: '100% !important'
                      }
                    }}
                    InputProps={{ 
                      sx: { 
                        width: '100%',
                        '& input': {
                          width: '100% !important',
                          minWidth: '100% !important'
                        }
                      } 
                    }}
                    inputProps={{ 
                      style: { 
                        width: '100%',
                        minWidth: '100%'
                      } 
                    }}
                    fullWidth
                    type="date"
                    inputRef={joiningDateRef}
                    {...joiningDateRegister}
                    error={!!errors.joiningDate}
                    helperText={errors.joiningDate?.message}
                  />
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ width: '100%' }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, display: 'block', mb: 1, color: 'text.secondary' }}>
                    Nominee Name
                  </Typography>
                  <TextField
                    sx={{
                      width: '100%',
                      '& .MuiInputBase-root': { width: '100% !important' },
                      '& .MuiOutlinedInput-root': { width: '100% !important' },
                      '& .MuiInputBase-input': { width: '100% !important' }
                    }}
                    InputProps={{ sx: { width: '100%' } }}
                    inputProps={{ style: { width: '100%' } }}
                    fullWidth
                    placeholder="e.g. Jane Doe"
                    inputRef={nomineeRef}
                    {...nomineeRegister}
                  />
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ width: '100%' }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, display: 'block', mb: 1, color: 'text.secondary' }}>
                    Guarantor Name
                  </Typography>
                  <TextField
                    sx={{
                      width: '100%',
                      '& .MuiInputBase-root': { width: '100% !important' },
                      '& .MuiOutlinedInput-root': { width: '100% !important' },
                      '& .MuiInputBase-input': { width: '100% !important' }
                    }}
                    InputProps={{ sx: { width: '100%' } }}
                    inputProps={{ style: { width: '100%' } }}
                    fullWidth
                    placeholder="e.g. Robert Smith"
                    inputRef={guarantorRef}
                    {...guarantorRegister}
                  />
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ width: '100%' }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, display: 'block', mb: 1, color: 'text.secondary' }}>
                    Address
                  </Typography>
                  <TextField
                    sx={{
                      width: '100%',
                      '& .MuiInputBase-root': { width: '100% !important' },
                      '& .MuiOutlinedInput-root': { width: '100% !important' },
                      '& .MuiInputBase-input': { width: '100% !important' }
                    }}
                    InputProps={{ sx: { width: '100%' } }}
                    inputProps={{ style: { width: '100%' } }}
                    fullWidth
                    placeholder="Enter physical address..."
                    multiline
                    rows={3}
                    inputRef={addressRef}
                    {...addressRegister}
                  />
                </Box>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ 
            px: { xs: 3, sm: 4 }, 
            py: 2.5, 
            display: 'flex', 
            justifyContent: 'space-between', 
            borderTop: '1px solid', 
            borderColor: 'divider',
            backgroundColor: 'background.paper'
          }}>
            <Button 
              onClick={handleClose} 
              color="inherit" 
              disabled={submitting}
              sx={{ fontWeight: 'bold' }}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="contained" 
              color="primary" 
              disabled={submitting}
              sx={{ px: 4 }}
            >
              {editingMember ? (submitting ? 'Saving...' : 'Save Changes') : (submitting ? 'Adding...' : 'Add Member')}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* View Portfolio Dialog */}
      <Dialog open={detailsOpen} onClose={handleDetailsClose} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1.5 }}>
          <span>Member Portfolio & History</span>
          <IconButton onClick={handleDetailsClose} color="inherit" size="small">
            <X size={20} />
          </IconButton>
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
              <Card sx={{ p: 2.5, backgroundColor: 'background.paper', borderRadius: 2 }}>
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
                {isMobile ? (
                  selectedMemberDetails.chits.length === 0 ? (
                    <Card sx={{ p: 3, textAlign: 'center', color: 'text.secondary', fontStyle: 'italic', borderRadius: 2, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
                      Not assigned to any chit groups yet.
                    </Card>
                  ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      {selectedMemberDetails.chits.map(chit => (
                        <Card key={chit.id} sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider', boxShadow: 'none', backgroundColor: 'background.paper' }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: 'text.primary' }}>{chit.name}</Typography>
                            <Chip 
                              label={chit.status} 
                              color={chit.status === 'ACTIVE' ? 'success' : 'default'} 
                              size="small" 
                              sx={{ fontSize: '0.65rem', fontWeight: 'bold', height: 18 }}
                            />
                          </Box>
                          <Grid container spacing={1}>
                            <Grid item xs={6}>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.2 }}>Total Value</Typography>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>₹{chit.totalAmount?.toLocaleString()}</Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.2 }}>Duration</Typography>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>{chit.durationMonths} months</Typography>
                            </Grid>
                            <Grid item xs={12}>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.2 }}>Start Month</Typography>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>{chit.startMonth}</Typography>
                            </Grid>
                          </Grid>
                        </Card>
                      ))}
                    </Box>
                  )
                ) : (
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
                )}
              </Box>

              {/* Loans Issued */}
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Landmark size={18} style={{ color: '#10b981' }} /> Loans Issued Portfolio ({selectedMemberDetails.loans.length})
                </Typography>
                {isMobile ? (
                  selectedMemberDetails.loans.length === 0 ? (
                    <Card sx={{ p: 3, textAlign: 'center', color: 'text.secondary', fontStyle: 'italic', borderRadius: 2, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
                      No loans issued to this member yet.
                    </Card>
                  ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      {selectedMemberDetails.loans.map(loan => (
                        <Card key={loan.id} sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider', boxShadow: 'none', backgroundColor: 'background.paper' }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                            <Box>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.2 }}>Principal Amount</Typography>
                              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                                ₹{loan.amount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </Typography>
                            </Box>
                            <Chip 
                              label={loan.status} 
                              color={loan.status === 'ACTIVE' ? 'primary' : 'success'} 
                              size="small" 
                              sx={{ fontSize: '0.65rem', fontWeight: 'bold', height: 18 }}
                            />
                          </Box>
                          <Grid container spacing={1.5}>
                            <Grid item xs={6}>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.2 }}>Interest Rate</Typography>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>{loan.interestRate}% / month</Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.2 }}>Interest Type</Typography>
                              <Chip 
                                label={loan.interestType === 'MONTHLY' ? 'Monthly' : 'Accumulated'} 
                                size="small" 
                                variant="outlined"
                                color={loan.interestType === 'MONTHLY' ? 'secondary' : 'default'}
                                sx={{ fontSize: '0.6rem', height: 18, fontWeight: 'bold', mt: 0.2 }}
                              />
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.2 }}>Start Date</Typography>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>{loan.startDate}</Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.2 }}>End Date</Typography>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>{loan.endDate || '-'}</Typography>
                            </Grid>
                            <Grid item xs={12}>
                              <Divider sx={{ my: 0.5 }} />
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="caption" color="text.secondary">Interest Collected</Typography>
                                <Typography variant="body2" sx={{ color: 'success.main', fontWeight: 'bold' }}>
                                  ₹{loan.collectedInterest?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </Typography>
                              </Box>
                            </Grid>
                          </Grid>
                        </Card>
                      ))}
                    </Box>
                  )
                ) : (
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
                )}
              </Box>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default Members;
