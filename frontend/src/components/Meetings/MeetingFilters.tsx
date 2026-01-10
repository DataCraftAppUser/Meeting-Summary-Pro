import React from 'react';
import {
  TextField,
  MenuItem,
  Grid,
  InputAdornment,
  Box,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { Client, Project } from '../../types';

interface MeetingFiltersProps {
  searchQuery: string;
  selectedClient: string;
  selectedProject: string;
  clients: Client[];
  projects: Project[];
  onSearchChange: (value: string) => void;
  onClientChange: (value: string) => void;
  onProjectChange: (value: string) => void;
}

export default function MeetingFilters({
  searchQuery,
  selectedClient,
  selectedProject,
  clients,
  projects,
  onSearchChange,
  onClientChange,
  onProjectChange,
}: MeetingFiltersProps) {
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
            label="לקוח"
            value={selectedClient}
            onChange={(e) => onClientChange(e.target.value)}
          >
            <MenuItem value="">כל הלקוחות</MenuItem>
            {clients.map((client) => (
              <MenuItem key={client.id} value={client.id}>
                {client.name}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid item xs={12} sm={4}>
          <TextField
            select
            fullWidth
            label="פרויקט"
            value={selectedProject}
            onChange={(e) => onProjectChange(e.target.value)}
            disabled={!selectedClient}
          >
            <MenuItem value="">כל הפרויקטים</MenuItem>
            {projects
              .filter((p) => !selectedClient || p.client_id === selectedClient)
              .map((project) => (
                <MenuItem key={project.id} value={project.id}>
                  {project.name}
                </MenuItem>
              ))}
          </TextField>
        </Grid>
      </Grid>
    </Box>
  );
}
