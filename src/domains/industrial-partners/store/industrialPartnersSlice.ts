import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
    CreateOrderDTO,
    CreatePartnerDTO,
    IndustrialPartner,
    PartnerOrder,
} from "../types";
import { industrialPartnersService } from "../services/industrialPartnersService";

interface IndustrialPartnersState {
    partners: IndustrialPartner[];
    orders: PartnerOrder[];
    loading: boolean;
    error: string | null;
}

const initialState: IndustrialPartnersState = {
    partners: [],
    orders: [],
    loading: false,
    error: null,
};

// Async Thunks
export const fetchPartners = createAsyncThunk(
    "industrialPartners/fetchPartners",
    async () => {
        return await industrialPartnersService.getPartners();
    },
);

export const createPartner = createAsyncThunk(
    "industrialPartners/createPartner",
    async (partner: CreatePartnerDTO) => {
        return await industrialPartnersService.createPartner(partner);
    },
);

export const fetchOrders = createAsyncThunk(
    "industrialPartners/fetchOrders",
    async () => {
        return await industrialPartnersService.getOrders();
    },
);

export const createOrder = createAsyncThunk(
    "industrialPartners/createOrder",
    async (order: CreateOrderDTO) => {
        return await industrialPartnersService.createOrder(order);
    },
);

export const updateOrderStatus = createAsyncThunk(
    "industrialPartners/updateOrderStatus",
    async ({ id, status }: { id: string; status: string }) => {
        return await industrialPartnersService.updateOrderStatus(id, status);
    },
);

// Slice
const industrialPartnersSlice = createSlice({
    name: "industrialPartners",
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        // Fetch Partners
        builder.addCase(fetchPartners.pending, (state) => {
            state.loading = true;
            state.error = null;
        });
        builder.addCase(fetchPartners.fulfilled, (state, action) => {
            state.loading = false;
            state.partners = action.payload;
        });
        builder.addCase(fetchPartners.rejected, (state, action) => {
            state.loading = false;
            state.error = action.error.message || "Failed to fetch partners";
        });

        // Create Partner
        builder.addCase(createPartner.fulfilled, (state, action) => {
            state.partners.unshift(action.payload);
        });

        // Fetch Orders
        builder.addCase(fetchOrders.pending, (state) => {
            state.loading = true;
        });
        builder.addCase(fetchOrders.fulfilled, (state, action) => {
            state.loading = false;
            state.orders = action.payload;
        });

        // Create Order
        builder.addCase(createOrder.fulfilled, (state, action) => {
            state.orders.unshift(action.payload);
        });

        // Update Order Status
        builder.addCase(updateOrderStatus.fulfilled, (state, action) => {
            const index = state.orders.findIndex((o) =>
                o.id === action.payload.id
            );
            if (index !== -1) {
                state.orders[index] = {
                    ...state.orders[index],
                    ...action.payload,
                };
            }
        });
    },
});

export default industrialPartnersSlice.reducer;
