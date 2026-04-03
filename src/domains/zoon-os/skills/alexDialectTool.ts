import { tool } from 'ai';
import { z } from 'zod';
import { generateText } from 'ai';
import { google } from '@ai-sdk/google';

import { executeToolSafely } from '../execution/tool-executor';
import { RETRY_PRESETS } from '../execution/retry-logic';

export const alexDialectTool = tool({
  description: 'يحول أي نص عربي فصحى أو عامي ليكون باللهجة الإسكندرانية المحلية (محرم بك/بحرى). استخدم هذه الأداة دوماً عند الإشارة للإسكندرية.',
  inputSchema: z.object({
    text: z.string().describe('النص المراد تحويله إلى اللهجة الإسكندرانية'),
  }),
  execute: async (input) => {
    const { text } = input;
    
    const result = await executeToolSafely(
      'alexDialectTool',
      async () => {
        // محاكاة تحويل النص 
        const simulatedResponse = `يا جدع إسكندرية كلها بتقول: ${text}.. أحلى مسا عليك يا شقيق!`;
        return { 
          status: 'success', 
          original: text, 
          transformedText: simulatedResponse 
        };
      },
      { retryConfig: RETRY_PRESETS.FAST, timeoutMs: 5000 }
    );

    if (!result.success) {
      return {
        status: 'error',
        error: result.agentMessage,
        transformedText: text // نعيد النص الأصلي كـ fallback
      }
    }

    return result.data;
  },
});
