"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Button } from "@/shared/ui/button";
import { Label } from "@/shared/ui/label";
import { Badge } from "@/shared/ui/badge";
import { FiSave, FiLock, FiShield, FiAlertTriangle, FiLogOut, FiEye, FiEyeOff, FiUserCheck, FiCheckCircle, FiX } from "react-icons/fi";
import { useState } from "react";

/**
 * Security Settings Tab
 */
const SecuritySettingsTab = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Mock login history data (in a real app, this would come from API)
  const loginRecords = [
    {
      device: "Chrome Browser on Windows",
      location: "Cairo, Egypt",
      ip: "197.55.232.111",
      time: "5 minutes ago",
      status: "success"
    },
    {
      device: "Mobile App on Android",
      location: "Cairo, Egypt",
      ip: "197.55.232.112",
      time: "2 hours ago",
      status: "success"
    },
    {
      device: "Firefox Browser on Mac",
      location: "Alexandria, Egypt",
      ip: "197.55.239.113",
      time: "1 day ago",
      status: "failed"
    }
  ];
  
  // Mock connected accounts
  const connectedAccounts = [
    { name: "Google", connected: true },
    { name: "Microsoft", connected: false },
    { name: "Slack", connected: true },
    { name: "GitHub", connected: false }
  ];
  
  return (
    <div className="space-y-6">
      {/* Change Password */}
      <Card className="bg-white shadow-sm">
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>
            Update your password to secure your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-password">Current Password</Label>
            <div className="relative">
              <Input 
                id="current-password" 
                type={showPassword ? "text" : "password"} 
                placeholder="••••••••••"
              />
              <Button 
                variant="ghost" 
                size="icon" 
                type="button"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" 
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="new-password">New Password</Label>
            <div className="relative">
              <Input 
                id="new-password" 
                type={showNewPassword ? "text" : "password"} 
                placeholder="••••••••••"
              />
              <Button 
                variant="ghost" 
                size="icon" 
                type="button"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" 
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm Password</Label>
            <div className="relative">
              <Input 
                id="confirm-password" 
                type={showConfirmPassword ? "text" : "password"} 
                placeholder="••••••••••"
              />
              <Button 
                variant="ghost" 
                size="icon" 
                type="button"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" 
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          
          <div className="space-y-1 mt-2">
            <p className="text-sm font-medium mb-1">Password Requirements:</p>
            <ul className="text-sm text-gray-500 space-y-1">
              <li className="flex items-center">
                <FiCheckCircle className="mr-2 h-4 w-4 text-green-500" />
                At least 8 characters
              </li>
              <li className="flex items-center">
                <FiCheckCircle className="mr-2 h-4 w-4 text-green-500" />
                Include uppercase and lowercase letters
              </li>
              <li className="flex items-center">
                <FiX className="mr-2 h-4 w-4 text-red-500" />
                Include a number and special character
              </li>
            </ul>
          </div>
        </CardContent>
        <CardFooter className="border-t pt-4">
          <Button className="gap-1 ml-auto bg-blue-600 hover:bg-blue-700">
            <FiLock className="h-4 w-4" />
            Update Password
          </Button>
        </CardFooter>
      </Card>
      
      {/* Login History */}
      <Card className="bg-white shadow-sm">
        <CardHeader>
          <CardTitle>Login History</CardTitle>
          <CardDescription>
            Devices that recently logged into your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loginRecords.map((record, index) => (
              <div key={index} className="flex items-start justify-between p-3 border rounded-md">
                <div className="space-y-1">
                  <p className="font-medium">{record.device}</p>
                  <p className="text-sm text-gray-500">{record.location} • {record.ip}</p>
                  <p className="text-xs text-gray-400">{record.time}</p>
                </div>
                <Badge variant={record.status === "success" ? "default" : "destructive"}>
                  {record.status === "success" ? "Successful" : "Failed"}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter className="border-t pt-4">
          <Button variant="outline" className="gap-1 ml-auto">
            <FiLogOut className="h-4 w-4" />
            Sign Out All Devices
          </Button>
        </CardFooter>
      </Card>
      
      {/* Connected Accounts */}
      <Card className="bg-white shadow-sm">
        <CardHeader>
          <CardTitle>Connected Accounts</CardTitle>
          <CardDescription>
            Manage third-party authentication services
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {connectedAccounts.map((account, index) => (
            <div key={index} className="flex items-center justify-between p-3 border rounded-md">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                  <FiUserCheck className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <p className="font-medium">{account.name}</p>
                  <p className="text-sm text-gray-500">
                    {account.connected ? "Connected" : "Not connected"}
                  </p>
                </div>
              </div>
              <Button variant={account.connected ? "outline" : "default"} size="sm">
                {account.connected ? "Disconnect" : "Connect"}
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
      
      {/* Advanced Security */}
      <Card className="bg-white shadow-sm">
        <CardHeader>
          <CardTitle>Advanced Security Settings</CardTitle>
          <CardDescription>
            Enable additional security features to protect your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 border rounded-md">
            <div className="flex flex-col">
              <h4 className="font-medium flex items-center">
                <FiShield className="mr-2 h-5 w-5 text-blue-600" />
                Two-Factor Authentication
              </h4>
              <p className="text-sm text-gray-500 ml-7">
                Secure your account with an extra layer of protection
              </p>
            </div>
            <Button variant="outline" size="sm">
              Enable
            </Button>
          </div>
          
          <div className="flex items-center justify-between p-3 border rounded-md">
            <div className="flex flex-col">
              <h4 className="font-medium flex items-center">
                <FiAlertTriangle className="mr-2 h-5 w-5 text-yellow-600" />
                Security Alerts
              </h4>
              <p className="text-sm text-gray-500 ml-7">
                Receive alerts when suspicious activity is detected
              </p>
            </div>
            <Button variant="outline" size="sm">
              Customize
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SecuritySettingsTab; 