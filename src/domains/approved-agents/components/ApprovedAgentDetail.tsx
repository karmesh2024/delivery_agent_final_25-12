import React, { useState, useEffect } from 'react';
import { ApprovedAgent, AgentStatus } from '@/types';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { FiXCircle, FiCheckCircle, FiClock, FiMapPin, FiUser, FiPhone, FiMail, FiHome, FiMap, FiDollarSign, FiPercent, FiCreditCard, FiFile, FiFileText, FiLock, FiEye, FiEyeOff, FiCopy } from 'react-icons/fi';
import { Label } from '@/shared/ui/label';
import { useToast } from '@/shared/ui/use-toast';
import { approvedAgentService } from '@/domains/approved-agents/api/approvedAgentService';
import Switch, { SwitchProps } from '@mui/material/Switch';
import { styled } from '@mui/material/styles';
import { Separator } from '@/shared/ui/separator';

interface ApprovedAgentDetailProps {
  agent: ApprovedAgent;
  missingDocuments?: string[];
  onEdit?: (agent: ApprovedAgent) => void;
}

export const ApprovedAgentDetail: React.FC<ApprovedAgentDetailProps> = ({
  agent,
  missingDocuments,
  onEdit
}) => {
  const [localAgentData, setLocalAgentData] = useState<ApprovedAgent>(agent);
  const { toast } = useToast();
  const [agentPassword, setAgentPassword] = useState<string | null>(null);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  // تحديث البيانات المحلية عند تغيير الوكيل
  useEffect(() => {
    setLocalAgentData(agent);
    setAgentPassword(null); // إعادة تعيين كلمة المرور عند تغيير الوكيل
    setIsPasswordVisible(false);
  }, [agent]);

  const getStatusColor = (status: AgentStatus) => {
    switch (status) {
      case 'online':
        return 'bg-green-500 text-white';
      case 'offline':
        return 'bg-gray-500 text-white';
      case 'busy':
        return 'bg-yellow-500 text-white';
      default:
        return 'bg-gray-400 text-white';
    }
  };

  const displayStatus: AgentStatus = localAgentData.details?.approved ? 'online' : 'offline';

  const handleApproveToggle = async (checked: boolean) => {
    if (!localAgentData.id || !localAgentData.details) {
      toast({
        title: "خطأ",
        description: "بيانات الوكيل غير مكتملة لتحديث حالة الموافقة.",
        variant: "destructive",
      });
      return;
    }

    setLocalAgentData(prevData => ({
      ...prevData,
      details: prevData.details ? { ...prevData.details, approved: checked } : null
    }));

    const { success, error } = await approvedAgentService.updateAgentApprovalStatus(localAgentData.id, checked);

    if (success) {
      toast({
        title: "تم بنجاح",
        description: `تم ${checked ? 'الموافقة على' : 'إلغاء موافقة'} الوكيل بنجاح.`,
        variant: "success",
      });
    } else {
      setLocalAgentData(prevData => ({
        ...prevData,
        details: prevData.details ? { ...prevData.details, approved: !checked } : null
      }));
      toast({
        title: "خطأ",
        description: error || "فشل تحديث حالة الموافقة على الوكيل.",
        variant: "destructive",
      });
    }
  };

  const handleResetPassword = async () => {
    if (!localAgentData.id) {
      toast({
        title: "خطأ",
        description: "معرف الوكيل غير متوفر.",
        variant: "destructive",
      });
      return;
    }

    setIsResettingPassword(true);
    const { password, error } = await approvedAgentService.resetAgentPassword(localAgentData.id);
    setIsResettingPassword(false);

    if (error) {
      toast({
        title: "خطأ",
        description: error,
        variant: "destructive",
      });
    } else if (password) {
      setAgentPassword(password);
      setIsPasswordVisible(true);
      toast({
        title: "تم بنجاح",
        description: "تم إعادة تعيين كلمة المرور بنجاح.",
        variant: "success",
      });
    }
  };

  const handleCopyPassword = () => {
    if (agentPassword) {
      navigator.clipboard.writeText(agentPassword);
      toast({
        title: "تم النسخ",
        description: "تم نسخ كلمة المرور إلى الحافظة.",
        variant: "success",
      });
    }
  };

  const IOSSwitch = styled((props: SwitchProps) => (
    <Switch focusVisibleClassName=".Mui-focusVisible" disableRipple {...props} />
  ))(({ theme }) => ({
    width: 42,
    height: 26,
    padding: 0,
    '& .MuiSwitch-switchBase': {
      padding: 0,
      margin: 2,
      transitionDuration: '300ms',
      '&.Mui-checked': {
        transform: 'translateX(16px)',
        color: '#fff',
        '& + .MuiSwitch-track': {
          backgroundColor: theme.palette.mode === 'dark' ? '#2ECA45' : '#65C466',
          opacity: 1,
          border: 0,
        },
        '&.Mui-disabled + .MuiSwitch-track': {
          opacity: 0.5,
        },
      },
      '&.Mui-focusVisible .MuiSwitch-thumb': {
        color: '#33cf4d',
        border: '6px solid #fff',
      },
      '&.Mui-disabled .MuiSwitch-thumb': {
        color:
          theme.palette.mode === 'light'
            ? theme.palette.grey[100]
            : theme.palette.grey[600],
      },
      '&.Mui-disabled + .MuiSwitch-track': {
        opacity: theme.palette.mode === 'light' ? 0.7 : 0.3,
      },
      color: '#fff',
    },
    '& .MuiSwitch-thumb': {
      boxSizing: 'border-box',
      width: 22,
      height: 22,
      color: '#fff',
    },
    '& .MuiSwitch-track': {
      borderRadius: 26 / 2,
      backgroundColor: theme.palette.mode === 'light' ? '#A0A0A0' : '#4C4C4C',
      opacity: 1,
      transition: theme.transitions.create(['background-color'], {
        duration: 500,
      }),
    },
  }));

  // دالة مساعدة لتعريب أسماء المستندات
  const localizeDocumentType = (docType: string): string => {
    const docTypeMap: Record<string, string> = {
      national_id_front: "صورة البطاقة الشخصية (الوجه الأمامي)",
      national_id_back: "صورة البطاقة الشخصية (الوجه الخلفي)",
      tax_card_front: "صورة البطاقة الضريبية (الوجه الأمامي)",
      tax_card_back: "صورة البطاقة الضريبية (الوجه الخلفي)",
      personal_photo: "صورة شخصية للوكيل",
      contract_page_1: "صفحة العقد 1",
      // يمكن إضافة المزيد من التعريبات هنا حسب الحاجة
    };
    // إذا كان نوع المستند هو صفحة عقد ديناميكية، حاول تعريبها
    if (docType.startsWith('contract_page_')) {
      const pageNum = docType.replace('contract_page_', '');
      return `صفحة العقد ${pageNum}`;
    }
    return docTypeMap[docType] || docType; // ارجع النوع الأصلي إذا لم يتم العثور على تعريب
  };

  // دالة مساعدة للحصول على أيقونة المستند
  const getDocumentIcon = (docType: string) => {
    if (docType.includes('national_id')) return <FiUser className="text-blue-500" />;
    if (docType.includes('tax_card')) return <FiFileText className="text-green-500" />;
    if (docType.includes('personal_photo')) return <FiUser className="text-purple-500" />;
    if (docType.includes('contract')) return <FiFile className="text-orange-500" />;
    return <FiFile className="text-gray-500" />;
  };

  // دالة مساعدة للحصول على أيقونة حالة التحقق
  const getVerificationStatusIcon = (status: string | undefined) => {
    if (!status) return <FiClock className="text-gray-400" />;
    switch (status) {
      case 'approved':
        return <FiCheckCircle className="text-green-500" />;
      case 'rejected':
        return <FiXCircle className="text-red-500" />;
      case 'pending':
      default:
        return <FiClock className="text-yellow-500" />;
    }
  };

  // دالة مساعدة لعرض حالة التحقق بالعربية
  const getVerificationStatusText = (status: string | undefined) => {
    if (!status) return 'غير محدد';
    switch (status) {
      case 'approved':
        return 'معتمد';
      case 'rejected':
        return 'مرفوض';
      case 'pending':
      default:
        return 'قيد المراجعة';
    }
  };

  return (
    <div className="p-4 space-y-4 bg-white rounded-lg w-full max-w-full mx-auto h-full overflow-auto" dir="rtl">
      {/* رأس الصفحة مع الصورة والاسم والحالة */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-b pb-4">
        <div className="flex flex-col items-center md:items-start">
          <h2 className="text-xl font-bold mb-2">تفاصيل الوكيل المعتمد</h2>
          {onEdit && (
            <Button onClick={() => onEdit(localAgentData)} variant="outline" className="mt-1 text-sm py-1 h-8">
              تعديل البيانات
            </Button>
          )}
        </div>
        
        <div className="flex flex-row items-center gap-3">
          <div className="relative">
            {localAgentData.profile?.avatar_url ? (
              <img
                src={localAgentData.profile.avatar_url}
                alt="صورة الوكيل"
                className="w-16 h-16 rounded-full object-cover border-2 border-gray-200 shadow-md"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center border-2 border-gray-300">
                <FiUser size={24} className="text-gray-400" />
              </div>
            )}
            <Badge className={`absolute bottom-0 left-0 ${getStatusColor(displayStatus)} px-1.5 py-0.5 text-xs font-medium`}>
              {displayStatus === 'online' ? 'متاح' : 'غير نشط'}
            </Badge>
          </div>
          <div>
            <h2 className="text-md font-bold text-gray-900 text-right">{localAgentData.profile?.full_name || 'وكيل غير معروف'}</h2>
            <p className="text-xs text-gray-500 text-right">{localAgentData.profile?.phone || 'رقم الهاتف غير متوفر'}</p>
          </div>
        </div>
      </div>

      {/* قسم المعلومات الشخصية */}
      <div className="space-y-2">
        <div className="flex items-center">
          <h3 className="text-md font-semibold text-gray-800 flex items-center">
            <FiUser className="ml-1" /> المعلومات الشخصية
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 p-3 rounded-lg">
          <div className="flex items-start">
            <FiPhone className="mt-1 ml-1 text-gray-500" />
            <div>
              <p className="text-xs font-medium text-gray-500">الهاتف</p>
              <p className="text-sm font-semibold">{localAgentData.profile?.phone || 'غير متوفر'}</p>
            </div>
          </div>
          <div className="flex items-start">
            <FiMail className="mt-1 ml-1 text-gray-500" />
            <div>
              <p className="text-xs font-medium text-gray-500">البريد الإلكتروني</p>
              <p className="text-sm font-semibold break-words">{localAgentData.profile?.email || 'غير متوفر'}</p>
            </div>
          </div>
          <div className="flex items-center">
            <Label htmlFor="agent-approved" className="text-xs font-medium text-gray-500 ml-2 flex items-center">
              <FiCheckCircle className="ml-1" /> حالة الموافقة:
            </Label>
            <div className="min-w-[56px] min-h-[32px] flex items-center justify-center z-50">
              <IOSSwitch
                sx={{ m: 1 }}
                checked={localAgentData.details?.approved || false}
                onChange={(e) => handleApproveToggle(e.target.checked)}
              />
            </div>
          </div>
        </div>
        
        {/* قسم كلمة المرور */}
        <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <FiLock className="ml-2 text-gray-500" />
              <p className="text-xs font-medium text-gray-500">كلمة المرور</p>
            </div>
            {!agentPassword ? (
              <Button
                size="sm"
                variant="outline"
                onClick={handleResetPassword}
                disabled={isResettingPassword}
                className="text-xs"
              >
                {isResettingPassword ? 'جاري إعادة التعيين...' : 'إعادة تعيين كلمة المرور'}
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-white px-2 py-1 rounded border border-gray-300">
                  <input
                    type={isPasswordVisible ? "text" : "password"}
                    value={agentPassword}
                    readOnly
                    className="text-sm font-mono bg-transparent border-none outline-none text-gray-800 min-w-[120px]"
                  />
                  <button
                    onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                    className="ml-2 text-gray-500 hover:text-gray-700"
                    type="button"
                  >
                    {isPasswordVisible ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                  </button>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopyPassword}
                  className="text-xs"
                >
                  <FiCopy className="ml-1" size={14} />
                  نسخ
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleResetPassword}
                  disabled={isResettingPassword}
                  className="text-xs"
                >
                  {isResettingPassword ? 'جاري...' : 'إعادة تعيين'}
                </Button>
              </div>
            )}
          </div>
          {agentPassword && (
            <p className="text-xs text-gray-500 mt-2">
              ⚠️ يرجى نسخ كلمة المرور وحفظها في مكان آمن. لن تتمكن من رؤيتها مرة أخرى بعد إغلاق هذه النافذة.
            </p>
          )}
        </div>
      </div>

      {/* قسم معلومات العمل */}
      <div className="space-y-2">
        <div className="flex items-center">
          <h3 className="text-md font-semibold text-gray-800 flex items-center">
            <FiHome className="ml-1" /> معلومات العمل
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 p-3 rounded-lg">
          <div className="flex items-start">
            <FiHome className="mt-1 ml-1 text-gray-500" />
            <div>
              <p className="text-xs font-medium text-gray-500">موقع التخزين</p>
              <p className="text-sm font-semibold">{localAgentData.details?.storage_location || 'غير محدد'}</p>
            </div>
          </div>
          <div className="flex items-start">
            <FiMapPin className="mt-1 ml-1 text-gray-500" />
            <div>
              <p className="text-xs font-medium text-gray-500">المنطقة</p>
              <p className="text-sm font-semibold">{localAgentData.details?.region || 'غير محددة'}</p>
            </div>
          </div>
          <div className="flex items-start">
            <FiUser className="mt-1 ml-1 text-gray-500" />
            <div>
              <p className="text-xs font-medium text-gray-500">نوع الوكيل</p>
              <p className="text-sm font-semibold">
                {localAgentData.details?.agent_type === 'individual' ? 'فردي' : 
                 localAgentData.details?.agent_type === 'company' ? 'شركة' : 'غير محدد'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* قسم المناطق المغطاة */}
      <div className="space-y-2">
        <div className="flex items-center">
          <h3 className="text-md font-semibold text-gray-800 flex items-center">
            <FiMap className="ml-1" /> المناطق المغطاة
          </h3>
        </div>
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="flex flex-wrap gap-1">
            {localAgentData.approved_agent_zones && localAgentData.approved_agent_zones.length > 0 ? (
              localAgentData.approved_agent_zones.map((zone, index) => (
                <Badge 
                  key={zone.geographic_zone_id || index}
                  className={`px-2 py-1 text-xs ${zone.is_primary ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-100 text-blue-800 hover:bg-blue-200'}`}
                >
                  <FiMapPin className="inline-block ml-1" />
                  {zone.zone_name}
                  {zone.is_primary && <span className="mr-1 text-xs">(أساسي)</span>}
                </Badge>
              ))
            ) : (
              <p className="text-gray-500 text-sm">لا توجد مناطق مخصصة لهذا الوكيل</p>
            )}
          </div>
        </div>
      </div>

      {/* قسم المعلومات المالية */}
      <div className="space-y-2">
        <div className="flex items-center">
          <h3 className="text-md font-semibold text-gray-800 flex items-center">
            <FiDollarSign className="ml-1" /> المعلومات المالية
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 p-3 rounded-lg">
          <div className="flex items-start">
            <FiPercent className="mt-1 ml-1 text-gray-500" />
            <div>
              <p className="text-xs font-medium text-gray-500">معدل العمولة</p>
              <div className="text-sm font-semibold">
                {(() => {
                  const commissions = localAgentData.details?.function_specific_commissions;
                  if (commissions && commissions.length > 0) {
                    return (
                      <ul className="list-disc list-inside">
                        {commissions.map((commission, index) => (
                          <li key={index} className="text-xs">
                            <span className="font-medium">
                              {commission.type === 'waste_purchase' ? 'شراء المخلفات' : 
                               commission.type === 'product_sale' ? 'بيع المنتجات' : 
                               commission.type === 'cash_withdrawal' ? 'سحب نقدي' : 
                               commission.type === 'other' ? 'أخرى' : commission.type}:
                            </span>{' '}
                            <span className="text-blue-600">{commission.value}{commission.unit === 'percentage' ? '%' : ''}</span>
                          </li>
                        ))}
                      </ul>
                    );
                  }
                  return 'غير محدد';
                })()}
              </div>
            </div>
          </div>
          <div className="flex items-start">
            <FiCreditCard className="mt-1 ml-1 text-gray-500" />
            <div>
              <p className="text-xs font-medium text-gray-500">طريقة الدفع</p>
              <p className="text-sm font-semibold">{localAgentData.details?.payment_method || 'غير محددة'}</p>
            </div>
          </div>
          <div className="flex items-start">
            <FiDollarSign className="mt-1 ml-1 text-gray-500" />
            <div>
              <p className="text-xs font-medium text-gray-500">رصيد المحفظة</p>
              <p className="text-sm font-semibold text-green-600">
                {localAgentData.wallet?.balance?.toFixed(2) || '0.00'} {localAgentData.wallet?.currency || 'SAR'}
              </p>
              <p className="text-xs text-gray-500">نوع المحفظة: {localAgentData.wallet?.wallet_type || 'AGENT_WALLET'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* قسم المستندات */}
      {(localAgentData.documents && localAgentData.documents.length > 0) || (missingDocuments && missingDocuments.length > 0) ? (
        <div className="space-y-2">
          <div className="flex items-center">
            <h3 className="text-md font-semibold text-gray-800 flex items-center">
              <FiFileText className="ml-1" /> المستندات
            </h3>
          </div>
          
          {/* المستندات المتوفرة */}
          {localAgentData.documents && localAgentData.documents.length > 0 && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <h4 className="font-medium text-gray-700 mb-2 text-sm">المستندات المتوفرة:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {localAgentData.documents.map((doc, index) => (
                  <div key={doc.id || index} className="flex items-center p-2 border rounded-md bg-white hover:bg-blue-50 transition-colors">
                    <div className="ml-2">
                      {getDocumentIcon(doc.document_type)}
                    </div>
                    <div className="flex-grow">
                      <p className="font-medium text-xs">{localizeDocumentType(doc.document_type)}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <a 
                        href={doc.document_url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-blue-600 hover:underline text-xs px-1.5 py-0.5 border border-blue-300 rounded hover:bg-blue-100"
                      >
                        عرض
                      </a>
                      <div className="flex items-center gap-1 ml-1" title={getVerificationStatusText(doc.verification_status)}>
                        {getVerificationStatusIcon(doc.verification_status)}
                        <span className="text-xs">
                          {getVerificationStatusText(doc.verification_status)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* المستندات الناقصة */}
          {missingDocuments && missingDocuments.length > 0 && (
            <div className="bg-red-50 p-3 rounded-lg border border-red-200">
              <h4 className="font-medium text-red-700 mb-2 text-sm flex items-center">
                <FiXCircle className="ml-1" /> المستندات الناقصة:
              </h4>
              <ul className="space-y-1">
                {missingDocuments.map((doc, index) => (
                  <li key={index} className="flex items-center text-red-600 text-xs">
                    <FiXCircle className="ml-1" />
                    {localizeDocumentType(doc)}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}; 