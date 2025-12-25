"use client";

/**
 * صفحة الرسائل الرئيسية
 * تستخدم Redux لإدارة الحالة
 */

import { useEffect, useRef, ReactNode } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@/store";
import { Card } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { mockAgents } from "../data/mock-data";
import { Agent } from "@/types";
import { 
  FiSearch, 
  FiMessageSquare, 
  FiSend, 
  FiUsers,
  FiPaperclip,
  FiImage,
  FiMapPin,
  FiPhone,
  FiVideo,
  FiInfo,
} from "react-icons/fi";

// استيراد المكونات والأنواع وإجراءات Redux
import { Message, Conversation } from "@/types";
import MessageItem from "../components/MessageItem";
import ConversationItem from "../components/ConversationItem";
import { 
  fetchConversations,
  fetchMessages,
  sendMessage,
  markAsRead,
  setSearchTerm,
  setMessageInput,
  setSelectedConversation,
  setAgents
} from "../store/messagesSlice";

/**
 * صفحة الرسائل الرئيسية
 */
const MessagesPage: React.FC = () => {
  // استخدام Redux
  const dispatch = useDispatch<AppDispatch>();
  const { 
    conversations, 
    messages, 
    loading, 
    searchTerm, 
    messageInput, 
    selectedConversation, 
    agents,
    error 
  } = useSelector((state: RootState) => state.messages);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // تحميل المحادثات والمندوبين
  useEffect(() => {
    // جلب المندوبين (في تطبيق حقيقي سيكون من API)
    dispatch(setAgents(mockAgents));
    
    // جلب المحادثات للمستخدم الحالي (حالياً "admin")
    dispatch(fetchConversations({ 
      participantId: "admin", 
      participantType: "admin"
    }));
  }, [dispatch]);

  // تحميل الرسائل عند اختيار محادثة
  useEffect(() => {
    if (selectedConversation) {
      // جلب رسائل المحادثة المحددة
      dispatch(fetchMessages(selectedConversation));
      
      // تعليم الرسائل كمقروءة
      dispatch(markAsRead({
        conversationId: selectedConversation,
        participantId: "admin"
      }));
    }
  }, [selectedConversation, dispatch]);

  // التمرير إلى آخر الرسائل
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // تصفية المحادثات حسب مصطلح البحث
  const filteredConversations = conversations.filter(conv => {
    const agent = agents.find(a => a.id === conv.agentId);
    if (!agent) return false;
    
    return agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           conv.lastMessage.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // الحصول على تفاصيل المندوب
  const getAgentDetails = (agentId: string) => {
    return agents.find(a => a.id === agentId);
  };

  // تنسيق الطابع الزمني
  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    // أقل من يوم
    if (diff < 86400000) {
      return new Intl.DateTimeFormat('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    }
    
    // أقل من أسبوع
    if (diff < 604800000) {
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      return days[date.getDay()];
    }
    
    // أكثر من أسبوع
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  // معالجة إرسال رسالة
  const handleSendMessage = () => {
    if (!messageInput.trim() || !selectedConversation) return;
    
    // إرسال الرسالة باستخدام إجراء Redux
    dispatch(sendMessage({
      conversationId: selectedConversation,
      senderId: "admin",
      content: messageInput
    }));
  };

  // تحديث حقل الإدخال
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(setMessageInput(e.target.value));
  };

  // تحديث مصطلح البحث
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(setSearchTerm(e.target.value));
  };

  // تحديد محادثة
  const selectConversation = (id: string) => {
    dispatch(setSelectedConversation(id));
  };

  return (
      <div className="h-[calc(100vh-12rem)]">
        <div className="flex h-full">
          {/* قائمة المحادثات */}
          <div className="w-full md:w-80 border-r bg-white">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold flex items-center">
                <FiMessageSquare className="mr-2 h-5 w-5 text-blue-600" />
                Messages
              </h2>
              <div className="mt-2 relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input 
                  placeholder="Search conversations..." 
                  className="pl-10 pr-4"
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
              </div>
            </div>
            
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full grid-cols-3 p-1 mx-3 mt-3">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="unread">
                  Unread
                  <Badge className="ml-1 bg-blue-500 text-white">
                    {conversations.filter(c => c.unread).length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="important">Important</TabsTrigger>
              </TabsList>
              
              <TabsContent value="all" className="mt-2">
                <div className="divide-y">
                  {loading ? (
                    <div className="p-4 text-center text-sm text-gray-500">
                      Loading conversations...
                    </div>
                  ) : filteredConversations.length === 0 ? (
                    <div className="p-4 text-center text-sm text-gray-500">
                      No conversations found
                    </div>
                  ) : (
                    filteredConversations.map((conv) => {
                      const agent = getAgentDetails(conv.agentId);
                      
                      return (
                        <ConversationItem
                          key={conv.id}
                          conversation={conv}
                          agent={agent}
                          isSelected={selectedConversation === conv.id}
                          onClick={() => selectConversation(conv.id)}
                          formatTime={formatTime}
                        />
                      );
                    })
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="unread" className="mt-2">
                <div className="divide-y">
                  {conversations.filter(c => c.unread).length === 0 ? (
                    <div className="p-4 text-center text-sm text-gray-500">
                      No unread messages
                    </div>
                  ) : (
                    conversations.filter(c => c.unread).map((conv) => {
                      const agent = getAgentDetails(conv.agentId);
                      
                      return (
                        <ConversationItem
                          key={conv.id}
                          conversation={conv}
                          agent={agent}
                          isSelected={selectedConversation === conv.id}
                          onClick={() => selectConversation(conv.id)}
                          formatTime={formatTime}
                        />
                      );
                    })
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="important" className="mt-2">
                <div className="p-4 text-center text-sm text-gray-500">
                  No important messages
                </div>
              </TabsContent>
            </Tabs>
          </div>
          
          {/* نافذة المحادثة */}
          <div className="hidden md:flex md:flex-1 flex-col bg-white">
            {selectedConversation ? (
              <>
                {/* رأس المحادثة */}
                <div className="border-b p-4 flex justify-between items-center">
                  {(() => {
                    const conversation = conversations.find(c => c.id === selectedConversation);
                    if (!conversation) return null;
                    
                    const agent = getAgentDetails(conversation.agentId);
                    if (!agent) return null;
                    
                    return (
                      <>
                        <div className="flex items-center">
                          <div className="relative mr-3">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                              <FiUsers className="h-5 w-5" />
                            </div>
                            {agent.status === 'online' && (
                              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                            )}
                          </div>
                          <div>
                            <h3 className="font-medium">{agent.name}</h3>
                            <p className="text-xs text-gray-500">
                              {agent.status === 'online' ? 'Online' : 'Offline'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="icon" title="Call">
                            <FiPhone className="h-5 w-5 text-gray-600" />
                          </Button>
                          <Button variant="ghost" size="icon" title="Video Call">
                            <FiVideo className="h-5 w-5 text-gray-600" />
                          </Button>
                          <Button variant="ghost" size="icon" title="Info">
                            <FiInfo className="h-5 w-5 text-gray-600" />
                          </Button>
                        </div>
                      </>
                    );
                  })()}
                </div>
                
                {/* الرسائل */}
                <div className="flex-1 overflow-y-auto p-4 bg-white">
                  {messages.map((message) => (
                    <MessageItem 
                      key={message.id} 
                      message={message} 
                      isAdmin={message.senderId === "admin"} 
                    />
                  ))}
                  <div ref={messagesEndRef} />
                </div>
                
                {/* إدخال الرسالة */}
                <div className="border-t p-4 bg-white">
                  <div className="flex flex-col">
                    {/* عرض إذا كان الرد على رسالة */}
                    {messages.length > 0 && (
                      <div className="flex justify-between items-center mb-2 p-2 bg-gray-50 rounded-md">
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Reply to:</span> {messages[messages.length - 1].content.substring(0, 40)}...
                        </div>
                        <Button variant="ghost" size="sm" className="text-gray-500 h-6 w-6">
                          ×
                        </Button>
                      </div>
                    )}
                    
                    <div className="flex items-center">
                      <div className="flex space-x-1">
                        <Button variant="ghost" size="icon" className="text-gray-500" title="Attach file">
                          <FiPaperclip className="h-5 w-5" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-gray-500" 
                          title="Send image"
                          onClick={() => console.log("Should show image picker")}
                        >
                          <FiImage className="h-5 w-5" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-gray-500" 
                          title="Send location"
                          onClick={() => console.log("Should show location picker")}
                        >
                          <FiMapPin className="h-5 w-5" />
                        </Button>
                      </div>
                      <Input
                        placeholder="Type a message..."
                        className="mx-2 flex-1"
                        value={messageInput}
                        onChange={handleInputChange}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                      />
                      <Button 
                        variant="default" 
                        className="ml-2"
                        onClick={handleSendMessage}
                        disabled={!messageInput.trim()}
                      >
                        <FiSend className="h-4 w-4 mr-1" />
                        <span className="hidden sm:inline">Send</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
              <div className="text-center max-w-md p-6">
                <div className="mx-auto w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mb-4">
                  <FiMessageSquare className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-semibold mb-2">مركز الرسائل</h3>
                <p className="text-gray-500 mb-4">
                  مركز التواصل لفريق جمع النفايات. اختر محادثة للبدء بالدردشة أو أنشئ محادثة جديدة.
                </p>
                <Button 
                  variant="default"
                  onClick={() => console.log("Should show dialog to create new conversation")}
                >
                  إنشاء محادثة جديدة
                </Button>
                </div>
              </div>
            )}
          </div>
          
          {/* للجوال: لم يتم تحديد محادثة */}
          {!selectedConversation && (
            <div className="md:hidden flex-1 flex items-center justify-center">
              <div className="text-center max-w-md p-6">
                <div className="mx-auto w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mb-4">
                  <FiMessageSquare className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Your Messages</h3>
                <p className="text-gray-500 mb-4">
                  Select a conversation to start chatting.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
  );
};

export default MessagesPage;