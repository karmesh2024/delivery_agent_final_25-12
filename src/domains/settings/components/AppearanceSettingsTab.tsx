"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { FiSave, FiCheck } from "react-icons/fi";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@/store";
import { setTheme, setColorAccent, setLayoutDensity, setFontSize, resetToDefaults } from "../store/settingsSlice";
import { useState } from "react";

const AppearanceSettingsTab = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { theme, colorAccent, layoutDensity, fontSize } = useSelector((state: RootState) => state.settings);

  // Theme options
  const themeOptions = [
    { id: "light", name: "Light" },
    { id: "dark", name: "Dark" },
    { id: "system", name: "System" }
  ];

  // Handle theme change
  const handleThemeChange = (themeId: string) => {
    dispatch(setTheme(themeId));
  };

  // Handle font size change
  const handleFontSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(setFontSize(parseInt(e.target.value)));
  };

  // Handle color accent change
  const handleColorAccentChange = (color: string) => {
    dispatch(setColorAccent(color));
  };

  // Handle layout density change
  const handleDensityChange = (density: string) => {
    dispatch(setLayoutDensity(density));
  };

  // Handle reset to defaults
  const handleResetDefaults = () => {
    dispatch(resetToDefaults());
  };

  // Handle save preferences
  const handleSavePreferences = () => {
    // In a real app, this would save to user preferences in the backend
    console.log("Saving preferences:", { theme, colorAccent, layoutDensity, fontSize });
    // You could add a toast notification here to confirm settings saved
  };

  return (
    <Card className="border rounded-lg bg-white">
      <CardHeader className="pb-2">
        <CardTitle>Appearance Settings</CardTitle>
        <CardDescription>
          Customize the look and feel of the application
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Theme Selection */}
        <div>
          <h3 className="text-lg font-medium mb-3">Theme</h3>
          <div className="grid grid-cols-3 gap-4">
            {/* Light Theme */}
            <div
              className={`border rounded-lg overflow-hidden cursor-pointer transition-all ${
                theme === "light" ? "border-blue-500 ring-1 ring-blue-500" : "hover:border-gray-300"
              }`}
              onClick={() => handleThemeChange("light")}
            >
              <div className="p-3 flex items-center justify-between border-b">
                <h4 className="font-medium">Light</h4>
                {theme === "light" && (
                  <div className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center">
                    <FiCheck className="h-3 w-3" />
                  </div>
                )}
              </div>
              <div style={{ height: "100px", backgroundColor: "#ffffff" }}></div>
            </div>

            {/* Dark Theme */}
            <div
              className={`border rounded-lg overflow-hidden cursor-pointer transition-all ${
                theme === "dark" ? "border-blue-500 ring-1 ring-blue-500" : "hover:border-gray-300"
              }`}
              onClick={() => handleThemeChange("dark")}
            >
              <div className="p-3 flex items-center justify-between border-b">
                <h4 className="font-medium">Dark</h4>
                {theme === "dark" && (
                  <div className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center">
                    <FiCheck className="h-3 w-3" />
                  </div>
                )}
              </div>
              <div style={{ height: "100px", backgroundColor: "#111827" }}></div>
            </div>

            {/* System Theme */}
            <div
              className={`border rounded-lg overflow-hidden cursor-pointer transition-all ${
                theme === "system" ? "border-blue-500 ring-1 ring-blue-500" : "hover:border-gray-300"
              }`}
              onClick={() => handleThemeChange("system")}
            >
              <div className="p-3 flex items-center justify-between border-b">
                <h4 className="font-medium">System</h4>
                {theme === "system" && (
                  <div className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center">
                    <FiCheck className="h-3 w-3" />
                  </div>
                )}
              </div>
              <div style={{ height: "100px", background: "linear-gradient(to right, #ffffff 0%, #111827 100%)" }}></div>
            </div>
          </div>
        </div>
        
        {/* Font Size */}
        <div>
          <h3 className="text-lg font-medium mb-3">Font Size</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">A</span>
              <div className="w-full mx-4">
                <input 
                  type="range" 
                  min="1" 
                  max="5" 
                  value={fontSize}
                  onChange={handleFontSizeChange}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  style={{
                    background: 'linear-gradient(to right, #3b82f6 0%, #3b82f6 ' + (fontSize-1)*25 + '%, #e5e7eb ' + (fontSize-1)*25 + '%, #e5e7eb 100%)'
                  }}
                />
              </div>
              <span className="text-xl font-medium">A</span>
            </div>
            <div className="flex justify-between text-xs text-gray-500 px-1">
              <span>Small</span>
              <span className={fontSize === 3 ? "text-blue-500 font-medium" : ""}>Default</span>
              <span>Large</span>
            </div>
          </div>
        </div>
        
        {/* Color Accent */}
        <div>
          <h3 className="text-lg font-medium mb-3">Color Accent</h3>
          <div className="flex flex-wrap gap-3">
            {[
              { color: "blue-500", name: "Blue", bg: "#3b82f6" },
              { color: "green-500", name: "Green", bg: "#22c55e" },
              { color: "purple-500", name: "Purple", bg: "#a855f7" },
              { color: "red-500", name: "Red", bg: "#ef4444" },
              { color: "orange-500", name: "Orange", bg: "#f97316" },
              { color: "teal-500", name: "Teal", bg: "#14b8a6" }
            ].map((option) => (
              <div
                key={option.color}
                className={`w-8 h-8 rounded-full cursor-pointer flex items-center justify-center ${
                  colorAccent === option.color 
                    ? "ring-2 ring-offset-2 ring-blue-500" 
                    : ""
                }`}
                style={{ backgroundColor: option.bg }}
                onClick={() => handleColorAccentChange(option.color)}
                title={option.name}
              >
                {colorAccent === option.color && (
                  <FiCheck className="h-4 w-4 text-white" />
                )}
              </div>
            ))}
          </div>
        </div>
        
        {/* Layout Density */}
        <div>
          <h3 className="text-lg font-medium mb-3">Layout Density</h3>
          <div className="grid grid-cols-3 gap-4">
            {[
              { id: "compact", name: "Compact" },
              { id: "default", name: "Default" },
              { id: "comfortable", name: "Comfortable" }
            ].map((option) => (
              <div
                key={option.id}
                className={`border rounded-lg p-3 cursor-pointer ${
                  layoutDensity === option.id 
                    ? "border-blue-500 bg-blue-50" 
                    : "hover:border-gray-300"
                }`}
                onClick={() => handleDensityChange(option.id)}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{option.name}</span>
                  {layoutDensity === option.id && (
                    <div className="w-4 h-4 rounded-full bg-blue-500 text-white flex items-center justify-center">
                      <FiCheck className="h-3 w-3" />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between border-t pt-5">
        <Button variant="outline" onClick={handleResetDefaults} className="text-gray-600">
          Reset to Default
        </Button>
        <Button className="gap-1 bg-blue-600 hover:bg-blue-700" onClick={handleSavePreferences}>
          <FiSave className="h-4 w-4" />
          Save Preferences
        </Button>
      </CardFooter>
    </Card>
  );
};

export default AppearanceSettingsTab; 