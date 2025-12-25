import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { OrgMember, OrgUnit, OrgUnitTreeNode, JobTitle, OrgUnitPermission, JobTitlePermission } from '@/domains/hr/domain/types';

export interface HrState {
  tree: OrgUnitTreeNode[];
  jobTitlesByUnit: Record<string, JobTitle[]>;
  membersByUnit: Record<string, OrgMember[]>;
  unitPermissions: Record<string, OrgUnitPermission[]>;
  titlePermissions: Record<string, JobTitlePermission[]>;
  loading: boolean;
  error: string | null;
}

const initialState: HrState = {
  tree: [],
  jobTitlesByUnit: {},
  membersByUnit: {},
  unitPermissions: {},
  titlePermissions: {},
  loading: false,
  error: null,
};

const updateTree = (tree: OrgUnitTreeNode[], updatedNode: OrgUnit): OrgUnitTreeNode[] => {
  return tree.map(node => {
    if (node.id === updatedNode.id) {
      return { ...node, ...updatedNode };
    } else if (node.children) {
      return { ...node, children: updateTree(node.children, updatedNode) };
    }
    return node;
  });
};

const removeNodeFromTree = (tree: OrgUnitTreeNode[], nodeId: string): OrgUnitTreeNode[] => {
  return tree.filter(node => node.id !== nodeId).map(node => {
    if (node.children) {
      return { ...node, children: removeNodeFromTree(node.children, nodeId) };
    }
    return node;
  });
};

// Async thunks للوحدات التنظيمية
export const createOrgUnit = createAsyncThunk<
  OrgUnit,
  Omit<OrgUnit, 'id' | 'createdAt' | 'updatedAt' | 'isActive'> & { isActive?: boolean }
>(
  'hr/createOrgUnit',
  async (newUnit, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/hr/org-units', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUnit),
      });
      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.message || 'فشل إنشاء الوحدة التنظيمية');
      }
      const createdUnit: OrgUnit = await response.json();
      return createdUnit;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateOrgUnit = createAsyncThunk<
  OrgUnit,
  { id: string; updates: Partial<Omit<OrgUnit, 'id' | 'createdAt' | 'updatedAt'>> }
>(
  'hr/updateOrgUnit',
  async ({ id, updates }, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/hr/org-units/${id}` , {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.message || 'فشل تحديث الوحدة التنظيمية');
      }
      const updatedUnit: OrgUnit = await response.json();
      return updatedUnit;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteOrgUnit = createAsyncThunk<string, string>(
  'hr/deleteOrgUnit',
  async (id, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/hr/org-units/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.message || 'فشل حذف الوحدة التنظيمية');
      }
      return id;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// مبدئيًا: thunks وهمية حتى ربط الخدمات
export const fetchOrgTree = createAsyncThunk<OrgUnitTreeNode[]>('hr/fetchOrgTree', async (_, { rejectWithValue }) => {
  try {
    const response = await fetch('/api/hr/org-units');
    if (!response.ok) {
      const errorData = await response.json();
      return rejectWithValue(errorData.message || 'فشل تحميل الهيكل التنظيمي');
    }
    const tree: OrgUnitTreeNode[] = await response.json();
    return tree;
  } catch (error: any) {
    return rejectWithValue(error.message);
  }
});

// Async thunks للمسميات الوظيفية
export const createJobTitle = createAsyncThunk<
  JobTitle,
  Omit<JobTitle, 'id' | 'createdAt' | '' | 'isActive'> & { isActive?: boolean }
>(
  'hr/createJobTitle',
  async (newJobTitle, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/hr/job-titles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newJobTitle),
      });
      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.message || 'فشل إنشاء المسمى الوظيفي');
      }
      const createdJobTitle: JobTitle = await response.json();
      return createdJobTitle;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateJobTitle = createAsyncThunk<
  JobTitle,
  { id: string; updates: Partial<Omit<JobTitle, 'id' | 'createdAt'>> }
>(
  'hr/updateJobTitle',
  async ({ id, updates }, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/hr/job-titles/${id}` , {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.message || 'فشل تحديث المسمى الوظيفي');
      }
      const updatedJobTitle: JobTitle = await response.json();
      return updatedJobTitle;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteJobTitle = createAsyncThunk<string, string>(
  'hr/deleteJobTitle',
  async (id, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/hr/job-titles/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.message || 'فشل حذف المسمى الوظيفي');
      }
      return id;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchJobTitlesByOrgUnit = createAsyncThunk<
  JobTitle[],
  string
>(
  'hr/fetchJobTitlesByOrgUnit',
  async (orgUnitId, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/hr/org-units/${orgUnitId}/job-titles`);
      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.message || 'فشل تحميل المسميات الوظيفية');
      }
      const jobTitles: JobTitle[] = await response.json();
      return jobTitles;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunks للأعضاء المنظميين
export const assignOrgMember = createAsyncThunk<
  OrgMember,
  Omit<OrgMember, 'id' | 'createdAt' | 'isPrimary'> & { isPrimary?: boolean }
>(
  'hr/assignOrgMember',
  async (newMember, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/hr/org-members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMember),
      });
      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.message || 'فشل تعيين العضو');
      }
      const createdMember: OrgMember = await response.json();
      return createdMember;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const unassignOrgMember = createAsyncThunk<string, string>(
  'hr/unassignOrgMember',
  async (id, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/hr/org-members/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.message || 'فشل إلغاء تعيين العضو');
      }
      return id;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchOrgMembersByOrgUnit = createAsyncThunk<
  OrgMember[],
  string
>(
  'hr/fetchOrgMembersByOrgUnit',
  async (orgUnitId, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/hr/org-units/${orgUnitId}/members`);
      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.message || 'فشل تحميل أعضاء الوحدة التنظيمية');
      }
      const members: OrgMember[] = await response.json();
      return members;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchOrgMembersByAdmin = createAsyncThunk<
  OrgMember[],
  string
>(
  'hr/fetchOrgMembersByAdmin',
  async (adminId, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/hr/admins/${adminId}/org-members`);
      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.message || 'فشل تحميل أعضاء المسؤول');
      }
      const members: OrgMember[] = await response.json();
      return members;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunks لربط الصلاحيات
export const grantOrgUnitPermission = createAsyncThunk<
  OrgUnitPermission,
  Omit<OrgUnitPermission, 'id'>
>(
  'hr/grantOrgUnitPermission',
  async (permissionLink, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/hr/org-unit-permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(permissionLink),
      });
      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.message || 'فشل منح صلاحية للوحدة التنظيمية');
      }
      const createdLink: OrgUnitPermission = await response.json();
      return createdLink;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const revokeOrgUnitPermission = createAsyncThunk<
  { orgUnitId: string; permissionId: string },
  { orgUnitId: string; permissionId: string }
>(
  'hr/revokeOrgUnitPermission',
  async ({ orgUnitId, permissionId }, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/hr/org-unit-permissions/${orgUnitId}/${permissionId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.message || 'فشل إلغاء صلاحية من الوحدة التنظيمية');
      }
      return { orgUnitId, permissionId };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchOrgUnitPermissions = createAsyncThunk<
  OrgUnitPermission[],
  string
>(
  'hr/fetchOrgUnitPermissions',
  async (orgUnitId, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/hr/org-units/${orgUnitId}/permissions`);
      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.message || 'فشل تحميل صلاحيات الوحدة التنظيمية');
      }
      const permissions: OrgUnitPermission[] = await response.json();
      return permissions;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const grantJobTitlePermission = createAsyncThunk<
  JobTitlePermission,
  Omit<JobTitlePermission, 'id'>
>(
  'hr/grantJobTitlePermission',
  async (permissionLink, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/hr/job-title-permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(permissionLink),
      });
      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.message || 'فشل منح صلاحية للمسمى الوظيفي');
      }
      const createdLink: JobTitlePermission = await response.json();
      return createdLink;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const revokeJobTitlePermission = createAsyncThunk<
  { jobTitleId: string; permissionId: string },
  { jobTitleId: string; permissionId: string }
>(
  'hr/revokeJobTitlePermission',
  async ({ jobTitleId, permissionId }, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/hr/job-title-permissions/${jobTitleId}/${permissionId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.message || 'فشل إلغاء صلاحية من المسمى الوظيفي');
      }
      return { jobTitleId, permissionId };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchJobTitlePermissions = createAsyncThunk<
  JobTitlePermission[],
  string
>(
  'hr/fetchJobTitlePermissions',
  async (jobTitleId, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/hr/job-titles/${jobTitleId}/permissions`);
      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.message || 'فشل تحميل صلاحيات المسمى الوظيفي');
      }
      const permissions: JobTitlePermission[] = await response.json();
      return permissions;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

const hrSlice = createSlice({
  name: 'hr',
  initialState,
  reducers: {
    تعيين_الشجرة(state, action: PayloadAction<OrgUnitTreeNode[]>) {
      state.tree = action.payload;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchOrgTree.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrgTree.fulfilled, (state, action) => {
        state.loading = false;
        state.tree = action.payload;
      })
      .addCase(fetchOrgTree.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'فشل تحميل الهيكل التنظيمي';
      })
      .addCase(createOrgUnit.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createOrgUnit.fulfilled, (state, action) => {
        state.loading = false;
        // إذا كانت الوحدة الجديدة لها parentId، أضفها إلى children الخاص بالوالد
        // وإلا، أضفها إلى المستوى الأعلى للشجرة
        const newUnit = action.payload;
        if (newUnit.parent_id) {
          const findAndAddChild = (nodes: OrgUnitTreeNode[]): OrgUnitTreeNode[] => {
            return nodes.map(node => {
              if (node.id === newUnit.parent_id) {
                return { ...node, children: [...(node.children || []), { ...newUnit, children: [] }] };
              }
              if (node.children) {
                return { ...node, children: findAndAddChild(node.children) };
              }
              return node;
            });
          };
          state.tree = findAndAddChild(state.tree);
        } else {
          state.tree.push({ ...newUnit, children: [] });
        }
        state.error = null;
      })
      .addCase(createOrgUnit.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'فشل إنشاء الوحدة التنظيمية';
      })
      .addCase(updateOrgUnit.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateOrgUnit.fulfilled, (state, action) => {
        state.loading = false;
        state.tree = updateTree(state.tree, action.payload);
        state.error = null;
      })
      .addCase(updateOrgUnit.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'فشل تحديث الوحدة التنظيمية';
      })
      .addCase(deleteOrgUnit.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteOrgUnit.fulfilled, (state, action) => {
        state.loading = false;
        state.tree = removeNodeFromTree(state.tree, action.payload);
        state.error = null;
      })
      .addCase(deleteOrgUnit.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'فشل حذف الوحدة التنظيمية';
      })
      .addCase(createJobTitle.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createJobTitle.fulfilled, (state, action) => {
        state.loading = false;
        const newJobTitle = action.payload;
        state.jobTitlesByUnit[newJobTitle.orgUnitId] = [
          ...(state.jobTitlesByUnit[newJobTitle.orgUnitId] || []),
          newJobTitle,
        ];
        state.error = null;
      })
      .addCase(createJobTitle.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'فشل إنشاء المسمى الوظيفي';
      })
      .addCase(updateJobTitle.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateJobTitle.fulfilled, (state, action) => {
        state.loading = false;
        const updatedJobTitle = action.payload;
        state.jobTitlesByUnit[updatedJobTitle.orgUnitId] = state.jobTitlesByUnit[
          updatedJobTitle.orgUnitId
        ].map(jt => (jt.id === updatedJobTitle.id ? updatedJobTitle : jt));
        state.error = null;
      })
      .addCase(updateJobTitle.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'فشل تحديث المسمى الوظيفي';
      })
      .addCase(deleteJobTitle.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteJobTitle.fulfilled, (state, action) => {
        state.loading = false;
        // لا يمكننا معرفة orgUnitId هنا من مجرد id، لذا سنحتاج إلى تحديث كامل أو إعادة جلب
        // لأغراض MVP، سنقوم بتصفية جميع المسميات إذا وجد
        for (const orgUnitId in state.jobTitlesByUnit) {
          state.jobTitlesByUnit[orgUnitId] = state.jobTitlesByUnit[orgUnitId].filter(
            jt => jt.id !== action.payload
          );
        }
        state.error = null;
      })
      .addCase(deleteJobTitle.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'فشل حذف المسمى الوظيفي';
      })
      .addCase(fetchJobTitlesByOrgUnit.pending, (state, action) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchJobTitlesByOrgUnit.fulfilled, (state, action) => {
        state.loading = false;
        const orgUnitId = action.meta.arg; // الحصول على orgUnitId من meta
        state.jobTitlesByUnit[orgUnitId] = action.payload;
        state.error = null;
      })
      .addCase(fetchJobTitlesByOrgUnit.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'فشل تحميل المسميات الوظيفية';
      })
      .addCase(assignOrgMember.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(assignOrgMember.fulfilled, (state, action) => {
        state.loading = false;
        const newMember = action.payload;
        state.membersByUnit[newMember.orgUnitId] = [
          ...(state.membersByUnit[newMember.orgUnitId] || []),
          newMember,
        ];
        state.error = null;
      })
      .addCase(assignOrgMember.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'فشل تعيين العضو';
      })
      .addCase(unassignOrgMember.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(unassignOrgMember.fulfilled, (state, action) => {
        state.loading = false;
        for (const orgUnitId in state.membersByUnit) {
          state.membersByUnit[orgUnitId] = state.membersByUnit[orgUnitId].filter(
            member => member.id !== action.payload
          );
        }
        state.error = null;
      })
      .addCase(unassignOrgMember.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'فشل إلغاء تعيين العضو';
      })
      .addCase(fetchOrgMembersByOrgUnit.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrgMembersByOrgUnit.fulfilled, (state, action) => {
        state.loading = false;
        const orgUnitId = action.meta.arg;
        state.membersByUnit[orgUnitId] = action.payload;
        state.error = null;
      })
      .addCase(fetchOrgMembersByOrgUnit.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'فشل تحميل أعضاء الوحدة التنظيمية';
      })
      .addCase(fetchOrgMembersByAdmin.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrgMembersByAdmin.fulfilled, (state, action) => {
        state.loading = false;
        const adminId = action.meta.arg;
        // قد نحتاج إلى تحديث حالة مختلفة إذا كنا نخزن الأعضاء حسب المسؤول
        // في الوقت الحالي، يمكننا فقط تسجيلها أو تحديث جزء آخر من الحالة إذا كان ذلك مطلوبًا للواجهة الأمامية
        state.error = null;
      })
      .addCase(fetchOrgMembersByAdmin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'فشل تحميل أعضاء المسؤول';
      })
      .addCase(grantOrgUnitPermission.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(grantOrgUnitPermission.fulfilled, (state, action) => {
        state.loading = false;
        const newPermission = action.payload;
        state.unitPermissions[newPermission.orgUnitId] = [
          ...(state.unitPermissions[newPermission.orgUnitId] || []),
          newPermission,
        ];
        state.error = null;
      })
      .addCase(grantOrgUnitPermission.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'فشل منح صلاحية للوحدة التنظيمية';
      })
      .addCase(revokeOrgUnitPermission.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(revokeOrgUnitPermission.fulfilled, (state, action) => {
        state.loading = false;
        const { orgUnitId, permissionId } = action.payload;
        state.unitPermissions[orgUnitId] = state.unitPermissions[orgUnitId].filter(
          perm => perm.permissionId !== permissionId
        );
        state.error = null;
      })
      .addCase(revokeOrgUnitPermission.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'فشل إلغاء صلاحية من الوحدة التنظيمية';
      })
      .addCase(fetchOrgUnitPermissions.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrgUnitPermissions.fulfilled, (state, action) => {
        state.loading = false;
        const orgUnitId = action.meta.arg;
        state.unitPermissions[orgUnitId] = action.payload;
        state.error = null;
      })
      .addCase(fetchOrgUnitPermissions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'فشل تحميل صلاحيات الوحدة التنظيمية';
      })
      .addCase(grantJobTitlePermission.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(grantJobTitlePermission.fulfilled, (state, action) => {
        state.loading = false;
        const newPermission = action.payload;
        state.titlePermissions[newPermission.jobTitleId] = [
          ...(state.titlePermissions[newPermission.jobTitleId] || []),
          newPermission,
        ];
        state.error = null;
      })
      .addCase(grantJobTitlePermission.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'فشل منح صلاحية للمسمى الوظيفي';
      })
      .addCase(revokeJobTitlePermission.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(revokeJobTitlePermission.fulfilled, (state, action) => {
        state.loading = false;
        const { jobTitleId, permissionId } = action.payload;
        state.titlePermissions[jobTitleId] = state.titlePermissions[jobTitleId].filter(
          perm => perm.permissionId !== permissionId
        );
        state.error = null;
      })
      .addCase(revokeJobTitlePermission.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'فشل إلغاء صلاحية من المسمى الوظيفي';
      })
      .addCase(fetchJobTitlePermissions.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchJobTitlePermissions.fulfilled, (state, action) => {
        state.loading = false;
        const jobTitleId = action.meta.arg;
        state.titlePermissions[jobTitleId] = action.payload;
        state.error = null;
      })
      .addCase(fetchJobTitlePermissions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'فشل تحميل صلاحيات المسمى الوظيفي';
      });
  },
});

export const { تعيين_الشجرة } = hrSlice.actions;
export const selectHrState = (state: any) => state.hr;
export default hrSlice.reducer;
