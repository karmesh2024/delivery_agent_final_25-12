import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/shared/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/shared/components/ui/form';
import { Input } from '@/shared/components/ui/input';
import { Button } from '@/shared/components/ui/button';
import { Textarea } from '@/shared/ui/textarea';
import { Switch } from '@/shared/components/ui/switch';
import { ZoonRoom } from '../services/zoonClubService';

const roomSchema = z.object({
  name_ar: z.string().min(2, 'الاسم يجب أن يكون حرفين على الأقل'),
  description: z.string().min(5, 'الوصف يجب أن يكون 5 أحرف على الأقل'),
  is_active: z.boolean(),
  icon: z.string().min(1, 'الأيقونة مطلوبة'),
  color: z.string().min(4, 'اللون مطلوب'),
});

type RoomFormValues = z.infer<typeof roomSchema>;

interface RoomSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (id: string | null, values: Partial<ZoonRoom>) => void;
  room: ZoonRoom | null;
}

export const RoomSettingsDialog: React.FC<RoomSettingsDialogProps> = ({
  open,
  onOpenChange,
  onSubmit,
  room,
}) => {
  const form = useForm<RoomFormValues>({
    resolver: zodResolver(roomSchema),
    defaultValues: {
      name_ar: '',
      description: '',
      is_active: true,
      icon: '🏠',
      color: '#3b82f6',
    },
  });

  useEffect(() => {
    if (room) {
      form.reset({
        name_ar: room.name_ar,
        description: room.description || '',
        is_active: room.is_active,
        icon: room.icon || '🏠',
        color: room.color || '#3b82f6',
      });
    } else {
      form.reset({
        name_ar: '',
        description: '',
        is_active: true,
        icon: '🏠',
        color: '#3b82f6',
      });
    }
  }, [room, open, form]);

  const handleFormSubmit = (values: RoomFormValues) => {
    onSubmit(room?.id || null, values);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{room ? `إعدادات الغرفة: ${room.name_ar}` : 'إضافة غرفة جديدة'}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 py-4">
            <div className="grid grid-cols-4 gap-4 items-end">
              <div className="col-span-3">
                <FormField
                  control={form.control}
                  name="name_ar"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>اسم الغرفة (بالعربية)</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="col-span-1">
                <FormField
                  control={form.control}
                  name="icon"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الأيقونة</FormLabel>
                      <FormControl>
                        <Input {...field} className="text-center text-2xl" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>الوصف</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-between items-center p-3 border rounded-lg bg-slate-50">
              <div className="space-y-0.5">
                <FormLabel>حالة الغرفة</FormLabel>
                <div className="text-xs text-slate-500">تفعيل أو إيقاف الغرفة عن الظهور للمستخدمين</div>
              </div>
              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Switch 
                        checked={field.value} 
                        onCheckedChange={field.onChange} 
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>اللون المميز (Hex)</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <div 
                      className="w-10 h-10 rounded border" 
                      style={{ backgroundColor: field.value }}
                    />
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>إلغاء</Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">حفظ التعديلات</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
