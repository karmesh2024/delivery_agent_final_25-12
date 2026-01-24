'use client';

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/shared/layouts/DashboardLayout';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchMemberships, updateMembershipLevel } from '@/domains/club-zone/store/clubZoneSlice';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';
import { Badge } from '@/shared/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { FiUsers, FiEdit } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { MembershipLevel } from '@/domains/club-zone/types';

export default function ClubMembersPage() {
  const dispatch = useAppDispatch();
  const { memberships, membershipsCount, loading } = useAppSelector((state) => state.clubZone);
  const [levelFilter, setLevelFilter] = useState<string>('all');

  useEffect(() => {
    const filters: any = { is_active: true };
    if (levelFilter !== 'all') {
      filters.membership_level = levelFilter;
    }
    dispatch(fetchMemberships(filters));
  }, [dispatch, levelFilter]);

  const handleUpdateLevel = async (userId: string, newLevel: MembershipLevel) => {
    try {
      await dispatch(updateMembershipLevel({ userId, newLevel })).unwrap();
      toast.success('تم تحديث مستوى العضوية بنجاح');
      dispatch(fetchMemberships({ is_active: true }));
    } catch (error: any) {
      toast.error(`فشل في تحديث مستوى العضوية: ${error.message}`);
    }
  };

  const getMembershipLevelBadge = (level: MembershipLevel) => {
    const colors: Record<MembershipLevel, string> = {
      [MembershipLevel.COMMUNITY]: 'bg-gray-100 text-gray-800',
      [MembershipLevel.ACTIVE]: 'bg-blue-100 text-blue-800',
      [MembershipLevel.AMBASSADOR]: 'bg-purple-100 text-purple-800',
      [MembershipLevel.PARTNER]: 'bg-green-100 text-green-800',
    };
    const labels: Record<MembershipLevel, string> = {
      [MembershipLevel.COMMUNITY]: 'مجتمعي',
      [MembershipLevel.ACTIVE]: 'نشط',
      [MembershipLevel.AMBASSADOR]: 'سفير',
      [MembershipLevel.PARTNER]: 'شريك',
    };

    return (
      <Badge className={colors[level]}>
        {labels[level]}
      </Badge>
    );
  };

  return (
    <DashboardLayout title="إدارة الأعضاء">
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">إدارة الأعضاء</h1>
            <p className="text-gray-600 mt-2">
              عرض وإدارة أعضاء نادي Scope Zone وترقية العضويات
            </p>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FiUsers className="mr-2" />
              الفلاتر
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex-1 max-w-xs">
                <label className="block text-sm font-medium mb-2">مستوى العضوية</label>
                <Select value={levelFilter} onValueChange={setLevelFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="جميع المستويات" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع المستويات</SelectItem>
                    <SelectItem value={MembershipLevel.COMMUNITY}>مجتمعي</SelectItem>
                    <SelectItem value={MembershipLevel.ACTIVE}>نشط</SelectItem>
                    <SelectItem value={MembershipLevel.AMBASSADOR}>سفير</SelectItem>
                    <SelectItem value={MembershipLevel.PARTNER}>شريك</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Members Table */}
        <Card>
          <CardHeader>
            <CardTitle>قائمة الأعضاء ({membershipsCount})</CardTitle>
            <CardDescription>
              جميع أعضاء نادي Scope Zone
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">جاري التحميل...</div>
            ) : memberships.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                لا توجد أعضاء لعرضها
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الاسم</TableHead>
                    <TableHead>الهاتف</TableHead>
                    <TableHead>البريد الإلكتروني</TableHead>
                    <TableHead>مستوى العضوية</TableHead>
                    <TableHead>تاريخ الانضمام</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {memberships.map((membership) => (
                    <TableRow key={membership.id}>
                      <TableCell className="font-medium">{membership.user_name || 'غير معروف'}</TableCell>
                      <TableCell>{membership.user_phone || '-'}</TableCell>
                      <TableCell>{membership.user_email || '-'}</TableCell>
                      <TableCell>{getMembershipLevelBadge(membership.membership_level)}</TableCell>
                      <TableCell>
                        {new Date(membership.start_date).toLocaleDateString('ar-EG')}
                      </TableCell>
                      <TableCell>
                        <Badge variant={membership.is_active ? 'default' : 'secondary'}>
                          {membership.is_active ? 'نشط' : 'غير نشط'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={membership.membership_level}
                          onValueChange={(value) => handleUpdateLevel(membership.user_id, value as MembershipLevel)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={MembershipLevel.COMMUNITY}>مجتمعي</SelectItem>
                            <SelectItem value={MembershipLevel.ACTIVE}>نشط</SelectItem>
                            <SelectItem value={MembershipLevel.AMBASSADOR}>سفير</SelectItem>
                            <SelectItem value={MembershipLevel.PARTNER}>شريك</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
