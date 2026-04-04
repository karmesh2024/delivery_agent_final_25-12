"use client";

import { useState, useEffect } from 'react';
import { Agent } from "@/types";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { fetchAgents, updateAgentDetails, deleteAgent } from "@/store/agentsSlice";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/ui/card";
import { useToast } from "@/shared/ui/use-toast";
import { Loader2, Save, Edit, Copy, RefreshCw, Trash2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/shared/ui/alert-dialog";

// تم إزالة الواجهة EditAgentFormData واستخدام Partial<Agent> مباشرة
// interface EditAgentFormData extends Partial<Agent> {
// }

export function EditAgentForm() {
  console.log("EditAgentForm component rendering");
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const { items: agents, status: agentsStatus } = useAppSelector(state => state.agents);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Agent> | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen] = useState(false);
  const [agentPendingDeletion, setAgentPendingDeletion] = useState<Agent | null>(null);

  useEffect(() => {
    if (agentsStatus !== 'loading') {
      dispatch(fetchAgents());
    }
  }, [dispatch]);

  useEffect(() => {
    if (selectedAgentId) {
      const agentToEdit = agents.find(agent => agent.id === selectedAgentId);
      if (agentToEdit) {
        setFormData({
          id: agentToEdit.id,
          name: agentToEdit.name,
          phone: agentToEdit.phone,
          status: agentToEdit.status as 'online' | 'offline' | 'busy',
          preferred_vehicle: agentToEdit.preferred_vehicle,
          license_number: agentToEdit.license_number,
          delivery_code: agentToEdit.delivery_code,
        });
      } else {
        setFormData(null);
        setSelectedAgentId(null);
      }
    } else {
      setFormData(null);
    }
  }, [selectedAgentId, agents]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!formData) return;
    const { name, value } = e.target;
    setFormData(prev => prev ? { ...prev, [name]: value } : null);
  };

  const handleSelectChange = (name: keyof Agent, value: string) => {
    if (!formData) return;
    setFormData(prev => prev ? { ...prev, [name]: value } : null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData || !formData.id) {
      toast({ title: "خطأ", description: "الرجاء اختيار مندوب وتعبئة البيانات.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      // Prepare only the changed data or the specific fields allowed for update
      // The API route currently handles: name, phone, delivery_code, license_number, preferred_vehicle, status
      const updatePayload: Partial<Agent> = {
        name: formData.name,
        phone: formData.phone,
        delivery_code: formData.delivery_code,
        license_number: formData.license_number,
        preferred_vehicle: formData.preferred_vehicle,
        status: formData.status,
        // Include other fields from formData if they are meant to be updated by this form
      };

      console.log("[EditAgentForm handleSubmit] Submitting data for update:", { agentId: formData.id, updateData: updatePayload });
      
      const resultAction = await dispatch(updateAgentDetails({ agentId: formData.id, updateData: updatePayload }));

      if (updateAgentDetails.fulfilled.match(resultAction)) {
        toast({ title: "نجاح", description: "تم تحديث بيانات المندوب بنجاح." });
        setSelectedAgentId(null); // إلغاء تحديد المندوب بعد التحديث الناجح
      } else {
        let errorMessage = "فشل تحديث بيانات المندوب.";
        if (resultAction.payload) {
          errorMessage = typeof resultAction.payload === 'string' ? resultAction.payload : JSON.stringify(resultAction.payload);
        } else if (resultAction.error && resultAction.error.message) {
          errorMessage = resultAction.error.message;
        }
        toast({ 
          title: "خطأ في التحديث", 
          description: errorMessage,
          variant: "destructive" 
        });
        console.error("[EditAgentForm handleSubmit] Error updating agent:", resultAction);
      }

    } catch (err: unknown) { // Changed to unknown
      console.error("[EditAgentForm handleSubmit] Unexpected error:", err);
      let errorMessage = "حدث خطأ أثناء تحديث بيانات المندوب.";
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      toast({ 
        title: "خطأ غير متوقع", 
        description: errorMessage, 
        variant: "destructive" 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Function to generate a random delivery code
  const generateNewDeliveryCode = () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    const length = 6; // Or any desired length
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    if (formData) {
      setFormData(prev => prev ? { ...prev, delivery_code: result } : null);
      toast({ title: "نجاح", description: "تم توليد كود دليفري جديد." });
    }
  };

  // Function to copy delivery code to clipboard
  const copyToClipboard = (text: string | undefined) => {
    if (!text) {
      toast({ title: "خطأ", description: "لا يوجد كود لنسخه.", variant: "destructive" });
      return;
    }
    navigator.clipboard.writeText(text).then(() => {
      toast({ title: "نجاح", description: "تم نسخ كود الدليفري إلى الحافظة." });
    }).catch(err => {
      console.error("Failed to copy text: ", err);
      toast({ title: "خطأ", description: "فشل نسخ الكود.", variant: "destructive" });
    });
  };

  // Filter agents based on search term (name or phone)
  const filteredAgentsForTable = agents.filter(agent => 
    (agent.name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (agent.phone?.includes(searchTerm))
  );

  const handleDeleteRequest = (agent: Agent) => {
    setAgentPendingDeletion(agent);
    setIsConfirmDeleteDialogOpen(true);
  };

  const confirmDeleteAgent = async () => {
    if (!agentPendingDeletion) return;
    
    try {
      setIsSubmitting(true);
      const resultAction = await dispatch(deleteAgent(agentPendingDeletion.id));
      
      if (deleteAgent.fulfilled.match(resultAction)) {
        toast({ title: "نجاح", description: `تم حذف المندوب ${agentPendingDeletion.name} بنجاح.` });
        
        // إذا كان المندوب المحذوف هو نفسه المختار للتعديل، قم بإفراغ النموذج
        if (selectedAgentId === agentPendingDeletion.id) {
          setSelectedAgentId(null);
          setFormData(null);
        }
      } else {
        const error = resultAction.payload as string || "فشل حذف المندوب";
        toast({ title: "خطأ", description: error, variant: "destructive" });
      }
    } catch (error) {
      console.error("Error deleting agent:", error);
      toast({ title: "خطأ", description: "حدث خطأ غير متوقع أثناء الحذف.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
      setIsConfirmDeleteDialogOpen(false); // This will trigger onOpenChange, which resets agentPendingDeletion
    }
  };

  if (agentsStatus === 'loading' && agents.length === 0) {
    return <div className="flex justify-center items-center p-4"><Loader2 className="h-8 w-8 animate-spin text-primary" /> جاري تحميل قائمة المناديب...</div>;
  }
  
  return (
    <div className="flex flex-col md:flex-row gap-6">
      <div className="w-full md:w-2/5">
        <Card>
          <CardHeader>
            <CardTitle>اختر مندوبًا للتعديل</CardTitle>
            <div className="mt-2">
              <Input 
                placeholder="ابحث بالاسم أو رقم الهاتف..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
          </CardHeader>
          <CardContent>
            {filteredAgentsForTable.length === 0 ? (
               <p className="text-center text-muted-foreground py-4">
                {searchTerm ? "لم يتم العثور على نتائج للبحث.": "لا يوجد مناديب متاحين حاليًا."}
               </p>
            ) : (
              <div className="border rounded-md max-h-[calc(100vh-350px)] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[60px]">الصورة</TableHead>
                      <TableHead>الاسم / الهاتف</TableHead>
                      <TableHead className="text-right w-[150px]">إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAgentsForTable.map(agent => (
                      <TableRow 
                        key={agent.id} 
                        className={`cursor-pointer hover:bg-muted/50 ${selectedAgentId === agent.id ? 'bg-muted' : ''}`}
                        onClick={() => setSelectedAgentId(agent.id)}
                      >
                        <TableCell>
                          {agent.avatar_url ? (
                            <img 
                              src={agent.avatar_url} 
                              alt={agent.name || 'Agent'} 
                              className="h-8 w-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 text-sm">
                              {agent.name?.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{agent.name}</div>
                          {agent.phone && <div className="text-xs text-muted-foreground">{agent.phone}</div>}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button 
                              variant={selectedAgentId === agent.id ? "default" : "outline"}
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedAgentId(agent.id);
                              }}
                              title="تعديل المندوب"
                            >
                              <Edit className="h-4 w-4 md:mr-2" />
                              <span className="hidden md:inline">{selectedAgentId === agent.id ? "محدد" : "تعديل"}</span>
                            </Button>
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteRequest(agent);
                              }}
                              title="حذف المندوب"
                            >
                              <Trash2 className="h-4 w-4 md:mr-2" />
                              <span className="hidden md:inline">حذف</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="w-full md:w-3/5">
        {selectedAgentId && formData ? (
          <Card>
            <CardHeader>
               <CardTitle>بيانات المندوب المحدد: {formData.name}</CardTitle>
               <CardDescription>قم بتعديل الحقول المطلوبة ثم اضغط على حفظ.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">الاسم الكامل</Label>
                    <Input id="name" name="name" value={formData.name || ''} onChange={handleInputChange} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">رقم الهاتف</Label>
                    <Input id="phone" name="phone" value={formData.phone || ''} onChange={handleInputChange} required />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="delivery_code">كود الدليفري</Label>
                    <div className="flex items-center gap-2">
                      <Input 
                        id="delivery_code" 
                        name="delivery_code" 
                        value={formData.delivery_code || ''} 
                        onChange={handleInputChange} 
                        className="flex-grow"
                      />
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="icon" 
                        onClick={() => copyToClipboard(formData.delivery_code)}
                        title="نسخ الكود"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="icon" 
                        onClick={generateNewDeliveryCode}
                        title="توليد كود جديد"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="license_number">رقم الرخصة</Label>
                    <Input id="license_number" name="license_number" value={formData.license_number || ''} onChange={handleInputChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="preferred_vehicle">المركبة المفضلة</Label>
                    <Select value={formData.preferred_vehicle || ''} onValueChange={(value) => handleSelectChange('preferred_vehicle', value as string)}>
                      <SelectTrigger id="preferred_vehicle">
                        <SelectValue placeholder="اختر نوع المركبة" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tricycle">دراجة ثلاثية (تروسيكل)</SelectItem>
                        <SelectItem value="pickup_truck">سيارة نصف نقل (بيك أب)</SelectItem>
                        <SelectItem value="light_truck">شاحنة خفيفة</SelectItem>
                        <SelectItem value="none">لا يوجد</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">الحالة</Label>
                    <Select value={formData.status || ''} onValueChange={(value) => handleSelectChange('status', value as string)}>
                      <SelectTrigger id="status">
                        <SelectValue placeholder="اختر حالة المندوب" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="online">متاح</SelectItem>
                        <SelectItem value="offline">غير نشط</SelectItem>
                        <SelectItem value="busy">مشغول</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> جاري الحفظ...</>
                    ) : (
                      <><Save className="mr-2 h-4 w-4" /> حفظ التعديلات</>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        ) : (
          <Card className="flex items-center justify-center h-full min-h-[300px]">
            <CardContent className="text-center">
              <p className="text-muted-foreground">الرجاء اختيار مندوب من الجدول على اليسار لتعديل بياناته.</p>
            </CardContent>
          </Card>
        )}
      </div>

      {agentPendingDeletion && (
        <AlertDialog 
          open={isConfirmDeleteDialogOpen} 
          onOpenChange={(open) => {
            setIsConfirmDeleteDialogOpen(open);
            if (!open) {
              setAgentPendingDeletion(null);
            }
          }}
        >
          <AlertDialogContent dir="rtl">
            <AlertDialogHeader>
              <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
              <AlertDialogDescription>
                هل أنت متأكد أنك تريد حذف المندوب "{agentPendingDeletion.name}"؟ لا يمكن التراجع عن هذا الإجراء.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>إلغاء</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDeleteAgent} className="bg-red-600 hover:bg-red-700">
                تأكيد الحذف
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
} 