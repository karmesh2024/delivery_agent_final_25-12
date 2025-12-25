import React, { useEffect, useState, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { 
  fetchAvailablePermissions, 
  fetchAdminPermissions, 
  updateAdminPermissions 
} from '../store/permissionsSlice';
import { Permission } from '../store/permissionsSlice';
import { AdminPermissions } from '../types';
import {
  ExtendedPermissions,
  ScopedPermissions,
  RawPermissionsData,
  addPermission,
  addScopedPermission
} from '../types/permissions';

/**
 * خصائص مكون إدارة الصلاحيات
 */
interface PermissionManagerProps {
  /**
   * معرف المسؤول الذي سيتم إدارة صلاحياته
   */
  adminId: string;
  
  /**
   * الصلاحيات الأولية (اختياري)
   */
  initialPermissions?: AdminPermissions;
  
  /**
   * دالة يتم استدعاؤها عند حفظ الصلاحيات
   */
  onSave?: (adminId: string, permissions: AdminPermissions, scopedPermissions?: ScopedPermissions) => void;
}

/**
 * مكون إدارة الصلاحيات للمسؤولين
 * يتيح عرض وتعديل صلاحيات مسؤول معين
 */
export function PermissionManager({ 
  adminId, 
  initialPermissions = {},
  onSave 
}: PermissionManagerProps) {
  // متجر Redux
  const dispatch = useAppDispatch();
  const { availablePermissions, selectedAdminPermissions, loading, error } = useAppSelector(state => state.permissions);
  
  // حالات المكون
  const [permissions, setPermissions] = useState<AdminPermissions>(initialPermissions);
  const [successMessage, setSuccessMessage] = useState<string>('');
  
  // حالات صلاحيات النطاق
  const [scopedPermissions, setScopedPermissions] = useState<ScopedPermissions>({});
  const [newScopeType, setNewScopeType] = useState<string>('');
  const [newPermissionCode, setNewPermissionCode] = useState<string>('');
  const [newScopeValue, setNewScopeValue] = useState<string>('');
  
  // جلب الصلاحيات المتاحة عند تحميل المكون
  useEffect(() => {
    dispatch(fetchAvailablePermissions());
    
    // إذا لم يتم تمرير صلاحيات أولية، نجلب صلاحيات المسؤول من قاعدة البيانات
    if (adminId && Object.keys(initialPermissions).length === 0) {
      dispatch(fetchAdminPermissions(adminId));
    }
  }, [dispatch, adminId, initialPermissions]);
  
  // تحديث حالة الصلاحيات عند تغير البيانات من Redux
  useEffect(() => {
    if (selectedAdminPermissions && adminId) {
      // فصل الصلاحيات العامة عن صلاحيات النطاق
      const { scoped_permissions, ...generalPermissions } = selectedAdminPermissions as RawPermissionsData;
      setPermissions(generalPermissions as AdminPermissions);
      
      // تعيين صلاحيات النطاق إذا وجدت
      if (scoped_permissions) {
        setScopedPermissions(scoped_permissions);
      }
    }
  }, [selectedAdminPermissions, adminId]);
  
  // تنظيم الصلاحيات حسب المجموعة (تم التبسيط لعدم وجود مجموعات فعلية)
  const permissionsByGroup = useMemo(() => {
    return {
      'الصلاحيات العامة': availablePermissions
    };
    // الكود القديم للتجميع:
    /*
    type PermissionWithGroupId = Permission & { group_id?: string | null };
    return (availablePermissions as PermissionWithGroupId[]).reduce((groups: Record<string, Permission[]>, permission) => {
      const groupKey = permission.group_id || 'عام'; 
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(permission);
      return groups;
    }, {});
    */
  }, [availablePermissions]);
  
  /**
   * معالجة تغيير حالة الصلاحية
   */
  const handlePermissionChange = (permissionCode: string, enabled: boolean) => {
    setPermissions(prev => ({
      ...prev,
      [permissionCode]: enabled
    }));
    
    // مسح رسالة النجاح عند إجراء تغييرات جديدة
    if (successMessage) {
      setSuccessMessage('');
    }
  };
  
  /**
   * حفظ الصلاحيات
   */
  const handleSave = async () => {
    try {
      setSuccessMessage('');
      
      // إنشاء كائن ExtendedPermissions باستخدام دوال النظام الجديد
      let extendedPerms: ExtendedPermissions = { permissions: {} };
      
      // إضافة الصلاحيات العامة
      Object.entries(permissions).forEach(([key, value]) => {
        extendedPerms = addPermission(extendedPerms, key, value);
      });
      
      // إضافة صلاحيات النطاق
      Object.entries(scopedPermissions).forEach(([scopeType, perms]) => {
        Object.entries(perms).forEach(([permCode, values]) => {
          values.forEach(value => {
            extendedPerms = addScopedPermission(extendedPerms, permCode, scopeType, value);
          });
        });
      });
      
      // تحديث الصلاحيات في قاعدة البيانات
      await dispatch(updateAdminPermissions({ 
        adminId, 
        permissions: extendedPerms.permissions
      })).unwrap();
      
      // عرض رسالة نجاح
      setSuccessMessage('تم حفظ الصلاحيات بنجاح');
      
      // استدعاء دالة onSave إذا تم تمريرها
      if (onSave) {
        onSave(adminId, extendedPerms.permissions, extendedPerms.scoped_permissions);
      }
    } catch (err) {
      // تم معالجة الخطأ في الشريحة
      console.error('خطأ في حفظ الصلاحيات:', err);
    }
  };
  
  /**
   * إضافة صلاحية نطاق جديدة
   */
  const handleAddScopedPermission = () => {
    if (newScopeType && newPermissionCode && newScopeValue) {
      // تحديث حالة صلاحيات النطاق
      setScopedPermissions(prev => {
        const newScoped = { ...prev };
        
        if (!newScoped[newScopeType]) {
          newScoped[newScopeType] = {};
        }
        
        if (!newScoped[newScopeType][newPermissionCode]) {
          newScoped[newScopeType][newPermissionCode] = [];
        }
        
        if (!newScoped[newScopeType][newPermissionCode].includes(newScopeValue)) {
          newScoped[newScopeType][newPermissionCode] = [
            ...newScoped[newScopeType][newPermissionCode],
            newScopeValue
          ];
        }
        
        return newScoped;
      });
      
      // إعادة تعيين حقول الإدخال
      setNewScopeType('');
      setNewPermissionCode('');
      setNewScopeValue('');
      
      // مسح رسالة النجاح عند إجراء تغييرات جديدة
      if (successMessage) {
        setSuccessMessage('');
      }
    }
  };
  
  /**
   * إزالة صلاحية نطاق
   */
  const handleRemoveScopedPermission = (scopeType: string, permissionCode: string, value: string) => {
    setScopedPermissions(prev => {
      const newScoped = { ...prev };
      
      if (newScoped[scopeType] && newScoped[scopeType][permissionCode]) {
        newScoped[scopeType][permissionCode] = newScoped[scopeType][permissionCode]
          .filter(v => v !== value);
        
        // إزالة المصفوفة إذا كانت فارغة
        if (newScoped[scopeType][permissionCode].length === 0) {
          delete newScoped[scopeType][permissionCode];
        }
        
        // إزالة نوع النطاق إذا كان فارغًا
        if (Object.keys(newScoped[scopeType]).length === 0) {
          delete newScoped[scopeType];
        }
      }
      
      return newScoped;
    });
    
    // مسح رسالة النجاح عند إجراء تغييرات جديدة
    if (successMessage) {
      setSuccessMessage('');
    }
  };
  
  // إذا كان التحميل قيد التقدم، نعرض مؤشر تحميل
  if (loading && Object.keys(permissions).length === 0) {
    return (
      <div className="p-4 text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto"></div>
        <p className="mt-2">جاري تحميل الصلاحيات...</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* رسائل الخطأ والنجاح */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}
      
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
          {successMessage}
        </div>
      )}
      
      {/* عرض الصلاحيات حسب المجموعة */}
      {Object.entries(permissionsByGroup).map(([group, perms]) => (
        <div key={group} className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div>
              <h3 className="text-lg font-medium text-gray-900">{group}</h3>
              <p className="text-sm text-gray-500">صلاحيات {group}</p>
            </div>
          </div>
          
          <div className="divide-y divide-gray-200">
            {perms.map(permission => (
              <div key={permission.code} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">{permission.name}</div>
                  {permission.description && (
                    <div className="text-sm text-gray-500">{permission.description}</div>
                  )}
                  <div className="text-xs text-gray-400">{permission.code}</div>
                </div>
                
                <label className="inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={!!permissions[permission.code]}
                    onChange={(e) => handlePermissionChange(permission.code, e.target.checked)}
                  />
                  <div className="
                    relative w-11 h-6 bg-gray-200 rounded-full peer 
                    peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full 
                    peer-checked:after:border-white after:content-[''] after:absolute 
                    after:top-0.5 after:start-[2px] after:bg-white after:border-gray-300 
                    after:border after:rounded-full after:h-5 after:w-5 after:transition-all 
                    peer-checked:bg-primary
                  "></div>
                </label>
              </div>
            ))}
          </div>
        </div>
      ))}
      
      {/* قسم صلاحيات النطاق */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">صلاحيات النطاق المحدد</h3>
          <p className="text-sm text-gray-500">تقييد الصلاحيات لعناصر أو مناطق محددة</p>
        </div>
        
        <div className="px-6 py-4">
          {Object.keys(scopedPermissions).length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              لا توجد صلاحيات نطاق محددة لهذا المسؤول
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(scopedPermissions).map(([scopeType, perms]) => (
                <div key={scopeType} className="border rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">نطاق: {scopeType}</h4>
                  <div className="space-y-3">
                    {Object.entries(perms).map(([permCode, values]) => (
                      <div key={permCode} className="bg-gray-50 p-3 rounded-md">
                        <div className="font-medium text-gray-800 mb-1">{permCode}</div>
                        <div className="flex flex-wrap gap-2">
                          {values.map(value => (
                            <div key={value} className="bg-blue-50 text-blue-700 px-2 py-1 rounded flex items-center text-sm">
                              {value}
                              <button 
                                onClick={() => handleRemoveScopedPermission(scopeType, permCode, value)}
                                className="ml-2 text-blue-500 hover:text-blue-700"
                              >
                                &times;
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* نموذج إضافة صلاحية نطاق جديدة */}
          <div className="mt-6 border-t pt-4">
            <h4 className="font-medium text-gray-900 mb-3">إضافة صلاحية نطاق جديدة</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                type="text"
                className="px-3 py-2 border rounded-md"
                placeholder="نوع النطاق (مثال: region)"
                value={newScopeType}
                onChange={(e) => setNewScopeType(e.target.value)}
              />
              <input
                type="text"
                className="px-3 py-2 border rounded-md"
                placeholder="رمز الصلاحية (مثال: agents:manage)"
                value={newPermissionCode}
                onChange={(e) => setNewPermissionCode(e.target.value)}
              />
              <input
                type="text"
                className="px-3 py-2 border rounded-md"
                placeholder="قيمة النطاق (مثال: 123)"
                value={newScopeValue}
                onChange={(e) => setNewScopeValue(e.target.value)}
              />
            </div>
            <button
              type="button"
              className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none"
              onClick={handleAddScopedPermission}
              disabled={!newScopeType || !newPermissionCode || !newScopeValue}
            >
              إضافة صلاحية نطاق
            </button>
          </div>
        </div>
      </div>

      {/* زر الحفظ */}
      <div className="flex justify-end">
        <button
          type="button"
          className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          onClick={handleSave}
          disabled={loading}
        >
          {loading ? 'جاري الحفظ...' : 'حفظ الصلاحيات'}
        </button>
      </div>
    </div>
  );
}