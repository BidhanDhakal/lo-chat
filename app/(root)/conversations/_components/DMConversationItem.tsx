import { Card } from '@/components/ui/card';
import { Id } from '@/convex/_generated/dataModel'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Users } from 'lucide-react';
import Link from 'next/link';
import React, { useEffect, useState } from 'react'
import EmojiParser from '@/components/ui/emoji-parser';
import { api } from '@/convex/_generated/api';
import { useMutation } from 'convex/react';
import { cn } from '@/lib/utils';

interface DMConversationItemProps {
    id: string;
    username: string;
    imageUrl: string;
    lastMessageContent?: string;
    lastMessageSender?: string;
    isGroup?: boolean;
    groupMembers?: string[];
    className?: string;
}

const DMConversationItem = ({
    id,
    imageUrl,
    username,
    lastMessageContent,
    lastMessageSender,
    isGroup,
    className
}: DMConversationItemProps) => {
    const [finalImageUrl, setFinalImageUrl] = useState<string>(imageUrl);
    const getUrl = useMutation(api.files.getUrl);

    // Check if this is a Convex Storage ID and get the URL if needed
    useEffect(() => {
        const loadConvexImage = async () => {
            if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('/')) {
                try {
                    const url = await getUrl({ storageId: imageUrl });
                    if (url) {
                        setFinalImageUrl(url);
                    }
                } catch (error) {
                    console.error("Error loading image from Convex:", error);
                }
            }
        };

        loadConvexImage();
    }, [imageUrl, getUrl]);

    // Remove verification badge from last message sender name only in direct messages
    const displayLastMessageSender = isGroup ? lastMessageSender : lastMessageSender?.replace(/🛡️/g, '') || '';

    return <Link href={`/conversations/${id}`} className={`w-full ${className || ''}`}>
        <Card className={cn(
            "p-2 flex flex-row items-center gap-4 truncate",
            isGroup && "bg-muted/30"
        )}>
            <div className="flex flex-row items-center gap-4 truncate">
                <div className="relative">
                    <Avatar className="h-12 w-12 rounded-full flex items-center justify-center">
                        <AvatarImage src={finalImageUrl} className="rounded-full object-cover" />
                        <AvatarFallback className="flex items-center justify-center">
                            {isGroup ? (
                                <Users className="h-5 w-5" />
                            ) : (
                                <User className="h-5 w-5" />
                            )}
                        </AvatarFallback>
                    </Avatar>
                    {isGroup && (
                        <div className="absolute -bottom-0.5 -right-0.5 bg-primary rounded-full p-1 flex items-center justify-center">
                            <Users className="h-2.5 w-2.5 text-primary-foreground" />
                        </div>
                    )}
                </div>
                <div className="flex flex-col truncate">
                    <div className="flex items-center gap-2">
                        <h4 className="truncate font-medium">
                            <EmojiParser text={username} />
                        </h4>
                        {isGroup && (
                            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                Group
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