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
  workspaces: Workspace[];
  topics: Topic[];
  onSearchChange: (value: string) => void;
  onWorkspaceChange: (value: string) => void;
  onTopicChange: (value: string) => void;
}

export default function ItemFilters({
  searchQuery,
  selectedWorkspace,
  selectedTopic,
  workspaces,
  topics,
  onSearchChange,
  onWorkspaceChange,
  onTopicChange,
}: ItemFiltersProps) {
  return (
    <Box sx={{ mb: 3 }}>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={4}>
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

        <Grid item xs={12} sm={4}>
          <TextField
            select
            fullWidth
            label="Workspace"
            value={selectedWorkspace}
            onChange={(e) => onWorkspaceChange(e.target.value)}
          >
            <MenuItem value="">כל ה-Workspaces</MenuItem>
            {workspaces.map((workspace) => (
              <MenuItem key={workspace.id} value={workspace.id}>
                {workspace.name}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid item xs={12} sm={4}>
          <TextField
            select
            fullWidth
            label="נושא"
            value={selectedTopic}
            onChange={(e) => onTopicChange(e.target.value)}
            disabled={!selectedWorkspace}
          >
            <MenuItem value="">כל הנושאים</MenuItem>
            {topics
              .filter((t) => !selectedWorkspace || t.workspace_id === selectedWorkspace)
              .map((topic) => (
                <MenuItem key={topic.id} value={topic.id}>
                  {topic.name}
                </MenuItem>
              ))}
          </TextField>
        </Grid>
      </Grid>
    </Box>
  );
}
