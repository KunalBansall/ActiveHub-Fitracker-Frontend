import React, { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { WorkoutPlan, DailyWorkout, Exercise } from '../types';
import { createWorkoutPlan, getMemberWorkoutPlans, updateWorkoutPlan, getGymWorkoutPlans } from '../services/workoutService';
import { toast } from 'react-hot-toast';

// Define the valid day type
type DayType = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

interface WorkoutPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  memberId: string;
  memberName: string;
}

const WorkoutPlanModal: React.FC<WorkoutPlanModalProps> = ({ isOpen, onClose, memberId, memberName }) => {
  const [step, setStep] = useState<number>(1);
  const [planName, setPlanName] = useState<string>('');
  const [goal, setGoal] = useState<'muscle_gain' | 'fat_loss' | 'strength' | 'endurance' | 'general_fitness'>('general_fitness');
  const [experienceLevel, setExperienceLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [accessType, setAccessType] = useState<'gym' | 'home' | 'both'>('gym');
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState<string>(new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0]);
  const [preferredWorkoutDays, setPreferredWorkoutDays] = useState<DayType[]>(['Monday', 'Wednesday', 'Friday']);
  const [dailyWorkouts, setDailyWorkouts] = useState<DailyWorkout[]>([]);
  const [injuries, setInjuries] = useState<string[]>([]);
  const [limitations, setLimitations] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  
  // Current day being edited - updated to use the DayType
  const [currentDay, setCurrentDay] = useState<DayType | ''>('');
  const [currentFocus, setCurrentFocus] = useState<string>('');
  const [currentExercises, setCurrentExercises] = useState<Exercise[]>([]);
  const [currentWarmup, setCurrentWarmup] = useState<string[]>([]);
  const [currentCooldown, setCurrentCooldown] = useState<string[]>([]);

  // Add a state to track whether we're editing an existing plan or creating a new one
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [currentPlanId, setCurrentPlanId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [existingPlans, setExistingPlans] = useState<WorkoutPlan[]>([]);
  
  // Add state for gym-wide template plans
  const [templatePlans, setTemplatePlans] = useState<WorkoutPlan[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState<boolean>(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [showTemplates, setShowTemplates] = useState<boolean>(false);

  // Reset all state when modal is closed
  const handleClose = () => {
    if (!isEditing) {
      // Only reset the form if not editing (preserve data for editing)
      resetForm();
    }
    onClose();
  };

  // Function to fetch existing workout plans for the member
  const fetchExistingPlans = async () => {
    if (!memberId || !isOpen) return;
    
    try {
      setLoading(true);
      const plans = await getMemberWorkoutPlans(memberId);
      setExistingPlans(plans.filter(plan => plan.active));
      
      // If there's an active plan, pre-populate the form with its data
      const activePlan = plans.find(plan => plan.active);
      if (activePlan) {
        setIsEditing(true);
        setCurrentPlanId(activePlan._id);
        loadPlanData(activePlan);
      }
    } catch (error) {
      console.error('Error fetching workout plans:', error);
      toast.error('Failed to load existing workout plans');
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch all workout plans from the gym (to use as templates)
  const fetchTemplateWorkoutPlans = async () => {
    try {
      setLoadingTemplates(true);
      const plans = await getGymWorkoutPlans();
      // Filter out plans that might be duplicates of the current member's plans
      const filteredPlans = plans.filter(plan => !existingPlans.some(ep => ep._id === plan._id));
      setTemplatePlans(filteredPlans);
    } catch (error) {
      console.error('Error fetching template workout plans:', error);
      toast.error('Failed to load workout plan templates');
    } finally {
      setLoadingTemplates(false);
    }
  };

  // Load a template plan when selected
  const loadTemplatePlan = (templateId: string) => {
    const template = templatePlans.find(plan => plan._id === templateId);
    if (!template) return;
    
    // Update plan name to indicate it's a copy
    setPlanName(`${template.name} - ${memberName}'s Copy`);
    setGoal(template.goal);
    setExperienceLevel(template.experienceLevel);
    setAccessType(template.accessType);
    setPreferredWorkoutDays(template.preferredWorkoutDays as DayType[]);
    setDailyWorkouts(template.dailyWorkouts);
    
    // Keep the current dates and member-specific information
    toast.success(`Template "${template.name}" loaded successfully!`);
  };

  // Function to load existing plan data into the form
  const loadPlanData = (plan: WorkoutPlan) => {
    setPlanName(plan.name);
    setGoal(plan.goal);
    setExperienceLevel(plan.experienceLevel);
    setAccessType(plan.accessType);
    setStartDate(new Date(plan.startDate).toISOString().split('T')[0]);
    setEndDate(new Date(plan.endDate).toISOString().split('T')[0]);
    setPreferredWorkoutDays(plan.preferredWorkoutDays as DayType[]);
    setDailyWorkouts(plan.dailyWorkouts);
    setInjuries(plan.injuries || []);
    setLimitations(plan.limitations || []);
  };

  // Fetch existing plans when the modal opens
  useEffect(() => {
    if (isOpen) {
      fetchExistingPlans();
      fetchTemplateWorkoutPlans();
    }
  }, [isOpen, memberId]);

  // Update selected template when changing
  useEffect(() => {
    if (selectedTemplate) {
      loadTemplatePlan(selectedTemplate);
    }
  }, [selectedTemplate]);

  // Modify the handle submit function to either create or update
  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      
      // Create the workout plan object
      const workoutPlanData: Omit<WorkoutPlan, '_id' | 'memberId' | 'gymId' | 'active' | 'consistency' | 'completedWorkouts' | 'missedWorkouts' | 'createdAt' | 'updatedAt'> = {
        name: planName,
        goal,
        experienceLevel,
        accessType,
        startDate,
        endDate,
        preferredWorkoutDays: preferredWorkoutDays as any,
        dailyWorkouts,
        injuries,
        limitations
      };
      
      if (isEditing && currentPlanId) {
        // Update existing plan
        await updateWorkoutPlan(currentPlanId, workoutPlanData);
        toast.success('Workout plan updated successfully!');
      } else {
        // Create new plan
        await createWorkoutPlan(memberId, workoutPlanData);
        toast.success('Workout plan created successfully!');
      }
      
      handleClose();
    } catch (error) {
      console.error('Error with workout plan:', error);
      toast.error(`Failed to ${isEditing ? 'update' : 'create'} workout plan. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Function to reset form to default values
  const resetForm = () => {
    setStep(1);
    setPlanName('');
    setGoal('general_fitness');
    setExperienceLevel('beginner');
    setAccessType('gym');
    setStartDate(new Date().toISOString().split('T')[0]);
    setEndDate(new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0]);
    setPreferredWorkoutDays(['Monday', 'Wednesday', 'Friday']);
    setDailyWorkouts([]);
    setInjuries([]);
    setLimitations([]);
    setCurrentDay('');
    setCurrentFocus('');
    setCurrentExercises([]);
    setCurrentWarmup([]);
    setCurrentCooldown([]);
    setIsSubmitting(false);
    setIsEditing(false);
    setCurrentPlanId('');
    setSelectedTemplate('');
    setShowTemplates(false);
  };

  // New function to initialize a workout day - update to use DayType
  const initializeWorkoutDay = (day: DayType) => {
    if (!preferredWorkoutDays.includes(day)) {
      toast.error(`${day} is not selected as a workout day.`);
      return;
    }
    
    // Check if day already exists
    const existingDay = dailyWorkouts.find(workout => workout.day === day);
    if (existingDay) {
      // Edit existing day
      setCurrentDay(day);
      setCurrentFocus(existingDay.focus);
      setCurrentExercises([...existingDay.exercises]);
      setCurrentWarmup([...existingDay.warmup]);
      setCurrentCooldown([...existingDay.cooldown]);
    } else {
      // Create new day
      setCurrentDay(day);
      setCurrentFocus('');
      setCurrentExercises([]);
      setCurrentWarmup([]);
      setCurrentCooldown([]);
    }
  };

  // Function to add a new exercise
  const addExercise = () => {
    setCurrentExercises([
      ...currentExercises,
      {
        name: '',
        sets: 3,
        reps: '10',
        restTime: 60,
        completed: 'pending',
        equipmentRequired: [],
        notes: ''
      }
    ]);
  };

  // Function to update exercise at specific index
  const updateExercise = (index: number, field: keyof Exercise, value: any) => {
    const updatedExercises = [...currentExercises];
    updatedExercises[index] = {
      ...updatedExercises[index],
      [field]: value
    };
    setCurrentExercises(updatedExercises);
  };

  // Function to remove exercise at specific index
  const removeExercise = (index: number) => {
    setCurrentExercises(currentExercises.filter((_, i) => i !== index));
  };

  // Function to save the current day workout - update for DayType
  const saveWorkoutDay = () => {
    if (!currentDay || !currentFocus || currentExercises.length === 0) {
      toast.error('Please fill out all required fields for the workout day.');
      return;
    }
    
    // Check if all exercises have required fields
    const incompleteExercises = currentExercises.filter(
      ex => !ex.name || !ex.sets || !ex.reps || ex.restTime === undefined
    );
    
    if (incompleteExercises.length > 0) {
      toast.error('Please complete all exercise details.');
      return;
    }
    
    // Create the daily workout object
    const dailyWorkout: DailyWorkout = {
      day: currentDay,
      focus: currentFocus,
      completed: false,
      exercises: currentExercises,
      warmup: currentWarmup,
      cooldown: currentCooldown
    };
    
    // Check if the day already exists in dailyWorkouts
    const existingIndex = dailyWorkouts.findIndex(workout => workout.day === currentDay);
    
    if (existingIndex >= 0) {
      // Update existing workout
      const updatedWorkouts = [...dailyWorkouts];
      updatedWorkouts[existingIndex] = dailyWorkout;
      setDailyWorkouts(updatedWorkouts);
    } else {
      // Add new workout
      setDailyWorkouts([...dailyWorkouts, dailyWorkout]);
    }
    
    // Reset current fields
    setCurrentDay('');
    setCurrentFocus('');
    setCurrentExercises([]);
    setCurrentWarmup([]);
    setCurrentCooldown([]);
    
    toast.success(`Workout for ${currentDay} saved!`);
  };

  // Function to add item to warmup or cooldown
  const addItem = (type: 'warmup' | 'cooldown', item: string) => {
    if (!item.trim()) return;
    
    if (type === 'warmup') {
      setCurrentWarmup([...currentWarmup, item.trim()]);
    } else {
      setCurrentCooldown([...currentCooldown, item.trim()]);
    }
    
    // Clear the input
    const input = document.getElementById(`${type}-input`) as HTMLInputElement;
    if (input) input.value = '';
  };

  // Function to remove item from warmup or cooldown
  const removeItem = (type: 'warmup' | 'cooldown', index: number) => {
    if (type === 'warmup') {
      setCurrentWarmup(currentWarmup.filter((_, i) => i !== index));
    } else {
      setCurrentCooldown(currentCooldown.filter((_, i) => i !== index));
    }
  };

  return (
    <Transition show={isOpen} as={React.Fragment}>
      <Dialog 
        as="div" 
        className="fixed inset-0 z-50 overflow-y-auto" 
        onClose={() => !isSubmitting && handleClose()}
      >
        <div className="min-h-screen px-4 text-center">
          <Transition.Child
            as={React.Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />
          </Transition.Child>

          {/* This element centers the modal content */}
          <span
            className="inline-block h-screen align-middle"
            aria-hidden="true"
          >
            &#8203;
          </span>
          
          <Transition.Child
            as={React.Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <div className="inline-block w-full max-w-4xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
              {/* Header */}
              <div className="flex justify-between items-center mb-4">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-bold leading-6 text-gray-900"
                >
                  {isEditing 
                    ? `Edit Workout Plan for ${memberName}` 
                    : (step === 1 ? `Create Workout Plan for ${memberName}` : 
                       step === 2 ? "Configure Daily Workouts" : 
                       "Review and Save Workout Plan")}
                </Dialog.Title>
                <button
                  type="button"
                  className="text-gray-400 hover:text-gray-500"
                  onClick={handleClose}
                  disabled={isSubmitting}
                >
                  <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                </button>
              </div>
              
              {/* If loading, show loading indicator */}
              {loading ? (
                <div className="flex justify-center items-center my-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
                </div>
              ) : (
                <>
                  {/* Existing workout plans selector (if in editing mode) */}
                  {existingPlans.length > 0 && (
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {isEditing ? "Currently Editing" : "Select Existing Plan to Edit"}
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {existingPlans.map(plan => (
                          <button
                            key={plan._id}
                            type="button"
                            onClick={() => {
                              setIsEditing(true);
                              setCurrentPlanId(plan._id);
                              loadPlanData(plan);
                            }}
                            className={`px-4 py-2 rounded-md text-sm font-medium ${
                              currentPlanId === plan._id 
                                ? 'bg-indigo-100 text-indigo-800 border border-indigo-300' 
                                : 'bg-gray-100 text-gray-800 border border-gray-300'
                            }`}
                          >
                            {plan.name}
                          </button>
                        ))}
                        
                        {isEditing && (
                          <button
                            type="button"
                            onClick={() => {
                              setIsEditing(false);
                              setCurrentPlanId('');
                              resetForm();
                            }}
                            className="px-4 py-2 rounded-md text-sm font-medium bg-blue-100 text-blue-800 border border-blue-300"
                          >
                            Create New Plan Instead
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Template plan selector (when creating a new plan) */}
                  {!isEditing && step === 1 && (
                    <div className="mb-6">
                      <div className="flex justify-between items-center">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Use an Existing Template
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowTemplates(!showTemplates)}
                          className="text-sm text-indigo-600 hover:text-indigo-800"
                        >
                          {showTemplates ? 'Hide Templates' : 'Show Templates'}
                        </button>
                      </div>
                      
                      {showTemplates && (
                        <>
                          {loadingTemplates ? (
                            <div className="flex justify-center items-center my-4">
                              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-indigo-600"></div>
                            </div>
                          ) : templatePlans.length > 0 ? (
                            <div className="mt-2 border border-gray-200 rounded-md p-3 bg-gray-50">
                              <p className="text-sm text-gray-500 mb-3">
                                Select a template to use as a starting point. This will pre-fill the workout plan details.
                              </p>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto">
                                {templatePlans.map(plan => (
                                  <div 
                                    key={plan._id} 
                                    className={`p-3 rounded-md cursor-pointer transition-colors ${
                                      selectedTemplate === plan._id 
                                        ? 'bg-indigo-100 border border-indigo-300' 
                                        : 'bg-white border border-gray-200 hover:bg-gray-100'
                                    }`}
                                    onClick={() => setSelectedTemplate(plan._id)}
                                  >
                                    <div className="font-medium text-gray-900">{plan.name}</div>
                                    <div className="text-xs text-gray-500 mt-1">
                                      Goal: {plan.goal.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      Level: {plan.experienceLevel.charAt(0).toUpperCase() + plan.experienceLevel.slice(1)}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      Days: {plan.preferredWorkoutDays.length}
                                    </div>
                                    <div className="mt-2 text-xs flex justify-end">
                                      <span className="text-indigo-600">Click to select</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="text-sm text-gray-500 py-4 text-center border border-dashed border-gray-300 rounded-md">
                              No workout plan templates available
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                  
                  {/* Step indicator */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex flex-col items-center">
                          <div
                            className={`rounded-full flex items-center justify-center w-8 h-8 ${
                              step >= i
                                ? "bg-indigo-600 text-white"
                                : "bg-gray-200 text-gray-600"
                            }`}
                          >
                            {i}
                          </div>
                          <div className="text-xs mt-1 text-gray-500">
                            {i === 1 && "Plan Details"}
                            {i === 2 && "Daily Workouts"}
                            {i === 3 && "Review"}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-1 flex justify-between items-center">
                      <div className="h-1 flex-1 bg-indigo-600"></div>
                      <div
                        className={`h-1 flex-1 ${
                          step >= 2 ? "bg-indigo-600" : "bg-gray-200"
                        }`}
                      ></div>
                      <div
                        className={`h-1 flex-1 ${
                          step >= 3 ? "bg-indigo-600" : "bg-gray-200"
                        }`}
                      ></div>
                    </div>
                  </div>
                  
                  {/* Form content */}
                  <div className="mt-4 min-h-[300px]">
                    {/* Step 1: Plan Details */}
                    {step === 1 && (
                      <div className="space-y-4">
                        <p className="text-sm text-gray-500 mb-6">
                          Enter the basic details for {memberName}'s workout plan.
                        </p>
                        
                        {/* Plan Name */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Plan Name <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={planName}
                            onChange={(e) => setPlanName(e.target.value)}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="Summer Strength Program"
                            required
                          />
                        </div>

                        {/* Goal */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Goal <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={goal}
                            onChange={(e) => setGoal(e.target.value as any)}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
                            required
                          >
                            <option value="muscle_gain">Muscle Gain</option>
                            <option value="fat_loss">Fat Loss</option>
                            <option value="strength">Strength</option>
                            <option value="endurance">Endurance</option>
                            <option value="general_fitness">General Fitness</option>
                          </select>
                        </div>

                        {/* Experience Level */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Experience Level <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={experienceLevel}
                            onChange={(e) => setExperienceLevel(e.target.value as any)}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
                            required
                          >
                            <option value="beginner">Beginner</option>
                            <option value="intermediate">Intermediate</option>
                            <option value="advanced">Advanced</option>
                          </select>
                        </div>

                        {/* Access Type */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Access Type <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={accessType}
                            onChange={(e) => setAccessType(e.target.value as any)}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
                            required
                          >
                            <option value="gym">Gym</option>
                            <option value="home">Home</option>
                            <option value="both">Both</option>
                          </select>
                        </div>

                        {/* Dates */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Start Date <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="date"
                              value={startDate}
                              onChange={(e) => setStartDate(e.target.value)}
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              End Date <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="date"
                              value={endDate}
                              onChange={(e) => setEndDate(e.target.value)}
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
                              required
                              min={startDate} // End date should be after start date
                            />
                          </div>
                        </div>

                        {/* Preferred Workout Days */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Preferred Workout Days <span className="text-red-500">*</span>
                          </label>
                          <div className="flex flex-wrap gap-3">
                            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                              <div key={day} className="flex items-center">
                                <input
                                  type="checkbox"
                                  id={`day-${day}`}
                                  checked={preferredWorkoutDays.includes(day as DayType)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setPreferredWorkoutDays([...preferredWorkoutDays, day as DayType]);
                                    } else {
                                      setPreferredWorkoutDays(preferredWorkoutDays.filter(d => d !== day as DayType));
                                    }
                                  }}
                                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                />
                                <label htmlFor={`day-${day}`} className="ml-2 text-sm text-gray-700">
                                  {day}
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        {/* Injuries */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Injuries (optional)
                          </label>
                          <div className="flex items-center">
                            <input
                              type="text"
                              id="injury-input"
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
                              placeholder="E.g., Shoulder injury"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                                  setInjuries([...injuries, e.currentTarget.value.trim()]);
                                  e.currentTarget.value = '';
                                  e.preventDefault();
                                }
                              }}
                            />
                            <button
                              type="button"
                              className="ml-2 p-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                              onClick={() => {
                                const input = document.getElementById('injury-input') as HTMLInputElement;
                                if (input.value.trim()) {
                                  setInjuries([...injuries, input.value.trim()]);
                                  input.value = '';
                                }
                              }}
                            >
                              Add
                            </button>
                          </div>
                          {injuries.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {injuries.map((injury, index) => (
                                <div key={index} className="bg-gray-100 px-3 py-1 rounded-full flex items-center">
                                  <span className="text-sm text-gray-800">{injury}</span>
                                  <button
                                    type="button"
                                    className="ml-2 text-gray-500 hover:text-gray-700"
                                    onClick={() => setInjuries(injuries.filter((_, i) => i !== index))}
                                  >
                                    ✕
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        {/* Limitations */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Limitations (optional)
                          </label>
                          <div className="flex items-center">
                            <input
                              type="text"
                              id="limitation-input"
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
                              placeholder="E.g., Limited mobility in hips"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                                  setLimitations([...limitations, e.currentTarget.value.trim()]);
                                  e.currentTarget.value = '';
                                  e.preventDefault();
                                }
                              }}
                            />
                            <button
                              type="button"
                              className="ml-2 p-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                              onClick={() => {
                                const input = document.getElementById('limitation-input') as HTMLInputElement;
                                if (input.value.trim()) {
                                  setLimitations([...limitations, input.value.trim()]);
                                  input.value = '';
                                }
                              }}
                            >
                              Add
                            </button>
                          </div>
                          {limitations.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {limitations.map((limitation, index) => (
                                <div key={index} className="bg-gray-100 px-3 py-1 rounded-full flex items-center">
                                  <span className="text-sm text-gray-800">{limitation}</span>
                                  <button
                                    type="button"
                                    className="ml-2 text-gray-500 hover:text-gray-700"
                                    onClick={() => setLimitations(limitations.filter((_, i) => i !== index))}
                                  >
                                    ✕
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Step 2: Daily Workouts */}
                    {step === 2 && (
                      <div className="space-y-6">
                        <p className="text-sm text-gray-500 mb-6">
                          Configure the workout routine for each day. First select a day, then add exercises.
                        </p>
                        
                        {/* Workout Day Selection */}
                        <div className="mb-6">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Workout Days
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {preferredWorkoutDays.map((day) => {
                              const isDayConfigured = dailyWorkouts.some(workout => workout.day === day);
                              return (
                                <button
                                  key={day}
                                  type="button"
                                  onClick={() => initializeWorkoutDay(day as DayType)}
                                  className={`px-4 py-2 rounded-md text-sm font-medium ${
                                    isDayConfigured 
                                      ? 'bg-green-100 text-green-800 border border-green-300' 
                                      : 'bg-gray-100 text-gray-800 border border-gray-300'
                                  } ${currentDay === day ? 'ring-2 ring-offset-2 ring-indigo-500' : ''}`}
                                >
                                  {day}
                                  {isDayConfigured && (
                                    <span className="ml-2 text-xs bg-green-200 text-green-800 px-1.5 py-0.5 rounded-full">
                                      ✓
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                        
                        {currentDay ? (
                          <div className="space-y-6 border-t border-gray-200 pt-6">
                            <h4 className="font-medium text-lg text-gray-900">
                              Configure workout for {currentDay}
                            </h4>
                            
                            {/* Workout Focus */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700">
                                Workout Focus <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                value={currentFocus}
                                onChange={(e) => setCurrentFocus(e.target.value)}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="E.g., Upper Body, Chest & Triceps, etc."
                                required
                              />
                            </div>
                            
                            {/* Exercises */}
                            <div>
                              <div className="flex justify-between items-center mb-2">
                                <label className="block text-sm font-medium text-gray-700">
                                  Exercises <span className="text-red-500">*</span>
                                </label>
                                <button
                                  type="button"
                                  onClick={addExercise}
                                  className="px-3 py-1 text-xs font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                                >
                                  + Add Exercise
                                </button>
                              </div>
                              
                              {currentExercises.length === 0 ? (
                                <div className="text-sm text-gray-500 py-4 text-center border border-dashed border-gray-300 rounded-md">
                                  No exercises added yet. Click "+ Add Exercise" to start.
                                </div>
                              ) : (
                                <div className="space-y-4">
                                  {currentExercises.map((exercise, index) => (
                                    <div key={index} className="p-4 border border-gray-200 rounded-md bg-gray-50">
                                      <div className="flex justify-between mb-2">
                                        <h5 className="font-medium text-gray-900">Exercise {index + 1}</h5>
                                        <button
                                          type="button"
                                          onClick={() => removeExercise(index)}
                                          className="text-red-600 hover:text-red-800 text-sm"
                                        >
                                          Remove
                                        </button>
                                      </div>
                                      
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Exercise Name */}
                                        <div>
                                          <label className="block text-xs font-medium text-gray-700">
                                            Exercise Name <span className="text-red-500">*</span>
                                          </label>
                                          <input
                                            type="text"
                                            value={exercise.name}
                                            onChange={(e) => updateExercise(index, 'name', e.target.value)}
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
                                            placeholder="E.g., Bench Press"
                                            required
                                          />
                                        </div>
                                        
                                        {/* Sets */}
                                        <div>
                                          <label className="block text-xs font-medium text-gray-700">
                                            Sets <span className="text-red-500">*</span>
                                          </label>
                                          <input
                                            type="number"
                                            min="1"
                                            value={exercise.sets}
                                            onChange={(e) => updateExercise(index, 'sets', parseInt(e.target.value))}
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
                                            required
                                          />
                                        </div>
                                        
                                        {/* Reps */}
                                        <div>
                                          <label className="block text-xs font-medium text-gray-700">
                                            Reps <span className="text-red-500">*</span>
                                          </label>
                                          <input
                                            type="text"
                                            value={exercise.reps}
                                            onChange={(e) => updateExercise(index, 'reps', e.target.value)}
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
                                            placeholder="E.g., 8-10, 12, etc."
                                            required
                                          />
                                        </div>
                                        
                                        {/* Rest Time */}
                                        <div>
                                          <label className="block text-xs font-medium text-gray-700">
                                            Rest Time (seconds) <span className="text-red-500">*</span>
                                          </label>
                                          <input
                                            type="number"
                                            min="0"
                                            value={exercise.restTime}
                                            onChange={(e) => updateExercise(index, 'restTime', parseInt(e.target.value))}
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
                                            required
                                          />
                                        </div>
                                        
                                        {/* Equipment Required */}
                                        <div className="md:col-span-2">
                                          <label className="block text-xs font-medium text-gray-700">
                                            Equipment Required
                                          </label>
                                          <div className="flex items-center">
                                            <input
                                              type="text"
                                              id={`equipment-input-${index}`}
                                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
                                              placeholder="E.g., Dumbbells"
                                              onKeyDown={(e) => {
                                                if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                                                  updateExercise(index, 'equipmentRequired', [...exercise.equipmentRequired, e.currentTarget.value.trim()]);
                                                  e.currentTarget.value = '';
                                                  e.preventDefault();
                                                }
                                              }}
                                            />
                                            <button
                                              type="button"
                                              className="ml-2 p-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                                              onClick={() => {
                                                const input = document.getElementById(`equipment-input-${index}`) as HTMLInputElement;
                                                if (input && input.value.trim()) {
                                                  updateExercise(index, 'equipmentRequired', [...exercise.equipmentRequired, input.value.trim()]);
                                                  input.value = '';
                                                }
                                              }}
                                            >
                                              Add
                                            </button>
                                          </div>
                                          {exercise.equipmentRequired.length > 0 && (
                                            <div className="mt-2 flex flex-wrap gap-2">
                                              {exercise.equipmentRequired.map((equipment, idx) => (
                                                <div key={idx} className="bg-gray-100 px-3 py-1 rounded-full flex items-center">
                                                  <span className="text-xs text-gray-800">{equipment}</span>
                                                  <button
                                                    type="button"
                                                    className="ml-2 text-gray-500 hover:text-gray-700"
                                                    onClick={() => {
                                                      const updatedEquipment = [...exercise.equipmentRequired];
                                                      updatedEquipment.splice(idx, 1);
                                                      updateExercise(index, 'equipmentRequired', updatedEquipment);
                                                    }}
                                                  >
                                                    ✕
                                                  </button>
                                                </div>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                        
                                        {/* Notes */}
                                        <div className="md:col-span-2">
                                          <label className="block text-xs font-medium text-gray-700">
                                            Notes
                                          </label>
                                          <textarea
                                            value={exercise.notes}
                                            onChange={(e) => updateExercise(index, 'notes', e.target.value)}
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
                                            placeholder="Any special instructions or guidance"
                                            rows={2}
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                            
                            {/* Warmup */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Warmup Activities
                              </label>
                              <div className="flex items-center">
                                <input
                                  type="text"
                                  id="warmup-input"
                                  className="block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
                                  placeholder="E.g., 5 min treadmill"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                                      addItem('warmup', e.currentTarget.value);
                                      e.preventDefault();
                                    }
                                  }}
                                />
                                <button
                                  type="button"
                                  className="ml-2 p-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                                  onClick={() => {
                                    const input = document.getElementById('warmup-input') as HTMLInputElement;
                                    if (input && input.value.trim()) {
                                      addItem('warmup', input.value);
                                    }
                                  }}
                                >
                                  Add
                                </button>
                              </div>
                              {currentWarmup.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-2">
                                  {currentWarmup.map((item, index) => (
                                    <div key={index} className="bg-gray-100 px-3 py-1 rounded-full flex items-center">
                                      <span className="text-sm text-gray-800">{item}</span>
                                      <button
                                        type="button"
                                        className="ml-2 text-gray-500 hover:text-gray-700"
                                        onClick={() => removeItem('warmup', index)}
                                      >
                                        ✕
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                            
                            {/* Cooldown */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Cooldown Activities
                              </label>
                              <div className="flex items-center">
                                <input
                                  type="text"
                                  id="cooldown-input"
                                  className="block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
                                  placeholder="E.g., Full body stretching"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                                      addItem('cooldown', e.currentTarget.value);
                                      e.preventDefault();
                                    }
                                  }}
                                />
                                <button
                                  type="button"
                                  className="ml-2 p-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                                  onClick={() => {
                                    const input = document.getElementById('cooldown-input') as HTMLInputElement;
                                    if (input && input.value.trim()) {
                                      addItem('cooldown', input.value);
                                    }
                                  }}
                                >
                                  Add
                                </button>
                              </div>
                              {currentCooldown.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-2">
                                  {currentCooldown.map((item, index) => (
                                    <div key={index} className="bg-gray-100 px-3 py-1 rounded-full flex items-center">
                                      <span className="text-sm text-gray-800">{item}</span>
                                      <button
                                        type="button"
                                        className="ml-2 text-gray-500 hover:text-gray-700"
                                        onClick={() => removeItem('cooldown', index)}
                                      >
                                        ✕
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                            
                            {/* Save Button */}
                            <div className="mt-6">
                              <button
                                type="button"
                                onClick={saveWorkoutDay}
                                className="w-full px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                disabled={!currentDay || !currentFocus || currentExercises.length === 0}
                              >
                                Save {currentDay} Workout
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm text-gray-500 py-10 text-center border border-dashed border-gray-300 rounded-md">
                            Select a day from above to configure its workout routine.
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Step 3: Review */}
                    {step === 3 && (
                      <div className="space-y-6">
                        <p className="text-sm text-gray-500 mb-6">
                          Review the workout plan before saving. Make sure all details are correct.
                        </p>

                        {/* Basic Plan Details */}
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                          <h4 className="font-medium text-gray-900 mb-3">Plan Details</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm font-medium text-gray-500">Plan Name</p>
                              <p className="text-sm text-gray-900">{planName}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-500">Goal</p>
                              <p className="text-sm text-gray-900">
                                {goal.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-500">Experience Level</p>
                              <p className="text-sm text-gray-900">
                                {experienceLevel.charAt(0).toUpperCase() + experienceLevel.slice(1)}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-500">Access Type</p>
                              <p className="text-sm text-gray-900">
                                {accessType.charAt(0).toUpperCase() + accessType.slice(1)}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-500">Start Date</p>
                              <p className="text-sm text-gray-900">
                                {new Date(startDate).toLocaleDateString()}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-500">End Date</p>
                              <p className="text-sm text-gray-900">
                                {new Date(endDate).toLocaleDateString()}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-500">Workout Days</p>
                              <p className="text-sm text-gray-900">
                                {preferredWorkoutDays.join(', ')}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-500">Scheduled Days</p>
                              <p className="text-sm text-gray-900">
                                {dailyWorkouts.length} of {preferredWorkoutDays.length} days configured
                              </p>
                            </div>
                          </div>

                          {/* Injuries and Limitations */}
                          {(injuries.length > 0 || limitations.length > 0) && (
                            <div className="mt-4 pt-4 border-t border-gray-200">
                              {injuries.length > 0 && (
                                <div className="mb-3">
                                  <p className="text-sm font-medium text-gray-500">Injuries</p>
                                  <div className="flex flex-wrap gap-2 mt-1">
                                    {injuries.map((injury, index) => (
                                      <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                        {injury}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              {limitations.length > 0 && (
                                <div>
                                  <p className="text-sm font-medium text-gray-500">Limitations</p>
                                  <div className="flex flex-wrap gap-2 mt-1">
                                    {limitations.map((limitation, index) => (
                                      <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                        {limitation}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Daily Workouts */}
                        <div>
                          <h4 className="font-medium text-gray-900 mb-3">Daily Workouts</h4>
                          
                          {dailyWorkouts.length === 0 ? (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 text-sm text-yellow-800">
                              No workouts have been scheduled yet. Go back to step 2 to configure workouts.
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {preferredWorkoutDays.map(day => {
                                const workout = dailyWorkouts.find(w => w.day === day);
                                
                                if (!workout) {
                                  return (
                                    <div key={day} className="border border-red-200 rounded-md p-4 bg-red-50">
                                      <div className="flex justify-between items-start">
                                        <div>
                                          <h5 className="font-medium text-gray-900">{day}</h5>
                                          <p className="text-sm text-red-600 mt-1">
                                            No workout configured for this day
                                          </p>
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setStep(2);
                                            initializeWorkoutDay(day as DayType);
                                          }}
                                          className="px-3 py-1 text-xs font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                                        >
                                          Configure
                                        </button>
                                      </div>
                                    </div>
                                  );
                                }
                                
                                return (
                                  <div key={day} className="border border-gray-200 rounded-md p-4 bg-white">
                                    <div className="flex justify-between items-start">
                                      <div>
                                        <h5 className="font-medium text-gray-900">{day}</h5>
                                        <p className="text-sm text-gray-600 mt-1">
                                          {workout.focus}
                                        </p>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setStep(2);
                                          initializeWorkoutDay(day as DayType);
                                        }}
                                        className="px-3 py-1 text-xs font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                                      >
                                        Edit
                                      </button>
                                    </div>
                                    
                                    {/* Exercise Summary */}
                                    <div className="mt-3">
                                      <p className="text-xs font-medium text-gray-500 mb-1">
                                        Exercises ({workout.exercises.length})
                                      </p>
                                      <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                                        {workout.exercises.map((exercise, index) => (
                                          <li key={index}>
                                            {exercise.name} - {exercise.sets} sets × {exercise.reps} reps, {exercise.restTime}s rest
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                    
                                    {/* Warmup Summary */}
                                    {workout.warmup.length > 0 && (
                                      <div className="mt-3">
                                        <p className="text-xs font-medium text-gray-500 mb-1">
                                          Warmup
                                        </p>
                                        <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                                          {workout.warmup.map((item, index) => (
                                            <li key={index}>{item}</li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}
                                    
                                    {/* Cooldown Summary */}
                                    {workout.cooldown.length > 0 && (
                                      <div className="mt-3">
                                        <p className="text-xs font-medium text-gray-500 mb-1">
                                          Cooldown
                                        </p>
                                        <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                                          {workout.cooldown.map((item, index) => (
                                            <li key={index}>{item}</li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                        
                        {/* Validation Messages */}
                        {dailyWorkouts.length === 0 && (
                          <div className="rounded-md bg-red-50 border border-red-200 p-4">
                            <div className="flex">
                              <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                              </div>
                              <div className="ml-3">
                                <h3 className="text-sm font-medium text-red-800">
                                  Cannot create workout plan without daily workouts
                                </h3>
                                <div className="mt-2 text-sm text-red-700">
                                  <p>
                                    Please go back to step 2 and configure at least one daily workout.
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {dailyWorkouts.length > 0 && dailyWorkouts.length < preferredWorkoutDays.length && (
                          <div className="rounded-md bg-yellow-50 border border-yellow-200 p-4">
                            <div className="flex">
                              <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                              </div>
                              <div className="ml-3">
                                <h3 className="text-sm font-medium text-yellow-800">
                                  Some workout days are not configured
                                </h3>
                                <div className="mt-2 text-sm text-yellow-700">
                                  <p>
                                    You've configured {dailyWorkouts.length} out of {preferredWorkoutDays.length} preferred workout days. It's recommended to configure all days, but you can proceed if this is intentional.
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Footer with buttons */}
                  <div className="mt-8 flex justify-between">
                    {step > 1 && (
                      <button
                        type="button"
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                        onClick={() => setStep(step - 1)}
                        disabled={isSubmitting || loading}
                      >
                        Previous
                      </button>
                    )}
                    
                    {step < 3 ? (
                      <button
                        type="button"
                        className="ml-auto px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700"
                        onClick={() => setStep(step + 1)}
                        disabled={isSubmitting || loading || (step === 1 && !planName)}
                      >
                        Next
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="ml-auto px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700"
                        onClick={handleSubmit}
                        disabled={isSubmitting || loading}
                      >
                        {isSubmitting ? "Saving..." : (isEditing ? "Update Workout Plan" : "Save Workout Plan")}
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
};

export default WorkoutPlanModal; 