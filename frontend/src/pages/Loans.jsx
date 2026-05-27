import React, { useState, useEffect } from 'react';
import { Box, Card, CardContent, Typography, Grid, Table, TableBody, TableCell, TableHead, TableRow, MenuItem, Select, FormControl, InputLabel, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Chip, Divider } from '@mui/material';
import { Landmark, ArrowUpRight, CheckCircle, Clock, Percent, DollarSign, Calendar } from 'lucide-react';
import api from '../api/axiosConfig';

const StatCard = ({ title, value, icon, color }) => (
  <Card sx={{ height: '100%', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-2px)' } }}>
    <CardContent>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography color="text.secondary" variant="subtitle2" sx={{ fontWeight: 500 }} gutterBottom>
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

const Loans = () => {
  const [loans, setLoans] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openCreate, setOpenCreate] = useState(false);
  const [openClose, setOpenClose] = useState(false);
  const [openCollectInterest, setOpenCollectInterest] = useState(false);
  const [openPaymentsLog, setOpenPaymentsLog] = useState(false);

  // Issue Loan Form State
  const [newLoan, setNewLoan] = useState({
    memberId: '',
    amount: '',
    interestRate: '',
    startDate: new Date().toISOString().split('T')[0],
    remarks: '',
    interestType: 'ACCUMULATED'
  });

  // Close Loan Dialog State
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [closeDate, setCloseDate] = useState(new Date().toISOString().split('T')[0]);
  const [interestPreview, setInterestPreview] = useState({ days: 0, interest: 0, collected: 0, remaining: 0, total: 0 });

  // Collect Interest Dialog State
  const [interestPayment, setInterestPayment] = useState({
    amount: '',
    paymentDate: new Date().toISOString().split('T')[0],
    remarks: ''
  });

  // Payments log viewer state
  const [payments, setPayments] = useState([]);
  const [paymentsLoan, setPaymentsLoan] = useState(null);

  const fetchLoansAndMembers = async () => {
    setLoading(true);
    try {
      const [loansRes, membersRes] = await Promise.all([
        api.get('/loans'),
        api.get('/members')
      ]);
      setLoans(loansRes.data || []);
      setMembers(membersRes.data || []);
    } catch (error) {
      console.error('Failed to load loans data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoansAndMembers();
  }, []);

  // Recalculate preview in closing modal whenever closeDate changes
  useEffect(() => {
    if (selectedLoan && closeDate) {
      const start = new Date(selectedLoan.startDate);
      const end = new Date(closeDate);
      
      const startYear = start.getFullYear();
      const startMonth = start.getMonth(); // 0-11
      const startDay = start.getDate();
      
      const endYear = end.getFullYear();
      const endMonth = end.getMonth();
      const endDay = end.getDate();
      
      let yearsDiff = endYear - startYear;
      let monthsDiff = endMonth - startMonth;
      let daysDiff = endDay - startDay;

      const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
      const isStartLastDay = startDay === getDaysInMonth(startYear, startMonth);
      const isEndLastDay = endDay === getDaysInMonth(endYear, endMonth);
      
      if (isStartLastDay && isEndLastDay) {
        daysDiff = 0;
      }
      
      let elapsedMonths = yearsDiff * 12 + monthsDiff;
      if (daysDiff === -1 || daysDiff === 0) {
        // Treated as full month/year cycle
      } else {
        elapsedMonths += daysDiff / 30.0;
      }

      if (elapsedMonths < 0) elapsedMonths = 0;

      const principal = Number(selectedLoan.amount);
      const rate = Number(selectedLoan.interestRate) / 100;
      const calculatedInt = principal * rate * elapsedMonths;
      
      const alreadyCollected = Number(selectedLoan.collectedInterest) || 0;
      let remainingInt = calculatedInt;
      let totalRepayable = principal + calculatedInt;

      if (selectedLoan.interestType === 'MONTHLY') {
        remainingInt = Math.max(0, calculatedInt - alreadyCollected);
        totalRepayable = principal + remainingInt;
      }

      // Calculate simple elapsed days for reference
      const diffTime = end - start;
      const diffDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

      setInterestPreview({
        days: diffDays,
        interest: Math.max(0, calculatedInt),
        collected: alreadyCollected,
        remaining: Math.max(0, remainingInt),
        total: Math.max(principal, totalRepayable),
        months: elapsedMonths.toFixed(2)
      });
    }
  }, [selectedLoan, closeDate]);

  // Aggregate stats
  const stats = React.useMemo(() => {
    let activePrincipal = 0;
    let closedPrincipal = 0;
    let interestEarned = 0;

    loans.forEach(loan => {
      const principal = Number(loan.amount) || 0;
      if (loan.status === 'ACTIVE') {
        activePrincipal += principal;
      } else {
        closedPrincipal += principal;
        interestEarned += Number(loan.calculatedInterest) || 0;
      }
    });

    return {
      activePrincipal,
      closedPrincipal,
      interestEarned,
      totalCount: loans.length
    };
  }, [loans]);

  // Handle Loan Creation
  const handleCreateOpen = () => setOpenCreate(true);
  const handleCreateClose = () => {
    setOpenCreate(false);
    setNewLoan({
      memberId: '',
      amount: '',
      interestRate: '',
      startDate: new Date().toISOString().split('T')[0],
      remarks: '',
      interestType: 'ACCUMULATED'
    });
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!newLoan.memberId || !newLoan.amount || !newLoan.interestRate || !newLoan.startDate) return;

    try {
      const payload = {
        memberId: Number(newLoan.memberId),
        amount: Number(newLoan.amount),
        interestRate: Number(newLoan.interestRate),
        startDate: newLoan.startDate,
        remarks: newLoan.remarks,
        interestType: newLoan.interestType
      };
      await api.post('/loans', payload);
      handleCreateClose();
      fetchLoansAndMembers();
    } catch (error) {
      console.error('Failed to issue loan', error);
    }
  };

  // Handle Loan Closure
  const handleCloseOpen = (loan) => {
    setSelectedLoan(loan);
    setCloseDate(new Date().toISOString().split('T')[0]);
    setOpenClose(true);
  };

  const handleCloseClose = () => {
    setOpenClose(false);
    setSelectedLoan(null);
  };

  const handleCloseSubmit = async (e) => {
    e.preventDefault();
    if (!selectedLoan || !closeDate) return;

    try {
      await api.post(`/loans/${selectedLoan.id}/close?endDate=${closeDate}`);
      handleCloseClose();
      fetchLoansAndMembers();
    } catch (error) {
      console.error('Failed to close loan', error);
    }
  };

  // Handle Monthly Interest Collection logging
  const handleCollectInterestOpen = (loan) => {
    setSelectedLoan(loan);
    // Pre-fill with exactly 1 month's interest amount: principal * rate / 100
    const monthlyInt = (Number(loan.amount) * Number(loan.interestRate)) / 100;
    setInterestPayment({
      amount: monthlyInt.toFixed(2),
      paymentDate: new Date().toISOString().split('T')[0],
      remarks: `Monthly interest collection`
    });
    setOpenCollectInterest(true);
  };

  const handleCollectInterestClose = () => {
    setOpenCollectInterest(false);
    setSelectedLoan(null);
  };

  const handleCollectInterestSubmit = async (e) => {
    e.preventDefault();
    if (!selectedLoan || !interestPayment.amount || !interestPayment.paymentDate) return;

    try {
      await api.post(`/loans/${selectedLoan.id}/payments`, {
        amount: Number(interestPayment.amount),
        paymentDate: interestPayment.paymentDate,
        paymentType: 'INTEREST',
        remarks: interestPayment.remarks
      });
      handleCollectInterestClose();
      fetchLoansAndMembers();
    } catch (error) {
      console.error('Failed to log interest collection', error);
    }
  };

  // Handle View Payments Log Dialog
  const handleViewPaymentsOpen = async (loan) => {
    setPaymentsLoan(loan);
    try {
      const res = await api.get(`/loans/${loan.id}/payments`);
      setPayments(res.data || []);
      setOpenPaymentsLog(true);
    } catch (error) {
      console.error('Failed to fetch loan payments ledger', error);
    }
  };

  const handleViewPaymentsClose = () => {
    setOpenPaymentsLog(false);
    setPayments([]);
    setPaymentsLoan(null);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Loans Issued Ledger</Typography>
        <Button variant="contained" onClick={handleCreateOpen}>
          Issue New Loan
        </Button>
      </Box>

      {/* Metrics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Active Principal"
            value={`₹${stats.activePrincipal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            icon={<Landmark size={20} />}
            color="#3b82f6"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Recovered Principal"
            value={`₹${stats.closedPrincipal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            icon={<CheckCircle size={20} />}
            color="#10b981"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Interest Earned"
            value={`₹${stats.interestEarned.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            icon={<ArrowUpRight size={20} />}
            color="#f59e0b"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Loans Count"
            value={stats.totalCount}
            icon={<Percent size={20} />}
            color="#8b5cf6"
          />
        </Grid>
      </Grid>

      {/* Loans Table */}
      <Card>
        <CardContent sx={{ p: 0 }}>
          <Typography variant="h6" sx={{ p: 2, fontWeight: 'bold' }}>Loans Ledger</Typography>
          <Box sx={{ overflowX: 'auto', width: '100%' }}>
            <Table sx={{ minWidth: 850 }}>
              <TableHead>
                <TableRow sx={{ backgroundColor: 'background.default' }}>
                  <TableCell sx={{ fontWeight: 'bold' }}>Member</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Principal Amount</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Interest Rate & Type</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Start Date</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>End Date</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Interest Status</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Repayable Total</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', minWidth: 220 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loans.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 3 }}>
                      No loan records found.
                    </TableCell>
                  </TableRow>
                ) : (
                  loans.map((loan) => (
                    <TableRow key={loan.id} sx={{ '&:hover': { backgroundColor: 'action.hover' } }}>
                      <TableCell sx={{ fontWeight: 500 }}>{loan.memberName}</TableCell>
                      <TableCell>₹{loan.amount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>{loan.interestRate}% / month</Typography>
                        <Chip 
                          label={loan.interestType === 'MONTHLY' ? 'Monthly Collection' : 'Accumulated'} 
                          size="small" 
                          variant="outlined" 
                          color={loan.interestType === 'MONTHLY' ? 'secondary' : 'default'}
                          sx={{ fontSize: '0.65rem', height: 18, mt: 0.5, fontWeight: 'bold' }} 
                        />
                      </TableCell>
                      <TableCell>{loan.startDate}</TableCell>
                      <TableCell>{loan.endDate || '-'}</TableCell>
                      <TableCell>
                        {loan.status === 'CLOSED' ? (
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                              ₹{loan.calculatedInterest?.toLocaleString(undefined, { minimumFractionDigits: 2 })} (Paid)
                            </Typography>
                            <Button
                              variant="text"
                              size="small"
                              onClick={() => handleViewPaymentsOpen(loan)}
                              sx={{ p: 0, fontSize: '0.7rem', textTransform: 'none', minWidth: 0 }}
                            >
                              View Receipts
                            </Button>
                          </Box>
                        ) : (
                          loan.interestType === 'MONTHLY' ? (
                            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                              <Typography variant="caption" color="text.secondary">
                                Collected Interest:
                              </Typography>
                              <Button 
                                variant="text" 
                                size="small" 
                                onClick={() => handleViewPaymentsOpen(loan)}
                                sx={{ 
                                  fontWeight: 'bold', 
                                  p: 0, 
                                  minWidth: 0, 
                                  justifyContent: 'flex-start',
                                  color: 'success.main',
                                  textTransform: 'none',
                                  '&:hover': { textDecoration: 'underline', backgroundColor: 'transparent' }
                                }}
                              >
                                ₹{loan.collectedInterest?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </Button>
                            </Box>
                          ) : (
                            <Typography variant="body2" color="text.secondary">Accumulating...</Typography>
                          )
                        )}
                      </TableCell>
                      <TableCell sx={{ fontWeight: loan.status === 'CLOSED' ? 'bold' : 'normal' }}>
                        {loan.totalRepayableAmount !== null ? `₹${loan.totalRepayableAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '-'}
                      </TableCell>
                      <TableCell>
                        {loan.status === 'ACTIVE' ? (
                          <Chip label="ACTIVE" size="small" color="primary" sx={{ fontWeight: 'bold' }} />
                        ) : (
                          <Chip label="CLOSED" size="small" color="success" sx={{ fontWeight: 'bold' }} />
                        )}
                      </TableCell>
                      <TableCell>
                        {loan.status === 'ACTIVE' && (
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            {loan.interestType === 'MONTHLY' && (
                              <Button
                                variant="contained"
                                color="success"
                                size="small"
                                onClick={() => handleCollectInterestOpen(loan)}
                                sx={{ fontWeight: 'bold' }}
                              >
                                Collect Interest
                              </Button>
                            )}
                            <Button
                              variant="contained"
                              color="warning"
                              size="small"
                              onClick={() => handleCloseOpen(loan)}
                              sx={{ fontWeight: 'bold' }}
                            >
                              Close Loan
                            </Button>
                          </Box>
                        )}
                        {loan.status === 'CLOSED' && (
                          <Button 
                            variant="outlined" 
                            size="small" 
                            onClick={() => handleViewPaymentsOpen(loan)}
                            sx={{ fontWeight: 'bold' }}
                          >
                            View Ledger
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Box>
        </CardContent>
      </Card>

      {/* Dialog: Issue New Loan */}
      <Dialog open={openCreate} onClose={handleCreateClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Issue New Loan</DialogTitle>
        <form onSubmit={handleCreateSubmit}>
          <DialogContent dividers>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControl fullWidth required>
                  <InputLabel>Select Borrower Member</InputLabel>
                  <Select
                    label="Select Borrower Member"
                    value={newLoan.memberId}
                    onChange={(e) => setNewLoan({ ...newLoan, memberId: e.target.value })}
                  >
                    {members.map(m => (
                      <MenuItem key={m.id} value={m.id}>{m.name} ({m.phone})</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  type="number"
                  label="Principal Amount (₹)"
                  value={newLoan.amount}
                  onChange={(e) => setNewLoan({ ...newLoan, amount: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  type="number"
                  inputProps={{ step: "0.1" }}
                  label="Monthly Interest Rate (%)"
                  value={newLoan.interestRate}
                  onChange={(e) => setNewLoan({ ...newLoan, interestRate: e.target.value })}
                  helperText="e.g. 2.0 for 2% simple interest per month"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth required>
                  <InputLabel>Interest Payment Type</InputLabel>
                  <Select
                    label="Interest Payment Type"
                    value={newLoan.interestType}
                    onChange={(e) => setNewLoan({ ...newLoan, interestType: e.target.value })}
                  >
                    <MenuItem value="ACCUMULATED">Accumulated Simple (Interest paid entirely at closure)</MenuItem>
                    <MenuItem value="MONTHLY">Monthly Collection (Interest collected month-by-month)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  type="date"
                  label="Loan Start Date"
                  InputLabelProps={{ shrink: true }}
                  value={newLoan.startDate}
                  onChange={(e) => setNewLoan({ ...newLoan, startDate: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Remarks / Collateral Details (Optional)"
                  multiline
                  rows={2}
                  value={newLoan.remarks}
                  onChange={(e) => setNewLoan({ ...newLoan, remarks: e.target.value })}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={handleCreateClose} color="inherit">Cancel</Button>
            <Button type="submit" variant="contained" color="primary">Issue Loan</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Dialog: Close Loan */}
      <Dialog open={openClose} onClose={handleCloseClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Close Loan Record</DialogTitle>
        <form onSubmit={handleCloseSubmit}>
          <DialogContent dividers>
            {selectedLoan && (
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Box sx={{ backgroundColor: 'action.hover', p: 2, borderRadius: 2, mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">Borrower</Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1.5 }}>
                      {selectedLoan.memberName}
                    </Typography>

                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Principal Amount</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          ₹{Number(selectedLoan.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Interest Rate & Type</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {selectedLoan.interestRate}% / month ({selectedLoan.interestType === 'MONTHLY' ? 'Monthly' : 'Accumulated'})
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Start Date</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {selectedLoan.startDate}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    required
                    type="date"
                    label="Repayment / Closure Date"
                    InputLabelProps={{ shrink: true }}
                    value={closeDate}
                    onChange={(e) => setCloseDate(e.target.value)}
                  />
                </Grid>

                {/* Real-time Calculation Preview */}
                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ p: 2, borderRadius: 2, border: '1px dashed', borderColor: 'warning.main', backgroundColor: 'warning.main' + '05' }}>
                    <Typography variant="subtitle2" color="warning.main" sx={{ fontWeight: 'bold', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Calendar size={16} /> Dynamic Repayment Details
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">Elapsed Time</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {interestPreview.days} days (~{interestPreview.months} months)
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">Interest Type</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {selectedLoan.interestType === 'MONTHLY' ? 'Monthly Collection' : 'Accumulated Simple'}
                        </Typography>
                      </Grid>

                      {selectedLoan.interestType === 'MONTHLY' ? (
                        <>
                          <Grid item xs={4}>
                            <Typography variant="caption" color="text.secondary">Total Expected Interest</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                              ₹{interestPreview.interest.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </Typography>
                          </Grid>
                          <Grid item xs={4}>
                            <Typography variant="caption" color="text.secondary">Already Collected</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 'medium', color: 'success.main' }}>
                              ₹{interestPreview.collected.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </Typography>
                          </Grid>
                          <Grid item xs={4}>
                            <Typography variant="caption" color="text.secondary">Outstanding Interest</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'error.main' }}>
                              ₹{interestPreview.remaining.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </Typography>
                          </Grid>
                          
                          <Grid item xs={12} sx={{ mt: 1 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1.5, borderRadius: 1.5, backgroundColor: 'action.selected' }}>
                              <Box>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>Repayment Breakdown</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.8rem' }}>
                                  ₹{Number(selectedLoan.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })} (Principal) 
                                  {interestPreview.remaining > 0 && ` + ₹${interestPreview.remaining.toLocaleString(undefined, { minimumFractionDigits: 2 })} (Outstanding Interest)`}
                                </Typography>
                              </Box>
                              <Box sx={{ textAlign: 'right' }}>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>Total Due Today</Typography>
                                <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                                  ₹{interestPreview.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </Typography>
                              </Box>
                            </Box>
                          </Grid>
                        </>
                      ) : (
                        <>
                          <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary">Interest to Collect</Typography>
                            <Typography variant="body1" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                              ₹{interestPreview.interest.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </Typography>
                          </Grid>
                          <Grid item xs={12} sx={{ mt: 1 }}>
                            <Typography variant="caption" color="text.secondary">Total Repayable Amount</Typography>
                            <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                              ₹{interestPreview.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </Typography>
                          </Grid>
                        </>
                      )}
                    </Grid>
                  </Box>
                </Grid>
              </Grid>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={handleCloseClose} color="inherit">Cancel</Button>
            <Button type="submit" variant="contained" color="success">Confirm Repayment & Close</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Dialog: Collect Interest */}
      <Dialog open={openCollectInterest} onClose={handleCollectInterestClose} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Collect Monthly Interest</DialogTitle>
        <form onSubmit={handleCollectInterestSubmit}>
          <DialogContent dividers>
            {selectedLoan && (
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Box sx={{ backgroundColor: 'action.hover', p: 1.5, borderRadius: 2, mb: 1 }}>
                    <Typography variant="caption" color="text.secondary">Borrower</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>{selectedLoan.memberName}</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                      Loan Details: ₹{Number(selectedLoan.amount).toLocaleString()} @ {selectedLoan.interestRate}% interest
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    required
                    type="number"
                    label="Interest Amount (₹)"
                    value={interestPayment.amount}
                    onChange={(e) => setInterestPayment({ ...interestPayment, amount: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    required
                    type="date"
                    label="Collection Date"
                    InputLabelProps={{ shrink: true }}
                    value={interestPayment.paymentDate}
                    onChange={(e) => setInterestPayment({ ...interestPayment, paymentDate: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Remarks"
                    placeholder="e.g. Month 1 collection"
                    value={interestPayment.remarks}
                    onChange={(e) => setInterestPayment({ ...interestPayment, remarks: e.target.value })}
                  />
                </Grid>
              </Grid>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={handleCollectInterestClose} color="inherit">Cancel</Button>
            <Button type="submit" variant="contained" color="success">Log Collection</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Dialog: View Payments Ledger / Collections Log */}
      <Dialog open={openPaymentsLog} onClose={handleViewPaymentsClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Repayments Ledger</span>
          {paymentsLoan && (
            <Chip 
              label={paymentsLoan.memberName} 
              size="small" 
              color="primary" 
              sx={{ fontWeight: 'bold' }} 
            />
          )}
        </DialogTitle>
        <DialogContent dividers sx={{ p: 0 }}>
          {paymentsLoan && (
            <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Grid container spacing={2} sx={{ backgroundColor: 'action.hover', p: 1.5, borderRadius: 2 }}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>Total Principal</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                    ₹{Number(paymentsLoan.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>Interest Collected So Far</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                    ₹{paymentsLoan.collectedInterest?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}
          <Box sx={{ overflowX: 'auto', width: '100%' }}>
            <Table size="small" sx={{ minWidth: 450 }}>
              <TableHead>
                <TableRow sx={{ backgroundColor: 'background.default' }}>
                  <TableCell sx={{ fontWeight: 'bold', py: 1.5 }}>Payment Date</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', py: 1.5 }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', py: 1.5 }}>Amount</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', py: 1.5 }}>Remarks</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {payments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                      No collections logged yet for this loan.
                    </TableCell>
                  </TableRow>
                ) : (
                  payments.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell sx={{ py: 1.5 }}>{p.paymentDate}</TableCell>
                      <TableCell sx={{ py: 1.5 }}>
                        <Chip 
                          label={p.paymentType} 
                          size="small" 
                          color={p.paymentType === 'PRINCIPAL' ? 'primary' : 'success'} 
                          sx={{ fontWeight: 'bold', fontSize: '0.65rem', height: 20 }}
                        />
                      </TableCell>
                      <TableCell sx={{ fontWeight: 'bold', py: 1.5 }}>
                        ₹{p.amount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell sx={{ color: 'text.secondary', py: 1.5 }}>{p.remarks || '-'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleViewPaymentsClose} variant="contained" color="primary">Done</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Loans;
