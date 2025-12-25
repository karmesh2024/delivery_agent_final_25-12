import React, { useState } from 'react';
import WalletBalancesReport from '../reports/WalletBalancesReport';
// Import other report components here when they are created
// e.g., import DriverSettlementReport from '../reports/DriverSettlementReport';
import DeliveryAgentReport from '../reports/DeliveryAgentReport';

const DetailedReports = () => {
  const reportTypes = [
    { id: 'walletBalances', title: "تقرير أرصدة وحركات المحافظ", description: "نظرة شاملة على جميع أنواع المحافظ، أرصدتها، وحركاتها." },
    { id: 'driverSettlement', title: "تقرير تسوية حسابات المناديب", description: "تتبع ومراقبة عمليات التسوية الدورية للمناديب." },
    { id: 'cashFlow', title: "تقرير التدفقات النقدية", description: "فهم حركة النقد داخل وخارج النظام." },
    { id: 'driverPerformance', title: "تقرير أداء المناديب", description: "تقييم كفاءة ونشاط المناديب." },
    { id: 'agentOperations', title: "تقرير عمليات الوكلاء", description: "مراقبة نشاط الوكلاء المعتمدين." },
    { id: 'p2pTransfers', title: "تقرير التحويلات الداخلية بين العملاء (P2P)", description: "مراقبة حجم وتكرار التحويلات بين العملاء." },
  ];

  const [activeReport, setActiveReport] = useState<string | null>('walletBalances'); // Default to walletBalances for development

  const handleReportClick = (reportId: string) => {
    setActiveReport(reportId);
  };

  const renderActiveReport = () => {
    // if (!activeReport) return null; // Or some placeholder message to select a report
    switch (activeReport) {
      case 'walletBalances':
        return <WalletBalancesReport />;
      case 'driverSettlement':
        return <DeliveryAgentReport />;
      // Add cases for other reports here
      // case 'driverSettlement':
      //   return <DriverSettlementReport />;
      default:
        return (
          <div className="mt-6 p-6 bg-white rounded-lg shadow-md text-center">
            <h3 className="text-lg font-semibold text-gray-700">التقرير المحدد قيد التطوير</h3>
            <p className="text-gray-500 mt-2">سيتم توفير هذا التقرير قريبًا.</p>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Section for Report Selection Cards */}
      <div className="bg-white p-6 rounded-lg shadow-md space-y-6">
        <h2 className="text-2xl font-semibold text-gray-800 border-b pb-3">تقارير نظام المدفوعات</h2>
        <p className="text-gray-600">
          اختر تقريرًا من القائمة أدناه لعرض التفاصيل والتحليلات:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reportTypes.map((report) => (
            <div
              key={report.id}
              className={`p-4 border rounded-lg hover:shadow-xl transition-all duration-200 ease-in-out cursor-pointer ${
                activeReport === report.id ? 'ring-2 ring-indigo-500 shadow-lg bg-indigo-50' : 'bg-white'
              }`}
              onClick={() => handleReportClick(report.id)}
            >
              <h3 className={`text-lg font-semibold ${activeReport === report.id ? 'text-indigo-700' : 'text-gray-700'}`}>{report.title}</h3>
              <p className={`text-sm ${activeReport === report.id ? 'text-indigo-600' : 'text-gray-500'} mt-1`}>{report.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Section to Display the Active Report */}
      <div className="mt-0"> {/* Adjusted margin */}
        {renderActiveReport()}
      </div>
    </div>
  );
};

export default DetailedReports; 