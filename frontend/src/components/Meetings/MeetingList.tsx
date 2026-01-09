import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Typography,
  Box,
  Grid,
  Chip,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { Meeting } from '../../types';
import MeetingCard from './MeetingCard';
import EmptyState from '../Common/EmptyState';
import { formatDate } from '../../utils/dateUtils';

interface MeetingListProps {
  meetings: Meeting[];
  onDelete: (id: string) => void;
  onNewMeeting?: () => void;
  viewMode?: 'grid' | 'table';
}

export default function MeetingList({
  meetings,
  onDelete,
  onNewMeeting,
  viewMode = 'table',
}: MeetingListProps) {
  const navigate = useNavigate();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'warning';
      case 'final':
        return 'success';
      case 'archived':
        return 'default';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'draft':
        return 'טיוטה';
      case 'final':
        return 'סופי';
      case 'archived':
        return 'בארכיון';
      default:
        return status;
    }
  };

  if (meetings.length === 0) {
    return (
      <EmptyState
        message="אין סיכומים עדיין"
        actionLabel="צור סיכום ראשון"
        onAction={onNewMeeting}
      />
    );
  }

  // Grid view (Tiles)
  if (viewMode === 'grid') {
    return (
      <Box sx={{ flexGrow: 1 }}>
        <Grid container spacing={3}>
          {meetings.map((meeting) => (
            <Grid item xs={12} sm={6} md={4} key={meeting.id}>
              <MeetingCard meeting={meeting} onDelete={onDelete} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  // Table view
  return (
    <TableContainer 
      component={Paper} 
      sx={{ 
        width: '100%', 
        overflowX: 'auto',
      }}
    >
      <Table 
        dir="rtl" 
        sx={{ 
          width: '100%',
          minWidth: 800,
        }}
      >
        <TableHead>
          <TableRow sx={{ backgroundColor: 'grey.100' }}>
            <TableCell align="right" sx={{ fontWeight: 'bold', width: '12%' }}>
              תאריך
            </TableCell>
            <TableCell align="right" sx={{ fontWeight: 'bold', width: '28%' }}>
              כותרת
            </TableCell>
            <TableCell align="right" sx={{ fontWeight: 'bold', width: '18%' }}>
              לקוח
            </TableCell>
            <TableCell align="right" sx={{ fontWeight: 'bold', width: '18%' }}>
              פרויקט
            </TableCell>
            <TableCell align="right" sx={{ fontWeight: 'bold', width: '12%' }}>
              סטטוס
            </TableCell>
            <TableCell align="right" sx={{ fontWeight: 'bold', width: '12%' }}>
              פעולות
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {meetings.map((meeting) => (
            <TableRow
              key={meeting.id}
              hover
              sx={{
                cursor: 'pointer',
                '&:hover': {
                  backgroundColor: 'action.hover',
                },
              }}
            >
              <TableCell align="right">
                <Typography variant="body2">
                  {formatDate(meeting.meeting_date)}
                </Typography>
              </TableCell>
              <TableCell align="right">
                <Typography
                  variant="body1"
                  sx={{
                    fontWeight: 500,
                    cursor: 'pointer',
                    '&:hover': {
                      color: 'primary.main',
                      textDecoration: 'underline',
                    },
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/meetings/${meeting.id}`);
                  }}
                >
                  {meeting.title}
                </Typography>
              </TableCell>
              <TableCell align="right">
                <Typography variant="body2" color="text.secondary">
                  {(meeting as any).clients?.name || 'לא צוין'}
                </Typography>
              </TableCell>
              <TableCell align="right">
                <Typography variant="body2" color="text.secondary">
                  {(meeting as any).projects?.name || 'לא צוין'}
                </Typography>
              </TableCell>
              <TableCell align="right">
                <Chip
                  label={getStatusLabel(meeting.status)}
                  color={getStatusColor(meeting.status) as any}
                  size="small"
                />
              </TableCell>
              <TableCell align="right">
                <Box display="flex" gap={0.5}>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/meetings/${meeting.id}`);
                    }}
                    title="צפייה"
                  >
                    <VisibilityIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/meetings/${meeting.id}/edit`);
                    }}
                    title="עריכה"
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(meeting.id);
                    }}
                    title="מחיקה"
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
