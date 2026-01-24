'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { 
  FiPlus, 
  FiTrash2, 
  FiEdit, 
  FiGripVertical,
  FiClock,
  FiArrowUp,
  FiArrowDown
} from 'react-icons/fi';
import { playlistTimelineService, PlaylistTimelineItem, PlayRule } from '../services/playlistTimelineService';
import { RadioContent } from '../services/radioContentService';
import { ContentLibrary } from './ContentLibrary';
import { toast } from 'react-toastify';

export function TimelineEditor() {
  const [timelineItems, setTimelineItems] = useState<PlaylistTimelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PlaylistTimelineItem | null>(null);
  const [selectedContent, setSelectedContent] = useState<RadioContent | null>(null);
  const [showContentLibrary, setShowContentLibrary] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    play_order: 0,
    scheduled_time: '',
    play_rule: 'continuous' as PlayRule,
    priority: 'medium' as 'low' | 'medium' | 'high',
  });

  useEffect(() => {
    loadTimeline();
  }, []);

  const loadTimeline = async () => {
    try {
      setLoading(true);
      const items = await playlistTimelineService.getAllTimelineItems();
      setTimelineItems(items);
    } catch (error) {
      console.error('Error loading timeline:', error);
      toast.error('حدث خطأ أثناء تحميل الجدولة');
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async () => {
    if (!selectedContent) {
      toast.error('يرجى اختيار محتوى');
      return;
    }

    try {
      // تحديد play_order (آخر ترتيب + 1)
      const maxOrder = timelineItems.length > 0
        ? Math.max(...timelineItems.map(item => item.play_order))
        : 0;

      await playlistTimelineService.createTimelineItem({
        content_id: selectedContent.id,
        play_order: maxOrder + 1,
        scheduled_time: formData.scheduled_time || undefined,
        play_rule: formData.play_rule || undefined,
        priority: formData.priority,
      });

      toast.success('تم إضافة العنصر بنجاح');
      setIsAddDialogOpen(false);
      setSelectedContent(null);
      setFormData({
        play_order: 0,
        scheduled_time: '',
        play_rule: 'continuous',
        priority: 'medium',
      });
      loadTimeline();
    } catch (error) {
      console.error('Error adding timeline item:', error);
      toast.error('حدث خطأ أثناء إضافة العنصر');
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا العنصر؟')) {
      return;
    }

    try {
      await playlistTimelineService.deleteTimelineItem(id);
      toast.success('تم حذف العنصر بنجاح');
      loadTimeline();
    } catch (error) {
      console.error('Error deleting timeline item:', error);
      toast.error('حدث خطأ أثناء حذف العنصر');
    }
  };

  const handleMoveUp = async (index: number) => {
    if (index === 0) return;

    const items = [...timelineItems];
    const temp = items[index].play_order;
    items[index].play_order = items[index - 1].play_order;
    items[index - 1].play_order = temp;

    try {
      await playlistTimelineService.updatePlaylistOrder([
        { id: items[index].id, play_order: items[index].play_order },
        { id: items[index - 1].id, play_order: items[index - 1].play_order },
      ]);
      loadTimeline();
    } catch (error) {
      console.error('Error moving item:', error);
      toast.error('حدث خطأ أثناء نقل العنصر');
    }
  };

  const handleMoveDown = async (index: number) => {
    if (index === timelineItems.length - 1) return;

    const items = [...timelineItems];
    const temp = items[index].play_order;
    items[index].play_order = items[index + 1].play_order;
    items[index + 1].play_order = temp;

    try {
      await playlistTimelineService.updatePlaylistOrder([
        { id: items[index].id, play_order: items[index].play_order },
        { id: items[index + 1].id, play_order: items[index + 1].play_order },
      ]);
      loadTimeline();
    } catch (error) {
      console.error('Error moving item:', error);
      toast.error('حدث خطأ أثناء نقل العنصر');
    }
  };

  const getPlayRuleLabel = (rule?: PlayRule) => {
    switch (rule) {
      case 'every_30_minutes':
        return 'كل 30 دقيقة';
      case 'hourly':
        return 'كل ساعة';
      case 'daily':
        return 'يومياً';
      case 'once':
        return 'مرة واحدة';
      case 'continuous':
        return 'مستمر';
      default:
        return 'مستمر';
    }
  };

  const sortedItems = [...timelineItems].sort((a, b) => a.play_order - b.play_order);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">محرر الجدولة</h2>
          <p className="text-gray-500">ترتيب وجدولة المحتوى للبث</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <FiPlus className="w-4 h-4 mr-2" />
          إضافة عنصر
        </Button>
      </div>

      {/* Timeline List */}
      {loading ? (
        <div className="text-center py-8">
          <p className="text-gray-500">جاري التحميل...</p>
        </div>
      ) : sortedItems.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-gray-500">لا توجد عناصر في الجدولة</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => setIsAddDialogOpen(true)}
            >
              <FiPlus className="w-4 h-4 mr-2" />
              إضافة عنصر أول
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {sortedItems.map((item, index) => (
            <Card key={item.id}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  {/* Drag Handle */}
                  <div className="flex flex-col gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleMoveUp(index)}
                      disabled={index === 0}
                    >
                      <FiArrowUp className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleMoveDown(index)}
                      disabled={index === sortedItems.length - 1}
                    >
                      <FiArrowDown className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Order Badge */}
                  <Badge variant="outline" className="w-10 h-10 flex items-center justify-center">
                    {item.play_order}
                  </Badge>

                  {/* Content Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{item.content?.title || 'محتوى محذوف'}</h3>
                      <Badge variant="secondary">
                        {item.content?.content_type || 'unknown'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      {item.scheduled_time && (
                        <div className="flex items-center gap-1">
                          <FiClock className="w-4 h-4" />
                          <span>{item.scheduled_time}</span>
                        </div>
                      )}
                      {item.play_rule && (
                        <Badge variant="outline" className="text-xs">
                          {getPlayRuleLabel(item.play_rule)}
                        </Badge>
                      )}
                      <Badge
                        variant={
                          item.priority === 'high'
                            ? 'default'
                            : item.priority === 'medium'
                            ? 'secondary'
                            : 'outline'
                        }
                        className="text-xs"
                      >
                        {item.priority === 'high' ? 'عالية' : item.priority === 'medium' ? 'متوسطة' : 'منخفضة'}
                      </Badge>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingItem(item);
                        setSelectedContent(item.content || null);
                        setFormData({
                          play_order: item.play_order,
                          scheduled_time: item.scheduled_time || '',
                          play_rule: item.play_rule || 'continuous',
                          priority: item.priority,
                        });
                        setIsAddDialogOpen(true);
                      }}
                    >
                      <FiEdit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteItem(item.id)}
                    >
                      <FiTrash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'تعديل عنصر' : 'إضافة عنصر جديد'}
            </DialogTitle>
            <DialogDescription>
              اختر المحتوى وحدد قواعد التشغيل
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Content Selection */}
            <div>
              <Label>المحتوى</Label>
              {selectedContent ? (
                <Card className="mt-2">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold">{selectedContent.title}</h4>
                        <p className="text-sm text-gray-500">{selectedContent.content_type}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedContent(null);
                          setShowContentLibrary(true);
                        }}
                      >
                        تغيير
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Button
                  variant="outline"
                  className="w-full mt-2"
                  onClick={() => setShowContentLibrary(true)}
                >
                  <FiPlus className="w-4 h-4 mr-2" />
                  اختيار محتوى
                </Button>
              )}
            </div>

            {/* Play Rule */}
            <div>
              <Label>قاعدة التشغيل</Label>
              <Select
                value={formData.play_rule}
                onValueChange={(value) => setFormData({ ...formData, play_rule: value as PlayRule })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="continuous">مستمر (في الدور)</SelectItem>
                  <SelectItem value="every_30_minutes">كل 30 دقيقة</SelectItem>
                  <SelectItem value="hourly">كل ساعة</SelectItem>
                  <SelectItem value="daily">يومياً</SelectItem>
                  <SelectItem value="once">مرة واحدة</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Scheduled Time (if needed) */}
            {(formData.play_rule === 'daily' || formData.play_rule === 'once') && (
              <div>
                <Label>الوقت المحدد</Label>
                <Input
                  type="time"
                  value={formData.scheduled_time}
                  onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
                />
              </div>
            )}

            {/* Priority */}
            <div>
              <Label>الأولوية</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({ ...formData, priority: value as any })}
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
            <Button variant="outline" onClick={() => {
              setIsAddDialogOpen(false);
              setEditingItem(null);
              setSelectedContent(null);
            }}>
              إلغاء
            </Button>
            <Button onClick={handleAddItem} disabled={!selectedContent}>
              {editingItem ? 'حفظ التعديلات' : 'إضافة'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Content Library Dialog */}
      {showContentLibrary && (
        <Dialog open={showContentLibrary} onOpenChange={setShowContentLibrary}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>اختر محتوى</DialogTitle>
            </DialogHeader>
            <ContentLibrary
              onContentSelect={(content) => {
                setSelectedContent(content);
                setShowContentLibrary(false);
              }}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
