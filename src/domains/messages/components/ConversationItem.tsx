import React from 'react';
import { Conversation, Agent } from '@/types';
import { Badge } from '@/shared/ui/badge';
import { FiMessageSquare, FiUser } from 'react-icons/fi';

interface ConversationItemProps {
  conversation: Conversation;
  agent?: Agent;
  isSelected: boolean;
  onClick: () => void;
  formatTime: (date: Date) => string;
}

/**
 * مكون عنصر المحادثة
 * يعرض تفاصيل محادثة واحدة في قائمة المحادثات
 */
const ConversationItem: React.FC<ConversationItemProps> = ({
  conversation,
  agent,
  isSelected,
  onClick,
  formatTime
}) => {
  return (
    <div
      className={`p-4 hover:bg-gray-50 cursor-pointer border-b ${
        isSelected ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        <div className="relative">
          {agent && agent.avatar_url ? (
            <img
              src={agent.avatar_url}
              alt={agent.name}
              className="w-10 h-10 rounded-full"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
              {agent ? (
                <span className="font-semibold text-sm">{agent.name.charAt(0).toUpperCase()}</span>
              ) : (
                <FiUser className="w-5 h-5" />
              )}
            </div>
          )}
          {agent && agent.status === 'online' && (
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-center mb-1">
            <h3 className="font-medium truncate">
              {agent ? agent.name : conversation.agentId}
            </h3>
            <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
              {formatTime(conversation.timestamp)}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600 truncate max-w-[180px]">
              {conversation.lastMessage || "لا توجد رسائل"}
            </p>
            {conversation.unread && (
              <Badge variant="default" className="bg-blue-500 hover:bg-blue-600 ml-2">
                جديد
              </Badge>
            )}
          </div>
          
          {conversation.type && (
            <div className="mt-1">
              <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
                {conversation.type === 'order_related' ? 'متعلق بطلب' : 
                 conversation.type === 'support' ? 'دعم فني' : 
                 conversation.type}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConversationItem;