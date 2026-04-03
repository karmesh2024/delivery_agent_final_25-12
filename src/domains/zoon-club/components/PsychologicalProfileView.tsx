import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { advancedPsychologicalEngine, EnrichedProfile } from '../services/zoonAdvancedPsychologicalEngine.service';
import { supabase } from '@/lib/supabase';
import { Loader2, BrainCircuit, Sparkles, Zap, Heart, Shield, Award } from 'lucide-react';
import { InitialMindSurvey } from './InitialMindSurvey';

export function PsychologicalProfileView() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<EnrichedProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSurvey, setShowSurvey] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase!.auth.getUser();
      setUser(data.user);
    };
    getUser();
  }, []);

  const fetchProfile = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await advancedPsychologicalEngine.enrichProfile(user.id);
      
      // إذا كان البروفايل جديد (كل القيم 50)، نعرض الاستبيان
      const isNewProfile = Object.values(data.dimensions).every(d => d.final === 50);
      if (isNewProfile) {
        setShowSurvey(true);
      } else {
        setProfile(data);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
      </div>
    );
  }

  if (showSurvey) {
    return (
      <InitialMindSurvey 
        onComplete={() => {
          setShowSurvey(false);
          fetchProfile(); // إعادة تحميل البروفايل بعد الاستبيان
        }} 
      />
    );
  }

  if (!profile) return null;

  const traits = [
    { label: 'الانفتاح (Openness)', value: profile.dimensions.openness.final, icon: Sparkles, color: 'text-purple-500', bg: 'bg-purple-100' },
    { label: 'الضمير (Conscientiousness)', value: profile.dimensions.conscientiousness.final, icon: Shield, color: 'text-blue-500', bg: 'bg-blue-100' },
    { label: 'الانبساط (Extraversion)', value: profile.dimensions.extraversion.final, icon: Zap, color: 'text-yellow-500', bg: 'bg-yellow-100' },
    { label: 'الوفاق (Agreeableness)', value: profile.dimensions.agreeableness.final, icon: Heart, color: 'text-green-500', bg: 'bg-green-100' },
    { label: 'الاستقرار (Stability)', value: 100 - profile.dimensions.neuroticism.final, icon: BrainCircuit, color: 'text-rose-500', bg: 'bg-rose-100' },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-4">
      
      {/* Header Card */}
      <Card className="p-6 bg-gradient-to-br from-violet-600 to-indigo-700 text-white shadow-xl border-none relative overflow-hidden">
        <div className="relative z-10 flex justify-between items-start">
          <div>
            <h2 className="text-3xl font-bold mb-2">تحليل شخصيتك الرقمية</h2>
            <p className="text-violet-100 opacity-90">
              بناءً على {profile.days_since_registration} يوم من التفاعل والتحليل الذكي.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-none backdrop-blur-sm">
                نمطك: {profile.archetype.primary}
              </Badge>
              <Badge variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-none backdrop-blur-sm">
                الثقة: {profile.archetype.confidence}%
              </Badge>
              
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowSurvey(true)}
                className="bg-white/10 hover:bg-white/20 text-white border border-white/20 text-[10px] h-7 px-3 rounded-full backdrop-blur-sm"
              >
                إعادة الاختبار يدويًا 🔄
              </Button>
            </div>
          </div>
          <div className="hidden md:block">
            <Award className="w-24 h-24 text-white/10" />
          </div>
        </div>
        
        {/* Abstract Background Shapes */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full -ml-10 -mb-10 blur-xl" />
      </Card>

      {/* Traits Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {traits.map((trait, index) => (
          <motion.div
            key={trait.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="p-5 hover:shadow-md transition-shadow border-gray-100">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${trait.bg}`}>
                    <trait.icon className={`w-5 h-5 ${trait.color}`} />
                  </div>
                  <span className="font-semibold text-gray-700">{trait.label}</span>
                </div>
                <span className={`text-lg font-bold ${trait.color}`}>{trait.value}%</span>
              </div>
              {/* Custom Progress Bar */}
              <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                 <div 
                   className={`h-2.5 rounded-full ${trait.bg.replace('bg-', 'bg-').replace('100', '500')}`} 
                   style={{ width: `${trait.value}%` }}
                 ></div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Advanced Insights */}
      <Card className="p-6 bg-gray-50 border-dashed border-2 border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <BrainCircuit className="w-5 h-5 text-gray-500" />
          رؤى متقدمة
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <InsightItem label="الذكاء العاطفي" value={profile.computed_traits.empathy_score} />
          <InsightItem label="القيادة" value={profile.computed_traits.leadership_potential} />
          <InsightItem label="الإبداع" value={profile.computed_traits.creativity_index} />
          <InsightItem label="إدارة التوتر" value={profile.computed_traits.emotional_stability} />
        </div>
      </Card>
    </div>
  );
}

function InsightItem({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white p-3 rounded-xl border border-gray-100 text-center shadow-sm">
      <div className="text-sm text-gray-500 mb-1">{label}</div>
      <div className="text-xl font-bold text-gray-900">{value}</div>
    </div>
  );
}
