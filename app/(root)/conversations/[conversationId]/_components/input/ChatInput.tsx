"use client";

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useMutation, useQuery } from 'convex/react';
import { Smile, Image, Loader2, Send, X, Plus, FileText } from 'lucide-react';
import React, { useRef, useEffect, useState } from 'react';
import { toast } from 'sonner';
import EmojiPicker, { Theme } from 'emoji-picker-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUser } from "@clerk/nextjs";

// Common emojis for non-verified users
const commonEmojis = [
  "👍", "👋", "😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇",
  "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚",
  "😋", "😛", "😝", "😜", "🤪", "🤨", "🧐", "🤓", "😎", "🤩",
  "👍", "👎", "👏", "🙌", "👐", "🤲", "🤝", "🙏", "✌️", "🤞",
  "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "❣️", "💕", "💞",
  "😢", "😭", "😤", "😠", "😡", "🤬", "🤯", "😳", "🥵", "🥶",
  "😱", "😨", "😰", "😥", "😓", "🤗", "🤔", "🤭", "🤫", "🤥"
];

const ChatInput = () => {
  const conversationId = window.location.pathname.split('/').pop() as Id<"conversations">;
  const { user } = useUser();
  const currentUser = useQuery(api.users.get, user ? { clerkId: user.id } : "skip");
  const isVerified = currentUser?.username?.includes("🛡️") || false;

  const [content, setContent] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isUploadingImage, setIsUploadingImage] = React.useState(false);
  const [isUploadingDoc, setIsUploadingDoc] = React.useState(false);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = React.useState(false);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const createMessage = useMutation(api.message.create);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const getFileUrl = useMutation(api.files.getUrl);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

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

  // Add click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setIsEmojiPickerOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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

      // Use a timeout to ensure focus after DOM update
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 0);
    } catch (error) {
      console.error(error);
      toast.error("Failed to send message");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageClick = () => {
    imageInputRef.current?.click();
  };

  const handleDocClick = () => {
    docInputRef.current?.click();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    if (imageFiles.length === 0) {
      toast.error("Please select image files only");
      return;
    }

    const MAX_FILE_SIZE = 25 * 1024 * 1024;
    const oversizedFiles = imageFiles.filter(file => file.size > MAX_FILE_SIZE);
    if (oversizedFiles.length > 0) {
      toast.error(`Some images exceed 25MB limit: ${oversizedFiles.map(f => f.name).join(', ')}`);
      return;
    }

    setSelectedImages(imageFiles);
    setIsUploadingImage(true);
    setUploadProgress(0);

    try {
      const totalFiles = imageFiles.length;
      let uploadedCount = 0;

      for (const file of imageFiles) {
        const uploadUrl = await generateUploadUrl();
        const result = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        });

        if (!result.ok) {
          throw new Error(`Upload failed with status: ${result.status}`);
        }

        const { storageId } = await result.json();
        await createMessage({
          conversationId,
          content: storageId,
          type: "image"
        });

        uploadedCount++;
        setUploadProgress((uploadedCount / totalFiles) * 100);
      }

      toast.success(`Successfully sent ${imageFiles.length} image${imageFiles.length > 1 ? 's' : ''}`);
      if (imageInputRef.current) {
        imageInputRef.current.value = '';
      }
      setSelectedImages([]);
    } catch (error) {
      console.error("Error uploading images:", error);
      toast.error("Failed to upload images");
    } finally {
      setIsUploadingImage(false);
      setUploadProgress(0);
    }
  };

  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const MAX_FILE_SIZE = 25 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      toast.error("Document size should be less than 25MB");
      return;
    }

    setIsUploadingDoc(true);

    try {
      const uploadUrl = await generateUploadUrl();
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!result.ok) {
        throw new Error(`Upload failed with status: ${result.status}`);
      }

      const { storageId } = await result.json();
      await createMessage({
        conversationId,
        content: JSON.stringify({
          storageId,
          fileName: file.name,
          fileType: file.type
        }),
        type: "document"
      });

      toast.success("Document sent successfully");
      if (docInputRef.current) {
        docInputRef.current.value = '';
      }
    } catch (error) {
      console.error("Error uploading document:", error);
      toast.error("Failed to upload document");
    } finally {
      setIsUploadingDoc(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  const handleEmojiSelect = (emojiObject: any) => {
    setContent(prev => prev + emojiObject.emoji);
    textareaRef.current?.focus();
  };

  // Render emoji picker based on verification status
  const renderEmojiPicker = () => {
    if (!isEmojiPickerOpen) return null;

    if (isVerified) {
      return (
        <div ref={emojiPickerRef} className="absolute bottom-full right-0 mb-2 z-10">
          <EmojiPicker
            onEmojiClick={handleEmojiSelect}
            width={300}
            height={400}
            theme={Theme.DARK}
            searchPlaceholder="Search emoji..."
            lazyLoadEmojis={true}
            autoFocusSearch={false}
          />
        </div>
      );
    }

    return (
      <div ref={emojiPickerRef} className="absolute bottom-full right-0 mb-2 bg-background border rounded-lg shadow-lg p-2 w-64 max-h-[300px] overflow-y-auto z-10">
        <div className="grid grid-cols-8 gap-1">
          {commonEmojis.map((emoji, index) => (
            <button
              key={index}
              onClick={() => handleEmojiSelect({ emoji })}
              className="p-1 hover:bg-muted rounded text-lg"
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 fixed bottom-2 left-0 w-full z-20 md:static md:z-auto md:bottom-0">
      <div className="flex items-end gap-x-2">
        {/* Hidden file inputs */}
        <input
          type="file"
          ref={imageInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleImageUpload}
          disabled={isUploadingImage}
          multiple
        />
        <input
          type="file"
          ref={docInputRef}
          className="hidden"
          accept=".pdf,.doc,.docx,.txt"
          onChange={handleDocUpload}
          disabled={isUploadingDoc}
        />

        <div className="flex-1 relative flex items-center">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground z-10">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  disabled={isUploadingImage || isUploadingDoc || isSubmitting}
                  className="h-6 w-6 p-0 transition-colors hover:text-foreground"
                >
                  {isUploadingImage || isUploadingDoc ? (
                    <div className="flex flex-col items-center">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-[10px] mt-0.5">{Math.round(uploadProgress)}%</span>
                    </div>
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                <DropdownMenuItem
                  onClick={handleImageClick}
                  className="flex items-center gap-2 cursor-pointer hover:bg-muted/50"
                >
                  <Image className="h-4 w-4" />
                  <span>Photo</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleDocClick}
                  className="flex items-center gap-2 cursor-pointer hover:bg-muted/50"
                >
                  <FileText className="h-4 w-4" />
                  <span>Document</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <Textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Message..."
            rows={1}
            className="resize-none min-h-[44px] max-h-[150px] py-3 pl-10 pr-20 overflow-y-auto rounded-full bg-muted/50 border-none focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none"
            disabled={isSubmitting || isUploadingImage || isUploadingDoc}
          />
          <div className="absolute right-2 bottom-1.5 flex items-center gap-1">
            <div className="relative">
              <Button
                size="icon"
                variant="ghost"
                className="text-muted-foreground hover:text-foreground h-9 w-9 rounded-full hover:bg-muted/50 transition-colors"
                disabled={isSubmitting || isUploadingImage || isUploadingDoc}
                onClick={() => setIsEmojiPickerOpen(!isEmojiPickerOpen)}
              >
                <Smile className="h-4 w-4" />
              </Button>
              {renderEmojiPicker()}
            </div>
            <Button
              size="icon"
              onClick={onSubmit}
              disabled={(!content.trim() && !isUploadingImage && !isUploadingDoc) || isSubmitting || isUploadingImage || isUploadingDoc}
              className="text-primary bg-primary/10 hover:bg-primary/20 h-9 w-9 rounded-full transition-all duration-200 hover:scale-110 hover:shadow-md disabled:opacity-50 disabled:hover:scale-100 disabled:hover:shadow-none disabled:cursor-not-allowed"
            >
              <Send className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInput;