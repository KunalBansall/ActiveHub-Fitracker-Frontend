import axios from 'axios';
import { WorkoutPlan, DailyWorkout } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const getAuthConfig = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  };
};

// Member APIs
export const getMemberWorkoutPlan = async (): Promise<{ workoutPlan: WorkoutPlan, motivationalQuote: string }> => {
  try {
    const response = await axios.get(`${API_URL}/workouts/member/plan`, getAuthConfig());
    return response.data;
  } catch (error) {
    console.error('Error fetching member workout plan:', error);
    throw error;
  }
};

export const getTodaysWorkout = async (): Promise<{ workoutPlan: string, todaysWorkout: DailyWorkout | null, motivationalQuote: string, restDay?: boolean, noWorkoutPlan?: boolean }> => {
  try {
    const response = await axios.get(`${API_URL}/workouts/member/today`, getAuthConfig());
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      // If it's a 404, check the specific message
      const data = error.response?.data as any;
      const errorMessage = data?.message || '';
      
      if (data?.restDay || errorMessage.includes('No workout scheduled for today')) {
        // Return a valid response with a rest day flag
        return {
          workoutPlan: '',
          todaysWorkout: null,
          motivationalQuote: 'Today is a rest day. Take time to recover!',
          restDay: true
        };
      } else if (errorMessage.includes('No active workout plan found')) {
        // Return a response indicating no active workout plan
        return {
          workoutPlan: '',
          todaysWorkout: null,
          motivationalQuote: 'You don\'t have an active workout plan yet. Contact your trainer!',
          noWorkoutPlan: true
        };
      }
    }
    // Log the error but rethrow for other cases
    console.error('Error fetching today\'s workout:', error);
    throw error;
  }
};

export const updateExerciseStatus = async (planId: string, dayIndex: number, exerciseIndex: number, status: 'completed' | 'skipped' | 'rescheduled' | 'pending'): Promise<{ workoutPlan: WorkoutPlan }> => {
  try {
    const response = await axios.put(
      `${API_URL}/workouts/member/exercise-status`,
      { planId, dayIndex, exerciseIndex, status },
      getAuthConfig()
    );
    return response.data;
  } catch (error) {
    console.error('Error updating exercise status:', error);
    throw error;
  }
};

export const addMemberNotes = async (planId: string, dayIndex: number, notes: string): Promise<{ workoutPlan: WorkoutPlan }> => {
  try {
    const response = await axios.put(
      `${API_URL}/workouts/member/notes`,
      { planId, dayIndex, notes },
      getAuthConfig()
    );
    return response.data;
  } catch (error) {
    console.error('Error adding member notes:', error);
    throw error;
  }
};

// Admin APIs
export const createWorkoutPlan = async (memberId: string, workoutPlan: Omit<WorkoutPlan, '_id' | 'memberId' | 'gymId' | 'active' | 'consistency' | 'completedWorkouts' | 'missedWorkouts' | 'createdAt' | 'updatedAt'>): Promise<{ workoutPlan: WorkoutPlan }> => {
  try {
    const response = await axios.post(
      `${API_URL}/workouts/admin/member/${memberId}/plan`,
      workoutPlan,
      getAuthConfig()
    );
    return response.data;
  } catch (error) {
    console.error('Error creating workout plan:', error);
    throw error;
  }
};

export const updateWorkoutPlan = async (planId: string, updates: Partial<WorkoutPlan>): Promise<{ workoutPlan: WorkoutPlan }> => {
  try {
    const response = await axios.put(
      `${API_URL}/workouts/admin/plan/${planId}`,
      updates,
      getAuthConfig()
    );
    return response.data;
  } catch (error) {
    console.error('Error updating workout plan:', error);
    throw error;
  }
};

export const deleteWorkoutPlan = async (planId: string): Promise<{ message: string }> => {
  try {
    const response = await axios.delete(`${API_URL}/workouts/admin/plan/${planId}`, getAuthConfig());
    return response.data;
  } catch (error) {
    console.error('Error deleting workout plan:', error);
    throw error;
  }
};

export const getGymWorkoutPlans = async (): Promise<WorkoutPlan[]> => {
  try {
    const response = await axios.get(`${API_URL}/workouts/admin/plans`, getAuthConfig());
    return response.data;
  } catch (error) {
    console.error('Error fetching gym workout plans:', error);
    throw error;
  }
};

export const getMemberWorkoutPlans = async (memberId: string): Promise<WorkoutPlan[]> => {
  try {
    const response = await axios.get(`${API_URL}/workouts/admin/member/${memberId}/plans`, getAuthConfig());
    return response.data;
  } catch (error) {
    console.error('Error fetching member workout plans:', error);
    throw error;
  }
}; 