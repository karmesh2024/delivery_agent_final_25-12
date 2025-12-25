import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  fetchGroups,
  addGroup,
  updateGroup,
  deleteGroup,
  fetchGroupMembers,
  addGroupMember,
  removeGroupMember,
  setSelectedGroup,
  clearGroupsError,
} from '@/store/groupsSlice';
import { AdminGroup, GroupData, groupsApi } from '@/services/groupsApi';
import { Admin } from '@/domains/admins/types/index';
import { adminsApi } from '@/services/adminsApi';
import { useToast } from '@/shared/ui/toast';

// مكونات واجهة المستخدم (افتراضية, قد تحتاج للتعديل حسب مكتبة UI المستخدمة)
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/shared/components/ui/card';
import { FiPlus, FiEdit, FiTrash2, FiUsers, FiX } from 'react-icons/fi';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/StyledSelect';
import { Label } from "@/shared/components/ui/label";
import { UniversalDialog } from '@/shared/components/ui/universal-dialog';
import { FormDialog } from '@/shared/components/ui/FormDialog';

const GroupsManagement: React.FC = () => {
  const dispatch = useAppDispatch();
  const { groups, selectedGroup, selectedGroupMembers, loading, error } = useAppSelector(state => state.groups);
  const { currentAdmin } = useAppSelector(state => state.auth); // افتراض وجود معلومات المسؤول الحالي
  const { toast } = useToast(); // استخدام hook للحصول على دالة toast

  // حالة محلية لإدارة النوافذ المنبثقة والمدخلات
  const [isAddGroupModalOpen, setIsAddGroupModalOpen] = useState(false);
  const [isEditGroupModalOpen, setIsEditGroupModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isManageMembersModalOpen, setIsManageMembersModalOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [newGroupDepartmentId, setNewGroupDepartmentId] = useState<string | undefined>(undefined);
  const [availableAdmins, setAvailableAdmins] = useState<Admin[]>([]); // حالة لتخزين المسؤولين المتاحين
  const [selectedAdminToAdd, setSelectedAdminToAdd] = useState<string>(''); // حالة للمسؤول المختار للإضافة
  const [fetchingAdmins, setFetchingAdmins] = useState(false); // حالة تحميل المسؤولين

  // State for Departments
  const [availableDepartments, setAvailableDepartments] = useState<{ id: string; name: string; }[]>([]);
  const [fetchingDepartments, setFetchingDepartments] = useState(false);

  // جلب المجموعات عند تحميل المكون
  useEffect(() => {
    dispatch(fetchGroups());
  }, [dispatch]);

  // جلب الأعضاء عند تحديد مجموعة
  useEffect(() => {
    if (selectedGroup?.id) {
      dispatch(fetchGroupMembers(selectedGroup.id));
    }
  }, [dispatch, selectedGroup]);

  // جلب قائمة المسؤولين عند فتح نافذة إدارة الأعضاء
  useEffect(() => {
    if (isManageMembersModalOpen) {
      const fetchAdminsList = async () => {
        setFetchingAdmins(true);
        try {
          const admins = await adminsApi.getAdmins();
          // فلترة المسؤول الحالي إذا لم يكن super_admin (اختياري)
          const filteredAdmins = currentAdmin?.role !== 'super_admin'
            ? admins.filter(admin => admin.id !== currentAdmin?.id)
            : admins;
          setAvailableAdmins(filteredAdmins);
        } catch (err) {
          console.error("Failed to fetch admins:", err);
          // يمكنك إضافة معالجة خطأ هنا (مثل عرض رسالة)
        } finally {
          setFetchingAdmins(false);
        }
      };
      fetchAdminsList();
    }
  }, [isManageMembersModalOpen, currentAdmin]);

  // Fetch departments when Add or Edit modal opens
  useEffect(() => {
    if (isAddGroupModalOpen || isEditGroupModalOpen) {
      const fetchDepartmentsList = async () => {
        setFetchingDepartments(true);
        try {
          const departments = await adminsApi.getDepartments();
          setAvailableDepartments(departments);
        } catch (err) {
          console.error("Failed to fetch departments:", err);
        } finally {
          setFetchingDepartments(false);
        }
      };
      fetchDepartmentsList();
    }
  }, [isAddGroupModalOpen, isEditGroupModalOpen]);

  // دوال التعامل مع الأحداث (سيتم تفصيلها لاحقاً)
  const handleAddGroupClick = () => {
    setNewGroupName('');
    setNewGroupDescription('');
    setNewGroupDepartmentId(undefined); // <-- إعادة تعيين القسم
    setIsAddGroupModalOpen(true);
  };

  const handleEditGroupClick = (group: AdminGroup) => {
    dispatch(setSelectedGroup(group));
    setNewGroupName(group.name);
    setNewGroupDescription(group.description || '');
    setNewGroupDepartmentId(group.department_id || undefined); // <-- تعيين القسم الحالي
    setIsEditGroupModalOpen(true);
  };

  const handleDeleteGroupClick = (group: AdminGroup) => {
    dispatch(setSelectedGroup(group));
    setIsDeleteConfirmOpen(true);
  };

  const handleManageMembersClick = (group: AdminGroup) => {
    dispatch(setSelectedGroup(group));
    setSelectedAdminToAdd(''); // إعادة تعيين المختار عند فتح النافذة
    setIsManageMembersModalOpen(true);
    // سيتم جلب المسؤولين بواسطة useEffect أعلاه
  };

  const handleAddGroupSubmit = () => {
    if (newGroupName) {
      // بناء كائن البيانات ديناميكيًا
      const groupData: Partial<GroupData> & { name: string } = {
        name: newGroupName,
        description: newGroupDescription || undefined, // أرسل undefined للوصف الفارغ بدل سلسلة فارغة إذا أردت
      };

      // إضافة department_id فقط إذا كان له قيمة
      if (newGroupDepartmentId) {
        groupData.department_id = newGroupDepartmentId;
      }

      // تأكد من أن GroupData في groupsApi.ts تسمح بـ description?: string | undefined
      // وأنها تسمح بـ department_id?: string | null | undefined

      dispatch(addGroup(groupData as GroupData)) // قد نحتاج لتأكيد النوع هنا لأننا بنيناه جزئيًا
        .unwrap()
        .then(() => {
          setIsAddGroupModalOpen(false);
        })
        .catch((err: unknown) => {
           toast({ type: 'error', title: 'خطأ', description: `فشل إضافة المجموعة: ${(err as Error).message || err}` });
        });
    }
  };

  const handleEditGroupSubmit = () => {
    if (selectedGroup && newGroupName) {
       // بناء كائن البيانات ديناميكيًا
      const groupData: Partial<GroupData> & { name: string } = {
        name: newGroupName,
        description: newGroupDescription || undefined,
      };

      // إضافة department_id فقط إذا كان له قيمة
      if (newGroupDepartmentId) {
        groupData.department_id = newGroupDepartmentId;
      } else {
        // إذا أردت تعيينه إلى null بشكل صريح عند التعديل بدلاً من حذفه
        // يمكنك إضافة: groupData.department_id = null;
        // ولكن حذفه سيسمح لـ Supabase بالتعامل معه كـ null إذا كان العمود nullable
      }

      dispatch(updateGroup({ groupId: selectedGroup.id, groupData: groupData as GroupData }))
       .unwrap()
        .then(() => {
          setIsEditGroupModalOpen(false);
        })
        .catch((err: unknown) => {
           toast({ type: 'error', title: 'خطأ', description: `فشل تعديل المجموعة: ${(err as Error).message || err}` });
        });
    }
  };

  const handleDeleteGroupConfirm = () => {
    if (selectedGroup) {
      dispatch(deleteGroup(selectedGroup.id));
      setIsDeleteConfirmOpen(false);
    }
  };

  // --- دوال إدارة الأعضاء (محدثة) ---
  const handleAddMemberSubmit = () => {
    if (selectedGroup && selectedAdminToAdd) {
      dispatch(addGroupMember({ groupId: selectedGroup.id, adminId: selectedAdminToAdd }))
        .unwrap() // يسمح باستخدام .then() و .catch()
        .then(() => {
          // إعادة جلب الأعضاء بعد الإضافة بنجاح
          dispatch(fetchGroupMembers(selectedGroup.id));
          setSelectedAdminToAdd(''); // إعادة تعيين المختار
        })
        .catch((err: unknown) => {
          console.error("Failed to add member:", err);
          // عرض رسالة خطأ للمستخدم (يمكن تحسينها)
          toast({ type: 'error', title: 'خطأ', description: `فشل إضافة العضو: ${(err as Error).message || err}` });
        });
    }
  };

  const handleRemoveMember = (adminId: string) => {
    if (selectedGroup) {
      dispatch(removeGroupMember({ groupId: selectedGroup.id, adminId }))
        .unwrap()
        .then(() => {
          // إعادة جلب الأعضاء بعد الحذف بنجاح
          dispatch(fetchGroupMembers(selectedGroup.id));
        })
        .catch((err: unknown) => {
          console.error("Failed to remove member:", err);
          toast({ type: 'error', title: 'خطأ', description: `فشل حذف العضو: ${(err as Error).message || err}` });
        });
    }
  };

  // حساب المسؤولين الذين يمكن إضافتهم (ليسوا أعضاء بالفعل)
  const adminsToAdd = React.useMemo(() => {
    const memberIds = new Set(selectedGroupMembers.map(member => member.id));
    return availableAdmins.filter(admin => !memberIds.has(admin.id));
  }, [availableAdmins, selectedGroupMembers]);

  // هيكل العرض الأساسي
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">إدارة مجموعات المسؤولين</h2>
        <Button onClick={handleAddGroupClick} className="flex items-center gap-2">
          <FiPlus />
          إضافة مجموعة جديدة
        </Button>
      </div>

      {/* عرض رسائل الخطأ */}
      {error && (
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          خطأ: {error}
          <button onClick={() => dispatch(clearGroupsError())} className="ml-4 font-bold">إغلاق</button>
        </div>
      )}

      {/* عرض حالة التحميل */}
      {loading && <p>جاري التحميل...</p>}

      {/* قائمة المجموعات */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {groups.map((group) => (
          <Card key={group.id}>
            <CardHeader>
              <CardTitle>{group.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">{group.description || 'لا يوجد وصف'}</p>
              {/* يمكن إضافة عدد الأعضاء هنا لاحقاً */}
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => handleManageMembersClick(group)} className="flex items-center gap-1">
                <FiUsers className="h-4 w-4" /> إدارة الأعضاء
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleEditGroupClick(group)} className="flex items-center gap-1">
                <FiEdit className="h-4 w-4" /> تعديل
              </Button>
              <Button variant="destructive" size="sm" onClick={() => handleDeleteGroupClick(group)} className="flex items-center gap-1">
                <FiTrash2 className="h-4 w-4" /> حذف
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Add Group Dialog using FormDialog and StyledSelect */}
      <FormDialog
        isOpen={isAddGroupModalOpen}
        onClose={() => setIsAddGroupModalOpen(false)} // يمكن استخدام onClose في FormDialog لاحقًا
        title="إضافة مجموعة جديدة"
        footer={(
          <>
            <Button
              variant="outline"
              onClick={() => setIsAddGroupModalOpen(false)}
            >
              إلغاء
            </Button>
            <Button
              onClick={handleAddGroupSubmit}
              disabled={!newGroupName || loading}
            >
              إضافة
            </Button>
          </>
        )}
      >
        {/* محتوى النموذج يوضع هنا كـ children */}
        <div>
          <label htmlFor="newGroupName" className="block text-sm font-medium mb-1" />
          <Input
            id="newGroupName"
            placeholder="اسم المجموعة"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            className="bg-white"
          />
        </div>
        <div>
          <label htmlFor="newGroupDesc" className="block text-sm font-medium mb-1" />
          <Input
            id="newGroupDesc"
            placeholder="الوصف (اختياري)"
            value={newGroupDescription}
            onChange={(e) => setNewGroupDescription(e.target.value)}
            className="bg-white"
          />
        </div>
        <div>
          <label htmlFor="newGroupDept" className="block text-sm font-medium mb-1" />
          <Select
            value={newGroupDepartmentId}
            onValueChange={(value) => setNewGroupDepartmentId(value === 'none' ? undefined : value)}
          >
            <SelectTrigger id="newGroupDept">
              <SelectValue placeholder={fetchingDepartments ? "جاري تحميل الأقسام..." : "اختر قسمًا..."} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">-- بلا قسم --</SelectItem>
              {availableDepartments.map((dept) => (
                <SelectItem key={dept.id} value={dept.id}>
                  {dept.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </FormDialog>

      {/* Edit Group Dialog using FormDialog and StyledSelect */}
       <FormDialog
        isOpen={isEditGroupModalOpen}
        onClose={() => setIsEditGroupModalOpen(false)}
        title={`تعديل المجموعة: ${selectedGroup?.name || ''}`}
        footer={(
          <>
            <Button
              variant="outline"
              onClick={() => setIsEditGroupModalOpen(false)}
            >
              إلغاء
            </Button>
            <Button
              onClick={handleEditGroupSubmit}
              disabled={!newGroupName || loading}
            >
              حفظ التغييرات
            </Button>
          </>
        )}
      >
        {/* محتوى النموذج */}
         <div>
            <label htmlFor="editGroupName" className="block text-sm font-medium mb-1" />
            <Input
              id="editGroupName"
              placeholder="اسم المجموعة"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              className="bg-white"
            />
          </div>
          <div>
            <label htmlFor="editGroupDesc" className="block text-sm font-medium mb-1" />
            <Input
              id="editGroupDesc"
              placeholder="الوصف (اختياري)"
              value={newGroupDescription}
              onChange={(e) => setNewGroupDescription(e.target.value)}
              className="bg-white"
            />
          </div>
          <div>
            <label htmlFor="editGroupDept" className="block text-sm font-medium mb-1" />
            <Select
              value={newGroupDepartmentId}
              onValueChange={(value) => setNewGroupDepartmentId(value === 'none' ? undefined : value)}
            >
              <SelectTrigger id="editGroupDept">
                <SelectValue placeholder={fetchingDepartments ? "جاري تحميل الأقسام..." : "اختر قسمًا..."} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">-- بلا قسم --</SelectItem>
                {availableDepartments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
      </FormDialog>

      {/* Delete Confirm Dialog (using UniversalDialog component) */}
      <UniversalDialog
        isOpen={isDeleteConfirmOpen}
        title="تأكيد الحذف"
        description={`هل أنت متأكد من رغبتك في حذف المجموعة "${selectedGroup?.name}"؟ لا يمكن التراجع عن هذا الإجراء.`}
        confirmText="تأكيد الحذف"
        cancelText="إلغاء"
        onConfirm={handleDeleteGroupConfirm}
        onCancel={() => setIsDeleteConfirmOpen(false)}
      />

      {/* Manage Members Dialog (Using FormDialog, remove explicit maxWidth) */}
      <FormDialog
        isOpen={isManageMembersModalOpen}
        onClose={() => setIsManageMembersModalOpen(false)}
        title={`إدارة أعضاء المجموعة: ${selectedGroup?.name || ''}`}
        footer={(
          <Button variant="outline" onClick={() => setIsManageMembersModalOpen(false)}>إغلاق</Button>
        )}
      >
        {/* محتوى النافذة هنا كـ children */}
        <div className="py-4 space-y-6"> {/* Use space-y-6 for consistency? */}
          <div>
            <h3 className="text-lg font-semibold mb-3">الأعضاء الحاليون</h3>
            {loading && selectedGroupMembers.length === 0 ? (
              <p>جاري تحميل الأعضاء...</p>
            ) : selectedGroupMembers.length > 0 ? (
              <ul className="max-h-48 overflow-y-auto pr-2">
                {selectedGroupMembers.map((member) => (
                  <li key={member.id} className="flex justify-between items-center py-2 border-b last:border-b-0">
                    <span>{member.full_name || member.email || member.username}</span>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:bg-red-100" onClick={() => handleRemoveMember(member.id)} title="إزالة العضو">
                      <FiX className="h-4 w-4"/>
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">لا يوجد أعضاء في هذه المجموعة.</p>
            )}
          </div>
          <hr />
          <div>
            <h3 className="text-lg font-semibold mb-3">إضافة عضو جديد</h3>
            {fetchingAdmins ? (
              <p>جاري تحميل قائمة المسؤولين...</p>
            ) : adminsToAdd.length > 0 ? (
              <div className="flex items-center gap-2">
                <Select value={selectedAdminToAdd} onValueChange={setSelectedAdminToAdd}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="اختر مسؤولاً لإضافته..." />
                  </SelectTrigger>
                  <SelectContent>
                    {adminsToAdd.map((admin) => (
                      <SelectItem key={admin.id} value={admin.id}>
                        {admin.full_name || admin.email || admin.username} ({admin.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={handleAddMemberSubmit} disabled={!selectedAdminToAdd || loading}>
                  <FiPlus className="mr-1 h-4 w-4" /> إضافة
                </Button>
              </div>
            ) : (
              <p className="text-gray-500">لا يوجد مسؤولون متاحون للإضافة (جميعهم أعضاء بالفعل أو لا يوجد مسؤولون).</p>
            )}
          </div>
        </div>
      </FormDialog>

    </div>
  );
};

export default GroupsManagement; 