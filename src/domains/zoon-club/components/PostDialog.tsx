import React, { useEffect, useState } from 'react';
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
import { Button } from '@/shared/components/ui/button';
import { Textarea } from '@/shared/ui/textarea';
import { ZoonPost, ZoonRoom } from '../services/zoonClubService';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { uploadImage } from '@/lib/uploadImage';
import { FiUpload, FiX, FiImage } from 'react-icons/fi';

const postSchema = z.object({
  room_id: z.string().min(1, 'يرجى اختيار الغرفة'),
  content: z.string().min(10, 'محتوى المنشور يجب أن يكون 10 أحرف على الأقل'),
  media_urls: z.array(z.string()).default([]),
  // V2.2 Psychological Dimensions
  intellectual_pct: z.number().min(0).max(100),
  social_pct: z.number().min(0).max(100),
  values_pct: z.number().min(0).max(100),
  template_used: z.string().optional(),
});

type PostFormValues = z.infer<typeof postSchema>;

interface PostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: Partial<ZoonPost>) => void;
  rooms: ZoonRoom[];
  defaultRoomId?: string;
}

export const PostDialog: React.FC<PostDialogProps> = ({
  open,
  onOpenChange,
  onSubmit,
  rooms,
  defaultRoomId,
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showManualTuning, setShowManualTuning] = useState(false);
  
  const form = useForm<PostFormValues>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      room_id: defaultRoomId || '',
      content: '',
      media_urls: [],
      intellectual_pct: 33,
      social_pct: 33,
      values_pct: 34,
    },
  });

  const totalPct = form.watch('intellectual_pct') + form.watch('social_pct') + form.watch('values_pct');

  // القوالب الجاهزة (Level 1)
  const templates = [
    { name: 'educational', label: 'تعليمي/تقني', icon: '📚', weights: { i: 70, s: 10, v: 20 } },
    { name: 'personal', label: 'تجربة شخصية', icon: '💬', weights: { i: 10, s: 70, v: 20 } },
    { name: 'inspirational', label: 'ملهم/أخلاقي', icon: '✨', weights: { i: 20, s: 20, v: 60 } },
  ];

  const applyTemplate = (name: string, weights: { i: number, s: number, v: number }) => {
    form.setValue('template_used', name);
    form.setValue('intellectual_pct', weights.i);
    form.setValue('social_pct', weights.s);
    form.setValue('values_pct', weights.v);
  };

  const getEngagementMessage = () => {
    const i = form.watch('intellectual_pct');
    const s = form.watch('social_pct');
    const v = form.watch('values_pct');
    if (i >= 60) return 'هذا المنشور سيجذب العقول المفكرة والخبراء.';
    if (s >= 60) return 'هذا المنشور سيحقق تفاعلاً اجتماعياً قوياً.';
    if (v >= 60) return 'هذا المنشور سيبني روابط قيمية عميقة مع الجمهور.';
    return 'منشور متوازن يستهدف قاعدة واسعة من الجمهور.';
  };

  useEffect(() => {
    if (open) {
      form.reset({
        room_id: defaultRoomId || '',
        content: '',
        media_urls: [],
        intellectual_pct: 33,
        social_pct: 33,
        values_pct: 34,
      });
      setUploadProgress(0);
      setShowManualTuning(false);
    }
  }, [open, defaultRoomId, form]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      const uploadedUrls: string[] = [];
      const totalFiles = files.length;

      for (let i = 0; i < totalFiles; i++) {
        const file = files[i];
        const url = await uploadImage(file, 'zoon-media');
        uploadedUrls.push(url);
        setUploadProgress(((i + 1) / totalFiles) * 100);
      }

      const currentUrls = form.getValues('media_urls');
      form.setValue('media_urls', [...currentUrls, ...uploadedUrls]);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('فشل رفع الصورة. يرجى المحاولة مرة أخرى.');
    } finally {
      setUploading(false);
      setUploadProgress(0);
      e.target.value = ''; 
    }
  };

  const handleRemoveMedia = (index: number) => {
    const urls = form.getValues('media_urls');
    form.setValue('media_urls', urls.filter((_, i) => i !== index));
  };

  const handleFormSubmit = (values: PostFormValues) => {
    if (totalPct !== 100) return;
    onSubmit(values);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>إنشاء منشور جديد</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="room_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>نشر في غرفة</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر الغرفة" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {rooms.map((room) => (
                        <SelectItem key={room.id} value={room.id}>
                          {room.icon} {room.name_ar}
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
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>محتوى المنشور</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="ماذا يدور في ذهنك؟" 
                      rows={5} 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 🎯 بوصلة المنشور (Social Analytics UI) */}
            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 space-y-4">
              <div className="flex items-center justify-between">
                <FormLabel className="text-blue-900 font-bold flex items-center gap-2">
                  <FiUpload className="text-blue-600" /> بوصلة المنشور (الهدف النفسي)
                </FormLabel>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm"
                  className="text-xs text-blue-600 hover:text-blue-700 underline"
                  onClick={() => setShowManualTuning(!showManualTuning)}
                >
                  {showManualTuning ? 'إخفاء الضبط الدقيق' : 'ضبط يدوي دقيق'}
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {templates.map((t) => (
                  <button
                    key={t.name}
                    type="button"
                    onClick={() => applyTemplate(t.name, t.weights)}
                    className={`flex flex-col items-center p-2 rounded-lg border transition-all ${
                      form.watch('template_used') === t.name 
                        ? 'border-blue-500 bg-blue-100 ring-2 ring-blue-200' 
                        : 'border-blue-200 bg-white hover:border-blue-300'
                    }`}
                  >
                    <span className="text-xl mb-1">{t.icon}</span>
                    <span className="text-[10px] font-bold text-blue-800">{t.label}</span>
                  </button>
                ))}
              </div>

              {showManualTuning && (
                <div className="space-y-4 pt-2 border-t border-blue-100">
                  <div className="space-y-3">
                    {[
                      { name: 'intellectual_pct', label: '🧠 فكري', color: 'bg-indigo-500' },
                      { name: 'social_pct', label: '🤝 اجتماعي', color: 'bg-emerald-500' },
                      { name: 'values_pct', label: '💡 قيمي', color: 'bg-amber-500' },
                    ].map((dim) => (
                      <div key={dim.name} className="space-y-1">
                        <div className="flex justify-between text-xs font-medium text-gray-700">
                          <label>{dim.label}</label>
                          <span>{form.watch(dim.name as any)}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={form.watch(dim.name as any)}
                          onChange={(e) => {
                            form.setValue(dim.name as any, parseInt(e.target.value));
                            form.setValue('template_used', ''); 
                          }}
                          className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                      </div>
                    ))}
                  </div>
                  
                  <div className={`text-[10px] text-center font-bold px-2 py-1 rounded-full ${totalPct === 100 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                    المجموع: {totalPct}% {totalPct === 100 ? '✓ التصنيف مكتمل' : '(يجب أن يكون المجموع 100%)'}
                  </div>
                </div>
              )}

              <div className="bg-white/80 p-2 rounded-lg text-[11px] text-blue-700 italic flex items-center gap-2 border border-blue-50">
                <span className="text-lg">💡</span> {getEngagementMessage()}
              </div>
            </div>

            <div className="space-y-3">
              <FormLabel className="flex items-center gap-2">
                <FiImage /> الصور والوسائط
              </FormLabel>
              
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 hover:border-blue-400 transition-colors">
                <input
                  type="file"
                  id="media-upload"
                  className="hidden"
                  accept="image/*,video/*"
                  multiple
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
                <label 
                  htmlFor="media-upload" 
                  className="flex flex-col items-center justify-center cursor-pointer py-4"
                >
                  <FiUpload className="w-8 h-8 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-600">
                    {uploading ? `جاري الرفع... ${Math.round(uploadProgress)}%` : 'اضغط لرفع الصور أو الفيديوهات'}
                  </span>
                  <span className="text-xs text-gray-400 mt-1">PNG, JPG, GIF, MP4 (حتى 10MB)</span>
                </label>
                
                {uploading && (
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                )}
              </div>

              {form.watch('media_urls').length > 0 && (
                <div className="grid grid-cols-3 gap-3 mt-3">
                  {form.watch('media_urls').map((url, idx) => (
                    <div key={idx} className="relative group">
                      <img 
                        src={url} 
                        alt={`Media ${idx + 1}`} 
                        className="w-full h-24 object-cover rounded-lg border-2 border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveMedia(idx)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <FiX className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>إلغاء</Button>
              <Button 
                type="submit" 
                className="bg-blue-600 hover:bg-blue-700 font-bold px-8"
                disabled={uploading || totalPct !== 100}
              >
                {totalPct !== 100 ? 'ضبط البوصلة للمتابعة' : 'نشر الآن'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
