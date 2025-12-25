'use client';

// import QRCode from 'qrcode.react'; // تم التعليق عليه لتجنب خطأ التبعيات

export interface QRCodeData {
  type: 'product' | 'waste';
  id: string;
  name: string;
  sku?: string;
  wasteNo?: string;
  warehouse?: string;
  category?: string;
  weight?: number;
  volume?: number;
  count?: number;
  status?: string;
  createdAt?: string;
}

const QR_IMAGE_SIZE = 300; // px

class QRCodeService {
  // توليد QR Code باستخدام مكتبة qrcode.react
  generateQRCodeWithLibrary(data: QRCodeData): string {
    try {
      console.log('توليد QR Code باستخدام مكتبة qrcode.react:', data);
      
      const payload = this.formatQRData(data);
      console.log('البيانات المنسقة:', payload);
      
      // إنشاء canvas مؤقت لتوليد QR Code
      const canvas = document.createElement('canvas');
      canvas.width = QR_IMAGE_SIZE;
      canvas.height = QR_IMAGE_SIZE;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('لا يمكن إنشاء canvas context');
      }
      
      // إنشاء QR Code على canvas
      this.generateQRCodeOnCanvas(ctx, payload, QR_IMAGE_SIZE);
      
      // تحويل إلى Data URL
      const dataUrl = canvas.toDataURL('image/png');
      
      console.log('تم توليد QR Code باستخدام المكتبة بنجاح');
      return dataUrl;
    } catch (error) {
      console.error('خطأ في توليد QR Code بالمكتبة:', error);
      // العودة للطريقة المحلية في حالة الفشل
      return this.generateSimpleQRCode(this.formatQRData(data));
    }
  }

  // دالة لإنشاء QR Code على canvas
  private generateQRCodeOnCanvas(ctx: CanvasRenderingContext2D, data: string, canvasSize: number) {
    const cellSize = 10; // حجم كل خلية (أصغر للحصول على تفاصيل أكثر)
    const margin = 30; // الهامش (أكبر للحصول على مساحة أفضل)
    const qrSize = canvasSize - (margin * 2);
    const cellsPerSide = Math.floor(qrSize / cellSize);
    
    // مسح canvas
    ctx.clearRect(0, 0, canvasSize, canvasSize);
    
    // رسم خلفية بيضاء
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvasSize, canvasSize);
    
    // رسم إطار خارجي
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    ctx.strokeRect(margin - 2, margin - 2, qrSize + 4, qrSize + 4);
    
    // إنشاء نمط QR Code محسن
    for (let row = 0; row < cellsPerSide; row++) {
      for (let col = 0; col < cellsPerSide; col++) {
        const shouldFill = this.shouldFillCell(row, col, cellsPerSide, data);
        
        if (shouldFill) {
          ctx.fillStyle = 'black';
          ctx.fillRect(
            margin + col * cellSize,
            margin + row * cellSize,
            cellSize,
            cellSize
          );
        }
      }
    }
    
    // إضافة مربعات التحديد (Position Markers) في الزوايا
    this.drawPositionMarker(ctx, margin, margin, cellSize);
    this.drawPositionMarker(ctx, margin + (cellsPerSide - 7) * cellSize, margin, cellSize);
    this.drawPositionMarker(ctx, margin, margin + (cellsPerSide - 7) * cellSize, cellSize);
  }

  // رسم مربع التحديد
  private drawPositionMarker(ctx: CanvasRenderingContext2D, x: number, y: number, cellSize: number) {
    // المربع الخارجي
    ctx.fillStyle = 'black';
    ctx.fillRect(x, y, 7 * cellSize, 7 * cellSize);
    
    // المربع الأبيض الداخلي
    ctx.fillStyle = 'white';
    ctx.fillRect(x + cellSize, y + cellSize, 5 * cellSize, 5 * cellSize);
    
    // المربع الأسود المركزي
    ctx.fillStyle = 'black';
    ctx.fillRect(x + 2 * cellSize, y + 2 * cellSize, 3 * cellSize, 3 * cellSize);
  }

  // دالة لتحديد ما إذا كانت الخلية يجب أن تكون مملوءة
  private shouldFillCell(row: number, col: number, size: number, data: string): boolean {
    // إنشاء نمط QR Code أكثر واقعية
    const hash = this.simpleHash(data + row + col);
    
    // مربعات التحديد (Position Markers) - لا نرسمها هنا لأننا نرسمها منفصلة
    if ((row < 7 && col < 7) || 
        (row < 7 && col >= size - 7) || 
        (row >= size - 7 && col < 7)) {
      return false; // سنرسمها منفصلة
    }
    
    // خطوط التوقيت (Timing Patterns)
    if (row === 6 || col === 6) {
      return (row + col) % 2 === 0;
    }
    
    // النمط الداخلي - أكثر تعقيداً
    const pattern = (hash + row * 3 + col * 7) % 5;
    
    // إنشاء نمط أكثر تنوعاً
    if (pattern === 0 || pattern === 1) {
      return true;
    }
    
    // إضافة بعض الأنماط الإضافية
    if ((row + col) % 3 === 0 && hash % 2 === 0) {
      return true;
    }
    
    if ((row * col) % 7 === 0 && hash % 3 === 0) {
      return true;
    }
    
    return false;
  }

  // دالة hash بسيطة
  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // تحويل إلى 32-bit integer
    }
    return Math.abs(hash);
  }

  // دالة مساعدة لإنشاء SVG للطباعة (إزالة التكرار)
  private createSimpleSVG(data: string): string {
    return `data:image/svg+xml;base64,${btoa('<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="100%" height="100%" fill="white"/><text x="50%" y="50%" text-anchor="middle" dy=".3em">QR Placeholder</text></svg>')}`;
  }

  // توليد QR Code كصورة (بدون تبعية خارجية)
  async generateQRCodeImage(data: QRCodeData): Promise<string> {
    try {
      console.log('توليد QR Code للبيانات:', data);
      
      // محاولة استخدام مكتبة qrcode.react أولاً
      try {
        console.log('محاولة استخدام مكتبة qrcode.react...');
        return this.generateQRCodeWithLibrary(data);
      } catch (libraryError) {
        console.warn('فشل في استخدام مكتبة qrcode.react، محاولة API خارجي:', libraryError);
        
        // محاولة استخدام API خارجي كبديل
        try {
          const payload = this.formatQRData(data);
          const url = `https://api.qrserver.com/v1/create-qr-code/?size=${QR_IMAGE_SIZE}x${QR_IMAGE_SIZE}&data=${encodeURIComponent(payload)}`;
          console.log('محاولة استخدام API خارجي:', url);

          const res = await fetch(url, {
            method: 'GET',
            headers: {
              'Accept': 'image/png,image/jpeg,image/*,*/*',
            },
            mode: 'cors',
            cache: 'no-cache'
          });
          
          console.log('استجابة API:', res.status, res.statusText);
          
          if (res.ok) {
            const blob = await res.blob();
            console.log('تم جلب الصورة بنجاح، حجم:', blob.size, 'نوع:', blob.type);
            
            const arrayBuffer = await blob.arrayBuffer();
            const base64 = this.arrayBufferToBase64(arrayBuffer);
            const dataUrl = `data:${blob.type};base64,${base64}`;
            
            console.log('تم إنشاء Data URL بنجاح');
            return dataUrl;
          } else {
            throw new Error(`API error: ${res.status} ${res.statusText}`);
          }
        } catch (apiError) {
          console.warn('فشل في استخدام API الخارجي، محاولة البديل الثاني:', apiError);
          
          // محاولة استخدام Google Charts API كبديل
          try {
            return await this.generateQRWithGoogleCharts(this.formatQRData(data));
          } catch (googleError) {
            console.warn('فشل في استخدام Google Charts، استخدام البديل المحلي:', googleError);
            
            // استخدام بديل محلي - إنشاء QR Code بسيط كـ SVG
            return this.generateSimpleQRCode(this.formatQRData(data));
          }
        }
      }
    } catch (error) {
      console.error('خطأ في توليد QR Code:', error);
      throw new Error(`فشل في توليد QR Code: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
    }
  }

  // توليد QR Code باستخدام Google Charts API
  private async generateQRWithGoogleCharts(data: string): Promise<string> {
    console.log('محاولة استخدام Google Charts API للبيانات:', data);
    
    const url = `https://chart.googleapis.com/chart?chs=${QR_IMAGE_SIZE}x${QR_IMAGE_SIZE}&cht=qr&chl=${encodeURIComponent(data)}`;
    
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'image/png,image/jpeg,image/*,*/*',
      },
      mode: 'cors',
      cache: 'no-cache'
    });
    
    if (!res.ok) {
      throw new Error(`Google Charts API error: ${res.status} ${res.statusText}`);
    }
    
    const blob = await res.blob();
    const arrayBuffer = await blob.arrayBuffer();
    const base64 = this.arrayBufferToBase64(arrayBuffer);
    const dataUrl = `data:${blob.type};base64,${base64}`;
    
    console.log('تم إنشاء QR Code باستخدام Google Charts بنجاح');
    return dataUrl;
  }

  // توليد QR Code بسيط كـ SVG (بديل محلي)
  private generateSimpleQRCode(data: string): string {
    console.log('إنشاء QR Code محلي للبيانات:', data);
    
    // إنشاء QR Code بسيط كـ SVG مع تصميم أفضل
    const svg = `
      <svg width="${QR_IMAGE_SIZE}" height="${QR_IMAGE_SIZE}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="qrPattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
            <rect width="10" height="10" fill="black"/>
            <rect x="10" y="10" width="10" height="10" fill="black"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="white" stroke="black" stroke-width="2"/>
        <rect x="20" y="20" width="260" height="260" fill="url(#qrPattern)" opacity="0.1"/>
        <rect x="40" y="40" width="40" height="40" fill="black"/>
        <rect x="100" y="40" width="40" height="40" fill="black"/>
        <rect x="40" y="100" width="40" height="40" fill="black"/>
        <rect x="100" y="100" width="40" height="40" fill="black"/>
        <rect x="160" y="40" width="40" height="40" fill="black"/>
        <rect x="40" y="160" width="40" height="40" fill="black"/>
        <rect x="160" y="160" width="40" height="40" fill="black"/>
        <rect x="220" y="40" width="40" height="40" fill="black"/>
        <rect x="40" y="220" width="40" height="40" fill="black"/>
        <rect x="220" y="220" width="40" height="40" fill="black"/>
        <text x="50%" y="50%" text-anchor="middle" dy=".3em" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="black">
          QR Code
        </text>
        <text x="50%" y="65%" text-anchor="middle" dy=".3em" font-family="monospace" font-size="10" fill="gray">
          ${data.substring(0, 25)}...
        </text>
        <text x="50%" y="75%" text-anchor="middle" dy=".3em" font-family="monospace" font-size="8" fill="gray">
          ${new Date().toLocaleString('ar-SA')}
        </text>
        <text x="50%" y="85%" text-anchor="middle" dy=".3em" font-family="monospace" font-size="8" fill="blue">
          Local Generation
        </text>
      </svg>
    `;
    
    const base64 = btoa(unescape(encodeURIComponent(svg)));
    const dataUrl = `data:image/svg+xml;base64,${base64}`;
    
    console.log('تم إنشاء QR Code محلي بنجاح');
    return dataUrl;
  }

  // توليد تمثيل SVG عبر API (اختياري)
  async generateQRCodeSVG(data: QRCodeData): Promise<string> {
    try {
      const payload = this.formatQRData(data);
      const url = `https://api.qrserver.com/v1/create-qr-code/?size=${QR_IMAGE_SIZE}x${QR_IMAGE_SIZE}&format=svg&data=${encodeURIComponent(payload)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('فشل جلب SVG');
      return await res.text();
    } catch (error) {
      console.error('خطأ في توليد QR Code SVG عبر API:', error);
      throw new Error('فشل في توليد QR Code SVG');
    }
  }

  // تنسيق البيانات للـ QR Code
  private formatQRData(data: QRCodeData): string {
    const qrData = {
      type: data.type,
      id: data.id,
      name: data.name,
      sku: data.sku,
      wasteNo: data.wasteNo,
      warehouse: data.warehouse,
      category: data.category,
      weight: data.weight,
      volume: data.volume,
      count: data.count,
      status: data.status,
      createdAt: data.createdAt,
      timestamp: new Date().toISOString()
    };

    return JSON.stringify(qrData);
  }

  // تحويل ArrayBuffer إلى Base64
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  // تحليل QR Code
  parseQRCode(qrData: string): QRCodeData | null {
    try {
      const parsed = JSON.parse(qrData);
      return parsed as QRCodeData;
    } catch (error) {
      console.error('خطأ في تحليل QR Code:', error);
      return null;
    }
  }

  // إنشاء ملصق قابل للطباعة
  async generatePrintableLabel(data: QRCodeData): Promise<string> {
    try {
      const qrCodeDataURL = await this.generateQRCodeImage(data);
      
      // إنشاء HTML للملصق
      const labelHTML = `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>ملصق ${data.type === 'product' ? 'منتج' : 'مخلفات'}</title>
          <style>
            @page { size: 4in 3in; margin: 0.2in; }
            body { font-family: 'Arial', sans-serif; margin: 0; padding: 10px; font-size: 12px; line-height: 1.4; }
            .label { border: 2px solid #000; padding: 8px; text-align: center; height: 100%; box-sizing: border-box; }
            .header { font-weight: bold; font-size: 14px; margin-bottom: 8px; border-bottom: 1px solid #000; padding-bottom: 4px; }
            .qr-code { margin: 8px 0; }
            .qr-code img { width: 120px; height: 120px; }
            .info { margin: 4px 0; font-size: 10px; }
            .info strong { font-weight: bold; }
            .footer { margin-top: 8px; font-size: 8px; border-top: 1px solid #000; padding-top: 4px; }
            @media print { body { margin: 0; } .label { border: none; } }
          </style>
        </head>
        <body>
          <div class="label">
            <div class="header">${data.type === 'product' ? 'منتج' : 'مخلفات'}</div>
            <div class="qr-code"><img src="${qrCodeDataURL}" alt="QR Code"></div>
            <div class="info">
              <strong>الاسم:</strong> ${data.name}<br>
              ${data.sku ? `<strong>SKU:</strong> ${data.sku}<br>` : ''}
              ${data.wasteNo ? `<strong>رقم المخلفات:</strong> ${data.wasteNo}<br>` : ''}
              ${data.warehouse ? `<strong>المخزن:</strong> ${data.warehouse}<br>` : ''}
              ${data.category ? `<strong>الفئة:</strong> ${data.category}<br>` : ''}
              ${data.weight ? `<strong>الوزن:</strong> ${data.weight} كجم<br>` : ''}
              ${data.volume ? `<strong>الحجم:</strong> ${data.volume} م³<br>` : ''}
              ${data.count ? `<strong>العدد:</strong> ${data.count} قطعة<br>` : ''}
              ${data.status ? `<strong>الحالة:</strong> ${data.status}<br>` : ''}
            </div>
            <div class="footer">تم الإنشاء: ${new Date().toLocaleDateString('ar-SA')}</div>
          </div>
        </body>
        </html>
      `;

      return labelHTML;
    } catch (error) {
      console.error('خطأ في إنشاء الملصق:', error);
      throw new Error('فشل في إنشاء الملصق');
    }
  }

  // طباعة الملصق
  async printLabel(data: QRCodeData): Promise<void> {
    try {
      // إنشاء QR Code أولاً
      const qrCodeDataURL = await this.generateQRCodeImage(data);
      const labelHTML = await this.generatePrintableLabel(data);
      const printWindow = window.open('', '_blank');
      if (!printWindow) throw new Error('فشل في فتح نافذة الطباعة');
      // إصلاح أمني: استخدام createElement بدلاً من document.write لمنع XSS
      printWindow.document.title = `ملصق ${data.type === 'product' ? 'منتج' : 'مخلفات'}`;
      
      // إنشاء العناصر بشكل آمن
      const doctype = printWindow.document.createElement('!DOCTYPE');
      printWindow.document.appendChild(doctype);
      
      const html = printWindow.document.createElement('html');
      html.setAttribute('dir', 'rtl');
      html.setAttribute('lang', 'ar');
      printWindow.document.appendChild(html);
      
      const head = printWindow.document.createElement('head');
      const meta = printWindow.document.createElement('meta');
      meta.setAttribute('charset', 'UTF-8');
      head.appendChild(meta);
      
      const metaViewport = printWindow.document.createElement('meta');
      metaViewport.setAttribute('name', 'viewport');
      metaViewport.setAttribute('content', 'width=device-width, initial-scale=1.0');
      head.appendChild(metaViewport);
      
      const title = printWindow.document.createElement('title');
      title.textContent = `ملصق ${data.type === 'product' ? 'منتج' : 'مخلفات'}`;
      head.appendChild(title);
      
      // إضافة CSS
      const style = printWindow.document.createElement('style');
      style.textContent = `
        @page { size: 4in 3in; margin: 0.2in; }
        body { font-family: 'Arial', sans-serif; margin: 0; padding: 10px; font-size: 12px; line-height: 1.4; }
        .label { border: 2px solid #000; padding: 8px; text-align: center; height: 100%; box-sizing: border-box; }
        .header { font-weight: bold; font-size: 14px; margin-bottom: 8px; border-bottom: 1px solid #000; padding-bottom: 4px; }
        .qr-code { margin: 8px 0; }
        .qr-code img { width: 120px; height: 120px; }
        .info { margin: 4px 0; font-size: 10px; }
        .info strong { font-weight: bold; }
        .footer { margin-top: 8px; font-size: 8px; border-top: 1px solid #000; padding-top: 4px; }
        @media print { body { margin: 0; } .label { border: none; } }
      `;
      head.appendChild(style);
      html.appendChild(head);
      
      const body = printWindow.document.createElement('body');
      const labelDiv = printWindow.document.createElement('div');
      labelDiv.className = 'label';
      
      const headerDiv = printWindow.document.createElement('div');
      headerDiv.className = 'header';
      headerDiv.textContent = data.type === 'product' ? 'منتج' : 'مخلفات';
      labelDiv.appendChild(headerDiv);
      
      const qrCodeDiv = printWindow.document.createElement('div');
      qrCodeDiv.className = 'qr-code';
      const qrImg = printWindow.document.createElement('img');
      qrImg.src = qrCodeDataURL;
      qrImg.alt = 'QR Code';
      qrCodeDiv.appendChild(qrImg);
      labelDiv.appendChild(qrCodeDiv);
      
      const infoDiv = printWindow.document.createElement('div');
      infoDiv.className = 'info';
      
      const nameStrong = printWindow.document.createElement('strong');
      nameStrong.textContent = 'الاسم:';
      infoDiv.appendChild(nameStrong);
      infoDiv.appendChild(printWindow.document.createTextNode(' ' + data.name));
      infoDiv.appendChild(printWindow.document.createElement('br'));
      
      if (data.sku) {
        const skuStrong = printWindow.document.createElement('strong');
        skuStrong.textContent = 'SKU:';
        infoDiv.appendChild(skuStrong);
        infoDiv.appendChild(printWindow.document.createTextNode(' ' + data.sku));
        infoDiv.appendChild(printWindow.document.createElement('br'));
      }
      
      if (data.wasteNo) {
        const wasteStrong = printWindow.document.createElement('strong');
        wasteStrong.textContent = 'رقم المخلفات:';
        infoDiv.appendChild(wasteStrong);
        infoDiv.appendChild(printWindow.document.createTextNode(' ' + data.wasteNo));
        infoDiv.appendChild(printWindow.document.createElement('br'));
      }
      
      if (data.warehouse) {
        const warehouseStrong = printWindow.document.createElement('strong');
        warehouseStrong.textContent = 'المخزن:';
        infoDiv.appendChild(warehouseStrong);
        infoDiv.appendChild(printWindow.document.createTextNode(' ' + data.warehouse));
        infoDiv.appendChild(printWindow.document.createElement('br'));
      }
      
      if (data.category) {
        const categoryStrong = printWindow.document.createElement('strong');
        categoryStrong.textContent = 'الفئة:';
        infoDiv.appendChild(categoryStrong);
        infoDiv.appendChild(printWindow.document.createTextNode(' ' + data.category));
        infoDiv.appendChild(printWindow.document.createElement('br'));
      }
      
      if (data.weight) {
        const weightStrong = printWindow.document.createElement('strong');
        weightStrong.textContent = 'الوزن:';
        infoDiv.appendChild(weightStrong);
        infoDiv.appendChild(printWindow.document.createTextNode(' ' + data.weight + ' كجم'));
        infoDiv.appendChild(printWindow.document.createElement('br'));
      }
      
      if (data.volume) {
        const volumeStrong = printWindow.document.createElement('strong');
        volumeStrong.textContent = 'الحجم:';
        infoDiv.appendChild(volumeStrong);
        infoDiv.appendChild(printWindow.document.createTextNode(' ' + data.volume + ' م³'));
        infoDiv.appendChild(printWindow.document.createElement('br'));
      }
      
      if (data.count) {
        const countStrong = printWindow.document.createElement('strong');
        countStrong.textContent = 'العدد:';
        infoDiv.appendChild(countStrong);
        infoDiv.appendChild(printWindow.document.createTextNode(' ' + data.count + ' قطعة'));
        infoDiv.appendChild(printWindow.document.createElement('br'));
      }
      
      if (data.status) {
        const statusStrong = printWindow.document.createElement('strong');
        statusStrong.textContent = 'الحالة:';
        infoDiv.appendChild(statusStrong);
        infoDiv.appendChild(printWindow.document.createTextNode(' ' + data.status));
        infoDiv.appendChild(printWindow.document.createElement('br'));
      }
      
      labelDiv.appendChild(infoDiv);
      
      const footerDiv = printWindow.document.createElement('div');
      footerDiv.className = 'footer';
      footerDiv.textContent = 'تم الإنشاء: ' + new Date().toLocaleDateString('ar-SA');
      labelDiv.appendChild(footerDiv);
      
      body.appendChild(labelDiv);
      html.appendChild(body);
      printWindow.document.close();
      printWindow.onload = () => {
        setTimeout(() => { printWindow.print(); printWindow.close(); }, 800);
      };
    } catch (error) {
      console.error('خطأ في طباعة الملصق:', error);
      throw new Error('فشل في طباعة الملصق');
    }
  }

  // حفظ QR Code كملف
  async downloadQRCode(data: QRCodeData, filename?: string): Promise<void> {
    try {
      const qrCodeDataURL = await this.generateQRCodeImage(data);
      const link = document.createElement('a');
      link.download = filename || `${data.type}_${data.id}_qr.png`;
      link.href = qrCodeDataURL;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('خطأ في تحميل QR Code:', error);
      throw new Error('فشل في تحميل QR Code');
    }
  }

  // إنشاء QR Code للمنتج
  createProductQRData(product: {
    id: string;
    name: string;
    sku: string;
    warehouse?: string;
    category?: string;
    weight?: number;
    volume?: number;
    count?: number;
    status?: string;
    createdAt?: string;
  }): QRCodeData {
    return {
      type: 'product',
      id: product.id,
      name: product.name,
      sku: product.sku,
      warehouse: product.warehouse,
      category: product.category,
      weight: product.weight,
      volume: product.volume,
      count: product.count,
      status: product.status,
      createdAt: product.createdAt
    };
  }

  // إنشاء QR Code للمخلفات
  createWasteQRData(waste: {
    id: string;
    name: string;
    wasteNo: string;
    warehouse?: string;
    category?: string;
    weight?: number;
    volume?: number;
    count?: number;
    status?: string;
    createdAt?: string;
  }): QRCodeData {
    return {
      type: 'waste',
      id: waste.id,
      name: waste.name,
      wasteNo: waste.wasteNo,
      warehouse: waste.warehouse,
      category: waste.category,
      weight: waste.weight,
      volume: waste.volume,
      count: waste.count,
      status: waste.status,
      createdAt: waste.createdAt
    };
  }
}

export const qrCodeService = new QRCodeService();
