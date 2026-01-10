import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box, ThemeProvider } from '@mui/material';
import { ToastProvider } from './hooks/useToast';
import { theme } from './theme';
import Layout from './components/Layout/Layout';
import ItemsList from './pages/ItemsList';
import ItemEditor from './pages/ItemEditor';
import ItemView from './pages/ItemView';
import Settings from './pages/Settings';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <ToastProvider>
        <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/items" replace />} />
          <Route path="/items" element={<ItemsList />} />
          <Route path="/items/new" element={<ItemEditor />} />
          <Route path="/items/:id/edit" element={<ItemEditor />} />
          <Route path="/items/:id" element={<ItemView />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/items" replace />} />
        </Routes>
      </Layout>
    </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
