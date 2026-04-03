import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { advancedPsychologicalEngine } from '@/domains/zoon-club/services/zoonAdvancedPsychologicalEngine.service';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { UserInitialSurvey } from '@/domains/zoon-club/types/goalDrivenTypes';
import { Loader2, ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';

// الأسئلة الخمسة (مبسطة وسهلة الفهم للمستخدم العادي)
const QUESTIONS = [
  {
    id: 'q1_new_experiences',
    trait: 'Openness',
    question: 'عندما تواجه فكرة جديدة أو غريبة، ما هو رد فعلك الأول؟',
    options: [
      { value: 1, label: 'أفضل التمسك بالمألوف والتقليدي.' },
      { value: 2, label: 'أكون متحفظاً قليلاً.' },
      { value: 3, label: 'أستمع، لكن لا أقتنع بسهولة.' },
      { value: 4, label: 'أشعر بالفضول وأحب استكشافها.' },
      { value: 5, label: 'أتحمس جداً وأبحث عن المزيد فوراً!' },
    ],
  },
  {
    id: 'q2_details_oriented',
    trait: 'Conscientiousness',
    question: 'كيف تصف طريقتك في إنجاز المهام؟',
    options: [
      { value: 1, label: 'عفوي جداً، أعمل حسب المزاج.' },
      { value: 2, label: 'أحياناً أخطط، وأحياناً أرتجل.' },
      { value: 3, label: 'أنجز العمل، لكن التفاصيل ترهقني.' },
      { value: 4, label: 'أحب النظام وأهتم بالتفاصيل.' },
      { value: 5, label: 'دقيق جداً، كل شيء يجب أن يكون مثالياً.' },
    ],
  },
  {
    id: 'q3_social_energy',
    trait: 'Extraversion',
    question: 'في التجمعات الكبيرة، كيف تشعر بعد ساعتين؟',
    options: [
      { value: 1, label: 'مرهق جداً، أريد العودة للمنزل فوراً.' },
      { value: 2, label: 'أبدأ بالانسحاب والبحث عن الهدوء.' },
      { value: 3, label: 'عادي، أستمتع لكن بحدود.' },
      { value: 4, label: 'مستمتع ونشيط.' },
      { value: 5, label: 'في قمة طاقتي، لا أريد الحفلة أن تنتهي!' },
    ],
  },
  {
    id: 'q4_cooperation',
    trait: 'Agreeableness',
    question: 'إذا اختلف معك شخص في الرأي، ماذا تفعل؟',
    options: [
      { value: 1, label: 'أجادل بقوة لإثبات وجهة نظري.' },
      { value: 2, label: 'أتمسك برأيي لكن بهدوء.' },
      { value: 3, label: 'أحاول الوصول لحل وسط.' },
      { value: 4, label: 'أستمع وأحاول فهم وجهة نظره.' },
      { value: 5, label: 'أهتم بمشاعره وعلاقنا أكثر من "الفوز" بالنقاش.' },
    ],
  },
  {
    id: 'q5_stress_handling',
    trait: 'Stability',
    question: 'عندما تضغطك الحياة بمشاكل مفاجئة، كيف تتصرف؟',
    options: [
      { value: 1, label: 'أتوتر جداً وقد أفقد أعصابي.' },
      { value: 2, label: 'أشعر بالقلق ويؤثر ذلك على يومي.' },
      { value: 3, label: 'أقلق قليلاً، لكن أستمر.' },
      { value: 4, label: 'أبقى هادئاً وأفكر في الحلول.' },
      { value: 5, label: 'لا شيء يهزني، أتعامل ببرودة أعصاب تامة.' },
    ],
  },
];

export function InitialMindSurvey({ onComplete }: { onComplete: () => void }) {
  const [user, setUser] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase!.auth.getUser();
      setUser(data.user);
    };
    getUser();
  }, []);

  const handleSelect = (value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [QUESTIONS[currentStep].id]: parseInt(value),
    }));
  };

  const handleNext = () => {
    if (currentStep < QUESTIONS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!user) return;
    setIsSubmitting(true);

    try {
      const surveyData: UserInitialSurvey = {
        user_id: user.id,
        q1_new_experiences: answers['q1_new_experiences'],
        q2_details_oriented: answers['q2_details_oriented'],
        q3_social_energy: answers['q3_social_energy'],
        q4_cooperation: answers['q4_cooperation'],
        q5_stress_handling: answers['q5_stress_handling'],
      };

      const success = await advancedPsychologicalEngine.submitInitialSurvey(surveyData);

      if (success) {
        toast.success('تم تحليل شخصيتك بنجاح! 🧠✨');
        // هنا يمكننا إضافة تأخير بسيط لإظهار رسالة النجاح
        setTimeout(() => {
           onComplete();
        }, 1500);
       
      } else {
        toast.error('حدث خطأ أثناء حفظ البيانات، حاول مرة أخرى.');
      }
    } catch (error) {
      console.error(error);
      toast.error('حدث خطأ غير متوقع.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentQuestion = QUESTIONS[currentStep];
  const progress = ((currentStep + 1) / QUESTIONS.length) * 100;

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 max-w-2xl mx-auto">
      
      {/* Progress Bar */}
      <div className="w-full h-2 bg-gray-100 rounded-full mb-8 overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -20, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full"
        >
          <Card className="p-8 shadow-xl border-t-4 border-t-violet-500 bg-white/95 backdrop-blur-sm">
            <div className="mb-6">
              <span className="text-xs font-bold text-violet-500 uppercase tracking-wider">
                سؤال {currentStep + 1} من {QUESTIONS.length}
              </span>
              <h2 className="text-2xl font-bold text-gray-900 mt-2 leading-tight">
                {currentQuestion.question}
              </h2>
            </div>

            <div className="space-y-3">
              {currentQuestion.options.map((option) => (
                <div key={option.value} className="flex items-center space-x-3 space-x-reverse group">
                  <input
                    type="radio"
                    id={`opt-${option.value}`}
                    name={currentQuestion.id}
                    value={option.value.toString()}
                    checked={answers[currentQuestion.id] === option.value}
                    onChange={(e) => handleSelect(e.target.value)}
                    className="w-5 h-5 text-violet-600 border-gray-300 focus:ring-violet-500 cursor-pointer"
                  />
                  <Label
                    htmlFor={`opt-${option.value}`}
                    className={`flex-1 cursor-pointer p-4 rounded-lg border border-transparent transition-all duration-200 font-medium ${
                      answers[currentQuestion.id] === option.value 
                      ? 'bg-violet-50 border-violet-200 text-violet-900' 
                      : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>

            <div className="flex justify-between mt-8 pt-4 border-t border-gray-100">
              <Button
                variant="ghost"
                onClick={handleBack}
                disabled={currentStep === 0 || isSubmitting}
                className="text-gray-500 hover:text-gray-900"
              >
                <ArrowRight className="w-4 h-4 ml-2" />
                السابق
              </Button>

              <Button
                onClick={handleNext}
                disabled={!answers[currentQuestion.id] || isSubmitting}
                className="bg-gray-900 hover:bg-gray-800 text-white min-w-[120px]"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : currentStep === QUESTIONS.length - 1 ? (
                  <>
                    إنهاء وتحليل
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                  </>
                ) : (
                  <>
                    التالي
                    <ArrowLeft className="w-4 h-4 mr-2" />
                  </>
                )}
              </Button>
            </div>
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
