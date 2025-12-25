'use client';

import React from 'react';
import { AdminsListPage } from '@/components/AdminsListPage';
import { Card, CardContent } from "@/shared/components/ui/card";
import SectionIntro from './SectionIntro';
import { UsersIcon } from 'lucide-react';

const AdminsSection: React.FC = () => {
  return (
    <div className="space-y-6">
      <SectionIntro
        title="إدارة المسؤولين"
        description="هذا القسم مخصص لإدارة حسابات المسؤولين وصلاحياتهم داخل النظام."
        example="يمكنك إضافة مسؤول جديد، تعديل صلاحيات مسؤول حالي، أو إزالة حساب مسؤول لم يعد بحاجة للوصول إلى النظام."
        icon={UsersIcon}
      />
      <Card>
        <CardContent>
          <AdminsListPage isEmbedded={true} />
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminsSection; 