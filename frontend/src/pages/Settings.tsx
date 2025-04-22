import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "react-query";
import axios from "axios";
import { toast } from "react-hot-toast";
import LoadingSpinner from "../components/LoadingSpinner";

interface GymSettings {
  _id: string;
  gymId: string;
  smartInactivityAlerts: boolean;
  inactivityThresholdDays: number;
  notificationCooldownDays: number;
  customInactivityMessage: string;
  createdAt: string;
  updatedAt: string;
  message?: string;
}

const Settings = () => {
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
  const token = localStorage.getItem("token");
  const queryClient = useQueryClient();
  const [wasAlertsEnabled, setWasAlertsEnabled] = useState(false);

  const [formData, setFormData] = useState<Partial<GymSettings>>({
    smartInactivityAlerts: false,
    inactivityThresholdDays: 2,
    notificationCooldownDays: 3,
    customInactivityMessage: "Hey {{name}}! We've missed you at the gym. Let's get back on track 💪"
  });

  // Fetch current settings
  const { data: settings, isLoading } = useQuery<GymSettings>(
    "gymSettings",
    async () => {
      const response = await axios.get(`${API_URL}/settings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    },
    {
      onSuccess: (data) => {
        setFormData({
          smartInactivityAlerts: data.smartInactivityAlerts,
          inactivityThresholdDays: data.inactivityThresholdDays,
          notificationCooldownDays: data.notificationCooldownDays,
          customInactivityMessage: data.customInactivityMessage
        });
        // Remember the initial state of the alerts
        setWasAlertsEnabled(data.smartInactivityAlerts);
      },
      onError: (error) => {
        console.error("Error fetching settings:", error);
        toast.error("Failed to load settings");
      }
    }
  );

  // Update settings mutation
  const updateSettingsMutation = useMutation(
    async (updatedSettings: Partial<GymSettings>) => {
      const response = await axios.put(`${API_URL}/settings`, updatedSettings, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    },
    {
      onSuccess: (data) => {
        queryClient.invalidateQueries("gymSettings");
        
        // Check if notifications are being sent immediately
        if (data.message && data.message.includes("immediately")) {
          // Show a more prominent toast for immediate notifications
          toast.success(data.message, { 
            duration: 5000,
            icon: '📧'
          });
        } else {
          toast.success("Settings updated successfully");
        }
        
        // Update the remembered state
        setWasAlertsEnabled(data.smartInactivityAlerts);
      },
      onError: (error) => {
        console.error("Error updating settings:", error);
        toast.error("Failed to update settings");
      }
    }
  );

  const handleToggle = () => {
    setFormData(prev => ({
      ...prev,
      smartInactivityAlerts: !prev.smartInactivityAlerts
    }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value, 10) : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // If we're enabling alerts for the first time, show a confirmation
    if (formData.smartInactivityAlerts && !wasAlertsEnabled) {
      if (window.confirm("This will immediately send emails to all inactive members. Continue?")) {
        updateSettingsMutation.mutate(formData);
      }
    } else {
      updateSettingsMutation.mutate(formData);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Check if we're newly enabling alerts
  const enablingAlerts = formData.smartInactivityAlerts && !wasAlertsEnabled;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Gym Settings</h1>
        <p className="text-gray-600 mt-1">
          Configure various settings for your gym management system
        </p>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Smart Member Engagement Features
          </h2>

          <form onSubmit={handleSubmit}>
            {/* Inactivity Alerts Toggle */}
            <div className="mb-6 p-5 border border-gray-100 rounded-lg bg-gray-50">
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="smartInactivityAlerts"
                    name="smartInactivityAlerts"
                    type="checkbox"
                    checked={formData.smartInactivityAlerts}
                    onChange={handleToggle}
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                </div>
                <div className="ml-3">
                  <label
                    htmlFor="smartInactivityAlerts"
                    className="font-medium text-gray-700 text-lg"
                  >
                    Enable Smart Inactivity Alerts
                  </label>
                  <p className="text-gray-500 mt-1">
                    Automatically send reminder emails to members who haven't visited the gym 
                    in the configured time period. This helps re-engage inactive members.
                  </p>
                  
                  {/* Show immediate notification warning */}
                  {enablingAlerts && (
                    <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-800 text-sm">
                      <span className="font-medium">⚠️ Note:</span> When you save these settings, notifications will be sent 
                      immediately to all inactive members from the owner's email.
                    </div>
                  )}

                  {formData.smartInactivityAlerts && (
                    <div 
                      className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-md"
                    >
                      {/* Inactivity Threshold */}
                      <div className="mb-4">
                        <label 
                          htmlFor="inactivityThresholdDays" 
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Inactivity Threshold (days)
                        </label>
                        <div className="flex items-center">
                          <input
                            type="number"
                            name="inactivityThresholdDays"
                            id="inactivityThresholdDays"
                            min="1"
                            max="14"
                            value={formData.inactivityThresholdDays}
                            onChange={handleInputChange}
                            className="block w-24 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          />
                          <span className="ml-2 text-sm text-gray-500">
                            Days without activity before sending a notification
                          </span>
                        </div>
                      </div>

                      {/* Notification Cooldown */}
                      <div className="mb-4">
                        <label 
                          htmlFor="notificationCooldownDays" 
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Notification Cooldown (days)
                        </label>
                        <div className="flex items-center">
                          <input
                            type="number"
                            name="notificationCooldownDays"
                            id="notificationCooldownDays"
                            min="1"
                            max="14"
                            value={formData.notificationCooldownDays}
                            onChange={handleInputChange}
                            className="block w-24 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          />
                          <span className="ml-2 text-sm text-gray-500">
                            Minimum days between notifications to the same member
                          </span>
                        </div>
                      </div>

                      {/* Custom Message */}
                      <div>
                        <label 
                          htmlFor="customInactivityMessage" 
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Custom Notification Message
                        </label>
                        <div className="mt-1">
                          <textarea
                            name="customInactivityMessage"
                            id="customInactivityMessage"
                            rows={3}
                            value={formData.customInactivityMessage}
                            onChange={handleInputChange}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            placeholder="Enter your custom message to inactive members"
                          />
                        </div>
                        <p className="mt-1 text-sm text-gray-500">
                          Use <code>{"{{name}}"}</code> as a placeholder for the member&apos;s name.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="submit"
                className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                disabled={updateSettingsMutation.isLoading}
              >
                {updateSettingsMutation.isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {enablingAlerts ? "Sending Notifications..." : "Saving..."}
                  </>
                ) : (
                  enablingAlerts ? "Save & Send Notifications" : "Save Settings"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Settings; 