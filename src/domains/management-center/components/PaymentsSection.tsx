'use client';

import React from 'react';
import PaymentsPageContent from '../../../domains/payments/components/PaymentsContent'; // We will create this
import { Card, CardContent } from "@/shared/components/ui/card";
import SectionIntro from './SectionIntro';
import { CreditCardIcon } from 'lucide-react';

const PaymentsSection: React.FC = () => {
  return (
    <div className="space-y-6">
      <SectionIntro
        title="إدارة المدفوعات"
        description="هذا القسم مخصص لإدارة جميع سجلات المدفوعات والمعاملات المالية في النظام."
        example="يمكنك عرض تفاصيل المعاملات، تتبع حالة المدفوعات، أو تصفية السجلات حسب نوع المعاملة أو تاريخها."
        icon={CreditCardIcon}
      />
      <Card>
        <CardContent>
          <PaymentsPageContent isEmbedded={true} />
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentsSection; 