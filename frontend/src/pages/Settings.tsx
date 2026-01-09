import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClients } from '../hooks/useClients';
import { useProjects } from '../hooks/useProjects';
import Loading from '../components/Common/Loading';
import ManageEntitiesDialog from '../components/Common/ManageEntitiesDialog';

export default function Settings() {
  const navigate = useNavigate();
  const { clients, loading: loadingClients, fetchClients, createClient, updateClient, deleteClient } = useClients();
  const { projects, loading: loadingProjects, fetchProjects, createProject, updateProject, deleteProject } = useProjects();

  const [dialogOpen, setDialogOpen] = useState(true); // נפתח אוטומטית

  useEffect(() => {
    fetchClients();
    fetchProjects();
  }, []);

  // Wrapper functions for the dialog
  const handleClientEdit = async (id: string, name: string): Promise<boolean> => {
    try {
      await updateClient(id, { name });
      await fetchClients();
      return true;
    } catch (error) {
      console.error('Error updating client:', error);
      return false;
    }
  };

  const handleClientDelete = async (id: string): Promise<boolean> => {
    try {
      await deleteClient(id);
      await fetchClients();
      return true;
    } catch (error) {
      console.error('Error deleting client:', error);
      return false;
    }
  };

  const handleClientCreate = async (name: string): Promise<boolean> => {
    try {
      await createClient({ name });
      await fetchClients();
      return true;
    } catch (error) {
      console.error('Error creating client:', error);
      return false;
    }
  };

  const handleProjectEdit = async (id: string, name: string): Promise<boolean> => {
    try {
      const project = projects.find((p) => p.id === id);
      if (project) {
        await updateProject(id, {
          name,
          client_id: project.client_id,
          status: project.status,
        });
        await fetchProjects();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating project:', error);
      return false;
    }
  };

  const handleProjectDelete = async (id: string): Promise<boolean> => {
    try {
      await deleteProject(id);
      await fetchProjects();
      return true;
    } catch (error) {
      console.error('Error deleting project:', error);
      return false;
    }
  };

  const handleProjectCreate = async (name: string, clientId: string): Promise<boolean> => {
    try {
      await createProject({ name, client_id: clientId, status: 'active' });
      await fetchProjects();
      return true;
    } catch (error) {
      console.error('Error creating project:', error);
      return false;
    }
  };

  const handleUpdate = () => {
    fetchClients();
    fetchProjects();
  };

  const handleClose = () => {
    setDialogOpen(false);
    // חזור לרשימת הפגישות אחרי סגירת ה-Dialog
    navigate('/meetings');
  };

  if (loadingClients || loadingProjects) {
    return <Loading />;
  }

  return (
    <ManageEntitiesDialog
      open={dialogOpen}
      onClose={handleClose}
      clients={clients}
      projects={projects}
      onClientEdit={handleClientEdit}
      onClientDelete={handleClientDelete}
      onClientCreate={handleClientCreate}
      onProjectEdit={handleProjectEdit}
      onProjectDelete={handleProjectDelete}
      onProjectCreate={handleProjectCreate}
      onUpdate={handleUpdate}
    />
  );
}
