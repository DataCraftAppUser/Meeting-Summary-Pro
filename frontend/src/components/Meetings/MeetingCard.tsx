import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Chip,
  Box,
  IconButton,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { Meeting } from '../../types';
import { formatDate, formatTimeAgo } from '../../utils/dateUtils';
import { truncateText, stripHtml } from '../../utils/helpers';

interface MeetingCardProps {
  meeting: Meeting;
  onDelete: (id: string) => void;
}

export default function MeetingCard({ meeting, onDelete }: MeetingCardProps) {
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

  const contentPreview = meeting.processed_content || meeting.content;
  const plainText = stripHtml(contentPreview);

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4,
        },
      }}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
          <Typography 
            variant="h6" 
            component="div" 
            gutterBottom
            onClick={() => navigate(`/meetings/${meeting.id}`)}
            sx={{
              cursor: 'pointer',
              '&:hover': {
                color: 'primary.main',
                textDecoration: 'underline',
              },
            }}
          >
            {meeting.title}
          </Typography>
          <Chip
            label={getStatusLabel(meeting.status)}
            color={getStatusColor(meeting.status)}
            size="small"
          />
        </Box>

        <Typography variant="body2" color="text.secondary" gutterBottom>
          {(meeting as any).clients?.name || 'לא צוין'} • {(meeting as any).projects?.name || 'לא צוין'}
        </Typography>

        <Typography variant="body2" color="text.secondary" gutterBottom>
          📅 {formatDate(meeting.meeting_date)}
        </Typography>

        <Typography variant="body2" sx={{ mt: 2, mb: 2 }}>
          {truncateText(plainText, 150)}
        </Typography>

        <Typography variant="caption" color="text.secondary">
          עודכן {formatTimeAgo(meeting.updated_at)}
        </Typography>
      </CardContent>

      <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
        <Box>
          <IconButton
            size="small"
            color="primary"
            onClick={() => navigate(`/meetings/${meeting.id}`)}
            title="צפייה"
          >
            <VisibilityIcon />
          </IconButton>
          <IconButton
            size="small"
            color="primary"
            onClick={() => navigate(`/meetings/${meeting.id}/edit`)}
            title="עריכה"
          >
            <EditIcon />
          </IconButton>
        </Box>
        <IconButton
          size="small"
          color="error"
          onClick={() => onDelete(meeting.id)}
          title="מחיקה"
        >
          <DeleteIcon />
        </IconButton>
      </CardActions>
    </Card>
  );
}
