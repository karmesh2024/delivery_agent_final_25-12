'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { Textarea } from '@/shared/ui/textarea';
import {
  FiUpload,
  FiMusic,
  FiVideo,
  FiVolume2,
  FiBell,
  FiSearch,
  FiEdit,
  FiTrash2,
  FiPlay,
  FiX,
  FiClock,
  FiImage,
  FiCalendar
} from 'react-icons/fi';
import { radioContentService, RadioContent, ContentType, MediaType } from '../services/radioContentService';
import { visualAdsService } from '../services/visualAdsService';
import { toast } from 'react-toastify';

interface ContentLibraryProps {
  onContentSelect?: (content: RadioContent | any) => void;
  selectedContentIds?: string[];
  showVisualAds?: boolean;
}

export function ContentLibrary({ onContentSelect, selectedContentIds = [], showVisualAds = false }: ContentLibraryProps) {
  const [content, setContent] = useState<RadioContent[]>([]);
  const [visualAds, setVisualAds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<ContentType | 'all'>('all');
  const [showVisualAds, setShowVisualAds] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editingContent, setEditingContent] = useState<RadioContent | null>(null);

  // Upload form state
  const [uploadForm, setUploadForm] = useState({
    title: '',
    content_type: 'clip' as ContentType,
    media_type: 'audio' as MediaType,
    file: null as File | null,
    tags: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    allow_music_overlay: false,
    // للإعلانات المرئية
    description: '',
    play_rule: 'continuous' as 'every_30_minutes' | 'hourly' | 'daily' | 'once' | 'continuous',
    scheduled_time: '',
    display_duration_seconds: 10,
  });

  useEffect(() => {
    loadContent();
  }, [filterType, searchQuery, showVisualAds]);

  const loadContent = async () => {
    try {
      setLoading(true);

      if (showVisualAds) {
        // تحميل الإعلانات المرئية
        const filters: any = {
          is_active: true,
        };

        if (searchQuery) {
          filters.search = searchQuery;
        }

        const data = await visualAdsService.getAllVisualAds(filters);
        setVisualAds(data);
        setContent([]);
      } else {
        // تحميل المحتوى الصوتي
        const filters: any = {
          is_active: true,
        };

        if (filterType !== 'all') {
          filters.content_type = filterType;
        }

        if (searchQuery) {
          filters.search = searchQuery;
        }

        const data = await radioContentService.getAllContent(filters);
        setContent(data);
        setVisualAds([]);
      }
    } catch (error) {
      console.error('Error loading content:', error);
      toast.error('حدث خطأ أثناء تحميل المحتوى');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!uploadForm.file || !uploadForm.title) {
      toast.error('يرجى إدخال العنوان واختيار ملف');
      return;
    }

    try {
      setUploading(true);

      // التحقق من صحة نوع الملف
      const fileType = uploadForm.file.type;
      const isValidType =
        (uploadForm.media_type === 'audio' && fileType.startsWith('audio/')) ||
        (uploadForm.media_type === 'video' && fileType.startsWith('video/')) ||
        (uploadForm.media_type === 'image' && fileType.startsWith('image/'));

      if (!isValidType) {
        toast.error(`نوع الملف غير صحيح. يرجى اختيار ملف ${uploadForm.media_type}`);
        return;
      }

      if (uploadForm.content_type === 'visual_ad') {
        // رفع إعلان مرئي
        const metadata: any = {
          priority: uploadForm.priority,
        };

        if (uploadForm.tags) {
          metadata.tags = uploadForm.tags.split(',').map(t => t.trim());
        }

        if (uploadForm.media_type === 'image') {
          metadata.call_to_action = 'View Now';
        }

        await visualAdsService.uploadVisualAd(
          uploadForm.file,
          uploadForm.title,
          uploadForm.media_type as 'image' | 'video',
          {
            description: uploadForm.description,
            playRule: uploadForm.play_rule,
            scheduledTime: uploadForm.scheduled_time || undefined,
            priority: uploadForm.priority,
            displayDurationSeconds: uploadForm.display_duration_seconds,
            metadata,
          }
        );

        toast.success('تم رفع الإعلان المرئي بنجاح');
      } else {
        // رفع محتوى صوتي عادي
        const metadata: any = {
          priority: uploadForm.priority,
          allow_music_overlay: uploadForm.allow_music_overlay,
        };

        if (uploadForm.tags) {
          metadata.tags = uploadForm.tags.split(',').map(t => t.trim());
        }

        await radioContentService.uploadContent(
          uploadForm.file,
          uploadForm.title,
          uploadForm.content_type,
          metadata
        );

        toast.success('تم رفع المحتوى الصوتي بنجاح');
      }

      setIsUploadDialogOpen(false);
      setUploadForm({
        title: '',
        content_type: 'clip',
        media_type: 'audio',
        file: null,
        tags: '',
        priority: 'medium',
        allow_music_overlay: false,
        description: '',
        play_rule: 'continuous',
        scheduled_time: '',
        display_duration_seconds: 10,
      });
      loadContent();
    } catch (error) {
      console.error('Error uploading content:', error);
      toast.error('حدث خطأ أثناء رفع المحتوى');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(`هل أنت متأكد من حذف ${showVisualAds ? 'هذا الإعلان المرئي' : 'هذا المحتوى'}؟`)) {
      return;
    }

    try {
      if (showVisualAds) {
        await visualAdsService.deleteVisualAd(id);
        toast.success('تم حذف الإعلان المرئي بنجاح');
      } else {
        await radioContentService.deleteContent(id);
        toast.success('تم حذف المحتوى بنجاح');
      }
      loadContent();
    } catch (error) {
      console.error('Error deleting content:', error);
      toast.error('حدث خطأ أثناء حذف المحتوى');
    }
  };

  const getContentTypeIcon = (type: ContentType) => {
    switch (type) {
      case 'clip':
        return <FiVideo className="w-5 h-5" />;
      case 'music':
        return <FiMusic className="w-5 h-5" />;
      case 'ad':
        return <FiVolume2 className="w-5 h-5" />;
      case 'announcement':
        return <FiBell className="w-5 h-5" />;
      default:
        return <FiVideo className="w-5 h-5" />;
    }
  };

  const getContentTypeLabel = (type: ContentType) => {
    switch (type) {
      case 'clip':
        return 'مقطع';
      case 'music':
        return 'موسيقى';
      case 'ad':
        return 'إعلان';
      case 'announcement':
        return 'تنبيه';
      default:
        return type;
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const filteredContent = content.filter(item => {
    if (searchQuery && !item.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  const filteredVisualAds = visualAds.filter(item => {
    if (searchQuery && !item.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">مكتبة المحتوى</h2>
          <p className="text-gray-500">إدارة Clips, Music, Ads, Announcements</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={!showVisualAds ? "default" : "outline"}
            onClick={() => setShowVisualAds(false)}
          >
            <FiMusic className="w-4 h-4 mr-2" />
            محتوى صوتي
          </Button>
          <Button
            variant={showVisualAds ? "default" : "outline"}
            onClick={() => setShowVisualAds(true)}
          >
            <FiVideo className="w-4 h-4 mr-2" />
            إعلانات مرئية
          </Button>
          <Button onClick={() => setIsUploadDialogOpen(true)}>
            <FiUpload className="w-4 h-4 mr-2" />
            رفع {showVisualAds ? 'إعلان مرئي' : 'محتوى صوتي'}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1">
          <div className="relative">
            <FiSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="بحث في المحتوى..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
          </div>
        </div>
        <Select value={filterType} onValueChange={(value) => setFilterType(value as ContentType | 'all')}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="نوع المحتوى" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">الكل</SelectItem>
            <SelectItem value="clip">مقاطع</SelectItem>
            <SelectItem value="music">موسيقى</SelectItem>
            <SelectItem value="ad">إعلانات</SelectItem>
            <SelectItem value="announcement">تنبيهات</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Content Grid */}
      {loading ? (
        <div className="text-center py-8">
          <p className="text-gray-500">جاري التحميل...</p>
        </div>
      ) : (showVisualAds ? filteredVisualAds : filteredContent).length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-gray-500">
              {showVisualAds ? 'لا توجد إعلانات مرئية' : 'لا يوجد محتوى'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(showVisualAds ? filteredVisualAds : filteredContent).map((item) => (
            <Card
              key={item.id}
              className={`cursor-pointer transition-all ${
                selectedContentIds.includes(item.id)
                  ? 'ring-2 ring-blue-500'
                  : 'hover:shadow-lg'
              }`}
              onClick={() => onContentSelect?.(item)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {showVisualAds ? (
                      item.media_type === 'video' ? <FiVideo className="w-5 h-5" /> : <FiImage className="w-5 h-5" />
                    ) : (
                      getContentTypeIcon(item.content_type)
                    )}
                    <CardTitle className="text-lg">{item.title}</CardTitle>
                  </div>
                  <Badge variant="outline">
                    {showVisualAds
                      ? (item.media_type === 'video' ? 'فيديو' : 'صورة')
                      : getContentTypeLabel(item.content_type)
                    }
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {showVisualAds ? (
                    // عرض معلومات الإعلان المرئي
                    <>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <FiClock className="w-4 h-4" />
                        <span>
                          {item.media_type === 'video'
                            ? formatDuration(item.file_duration_seconds || 0)
                            : `${item.display_duration_seconds || 10} ثانية`
                          }
                        </span>
                      </div>
                      {item.description && (
                        <p className="text-sm text-gray-600">{item.description}</p>
                      )}
                      {item.play_rule && (
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <FiCalendar className="w-4 h-4" />
                          <span>
                            {item.play_rule === 'continuous' ? 'مستمر' :
                             item.play_rule === 'every_30_minutes' ? 'كل 30 دقيقة' :
                             item.play_rule === 'hourly' ? 'كل ساعة' :
                             item.play_rule === 'daily' ? 'يومياً' :
                             item.play_rule === 'once' ? 'مرة واحدة' : item.play_rule}
                            {item.scheduled_time && ` (${item.scheduled_time})`}
                          </span>
                        </div>
                      )}
                    </>
                  ) : (
                    // عرض معلومات المحتوى الصوتي
                    <>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <FiClock className="w-4 h-4" />
                        <span>{formatDuration(item.file_duration_seconds)}</span>
                      </div>
                      {item.metadata?.tags && item.metadata.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {item.metadata.tags.map((tag, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </>
                  )}

                  <div className="flex items-center justify-between pt-2">
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingContent(item);
                        }}
                      >
                        <FiEdit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(item.id);
                        }}
                      >
                        <FiTrash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                    {onContentSelect && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onContentSelect(item);
                        }}
                      >
                        <FiPlay className="w-4 h-4 mr-1" />
                        اختيار
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Upload Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>رفع محتوى جديد</DialogTitle>
            <DialogDescription>
              ارفع ملف صوتي وأضف المعلومات المطلوبة
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>العنوان</Label>
              <Input
                value={uploadForm.title}
                onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                placeholder="عنوان المحتوى"
              />
            </div>
            <div>
              <Label>نوع المحتوى</Label>
              <Select
                value={uploadForm.content_type}
                onValueChange={(value) => setUploadForm({ ...uploadForm, content_type: value as ContentType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="clip">مقطع</SelectItem>
                  <SelectItem value="music">موسيقى</SelectItem>
                  <SelectItem value="ad">إعلان</SelectItem>
                  <SelectItem value="announcement">تنبيه</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>نوع الوسيطة</Label>
              <Select
                value={uploadForm.media_type}
                onValueChange={(value: MediaType) => {
                  setUploadForm({
                    ...uploadForm,
                    media_type: value,
                    content_type: value === 'audio' ? 'clip' : 'visual_ad'
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="audio">صوتي (MP3, WAV, إلخ)</SelectItem>
                  <SelectItem value="video">فيديو (MP4, AVI, إلخ)</SelectItem>
                  <SelectItem value="image">صورة (JPG, PNG, إلخ)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {uploadForm.media_type === 'audio' && (
              <div>
                <Label>نوع المحتوى</Label>
                <Select
                  value={uploadForm.content_type}
                  onValueChange={(value: ContentType) => setUploadForm({ ...uploadForm, content_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="clip">كليب</SelectItem>
                    <SelectItem value="music">موسيقى</SelectItem>
                    <SelectItem value="ad">إعلان صوتي</SelectItem>
                    <SelectItem value="announcement">إعلان</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label>الملف</Label>
              <Input
                type="file"
                accept={
                  uploadForm.media_type === 'audio' ? 'audio/*' :
                  uploadForm.media_type === 'video' ? 'video/*' :
                  'image/*'
                }
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setUploadForm({ ...uploadForm, file });
                  }
                }}
              />
            </div>

            {uploadForm.content_type === 'visual_ad' && (
              <>
                <div>
                  <Label>الوصف</Label>
                  <Textarea
                    value={uploadForm.description}
                    onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                    placeholder="وصف الإعلان..."
                  />
                </div>

                <div>
                  <Label>قاعدة العرض</Label>
                  <Select
                    value={uploadForm.play_rule}
                    onValueChange={(value: any) => setUploadForm({ ...uploadForm, play_rule: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="continuous">مستمر (في التدوير)</SelectItem>
                      <SelectItem value="every_30_minutes">كل 30 دقيقة</SelectItem>
                      <SelectItem value="hourly">كل ساعة</SelectItem>
                      <SelectItem value="daily">يومياً</SelectItem>
                      <SelectItem value="once">مرة واحدة</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {(uploadForm.play_rule === 'daily' || uploadForm.play_rule === 'once') && (
                  <div>
                    <Label>الوقت المحدد</Label>
                    <Input
                      type="time"
                      value={uploadForm.scheduled_time}
                      onChange={(e) => setUploadForm({ ...uploadForm, scheduled_time: e.target.value })}
                    />
                  </div>
                )}

                {uploadForm.media_type === 'image' && (
                  <div>
                    <Label>مدة العرض (بالثواني)</Label>
                    <Input
                      type="number"
                      min="5"
                      max="60"
                      value={uploadForm.display_duration_seconds}
                      onChange={(e) => setUploadForm({ ...uploadForm, display_duration_seconds: parseInt(e.target.value) })}
                    />
                  </div>
                )}
              </>
            )}

            {uploadForm.media_type === 'audio' && (
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="allow_music_overlay"
                  checked={uploadForm.allow_music_overlay}
                  onChange={(e) => setUploadForm({ ...uploadForm, allow_music_overlay: e.target.checked })}
                />
                <Label htmlFor="allow_music_overlay">السماح بتشغيل موسيقى فوق الكليب</Label>
              </div>
            )}
            <div>
              <Label>Tags (مفصولة بفواصل)</Label>
              <Input
                value={uploadForm.tags}
                onChange={(e) => setUploadForm({ ...uploadForm, tags: e.target.value })}
                placeholder="comedy, motivation, etc."
              />
            </div>
            <div>
              <Label>الأولوية</Label>
              <Select
                value={uploadForm.priority}
                onValueChange={(value) => setUploadForm({ ...uploadForm, priority: value as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">منخفضة</SelectItem>
                  <SelectItem value="medium">متوسطة</SelectItem>
                  <SelectItem value="high">عالية</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleUpload} disabled={uploading}>
              {uploading ? 'جاري الرفع...' : 'رفع'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
