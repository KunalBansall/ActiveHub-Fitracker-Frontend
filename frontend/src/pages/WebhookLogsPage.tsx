import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
const API_URL = import.meta.env.VITE_API_URL;


interface WebhookLog {
  _id: string;
  eventType: string;
  adminId: string;
  status: 'success' | 'failed';
  amount?: number;
  createdAt: string;
  payload?: any;
  error?: string;
}

interface FilterState {
  eventType: string;
  adminId: string;
  startDate: string;
  endDate: string;
}

const EVENT_TYPES = [
  'payment.captured',
  'payment.failed',
  'subscription.created',
  'subscription.activated',
  'subscription.cancelled',
  'refund.processed',
  'refund.failed'
] as const;

const WebhookLogsPage: React.FC = () => {
  const navigate = useNavigate();
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    eventType: '',
    adminId: '',
    startDate: '',
    endDate: ''
  });

  // Extract user from localStorage
  const user = (() => {
    try {
      const storedUser = localStorage.getItem('user');
      return storedUser ? JSON.parse(storedUser) : null;
    } catch {
      return null;
    }
  })();

  useEffect(() => {
    if (!user || user.role !== 'owner') {
      toast.error('Access denied. Owner privileges required.');
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (filters.eventType) params.append('eventType', filters.eventType);
      if (filters.adminId) params.append('adminId', filters.adminId);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const response = await axios.get<WebhookLog[]>(`${API_URL}/owner/webhooks?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setLogs(response.data);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const errorMessage = err.response?.data?.message || 'Failed to fetch webhook logs';
        setError(errorMessage);
        toast.error(errorMessage);
      } else {
        const errorMessage = 'An unexpected error occurred';
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'owner') {
      fetchLogs();
    }
  }, [user]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFilterSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    fetchLogs();
  };

  const handleResetFilters = () => {
    setFilters({
      eventType: '',
      adminId: '',
      startDate: '',
      endDate: ''
    });
    fetchLogs();
  };

  if (!user || user.role !== 'owner') return null;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* (rest of your component remains the same) */}
    </div>
  );
};

export default WebhookLogsPage;
