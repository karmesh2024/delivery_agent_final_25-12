'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import {
  FiPlay,
  FiPause,
  FiSkipForward,
  FiVolume2,
  FiVolumeX,
  FiMaximize,
  FiMinimize,
  FiX,
  FiEye
} from 'react-icons/fi';
import { VisualAd, visualAdsService } from '../services/visualAdsService';

interface VisualAdsPlayerProps {
  isVisible: boolean;
  onClose: () => void;
  onAdComplete?: (ad: VisualAd) => void;
  onAdInteract?: (ad: VisualAd, interaction: 'view' | 'click' | 'skip') => void;
  className?: string;
}

export function VisualAdsPlayer({
  isVisible,
  onClose,
  onAdComplete,
  onAdInteract,
  className = ''
}: VisualAdsPlayerProps) {
  const [currentAd, setCurrentAd] = useState<VisualAd | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [loading, setLoading] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();

  // تحميل إعلان مرئي جديد
  const loadNextAd = async () => {
    try {
      setLoading(true);
      const ads = await visualAdsService.getScheduledVisualAds();

      if (ads.length > 0) {
        const randomAd = ads[Math.floor(Math.random() * ads.length)];
        setCurrentAd(randomAd);

        // تسجيل عرض الإعلان
        await visualAdsService.logVisualAdDisplay(
          randomAd.id,
          randomAd.media_type === 'video'
            ? (randomAd.file_duration_seconds || 0)
            : (randomAd.display_duration_seconds || 10)
        );

        onAdInteract?.(randomAd, 'view');
      }
    } catch (error) {
      console.error('Error loading visual ad:', error);
    } finally {
      setLoading(false);
    }
  };

  // بدء عرض الإعلان
  const startAd = () => {
    if (!currentAd) return;

    setIsPlaying(true);

    if (currentAd.media_type === 'video' && videoRef.current) {
      videoRef.current.play().catch(console.error);
    } else if (currentAd.media_type === 'image') {
      // للصور، نبدأ عداد زمني
      const duration = currentAd.display_duration_seconds || 10;
      setTimeRemaining(duration);

      const interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            handleAdComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  };

  // إيقاف عرض الإعلان
  const pauseAd = () => {
    setIsPlaying(false);

    if (currentAd?.media_type === 'video' && videoRef.current) {
      videoRef.current.pause();
    }
  };

  // تخطي الإعلان
  const skipAd = () => {
    if (currentAd) {
      onAdInteract?.(currentAd, 'skip');
    }
    handleAdComplete();
  };

  // اكتمال الإعلان
  const handleAdComplete = () => {
    if (currentAd) {
      onAdComplete?.(currentAd);
    }
    setCurrentAd(null);
    setIsPlaying(false);
    setTimeRemaining(0);
  };

  // التعامل مع انتهاء الفيديو
  const handleVideoEnded = () => {
    handleAdComplete();
  };

  // التعامل مع النقر على الإعلان
  const handleAdClick = () => {
    if (currentAd) {
      onAdInteract?.(currentAd, 'click');
      // يمكن إضافة رابط أو إجراء هنا
      if (currentAd.metadata?.call_to_action) {
        console.log('Call to action:', currentAd.metadata.call_to_action);
      }
    }
  };

  // تبديل الصوت
  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
    }
  };

  // تبديل ملء الشاشة
  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  };

  // إظهار/إخفاء التحكمات
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  };

  // تحميل إعلان جديد عند فتح المشغل
  useEffect(() => {
    if (isVisible && !currentAd) {
      loadNextAd();
    }
  }, [isVisible]);

  // تنظيف عند إغلاق المشغل
  useEffect(() => {
    if (!isVisible) {
      setCurrentAd(null);
      setIsPlaying(false);
      setTimeRemaining(0);
      if (videoRef.current) {
        videoRef.current.pause();
      }
    }
  }, [isVisible]);

  // مراقبة حالة ملء الشاشة
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  if (!isVisible) return null;

  return (
    <div className={`fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center ${className}`}>
      <Card className={`relative ${isFullscreen ? 'w-full h-full rounded-none' : 'w-full max-w-4xl max-h-[80vh]'}`}>
        <CardContent className="p-0 relative overflow-hidden rounded-lg">
          {/* Media Container */}
          <div
            ref={containerRef}
            className="relative bg-black cursor-pointer"
            onMouseMove={handleMouseMove}
            onClick={handleAdClick}
            style={{
              aspectRatio: isFullscreen ? 'auto' : '16/9',
              minHeight: isFullscreen ? '100vh' : '400px'
            }}
          >
            {loading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-white text-xl">جاري تحميل الإعلان...</div>
              </div>
            ) : currentAd ? (
              <>
                {currentAd.media_type === 'video' ? (
                  <video
                    ref={videoRef}
                    src={currentAd.file_url}
                    className="w-full h-full object-contain"
                    onEnded={handleVideoEnded}
                    muted={isMuted}
                    playsInline
                  />
                ) : (
                  <div
                    ref={imageRef}
                    className="w-full h-full bg-cover bg-center flex items-center justify-center"
                    style={{
                      backgroundImage: `url(${currentAd.file_url})`,
                      backgroundSize: 'contain',
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'center'
                    }}
                  >
                    {/* Overlay for text ads */}
                    {currentAd.description && (
                      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-4">
                        <h3 className="text-xl font-bold mb-2">{currentAd.title}</h3>
                        <p className="text-lg">{currentAd.description}</p>
                        {currentAd.metadata?.call_to_action && (
                          <div className="mt-2">
                            <Badge variant="secondary" className="text-black">
                              {currentAd.metadata.call_to_action}
                            </Badge>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Controls Overlay */}
                <div
                  className={`absolute inset-0 bg-black bg-opacity-30 transition-opacity duration-300 ${
                    showControls ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  {/* Top Bar */}
                  <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center">
                    <div className="text-white">
                      <h3 className="font-semibold">{currentAd.title}</h3>
                      {currentAd.media_type === 'image' && timeRemaining > 0 && (
                        <p className="text-sm opacity-75">
                          {timeRemaining} ثانية متبقية
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onClose();
                      }}
                      className="text-white hover:bg-white hover:bg-opacity-20"
                    >
                      <FiX className="w-5 h-5" />
                    </Button>
                  </div>

                  {/* Center Play/Pause */}
                  {!isPlaying && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Button
                        size="lg"
                        onClick={(e) => {
                          e.stopPropagation();
                          startAd();
                        }}
                        className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white border-white border"
                      >
                        <FiPlay className="w-8 h-8" />
                      </Button>
                    </div>
                  )}

                  {/* Bottom Controls */}
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isPlaying) {
                              pauseAd();
                            } else {
                              startAd();
                            }
                          }}
                          className="text-white hover:bg-white hover:bg-opacity-20"
                        >
                          {isPlaying ? <FiPause className="w-5 h-5" /> : <FiPlay className="w-5 h-5" />}
                        </Button>

                        {currentAd.media_type === 'video' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleMute();
                            }}
                            className="text-white hover:bg-white hover:bg-opacity-20"
                          >
                            {isMuted ? <FiVolumeX className="w-5 h-5" /> : <FiVolume2 className="w-5 h-5" />}
                          </Button>
                        )}

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            skipAd();
                          }}
                          className="text-white hover:bg-white hover:bg-opacity-20"
                        >
                          <FiSkipForward className="w-5 h-5" />
                        </Button>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          <FiEye className="w-3 h-3 mr-1" />
                          إعلان
                        </Badge>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFullscreen();
                          }}
                          className="text-white hover:bg-white hover:bg-opacity-20"
                        >
                          {isFullscreen ? <FiMinimize className="w-5 h-5" /> : <FiMaximize className="w-5 h-5" />}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                <div className="text-xl mb-4">لا توجد إعلانات مرئية متاحة</div>
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    loadNextAd();
                  }}
                  variant="outline"
                  className="border-white text-white hover:bg-white hover:text-black"
                >
                  <FiPlay className="w-4 h-4 mr-2" />
                  تحديث
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}