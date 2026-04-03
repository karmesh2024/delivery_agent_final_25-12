// src/domains/zoon-os/functions/handlers/export-handlers.ts

import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, BorderStyle } from 'docx';

export async function exportPdfHandler(params: any) {
  try {
    const { data: inputData, title = 'تقرير Zoon OS', fileName = 'report.pdf' } = params;
    
    if (!inputData) {
      throw new Error('لا توجد بيانات لتصديرها');
    }

    const doc = new jsPDF();
    
    // دعم العربية يحتاج لخطوط محددة، حالياً سنركز على الهيكل الأساسي
    doc.setFontSize(18);
    doc.text(title, 10, 10);
    
    doc.setFontSize(12);
    doc.text(`تاريخ الإصدار: ${new Date().toLocaleString('ar-EG')}`, 10, 20);

    // تحويل البيانات لجدول إذا كانت مصفوفة
    if (Array.isArray(inputData)) {
       const headers = Object.keys(inputData[0] || {});
       const rows = inputData.map(obj => Object.values(obj));
       
       (doc as any).autoTable({
         head: [headers],
         body: rows,
         startY: 30,
         theme: 'grid',
         styles: { halign: 'center' }
       });
    } else {
       // إذا كانت بيانات مفردة
       let y = 30;
       for (const [key, value] of Object.entries(inputData)) {
         doc.text(`${key}: ${value}`, 10, y);
         y += 10;
       }
    }

    // بدلاً من حفظه كملف حقيقي في السيرفر (الذي قد يفشل في بيئات الـ Serverless)
    // سنقوم بإعادته كـ Base64 لترميزه داخل الـ Pipeline
    const base64Data = doc.output('datauristring');

    return {
      success: true,
      data: {
        fileBase64: base64Data,
        fileName: fileName,
        mimeType: 'application/pdf'
      },
      summary: `تم توليد ملف PDF بنجاح باسم ${fileName}`
    };
  } catch (error: any) {
    return {
      success: false,
      data: null,
      summary: `فشل توليد PDF: ${error.message}`
    };
  }
}

/**
 * معالج تصدير Excel
 */
export async function exportExcelHandler(params: any) {
  try {
    const { data: inputData, fileName = 'report.xlsx' } = params;
    if (!inputData) throw new Error('لا توجد بيانات لتصديرها');

    const worksheet = XLSX.utils.json_to_sheet(Array.isArray(inputData) ? inputData : [inputData]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
    
    // توليد Buffer
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'base64' });

    return {
      success: true,
      data: {
        fileBase64: `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${excelBuffer}`,
        fileName,
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      },
      summary: `تم توليد ملف Excel بنجاح: ${fileName}`
    };
  } catch (error: any) {
    return { success: false, summary: `فشل توليد Excel: ${error.message}` };
  }
}

/**
 * معالج تصدير Word
 */
export async function exportWordHandler(params: any) {
  try {
    const { data: inputData, title = 'تقرير Zoon OS', fileName = 'report.docx' } = params;
    if (!inputData) throw new Error('لا توجد بيانات لتصديرها');

    const children: any[] = [
      new Paragraph({
        children: [new TextRun({ text: title, bold: true, size: 32 })],
        spacing: { after: 400 }
      })
    ];

    if (Array.isArray(inputData) && inputData.length > 0) {
      const headers = Object.keys(inputData[0]);
      const tableRows = [
        new TableRow({
          children: headers.map(h => new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: h, bold: true })] })] }))
        }),
        ...inputData.map(row => new TableRow({
          children: headers.map(h => new TableCell({ children: [new Paragraph(String(row[h] || ''))] }))
        }))
      ];

      children.push(new Table({ rows: tableRows, width: { size: 100, type: 'pct' as any } }));
    } else {
      Object.entries(inputData).forEach(([key, val]) => {
        children.push(new Paragraph(`${key}: ${val}`));
      });
    }

    const doc = new Document({ sections: [{ children }] });
    const buffer = await Packer.toBase64String(doc);

    return {
      success: true,
      data: {
        fileBase64: `data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,${buffer}`,
        fileName,
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      },
      summary: `تم توليد ملف Word بنجاح: ${fileName}`
    };
  } catch (error: any) {
    return { success: false, summary: `فشل توليد Word: ${error.message}` };
  }
}

/**
 * معالج تصدير Markdown
 */
export async function exportMarkdownHandler(params: any) {
  try {
    const { data: inputData, title = 'تقرير Zoon OS', fileName = 'report.md' } = params;
    if (!inputData) throw new Error('لا توجد بيانات لتصديرها');

    let md = `# ${title}\n\n`;
    md += `*تاريخ الإصدار: ${new Date().toLocaleString('ar-EG')}*\n\n`;

    if (Array.isArray(inputData) && inputData.length > 0) {
      const headers = Object.keys(inputData[0]);
      md += `| ${headers.join(' | ')} |\n`;
      md += `| ${headers.map(() => '---').join(' | ')} |\n`;
      inputData.forEach(row => {
        md += `| ${headers.map(h => row[h]).join(' | ')} |\n`;
      });
    } else {
      Object.entries(inputData).forEach(([key, val]) => {
        md += `**${key}**: ${val}  \n`;
      });
    }

    const base64Md = Buffer.from(md).toString('base64');

    return {
      success: true,
      data: {
        fileBase64: `data:text/markdown;base64,${base64Md}`,
        fileName,
        mimeType: 'text/markdown'
      },
      summary: `تم توليد ملف Markdown بنجاح: ${fileName}`
    };
  } catch (error: any) {
    return { success: false, summary: `فشل توليد Markdown: ${error.message}` };
  }
}
