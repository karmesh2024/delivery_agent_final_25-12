import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import {
  InfoCircledIcon,
  BarChartIcon,
  BackpackIcon,
  IdCardIcon,
  DashboardIcon,
  MixerHorizontalIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ChevronLeftIcon
} from '@radix-ui/react-icons';

interface SectionIntroCardProps {
  title: string;
  description: string;
  example: string;
  icon?: React.ElementType;
  learnMoreLink?: string;
}

const SectionIntroCard: React.FC<SectionIntroCardProps> = ({ title, description, example, icon: Icon, learnMoreLink = '#/data-center' }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className="mb-6 shadow-lg hover:shadow-xl transition-shadow duration-200 ease-in-out overflow-hidden" style={{ direction: 'rtl' }}>
      <CardHeader 
        className="pb-3 pt-4 pr-4 pl-4 bg-gray-50 border-b border-gray-200 cursor-pointer flex flex-row items-center justify-between"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center">
          {Icon && <Icon className="h-7 w-7 text-blue-600 ml-4" />}
          <CardTitle className="text-xl font-semibold text-gray-800 font-sans">{title}</CardTitle>
        </div>
        <div className="flex items-center text-sm text-gray-600">
          {!isExpanded && <span className="ml-2 font-medium text-xs">تعرّف على القسم</span>}
          {isExpanded ? <ChevronUpIcon className="h-5 w-5" /> : <ChevronDownIcon className="h-5 w-5" />}
        </div>
      </CardHeader>
      <div 
        className={`transition-all duration-300 ease-in-out overflow-hidden ${isExpanded ? 'max-h-[1000px]' : 'max-h-0'}`}
        style={{ maxHeight: isExpanded ? '1000px' : '0px' }}
      >
        <CardContent className="pt-3 pb-4 pr-4 pl-4 flex flex-col" style={{ direction: 'rtl' }}>
          <CardDescription className="text-base text-gray-700 mb-3 leading-relaxed font-sans">
            {description}
          </CardDescription>
          <CardDescription className="text-sm text-gray-600 mb-4 italic leading-relaxed bg-blue-50 p-3 rounded-md border border-blue-200 font-sans">
            <span className="font-semibold">مثال إداري:</span> {example}
          </CardDescription>
          <Button 
            variant="link"
            size="sm"
            className="text-blue-700 hover:text-blue-800 mt-auto self-start p-0 h-auto text-sm font-medium font-sans"
            onClick={(e) => { 
              e.stopPropagation(); 
              console.log(`Navigate to ${learnMoreLink}/${title.toLowerCase().replace(/\s+/g, '-')}`); 
            }}
          >
            <InfoCircledIcon className="ml-2 h-4 w-4" /> 
            مزيد من التفاصيل حول {title.toLowerCase()}
          </Button>
        </CardContent>
      </div>
    </Card>
  );
};

interface PaymentSectionsIntroProps {
  sectionKey: 'dashboard' | 'wallets' | 'transactions' | 'payouts' | 'reports';
}

const PaymentSectionsIntro: React.FC<PaymentSectionsIntroProps> = ({ sectionKey }) => {
  const sectionDetails: Record<string, SectionIntroCardProps> = {
    dashboard: {
      title: "لوحة التحكم",
      icon: DashboardIcon,
      description: "توفر لك لوحة التحكم نظرة شاملة وفورية على أهم المؤشرات المالية والإحصائيات الحيوية للنظام.",
      example: "يمكنك التحقق بسرعة من إجمالي الإيرادات المحققة اليوم، عدد طلبات السحب التي تنتظر الموافقة، أو أكثر أنواع المعاملات شيوعًا خلال الأسبوع الماضي."
    },
    wallets: {
      title: "المحافظ",
      icon: BackpackIcon,
      description: "يختص هذا القسم بإدارة ومراقبة جميع المحافظ المالية بأنواعها المختلفة (عملاء، مناديب، وكلاء، ومحافظ النظام الداخلية).",
      example: "يمكنك البحث عن محفظة مندوب معين لتحديث بياناته، مراجعة رصيده الحالي والعهدة النقدية التي بحوزته، أو تعليق محفظة مستخدم بشكل مؤقت لأسباب أمنية."
    },
    transactions: {
      title: "المعاملات",
      icon: MixerHorizontalIcon,
      description: "يوفر سجلاً كاملاً ومفصلاً لجميع الحركات المالية التي تمت على المحافظ، مما يتيح التتبع الدقيق للتدفقات النقدية.",
      example: "يمكنك فلترة المعاملات لعرض جميع عمليات الإيداع التي تمت لمحفظة معينة خلال الشهر الحالي، أو البحث عن معاملة محددة باستخدام رقم الطلب المرتبط بها."
    },
    payouts: {
      title: "طلبات السحب",
      icon: IdCardIcon,
      description: "يتيح لك هذا القسم مراجعة طلبات سحب الأرصدة المقدمة من المستخدمين (خاصة المناديب والوكلاء)، واتخاذ الإجراء المناسب سواء بالموافقة أو الرفض.",
      example: "عند استلام طلب سحب جديد من مندوب، يمكنك مراجعة تفاصيل الطلب، التأكد من صحة بيانات الدفع، ثم الموافقة على تحويل المبلغ إلى حسابه المسجل."
    },
    reports: {
      title: "التقارير",
      icon: BarChartIcon,
      description: "يقدم مجموعة من التقارير المالية والإدارية الشاملة التي تساعد على تحليل أداء النظام المالي، اكتشاف الاتجاهات، واتخاذ قرارات مستنيرة.",
      example: "يمكنك استعراض تقرير أرصدة وحركات المحافظ لمعرفة توزيع الأرصدة بين الأنواع المختلفة من المحافظ، أو تحليل تقرير التدفقات النقدية لفهم مصادر الدخل والمصروفات الرئيسية."
    },
  };

  const activeSection = sectionDetails[sectionKey];

  if (!activeSection) {
    return null;
  }

  return <SectionIntroCard {...activeSection} />;
};

export default PaymentSectionsIntro; 