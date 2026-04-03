import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ZoonCircle, ZoonCircleMember, ZoonCircleResource } from '../../services/zoonCirclesService';
import { FiLogOut, FiLink, FiUser } from 'react-icons/fi';
import { GroupHarmonyAnalysis } from '../../services/zoonMindEngineService';

interface CircleNodeProps {
  circle: ZoonCircle;
  members?: ZoonCircleMember[];
  resources?: ZoonCircleResource[];
  harmony?: GroupHarmonyAnalysis;
  onClick?: () => void;
  isActive?: boolean;
  hasActiveCircle?: boolean;
  onDragEnd?: (x: number, y: number) => void;
  onMemberDrop?: (member: ZoonCircleMember, x: number, y: number) => void;
  onResourceDrop?: (resource: ZoonCircleResource, x: number, y: number) => void;
  onMemberAction?: (member: ZoonCircleMember, action: 'EXIT' | 'LINK') => void;
  onMenuToggle?: (isOpen: boolean) => void;
}

export const CircleNode: React.FC<CircleNodeProps> = ({ 
  circle, 
  members = [], 
  resources = [], 
  harmony,
  onClick, 
  isActive,
  hasActiveCircle,
  onDragEnd,
  onMemberDrop,
  onResourceDrop,
  onMemberAction,
  onMenuToggle
}) => {
  const [activeMenuMember, setActiveMenuMember] = useState<string | null>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  // حجم الدائرة الأساسي
  const baseSize = 250;
  const size = baseSize * circle.scale;
  
  const getPosition = (index: number, total: number, radius: number) => {
    const angle = (index * 2 * Math.PI) / Math.max(total, 1) - Math.PI / 2;
    return {
      x: Math.cos(angle) * (radius * circle.scale),
      y: Math.sin(angle) * (radius * circle.scale),
    };
  };

  const toggleMenu = (memberId: string | null) => {
    setActiveMenuMember(memberId);
    onMenuToggle?.(!!memberId);
  };

  const handlePointerDown = (e: React.PointerEvent, memberId: string) => {
    e.stopPropagation();
    longPressTimer.current = setTimeout(() => {
      toggleMenu(memberId);
    }, 600); // 600ms for long press
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    e.stopPropagation();
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
  };

  return (
    <motion.div
      drag={!activeMenuMember} // Disable circle drag when a menu is open
      dragMomentum={false}
      onDragEnd={(e, info) => {
        const newX = circle.position_x + info.offset.x;
        const newY = circle.position_y + info.offset.y;
        onDragEnd?.(newX, newY);
      }}
      initial={{ x: circle.position_x, y: circle.position_y, scale: 0 }}
      animate={{ 
        x: circle.position_x, 
        y: circle.position_y, 
        scale: isActive ? 1.35 : (hasActiveCircle ? 0.8 : 1),
        opacity: isActive ? 1 : (hasActiveCircle ? 0.3 : 1),
        zIndex: isActive ? 50 : 1,
        boxShadow: isActive 
          ? `0 0 80px ${circle.color}66, inset 0 0 20px ${circle.color}22` 
          : `0 0 20px ${circle.color}22`
      }}
      whileHover={{ scale: isActive ? 1.4 : 1.05 }}
      onPointerDown={(e) => {
        if (activeMenuMember) {
          e.stopPropagation();
          setActiveMenuMember(null);
        }
      }}
      onClick={(e) => {
        e.stopPropagation();
        if (!activeMenuMember) onClick?.();
      }}
      className={`absolute cursor-pointer flex items-center justify-center rounded-full transition-all duration-500 ${isActive ? 'shadow-2xl' : ''}`}
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle at center, ${circle.color}15 0%, rgba(15, 23, 42, 0.4) 100%)`,
        border: `1.5px solid ${circle.color}44`,
        backdropFilter: 'blur(8px)',
      }}
    >
      {/* اسم الدائرة */}
      <div 
        className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap font-black text-white bg-slate-900/60 backdrop-blur-md px-4 py-1.5 rounded-full shadow-2xl border border-white/10 uppercase tracking-widest flex items-center gap-2"
        style={{ fontSize: 11 * circle.scale, textShadow: '0 0 10px rgba(255,255,255,0.3)' }}
      >
        <span>{circle.name}</span>
        {harmony && (
          <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
            harmony.harmonyScore > 80 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
            harmony.harmonyScore > 60 ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
            'bg-amber-500/20 text-amber-400 border border-amber-500/30'
          }`}>
             {harmony.dominantArchetype.replace('_', ' ')} {harmony.harmonyScore}%
          </span>
        )}
      </div>

      {/* المركز */}
      <div 
        className="z-10 w-20 h-20 rounded-full bg-slate-900 shadow-2xl flex items-center justify-center border-2 border-white/20 overflow-hidden relative"
        style={{ 
          transform: `scale(${circle.scale})`,
          boxShadow: `0 0 40px ${circle.color}66`
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent" />
        <span className="text-4xl drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">{circle.icon || '👤'}</span>
      </div>

      {/* مدار الأعضاء */}
      {members.map((member, index) => {
        const pos = getPosition(index, members.length, 85);
        const isOpen = activeMenuMember === member.id;

        return (
          <motion.div
            key={member.id}
            drag={!isOpen && !activeMenuMember}
            dragSnapToOrigin
            onPointerDown={(e) => {
              handlePointerDown(e, member.id);
            }}
            onPointerUp={(e) => {
              handlePointerUp(e);
            }}
            onPointerLeave={(e) => {
              handlePointerUp(e);
            }}
            onDragEnd={(e, info) => {
              if (!isOpen) onMemberDrop?.(member, info.point.x, info.point.y);
            }}
            whileDrag={{ scale: 1.2, zIndex: 100 }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1, zIndex: isOpen ? 60 : 20 }}
            transition={{ delay: index * 0.05 }}
            className="absolute cursor-grab active:cursor-grabbing group/member"
            style={{
              left: `calc(50% + ${pos.x}px - 22px)`,
              top: `calc(50% + ${pos.y}px - 22px)`,
            }}
          >
            <div 
              className={`w-11 h-11 rounded-full bg-slate-800 border-2 shadow-2xl flex items-center justify-center text-white text-sm font-black overflow-hidden transition-all ${isOpen ? 'ring-4 ring-blue-500 border-blue-400 scale-125' : 'border-white/10 group-hover/member:border-white/40'}`}
            >
              {member.avatar_url ? (
                <img src={member.avatar_url} alt={member.name} className="w-full h-full object-cover opacity-80 group-hover/member:opacity-100 transition-opacity" />
              ) : (
                <span className="text-xs">{member.name?.charAt(0) || '؟'}</span>
              )}
            </div>

            {/* Action Menu (Floating) */}
            <AnimatePresence>
              {isOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onPointerDown={(e) => e.stopPropagation()} // Prevent menu clicks from closing themselves
                  className="absolute bottom-12 left-1/2 -translate-x-1/2 bg-slate-900/95 backdrop-blur-xl border border-white/20 rounded-2xl p-2 flex flex-col gap-1 shadow-[0_20px_50px_rgba(0,0,0,0.8)] min-w-[160px] z-[100]"
                >
                   <button 
                     onClick={(e) => { e.stopPropagation(); onMemberAction?.(member, 'EXIT'); setActiveMenuMember(null); }}
                     className="flex items-center gap-2 px-3 py-2.5 rounded-xl hover:bg-rose-500/20 text-rose-400 text-xs font-black transition-all group/btn"
                   >
                      <FiLogOut className="w-4 h-4 group-hover/btn:translate-x-0.5 transition-transform" />
                      <span>خروج من الدائرة</span>
                   </button>
                   <div className="h-px bg-white/10 mx-2" />
                   <button 
                     onClick={(e) => { e.stopPropagation(); onMemberAction?.(member, 'LINK'); setActiveMenuMember(null); }}
                     className="flex items-center gap-2 px-3 py-2.5 rounded-xl hover:bg-blue-500/20 text-blue-400 text-xs font-black transition-all group/btn"
                   >
                      <FiLink className="w-4 h-4 group-hover/btn:rotate-12 transition-transform" />
                      <span>ربط مباشر</span>
                   </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* مؤشر التوافق */}
            {!isOpen && (
              <div className="absolute -bottom-1 -right-1 bg-green-500 w-4 h-4 rounded-full border-2 border-slate-900 flex items-center justify-center">
                 <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
              </div>
            )}
            
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-950/80 backdrop-blur-md text-white text-[9px] px-2 py-0.5 rounded-full border border-white/5 opacity-0 group-hover/member:opacity-100 transition-opacity whitespace-nowrap pointer-events-none font-bold">
               {member.name}
            </div>
          </motion.div>
        );
      })}

      {/* مدار الموارد */}
      {resources.map((res, index) => {
        const pos = getPosition(index, resources.length, 120);
        const resourceIcons: Record<string, string> = {
          'BOOK': '📚', 'AI_ASSISTANT': '🤖', 'GIFT': '🎁', 'AUDIO': '🎵', 'DOCUMENT': '📄'
        };
        
        return (
          <motion.div
            key={res.id}
            drag
            dragSnapToOrigin
            onDragEnd={(e, info) => {
              onResourceDrop?.(res, info.point.x, info.point.y);
            }}
            whileDrag={{ scale: 1.2, zIndex: 100 }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: (members.length + index) * 0.05 }}
            className="absolute cursor-grab active:cursor-grabbing group/res"
            style={{
              left: `calc(50% + ${pos.x}px - 15px)`,
              top: `calc(50% + ${pos.y}px - 15px)`,
            }}
          >
            <div 
              className="w-8 h-8 rounded-lg bg-slate-900/80 backdrop-blur-md shadow-2xl border border-white/10 flex items-center justify-center text-lg hover:border-white/40 transition-colors"
              title={res.name}
            >
              {resourceIcons[res.type] || '📦'}
            </div>
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[9px] px-2 py-0.5 rounded opacity-0 group-hover/res:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
               {res.name}
            </div>
          </motion.div>
        );
      })}

      {/* حلقات مدارية */}
      <div 
        className="absolute rounded-full border border-white/5 pointer-events-none" 
        style={{ width: '70%', height: '70%', borderStyle: 'solid', borderWidth: '1px' }} 
      />
      <div 
        className="absolute rounded-full border border-white/10 pointer-events-none border-dashed" 
        style={{ width: '100%', height: '100%', animation: 'spin-slow 120s linear infinite' }} 
      />

      <style jsx>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </motion.div>
  );
};
