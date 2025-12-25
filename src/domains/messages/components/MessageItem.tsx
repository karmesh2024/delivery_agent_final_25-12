import React from 'react';
import { Message } from '@/types';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface MessageItemProps {
  message: Message;
  isAdmin: boolean;
}

/**
 * مكون عنصر الرسالة
 * يعرض محتوى رسالة واحدة في المحادثة
 */
const MessageItem: React.FC<MessageItemProps> = ({ message, isAdmin }) => {
  /**
   * تنسيق وقت الرسالة بطريقة مناسبة للعرض
   */
  const formatMessageTime = (date: Date): string => {
    try {
      return format(date, 'h:mm a', { locale: ar });
    } catch (error) {
      // في حالة وجود مشكلة في التنسيق، نعود للطريقة البسيطة
      return date.toLocaleTimeString('ar-EG', {
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  /**
   * معالجة أنواع الرسائل المختلفة
   */
  const renderMessageContent = () => {
    // رسالة نصية عادية (الافتراضي)
    if (!message.messageType || message.messageType === 'text') {
      return <p className="text-sm whitespace-pre-wrap">{message.content}</p>;
    }

    // رسالة صورة
    if (message.messageType === 'image' && message.metadata?.imageUrl) {
      return (
        <div>
          <img 
            src={message.metadata.imageUrl as string} 
            alt="صورة مرفقة" 
            className="max-w-xs rounded-md my-1"
          />
          {message.content && <p className="text-sm mt-1">{message.content}</p>}
        </div>
      );
    }

    // رسالة موقع
    if (message.messageType === 'location' && message.metadata?.location) {
      return (
        <div>
          <div className="bg-gray-100 p-2 rounded-md flex items-center gap-2 my-1">
            <span className="text-blue-600">📍</span>
            <span className="text-sm">موقع: {message.content}</span>
          </div>
        </div>
      );
    }

    // أي نوع آخر من الرسائل
    return <p className="text-sm">{message.content}</p>;
  };

  return (
    <div
      className={`flex mb-4 ${
        isAdmin ? 'justify-end' : 'justify-start'
      }`}
    >
      <div
        className={`max-w-xs md:max-w-md lg:max-w-lg rounded-lg p-3 ${
          isAdmin
            ? 'bg-blue-500 text-white rounded-br-none'
            : 'bg-gray-100 text-gray-800 rounded-bl-none'
        }`}
      >
        {renderMessageContent()}
        
        <div className="flex items-center justify-end mt-1 space-x-1">
          <span
            className={`text-xs ${
              isAdmin ? 'text-blue-100' : 'text-gray-500'
            }`}
          >
            {formatMessageTime(message.timestamp)}
          </span>
          
          {isAdmin && (
            <span 
              className={`text-xs ${message.isRead ? 'text-blue-200' : 'text-blue-100'}`}
              title={message.isRead ? 'تم القراءة' : 'تم الإرسال'}
            >
              {message.isRead ? '✓✓' : '✓'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageItem;