import React, { useEffect, useState } from 'react';
import { Grid, Card, CardContent, Typography, Box, CircularProgress, useTheme, Table, TableBody, TableCell, TableHead, TableRow, Chip } from '@mui/material';
import { Users, Wallet, TrendingUp, AlertCircle } from 'lucide-react';
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
  const theme = useTheme();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/dashboard/stats');
        setStats(response.data);
      } catch (error) {
        console.error('Failed to fetch stats', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Active Chits"
            value={stats?.totalActiveChits || 0}
            icon={<Wallet size={20} />}
            color="#3b82f6"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Members"
            value={stats?.totalMembers || 0}
            icon={<Users size={20} />}
            color="#8b5cf6"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Profits (Completed Chits)"
            value={`₹${stats?.completedChitsProfit?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}`}
            icon={<TrendingUp size={20} />}
            color="#10b981"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
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
          <Box sx={{ overflowX: 'auto', width: '100%' }}>
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
        </CardContent>
      </Card>
    </Box>
  );
};

export default Dashboard;
