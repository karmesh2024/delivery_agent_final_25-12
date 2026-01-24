import { configureStore } from "@reduxjs/toolkit";
import provincesReducer from "./slices/provincesSlice";
import permissionsReducer from "./slices/permissionsSlice";
import permissionsManagementReducer from "../domains/admins/store/permissionsSlice"; // Reducer للأدوار والصلاحيات
import authReducer from "../domains/admins/store/authSlice";
import agentsReducer from "./agentsSlice";
import ordersReducer from "./ordersSlice";
import adminsReducer from "./adminsSlice";
import groupsReducer from "./groupsSlice";
import paymentsDashboardReducer from "../domains/payments/store/paymentsDashboardSlice";
import warehouseReducer from "../domains/warehouse-management/store/warehouseSlice";
import priceOfferReducer from "../domains/supplier-management/store/priceOfferSlice";
import hrReducer from "@/domains/hr/store/hrSlice";
import customersReducer from "@/domains/customers/store/customersSlice";
import unregisteredCustomersReducer from "@/domains/customers/store/unregisteredCustomersSlice";
import supplierReducer from "@/domains/supplier-management/store/supplierSlice";
import referenceDataReducer from "@/domains/supplier-management/store/referenceDataSlice";
import storesReducer from "@/domains/stores/store/storeSlice";
import alertReducer from "@/domains/financial-management/store/alertSlice";
import productReducer from "@/domains/products/store/productSlice";
import productCategoriesReducer from "@/domains/product-categories/store/productCategoriesSlice";
import exchangeReducer from "@/domains/waste-management/store/exchangeSlice";
import approvedAgentsReducer from "@/domains/approved-agents/store/approvedAgentsSlice";
import storeOrdersReducer from "@/domains/store-orders/store/storeOrdersSlice";
import purchasingReducer from "@/domains/purchasing/store/purchasingSlice";
import industrialPartnersReducer from "../domains/waste-management/partners/store/industrialPartnersSlice";
import pointsReducer from "@/domains/financial-management/points/store/pointsSlice";
import clubZoneReducer from "@/domains/club-zone/store/clubZoneSlice";

export const store = configureStore({
  reducer: {
    provinces: provincesReducer,
    permissions: permissionsReducer,
    permissionsManagement: permissionsManagementReducer, // إضافة reducer للأدوار والصلاحيات
    auth: authReducer,
    agents: agentsReducer,
    orders: ordersReducer,
    admins: adminsReducer,
    groups: groupsReducer,
    paymentsDashboard: paymentsDashboardReducer,
    warehouse: warehouseReducer,
    priceOffer: priceOfferReducer,
    hr: hrReducer,
    customers: customersReducer,
    unregisteredCustomers: unregisteredCustomersReducer,
    supplier: supplierReducer,
    referenceData: referenceDataReducer,
    stores: storesReducer,
    alert: alertReducer,
    products: productReducer,
    productCategories: productCategoriesReducer,
    exchange: exchangeReducer,
    approvedAgents: approvedAgentsReducer,
    storeOrders: storeOrdersReducer,
    purchasing: purchasingReducer,
    industrialPartners: industrialPartnersReducer,
    points: pointsReducer,
    clubZone: clubZoneReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["persist/PERSIST", "persist/REHYDRATE"],
        ignoredPaths: ["_persist"],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Export hooks for use in components
export { useAppDispatch, useAppSelector } from "./hooks";
