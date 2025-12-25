/**
 * بيانات تجريبية لنطاق الدعم الفني
 */

import { 
  Ticket, 
  FAQ, 
  SupportCategory, 
  KnowledgeBaseArticle, 
  TrainingMaterial 
} from "../types";
import { 
  FiLifeBuoy, 
  FiFileText, 
  FiBookOpen, 
  FiHelpCircle,
  FiMessageCircle,
  FiAlertCircle,
  FiMapPin
} from "react-icons/fi";
import React from "react";

/**
 * بيانات تجريبية لتذاكر الدعم
 */
export const mockTickets: Ticket[] = [
  {
    id: "T-1234",
    subject: "Vehicle breakdown during collection",
    status: "open",
    priority: "high",
    created: new Date(Date.now() - 2 * 3600000), // 2 hours ago
    lastUpdated: new Date(Date.now() - 30 * 60000), // 30 minutes ago
    category: "Vehicle Issues",
    assignee: "Support Team"
  },
  {
    id: "T-1233",
    subject: "App navigation issues on mobile",
    status: "in_progress",
    priority: "medium",
    created: new Date(Date.now() - 2 * 86400000), // 2 days ago
    lastUpdated: new Date(Date.now() - 12 * 3600000), // 12 hours ago
    category: "Software",
    assignee: "Tech Support"
  },
  {
    id: "T-1232",
    subject: "Request for collection route optimization",
    status: "pending",
    priority: "low",
    created: new Date(Date.now() - 5 * 86400000), // 5 days ago
    lastUpdated: new Date(Date.now() - 3 * 86400000), // 3 days ago
    category: "Route Planning",
    assignee: "Operations Team"
  },
  {
    id: "T-1231",
    subject: "Training request for new collection methods",
    status: "closed",
    priority: "medium",
    created: new Date(Date.now() - 14 * 86400000), // 14 days ago
    lastUpdated: new Date(Date.now() - 10 * 86400000), // 10 days ago
    category: "Training",
    assignee: "Training Department"
  },
  {
    id: "T-1230",
    subject: "Equipment malfunction - waste compactor",
    status: "resolved",
    priority: "high",
    created: new Date(Date.now() - 21 * 86400000), // 21 days ago
    lastUpdated: new Date(Date.now() - 20 * 86400000), // 20 days ago
    category: "Equipment",
    assignee: "Maintenance Team"
  }
];

/**
 * بيانات تجريبية للأسئلة الشائعة
 */
export const mockFAQs: FAQ[] = [
  {
    id: "1",
    question: "How do I optimize my waste collection routes?",
    answer: "Route optimization can be done through the Map View section. Use the 'Optimize' button to automatically generate the most efficient route based on collection points, traffic data, and vehicle capacity. You can also manually adjust routes by dragging waypoints on the map."
  },
  {
    id: "2",
    question: "What should I do if my collection vehicle breaks down?",
    answer: "In case of vehicle breakdown, immediately report the issue through the Support system with high priority. Use the mobile app to share your current location. Contact the dispatch center directly at the emergency number provided. If safe to do so, place warning triangles around your vehicle and wait for assistance."
  },
  {
    id: "3",
    question: "How can I reschedule a waste collection?",
    answer: "To reschedule a collection, navigate to the Orders section and find the specific collection order. Click on the 'Reschedule' button and select a new date and time. The system will automatically notify all relevant parties about the change and update the collection schedule accordingly."
  },
  {
    id: "4",
    question: "How do I generate reports on waste collection data?",
    answer: "Reports can be generated from the Analytics section. Choose the type of report (collection volumes, efficiency metrics, customer feedback, etc.), select the time period, and click 'Generate Report'. Reports can be exported in CSV, PDF, or Excel formats, and can also be scheduled for automatic delivery to specified email addresses."
  },
  {
    id: "5",
    question: "What are the procedures for handling hazardous waste?",
    answer: "Hazardous waste requires special handling procedures. Always wear appropriate PPE (Personal Protective Equipment) including gloves, masks, and eye protection. Use designated containers marked for hazardous materials. Log the type and quantity of hazardous waste in the special section of the collection form. For detailed guidelines, refer to the Safety Procedures manual in the Training section."
  }
];

/**
 * بيانات تجريبية لفئات الدعم
 */
export const supportCategories: SupportCategory[] = [
  { name: "Vehicle Issues", icon: <FiLifeBuoy className="h-5 w-5" />, count: 12 },
  { name: "Software", icon: <FiFileText className="h-5 w-5" />, count: 8 },
  { name: "Equipment", icon: <FiLifeBuoy className="h-5 w-5" />, count: 15 },
  { name: "Route Planning", icon: <FiFileText className="h-5 w-5" />, count: 10 },
  { name: "Training", icon: <FiBookOpen className="h-5 w-5" />, count: 6 },
  { name: "Other", icon: <FiHelpCircle className="h-5 w-5" />, count: 4 }
];

/**
 * بيانات تجريبية لمقالات قاعدة المعرفة
 */
export const knowledgeBaseArticles: KnowledgeBaseArticle[] = [
  { 
    title: "Complete Guide to Waste Sorting and Categorization", 
    category: "Waste Management",
    views: 1205,
    lastUpdated: "2 weeks ago"
  },
  { 
    title: "Vehicle Maintenance Checklist for Collection Trucks", 
    category: "Vehicles",
    views: 987,
    lastUpdated: "3 days ago"
  },
  { 
    title: "Optimizing Collection Routes for Fuel Efficiency", 
    category: "Route Planning",
    views: 765,
    lastUpdated: "1 week ago"
  },
  { 
    title: "Safety Protocols for Handling Hazardous Materials", 
    category: "Safety",
    views: 1432,
    lastUpdated: "5 days ago"
  },
  { 
    title: "Customer Communication Best Practices", 
    category: "Customer Service",
    views: 543,
    lastUpdated: "2 days ago"
  }
];

/**
 * بيانات تجريبية للمواد التدريبية
 */
export const trainingMaterials: TrainingMaterial[] = [
  {
    title: "Waste Sorting Fundamentals",
    description: "Learn the basics of waste categorization and proper sorting techniques.",
    icon: <FiBookOpen className="h-6 w-6" />,
    type: "Course",
    duration: "45 min"
  },
  {
    title: "Vehicle Operation Safety",
    description: "Essential safety protocols for operating waste collection vehicles.",
    icon: <FiLifeBuoy className="h-6 w-6" />,
    type: "Video",
    duration: "30 min"
  },
  {
    title: "Mobile App User Guide",
    description: "Comprehensive tutorial on using the waste collection mobile application.",
    icon: <FiFileText className="h-6 w-6" />,
    type: "Guide",
    duration: "20 min"
  },
  {
    title: "Customer Interaction Best Practices",
    description: "Guidelines for professional and effective customer communication.",
    icon: <FiMessageCircle className="h-6 w-6" />,
    type: "Course",
    duration: "60 min"
  },
  {
    title: "Hazardous Waste Handling",
    description: "Procedures and precautions for safely handling hazardous materials.",
    icon: <FiAlertCircle className="h-6 w-6" />,
    type: "Video",
    duration: "35 min"
  },
  {
    title: "Route Optimization Techniques",
    description: "Methods to create efficient collection routes and reduce fuel consumption.",
    icon: <FiMapPin className="h-6 w-6" />,
    type: "Workshop",
    duration: "90 min"
  }
];