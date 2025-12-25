"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Button } from "@/shared/ui/button";
import { Label } from "@/shared/ui/label";
import { Avatar } from "@/shared/ui/avatar";
import { FiSave, FiUpload } from "react-icons/fi";

/**
 * Profile Settings Tab
 */
const ProfileSettingsTab = () => {
  // In a real app, user data would come from auth state
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
      {/* Profile Information */}
      <Card className="md:col-span-3 shadow-sm bg-white">
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>
            Update your personal information and contact details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" defaultValue="Admin User" className="focus:border-blue-500 transition-colors" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" defaultValue="admin@example.com" className="focus:border-blue-500 transition-colors" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" defaultValue="+20 123456789" className="focus:border-blue-500 transition-colors" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Input id="role" defaultValue="Administrator" disabled />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input id="address" placeholder="Enter your address" className="focus:border-blue-500 transition-colors" />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input id="city" placeholder="City" className="focus:border-blue-500 transition-colors" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State/Province</Label>
              <Input id="state" placeholder="State/Province" className="focus:border-blue-500 transition-colors" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="zip">Postal Code</Label>
              <Input id="zip" placeholder="Postal Code" className="focus:border-blue-500 transition-colors" />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between border-t pt-5">
          <Button variant="outline" className="hover:bg-gray-100 transition-colors">Cancel</Button>
          <Button className="gap-1 bg-blue-600 hover:bg-blue-700 transition-colors">
            <FiSave className="h-4 w-4" />
            Save Changes
          </Button>
        </CardFooter>
      </Card>
      
      {/* Profile Picture */}
      <Card className="md:col-span-2 shadow-sm bg-white">
        <CardHeader>
          <CardTitle>Profile Picture</CardTitle>
          <CardDescription>
            Upload a profile picture or avatar
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <div className="mx-auto w-32 h-32 relative">
            <Avatar className="w-full h-full rounded-full object-cover border-4 border-gray-100 shadow-md">
              <img 
                src="https://source.unsplash.com/random/400x400/?portrait" 
                alt="User profile"
                className="w-full h-full object-cover"
              />
            </Avatar>
            <div className="absolute bottom-0 right-0 rounded-full p-2 bg-white border border-gray-200 cursor-pointer hover:bg-gray-50 hover:shadow-sm transition-all">
              <FiUpload className="h-4 w-4 text-blue-600" />
            </div>
          </div>
          
          <div className="text-sm text-gray-500">
            <p>Allowed file types: PNG, JPG, GIF</p>
            <p>Maximum file size: 2MB</p>
          </div>
          
          <Button variant="outline" className="w-full gap-1 hover:bg-blue-50 hover:border-blue-200 transition-all">
            <FiUpload className="h-4 w-4" />
            Upload New Image
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileSettingsTab; 