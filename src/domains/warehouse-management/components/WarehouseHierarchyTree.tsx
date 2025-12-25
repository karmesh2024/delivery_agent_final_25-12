'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { 
  FiChevronRight, 
  FiChevronDown, 
  FiPackage, 
  FiMapPin, 
  FiHome,
  FiSettings,
  FiPlus,
  FiEdit,
  FiTrash2,
  FiEye
} from 'react-icons/fi';
import { WarehouseTreeNode, WarehouseLevel } from '../services/warehouseService';
import warehouseService from '../services/warehouseService';

interface WarehouseHierarchyTreeProps {
  onWarehouseSelect?: (warehouseId: number) => void;
  onAddWarehouse?: (parentId?: number, level?: WarehouseLevel) => void;
  onEditWarehouse?: (warehouseId: number) => void;
  onDeleteWarehouse?: (warehouseId: number) => void;
  onViewWarehouse?: (warehouseId: number) => void;
  refreshTrigger?: number; // إضافة trigger لإعادة التحميل
}

const WarehouseHierarchyTree: React.FC<WarehouseHierarchyTreeProps> = ({
  onWarehouseSelect,
  onAddWarehouse,
  onEditWarehouse,
  onDeleteWarehouse,
  onViewWarehouse,
  refreshTrigger
}) => {
  const [warehouseTree, setWarehouseTree] = useState<WarehouseTreeNode[]>([]);
  const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [selectedWarehouse, setSelectedWarehouse] = useState<number | null>(null);

  useEffect(() => {
    loadWarehouseTree();
  }, []);

  useEffect(() => {
    if (refreshTrigger) {
      loadWarehouseTree();
    }
  }, [refreshTrigger]);

  const loadWarehouseTree = async () => {
    try {
      setLoading(true);
      const tree = await warehouseService.getWarehouseTree();
      setWarehouseTree(tree);
      // توسيع العقد الجذرية افتراضياً
      const rootNodes = tree.filter(node => node.depth === 0);
      setExpandedNodes(new Set(rootNodes.map(node => node.id)));
    } catch (error) {
      console.error('خطأ في تحميل شجرة المخازن:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleNode = (nodeId: number) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const getLevelIcon = (level: WarehouseLevel) => {
    switch (level) {
      case 'admin':
        return <FiSettings className="w-4 h-4 text-purple-600" />;
      case 'country':
        return <FiHome className="w-4 h-4 text-blue-600" />;
      case 'city':
        return <FiMapPin className="w-4 h-4 text-green-600" />;
      case 'district':
        return <FiPackage className="w-4 h-4 text-orange-600" />;
      default:
        return <FiPackage className="w-4 h-4 text-gray-600" />;
    }
  };

  const getLevelBadgeColor = (level: WarehouseLevel) => {
    switch (level) {
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      case 'country':
        return 'bg-blue-100 text-blue-800';
      case 'city':
        return 'bg-green-100 text-green-800';
      case 'district':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getLevelLabel = (level: WarehouseLevel) => {
    switch (level) {
      case 'admin':
        return 'إدارة عليا';
      case 'country':
        return 'مخزن رئيسي';
      case 'city':
        return 'مخزن مدينة';
      case 'district':
        return 'مخزن منطقة';
      default:
        return 'مخزن';
    }
  };

  const handleWarehouseClick = (warehouseId: number) => {
    setSelectedWarehouse(warehouseId);
    onWarehouseSelect?.(warehouseId);
  };

  const renderTreeNode = (node: WarehouseTreeNode, depth: number = 0) => {
    const isExpanded = expandedNodes.has(node.id);
    const isSelected = selectedWarehouse === node.id;
    const hasChildren = node.children && node.children.length > 0;

    return (
      <div key={node.id} className="select-none">
        <div
          className={`
            flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors
            ${isSelected ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'}
          `}
          style={{ paddingLeft: `${depth * 20 + 8}px` }}
          onClick={() => handleWarehouseClick(node.id)}
        >
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            {hasChildren ? (
              <Button
                variant="ghost"
                size="sm"
                className="w-6 h-6 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleNode(node.id);
                }}
              >
                {isExpanded ? (
                  <FiChevronDown className="w-4 h-4" />
                ) : (
                  <FiChevronRight className="w-4 h-4" />
                )}
              </Button>
            ) : (
              <div className="w-6 h-6" />
            )}
            
            {getLevelIcon(node.warehouse_level)}
            
            <div className="flex flex-col">
              <span className="font-medium text-sm">{node.name}</span>
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <Badge className={`text-xs ${getLevelBadgeColor(node.warehouse_level)}`}>
                  {getLevelLabel(node.warehouse_level)}
                </Badge>
                <span className="text-xs text-gray-500">المستوى: {node.depth}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-1 rtl:space-x-reverse">
            <Button
              variant="ghost"
              size="sm"
              className="w-8 h-8 p-0"
              onClick={(e) => {
                e.stopPropagation();
                onViewWarehouse?.(node.id);
              }}
              title="عرض التفاصيل"
            >
              <FiEye className="w-4 h-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="w-8 h-8 p-0"
              onClick={(e) => {
                e.stopPropagation();
                onEditWarehouse?.(node.id);
              }}
              title="تعديل"
            >
              <FiEdit className="w-4 h-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="w-8 h-8 p-0"
              onClick={(e) => {
                e.stopPropagation();
                onAddWarehouse?.(node.id, getNextLevel(node.warehouse_level));
              }}
              title="إضافة مخزن فرعي"
            >
              <FiPlus className="w-4 h-4" />
            </Button>
            
            {node.warehouse_level !== 'admin' && (
              <Button
                variant="ghost"
                size="sm"
                className="w-8 h-8 p-0 text-red-600 hover:text-red-700"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteWarehouse?.(node.id);
                }}
                title="حذف"
              >
                <FiTrash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {isExpanded && hasChildren && (
          <div>
            {node.children?.map(child => renderTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const getNextLevel = (currentLevel: WarehouseLevel): WarehouseLevel => {
    switch (currentLevel) {
      case 'country':
        return 'city';
      case 'city':
        return 'district';
      case 'district':
        return 'district'; // لا يمكن إضافة مستويات أعمق
      default:
        return 'district';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="mr-3">جاري تحميل شجرة المخازن...</span>
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
            <FiPackage className="w-5 h-5" />
            <span>شجرة المخازن الهرمية</span>
          </div>
          <Button
            onClick={() => onAddWarehouse?.(undefined, 'country')}
            className="bg-blue-600 hover:bg-blue-700"
            size="sm"
          >
            <FiPlus className="w-4 h-4 mr-2" />
            إضافة مخزن رئيسي
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {warehouseTree.length === 0 ? (
          <div className="text-center py-8">
            <FiPackage className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">لا توجد مخازن في النظام</p>
            <Button
              onClick={() => onAddWarehouse?.(undefined, 'country')}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <FiPlus className="w-4 h-4 mr-2" />
              إضافة مخزن رئيسي
            </Button>
          </div>
        ) : (
          <div className="space-y-1">
            {warehouseTree.map(node => renderTreeNode(node))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WarehouseHierarchyTree;
