import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  Typography,
  Chip,
  Box,
  IconButton,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { Item } from '../../types';
import { formatDate, formatTimeAgo } from '../../utils/dateUtils';
import { truncateText, stripHtml } from '../../utils/helpers';

interface ItemCardProps {
  item: Item;
  onDelete: (id: string) => void;
}

export default function ItemCard({ item, onDelete }: ItemCardProps) {
  const navigate = useNavigate();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'default';
      case 'processing':
        return 'warning';
      case 'processed':
        return 'info';
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
        return 'גרסת מקור';
      case 'processing':
        return 'בתהליך עיבוד';
      case 'processed':
        return 'מעובד AI';
      case 'final':
        return 'סופי';
      case 'archived':
        return 'בארכיון';
      default:
        return status;
    }
  };

  const contentPreview = item.processed_content || item.content;
  const plainText = stripHtml(contentPreview);

  return (
    <Card
      onClick={() => navigate(`/items/${item.id}`)}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: 'pointer',
        '&:hover': {
          transform: 'translateY(-8px) scale(1.02)',
          boxShadow: '0 20px 40px -12px rgba(26, 54, 93, 0.25), 0 8px 16px -8px rgba(26, 54, 93, 0.1)',
        },
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: `linear-gradient(90deg, ${getStatusColor(item.status) === 'info' ? '#3182ce' :
            getStatusColor(item.status) === 'success' ? '#38a169' :
            getStatusColor(item.status) === 'default' ? '#4a5568' : '#38b2ac'}, transparent)`,
        },
      }}
    >
      <CardContent sx={{ flexGrow: 1, p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Typography
            variant="h6"
            component="div"
            sx={{
              fontWeight: 600,
              fontSize: '1.125rem',
              lineHeight: 1.3,
              color: 'text.primary',
              cursor: 'pointer',
              transition: 'color 0.2s ease',
              '&:hover': {
                color: 'primary.main',
              },
            }}
          >
            {item.title}
          </Typography>
          <Chip
            label={getStatusLabel(item.status)}
            color={getStatusColor(item.status)}
            size="small"
            sx={{
              fontWeight: 500,
              fontSize: '0.75rem',
              borderRadius: 1,
            }}
          />
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography
            variant="body2"
            sx={{
              color: 'text.secondary',
              fontWeight: 500,
              mb: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <Box
              component="span"
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: 'primary.main',
                display: 'inline-block',
              }}
            />
            {(item as any).workspaces?.name || 'לא צוין'} • {(item as any).topics?.name || 'לא צוין'}
          </Typography>

          <Typography
            variant="body2"
            sx={{
              color: 'text.secondary',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            📅 {formatDate(item.meeting_date)}
          </Typography>
        </Box>

        <Typography
          variant="body2"
          sx={{
            mt: 2,
            mb: 2,
            lineHeight: 1.6,
            color: 'text.secondary',
          }}
        >
          {truncateText(plainText, 150)}
        </Typography>

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mt: 'auto',
            pt: 2,
            borderTop: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Typography
            variant="caption"
            sx={{
              color: 'text.secondary',
              fontWeight: 500,
            }}
          >
            עודכן {formatTimeAgo(item.updated_at)}
          </Typography>
          <Box
            sx={{
              display: 'flex',
              gap: 0.5,
              opacity: 0.7,
              transition: 'opacity 0.2s ease',
              '&:hover': {
                opacity: 1,
              },
            }}
          >
            <IconButton
              size="small"
              color="error"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(item.id);
              }}
              sx={{
                p: 0.5,
                borderRadius: 1,
                '&:hover': {
                  backgroundColor: 'rgba(229, 62, 62, 0.04)',
                },
              }}
              title="מחיקה"
            >
              <DeleteIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
