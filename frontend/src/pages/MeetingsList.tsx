import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Pagination, ToggleButtonGroup, ToggleButton, Container, Paper, Button } from '@mui/material';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import ViewListIcon from '@mui/icons-material/ViewList';
import AddIcon from '@mui/icons-material/Add';
import { useMeetings } from '../hooks/useMeetings';
import { useClients } from '../hooks/useClients';
import { useProjects } from '../hooks/useProjects';
import MeetingList from '../components/Meetings/MeetingList';
import MeetingFilters from '../components/Meetings/MeetingFilters';
import StatsCards from '../components/Meetings/StatsCards';
import Loading from '../components/Common/Loading';
import ErrorMessage from '../components/Common/ErrorMessage';
import ConfirmDialog from '../components/Common/ConfirmDialog';

export default function MeetingsList() {
  const navigate = useNavigate();
  const {
    meetings,
    loading,
    total,
    page,
    setPage,
    fetchMeetings,
    deleteMeeting,
  } = useMeetings();
  
  const { clients, fetchClients } = useClients();
  const { projects, fetchProjects } = useProjects();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [meetingToDelete, setMeetingToDelete] = useState<string | null>(null);
  const [error, setError] = useState(false);

  // ✨ תצוגת view mode
  const [viewMode, setViewMode] = useState<'grid' | 'table'>(() => {
    const saved = localStorage.getItem('meetingsViewMode');
    return (saved as 'grid' | 'table') || 'table';
  });

  const handleViewModeChange = (_: any, newMode: 'grid' | 'table' | null) => {
    if (newMode) {
      setViewMode(newMode);
      localStorage.setItem('meetingsViewMode', newMode);
    }
  };

  useEffect(() => {
    loadData();
  }, [page, searchQuery, selectedClient, selectedProject, selectedStatus]);

  useEffect(() => {
    fetchClients();
    fetchProjects();
  }, []);

  const loadData = async () => {
    try {
      setError(false);
      await fetchMeetings({
        search: searchQuery || undefined,
        client_id: selectedClient || undefined,
        project_id: selectedProject || undefined,
        status: (selectedStatus as 'draft' | 'final' | 'archived' | undefined) || undefined,
      });
    } catch (err) {
      setError(true);
    }
  };

  const handleDelete = (id: string) => {
    setMeetingToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (meetingToDelete) {
      const success = await deleteMeeting(meetingToDelete);
      if (success) {
        await loadData();
      }
    }
    setDeleteDialogOpen(false);
    setMeetingToDelete(null);
  };

  const handlePageChange = (_: any, value: number) => {
    setPage(value);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (error) {
    return <ErrorMessage onRetry={loadData} />;
  }

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)', pb: 4 }}>
      <Container maxWidth="xl">
        {/* Header Section */}
        <Box sx={{ mb: 4, pt: 4 }}>
          <Paper
            elevation={0}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              p: 4,
              borderRadius: 3,
              boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)',
            }}
          >
            <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
              <Box>
                <Typography
                  variant="h3"
                  component="h1"
                  sx={{
                    fontWeight: 700,
                    mb: 1,
                    fontSize: { xs: '1.75rem', sm: '2.5rem' },
                  }}
                >
                  Dashboard
                </Typography>
                <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 400 }}>
                  DataCraft - ניהול סיכומי פגישות מקצועי
                </Typography>
              </Box>
              <Box display="flex" gap={2} alignItems="center">
                <ToggleButtonGroup
                  value={viewMode}
                  exclusive
                  onChange={handleViewModeChange}
                  aria-label="תצוגה"
                  size="small"
                  sx={{
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    '& .MuiToggleButton-root': {
                      color: 'white',
                      borderColor: 'rgba(255,255,255,0.3)',
                      '&.Mui-selected': {
                        backgroundColor: 'rgba(255,255,255,0.3)',
                        color: 'white',
                      },
                    },
                  }}
                >
                  <ToggleButton value="grid" aria-label="תצוגת כרטיסים">
                    <ViewModuleIcon />
                  </ToggleButton>
                  <ToggleButton value="table" aria-label="תצוגת טבלה">
                    <ViewListIcon />
                  </ToggleButton>
                </ToggleButtonGroup>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => navigate('/meetings/new')}
                  sx={{
                    backgroundColor: 'white',
                    color: '#667eea',
                    fontWeight: 600,
                    px: 3,
                    py: 1.5,
                    '&:hover': {
                      backgroundColor: 'rgba(255,255,255,0.9)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    },
                    transition: 'all 0.3s ease',
                  }}
                >
                  סיכום חדש
                </Button>
              </Box>
            </Box>
          </Paper>
        </Box>

        {/* Stats Cards */}
        {!loading && (
          <StatsCards meetings={meetings} clients={clients} projects={projects} />
        )}

      <MeetingFilters
        searchQuery={searchQuery}
        selectedClient={selectedClient}
        selectedProject={selectedProject}
        selectedStatus={selectedStatus}
        clients={clients}
        projects={projects}
        onSearchChange={setSearchQuery}
        onClientChange={setSelectedClient}
        onProjectChange={setSelectedProject}
        onStatusChange={setSelectedStatus}
      />

      {loading ? (
        <Loading message="טוען סיכומים..." />
      ) : (
        <>
          <MeetingList
            meetings={meetings}
            onDelete={handleDelete}
            onNewMeeting={() => navigate('/meetings/new')}
            viewMode={viewMode}
          />

          {total > 10 && (
            <Box display="flex" justifyContent="center" mt={4}>
              <Pagination
                count={Math.ceil(total / 10)}
                page={page}
                onChange={handlePageChange}
                color="primary"
                size="large"
              />
            </Box>
          )}
        </>
      )}

      <ConfirmDialog
        open={deleteDialogOpen}
        title="מחיקת סיכום"
        message="האם אתה בטוח שברצונך למחוק את הסיכום? פעולה זו אינה ניתנת לביטול."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteDialogOpen(false)}
        severity="error"
      />
    </Container>
  );
}
