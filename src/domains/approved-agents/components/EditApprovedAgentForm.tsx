import React from 'react';
import { ApprovedAgent } from '@/types';

interface EditApprovedAgentFormProps {
  agent: ApprovedAgent;
  onSuccess: () => void;
  onCancel: () => void;
}

export const EditApprovedAgentForm: React.FC<EditApprovedAgentFormProps> = ({ agent, onSuccess, onCancel }) => {
  return (
    <div className="p-4">
      <p>نموذج تعديل بيانات وكيل معتمد سيتم تطويره هنا.</p>
      <p>Agent ID: {agent.id}</p>
      <button onClick={onSuccess}>Save Changes</button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  );
}; 