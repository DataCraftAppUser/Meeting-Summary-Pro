import React, { useEffect, useState } from 'react';
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
    <Container maxWidth="lg">
      <Box mb={4} display="flex" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography variant="h4" component="h1" gutterBottom fontWeight={600}>
            סיכומי פגישות
          </Typography>
          <Typography variant="body1" color="text.secondary">
            נהל את כל סיכומי הפגישות שלך במקום אחד
          </Typography>
        </Box>
        
        {/* ✨ כפתורי החלפת תצוגה */}
        <ToggleButtonGroup
          value={viewMode}
          exclusive
          onChange={handleViewModeChange}
          aria-label="תצוגה"
          size="small"
        >
          <ToggleButton value="grid" aria-label="תצוגת כרטיסים">
            <ViewModuleIcon />
          </ToggleButton>
          <ToggleButton value="table" aria-label="תצוגת טבלה">
            <ViewListIcon />
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

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
