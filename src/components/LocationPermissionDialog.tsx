"use client";

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { FiMapPin, FiLoader } from 'react-icons/fi';
import { clubRadioService } from '@/domains/club-zone/services/clubRadioService';

interface LocationPermissionDialogProps {
  open: boolean;
  onClose: () => void;
  onLocationGranted: (location: {
    lat: number;
    lng: number;
    accuracy?: number;
    source: 'gps' | 'district' | 'address';
    districtId?: string;
  }) => void;
  onLocationDenied: () => void;
}

export function LocationPermissionDialog({
  open,
  onClose,
  onLocationGranted,
  onLocationDenied,
}: LocationPermissionDialogProps) {
  const [step, setStep] = useState<'request' | 'district'>('request');
  const [districts, setDistricts] = useState<Array<{id: string; name_ar: string; name_en?: string}>>([]);
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setStep('request');
      setSelectedDistrict('');
      setGpsError(null);
    }
  }, [open]);

  useEffect(() => {
    if (open && step === 'district') {
      loadDistricts();
    }
  }, [open, step]);

  const loadDistricts = async () => {
    setIsLoading(true);
    try {
      const data = await clubRadioService.getAlexandriaDistricts();
      setDistricts(data);
    } catch (error) {
      console.error('Error loading districts:', error);
      setGpsError('فشل في تحميل قائمة الأحياء');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestGPS = async () => {
    setIsLoading(true);
    setGpsError(null);
    
    try {
      if (!navigator.geolocation) {
        // GPS غير مدعوم - انتقل لاختيار الحي
        setStep('district');
        setIsLoading(false);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          setIsLoading(false);
          onLocationGranted({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            source: 'gps',
          });
          onClose();
        },
        async (error) => {
          // المستخدم رفض أو حدث خطأ
          setIsLoading(false);
          if (error.code === error.PERMISSION_DENIED) {
            // انتقل لاختيار الحي
            setStep('district');
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            setGpsError('الموقع غير متاح. يرجى اختيار حيك يدوياً.');
            setStep('district');
          } else if (error.code === error.TIMEOUT) {
            setGpsError('انتهت مهلة الطلب. يرجى اختيار حيك يدوياً.');
            setStep('district');
          } else {
            // خطأ آخر - انتقل لاختيار الحي كـ fallback
            setGpsError('حدث خطأ في الحصول على الموقع. يرجى اختيار حيك يدوياً.');
            setStep('district');
          }
        },
        {
          enableHighAccuracy: false, // دقة تقريبية
          timeout: 10000,
          maximumAge: 0,
        }
      );
    } catch (error) {
      setIsLoading(false);
      setGpsError('حدث خطأ غير متوقع');
      setStep('district');
    }
  };

  const handleDistrictSelected = async () => {
    if (!selectedDistrict) return;

    setIsLoading(true);
    setGpsError(null);
    
    try {
      const point = await clubRadioService.getRandomPointInDistrict(selectedDistrict);
      setIsLoading(false);
      onLocationGranted({
        lat: point.lat,
        lng: point.lng,
        source: 'district',
        districtId: selectedDistrict,
      });
      onClose();
    } catch (error) {
      console.error('Error getting random point:', error);
      setIsLoading(false);
      setGpsError('فشل في تحديد موقع داخل الحي. يرجى المحاولة مرة أخرى.');
    }
  };

  const handleSkip = () => {
    onLocationDenied();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FiMapPin className="w-5 h-5 text-primary" />
            {step === 'request' ? 'تفعيل الموقع' : 'اختر حيك'}
          </DialogTitle>
          <DialogDescription asChild>
            <div>
              {step === 'request' ? (
                <>
                  <div className="mb-2 font-semibold text-primary">
                    ⚠️ <strong>إذن الموقع يعطيك نقاط هدية!</strong>
                  </div>
                  <div className="text-sm">
                    نحتاج إلى موقعك لتحديد موقعك على الخريطة وتحليل المناطق الأكثر استماعاً.
                  </div>
                </>
              ) : (
                <>
                  <div className="mb-2 font-semibold">
                    من أين تتابعنا؟
                  </div>
                  <div className="text-sm text-muted-foreground">
                    اختر حيك في الإسكندرية وسنضعك في موقع تقريبي داخل الحي.
                  </div>
                </>
              )}
            </div>
          </DialogDescription>
        </DialogHeader>

        {step === 'request' ? (
          <div className="space-y-4">
            {gpsError && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">{gpsError}</p>
              </div>
            )}
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <p className="text-sm text-blue-900 dark:text-blue-100 font-semibold mb-2">
                💡 الموقع يساعدنا في:
              </p>
              <ul className="text-xs text-blue-800 dark:text-blue-200 mt-2 list-disc list-inside space-y-1">
                <li>إظهار موقعك على خريطة المستمعين</li>
                <li>تحليل المناطق الأكثر استماعاً</li>
                <li>منحك نقاط إضافية</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {gpsError && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">{gpsError}</p>
              </div>
            )}
            {isLoading && districts.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <FiLoader className="w-6 h-6 animate-spin text-primary" />
                <span className="ml-2 text-sm text-muted-foreground">جاري تحميل الأحياء...</span>
              </div>
            ) : (
              <Select value={selectedDistrict} onValueChange={setSelectedDistrict}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر حيك في الإسكندرية" />
                </SelectTrigger>
                <SelectContent>
                  {districts.map((district) => (
                    <SelectItem key={district.id} value={district.id}>
                      {district.name_ar}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        )}

        <DialogFooter>
          {step === 'request' ? (
            <>
              <Button variant="outline" onClick={handleSkip} disabled={isLoading}>
                تخطي
              </Button>
              <Button onClick={handleRequestGPS} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <FiLoader className="w-4 h-4 mr-2 animate-spin" />
                    جاري الطلب...
                  </>
                ) : (
                  'موافق - تفعيل الموقع'
                )}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={handleSkip} disabled={isLoading}>
                تخطي
              </Button>
              <Button 
                onClick={handleDistrictSelected} 
                disabled={!selectedDistrict || isLoading || districts.length === 0}
              >
                {isLoading ? (
                  <>
                    <FiLoader className="w-4 h-4 mr-2 animate-spin" />
                    جاري التحديد...
                  </>
                ) : (
                  'تأكيد'
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
