import React from 'react';
import { ApprovedAgent, AgentStatus } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { FiPhone, FiInfo, FiEdit } from 'react-icons/fi';

interface ApprovedAgentCardProps {
  agent: ApprovedAgent;
  onViewDetails: (agent: ApprovedAgent) => void;
  onCall: (agent: ApprovedAgent) => void;
  onEdit: (agent: ApprovedAgent) => void;
  className?: string;
}

export const ApprovedAgentCard: React.FC<ApprovedAgentCardProps> = ({
  agent,
  onViewDetails,
  onCall,
  onEdit,
  className
}) => {
  const getStatusColor = (status: AgentStatus) => {
    switch (status) {
      case 'online':
        return 'bg-green-500 hover:bg-green-600';
      case 'offline':
        return 'bg-gray-500 hover:bg-gray-600';
      case 'busy':
        return 'bg-yellow-500 hover:bg-yellow-600';
      default:
        return 'bg-gray-400 hover:bg-gray-500';
    }
  };

  const displayStatus: AgentStatus = agent.details?.approved ? 'online' : 'offline';

  return (
    <Card className={`flex flex-col h-full ${className}`} dir="rtl">
      <CardHeader className="flex flex-row items-center space-y-0 pb-2">
        {agent.profile?.avatar_url && (
          <img
            src={agent.profile.avatar_url}
            alt="Avatar"
            className="w-16 h-16 rounded-full object-cover ml-auto mr-4"
          />
        )}
        <div className="flex flex-col items-end mr-auto">
          <CardTitle className="text-xl font-bold">{agent.profile?.full_name || 'وكيل غير معروف'}</CardTitle>
          <Badge
            className={`${getStatusColor(displayStatus)} text-white px-2 py-1 rounded-full text-xs mt-1`}
          >
            {displayStatus === 'online' ? 'متاح' : 'غير نشط'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-grow text-right">
        <CardDescription className="text-sm text-gray-500">
          <p>الهاتف: {agent.profile?.phone || 'غير متوفر'}</p>
          <p>البريد الإلكتروني: {agent.profile?.email || 'غير متوفر'}</p>
          <p>موقع التخزين: {agent.details?.storage_location || 'غير محدد'}</p>
          <p>المنطقة: {agent.details?.region || 'غير محددة'}</p>
          <p>
            <span className="font-semibold">المناطق المغطاة:</span> {
              (() => {
                const zones = agent.approved_agent_zones;
                if (zones && zones.length > 0) {
                  return zones.map((zone, index) => (
                    <span key={zone.geographic_zone_id || index}>
                      {zone.zone_name}{zone.is_primary ? ' (أساسي)' : ''}
                      {index < zones.length - 1 ? ', ' : ''}
                    </span>
                  ));
                }
                return 'غير محددة';
              })()
            }
          </p>
          <p>نوع الوكيل: {agent.details?.agent_type === 'individual' ? 'فردي' : agent.details?.agent_type === 'company' ? 'شركة' : 'غير محدد'}</p>
          <p>
            <span className="font-semibold">معدل العمولة:</span> {
              (() => {
                const commissions = agent.details?.function_specific_commissions;
                if (commissions && commissions.length > 0) {
                  return commissions.map((commission, index) => (
                    <span key={index}>
                      {commission.type === 'waste_purchase' ? 'شراء المخلفات' : commission.type === 'product_sale' ? 'بيع المنتجات' : commission.type === 'cash_withdrawal' ? 'سحب نقدي' : commission.type === 'other' ? 'أخرى' : commission.type}: {commission.value}{commission.unit === 'percentage' ? '%' : ''}
                      {index < commissions.length - 1 ? ', ' : ''}
                    </span>
                  ));
                }
                return 'غير محدد';
              })()
            }
          </p>
          <p>طريقة الدفع: {agent.details?.payment_method || 'غير محددة'}</p>
          <p>تمت الموافقة: {agent.details?.approved ? 'نعم' : 'لا'}</p>
          <p>الرصيد الأولي للمحفظة: {agent.wallet?.balance || '0.00'} {agent.wallet?.currency || 'SAR'}</p>
          <p>نوع المحفظة: {agent.wallet?.wallet_type || 'AGENT_WALLET'}</p>
        </CardDescription>
      </CardContent>
      <CardFooter className="flex justify-end gap-2 p-4 pt-0">
        <Button variant="outline" size="sm" onClick={() => onCall(agent)}>
          <FiPhone className="h-4 w-4 mr-2" /> اتصال
        </Button>
        <Button variant="outline" size="sm" onClick={() => onEdit(agent)}>
          <FiEdit className="h-4 w-4 mr-2" /> تعديل
        </Button>
        <Button size="sm" onClick={() => onViewDetails(agent)}>
          <FiInfo className="h-4 w-4 mr-2" /> التفاصيل
        </Button>
      </CardFooter>
    </Card>
  );
}; 