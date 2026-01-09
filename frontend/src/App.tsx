import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box } from '@mui/material';
import { ToastProvider } from './hooks/useToast';
import Layout from './components/Layout/Layout';
import MeetingsList from './pages/MeetingsList';
import MeetingEditor from './pages/MeetingEditor';
import MeetingView from './pages/MeetingView';

function App() {
  return (
    <ToastProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/meetings" replace />} />
          <Route path="/meetings" element={<MeetingsList />} />
          <Route path="/meetings/new" element={<MeetingEditor />} />
          <Route path="/meetings/:id/edit" element={<MeetingEditor />} />
          <Route path="/meetings/:id" element={<MeetingView />} />
          <Route path="*" element={<Navigate to="/meetings" replace />} />
        </Routes>
      </Layout>
    </ToastProvider>
  );
}

export default App;
