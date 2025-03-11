"use client";

import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Download, X } from 'lucide-react';
import React from 'react';

interface ImagePopupProps {
  imageUrl: string;
  isOpen: boolean;
  onClose: () => void;
}

const ImagePopup = ({ imageUrl, isOpen, onClose }: ImagePopupProps) => {
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[90vw] max-h-[90vh] p-0 bg-transparent border-none">
        <div className="relative w-full h-full flex items-center justify-center">
          <div className="absolute top-2 right-2 z-10 flex gap-2">
            <button 
              onClick={handleDownload}
              className="bg-black/50 text-white rounded-full p-1 hover:bg-black/70 transition"
              title="Download image"
            >
              <Download className="h-6 w-6" />
            </button>
            <button 
              onClick={onClose}
              className="bg-black/50 text-white rounded-full p-1 hover:bg-black/70 transition"
              title="Close"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <img 
            src={imageUrl} 
            alt="Full size image" 
            className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-xl"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImagePopup; 