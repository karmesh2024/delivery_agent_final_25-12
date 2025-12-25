"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Button } from "@/shared/ui/button";
import { Label } from "@/shared/ui/label";
import { Switch } from "@/shared/ui/switch";
import { FiSave, FiMail, FiBell, FiPhone, FiUser, FiPackage, FiInfo, FiZap, FiClock, FiCheckCircle } from "react-icons/fi";

// Mock data for Notifications tab - replace with actual data source and state management
const mockNotificationSettings = {
  email: true,
  push: true,
  sms: false,
  agentUpdates: true,
  orderStatusChanges: true,
  systemAnnouncements: true,
  marketingMessages: false,
  quietHoursStart: "22:00",
  quietHoursEnd: "07:00",
};

/**
 * Notification Settings Tab
 */
const NotificationSettingsTab = () => {
  return (
    <Card className="bg-white shadow-sm">
      <CardHeader>
        <CardTitle>Notification Preferences</CardTitle>
        <CardDescription>
          Configure how and when you receive notifications
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Notification Channels */}
        <div>
          <h3 className="text-lg font-medium mb-3">Notification Channels</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FiMail className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium">Email Notifications</p>
                  <p className="text-sm text-gray-500">Receive emails for important updates</p>
                </div>
              </div>
              <Switch defaultChecked />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FiBell className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium">Push Notifications</p>
                  <p className="text-sm text-gray-500">Receive real-time notifications in-app</p>
                </div>
              </div>
              <Switch defaultChecked />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FiPhone className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium">SMS Notifications</p>
                  <p className="text-sm text-gray-500">Receive text messages for critical updates</p>
                </div>
              </div>
              <Switch />
            </div>
          </div>
        </div>
        
        {/* Notification Types */}
        <div>
          <h3 className="text-lg font-medium mb-3">Notification Types</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FiUser className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium">Agent Updates</p>
                  <p className="text-sm text-gray-500">Agent status and location changes</p>
                </div>
              </div>
              <Switch defaultChecked />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FiPackage className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium">Order Status Changes</p>
                  <p className="text-sm text-gray-500">Updates when orders change status</p>
                </div>
              </div>
              <Switch defaultChecked />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FiInfo className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium">System Announcements</p>
                  <p className="text-sm text-gray-500">System updates and new features</p>
                </div>
              </div>
              <Switch defaultChecked />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FiZap className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium">Marketing Messages</p>
                  <p className="text-sm text-gray-500">Tips and promotional content</p>
                </div>
              </div>
              <Switch />
            </div>
          </div>
        </div>

        {/* Quiet Hours */}
        <div>
          <h3 className="text-lg font-medium mb-3">Quiet Hours</h3>
          <div className="space-y-4">
            <div className="flex items-center space-x-2 mb-4">
              <FiClock className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-medium">Quiet Time Schedule</p>
                <p className="text-sm text-gray-500">Disable non-critical notifications during specific times</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quiet-start">Start Time</Label>
                <Input id="quiet-start" type="time" defaultValue="22:00" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quiet-end">End Time</Label>
                <Input id="quiet-end" type="time" defaultValue="07:00" />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end border-t pt-5">
        <Button className="gap-1 bg-blue-600 hover:bg-blue-700">
          <FiCheckCircle className="h-4 w-4" />
          Save Preferences
        </Button>
      </CardFooter>
    </Card>
  );
};

export default NotificationSettingsTab; 