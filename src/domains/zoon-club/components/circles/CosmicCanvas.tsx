import React, { useRef, useState, useEffect } from 'react';
import { motion, useMotionValue, AnimatePresence } from 'framer-motion';
import { ZoonCircle, ZoonCircleConnection, ZoonCircleMember, ZoonCircleResource } from '../../services/zoonCirclesService';
import { CircleNode } from './CircleNode';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchCircleMembers, fetchCircleResources, fetchCircleHarmony } from '../../store/zoonCirclesSlice';

interface CosmicCanvasProps {
  circles: ZoonCircle[];
  connections: ZoonCircleConnection[];
  onCircleClick?: (circle: ZoonCircle) => void;
  activeCircleId?: string | null;
  refreshKey?: number;
  onMemberMove?: (member: ZoonCircleMember, fromCircleId: string, toCircleId: string) => void;
  onResourceMove?: (resource: ZoonCircleResource, fromCircleId: string, toCircleId: string) => void;
  onCircleMove?: (circleId: string, x: number, y: number) => void;
  onConnectionClick?: (conn: ZoonCircleConnection) => void;
  onMemberAction?: (member: ZoonCircleMember, action: 'EXIT' | 'LINK') => void;
  showConnections?: boolean;
  membersMap?: Record<string, ZoonCircleMember[]>;
  resourcesMap?: Record<string, ZoonCircleResource[]>;
}

export const CosmicCanvas: React.FC<CosmicCanvasProps> = ({ 
  circles, 
  connections, 
  onCircleClick,
  activeCircleId,
  refreshKey,
  onMemberMove,
  onResourceMove,
  onCircleMove,
  onConnectionClick,
  onMemberAction,
  showConnections = true,
  membersMap: propsMembersMap,
  resourcesMap: propsResourcesMap
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const dispatch = useAppDispatch();
  const [scale, setScale] = useState(1);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  const { membersMap: reduxMembersMap, circlesHarmony } = useAppSelector(state => state.zoonCircles);
  
  // استخدام الخريطة القادمة من Props أو من Redux مباشرة
  const membersMap = propsMembersMap || reduxMembersMap;
  const circleResources = propsResourcesMap || {};
  
  // حالة الأنبوب الضوئي للنقل
  const [activeWormhole, setActiveWormhole] = useState<{
    from: { x: number, y: number },
    to: { x: number, y: number },
    active: boolean
  } | null>(null);
  
  // حالة تجميد حركة الكانفاس
  const [isCanvasDragDisabled, setIsCanvasDragDisabled] = useState(false);

  // الاعتماد على Redux لجلب البيانات الأولية إذا لم تكن موجودة
  useEffect(() => {
    circles.forEach((circle) => {
      if (circle.id === '1' || circle.id === '2' || circle.id === '3') return;
      
      // جلب الأعضاء إذا لم يكونوا موجودين
      if (!membersMap[circle.id]) {
        dispatch(fetchCircleMembers(circle.id));
      }
      
      // جلب الموارد
      dispatch(fetchCircleResources(circle.id));

      // 🧠 استدعاء العقل المحرك لتحليل الدائرة
      dispatch(fetchCircleHarmony(circle.id));
    });
  }, [circles, dispatch, refreshKey]);

  // دالة لحساب موقع عضو محدد داخل دائرته
  const getMemberPos = (circle: ZoonCircle, memberId?: string) => {
    const defaultCenter = { x: circle.position_x + 125, y: circle.position_y + 125 };
    if (!memberId) return defaultCenter;

    const members = membersMap[circle.id] || [];
    const index = members.findIndex(m => m.id === memberId);
    if (index === -1) return defaultCenter;

    const angle = (index * 2 * Math.PI) / Math.max(members.length, 1) - Math.PI / 2;
    const radius = 85 * (circle.scale || 1);
    
    return {
      x: circle.position_x + 125 + Math.cos(angle) * radius,
      y: circle.position_y + 125 + Math.sin(angle) * radius,
    };
  };
  useEffect(() => {
    if (typeof window !== 'undefined') {
      x.set(-2500 + window.innerWidth / 2);
      y.set(-2500 + window.innerHeight / 2);
    }
  }, [x, y]);

  // Handle Zoom
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      setScale(prev => Math.min(Math.max(prev * delta, 0.2), 3));
    }
  };

  return (
    <div 
      ref={containerRef}
      onWheel={handleWheel}
      className="relative w-full h-full overflow-hidden cursor-grab active:cursor-grabbing"
      style={{
        background: 'radial-gradient(circle at center, #0f172a 0%, #020617 100%)'
      }}
    >
      {/* Animated Background - Nebula Style */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute w-[800px] h-[800px] bg-blue-600/10 rounded-full blur-[120px] top-[-10%] left-[-10%] animate-pulse" />
        <div className="absolute w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[100px] bottom-[10%] right-[10%] animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[80px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" style={{ animationDelay: '4s' }} />
      </div>

      <motion.div
        style={{ x, y, scale }}
        drag={!isCanvasDragDisabled}
        dragMomentum={false}
        dragConstraints={containerRef}
        className="w-[5000px] h-[5000px] relative"
      >
        {/* SVG Layer for Connections */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <defs>
            <linearGradient id="connectionGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.6" />
            </linearGradient>
          </defs>
          {showConnections && connections.map((conn) => {
            const from = circles.find(c => c.id === conn.from_circle_id);
            const to = circles.find(c => c.id === conn.to_circle_id);
            if (!from || !to) return null;

            // تحديد نقاط البداية والنهاية (هل هي من عضو محدد أم من مركز الدائرة؟)
            const start = getMemberPos(from, conn.from_member_id);
            const end = getMemberPos(to, conn.to_member_id);

            // حساب منحنى Bezier انسيابي
            const cp1x = start.x + (end.x - start.x) / 3;
            const cp1y = start.y;
            const cp2x = start.x + 2 * (end.x - start.x) / 3;
            const cp2y = end.y;

            const pathData = `M ${start.x} ${start.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${end.x} ${end.y}`;

            return (
              <motion.g 
                key={conn.id} 
                className="cursor-pointer group"
                onClick={() => onConnectionClick?.(conn)}
              >
                {/* ظل التوهج الخلفي */}
                <path
                  d={pathData}
                  fill="none"
                  stroke={conn.color}
                  strokeWidth="8"
                  strokeLinecap="round"
                  className="opacity-10 blur-sm group-hover:opacity-30 transition-opacity"
                />
                
                {/* الخط النيون الرئيسي */}
                <motion.path
                  d={pathData}
                  fill="none"
                  stroke={conn.color}
                  strokeWidth="2"
                  strokeLinecap="round"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 0.6 }}
                  className="group-hover:opacity-100 transition-opacity"
                />

                {/* نبضات ضوئية متحركة على طول المسار */}
                <motion.path
                  d={pathData}
                  fill="none"
                  stroke="white"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeDasharray="10 40"
                  animate={{ strokeDashoffset: [-100, 0] }}
                  transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                  className="opacity-40"
                />

                {/* مؤشر قوة العلاقة (إذا وجد أعضاء مشتركين) */}
                {conn.shared_members_count && (
                  <motion.g
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 1 }}
                  >
                    <circle cx={(start.x + end.x) / 2} cy={(start.y + end.y) / 2} r="12" fill="white" className="shadow-lg" />
                    <text x={(start.x + end.x) / 2} y={(start.y + end.y) / 2} dy=".3em" textAnchor="middle" fill="#1e293b" className="text-[10px] font-black">
                      {conn.shared_members_count}
                    </text>
                  </motion.g>
                )}
              </motion.g>
            );
          })}

          {/* أنبوب النقل الآني (Wormhole - Tube) */}
          <AnimatePresence>
            {activeWormhole?.active && (
              <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {/* الشعاع الخارجي */}
                <motion.line
                  x1={activeWormhole.from.x}
                  y1={activeWormhole.from.y}
                  x2={activeWormhole.to.x}
                  y2={activeWormhole.to.y}
                  stroke="rgba(147, 197, 253, 0.4)"
                  strokeWidth="40"
                  strokeLinecap="round"
                  filter="blur(15px)"
                />
                {/* الشعاع النيون المركزي */}
                <motion.line
                  x1={activeWormhole.from.x}
                  y1={activeWormhole.from.y}
                  x2={activeWormhole.to.x}
                  y2={activeWormhole.to.y}
                  stroke="rgba(255, 255, 255, 0.9)"
                  strokeWidth="4"
                  strokeLinecap="round"
                  style={{ filter: 'drop-shadow(0 0 15px #3b82f6)' }}
                  strokeDasharray="10, 20"
                  animate={{ strokeDashoffset: [-100, 0] }}
                  transition={{ repeat: Infinity, duration: 0.5, ease: "linear" }}
                />
                {/* النبضة الضوئية المارة */}
                <motion.circle
                  r="15"
                  fill="white"
                  initial={{ cx: activeWormhole.from.x, cy: activeWormhole.from.y }}
                  animate={{ cx: activeWormhole.to.x, cy: activeWormhole.to.y }}
                  transition={{ duration: 0.8, ease: "circIn" }}
                  style={{ filter: 'drop-shadow(0 0 20px #fff)' }}
                />
              </motion.g>
            )}
          </AnimatePresence>
        </svg>

        {/* Circles with Members & Resources */}
        {circles.map((circle) => (
          <CircleNode
            key={circle.id}
            circle={circle}
            members={membersMap[circle.id] || []}
            resources={circleResources[circle.id] || []}
            harmony={circlesHarmony?.[circle.id]}
            isActive={activeCircleId === circle.id}
            hasActiveCircle={!!activeCircleId}
            onClick={() => onCircleClick?.(circle)}
            onDragEnd={(newX, newY) => onCircleMove?.(circle.id, newX, newY)}
            onMemberDrop={(member, screenX, screenY) => {
              if (!containerRef.current) return;
              
              const rect = containerRef.current.getBoundingClientRect();
              
              // تحويل إحداثيات الشاشة إلى إحداثيات داخل الفضاء الكوني
              // نأخذ في الاعتبار: موضع الحاوية، إزاحة الكانفاس (x, y)، والسكيل (scale)
              const canvasX = (screenX - rect.left - x.get()) / scale;
              const canvasY = (screenY - rect.top - y.get()) / scale;

              // اكتشاف التصادم مع الدوائر الأخرى
              const targetCircle = circles.find(c => {
                if (c.id === circle.id) return false;
                
                // حساب المركز الحقيقي بناءً على السكيل
                const currentSize = 250 * (c.scale || 1);
                const centerX = c.position_x + currentSize / 2;
                const centerY = c.position_y + currentSize / 2;
                
                const dist = Math.sqrt(Math.pow(canvasX - centerX, 2) + Math.pow(canvasY - centerY, 2));
                
                // زيادة مدى التصادم ليكون أكثر مرونة (180 بكسل)
                return dist < 180; 
              });

              if (targetCircle) {
                setActiveWormhole({
                  from: { x: circle.position_x + 125, y: circle.position_y + 125 },
                  to: { x: targetCircle.position_x + 125, y: targetCircle.position_y + 125 },
                  active: true
                });

                setTimeout(() => {
                  setActiveWormhole(null);
                  onMemberMove?.(member, circle.id, targetCircle.id);
                }, 800);
              }
            }}
            onResourceDrop={(res, x, y) => {
              const targetCircle = circles.find(c => {
                if (c.id === circle.id) return false;
                const dist = Math.sqrt(Math.pow(x - (c.position_x + 125), 2) + Math.pow(y - (c.position_y + 125), 2));
                return dist < 150;
              });

              if (targetCircle) {
                setActiveWormhole({
                  from: { x: circle.position_x + 125, y: circle.position_y + 125 },
                  to: { x: targetCircle.position_x + 125, y: targetCircle.position_y + 125 },
                  active: true
                });

                setTimeout(() => {
                  setActiveWormhole(null);
                  alert(`تم بدء نقل المورد ${res.name} عبر الثقب الدودي! ✨`);
                  onResourceMove?.(res, circle.id, targetCircle.id);
                }, 800);
              }
            }}
            onMemberAction={onMemberAction}
            onMenuToggle={(isOpen) => setIsCanvasDragDisabled(isOpen)}
          />
        ))}
      </motion.div>

      {/* Controls Overlay */}
      <div className="absolute bottom-6 left-6 flex gap-2 z-20">
        <button 
          onClick={() => setScale(s => Math.min(s + 0.1, 3))}
          className="bg-white/10 hover:bg-white/20 text-white w-10 h-10 rounded-xl backdrop-blur-md border border-white/10 text-lg font-bold transition-all hover:scale-105"
        >+</button>
        <button 
          onClick={() => setScale(s => Math.max(s - 0.1, 0.2))}
          className="bg-white/10 hover:bg-white/20 text-white w-10 h-10 rounded-xl backdrop-blur-md border border-white/10 text-lg font-bold transition-all hover:scale-105"
        >-</button>
        <button 
          onClick={() => { setScale(1); x.set(-2500 + window.innerWidth / 2); y.set(-2500 + window.innerHeight / 2); }}
          className="bg-white/10 hover:bg-white/20 text-white px-4 h-10 rounded-xl backdrop-blur-md border border-white/10 text-sm font-bold transition-all hover:scale-105"
        >إعادة الضبط</button>
      </div>

      {/* Legend / Info */}
      <div className="absolute top-6 left-6 bg-white/5 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 z-20">
        <div className="text-white/60 text-xs">اسحب للتحريك • Ctrl + عجلة للتكبير</div>
      </div>

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
