import React, { useEffect, useState } from 'react';
import { Grid, Card, CardContent, Typography, Box, CircularProgress, useTheme, Table, TableBody, TableCell, TableHead, TableRow, Chip, Button, Alert } from '@mui/material';
import { Users, Wallet, TrendingUp, AlertCircle } from 'lucide-react';
import api from '../api/axiosConfig';

const StatCard = ({ title, value, icon, color }) => (
  <Card sx={{ width: '100%', height: '100%', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-2px)' } }}>
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
        <Box sx={{ p: 1.5, borderRadius: 2, backgroundColor: `${color}15`, color: color }}>
          {icon}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const theme = useTheme();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setError(null);
        const response = await api.get('/dashboard/stats');
        setStats(response.data);
      } catch (err) {
        console.error('Failed to fetch stats', err);
        setError('Could not connect to the server. Please verify the backend service is running.');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const handleClearAllData = async () => {
    const confirmation1 = window.confirm("⚠️ WARNING: You are about to clear the entire database!\n\nThis will permanently delete all members, chit groups, loans, collections, and payout records. This action cannot be undone.\n\nDo you want to proceed?");
    if (confirmation1) {
      const confirmation2 = window.prompt("To confirm database wipe, please type 'RESET' in the box below:");
      if (confirmation2 === 'RESET') {
        try {
          const response = await api.post('/admin/clear');
          alert(response.data);
          window.location.reload();
        } catch (error) {
          console.error('Failed to clear database', error);
          alert('Failed to clear database. Please verify connection to the server.');
        }
      } else {
        alert("Reset cancelled. Typing did not match 'RESET'.");
      }
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Dashboard Overview</Typography>
        <Button 
          variant="outlined" 
          color="error" 
          onClick={handleClearAllData}
          sx={{ width: { xs: '100%', sm: 'auto' }, fontWeight: 'bold', borderWidth: '1.5px', '&:hover': { borderWidth: '1.5px', backgroundColor: 'error.main', color: '#fff' } }}
        >
          Reset Database
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3, fontWeight: 'bold' }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3} sx={{ mb: 4, width: '100%' }}>
        <Grid item xs={12} sm={12} md={3} sx={{ width: { xs: '100%', md: 'auto' } }}>
          <StatCard
            title="Total Active Chits"
            value={stats?.totalActiveChits || 0}
            icon={<Wallet size={20} />}
            color="#3b82f6"
          />
        </Grid>
        <Grid item xs={12} sm={12} md={3} sx={{ width: { xs: '100%', md: 'auto' } }}>
          <StatCard
            title="Total Members"
            value={stats?.totalMembers || 0}
            icon={<Users size={20} />}
            color="#8b5cf6"
          />
        </Grid>
        <Grid item xs={12} sm={12} md={3} sx={{ width: { xs: '100%', md: 'auto' } }}>
          <StatCard
            title="Profits (Completed Chits)"
            value={`₹${stats?.completedChitsProfit?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}`}
            icon={<TrendingUp size={20} />}
            color="#10b981"
          />
        </Grid>
        <Grid item xs={12} sm={12} md={3} sx={{ width: { xs: '100%', md: 'auto' } }}>
          <StatCard
            title="Pending Collections (Current Month)"
            value={stats?.pendingCollections || 0}
            icon={<AlertCircle size={20} />}
            color="#ef4444"
          />
        </Grid>
      </Grid>

      {/* Chit-wise Pending Collections Table */}
      <Card>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ p: 3, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              Chit-wise Outstanding Collections (Current Month)
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Live outstanding collection tracking for each active chit group in its current running month
            </Typography>
          </Box>
          {/* Desktop Table View */}
          <Box sx={{ display: { xs: 'none', md: 'block' }, overflowX: 'auto', width: '100%' }}>
            <Table sx={{ minWidth: 650 }}>
              <TableHead>
                <TableRow sx={{ backgroundColor: 'background.default' }}>
                  <TableCell sx={{ fontWeight: 'bold', pl: 3 }}>Chit Group</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Current Month</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Monthly Contribution</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Collection Progress</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Pending Members</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', pr: 3 }}>Pending Amount</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {!stats?.activeChitsCollectionDetails || stats.activeChitsCollectionDetails.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                      No active chit groups found.
                    </TableCell>
                  </TableRow>
                ) : (
                  stats.activeChitsCollectionDetails.map((details) => {
                    const isFullyPaid = details.pendingMembersCount === 0;

                    return (
                      <TableRow key={details.chitId} sx={{ '&:hover': { backgroundColor: 'action.hover' } }}>
                        <TableCell sx={{ fontWeight: 'bold', pl: 3 }}>{details.chitName}</TableCell>
                        <TableCell>
                          <Chip 
                            label={`Month ${details.currentMonth}`} 
                            size="small" 
                            color="primary"
                            variant="outlined"
                            sx={{ fontWeight: 'bold' }}
                          />
                        </TableCell>
                        <TableCell>₹{details.monthlyCollection?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                              {details.paidMembersCount} / {details.totalMembers}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">Paid</Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={isFullyPaid ? 'FULLY PAID' : `${details.pendingMembersCount} PENDING`} 
                            size="small" 
                            color={isFullyPaid ? 'success' : 'warning'}
                            sx={{ fontWeight: 'bold', fontSize: '0.7rem' }}
                          />
                        </TableCell>
                        <TableCell sx={{ fontWeight: 'bold', pr: 3, color: isFullyPaid ? 'text.primary' : 'error.main' }}>
                          ₹{details.pendingAmount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </Box>

          {/* Mobile Stacked Card View */}
          <Box sx={{ display: { xs: 'block', md: 'none' }, p: 2 }}>
            {!stats?.activeChitsCollectionDetails || stats.activeChitsCollectionDetails.length === 0 ? (
              <Typography color="text.secondary" align="center" sx={{ py: 2 }}>
                No active chit groups found.
              </Typography>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {stats.activeChitsCollectionDetails.map((details) => {
                  const isFullyPaid = details.pendingMembersCount === 0;
                  return (
                    <Card key={details.chitId} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                          {details.chitName}
                        </Typography>
                        <Chip 
                          label={`Month ${details.currentMonth}`} 
                          size="small" 
                          color="primary"
                          variant="outlined"
                          sx={{ fontWeight: 'bold' }}
                        />
                      </Box>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="text.secondary">Monthly Contribution</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            ₹{details.monthlyCollection?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body2" color="text.secondary">Collection Progress</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {details.paidMembersCount} / {details.totalMembers} Paid
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body2" color="text.secondary">Status</Typography>
                          <Chip 
                            label={isFullyPaid ? 'FULLY PAID' : `${details.pendingMembersCount} PENDING`} 
                            size="small" 
                            color={isFullyPaid ? 'success' : 'warning'}
                            sx={{ fontWeight: 'bold', fontSize: '0.7rem' }}
                          />
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 1, borderTop: '1px solid', borderColor: 'divider' }}>
                          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 'bold' }}>Pending Amount</Typography>
                          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: isFullyPaid ? 'text.primary' : 'error.main' }}>
                            ₹{details.pendingAmount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </Typography>
                        </Box>
                      </Box>
                    </Card>
                  );
                })}
              </Box>
            )}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Dashboard;
