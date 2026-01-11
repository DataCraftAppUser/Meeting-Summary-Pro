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
  private sessionCache: { token: string | null; timestamp: number } | null = null;
  private sessionPromise: Promise<any> | null = null;
  private readonly CACHE_DURATION = 5000; // Cache for 5 seconds

  constructor() {
    console.log('🔧 API Service initialized');
    console.log('Base URL:', API_BASE_URL);
    console.log('Full API URL will be:', `${API_BASE_URL}/api/...`);
    
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 120000, // 120 seconds for AI processing
    });

    // Request interceptor
    this.api.interceptors.request.use(
      async (config: any) => {
        const requestStart = performance.now();
        console.log('📤 API Request:', config.method?.toUpperCase(), config.url);
        
        // Check if we should skip the interceptor (when auth is already provided)
        if (config.skipAuthInterceptor === true) {
          console.log('✅ Skipping auth interceptor (auth already provided)');
          console.log(`⏱️ Request interceptor time: ${(performance.now() - requestStart).toFixed(0)}ms`);
          return config;
        }
        
        // Check cache first
        const now = Date.now();
        if (this.sessionCache && (now - this.sessionCache.timestamp) < this.CACHE_DURATION) {
          if (this.sessionCache.token) {
            config.headers.Authorization = `Bearer ${this.sessionCache.token}`;
            console.log(`✅ Auth token from cache (${(performance.now() - requestStart).toFixed(0)}ms)`);
            return config;
          }
        }
        
        // If there's already a getSession() call in progress, wait for it
        if (this.sessionPromise) {
          console.log('⏳ Waiting for existing getSession() call...');
          const session = await this.sessionPromise;
          if (session?.access_token) {
            config.headers.Authorization = `Bearer ${session.access_token}`;
            console.log(`✅ Auth token from pending request (${(performance.now() - requestStart).toFixed(0)}ms)`);
            return config;
          }
        }
        
        // Add auth token from Supabase session
        const sessionStart = performance.now();
        this.sessionPromise = import('./supabase')
          .then(m => m.supabase.auth.getSession())
          .then(result => result.data.session);
        
        try {
          const session = await this.sessionPromise;
          const sessionTime = performance.now() - sessionStart;
          
          if (session?.access_token) {
            // Update cache
            this.sessionCache = {
              token: session.access_token,
              timestamp: now
            };
            config.headers.Authorization = `Bearer ${session.access_token}`;
            console.log(`✅ Auth token added to request (${sessionTime.toFixed(0)}ms)`);
          } else {
            // Clear cache
            this.sessionCache = { token: null, timestamp: now };
            console.log(`⚠️ No session found for API request (${sessionTime.toFixed(0)}ms)`);
          }
        } finally {
          // Clear the promise after it's done
          this.sessionPromise = null;
        }
        
        const requestTime = performance.now() - requestStart;
        console.log(`⏱️ Request interceptor time: ${requestTime.toFixed(0)}ms`);
        return config;
      },
      (error) => {
        console.error('❌ Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.api.interceptors.response.use(
      (response) => {
        console.log('📥 API Response:', response.status, response.config.url);
        return response;
      },
      (error: AxiosError) => {
        console.error('❌ API Error:', error.config?.url);
        if (error.response) {
          console.error('Response status:', error.response.status);
          console.error('Response data:', error.response.data);
        } else if (error.request) {
          console.error('No response received. Network error:', error.message);
          console.error('Request URL:', error.config?.url);
        } else {
          console.error('Error setting up request:', error.message);
        }
        return Promise.reject(error);
      }
    );
  }

  // ==================== ITEMS ====================

  async getItems(params?: {
    hub_id?: string;
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

  async getItem(id: string, hubId: string): Promise<Item> {
    const response = await this.api.get(`/api/items/${id}`, { params: { hub_id: hubId } });
    return response.data.data || response.data;
  }

  async createItem(data: ItemFormData & { hub_id: string }): Promise<Item> {
    const response = await this.api.post('/api/items', data);
    return response.data.data || response.data;
  }

  async updateItem(id: string, data: Partial<ItemFormData> & { hub_id: string }): Promise<Item> {
    const response = await this.api.put(`/api/items/${id}`, data);
    return response.data.data || response.data;
  }

  async patchItem(id: string, data: Partial<ItemFormData> & { hub_id: string }): Promise<Item> {
    const response = await this.api.patch(`/api/items/${id}`, data);
    return response.data.data || response.data;
  }

  async deleteItem(id: string, hubId: string): Promise<void> {
    await this.api.delete(`/api/items/${id}`, { params: { hub_id: hubId } });
  }

  // ==================== WORKSPACES ====================

  async getWorkspaces(params?: {
    hub_id?: string;
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
    hub_id?: string;
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

  async getItemVersions(itemId: string, hubId: string): Promise<ItemVersion[]> {
    const response = await this.api.get(`/api/items/${itemId}/versions`, { params: { hub_id: hubId } });
    return response.data.data || [];
  }

  // ==================== ITEM TRANSLATIONS ====================

  async getItemTranslations(itemId: string): Promise<ItemTranslation[]> {
    // Note: This endpoint might not exist yet, but keeping for future use
    const response = await this.api.get(`/api/items/${itemId}/translations`);
    return response.data.data || [];
  }

  // ==================== AI PROCESSING ====================

  async processItem(itemId: string, hubId: string): Promise<Item> {
    const response = await this.api.post(`/api/items/${itemId}/process`, { hub_id: hubId });
    return response.data.data || response.data;
  }

  async translateItem(itemId: string, hubId: string, language: string = 'en'): Promise<ItemTranslation> {
    const response = await this.api.post(`/api/items/${itemId}/translate`, {
      hub_id: hubId,
      language,
    });
    return response.data.data || response.data;
  }

  // ==================== GENERIC HTTP METHODS ====================

  async get(url: string, config?: any) {
    return this.api.get(url, config);
  }

  async post(url: string, data?: any, config?: any) {
    return this.api.post(url, data, config);
  }

  async put(url: string, data?: any, config?: any) {
    return this.api.put(url, data, config);
  }

  async delete(url: string, config?: any) {
    return this.api.delete(url, config);
  }

  // ==================== AI PROMPTS ====================

  async getPrompts(): Promise<any[]> {
    const response = await this.api.get('/api/prompts');
    return response.data;
  }

  async updatePrompt(id: string, content: string, configuration?: any): Promise<any> {
    const response = await this.api.put(`/api/prompts/${id}`, { content, configuration });
    return response.data;
  }

  // ==================== HUBS ====================

  async getHub(id: string): Promise<any> {
    const response = await this.api.get(`/api/hubs/${id}`);
    return response.data.data || response.data;
  }

  async createHub(data: { name: string; type?: 'personal' | 'shared'; color_theme?: 'green' | 'navy'; icon?: string }): Promise<any> {
    const response = await this.api.post('/api/hubs', data);
    return response.data.data || response.data;
  }

  async updateHub(id: string, data: { name?: string; type?: 'personal' | 'shared'; color_theme?: 'green' | 'navy'; icon?: string }): Promise<any> {
    const response = await this.api.put(`/api/hubs/${id}`, data);
    return response.data.data || response.data;
  }

  async deleteHub(id: string): Promise<void> {
    await this.api.delete(`/api/hubs/${id}`);
  }

  async getHubMembers(hubId: string): Promise<any[]> {
    const response = await this.api.get(`/api/hubs/${hubId}/members`);
    return response.data.data || [];
  }

  async addHubMember(hubId: string, email: string, role: 'owner' | 'member' = 'member'): Promise<any> {
    const response = await this.api.post(`/api/hubs/${hubId}/members`, { email, role });
    return response.data.data || response.data;
  }

  async removeHubMember(hubId: string, memberId: string): Promise<void> {
    await this.api.delete(`/api/hubs/${hubId}/members/${memberId}`);
  }

  // ==================== ADMIN ====================

  async getAllUsers(): Promise<any[]> {
    const response = await this.api.get('/api/admin/all-users');
    return response.data.data || [];
  }

  // ==================== HEALTH CHECK ====================

  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    const response = await this.api.get('/health');
    return response.data;
  }
}

const apiService = new ApiService();
export default apiService;
export const api = apiService;
