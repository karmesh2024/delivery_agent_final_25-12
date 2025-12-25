'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { 
  FiCheck, 
  FiX, 
  FiPlus, 
  FiTrash2,
  FiStar,
  FiPercent
} from 'react-icons/fi';
import { Sector, WarehouseSector } from '../services/warehouseService';
import warehouseService from '../services/warehouseService';

interface WarehouseSectorsManagerProps {
  warehouseId: number;
  warehouseName: string;
  onSectorsUpdated?: () => void;
}

const WarehouseSectorsManager: React.FC<WarehouseSectorsManagerProps> = ({
  warehouseId,
  warehouseName,
  onSectorsUpdated
}) => {
  const [availableSectors, setAvailableSectors] = useState<Sector[]>([]);
  const [warehouseSectors, setWarehouseSectors] = useState<WarehouseSector[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSector, setEditingSector] = useState<WarehouseSector | null>(null);
  const [capacityPercentage, setCapacityPercentage] = useState<number>(100);
  const [isPrimary, setIsPrimary] = useState<boolean>(false);

  useEffect(() => {
    loadData();
  }, [warehouseId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [sectors, warehouseSectorsData] = await Promise.all([
        warehouseService.getSectors(),
        warehouseService.getWarehouseSectors(warehouseId)
      ]);
      
      setAvailableSectors(sectors);
      setWarehouseSectors(warehouseSectorsData);
    } catch (error) {
      console.error('خطأ في تحميل بيانات القطاعات:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSector = async (sectorCode: string) => {
    try {
      const success = await warehouseService.addWarehouseSector(
        warehouseId, 
        sectorCode, 
        isPrimary, 
        capacityPercentage
      );
      
      if (success) {
        await loadData();
        onSectorsUpdated?.();
      }
    } catch (error) {
      console.error('خطأ في إضافة القطاع:', error);
    }
  };

  const handleRemoveSector = async (sectorCode: string) => {
    try {
      const success = await warehouseService.removeWarehouseSector(warehouseId, sectorCode);
      
      if (success) {
        await loadData();
        onSectorsUpdated?.();
      }
    } catch (error) {
      console.error('خطأ في إزالة القطاع:', error);
    }
  };

  const handleUpdateSector = async (sectorCode: string, isPrimary: boolean, capacityPercentage: number) => {
    try {
      // إزالة القطاع الحالي
      await warehouseService.removeWarehouseSector(warehouseId, sectorCode);
      
      // إضافة القطاع بالبيانات الجديدة
      const success = await warehouseService.addWarehouseSector(
        warehouseId, 
        sectorCode, 
        isPrimary, 
        capacityPercentage
      );
      
      if (success) {
        await loadData();
        onSectorsUpdated?.();
        setEditingSector(null);
      }
    } catch (error) {
      console.error('خطأ في تحديث القطاع:', error);
    }
  };

  const getAvailableSectors = () => {
    const usedSectorCodes = warehouseSectors.map(ws => ws.sector_code);
    return availableSectors.filter(sector => !usedSectorCodes.includes(sector.code));
  };

  const getTotalCapacityPercentage = () => {
    return warehouseSectors.reduce((total, ws) => total + ws.capacity_percentage, 0);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="mr-3">جاري تحميل القطاعات...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <FiStar className="w-5 h-5" />
            <span>إدارة قطاعات المخزن: {warehouseName}</span>
          </div>
          <Badge variant="outline" className="text-sm">
            إجمالي السعة: {getTotalCapacityPercentage()}%
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* القطاعات المرتبطة حالياً */}
          <div>
            <h3 className="text-lg font-semibold mb-4">القطاعات المرتبطة</h3>
            {warehouseSectors.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FiStar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p>لا توجد قطاعات مرتبطة بهذا المخزن</p>
              </div>
            ) : (
              <div className="space-y-3">
                {warehouseSectors.map((warehouseSector) => (
                  <div key={warehouseSector.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3 rtl:space-x-reverse">
                      {warehouseSector.is_primary && (
                        <FiStar className="w-4 h-4 text-yellow-500" />
                      )}
                      <div>
                        <span className="font-medium">{warehouseSector.sector?.name}</span>
                        <div className="flex items-center space-x-2 rtl:space-x-reverse text-sm text-gray-500">
                          <FiPercent className="w-3 h-3" />
                          <span>{warehouseSector.capacity_percentage}% من السعة</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingSector(warehouseSector)}
                      >
                        تعديل
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleRemoveSector(warehouseSector.sector_code)}
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* إضافة قطاع جديد */}
          <div>
            <h3 className="text-lg font-semibold mb-4">إضافة قطاع جديد</h3>
            {getAvailableSectors().length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                <p>جميع القطاعات مرتبطة بهذا المخزن</p>
              </div>
            ) : (
              <div className="space-y-4">
                {getAvailableSectors().map((sector) => (
                  <div key={sector.code} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <span className="font-medium">{sector.name}</span>
                      {sector.description && (
                        <p className="text-sm text-gray-500">{sector.description}</p>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-3 rtl:space-x-reverse">
                      <div className="flex items-center space-x-2 rtl:space-x-reverse">
                        <Label htmlFor={`primary-${sector.code}`} className="text-sm">
                          أساسي
                        </Label>
                        <Checkbox
                          id={`primary-${sector.code}`}
                          checked={isPrimary}
                          onCheckedChange={setIsPrimary}
                        />
                      </div>
                      
                      <div className="flex items-center space-x-2 rtl:space-x-reverse">
                        <Label htmlFor={`capacity-${sector.code}`} className="text-sm">
                          السعة %
                        </Label>
                        <Input
                          id={`capacity-${sector.code}`}
                          type="number"
                          min="1"
                          max="100"
                          value={capacityPercentage}
                          onChange={(e) => setCapacityPercentage(Number(e.target.value))}
                          className="w-20"
                        />
                      </div>
                      
                      <Button
                        size="sm"
                        onClick={() => handleAddSector(sector.code)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <FiPlus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* نافذة تعديل القطاع */}
          {editingSector && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-96 max-w-full mx-4">
                <h3 className="text-lg font-semibold mb-4">تعديل القطاع</h3>
                
                <div className="space-y-4">
                  <div>
                    <Label>القطاع</Label>
                    <p className="text-sm text-gray-600">{editingSector.sector?.name}</p>
                  </div>
                  
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <Checkbox
                      id="edit-primary"
                      checked={isPrimary}
                      onCheckedChange={setIsPrimary}
                    />
                    <Label htmlFor="edit-primary">قطاع أساسي</Label>
                  </div>
                  
                  <div>
                    <Label htmlFor="edit-capacity">نسبة السعة</Label>
                    <Input
                      id="edit-capacity"
                      type="number"
                      min="1"
                      max="100"
                      value={capacityPercentage}
                      onChange={(e) => setCapacityPercentage(Number(e.target.value))}
                    />
                  </div>
                </div>
                
                <div className="flex justify-end space-x-2 rtl:space-x-reverse mt-6">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditingSector(null);
                      setCapacityPercentage(100);
                      setIsPrimary(false);
                    }}
                  >
                    <FiX className="w-4 h-4 mr-2" />
                    إلغاء
                  </Button>
                  <Button
                    onClick={() => handleUpdateSector(
                      editingSector.sector_code, 
                      isPrimary, 
                      capacityPercentage
                    )}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <FiCheck className="w-4 h-4 mr-2" />
                    حفظ
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default WarehouseSectorsManager;






