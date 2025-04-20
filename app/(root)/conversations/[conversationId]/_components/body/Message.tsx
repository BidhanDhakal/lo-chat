"use client";

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { api } from '@/convex/_generated/api';
import { useMutation } from 'convex/react';
import { format } from 'date-fns';
import { Download, Loader2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import ImagePopup from './ImagePopup';

interface MessageProps {
  fromCurrentUser: boolean;
  senderImage?: string;
  senderName: string;
  lastByUser: boolean;
  content: string;
  createdAt: number;
  type: string;
}

const Message = ({
  fromCurrentUser,
  senderImage,
  senderName,
  lastByUser,
  content,
  createdAt,
  type
}: MessageProps) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isImagePopupOpen, setIsImagePopupOpen] = useState(false);
  const [showDownloadButton, setShowDownloadButton] = useState(false);
  const getUrl = useMutation(api.files.getUrl);

  // Load image URL for image messages
  useEffect(() => {
    const loadImageUrl = async () => {
      if (type === 'image') {
        try {
          setIsLoading(true);
          const url = await getUrl({ storageId: content });
          setImageUrl(url);
        } catch (error) {
          console.error("Failed to load image:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadImageUrl();
  }, [content, type, getUrl]);

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!imageUrl) return;

    const url = imageUrl as string;

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

  // Function to detect and convert links to clickable elements
  const renderTextWithLinks = (text: string) => {
    // Regular expression to match URLs
    const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|([^\s]+\.(com|org|net|edu|gov|mil|io|co|me|app|dev)[^\s]*)/g;
    
    // If no URLs in the text, return the text as is
    if (!text.match(urlRegex)) {
      return text;
    }
    
    // Create an array to hold the result
    const result: React.ReactNode[] = [];
    
    // Keep track of the last index processed
    let lastIndex = 0;
    
    // Find all matches and process them
    let match;
    while ((match = urlRegex.exec(text)) !== null) {
      // Add the text before the match
      if (match.index > lastIndex) {
        result.push(
          <span key={`text-${lastIndex}`}>
            {text.substring(lastIndex, match.index)}
          </span>
        );
      }
      
      // Get the matched URL
      let url = match[0];
      let displayUrl = url;
      
      // Add https:// prefix if needed
      if (url.startsWith('www.')) {
        url = 'https://' + url;
      } else if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('ftp://')) {
        // Check if it's a domain with a TLD
        if (url.match(/[^\s]+\.(com|org|net|edu|gov|mil|io|co|me|app|dev)/)) {
          url = 'https://' + url;
        }
      }
      
      // Add the link
      result.push(
        <a 
          key={`link-${match.index}`}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 underline hover:text-blue-700"
          onClick={(e) => e.stopPropagation()}
        >
          {displayUrl}
        </a>
      );
      
      // Update the last index
      lastIndex = match.index + match[0].length;
    }
    
    // Add any remaining text
    if (lastIndex < text.length) {
      result.push(
        <span key={`text-${lastIndex}`}>
          {text.substring(lastIndex)}
        </span>
      );
    }
    
    return result;
  };

  return (
    <>
      <div className={cn(
        "flex gap-2 w-full",
        fromCurrentUser ? "justify-end" : "justify-start",
        lastByUser ? "mt-1" : "mt-4"
      )}>
        {!fromCurrentUser && !lastByUser && (
          <Avatar className="h-8 w-8">
            <AvatarImage src={senderImage} />
            <AvatarFallback>
              {senderName.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        )}
        {!fromCurrentUser && lastByUser && <div className="w-8" />}
        
        <div className={cn(
          "max-w-[80%]",
          fromCurrentUser ? "bg-primary text-primary-foreground" : "bg-muted",
          "rounded-lg px-3 py-2"
        )}>
          {type === 'text' && (
            <p className="text-sm break-words">
              {renderTextWithLinks(content)}
            </p>
          )}
          
          {type === 'image' && (
            <div 
              className="relative group"
              onMouseEnter={() => setShowDownloadButton(true)}
              onMouseLeave={() => setShowDownloadButton(false)}
            >
              {isLoading ? (
                <div className="flex items-center justify-center h-[200px] w-[250px] bg-muted rounded">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : imageUrl ? (
                <div className="image-container h-[200px] w-[250px] flex items-center justify-center bg-black/5 rounded overflow-hidden">
                  <img 
                    src={imageUrl} 
                    alt="Image message" 
                    className="max-h-[200px] max-w-[250px] object-contain cursor-pointer hover:opacity-90 transition"
                    onLoad={() => setIsLoading(false)}
                    onClick={() => setIsImagePopupOpen(true)}
                  />
                  {showDownloadButton && (
                    <button
                      onClick={handleDownload}
                      className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 hover:bg-black/70 transition"
                      title="Download image"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center h-[200px] w-[250px] bg-muted rounded">
                  <p className="text-sm text-muted-foreground">Failed to load image</p>
                </div>
              )}
            </div>
          )}
          
          <p className="text-xs opacity-50 mt-1 text-right">
            {format(createdAt, 'p')}
          </p>
        </div>
      </div>

      {/* Image Popup */}
      {imageUrl && (
        <ImagePopup 
          imageUrl={imageUrl}
          isOpen={isImagePopupOpen}
          onClose={() => setIsImagePopupOpen(false)}
        />
      )}
    </>
  );
};

export default Message;
