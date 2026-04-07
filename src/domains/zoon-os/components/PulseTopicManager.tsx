'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Badge } from '@/shared/components/ui/badge';
import { Switch } from '@/shared/components/ui/switch';
import { toast } from 'sonner';
import { FiPlus, FiTrash2, FiClock, FiSearch, FiSave } from 'react-icons/fi';

interface PulseTopic {
  id: string;
  topic: string;
  category: string;
  is_active: boolean;
  run_interval_hours: number;
  last_run_at: string | null;
}

export default function PulseTopicManager() {
  const [topics, setTopics] = useState<PulseTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTopic, setNewTopic] = useState({ topic: '', category: 'general', interval: 6 });
  const [saving, setSaving] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    fetchTopics();
  }, []);

  const fetchTopics = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('pulse_topics')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) setTopics(data as PulseTopic[]);
    setLoading(false);
  };

  const handleAddTopic = async () => {
    if (!newTopic.topic) return;
    setSaving(true);
    
    const { error } = await supabase.from('pulse_topics').insert([{
      topic: newTopic.topic,
      category: newTopic.category,
      run_interval_hours: newTopic.interval,
      is_active: true
    }]);

    if (error) {
      toast.error('حدث خطأ أثناء إضافة الموضوع');
    } else {
      toast.success('تمت إضافة موضوع بنجاح');
      setNewTopic({ topic: '', category: 'general', interval: 6 });
      fetchTopics();
    }
    setSaving(false);
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('pulse_topics')
      .update({ is_active: !currentStatus })
      .eq('id', id);

    if (error) {
      toast.error('فشل تحديث الحالة');
    } else {
      setTopics(topics.map(t => t.id === id ? { ...t, is_active: !currentStatus } : t));
    }
  };

  const deleteTopic = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الموضوع؟')) return;
    
    const { error } = await supabase
      .from('pulse_topics')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('فشل الحذف');
    } else {
      toast.success('تم الحذف');
      fetchTopics();
    }
  };

  const updateInterval = async (id: string, hours: number) => {
    const { error } = await supabase
      .from('pulse_topics')
      .update({ run_interval_hours: hours })
      .eq('id', id);

    if (error) {
      toast.error('فشل تحديث الوقت');
    } else {
      toast.success('تم تحديث الفاصل الزمني');
      setTopics(topics.map(t => t.id === id ? { ...t, run_interval_hours: hours } : t));
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* إضافة موضوع جديد */}
      <Card className="border-blue-100 bg-blue-50/20">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2 font-bold">
            <FiPlus className="text-blue-600" /> إضافة موضوع مراقبة جديد
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="text-sm text-gray-500 mb-1 block">موضوع البحث (سيتم استخدامه في محركات البحث)</label>
              <Input 
                value={newTopic.topic}
                onChange={(e) => setNewTopic({...newTopic, topic: e.target.value})}
                placeholder="مثلاً: أسعار الورق في مصر اليوم..."
                className="bg-white"
              />
            </div>
            <div>
              <label className="text-sm text-gray-500 mb-1 block">الفئة</label>
              <select 
                title="الفئة"
                value={newTopic.category}
                onChange={(e) => setNewTopic({...newTopic, category: e.target.value})}
                className="w-full h-10 px-3 py-2 rounded-md border border-input bg-white text-sm"
              >
                <option value="market_prices">أسعار السوق</option>
                <option value="regulations">اللوائح والقوانين</option>
                <option value="economy">الاقتصاد</option>
                <option value="opportunities">فرص ومناقصات</option>
                <option value="general">عام</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-500 mb-1 block">التكرار (ساعات)</label>
              <div className="flex gap-2">
                <Input 
                  type="number"
                  value={newTopic.interval}
                  onChange={(e) => setNewTopic({...newTopic, interval: parseInt(e.target.value)})}
                  className="bg-white"
                  min={1}
                />
                <Button onClick={handleAddTopic} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
                  <FiSave className="ml-2" /> حفظ
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* قائمة المواضيع الحالية */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <FiSearch className="text-gray-500" /> مواضيع المراقبة النشطة
          </CardTitle>
          <Badge variant="outline">{topics.length} موضوع</Badge>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="border-b text-gray-400 text-sm">
                  <th className="py-3 px-4 font-medium">الموضوع</th>
                  <th className="py-3 px-4 font-medium">الفئة</th>
                  <th className="py-3 px-4 font-medium">التكرار (ساعات)</th>
                  <th className="py-3 px-4 font-medium">آخر تشغيل</th>
                  <th className="py-3 px-4 font-medium text-center">الحالة</th>
                  <th className="py-3 px-4 font-medium text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="text-center py-10 opacity-50">جارٍ التحميل...</td></tr>
                ) : topics.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-10 opacity-50">لا توجد مواضيع مضافة حالياً.</td></tr>
                ) : (
                  topics.map(topic => (
                    <tr key={topic.id} className="border-b hover:bg-gray-50 transition">
                      <td className="py-4 px-4 font-medium text-blue-900">{topic.topic}</td>
                      <td className="py-4 px-4">
                        <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-200 border-none">
                          {topic.category}
                        </Badge>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <FiClock className="text-gray-400 text-xs" />
                          <input 
                            title="التكرار (ساعات)"
                            type="number"
                            defaultValue={topic.run_interval_hours}
                            onBlur={(e) => updateInterval(topic.id, parseInt(e.target.value))}
                            className="w-16 h-8 text-center border rounded text-xs"
                          />
                        </div>
                      </td>
                      <td className="py-4 px-4 text-xs text-gray-500">
                        {topic.last_run_at ? new Date(topic.last_run_at).toLocaleString('ar-EG') : 'لم يعمل بعد'}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <Switch 
                          checked={topic.is_active}
                          onCheckedChange={() => toggleStatus(topic.id, topic.is_active)}
                        />
                      </td>
                      <td className="py-4 px-4 text-center">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => deleteTopic(topic.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <FiTrash2 />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
