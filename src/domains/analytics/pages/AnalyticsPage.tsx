"use client";

/**
 * صفحة التحليلات الرئيسية
 * تستخدم مكونات الرسوم البيانية من نطاق التحليلات
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { DashboardLayout } from "@/shared/layouts/DashboardLayout";
import { mockAgents } from "@/lib/mock-data";
import { AnalyticsState, PerformanceMetric } from "../types";
import LineChartPlaceholder from "../components/charts/LineChartPlaceholder";
import PieChartPlaceholder from "../components/charts/PieChartPlaceholder";
import BarChartPlaceholder from "../components/charts/BarChartPlaceholder";

import { 
  FiBarChart2, 
  FiPieChart, 
  FiTrendingUp, 
  FiTrendingDown, 
  FiCalendar,
  FiDownload,
  FiUsers,
  FiTruck,
  FiPackage,
  FiMapPin,
  FiClock,
  FiThumbsUp,
  FiDollarSign
} from "react-icons/fi";

// مؤشرات الأداء الرئيسية
const defaultPerformanceMetrics: PerformanceMetric[] = [
  {
    title: "Total Collections",
    value: "1,248",
    trend: "up",
    change: "+12.5%",
    icon: <FiPackage className="h-4 w-4" />,
    description: "Total waste collections completed"
  },
  {
    title: "Collection Efficiency",
    value: "92.3%",
    trend: "up",
    change: "+4.7%",
    icon: <FiTrendingUp className="h-4 w-4" />,
    description: "Efficiency of waste collection operations"
  },
  {
    title: "Average Response Time",
    value: "28 min",
    trend: "down",
    change: "-14.2%",
    icon: <FiClock className="h-4 w-4" />,
    description: "Average time to respond to collection requests"
  },
  {
    title: "Customer Satisfaction",
    value: "4.8/5",
    trend: "up",
    change: "+0.3",
    icon: <FiThumbsUp className="h-4 w-4" />,
    description: "Overall customer satisfaction rating"
  }
];

/**
 * صفحة التحليلات الرئيسية
 */
export const AnalyticsPage: React.FC = () => {
  // حالة الصفحة
  const [state, setState] = useState<AnalyticsState>({
    period: "month",
    metrics: defaultPerformanceMetrics,
    isLoading: true
  });
  
  // محاكاة تحميل البيانات
  useEffect(() => {
    const timer = setTimeout(() => {
      setState(prev => ({ ...prev, isLoading: false }));
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  // تحديث الفترة الزمنية
  const handlePeriodChange = (period: 'day' | 'week' | 'month' | 'year') => {
    setState(prev => ({ ...prev, period }));
  };

  return (
    <DashboardLayout title="Analytics">
      <div className="space-y-6">
        {/* Header and Period Filter */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center">
              <FiBarChart2 className="mr-2 h-6 w-6 text-blue-600" />
              Waste Management Analytics
            </h1>
            <p className="text-sm text-muted-foreground">
              Performance insights and statistical analysis
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={state.period === "day" ? "default" : "outline"}
              onClick={() => handlePeriodChange("day")}
              className="h-9"
            >
              Day
            </Button>
            <Button
              variant={state.period === "week" ? "default" : "outline"}
              onClick={() => handlePeriodChange("week")}
              className="h-9"
            >
              Week
            </Button>
            <Button
              variant={state.period === "month" ? "default" : "outline"}
              onClick={() => handlePeriodChange("month")}
              className="h-9"
            >
              Month
            </Button>
            <Button
              variant={state.period === "year" ? "default" : "outline"}
              onClick={() => handlePeriodChange("year")}
              className="h-9"
            >
              Year
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {state.metrics.map((metric, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm font-medium text-gray-500">{metric.title}</p>
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                    {metric.icon}
                  </div>
                </div>
                <div className="flex items-end gap-2">
                  <p className="text-3xl font-bold">{metric.value}</p>
                  <div className={`flex items-center gap-1 text-sm ${metric.trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                    {metric.trend === 'up' ? (
                      <FiTrendingUp className="h-3 w-3" />
                    ) : (
                      <FiTrendingDown className="h-3 w-3" />
                    )}
                    <span>{metric.change}</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">{metric.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Analytics Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid grid-cols-4 h-auto p-1">
            <TabsTrigger value="overview" className="text-xs sm:text-sm py-2">Overview</TabsTrigger>
            <TabsTrigger value="agents" className="text-xs sm:text-sm py-2">Agent Performance</TabsTrigger>
            <TabsTrigger value="waste" className="text-xs sm:text-sm py-2">Waste Analysis</TabsTrigger>
            <TabsTrigger value="customers" className="text-xs sm:text-sm py-2">Customer Insights</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-6">
                  <LineChartPlaceholder 
                    title="Waste Collection Trends" 
                    description="Total collections over time"
                  />
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <PieChartPlaceholder 
                    title="Waste Type Distribution" 
                    description="Percentage of waste by category"
                  />
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardContent className="p-6">
                <BarChartPlaceholder 
                  title="Daily Collection Volume" 
                  description="Tons of waste collected by day"
                />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="agents" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-6">
                  <BarChartPlaceholder 
                    title="Agent Collections" 
                    description="Number of collections by agent"
                  />
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <LineChartPlaceholder 
                    title="Response Time" 
                    description="Average agent response time (minutes)"
                  />
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Agents</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-8">
                  {mockAgents.slice(0, 5).map((agent, idx) => (
                    <div key={idx} className="flex items-center">
                      <div className="mr-4">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                          <FiUsers className="h-4 w-4" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center">
                          <span className="font-medium">{agent.name}</span>
                          <Badge className="ml-2 bg-green-500">{agent.status}</Badge>
                        </div>
                        <div className="w-full h-2 bg-gray-100 rounded-full mt-2">
                          <div 
                            className="h-full bg-blue-500 rounded-full" 
                            style={{ width: `${70 + Math.random() * 30}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{Math.floor(150 + Math.random() * 150)}</div>
                        <div className="text-xs text-gray-500">collections</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="waste" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-6">
                  <PieChartPlaceholder 
                    title="Recycling Rates" 
                    description="Percentage of waste recycled by type"
                  />
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <LineChartPlaceholder 
                    title="Waste Reduction" 
                    description="Monthly reduction in waste volume"
                  />
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Waste Collection by Area</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {['Downtown', 'Suburban North', 'Industrial Zone', 'Residential East', 'Commercial District'].map((area, idx) => (
                    <div key={idx} className="flex items-center">
                      <div className="mr-4">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                          <FiMapPin className="h-4 w-4" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center">
                          <span className="font-medium">{area}</span>
                        </div>
                        <div className="w-full h-2 bg-gray-100 rounded-full mt-2">
                          <div 
                            className="h-full bg-blue-500 rounded-full" 
                            style={{ width: `${40 + Math.random() * 60}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{Math.floor(5 + Math.random() * 20)}</div>
                        <div className="text-xs text-gray-500">tons</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="customers" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-6">
                  <LineChartPlaceholder 
                    title="Customer Growth" 
                    description="New customers over time"
                  />
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <BarChartPlaceholder 
                    title="Feedback Ratings" 
                    description="Customer satisfaction scores"
                  />
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Top Customer Segments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-8">
                  {['Residential', 'Small Business', 'Corporate', 'Government', 'Educational'].map((segment, idx) => (
                    <div key={idx} className="flex items-center">
                      <div className="mr-4">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                          <FiUsers className="h-4 w-4" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center">
                          <span className="font-medium">{segment}</span>
                        </div>
                        <div className="w-full h-2 bg-gray-100 rounded-full mt-2">
                          <div 
                            className="h-full bg-blue-500 rounded-full" 
                            style={{ width: `${40 + Math.random() * 60}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">${Math.floor(1000 + Math.random() * 9000)}</div>
                        <div className="text-xs text-gray-500">revenue</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default AnalyticsPage;