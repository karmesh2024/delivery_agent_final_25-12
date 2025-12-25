'use client';

import React, { useState, useEffect } from 'react';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Button } from '@/shared/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table';
import { Trash2, PlusCircle, Edit, Star, StarHalf, Calendar } from 'lucide-react';
import { useAppSelector } from '@/store/index';
import { formatDate } from '@/shared/utils/formatters';

// واجهة بيانات التقييم
export interface SupplierEvaluation {
  id?: number;
  supplier_id?: string;
  quality_rating: number;
  delivery_rating: number;
  service_rating: number;
  price_rating: number;
  overall_rating?: number;
  evaluation_period_start?: string;
  evaluation_period_end?: string;
  comments?: string;
  evaluated_by: number;
  evaluation_date: string;
}

interface EvaluationsTabProps {
  initialData: SupplierEvaluation[];
  supplierId?: string;
  currentUserId: number;
  onChange: (data: SupplierEvaluation[]) => void;
  onValidityChange: (isValid: boolean) => void;
}

const EvaluationsTab: React.FC<EvaluationsTabProps> = ({
  initialData,
  supplierId,
  currentUserId,
  onChange,
  onValidityChange,
}) => {
  const { admins } = useAppSelector((state) => ({
    admins: state.admins.admins || []
  }));
  
  const [evaluations, setEvaluations] = useState<SupplierEvaluation[]>(initialData || []);
  const [editingEvaluation, setEditingEvaluation] = useState<SupplierEvaluation | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  
  // نطاق التقييم
  const ratingRange = [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];
  
  // التحقق من صحة البيانات
  useEffect(() => {
    // التقييمات دائما صحيحة، لا يتطلب التحقق من صحتها
    onValidityChange(true);
  }, [evaluations, onValidityChange]);
  
  // تحديث البيانات الأولية عند تغييرها
  useEffect(() => {
    if (initialData) {
      setEvaluations(initialData);
    }
  }, [initialData]);
  
  // إضافة تقييم جديد
  const handleAddEvaluation = () => {
    const today = new Date().toISOString().split('T')[0];
    
    const newEvaluation: SupplierEvaluation = {
      supplier_id: supplierId,
      quality_rating: 0,
      delivery_rating: 0,
      service_rating: 0,
      price_rating: 0,
      evaluation_date: today,
      evaluated_by: currentUserId
    };
    
    setEditingEvaluation(newEvaluation);
    setIsAdding(true);
  };
  
  // تعديل تقييم موجود
  const handleEditEvaluation = (evaluation: SupplierEvaluation) => {
    setEditingEvaluation({...evaluation});
    setIsAdding(false);
  };
  
  // حذف تقييم
  const handleDeleteEvaluation = (index: number) => {
    const updatedEvaluations = [...evaluations];
    updatedEvaluations.splice(index, 1);
    setEvaluations(updatedEvaluations);
    onChange(updatedEvaluations);
  };
  
  // حفظ التقييم (إضافة أو تعديل)
  const handleSaveEvaluation = () => {
    if (!editingEvaluation) return;
    
    // حساب التقييم الإجمالي
    const overall = calculateOverallRating(
      editingEvaluation.quality_rating,
      editingEvaluation.delivery_rating,
      editingEvaluation.service_rating,
      editingEvaluation.price_rating
    );
    
    const updatedEvaluation = {
      ...editingEvaluation,
      overall_rating: overall
    };
    
    let updatedEvaluations: SupplierEvaluation[];
    
    if (isAdding) {
      // إضافة تقييم جديد
      updatedEvaluations = [...evaluations, updatedEvaluation];
    } else {
      // تعديل تقييم موجود
      updatedEvaluations = evaluations.map(evaluationItem => 
        evaluationItem.id === updatedEvaluation.id ? updatedEvaluation : evaluationItem
      );
    }
    
    setEvaluations(updatedEvaluations);
    onChange(updatedEvaluations);
    setEditingEvaluation(null);
  };
  
  // إلغاء الإضافة أو التعديل
  const handleCancelEdit = () => {
    setEditingEvaluation(null);
  };
  
  // تغيير حقل في التقييم قيد التعديل
  const handleFieldChange = (field: keyof SupplierEvaluation, value: unknown) => {
    if (!editingEvaluation) return;
    
    setEditingEvaluation({
      ...editingEvaluation,
      [field]: value
    });
  };
  
  // حساب التقييم الإجمالي
  const calculateOverallRating = (
    quality: number,
    delivery: number,
    service: number,
    price: number
  ): number => {
    return parseFloat(((quality + delivery + service + price) / 4).toFixed(1));
  };
  
  // الحصول على اسم المستخدم من المعرف
  const getUserName = (userId: number): string => {
    const user = admins.find(admin => admin.id === userId.toString());
    return user ? user.full_name || 'غير معروف' : 'غير معروف';
  };
  
  // مكون لعرض النجوم حسب التقييم
  const RatingStars: React.FC<{ rating: number }> = ({ rating }) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    return (
      <div className="flex items-center">
        {[...Array(fullStars)].map((_, i) => (
          <Star key={`full-${i}`} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
        ))}
        {hasHalfStar && <StarHalf className="w-4 h-4 fill-yellow-400 text-yellow-400" />}
        {[...Array(emptyStars)].map((_, i) => (
          <Star key={`empty-${i}`} className="w-4 h-4 text-gray-300" />
        ))}
        <span className="ml-1 text-sm font-medium">{rating.toFixed(1)}</span>
      </div>
    );
  };
  
  return (
    <div className="space-y-6">
      {/* عرض قائمة التقييمات */}
      {!editingEvaluation && (
        <>
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">تقييمات المورد</h3>
            <Button 
              variant="outline" 
              onClick={handleAddEvaluation}
              className="flex items-center gap-1"
            >
              <PlusCircle className="w-4 h-4" />
              <span>إضافة تقييم</span>
            </Button>
          </div>
          
          {evaluations.length > 0 ? (
            <Table>
              <TableCaption>تاريخ تقييمات المورد</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>التاريخ</TableHead>
                  <TableHead>المقيم</TableHead>
                  <TableHead>الجودة</TableHead>
                  <TableHead>التوصيل</TableHead>
                  <TableHead>الخدمة</TableHead>
                  <TableHead>السعر</TableHead>
                  <TableHead>التقييم الإجمالي</TableHead>
                  <TableHead className="text-left">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {evaluations.map((evaluation, index) => (
                  <TableRow key={evaluation.id || index}>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        {formatDate(evaluation.evaluation_date)}
                      </div>
                    </TableCell>
                    <TableCell>{getUserName(evaluation.evaluated_by)}</TableCell>
                    <TableCell><RatingStars rating={evaluation.quality_rating} /></TableCell>
                    <TableCell><RatingStars rating={evaluation.delivery_rating} /></TableCell>
                    <TableCell><RatingStars rating={evaluation.service_rating} /></TableCell>
                    <TableCell><RatingStars rating={evaluation.price_rating} /></TableCell>
                    <TableCell>
                      <div className="font-medium">
                        <RatingStars rating={evaluation.overall_rating || 0} />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleEditEvaluation(evaluation)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleDeleteEvaluation(index)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="bg-gray-50 p-8 text-center rounded-md">
              <p className="text-gray-500">لا توجد تقييمات بعد</p>
              <Button 
                variant="outline" 
                onClick={handleAddEvaluation}
                className="mt-4"
              >
                إضافة تقييم الآن
              </Button>
            </div>
          )}
        </>
      )}
      
      {/* نموذج إضافة أو تعديل تقييم */}
      {editingEvaluation && (
        <div className="bg-gray-50 p-6 rounded-md">
          <h3 className="text-lg font-medium mb-4">
            {isAdding ? 'إضافة تقييم جديد' : 'تعديل التقييم'}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* فترة التقييم */}
            <div className="space-y-2">
              <Label htmlFor="evaluation_period_start">
                تاريخ بداية فترة التقييم
              </Label>
              <Input
                id="evaluation_period_start"
                type="date"
                value={editingEvaluation.evaluation_period_start || ''}
                onChange={(e) => handleFieldChange('evaluation_period_start', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="evaluation_period_end">
                تاريخ نهاية فترة التقييم
              </Label>
              <Input
                id="evaluation_period_end"
                type="date"
                value={editingEvaluation.evaluation_period_end || ''}
                onChange={(e) => handleFieldChange('evaluation_period_end', e.target.value)}
              />
            </div>
            
            {/* تاريخ التقييم */}
            <div className="space-y-2">
              <Label htmlFor="evaluation_date">
                تاريخ التقييم
              </Label>
              <Input
                id="evaluation_date"
                type="date"
                value={editingEvaluation.evaluation_date}
                onChange={(e) => handleFieldChange('evaluation_date', e.target.value)}
              />
            </div>
          </div>
          
          {/* تقييمات المعايير */}
          <div className="mt-6">
            <h4 className="text-md font-medium mb-3">معايير التقييم</h4>
            
            <div className="space-y-6">
              {/* تقييم الجودة */}
              <div className="space-y-2">
                <Label htmlFor="quality_rating">
                  تقييم الجودة
                </Label>
                <div className="flex items-center">
                  <Select
                    value={editingEvaluation.quality_rating.toString()}
                    onValueChange={(value) => handleFieldChange('quality_rating', Number(value))}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="اختر التقييم" />
                    </SelectTrigger>
                    <SelectContent>
                      {ratingRange.map((rating) => (
                        <SelectItem key={`quality-${rating}`} value={rating.toString()}>
                          {rating.toString()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="ml-4">
                    <RatingStars rating={editingEvaluation.quality_rating} />
                  </div>
                </div>
              </div>
              
              {/* تقييم التوصيل */}
              <div className="space-y-2">
                <Label htmlFor="delivery_rating">
                  تقييم التوصيل
                </Label>
                <div className="flex items-center">
                  <Select
                    value={editingEvaluation.delivery_rating.toString()}
                    onValueChange={(value) => handleFieldChange('delivery_rating', Number(value))}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="اختر التقييم" />
                    </SelectTrigger>
                    <SelectContent>
                      {ratingRange.map((rating) => (
                        <SelectItem key={`delivery-${rating}`} value={rating.toString()}>
                          {rating.toString()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="ml-4">
                    <RatingStars rating={editingEvaluation.delivery_rating} />
                  </div>
                </div>
              </div>
              
              {/* تقييم الخدمة */}
              <div className="space-y-2">
                <Label htmlFor="service_rating">
                  تقييم الخدمة
                </Label>
                <div className="flex items-center">
                  <Select
                    value={editingEvaluation.service_rating.toString()}
                    onValueChange={(value) => handleFieldChange('service_rating', Number(value))}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="اختر التقييم" />
                    </SelectTrigger>
                    <SelectContent>
                      {ratingRange.map((rating) => (
                        <SelectItem key={`service-${rating}`} value={rating.toString()}>
                          {rating.toString()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="ml-4">
                    <RatingStars rating={editingEvaluation.service_rating} />
                  </div>
                </div>
              </div>
              
              {/* تقييم السعر */}
              <div className="space-y-2">
                <Label htmlFor="price_rating">
                  تقييم السعر
                </Label>
                <div className="flex items-center">
                  <Select
                    value={editingEvaluation.price_rating.toString()}
                    onValueChange={(value) => handleFieldChange('price_rating', Number(value))}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="اختر التقييم" />
                    </SelectTrigger>
                    <SelectContent>
                      {ratingRange.map((rating) => (
                        <SelectItem key={`price-${rating}`} value={rating.toString()}>
                          {rating.toString()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="ml-4">
                    <RatingStars rating={editingEvaluation.price_rating} />
                  </div>
                </div>
              </div>
              
              {/* التقييم الإجمالي (محسوب تلقائيًا) */}
              <div className="space-y-2 pt-4 border-t border-gray-200">
                <div className="flex justify-between">
                  <Label>التقييم الإجمالي</Label>
                  <div className="flex items-center">
                    <RatingStars
                      rating={calculateOverallRating(
                        editingEvaluation.quality_rating,
                        editingEvaluation.delivery_rating,
                        editingEvaluation.service_rating,
                        editingEvaluation.price_rating
                      )}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* ملاحظات */}
          <div className="mt-6">
            <Label htmlFor="comments">
              ملاحظات وتعليقات
            </Label>
            <textarea
              id="comments"
              className="w-full min-h-[100px] p-2 mt-1 border rounded-md"
              value={editingEvaluation.comments || ''}
              onChange={(e) => handleFieldChange('comments', e.target.value)}
              placeholder="أضف ملاحظات أو تعليقات حول تقييم المورد..."
            />
          </div>
          
          {/* أزرار الإجراءات */}
          <div className="flex justify-end space-x-2 rtl:space-x-reverse mt-6">
            <Button variant="outline" onClick={handleCancelEdit}>
              إلغاء
            </Button>
            <Button onClick={handleSaveEvaluation}>
              حفظ
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EvaluationsTab; 