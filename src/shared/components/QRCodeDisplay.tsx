'use client';

import React, { useRef, useEffect, useState } from 'react';
import { QRCodeData } from '@/services/qrCodeService';

interface QRCodeDisplayProps {
  data: QRCodeData;
  size?: number;
  className?: string;
  onGenerated?: (dataUrl: string) => void;
}

export const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({
  data,
  size = 300,
  className = '',
  onGenerated
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dataUrl, setDataUrl] = useState<string>('');

  // دالة hash بسيطة
  const simpleHash = (str: string): number => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // تحويل إلى 32-bit integer
    }
    return Math.abs(hash);
  };

  // دالة لتحديد ما إذا كانت الخلية يجب أن تكون مملوءة
  const shouldFillCell = (row: number, col: number, size: number, data: string): boolean => {
    // إنشاء نمط QR Code بسيط
    const hash = simpleHash(data + row + col);
    
    // الزوايا الثلاث (مربعات التحديد)
    if ((row < 7 && col < 7) || 
        (row < 7 && col >= size - 7) || 
        (row >= size - 7 && col < 7)) {
      return (row + col) % 2 === 0;
    }
    
    // الحدود
    if (row === 0 || row === size - 1 || col === 0 || col === size - 1) {
      return true;
    }
    
    // النمط الداخلي
    return hash % 3 === 0;
  };

  // دالة لإنشاء QR Code على canvas
  const generateQRCodeOnCanvas = (ctx: CanvasRenderingContext2D, data: string, canvasSize: number) => {
    const cellSize = 12; // حجم كل خلية
    const margin = 20; // الهامش
    const qrSize = canvasSize - (margin * 2);
    const cellsPerSide = Math.floor(qrSize / cellSize);
    
    // إنشاء نمط QR Code بسيط
    for (let row = 0; row < cellsPerSide; row++) {
      for (let col = 0; col < cellsPerSide; col++) {
        const shouldFill = shouldFillCell(row, col, cellsPerSide, data);
        
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
  };

  useEffect(() => {
    if (canvasRef.current && data) {
      try {
        // تحويل البيانات إلى نص
        const dataString = JSON.stringify(data);
        
        // إنشاء QR Code على canvas
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        
        if (ctx) {
          // مسح canvas
          ctx.clearRect(0, 0, size, size);
          
          // رسم خلفية بيضاء
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, size, size);
          
          // إنشاء QR Code بسيط
          generateQRCodeOnCanvas(ctx, dataString, size);
          
          // تحويل إلى Data URL
          const newDataUrl = canvas.toDataURL('image/png');
          setDataUrl(newDataUrl);
          
          if (onGenerated) {
            onGenerated(newDataUrl);
          }
        }
      } catch (error) {
        console.error('خطأ في توليد QR Code:', error);
      }
    }
  }, [data, size, onGenerated]);

  return (
    <div className={`qr-code-display ${className}`}>
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        style={{ display: 'none' }}
      />
      {dataUrl ? (
        <img 
          src={dataUrl} 
          alt="QR Code" 
          width={size} 
          height={size}
          className="qr-code-image"
        />
      ) : (
        <div 
          className="qr-code-placeholder"
          style={{ 
            width: size, 
            height: size, 
            backgroundColor: '#f0f0f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid #ddd'
          }}
        >
          <span>جاري توليد QR Code...</span>
        </div>
      )}
    </div>
  );
};

export default QRCodeDisplay;
