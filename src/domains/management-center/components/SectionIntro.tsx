'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import {
  InfoCircledIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@radix-ui/react-icons';

interface SectionIntroProps {
  title: string;
  description: string;
  example: string;
  icon?: React.ElementType;
  learnMoreLink?: string;
}

const SectionIntro: React.FC<SectionIntroProps> = ({ title, description, example, icon: Icon, learnMoreLink = '#' }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className="mb-6 shadow-lg hover:shadow-xl transition-shadow duration-200 ease-in-out overflow-hidden" style={{ direction: 'rtl' }}>
      <CardHeader 
        className="pb-3 pt-4 pr-4 pl-4 bg-gray-50 border-b border-gray-200 cursor-pointer flex flex-row items-center justify-between"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center">
          {Icon && <Icon className="h-7 w-7 text-blue-600 ml-4" />}
          <CardTitle className="text-xl font-semibold text-gray-800 font-sans">{title}</CardTitle>
        </div>
        <div className="flex items-center text-sm text-gray-600">
          {!isExpanded && <span className="ml-2 font-medium text-xs">تعرّف على القسم</span>}
          {isExpanded ? <ChevronUpIcon className="h-5 w-5" /> : <ChevronDownIcon className="h-5 w-5" />}
        </div>
      </CardHeader>
      <div 
        className={`transition-all duration-300 ease-in-out overflow-hidden ${isExpanded ? 'max-h-[1000px]' : 'max-h-0'}`}
        style={{ maxHeight: isExpanded ? '1000px' : '0px' }}
      >
        <CardContent className="pt-3 pb-4 pr-4 pl-4 flex flex-col" style={{ direction: 'rtl' }}>
          <CardDescription className="text-base text-gray-700 mb-3 leading-relaxed font-sans">
            {description}
          </CardDescription>
          <CardDescription className="text-sm text-gray-600 mb-4 italic leading-relaxed bg-blue-50 p-3 rounded-md border border-blue-200 font-sans">
            <span className="font-semibold">مثال إداري:</span> {example}
          </CardDescription>
          <Button 
            variant="link"
            size="sm"
            className="text-blue-700 hover:text-blue-800 mt-auto self-start p-0 h-auto text-sm font-medium font-sans"
            onClick={(e) => { 
              e.stopPropagation(); 
              console.log(`Navigate to ${learnMoreLink}/${title.toLowerCase().replace(/\s+/g, '-')}`); 
            }}
          >
            <InfoCircledIcon className="ml-2 h-4 w-4" /> 
            مزيد من التفاصيل حول {title.toLowerCase()}
          </Button>
        </CardContent>
      </div>
    </Card>
  );
};

export default SectionIntro; 