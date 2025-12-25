import React from 'react';

interface AddApprovedAgentFormProps {
  onSuccess: (agentId: string) => void;
  onCancel: () => void;
}

export const AddApprovedAgentForm: React.FC<AddApprovedAgentFormProps> = ({ onSuccess, onCancel }) => {
  return (
    <div className="p-4">
      <p>نموذج إضافة وكيل معتمد جديد سيتم تطويره هنا.</p>
      <button onClick={() => onSuccess("mock-agent-id")}>Mock Success</button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  );
}; 