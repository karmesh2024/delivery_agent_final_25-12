import { useState, useEffect } from 'react';
import { UniversalDialog } from '@/shared/ui/universal-dialog';
import { DialogFooter } from '@/shared/ui/custom-dialog';
import { Button } from '@/shared/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { Textarea } from '@/shared/ui/textarea';
import { Label } from '@/shared/ui/label';
import { Input } from '@/shared/ui/input';
import { Checkbox } from '@/shared/ui/checkbox';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Phone, MessageSquare, Send, Download, Video, Save, Loader2 } from 'lucide-react';
import { useToast } from '@/shared/ui/use-toast';
import { UnregisteredCustomer } from '../types';
import { useAppDispatch } from '@/store/hooks';
import { updateCustomerContactStatus } from '../store/unregisteredCustomersSlice';

interface ContactDialogProps {
  isOpen: boolean;
  onClose: () => void;
  customer: UnregisteredCustomer;
}

interface ContactSettings {
  defaultVideoLink: string;
  defaultAppLink: string;
  defaultWhatsAppMessage: string;
}

// تصدير المكون كمكون افتراضي للعمل مع الاستيراد الديناميكي
function ContactDialog({ isOpen, onClose, customer }: ContactDialogProps) {
  const { toast } = useToast();
  const dispatch = useAppDispatch();
  const supabase = createClientComponentClient();
  
  const [activeTab, setActiveTab] = useState('call');
  const [isLoadingSettings, setIsLoadingSettings] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // بيانات الاتصال
  const [whatsAppMessage, setWhatsAppMessage] = useState('');
  const [notes, setNotes] = useState('');
  const [videoLink, setVideoLink] = useState('');
  const [appLink, setAppLink] = useState('');
  
  // حالة الاتصال
  const [contacted, setContacted] = useState(false);
  const [sentWhatsApp, setSentWhatsApp] = useState(false);
  const [sentAppLink, setSentAppLink] = useState(false);
  const [sentVideo, setSentVideo] = useState(false);

  // تهيئة البيانات من العميل عند فتح النافذة
  useEffect(() => {
    if (isOpen && customer.contactStatus) {
      setNotes(customer.contactStatus.notes || '');
      setContacted(customer.contactStatus.contacted || false);
      setSentWhatsApp(customer.contactStatus.sentWhatsApp || false);
      setSentAppLink(customer.contactStatus.sentAppLink || false);
      setSentVideo(customer.contactStatus.sentVideoLink || false);
    }
  }, [isOpen, customer]);

  // جلب إعدادات التواصل - منفصل عن التأثير السابق لتجنب أخطاء الهيدريشن
  useEffect(() => {
    if (typeof window !== 'undefined' && isOpen) {
      const fetchSettings = async () => {
        setIsLoadingSettings(true);
        try {
          // استخدام الجدول الجديد customer_communication_settings
          const { data, error } = await supabase
            .from('customer_communication_settings')
            .select('*')
            .eq('key', 'unregistered_customers_contact')
            .single();

          if (error) {
            console.error('Error fetching settings:', error);
            return;
          }

          if (data && data.value) {
            const settings = data.value as ContactSettings;
            setVideoLink(settings.defaultVideoLink || '');
            setAppLink(settings.defaultAppLink || '');
            
            // استبدال المتغيرات في الرسالة
            let message = settings.defaultWhatsAppMessage || '';
            message = message.replace(/{customerName}/g, customer.name || '');
            message = message.replace(/{videoLink}/g, settings.defaultVideoLink || '');
            message = message.replace(/{appLink}/g, settings.defaultAppLink || '');
            
            setWhatsAppMessage(message);
          }
        } catch (error) {
          console.error('Error:', error);
        } finally {
          setIsLoadingSettings(false);
        }
      };

      fetchSettings();
    }
  }, [isOpen, customer, supabase]);

  // حفظ حالة الاتصال
  const handleSaveContactStatus = async () => {
    setIsSaving(true);
    try {
      const contactStatus = {
        contacted,
        sentWhatsApp,
        sentAppLink,
        sentVideoLink: sentVideo,
        notes,
        lastContactDate: new Date().toISOString()
      };
      
      // تحديث حالة الاتصال في قاعدة البيانات
      await dispatch(updateCustomerContactStatus({
        customerId: customer.id,
        contactStatus
      }));
      
      toast({
        title: 'تم الحفظ بنجاح',
        description: 'تم حفظ حالة الاتصال بالعميل',
        variant: 'default',
      });
      
      onClose();
    } catch (error) {
      console.error('Error saving contact status:', error);
      toast({
        title: 'حدث خطأ',
        description: 'لم يتم حفظ حالة الاتصال، يرجى المحاولة مرة أخرى',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // إرسال رسالة واتساب
  const handleSendWhatsApp = () => {
    // تنسيق رقم الهاتف للواتساب
    const phoneNumber = customer.phone.replace(/\s+/g, '').replace(/^0/, ''); // إزالة المسافات والصفر البادئ
    const countryCode = '+966'; // رمز الدولة للسعودية
    const whatsappUrl = `https://wa.me/${countryCode}${phoneNumber}?text=${encodeURIComponent(whatsAppMessage)}`;
    
    // فتح واتساب في نافذة جديدة
    window.open(whatsappUrl, '_blank');
    
    // تحديث حالة الاتصال
    setSentWhatsApp(true);
  };

  // إجراء مكالمة هاتفية
  const handleCall = () => {
    window.location.href = `tel:${customer.phone}`;
    setContacted(true);
  };

  // محتوى نافذة الحوار
  const dialogContent = isLoadingSettings ? (
    <div className="flex justify-center items-center h-40">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  ) : (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid grid-cols-3 mb-4">
        <TabsTrigger value="call" className="text-right">
          <Phone className="h-4 w-4 ml-2" />
          اتصال
        </TabsTrigger>
        <TabsTrigger value="whatsapp" className="text-right">
          <MessageSquare className="h-4 w-4 ml-2" />
          واتساب
        </TabsTrigger>
        <TabsTrigger value="status" className="text-right">
          <Save className="h-4 w-4 ml-2" />
          الحالة
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="call" className="space-y-4">
        <div className="text-center space-y-4">
          <div className="text-lg font-medium mb-2 text-right">إجراء مكالمة هاتفية</div>
          <p className="text-muted-foreground text-right">
            اضغط على الزر أدناه للاتصال بالعميل على الرقم:
          </p>
          <div className="text-xl font-bold ltr">{customer.phone}</div>
          <Button 
            onClick={handleCall} 
            className="w-full mt-4"
          >
            <Phone className="h-4 w-4 ml-2" />
            اتصال
          </Button>
        </div>
      </TabsContent>
      
      <TabsContent value="whatsapp" className="space-y-4">
        <div className="space-y-4">
          <div className="text-lg font-medium mb-2 text-right">إرسال رسالة واتساب</div>
          
          <div className="space-y-2">
            <Label htmlFor="whatsappMessage" className="block text-right">نص الرسالة</Label>
            <Textarea 
              id="whatsappMessage" 
              value={whatsAppMessage} 
              onChange={(e) => setWhatsAppMessage(e.target.value)} 
              className="min-h-[150px] text-right"
              dir="rtl"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label htmlFor="videoLink" className="block text-right">رابط الفيديو</Label>
              <Input 
                id="videoLink" 
                value={videoLink} 
                onChange={(e) => {
                  setVideoLink(e.target.value);
                  setWhatsAppMessage(prev => prev.replace(/{videoLink}/g, e.target.value));
                }}
                className="text-left"
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="appLink" className="block text-right">رابط التطبيق</Label>
              <Input 
                id="appLink" 
                value={appLink} 
                onChange={(e) => {
                  setAppLink(e.target.value);
                  setWhatsAppMessage(prev => prev.replace(/{appLink}/g, e.target.value));
                }}
                className="text-left"
                dir="ltr"
              />
            </div>
          </div>
          
          <Button 
            onClick={handleSendWhatsApp} 
            className="w-full mt-4 bg-green-600 hover:bg-green-700"
          >
            <Send className="h-4 w-4 ml-2" />
            إرسال عبر واتساب
          </Button>
        </div>
      </TabsContent>
      
      <TabsContent value="status" className="space-y-4">
        <div className="space-y-4">
          <div className="text-lg font-medium mb-2 text-right">حالة التواصل</div>
          
          <div className="space-y-2">
            <div className="flex items-center space-x-2 space-x-reverse">
              <Checkbox 
                id="contacted" 
                checked={contacted} 
                onCheckedChange={(checked) => setContacted(checked as boolean)} 
              />
              <Label htmlFor="contacted" className="text-right">تم الاتصال بالعميل</Label>
            </div>
            
            <div className="flex items-center space-x-2 space-x-reverse">
              <Checkbox 
                id="sentWhatsApp" 
                checked={sentWhatsApp} 
                onCheckedChange={(checked) => setSentWhatsApp(checked as boolean)} 
              />
              <Label htmlFor="sentWhatsApp" className="text-right">تم إرسال رسالة واتساب</Label>
            </div>
            
            <div className="flex items-center space-x-2 space-x-reverse">
              <Checkbox 
                id="sentAppLink" 
                checked={sentAppLink} 
                onCheckedChange={(checked) => setSentAppLink(checked as boolean)} 
              />
              <Label htmlFor="sentAppLink" className="text-right">تم إرسال رابط التطبيق</Label>
            </div>
            
            <div className="flex items-center space-x-2 space-x-reverse">
              <Checkbox 
                id="sentVideo" 
                checked={sentVideo} 
                onCheckedChange={(checked) => setSentVideo(checked as boolean)} 
              />
              <Label htmlFor="sentVideo" className="text-right">تم إرسال فيديو تعريفي</Label>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="notes" className="block text-right">ملاحظات</Label>
            <Textarea 
              id="notes" 
              value={notes} 
              onChange={(e) => setNotes(e.target.value)} 
              className="min-h-[100px] text-right"
              dir="rtl"
              placeholder="أضف ملاحظات حول التواصل مع العميل..."
            />
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );

  // أزرار الحوار
  const dialogFooter = (
    <>
      <Button variant="outline" onClick={onClose}>
        إلغاء
      </Button>
      <Button 
        onClick={handleSaveContactStatus} 
        disabled={isSaving}
      >
        {isSaving ? <Loader2 className="h-4 w-4 ml-2 animate-spin" /> : null}
        حفظ حالة الاتصال
      </Button>
    </>
  );

  return (
    <UniversalDialog
      isOpen={isOpen}
      onClose={onClose}
      title={`التواصل مع ${customer.name}`}
      description="التواصل مع العميل غير المسجل وتحديث حالة الاتصال"
      footer={dialogFooter}
      maxWidth="500px"
    >
      {dialogContent}
    </UniversalDialog>
  );
}

// تصدير المكون كمكون افتراضي
export default ContactDialog;

// تصدير المكون المسمى للتوافق مع الشيفرة القديمة
export { ContactDialog }; 