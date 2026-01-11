import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkspaces } from '../hooks/useWorkspaces';
import { useTopics } from '../hooks/useTopics';
import { usePrompts } from '../hooks/usePrompts';
import Loading from '../components/Common/Loading';
import ManageEntitiesDialog from '../components/Common/ManageEntitiesDialog';

export default function Settings() {
  const navigate = useNavigate();
  const { workspaces, loading: loadingWorkspaces, fetchWorkspaces, createWorkspace, updateWorkspace, deleteWorkspace } = useWorkspaces();
  const { topics, loading: loadingTopics, fetchTopics, createTopic, updateTopic, deleteTopic } = useTopics();
  const { prompts, loading: loadingPrompts, fetchPrompts, updatePrompt } = usePrompts();

  const [dialogOpen, setDialogOpen] = useState(true); // נפתח אוטומטית

  useEffect(() => {
    fetchWorkspaces();
    fetchTopics();
    fetchPrompts();
  }, []);

  // Wrapper functions for the dialog
  const handleWorkspaceEdit = async (id: string, name: string): Promise<boolean> => {
    try {
      await updateWorkspace(id, { name });
      await fetchWorkspaces();
      return true;
    } catch (error) {
      console.error('Error updating workspace:', error);
      return false;
    }
  };

  const handleWorkspaceDelete = async (id: string): Promise<boolean> => {
    try {
      await deleteWorkspace(id);
      await fetchWorkspaces();
      return true;
    } catch (error) {
      console.error('Error deleting workspace:', error);
      return false;
    }
  };

  const handleWorkspaceCreate = async (name: string): Promise<boolean> => {
    try {
      await createWorkspace({ name });
      await fetchWorkspaces();
      return true;
    } catch (error) {
      console.error('Error creating workspace:', error);
      return false;
    }
  };

  const handleTopicEdit = async (id: string, name: string): Promise<boolean> => {
    try {
      const topic = topics.find((t) => t.id === id);
      if (topic) {
        await updateTopic(id, {
          name,
          workspace_id: topic.workspace_id || '',
          status: topic.status,
        });
        await fetchTopics();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating topic:', error);
      return false;
    }
  };

  const handleTopicDelete = async (id: string): Promise<boolean> => {
    try {
      await deleteTopic(id);
      await fetchTopics();
      return true;
    } catch (error) {
      console.error('Error deleting topic:', error);
      return false;
    }
  };

  const handleTopicCreate = async (name: string, workspaceId: string): Promise<boolean> => {
    try {
      await createTopic({ name, workspace_id: workspaceId, status: 'active' });
      await fetchTopics();
      return true;
    } catch (error) {
      console.error('Error creating topic:', error);
      return false;
    }
  };

  const handlePromptUpdate = async (id: string, content: string): Promise<boolean> => {
    try {
      const success = await updatePrompt(id, content);
      if (success) {
        await fetchPrompts();
      }
      return success;
    } catch (error) {
      console.error('Error updating prompt:', error);
      return false;
    }
  };

  const handleUpdate = () => {
    fetchWorkspaces();
    fetchTopics();
    fetchPrompts();
  };

  const handleClose = () => {
    setDialogOpen(false);
    // חזור לרשימת הפריטים אחרי סגירת ה-Dialog
    navigate('/items');
  };

  if (loadingWorkspaces || loadingTopics || loadingPrompts) {
    return <Loading />;
  }

  return (
    <ManageEntitiesDialog
      open={dialogOpen}
      onClose={handleClose}
      workspaces={workspaces}
      topics={topics}
      prompts={prompts}
      onWorkspaceEdit={handleWorkspaceEdit}
      onWorkspaceDelete={handleWorkspaceDelete}
      onWorkspaceCreate={handleWorkspaceCreate}
      onTopicEdit={handleTopicEdit}
      onTopicDelete={handleTopicDelete}
      onTopicCreate={handleTopicCreate}
      onPromptUpdate={handlePromptUpdate}
      onUpdate={handleUpdate}
    />
  );
}
