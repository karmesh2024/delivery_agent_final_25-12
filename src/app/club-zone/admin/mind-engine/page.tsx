import { MindEngineDashboard } from '@/domains/zoon-club/admin/mind-engine/MindEngineDashboard';

export const metadata = {
  title: 'ZOON Mind Engine | Control Center',
  description: 'مراقبة وتحليل التجارب النفسية والخوارزميات لنظام ZOON',
};

export default function MindEnginePage() {
  return <MindEngineDashboard />;
}
