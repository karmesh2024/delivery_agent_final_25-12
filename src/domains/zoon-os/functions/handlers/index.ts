import * as fileHandlers from './file-handlers'
import * as financialHandlers from './financial-handlers'
import * as exportHandlers from './export-handlers'
import * as socialHandlers from './social-handlers'
import * as searchHandlers from './search-handlers'

// تصدير الأنواع العامة
export type FunctionHandler = (params: any) => Promise<{
  success: boolean;
  data: any;
  summary: string;
  error?: string;
}>;

// تصدير كل الدوال من الوحدات المختلفة
export const { searchNewsHandler, alexDialectHandler, telegramHandler, publishToRoomHandler, saveMemoryHandler } = (socialHandlers as any);
export const { webSearchHandler, deepResearchHandler, imageOCRHandler, webFetchHandler, smartRerank } = (searchHandlers as any);

// تجميع كل الهاندلرز في كائن واحد للوصول الديناميكي
export const HANDLERS: Record<string, FunctionHandler> = {
  ...(fileHandlers as any),
  ...(financialHandlers as any),
  ...(exportHandlers as any),
  ...(socialHandlers as any),
  ...(searchHandlers as any),
}

export type HandlerName = keyof typeof HANDLERS
