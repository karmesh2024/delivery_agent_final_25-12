import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { zoonClubService, ZoonRoom, ZoonQuestion, ZoonPost, BazzzzType, PostStatus, ZoonCircle } from '../services/zoonClubService';

interface ZoonClubState {
  rooms: ZoonRoom[];
  questions: ZoonQuestion[];
  posts: ZoonPost[];
  bazzzzTypes: BazzzzType[];
  circles: ZoonCircle[];
  comments: Record<string, any[]>; // postId -> comments
  loading: boolean;
  error: string | null;
}

const initialState: ZoonClubState = {
  rooms: [],
  questions: [],
  posts: [],
  bazzzzTypes: [],
  circles: [],
  comments: {},
  loading: false,
  error: null,
};

export const fetchZoonRooms = createAsyncThunk(
  'zoonClub/fetchRooms',
  async () => {
    return await zoonClubService.getRooms();
  }
);

export const createZoonRoom = createAsyncThunk(
  'zoonClub/createRoom',
  async (roomData: Partial<ZoonRoom>) => {
    return await zoonClubService.createRoom(roomData);
  }
);

export const fetchZoonQuestions = createAsyncThunk(
  'zoonClub/fetchQuestions',
  async (roomId?: string) => {
    return await zoonClubService.getQuestions(roomId);
  }
);

export const toggleRoomStatus = createAsyncThunk(
  'zoonClub/toggleRoomStatus',
  async ({ id, isActive }: { id: string; isActive: boolean }) => {
    return await zoonClubService.updateRoom(id, { is_active: isActive });
  }
);

export const updateZoonRoom = createAsyncThunk(
  'zoonClub/updateRoom',
  async ({ id, updates }: { id: string; updates: Partial<ZoonRoom> }) => {
    return await zoonClubService.updateRoom(id, updates);
  }
);

export const createZoonQuestion = createAsyncThunk(
  'zoonClub/createQuestion',
  async (questionData: Partial<ZoonQuestion>) => {
    return await zoonClubService.createQuestion(questionData);
  }
);

export const updateZoonQuestion = createAsyncThunk(
  'zoonClub/updateQuestion',
  async ({ id, updates }: { id: string; updates: Partial<ZoonQuestion> }) => {
    return await zoonClubService.updateQuestion(id, updates);
  }
);

export const deleteZoonQuestion = createAsyncThunk(
  'zoonClub/deleteQuestion',
  async (id: string) => {
    await zoonClubService.deleteQuestion(id);
    return id;
  }
);

export const fetchZoonPosts = createAsyncThunk(
  'zoonClub/fetchPosts',
  async (roomId?: string) => {
    return await zoonClubService.getPosts(roomId);
  }
);

export const createZoonPost = createAsyncThunk(
  'zoonClub/createPost',
  async (postData: Partial<ZoonPost>) => {
    return await zoonClubService.createPost(postData);
  }
);

export const deleteZoonPost = createAsyncThunk(
  'zoonClub/deletePost',
  async (id: string) => {
    await zoonClubService.deletePost(id);
    return id;
  }
);

export const updatePostStatus = createAsyncThunk(
  'zoonClub/updatePostStatus',
  async ({ id, status, rejectionNote }: { id: string; status: PostStatus; rejectionNote?: string }) => {
    return await zoonClubService.updatePostStatus(id, status, rejectionNote);
  }
);

export const fetchBazzzzTypes = createAsyncThunk(
  'zoonClub/fetchBazzzzTypes',
  async () => {
    return await zoonClubService.getBazzzzTypes();
  }
);

export const createBazzzzType = createAsyncThunk(
  'zoonClub/createBazzzzType',
  async (bazzzzData: Partial<BazzzzType>) => {
    return await zoonClubService.createBazzzzType(bazzzzData);
  }
);

export const updateBazzzzType = createAsyncThunk(
  'zoonClub/updateBazzzzType',
  async ({ id, updates }: { id: string; updates: Partial<BazzzzType> }) => {
    return await zoonClubService.updateBazzzzType(id, updates);
  }
);

export const deleteBazzzzType = createAsyncThunk(
  'zoonClub/deleteBazzzzType',
  async (id: string) => {
    await zoonClubService.deleteBazzzzType(id);
    return id;
  }
);

export const fetchCircles = createAsyncThunk(
  'zoonClub/fetchCircles',
  async (roomId?: string) => {
    return await zoonClubService.getCircles(roomId);
  }
);

export const updateCircleWeights = createAsyncThunk(
  'zoonClub/updateCircleWeights',
  async ({ id, weights }: { id: string; weights: any }) => {
    return await zoonClubService.updateCircleWeights(id, weights);
  }
);

export const joinCircleAction = createAsyncThunk(
  'zoonClub/joinCircle',
  async ({ circleId, userId }: { circleId: string; userId: string }) => {
    return await zoonClubService.joinCircle(circleId, userId);
  }
);

export const fetchJoinedCircles = createAsyncThunk(
  'zoonClub/fetchJoinedCircles',
  async (userId: string) => {
    return await zoonClubService.getJoinedCircles(userId);
  }
);

export const addPostCommentAction = createAsyncThunk(
  'zoonClub/addComment',
  async (commentData: any, { rejectWithValue }) => {
    try {
      return await zoonClubService.addPostComment(commentData);
    } catch (err: any) {
      console.error('Redux Thunk AddComment Error:', err);
      // Return a serializable error object or string
      return rejectWithValue(err.message || err.error_description || JSON.stringify(err) || 'Unknown error');
    }
  }
);

export const fetchPostComments = createAsyncThunk(
  'zoonClub/fetchComments',
  async (postId: string) => {
    const comments = await zoonClubService.getPostComments(postId);
    return { postId, comments };
  }
);

export const interactWithPost = createAsyncThunk(
  'zoonClub/interact',
  async ({ postId, userId, typeId }: { postId: string; userId: string; typeId: string }) => {
    return await zoonClubService.addPostInteraction(postId, userId, typeId);
  }
);

const zoonClubSlice = createSlice({
  name: 'zoonClub',
  initialState,
  reducers: {
    clearZoonError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchZoonRooms.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchZoonRooms.fulfilled, (state, action: PayloadAction<ZoonRoom[]>) => {
        state.loading = false;
        state.rooms = action.payload;
      })
      .addCase(fetchZoonRooms.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch rooms';
      })
      .addCase(fetchZoonQuestions.fulfilled, (state, action: PayloadAction<any>) => {
        state.questions = action.payload;
      })
      .addCase(toggleRoomStatus.fulfilled, (state, action: PayloadAction<ZoonRoom>) => {
        const index = state.rooms.findIndex(r => r.id === action.payload.id);
        if (index !== -1) {
          state.rooms[index] = action.payload;
        }
      })
      .addCase(createZoonRoom.fulfilled, (state, action: PayloadAction<ZoonRoom>) => {
        state.rooms.push(action.payload);
      })
      .addCase(updateZoonRoom.fulfilled, (state, action: PayloadAction<ZoonRoom>) => {
        const index = state.rooms.findIndex(r => r.id === action.payload.id);
        if (index !== -1) {
          state.rooms[index] = action.payload;
        }
      })
      .addCase(createZoonQuestion.fulfilled, (state, action: PayloadAction<ZoonQuestion>) => {
        state.questions.unshift(action.payload as any);
      })
      .addCase(updateZoonQuestion.fulfilled, (state, action: PayloadAction<ZoonQuestion>) => {
        const index = state.questions.findIndex(q => q.id === action.payload.id);
        if (index !== -1) {
          state.questions[index] = action.payload as any;
        }
      })
      .addCase(deleteZoonQuestion.fulfilled, (state, action: PayloadAction<string>) => {
        state.questions = state.questions.filter(q => q.id !== action.payload);
      })
      .addCase(fetchZoonPosts.fulfilled, (state, action: PayloadAction<ZoonPost[]>) => {
        state.posts = action.payload;
        state.loading = false;
      })
      .addCase(createZoonPost.fulfilled, (state, action: PayloadAction<ZoonPost>) => {
        state.posts.unshift(action.payload);
      })
      .addCase(deleteZoonPost.fulfilled, (state, action: PayloadAction<string>) => {
        state.posts = state.posts.filter(p => p.id !== action.payload);
      })
      .addCase(updatePostStatus.fulfilled, (state, action: PayloadAction<ZoonPost>) => {
        const index = state.posts.findIndex(p => p.id === action.payload.id);
        if (index !== -1) {
          state.posts[index] = action.payload;
        }
      })
      .addCase(fetchBazzzzTypes.fulfilled, (state, action: PayloadAction<BazzzzType[]>) => {
        state.bazzzzTypes = action.payload;
      })
      .addCase(createBazzzzType.fulfilled, (state, action: PayloadAction<BazzzzType>) => {
        state.bazzzzTypes.push(action.payload);
      })
      .addCase(updateBazzzzType.fulfilled, (state, action: PayloadAction<BazzzzType>) => {
        const index = state.bazzzzTypes.findIndex(b => b.id === action.payload.id);
        if (index !== -1) {
          state.bazzzzTypes[index] = action.payload;
        }
      })
      .addCase(deleteBazzzzType.fulfilled, (state, action: PayloadAction<string>) => {
        state.bazzzzTypes = state.bazzzzTypes.filter(b => b.id !== action.payload);
      })
      .addCase(fetchCircles.fulfilled, (state, action: PayloadAction<ZoonCircle[]>) => {
        state.circles = action.payload;
      })
      .addCase(updateCircleWeights.fulfilled, (state, action: PayloadAction<ZoonCircle>) => {
        const index = state.circles.findIndex(c => c.id === action.payload.id);
        if (index !== -1) {
          state.circles[index] = action.payload;
        }
      })
      .addCase(fetchPostComments.fulfilled, (state, action: any) => {
        const { postId, comments } = action.payload;
        state.comments[postId] = comments;
      })
      .addCase(addPostCommentAction.fulfilled, (state, action: any) => {
        const comment = action.payload;
        if (!state.comments[comment.post_id]) {
          state.comments[comment.post_id] = [];
        }
        state.comments[comment.post_id].push(comment);
      });
  },
});

export const { clearZoonError } = zoonClubSlice.actions;
export default zoonClubSlice.reducer;
