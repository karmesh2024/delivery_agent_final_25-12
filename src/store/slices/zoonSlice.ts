import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";

// Types
export interface Message {
    id: string;
    role: "user" | "assistant" | "system";
    content: string;
}

export interface PendingAction {
    id: string;
    toolName: string;
    args: any;
    description: string;
}

export interface ZoonState {
    messages: Message[];
    isLoading: boolean;
    pendingAction: PendingAction | null;
    error: string | null;
}

const initialState: ZoonState = {
    messages: [],
    isLoading: false,
    pendingAction: null,
    error: null,
};

// Slice
export const zoonSlice = createSlice({
    name: "zoon",
    initialState,
    reducers: {
        addMessage: (state, action: PayloadAction<Message>) => {
            state.messages.push(action.payload);
        },
        setLoading: (state, action: PayloadAction<boolean>) => {
            state.isLoading = action.payload;
        },
        setPendingAction: (state, action: PayloadAction<PendingAction | null>) => {
            state.pendingAction = action.payload;
        },
        setError: (state, action: PayloadAction<string | null>) => {
            state.error = action.payload;
        },
        clearChat: (state) => {
            state.messages = [];
            state.pendingAction = null;
        }
    },
});

export const { addMessage, setLoading, setPendingAction, setError, clearChat } = zoonSlice.actions;

export default zoonSlice.reducer;
