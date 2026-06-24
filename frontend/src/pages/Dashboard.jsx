import React, { useEffect, useState } from 'react';
import { Grid, Card, CardContent, Typography, Box, CircularProgress, useTheme, Table, TableBody, TableCell, TableHead, TableRow, Chip, Button, Alert, LinearProgress } from '@mui/material';
import { Users, Wallet, TrendingUp, AlertCircle } from 'lucide-react';
import api from '../api/axiosConfig';
import { useToast } from '../components/ToastProvider';

const StatCard = ({ title, value, icon, color }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  
  return (
    <Card 
      sx={{ 
        width: '100%', 
        height: '100%', 
        position: 'relative',
        overflow: 'hidden',
        background: isDark 
          ? `linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(30, 41, 59, 0.4) 100%)`
          : `linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)`,
        border: '1px solid',
        borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(226, 232, 240, 0.8)',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          width: '4px',
          height: '100%',
          backgroundColor: color,
        },
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: isDark 
            ? `0 20px 25px -5px ${color}15, 0 10px 10px -5px ${color}10`
            : `0 20px 25px -5px ${color}10, 0 10px 10px -5px ${color}05`,
          borderColor: `${color}40`,
        }
      }}
    >
      <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography 
              color="text.secondary" 
              variant="caption" 
              sx={{ 
                fontWeight: 700, 
                textTransform: 'uppercase', 
                letterSpacing: '0.05em',
                display: 'block',
                mb: 0.5
              }}
            >
              {title}
            </Typography>
            <Typography 
              variant="h4" 
              sx={{ 
                fontWeight: 800, 
                color: 'text.primary',
                letterSpacing: '-0.02em',
                fontFamily: '"Outfit", sans-serif'
              }}
            >
              {value}
            </Typography>
          </Box>
          <Box 
            sx={{ 
              p: 1.75, 
              borderRadius: '12px', 
              backgroundColor: isDark ? `${color}18` : `${color}10`, 
              color: color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 8px 16px -4px ${color}20`,
              border: '1px solid',
              borderColor: isDark ? `${color}30` : `${color}15`,
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'scale(1.05) rotate(5deg)',
                boxShadow: `0 12px 20px -4px ${color}30`,
              }
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

const Dashboard = () => {
  const { showToast } = useToast();
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
          showToast(response.data || "Database wiped successfully.", "success");
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        } catch (error) {
          console.error('Failed to clear database', error);
          showToast('Failed to clear database. Please verify connection to the server.', 'error');
        }
      } else {
        showToast("Reset cancelled. Typing did not match 'RESET'.", "info");
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
            title="Pending Collections"
            value={stats?.pendingCollections || 0}
            icon={<AlertCircle size={20} />}
            color="#ef4444"
          />
        </Grid>
      </Grid>

      {/* Chit-wise Outstanding Collections Table */}
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
                  <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
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
                    const percent = details.totalMembers > 0 ? (details.paidMembersCount / details.totalMembers) * 100 : 0;

                    return (
                      <TableRow key={details.chitId}>
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
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, minWidth: 140, maxWidth: 200 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                {details.paidMembersCount} / {details.totalMembers}
                              </Typography>
                              <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                                {Math.round(percent)}% Paid
                              </Typography>
                            </Box>
                            <LinearProgress 
                              variant="determinate" 
                              value={percent} 
                              sx={{ 
                                height: 6, 
                                borderRadius: 3, 
                                backgroundColor: (theme) => theme.palette.mode === 'light' ? '#e2e8f0' : '#334155',
                                '& .MuiLinearProgress-bar': {
                                  borderRadius: 3,
                                  background: percent === 100 
                                    ? 'linear-gradient(90deg, #10b981 0%, #34d399 100%)'
                                    : 'linear-gradient(90deg, #4338ca 0%, #6366f1 100%)',
                                }
                              }}
                            />
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
                  const percent = details.totalMembers > 0 ? (details.paidMembersCount / details.totalMembers) * 100 : 0;
                  
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
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="text.secondary">Monthly Contribution</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            ₹{details.monthlyCollection?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </Typography>
                        </Box>
                        
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="body2" color="text.secondary">Collection Progress</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                              {details.paidMembersCount} / {details.totalMembers} ({Math.round(percent)}%)
                            </Typography>
                          </Box>
                          <LinearProgress 
                            variant="determinate" 
                            value={percent} 
                            sx={{ 
                              height: 6, 
                              borderRadius: 3, 
                              backgroundColor: (theme) => theme.palette.mode === 'light' ? '#e2e8f0' : '#334155',
                              '& .MuiLinearProgress-bar': {
                                borderRadius: 3,
                                background: percent === 100 
                                  ? 'linear-gradient(90deg, #10b981 0%, #34d399 100%)'
                                  : 'linear-gradient(90deg, #4338ca 0%, #6366f1 100%)',
                              }
                            }}
                          />
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
