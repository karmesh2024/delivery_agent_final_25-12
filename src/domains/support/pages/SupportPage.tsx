"use client";

/**
 * صفحة الدعم الفني الرئيسية
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { 
  FiSearch, 
  FiHelpCircle, 
  FiMessageCircle,
  FiLifeBuoy,
  FiFileText,
  FiBookOpen,
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
  FiPlusCircle,
  FiArrowRight,
  FiPhoneCall,
  FiMail,
  FiVideo,
  FiMapPin
} from "react-icons/fi";

// استيراد المكونات والأنواع ومصدر البيانات المحلية
import { SupportState, Ticket, FAQ } from "../types";
import FAQItem from "../components/FAQItem";
import { 
  mockTickets, 
  mockFAQs, 
  supportCategories, 
  knowledgeBaseArticles, 
  trainingMaterials 
} from "../data/mock-data";

/**
 * صفحة الدعم الفني الرئيسية
 */
const SupportPage: React.FC = () => {
  // حالة الصفحة
  const [state, setState] = useState<SupportState>({
    tickets: [],
    faqs: [],
    loading: true,
    searchTerm: "",
    openFaqs: {},
    selectedTicketStatus: "all"
  });
  
  // تحميل التذاكر والأسئلة الشائعة
  useEffect(() => {
    const loadData = async () => {
      setState(prev => ({ ...prev, loading: true }));
      try {
        // في تطبيق حقيقي، هذه ستكون طلبات API
        setState(prev => ({
          ...prev,
          tickets: mockTickets,
          faqs: mockFAQs,
        }));
        
        // تهيئة أول سؤال شائع كمفتوح
        const initialOpenState: { [key: string]: boolean } = {};
        mockFAQs.forEach((faq, index) => {
          initialOpenState[faq.id] = index === 0;
        });
        setState(prev => ({
          ...prev,
          openFaqs: initialOpenState
        }));
      } catch (error) {
        console.error("Error loading support data:", error);
      } finally {
        setState(prev => ({ ...prev, loading: false }));
      }
    };

    loadData();
  }, []);

  // تصفية التذاكر حسب الحالة ومصطلح البحث
  const filteredTickets = state.tickets.filter(ticket => {
    const matchesStatus = state.selectedTicketStatus === "all" || ticket.status === state.selectedTicketStatus;
    const matchesSearch = state.searchTerm === "" || 
                          ticket.subject.toLowerCase().includes(state.searchTerm.toLowerCase()) || 
                          ticket.category.toLowerCase().includes(state.searchTerm.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

  // تنسيق التاريخ
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // تبديل فتح/إغلاق السؤال الشائع
  const toggleFaq = (id: string) => {
    setState(prev => ({
      ...prev,
      openFaqs: {
        ...prev.openFaqs,
        [id]: !prev.openFaqs[id]
      }
    }));
  };

  // الحصول على شارة الحالة للتذاكر
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return <Badge className="bg-blue-500 text-white">Open</Badge>;
      case "in_progress":
        return <Badge className="bg-yellow-500 text-white">In Progress</Badge>;
      case "pending":
        return <Badge className="bg-purple-500 text-white">Pending</Badge>;
      case "resolved":
        return <Badge className="bg-green-500 text-white">Resolved</Badge>;
      case "closed":
        return <Badge className="bg-gray-500 text-white">Closed</Badge>;
      default:
        return <Badge className="bg-gray-500 text-white">{status}</Badge>;
    }
  };

  // الحصول على شارة الأولوية للتذاكر
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return <Badge className="bg-red-500 text-white">High</Badge>;
      case "medium":
        return <Badge className="bg-yellow-500 text-white">Medium</Badge>;
      case "low":
        return <Badge className="bg-green-500 text-white">Low</Badge>;
      default:
        return <Badge className="bg-gray-500 text-white">{priority}</Badge>;
    }
  };

  // تحديث مصطلح البحث
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setState(prev => ({ ...prev, searchTerm: e.target.value }));
  };

  // تحديد حالة التذكرة
  const setSelectedTicketStatus = (status: string) => {
    setState(prev => ({ ...prev, selectedTicketStatus: status }));
  };

  return (
    <>
      <div className="space-y-6">
        {/* الترويسة والبحث */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center">
              <FiLifeBuoy className="mr-2 h-6 w-6 text-blue-600" />
              Support Center
            </h1>
            <p className="text-sm text-muted-foreground">
              Get help, documentation, and support for waste management operations
            </p>
          </div>
          <div className="w-full sm:w-auto">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input 
                placeholder="Search for help..." 
                className="pl-10 pr-4 w-full sm:w-80"
                value={state.searchTerm}
                onChange={handleSearchChange}
              />
            </div>
          </div>
        </div>

        {/* بطاقات الإجراءات السريعة */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-start">
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-4">
                  <FiHelpCircle className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">Help Center</h3>
                  <p className="text-sm text-gray-600 mb-4">Browse guides, tutorials, and FAQs</p>
                  <Button variant="default" size="sm" className="gap-1">
                    Explore Resources
                    <FiArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-start">
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center text-green-600 mr-4">
                  <FiMessageCircle className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">Create Ticket</h3>
                  <p className="text-sm text-gray-600 mb-4">Submit a support request for assistance</p>
                  <Button variant="default" size="sm" className="gap-1 bg-green-600 hover:bg-green-700">
                    New Ticket
                    <FiPlusCircle className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-start">
                <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 mr-4">
                  <FiPhoneCall className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">Contact Us</h3>
                  <p className="text-sm text-gray-600 mb-4">Reach our support team directly</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="gap-1">
                      <FiPhoneCall className="h-4 w-4" />
                      Call
                    </Button>
                    <Button variant="outline" size="sm" className="gap-1">
                      <FiMail className="h-4 w-4" />
                      Email
                    </Button>
                    <Button variant="outline" size="sm" className="gap-1">
                      <FiVideo className="h-4 w-4" />
                      Video
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* تبويبات الدعم */}
        <Tabs defaultValue="tickets" className="space-y-4">
          <TabsList className="grid grid-cols-4 h-auto p-1">
            <TabsTrigger value="tickets" className="text-xs sm:text-sm py-2">My Tickets</TabsTrigger>
            <TabsTrigger value="faq" className="text-xs sm:text-sm py-2">FAQ</TabsTrigger>
            <TabsTrigger value="kb" className="text-xs sm:text-sm py-2">Knowledge Base</TabsTrigger>
            <TabsTrigger value="training" className="text-xs sm:text-sm py-2">Training Materials</TabsTrigger>
          </TabsList>
          
          {/* تبويب التذاكر */}
          <TabsContent value="tickets" className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={state.selectedTicketStatus === "all" ? "default" : "outline"}
                  onClick={() => setSelectedTicketStatus("all")}
                  size="sm"
                >
                  All Tickets
                </Button>
                <Button
                  variant={state.selectedTicketStatus === "open" ? "default" : "outline"}
                  onClick={() => setSelectedTicketStatus("open")}
                  size="sm"
                  className="gap-1"
                >
                  <FiAlertCircle className="h-4 w-4 text-blue-600" />
                  Open
                </Button>
                <Button
                  variant={state.selectedTicketStatus === "in_progress" ? "default" : "outline"}
                  onClick={() => setSelectedTicketStatus("in_progress")}
                  size="sm"
                  className="gap-1"
                >
                  <FiClock className="h-4 w-4 text-yellow-600" />
                  In Progress
                </Button>
                <Button
                  variant={state.selectedTicketStatus === "resolved" ? "default" : "outline"}
                  onClick={() => setSelectedTicketStatus("resolved")}
                  size="sm"
                  className="gap-1"
                >
                  <FiCheckCircle className="h-4 w-4 text-green-600" />
                  Resolved
                </Button>
              </div>
              
              <Button className="gap-1">
                <FiPlusCircle className="h-4 w-4" />
                New Ticket
              </Button>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Support Tickets</CardTitle>
                <CardDescription>Track and manage your support requests</CardDescription>
              </CardHeader>
              <CardContent>
                {state.loading ? (
                  <div className="text-center py-4">
                    <p>Loading tickets...</p>
                  </div>
                ) : filteredTickets.length === 0 ? (
                  <div className="text-center py-8">
                    <FiFileText className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                    <h3 className="text-lg font-medium mb-1">No tickets found</h3>
                    <p className="text-gray-500 mb-4">
                      {state.searchTerm ? "Try a different search term" : "You don't have any support tickets yet"}
                    </p>
                    <Button className="gap-1">
                      <FiPlusCircle className="h-4 w-4" />
                      Create New Ticket
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="px-4 py-3 text-left font-medium text-sm">Ticket</th>
                          <th className="px-4 py-3 text-left font-medium text-sm">Subject</th>
                          <th className="px-4 py-3 text-left font-medium text-sm">Status</th>
                          <th className="px-4 py-3 text-left font-medium text-sm">Priority</th>
                          <th className="px-4 py-3 text-left font-medium text-sm">Category</th>
                          <th className="px-4 py-3 text-left font-medium text-sm">Created</th>
                          <th className="px-4 py-3 text-left font-medium text-sm">Updated</th>
                          <th className="px-4 py-3 text-center font-medium text-sm">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTickets.map((ticket) => (
                          <tr key={ticket.id} className="border-b hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <span className="font-medium">{ticket.id}</span>
                            </td>
                            <td className="px-4 py-3 max-w-xs">
                              <p className="truncate">{ticket.subject}</p>
                            </td>
                            <td className="px-4 py-3">
                              {getStatusBadge(ticket.status)}
                            </td>
                            <td className="px-4 py-3">
                              {getPriorityBadge(ticket.priority)}
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-sm">{ticket.category}</span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {formatDate(ticket.created)}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {formatDate(ticket.lastUpdated)}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <Button variant="ghost" size="sm">
                                View
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* تبويب الأسئلة الشائعة */}
          <TabsContent value="faq" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Frequently Asked Questions</CardTitle>
                <CardDescription>Common questions and answers about waste management operations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {/* الفئات */}
                  <div className="md:col-span-1">
                    <h3 className="font-medium mb-3">Categories</h3>
                    <div className="space-y-2">
                      {supportCategories.map((category, index) => (
                        <div key={index} className="flex items-center justify-between p-2 rounded hover:bg-gray-50 cursor-pointer">
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-2">
                              {category.icon}
                            </div>
                            <span>{category.name}</span>
                          </div>
                          <Badge className="bg-gray-200 text-gray-800">
                            {category.count}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* الأسئلة الشائعة */}
                  <div className="md:col-span-3">
                    <h3 className="font-medium mb-3">Common Questions</h3>
                    {state.faqs.map((faq) => (
                      <FAQItem 
                        key={faq.id} 
                        faq={faq} 
                        isOpen={!!state.openFaqs[faq.id]} 
                        toggle={() => toggleFaq(faq.id)} 
                      />
                    ))}
                    
                    <div className="mt-6 text-center">
                      <p className="mb-3 text-gray-600">
                        Still have questions? We're here to help.
                      </p>
                      <Button className="gap-1">
                        <FiMessageCircle className="h-4 w-4" />
                        Contact Support
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* تبويب قاعدة المعرفة */}
          <TabsContent value="kb" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Knowledge Base</CardTitle>
                <CardDescription>Detailed guides and articles on waste management processes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {/* الفئات */}
                  <div className="md:col-span-1">
                    <h3 className="font-medium mb-3">Browse Topics</h3>
                    <div className="space-y-2">
                      <div className="p-2 rounded bg-blue-50 border-l-4 border-blue-500">
                        <span className="font-medium">All Articles</span>
                      </div>
                      {['Waste Management', 'Vehicles', 'Route Planning', 'Safety', 'Customer Service', 'Equipment'].map((category, index) => (
                        <div key={index} className="p-2 rounded hover:bg-gray-50 cursor-pointer">
                          <span>{category}</span>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-6">
                      <h3 className="font-medium mb-3">Popular Tags</h3>
                      <div className="flex flex-wrap gap-2">
                        {['recycling', 'maintenance', 'safety', 'collection', 'routes', 'training', 'vehicles', 'customers'].map((tag, index) => (
                          <Badge key={index} className="bg-gray-100 text-gray-800 hover:bg-gray-200 cursor-pointer">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {/* المقالات */}
                  <div className="md:col-span-3">
                    <h3 className="font-medium mb-3">Recent Articles</h3>
                    
                    <div className="space-y-4">
                      {knowledgeBaseArticles.map((article, index) => (
                        <Card key={index} className="hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-medium text-blue-700 hover:text-blue-800 cursor-pointer">
                                  {article.title}
                                </h4>
                                <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                                  <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                                    {article.category}
                                  </Badge>
                                  <span>{article.views} views</span>
                                  <span>Updated {article.lastUpdated}</span>
                                </div>
                              </div>
                              <Button variant="ghost" size="icon">
                                <FiArrowRight className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                    
                    <div className="mt-6 text-center">
                      <Button variant="outline" className="gap-1">
                        View All Articles
                        <FiArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* تبويب المواد التدريبية */}
          <TabsContent value="training" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Training Materials</CardTitle>
                <CardDescription>Educational resources and tutorials for waste management operations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {trainingMaterials.map((item, index) => (
                    <Card key={index} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-0">
                        <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                            {item.icon}
                          </div>
                          <Badge className="bg-blue-100 text-blue-800">
                            {item.type} • {item.duration}
                          </Badge>
                        </div>
                        <div className="p-4">
                          <h3 className="font-medium mb-2">{item.title}</h3>
                          <p className="text-sm text-gray-600 mb-4">{item.description}</p>
                          <Button variant="outline" size="sm" className="w-full justify-center">
                            Start Learning
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                
                <div className="mt-8 text-center">
                  <h3 className="text-lg font-medium mb-2">Need personalized training?</h3>
                  <p className="text-gray-600 mb-4">
                    We offer custom training sessions tailored to your team's specific needs
                  </p>
                  <Button>Request Training</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
};

export default SupportPage;