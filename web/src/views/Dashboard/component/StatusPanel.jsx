import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid, Card, Divider, CircularProgress, Alert, IconButton, Chip, Tooltip } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import RefreshIcon from '@mui/icons-material/Refresh';

const StatusPanel = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const statusPageURL = '/api/user/dashboard/uptimekuma/status-page';
  const statusPageHeartbeatURL = '/api/user/dashboard/uptimekuma/status-page/heartbeat';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusData, setStatusData] = useState(null);
  const [heartbeatData, setHeartbeatData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch status page data
      const statusResponse = await axios.get(statusPageURL);
      setStatusData(statusResponse.data);

      // Fetch heartbeat data
      const heartbeatResponse = await axios.get(statusPageHeartbeatURL);
      setHeartbeatData(heartbeatResponse.data);

      setLoading(false);
    } catch (err) {
      console.error('Error fetching status data:', err);
      setError(err.message || 'Failed to fetch status data');
      setLoading(false);
    }
  };

  // Function to handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchData();
  }, [statusPageURL, statusPageHeartbeatURL]);

  // Helper function to get the latest heartbeat status for a monitor
  const getLatestHeartbeatStatus = (monitorId) => {
    if (!heartbeatData || !heartbeatData.heartbeatList || !heartbeatData.heartbeatList[monitorId]) {
      return null;
    }

    const heartbeats = heartbeatData.heartbeatList[monitorId];
    return heartbeats.length > 0 ? heartbeats[heartbeats.length - 1] : null;
  };

  // Helper function to get uptime percentage for a monitor
  const getUptimePercentage = (monitorId) => {
    if (!heartbeatData || !heartbeatData.uptimeList) {
      return null;
    }

    const uptimeKey = `${monitorId}_24`;
    return heartbeatData.uptimeList[uptimeKey] !== undefined ? (heartbeatData.uptimeList[uptimeKey] * 100).toFixed(2) : null;
  };

  // Helper function to determine status color based on uptime percentage
  const getStatusColor = (uptimePercentage) => {
    if (uptimePercentage === null) return theme.palette.grey[500];
    if (uptimePercentage >= 90) return theme.palette.success.main; // Green for high uptime
    if (uptimePercentage > 70 && uptimePercentage < 90) return theme.palette.warning.main; // Warning for medium uptime
    return theme.palette.error.main; // Error for low uptime
  };
  const getStatusToBgColor = (uptimePercentage) => {
    // 获取当前主题
    if (theme.palette.mode === 'dark') {
      return theme.palette.background.paper;
    }

    if (uptimePercentage === null) return theme.palette.grey[500];
    if (uptimePercentage >= 90) return theme.palette.success.light; // Green for high uptime
    if (uptimePercentage > 70 && uptimePercentage < 90) return theme.palette.warning.light; // Warning for medium uptime
    return theme.palette.error.light; // Error for low uptime
  };

  // Helper function to render uptime history boxes
  const renderUptimeHistory = (monitorId) => {
    if (!heartbeatData || !heartbeatData.heartbeatList || !heartbeatData.heartbeatList[monitorId]) {
      return null;
    }

    // Get last 24 heartbeats (or fewer if not available)
    const heartbeats = heartbeatData.heartbeatList[monitorId];
    const lastHeartbeats = heartbeats.slice(-40);

    return (
      <Box sx={{ display: 'flex', mt: 1, gap: '2px' }}>
        {lastHeartbeats.map((heartbeat, index) => {
          const status = heartbeat.status === 1 ? 'Up' : heartbeat.status === 2 ? 'Warn' : 'Down';
          const statusColor =
            heartbeat.status === 1
              ? theme.palette.success.main
              : heartbeat.status === 2
                ? theme.palette.warning.main
                : theme.palette.error.main;
          const beijingTime = new Date(new Date(heartbeat.time).getTime() + 8 * 60 * 60 * 1000);
          const upTime = beijingTime.toLocaleString();
          return (
            <Tooltip key={index} title={`${status} - ${upTime}(UTC+8)`}>
              <Box
                sx={{
                  width: '8px',
                  height: '20px',
                  backgroundColor: statusColor,
                  borderRadius: '4px',
                  flexGrow: 1,
                  maxWidth: '8px',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'scale(1.2)'
                  }
                }}
              />
            </Tooltip>
          );
        })}
        {/* Add empty boxes if less than 40 heartbeats */}
        {Array.from({ length: Math.max(0, 40 - lastHeartbeats.length) }).map((_, index) => (
          <Box
            key={`empty-${index}`}
            sx={{
              width: '8px',
              height: '20px',
              backgroundColor: theme.palette.grey[300],
              borderRadius: '4px',
              flexGrow: 1,
              maxWidth: '8px'
            }}
          />
        ))}
      </Box>
    );
  };

  // Render status card for a monitor
  const renderStatusCard = (monitor) => {
    const latestStatus = getLatestHeartbeatStatus(monitor.id);
    const uptimePercentage = getUptimePercentage(monitor.id);
    const statusColor = getStatusColor(uptimePercentage);
    const statusBgColor = getStatusToBgColor(uptimePercentage);
    const isNormal = latestStatus && latestStatus.status === 1;

    return (
      <Grid item xs={12} sm={6} md={3} key={monitor.id}>
        <Card
          sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: isNormal
              ? statusBgColor
              : theme.palette.mode === 'dark'
                ? theme.palette.background.paper
                : theme.palette.error.lighter,
            boxShadow: 'none',
            borderRadius: 1,
            p: 1.5,
            border: `1px solid ${isNormal ? statusColor : theme.palette.error.main}`
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  backgroundColor: isNormal ? statusColor : theme.palette.error.main,
                  mr: 1.5
                }}
              />
              <Typography variant="subtitle1" component="div" sx={{ fontWeight: 500, color: 'text.primary' }}>
                {monitor.name}
              </Typography>
            </Box>
            <Box sx={{ marginLeft: 'auto' }}>
              {monitor.tags &&
                monitor.tags.map((tag, index) => (
                  <Chip
                    key={index}
                    label={tag.value ? tag.value : tag.name}
                    size="small"
                    sx={{
                      backgroundColor: `${tag.color}40`,
                      color: tag.color,
                      ml: 0.3,
                      height: '18px',
                      border: `1px solid ${tag.color}`,
                      '& .MuiChip-label': {
                        fontSize: '0.7rem',
                        padding: '0 6px'
                      }
                    }}
                  />
                ))}
            </Box>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography
              variant="body1"
              sx={{
                color: isNormal ? statusColor : theme.palette.error.main,
                fontWeight: 500
              }}
            >
              {uptimePercentage}% {t('dashboard_index.availability')}(24H)
            </Typography>
            {renderUptimeHistory(monitor.id)}
          </Box>
        </Card>
      </Grid>
    );
  };

  // Render content based on loading/error/data state
  const renderContent = () => {
    if (loading) {
      return (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <CircularProgress />
        </Box>
      );
    }

    if (error) {
      return (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      );
    }

    if (!statusData || !heartbeatData || !statusData.publicGroupList) {
      return (
        <Typography variant="body1" color="text.secondary" mt={2}>
          {t('dashboard_index.no_data_available')}
        </Typography>
      );
    }

    return (
      <Box mt={3}>
        {statusData.publicGroupList.map((group) => (
          <Box key={group.id} mb={4}>
            <Typography variant="h5" gutterBottom>
              {group.name}
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={1.5}>
              {group.monitorList.map((monitor) => renderStatusCard(monitor))}
            </Grid>
          </Box>
        ))}
      </Box>
    );
  };

  return (
    <Card>
      <Box p={3}>
        <Box display="flex" alignItems="center" mb={2}>
          <Typography variant="h4" sx={{ mr: 1 }}>
            {t('dashboard_index.tab_status')}
          </Typography>
          <IconButton
            onClick={handleRefresh}
            disabled={loading || refreshing}
            size="small"
            sx={{
              p: 0.5,
              '&:hover': {
                backgroundColor: 'transparent'
              }
            }}
          >
            <RefreshIcon
              fontSize="small"
              sx={{
                color: refreshing ? theme.palette.primary.main : theme.palette.text.secondary,
                animation: refreshing ? 'spin 1s linear infinite' : 'none',
                '@keyframes spin': {
                  '0%': {
                    transform: 'rotate(0deg)'
                  },
                  '100%': {
                    transform: 'rotate(360deg)'
                  }
                }
              }}
            />
          </IconButton>
        </Box>
        {renderContent()}
      </Box>
    </Card>
  );
};

export default StatusPanel;
