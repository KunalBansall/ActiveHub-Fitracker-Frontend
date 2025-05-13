import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const getAuthConfig = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  };
};

export interface DeveloperAnnouncement {
  _id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'update';
  visible: boolean;
  mediaUrl?: string | null;
  mediaType?: 'image' | 'video' | null;
  targetAudience?: 'all' | 'trial' | 'active' | 'expired';
  createdAt: string;
  updatedAt: string;
}

export interface CreateAnnouncementRequest {
  title: string;
  message: string;
  type: 'info' | 'warning' | 'update';
  visible?: boolean;
  mediaUrl?: string | null;
  mediaType?: 'image' | 'video' | null;
  targetAudience?: 'all' | 'trial' | 'active' | 'expired';
  sendEmail?: boolean;
}

// Owner endpoints
export const createAnnouncement = (data: CreateAnnouncementRequest) => {
  return axios.post<{ success: boolean; announcement: DeveloperAnnouncement }>(
    `${API_URL}/owner/announcements`, 
    data, 
    getAuthConfig()
  );
};

export const getOwnerAnnouncements = () => {
  return axios.get<DeveloperAnnouncement[]>(
    `${API_URL}/owner/announcements`, 
    getAuthConfig()
  );
};

export const updateAnnouncement = (id: string, data: Partial<DeveloperAnnouncement>) => {
  return axios.put<{ success: boolean; announcement: DeveloperAnnouncement }>(
    `${API_URL}/owner/announcements/${id}`, 
    data, 
    getAuthConfig()
  );
};

export const deleteAnnouncement = (id: string) => {
  return axios.delete<{ success: boolean; message: string }>(
    `${API_URL}/owner/announcements/${id}`, 
    getAuthConfig()
  );
};

// Admin endpoints
export const getAdminAnnouncements = () => {
  return axios.get<DeveloperAnnouncement[]>(
    `${API_URL}/admin/announcements/developer`, 
    getAuthConfig()
  );
};
