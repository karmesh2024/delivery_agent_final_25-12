'use client';

import React, { useState } from 'react';
import { CustomDialog } from '@/shared/ui/custom-dialog';
import { ReceivingApprovalRequest } from '../services/receivingApprovalService';
import { receivingApprovalService } from '../services/receivingApprovalService';
import { Button } from '@/shared/components/ui/button';
import { Textarea } from '@/shared/ui/textarea';
import { Label } from '@/shared/components/ui/label';
import { Input } from '@/shared/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Card, CardContent, CardTitle } from '@/shared/components/ui/card';
import { getCurrentUserId } from '@/lib/logger-safe';
import { useToast } from '@/shared/ui/use-toast';
import { canManageReceiving } from '../services/wasteManagementPermissions';

interface ReceivingVerificationDialogProps {
  request: ReceivingApprovalRequest;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ReceivingVerificationDialog({ 
  request, 
  isOpen, 
  onClose, 
  onSuccess 
}: ReceivingVerificationDialogProps) {
  const [verificationData, setVerificationData] = useState<{
    waste_items: Array<{
      waste_material_id: string;
      quality_grade: string;
      verified_quantity: number;
      notes?: string;
    }>;
    verification_notes?: string;
  }>({
    waste_items: (request.waste_items || []).map((item: any) => ({
      waste_material_id: item.waste_material_id,
      quality_grade: item.quality_grade || 'A',
      verified_quantity: item.quantity,
      notes: item.notes || '',
    })),
    verification_notes: '',
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    const userId = await getCurrentUserId();
    if (!userId) {
      toast({
        title: "خطأ",
        description: "يجب تسجيل الدخول أولاً",
        variant: "destructive",
      });
      return;
    }

    const permission = await canManageReceiving(userId, 'verify');
    if (!permission.allowed) {
      toast({
        title: "خطأ",
        description: permission.reason || 'ليس لديك صلاحية للتحقق من الاستلام',
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const success = await receivingApprovalService.verifyReceiving(
        request.id!,
        userId,
        verificationData
      );
      
      if (success) {
        toast({
          title: "نجح",
          description: "تم التحقق من المخلفات بنجاح",
        });
        onSuccess();
      }
    } catch (error) {
      console.error('خطأ في التحقق:', error);
      toast({
        title: "خطأ",
        description: "فشل في التحقق من المخلفات",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateWasteItem = (index: number, field: string, value: any) => {
    const updatedItems = [...verificationData.waste_items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setVerificationData({ ...verificationData, waste_items: updatedItems });
  };

  return (
    <CustomDialog
      isOpen={isOpen}
      onClose={onClose}
      title="التحقق من جودة المخلفات"
      description={`التحقق من جودة وكمية المخلفات لطلب #${request.id?.substring(0, 8)}`}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            إلغاء
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'جاري التحقق...' : 'تأكيد التحقق'}
          </Button>
        </div>
      }
    >
      <div className="space-y-4 p-4">
        {verificationData.waste_items.map((item, index) => (
          <Card key={index} className="p-4">
            <CardTitle className="text-md mb-2">
              المخلف: {item.waste_material_id}
            </CardTitle>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor={`quantity-${index}`}>الكمية المحققة</Label>
                <Input
                  id={`quantity-${index}`}
                  type="number"
                  value={item.verified_quantity}
                  onChange={(e) => updateWasteItem(index, 'verified_quantity', parseFloat(e.target.value) || 0)}
                  min="0"
                />
              </div>
              <div>
                <Label htmlFor={`quality-${index}`}>درجة الجودة</Label>
                <Select
                  value={item.quality_grade}
                  onValueChange={(v) => updateWasteItem(index, 'quality_grade', v)}
                >
                  <SelectTrigger id={`quality-${index}`}>
                    <SelectValue placeholder="اختر الجودة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A">A (ممتاز)</SelectItem>
                    <SelectItem value="B">B (جيد)</SelectItem>
                    <SelectItem value="C">C (متوسط)</SelectItem>
                    <SelectItem value="D">D (ضعيف)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-3">
                <Label htmlFor={`notes-${index}`}>ملاحظات على المخلف</Label>
                <Textarea
                  id={`notes-${index}`}
                  value={item.notes || ''}
                  onChange={(e) => updateWasteItem(index, 'notes', e.target.value)}
                  placeholder="ملاحظات خاصة بهذا المخلف..."
                />
              </div>
            </div>
          </Card>
        ))}

        <div>
          <Label htmlFor="verificationNotes">ملاحظات التحقق العامة</Label>
          <Textarea
            id="verificationNotes"
            value={verificationData.verification_notes || ''}
            onChange={(e) => setVerificationData({ ...verificationData, verification_notes: e.target.value })}
            placeholder="ملاحظات عامة حول عملية التحقق..."
          />
        </div>
      </div>
    </CustomDialog>
  );
}

