import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Message, Conversation, MessagesState, Agent } from '@/types';
import { messagesApi } from '../api/messagesApi';

// حالة البداية
const initialState: MessagesState = {
  conversations: [],
  messages: [],
  loading: false,
  searchTerm: '',
  messageInput: '',
  selectedConversation: null,
  agents: [],
  error: null
};

// Thunk لجلب المحادثات
export const fetchConversations = createAsyncThunk(
  'messages/fetchConversations',
  async (params: { participantId: string; participantType?: string }, { rejectWithValue }) => {
    try {
      return await messagesApi.getConversations(params.participantId, params.participantType);
    } catch (error) {
      return rejectWithValue('فشل في جلب المحادثات');
    }
  }
);

// Thunk لجلب رسائل محادثة محددة
export const fetchMessages = createAsyncThunk(
  'messages/fetchMessages',
  async (conversationId: string, { rejectWithValue }) => {
    try {
      return await messagesApi.getMessages(conversationId);
    } catch (error) {
      return rejectWithValue('فشل في جلب الرسائل');
    }
  }
);

// Thunk لإرسال رسالة جديدة
export const sendMessage = createAsyncThunk(
  'messages/sendMessage',
  async (messageData: { conversationId: string; senderId: string; content: string }, { rejectWithValue }) => {
    try {
      return await messagesApi.sendMessage(messageData);
    } catch (error) {
      return rejectWithValue('فشل في إرسال الرسالة');
    }
  }
);

// Thunk لتعليم الرسائل كمقروءة
export const markMessagesAsRead = createAsyncThunk(
  'messages/markAsRead',
  async ({ conversationId, participantId }: { conversationId: string; participantId: string }, { rejectWithValue }) => {
    try {
      const result = await messagesApi.markAsRead(conversationId, participantId);
      return { success: result.success, conversationId };
    } catch (error) {
      return rejectWithValue('فشل في تعليم الرسائل كمقروءة');
    }
  }
);

// إعادة تصدير لضمان التوافق مع الكود الحالي
export const markAsRead = markMessagesAsRead;

// Thunk لتعيين المندوبين
export const setAgents = createAsyncThunk(
  'messages/setAgents',
  async (agents: Agent[], { dispatch }) => {
    dispatch(messagesSlice.actions.setAgentsAction(agents));
    return agents;
  }
);

// شريحة الرسائل
const messagesSlice = createSlice({
  name: 'messages',
  initialState,
  reducers: {
    setSelectedConversation: (state, action: PayloadAction<string | null>) => {
      state.selectedConversation = action.payload;
    },
    setSearchTerm: (state, action: PayloadAction<string>) => {
      state.searchTerm = action.payload;
    },
    setMessageInput: (state, action: PayloadAction<string>) => {
      state.messageInput = action.payload;
    },
    setAgentsAction: (state, action: PayloadAction<Agent[]>) => {
      state.agents = action.payload;
    }
  },
  extraReducers: (builder) => {
    // معالجة جلب المحادثات
    builder
      .addCase(fetchConversations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchConversations.fulfilled, (state, action) => {
        state.loading = false;
        state.conversations = action.payload;
        state.error = null;
      })
      .addCase(fetchConversations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // معالجة جلب الرسائل
    builder
      .addCase(fetchMessages.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.loading = false;
        state.messages = action.payload;
        state.error = null;
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // معالجة إرسال رسالة
    builder
      .addCase(sendMessage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.loading = false;
        // إضافة الرسالة الجديدة للقائمة
        state.messages.push(action.payload);
        // تحديث آخر رسالة في المحادثة المختارة
        if (state.selectedConversation) {
          const conversationIndex = state.conversations.findIndex(c => c.id === state.selectedConversation);
          if (conversationIndex !== -1) {
            state.conversations[conversationIndex].lastMessage = action.payload.content;
            state.conversations[conversationIndex].timestamp = action.payload.timestamp;
          }
        }
        // تفريغ حقل الإدخال
        state.messageInput = '';
        state.error = null;
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // معالجة تعليم الرسائل كمقروءة
    builder
      .addCase(markMessagesAsRead.fulfilled, (state, action) => {
        if (action.payload.success) {
          // تحديث حالة المحادثة لعدم وجود رسائل غير مقروءة
          const conversationIndex = state.conversations.findIndex(c => c.id === action.payload.conversationId);
          if (conversationIndex !== -1) {
            state.conversations[conversationIndex].unread = false;
          }
          // تحديث حالة الرسائل كمقروءة
          state.messages.forEach(message => {
            if (message.conversationId === action.payload.conversationId) {
              message.isRead = true;
            }
          });
        }
      });
  }
});

// تصدير الإجراءات والمخفض
export const { setSelectedConversation, setSearchTerm, setMessageInput } = messagesSlice.actions;
export default messagesSlice.reducer;