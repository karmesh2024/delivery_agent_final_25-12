import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import WalletBalancesReport from './WalletBalancesReport';
import DeliveryAgentReport from './DeliveryAgentReport';

interface ReportType {
  title: string;
  description: string;
  component: React.FC;
  key: string;
}

const reportTypes: ReportType[] = [
  {
    title: 'تقرير أرصدة وحركات المحافظ',
    description: 'عرض تفصيلي لأرصدة المحافظ المختلفة وحركاتها الأخيرة.',
    component: WalletBalancesReport,
    key: 'wallet_balances'
  },
  {
    title: 'تقرير تسوية حسابات المناديب',
    description: 'متابعة العهد النقدية والمواد المجمعة لدى المناديب.',
    component: DeliveryAgentReport, 
    key: 'delivery_agent_settlement'
  },
  {
    title: 'تقرير التدفقات النقدية',
    description: 'تحليل التدفقات النقدية الداخلة والخارجة من النظام.',
    component: () => <p className="text-center p-8">قيد التطوير...</p>,
    key: 'cash_flow'
  },
  {
    title: 'تقرير أداء المناديب',
    description: 'قياس كفاءة المناديب بناءً على مؤشرات أداء رئيسية.',
    component: () => <p className="text-center p-8">قيد التطوير...</p>,
    key: 'delivery_agent_performance'
  },
  {
    title: 'تقرير عمليات الوكلاء',
    description: 'متابعة وتلخيص عمليات نقاط البيع والوكلاء.',
    component: () => <p className="text-center p-8">قيد التطوير...</p>,
    key: 'agent_operations'
  },
  {
    title: 'تقرير التحويلات الداخلية (P2P)',
    description: 'مراجعة وتدقيق التحويلات المالية بين محافظ المستخدمين.',
    component: () => <p className="text-center p-8">قيد التطوير...</p>,
    key: 'p2p_transfers'
  }
];

export const DetailedReports: React.FC = () => {
  const [selectedReportKey, setSelectedReportKey] = useState<string | null>('wallet_balances');

  const selectedReport = reportTypes.find(report => report.key === selectedReportKey);
  const SelectedComponent = selectedReport?.component;

  return (
    <div className="space-y-6 p-4 md:p-6">
      <h2 className="text-2xl font-semibold mb-6 text-gray-800 dark:text-gray-200">التقارير التفصيلية</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {reportTypes.map((report) => (
          <Card 
            key={report.key} 
            className={`cursor-pointer hover:shadow-lg transition-shadow duration-200 ${selectedReportKey === report.key ? 'ring-2 ring-primary dark:ring-primary-dark shadow-lg' : 'dark:bg-gray-800'}`}
            onClick={() => setSelectedReportKey(report.key)}
          >
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-700 dark:text-gray-300">{report.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-sm text-gray-600 dark:text-gray-400">{report.description}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>

      {SelectedComponent && (
        <div className="mt-8 p-6 bg-white dark:bg-gray-800 shadow-xl rounded-lg">
          <SelectedComponent />
        </div>
      )}
    </div>
  );
}; 