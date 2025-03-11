"use client";

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useMutation } from 'convex/react';
import { Smile, Image, Loader2, Send } from 'lucide-react';
import React, { useRef, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

// Common emojis that don't require external packages
const commonEmojis = [
  "😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇", 
  "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚", 
  "😋", "😛", "😝", "😜", "🤪", "🤨", "🧐", "🤓", "😎", "🤩",
  "👍", "👎", "👏", "🙌", "👐", "🤲", "🤝", "🙏", "✌️", "🤞",
  "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "❣️", "💕", "💞",
  "😢", "😭", "😤", "😠", "😡", "🤬", "🤯", "😳", "🥵", "🥶",
  "😱", "😨", "😰", "😥", "😓", "🤗", "🤔", "🤭", "🤫", "🤥"
];

const ChatInput = () => {
  const conversationId = window.location.pathname.split('/').pop() as Id<"conversations">;
  
  const [content, setContent] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isUploadingImage, setIsUploadingImage] = React.useState(false);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = React.useState(false);
  
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const createMessage = useMutation(api.message.create);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const getFileUrl = useMutation(api.files.getUrl);

  // Auto-resize textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      // Reset height to auto to get the correct scrollHeight
      textareaRef.current.style.height = 'auto';
      
      // Set the height to scrollHeight to fit the content
      const scrollHeight = textareaRef.current.scrollHeight;
      
      // Set a max height of 150px
      const maxHeight = 150;
      
      textareaRef.current.style.height = 
        scrollHeight <= maxHeight ? `${scrollHeight}px` : `${maxHeight}px`;
    }
  }, [content]);

  const onSubmit = async () => {
    if (!content.trim()) return;
    
    try {
      setIsSubmitting(true);
      await createMessage({
        conversationId,
        content: content,
        type: "text"
      });
      setContent("");
      
      // Reset textarea height after sending
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
      
      textareaRef.current?.focus();
    } catch (error) {
      console.error(error);
      toast.error("Failed to send message");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check if file is an image
    if (!file.type.startsWith('image/')) {
      toast.error("Please select an image file");
      return;
    }

    // Check file size (limit to 25MB)
    const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB in bytes
    if (file.size > MAX_FILE_SIZE) {
      toast.error("Image size should be less than 25MB");
      return;
    }

    try {
      setIsUploadingImage(true);
      
      // Step 1: Get a pre-signed URL for the upload
      const uploadUrl = await generateUploadUrl();
      
      // Step 2: Upload the file to the storage
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      
      if (!result.ok) {
        throw new Error(`Upload failed with status: ${result.status}`);
      }
      
      // Step 3: Get the storage ID from the response
      const { storageId } = await result.json();
      
      // Step 4: Send a message with the image
      await createMessage({
        conversationId,
        content: storageId,
        type: "image"
      });
      
      toast.success("Image sent successfully");
      
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Failed to upload image");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setContent(prev => prev + emoji);
    setIsEmojiPickerOpen(false);
    textareaRef.current?.focus();
  };

  return (
    <div className="p-3 border-t">
      <div className="flex items-center gap-x-2">
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*"
          onChange={handleImageUpload}
          disabled={isUploadingImage}
        />
        <div className="flex-shrink-0 flex items-center justify-center">
          <Button
            size="icon"
            variant="ghost"
            onClick={handleImageClick}
            disabled={isUploadingImage || isSubmitting}
            className="text-muted-foreground hover:text-foreground h-12 w-12"
          >
            {isUploadingImage ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <Image className="h-6 w-6" />
            )}
          </Button>
        </div>
        <div className="flex-1 relative flex items-center">
          <Textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Type a message"
            rows={1}
            className="resize-none min-h-[40px] max-h-[150px] py-2 px-3 pr-20 overflow-y-auto"
            disabled={isSubmitting || isUploadingImage}
          />
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
            <Popover open={isEmojiPickerOpen} onOpenChange={setIsEmojiPickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-muted-foreground hover:text-foreground h-10 w-10"
                  disabled={isSubmitting || isUploadingImage}
                >
                  <Smile className="h-6 w-6" />
                </Button>
              </PopoverTrigger>
              <PopoverContent side="top" align="end" className="w-auto p-2 border">
                <div className="grid grid-cols-8 gap-1 max-h-[300px] overflow-y-auto">
                  {commonEmojis.map((emoji, index) => (
                    <button
                      key={index}
                      className="text-2xl hover:bg-muted p-1 rounded cursor-pointer"
                      onClick={() => handleEmojiSelect(emoji)}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
            <Button
              size="icon"
              onClick={onSubmit}
              disabled={(!content.trim() && !isUploadingImage) || isSubmitting || isUploadingImage}
              className="text-primary bg-transparent hover:bg-transparent h-10 w-10"
            >
              <Send className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInput;