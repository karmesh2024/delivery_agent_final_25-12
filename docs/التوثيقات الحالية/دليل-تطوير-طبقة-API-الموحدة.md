# دليل تطوير طبقة API الموحدة للمشروع

## المقدمة

تقدم هذه الوثيقة دليلاً تفصيلياً لتطوير طبقة API الموحدة في المشروع، وهي المهمة الثانية من المرحلة الأولى. تهدف هذه الطبقة إلى توحيد آليات التفاعل مع قاعدة البيانات وتبسيط تحويل البيانات بين التطبيق وقاعدة البيانات.

## الهدف من طبقة API الموحدة

1. **توحيد آليات الوصول للبيانات** في جميع النطاقات
2. **فصل منطق التفاعل مع قاعدة البيانات** عن منطق العرض والحالة
3. **تبسيط تحويل البيانات** بين قاعدة البيانات والتطبيق
4. **تسهيل اختبار التطبيق** من خلال محاكاة طبقة API
5. **تحسين الأداء** من خلال إدارة التخزين المؤقت (Caching)

## الهيكل المقترح لطبقة API

### 1. هيكل المجلدات والملفات

```
src/
├── domains/
│   ├── [domain-name]/
│   │   ├── api/
│   │   │   ├── [domain]Api.ts          # واجهة API للنطاق
│   │   │   └── index.ts                # تصدير الواجهة
│   │   ├── utils/
│   │   │   └── converters.ts           # محولات البيانات بين النماذج
│   │   ├── store/
│   │   │   └── [domain]Slice.ts        # شريحة Redux للنطاق
│   ├── ...
├── lib/
│   ├── supabase.ts                     # إعداد Supabase
│   ├── api/                            # أدوات API المشتركة
│   │   ├── errorHandling.ts            # معالجة أخطاء API
│   │   ├── caching.ts                  # إدارة التخزين المؤقت
│   │   └── index.ts                    # تصدير الأدوات المشتركة
```

### 2. أسلوب التنظيم والتسمية

- استخدام اسم النطاق في اسم واجهة API: `customersApi`, `agentsApi`, `ordersApi`
- استخدام دالات وصفية: `getAll`, `getById`, `create`, `update`, `delete`
- استخدام دالات متخصصة عند الحاجة: `getByStatus`, `getRecentOrders`, `assignOrderToAgent`

## تطوير واجهة API خطوة بخطوة

### الخطوة 1: إعداد بنية واجهة API

```typescript
// src/domains/customers/api/customersApi.ts
import { supabase } from '@/lib/supabase';
import { Customer, CustomerAddress, CustomerStatus } from '@/types';
import { ApiResponse, ApiError, handleApiError } from '@/lib/api';
import { CustomerConverter } from '../utils/converters';

export const customersApi = {
  // دالات API هنا
};

export default customersApi;
```

### الخطوة 2: تطوير دالات الجلب الأساسية

```typescript
// src/domains/customers/api/customersApi.ts
export const customersApi = {
  /**
   * جلب جميع العملاء مع إمكانية تصفيتهم
   * @param options خيارات التصفية والترتيب
   * @returns قائمة العملاء
   */
  getAll: async (options?: {
    status?: CustomerStatus;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<Customer[]>> => {
    try {
      let query = supabase
        .from('customers')
        .select('*, new_profiles(*)');
      
      // تطبيق التصفية
      if (options?.status) {
        query = query.eq('customer_status', options.status);
      }
      
      // تطبيق الترتيب
      if (options?.sortBy) {
        query = query.order(options.sortBy, { 
          ascending: options.sortOrder !== 'desc' 
        });
      } else {
        query = query.order('created_at', { ascending: false });
      }
      
      // تطبيق التقسيم
      if (options?.limit) {
        query = query.limit(options.limit);
      }
      
      if (options?.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      return {
        success: true,
        data: data?.map(customer => CustomerConverter.fromDB(customer)) || [],
      };
    } catch (error) {
      return handleApiError('Failed to fetch customers', error);
    }
  },

  /**
   * جلب عميل بواسطة المعرف
   * @param id معرف العميل
   * @returns بيانات العميل
   */
  getById: async (id: string): Promise<ApiResponse<Customer>> => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*, new_profiles(*)')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      return {
        success: true,
        data: CustomerConverter.fromDB(data),
      };
    } catch (error) {
      return handleApiError(`Failed to fetch customer with id ${id}`, error);
    }
  },
};
```

### الخطوة 3: تطوير دالات الإنشاء والتحديث

```typescript
// src/domains/customers/api/customersApi.ts
export const customersApi = {
  // ... الدالات السابقة

  /**
   * إنشاء عميل جديد
   * @param customer بيانات العميل الجديد
   * @returns العميل المنشأ
   */
  create: async (customer: Omit<Customer, 'id'>): Promise<ApiResponse<Customer>> => {
    try {
      const customerData = CustomerConverter.toDB(customer);
      
      const { data, error } = await supabase
        .from('customers')
        .insert(customerData)
        .select('*, new_profiles(*)')
        .single();
      
      if (error) throw error;
      
      return {
        success: true,
        data: CustomerConverter.fromDB(data),
      };
    } catch (error) {
      return handleApiError('Failed to create customer', error);
    }
  },

  /**
   * تحديث بيانات عميل موجود
   * @param id معرف العميل
   * @param customer البيانات المحدثة للعميل
   * @returns العميل المحدث
   */
  update: async (id: string, customer: Partial<Customer>): Promise<ApiResponse<Customer>> => {
    try {
      const customerData = CustomerConverter.toDB(customer);
      
      const { data, error } = await supabase
        .from('customers')
        .update(customerData)
        .eq('id', id)
        .select('*, new_profiles(*)')
        .single();
      
      if (error) throw error;
      
      return {
        success: true,
        data: CustomerConverter.fromDB(data),
      };
    } catch (error) {
      return handleApiError(`Failed to update customer with id ${id}`, error);
    }
  },

  /**
   * حذف عميل
   * @param id معرف العميل
   * @returns نجاح أو فشل العملية
   */
  delete: async (id: string): Promise<ApiResponse<void>> => {
    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      return {
        success: true,
      };
    } catch (error) {
      return handleApiError(`Failed to delete customer with id ${id}`, error);
    }
  },
};
```

### الخطوة 4: تطوير دالات متخصصة

```typescript
// src/domains/customers/api/customersApi.ts
export const customersApi = {
  // ... الدالات السابقة

  /**
   * جلب عملاء حسب الحالة
   * @param status حالة العملاء المطلوبة
   * @returns قائمة العملاء
   */
  getByStatus: async (status: CustomerStatus): Promise<ApiResponse<Customer[]>> => {
    return customersApi.getAll({ status });
  },

  /**
   * البحث عن عملاء بالاسم أو رقم الهاتف
   * @param query نص البحث
   * @returns قائمة العملاء المطابقين
   */
  search: async (query: string): Promise<ApiResponse<Customer[]>> => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*, new_profiles(*)')
        .or(`full_name.ilike.%${query}%,phone_number.ilike.%${query}%`);
      
      if (error) throw error;
      
      return {
        success: true,
        data: data?.map(customer => CustomerConverter.fromDB(customer)) || [],
      };
    } catch (error) {
      return handleApiError(`Failed to search customers with query "${query}"`, error);
    }
  },

  /**
   * جلب إحصائيات العملاء
   * @returns إحصائيات العملاء
   */
  getStatistics: async (): Promise<ApiResponse<{
    total: number;
    active: number;
    inactive: number;
  }>> => {
    try {
      // استخدام استعلام SQL مخصص لجلب إحصائيات العملاء
      const { data, error } = await supabase.rpc('get_customer_statistics');
      
      if (error) throw error;
      
      return {
        success: true,
        data: data || { total: 0, active: 0, inactive: 0 },
      };
    } catch (error) {
      return handleApiError('Failed to fetch customer statistics', error);
    }
  },
};
```

### الخطوة 5: تطوير محولات البيانات

```typescript
// src/domains/customers/utils/converters.ts
import { Customer, CustomerAddress } from '@/types';

/**
 * محول بيانات العملاء بين نموذج قاعدة البيانات ونموذج التطبيق
 */
export const CustomerConverter = {
  /**
   * تحويل من نموذج قاعدة البيانات إلى نموذج التطبيق
   * @param dbCustomer بيانات العميل من قاعدة البيانات
   * @returns نموذج العميل في التطبيق
   */
  fromDB: (dbCustomer: any): Customer => {
    const profile = dbCustomer.new_profiles?.[0] || {};
    
    return {
      id: dbCustomer.id,
      fullName: dbCustomer.full_name,
      email: dbCustomer.email,
      phoneNumber: dbCustomer.phone_number,
      customerType: dbCustomer.customer_type,
      status: dbCustomer.customer_status,
      walletId: dbCustomer.wallet_id,
      loyaltyPoints: dbCustomer.loyalty_points || 0,
      createdAt: dbCustomer.created_at,
      updatedAt: dbCustomer.updated_at,
      
      // معلومات من الملف الشخصي
      avatarUrl: profile.avatar_url,
      preferredLanguage: profile.preferred_language || 'ar',
      
      // باقي البيانات يتم إضافتها حسب الحاجة
    };
  },

  /**
   * تحويل من نموذج التطبيق إلى نموذج قاعدة البيانات
   * @param customer بيانات العميل في التطبيق
   * @returns نموذج العميل لقاعدة البيانات
   */
  toDB: (customer: Partial<Customer>): any => {
    const dbCustomer: any = {};
    
    // تحويل البيانات الأساسية
    if (customer.fullName !== undefined) dbCustomer.full_name = customer.fullName;
    if (customer.email !== undefined) dbCustomer.email = customer.email;
    if (customer.phoneNumber !== undefined) dbCustomer.phone_number = customer.phoneNumber;
    if (customer.customerType !== undefined) dbCustomer.customer_type = customer.customerType;
    if (customer.status !== undefined) dbCustomer.customer_status = customer.status;
    if (customer.loyaltyPoints !== undefined) dbCustomer.loyalty_points = customer.loyaltyPoints;
    
    return dbCustomer;
  },
};

/**
 * محول بيانات عناوين العملاء
 */
export const CustomerAddressConverter = {
  // تنفيذ مشابه...
};
```

### الخطوة 6: تطوير أدوات API المشتركة

```typescript
// src/lib/api/errorHandling.ts
import { ApiResponse, ApiError } from '@/types';

/**
 * معالجة أخطاء API ورجوع استجابة موحدة
 * @param message رسالة الخطأ
 * @param error كائن الخطأ
 * @returns استجابة API موحدة مع معلومات الخطأ
 */
export function handleApiError<T>(message: string, error: any): ApiResponse<T> {
  console.error(`API Error: ${message}`, error);
  
  // تعامل خاص مع أخطاء Supabase
  if (error?.code && error?.message) {
    return {
      success: false,
      error: {
        message: message,
        code: error.code,
        details: error.message,
      },
    };
  }
  
  // تعامل مع الأخطاء العامة
  return {
    success: false,
    error: {
      message: message,
      code: 'UNKNOWN_ERROR',
      details: error?.message || String(error),
    },
  };
}
```

```typescript
// src/lib/api/caching.ts
type CacheMap<T> = Map<string, { data: T; timestamp: number }>;

/**
 * مدير التخزين المؤقت البسيط للبيانات
 */
export class SimpleCache {
  private static caches: Record<string, CacheMap<any>> = {};
  private static DEFAULT_TTL = 5 * 60 * 1000; // 5 دقائق

  /**
   * الحصول على كاش لنوع معين من البيانات
   */
  private static getCache<T>(type: string): CacheMap<T> {
    if (!this.caches[type]) {
      this.caches[type] = new Map();
    }
    return this.caches[type] as CacheMap<T>;
  }

  /**
   * تخزين بيانات في الكاش
   */
  static set<T>(type: string, key: string, data: T, ttl = this.DEFAULT_TTL): void {
    const cache = this.getCache<T>(type);
    cache.set(key, { data, timestamp: Date.now() + ttl });
  }

  /**
   * الحصول على بيانات من الكاش
   */
  static get<T>(type: string, key: string): T | null {
    const cache = this.getCache<T>(type);
    const entry = cache.get(key);
    
    if (!entry) return null;
    
    if (entry.timestamp < Date.now()) {
      cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  /**
   * حذف بيانات من الكاش
   */
  static delete(type: string, key: string): void {
    const cache = this.getCache(type);
    cache.delete(key);
  }

  /**
   * مسح الكاش بالكامل لنوع معين من البيانات
   */
  static clear(type: string): void {
    this.caches[type] = new Map();
  }

  /**
   * مسح جميع الكاش
   */
  static clearAll(): void {
    this.caches = {};
  }
}
```

### الخطوة 7: دمج طبقة API مع Redux

```typescript
// src/domains/customers/store/customersSlice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { customersApi } from '../api/customersApi';
import { Customer, CustomerStatus } from '@/types';

// Thunk Actions
export const fetchCustomers = createAsyncThunk(
  'customers/fetchAll',
  async (options?: { status?: CustomerStatus }) => {
    const response = await customersApi.getAll(options);
    if (!response.success) throw new Error(response.error?.message);
    return response.data;
  }
);

export const fetchCustomerById = createAsyncThunk(
  'customers/fetchById',
  async (id: string) => {
    const response = await customersApi.getById(id);
    if (!response.success) throw new Error(response.error?.message);
    return response.data;
  }
);

export const createCustomer = createAsyncThunk(
  'customers/create',
  async (customer: Omit<Customer, 'id'>) => {
    const response = await customersApi.create(customer);
    if (!response.success) throw new Error(response.error?.message);
    return response.data;
  }
);

export const updateCustomer = createAsyncThunk(
  'customers/update',
  async ({ id, customer }: { id: string, customer: Partial<Customer> }) => {
    const response = await customersApi.update(id, customer);
    if (!response.success) throw new Error(response.error?.message);
    return response.data;
  }
);

export const deleteCustomer = createAsyncThunk(
  'customers/delete',
  async (id: string) => {
    const response = await customersApi.delete(id);
    if (!response.success) throw new Error(response.error?.message);
    return id;
  }
);

// Initial State
interface CustomersState {
  items: Customer[];
  selectedCustomer: Customer | null;
  loading: boolean;
  error: string | null;
}

const initialState: CustomersState = {
  items: [],
  selectedCustomer: null,
  loading: false,
  error: null,
};

// Slice
const customersSlice = createSlice({
  name: 'customers',
  initialState,
  reducers: {
    setSelectedCustomer: (state, action) => {
      state.selectedCustomer = action.payload;
    },
    clearSelectedCustomer: (state) => {
      state.selectedCustomer = null;
    },
    clearCustomersError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchCustomers
      .addCase(fetchCustomers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCustomers.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchCustomers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch customers';
      })
      
      // fetchCustomerById
      .addCase(fetchCustomerById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCustomerById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedCustomer = action.payload;
      })
      .addCase(fetchCustomerById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch customer';
      })
      
      // createCustomer
      .addCase(createCustomer.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createCustomer.fulfilled, (state, action) => {
        state.loading = false;
        state.items.unshift(action.payload);
      })
      .addCase(createCustomer.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to create customer';
      })
      
      // updateCustomer
      .addCase(updateCustomer.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCustomer.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.items.findIndex(item => item.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
        if (state.selectedCustomer?.id === action.payload.id) {
          state.selectedCustomer = action.payload;
        }
      })
      .addCase(updateCustomer.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to update customer';
      })
      
      // deleteCustomer
      .addCase(deleteCustomer.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteCustomer.fulfilled, (state, action) => {
        state.loading = false;
        state.items = state.items.filter(item => item.id !== action.payload);
        if (state.selectedCustomer?.id === action.payload) {
          state.selectedCustomer = null;
        }
      })
      .addCase(deleteCustomer.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to delete customer';
      });
  },
});

export const { setSelectedCustomer, clearSelectedCustomer, clearCustomersError } = customersSlice.actions;
export default customersSlice.reducer;
```

### الخطوة 8: اختبار طبقة API

```typescript
// src/domains/customers/api/__tests__/customersApi.test.ts
import { customersApi } from '../customersApi';
import { supabase } from '@/lib/supabase';

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe('customersApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('should fetch all customers successfully', async () => {
      // Mock data
      const mockData = [
        { id: '1', full_name: 'Customer 1', phone_number: '123456789' },
        { id: '2', full_name: 'Customer 2', phone_number: '987654321' },
      ];

      // Mock Supabase response
      const mockSelect = jest.fn().mockReturnValue(Promise.resolve({
        data: mockData,
        error: null,
      }));
      const mockOrder = jest.fn().mockReturnValue({ select: mockSelect });
      const mockFrom = jest.fn().mockReturnValue({ 
        select: jest.fn().mockReturnValue({ order: mockOrder }),
      });
      (supabase.from as jest.Mock).mockReturnValue({ 
        select: jest.fn().mockReturnValue({ order: mockOrder }),
      });

      // Call API
      const result = await customersApi.getAll();

      // Assertions
      expect(supabase.from).toHaveBeenCalledWith('customers');
      expect(result.success).toBe(true);
      expect(result.data.length).toBe(2);
      expect(result.data[0].fullName).toBe('Customer 1');
    });

    it('should handle errors properly', async () => {
      // Mock Supabase error
      const mockError = { message: 'Database error', code: 'DB_ERROR' };
      const mockSelect = jest.fn().mockReturnValue(Promise.resolve({
        data: null,
        error: mockError,
      }));
      const mockOrder = jest.fn().mockReturnValue({ select: mockSelect });
      (supabase.from as jest.Mock).mockReturnValue({ 
        select: jest.fn().mockReturnValue({ order: mockOrder }),
      });

      // Call API
      const result = await customersApi.getAll();

      // Assertions
      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('Failed to fetch customers');
      expect(result.error?.code).toBe('DB_ERROR');
    });
  });

  // اختبارات مماثلة لباقي الدالات...
});
```

## نماذج لواجهات API أخرى

### نموذج API نطاق المندوبين

```typescript
// src/domains/agents/api/agentsApi.ts
import { supabase } from '@/lib/supabase';
import { DeliveryBoy, DeliveryBoyStatus, DeliveryDocument } from '@/types';
import { ApiResponse } from '@/lib/api';
import { DeliveryBoyConverter } from '../utils/converters';

export const agentsApi = {
  getAll: async (options?: {
    status?: DeliveryBoyStatus;
    isAvailable?: boolean;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<ApiResponse<DeliveryBoy[]>> => {
    // تنفيذ مشابه لما تم في customersApi
  },

  getById: async (id: string): Promise<ApiResponse<DeliveryBoy>> => {
    // تنفيذ مشابه
  },

  create: async (agent: Omit<DeliveryBoy, 'id'>): Promise<ApiResponse<DeliveryBoy>> => {
    // تنفيذ مشابه
  },

  update: async (id: string, agent: Partial<DeliveryBoy>): Promise<ApiResponse<DeliveryBoy>> => {
    // تنفيذ مشابه
  },

  updateAvailability: async (id: string, isAvailable: boolean): Promise<ApiResponse<DeliveryBoy>> => {
    try {
      const { data, error } = await supabase
        .from('delivery_boys')
        .update({ is_available: isAvailable })
        .eq('id', id)
        .select('*')
        .single();
      
      if (error) throw error;
      
      return {
        success: true,
        data: DeliveryBoyConverter.fromDB(data),
      };
    } catch (error) {
      // معالجة الخطأ
    }
  },

  uploadDocument: async (agentId: string, document: DeliveryDocument): Promise<ApiResponse<DeliveryDocument>> => {
    // دالة متخصصة لرفع مستندات المندوب
  },

  getNearbyAvailable: async (latitude: number, longitude: number, radius: number): Promise<ApiResponse<DeliveryBoy[]>> => {
    // دالة متخصصة للبحث عن المندوبين المتاحين في نطاق محدد
  },

  // المزيد من الدالات المتخصصة...
};
```

### نموذج API نطاق الطلبات

```typescript
// src/domains/orders/api/ordersApi.ts
import { supabase } from '@/lib/supabase';
import { CustomerOrder, DeliveryOrder, OrderStatus } from '@/types';
import { ApiResponse } from '@/lib/api';
import { OrderConverter } from '../utils/converters';

export const ordersApi = {
  getAll: async (options?: {
    status?: OrderStatus;
    customerId?: string;
    agentId?: string;
    dateFrom?: Date;
    dateTo?: Date;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<ApiResponse<CustomerOrder[]>> => {
    // تنفيذ مشابه
  },

  getById: async (id: string): Promise<ApiResponse<CustomerOrder>> => {
    // تنفيذ مشابه
  },

  getDeliveryOrders: async (options?: {
    status?: OrderStatus;
    agentId?: string;
  }): Promise<ApiResponse<DeliveryOrder[]>> => {
    // دالة متخصصة لجلب طلبات التوصيل
  },

  assignOrderToAgent: async (orderId: string, agentId: string): Promise<ApiResponse<DeliveryOrder>> => {
    // دالة متخصصة لتخصيص طلب لمندوب
  },

  updateOrderStatus: async (orderId: string, status: OrderStatus, notes?: string): Promise<ApiResponse<CustomerOrder>> => {
    // دالة متخصصة لتحديث حالة الطلب
  },

  getOrderStatistics: async (): Promise<ApiResponse<{
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
    cancelled: number;
  }>> => {
    // دالة متخصصة لجلب إحصائيات الطلبات
  },

  // المزيد من الدالات المتخصصة...
};
```

## متطلبات الاختبار

### 1. اختبارات الوحدة

- اختبار كل دالة في واجهة API بشكل منفصل
- محاكاة استجابات Supabase للتحكم في سيناريوهات الاختبار
- اختبار معالجة الأخطاء وحالات الحدود

### 2. اختبارات التكامل

- اختبار تكامل طبقة API مع Redux
- اختبار تكامل واجهات API المختلفة مع بعضها
- اختبار تكامل طبقة API مع واجهة المستخدم

## الخاتمة

تعتبر طبقة API الموحدة حجر الأساس في إعادة هيكلة المشروع وتوحيد استخدام Redux. من خلال اتباع هذا الدليل، يمكن تطوير طبقة API موحدة ومتسقة عبر جميع النطاقات، مما يؤدي إلى تحسين قابلية الصيانة والاختبار وتبسيط تطوير الميزات الجديدة.

يجب أن تكون واجهات API موثقة جيداً ومصممة بشكل جيد لتكون سهلة الاستخدام من قبل مطوري الواجهة الأمامية. كما يجب أن تكون قابلة للاختبار وتتبع مبادئ التصميم الجيد مثل المسؤولية الواحدة (Single Responsibility) والاعتماد على التجريد (Dependency Inversion).

بمجرد الانتهاء من تطوير طبقة API الموحدة، سيكون الفريق جاهزاً للانتقال إلى المهمة التالية في المرحلة الأولى، وهي استكمال تطوير شرائح Redux وتحويل الصفحات لاستخدامها.