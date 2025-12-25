"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { createOrgUnit, deleteOrgUnit, fetchOrgTree, selectHrState, updateOrgUnit, createJobTitle, updateJobTitle, deleteJobTitle, fetchJobTitlesByOrgUnit, assignOrgMember, unassignOrgMember, fetchOrgMembersByOrgUnit, fetchOrgMembersByAdmin, grantOrgUnitPermission, revokeOrgUnitPermission, fetchOrgUnitPermissions, grantJobTitlePermission, revokeJobTitlePermission, fetchJobTitlePermissions } from '@/domains/hr/store/hrSlice';
import { JobTitle, OrgUnit, OrgMember, OrgUnitPermission, JobTitlePermission } from '@/domains/hr/domain/types';
import { UniversalDialog } from '@/shared/components/ui/universal-dialog';
import OrgUnitForm from './OrgUnitForm';
import OrgTreeDisplay from './OrgTreeDisplay';
import { AlertDialog, AlertDialogTrigger } from '@radix-ui/react-alert-dialog';
import { AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/shared/components/ui/custom-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@radix-ui/react-tooltip';
import { FiEdit, FiInfo, FiTrash2 } from 'react-icons/fi';
import JobTitleForm from './JobTitleForm';
import { OrgUnitTreeNode } from './OrgTreeDisplay';
import OrgMemberForm from './OrgMemberForm';
import OrgUnitPermissionForm from './OrgUnitPermissionForm';
import JobTitlePermissionForm from './JobTitlePermissionForm';
import { fetchAdmins } from '@/store/adminsSlice';

export default function HRManagement() {
  const dispatch = useAppDispatch();
  const { tree, jobTitlesByUnit, membersByUnit, unitPermissions, titlePermissions, loading, error } = useAppSelector(selectHrState);
  const { items: admins } = useAppSelector(state => state.admins); // Get admins from Redux

  const [isAddEditDialogOpen, setIsAddEditDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingOrgUnit, setEditingOrgUnit] = useState<OrgUnit | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingOrgUnitId, setDeletingOrgUnitId] = useState<string | null>(null);

  const [isAddJobTitleDialogOpen, setIsAddJobTitleDialogOpen] = useState(false);
  const [isEditJobTitleDialogOpen, setIsEditJobTitleDialogOpen] = useState(false);
  const [editingJobTitle, setEditingJobTitle] = useState<JobTitle | null>(null);
  const [isDeleteJobTitleDialogOpen, setIsDeleteJobTitleDialogOpen] = useState(false);
  const [deletingJobTitleId, setDeletingJobTitleId] = useState<string | null>(null);
  const [selectedOrgUnitIdForJobTitles, setSelectedOrgUnitIdForJobTitles] = useState<string | null>(null);

  const [isAssignMemberDialogOpen, setIsAssignMemberDialogOpen] = useState(false);
  const [assigningOrgMember, setAssigningOrgMember] = useState<Partial<Omit<OrgMember, 'id' | 'createdAt'>> | null>(null);
  const [isDeleteMemberDialogOpen, setIsDeleteMemberDialogOpen] = useState(false);
  const [deletingOrgMemberId, setDeletingOrgMemberId] = useState<string | null>(null);
  const [selectedOrgUnitIdForMembers, setSelectedOrgUnitIdForMembers] = useState<string | null>(null);

  const [isGrantUnitPermissionDialogOpen, setIsGrantUnitPermissionDialogOpen] = useState(false);
  const [grantingOrgUnitPermission, setGrantingOrgUnitPermission] = useState<Partial<Omit<OrgUnitPermission, 'id'>> | null>(null);
  const [isRevokeUnitPermissionDialogOpen, setIsRevokeUnitPermissionDialogOpen] = useState(false);
  const [revokingOrgUnitPermission, setRevokingOrgUnitPermission] = useState<{ orgUnitId: string; permissionId: string } | null>(null);
  const [selectedOrgUnitIdForUnitPermissions, setSelectedOrgUnitIdForUnitPermissions] = useState<string | null>(null);

  const [isGrantJobTitlePermissionDialogOpen, setIsGrantJobTitlePermissionDialogOpen] = useState(false);
  const [grantingJobTitlePermission, setGrantingJobTitlePermission] = useState<Partial<Omit<JobTitlePermission, 'id'>> | null>(null);
  const [isRevokeJobTitlePermissionDialogOpen, setIsRevokeJobTitlePermissionDialogOpen] = useState(false);
  const [revokingJobTitlePermission, setRevokingJobTitlePermission] = useState<{ jobTitleId: string; permissionId: string } | null>(null);
  const [selectedJobTitleIdForJobTitlePermissions, setSelectedJobTitleIdForJobTitlePermissions] = useState<string | null>(null);

  // Dummy Permissions (Replace with actual data fetching later)
  const dummyPermissions = [
    { id: "perm1-uuid", name: "إدارة المستخدمين" },
    { id: "perm2-uuid", name: "عرض التقارير" },
    { id: "perm3-uuid", name: "إدارة المنتجات" },
    { id: "perm4-uuid", name: "إدارة الصلاحيات" },
  ];

  const blurActiveElement = () => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  };

  React.useEffect(() => {
    dispatch(fetchOrgTree()).then((action) => {
      if (fetchOrgTree.fulfilled.match(action)) {
        const fetchedTree = action.payload;
        // جلب المسميات الوظيفية لكل وحدة تنظيمية في الشجرة
        const fetchJobTitlesForTree = (nodes: OrgUnitTreeNode[]) => {
          nodes.forEach(node => {
            dispatch(fetchJobTitlesByOrgUnit(node.id));
            dispatch(fetchOrgMembersByOrgUnit(node.id)); // جلب الأعضاء أيضًا
            if (node.children) {
              fetchJobTitlesForTree(node.children);
            }
          });
        };
        fetchJobTitlesForTree(fetchedTree);

        // جلب صلاحيات الوحدة التنظيمية لكل وحدة في الشجرة
        const fetchUnitPermissionsForTree = (nodes: OrgUnitTreeNode[]) => {
          nodes.forEach(node => {
            dispatch(fetchOrgUnitPermissions(node.id));
            if (node.children) {
              fetchUnitPermissionsForTree(node.children);
            }
          });
        };
        fetchUnitPermissionsForTree(fetchedTree);

        // جلب صلاحيات المسميات الوظيفية لكل مسمى وظيفي في الشجرة
        const allJobTitles = fetchedTree.flatMap(node => jobTitlesByUnit[node.id] || []);
        allJobTitles.forEach(jobTitle => {
          dispatch(fetchJobTitlePermissions(jobTitle.id));
        });
      }
    });

    // جلب قائمة المسؤولين
    dispatch(fetchAdmins());

  }, [dispatch]);

  // Org Unit Handlers
  const handleAddOrgUnit = (values: Omit<OrgUnit, 'id' | 'createdAt' | 'updatedAt' | 'isActive'> & { isActive?: boolean }) => {
    dispatch(createOrgUnit(values)).then(() => {
      setIsAddEditDialogOpen(false);
      dispatch(fetchOrgTree());
    });
  };

  const handleEditOrgUnit = (id: string, values: Partial<Omit<OrgUnit, 'id' | 'createdAt'>>) => {
    dispatch(updateOrgUnit({ id, updates: values })).then(() => {
      setIsEditDialogOpen(false);
      setEditingOrgUnit(null);
      dispatch(fetchOrgTree());
    });
  };

  const handleDeleteOrgUnit = () => {
    if (deletingOrgUnitId) {
      dispatch(deleteOrgUnit(deletingOrgUnitId)).then(() => {
        setIsDeleteDialogOpen(false);
        setDeletingOrgUnitId(null);
        dispatch(fetchOrgTree());
      });
    }
  };

  const openEditOrgUnitDialog = (unit: OrgUnit) => {
    setEditingOrgUnit(unit);
    setIsEditDialogOpen(true);
    blurActiveElement();
  };

  const openDeleteOrgUnitDialog = (unitId: string) => {
    setDeletingOrgUnitId(unitId);
    setIsDeleteDialogOpen(true);
    blurActiveElement();
  };

  const handleRefreshTree = () => {
    dispatch(fetchOrgTree());
  };

  // Job Title Handlers
  const handleAddJobTitle = (values: Omit<JobTitle, 'id' | 'createdAt' | 'isActive'> & { isActive?: boolean }) => {
    dispatch(createJobTitle(values)).then(() => {
      setIsAddJobTitleDialogOpen(false);
      if (values.orgUnitId) {
        dispatch(fetchJobTitlesByOrgUnit(values.orgUnitId));
        // عند إضافة مسمى وظيفي جديد، قم بتحديث قائمة الأعضاء للوحدة التنظيمية
        dispatch(fetchOrgMembersByOrgUnit(values.orgUnitId));
      }
    });
  };

  const handleEditJobTitle = (id: string, values: Partial<Omit<JobTitle, 'id' | 'createdAt'>>) => {
    dispatch(updateJobTitle({ id, updates: values })).then(() => {
      setIsEditJobTitleDialogOpen(false);
      setEditingJobTitle(null);
      if (values.orgUnitId) {
        dispatch(fetchJobTitlesByOrgUnit(values.orgUnitId));
      }
    });
  };

  const handleDeleteJobTitle = () => {
    if (deletingJobTitleId && editingJobTitle?.orgUnitId) {
      const orgUnitId = editingJobTitle.orgUnitId;
      dispatch(deleteJobTitle(deletingJobTitleId)).then(() => {
        setIsDeleteJobTitleDialogOpen(false);
        setDeletingJobTitleId(null);
        dispatch(fetchJobTitlesByOrgUnit(orgUnitId));
      });
    }
  };

  const openAddJobTitleDialog = (orgUnitId: string | null = null) => {
    setSelectedOrgUnitIdForJobTitles(orgUnitId);
    setIsAddJobTitleDialogOpen(true);
    blurActiveElement();
  };

  const openEditJobTitleDialog = (jobTitle: JobTitle) => {
    setEditingJobTitle(jobTitle);
    setIsEditJobTitleDialogOpen(true);
    blurActiveElement();
  };

  const openDeleteJobTitleDialog = (jobTitle: JobTitle) => {
    setDeletingJobTitleId(jobTitle.id);
    setEditingJobTitle(jobTitle); // نحتاج orgUnitId
    setIsDeleteJobTitleDialogOpen(true);
    blurActiveElement();
  };

  // Effect لجلب المسميات الوظيفية عند اختيار وحدة تنظيمية
  React.useEffect(() => {
    if (selectedOrgUnitIdForJobTitles) {
      dispatch(fetchJobTitlesByOrgUnit(selectedOrgUnitIdForJobTitles));
    }
  }, [dispatch, selectedOrgUnitIdForJobTitles]);

  // Org Member Handlers
  const handleAssignOrgMember = (values: Omit<OrgMember, 'id' | 'createdAt'> & { isPrimary?: boolean }) => {
    console.log('[HRManagement] Attempting to assign org member with values:', values);
    dispatch(assignOrgMember(values)).then((action) => {
      if (assignOrgMember.fulfilled.match(action)) {
        console.log('[HRManagement] Org member assignment fulfilled. Closing dialog.');
        setIsAssignMemberDialogOpen(false);
        setAssigningOrgMember(null);
        if (values.orgUnitId) {
          dispatch(fetchOrgMembersByOrgUnit(values.orgUnitId));
        }
      } else if (assignOrgMember.rejected.match(action)) {
        console.error('[HRManagement] Org member assignment rejected:', action.payload);
      }
    });
  };

  const handleDeleteOrgMember = () => {
    if (deletingOrgMemberId) {
      dispatch(unassignOrgMember(deletingOrgMemberId)).then(() => {
        setIsDeleteMemberDialogOpen(false);
        setDeletingOrgMemberId(null);
        if (assigningOrgMember?.orgUnitId) {
          dispatch(fetchOrgMembersByOrgUnit(assigningOrgMember.orgUnitId));
        }
      });
    }
  };

  const openAssignMemberDialog = (orgUnitId: string | null = null) => {
    setSelectedOrgUnitIdForMembers(orgUnitId);
    setAssigningOrgMember({ orgUnitId: orgUnitId || null, adminId: null, jobTitleId: null, isPrimary: false });
    setIsAssignMemberDialogOpen(true);
    blurActiveElement();
  };

  const openDeleteOrgMemberDialog = (member: OrgMember) => {
    setDeletingOrgMemberId(member.id);
    setAssigningOrgMember(member); // نحتاج orgUnitId و adminId
    setIsDeleteMemberDialogOpen(true);
    blurActiveElement();
  };

  // Effect لجلب الأعضاء عند اختيار وحدة تنظيمية
  React.useEffect(() => {
    if (selectedOrgUnitIdForMembers) {
      dispatch(fetchOrgMembersByOrgUnit(selectedOrgUnitIdForMembers));
    }
  }, [dispatch, selectedOrgUnitIdForMembers]);

  // Permission Handlers
  const handleGrantOrgUnitPermission = (values: Omit<OrgUnitPermission, 'id'>) => {
    dispatch(grantOrgUnitPermission(values)).then(() => {
      setIsGrantUnitPermissionDialogOpen(false);
      setGrantingOrgUnitPermission(null);
      dispatch(fetchOrgUnitPermissions(values.orgUnitId));
    });
  };

  const handleRevokeOrgUnitPermission = () => {
    if (revokingOrgUnitPermission) {
      dispatch(revokeOrgUnitPermission(revokingOrgUnitPermission)).then(() => {
        setIsRevokeUnitPermissionDialogOpen(false);
        setRevokingOrgUnitPermission(null);
        dispatch(fetchOrgUnitPermissions(revokingOrgUnitPermission.orgUnitId));
      });
    }
  };

  const openGrantUnitPermissionDialog = (orgUnitId: string | null = null) => {
    setSelectedOrgUnitIdForUnitPermissions(orgUnitId);
    setGrantingOrgUnitPermission({ orgUnitId: orgUnitId || '', permissionId: '', inherited: true });
    setIsGrantUnitPermissionDialogOpen(true);
    blurActiveElement();
  };

  const openRevokeUnitPermissionDialog = (permission: { orgUnitId: string; permissionId: string }) => {
    setRevokingOrgUnitPermission(permission);
    setIsRevokeUnitPermissionDialogOpen(true);
    blurActiveElement();
  };

  // Effect لجلب صلاحيات الوحدة عند اختيار وحدة تنظيمية
  React.useEffect(() => {
    if (selectedOrgUnitIdForUnitPermissions) {
      dispatch(fetchOrgUnitPermissions(selectedOrgUnitIdForUnitPermissions));
    }
  }, [dispatch, selectedOrgUnitIdForUnitPermissions]);

  // Job Title Permission Handlers
  const handleGrantJobTitlePermission = (values: Omit<JobTitlePermission, 'id'>) => {
    dispatch(grantJobTitlePermission(values)).then(() => {
      setIsGrantJobTitlePermissionDialogOpen(false);
      setGrantingJobTitlePermission(null);
      dispatch(fetchJobTitlePermissions(values.jobTitleId));
    });
  };

  const handleRevokeJobTitlePermission = () => {
    if (revokingJobTitlePermission) {
      dispatch(revokeJobTitlePermission(revokingJobTitlePermission)).then(() => {
        setIsRevokeJobTitlePermissionDialogOpen(false);
        setRevokingJobTitlePermission(null);
        dispatch(fetchJobTitlePermissions(revokingJobTitlePermission.jobTitleId));
      });
    }
  };

  const openGrantJobTitlePermissionDialog = (jobTitleId: string | null = null) => {
    setSelectedJobTitleIdForJobTitlePermissions(jobTitleId);
    setGrantingJobTitlePermission({ jobTitleId: jobTitleId || '', permissionId: '' });
    setIsGrantJobTitlePermissionDialogOpen(true);
    blurActiveElement();
  };

  const openRevokeJobTitlePermissionDialog = (permission: { jobTitleId: string; permissionId: string }) => {
    setRevokingJobTitlePermission(permission);
    setIsRevokeJobTitlePermissionDialogOpen(true);
    blurActiveElement();
  };

  // Effect لجلب صلاحيات المسمى الوظيفي عند اختيار مسمى وظيفي
  React.useEffect(() => {
    if (selectedJobTitleIdForJobTitlePermissions) {
      dispatch(fetchJobTitlePermissions(selectedJobTitleIdForJobTitlePermissions));
    }
  }, [dispatch, selectedJobTitleIdForJobTitlePermissions]);


  return (
    <Card>
      <CardHeader>
        <CardTitle>إدارة الموارد البشرية</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* الهيكل التنظيمي */}
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">الهيكل التنظيمي</h3>
          <div className="space-x-2 rtl:space-x-reverse">
            <Button size="sm" onClick={() => { setIsAddEditDialogOpen(true); blurActiveElement(); }}>إضافة قسم</Button>
            <Button size="sm" variant="outline" onClick={handleRefreshTree}>تحديث</Button>
          </div>
        </div>
        {loading && <p>جاري التحميل...</p>}
        {error && <p className="text-red-500">خطأ: {error}</p>}
        {!loading && !error && (
          <OrgTreeDisplay tree={tree} onEdit={openEditOrgUnitDialog} onDelete={openDeleteOrgUnitDialog} />
        )}

        {/* Dialog لإضافة قسم جديد */}
        <UniversalDialog title="إضافة قسم جديد" description="املأ البيانات لإنشاء وحدة تنظيمية جديدة." isOpen={isAddEditDialogOpen} onCancel={() => setIsAddEditDialogOpen(false)}>
          <OrgUnitForm onSubmit={handleAddOrgUnit} initialData={{}} />
        </UniversalDialog>

        {/* Dialog لتعديل قسم */}
        {editingOrgUnit && (
          <UniversalDialog title="تعديل قسم" description="تعديل بيانات الوحدة التنظيمية." isOpen={isEditDialogOpen} onCancel={() => { setIsEditDialogOpen(false); setEditingOrgUnit(null); }}>
            <OrgUnitForm onSubmit={(values) => handleEditOrgUnit(editingOrgUnit.id, values)} initialData={editingOrgUnit} />
          </UniversalDialog>
        )}
        {/* Dialog لتأكيد الحذف */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
              <AlertDialogDescription>هل تريد بالتأكيد حذف هذه الوحدة التنظيمية؟ لا يمكن التراجع عن هذا الإجراء.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>إلغاء</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteOrgUnit}>حذف</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* المسميات الوظيفية */}
        <div className="flex items-center justify-between mt-8">
          <h3 className="font-semibold">المسميات الوظيفية</h3>
          <Button size="sm" onClick={() => { openAddJobTitleDialog(); blurActiveElement(); }}>إضافة مسمى وظيفي</Button>
        </div>
        {loading && <p>جاري تحميل المسميات...</p>}
        {error && <p className="text-red-500">خطأ: {error}</p>}
        {!loading && !error && (
          <div className="space-y-3">
            {Object.keys(jobTitlesByUnit).length === 0 ? (
              <p className="text-gray-500">لا توجد مسميات وظيفية لعرضها.</p>
            ) : (
              Object.entries(jobTitlesByUnit).map(([orgUnitId, jobTitles]) => (
                <Card key={orgUnitId} className="bg-gray-50">
                  <CardHeader className="py-2 px-4 border-b">
                    <CardTitle className="text-sm font-medium flex items-center">
                      {tree.find(unit => unit.id === orgUnitId)?.name || `وحدة ${orgUnitId}`}
                      <div className="flex-grow" />
                      <Button size="sm" variant="ghost" onClick={() => openAddJobTitleDialog(orgUnitId)}>إضافة مسمى للوحدة</Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    {jobTitles.length === 0 ? (
                      <p className="text-gray-500 text-sm">لا توجد مسميات وظيفية في هذه الوحدة.</p>
                    ) : (
                      <ul className="space-y-2">
                        {jobTitles.map(jobTitle => (
                          <li key={jobTitle.id} className="flex items-center justify-between text-sm bg-white p-2 rounded border">
                            <span>{jobTitle.name} {jobTitle.code ? `(${jobTitle.code})` : ''}</span>
                            <div className="space-x-2 rtl:space-x-reverse">
                              <Button variant="ghost" size="sm" onClick={() => openEditJobTitleDialog(jobTitle)}><FiEdit className="h-4 w-4 text-blue-500" /></Button>
                              <Button variant="ghost" size="sm" onClick={() => openDeleteJobTitleDialog(jobTitle)}><FiTrash2 className="h-4 w-4 text-red-500" /></Button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
        {/* Dialog لإضافة مسمى وظيفي جديد */}
        <UniversalDialog title="إضافة مسمى وظيفي جديد" description="املأ البيانات لإنشاء مسمى وظيفي جديد." isOpen={isAddJobTitleDialogOpen} onCancel={() => setIsAddJobTitleDialogOpen(false)}>
          <JobTitleForm onSubmit={handleAddJobTitle} initialData={selectedOrgUnitIdForJobTitles ? { orgUnitId: selectedOrgUnitIdForJobTitles } : {}} />
        </UniversalDialog>
        {/* Dialog لتعديل مسمى وظيفي */}
        {editingJobTitle && (
          <UniversalDialog title="تعديل مسمى وظيفي" description="تعديل بيانات المسمى الوظيفي." isOpen={isEditJobTitleDialogOpen} onCancel={() => { setIsEditJobTitleDialogOpen(false); setEditingJobTitle(null); }}>
            <JobTitleForm onSubmit={(values) => handleEditJobTitle(editingJobTitle.id, values)} initialData={editingJobTitle} />
          </UniversalDialog>
        )}
        {/* Dialog لتأكيد حذف مسمى وظيفي */}
        <AlertDialog open={isDeleteJobTitleDialogOpen} onOpenChange={setIsDeleteJobTitleDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
              <AlertDialogDescription>هل تريد بالتأكيد حذف هذا المسمى الوظيفي؟ لا يمكن التراجع عن هذا الإجراء.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>إلغاء</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteJobTitle}>حذف</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        {/* تعيين المسؤولين للوحدات */}
        <div className="flex items-center justify-between mt-8">
          <h3 className="font-semibold">تعيين المسؤولين</h3>
          <Button size="sm" onClick={() => { setIsAssignMemberDialogOpen(true); blurActiveElement(); }}>تعيين مسؤول</Button>
        </div>
        {loading && <p>جاري تحميل المسؤولين...</p>}
        {error && <p className="text-red-500">خطأ: {error}</p>}
        {!loading && !error && (
          <div className="space-y-3">
            {Object.keys(membersByUnit).length === 0 ? (
              <p className="text-gray-500 text-sm">لا يوجد أعضاء معينون لعرضهم.</p>
            ) : (
              Object.entries(membersByUnit).map(([orgUnitId, members]) => (
                <Card key={orgUnitId} className="bg-gray-50">
                  <CardHeader className="py-2 px-4 border-b">
                    <CardTitle className="text-sm font-medium flex items-center">
                      {tree.find(unit => unit.id === orgUnitId)?.name || `وحدة ${orgUnitId}`}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    {members.length === 0 ? (
                      <p className="text-gray-500 text-sm">لا يوجد أعضاء في هذه الوحدة.</p>
                    ) : (
                      <ul className="space-y-2">
                        {members.map(member => (
                          <li key={member.id} className="flex items-center justify-between text-sm bg-white p-2 rounded border">
                            <span>
                              {admins.find(admin => admin.id === member.adminId)?.name || `مسؤول ${member.adminId}`}
                              {member.jobTitleId ? ` - ${jobTitlesByUnit[member.orgUnitId]?.find(jt => jt.id === member.jobTitleId)?.name || ''}` : ''}
                              {member.isPrimary ? ' (أساسي)' : ''}
                            </span>
                            <div className="space-x-2 rtl:space-x-reverse">
                              <Button variant="ghost" size="sm" onClick={() => openDeleteOrgMemberDialog(member)}><FiTrash2 className="h-4 w-4 text-red-500" /></Button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
        {/* Dialog لتعيين مسؤول */}
        <UniversalDialog title="تعيين مسؤول إلى وحدة" description="اختر المسؤول والوحدة التنظيمية والمسمى الوظيفي لتعيينه." isOpen={isAssignMemberDialogOpen} onCancel={() => setIsAssignMemberDialogOpen(false)}>
          <OrgMemberForm onSubmit={handleAssignOrgMember} initialData={assigningOrgMember || {}} orgUnits={tree.flatMap(node => [node, ...(node.children || [])]).sort((a, b) => a.name.localeCompare(b.name))} jobTitles={Object.values(jobTitlesByUnit).flat().sort((a, b) => a.name.localeCompare(b.name))} admins={admins} />
        </UniversalDialog>
        {/* Dialog لتأكيد حذف عضو */}
        <AlertDialog open={isDeleteMemberDialogOpen} onOpenChange={setIsDeleteMemberDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
              <AlertDialogDescription>هل تريد بالتأكيد إلغاء تعيين هذا المسؤول؟ لا يمكن التراجع عن هذا الإجراء.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>إلغاء</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteOrgMember}>إلغاء التعيين</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
