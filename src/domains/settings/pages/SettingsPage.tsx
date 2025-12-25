"use client";

/**
 * Settings Page
 */

import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@/store";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { Alert, AlertTitle, AlertDescription } from "@/shared/ui/alert";
import { FiSettings, FiUser, FiBell, FiLock, FiMonitor, FiAlertCircle, FiMap, FiChevronRight } from "react-icons/fi";
import { setActiveTab, fetchUserSettings, fetchLoginHistory } from "../store/settingsSlice";
import { useRouter } from "next/navigation";

// Import tab components
import ProfileSettingsTab from "../components/ProfileSettingsTab";
import NotificationSettingsTab from "../components/NotificationSettingsTab";
import SecuritySettingsTab from "../components/SecuritySettingsTab";
import AppearanceSettingsTab from "../components/AppearanceSettingsTab";

/**
 * Settings Page
 * Allows users to customize application settings and manage their profile
 */
const SettingsPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  
  // Access settings state from Redux
  const { activeTab, isLoading, error } = useSelector((state: RootState) => state.settings);
  const { currentAdmin } = useSelector((state: RootState) => state.auth); // جلب معلومات المسؤول الحالي

  // Load user settings when page loads
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const userId = currentAdmin?.id; // استخدم معرف المستخدم من حالة المصادقة
        if (userId) {
          await dispatch(fetchUserSettings(userId));
          await dispatch(fetchLoginHistory(userId));
        } else {
          console.warn("User ID not available, skipping fetching user settings and login history.");
        }
      } catch (err) {
        console.error("Error loading settings:", err);
        // Set error message instead of failing entirely
        dispatch(
          setError(
            err instanceof Error 
              ? err.message 
              : "Failed to load user settings"
          )
        );
      }
    };

    loadUserData();
  }, [dispatch, currentAdmin?.id]); // أضف currentAdmin?.id كتابعية

  // Add property to handle errors
  const setError = (message: string) => ({
    type: 'settings/setError',
    payload: message
  });
  
  // Change tab
  const handleTabChange = (value: string) => {
    dispatch(setActiveTab(value as 'profile' | 'notifications' | 'security' | 'appearance' | 'system'));
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center">
            <FiSettings className="mr-2 h-6 w-6 text-blue-600" />
            System Settings
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage your account and configure application preferences
          </p>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <Alert variant="destructive">
          <FiAlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Loading state */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block w-12 h-12 border-4 border-t-blue-500 border-gray-200 rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Loading settings...</p>
        </div>
      ) : (
        <div>
          {/* Settings tabs */}
          <div className="mb-6">
            <Tabs 
              value={activeTab} 
              onValueChange={handleTabChange}
              className="w-full"
            >
              <div className="border-b mb-4">
                <TabsList className="flex w-full bg-gray-100 rounded-lg overflow-hidden p-0">
                  <TabsTrigger 
                    value="profile" 
                    className="flex-1 flex items-center justify-center gap-2 py-4 px-6 border-b-2 border-transparent text-gray-600 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:font-bold data-[state=active]:border-blue-600 hover:bg-gray-50"
                  >
                    <FiUser className="h-5 w-5" />
                    <span>Profile</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="notifications" 
                    className="flex-1 flex items-center justify-center gap-2 py-4 px-6 border-b-2 border-transparent text-gray-600 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:font-bold data-[state=active]:border-blue-600 hover:bg-gray-50"
                  >
                    <FiBell className="h-5 w-5" />
                    <span>Notifications</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="security" 
                    className="flex-1 flex items-center justify-center gap-2 py-4 px-6 border-b-2 border-transparent text-gray-600 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:font-bold data-[state=active]:border-blue-600 hover:bg-gray-50"
                  >
                    <FiLock className="h-5 w-5" />
                    <span>Security</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="appearance" 
                    className="flex-1 flex items-center justify-center gap-2 py-4 px-6 border-b-2 border-transparent text-gray-600 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:font-bold data-[state=active]:border-blue-600 hover:bg-gray-50"
                  >
                    <FiMonitor className="h-5 w-5" />
                    <span>Appearance</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="system" 
                    className="flex-1 flex items-center justify-center gap-2 py-4 px-6 border-b-2 border-transparent text-gray-600 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:font-bold data-[state=active]:border-blue-600 hover:bg-gray-50"
                  >
                    <FiSettings className="h-5 w-5" />
                    <span>System</span>
                  </TabsTrigger>
                </TabsList>
              </div>
              
              {/* Profile tab content */}
              <TabsContent value="profile" className="pt-6">
                <ProfileSettingsTab />
              </TabsContent>
              
              {/* Notifications tab content */}
              <TabsContent value="notifications" className="pt-6">
                <NotificationSettingsTab />
              </TabsContent>
              
              {/* Security tab content */}
              <TabsContent value="security" className="pt-6">
                <SecuritySettingsTab />
              </TabsContent>
              
              {/* Appearance tab content */}
              <TabsContent value="appearance" className="pt-6">
                <AppearanceSettingsTab />
              </TabsContent>
              
              {/* System tab content */}
              <TabsContent value="system" className="pt-6">
                <div className="border rounded-lg p-6 bg-white">
                  <h3 className="text-lg font-medium mb-4">System Settings</h3>
                  <div className="grid gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg border hover:border-blue-200 hover:bg-blue-50/30 hover:shadow-sm transition cursor-pointer"
                         onClick={() => router.push('/settings/geographic-zones')}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <FiMap className="h-5 w-5 text-blue-600 mr-2" />
                          <span>Manage Geographic Zones</span>
                        </div>
                        <FiChevronRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </div>
                    <div className="p-4 text-center text-muted-foreground text-sm">
                      <p>More system settings will be available soon</p>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;