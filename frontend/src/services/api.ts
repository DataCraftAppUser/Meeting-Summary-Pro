import axios, { AxiosInstance, AxiosError } from 'axios';
import {
  Item,
  Workspace,
  Topic,
  ItemVersion,
  ItemTranslation,
  ItemFormData,
  WorkspaceFormData,
  TopicFormData,
  PaginatedResponse,
  ProcessItemRequest,
  ProcessItemResponse,
} from '../types';

// Remove trailing /api if present, since API calls already include /api
const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const API_BASE_URL = baseUrl.endsWith('/api') ? baseUrl.slice(0, -4) : baseUrl;

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    // Request interceptor
    this.api.interceptors.request.use(
      (config) => {
        // Add any auth tokens here if needed
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.api.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response) {
          console.error('API Error:', error.response.data);
        } else if (error.request) {
          console.error('Network Error:', error.message);
        }
        return Promise.reject(error);
      }
    );
  }

  // ==================== ITEMS ====================

  async getItems(params?: {
    page?: number;
    limit?: number;
    search?: string;
    workspace_id?: string;
    topic_id?: string;
    status?: string;
    content_type?: string;
  }): Promise<PaginatedResponse<Item>> {
    const response = await this.api.get('/api/items', { params });
    return response.data;
  }

  async getItem(id: string): Promise<Item> {
    const response = await this.api.get(`/api/items/${id}`);
    return response.data.data || response.data;
  }

  async createItem(data: ItemFormData): Promise<Item> {
    const response = await this.api.post('/api/items', data);
    return response.data.data || response.data;
  }

  async updateItem(id: string, data: Partial<ItemFormData>): Promise<Item> {
    const response = await this.api.put(`/api/items/${id}`, data);
    return response.data.data || response.data;
  }

  async patchItem(id: string, data: Partial<ItemFormData>): Promise<Item> {
    const response = await this.api.patch(`/api/items/${id}`, data);
    return response.data.data || response.data;
  }

  async deleteItem(id: string): Promise<void> {
    await this.api.delete(`/api/items/${id}`);
  }

  // ==================== WORKSPACES ====================

  async getWorkspaces(params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<PaginatedResponse<Workspace>> {
    const response = await this.api.get('/api/workspaces', { params });
    return response.data;
  }

  async getWorkspace(id: string): Promise<Workspace> {
    const response = await this.api.get(`/api/workspaces/${id}`);
    return response.data.data || response.data;
  }

  async createWorkspace(data: WorkspaceFormData): Promise<Workspace> {
    const response = await this.api.post('/api/workspaces', data);
    return response.data.data || response.data;
  }

  async updateWorkspace(id: string, data: Partial<WorkspaceFormData>): Promise<Workspace> {
    const response = await this.api.put(`/api/workspaces/${id}`, data);
    return response.data.data || response.data;
  }

  async deleteWorkspace(id: string): Promise<void> {
    await this.api.delete(`/api/workspaces/${id}`);
  }

  // ==================== TOPICS ====================

  async getTopics(params?: {
    page?: number;
    limit?: number;
    search?: string;
    workspace_id?: string;
    status?: string;
  }): Promise<PaginatedResponse<Topic>> {
    const response = await this.api.get('/api/topics', { params });
    return response.data;
  }

  async getTopic(id: string): Promise<Topic> {
    const response = await this.api.get(`/api/topics/${id}`);
    return response.data.data || response.data;
  }

  async createTopic(data: TopicFormData): Promise<Topic> {
    const response = await this.api.post('/api/topics', data);
    return response.data.data || response.data;
  }

  async updateTopic(id: string, data: Partial<TopicFormData>): Promise<Topic> {
    const response = await this.api.put(`/api/topics/${id}`, data);
    return response.data.data || response.data;
  }

  async deleteTopic(id: string): Promise<void> {
    await this.api.delete(`/api/topics/${id}`);
  }

  // ==================== ITEM VERSIONS ====================

  async getItemVersions(itemId: string): Promise<ItemVersion[]> {
    const response = await this.api.get(`/api/items/${itemId}/versions`);
    return response.data.data || [];
  }

  // ==================== ITEM TRANSLATIONS ====================

  async getItemTranslations(itemId: string): Promise<ItemTranslation[]> {
    // Note: This endpoint might not exist yet, but keeping for future use
    const response = await this.api.get(`/api/items/${itemId}/translations`);
    return response.data.data || [];
  }

  // ==================== AI PROCESSING ====================

  async processItem(itemId: string): Promise<Item> {
    const response = await this.api.post(`/api/items/${itemId}/process`);
    return response.data.data || response.data;
  }

  async enrichItem(itemId: string, content: string): Promise<Item> {
    const response = await this.api.post(`/api/items/${itemId}/enrich`, {
      content,
    });
    return response.data.data || response.data;
  }

  async translateItem(itemId: string, language: string = 'en'): Promise<ItemTranslation> {
    const response = await this.api.post(`/api/items/${itemId}/translate`, {
      language,
    });
    return response.data.data || response.data;
  }

  // ==================== HEALTH CHECK ====================

  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    const response = await this.api.get('/health');
    return response.data;
  }
}

export default new ApiService();
