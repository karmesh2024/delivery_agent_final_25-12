// src/domains/zoon-os/functions/handlers/file-handlers.ts
// ✨ File Management Handlers

import { promises as fs } from 'fs'
import path from 'path'
import { createClient } from '@supabase/supabase-js'

// ===== نوع النتيجة المشترك =====
export interface HandlerResult<T = unknown> {
  success: boolean
  data?: T
  summary?: string
  fileBuffer?: Buffer
  fileName?: string
  mimeType?: string
  error?: string
}

// ===== المجلد الآمن — الوكيل يكتب هنا فقط =====
const SAFE_BASE_DIR = path.join(process.cwd(), 'docs', 'generated')

/**
 * التحقق من أن المسار داخل SAFE_BASE_DIR فقط
 * يمنع Path Traversal: ../../etc/passwd
 */
function resolveSafePath(filePath: string): string {
  // إزالة أي محاولات للخروج من المجلد
  const cleaned = filePath.replace(/\.\./g, '').replace(/^\//, '')
  const resolved = path.resolve(SAFE_BASE_DIR, cleaned)

  if (!resolved.startsWith(SAFE_BASE_DIR)) {
    throw new Error(`مسار غير مسموح به: ${filePath}`)
  }
  return resolved
}

// ===== قراءة ملف =====
export async function fileReadHandler(
  params: Record<string, unknown>
): Promise<HandlerResult> {
  try {
    const safePath = resolveSafePath(params.filePath as string)
    const content = await fs.readFile(safePath, 'utf-8')
    const stats = await fs.stat(safePath)

    return {
      success: true,
      data: {
        content,
        lines: content.split('\n').length,
        sizeKb: (stats.size / 1024).toFixed(2)
      },
      summary: `📖 تم قراءة: ${params.filePath} (${content.length} حرف، ${content.split('\n').length} سطر)`
    }
  } catch (error) {
    return {
      success: false,
      error: `فشل القراءة: ${(error as Error).message}`
    }
  }
}

// ===== كتابة ملف =====
export async function fileWriteHandler(
  params: Record<string, unknown>
): Promise<HandlerResult> {
  try {
    const safePath = resolveSafePath(params.filePath as string)
    const { content, mode = 'overwrite' } = params

    // إنشاء المجلدات الوسيطة تلقائياً
    await fs.mkdir(path.dirname(safePath), { recursive: true })

    if (mode === 'append') {
      await fs.appendFile(safePath, '\n' + String(content), 'utf-8')
    } else if (mode === 'prepend') {
      const existing = await fs.readFile(safePath, 'utf-8').catch(() => '')
      await fs.writeFile(safePath, String(content) + '\n' + existing, 'utf-8')
    } else {
      // overwrite — الافتراضي
      await fs.writeFile(safePath, String(content), 'utf-8')
    }

    return {
      success: true,
      data: { filePath: params.filePath, mode },
      summary: `✏️ تم ${
        mode === 'append' ? 'إضافة محتوى لـ' :
        mode === 'prepend' ? 'إضافة محتوى لبداية' :
        'كتابة'
      } الملف: ${params.filePath}`
    }
  } catch (error) {
    return {
      success: false,
      error: `فشل الكتابة: ${(error as Error).message}`
    }
  }
}

// ===== تعديل جزء من ملف =====
export async function filePatchHandler(
  params: Record<string, unknown>
): Promise<HandlerResult> {
  try {
    const safePath = resolveSafePath(params.filePath as string)
    const { oldText, newText } = params

    const content = await fs.readFile(safePath, 'utf-8')

    if (!content.includes(oldText as string)) {
      return {
        success: true,
        data: { replaced: false, filePath: params.filePath },
        summary: `⚠️ النص المراد تعديله غير موجود في: ${params.filePath}`
      }
    }

    // استبدال أول تطابق فقط
    const updated = content.replace(oldText as string, newText as string)
    await fs.writeFile(safePath, updated, 'utf-8')

    return {
      success: true,
      data: { replaced: true, filePath: params.filePath },
      summary: `🔧 تم تعديل الملف: ${params.filePath}`
    }
  } catch (error) {
    return {
      success: false,
      error: `فشل التعديل: ${(error as Error).message}`
    }
  }
}

// ===== حذف ملف =====
export async function fileDeleteHandler(
  params: Record<string, unknown>
): Promise<HandlerResult> {
  try {
    const safePath = resolveSafePath(params.filePath as string)
    await fs.unlink(safePath)

    return {
      success: true,
      data: { deleted: true, filePath: params.filePath },
      summary: `🗑️ تم حذف الملف: ${params.filePath}`
    }
  } catch (error) {
    return {
      success: false,
      error: `فشل الحذف: ${(error as Error).message}`
    }
  }
}

// ===== قائمة الملفات =====
export async function fileListHandler(
  params: Record<string, unknown>
): Promise<HandlerResult> {
  try {
    const subFolder = params.subFolder as string | undefined
    const extension = params.extension as string | undefined

    const targetDir = subFolder
      ? resolveSafePath(subFolder)
      : SAFE_BASE_DIR

    // إنشاء المجلد إذا لم يوجد
    await fs.mkdir(targetDir, { recursive: true })

    const entries = await fs.readdir(targetDir, { withFileTypes: true })

    const files = await Promise.all(
      entries
        .filter(e => e.isFile())
        .filter(e => !extension || extension === 'all' || e.name.endsWith(extension))
        .map(async e => {
          const stats = await fs.stat(path.join(targetDir, e.name))
          return {
            name: e.name,
            sizeKb: (stats.size / 1024).toFixed(2),
            lastModified: stats.mtime.toISOString()
          }
        })
    )

    return {
      success: true,
      data: { files, count: files.length },
      summary: `📁 وُجد ${files.length} ملف${subFolder ? ` في ${subFolder}` : ''}`
    }
  } catch (error) {
    return {
      success: false,
      error: `فشل قراءة المجلد: ${(error as Error).message}`
    }
  }
}

// ===== رفع لـ Supabase Storage =====
export async function fileToStorageHandler(
  params: Record<string, unknown>
): Promise<HandlerResult> {
  try {
    const safePath = resolveSafePath(params.filePath as string)
    const bucket = (params.bucket as string) ?? 'zoon-reports'
    const fileName = path.basename(safePath)

    const fileBuffer = await fs.readFile(safePath)
    const mimeType = getMimeType(fileName)

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY! // نستخدم الـ service_role للمهام الخلفية
    )

    const { error } = await supabase.storage
      .from(bucket)
      .upload(`generated/${fileName}`, fileBuffer, {
        contentType: mimeType,
        upsert: true
      })

    if (error) throw new Error(error.message)

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(`generated/${fileName}`)

    return {
      success: true,
      data: { publicUrl, fileName, bucket },
      summary: `☁️ تم رفع ${fileName} إلى Storage`
    }
  } catch (error) {
    return {
      success: false,
      error: `فشل الرفع: ${(error as Error).message}`
    }
  }
}

// ===== مساعد داخلي: تحديد نوع الملف =====
function getMimeType(fileName: string): string {
  const ext = path.extname(fileName).toLowerCase()
  const types: Record<string, string> = {
    '.md':   'text/markdown',
    '.txt':  'text/plain',
    '.json': 'application/json',
    '.pdf':  'application/pdf',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  }
  return types[ext] ?? 'application/octet-stream'
}
