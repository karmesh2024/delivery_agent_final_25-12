'use client';

import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchZoonCircles, fetchCircleConnections } from '@/domains/zoon-club/store/zoonCirclesSlice';
import { CosmicCanvas } from '@/domains/zoon-club/components/circles/CosmicCanvas';
import { FiArrowLeft, FiMaximize2, FiMinimize2 } from 'react-icons/fi';
import Link from 'next/link';
import { useRouter } from 'next/navigation'; // Added useRouter
import { motion, AnimatePresence } from 'framer-motion';

export default function CirclesPreviewPage() {
  const dispatch = useAppDispatch();
  const router = useRouter(); // Initialize router
  const { circles, connections } = useAppSelector((state) => state.zoonCircles);
  const [selectedCircle, setSelectedCircle] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    dispatch(fetchZoonCircles());
  }, [dispatch]);

  useEffect(() => {
    if (circles.length > 0) {
      const ids = circles.map(c => c.id);
      dispatch(fetchCircleConnections(ids));
    }
  }, [circles, dispatch]);

  const handleCircleClick = (circle: any) => {
    setSelectedCircle(circle);
    setShowDetails(true);
  };
  
  const handleEnterCircle = () => {
    if (selectedCircle) {
      router.push(`/club-zone/circles/${selectedCircle.id}`);
    }
  };

  return (
    <div className="relative w-full h-screen bg-[#05070a] overflow-hidden">
      {/* Immersive Cosmic Canvas */}
      <CosmicCanvas 
        circles={circles} 
        connections={connections}
        activeCircleId={selectedCircle?.id}
        onCircleClick={handleCircleClick}
      />

      {/* Navigation Overlay */}
      <div className="absolute top-8 left-8 flex items-center gap-6">
        <Link href="/club-zone">
          <button className="bg-white/5 hover:bg-white/10 p-3 rounded-full backdrop-blur-xl border border-white/10 text-white transition-all">
            <FiArrowLeft className="w-6 h-6" />
          </button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-widest uppercase">Zoon <span className="text-blue-500">Nexus</span></h1>
          <p className="text-blue-300/40 text-[10px] tracking-widest uppercase">Cosmic Relationship Preview</p>
        </div>
      </div>

      {/* Details Side Panel */}
      <AnimatePresence>
        {showDetails && selectedCircle && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute top-0 right-0 w-[400px] h-full bg-[#0a0e17]/90 backdrop-blur-3xl border-l border-white/5 p-8 shadow-[-20px_0_50px_rgba(0,0,0,0.5)] flex flex-col z-50"
          >
            <button 
              onClick={() => setShowDetails(false)}
              className="absolute top-8 right-8 text-white/40 hover:text-white transition-colors"
            >
              <FiArrowLeft className="rotate-180 w-6 h-6" />
            </button>

            <div className="mt-12">
              <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center text-5xl mb-6 shadow-2xl" style={{ boxShadow: `0 0 30px ${selectedCircle.color}33` }}>
                {selectedCircle.icon}
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">{selectedCircle.name}</h2>
              <div className="inline-block px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-[10px] font-bold uppercase tracking-wider mb-6">
                {selectedCircle.type} Circle
              </div>
              <p className="text-gray-400 text-sm leading-relaxed mb-12">
                {selectedCircle.description || 'هذه الدائرة تهدف لجمع الأشخاص المتوافقين في اهتمامات مشتركة ورؤى متقاربة لبناء علاقات هادفة وعميقة.'}
              </p>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4 mb-12">
                <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                  <div className="text-white font-bold text-xl">12</div>
                  <div className="text-gray-500 text-[10px] uppercase">عضو نشط</div>
                </div>
                <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                  <div className="text-blue-400 font-bold text-xl">92%</div>
                  <div className="text-gray-500 text-[10px] uppercase">متوسط التوافق</div>
                </div>
              </div>

              {/* Circle Resources Preview */}
              <h3 className="text-white font-bold text-sm mb-4 uppercase tracking-widest opacity-40">الموارد النشطة</h3>
              <div className="grid grid-cols-4 gap-3">
                {['📚', '🤖', '🎁', '🎵'].map((icon, i) => (
                  <div key={i} className="aspect-square rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-xl hover:bg-white/10 cursor-pointer transition-colors">
                    {icon}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-auto">
              <button 
                onClick={handleEnterCircle}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl shadow-xl transition-all hover:scale-[1.02] flex justify-center items-center gap-2"
              >
                <span>دخول غرف الدائرة</span>
                <FiArrowLeft className="w-4 h-4 rotate-180" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Decorative Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#05070a] via-transparent to-transparent pointer-events-none opacity-60" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#05070a] via-transparent to-transparent pointer-events-none opacity-40" />

      <style jsx global>{`
        body { background: #05070a; overflow: hidden; }
      `}</style>
    </div>
  );
}
