import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box, ThemeProvider } from '@mui/material';
import { ToastProvider } from './hooks/useToast';
import { theme } from './theme';
import Layout from './components/Layout/Layout';
import MeetingsList from './pages/MeetingsList';
import MeetingEditor from './pages/MeetingEditor';
import MeetingView from './pages/MeetingView';
import Settings from './pages/Settings';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <ToastProvider>
        <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/meetings" replace />} />
          <Route path="/meetings" element={<MeetingsList />} />
          <Route path="/meetings/new" element={<MeetingEditor />} />
          <Route path="/meetings/:id/edit" element={<MeetingEditor />} />
          <Route path="/meetings/:id" element={<MeetingView />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/meetings" replace />} />
        </Routes>
      </Layout>
    </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
