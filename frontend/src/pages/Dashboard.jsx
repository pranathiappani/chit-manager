import React, { useEffect, useState } from 'react';
import { Grid, Card, CardContent, Typography, Box, CircularProgress, useTheme, Table, TableBody, TableCell, TableHead, TableRow, Chip, Button, Alert, LinearProgress } from '@mui/material';
import { Users, Wallet, TrendingUp, AlertCircle } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../api/axiosConfig';
import { useToast } from '../components/ToastProvider';
import { useConfirm } from '../components/ConfirmProvider';



const FinancialChartCard = ({ title, subtitle, totalValue, data, placeholderText, empty }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const chartData = empty 
    ? [{ name: 'No Data', value: 1, color: isDark ? '#334155' : '#e2e8f0' }] 
    : data;

  return (
    <Card 
      sx={{ 
        width: '100%',
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        background: isDark 
          ? `linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(30, 41, 59, 0.4) 100%)`
          : `linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)`,
        border: '1px solid',
        borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(226, 232, 240, 0.8)',
        borderRadius: 3,
        boxShadow: isDark 
          ? '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
          : '0 10px 15px -3px rgba(148, 163, 184, 0.05), 0 4px 6px -2px rgba(148, 163, 184, 0.02)',
      }}
    >
      <Box sx={{ p: 3, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', fontFamily: '"Outfit", sans-serif' }}>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {subtitle}
        </Typography>
      </Box>
      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', px: 2, py: 3, alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Chart (Upper Middle) */}
        <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%', position: 'relative' }}>
          <Box sx={{ width: 190, height: 190, position: 'relative' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={empty ? 0 : 4}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <Box 
              sx={{ 
                position: 'absolute', 
                top: '50%', 
                left: '50%', 
                transform: 'translate(-50%, -50%)',
                textAlign: 'center',
                pointerEvents: 'none',
                width: '110px'
              }}
            >
              <Typography 
                variant="caption" 
                color="text.secondary" 
                sx={{ 
                  fontWeight: 700, 
                  textTransform: 'uppercase', 
                  letterSpacing: '0.05em',
                  fontSize: '0.65rem',
                  display: 'block'
                }}
              >
                {empty ? 'STATUS' : 'TOTAL'}
              </Typography>
              <Typography 
                variant={empty ? 'body2' : 'h6'} 
                sx={{ 
                  fontWeight: 800, 
                  color: empty ? 'text.secondary' : 'text.primary',
                  fontFamily: '"Outfit", sans-serif',
                  mt: -0.25,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {empty ? 'No Data' : `₹${totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Legend (Below the chart, horizontal row) */}
        <Box 
          sx={{ 
            display: 'flex', 
            flexDirection: 'row', 
            flexWrap: 'wrap', 
            justifyContent: 'center', 
            alignItems: 'center',
            gap: 1.25, 
            mt: 3, 
            width: '100%',
            height: '75px',
            borderTop: '1px solid',
            borderColor: 'divider',
            pt: 2
          }}
        >
          {empty ? (
            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
              {placeholderText}
            </Typography>
          ) : (
            data.map((item) => {
              const percentage = totalValue > 0 ? (item.value / totalValue) * 100 : 0;
              return (
                <Box 
                  key={item.name} 
                  sx={{ 
                    display: 'flex', 
                    flexDirection: 'row', 
                    alignItems: 'center',
                    gap: 0.75,
                    px: 1,
                    py: 0.5,
                    borderRadius: 1,
                    '&:hover': {
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)'
                    }
                  }}
                >
                  <Box 
                    sx={{ 
                      width: 8, 
                      height: 8, 
                      borderRadius: '50%', 
                      backgroundColor: item.color,
                      boxShadow: `0 0 4px ${item.color}60`
                    }} 
                  />
                  <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.72rem', color: 'text.primary' }}>
                    {item.name}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 800, fontSize: '0.72rem', color: 'text.primary', ml: 0.25 }}>
                    ₹{item.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, fontSize: '0.68rem', ml: 0.25 }}>
                    ({percentage.toFixed(0)}%)
                  </Typography>
                </Box>
              );
            })
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

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
  const { confirm } = useConfirm();
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
    const confirmation1 = await confirm({
      title: 'Wipe Entire Database?',
      message: 'WARNING: You are about to clear the entire database!\n\nThis will permanently delete all members, chit groups, loans, collections, and payout records. This action cannot be undone.\n\nDo you want to proceed?',
      confirmText: 'Wipe Database',
      cancelText: 'Cancel',
      severity: 'error'
    });
    
    if (confirmation1) {
      const confirmation2 = await confirm({
        title: 'Confirm Database Wipe',
        message: "To confirm database wipe, please type 'RESET' in the box below:",
        confirmText: 'Wipe Now',
        cancelText: 'Cancel',
        severity: 'error',
        isPrompt: true,
        promptPlaceholder: "Type 'RESET' to confirm"
      });
      
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

  const previousMonthLabel = stats?.previousMonthLabel || 'Previous Month';

  const inflowData = stats?.inflowStats ? [
    { name: 'Cash', value: stats.inflowStats.CASH || 0, color: '#10b981' },
    { name: 'PhonePe', value: stats.inflowStats.PHONEPE || 0, color: '#8b5cf6' },
    { name: 'GPay', value: stats.inflowStats.GPAY || 0, color: '#3b82f6' },
    { name: 'Other', value: stats.inflowStats.OTHER || 0, color: '#f59e0b' },
  ].filter(item => item.value > 0) : [];

  const totalInflow = stats?.inflowStats?.total || 0;
  const isInflowEmpty = totalInflow === 0;

  const outflowData = stats?.outflowStats ? [
    { name: 'Payouts', value: stats.outflowStats.PAYOUTS || 0, color: '#ec4899' },
    { name: 'Loans', value: stats.outflowStats.LOANS || 0, color: '#06b6d4' },
  ].filter(item => item.value > 0) : [];

  const totalOutflow = stats?.outflowStats?.total || 0;
  const isOutflowEmpty = totalOutflow === 0;

  return (
    <Box sx={{ width: '100%' }}>
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

      {/* Main Dashboard Layout Container */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3, mb: 4, width: '100%' }}>
        {/* Left Side: 2 Financial Charts */}
        <Box sx={{ 
          flex: { xs: '1 1 auto', md: '3' }, 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' }, 
          gap: 3, 
          minWidth: 0 
        }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <FinancialChartCard
              title="Money Received (Inflow)"
              subtitle={`Previous Month: ${previousMonthLabel}`}
              totalValue={totalInflow}
              data={inflowData}
              placeholderText={`No collections or loan repayments received in ${previousMonthLabel}`}
              empty={isInflowEmpty}
            />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <FinancialChartCard
              title="Money Went Out (Outflow)"
              subtitle={`Previous Month: ${previousMonthLabel}`}
              totalValue={totalOutflow}
              data={outflowData}
              placeholderText={`No chit payouts or loans issued in ${previousMonthLabel}`}
              empty={isOutflowEmpty}
            />
          </Box>
        </Box>

        {/* Right Side: 4 Stacked Metric Cards */}
        <Box sx={{ 
          flex: { xs: '1 1 auto', md: '1' }, 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row', md: 'column' }, 
          gap: 2.5, 
          minWidth: { md: '250px', lg: '280px' } 
        }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <StatCard
              title="Total Active Chits"
              value={stats?.totalActiveChits || 0}
              icon={<Wallet size={20} />}
              color="#3b82f6"
            />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <StatCard
              title="Total Members"
              value={stats?.totalMembers || 0}
              icon={<Users size={20} />}
              color="#8b5cf6"
            />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <StatCard
              title="Profits (Completed Chits)"
              value={`₹${stats?.completedChitsProfit?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}`}
              icon={<TrendingUp size={20} />}
              color="#10b981"
            />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <StatCard
              title="Pending Collections"
              value={stats?.pendingCollections || 0}
              icon={<AlertCircle size={20} />}
              color="#ef4444"
            />
          </Box>
        </Box>
      </Box>

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
