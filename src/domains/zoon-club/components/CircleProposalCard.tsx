'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FiZap, FiTarget, FiUsers, FiArrowLeft, FiActivity, FiUserCheck } from 'react-icons/fi';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { advancedPsychologicalEngine } from '../services/zoonAdvancedPsychologicalEngine.service';
import { Loader2 } from 'lucide-react';

interface CircleProposalProps {
  circleId: string;
  userId: string;
  circleName: string;
  description: string;
  memberCount: number;
  type: string;
  onJoin: () => void;
}

export const CircleProposalCard = ({ 
  circleId,
  userId,
  circleName, 
  description, 
  memberCount, 
  type,
  onJoin 
}: CircleProposalProps) => {
  const [fitData, setFitData] = useState<{
    overall_fit: number;
    recommended_role: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFit = async () => {
      try {
        const data = await advancedPsychologicalEngine.calculateFit(userId, circleId);
        if (data) setFitData(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchFit();
  }, [circleId, userId]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className="relative overflow-hidden group rounded-2xl bg-white border border-indigo-100 shadow-xl hover:shadow-2xl transition-all duration-500 flex flex-col h-full"
    >
      {/* خلفية جمالية متغيرة */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500 opacity-5 rounded-bl-full -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-700"></div>
      
      <div className="p-6 space-y-4 flex-1 flex flex-col">
        {/* Header: Match Score */}
        <div className="flex justify-between items-center">
          {loading ? (
             <Badge className="bg-gray-50 text-gray-400 border-none px-3 py-1">
               <Loader2 className="w-3 h-3 animate-spin mr-1" /> جاري التحليل...
             </Badge>
          ) : fitData ? (
            <Badge className={`border-none px-3 py-1 font-bold ${
              fitData.overall_fit >= 80 ? 'bg-green-50 text-green-600' :
              fitData.overall_fit >= 50 ? 'bg-indigo-50 text-indigo-600' :
              'bg-amber-50 text-amber-600'
            }`}>
              <FiZap className="mr-1 inline animate-pulse" /> 
              توافق {fitData.overall_fit}%
            </Badge>
          ) : (
            <Badge className="bg-gray-50 text-gray-500 border-none px-3 py-1">0%</Badge>
          )}

          <div className="flex -space-x-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-gray-200"></div>
            ))}
            <div className="w-8 h-8 rounded-full border-2 border-white bg-indigo-600 text-white text-[10px] flex items-center justify-center">
              +{memberCount}
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="space-y-2 flex-grow">
          <h3 className="text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
            {circleName}
          </h3>
          <p className="text-sm text-gray-500 leading-relaxed line-clamp-3">
            {description}
          </p>
        </div>

        {/* AI Analysis Tag */}
        {fitData && (
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 mt-auto">
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
              <FiTarget /> دورك المقترح
            </div>
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-indigo-100 rounded-lg text-indigo-600">
                <FiUserCheck className="w-4 h-4" />
              </div>
              <div>
                <span className="text-sm font-bold text-indigo-700 capitalize">
                  {fitData.recommended_role}
                </span>
                <p className="text-[10px] text-slate-500">
                  بناءً على سماتك الشخصية
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Footer actions */}
        <div className="pt-2">
          <Button 
            onClick={onJoin}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-6 font-bold shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 group-hover:gap-4 transition-all"
          >
            اطلب الانضمام للدائرة
            <FiArrowLeft className="group-hover:-translate-x-1 transition-transform" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
};
