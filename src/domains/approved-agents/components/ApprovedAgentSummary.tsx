import React, { useState, useEffect } from 'react';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { useToast } from '@/shared/ui/use-toast';
import { ApprovedAgent, RawApprovedAgentQueryResult } from '@/types';
import { useAppDispatch } from '@/store/hooks';
import { approvedAgentService } from '@/domains/approved-agents/api/approvedAgentService';
import { MessageCircle, Phone } from 'lucide-react';
import { Label } from '@/shared/ui/label';

export interface ApprovedAgentSummaryProps {
  agentId: string;
  passwordSetByAdmin: string | null;
  onComplete: () => void;
  onBack: () => void;
  missingDocuments?: string[];
  onEdit?: (agent: ApprovedAgent) => void;
}

export const ApprovedAgentSummary: React.FC<ApprovedAgentSummaryProps> = ({
  agentId,
  passwordSetByAdmin,
  onComplete,
  onBack,
  missingDocuments,
  onEdit
}) => {
  const { toast } = useToast();
  const dispatch = useAppDispatch();
  const [agentData, setAgentData] = useState<ApprovedAgent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add console logs for debugging
  console.log("ApprovedAgentSummary rendered.");
  console.log("Current state: isLoading=", isLoading, "error=", error, "agentData=", agentData);
  console.log("Props: agentId=", agentId);

  useEffect(() => {
    console.log("ApprovedAgentSummary useEffect triggered.");
    console.log("useEffect dependencies: agentId=", agentId, "agentData=", agentData);

    const fetchAgentDetails = async () => {
      console.log("fetchAgentDetails started for agentId:", agentId);
      setIsLoading(true);
      setError(null);
      try {
        const { agent: fetchedAgent, error: fetchError } = await approvedAgentService.getApprovedAgentSummary(agentId);

        console.log("getApprovedAgentSummary returned: agent=", fetchedAgent, "error=", fetchError);

        if (fetchError) {
          console.error("fetchError received:", fetchError);
          throw new Error(fetchError);
        }

        if (fetchedAgent) {
          console.log("Setting agentData to:", fetchedAgent);
          console.log("Agent Region (agentData.details?.region):", fetchedAgent.details?.region);
          console.log("Agent Commissions (agentData.details?.function_specific_commissions):", fetchedAgent.details?.function_specific_commissions);
          console.log("Agent Covered Zones (agentData.approved_agent_zones):", fetchedAgent.approved_agent_zones);
          setAgentData(fetchedAgent);
        } else {
          console.log("No fetchedAgent, setting error.");
          setError("لم يتم العثور على بيانات الوكيل.");
        }
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : "حدث خطأ غير متوقع أثناء جلب بيانات الوكيل.";
        console.error("Error fetching agent details in catch block:", errorMessage, err);
        setError(errorMessage);
        toast({
          title: "خطأ",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        console.log("fetchAgentDetails finished. Setting isLoading to false.");
        setIsLoading(false);
      }
    };

    if (agentId && (!agentData || agentData.id !== agentId)) {
      console.log("Calling fetchAgentDetails due to condition.");
      fetchAgentDetails();
    } else {
      console.log("fetchAgentDetails NOT called. Condition was false: agentId=", agentId, "agentData=", agentData);
    }
  }, [agentId, toast, passwordSetByAdmin]); // Remove agentData from dependencies to prevent infinite loop

  // دالة مساعدة لتعريب أسماء المستندات
  const localizeDocumentType = (docType: string): string => {
    const docTypeMap: Record<string, string> = {
      national_id_front: "صورة البطاقة الشخصية (الوجه الأمامي)",
      national_id_back: "صورة البطاقة الشخصية (الوجه الخلفي)",
      tax_card_front: "صورة البطاقة الضريبية (الوجه الأمامي)",
      tax_card_back: "صورة البطاقة الضريبية (الوجه الخلفي)",
      personal_photo: "صورة شخصية للوكيل",
      contract_page_1: "صفحة العقد 1", // إضافة تعريب لصفحات العقد
      // يمكن إضافة المزيد من التعريبات هنا حسب الحاجة
    };
    // إذا كان نوع المستند هو صفحة عقد ديناميكية، حاول تعريبها
    if (docType.startsWith('contract_page_')) {
      const pageNum = docType.replace('contract_page_', '');
      return `صفحة العقد ${pageNum}`;
    }
    return docTypeMap[docType] || docType; // ارجع النوع الأصلي إذا لم يتم العثور على تعريب
  };

  // إرسال كود التحقق عبر الواتساب
  const sendDetailsViaWhatsApp = () => {
    if (!agentData?.profile?.phone || !passwordSetByAdmin) return;

    const phone = agentData.profile.phone.replace(/\+/g, '');
    let message = `مرحباً ${agentData.profile.full_name || 'الوكيل'}!\n`;
    message += `بيانات تسجيل الدخول الخاصة بك هي:\n`;
    message += `رقم الهاتف: ${agentData.profile.phone}\n`;
    message += `كلمة المرور الأولية: ${passwordSetByAdmin}\n\n`;

    if (missingDocuments && missingDocuments.length > 0) {
      message += `المستندات الناقصة التي تحتاج إلى استكمالها:\n`;
      missingDocuments.forEach(doc => {
        message += `- ${localizeDocumentType(doc)}\n`;
      });
      message += `\n`;
    }

    message += "يرجى الحفاظ على سرية هذه المعلومات وتغيير كلمة المرور الخاصة بك بعد أول تسجيل دخول.\n\n";
    message += "- نظام إدارة المندوبين والتوصيل";

    console.warn("Security Risk: Sending password via WhatsApp/SMS.");

    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  // إرسال كود التحقق عبر الرسائل القصيرة (SMS)
  const sendDetailsViaSMS = () => {
    if (!agentData?.profile?.phone || !passwordSetByAdmin) return;

    let message = `مرحباً ${agentData.profile.full_name || 'الوكيل'}!\n`;
    message += `بيانات تسجيل الدخول الخاصة بك هي:\n`;
    message += `رقم الهاتف: ${agentData.profile.phone}\n`;
    message += `كلمة المرور الأولية: ${passwordSetByAdmin}\n\n`;

    if (missingDocuments && missingDocuments.length > 0) {
      message += `المستندات الناقصة التي تحتاج إلى استكمالها:\n`;
      missingDocuments.forEach(doc => {
        message += `- ${localizeDocumentType(doc)}\n`;
      });
      message += `\n`;
    }

    message += "يرجى الحفاظ على سرية هذه المعلومات وتغيير كلمة المرور الخاصة بك بعد أول تسجيل دخول.\n\n";
    message += "- نظام إدارة المندوبين والتوصيل";

    console.warn("Security Risk: Sending password via WhatsApp/SMS.");

    // هذه دالة وهمية، يجب استبدالها بمنطق حقيقي لإرسال SMS
    // For a real implementation, you would use an SMS gateway API here.
    toast({
      title: "تم إعداد رسالة SMS",
      description: `تم تجهيز الرسالة لإرسالها إلى ${agentData.profile.phone}: ${message}`,
      variant: "success", // Added variant for consistency, assuming success is intended
    });
    console.log("SMS message to be sent to:", agentData.profile.phone, "message:", message);
  };

  if (isLoading) {
    console.log("Rendering loading state.");
    return <div className="text-center py-8">جاري تحميل ملخص بيانات الوكيل...</div>;
  }

  if (error) {
    console.log("Rendering error state:", error);
    return <div className="text-center py-8 text-red-600">خطأ: {error}</div>;
  }

  if (!agentData) {
    console.log("Rendering no data state.");
    return <div className="text-center py-8 text-gray-500">لا توجد بيانات للملخص.</div>;
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Avatar and Name Section */}
      {agentData.profile?.avatar_url && (
        <div className="flex flex-col items-end mb-6">
          <img
            src={agentData.profile.avatar_url}
            alt="Avatar"
            className="w-24 h-24 rounded-full object-cover shadow-lg mb-4"
          />
          <h2 className="text-2xl font-bold text-gray-900">{agentData.profile?.full_name || 'وكيل غير معروف'}</h2>
        </div>
      )}

      <p className="mb-4 text-gray-700">الرجاء مراجعة البيانات التالية قبل التأكيد النهائي:</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <p><span className="font-semibold text-gray-800">اسم الوكيل:</span> {agentData.profile?.full_name || 'غير متوفر'}</p>
        <p><span className="font-semibold text-gray-800">رقم الهاتف:</span> {agentData.profile?.phone || 'غير متوفر'}</p>
        <p><span className="font-semibold text-gray-800">البريد الإلكتروني:</span> {agentData.profile?.email || 'غير متوفر'}</p>
        <p><span className="font-semibold text-gray-800">موقع التخزين:</span> {agentData.details?.storage_location || 'غير محدد'}</p>
        <p><span className="font-semibold text-gray-800">المنطقة:</span> {agentData.details?.region || 'غير محدد'}</p>
        <p><span className="font-semibold text-gray-800">نوع الوكيل:</span> {agentData.details?.agent_type || 'غير محدد'}</p>
        <p><span className="font-semibold text-gray-800">طريقة الدفع:</span> {agentData.details?.payment_method || 'غير محدد'}</p>
        <div>
          <span className="font-semibold text-gray-800">عمولات الوظائف:</span> {
            (() => {
              const commissions = agentData?.details?.function_specific_commissions;
              console.log("Rendering Commissions (simple display): ", commissions, "length:", commissions?.length);
              return commissions && commissions.length > 0 ? (
                <div>
                  {commissions.map((commission, index) => (
                    <p key={index}>{commission.type}: {commission.value} {commission.unit === 'percentage' ? '%' : commission.unit}</p>
                  ))}
                </div>
              ) : (
                'غير محددة'
              );
            })()
          }
        </div>
        <div>
          <span className="font-semibold text-gray-800">المناطق المغطاة:</span> {
            (() => {
              const zones = agentData?.approved_agent_zones;
              console.log("Rendering Zones (simple display): ", zones, "length:", zones?.length);
              return zones && zones.length > 0 ? (
                <div>
                  {zones.map((zone, index) => (
                    <p key={index}>{zone.zone_name} {zone.is_primary ? '(أساسي)' : ''}</p>
                  ))}
                </div>
              ) : (
                'غير محددة'
              );
            })()
          }
        </div>
        <p><span className="font-semibold text-gray-800">الرصيد الأولي للمحفظة:</span> {agentData.wallet?.balance || '0.00'} {agentData.wallet?.currency || 'SAR'}</p>
        <p><span className="font-semibold text-gray-800">نوع المحفظة:</span> {
          (() => {
            const walletType = agentData.wallet?.wallet_type;
            console.log("Rendering Wallet Type: raw walletType=", walletType, "agentData.wallet=", agentData.wallet);
            if (walletType === '' || walletType === 'غير محدد' || !walletType) {
              return 'AGENT_WALLET';
            }
            return walletType;
          })()
        }</p>
        <p><span className="font-semibold text-gray-800">تمت الموافقة:</span> {agentData.details?.approved ? 'نعم' : 'لا'}</p>
        {passwordSetByAdmin && (
          <p className="col-span-2 text-green-700 font-bold">
            كلمة المرور الأولية للوكيل: <span className="ltr:font-mono">{passwordSetByAdmin}</span>
          </p>
        )}
      </div>

      {missingDocuments && missingDocuments.length > 0 && (
        <div className="mt-4 border-t pt-4 border-gray-200">
          <h3 className="text-lg font-bold mb-2 text-red-600">المستندات الناقصة (لإكمال الموافقة):</h3>
          <ul className="list-disc list-inside space-y-1 text-red-500">
            {missingDocuments.map((doc, index) => (
              <li key={index}>{localizeDocumentType(doc)}</li>
            ))}
          </ul>
        </div>
      )}

      {(passwordSetByAdmin && agentData.profile?.phone) && (
        <div className="mt-4 space-y-2">
          <Label className="text-gray-800">إرسال بيانات الاعتماد للوكيل</Label>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              className="flex items-center gap-2"
              onClick={sendDetailsViaWhatsApp}
              disabled={!agentData.profile.phone || !passwordSetByAdmin}
            >
              <MessageCircle className="h-4 w-4" />
              <span>إرسال عبر واتساب</span>
            </Button>
            <Button
              variant="secondary"
              className="flex items-center gap-2"
              onClick={sendDetailsViaSMS}
              disabled={!agentData.profile.phone || !passwordSetByAdmin}
            >
              <Phone className="h-4 w-4" />
              <span>إرسال عبر SMS</span>
            </Button>
          </div>
          {!agentData.profile.phone && (
            <p className="text-xs text-amber-500">
              لا يمكن إرسال البيانات: رقم الهاتف غير متوفر للوكيل.
            </p>
          )}
        </div>
      )}

      <div className="mt-8 space-x-4 flex justify-between">
        <Button type="button" variant="outline" onClick={onBack}>
          السابق
        </Button>
        {onEdit && agentData && (
          <Button type="button" variant="secondary" onClick={() => onEdit(agentData)}>
            تعديل
          </Button>
        )}
        <Button type="button" onClick={onComplete}>
          تأكيد وإنهاء
        </Button>
      </div>
    </div>
  );
}; 