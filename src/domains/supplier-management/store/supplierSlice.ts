import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { supplierService } from '../services/supplierService';
import * as priceOfferService from '../services/priceOfferService';
import { Supplier, SupplierPriceOffer, SupplierContactPerson, SupplierDocument } from '../types';

// تعريف حالة الموردين
interface SupplierState {
  suppliers: Supplier[];
  currentSupplier: Supplier | null;
  priceOffers: SupplierPriceOffer[];
  currentOffer: SupplierPriceOffer | null;
  contactPersons: SupplierContactPerson[];
  currentContactPerson: SupplierContactPerson | null;
  loading: boolean;
  error: string | null;
}

// الحالة المبدئية للموردين
const initialState: SupplierState = {
  suppliers: [],
  currentSupplier: null,
  priceOffers: [],
  currentOffer: null,
  contactPersons: [],
  currentContactPerson: null,
  loading: false,
  error: null,
};

// thunks للعمليات غير المتزامنة

// جلب جميع الموردين
export const fetchSuppliers = createAsyncThunk(
  'supplier/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const suppliers = await supplierService.getAll();
      return suppliers;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

// جلب مورد بواسطة المعرف
export const fetchSupplierById = createAsyncThunk(
  'supplier/fetchById',
  async (id: number, { rejectWithValue }) => {
    try {
      const supplier = await supplierService.getById(id);
      if (!supplier) {
        return rejectWithValue('المورد غير موجود');
      }
      return supplier;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

// إضافة مورد جديد
export const addSupplier = createAsyncThunk(
  'supplier/add',
  async (supplier: Omit<Supplier, 'id' | 'created_at' | 'updated_at' | 'approved_by' | 'approved_at'>, { rejectWithValue }) => {
    try {
      const newSupplier = await supplierService.add(supplier);
      if (!newSupplier) {
        return rejectWithValue('فشل في إضافة المورد');
      }
      return newSupplier;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

// تحديث مورد موجود
export const updateSupplier = createAsyncThunk(
  'supplier/update',
  async ({ id, supplier }: { id: number; supplier: Partial<Omit<Supplier, 'id' | 'created_at' | 'updated_at' | 'approved_by' | 'approved_at'>> }, { rejectWithValue }) => {
    try {
      const updatedSupplier = await supplierService.update(id, supplier);
      if (!updatedSupplier) {
        return rejectWithValue('فشل في تحديث المورد');
      }
      return updatedSupplier;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

// حذف مورد
export const deleteSupplier = createAsyncThunk(
  'supplier/delete',
  async (id: number, { rejectWithValue }) => {
    try {
      const success = await supplierService.delete(id);
      if (!success) {
        return rejectWithValue('فشل في حذف المورد');
      }
      return id;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

// ===== عروض الأسعار =====

// جلب جميع عروض الأسعار
export const fetchPriceOffers = createAsyncThunk(
  'supplier/fetchOffers',
  async (filters: { supplierId?: string; status?: SupplierPriceOffer['status']; productId?: string; categoryId?: string; validOnly?: boolean; } = {}, { rejectWithValue }) => {
    try {
      const offers = await supplierService.getAllOffers(filters);
      return offers;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

// جلب عرض سعر بواسطة المعرف
export const fetchOfferById = createAsyncThunk(
  'supplier/fetchOfferById',
  async (id: string, { rejectWithValue }) => {
    try {
      const offer = await supplierService.getOfferById(id);
      if (!offer) {
        return rejectWithValue('عرض السعر غير موجود');
      }
      return offer;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

// إضافة عرض سعر جديد
export const addPriceOffer = createAsyncThunk(
  'supplier/addOffer',
  async (offer: Omit<SupplierPriceOffer, 'id'>, { rejectWithValue }) => {
    try {
      const newOffer = await priceOfferService.createPriceOffer(offer);
      if (!newOffer) {
        return rejectWithValue('فشل في إضافة عرض السعر');
      }
      return newOffer;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

// تحديث عرض سعر موجود
export const updatePriceOffer = createAsyncThunk(
  'supplier/updateOffer',
  async ({ id, status }: { id: string, status: SupplierPriceOffer['status'] }, { rejectWithValue }) => {
    try {
      const updatedOffer = await priceOfferService.updatePriceOfferStatus(id, status);
      return updatedOffer;
    } catch (error) {
      return rejectWithValue('فشل في تحديث حالة العرض');
    }
  }
);

// تغيير حالة عرض سعر
export const changeOfferStatus = createAsyncThunk(
  'supplier/changeOfferStatus',
  async ({ 
    id, 
    status, 
    notes 
  }: { 
    id: string; 
    status: SupplierPriceOffer['status']; 
    notes?: string 
  }, { rejectWithValue }) => {
    try {
      const updatedOffer = await supplierService.changeOfferStatus(id, status, notes);
      if (!updatedOffer) {
        return rejectWithValue('فشل في تغيير حالة عرض السعر');
      }
      return updatedOffer;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

// حذف عرض سعر
export const deletePriceOffer = createAsyncThunk(
  'supplier/deleteOffer',
  async (id: string, { rejectWithValue }) => {
    try {
      await priceOfferService.deletePriceOffer(id);
      return id;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

// ===== المستندات =====

// إضافة مستند جديد لمورد
export const addSupplierDocument = createAsyncThunk(
  'supplier/addDocument',
  async ({ supplierId, document }: { supplierId: string | undefined; document: SupplierDocument }, { rejectWithValue }) => {
    try {
      if (!supplierId) {
        return rejectWithValue('معرف المورد غير متوفر لإضافة المستند.');
      }
      const newDocument = await supplierService.addDocument(supplierId, document);
      if (!newDocument) {
        return rejectWithValue('فشل في إضافة المستند');
      }
      return newDocument;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

// تحديث حالة مستند مورد
export const updateSupplierDocumentStatus = createAsyncThunk(
  'supplier/updateDocumentStatus',
  async (
    { documentId, newStatus }: { documentId: string; newStatus: SupplierDocument['status'] },
    { rejectWithValue, dispatch }
  ) => {
    try {
      const updatedDocument = await supplierService.updateDocumentStatus(documentId, newStatus);
      if (!updatedDocument) {
        return rejectWithValue('فشل في تحديث حالة المستند.');
      }
      // Optionally, refetch suppliers to ensure UI consistency if needed
      dispatch(fetchSuppliers());
      return updatedDocument;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

// ===== جهات اتصال الموردين =====

// جلب جميع جهات الاتصال لمورد معين
export const fetchContactPersonsBySupplierId = createAsyncThunk(
  'supplier/fetchContactPersonsBySupplierId',
  async (supplierId: number, { rejectWithValue }) => {
    try {
      const contactPersons = await supplierService.getAllContactPersons(supplierId);
      return contactPersons;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

// جلب جهة اتصال بواسطة المعرف
export const fetchContactPersonById = createAsyncThunk(
  'supplier/fetchContactPersonById',
  async (id: number, { rejectWithValue }) => {
    try {
      const contactPerson = await supplierService.getContactPersonById(id);
      if (!contactPerson) {
        return rejectWithValue('جهة الاتصال غير موجودة');
      }
      return contactPerson;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

// إضافة جهة اتصال جديدة
export const addContactPerson = createAsyncThunk(
  'supplier/addContactPerson',
  async (contactPerson: Omit<SupplierContactPerson, 'id' | 'created_at' | 'updated_at'>, { rejectWithValue }) => {
    try {
      const newContactPerson = await supplierService.addContactPerson(contactPerson);
      if (!newContactPerson) {
        return rejectWithValue('فشل في إضافة جهة الاتصال');
      }
      return newContactPerson;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

// تحديث جهة اتصال موجودة
export const updateContactPerson = createAsyncThunk(
  'supplier/updateContactPerson',
  async ({ id, contactPerson }: { id: number; contactPerson: Partial<SupplierContactPerson> }, { rejectWithValue }) => {
    try {
      const updatedContactPerson = await supplierService.updateContactPerson(id, contactPerson);
      if (!updatedContactPerson) {
        return rejectWithValue('فشل في تحديث جهة الاتصال');
      }
      return updatedContactPerson;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

// حذف جهة اتصال
export const deleteContactPerson = createAsyncThunk(
  'supplier/deleteContactPerson',
  async (id: number, { rejectWithValue }) => {
    try {
      const success = await supplierService.deleteContactPerson(id);
      if (!success) {
        return rejectWithValue('فشل في حذف جهة الاتصال');
      }
      return id;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

// شريحة Redux للموردين
const supplierSlice = createSlice({
  name: 'supplier',
  initialState,
  reducers: {
    clearCurrentSupplier: (state) => {
      state.currentSupplier = null;
    },
    clearCurrentOffer: (state) => {
      state.currentOffer = null;
    },
    clearSupplierError: (state) => {
      state.error = null;
    },
    clearCurrentContactPerson: (state) => {
      state.currentContactPerson = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // الموردين
      .addCase(fetchSuppliers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSuppliers.fulfilled, (state, action) => {
        state.loading = false;
        state.suppliers = action.payload;
      })
      .addCase(fetchSuppliers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // مورد محدد
      .addCase(fetchSupplierById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSupplierById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentSupplier = action.payload;
      })
      .addCase(fetchSupplierById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // إضافة مورد
      .addCase(addSupplier.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addSupplier.fulfilled, (state, action) => {
        state.loading = false;
        state.suppliers.push(action.payload);
      })
      .addCase(addSupplier.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // تحديث مورد
      .addCase(updateSupplier.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateSupplier.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.suppliers.findIndex(s => s.id === action.payload.id);
        if (index !== -1) {
          state.suppliers[index] = action.payload;
        }
        if (state.currentSupplier?.id === action.payload.id) {
          state.currentSupplier = action.payload;
        }
      })
      .addCase(updateSupplier.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // حذف مورد
      .addCase(deleteSupplier.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteSupplier.fulfilled, (state, action: PayloadAction<number>) => {
        state.loading = false;
        state.suppliers = state.suppliers.filter(s => +s.id !== action.payload);
        state.error = null;
        if (state.currentSupplier?.id === action.payload) {
          state.currentSupplier = null;
        }
      })
      .addCase(deleteSupplier.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // عروض الأسعار
      .addCase(fetchPriceOffers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPriceOffers.fulfilled, (state, action) => {
        state.loading = false;
        state.priceOffers = action.payload;
      })
      .addCase(fetchPriceOffers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // عرض سعر محدد
      .addCase(fetchOfferById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOfferById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentOffer = action.payload;
      })
      .addCase(fetchOfferById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // إضافة عرض سعر
      .addCase(addPriceOffer.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addPriceOffer.fulfilled, (state, action) => {
        state.loading = false;
        state.priceOffers.push(action.payload);
      })
      .addCase(addPriceOffer.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // تحديث عرض سعر
      .addCase(updatePriceOffer.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updatePriceOffer.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.priceOffers.findIndex(o => o.id === action.payload?.id);
        if (index !== -1 && action.payload) {
          state.priceOffers[index] = action.payload;
        }
        if (state.currentOffer?.id === action.payload?.id) {
          state.currentOffer = action.payload;
        }
      })
      .addCase(updatePriceOffer.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // تغيير حالة عرض سعر
      .addCase(changeOfferStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(changeOfferStatus.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.priceOffers.findIndex(o => o.id === action.payload?.id);
        if (index !== -1 && action.payload) {
          state.priceOffers[index] = action.payload;
        }
        if (state.currentOffer?.id === action.payload?.id) {
          state.currentOffer = action.payload;
        }
      })
      .addCase(changeOfferStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // حذف عرض سعر
      .addCase(deletePriceOffer.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deletePriceOffer.fulfilled, (state, action: PayloadAction<string>) => {
        state.loading = false;
        state.priceOffers = state.priceOffers.filter(o => o.id !== action.payload);
        if (state.currentOffer?.id === action.payload) {
          state.currentOffer = null;
        }
      })
      .addCase(deletePriceOffer.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // جهات اتصال الموردين
      .addCase(fetchContactPersonsBySupplierId.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchContactPersonsBySupplierId.fulfilled, (state, action) => {
        state.loading = false;
        state.contactPersons = action.payload;
      })
      .addCase(fetchContactPersonsBySupplierId.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(fetchContactPersonById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchContactPersonById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentContactPerson = action.payload;
      })
      .addCase(fetchContactPersonById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(addContactPerson.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addContactPerson.fulfilled, (state, action) => {
        state.loading = false;
        state.contactPersons.push(action.payload);
        state.error = null;
      })
      .addCase(addContactPerson.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(updateContactPerson.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateContactPerson.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.contactPersons.findIndex(cp => cp.id === action.payload?.id);
        if (index !== -1 && action.payload) {
          state.contactPersons[index] = action.payload;
        }
        if (state.currentContactPerson?.id === action.payload?.id) {
          state.currentContactPerson = action.payload;
        }
      })
      .addCase(updateContactPerson.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(deleteContactPerson.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteContactPerson.fulfilled, (state, action: PayloadAction<number>) => {
        state.loading = false;
        state.contactPersons = state.contactPersons.filter(cp => cp.id !== action.payload);
        if (state.currentContactPerson?.id === action.payload) {
          state.currentContactPerson = null;
        }
      })
      .addCase(deleteContactPerson.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // حالات إضافة المستندات
      .addCase(addSupplierDocument.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addSupplierDocument.fulfilled, (state, action: PayloadAction<SupplierDocument>) => {
        if (state.currentSupplier) {
          state.currentSupplier.documents = state.currentSupplier.documents 
            ? [...state.currentSupplier.documents, action.payload] 
            : [action.payload];
        }
        state.loading = false;
      })
      .addCase(addSupplierDocument.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearCurrentSupplier, clearCurrentOffer, clearSupplierError, clearCurrentContactPerson } = supplierSlice.actions;

export default supplierSlice.reducer; 