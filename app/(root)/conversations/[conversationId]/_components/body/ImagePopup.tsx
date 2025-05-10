"use client";

import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Download, Loader2, X } from 'lucide-react';
import React, { useState } from 'react';
import { cn } from '@/lib/utils';

interface ImagePopupProps {
  imageUrl: string;
  isOpen: boolean;
  onClose: () => void;
}

const ImagePopup = ({ imageUrl, isOpen, onClose }: ImagePopupProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleDownload = async () => {
    try {
      // Fetch the image as a blob
      const response = await fetch(imageUrl);
      const blob = await response.blob();

      // Create a blob URL for the image
      const blobUrl = URL.createObjectURL(blob);

      // Create a temporary anchor element
      const a = document.createElement('a');
      a.href = blobUrl;

      // Extract filename from URL or use a default name
      // Remove any query parameters from the filename
      const filename = imageUrl.split('/').pop()?.split('?')[0] || 'image.jpg';
      a.download = filename;

      // Append to the document, click it, and remove it
      document.body.appendChild(a);
      a.click();

      // Clean up
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Error downloading image:", error);
    }
  };

  // Reset the loaded state when dialog opens/closes
  React.useEffect(() => {
    setImageLoaded(false);
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[90vw] max-h-[90vh] p-0 bg-transparent border-none">
        <div className="relative w-full h-full flex items-center justify-center">
          <div className="absolute top-2 right-2 z-10 flex gap-2">
            <button
              onClick={handleDownload}
              className="bg-black/40 backdrop-blur-md text-white rounded-full p-1 hover:bg-black/60 transition shadow-lg border border-white/10"
              title="Download image"
            >
              <Download className="h-6 w-6" />
            </button>
            <button
              onClick={onClose}
              className="bg-black/40 backdrop-blur-md text-white rounded-full p-1 hover:bg-black/60 transition shadow-lg border border-white/10"
              title="Close"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <div className={cn(
            "relative rounded-lg overflow-hidden",
            !imageLoaded && "bg-black/20 backdrop-blur-xl border border-white/20 shadow-xl min-w-[300px] min-h-[300px]"
          )}>
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-black/30 backdrop-blur-md p-6 rounded-full">
                  <Loader2 className="h-10 w-10 animate-spin text-white" />
                </div>
              </div>
            )}
            <img
              src={imageUrl}
              alt="Full size image"
              className={cn(
                "max-w-full max-h-[85vh] object-contain rounded-lg shadow-xl",
                !imageLoaded && "opacity-0",
                imageLoaded && "opacity-100 transition-opacity duration-500"
              )}
              onLoad={() => setImageLoaded(true)}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImagePopup; 