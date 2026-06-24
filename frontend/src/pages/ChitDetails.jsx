import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Card, Typography, Button, Table, TableBody, TableCell, TableHead, TableRow, Chip, TextField, Grid, IconButton, FormControl, InputLabel, Select, MenuItem, CircularProgress, Collapse, Tabs, Tab, useMediaQuery, useTheme, InputAdornment, Paper, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { ArrowLeft, UserPlus, Trash2, Users, Clock, ChevronDown, ChevronUp, Receipt, Search, X, Settings2, Filter } from 'lucide-react';
import api from '../api/axiosConfig';
import { useToast } from '../components/ToastProvider';
import { useConfirm } from '../components/ConfirmProvider';

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

// Helper function to calculate running month dynamically
const getRunningMonth = (startMonthStr, duration) => {
  if (!startMonthStr) return 1;
  try {
    const [startYear, startMonth] = startMonthStr.split('-').map(Number);
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    
    const elapsed = (currentYear - startYear) * 12 + (currentMonth - startMonth) + 1;
    return Math.min(Math.max(1, elapsed), duration);
  } catch (e) {
    return 1;
  }
};

const MobilePendingMemberCard = ({ groupedMember, selectedDues, pendingDuesData, handlePastDuesToggle, handleCheckboxChange }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card sx={{ p: 2, mb: 1.5, borderRadius: 2, border: '1px solid', borderColor: 'divider', boxShadow: 'none', backgroundColor: 'background.paper' }}>
      <Box 
        onClick={() => setExpanded(!expanded)} 
        sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
      >
        <Box sx={{ minWidth: 0, mr: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: 'text.primary', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {groupedMember.memberName}
          </Typography>
          {groupedMember.slots.length > 1 && (
            <Typography variant="caption" color="text.secondary" display="block">
              ({groupedMember.slots.length} spots)
            </Typography>
          )}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: 'error.main' }}>
            ₹{groupedMember.totalPending?.toLocaleString()}
          </Typography>
          <IconButton size="small">
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </IconButton>
        </Box>
      </Box>
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <Box sx={{ mt: 1.5, pt: 1.5, borderTop: '1px solid', borderColor: 'divider', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.2 }}>Phone Number</Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>{groupedMember.memberPhone || '-'}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>Pending Dues By Month</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {groupedMember.slots.map((slot, sIdx) => {
                const label = groupedMember.slots.length > 1 ? `Spot #${sIdx + 1}: ` : '';
                const currentMonthNum = pendingDuesData.currentMonth;
                const pastPending = slot.pendingMonths.filter(pm => pm.monthNumber < currentMonthNum);
                const currentOrFuturePending = slot.pendingMonths.filter(pm => pm.monthNumber >= currentMonthNum);
                
                const pastTotal = pastPending.reduce((sum, pm) => sum + pm.amountDue, 0);
                const isPastChecked = pastPending.length > 0 && pastPending.every(pm => !!selectedDues[`${slot.chitMemberId}-${pm.monthNumber}`]);
                
                return (
                  <Box key={slot.chitMemberId} sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    {label && <Typography variant="caption" sx={{ fontWeight: 'bold' }}>{label}</Typography>}
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {pastPending.length > 0 && (
                        <Chip
                          label={`Past Dues: ₹${pastTotal.toLocaleString()}`}
                          color={isPastChecked ? "primary" : "default"}
                          variant={isPastChecked ? "contained" : "outlined"}
                          onClick={() => handlePastDuesToggle(slot.chitMemberId, pastPending, isPastChecked, groupedMember.memberId)}
                          sx={{ cursor: 'pointer', fontSize: '0.8rem' }}
                        />
                      )}
                      {currentOrFuturePending.map(pm => {
                        const key = `${slot.chitMemberId}-${pm.monthNumber}`;
                        const isChecked = !!selectedDues[key];
                        return (
                          <Chip
                            key={pm.monthNumber}
                            label={`M${pm.monthNumber}: ₹${pm.amountDue.toLocaleString()}`}
                            color={isChecked ? "primary" : "default"}
                            variant={isChecked ? "contained" : "outlined"}
                            onClick={() => handleCheckboxChange(slot.chitMemberId, pm.monthNumber, pm.amountDue, groupedMember.memberId)}
                            sx={{ cursor: 'pointer', fontSize: '0.8rem' }}
                          />
                        );
                      })}
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </Box>
        </Box>
      </Collapse>
    </Card>
  );
};

const MobileLedgerRow = ({ memberGroup }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card sx={{ p: 2, mb: 1.5, borderRadius: 2, border: '1px solid', borderColor: 'divider', boxShadow: 'none', backgroundColor: 'background.paper' }}>
      <Box 
        onClick={() => setExpanded(!expanded)} 
        sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
      >
        <Box sx={{ minWidth: 0, mr: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: 'text.primary', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {memberGroup.memberName}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {memberGroup.payments.length} transaction{memberGroup.payments.length > 1 ? 's' : ''}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: 'success.main' }}>
            ₹{memberGroup.totalPaid?.toLocaleString()}
          </Typography>
          <IconButton size="small">
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </IconButton>
        </Box>
      </Box>
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <Box sx={{ mt: 1.5, pt: 1.5, borderTop: '1px solid', borderColor: 'divider', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {memberGroup.payments.map((payment, idx) => (
            <Box key={idx} sx={{ pb: idx < memberGroup.payments.length - 1 ? 2 : 0, borderBottom: idx < memberGroup.payments.length - 1 ? '1px dashed' : 'none', borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                  Date: {payment.paymentDate || '-'}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {memberGroup.paymentMode && (
                    <Chip
                      label={memberGroup.paymentMode}
                      size="small"
                      color="primary"
                      variant="outlined"
                      sx={{ fontSize: '0.68rem', height: 18, fontWeight: 'bold' }}
                    />
                  )}
                  <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                    ₹{payment.totalAmountPaid.toLocaleString()}
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ mb: 1 }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>Cleared Months</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {payment.clearedMonths.sort((a, b) => a - b).map(m => (
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
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>Remarks</Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>{payment.remarks || '-'}</Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </Collapse>
    </Card>
  );
};

const MobilePayoutPlanCard = ({ plan, index, handlePlanChange }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card sx={{ p: 2, mb: 1.5, borderRadius: 2, border: '1px solid', borderColor: 'divider', boxShadow: 'none', backgroundColor: 'background.paper' }}>
      <Box 
        onClick={() => setExpanded(!expanded)} 
        sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
          Month {plan.monthNumber}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {plan.payoutAmount ? (
            <Typography variant="caption" sx={{ fontWeight: 600, color: 'primary.main' }}>
              ₹{Number(plan.payoutAmount).toLocaleString()} ({plan.expectedPayoutCount || 1} pers)
            </Typography>
          ) : (
            <Typography variant="caption" color="text.secondary">
              Not Configured
            </Typography>
          )}
          <IconButton size="small">
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </IconButton>
        </Box>
      </Box>
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <Box sx={{ mt: 2, pt: 1.5, borderTop: '1px solid', borderColor: 'divider', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            type="number"
            label="Payout Amount (₹)"
            size="small"
            value={plan.payoutAmount}
            onChange={(e) => handlePlanChange(index, 'payoutAmount', e.target.value)}
            placeholder="e.g. 95000"
            fullWidth
          />
          <TextField
            type="number"
            label="Number of Persons"
            size="small"
            value={plan.expectedPayoutCount}
            onChange={(e) => handlePlanChange(index, 'expectedPayoutCount', e.target.value)}
            inputProps={{ min: 1 }}
            fullWidth
          />
        </Box>
      </Collapse>
    </Card>
  );
};

const ChitDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { showToast } = useToast();
  const { confirm } = useConfirm();

  // Main State
  const [chit, setChit] = useState(null);
  const [loadingChit, setLoadingChit] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [allChits, setAllChits] = useState([]); // For copying plans

  // Tab 1: Members state
  const [assignedMembers, setAssignedMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [allMembers, setAllMembers] = useState([]);
  const [selectedMemberToAssign, setSelectedMemberToAssign] = useState('');
  const [searchQueryMembers, setSearchQueryMembers] = useState('');

  // Tab 2: Pending dues state
  const [pendingDuesData, setPendingDuesData] = useState(null);
  const [loadingPendingDues, setLoadingPendingDues] = useState(false);
  const [selectedDues, setSelectedDues] = useState({});
  const [recordingPayments, setRecordingPayments] = useState(false);
  const [pendingDuesRemarks, setPendingDuesRemarks] = useState('');
  const [searchQueryPendingDues, setSearchQueryPendingDues] = useState('');
  const [pendingPaymentMode, setPendingPaymentMode] = useState('CASH');

  // Tab 3: Payout plans state
  const [payoutPlansState, setPayoutPlansState] = useState([]);
  const [selectedSourceChit, setSelectedSourceChit] = useState('');
  const [savingPlans, setSavingPlans] = useState(false);

  // Tab 4: Ledger state
  const [ledgerData, setLedgerData] = useState([]);
  const [loadingLedger, setLoadingLedger] = useState(false);
  const [searchQueryLedger, setSearchQueryLedger] = useState('');
  const [ledgerPaymentModeFilter, setLedgerPaymentModeFilter] = useState('ALL');
  const [ledgerMemberFilter, setLedgerMemberFilter] = useState('ALL');
  const [ledgerMonthFilter, setLedgerMonthFilter] = useState('ALL');
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [ledgerCalendarMonthFilter, setLedgerCalendarMonthFilter] = useState(new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }));

  // Load Main Chit Details
  const fetchChitDetails = async () => {
    setLoadingChit(true);
    try {
      const res = await api.get(`/chits/${id}`);
      setChit(res.data);
    } catch (error) {
      console.error("Failed to fetch chit details", error);
      showToast("Could not load chit group details. Redirecting to list.", "error");
      navigate('/chits');
    } finally {
      setLoadingChit(false);
    }
  };

  // Fetch all members for assignment
  const fetchAllMembers = async () => {
    try {
      const res = await api.get('/members');
      setAllMembers(res.data || []);
    } catch (error) {
      console.error("Failed to fetch members", error);
    }
  };

  // Fetch all chits for copy configuration dropdown
  const fetchAllChits = async () => {
    try {
      const res = await api.get('/chits');
      setAllChits(res.data || []);
    } catch (error) {
      console.error("Failed to fetch all chits", error);
    }
  };

  useEffect(() => {
    fetchChitDetails();
    fetchAllMembers();
    fetchAllChits();
  }, [id]);

  // Load Tab Specific Data on Tab Switch
  useEffect(() => {
    if (!chit) return;
    if (tabValue === 0) {
      fetchAssignedMembers();
    } else if (tabValue === 1) {
      fetchPendingDues();
    } else if (tabValue === 2) {
      fetchPayoutPlans();
    } else if (tabValue === 3) {
      fetchLedgerData();
    }
  }, [tabValue, chit]);

  // === TAB 1: MEMBERS LOGIC ===
  const fetchAssignedMembers = async () => {
    setLoadingMembers(true);
    try {
      const res = await api.get(`/chits/${id}/members`);
      setAssignedMembers(res.data || []);
    } catch (error) {
      console.error("Failed to load assigned members", error);
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleAssignMember = async () => {
    if (!selectedMemberToAssign) return;
    try {
      await api.post(`/chits/${id}/members/${selectedMemberToAssign}`);
      setSelectedMemberToAssign('');
      fetchAssignedMembers();
      // Refresh main chit details to update assigned count
      const res = await api.get(`/chits/${id}`);
      setChit(res.data);
    } catch (error) {
      console.error("Failed to assign member", error);
      showToast(error.response?.data?.message || 'Failed to assign member. The chit group might be full.', 'error');
    }
  };

  const handleRemoveMember = async (memberId) => {
    const confirmed = await confirm({
      title: 'Remove Member',
      message: 'Are you sure you want to remove this member from the chit group?',
      confirmText: 'Remove',
      cancelText: 'Cancel',
      severity: 'warning'
    });
    
    if (confirmed) {
      try {
        await api.delete(`/chits/${id}/members/${memberId}`);
        fetchAssignedMembers();
        // Refresh main chit details
        const res = await api.get(`/chits/${id}`);
        setChit(res.data);
      } catch (error) {
        console.error("Failed to remove member", error);
        showToast("Could not remove the member assignment.", "error");
      }
    }
  };

  // === TAB 2: PENDING DUES LOGIC ===
  const fetchPendingDues = async () => {
    setLoadingPendingDues(true);
    setSelectedDues({});
    try {
      const res = await api.get(`/chits/${id}/pending-dues`);
      setPendingDuesData(res.data);
    } catch (error) {
      console.error("Failed to fetch pending dues", error);
    } finally {
      setLoadingPendingDues(false);
    }
  };

  const handleCheckboxChange = (chitMemberId, monthNumber, amountDue, memberId) => {
    const key = `${chitMemberId}-${monthNumber}`;
    setSelectedDues(prev => {
      const next = { ...prev };
      if (next[key]) {
        delete next[key];
      } else {
        next[key] = { chitMemberId, memberId, monthNumber, amountDue };
      }
      return next;
    });
  };

  const handlePastDuesToggle = (chitMemberId, pastPendingItems, isAllChecked, memberId) => {
    setSelectedDues(prev => {
      const next = { ...prev };
      pastPendingItems.forEach(item => {
        const key = `${chitMemberId}-${item.monthNumber}`;
        if (isAllChecked) {
          delete next[key];
        } else {
          next[key] = { chitMemberId, memberId, monthNumber: item.monthNumber, amountDue: item.amountDue };
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
           chitGroupId: id,
           memberId: due.memberId,
           chitMemberId: due.chitMemberId,
           forMonth: due.monthNumber,
           amountPaid: due.amountDue,
           status: 'PAID',
           paymentDate: new Date().toISOString().split('T')[0],
           remarks: pendingDuesRemarks.trim() || `Paid via Pending Dues workspace (Month ${due.monthNumber})`,
           paymentMode: pendingPaymentMode
         };
         await api.post('/collections', payload);
       }
       setSelectedDues({});
       setPendingDuesRemarks('');
       setPendingPaymentMode('CASH');
       fetchPendingDues();
       showToast("Successfully recorded payments!", "success");
    } catch (error) {
       console.error("Failed to record payments", error);
       showToast("An error occurred while recording payments.", "error");
    } finally {
       setRecordingPayments(false);
    }
  };

  // === TAB 3: PAYOUT PLANS LOGIC ===
  const fetchPayoutPlans = async () => {
    try {
      const response = await api.get(`/payouts/chit/${id}/plans`);
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
  };

  const handlePlanChange = (index, field, value) => {
    const updated = [...payoutPlansState];
    updated[index][field] = value;
    setPayoutPlansState(updated);
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
          showToast("The selected chit group does not have any payout plans configured yet.", "warning");
          setSelectedSourceChit('');
        }
      } catch (error) {
        console.error("Failed to fetch source payout plans", error);
      }
    }
  };

  const onSavePlans = async () => {
    setSavingPlans(true);
    try {
      const payload = payoutPlansState.map(p => ({
        monthNumber: Number(p.monthNumber),
        payoutAmount: Number(p.payoutAmount),
        expectedPayoutCount: Number(p.expectedPayoutCount)
      }));
      await api.post(`/payouts/chit/${id}/plans`, payload);
      showToast("Payout plans saved successfully!", "success");
    } catch (error) {
      console.error('Failed to save payout plans', error);
      showToast("Failed to save payout plans.", "error");
    } finally {
      setSavingPlans(false);
    }
  };

  // === TAB 4: LEDGER LOGIC ===
  const fetchLedgerData = async () => {
    setLoadingLedger(true);
    setLedgerData([]);
    try {
      const res = await api.get(`/collections/chit/${id}`);
      const groups = {};
      const list = res.data || [];
      list.forEach(c => {
        if (c.status === 'PAID') {
          const key = `${c.memberId}-${c.paymentDate}-${c.remarks || ''}-${c.paymentMode || ''}`;
          if (!groups[key]) {
            groups[key] = {
              memberName: c.memberName,
              paymentDate: c.paymentDate,
              remarks: c.remarks || '-',
              paymentMode: c.paymentMode,
              totalPaid: 0,
              payments: []
            };
          }
          groups[key].totalPaid += c.amountPaid;
          groups[key].payments.push(c);
        }
      });
      
      // Post process groups to combine clearedMonths per grouping
      const processed = Object.values(groups).map(g => {
        const cleared = g.payments.map(p => g.payments.length > 0 ? p.forMonth : null).filter(m => m !== null);
        return {
          memberName: g.memberName,
          paymentDate: g.paymentDate,
          remarks: g.remarks,
          paymentMode: g.paymentMode,
          totalPaid: g.totalPaid,
          clearedMonths: [...new Set(cleared)],
          payments: g.payments.map(p => ({
            paymentDate: p.paymentDate,
            totalAmountPaid: p.amountPaid,
            clearedMonths: [p.forMonth],
            remarks: p.remarks,
            paymentMode: p.paymentMode
          }))
        };
      });

      const sorted = processed.sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate));
      setLedgerData(sorted);
    } catch (error) {
      console.error("Failed to load chit ledger data", error);
    } finally {
      setLoadingLedger(false);
    }
  };

  const handleResetFilters = () => {
    setLedgerMemberFilter('ALL');
    setLedgerMonthFilter('ALL');
    setLedgerPaymentModeFilter('ALL');
    setSearchQueryLedger('');
    setLedgerCalendarMonthFilter(new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }));
  };

  // Delete Chit Group
  const handleDeleteChit = async () => {
    const confirmed = await confirm({
      title: 'Delete Chit Group',
      message: 'Are you sure you want to delete this chit group? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      severity: 'error'
    });
    
    if (confirmed) {
      try {
        await api.delete(`/chits/${id}`);
        navigate('/chits');
      } catch (error) {
        console.error('Failed to delete chit group', error);
        showToast("Could not delete the chit group. It might have associated records like members or payouts.", "error");
      }
    }
  };

  if (loadingChit) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '60vh', gap: 2 }}>
        <CircularProgress size={45} />
        <Typography variant="body2" color="text.secondary">Loading chit workspace...</Typography>
      </Box>
    );
  }

  if (!chit) return null;

  const initials = getInitials(chit.name);
  const gradient = getAvatarGradient(chit.name);
  const runningMonth = getRunningMonth(chit.startMonth, chit.durationMonths);
  const progressPercent = (runningMonth / chit.durationMonths) * 100;

  return (
    <Box sx={{ width: '100%', overflowX: 'hidden' }}>
      {/* Back to List & Delete header row */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, gap: 1.5 }}>
        <Button 
          variant="outlined" 
          startIcon={<ArrowLeft size={16} />} 
          onClick={() => navigate('/chits')}
          size="small"
          sx={{ fontWeight: 'bold', border: '1.5px solid', '&:hover': { border: '1.5px solid' } }}
        >
          {isMobile ? "Back" : "Back to Groups"}
        </Button>
        <Button 
          variant="outlined" 
          color="error" 
          startIcon={<Trash2 size={16} />} 
          onClick={handleDeleteChit}
          size="small"
          sx={{ fontWeight: 'bold', border: '1.5px solid', '&:hover': { border: '1.5px solid' } }}
        >
          {isMobile ? "Delete" : "Delete Group"}
        </Button>
      </Box>

      {/* Main Header Card */}
      <Card sx={{ p: { xs: 2, sm: 3 }, mb: 3, display: 'flex', flexDirection: 'column', gap: { xs: 2, sm: 3 } }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2.5, alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'space-between', minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.5, sm: 2.5 }, minWidth: 0, width: '100%' }}>
            {/* Round Avatar badge */}
            <Box sx={{
              width: { xs: 40, sm: 50 },
              height: { xs: 40, sm: 50 },
              borderRadius: '12px',
              background: gradient,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: { xs: '1rem', sm: '1.25rem' },
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
              border: '2px solid',
              borderColor: 'background.paper',
              flexShrink: 0
            }}>
              {initials}
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant={isMobile ? "subtitle1" : "h5"} sx={{ fontWeight: 850, color: 'text.primary', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {chit.name}
              </Typography>
              <Box sx={{ display: 'flex', gap: { xs: 1, sm: 1.5 }, alignItems: 'center', mt: 0.5, flexWrap: 'wrap' }}>
                <Chip 
                  label={chit.status} 
                  color={chit.status === 'ACTIVE' ? 'success' : 'default'} 
                  size="small" 
                  sx={{ fontWeight: 800, fontSize: '0.62rem', height: 18 }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  ₹{chit.totalAmount.toLocaleString()} • {chit.durationMonths} Months
                </Typography>
              </Box>
            </Box>
          </Box>

          <Box sx={{ minWidth: { xs: '100%', sm: 140 }, textAlign: { xs: 'left', sm: 'right' }, borderTop: { xs: '1px solid', sm: 'none' }, pt: { xs: 1.5, sm: 0 }, mt: { xs: 0.5, sm: 0 } }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 700 }}>ASSIGNED MEMBERS</Typography>
            <Typography variant="h5" sx={{ fontWeight: 800, color: chit.assignedMemberCount === chit.memberCount ? 'success.main' : 'warning.main' }}>
              {chit.assignedMemberCount || 0} / {chit.memberCount}
            </Typography>
          </Box>
        </Box>

        {/* Dashboard upper metadata block */}
        <Grid container spacing={{ xs: 2, sm: 3 }}>
          {/* Progress Card */}
          <Grid item xs={12} sm={6} sx={{ width: { xs: '100%', sm: 'auto' } }}>
            <Paper variant="outlined" sx={{ p: 2, width: '100%', boxSizing: 'border-box', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 1.5, backgroundColor: 'action.hover', border: '1px solid', borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 0.5 }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>SCHEME PROGRESS</Typography>
                <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 800 }}>
                  Month {runningMonth} of {chit.durationMonths}
                </Typography>
              </Box>
              <Box sx={{ width: '100%', height: '8px', borderRadius: '4px', backgroundColor: 'background.paper', position: 'relative', overflow: 'hidden' }}>
                <Box sx={{ 
                  width: `${progressPercent}%`, 
                  height: '100%', 
                  borderRadius: '4px', 
                  background: 'linear-gradient(90deg, #6366f1 0%, #818cf8 100%)',
                  boxShadow: '0 0 8px rgba(99, 102, 241, 0.4)'
                }} />
              </Box>
            </Paper>
          </Grid>

          {/* Details Grid Card */}
          <Grid item xs={12} sm={6} sx={{ width: { xs: '100%', sm: 'auto' } }}>
            <Paper variant="outlined" sx={{ p: 2, width: '100%', boxSizing: 'border-box', height: '100%', backgroundColor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.2 }}>Monthly Contribution</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    ₹{chit.monthlyCollection?.toLocaleString() || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.2 }}>Start Month</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>{chit.startMonth || '-'}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.2 }}>Dividend Strategy</Typography>
                  <Chip 
                    label={chit.strategyType === 'FIXED_COMMISSION_PROGRESSIVE' ? 'Fixed Commission' : 'Incremental Contribution'} 
                    size="small" 
                    variant="outlined" 
                    sx={{ fontWeight: 700, fontSize: '0.68rem', borderColor: 'divider' }} 
                  />
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      </Card>

      {/* Tabs Navigator */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3, width: '100%', minWidth: 0, overflow: 'hidden' }}>
        <Tabs 
          value={tabValue} 
          onChange={(e, newVal) => setTabValue(newVal)} 
          variant={isMobile ? "scrollable" : "standard"}
          scrollButtons="auto"
          sx={{
            width: '100%',
            '& .MuiTab-root': { fontWeight: 800, textTransform: 'none', fontSize: '0.85rem', py: 1.5 },
            '& .Mui-selected': { color: 'primary.main' }
          }}
        >
          <Tab icon={<Users size={16} />} iconPosition="start" label="Members" />
          <Tab icon={<Clock size={16} />} iconPosition="start" label="Pending Dues" />
          <Tab icon={<Settings2 size={16} />} iconPosition="start" label="Payout Plans" />
          <Tab icon={<Receipt size={16} />} iconPosition="start" label="Ledger" />
        </Tabs>
      </Box>

      {/* Tab Panels */}
      
      {/* TAB 1: MEMBERS */}
      {tabValue === 0 && (
        <Card sx={{ p: { xs: 2, sm: 3 } }}>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, justifyContent: 'space-between', mb: 3 }}>
            {/* Inline Assign Member UI */}
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 1.5, width: { xs: '100%', md: 450 }, alignItems: 'stretch' }}>
              <FormControl fullWidth size="small">
                <InputLabel>Select Member to Assign</InputLabel>
                <Select
                  value={selectedMemberToAssign}
                  label="Select Member to Assign"
                  onChange={(e) => setSelectedMemberToAssign(e.target.value)}
                >
                  <MenuItem value="" disabled>-- Select a Member --</MenuItem>
                  {allMembers
                    .filter(m => !assignedMembers.some(am => am.id === m.id && assignedMembers.filter(am2 => am2.id === m.id).length >= 5)) // Arbitrary slot limit
                    .map((member) => (
                      <MenuItem key={member.id} value={member.id}>
                        {member.name} - {member.phone}
                      </MenuItem>
                    ))
                  }
                </Select>
              </FormControl>
              <Button 
                variant="contained" 
                startIcon={<UserPlus size={16} />} 
                onClick={handleAssignMember}
                disabled={!selectedMemberToAssign}
                size="medium"
                sx={{ px: 3, py: { xs: 1, sm: 'auto' }, fontWeight: 'bold', whiteSpace: 'nowrap' }}
              >
                Assign
              </Button>
            </Box>

            {/* Search Assigned Members */}
            <TextField
              placeholder="Search assigned..."
              value={searchQueryMembers}
              onChange={(e) => setSearchQueryMembers(e.target.value)}
              size="small"
              sx={{ width: { xs: '100%', md: 250 } }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search size={16} color="#888" />
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          {loadingMembers ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress size={30} />
            </Box>
          ) : (() => {
            const sortedAssignedMembers = [...assignedMembers].sort((a, b) => a.name.localeCompare(b.name));
            const filteredAssigned = sortedAssignedMembers.filter(m =>
              m.name && m.name.toLowerCase().includes(searchQueryMembers.toLowerCase())
            );

            if (assignedMembers.length === 0) {
              return (
                <Typography color="text.secondary" align="center" sx={{ py: 4, fontStyle: 'italic' }}>
                  No members assigned to this group yet. Use the selector above to assign them!
                </Typography>
              );
            }

            if (filteredAssigned.length === 0) {
              return (
                <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
                  No assigned members match your search query.
                </Typography>
              );
            }

            if (isMobile) {
              return (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {filteredAssigned.map(m => (
                    <Card key={m.chitMemberId || m.id} sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'background.paper', border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
                      <Box sx={{ minWidth: 0, mr: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: 'text.primary', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {m.name} {m.slotIndex ? `(Spot #${m.slotIndex})` : ''}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Phone: {m.phone || '-'}
                        </Typography>
                      </Box>
                      <IconButton 
                        size="small" 
                        color="error" 
                        onClick={() => handleRemoveMember(m.chitMemberId || m.id)} 
                        title="Remove Assignment"
                        sx={{ flexShrink: 0 }}
                      >
                        <Trash2 size={16} />
                      </IconButton>
                    </Card>
                  ))}
                </Box>
              );
            }

            return (
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'action.hover' }}>
                    <TableCell sx={{ fontWeight: 'bold', pl: 3 }}>Member Name</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Phone Number</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', pr: 3 }} align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredAssigned.map(m => (
                    <TableRow key={m.chitMemberId || m.id} hover>
                      <TableCell sx={{ fontWeight: 'bold', pl: 3 }}>
                        {m.name} {m.slotIndex ? `(Spot #${m.slotIndex})` : ''}
                      </TableCell>
                      <TableCell>{m.phone}</TableCell>
                      <TableCell sx={{ pr: 3 }} align="right">
                        <IconButton 
                          size="small" 
                          color="error" 
                          onClick={() => handleRemoveMember(m.chitMemberId || m.id)} 
                          title="Remove Assignment"
                        >
                          <Trash2 size={16} />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            );
          })()}
        </Card>
      )}

      {/* TAB 2: PENDING DUES */}
      {tabValue === 1 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Payment collection drawer card */}
          <Card sx={{ p: { xs: 2, sm: 3 } }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={4}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 700 }}>TOTAL OUTSTANDING</Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, color: 'error.main' }}>
                  ₹{pendingDuesData?.totalPendingAmount?.toLocaleString() || 0}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 700 }}>SELECTED TO RECORD</Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, color: 'success.main' }}>
                  ₹{Object.values(selectedDues).reduce((sum, d) => sum + Number(d.amountDue), 0).toLocaleString()}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={4} sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
                <Button
                  variant="contained"
                  color="success"
                  disabled={Object.keys(selectedDues).length === 0 || recordingPayments}
                  onClick={handleRecordPayments}
                  sx={{ py: 1.2, px: 4, fontWeight: 'bold', width: '100%' }}
                >
                  {recordingPayments ? 'Recording...' : 'Record Payment'}
                </Button>
              </Grid>
              {Object.keys(selectedDues).length > 0 && (
                <>
                  <Grid item xs={12} sm={4}>
                    <FormControl fullWidth size="small">
                      <InputLabel id="pending-payment-mode-label">Payment Mode</InputLabel>
                      <Select
                        labelId="pending-payment-mode-label"
                        value={pendingPaymentMode}
                        label="Payment Mode"
                        onChange={(e) => setPendingPaymentMode(e.target.value)}
                      >
                        <MenuItem value="PHONEPE">PhonePe</MenuItem>
                        <MenuItem value="GPAY">GPay</MenuItem>
                        <MenuItem value="CASH">Cash</MenuItem>
                        <MenuItem value="OTHER">Other</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={8}>
                    <TextField
                      fullWidth
                      label="Payment Remarks / Reference"
                      placeholder="e.g., Paid cash / Bank transfer ID"
                      size="small"
                      value={pendingDuesRemarks}
                      onChange={(e) => setPendingDuesRemarks(e.target.value)}
                    />
                  </Grid>
                </>
              )}
            </Grid>
          </Card>

          {/* Pending members list */}
          <Card sx={{ p: { xs: 2, sm: 3 } }}>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, mb: 3 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                Pending Dues by Member
              </Typography>
              <TextField
                placeholder="Search member..."
                value={searchQueryPendingDues}
                onChange={(e) => setSearchQueryPendingDues(e.target.value)}
                size="small"
                sx={{ width: { xs: '100%', sm: 250 } }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search size={16} color="#888" />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            {loadingPendingDues ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                <CircularProgress size={30} />
              </Box>
            ) : (() => {
              if (!pendingDuesData) return null;

              const groupedPending = [];
              const groupedMap = {};
              (pendingDuesData.membersPending || []).forEach(m => {
                if (!groupedMap[m.memberId]) {
                  groupedMap[m.memberId] = {
                    memberId: m.memberId,
                    memberName: m.memberName,
                    memberPhone: m.memberPhone,
                    totalPending: 0,
                    slots: []
                  };
                  groupedPending.push(groupedMap[m.memberId]);
                }
                groupedMap[m.memberId].slots.push(m);
                groupedMap[m.memberId].totalPending += m.totalPending;
              });

              // Sort alphabetically
              groupedPending.sort((a, b) => a.memberName.localeCompare(b.memberName));

              const filteredPending = groupedPending.filter(item =>
                item.memberName && item.memberName.toLowerCase().includes(searchQueryPendingDues.toLowerCase())
              );

              if (groupedPending.length === 0) {
                return (
                  <Typography color="success.main" align="center" sx={{ py: 4, fontWeight: 'bold' }}>
                    🎉 No outstanding dues! All settled.
                  </Typography>
                );
              }

              if (filteredPending.length === 0) {
                return (
                  <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
                    No pending members match your search query.
                  </Typography>
                );
              }

              if (isMobile) {
                return (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {filteredPending.map(groupedMember => (
                      <MobilePendingMemberCard
                        key={groupedMember.memberId}
                        groupedMember={groupedMember}
                        selectedDues={selectedDues}
                        pendingDuesData={pendingDuesData}
                        handlePastDuesToggle={handlePastDuesToggle}
                        handleCheckboxChange={handleCheckboxChange}
                      />
                    ))}
                  </Box>
                );
              }

              return (
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
                    {filteredPending.map((groupedMember) => (
                      <TableRow key={groupedMember.memberId} hover>
                        <TableCell sx={{ fontWeight: 'bold', pl: 3 }}>
                          {groupedMember.memberName}
                          {groupedMember.slots.length > 1 && (
                            <Typography variant="caption" display="block" color="text.secondary">
                              ({groupedMember.slots.length} spots)
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>{groupedMember.memberPhone || '-'}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, py: 1 }}>
                            {groupedMember.slots.map((slot, sIdx) => {
                              const label = groupedMember.slots.length > 1 ? `Spot #${sIdx + 1}: ` : '';
                              const currentMonthNum = pendingDuesData.currentMonth;
                              const pastPending = slot.pendingMonths.filter(pm => pm.monthNumber < currentMonthNum);
                              const currentOrFuturePending = slot.pendingMonths.filter(pm => pm.monthNumber >= currentMonthNum);
                              
                              const pastTotal = pastPending.reduce((sum, pm) => sum + pm.amountDue, 0);
                              const isPastChecked = pastPending.length > 0 && pastPending.every(pm => !!selectedDues[`${slot.chitMemberId}-${pm.monthNumber}`]);
                              
                              return (
                                <Box key={slot.chitMemberId} sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                  {label && <Typography variant="caption" sx={{ fontWeight: 'bold', minWidth: 60 }}>{label}</Typography>}
                                  {pastPending.length > 0 && (
                                    <Chip
                                      label={`Past Dues: ₹${pastTotal.toLocaleString()}`}
                                      color={isPastChecked ? "primary" : "default"}
                                      variant={isPastChecked ? "contained" : "outlined"}
                                      onClick={() => handlePastDuesToggle(slot.chitMemberId, pastPending, isPastChecked, groupedMember.memberId)}
                                      sx={{ 
                                        cursor: 'pointer',
                                        fontSize: '0.8rem',
                                        fontWeight: isPastChecked ? 'bold' : 'normal',
                                        height: 26
                                      }}
                                    />
                                  )}
                                  {currentOrFuturePending.map(pm => {
                                    const key = `${slot.chitMemberId}-${pm.monthNumber}`;
                                    const isChecked = !!selectedDues[key];
                                    return (
                                      <Chip
                                        key={pm.monthNumber}
                                        label={`M${pm.monthNumber}: ₹${pm.amountDue.toLocaleString()}`}
                                        color={isChecked ? "primary" : "default"}
                                        variant={isChecked ? "contained" : "outlined"}
                                        onClick={() => handleCheckboxChange(slot.chitMemberId, pm.monthNumber, pm.amountDue, groupedMember.memberId)}
                                        sx={{ 
                                          cursor: 'pointer',
                                          fontSize: '0.8rem',
                                          fontWeight: isChecked ? 'bold' : 'normal',
                                          height: 26
                                        }}
                                      />
                                    );
                                  })}
                                </Box>
                              );
                            })}
                          </Box>
                        </TableCell>
                        <TableCell sx={{ pr: 3, fontWeight: 'bold' }} align="right">
                          ₹{groupedMember.totalPending?.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              );
            })()}
          </Card>
        </Box>
      )}

      {/* TAB 3: PAYOUT PLANS */}
      {tabValue === 2 && (
        <Card sx={{ p: { xs: 2, sm: 3 } }}>
          <Box sx={{ mb: 4, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: { xs: 'stretch', sm: 'center' } }}>
            <FormControl sx={{ minWidth: { xs: '100%', sm: 350 } }} size="small">
              <InputLabel>Copy Configuration from Existing Group</InputLabel>
              <Select
                value={selectedSourceChit}
                label="Copy Configuration from Existing Group"
                onChange={handleCopyPlanFromChit}
              >
                <MenuItem value=""><em>None (Configure from scratch)</em></MenuItem>
                {allChits
                  .filter(c => c.id !== Number(id) && c.durationMonths === chit.durationMonths)
                  .map(c => (
                    <MenuItem key={c.id} value={c.id}>
                      {c.name} ({c.durationMonths} months)
                    </MenuItem>
                  ))
                }
              </Select>
            </FormControl>
            <Typography variant="body2" color="text.secondary">
              Select an existing group of the same duration ({chit.durationMonths} months) to copy its payout structure.
            </Typography>
          </Box>

          {isMobile ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {payoutPlansState.map((plan, index) => (
                <MobilePayoutPlanCard
                  key={index}
                  plan={plan}
                  index={index}
                  handlePlanChange={handlePlanChange}
                />
              ))}
            </Box>
          ) : (
            <Box sx={{ overflowX: 'auto', width: '100%', mb: 3 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold', width: 150 }}>Month Number</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Payout Amount (₹)</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', width: 200 }}>Number of Persons</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {payoutPlansState.map((plan, index) => (
                    <TableRow key={index}>
                      <TableCell sx={{ fontWeight: 'bold' }}>Month {plan.monthNumber}</TableCell>
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
            </Box>
          )}

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
            <Button
              variant="contained"
              onClick={onSavePlans}
              disabled={savingPlans}
              sx={{ py: 1.2, px: 4, fontWeight: 'bold', width: { xs: '100%', sm: 'auto' } }}
            >
              {savingPlans ? 'Saving...' : 'Save Configuration'}
            </Button>
          </Box>
        </Card>
      )}

      {/* TAB 4: LEDGER HISTORY */}
      {tabValue === 3 && (
        <Card sx={{ p: { xs: 2, sm: 3 } }}>
          {/* Header Row */}
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 1.5, justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, mb: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
              <Receipt size={18} /> Transaction Log
            </Typography>
            {(() => {
              const currentMonthLabel = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
              const availableCalendarMonths = [...new Set(ledgerData.map(item => {
                if (!item.paymentDate) return null;
                const date = new Date(item.paymentDate);
                return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
              }).filter(Boolean))];
              const allDropdownMonths = [...new Set([currentMonthLabel, ...availableCalendarMonths])];

              const activeCount = [
                ledgerMemberFilter !== 'ALL',
                ledgerMonthFilter !== 'ALL',
                ledgerPaymentModeFilter !== 'ALL',
                !!searchQueryLedger
              ].filter(Boolean).length;
              
              return (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: { xs: '100%', sm: 'auto' }, justifyContent: 'space-between' }}>
                  <FormControl size="small" sx={{ minWidth: 150 }}>
                    <Select
                      value={ledgerCalendarMonthFilter}
                      onChange={(e) => setLedgerCalendarMonthFilter(e.target.value)}
                      sx={{
                        borderRadius: '10px',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        height: 32,
                        backgroundColor: 'background.paper',
                        '& .MuiSelect-select': { py: 0.5 }
                      }}
                    >
                      <MenuItem value="ALL" sx={{ fontSize: '0.82rem' }}>All Months</MenuItem>
                      {allDropdownMonths.map(m => (
                        <MenuItem key={m} value={m} sx={{ fontSize: '0.82rem' }}>{m}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => setFilterDialogOpen(true)}
                    startIcon={<Filter size={15} />}
                    sx={{
                      borderRadius: '10px',
                      textTransform: 'none',
                      fontWeight: 600,
                      borderColor: 'divider',
                      color: 'text.primary',
                      px: 2,
                      height: 32,
                      fontSize: '0.82rem',
                      '&:hover': {
                        borderColor: 'primary.main',
                        backgroundColor: 'action.hover'
                      }
                    }}
                  >
                    Filter {activeCount > 0 && `(${activeCount})`}
                  </Button>
                </Box>
              );
            })()}
          </Box>

          {/* Active Filter Chips */}
          {(() => {
            const hasActiveFilters = ledgerMemberFilter !== 'ALL' || ledgerMonthFilter !== 'ALL' || ledgerPaymentModeFilter !== 'ALL' || !!searchQueryLedger;
            if (!hasActiveFilters) return null;
            
            return (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2.5, alignItems: 'center' }}>
                {ledgerMemberFilter !== 'ALL' && (
                  <Chip
                    label={`Member: ${ledgerMemberFilter}`}
                    size="small"
                    onDelete={() => setLedgerMemberFilter('ALL')}
                    sx={{ borderRadius: '8px', fontSize: '0.75rem', height: 24 }}
                  />
                )}
                {ledgerMonthFilter !== 'ALL' && (
                  <Chip
                    label={`Month: ${ledgerMonthFilter}`}
                    size="small"
                    onDelete={() => setLedgerMonthFilter('ALL')}
                    sx={{ borderRadius: '8px', fontSize: '0.75rem', height: 24 }}
                  />
                )}
                {ledgerPaymentModeFilter !== 'ALL' && (
                  <Chip
                    label={`Mode: ${ledgerPaymentModeFilter}`}
                    size="small"
                    onDelete={() => setLedgerPaymentModeFilter('ALL')}
                    sx={{ borderRadius: '8px', fontSize: '0.75rem', height: 24 }}
                  />
                )}
                {searchQueryLedger && (
                  <Chip
                    label={`Search: "${searchQueryLedger}"`}
                    size="small"
                    onDelete={() => setSearchQueryLedger('')}
                    sx={{ borderRadius: '8px', fontSize: '0.75rem', height: 24 }}
                  />
                )}
                <Button
                  size="small"
                  onClick={handleResetFilters}
                  sx={{ textTransform: 'none', fontSize: '0.75rem', minWidth: 0, p: 0, ml: 0.5, color: 'text.secondary' }}
                >
                  Clear All
                </Button>
              </Box>
            );
          })()}

          {/* Filter Dialog */}
          <Dialog
            open={filterDialogOpen}
            onClose={() => setFilterDialogOpen(false)}
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
              <Typography variant="h6" sx={{ fontWeight: 800, fontFamily: "'Outfit', sans-serif", display: 'flex', alignItems: 'center', gap: 1 }}>
                <Filter size={18} /> Filter Transactions
              </Typography>
              <IconButton size="small" onClick={() => setFilterDialogOpen(false)}>
                <X size={18} />
              </IconButton>
            </DialogTitle>
            <DialogContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1.5 }}>
                <FormControl size="small" fullWidth>
                  <InputLabel id="dialog-member-filter-label">Filter by Member</InputLabel>
                  <Select
                    labelId="dialog-member-filter-label"
                    value={ledgerMemberFilter}
                    label="Filter by Member"
                    onChange={(e) => setLedgerMemberFilter(e.target.value)}
                  >
                    <MenuItem value="ALL">All Members</MenuItem>
                    {(() => {
                      const ledgerMemberNames = ledgerData.map(item => item.memberName).filter(Boolean);
                      const assignedMemberNames = assignedMembers.map(am => am.name).filter(Boolean);
                      const uniqueMemberNames = [...new Set([...assignedMemberNames, ...ledgerMemberNames])].sort((a, b) => a.localeCompare(b));
                      return uniqueMemberNames.map(name => (
                        <MenuItem key={name} value={name}>{name}</MenuItem>
                      ));
                    })()}
                  </Select>
                </FormControl>

                <FormControl size="small" fullWidth>
                  <InputLabel id="dialog-month-filter-label">Filter by Chit Month</InputLabel>
                  <Select
                    labelId="dialog-month-filter-label"
                    value={ledgerMonthFilter}
                    label="Filter by Chit Month"
                    onChange={(e) => setLedgerMonthFilter(e.target.value)}
                  >
                    <MenuItem value="ALL">All Months</MenuItem>
                    {Array.from({ length: chit?.durationMonths || 0 }, (_, i) => i + 1).map(m => (
                      <MenuItem key={m} value={m.toString()}>Month {m}</MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl size="small" fullWidth>
                  <InputLabel id="dialog-payment-mode-filter-label">Filter by Mode</InputLabel>
                  <Select
                    labelId="dialog-payment-mode-filter-label"
                    value={ledgerPaymentModeFilter}
                    label="Filter by Mode"
                    onChange={(e) => setLedgerPaymentModeFilter(e.target.value)}
                  >
                    <MenuItem value="ALL">All Payment Modes</MenuItem>
                    <MenuItem value="PHONEPE">PhonePe</MenuItem>
                    <MenuItem value="GPAY">GPay</MenuItem>
                    <MenuItem value="CASH">Cash</MenuItem>
                    <MenuItem value="OTHER">Other</MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  fullWidth
                  placeholder="Search remarks, name..."
                  value={searchQueryLedger}
                  onChange={(e) => setSearchQueryLedger(e.target.value)}
                  size="small"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search size={16} color="#888" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2.5, pt: 1.5, display: 'flex', gap: 1.5 }}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => {
                  handleResetFilters();
                  setFilterDialogOpen(false);
                }}
                sx={{
                  borderRadius: '12px',
                  textTransform: 'none',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  fontFamily: "'Outfit', sans-serif",
                  py: 0.75,
                  borderColor: 'divider',
                  color: 'text.secondary',
                  '&:hover': {
                    borderColor: 'text.primary',
                    backgroundColor: 'transparent'
                  }
                }}
              >
                Reset All
              </Button>
              <Button
                fullWidth
                variant="contained"
                onClick={() => setFilterDialogOpen(false)}
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
                Apply Filters
              </Button>
            </DialogActions>
          </Dialog>

          {loadingLedger ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress size={30} />
            </Box>
          ) : (() => {
            const filteredLedger = ledgerData.filter(item => {
              const searchLower = searchQueryLedger.toLowerCase();
              const matchesSearch = !searchQueryLedger ||
                (item.memberName && item.memberName.toLowerCase().includes(searchLower)) ||
                (item.remarks && item.remarks.toLowerCase().includes(searchLower)) ||
                (item.paymentMode && item.paymentMode.toLowerCase().includes(searchLower));
              
              const matchesMode = ledgerPaymentModeFilter === 'ALL' || item.paymentMode === ledgerPaymentModeFilter;
              const matchesMember = ledgerMemberFilter === 'ALL' || item.memberName === ledgerMemberFilter;
              const matchesMonth = ledgerMonthFilter === 'ALL' || item.clearedMonths.includes(Number(ledgerMonthFilter));
              
              const matchesCalendarMonth = ledgerCalendarMonthFilter === 'ALL' || (() => {
                if (!item.paymentDate) return false;
                const date = new Date(item.paymentDate);
                const monthLabel = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                return monthLabel === ledgerCalendarMonthFilter;
              })();
              
              return matchesSearch && matchesMode && matchesMember && matchesMonth && matchesCalendarMonth;
            });

            // Group filteredLedger by calendar month
            const groups = {};
            filteredLedger.forEach(item => {
              if (!item.paymentDate) return;
              const date = new Date(item.paymentDate);
              const monthLabel = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
              if (!groups[monthLabel]) {
                groups[monthLabel] = {
                  label: monthLabel,
                  totalReceived: 0,
                  items: []
                };
              }
              groups[monthLabel].totalReceived += item.totalPaid;
              groups[monthLabel].items.push(item);
            });

            // Sort groups by date descending (latest first)
            const sortedGroups = Object.values(groups).sort((a, b) => {
              return new Date(b.items[0].paymentDate) - new Date(a.items[0].paymentDate);
            });

            if (ledgerData.length === 0) {
              return (
                <Typography color="text.secondary" align="center" sx={{ py: 4, fontStyle: 'italic' }}>
                  No payments recorded yet for this group.
                </Typography>
              );
            }

            if (filteredLedger.length === 0) {
              return (
                <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
                  No transactions match your search query.
                </Typography>
              );
            }

            if (isMobile) {
              return (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                  {sortedGroups.map((group) => (
                    <Box key={group.label} sx={{ display: 'flex', flexDirection: 'column', gap: 1.2 }}>
                      {/* Month Section Header */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 1.5, py: 0.8, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: theme => theme.palette.mode === 'light' ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.02)', borderRadius: '6px' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary', fontFamily: "'Outfit', sans-serif" }}>
                          {group.label}
                        </Typography>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'success.main', fontFamily: "'Outfit', sans-serif" }}>
                          Total: ₹{group.totalReceived.toLocaleString()}
                        </Typography>
                      </Box>
                      {/* Month Transactions */}
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {group.items.map((memberGroup, idx) => (
                          <MobileLedgerRow key={idx} memberGroup={memberGroup} />
                        ))}
                      </Box>
                    </Box>
                  ))}
                </Box>
              );
            }

            return (
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'action.hover' }}>
                    <TableCell sx={{ fontWeight: 'bold', pl: 3 }}>Member Name</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Payment Date</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Cleared Months</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Payment Mode</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Remarks</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', pr: 3 }} align="right">Amount Paid</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sortedGroups.map((group) => (
                    <React.Fragment key={group.label}>
                      {/* Calendar Month Header Row */}
                      <TableRow sx={{ backgroundColor: theme => theme.palette.mode === 'light' ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)' }}>
                        <TableCell colSpan={5} sx={{ fontWeight: 'bold', py: 1.5, pl: 3 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary', fontFamily: "'Outfit', sans-serif" }}>
                            {group.label}
                          </Typography>
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold', py: 1.5, pr: 3 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'success.main', fontFamily: "'Outfit', sans-serif" }}>
                            Total: ₹{group.totalReceived.toLocaleString()}
                          </Typography>
                        </TableCell>
                      </TableRow>
                      
                      {/* Transactions for this Month */}
                      {group.items.map((row, idx) => (
                        <TableRow key={idx} hover>
                          <TableCell sx={{ fontWeight: 'bold', pl: 3 }}>{row.memberName}</TableCell>
                          <TableCell>{row.paymentDate}</TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {row.clearedMonths.sort((a, b) => a - b).map(m => (
                                <Chip
                                  key={m}
                                  label={`Month ${m}`}
                                  size="small"
                                  color="secondary"
                                  variant="outlined"
                                  sx={{ fontSize: '0.72rem', height: 20 }}
                                />
                              ))}
                            </Box>
                          </TableCell>
                          <TableCell>
                            {row.paymentMode ? (
                              <Chip
                                label={row.paymentMode}
                                size="small"
                                color="primary"
                                variant="outlined"
                                sx={{ fontWeight: 'bold', fontSize: '0.72rem', height: 20 }}
                              />
                            ) : (
                              '-'
                            )}
                          </TableCell>
                          <TableCell>{row.remarks}</TableCell>
                          <TableCell sx={{ pr: 3, fontWeight: 'bold', color: 'success.main' }} align="right">
                            ₹{row.totalPaid.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            );
          })()}
        </Card>
      )}

    </Box>
  );
};

export default ChitDetails;
