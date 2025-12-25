import React from 'react';
import { OrgUnit, OrgUnitTreeNode } from '@/domains/hr/domain/types';
import { Button } from '@/shared/components/ui/button';
import { FiEdit, FiTrash2 } from 'react-icons/fi';

interface OrgTreeDisplayProps {
  tree: OrgUnitTreeNode[];
  onEdit: (unit: OrgUnit) => void;
  onDelete: (unitId: string) => void;
}

const OrgTreeDisplay: React.FC<OrgTreeDisplayProps> = ({ tree, onEdit, onDelete }) => {
  const renderNode = (node: OrgUnitTreeNode) => (
    <li key={node.id} className="mb-2 ">
      <div className="flex items-center space-x-2 rtl:space-x-reverse bg-gray-50 p-2 rounded-md border">
        <span className="font-medium text-gray-800">{node.name} {node.code ? `(${node.code})` : ''}</span>
        <div className="flex-grow" />
        <Button variant="ghost" size="sm" onClick={() => onEdit(node)}>
          <FiEdit className="h-4 w-4 text-blue-500" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onDelete(node.id)}>
          <FiTrash2 className="h-4 w-4 text-red-500" />
        </Button>
      </div>
      {node.children && node.children.length > 0 && (
        <ul className="mt-2 rtl:pr-4 ltr:pl-4 border-l-2 rtl:border-r-2 border-gray-200">
          {node.children.map(renderNode)}
        </ul>
      )}
    </li>
  );

  return ( 
    <div className="border rounded p-4 bg-white">
      {tree.length === 0 ? (
        <p className="text-gray-500 text-center">لا توجد وحدات تنظيمية لعرضها.</p>
      ) : (
        <ul className="space-y-2">{tree.map(renderNode)}</ul>
      )}
    </div>
  );
};

export default OrgTreeDisplay;



