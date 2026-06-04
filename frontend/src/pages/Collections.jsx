import React, { useState, useEffect } from 'react';
import { Box, Card, Typography, Table, TableBody, TableCell, TableHead, TableRow, MenuItem, Select, FormControl, InputLabel, Button, Chip, TextField, IconButton, Tooltip } from '@mui/material';
import { MessageCircle } from 'lucide-react';
import api from '../api/axiosConfig';
import { formatMonth } from '../utils/dateUtils';

const Collections = () => {
  const [chits, setChits] = useState([]);
  const [selectedChit, setSelectedChit] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [members, setMembers] = useState([]);
  const [collections, setCollections] = useState({});
  const [payouts, setPayouts] = useState([]);
  const [rowRemarks, setRowRemarks] = useState({});

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
      if (selectedChit && selectedMonth) {
        try {
          const membersRes = await api.get(`/chits/${selectedChit}/members`);
          setMembers(membersRes.data || []);
          
          const collRes = await api.get(`/collections/chit/${selectedChit}/month/${selectedMonth}`);
          const collMap = {};
          if (collRes.data && Array.isArray(collRes.data)) {
            collRes.data.forEach(c => {
              collMap[c.memberId] = c;
            });
          }
          setCollections(collMap);

          const payoutsRes = await api.get(`/payouts/chit/${selectedChit}`);
          setPayouts(payoutsRes.data || []);
        } catch (error) {
          console.error('Failed to fetch data', error);
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

  const handleMarkPaid = async (memberId) => {
    try {
      const amountDue = getAmountDue(memberId);
      const remark = rowRemarks[memberId] || '';
      const payload = {
        chitGroupId: selectedChit,
        memberId: memberId,
        forMonth: selectedMonth,
        amountPaid: amountDue,
        status: 'PAID',
        paymentDate: new Date().toISOString().split('T')[0],
        remarks: remark
      };
      
      const response = await api.post('/collections', payload);
      setCollections(prev => ({ ...prev, [memberId]: response.data }));
      
      // Clear the remarks input for this member after successful marking
      setRowRemarks(prev => {
        const copy = { ...prev };
        delete copy[memberId];
        return copy;
      });
    } catch (error) {
      console.error('Failed to mark paid', error);
    }
  };

  const handleUnmarkPaid = async (memberId, collectionId) => {
    if (window.confirm("Are you sure you want to unmark this collection as paid?")) {
      try {
        await api.delete(`/collections/${collectionId}`);
        setCollections(prev => {
          const copy = { ...prev };
          delete copy[memberId];
          return copy;
        });
      } catch (error) {
        console.error('Failed to unmark paid', error);
        alert("Failed to unmark paid. Please check the backend connection.");
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
      </Card>

      {selectedChit && selectedMonth && (
        <Card>
          <Box sx={{ overflowX: 'auto' }}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: 'background.default' }}>
                  <TableCell sx={{ fontWeight: 'bold' }}>Member Name</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Amount Due</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Payment Date</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Remarks / Payment Method</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {members.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                      No members assigned to this chit yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  members.map((member) => {
                    const collection = collections[member.id];
                    const isPaid = collection?.status === 'PAID';

                    const amountDue = getAmountDue(member.id);
                    return (
                      <TableRow key={member.id} hover>
                        <TableCell sx={{ fontWeight: 500 }}>{member.name}</TableCell>
                        <TableCell>₹{amountDue?.toLocaleString()}</TableCell>
                        <TableCell>
                          <Chip 
                            label={isPaid ? 'PAID' : 'PENDING'} 
                            color={isPaid ? 'success' : 'warning'} 
                            size="small" 
                          />
                        </TableCell>
                        <TableCell>{collection?.paymentDate || '-'}</TableCell>
                        <TableCell>
                          {isPaid ? (
                            collection?.remarks || '-'
                          ) : (
                            <TextField
                              size="small"
                              placeholder="e.g. UPI, Cash, Bank..."
                              value={rowRemarks[member.id] || ''}
                              onChange={(e) => setRowRemarks(prev => ({ ...prev, [member.id]: e.target.value }))}
                              sx={{ width: 200 }}
                            />
                          )}
                        </TableCell>
                        <TableCell>
                          {isPaid ? (
                            <Button 
                              variant="outlined" 
                              color="error" 
                              size="small"
                              onClick={() => handleUnmarkPaid(member.id, collection.id)}
                            >
                              Unmark Paid
                            </Button>
                          ) : (
                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                              <Button 
                                variant="outlined" 
                                color="primary" 
                                size="small"
                                onClick={() => handleMarkPaid(member.id)}
                              >
                                Mark Paid
                              </Button>
                              {(() => {
                                const status = getReminderStatus(parseInt(selectedMonth));
                                return (
                                  <Tooltip title={status.isOverdue ? "Send Overdue Reminder (WhatsApp)" : "Send Friendly Reminder (WhatsApp)"}>
                                    <IconButton
                                      color={status.isOverdue ? "error" : "success"}
                                      size="small"
                                      onClick={() => handleSendReminder(member, amountDue)}
                                    >
                                      <MessageCircle size={18} />
                                    </IconButton>
                                  </Tooltip>
                                );
                              })()}
                            </Box>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </Box>
        </Card>
      )}
    </Box>
  );
};

export default Collections;
