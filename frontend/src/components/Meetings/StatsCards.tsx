import React from 'react';
import { Box, Card, CardContent, Typography, Grid } from '@mui/material';
import {
  Meeting as MeetingIcon,
  Business as BusinessIcon,
  FolderSpecial as ProjectIcon,
  TrendingUp as TrendingIcon,
} from '@mui/icons-material';
import { Meeting, Client, Project } from '../../types';

interface StatsCardsProps {
  meetings: Meeting[];
  clients: Client[];
  projects: Project[];
}

export default function StatsCards({ meetings, clients, projects }: StatsCardsProps) {
  const stats = {
    totalMeetings: meetings.length,
    totalClients: clients.length,
    totalProjects: projects.length,
    recentMeetings: meetings.filter((m) => {
      const meetingDate = new Date(m.meeting_date);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return meetingDate >= weekAgo;
    }).length,
  };

  const statCards = [
    {
      title: 'סה"כ סיכומים',
      value: stats.totalMeetings,
      icon: MeetingIcon,
      color: '#1976d2',
      bgGradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    },
    {
      title: 'לקוחות פעילים',
      value: stats.totalClients,
      icon: BusinessIcon,
      color: '#2e7d32',
      bgGradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    },
    {
      title: 'פרויקטים',
      value: stats.totalProjects,
      icon: ProjectIcon,
      color: '#ed6c02',
      bgGradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    },
    {
      title: 'סיכומים השבוע',
      value: stats.recentMeetings,
      icon: TrendingIcon,
      color: '#9c27b0',
      bgGradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    },
  ];

  return (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      {statCards.map((stat, index) => {
        const IconComponent = stat.icon;
        return (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card
              sx={{
                height: '100%',
                background: stat.bgGradient,
                color: 'white',
                position: 'relative',
                overflow: 'hidden',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: '0 12px 24px rgba(0,0,0,0.15)',
                },
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  width: '100%',
                  height: '100%',
                  background: 'rgba(255,255,255,0.1)',
                  borderRadius: '50%',
                  transform: 'translate(30%, -30%)',
                  width: '200px',
                  height: '200px',
                },
              }}
            >
              <CardContent sx={{ position: 'relative', zIndex: 1 }}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                  <Box
                    sx={{
                      backgroundColor: 'rgba(255,255,255,0.2)',
                      borderRadius: '12px',
                      p: 1.5,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <IconComponent sx={{ fontSize: 28 }} />
                  </Box>
                </Box>
                <Typography
                  variant="h3"
                  component="div"
                  sx={{
                    fontWeight: 700,
                    mb: 0.5,
                    fontSize: { xs: '2rem', sm: '2.5rem' },
                  }}
                >
                  {stat.value}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    opacity: 0.9,
                    fontSize: '0.95rem',
                    fontWeight: 500,
                  }}
                >
                  {stat.title}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        );
      })}
    </Grid>
  );
}
