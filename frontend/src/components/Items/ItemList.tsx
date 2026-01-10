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
import { Item } from '../../types';
import ItemCard from './ItemCard';
import EmptyState from '../Common/EmptyState';
import { formatDate, formatTimeAgo } from '../../utils/dateUtils';

interface ItemListProps {
  items: Item[];
  onDelete: (id: string) => void;
  onNewItem?: () => void;
  viewMode?: 'grid' | 'table';
}

export default function ItemList({
  items,
  onDelete,
  onNewItem,
  viewMode = 'table',
}: ItemListProps) {
  const navigate = useNavigate();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'default';
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
      case 'processed':
        return 'מעובד';
      case 'final':
        return 'סופי';
      case 'archived':
        return 'בארכיון';
      default:
        return status;
    }
  };

  if (items.length === 0) {
    return (
      <EmptyState
        message="אין פריטים עדיין"
        actionLabel="צור פריט ראשון"
        onAction={onNewItem}
      />
    );
  }

  // Grid view (Tiles)
  if (viewMode === 'grid') {
    return (
      <Box sx={{ flexGrow: 1 }}>
        <Grid container spacing={3}>
          {items.map((item) => (
            <Grid item xs={12} sm={6} md={4} key={item.id}>
              <ItemCard item={item} onDelete={onDelete} />
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
            <TableCell align="center" sx={{ fontWeight: 'bold', width: '10%' }}>
              תאריך
            </TableCell>
            <TableCell align="center" sx={{ fontWeight: 'bold', width: '24%' }}>
              כותרת
            </TableCell>
            <TableCell align="center" sx={{ fontWeight: 'bold', width: '14%' }}>
              Workspace
            </TableCell>
            <TableCell align="center" sx={{ fontWeight: 'bold', width: '14%' }}>
              נושא
            </TableCell>
            <TableCell align="center" sx={{ fontWeight: 'bold', width: '10%' }}>
              סטטוס
            </TableCell>
            <TableCell align="center" sx={{ fontWeight: 'bold', width: '13%' }}>
              עדכון אחרון
            </TableCell>
            <TableCell align="center" sx={{ fontWeight: 'bold', width: '10%' }}>
              פעולות
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((item) => (
            <TableRow
              key={item.id}
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
                  {formatDate(item.meeting_date)}
                </Typography>
              </TableCell>
              <TableCell 
                align="right" 
                sx={{ 
                  '& .MuiTypography-root': {
                    textAlign: 'right !important',
                    direction: 'rtl !important',
                  },
                  textAlign: 'right !important',
                  direction: 'rtl !important',
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 500,
                    cursor: 'pointer',
                    textAlign: 'right !important',
                    direction: 'rtl !important',
                    '&:hover': {
                      color: 'primary.main',
                      textDecoration: 'underline',
                    },
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/items/${item.id}`);
                  }}
                >
                  {item.title}
                </Typography>
              </TableCell>
              <TableCell align="right">
                <Typography variant="body2" color="text.secondary">
                  {(item as any).workspaces?.name || 'לא צוין'}
                </Typography>
              </TableCell>
              <TableCell align="right">
                <Typography variant="body2" color="text.secondary">
                  {(item as any).topics?.name || 'לא צוין'}
                </Typography>
              </TableCell>
              <TableCell align="center">
                <Chip
                  label={getStatusLabel(item.status)}
                  color={getStatusColor(item.status) as any}
                  size="small"
                />
              </TableCell>
              <TableCell align="center">
                <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', display: 'block' }}>
                  עודכן {formatTimeAgo(item.created_at)}
                </Typography>
              </TableCell>
              <TableCell align="right">
                <Box display="flex" gap={0.5}>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/items/${item.id}`);
                    }}
                    title="צפייה"
                  >
                    <VisibilityIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/items/${item.id}/edit`);
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
                      onDelete(item.id);
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
