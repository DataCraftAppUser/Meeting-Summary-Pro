import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Pagination, ToggleButtonGroup, ToggleButton, Container } from '@mui/material';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import ViewListIcon from '@mui/icons-material/ViewList';
import { useItems } from '../hooks/useItems';
import { useWorkspaces } from '../hooks/useWorkspaces';
import { useTopics } from '../hooks/useTopics';
import ItemList from '../components/Items/ItemList';
import ItemFilters from '../components/Items/ItemFilters';
import Loading from '../components/Common/Loading';
import ErrorMessage from '../components/Common/ErrorMessage';
import ConfirmDialog from '../components/Common/ConfirmDialog';

export default function ItemsList() {
  const navigate = useNavigate();
  const {
    items,
    loading,
    total,
    page,
    setPage,
    fetchItems,
    deleteItem,
  } = useItems();
  
  const { workspaces, fetchWorkspaces } = useWorkspaces();
  const { topics, fetchTopics } = useTopics();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWorkspace, setSelectedWorkspace] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [selectedContentType, setSelectedContentType] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [error, setError] = useState(false);

  // ✨ תצוגת view mode
  const [viewMode, setViewMode] = useState<'grid' | 'table'>(() => {
    const saved = localStorage.getItem('itemsViewMode');
    return (saved as 'grid' | 'table') || 'table';
  });

  const handleViewModeChange = (_: any, newMode: 'grid' | 'table' | null) => {
    if (newMode) {
      setViewMode(newMode);
      localStorage.setItem('itemsViewMode', newMode);
    }
  };

  const loadData = useCallback(async () => {
    try {
      setError(false);
      await fetchItems({
        search: searchQuery || undefined,
        workspace_id: selectedWorkspace || undefined,
        topic_id: selectedTopic || undefined,
        content_type: selectedContentType || undefined,
      });
    } catch (err) {
      setError(true);
    }
  }, [fetchItems, searchQuery, selectedWorkspace, selectedTopic, selectedContentType]);

  useEffect(() => {
    loadData();
  }, [page, loadData]);

  useEffect(() => {
    fetchWorkspaces();
    fetchTopics();
  }, [fetchWorkspaces, fetchTopics]);

  const handleDelete = (id: string) => {
    setItemToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (itemToDelete) {
      const success = await deleteItem(itemToDelete);
      if (success) {
        await loadData();
      }
    }
    setDeleteDialogOpen(false);
    setItemToDelete(null);
  };

  const handlePageChange = (_: any, value: number) => {
    setPage(value);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleWorkspaceChange = (value: string) => {
    setSelectedWorkspace(value);
    setSelectedTopic(''); // איפוס הנושא בעת החלפת לקוח
  };

  if (error) {
    return <ErrorMessage onRetry={loadData} />;
  }

  return (
    <Container maxWidth="xl">
      <Box
        mb={4}
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        sx={{
          background: 'white',
          borderRadius: 3,
          py: 2,
          px: 4,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
          border: '1px solid rgba(226, 232, 240, 0.8)',
        }}
      >
        <Box>
          <Typography
            variant="h6"
            sx={{
              color: '#64748b',
              fontWeight: 400,
              lineHeight: 1.6,
            }}
          >
            הבית של התובנות, יומני העבודה והסיכומים שלך. {' '}
            <Box component="span" sx={{ fontWeight: 600, color: '#38b2ac' }}>
              פשוט.
            </Box>
            {' '}
            <Box component="span" sx={{ fontWeight: 600, color: '#1a365d' }}>
              חכם.
            </Box>
            {' '}
            <Box 
              component="span" 
              sx={{ 
                fontWeight: 700, 
                color: '#d32f2f',
                textShadow: '0 0 20px rgba(211, 47, 47, 0.1)'
              }}
            >
              מבוסס AI.
            </Box>
          </Typography>
        </Box>

        <Box display="flex" alignItems="center" gap={3}>
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
        <ItemFilters
          searchQuery={searchQuery}
          selectedWorkspace={selectedWorkspace}
          selectedTopic={selectedTopic}
          selectedContentType={selectedContentType}
          workspaces={workspaces}
          topics={topics}
          onSearchChange={setSearchQuery}
          onWorkspaceChange={handleWorkspaceChange}
          onTopicChange={setSelectedTopic}
          onContentTypeChange={setSelectedContentType}
        />
      </Box>

      {loading ? (
        <Loading message="טוען פריטים..." />
      ) : (
        <>
          <ItemList
            items={items}
            onDelete={handleDelete}
            onNewItem={() => navigate('/items/new')}
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
        title="מחיקת פריט"
        message="האם אתה בטוח שברצונך למחוק את הפריט? פעולה זו אינה ניתנת לביטול."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteDialogOpen(false)}
        severity="error"
      />
    </Container>
  );
}
