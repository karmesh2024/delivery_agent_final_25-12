/**
 * أنواع بيانات نطاق الإعدادات
 */

import { ReactNode } from "react";

/**
 * نوع بيانات إعدادات الإشعارات
 */
export interface NotificationSettings {
  email: boolean;
  push: boolean;
  sms: boolean;
  agentUpdates: boolean;
  orderStatusChanges: boolean;
  systemAnnouncements: boolean;
  marketingMessages: boolean;
}

/**
 * نوع بيانات المستخدم
 */
export interface UserData {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  profileImage: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  language: string;
  timeZone: string;
  dateFormat: string;
  timeFormat: string;
  currency?: string;
  notificationSettings: NotificationSettings;
}

/**
 * نوع بيانات خيار الموضوع
 */
export interface ThemeOption {
  id: string;
  name: string;
}

/**
 * نوع بيانات خيار اللغة
 */
export interface LanguageOption {
  code: string;
  name: string;
}

/**
 * نوع بيانات خيار المنطقة الزمنية
 */
export interface TimeZoneOption {
  id: string;
  name: string;
}

/**
 * نوع بيانات خيار لون التطبيق
 */
export interface ColorOption {
  color: string;
  selected: boolean;
}

/**
 * نوع بيانات سجل تسجيل الدخول
 */
export interface LoginRecord {
  device: string;
  location: string;
  ip: string;
  time: string;
  status: 'success' | 'blocked';
}

/**
 * نوع بيانات حساب متصل
 */
export interface ConnectedAccount {
  name: string;
  connected: boolean;
}

/**
 * نوع بيانات حالة صفحة الإعدادات
 */
export interface SettingsState {
  activeTab: 'profile' | 'notifications' | 'security' | 'appearance' | 'system';
  userData: UserData;
  loginRecords: LoginRecord[];
  connectedAccounts: ConnectedAccount[];
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  theme: string;
  colorAccent: string;
  layoutDensity: string;
  fontSize: number;
  quietHoursStart: string;
  quietHoursEnd: string;
}

// أنواع بيانات GeoJSON
export interface GeoJSONPoint {
  type: "Point";
  coordinates: [number, number]; // [longitude, latitude]
}

export interface GeoJSONPolygon {
  type: "Polygon";
  coordinates: number[][][]; // Array of linear rings (first is outer, rest are holes)
}

export interface GeographicZone {
  id: string;
  name: string;
  area_polygon: GeoJSONPolygon;
  center_point: GeoJSONPoint;
  is_active: boolean;
  city?: string;
  country?: string;
  created_at?: string;
  updated_at?: string;
}

export interface GeographicZoneFormData {
  name: string;
  description: string;
  is_active: boolean;
  city?: string;
  country?: string;
}

// يمكننا استخدام نفس نوع GeographicZone للبيانات المسترجعة من API
export type ApiGeographicZone = GeographicZone;

export interface DeliveryLocation {
  id: string;
  lat: number;
  lng: number;
  status: 'pending' | 'in_progress' | 'delivered' | 'canceled';
  address?: string;
  type: 'pickup' | 'delivery';
  label?: string;
}