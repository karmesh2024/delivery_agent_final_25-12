'use client';

import React, { useEffect, useState } from 'react';
import { useToast } from '@/shared/ui/use-toast';
import { Button } from '@/shared/ui/button';
import { PlusIcon, Pencil, Trash2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/shared/components/ui/dialog';
import { GlobalBasketConfigForm } from './GlobalBasketConfigForm';
import {
  GlobalBucketConfig,
  deleteGlobalBucketConfig,
  getGlobalBucketConfigs,
  getAgentsForBasketConfig,
  AgentForBasket,
  basket_supplier_type,
  basket_size,
} from '@/domains/product-categories/api/basketConfigService';

const SUPPLIER_LABELS: Record<basket_supplier_type, string> = {
  AUTHORIZED_AGENT: 'وكيل معتمد',
  HOME_CLIENT: 'عميل منزلي',
  SCHOOL: 'مدرسة',
  RESTAURANT: 'مطعم',
  OFFICE: 'مكتب',
  OTHER: 'أخرى',
};

const BASKET_SIZE_LABELS: Record<basket_size, string> = {
  SMALL: 'صغير',
  MEDIUM: 'متوسط',
  LARGE: 'كبير',
  EXTRA_LARGE: 'كبير جداً',
};

export const GlobalBasketConfigDetails: React.FC = () => {
  const { toast } = useToast();
  const [configs, setConfigs] = useState<GlobalBucketConfig[]>([]);
  const [agents, setAgents] = useState<AgentForBasket[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editConfig, setEditConfig] = useState<GlobalBucketConfig | null>(null);
  const [deleteConfig, setDeleteConfig] = useState<GlobalBucketConfig | null>(null);

  const load = () => {
    setLoading(true);
    Promise.all([getGlobalBucketConfigs(), getAgentsForBasketConfig()])
      .then(([c, a]) => {
        setConfigs(c);
        setAgents(a);
      })
      .catch(() => {
        setConfigs([]);
        setAgents([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const getAgentName = (agentId: string | null) => {
    if (!agentId) return '—';
    const a = agents.find((x) => x.id === agentId);
    return a ? (a.full_name || a.email || a.id) : agentId;
  };

  const handleDelete = async () => {
    if (!deleteConfig) return;
    try {
      await deleteGlobalBucketConfig(deleteConfig.id);
      toast({ title: 'تم الحذف', description: 'تم حذف إعداد السلة الشامل بنجاح.' });
      load();
    } catch {
      toast({ title: 'خطأ', description: 'فشل في حذف الإعداد', variant: 'destructive' });
    }
    setDeleteConfig(null);
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-[200px]">جاري تحميل الإعدادات...</div>;
  }

  return (
    <div className="p-4">
      <div className="flex justify-end mb-4">
        <Button onClick={() => setIsAddOpen(true)}>
          <PlusIcon className="h-4 w-4 mr-2" />
          إضافة تكوين جديد
        </Button>
      </div>
      {configs.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">
          <p>لا يوجد إعداد سلة شامل لكل الفئات. أضف تكويناً للعميل أو لوكيل محدد.</p>
          <Button onClick={() => setIsAddOpen(true)} className="mt-4">
            إضافة تكوين سلة الآن
          </Button>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">نوع المورد</TableHead>
              <TableHead className="text-right">اسم الوكيل</TableHead>
              <TableHead className="text-right">حجم السلة</TableHead>
              <TableHead className="text-right">الوزن الفارغ (كجم)</TableHead>
              <TableHead className="text-right">الحد الأقصى للوزن (كجم)</TableHead>
              <TableHead className="text-right">الحد الأدنى للتعبئة (%)</TableHead>
              <TableHead className="text-right">الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {configs.map((config) => (
              <TableRow key={config.id}>
                <TableCell>{SUPPLIER_LABELS[config.supplier_type] ?? config.supplier_type}</TableCell>
                <TableCell>{config.supplier_type === 'AUTHORIZED_AGENT' ? (config.agent_id ? getAgentName(config.agent_id) : 'الكل (لجميع الوكلاء)') : '—'}</TableCell>
                <TableCell>{BASKET_SIZE_LABELS[config.basket_size] ?? config.basket_size}</TableCell>
                <TableCell>{config.basket_empty_weight_kg}</TableCell>
                <TableCell>{config.max_net_weight_kg}</TableCell>
                <TableCell>{config.min_fill_percentage}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={() => setEditConfig(config)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="destructive" size="icon" onClick={() => setDeleteConfig(config)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={isAddOpen} onOpenChange={(open) => !open && setIsAddOpen(false)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>إضافة إعداد سلة لكل الفئات الرئيسية</DialogTitle>
            <DialogDescription>
              إعداد سلة واحد يطبق على كل الفئات. للعميل أو لوكيل معيّن (يجب اختيار اسم الوكيل عند نوع المورد: وكيل معتمد).
            </DialogDescription>
          </DialogHeader>
          <GlobalBasketConfigForm
            onClose={() => setIsAddOpen(false)}
            onSuccess={load}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editConfig} onOpenChange={(open) => !open && setEditConfig(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>تعديل إعداد السلة الشامل</DialogTitle>
            <DialogDescription>تعديل بيانات التكوين ثم الحفظ.</DialogDescription>
          </DialogHeader>
          {editConfig && (
            <GlobalBasketConfigForm
              initialConfig={editConfig}
              isEdit
              onClose={() => setEditConfig(null)}
              onSuccess={load}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteConfig} onOpenChange={(open) => !open && setDeleteConfig(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تأكيد الحذف</DialogTitle>
            <DialogDescription>هل أنت متأكد من حذف هذا الإعداد؟ لا يمكن التراجع.</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDeleteConfig(null)}>إلغاء</Button>
            <Button variant="destructive" onClick={handleDelete}>تأكيد الحذف</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
