import axios, { AxiosInstance, AxiosError } from 'axios';
import {
  Meeting,
  Client,
  Project,
  MeetingVersion,
  MeetingTranslation,
  MeetingFormData,
  ClientFormData,
  ProjectFormData,
  PaginatedResponse,
  ProcessMeetingRequest,
  ProcessMeetingResponse,
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

  // ==================== MEETINGS ====================

  async getMeetings(params?: {
    page?: number;
    limit?: number;
    search?: string;
    client_id?: string;
    project_id?: string;
    status?: string;
  }): Promise<PaginatedResponse<Meeting>> {
    const response = await this.api.get('/api/meetings', { params });
    return response.data;
  }

  async getMeeting(id: string): Promise<Meeting> {
    const response = await this.api.get(`/api/meetings/${id}`);
    // ✅ תיקון: החזר data.data במקום data
    return response.data.data || response.data;
  }

  async createMeeting(data: MeetingFormData): Promise<Meeting> {
    const response = await this.api.post('/api/meetings', data);
    // ✅ תיקון: החזר data.data
    return response.data.data || response.data;
  }

  async updateMeeting(id: string, data: Partial<MeetingFormData>): Promise<Meeting> {
    const response = await this.api.put(`/api/meetings/${id}`, data);
    // ✅ תיקון: החזר data.data
    return response.data.data || response.data;
  }

  async patchMeeting(id: string, data: Partial<MeetingFormData>): Promise<Meeting> {
    const response = await this.api.patch(`/api/meetings/${id}`, data);
    // ✅ תיקון: החזר data.data
    return response.data.data || response.data;
  }

  async deleteMeeting(id: string): Promise<void> {
    await this.api.delete(`/api/meetings/${id}`);
  }

  // ==================== CLIENTS ====================

  async getClients(params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<PaginatedResponse<Client>> {
    const response = await this.api.get('/api/clients', { params });
    return response.data;
  }

  async getClient(id: string): Promise<Client> {
    const response = await this.api.get(`/api/clients/${id}`);
    return response.data.data || response.data;
  }

  async createClient(data: ClientFormData): Promise<Client> {
    const response = await this.api.post('/api/clients', data);
    return response.data.data || response.data;
  }

  async updateClient(id: string, data: Partial<ClientFormData>): Promise<Client> {
    const response = await this.api.put(`/api/clients/${id}`, data);
    return response.data.data || response.data;
  }

  async deleteClient(id: string): Promise<void> {
    await this.api.delete(`/api/clients/${id}`);
  }

  // ==================== PROJECTS ====================

  async getProjects(params?: {
    page?: number;
    limit?: number;
    search?: string;
    client_id?: string;
    status?: string;
  }): Promise<PaginatedResponse<Project>> {
    const response = await this.api.get('/api/projects', { params });
    return response.data;
  }

  async getProject(id: string): Promise<Project> {
    const response = await this.api.get(`/api/projects/${id}`);
    return response.data.data || response.data;
  }

  async createProject(data: ProjectFormData): Promise<Project> {
    const response = await this.api.post('/api/projects', data);
    return response.data.data || response.data;
  }

  async updateProject(id: string, data: Partial<ProjectFormData>): Promise<Project> {
    const response = await this.api.put(`/api/projects/${id}`, data);
    return response.data.data || response.data;
  }

  async deleteProject(id: string): Promise<void> {
    await this.api.delete(`/api/projects/${id}`);
  }

  // ==================== MEETING VERSIONS ====================

  async getMeetingVersions(meetingId: string): Promise<MeetingVersion[]> {
    const response = await this.api.get('/api/meeting_versions', {
      params: { meeting_id: meetingId },
    });
    return response.data.data || [];
  }

  async createMeetingVersion(meetingId: string, content: string): Promise<MeetingVersion> {
    const response = await this.api.post('/api/meeting_versions', {
      meeting_id: meetingId,
      content,
    });
    return response.data.data || response.data;
  }

  // ==================== MEETING TRANSLATIONS ====================

  async getMeetingTranslations(meetingId: string): Promise<MeetingTranslation[]> {
    const response = await this.api.get('/api/meeting_translations', {
      params: { meeting_id: meetingId },
    });
    return response.data.data || [];
  }

  // ==================== AI PROCESSING ====================

  async processMeeting(request: ProcessMeetingRequest): Promise<ProcessMeetingResponse> {
    const { meeting_id } = request;
    const response = await this.api.post(`/api/meetings/${meeting_id}/process`, request);
    return response.data.data || response.data;
  }

  async enrichMeeting(meetingId: string, content: string): Promise<string> {
    const response = await this.api.post(`/api/meetings/${meetingId}/enrich`, {
      meeting_id: meetingId,
      content,
    });
    return response.data.enriched_content;
  }

  async translateMeeting(meetingId: string, language: string = 'en'): Promise<MeetingTranslation> {
    const response = await this.api.post(`/api/meetings/${meetingId}/translate`, {
      language,
    });
    return response.data.data || response.data;
  }

  // ==================== EXPORT ====================

  async exportMeetingHTML(meetingId: string): Promise<string> {
    const response = await this.api.get(`/api/meetings/${meetingId}/export/html`);
    return response.data.html;
  }

  // ==================== HEALTH CHECK ====================

  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    const response = await this.api.get('/health');
    return response.data;
  }
}

export default new ApiService();
