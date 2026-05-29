import React, { useState, useEffect } from 'react';
import { Box, Card, Typography, Table, TableBody, TableCell, TableHead, TableRow, MenuItem, Select, FormControl, InputLabel, Button, Chip } from '@mui/material';
import api from '../api/axiosConfig';
import { formatMonth } from '../utils/dateUtils';

const Collections = () => {
  const [chits, setChits] = useState([]);
  const [selectedChit, setSelectedChit] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [members, setMembers] = useState([]);
  const [collections, setCollections] = useState({});

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
        } catch (error) {
          console.error('Failed to fetch data', error);
        }
      } else {
        setMembers([]);
        setCollections({});
      }
    };
    fetchMembersAndCollections();
  }, [selectedChit, selectedMonth]);

  const handleMarkPaid = async (memberId, chitData) => {
    try {
      const payload = {
        chitGroupId: selectedChit,
        memberId: memberId,
        forMonth: selectedMonth,
        amountPaid: chitData.monthlyCollection,
        status: 'PAID',
        paymentDate: new Date().toISOString().split('T')[0]
      };
      
      const response = await api.post('/collections', payload);
      setCollections(prev => ({ ...prev, [memberId]: response.data }));
    } catch (error) {
      console.error('Failed to mark paid', error);
    }
  };

  const selectedChitData = chits.find(c => Number(c.id) === Number(selectedChit));
  const monthsArray = selectedChitData ? Array.from({length: selectedChitData.durationMonths}, (_, i) => i + 1) : [];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Monthly Collections</Typography>
      </Box>

      <Card sx={{ mb: 4, p: 2, display: 'flex', gap: 3 }}>
        <FormControl sx={{ minWidth: 200 }}>
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

        <FormControl sx={{ minWidth: 200 }} disabled={!selectedChit}>
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
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: 'background.default' }}>
                <TableCell sx={{ fontWeight: 'bold' }}>Member Name</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Amount Due</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Payment Date</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {members.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                    No members assigned to this chit yet.
                  </TableCell>
                </TableRow>
              ) : (
                members.map((member) => {
                  const collection = collections[member.id];
                  const isPaid = collection?.status === 'PAID';

                  return (
                    <TableRow key={member.id} hover>
                      <TableCell sx={{ fontWeight: 500 }}>{member.name}</TableCell>
                      <TableCell>₹{selectedChitData?.monthlyCollection}</TableCell>
                      <TableCell>
                        <Chip 
                          label={isPaid ? 'PAID' : 'PENDING'} 
                          color={isPaid ? 'success' : 'warning'} 
                          size="small" 
                        />
                      </TableCell>
                      <TableCell>{collection?.paymentDate || '-'}</TableCell>
                      <TableCell>
                        {!isPaid && (
                          <Button 
                            variant="outlined" 
                            color="primary" 
                            size="small"
                            onClick={() => handleMarkPaid(member.id, selectedChitData)}
                          >
                            Mark Paid
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </Card>
      )}
    </Box>
  );
};

export default Collections;
