import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Button } from '@/shared/components/ui/button';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { FiTrash2, FiInfo, FiUploadCloud } from 'react-icons/fi';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/components/ui/tooltip';
import { Product, ProductPriceFormData, MainCategory, SubCategory, TargetAudience, ProductType, CommonProductFormData, ImageUploadData } from '@/domains/products/types/types';
import { Prisma } from '@prisma/client';

interface MediaUploadFormProps {
  formData: CommonProductFormData;
  onImagesChange: (images: ImageUploadData[]) => void;
  isEditing: boolean;
}

const MediaUploadForm: React.FC<MediaUploadFormProps> = ({
  formData,
  onImagesChange,
  isEditing,
}) => {
  const [images, setImages] = useState<ImageUploadData[]>(formData.images);
  const isSyncingFromParent = useRef(false);

  useEffect(() => {
    // Ensure formData.images is the source of truth for the local state
    // Ensure each image has a unique id for React keys
    const imagesWithIds = formData.images.map((img, index) => ({
      ...img,
      id: img.id || `image-${index}-${Date.now()}-${Math.random()}`
    }));
    isSyncingFromParent.current = true;
    setImages(imagesWithIds);
  }, [formData.images]);

  useEffect(() => {
    if (isSyncingFromParent.current) {
      // Skip propagating when the change originated from parent props
      isSyncingFromParent.current = false;
      return;
    }
    onImagesChange(images);
  }, [images, onImagesChange]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      const newImagesData: ImageUploadData[] = newFiles.map((file) => ({
        id: `new-${Date.now()}-${Math.random()}`,
        file,
        url: URL.createObjectURL(file),
        alt_text_ar: '',
        alt_text_en: null,
        is_primary: false,
        type: file.type.startsWith('video') ? 'video' : 'image',
      }));

      setImages((prevImages) => {
        // If no primary image exists, make the first new image primary
        const hasPrimary = prevImages.some(img => img.is_primary);
        if (!hasPrimary && newImagesData.length > 0) {
          newImagesData[0].is_primary = true;
        }
        return [...prevImages, ...newImagesData];
      });

      // onImagesChange([...images, ...newImagesData]); // This line is no longer needed here
      e.target.value = ''; // Clear the input
    }
  }, [onImagesChange]);

  const handleAltTextChange = useCallback(
    (id: string, field: 'alt_text_ar' | 'alt_text_en', value: string) => {
      setImages((prevImages) =>
        prevImages.map((img) =>
          img.id === id ? { ...img, [field]: value === '' ? null : value } : img
        )
        );
    },
    [onImagesChange]
  );

  const handlePrimaryChange = useCallback((id: string) => {
    setImages((prevImages) =>
      prevImages.map((img) => ({
        ...img,
        is_primary: img.id === id,
      }))
    );
  }, [onImagesChange]);

  const handleRemoveImage = useCallback((id: string) => {
    setImages((prevImages) => {
      const filteredImages = prevImages.filter((img) => img.id !== id);
      // If the removed image was primary, and there are other images, make the first one primary
      if (prevImages.find(img => img.id === id)?.is_primary && filteredImages.length > 0) {
        filteredImages[0].is_primary = true;
      }
      return filteredImages;
    });
  }, [onImagesChange]);

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-6">
        <div>
          <Label htmlFor="media-upload" className="flex items-center gap-2 mb-2">
            رفع الصور/الفيديوهات
            <Tooltip>
              <TooltipTrigger asChild>
                <FiInfo className="h-4 w-4 text-gray-400 cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-sm">يمكنك رفع صور وفيديوهات للمنتج هنا.</p>
              </TooltipContent>
            </Tooltip>
          </Label>
          <div className="flex items-center justify-center w-full">
            <Label
              htmlFor="dropzone-file"
              className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <FiUploadCloud className="w-10 h-10 text-gray-400" />
                <p className="mb-2 text-sm text-gray-500">
                  <span className="font-semibold">انقر للتحميل</span> أو اسحب وأفلت
                </p>
                <p className="text-xs text-gray-500">SVG, PNG, JPG, GIF, MP4, MOV (بحد أقصى 5 ميجابايت)</p>
              </div>
              <Input id="dropzone-file" type="file" className="hidden" onChange={handleFileChange} multiple accept="image/*,video/*" />
            </Label>
          </div>
        </div>

        {images.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {images.map((image, index) => (
              <div key={image.id || `image-${index}`} className="border rounded-md p-4 relative">
                {image.type === 'image' ? (
                  <img src={image.image_url || image.url} alt={image.alt_text_ar || 'Product Image'} className="w-full h-48 object-cover rounded-md mb-2" />
                ) : (
                  <video src={image.image_url || image.url} controls className="w-full h-48 object-cover rounded-md mb-2" />
                )}
                <div className="space-y-2">
                  <div>
                    <Label htmlFor={`alt_text_ar-${image.id}`} className="flex items-center gap-2 text-sm">
                      النص البديل (عربي)
                    </Label>
                    <Input
                      id={`alt_text_ar-${image.id}`}
                      value={image.alt_text_ar || ''}
                      onChange={(e) => handleAltTextChange(image.id!, 'alt_text_ar', e.target.value)}
                      placeholder="مثال: صورة المنتج"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`alt_text_en-${image.id}`} className="flex items-center gap-2 text-sm">
                      النص البديل (انجليزي)
                    </Label>
                    <Input
                      id={`alt_text_en-${image.id}`}
                      value={image.alt_text_en || ''}
                      onChange={(e) => handleAltTextChange(image.id!, 'alt_text_en', e.target.value)}
                      placeholder="Example: Product Image"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`is_primary-${image.id}`}
                      checked={image.is_primary}
                      onCheckedChange={() => handlePrimaryChange(image.id!)}
                    />
                    <Label htmlFor={`is_primary-${image.id}`} className="text-sm">
                      صورة/فيديو أساسي
                    </Label>
                  </div>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => handleRemoveImage(image.id!)}
                >
                  <FiTrash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
};

export default MediaUploadForm; 