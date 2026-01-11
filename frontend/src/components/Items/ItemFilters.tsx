import React from 'react';
import {
  TextField,
  MenuItem,
  Grid,
  InputAdornment,
  Box,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { Workspace, Topic } from '../../types';

interface ItemFiltersProps {
  searchQuery: string;
  selectedWorkspace: string;
  selectedTopic: string;
  selectedContentType: string;
  workspaces: Workspace[];
  topics: Topic[];
  onSearchChange: (value: string) => void;
  onWorkspaceChange: (value: string) => void;
  onTopicChange: (value: string) => void;
  onContentTypeChange: (value: string) => void;
}

export default function ItemFilters({
  searchQuery,
  selectedWorkspace,
  selectedTopic,
  selectedContentType,
  workspaces,
  topics,
  onSearchChange,
  onWorkspaceChange,
  onTopicChange,
  onContentTypeChange,
}: ItemFiltersProps) {
  return (
    <Box sx={{ mb: 3 }}>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            select
            fullWidth
            label="עולם תוכן/לקוח"
            value={selectedWorkspace}
            onChange={(e) => onWorkspaceChange(e.target.value)}
          >
            <MenuItem value="">כל העולמות תוכן / לקוחות</MenuItem>
            {workspaces.map((workspace) => (
              <MenuItem key={workspace.id} value={workspace.id}>
                {workspace.name}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <TextField
            select
            fullWidth
            label="נושא/פרויקט"
            value={selectedTopic}
            onChange={(e) => onTopicChange(e.target.value)}
            disabled={!selectedWorkspace}
          >
            <MenuItem value="">כל הנושאים/פרויקטים</MenuItem>
            {topics
              .filter((t) => !selectedWorkspace || t.workspace_id === selectedWorkspace)
              .map((topic) => (
                <MenuItem key={topic.id} value={topic.id}>
                  {topic.name}
                </MenuItem>
              ))}
          </TextField>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <TextField
            select
            fullWidth
            label="סוג תוכן"
            value={selectedContentType}
            onChange={(e) => onContentTypeChange(e.target.value)}
          >
            <MenuItem value="">כל הסוגים</MenuItem>
            <MenuItem value="knowledge_item">פריט ידע</MenuItem>
            <MenuItem value="meeting">סיכום פגישה</MenuItem>
            <MenuItem value="work_log">יומן עבודה</MenuItem>
          </TextField>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <TextField
            fullWidth
            placeholder="חיפוש..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Grid>
      </Grid>
    </Box>
  );
}
