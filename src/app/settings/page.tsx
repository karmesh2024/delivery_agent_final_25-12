/**
 * Settings page - intermediary file that imports the component from the settings domain
 */

import { Metadata } from 'next';
import { DashboardLayout } from '@/shared/layouts/DashboardLayout';
import SettingsPage from "@/domains/settings/pages/SettingsPage";

export const metadata: Metadata = {
  title: 'Settings | Delivery Agent Dashboard',
  description: 'Manage account and system settings',
};

export default function SettingsRoute() {
  return (
    <DashboardLayout title="System Settings">
      <SettingsPage />
    </DashboardLayout>
  );
}