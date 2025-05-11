"use client";

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { api } from '@/convex/_generated/api';
import { useMutation } from 'convex/react';
import { format } from 'date-fns';
import { Download, Loader2, FileText } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import ImagePopup from './ImagePopup';
import EmojiParser from '@/components/ui/emoji-parser';

interface MessageProps {
  fromCurrentUser: boolean;
  senderImage?: string;
  senderName: string;
  lastByUser: boolean;
  content: string | ArrayBuffer;
  createdAt: number;
  type: string;
  isFirstInSequence?: boolean;
  isNew?: boolean;
}

const Message = ({
  fromCurrentUser,
  senderImage,
  senderName,
  lastByUser,
  content,
  createdAt,
  type,
  isFirstInSequence = false,
  isNew = false
}: MessageProps) => {
  // Filter out both shield and crown emojis from sender name for display purposes only
  const displaySenderName = senderName.replace(/🛡️/g, '').replace(/👑/g, '');

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isImagePopupOpen, setIsImagePopupOpen] = useState(false);
  const [showDownloadButton, setShowDownloadButton] = useState(false);
  const [documentInfo, setDocumentInfo] = useState<{ storageId: string; fileName: string; fileType: string } | null>(null);
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);
  const getUrl = useMutation(api.files.getUrl);

  // Load URLs for image and document messages
  useEffect(() => {
    const loadUrls = async () => {
      if (type === 'image') {
        try {
          setIsLoading(true);
          setImageLoaded(false);
          const url = await getUrl({ storageId: content as string });
          setImageUrl(url);
        } catch (error) {
          console.error("Failed to load image:", error);
        } finally {
          setIsLoading(false);
        }
      } else if (type === 'document') {
        try {
          setIsLoading(true);
          let docInfo;
          try {
            // Try to parse as JSON first (new format)
            docInfo = JSON.parse(content as string);
          } catch (e) {
            // If parsing fails, use the old format where content is just the storageId
            docInfo = {
              storageId: content as string,
              fileName: 'Document',
              fileType: 'application/octet-stream'
            };
          }
          setDocumentInfo(docInfo);
          const url = await getUrl({ storageId: docInfo.storageId });
          setDocumentUrl(url);
        } catch (error) {
          console.error("Failed to load document:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadUrls();
  }, [content, type, getUrl]);

  const handleDownload = async (e: React.MouseEvent, url: string, fileName: string) => {
    e.stopPropagation();
    if (!url) return;

    try {
      // Fetch the file as a blob
      const response = await fetch(url);
      const blob = await response.blob();

      // Create a blob URL for the file
      const blobUrl = URL.createObjectURL(blob);

      // Create a temporary anchor element
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = fileName;

      // Append to the document, click it, and remove it
      document.body.appendChild(a);
      a.click();

      // Clean up
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Error downloading file:", error);
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

      let url = match[0];
      let displayUrl = url;

      if (url.startsWith('www.')) {
        url = 'https://' + url;
      } else if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('ftp://')) {

        if (url.match(/[^\s]+\.(com|org|net|edu|gov|mil|io|co|me|app|dev)/)) {
          url = 'https://' + url;
        }
      }

      result.push(
        <a
          key={`link-${match.index}`}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-900 dark:text-white underline hover:text-blue-900 font-medium"
          onClick={(e) => e.stopPropagation()}
        >
          {displayUrl}
        </a>
      );


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
    <div className={cn(
      "flex",
      fromCurrentUser ? "justify-end" : "justify-start"
    )}>
      <div className={cn(
        "flex items-end max-w-[85%] gap-1",
        isNew && fromCurrentUser && "animate-message-sent",
        isNew && !fromCurrentUser && "animate-message-received"
      )}>
        {!fromCurrentUser && !lastByUser && (
          <Avatar className="h-6 w-6 self-end -mb-1">
            <AvatarImage src={senderImage} className="object-cover" />
            <AvatarFallback>{displaySenderName.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
        )}

        {!fromCurrentUser && lastByUser && (
          <div className="w-6 shrink-0" />
        )}

        <div>
          {!fromCurrentUser && isFirstInSequence && (
            <div className="text-xs font-medium text-muted-foreground mb-[2px] ml-1">
              {displaySenderName}
            </div>
          )}

          <div className={cn(
            type !== 'image' && "rounded-lg px-3 py-[6px]",
            type !== 'image' && (fromCurrentUser
              ? "bg-primary text-primary-foreground shadow-sm rounded-br-none"
              : "bg-muted shadow-sm rounded-bl-none"),
            isNew && "animate-message-bubble"
          )}>
            {type === 'text' && (
              <p className="whitespace-pre-wrap">
                <EmojiParser text={renderTextWithLinks(content as string)} />
              </p>
            )}

            {type === 'image' && (
              <div
                className="relative"
                onMouseEnter={() => setShowDownloadButton(true)}
                onMouseLeave={() => setShowDownloadButton(false)}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center h-[200px] w-[250px] bg-muted/10 backdrop-blur-md rounded-lg border border-white/20">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : imageUrl ? (
                  <div className="flex">
                    <div className={cn(
                      "relative overflow-hidden rounded-lg shadow-md",
                      !imageLoaded && "bg-muted/10 backdrop-blur-md border border-white/20",
                      isNew && "animate-image-appear"
                    )}>
                      <img
                        src={imageUrl}
                        alt="Image message"
                        className={cn(
                          "max-h-[200px] max-w-[250px] object-contain cursor-pointer hover:opacity-90 transition rounded-lg",
                          !imageLoaded && "opacity-0",
                          imageLoaded && "opacity-100 transition-opacity duration-300"
                        )}
                        onLoad={() => setImageLoaded(true)}
                        onClick={() => setIsImagePopupOpen(true)}
                      />
                      {!imageLoaded && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    {showDownloadButton && imageLoaded && (
                      <button
                        onClick={(e) => handleDownload(e, imageUrl, 'image.jpg')}
                        className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm text-white rounded-full p-1 hover:bg-black/70 transition"
                        title="Download image"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-[200px] w-[250px] bg-muted/10 backdrop-blur-md rounded-lg border border-white/20">
                    <p className="text-sm text-muted-foreground">Failed to load image</p>
                  </div>
                )}
              </div>
            )}

            {type === 'document' && documentInfo && (
              <div
                className={cn(
                  "flex items-center gap-2 p-2 bg-background/50 rounded-lg cursor-pointer hover:bg-background/70 transition group shadow-sm",
                  isNew && "animate-document-appear"
                )}
                onClick={(e) => documentUrl && handleDownload(e, documentUrl, documentInfo.fileName)}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <FileText className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                  <span className="font-medium truncate max-w-[200px]">{documentInfo.fileName}</span>
                </div>
                <Download className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </div>
            )}

            <p className="text-xs opacity-60 mt-[2px] text-right">
              {format(createdAt, 'p')}
            </p>
          </div>
        </div>

        {fromCurrentUser && !lastByUser && (
          <Avatar className="h-6 w-6 self-end -mb-1">
            <AvatarImage src={senderImage} className="object-cover" />
            <AvatarFallback>{displaySenderName.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
        )}
      </div>

      {isImagePopupOpen && imageUrl && (
        <ImagePopup
          imageUrl={imageUrl}
          isOpen={isImagePopupOpen}
          onClose={() => setIsImagePopupOpen(false)}
        />
      )}

      <style jsx global>{`
        @keyframes messageSent {
          0% { opacity: 0; transform: translateY(10px) translateX(10px) scale(0.95); }
          70% { opacity: 1; transform: translateY(-2px) translateX(0) scale(1.02); }
          100% { opacity: 1; transform: translateY(0) translateX(0) scale(1); }
        }

        @keyframes messageReceived {
          0% { opacity: 0; transform: translateY(10px) translateX(-10px) scale(0.95); }
          70% { opacity: 1; transform: translateY(-2px) translateX(0) scale(1.02); }
          100% { opacity: 1; transform: translateY(0) translateX(0) scale(1); }
        }

        @keyframes messageBubble {
          0% { box-shadow: 0 0 0 rgba(0,0,0,0); }
          50% { box-shadow: 0 3px 15px rgba(59, 130, 246, 0.3); }
          100% { box-shadow: 0 1px 3px rgba(59, 130, 246, 0.15); }
        }

        @keyframes imageAppear {
          0% { box-shadow: 0 0 0 rgba(0,0,0,0); }
          30% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.4); border: 1px solid rgba(147, 197, 253, 0.5); }
          100% { box-shadow: 0 0 5px rgba(59, 130, 246, 0.15); border: 1px solid rgba(147, 197, 253, 0.1); }
        }

        @keyframes documentAppear {
          0% { background-color: rgba(255,255,255,0.2); }
          40% { background-color: rgba(219, 234, 254, 0.6); }
          100% { background-color: rgba(255,255,255,0.2); }
        }

        .animate-message-sent {
          animation: messageSent 0.5s ease-out forwards;
        }

        .animate-message-received {
          animation: messageReceived 0.5s ease-out forwards;
        }

        .animate-message-bubble {
          animation: messageBubble 1s ease-out forwards;
        }

        .animate-image-appear {
          animation: imageAppear 1.5s ease-out forwards;
        }

        .animate-document-appear {
          animation: documentAppear 1.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default Message;