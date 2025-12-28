# دليل تطوير شرائح Redux وتحويل الصفحات

## المقدمة

تقدم هذه الوثيقة دليلاً شاملاً لتطوير شرائح Redux للنطاقات المتبقية وتحويل الصفحات لاستخدام Redux، وهي المهمة الثالثة والرابعة ضمن المرحلة الأولى من المشروع. تهدف هذه المهام إلى توحيد آليات إدارة الحالة في المشروع بأكمله واستكمال عملية إعادة الهيكلة.

## أهداف تطوير شرائح Redux

1. **توحيد إدارة الحالة**: استخدام Redux كحل موحد لإدارة الحالة في جميع النطاقات
2. **تحسين إمكانية الاختبار**: فصل منطق الأعمال عن مكونات العرض
3. **تحسين الأداء**: استخدام التخزين المؤقت وتقليل عمليات إعادة العرض غير الضرورية
4. **دعم ميزات التطوير**: تمكين استخدام Redux DevTools لتسهيل التطوير والتصحيح

## منهجية تطوير شرائح Redux

### 1. تحديد الشرائح المطلوبة

بناءً على تحليل النطاقات، نحتاج إلى تطوير شرائح Redux للنطاقات التالية:

1. **نطاق الرسائل (Messages)**
2. **نطاق التحليلات (Analytics)**
3. **نطاق الدعم (Support)**
4. **نطاق الإعدادات (Settings)**

### 2. هيكل الشرائح

كل شريحة Redux يجب أن تتبع هيكلاً موحداً يتضمن:

1. **نمط الحالة**: تحديد نمط الحالة المبدئية
2. **مخفضات (Reducers)**: لمعالجة الإجراءات المحلية
3. **إجراءات غير متزامنة (Async Actions)**: باستخدام createAsyncThunk
4. **مخفضات الإجراءات غير المتزامنة**: لمعالجة حالات التحميل والنجاح والفشل

## خطوات تطوير شرائح Redux

### الخطوة 1: تطوير شريحة Redux لنطاق الرسائل

#### 1.1 تحديد نمط الحالة

```typescript
// src/domains/messages/store/messagesSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { messagesApi } from '../api/messagesApi';
import { Conversation, Message } from '@/types';

// نمط الحالة
interface MessagesState {
  conversations: Conversation[];
  messages: Message[];
  selectedConversation: string | null;
  loading: boolean;
  error: string | null;
}

// الحالة المبدئية
const initialState: MessagesState = {
  conversations: [],
  messages: [],
  selectedConversation: null,
  loading: false,
  error: null,
};
```

#### 1.2 تطوير الإجراءات غير المتزامنة

```typescript
// src/domains/messages/store/messagesSlice.ts

// إجراءات غير متزامنة
export const fetchConversations = createAsyncThunk(
  'messages/fetchConversations',
  async () => {
    const response = await messagesApi.getConversations();
    if (!response.success) throw new Error(response.error?.message);
    return response.data;
  }
);

export const fetchMessages = createAsyncThunk(
  'messages/fetchMessages',
  async (conversationId: string) => {
    const response = await messagesApi.getMessagesByConversation(conversationId);
    if (!response.success) throw new Error(response.error?.message);
    return response.data;
  }
);

export const sendMessage = createAsyncThunk(
  'messages/sendMessage',
  async (message: Omit<Message, 'id'>) => {
    const response = await messagesApi.sendMessage(message);
    if (!response.success) throw new Error(response.error?.message);
    return response.data;
  }
);
```

#### 1.3 تطوير المخفضات

```typescript
// src/domains/messages/store/messagesSlice.ts

// شريحة Redux
const messagesSlice = createSlice({
  name: 'messages',
  initialState,
  reducers: {
    // مخفضات محلية
    setSelectedConversation: (state, action: PayloadAction<string>) => {
      state.selectedConversation = action.payload;
    },
    clearSelectedConversation: (state) => {
      state.selectedConversation = null;
      state.messages = [];
    },
    clearMessagesError: (state) => {
      state.error = null;
    },
    markMessageAsRead: (state, action: PayloadAction<string>) => {
      const messageId = action.payload;
      const message = state.messages.find(m => m.id === messageId);
      if (message) {
        message.isRead = true;
      }
    },
  },
  
  // مخفضات الإجراءات غير المتزامنة
  extraReducers: (builder) => {
    builder
      // fetchConversations
      .addCase(fetchConversations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchConversations.fulfilled, (state, action) => {
        state.loading = false;
        state.conversations = action.payload;
      })
      .addCase(fetchConversations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'فشل في جلب المحادثات';
      })
      
      // fetchMessages
      .addCase(fetchMessages.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.loading = false;
        state.messages = action.payload;
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'فشل في جلب الرسائل';
      })
      
      // sendMessage
      .addCase(sendMessage.pending, (state) => {
        // يمكن تحديث الحالة لإظهار أن رسالة قيد الإرسال
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.messages.push(action.payload);
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.error = action.error.message || 'فشل في إرسال الرسالة';
      });
  },
});

// تصدير الإجراءات المحلية
export const {
  setSelectedConversation,
  clearSelectedConversation,
  clearMessagesError,
  markMessageAsRead,
} = messagesSlice.actions;

// تصدير المخفض
export default messagesSlice.reducer;
```

#### 1.4 تسجيل المخفض في المتجر المركزي

```typescript
// src/store/index.ts
import { configureStore } from '@reduxjs/toolkit';
import ordersReducer from '@/domains/orders/store/ordersSlice';
import agentsReducer from '@/domains/agents/store/agentsSlice';
import mappingReducer from '@/domains/mapping/store/mappingSlice';
import messagesReducer from '@/domains/messages/store/messagesSlice';
// استيرادات أخرى...

export const store = configureStore({
  reducer: {
    orders: ordersReducer,
    agents: agentsReducer,
    mapping: mappingReducer,
    messages: messagesReducer,
    // مخفضات أخرى...
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

### الخطوة 2: تطوير شريحة Redux لنطاق التحليلات

#### 2.1 تحديد نمط الحالة

```typescript
// src/domains/analytics/store/analyticsSlice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { analyticsApi } from '../api/analyticsApi';
import { ChartData, AnalyticsFilter, AnalyticsSummary } from '@/types';

interface AnalyticsState {
  summary: AnalyticsSummary;
  ordersData: ChartData;
  agentsData: ChartData;
  revenueData: ChartData;
  currentFilter: AnalyticsFilter;
  loading: boolean;
  error: string | null;
}

const initialState: AnalyticsState = {
  summary: {
    totalOrders: 0,
    totalRevenue: 0,
    totalAgents: 0,
    totalCustomers: 0,
  },
  ordersData: { labels: [], datasets: [] },
  agentsData: { labels: [], datasets: [] },
  revenueData: { labels: [], datasets: [] },
  currentFilter: {
    period: 'week',
    dateFrom: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    dateTo: new Date(),
  },
  loading: false,
  error: null,
};
```

#### 2.2 تطوير الإجراءات غير المتزامنة

```typescript
// src/domains/analytics/store/analyticsSlice.ts

export const fetchAnalyticsSummary = createAsyncThunk(
  'analytics/fetchSummary',
  async () => {
    const response = await analyticsApi.getSummary();
    if (!response.success) throw new Error(response.error?.message);
    return response.data;
  }
);

export const fetchOrdersData = createAsyncThunk(
  'analytics/fetchOrdersData',
  async (filter: AnalyticsFilter) => {
    const response = await analyticsApi.getOrdersData(filter);
    if (!response.success) throw new Error(response.error?.message);
    return response.data;
  }
);

export const fetchAgentsData = createAsyncThunk(
  'analytics/fetchAgentsData',
  async (filter: AnalyticsFilter) => {
    const response = await analyticsApi.getAgentsData(filter);
    if (!response.success) throw new Error(response.error?.message);
    return response.data;
  }
);

export const fetchRevenueData = createAsyncThunk(
  'analytics/fetchRevenueData',
  async (filter: AnalyticsFilter) => {
    const response = await analyticsApi.getRevenueData(filter);
    if (!response.success) throw new Error(response.error?.message);
    return response.data;
  }
);
```

#### 2.3 تطوير المخفضات

```typescript
// src/domains/analytics/store/analyticsSlice.ts

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState,
  reducers: {
    setFilter: (state, action) => {
      state.currentFilter = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchAnalyticsSummary
      .addCase(fetchAnalyticsSummary.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAnalyticsSummary.fulfilled, (state, action) => {
        state.loading = false;
        state.summary = action.payload;
      })
      .addCase(fetchAnalyticsSummary.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'فشل في جلب ملخص التحليلات';
      })
      
      // fetchOrdersData
      .addCase(fetchOrdersData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrdersData.fulfilled, (state, action) => {
        state.loading = false;
        state.ordersData = action.payload;
      })
      .addCase(fetchOrdersData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'فشل في جلب بيانات الطلبات';
      })
      
      // مخفضات مماثلة لباقي الإجراءات...
  },
});

export const { setFilter } = analyticsSlice.actions;
export default analyticsSlice.reducer;
```

### الخطوة 3: اتباع نفس النمط لباقي النطاقات

يتم تطوير شرائح Redux لنطاقات الدعم والإعدادات باتباع نفس النمط المستخدم في النطاقات السابقة، مع تعديل الحالة والإجراءات وفقاً لمتطلبات كل نطاق.

## منهجية تحويل الصفحات لاستخدام Redux

### 1. تحديد الصفحات المطلوب تحويلها

بناءً على تحليل المشروع، الصفحات التالية تحتاج إلى تحويل:

1. **صفحة الرسائل (MessagesPage)**
2. **صفحة التحليلات (AnalyticsPage)**
3. **صفحة الدعم (SupportPage)**
4. **صفحة الإعدادات (SettingsPage)**

### 2. منهجية التحويل

لكل صفحة، اتبع المنهجية التالية:

1. **تحليل الحالة الحالية**: فهم كيفية إدارة الحالة حالياً
2. **إزالة الحالة المحلية**: استبدال استخدام `useState` بـ Redux
3. **استخدام Hooks Redux**: الاستفادة من `useSelector` و `useDispatch`
4. **تحديث دورة الحياة**: استبدال `useEffect` لجلب البيانات باستدعاء أفعال Redux

## خطوات تحويل الصفحات

### الخطوة 1: تحويل صفحة الرسائل

#### 1.1 الصفحة قبل التحويل

```tsx
// src/domains/messages/pages/MessagesPage.tsx (قبل التحويل)
"use client";

import { useState, useEffect } from "react";
import { Conversation, Message } from "@/types";
import { supabase } from "@/lib/supabase";
import { ConversationList } from "../components/ConversationList";
import { MessageList } from "../components/MessageList";
import { MessageInput } from "../components/MessageInput";

export default function MessagesPage() {
  // حالة محلية
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // جلب المحادثات
  useEffect(() => {
    const fetchConversations = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('conversations')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        setConversations(data || []);
      } catch (error) {
        console.error('Error fetching conversations:', error);
        setError('فشل في جلب المحادثات');
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, []);

  // جلب الرسائل عند اختيار محادثة
  useEffect(() => {
    if (!selectedConversation) return;

    const fetchMessages = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', selectedConversation)
          .order('created_at', { ascending: true });
        
        if (error) throw error;
        
        setMessages(data || []);
      } catch (error) {
        console.error('Error fetching messages:', error);
        setError('فشل في جلب الرسائل');
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [selectedConversation]);

  // إرسال رسالة
  const handleSendMessage = async (content: string) => {
    if (!selectedConversation) return;
    
    try {
      const newMessage = {
        conversation_id: selectedConversation,
        content,
        sender_id: 'current_user', // يفترض أن هوية المستخدم الحالي معروفة
        timestamp: new Date().toISOString(),
      };
      
      const { data, error } = await supabase
        .from('messages')
        .insert(newMessage)
        .select()
        .single();
      
      if (error) throw error;
      
      setMessages([...messages, data]);
    } catch (error) {
      console.error('Error sending message:', error);
      setError('فشل في إرسال الرسالة');
    }
  };

  // اختيار محادثة
  const handleSelectConversation = (conversationId: string) => {
    setSelectedConversation(conversationId);
  };

  return (
    <div className="grid grid-cols-3 gap-4 h-full">
      <div className="col-span-1 border-l">
        <ConversationList 
          conversations={conversations}
          selectedId={selectedConversation}
          onSelect={handleSelectConversation}
          loading={loading}
        />
      </div>
      <div className="col-span-2 flex flex-col h-full">
        {selectedConversation ? (
          <>
            <div className="flex-1 overflow-y-auto">
              <MessageList messages={messages} loading={loading} />
            </div>
            <div className="py-4">
              <MessageInput onSend={handleSendMessage} />
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">اختر محادثة للبدء</p>
          </div>
        )}
      </div>
    </div>
  );
}
```

#### 1.2 الصفحة بعد التحويل

```tsx
// src/domains/messages/pages/MessagesPage.tsx (بعد التحويل)
"use client";

import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { 
  fetchConversations, 
  fetchMessages, 
  sendMessage, 
  setSelectedConversation, 
  clearSelectedConversation 
} from "../store/messagesSlice";
import { ConversationList } from "../components/ConversationList";
import { MessageList } from "../components/MessageList";
import { MessageInput } from "../components/MessageInput";

export default function MessagesPage() {
  // استخدام Redux hooks
  const dispatch = useAppDispatch();
  const { 
    conversations, 
    messages, 
    selectedConversation,
    loading,
    error 
  } = useAppSelector(state => state.messages);

  // جلب المحادثات
  useEffect(() => {
    dispatch(fetchConversations());
  }, [dispatch]);

  // جلب الرسائل عند اختيار محادثة
  useEffect(() => {
    if (selectedConversation) {
      dispatch(fetchMessages(selectedConversation));
    }
  }, [dispatch, selectedConversation]);

  // إرسال رسالة
  const handleSendMessage = (content: string) => {
    if (!selectedConversation) return;
    
    dispatch(sendMessage({
      conversation_id: selectedConversation,
      content,
      sender_id: 'current_user', // يفترض أن هوية المستخدم الحالي معروفة
      timestamp: new Date().toISOString(),
    }));
  };

  // اختيار محادثة
  const handleSelectConversation = (conversationId: string) => {
    dispatch(setSelectedConversation(conversationId));
  };

  return (
    <div className="grid grid-cols-3 gap-4 h-full">
      <div className="col-span-1 border-l">
        <ConversationList 
          conversations={conversations}
          selectedId={selectedConversation}
          onSelect={handleSelectConversation}
          loading={loading}
        />
      </div>
      <div className="col-span-2 flex flex-col h-full">
        {selectedConversation ? (
          <>
            <div className="flex-1 overflow-y-auto">
              <MessageList messages={messages} loading={loading} />
            </div>
            <div className="py-4">
              <MessageInput onSend={handleSendMessage} />
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">اختر محادثة للبدء</p>
          </div>
        )}
      </div>
    </div>
  );
}
```

### الخطوة 2: تحويل صفحة التحليلات

#### 2.1 تحديث المكونات التابعة

قبل تحويل الصفحة الرئيسية، قد تحتاج إلى تحديث بعض المكونات التابعة للتوافق مع النمط الجديد:

```tsx
// src/domains/analytics/components/charts/LineChartPlaceholder.tsx
import { FC } from 'react';
import { Line } from 'react-chartjs-2';
import { ChartData } from '@/types';

interface LineChartPlaceholderProps {
  data: ChartData;
  title: string;
  loading?: boolean;
}

export const LineChartPlaceholder: FC<LineChartPlaceholderProps> = ({ 
  data, 
  title, 
  loading = false 
}) => {
  // تنفيذ المكون...
};
```

#### 2.2 تحويل الصفحة الرئيسية

```tsx
// src/domains/analytics/pages/AnalyticsPage.tsx (بعد التحويل)
"use client";

import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { 
  fetchAnalyticsSummary, 
  fetchOrdersData, 
  fetchAgentsData, 
  fetchRevenueData, 
  setFilter 
} from "../store/analyticsSlice";
import { AnalyticsFilter } from "@/types";
import { LineChartPlaceholder } from "../components/charts/LineChartPlaceholder";
import { BarChartPlaceholder } from "../components/charts/BarChartPlaceholder";
import { PieChartPlaceholder } from "../components/charts/PieChartPlaceholder";
import { FilterTabs } from "@/shared/components/filters/FilterTabs";
import { Card, CardContent } from "@/shared/components/ui/card";

export default function AnalyticsPage() {
  const dispatch = useAppDispatch();
  const { 
    summary, 
    ordersData, 
    agentsData, 
    revenueData, 
    currentFilter,
    loading 
  } = useAppSelector(state => state.analytics);

  useEffect(() => {
    dispatch(fetchAnalyticsSummary());
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchOrdersData(currentFilter));
    dispatch(fetchAgentsData(currentFilter));
    dispatch(fetchRevenueData(currentFilter));
  }, [dispatch, currentFilter]);

  const handleFilterChange = (filter: AnalyticsFilter) => {
    dispatch(setFilter(filter));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">لوحة التحليلات</h1>
        <FilterTabs 
          currentFilter={currentFilter.period}
          onFilterChange={(period) => handleFilterChange({ ...currentFilter, period })}
        />
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <h3 className="font-medium text-sm text-gray-500">إجمالي الطلبات</h3>
            <p className="text-2xl font-bold">{summary.totalOrders}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <h3 className="font-medium text-sm text-gray-500">إجمالي الإيرادات</h3>
            <p className="text-2xl font-bold">{summary.totalRevenue} ر.س</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <h3 className="font-medium text-sm text-gray-500">عدد المندوبين</h3>
            <p className="text-2xl font-bold">{summary.totalAgents}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <h3 className="font-medium text-sm text-gray-500">عدد العملاء</h3>
            <p className="text-2xl font-bold">{summary.totalCustomers}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-4">
            <h2 className="font-bold mb-4">بيانات الطلبات</h2>
            <LineChartPlaceholder 
              data={ordersData} 
              title="تغير الطلبات" 
              loading={loading} 
            />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <h2 className="font-bold mb-4">بيانات الإيرادات</h2>
            <LineChartPlaceholder 
              data={revenueData} 
              title="تغير الإيرادات" 
              loading={loading} 
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-4">
            <h2 className="font-bold mb-4">توزيع أداء المندوبين</h2>
            <BarChartPlaceholder 
              data={agentsData} 
              title="أداء المندوبين" 
              loading={loading} 
            />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <h2 className="font-bold mb-4">توزيع أنواع الطلبات</h2>
            <PieChartPlaceholder 
              data={{
                labels: ['مكتمل', 'قيد التنفيذ', 'ملغي', 'معلق'],
                datasets: [{
                  data: [40, 30, 20, 10],
                  backgroundColor: ['#4CAF50', '#2196F3', '#F44336', '#FFC107'],
                }]
              }}
              title="حالات الطلبات" 
              loading={loading} 
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

### الخطوة 3: تطبيق المنهجية على باقي الصفحات

تطبيق نفس منهجية التحويل على صفحات الدعم والإعدادات، مع مراعاة الخصائص المحددة لكل نطاق.

## إرشادات إضافية للتحويل

### 1. تحويل تدريجي

تحويل الصفحات بشكل تدريجي يساعد في تقليل مخاطر الأخطاء:

1. استكمال تطوير شريحة Redux وتسجيلها في المتجر
2. اختبار الشريحة من خلال Redux DevTools
3. تحويل استخدام البيانات في الصفحة للاستفادة من حالة Redux
4. تحويل جلب البيانات لاستخدام أفعال Redux
5. إزالة الحالة المحلية تدريجياً
6. اختبار الصفحة بعد كل تغيير

### 2. اختبار التحويل

بعد تحويل كل صفحة، يجب التحقق من:

1. **الوظائف الأساسية**: التأكد من أن جميع وظائف الصفحة تعمل كما هو متوقع
2. **الأداء**: التأكد من أن أداء الصفحة لم يتأثر سلباً
3. **معالجة الأخطاء**: التأكد من أن معالجة الأخطاء تعمل بشكل صحيح
4. **تتبع الحالة**: التأكد من أن تغييرات الحالة تظهر بشكل صحيح في Redux DevTools

### 3. تحسينات إضافية

بعد اكتمال التحويل الأساسي، يمكن تطبيق تحسينات إضافية:

1. **استخدام Selectors**: إنشاء دوال محددة لاختيار البيانات من الحالة
2. **تحسين الأداء**: استخدام React.memo و useMemo لتجنب عمليات إعادة العرض غير الضرورية
3. **تبسيط حالة Redux**: تجنب تكرار البيانات وتبسيط هيكل الحالة
4. **توحيد معالجة الأخطاء**: تطبيق منهجية موحدة لمعالجة أخطاء Redux

## التحديات المحتملة وحلولها

### 1. تكامل الحالة المحلية مع Redux

**التحدي**: بعض المكونات قد تحتاج إلى الاحتفاظ بحالة محلية مع استخدام Redux.

**الحل**: الاحتفاظ بالحالة المؤقتة أو المحلية فقط (مثل حالة الإدخال) في الحالة المحلية، ونقل الحالة المشتركة إلى Redux.

### 2. تداخل بين النطاقات

**التحدي**: بعض النطاقات قد تحتاج إلى الوصول لبيانات من نطاقات أخرى.

**الحل**: استخدام Selectors مركبة أو إعادة التفكير في تقسيم النطاقات.

### 3. معالجة البيانات المتزامنة

**التحدي**: الحاجة إلى تحديث حالة Redux بشكل متزامن من مصادر متعددة.

**الحل**: استخدام middleware خاص أو createAsyncThunk المتسلسل.

## خاتمة

تطوير شرائح Redux للنطاقات المتبقية وتحويل الصفحات لاستخدامها يعد خطوة أساسية لاستكمال عملية إعادة هيكلة المشروع. من خلال اتباع المنهجية والخطوات المذكورة في هذا الدليل، يمكن تحقيق توحيد كامل لإدارة الحالة في المشروع، مما يسهم في تحسين قابلية الصيانة وتبسيط تطوير الميزات الجديدة.

توحيد استخدام Redux عبر جميع النطاقات سيوفر قاعدة متينة للانتقال إلى المراحل التالية من تطوير لوحة التحكم المتكاملة لإدارة تطبيقي العميل ومندوب التوصيل.