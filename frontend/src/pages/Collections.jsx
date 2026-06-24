import React, { useState, useEffect } from 'react';
import { Box, Card, Typography, Table, TableBody, TableCell, TableHead, TableRow, MenuItem, Select, FormControl, InputLabel, Button, Chip, TextField, IconButton, Tooltip, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { MessageCircle, X } from 'lucide-react';
import api from '../api/axiosConfig';
import { formatMonth } from '../utils/dateUtils';
import { useToast } from '../components/ToastProvider';
import { useConfirm } from '../components/ConfirmProvider';

const Collections = () => {
  const { showToast } = useToast();
  const { confirm } = useConfirm();
  const [chits, setChits] = useState([]);
  const [selectedChit, setSelectedChit] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [members, setMembers] = useState([]);
  const [collections, setCollections] = useState({});
  const [payouts, setPayouts] = useState([]);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [activePaymentSlot, setActivePaymentSlot] = useState(null);
  const [dialogPaymentMode, setDialogPaymentMode] = useState('CASH');
  const [dialogPaymentDate, setDialogPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [dialogRemarks, setDialogRemarks] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

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
    const fetchMembersAndCollections = async () => {
      setSearchQuery('');
      if (selectedChit && selectedMonth) {
        setLoading(true);
        try {
          const membersRes = await api.get(`/chits/${selectedChit}/members`);
          setMembers(membersRes.data || []);
          
          const collRes = await api.get(`/collections/chit/${selectedChit}/month/${selectedMonth}`);
          const collectionsList = collRes.data || [];
          const collMap = {};
          
          const unmatchedLegacy = [];
          collectionsList.forEach(c => {
            if (c.chitMemberId) {
              collMap[c.chitMemberId] = c;
            } else {
              unmatchedLegacy.push(c);
            }
          });
          
          // Match legacy collections (without chitMemberId) to members' slots
          membersRes.data.forEach(m => {
            if (collMap[m.chitMemberId]) return;
            const legacyIdx = unmatchedLegacy.findIndex(c => c.memberId === m.id);
            if (legacyIdx !== -1) {
              collMap[m.chitMemberId] = unmatchedLegacy[legacyIdx];
              unmatchedLegacy.splice(legacyIdx, 1);
            }
          });
          
          setCollections(collMap);

          const payoutsRes = await api.get(`/payouts/chit/${selectedChit}`);
          setPayouts(payoutsRes.data || []);
        } catch (error) {
          console.error('Failed to fetch data', error);
        } finally {
          setLoading(false);
        }
      } else {
        setMembers([]);
        setCollections({});
        setPayouts([]);
      }
    };
    fetchMembersAndCollections();
  }, [selectedChit, selectedMonth]);

  const getAmountDue = (memberId) => {
    if (!selectedChitData) return 0;
    if (selectedChitData.strategyType === 'FIXED_COMMISSION_PROGRESSIVE') {
      return selectedChitData.monthlyCollection;
    }
    // Incremental Contribution Strategy
    const memberPayout = payouts.find(p => Number(p.memberId) === Number(memberId));
    if (memberPayout && memberPayout.payoutMonth) {
      if (Number(selectedMonth) > Number(memberPayout.payoutMonth)) {
        return selectedChitData.postPayoutContribution;
      }
    }
    return selectedChitData.baseContribution;
  };

  const handleOpenPaymentDialog = (memberId, chitMemberId, memberName) => {
    const amountDue = getAmountDue(memberId);
    setActivePaymentSlot({ memberId, chitMemberId, memberName, amountDue });
    setDialogPaymentMode('CASH');
    setDialogPaymentDate(new Date().toISOString().split('T')[0]);
    setDialogRemarks('');
    setPaymentDialogOpen(true);
  };

  const handleConfirmMarkPaid = async () => {
    if (!activePaymentSlot) return;
    const { memberId, chitMemberId, amountDue } = activePaymentSlot;
    const slotKey = chitMemberId || memberId;
    
    try {
      const payload = {
        chitGroupId: selectedChit,
        memberId: memberId,
        chitMemberId: chitMemberId,
        forMonth: selectedMonth,
        amountPaid: amountDue,
        status: 'PAID',
        paymentDate: dialogPaymentDate,
        remarks: dialogRemarks,
        paymentMode: dialogPaymentMode
      };
      
      const response = await api.post('/collections', payload);
      setCollections(prev => ({ ...prev, [slotKey]: response.data }));
      showToast("Successfully marked as paid!", "success");
      setPaymentDialogOpen(false);
      setActivePaymentSlot(null);
    } catch (error) {
      console.error('Failed to mark paid', error);
      showToast("Failed to mark as paid.", "error");
    }
  };

  const handleUnmarkPaid = async (slotKey, collectionId) => {
    const confirmed = await confirm({
      title: 'Unmark Collection',
      message: 'Are you sure you want to unmark this collection as paid?',
      confirmText: 'Unmark',
      cancelText: 'Cancel',
      severity: 'warning'
    });
    
    if (confirmed) {
      try {
        await api.delete(`/collections/${collectionId}`);
        setCollections(prev => {
          const copy = { ...prev };
          delete copy[slotKey];
          return copy;
        });
        showToast("Successfully unmarked as paid!", "success");
      } catch (error) {
        console.error('Failed to unmark paid', error);
        showToast("Failed to unmark paid. Please check the backend connection.", "error");
      }
    }
  };

  const getReminderStatus = (selectedMonthIndex) => {
    if (!selectedChitData?.startMonth) return { isOverdue: false, label: "Reminder" };
    try {
      const [year, month] = selectedChitData.startMonth.split('-');
      const targetDate = new Date(parseInt(year), parseInt(month) - 1 + (selectedMonthIndex - 1), 1);
      
      const now = new Date();
      const targetYear = targetDate.getFullYear();
      const targetMonth = targetDate.getMonth();
      
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();
      const currentDay = now.getDate();
      
      if (targetYear < currentYear || (targetYear === currentYear && targetMonth < currentMonth)) {
        return { isOverdue: true, label: "Overdue" };
      } else if (targetYear === currentYear && targetMonth === currentMonth) {
        if (currentDay >= 29) {
          return { isOverdue: true, label: "Overdue" };
        } else {
          return { isOverdue: false, label: "Friendly" };
        }
      } else {
        return { isOverdue: false, label: "Friendly" };
      }
    } catch (e) {
      console.error(e);
      return { isOverdue: false, label: "Reminder" };
    }
  };

  const handleSendReminder = (member, amountDue) => {
    const status = getReminderStatus(parseInt(selectedMonth));
    const formattedMonthName = formatMonth(selectedChitData?.startMonth, parseInt(selectedMonth));
    
    let message = "";
    if (status.isOverdue) {
      message = `Hello ${member.name}, this is an urgent reminder that your monthly contribution of ₹${amountDue.toLocaleString()} for the chit group "${selectedChitData.name}" (${formattedMonthName}) is OVERDUE (the due date was the 29th). Please pay as soon as possible via UPI or Cash. Thank you!`;
    } else {
      message = `Hello ${member.name}, this is a friendly reminder that your monthly contribution of ₹${amountDue.toLocaleString()} for the chit group "${selectedChitData.name}" (${formattedMonthName}) is due. Please make the payment before the 29th of the month. Thank you!`;
    }
    
    let phone = member.phone || '';
    phone = phone.replace(/[^0-9]/g, '');
    if (phone.length === 10) {
      phone = '91' + phone;
    }
    
    const url = `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const selectedChitData = chits.find(c => Number(c.id) === Number(selectedChit));
  const monthsArray = selectedChitData ? Array.from({length: selectedChitData.durationMonths}, (_, i) => i + 1) : [];
  const filteredMembers = members.filter(member =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group members by physical id
  const groupedMembers = [];
  const groupedMap = {};
  filteredMembers.forEach(m => {
    if (!groupedMap[m.id]) {
      groupedMap[m.id] = {
        id: m.id,
        name: m.name,
        phone: m.phone,
        slots: []
      };
      groupedMembers.push(groupedMap[m.id]);
    }
    groupedMap[m.id].slots.push(m);
  });

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Monthly Collections</Typography>
      </Box>

      <Card sx={{ mb: 4, p: 2, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
        <FormControl sx={{ minWidth: { xs: '100%', sm: 200 } }}>
          <InputLabel id="collections-chit-label">Select Chit Group</InputLabel>
          <Select
            labelId="collections-chit-label"
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

        <FormControl sx={{ minWidth: { xs: '100%', sm: 200 } }} disabled={!selectedChit}>
          <InputLabel id="collections-month-label">Select Month</InputLabel>
          <Select
            labelId="collections-month-label"
            value={selectedMonth}
            label="Select Month"
            onChange={(e) => setSelectedMonth(e.target.value)}
          >
            <MenuItem value="" disabled>-- Select a Month --</MenuItem>
            {monthsArray.map(m => (
              <MenuItem key={m} value={m}>Month {m} ({formatMonth(selectedChitData?.startMonth, m)})</MenuItem>
            ))}
          </Select>
        </FormControl>

        {selectedChit && selectedMonth && (
          <TextField
            label="Search by Name"
            variant="outlined"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ minWidth: { xs: '100%', sm: 250 }, ml: { sm: 'auto' } }}
          />
        )}
      </Card>

      {selectedChit && selectedMonth && (
        <>
          {/* Desktop Table View */}
          <Box sx={{ display: { xs: 'none', md: 'block' } }}>
            <Card>
              <Box sx={{ overflowX: 'auto' }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: 'background.default' }}>
                      <TableCell sx={{ fontWeight: 'bold' }}>Member Name</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Spot</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Amount Due</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Payment Date</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Remarks / Payment Method</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                          <CircularProgress size={30} />
                        </TableCell>
                      </TableRow>
                    ) : members.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                          No members assigned to this chit yet.
                        </TableCell>
                      </TableRow>
                    ) : groupedMembers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                          No members match "{searchQuery}".
                        </TableCell>
                      </TableRow>
                    ) : (
                      groupedMembers.flatMap((groupedMember) => {
                        const amountDuePerSlot = getAmountDue(groupedMember.id);
                        return groupedMember.slots.map((slot, sIdx) => {
                          const slotKey = slot.chitMemberId || slot.id;
                          const collection = collections[slotKey];
                          const isPaid = collection?.status === 'PAID';
                          const label = groupedMember.slots.length > 1 ? `Spot #${sIdx + 1}` : `Spot`;
                          
                          return (
                            <TableRow key={slotKey} hover>
                              {sIdx === 0 && (
                                <TableCell 
                                  rowSpan={groupedMember.slots.length} 
                                  sx={{ 
                                    fontWeight: 600, 
                                    verticalAlign: 'top', 
                                    pt: 2.5,
                                    borderRight: '1px solid',
                                    borderColor: 'divider',
                                    backgroundColor: 'background.paper'
                                  }}
                                >
                                  {groupedMember.name}
                                  {groupedMember.slots.length > 1 && (
                                    <span style={{ fontSize: '0.8rem', color: 'gray', display: 'block', fontWeight: 'normal' }}>
                                      ({groupedMember.slots.length} spots)
                                    </span>
                                  )}
                                </TableCell>
                              )}
                              <TableCell sx={{ fontWeight: 500, color: 'text.secondary' }}>{label}</TableCell>
                              <TableCell>₹{amountDuePerSlot?.toLocaleString()}</TableCell>
                              <TableCell>
                                <Chip 
                                  label={isPaid ? 'PAID' : 'PENDING'} 
                                  color={isPaid ? 'success' : 'warning'} 
                                  size="small" 
                                />
                              </TableCell>
                              <TableCell>{collection?.paymentDate || '-'}</TableCell>
                              <TableCell sx={{ minWidth: 160 }}>
                                {isPaid ? (
                                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                    {collection?.paymentMode && (
                                      <Chip
                                        label={collection.paymentMode}
                                        size="small"
                                        color="primary"
                                        variant="outlined"
                                        sx={{ width: 'fit-content', fontSize: '0.68rem', height: 18, fontWeight: 'bold' }}
                                      />
                                    )}
                                    <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                                      {collection?.remarks || '-'}
                                    </Typography>
                                  </Box>
                                ) : (
                                  <Typography variant="body2" color="text.secondary">
                                    -
                                  </Typography>
                                )}
                              </TableCell>
                              <TableCell>
                                {isPaid ? (
                                  <Button 
                                    variant="outlined" 
                                    color="error" 
                                    size="small"
                                    onClick={() => handleUnmarkPaid(slotKey, collection.id)}
                                  >
                                    Unmark
                                  </Button>
                                ) : (
                                  <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                                    <Button 
                                      variant="outlined" 
                                      color="primary" 
                                      size="small"
                                      onClick={() => handleOpenPaymentDialog(groupedMember.id, slot.chitMemberId, groupedMember.name)}
                                    >
                                      Mark Paid
                                    </Button>
                                    {(() => {
                                      const status = getReminderStatus(parseInt(selectedMonth));
                                      return (
                                        <Tooltip title={status.isOverdue ? "Send Overdue Reminder" : "Send Friendly Reminder"}>
                                          <IconButton
                                            color={status.isOverdue ? "error" : "success"}
                                            size="small"
                                            onClick={() => handleSendReminder(slot, amountDuePerSlot)}
                                          >
                                            <MessageCircle size={16} />
                                          </IconButton>
                                        </Tooltip>
                                      );
                                    })()}
                                  </Box>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        });
                      })
                    )}
                  </TableBody>
                </Table>
              </Box>
            </Card>
          </Box>

          {/* Mobile Card List View */}
          <Box sx={{ display: { xs: 'block', md: 'none' } }}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                <CircularProgress size={30} />
              </Box>
            ) : members.length === 0 ? (
              <Card sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>
                No members assigned to this chit yet.
              </Card>
            ) : groupedMembers.length === 0 ? (
              <Card sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>
                No members match "{searchQuery}".
              </Card>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {groupedMembers.map((groupedMember) => {
                  const amountDuePerSlot = getAmountDue(groupedMember.id);
                  return (
                    <Card key={groupedMember.id} sx={{ p: 2, borderRadius: 2 }}>
                      <Box sx={{ pb: 1, borderBottom: '1px solid', borderColor: 'divider', mb: 1.5 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                          {groupedMember.name}
                        </Typography>
                        {groupedMember.slots.length > 1 && (
                          <Typography variant="caption" color="text.secondary">
                            {groupedMember.slots.length} spots total
                          </Typography>
                        )}
                      </Box>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {groupedMember.slots.map((slot, sIdx) => {
                          const slotKey = slot.chitMemberId || slot.id;
                          const collection = collections[slotKey];
                          const isPaid = collection?.status === 'PAID';
                          const label = groupedMember.slots.length > 1 ? `Spot #${sIdx + 1}` : `Spot`;
                          
                          return (
                            <Box key={slotKey} sx={{ pl: groupedMember.slots.length > 1 ? 1.5 : 0, borderLeft: groupedMember.slots.length > 1 ? '2px solid' : 'none', borderColor: 'primary.light', pb: sIdx < groupedMember.slots.length - 1 ? 1.5 : 0, borderBottom: sIdx < groupedMember.slots.length - 1 ? '1px dashed' : 'none', borderBottomColor: 'divider' }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
                                  {label}
                                </Typography>
                                <Chip 
                                  label={isPaid ? 'PAID' : 'PENDING'} 
                                  color={isPaid ? 'success' : 'warning'} 
                                  size="small" 
                                />
                              </Box>
                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <Typography variant="body2" color="text.secondary">Amount Due</Typography>
                                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>₹{amountDuePerSlot?.toLocaleString()}</Typography>
                                </Box>
                                {isPaid && (
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography variant="body2" color="text.secondary">Payment Date</Typography>
                                    <Typography variant="body2">{collection?.paymentDate || '-'}</Typography>
                                  </Box>
                                )}
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                  <Typography variant="body2" color="text.secondary">Remarks / Payment Method</Typography>
                                  {isPaid ? (
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                      {collection?.paymentMode && (
                                        <Chip
                                          label={collection.paymentMode}
                                          size="small"
                                          color="primary"
                                          variant="outlined"
                                          sx={{ width: 'fit-content', fontSize: '0.68rem', height: 18, fontWeight: 'bold' }}
                                        />
                                      )}
                                      <Typography variant="body2" sx={{ fontWeight: 500 }}>{collection?.remarks || '-'}</Typography>
                                    </Box>
                                  ) : (
                                    <Typography variant="body2" color="text.secondary">
                                      -
                                    </Typography>
                                  )}
                                </Box>
                                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', pt: 1 }}>
                                  {isPaid ? (
                                    <Button 
                                      variant="outlined" 
                                      color="error" 
                                      size="small"
                                      onClick={() => handleUnmarkPaid(slotKey, collection.id)}
                                      sx={{ fontWeight: 'bold' }}
                                    >
                                      Unmark Paid
                                    </Button>
                                  ) : (
                                    <>
                                      {(() => {
                                        const status = getReminderStatus(parseInt(selectedMonth));
                                        return (
                                          <Button
                                            variant="outlined"
                                            color={status.isOverdue ? "error" : "success"}
                                            size="small"
                                            onClick={() => handleSendReminder(slot, amountDuePerSlot)}
                                            sx={{ fontWeight: 'bold' }}
                                          >
                                            Reminder
                                          </Button>
                                        );
                                      })()}
                                      <Button 
                                        variant="contained" 
                                        color="primary" 
                                        size="small"
                                        onClick={() => handleOpenPaymentDialog(groupedMember.id, slot.chitMemberId, groupedMember.name)}
                                        sx={{ fontWeight: 'bold' }}
                                      >
                                        Mark Paid
                                      </Button>
                                    </>
                                  )}
                                </Box>
                              </Box>
                            </Box>
                          );
                        })}
                      </Box>
                    </Card>
                  );
                })}
              </Box>
            )}
          </Box>
        </>
      )}
      {/* Mark Paid Dialog */}
      <Dialog
        open={paymentDialogOpen}
        onClose={() => setPaymentDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '20px',
            p: 1,
            boxShadow: theme => theme.palette.mode === 'light'
              ? '0 12px 30px rgba(0,0,0,0.06)'
              : '0 12px 30px rgba(0,0,0,0.4)',
            backgroundImage: 'none'
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1, pt: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, fontFamily: "'Outfit', sans-serif" }}>
            Mark Payment
          </Typography>
          <IconButton size="small" onClick={() => setPaymentDialogOpen(false)}>
            <X size={18} />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1.5 }}>
            {activePaymentSlot && (
              <Box sx={{ p: 2, borderRadius: '14px', backgroundColor: 'action.hover', border: '1px solid', borderColor: 'divider' }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                  Member Name
                </Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.primary', mb: 1, fontFamily: "'Outfit', sans-serif" }}>
                  {activePaymentSlot.memberName}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                  Amount Due
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 800, color: 'success.main', fontFamily: "'Outfit', sans-serif" }}>
                  ₹{activePaymentSlot.amountDue.toLocaleString()}
                </Typography>
              </Box>
            )}

            <FormControl size="small" fullWidth>
              <InputLabel id="payment-dialog-mode-label">Mode of Payment</InputLabel>
              <Select
                labelId="payment-dialog-mode-label"
                value={dialogPaymentMode}
                label="Mode of Payment"
                onChange={(e) => setDialogPaymentMode(e.target.value)}
              >
                <MenuItem value="PHONEPE">PhonePe</MenuItem>
                <MenuItem value="GPAY">GPay</MenuItem>
                <MenuItem value="CASH">Cash</MenuItem>
                <MenuItem value="OTHER">Other</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Date Paid"
              type="date"
              size="small"
              value={dialogPaymentDate}
              onChange={(e) => setDialogPaymentDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              fullWidth
              label="Remarks"
              placeholder="Add optional payment remarks..."
              value={dialogRemarks}
              onChange={(e) => setDialogRemarks(e.target.value)}
              size="small"
              multiline
              rows={2}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, pt: 1.5, display: 'flex', gap: 1.5 }}>
          <Button
            fullWidth
            variant="outlined"
            onClick={() => setPaymentDialogOpen(false)}
            sx={{
              borderRadius: '12px',
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '0.9rem',
              fontFamily: "'Outfit', sans-serif",
              py: 0.75,
              borderColor: 'divider',
              color: 'text.secondary'
            }}
          >
            Cancel
          </Button>
          <Button
            fullWidth
            variant="contained"
            onClick={handleConfirmMarkPaid}
            sx={{
              borderRadius: '12px',
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '0.9rem',
              fontFamily: "'Outfit', sans-serif",
              py: 0.75,
              boxShadow: 'none',
              '&:hover': {
                boxShadow: 'none'
              }
            }}
          >
            Mark Paid
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Collections;
