import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-hot-toast';
import { Plus, Search, Edit, Trash2, User, X, Users , Loader2 } from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import TrainerForm from '../../components/TrainerForm';

interface Trainer {
  _id: string;
  name: string;
  email: string;
  phone: string;
  image?: string;
  assignedToAll: boolean;
  assignedMembers: Array<{
    _id: string;
    name: string;
    email: string;
    phoneNumber: string;
    photo?: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";


const Trainers = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTrainer, setEditingTrainer] = useState<Trainer | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // Fetch trainers
  const { data: trainers = [], isLoading, error, refetch } = useQuery<Trainer[]>('trainers', async () => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/trainers`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.data.trainers || [];
  });

  // Create trainer mutation
  const createTrainer = useMutation(
    async (data: any) => {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/trainers`, data, {
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
      });
      return response.data;
    },
    {
      onSuccess: () => {
        toast.success('Trainer created successfully');
        queryClient.invalidateQueries('trainers');
        setIsModalOpen(false);
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to create trainer');
      },
    }
  );

  // Update trainer mutation
  const updateTrainer = useMutation(
    async ({ id, data }: { id: string; data: any }) => {
      const token = localStorage.getItem('token');
      const response = await axios.patch(`${API_URL}/trainers/${id}`, data, {
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
      });
      return response.data;
    },
    {
      onSuccess: () => {
        toast.success('Trainer updated successfully');
        queryClient.invalidateQueries('trainers');
        setIsModalOpen(false);
        setEditingTrainer(null);
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to update trainer');
      },
    }
  );

  // Delete trainer mutation
  const deleteTrainer = useMutation(
    async (id: string) => {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/trainers/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    {
      onSuccess: () => {
        toast.success('Trainer deleted successfully');
        queryClient.invalidateQueries('trainers');
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to delete trainer');
      },
    }
  );

  const handleEdit = (trainer: Trainer) => {
    setEditingTrainer(trainer);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this trainer?')) {
      setIsDeleting(id);
      try {
        await deleteTrainer.mutateAsync(id);
      } catch (error) {
        console.error('Error deleting trainer:', error);
      } finally {
        setIsDeleting(null);
      }
    }
  };

  const handleSubmit = async (data: any) => {
    try {
      if (editingTrainer) {
        await updateTrainer.mutateAsync({ id: editingTrainer._id, data });
      } else {
        await createTrainer.mutateAsync(data);
      }
      resetForm();
    } catch (error) {
      console.error('Error saving trainer:', error);
    }
  };

  const resetForm = () => {
    setEditingTrainer(null);
    setIsModalOpen(false);
  };

  const filteredTrainers = trainers.filter(trainer =>
    trainer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    trainer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    trainer.phone.includes(searchTerm)
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border-l-4 border-red-500 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <X className="h-5 w-5 text-red-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                Failed to load trainers. Please try again later.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Trainers</h1>
        <button
          onClick={() => {
            setEditingTrainer(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
        >
          <Plus size={18} /> Add Trainer
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search trainers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned Members</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTrainers.length > 0 ? (
                filteredTrainers.map((trainer) => (
                  <tr key={trainer._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {trainer.image ? (
                          <img
                            src={trainer.image}
                            alt={trainer.name}
                            className="h-10 w-10 rounded-full object-cover mr-3"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                            <User className="h-5 w-5 text-gray-500" />
                          </div>
                        )}
                        <span className="font-medium text-gray-900">{trainer.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{trainer.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{trainer.phone || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {trainer.assignedToAll ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          All Members
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {trainer.assignedMembers?.length || 0} Members
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleEdit(trainer)}
                          className="p-1.5 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded-full transition-colors"
                          title="Edit Trainer"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(trainer._id)}
                          className="p-1.5 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-full transition-colors"
                          disabled={deleteTrainer.isLoading}
                          title="Delete Trainer"
                        >
                          {deleteTrainer.isLoading ? (
                            <div className="h-4 w-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                    No trainers found. Click "Add Trainer" to create one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Trainer Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">
                  {editingTrainer ? 'Edit Trainer' : 'Add New Trainer'}
                </h2>
                <button
                  onClick={resetForm}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <TrainerForm
                initialData={editingTrainer}
                onSubmit={handleSubmit}
                onCancel={resetForm}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Trainers;
