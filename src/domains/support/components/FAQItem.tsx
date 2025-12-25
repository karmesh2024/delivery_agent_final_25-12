/**
 * مكون عنصر الأسئلة الشائعة
 */

import { FAQItemProps } from "../types";
import { FiChevronDown, FiChevronRight } from "react-icons/fi";

/**
 * مكون لعرض سؤال وإجابة في قسم الأسئلة الشائعة
 * يدعم فتح وإغلاق الإجابة
 */
const FAQItem = ({ faq, isOpen, toggle }: FAQItemProps) => {
  return (
    <div className="border rounded-lg mb-3 overflow-hidden">
      <div 
        className={`p-4 flex justify-between items-center cursor-pointer ${isOpen ? 'bg-blue-50' : 'bg-white'}`}
        onClick={toggle}
      >
        <h3 className={`font-medium ${isOpen ? 'text-blue-700' : 'text-gray-800'}`}>{faq.question}</h3>
        {isOpen ? (
          <FiChevronDown className="h-5 w-5 text-blue-600" />
        ) : (
          <FiChevronRight className="h-5 w-5 text-gray-500" />
        )}
      </div>
      
      {isOpen && (
        <div className="p-4 bg-white border-t">
          <p className="text-gray-600">{faq.answer}</p>
        </div>
      )}
    </div>
  );
};

export default FAQItem;