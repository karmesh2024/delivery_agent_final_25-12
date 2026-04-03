import React, { useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import { ZoonQuestion, ZoonRoom } from '../services/zoonClubService';

const questionSchema = z.object({
  room_id: z.string().min(1, 'يرجى اختيار الغرفة'),
  category: z.enum(['ENTRY', 'EXIT', 'ENGAGEMENT', 'FOLLOW_UP']),
  trigger_type: z.string().optional(),
  trigger_context: z.enum(['ENTRY', 'ENGAGEMENT', 'EXIT']).default('ENTRY'),
  question_text_ar: z.string().min(3, 'نص السؤال يجب أن يكون 3 أحرف على الأقل'),
  question_type: z.enum(['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'RATING', 'TEXT', 'RANKING']),
  points_reward: z.number().min(0),
  options: z.array(z.object({
    label: z.string().min(1, 'نص الخيار مطلوب'),
    value: z.string().min(1, 'قيمة الخيار مطلوبة'),
    psychological_impact: z.object({
      openness: z.number().optional(),
      conscientiousness: z.number().optional(),
      extraversion: z.number().optional(),
      agreeableness: z.number().optional(),
      neuroticism: z.number().optional(),
    }).optional(),
  })).min(1, 'يجب إضافة خيار واحد على الأقل'),
});

type QuestionFormValues = z.infer<typeof questionSchema>;

interface QuestionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: Partial<ZoonQuestion>) => void;
  rooms: ZoonRoom[];
  initialData?: ZoonQuestion | null;
  defaultRoomId?: string;
}

export const QuestionDialog: React.FC<QuestionDialogProps> = ({
  open,
  onOpenChange,
  onSubmit,
  rooms,
  initialData,
  defaultRoomId,
}) => {
  const form = useForm<QuestionFormValues>({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      room_id: defaultRoomId || 'all',
      category: 'ENTRY',
      question_type: 'SINGLE_CHOICE',
      points_reward: 5,
      options: [{ label: '', value: '' }],
      question_text_ar: '',
      trigger_type: '',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'options',
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        room_id: initialData.room_id,
        category: initialData.category,
        question_text_ar: initialData.question_text_ar,
        question_type: initialData.question_type,
        points_reward: initialData.points_reward,
        options: initialData.options || [{ label: '', value: '' }],
        trigger_type: initialData.trigger_type || '',
      });
    } else {
      form.reset({
        room_id: defaultRoomId || '',
        category: 'ENTRY',
        question_type: 'SINGLE_CHOICE',
        points_reward: 5,
        options: [{ label: '', value: '' }],
        question_text_ar: '',
        trigger_type: '',
      });
    }
  }, [initialData, open, defaultRoomId, form]);

  const handleFormSubmit = (values: QuestionFormValues) => {
    onSubmit(values);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? 'تعديل سؤال' : 'إضافة سؤال جديد'}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="room_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الغرفة</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر الغرفة" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {rooms.map((room) => (
                          <SelectItem key={room.id} value={room.id}>
                            {room.name_ar}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="trigger_context"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>سياق الظهور (2026 Upgrade)</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="border-blue-200 bg-blue-50/30">
                          <SelectValue placeholder="اختر السياق" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ENTRY">عند دخول الغرفة</SelectItem>
                        <SelectItem value="ENGAGEMENT">أثناء التفاعل</SelectItem>
                        <SelectItem value="EXIT">عند الخروج</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="question_text_ar"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>نص السؤال (بالعربية)</FormLabel>
                  <FormControl>
                    <Input placeholder="مثال: كيف تقيم مهاراتك في الطبخ؟" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="question_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>طريقة الإجابة</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر الطريقة" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="SINGLE_CHOICE">خيار واحد</SelectItem>
                        <SelectItem value="MULTIPLE_CHOICE">خيارات متعددة</SelectItem>
                        <SelectItem value="RATING">تقييم (1-5)</SelectItem>
                        <SelectItem value="TEXT">كتابة نصية</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="points_reward"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>نقاط المكافأة</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        onChange={(e) => field.onChange(parseInt(e.target.value))} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <FormLabel>الخيارات</FormLabel>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={() => append({ label: '', value: '' })}
                  className="gap-1 h-8"
                >
                  <FiPlus className="w-3 h-3" /> أضف خيار
                </Button>
              </div>
              
              <div className="space-y-2 border p-3 rounded-lg bg-slate-50">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex gap-2 items-start">
                    <FormField
                      control={form.control}
                      name={`options.${index}.label`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input placeholder="نص الخيار" {...field} className="bg-white" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`options.${index}.value`}
                      render={({ field }) => (
                        <FormItem className="w-24">
                          <FormControl>
                            <Input placeholder="القيمة" {...field} className="bg-white" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => remove(index)}
                      className="text-red-400 hover:text-red-500 hover:bg-red-50"
                      disabled={fields.length === 1}
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
              {form.formState.errors.options && (
                <p className="text-sm font-medium text-destructive">{form.formState.errors.options.message}</p>
              )}
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>إلغاء</Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">حفظ السؤال</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
