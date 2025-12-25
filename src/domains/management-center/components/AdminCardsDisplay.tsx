import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Admin } from '@/domains/admins/types';
import { FiEdit, FiTrash2 } from 'react-icons/fi';

interface AdminCardsDisplayProps {
  admins: Admin[];
  onEdit?: (admin: Admin) => void;
  onDelete?: (adminId: string) => void;
}

const AdminCardsDisplay: React.FC<AdminCardsDisplayProps> = ({ admins, onEdit, onDelete }) => {
  if (!admins || admins.length === 0) {
    return <p className="text-gray-500 text-sm">لا يوجد مسؤولون لعرضهم.</p>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {admins.map((admin) => (
        <Card key={admin.id} className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{admin.name || admin.email}</CardTitle>
            <div className="flex space-x-2 rtl:space-x-reverse">
              {onEdit && (
                <Button variant="ghost" size="sm" onClick={() => onEdit(admin)}>
                  <FiEdit className="h-4 w-4 text-blue-500" />
                </Button>
              )}
              {onDelete && (
                <Button variant="ghost" size="sm" onClick={() => onDelete(admin.id)}>
                  <FiTrash2 className="h-4 w-4 text-red-500" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-500">البريد الإلكتروني: {admin.email}</p>
            {admin.role && <p className="text-xs text-gray-500">الدور: {admin.role}</p>}
            {admin.full_name && <p className="text-xs text-gray-500">الاسم الكامل: {admin.full_name}</p>}
            {admin.username && <p className="text-xs text-gray-500">اسم المستخدم: {admin.username}</p>}
            <p className="text-xs text-gray-500">الحالة: {admin.is_active ? 'نشط' : 'غير نشط'}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default AdminCardsDisplay;
