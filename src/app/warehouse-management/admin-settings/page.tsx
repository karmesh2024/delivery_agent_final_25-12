'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/shared/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Textarea } from '@/shared/ui/textarea';
import { Badge } from '@/shared/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { 
  FiSettings, 
  FiHome, 
  FiUsers, 
  FiShield, 
  FiSave,
  FiEdit3,
  FiEye,
  FiPlus,
  FiTrash2,
  FiCheck,
  FiX,
  FiLayers,
  FiPackage,
  FiArchive,
  FiGitBranch,
  FiChevronDown,
  FiChevronRight,
  FiTag,
  FiStar,
  FiMinus,
  FiBarChart
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import warehouseService from '@/domains/warehouse-management/services/warehouseService';
import { UniversalDialog } from '@/shared/ui/universal-dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/ui/alert-dialog';
import { Switch } from '@/shared/ui/switch';

interface AdminSettings {
  global_management: boolean;
  hierarchy_control: boolean;
  system_oversight: boolean;
  inventory_management: boolean;
  security_level: string;
  notification_system: boolean;
}

interface FunctionalStructure {
  departments: string[];
  hierarchy: Record<string, unknown>;
  roles: Record<string, unknown>;
}

interface SystemConfiguration {
  inventory_management: boolean;
  security_level: string;
  notification_system: boolean;
  reporting_system: boolean;
  integration_settings: Record<string, unknown>;
}

interface WarehouseLevel {
  id: string;
  name: string;
  code: string;
  level_order: number;
  description: string;
  can_create_sub_levels: boolean;
  max_sub_levels: number;
}

interface WarehousePermission {
  id: string;
  warehouse_id: number;
  permission_type: string;
  permission_value: boolean;
  delegated_from?: string;
  expires_at?: string;
}

interface Warehouse {
  id: number;
  name: string;
  parent_warehouse_id?: number | null;
  permissions?: WarehousePermission[];
  level?: { code: string; name: string };
  sub_warehouses?: Warehouse[];
  depth?: number;
  level_id?: string;
  warehouse_level?: string;
  is_admin_warehouse?: boolean;
}

interface PermissionDelegation {
  id: string;
  delegator_warehouse_id: string;
  delegatee_warehouse_id: string;
  permission_types: string[];
  delegation_level: string;
  is_active: boolean;
  expires_at?: string;
}

interface AdminWarehouse {
  id: string | number;
  name: string;
  location?: string;
  admin_settings?: AdminSettings;
  functional_structure?: FunctionalStructure;
  system_configuration?: SystemConfiguration;
  [key: string]: unknown;
}

interface DelegationFormData {
  id?: string;
  delegator_warehouse_id: string;
  delegatee_warehouse_id: string;
  permission_types: string[];
  delegation_level: string;
  expires_at?: string;
}

const DEFAULT_PERMISSION_TYPES = [
  { key: 'create_warehouse', label: 'إنشاء مخزن' },
  { key: 'edit_warehouse', label: 'تعديل مخزن' },
  { key: 'delete_warehouse', label: 'حذف مخزن' },
  { key: 'view_reports', label: 'عرض التقارير' },
  { key: 'manage_permissions', label: 'إدارة الصلاحيات' },
  { key: 'delegate_permissions', label: 'تفويض الصلاحيات' }
];

interface PermissionsEditDialogProps {
  open: boolean;
  onClose: () => void;
  warehouse: Warehouse;
  onPermissionUpdate?: (type: string, value: boolean) => void;
}

function PermissionsEditDialog({ open, onClose, warehouse, onPermissionUpdate }: PermissionsEditDialogProps) {
  const [submitting, setSubmitting] = React.useState(false);
  const [permissions, setPermissions] = React.useState<Record<string, boolean>>(() => {
    const obj: Record<string, boolean> = {};
    (warehouse.permissions ?? []).forEach((perm) => { obj[perm.permission_type] = perm.permission_value; });
    return obj;
  });
  const handleToggle = async (permission_type: string) => {
    setSubmitting(true);
    const newValue = !permissions[permission_type];
    setPermissions((p) => ({ ...p, [permission_type]: newValue }));
    await warehouseService.setWarehousePermission(
      warehouse.id,
      permission_type,
      newValue
    );
    if (onPermissionUpdate) onPermissionUpdate(permission_type, newValue);
    setSubmitting(false);
  };
  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>تعديل صلاحيات المخزن: {warehouse.name}</AlertDialogTitle>
          <AlertDialogDescription>
            قم بتعديل صلاحيات هذا المخزن من خلال تفعيل أو إلغاء تفعيل الخيارات أدناه.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className='space-y-4 mt-2'>
          {DEFAULT_PERMISSION_TYPES.map(({ key, label }) => (
            <div key={key} className='flex items-center justify-between'>
              <span>{label}</span>
              <Switch
                checked={!!permissions[key]}
                onCheckedChange={() => handleToggle(key)}
                disabled={submitting}
              />
            </div>
          ))}
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default function AdminSettingsPage() {
  const router = useRouter();
  const [adminWarehouse, setAdminWarehouse] = useState<AdminWarehouse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // States for hierarchy tree
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [warehouseLevels, setWarehouseLevels] = useState<WarehouseLevel[]>([]);
  const [delegations, setDelegations] = useState<PermissionDelegation[]>([]);
  const [hierarchyLoading, setHierarchyLoading] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [treeExpanded, setTreeExpanded] = useState(true);
  const [activeHierarchyTab, setActiveHierarchyTab] = useState('hierarchy-settings');
  
  // Dialog states for delegation
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<'delegation'>('delegation');
  const [dialogTitle, setDialogTitle] = useState('تفويض صلاحيات');
  const [dialogLoading, setDialogLoading] = useState(false);
  const [editingDelegation, setEditingDelegation] = useState<PermissionDelegation | null>(null);
  
  // Delete confirmation dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [delegationToDelete, setDelegationToDelete] = useState<string | null>(null);
  // Warehouse delete dialog state
  const [warehouseDeleteDialogOpen, setWarehouseDeleteDialogOpen] = useState(false);
  const [warehouseToDelete, setWarehouseToDelete] = useState<string | null>(null);
  
  // إعدادات الإدارة العليا
  const [adminSettings, setAdminSettings] = useState<AdminSettings>({
    global_management: true,
    hierarchy_control: true,
    system_oversight: true,
    inventory_management: true,
    security_level: 'high',
    notification_system: true
  });

  // الهيكل الوظيفي
  const [functionalStructure, setFunctionalStructure] = useState<FunctionalStructure>({
    departments: ['إدارة المخازن', 'المراقبة', 'التطوير', 'الدعم الفني'],
    hierarchy: {},
    roles: {}
  });

  // إعدادات النظام
  const [systemConfiguration, setSystemConfiguration] = useState<SystemConfiguration>({
    inventory_management: true,
    security_level: 'high',
    notification_system: true,
    reporting_system: true,
    integration_settings: {}
  });

  // تحميل بيانات الإدارة العليا
  useEffect(() => {
    loadAdminWarehouse();
    loadHierarchyData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadHierarchyData = async () => {
    try {
      setHierarchyLoading(true);
      console.log('بدء تحميل بيانات الهيكل الهرمي...');
      const [warehousesData, levelsData, delegationsData] = await Promise.all([
        warehouseService.getWarehousesWithHierarchy(),
        warehouseService.getWarehouseLevels(),
        warehouseService.getPermissionDelegations()
      ]);
      console.log('بيانات المخازن المحملة:', warehousesData);
      console.log('بيانات المستويات المحملة:', levelsData);
      console.log('بيانات التفويضات المحملة:', delegationsData);
      setWarehouses(warehousesData || []);
      setWarehouseLevels(levelsData || []);
      setDelegations(delegationsData || []);
    } catch (error) {
      console.error('خطأ في تحميل بيانات الهيكل الهرمي:', error);
      toast.error('حدث خطأ أثناء تحميل بيانات الهيكل الهرمي');
      setWarehouses([]);
      setWarehouseLevels([]);
      setDelegations([]);
    } finally {
      setHierarchyLoading(false);
    }
  };

  const hierarchicalWarehouses = React.useMemo(() => {
    if (!warehouses || warehouses.length === 0) {
      return [] as Warehouse[];
    }

    const map = new Map<string, Warehouse>();

    warehouses.forEach(item => {
      const idKey = String(item.id);
      map.set(idKey, {
        ...item,
        sub_warehouses: []
      });
    });

    const roots: Warehouse[] = [];

    map.forEach(item => {
      const parentId = item.parent_warehouse_id ? String(item.parent_warehouse_id) : null;
      if (parentId && map.has(parentId)) {
        const parent = map.get(parentId)!;
        parent.sub_warehouses = parent.sub_warehouses || [];
        parent.sub_warehouses.push(item);
      } else if (!parentId) {
        roots.push(item);
      } else {
        roots.push(item);
      }
    });

    const sortAsc = (items: Warehouse[]) => {
      items.sort((a, b) => a.name.localeCompare(b.name, 'ar'));
      items.forEach(child => {
        if (child.sub_warehouses && child.sub_warehouses.length > 0) {
          sortAsc(child.sub_warehouses);
        }
      });
    };
    sortAsc(roots);

    return roots;
  }, [warehouses]);

  // فتح الشجرة افتراضياً عند تحميل البيانات
  useEffect(() => {
    if (!hierarchyLoading && hierarchicalWarehouses.length > 0) {
      const allIds = new Set<string>();
      const walk = (w: Warehouse) => {
        allIds.add(String(w.id));
        (w.sub_warehouses || []).forEach(sw => walk(sw));
      };
      hierarchicalWarehouses.forEach(walk);
      setExpandedItems(allIds);
      setTreeExpanded(true);
    }
  }, [hierarchyLoading, hierarchicalWarehouses]);

  const toggleExpanded = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const toggleTreeExpanded = () => {
    setTreeExpanded(!treeExpanded);
    if (treeExpanded) {
      setExpandedItems(new Set());
    } else {
      const allIds = new Set<string>();
      const collect = (warehouse: Warehouse) => {
        allIds.add(String(warehouse.id));
        warehouse.sub_warehouses?.forEach(subWarehouse => collect(subWarehouse));
      };
      hierarchicalWarehouses.forEach(collect);
      setExpandedItems(allIds);
    }
  };

  const openAddDialog = (type: 'delegation') => {
    setDialogType(type);
    setDialogTitle('تفويض صلاحيات');
    setEditingDelegation(null);
    setDialogOpen(true);
  };

  const openEditDialog = (delegation: PermissionDelegation) => {
    setDialogType('delegation');
    setDialogTitle('تعديل التفويض');
    setEditingDelegation(delegation);
    setDialogOpen(true);
  };

  const handleDeleteDelegation = (delegationId: string) => {
    setDelegationToDelete(delegationId);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteDelegation = async () => {
    if (!delegationToDelete) return;
    
    try {
      const success = await warehouseService.deletePermissionDelegation(delegationToDelete);
      if (success) {
        await loadHierarchyData();
        toast.success('تم حذف التفويض بنجاح');
      }
    } catch (error) {
      console.error('خطأ في حذف التفويض:', error);
      toast.error('حدث خطأ أثناء حذف التفويض');
    } finally {
      setDeleteDialogOpen(false);
      setDelegationToDelete(null);
    }
  };

  const handleDeleteWarehouse = (warehouseId: string) => {
    setWarehouseToDelete(warehouseId);
    setWarehouseDeleteDialogOpen(true);
  };

  const confirmDeleteWarehouse = async () => {
    if (!warehouseToDelete) return;
    try {
      const success = await warehouseService.deleteWarehouse(warehouseToDelete);
      if (success) {
        await loadHierarchyData();
        toast.success('تم حذف المخزن بنجاح');
      }
    } catch (error) {
      console.error('خطأ في حذف المخزن:', error);
      toast.error('حدث خطأ أثناء حذف المخزن');
    } finally {
      setWarehouseDeleteDialogOpen(false);
      setWarehouseToDelete(null);
    }
  };

  const handleDelegationSubmit = async (formData: DelegationFormData) => {
    try {
      setDialogLoading(true);
      
      const delegationPayload = {
        delegator_warehouse_id: String(formData.delegator_warehouse_id),
        delegatee_warehouse_id: String(formData.delegatee_warehouse_id),
        permission_types: formData.permission_types || [],
        delegation_level: String(formData.delegation_level),
        expires_at: formData.expires_at ? new Date(formData.expires_at).toISOString() : undefined
      };
      
      let success = false;
      
      if (formData.id || editingDelegation) {
        // تحديث التفويض الموجود
        const delegationId = formData.id || editingDelegation?.id;
        if (!delegationId) {
          toast.error('معرف التفويض غير موجود');
          return;
        }
        console.log('بدء تحديث تفويض:', delegationId, delegationPayload);
        success = await warehouseService.updatePermissionDelegation(delegationId, delegationPayload);
      } else {
        // إنشاء تفويض جديد
        console.log('بدء إنشاء تفويض:', delegationPayload);
        success = await warehouseService.createPermissionDelegation(delegationPayload);
      }
      
      if (success) {
        console.log('Success! Closing dialog and reloading data...');
        toast.success(editingDelegation ? 'تم تحديث التفويض بنجاح' : 'تم إنشاء التفويض بنجاح');
        setDialogOpen(false);
        setEditingDelegation(null);
        await loadHierarchyData();
      } else {
        console.error('Failed to save delegation');
        toast.error('فشل في حفظ التفويض');
      }
    } catch (error) {
      console.error('خطأ في حفظ التفويض:', error);
      toast.error('حدث خطأ أثناء حفظ التفويض');
    } finally {
      setDialogLoading(false);
    }
  };

  const getLevelIcon = (levelCode: string) => {
    switch (levelCode) {
      case 'admin': return <FiShield className="w-4 h-4 text-red-600" />;
      case 'country': return <FiStar className="w-4 h-4 text-blue-600" />;
      case 'city': return <FiPackage className="w-4 h-4 text-green-600" />;
      case 'district': return <FiTag className="w-4 h-4 text-purple-600" />;
      default: return <FiLayers className="w-4 h-4 text-gray-600" />;
    }
  };

  const getLevelColor = (levelCode: string) => {
    switch (levelCode) {
      case 'admin': return 'bg-red-100 text-red-800 border-red-200';
      case 'country': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'city': return 'bg-green-100 text-green-800 border-green-200';
      case 'district': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const renderWarehouseTree = (warehouse: Warehouse, level: number = 0) => {
    const idKey = String(warehouse.id);
    const isExpanded = expandedItems.has(idKey);
    const hasChildren = warehouse.sub_warehouses && warehouse.sub_warehouses.length > 0;

    return (
      <div key={idKey} className={`${level > 0 ? 'ml-6 border-l-2 border-gray-200 pl-4' : ''}`}>
        <div className="flex items-center justify-between p-3 bg-white rounded-lg border hover:shadow-md transition-shadow">
          <div className="flex items-center space-x-3">
            {hasChildren && (
              <button
                onClick={() => toggleExpanded(idKey)}
                className="flex items-center justify-center w-6 h-6 rounded hover:bg-gray-100"
              >
                {isExpanded ? (
                  <FiChevronDown className="w-4 h-4 text-gray-600" />
                ) : (
                  <FiChevronRight className="w-4 h-4 text-gray-600" />
                )}
              </button>
            )}
            
            {getLevelIcon(warehouse.level?.code || '')}
            
            <div>
              <h3 className="font-medium text-lg">{warehouse.name}</h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={getLevelColor(warehouse.level?.code || '')}>
                  {warehouse.level?.name || 'غير محدد'}
                </Badge>
                <span className="text-xs text-gray-500">المستوى {(warehouse.depth ?? 0) + 1}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => router.push(`/warehouse-management/warehouses/new?parent=${warehouse.id}`)}
            >
              <FiPlus className="w-3 h-3 mr-1" />
              إضافة مخزن فرعي
            </Button>
            
            <Button
              size="sm"
              variant="outline"
              onClick={() => router.push(`/warehouse-management/warehouses/${warehouse.id}/edit`)}
            >
              <FiEdit3 className="w-3 h-3" />
            </Button>
            {!(warehouse.level?.code === 'admin' || warehouse.warehouse_level === 'admin' || warehouse.is_admin_warehouse === true) && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDeleteWarehouse(String(warehouse.id))}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                title="حذف المخزن"
              >
                <FiTrash2 className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>

        {isExpanded && hasChildren && (
          <div className="mt-2 space-y-2">
            {warehouse.sub_warehouses?.map(subWarehouse => 
              renderWarehouseTree(subWarehouse, level + 1)
            )}
          </div>
        )}
      </div>
    );
  };

  const loadAdminWarehouse = async () => {
    try {
      setLoading(true);
      const admin = await warehouseService.getAdminWarehouse();
      
      if (admin) {
        // تحويل Warehouse إلى AdminWarehouse
        const adminWarehouseData: AdminWarehouse = {
          id: admin.id,
          name: admin.name,
          location: admin.location || undefined,
          admin_settings: admin.admin_settings as AdminSettings | undefined,
          functional_structure: admin.functional_structure as FunctionalStructure | undefined,
          system_configuration: admin.system_configuration as SystemConfiguration | undefined,
        };
        setAdminWarehouse(adminWarehouseData);
        
        // تحويل admin_settings من Record إلى AdminSettings
        if (admin.admin_settings && typeof admin.admin_settings === 'object') {
          const settings = admin.admin_settings as Record<string, unknown>;
          setAdminSettings({
            global_management: typeof settings.global_management === 'boolean' ? settings.global_management : true,
            hierarchy_control: typeof settings.hierarchy_control === 'boolean' ? settings.hierarchy_control : true,
            system_oversight: typeof settings.system_oversight === 'boolean' ? settings.system_oversight : true,
            inventory_management: typeof settings.inventory_management === 'boolean' ? settings.inventory_management : true,
            security_level: typeof settings.security_level === 'string' ? settings.security_level : 'high',
            notification_system: typeof settings.notification_system === 'boolean' ? settings.notification_system : true
          });
        } else {
          setAdminSettings(adminSettings);
        }
        
        // تحويل functional_structure من Record إلى FunctionalStructure
        if (admin.functional_structure && typeof admin.functional_structure === 'object') {
          const structure = admin.functional_structure as Record<string, unknown>;
          setFunctionalStructure({
            departments: Array.isArray(structure.departments) ? structure.departments as string[] : ['إدارة المخازن', 'المراقبة', 'التطوير', 'الدعم الفني'],
            hierarchy: typeof structure.hierarchy === 'object' && structure.hierarchy !== null ? structure.hierarchy as Record<string, unknown> : {},
            roles: typeof structure.roles === 'object' && structure.roles !== null ? structure.roles as Record<string, unknown> : {}
          });
        } else {
          setFunctionalStructure(functionalStructure);
        }
        
        // تحويل system_configuration من Record إلى SystemConfiguration
        if (admin.system_configuration && typeof admin.system_configuration === 'object') {
          const config = admin.system_configuration as Record<string, unknown>;
          setSystemConfiguration({
            inventory_management: typeof config.inventory_management === 'boolean' ? config.inventory_management : true,
            security_level: typeof config.security_level === 'string' ? config.security_level : 'high',
            notification_system: typeof config.notification_system === 'boolean' ? config.notification_system : true,
            reporting_system: typeof config.reporting_system === 'boolean' ? config.reporting_system : true,
            integration_settings: typeof config.integration_settings === 'object' && config.integration_settings !== null ? config.integration_settings as Record<string, unknown> : {}
          });
        } else {
          setSystemConfiguration(systemConfiguration);
        }
      } else {
        // إنشاء الإدارة العليا إذا لم تكن موجودة
        await createAdminWarehouse();
      }
    } catch (error) {
      console.error('خطأ في تحميل الإدارة العليا:', error);
      toast.error('حدث خطأ أثناء تحميل الإدارة العليا');
    } finally {
      setLoading(false);
    }
  };

  const createAdminWarehouse = async () => {
    try {
      const adminData = {
        name: 'الإدارة العليا للمخازن',
        location: 'المقر الرئيسي',
        admin_settings: adminSettings as unknown as Record<string, unknown>,
        functional_structure: functionalStructure as unknown as Record<string, unknown>,
        system_configuration: systemConfiguration as unknown as Record<string, unknown>
      };

      const newAdmin = await warehouseService.createAdminWarehouse(adminData);
      if (newAdmin) {
        // تحويل Warehouse إلى AdminWarehouse
        const adminWarehouseData: AdminWarehouse = {
          id: newAdmin.id,
          name: newAdmin.name,
          location: newAdmin.location || undefined,
          admin_settings: newAdmin.admin_settings as AdminSettings | undefined,
          functional_structure: newAdmin.functional_structure as FunctionalStructure | undefined,
          system_configuration: newAdmin.system_configuration as SystemConfiguration | undefined,
        };
        setAdminWarehouse(adminWarehouseData);
        toast.success('تم إنشاء الإدارة العليا بنجاح');
      }
    } catch (error) {
      console.error('خطأ في إنشاء الإدارة العليا:', error);
      toast.error('حدث خطأ أثناء إنشاء الإدارة العليا');
    }
  };

  const handleSaveAdminSettings = async () => {
    if (!adminWarehouse) return;

    try {
      setSaving(true);
      const warehouseId = typeof adminWarehouse.id === 'number' ? adminWarehouse.id : Number(adminWarehouse.id);
      const success = await warehouseService.updateAdminSettings(warehouseId, adminSettings as unknown as Record<string, unknown>);
      if (success) {
        toast.success('تم حفظ إعدادات الإدارة العليا');
      }
    } catch (error) {
      console.error('خطأ في حفظ إعدادات الإدارة العليا:', error);
      toast.error('حدث خطأ أثناء حفظ الإعدادات');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveFunctionalStructure = async () => {
    if (!adminWarehouse) return;

    try {
      setSaving(true);
      const warehouseId = typeof adminWarehouse.id === 'number' ? adminWarehouse.id : Number(adminWarehouse.id);
      const success = await warehouseService.updateFunctionalStructure(warehouseId, functionalStructure as unknown as Record<string, unknown>);
      if (success) {
        toast.success('تم حفظ الهيكل الوظيفي');
      }
    } catch (error) {
      console.error('خطأ في حفظ الهيكل الوظيفي:', error);
      toast.error('حدث خطأ أثناء حفظ الهيكل الوظيفي');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSystemConfiguration = async () => {
    if (!adminWarehouse) return;

    try {
      setSaving(true);
      const warehouseId = typeof adminWarehouse.id === 'number' ? adminWarehouse.id : Number(adminWarehouse.id);
      const success = await warehouseService.updateSystemConfiguration(warehouseId, systemConfiguration as unknown as Record<string, unknown>);
      if (success) {
        toast.success('تم حفظ إعدادات النظام');
      }
    } catch (error) {
      console.error('خطأ في حفظ إعدادات النظام:', error);
      toast.error('حدث خطأ أثناء حفظ إعدادات النظام');
    } finally {
      setSaving(false);
    }
  };

  const addDepartment = () => {
    const newDepartment = prompt('أدخل اسم القسم الجديد:');
    if (newDepartment && newDepartment.trim()) {
      setFunctionalStructure(prev => ({
        ...prev,
        departments: [...prev.departments, newDepartment.trim()]
      }));
    }
  };

  const removeDepartment = (index: number) => {
    setFunctionalStructure(prev => ({
      ...prev,
      departments: prev.departments.filter((_, i) => i !== index)
    }));
  };

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [warehouseToEdit, setWarehouseToEdit] = useState<Warehouse | null>(null);

  const handleOpenEditDialog = (warehouse: Warehouse) => {
    setWarehouseToEdit(warehouse);
    setEditDialogOpen(true);
  };
  const handlePermissionUpdate = (type: string, value: boolean) => {
    setWarehouses((prev) => prev.map((w) =>
      (warehouseToEdit && w.id === warehouseToEdit.id)
        ? {
          ...w,
          permissions: (w.permissions || DEFAULT_PERMISSION_TYPES.map(pt => ({
            id: `new-${pt.key}`,
            warehouse_id: w.id,
            permission_type: pt.key,
            permission_value: false
          }))
          ).map((p) => p.permission_type === type ? { ...p, permission_value: value } : p)
        }
        : w
    ));
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">جاري تحميل الإدارة العليا...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* العنوان الرئيسي */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">إعدادات الإدارة العليا للمخازن</h1>
            <p className="text-gray-600 mt-1">
              إدارة الإعدادات والهيكل الوظيفي ونظام المخازن
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-blue-600 border-blue-200">
              <FiHome className="w-4 h-4 mr-1" />
              الإدارة العليا
            </Badge>
          </div>
        </div>

        {/* التبويبات */}
        <Tabs defaultValue="settings" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <FiSettings className="w-4 h-4" />
              الإعدادات العامة
            </TabsTrigger>
            <TabsTrigger value="structure" className="flex items-center gap-2">
              <FiUsers className="w-4 h-4" />
              الهيكل الوظيفي
            </TabsTrigger>
            <TabsTrigger value="system" className="flex items-center gap-2">
              <FiShield className="w-4 h-4" />
              إعدادات النظام
            </TabsTrigger>
            <TabsTrigger value="warehouse-hierarchy" className="flex items-center gap-2">
              <FiGitBranch className="w-4 h-4" />
              الهيكل الهرمي للمخازن
            </TabsTrigger>
          </TabsList>

          {/* تبويب الإعدادات العامة */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FiSettings className="w-5 h-5 text-blue-600" />
                  الإعدادات العامة للإدارة العليا
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="global_management"
                        checked={adminSettings.global_management}
                        onChange={(e) => setAdminSettings(prev => ({
                          ...prev,
                          global_management: e.target.checked
                        }))}
                        className="rounded border-gray-300"
                      />
                      <Label htmlFor="global_management">الإدارة العامة للمخازن</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="hierarchy_control"
                        checked={adminSettings.hierarchy_control}
                        onChange={(e) => setAdminSettings(prev => ({
                          ...prev,
                          hierarchy_control: e.target.checked
                        }))}
                        className="rounded border-gray-300"
                      />
                      <Label htmlFor="hierarchy_control">التحكم في الهيكل الهرمي</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="system_oversight"
                        checked={adminSettings.system_oversight}
                        onChange={(e) => setAdminSettings(prev => ({
                          ...prev,
                          system_oversight: e.target.checked
                        }))}
                        className="rounded border-gray-300"
                      />
                      <Label htmlFor="system_oversight">المراقبة العامة للنظام</Label>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="inventory_management"
                        checked={adminSettings.inventory_management}
                        onChange={(e) => setAdminSettings(prev => ({
                          ...prev,
                          inventory_management: e.target.checked
                        }))}
                        className="rounded border-gray-300"
                      />
                      <Label htmlFor="inventory_management">إدارة المخزون العامة</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="notification_system"
                        checked={adminSettings.notification_system}
                        onChange={(e) => setAdminSettings(prev => ({
                          ...prev,
                          notification_system: e.target.checked
                        }))}
                        className="rounded border-gray-300"
                      />
                      <Label htmlFor="notification_system">نظام الإشعارات</Label>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="security_level">مستوى الأمان</Label>
                      <select
                        id="security_level"
                        value={adminSettings.security_level || 'high'}
                        onChange={(e) => setAdminSettings(prev => ({
                          ...prev,
                          security_level: e.target.value
                        }))}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      >
                        <option value="low">منخفض</option>
                        <option value="medium">متوسط</option>
                        <option value="high">عالي</option>
                        <option value="critical">حرج</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button 
                    onClick={handleSaveAdminSettings}
                    disabled={saving}
                    className="flex items-center gap-2"
                  >
                    <FiSave className="w-4 h-4" />
                    {saving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* تبويب الهيكل الوظيفي */}
          <TabsContent value="structure" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FiUsers className="w-5 h-5 text-green-600" />
                  الهيكل الوظيفي للإدارة العليا
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-lg font-medium">الأقسام</Label>
                    <Button 
                      onClick={addDepartment}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <FiPlus className="w-4 h-4" />
                      إضافة قسم
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {functionalStructure.departments.map((department, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="font-medium">{department}</span>
                        <Button
                          onClick={() => removeDepartment(index)}
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button 
                    onClick={handleSaveFunctionalStructure}
                    disabled={saving}
                    className="flex items-center gap-2"
                  >
                    <FiSave className="w-4 h-4" />
                    {saving ? 'جاري الحفظ...' : 'حفظ الهيكل الوظيفي'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* تبويب إعدادات النظام */}
          <TabsContent value="system" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FiShield className="w-5 h-5 text-orange-600" />
                  إعدادات النظام
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="system_inventory_management"
                        checked={systemConfiguration.inventory_management}
                        onChange={(e) => setSystemConfiguration(prev => ({
                          ...prev,
                          inventory_management: e.target.checked
                        }))}
                        className="rounded border-gray-300"
                      />
                      <Label htmlFor="system_inventory_management">إدارة المخزون</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="system_notification_system"
                        checked={systemConfiguration.notification_system}
                        onChange={(e) => setSystemConfiguration(prev => ({
                          ...prev,
                          notification_system: e.target.checked
                        }))}
                        className="rounded border-gray-300"
                      />
                      <Label htmlFor="system_notification_system">نظام الإشعارات</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="system_reporting_system"
                        checked={systemConfiguration.reporting_system}
                        onChange={(e) => setSystemConfiguration(prev => ({
                          ...prev,
                          reporting_system: e.target.checked
                        }))}
                        className="rounded border-gray-300"
                      />
                      <Label htmlFor="system_reporting_system">نظام التقارير</Label>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="system_security_level">مستوى الأمان</Label>
                      <select
                        id="system_security_level"
                        value={systemConfiguration.security_level || 'high'}
                        onChange={(e) => setSystemConfiguration(prev => ({
                          ...prev,
                          security_level: e.target.value
                        }))}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      >
                        <option value="low">منخفض</option>
                        <option value="medium">متوسط</option>
                        <option value="high">عالي</option>
                        <option value="critical">حرج</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button 
                    onClick={handleSaveSystemConfiguration}
                    disabled={saving}
                    className="flex items-center gap-2"
                  >
                    <FiSave className="w-4 h-4" />
                    {saving ? 'جاري الحفظ...' : 'حفظ إعدادات النظام'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* تبويب الهيكل الهرمي للمخازن */}
          <TabsContent value="warehouse-hierarchy" className="space-y-6">
            {/* Header Description */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
              <div className="flex items-start space-x-3 rtl:space-x-reverse">
                <FiGitBranch className="w-5 h-5 text-emerald-600 mt-0.5" />
                <div>
                  <h3 className="text-lg font-semibold text-emerald-900 mb-2">الهيكل الهرمي للمخازن</h3>
                  <p className="text-emerald-800 text-sm leading-relaxed">
                    إدارة الهيكل الهرمي للمخازن من الإدارة العليا إلى المخازن المحلية. يمكنك من هنا تنظيم المستويات المختلفة للمخازن وربطها بالقطاعات المناسبة.
                  </p>
                </div>
              </div>
            </div>

            {/* تبويبات فرعية داخل الهيكل الهرمي */}
            <Tabs defaultValue="sectors-categories" className="space-y-6">
              <Card className="border border-gray-200">
                <CardContent className="pt-4">
                  <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="sectors-categories" className="flex items-center gap-2">
                  <FiLayers className="w-4 h-4" />
                  إدارة القطاعات والفئات
                </TabsTrigger>
                    <TabsTrigger value="hierarchy-tree" className="flex items-center gap-2">
                      <FiEye className="w-4 h-4" />
                     ادارة العمليات للمخازن
                    </TabsTrigger>
                  </TabsList>
                </CardContent>
              </Card>

              {/* تبويب فرعي: إدارة القطاعات والفئات */}
          <TabsContent value="sectors-categories" className="space-y-6">
            <div className="text-center py-12">
              <div className="max-w-2xl mx-auto">
                <div className="mb-8">
                  <FiLayers className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    إدارة القطاعات والفئات الهرمية
                  </h2>
                  <p className="text-gray-600 text-lg leading-relaxed mb-8">
                    نظام متطور لإدارة القطاعات والتصنيفات والفئات الأساسية والفرعية بطريقة هرمية منظمة. 
                  </p>
                    </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <FiLayers className="w-8 h-8 text-blue-600 mb-3" />
                    <h3 className="text-lg font-semibold text-blue-900 mb-2">نظام القطاعات والفئات</h3>
                    <p className="text-blue-800 text-sm mb-4">
                      نظام هرمي متكامل لإدارة القطاعات (صناعي، تجاري، زراعي) والتصنيفات والفئات الأساسية والفرعية بطريقة منظمة ومرنة
                    </p>
                    <Link href="/warehouse-management/admin-settings/hierarchical-categories">
                      <Button className="w-full">
                        <FiLayers className="w-4 h-4 mr-2" />
                        إدارة القطاعات والفئات
                      </Button>
                    </Link>
                  </div>
                  
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                    <FiPackage className="w-8 h-8 text-gray-600 mb-3" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">المميزات الجديدة</h3>
                    <ul className="text-gray-700 text-sm space-y-1 mb-4">
                      <li>• إدارة القطاعات مع المستويات المسموحة</li>
                      <li>• نظام تصنيفات هرمي متقدم</li>
                      <li>• فئات أساسية وفرعية مرنة</li>
                      <li>• واجهة مستخدم محسنة</li>
                    </ul>
                    <Link href="/warehouse-management/admin-settings/hierarchical-categories">
                      <Button variant="outline" className="w-full">
                        <FiPackage className="w-4 h-4 mr-2" />
                        استكشاف المميزات
                      </Button>
                    </Link>
                    </div>
                  </div>
                  
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">معلومات إضافية</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-700">
                    <div className="flex items-center">
                      <FiLayers className="w-4 h-4 text-blue-600 mr-2" />
                      <span>إدارة القطاعات</span>
                    </div>
                    <div className="flex items-center">
                      <FiPackage className="w-4 h-4 text-green-600 mr-2" />
                      <span>التصنيفات الهرمية</span>
                  </div>
                    <div className="flex items-center">
                      <FiArchive className="w-4 h-4 text-purple-600 mr-2" />
                      <span>الفئات المرنة</span>
                    </div>
                  </div>
                </div>
              </div>
                </div>
              </TabsContent>

              {/* تبويب فرعي: عرض الشجرة الكاملة */}
              <TabsContent value="hierarchy-tree" className="space-y-6">
                {/* تبويبات النظام الهرمي */}
                <Tabs value={activeHierarchyTab} onValueChange={setActiveHierarchyTab} className="space-y-6">
                  <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="hierarchy-settings" className="flex items-center gap-2">
                      <FiSettings className="w-4 h-4" />
                      إعدادات الهيكل الهرمي
                    </TabsTrigger>
                    <TabsTrigger value="hierarchy" className="flex items-center gap-2">
                      <FiGitBranch className="w-4 h-4" />
                      الهيكل الهرمي
                    </TabsTrigger>
                    <TabsTrigger value="permissions" className="flex items-center gap-2">
                      <FiShield className="w-4 h-4" />
                      الصلاحيات
                    </TabsTrigger>
                    <TabsTrigger value="delegations" className="flex items-center gap-2">
                      <FiUsers className="w-4 h-4" />
                      التفويض
                    </TabsTrigger>
                    <TabsTrigger value="reports" className="flex items-center gap-2">
                      <FiBarChart className="w-4 h-4" />
                      التقارير
                    </TabsTrigger>
                  </TabsList>

                  {/* تبويب إعدادات الهيكل الهرمي */}
                  <TabsContent value="hierarchy-settings" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* إعدادات الهيكل الهرمي */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <FiGitBranch className="w-5 h-5 text-emerald-600" />
                            إعدادات الهيكل الهرمي
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          <div className="space-y-4">
                            <div>
                              <h4 className="font-medium text-gray-900 mb-3">مستويات المخازن</h4>
                              <div className="space-y-3">
                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                  <div>
                                    <h5 className="font-medium">المستوى الأول - الدولة</h5>
                                    <p className="text-sm text-gray-600">المخازن الرئيسية على مستوى الدولة</p>
                                  </div>
                                  <Badge variant="outline">
                                    {warehouses.filter(w => w.level?.code === 'country').length} مخزن رئيسي
                                  </Badge>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                  <div>
                                    <h5 className="font-medium">المستوى الثاني - المدينة</h5>
                                    <p className="text-sm text-gray-600">مخازن المدن التابعة للمخزن الرئيسي</p>
                                  </div>
                                  <Badge variant="outline">
                                    {warehouses.filter(w => w.level?.code === 'city').length} مخزن مدينة
                                  </Badge>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                  <div>
                                    <h5 className="font-medium">المستوى الثالث - المنطقة</h5>
                                    <p className="text-sm text-gray-600">مخازن المناطق التابعة لمخزن المدينة</p>
                                  </div>
                                  <Badge variant="outline">
                                    {warehouses.filter(w => w.level?.code === 'district').length} مخزن منطقة
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* القطاعات المدعومة */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <FiLayers className="w-5 h-5 text-blue-600" />
                            القطاعات المدعومة
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 gap-2">
                            {[
                              { name: 'القطاع الصناعي', color: 'bg-blue-500' },
                              { name: 'القطاع الزراعي', color: 'bg-green-500' },
                              { name: 'القطاع التجاري', color: 'bg-yellow-500' },
                              { name: 'القطاع الإداري', color: 'bg-purple-500' },
                              { name: 'القطاع السياحي', color: 'bg-orange-500' },
                              { name: 'القطاع المنزلي', color: 'bg-pink-500' },
                              { name: 'القطاع الطبي', color: 'bg-red-500' },
                              { name: 'القطاع التعليمي', color: 'bg-indigo-500' }
                            ].map((sector, index) => (
                              <div key={index} className="flex items-center space-x-2 p-2 border rounded-lg">
                                <div className={`w-3 h-3 rounded ${sector.color}`}></div>
                                <span className="text-sm font-medium">{sector.name}</span>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* إحصائيات النظام */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <FiArchive className="w-5 h-5 text-purple-600" />
                          إحصائيات النظام
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="text-center p-4 bg-blue-50 rounded-lg">
                            <div className="text-2xl font-bold text-blue-600">
                              {warehouses.filter(w => w.level?.code === 'country').length}
                            </div>
                            <div className="text-sm text-blue-800">مخزن رئيسي</div>
                          </div>
                          <div className="text-center p-4 bg-green-50 rounded-lg">
                            <div className="text-2xl font-bold text-green-600">
                              {warehouses.filter(w => w.level?.code === 'city').length}
                            </div>
                            <div className="text-sm text-green-800">مخزن مدينة</div>
                          </div>
                          <div className="text-center p-4 bg-purple-50 rounded-lg">
                            <div className="text-2xl font-bold text-purple-600">
                              {warehouses.filter(w => w.level?.code === 'district').length}
                            </div>
                            <div className="text-sm text-purple-800">مخزن منطقة</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    {/* أزرار الإجراءات */}
                    <div className="flex justify-center space-x-4">
                      <Button className="flex items-center gap-2">
                        <FiSettings className="w-4 h-4" />
                        إدارة عليا
                      </Button>
                      <Button variant="outline" className="flex items-center gap-2" onClick={() => router.push('/warehouse-management/warehouses/new')}>
                        <FiPlus className="w-4 h-4" />
                        إضافة مخزن رئيسي
                      </Button>
                      <Button variant="outline" className="flex items-center gap-2" onClick={() => setActiveHierarchyTab('hierarchy')}>
                        <FiEye className="w-4 h-4" />
                        عرض الشجرة الكاملة
                      </Button>
                    </div>
                  </TabsContent>

                  {/* تبويب الهيكل الهرمي */}
                  <TabsContent value="hierarchy" className="space-y-6">
                    {/* Header Description */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start space-x-3 rtl:space-x-reverse">
                        <FiGitBranch className="w-5 h-5 text-blue-600 mt-0.5" />
                        <div>
                          <h3 className="text-lg font-semibold text-blue-900 mb-2">الهيكل الهرمي للمخازن</h3>
                          <p className="text-blue-800 text-sm leading-relaxed">
                            عرض شامل للهيكل الهرمي للمخازن مع المستويات المختلفة. يمكنك من هنا رؤية العلاقات بين المخازن وإدارتها بطريقة هرمية منظمة مع الصلاحيات المتدرجة.
                          </p>
                        </div>
                      </div>
                    </div>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <div className="flex items-center">
                            <FiGitBranch className="w-5 h-5 mr-2" />
                            الهيكل الهرمي الكامل ({warehouses.length})
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setActiveHierarchyTab('hierarchy')}
                              className="flex items-center gap-1"
                            >
                              <FiEye className="w-4 h-4" />
                              عرض الصفحة الكاملة
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={toggleTreeExpanded}
                              className="flex items-center gap-1"
                            >
                              {treeExpanded ? (
                                <>
                                  <FiMinus className="w-4 h-4" />
                                  إغلاق الكل
                                </>
                              ) : (
                                <>
                                  <FiPlus className="w-4 h-4" />
                                  فتح الكل
                                </>
                              )}
                            </Button>
                          </div>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {hierarchyLoading ? (
                          <div className="flex items-center justify-center py-8">
                            <div className="text-center">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                              <p className="mt-2 text-gray-600">جاري التحميل...</p>
                            </div>
                          </div>
                        ) : warehouses.length === 0 ? (
                          <div className="text-center py-8">
                            <FiGitBranch className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد مخازن</h3>
                            <p className="text-gray-600 mb-4">ابدأ بإنشاء مخزن جديد</p>
                            <Button onClick={() => router.push('/warehouse-management/warehouses/new')}>
                              <FiPlus className="w-4 h-4 mr-2" />
                              إضافة مخزن جديد
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {hierarchicalWarehouses.map(warehouse => renderWarehouseTree(warehouse))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* تبويب الصلاحيات */}
                  <TabsContent value="permissions" className="space-y-6">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-start space-x-3 rtl:space-x-reverse">
                        <FiShield className="w-5 h-5 text-green-600 mt-0.5" />
                        <div>
                          <h3 className="text-lg font-semibold text-green-900 mb-2">إدارة الصلاحيات</h3>
                          <p className="text-green-800 text-sm leading-relaxed">
                            إدارة الصلاحيات لكل مخزن حسب مستواه الهرمي. الصلاحيات تختلف حسب المستوى - الإدارة العليا لها صلاحيات كاملة، ومخازن الدولة يمكنها إدارة المدن والمناطق، ومخازن المدن يمكنها إدارة المناطق فقط.
                          </p>
                        </div>
                      </div>
                    </div>

                    {(warehouses.length === 0 || warehouses.every(w => !w.permissions || w.permissions.length === 0)) ? (
                      <div className="py-12 text-center text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
                        لا توجد بيانات صلاحيات لأي مخزن بعد
                        <div className="mt-3">
                          <Button onClick={loadHierarchyData} variant="outline" size="sm">تحديث البيانات</Button>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {warehouses.map(warehouse => (
                          <Card key={warehouse.id} className="hover:shadow-md transition-shadow">
                            <CardHeader className="pb-3">
                              <CardTitle className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  {getLevelIcon(warehouse.level?.code || '')}
                                  <span className="text-sm font-medium">{warehouse.name}</span>
                                </div>
                                <Button size="sm" variant="outline" onClick={() => handleOpenEditDialog(warehouse)}>
                                  <FiEdit3 className="mr-1" /> تعديل الصلاحيات
                                </Button>
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-2">
                                <Badge className={getLevelColor(warehouse.level?.code || '')}>
                                  {warehouse.level?.name || 'غير محدد'}
                                </Badge>
                                
                                {warehouse.permissions && warehouse.permissions.length > 0 && (
                                  <div className="space-y-1">
                                    {warehouse.permissions.map(permission => (
                                      <div key={permission.id} className="flex items-center justify-between text-xs gap-2">
                                        <span className="text-gray-600">
                                          {permission.permission_type === 'create_warehouse' ? 'إنشاء مخزن' :
                                           permission.permission_type === 'edit_warehouse' ? 'تعديل مخزن' :
                                           permission.permission_type === 'delete_warehouse' ? 'حذف مخزن' :
                                           permission.permission_type === 'view_reports' ? 'عرض التقارير' :
                                           permission.permission_type === 'manage_permissions' ? 'إدارة الصلاحيات' :
                                           permission.permission_type === 'delegate_permissions' ? 'تفويض الصلاحيات' :
                                           permission.permission_type}
                                        </span>
                                        <div className="flex items-center gap-1">
                                          {permission.permission_value ? (
                                            <FiCheck className="w-3 h-3 text-green-600" />
                                          ) : (
                                            <FiX className="w-3 h-3 text-red-600" />
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  {/* تبويب التفويض */}
                  <TabsContent value="delegations" className="space-y-6">
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <div className="flex items-start space-x-3 rtl:space-x-reverse">
                        <FiUsers className="w-5 h-5 text-purple-600 mt-0.5" />
                        <div>
                          <h3 className="text-lg font-semibold text-purple-900 mb-2">إدارة التفويض</h3>
                          <p className="text-purple-800 text-sm leading-relaxed">
                            إدارة تفويض الصلاحيات بين المخازن. يمكن للمخازن ذات المستوى الأعلى تفويض صلاحيات محددة للمخازن التابعة لها، مع إمكانية تحديد مدة التفويض والصلاحيات المفوضة.
                          </p>
                        </div>
                      </div>
                    </div>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <div className="flex items-center">
                            <FiUsers className="w-5 h-5 mr-2" />
                            تفويض الصلاحيات
                          </div>
                          <Button onClick={() => openAddDialog('delegation')}>
                            <FiPlus className="w-4 h-4 mr-2" />
                            تفويض جديد
                          </Button>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {delegations.length === 0 ? (
                          <div className="text-center py-8">
                            <FiUsers className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد تفويضات</h3>
                            <p className="text-gray-600 mb-4">ابدأ بإنشاء تفويض جديد</p>
                            <Button onClick={() => openAddDialog('delegation')}>
                              <FiPlus className="w-4 h-4 mr-2" />
                              تفويض جديد
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {delegations.map((delegation) => {
                              const delegator = warehouses.find(w => String(w.id) === String(delegation.delegator_warehouse_id));
                              const delegatee = warehouses.find(w => String(w.id) === String(delegation.delegatee_warehouse_id));
                              return (
                                <Card key={delegation.id} className="border border-gray-200 shadow-sm">
                                  <CardHeader className="pb-3">
                                    <CardTitle className="flex items-center justify-between text-base">
                                      <div className="space-y-1">
                                        <div className="flex items-center gap-2 text-gray-800">
                                          <span className="font-semibold">من:</span>
                                          <span>{delegator?.name || 'غير معروف'}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-gray-800">
                                          <span className="font-semibold">إلى:</span>
                                          <span>{delegatee?.name || 'غير معروف'}</span>
                                        </div>
                                      </div>
                                      <Badge variant="outline" className="text-purple-600 border-purple-200 bg-purple-50">
                                        {delegation.delegation_level === 'full' ? 'تفويض كامل' :
                                         delegation.delegation_level === 'limited' ? 'تفويض محدود' :
                                         delegation.delegation_level === 'temporary' ? 'تفويض مؤقت' :
                                         delegation.delegation_level}
                                      </Badge>
                                    </CardTitle>
                                  </CardHeader>
                                  <CardContent className="space-y-3">
                                    <div>
                                      <Label className="text-sm text-gray-600">الصلاحيات المفوضة</Label>
                                      <div className="flex flex-wrap gap-2 mt-2">
                                        {(delegation.permission_types || []).map((permission) => (
                                          <Badge key={permission} variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
                                            {permission === 'create_warehouse' ? 'إنشاء مخزن' :
                                             permission === 'edit_warehouse' ? 'تعديل مخزن' :
                                             permission === 'delete_warehouse' ? 'حذف مخزن' :
                                             permission === 'view_reports' ? 'عرض التقارير' :
                                             permission === 'manage_permissions' ? 'إدارة الصلاحيات' :
                                             permission === 'delegate_permissions' ? 'تفويض الصلاحيات' : permission}
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>
                                    {delegation.expires_at && (
                                      <p className="text-sm text-gray-500">
                                        ينتهي في: {new Date(delegation.expires_at).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' })}
                                      </p>
                                    )}
                                    <div className="flex items-center justify-end gap-2 pt-2 border-t">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => openEditDialog(delegation)}
                                        className="flex items-center gap-1"
                                      >
                                        <FiEdit3 className="w-4 h-4" />
                                        تعديل
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleDeleteDelegation(delegation.id)}
                                        className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                                      >
                                        <FiTrash2 className="w-4 h-4" />
                                        حذف
                                      </Button>
                                    </div>
                                  </CardContent>
                                </Card>
                              );
                            })}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* تبويب التقارير */}
                  <TabsContent value="reports" className="space-y-6">
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                      <div className="flex items-start space-x-3 rtl:space-x-reverse">
                        <FiBarChart className="w-5 h-5 text-orange-600 mt-0.5" />
                        <div>
                          <h3 className="text-lg font-semibold text-orange-900 mb-2">التقارير الهرمية</h3>
                          <p className="text-orange-800 text-sm leading-relaxed">
                            تقارير شاملة عن النظام الهرمي للمخازن، تشمل إحصائيات المخازن، الصلاحيات، التفويض، والأداء العام للنظام.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <Card>
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-600">إجمالي المخازن</p>
                              <p className="text-2xl font-bold text-gray-900">{warehouses.length}</p>
                            </div>
                            <FiLayers className="w-8 h-8 text-blue-600" />
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-600">مخازن الدولة</p>
                              <p className="text-2xl font-bold text-gray-900">
                                {warehouses.filter(w => w.level?.code === 'country').length}
                              </p>
                            </div>
                            <FiStar className="w-8 h-8 text-blue-600" />
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-600">مخازن المدن</p>
                              <p className="text-2xl font-bold text-gray-900">
                                {warehouses.filter(w => w.level?.code === 'city').length}
                              </p>
                            </div>
                            <FiPackage className="w-8 h-8 text-green-600" />
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-600">مخازن المناطق</p>
                              <p className="text-2xl font-bold text-gray-900">
                                {warehouses.filter(w => w.level?.code === 'district').length}
                              </p>
                            </div>
                            <FiTag className="w-8 h-8 text-purple-600" />
                          </div>
                        </CardContent>
                      </Card>
            </div>
                  </TabsContent>
                </Tabs>
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>

        {/* Universal Dialog for Delegation */}
        <UniversalDialog
          isOpen={dialogOpen}
          onClose={() => {
            setDialogOpen(false);
            setEditingDelegation(null);
          }}
          title={dialogTitle}
          type={dialogType}
          onSubmit={handleDelegationSubmit}
          loading={dialogLoading}
          initialData={editingDelegation ? {
            id: editingDelegation.id,
            delegator_warehouse_id: String(editingDelegation.delegator_warehouse_id),
            delegatee_warehouse_id: String(editingDelegation.delegatee_warehouse_id),
            permission_types: editingDelegation.permission_types || [],
            delegation_level: editingDelegation.delegation_level,
            expires_at: editingDelegation.expires_at || ''
          } : {}}
          warehouseLevels={warehouseLevels}
          warehouses={warehouses.map(w => ({ ...w, id: String(w.id), level_id: w.level_id || '0', parent_warehouse_id: w.parent_warehouse_id ? String(w.parent_warehouse_id) : undefined }))}
        />

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
              <AlertDialogDescription>
                هل أنت متأكد من حذف هذا التفويض؟ لا يمكن التراجع عن هذه العملية.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => {
                setDeleteDialogOpen(false);
                setDelegationToDelete(null);
              }}>
                إلغاء
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDeleteDelegation}
                className="bg-red-600 hover:bg-red-700"
              >
                حذف
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        {/* Delete Warehouse Confirmation Dialog */}
        <AlertDialog open={warehouseDeleteDialogOpen} onOpenChange={setWarehouseDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>تأكيد حذف المخزن</AlertDialogTitle>
              <AlertDialogDescription>
                هل أنت متأكد من حذف هذا المخزن؟ سيتم إلغاء تنشيطه ولن يظهر في الهيكل. لا يمكن التراجع.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => {
                setWarehouseDeleteDialogOpen(false);
                setWarehouseToDelete(null);
              }}>
                إلغاء
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDeleteWarehouse}
                className="bg-red-600 hover:bg-red-700"
              >
                حذف
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {warehouseToEdit && (
          <PermissionsEditDialog
            open={editDialogOpen}
            onClose={() => setEditDialogOpen(false)}
            warehouse={warehouseToEdit}
            onPermissionUpdate={handlePermissionUpdate}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
