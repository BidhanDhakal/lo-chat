import { Card } from '@/components/ui/card';
import { Id } from '@/convex/_generated/dataModel'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Users, Loader2 } from 'lucide-react';
import Link from 'next/link';
import React, { useEffect, useState } from 'react'
import EmojiParser from '@/components/ui/emoji-parser';
import { api } from '@/convex/_generated/api';
import { useMutation, useQuery } from 'convex/react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface DMConversationItemProps {
    id: string;
    username: string;
    imageUrl: string;
    lastMessageContent?: string;
    lastMessageSender?: string;
    isGroup?: boolean;
    groupMembers?: string[];
    className?: string;
    hasUnread?: boolean;
}

const DMConversationItem = ({
    id,
    imageUrl,
    username,
    lastMessageContent,
    lastMessageSender,
    isGroup,
    className,
    hasUnread = false
}: DMConversationItemProps) => {
    const [finalImageUrl, setFinalImageUrl] = useState<string>(imageUrl);
    const [isImageLoading, setIsImageLoading] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);
    const getUrl = useMutation(api.files.getUrl);

    // Check if this is a Convex Storage ID and get the URL if needed
    useEffect(() => {
        const loadConvexImage = async () => {
            if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('/')) {
                try {
                    setIsImageLoading(true);
                    setImageLoaded(false);
                    const url = await getUrl({ storageId: imageUrl });
                    if (url) {
                        setFinalImageUrl(url);
                    }
                } catch (error) {
                    console.error("Error loading image from Convex:", error);
                } finally {
                    setIsImageLoading(false);
                }
            } else {
                setImageLoaded(false);
            }
        };

        loadConvexImage();
    }, [imageUrl, getUrl]);

    // Remove verification badge from last message sender name only in direct messages
    const displayLastMessageSender = isGroup ? lastMessageSender : lastMessageSender?.replace(/🛡️/g, '') || '';

    return <Link href={`/conversations/${id}`} className={`w-full ${className || ''}`}>
        <Card className={cn(
            "p-2 flex flex-row items-center gap-4 truncate border border-transparent hover:border-[#3a3f4b]",
            isGroup && "bg-muted/30",
            hasUnread && "bg-primary/5"
        )}>
            <div className="flex flex-row items-center gap-4 truncate">
                <div className="relative">
                    <Avatar className={cn(
                        "h-12 w-12 rounded-full flex items-center justify-center",
                        !imageLoaded && finalImageUrl && "bg-muted/10 backdrop-blur-md border border-white/10 overflow-hidden"
                    )}>
                        {isImageLoading ? (
                            <div className="h-full w-full flex items-center justify-center bg-muted/10 backdrop-blur-md">
                                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                            </div>
                        ) : (
                            <>
                                <AvatarImage
                                    src={finalImageUrl}
                                    className={cn(
                                        "rounded-full object-cover",
                                        !imageLoaded && finalImageUrl && "opacity-0",
                                        imageLoaded && "opacity-100 transition-opacity duration-300"
                                    )}
                                    onLoad={() => setImageLoaded(true)}
                                />
                                <AvatarFallback className="flex items-center justify-center backdrop-blur-sm bg-muted/20">
                                    {isGroup ? (
                                        <Users className="h-5 w-5" />
                                    ) : (
                                        <User className="h-5 w-5" />
                                    )}
                                </AvatarFallback>
                            </>
                        )}
                    </Avatar>
                    {isGroup && (
                        <div className="absolute -bottom-0.5 -right-0.5 bg-primary rounded-full p-1 flex items-center justify-center shadow-md backdrop-blur-sm bg-opacity-80">
                            <Users className="h-2.5 w-2.5 text-primary-foreground" />
                        </div>
                    )}
                    {hasUnread && (
                        <div className="absolute -top-1 -right-1">
                            <Badge className="h-5 w-5 rounded-full p-0 flex items-center justify-center bg-blue-500 text-white shadow-md backdrop-blur-sm">
                                <span className="sr-only">Unread messages</span>
                            </Badge>
                        </div>
                    )}
                </div>
                <div className="flex flex-col truncate">
                    <div className="flex items-center gap-2">
                        <h4 className="truncate font-medium">
                            <EmojiParser text={username} />
                        </h4>
                        {isGroup && (
                            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full backdrop-blur-sm">
                                Group
                            </span>
                        )}
                        {hasUnread && (
                            <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full ml-auto backdrop-blur-sm shadow-sm">
                                New
                            </span>
                        )}
                    </div>
                    {lastMessageSender && lastMessageContent ? (
                        <span className="text-sm text-muted-foreground flex truncate overflow-ellipsis">
                            <p className="font-semibold">
                                {isGroup ? (
                                    <EmojiParser text={displayLastMessageSender || ''} />
                                ) : (
                                    displayLastMessageSender
                                )}
                                {":"}&nbsp;
                            </p>
                            <p className='truncate overflow-ellipsis'>
                                {lastMessageContent}
                            </p>
                        </span>
                    ) : (
                        <p className="text-sm text-muted-foreground truncate">Start the conversation!</p>
                    )}
                </div>
            </div>
        </Card>
    </Link>
}

export default DMConversationItem