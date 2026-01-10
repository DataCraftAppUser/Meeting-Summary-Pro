import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Pagination, ToggleButtonGroup, ToggleButton, Container } from '@mui/material';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import ViewListIcon from '@mui/icons-material/ViewList';
import { useMeetings } from '../hooks/useMeetings';
import { useClients } from '../hooks/useClients';
import { useProjects } from '../hooks/useProjects';
import MeetingList from '../components/Meetings/MeetingList';
import MeetingFilters from '../components/Meetings/MeetingFilters';
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

  const loadData = useCallback(async () => {
    try {
      setError(false);
      await fetchMeetings({
        search: searchQuery || undefined,
        client_id: selectedClient || undefined,
        project_id: selectedProject || undefined,
      });
    } catch (err) {
      setError(true);
    }
  }, [fetchMeetings, searchQuery, selectedClient, selectedProject]);

  useEffect(() => {
    loadData();
  }, [page, loadData]);

  useEffect(() => {
    fetchClients();
    fetchProjects();
  }, [fetchClients, fetchProjects]);

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
    <Container maxWidth="xl">
      <Box
        mb={6}
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        sx={{
          background: 'white',
          borderRadius: 3,
          p: 4,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
          border: '1px solid rgba(226, 232, 240, 0.8)',
        }}
      >
        <Box>
          <Typography
            variant="h3"
            component="h1"
            gutterBottom
            fontWeight={700}
            sx={{
              background: 'linear-gradient(135deg, #1a365d 0%, #2d3748 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 2,
            }}
          >
            סיכומי פגישות
          </Typography>
          <Typography
            variant="h6"
            color="text.secondary"
            sx={{ fontWeight: 400, lineHeight: 1.6 }}
          >
            נהל את כל סיכומי הפגישות שלך במקום אחד עם AI מתקדם
          </Typography>
        </Box>

        {/* ✨ כפתורי החלפת תצוגה */}
        <ToggleButtonGroup
          value={viewMode}
          exclusive
          onChange={handleViewModeChange}
          aria-label="תצוגה"
          size="medium"
          sx={{
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            borderRadius: 2,
            p: 0.5,
            '& .MuiToggleButton-root': {
              borderRadius: 2,
              mx: 0.5,
              px: 2,
              py: 1,
              border: 'none',
              '&.Mui-selected': {
                backgroundColor: 'primary.main',
                color: 'white',
                '&:hover': {
                  backgroundColor: 'primary.dark',
                },
              },
            },
          }}
        >
          <ToggleButton value="grid" aria-label="תצוגת כרטיסים">
            <ViewModuleIcon sx={{ mr: 1 }} />
            כרטיסים
          </ToggleButton>
          <ToggleButton value="table" aria-label="תצוגת טבלה">
            <ViewListIcon sx={{ mr: 1 }} />
            טבלה
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <Box
        sx={{
          background: 'white',
          borderRadius: 3,
          p: 3,
          mb: 4,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
          border: '1px solid rgba(226, 232, 240, 0.8)',
        }}
      >
        <MeetingFilters
          searchQuery={searchQuery}
          selectedClient={selectedClient}
          selectedProject={selectedProject}
          clients={clients}
          projects={projects}
          onSearchChange={setSearchQuery}
          onClientChange={setSelectedClient}
          onProjectChange={setSelectedProject}
        />
      </Box>

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
            <Box
              display="flex"
              justifyContent="center"
              mt={6}
              sx={{
                background: 'white',
                borderRadius: 3,
                p: 3,
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                border: '1px solid rgba(226, 232, 240, 0.8)',
              }}
            >
              <Pagination
                count={Math.ceil(total / 10)}
                page={page}
                onChange={handlePageChange}
                color="primary"
                size="large"
                sx={{
                  '& .MuiPaginationItem-root': {
                    borderRadius: 2,
                  },
                }}
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
