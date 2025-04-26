import { Card } from '@/components/ui/card';
import { Id } from '@/convex/_generated/dataModel'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User } from 'lucide-react';
import Link from 'next/link';
import React, { useEffect, useState } from 'react'
import EmojiParser from '@/components/ui/emoji-parser';
import { api } from '@/convex/_generated/api';
import { useMutation } from 'convex/react';

interface DMConversationItemProps {
    id: string;
    username: string;
    imageUrl: string;
    lastMessageContent?: string;
    lastMessageSender?: string;
    isGroup?: boolean;
}

const DMConversationItem = ({ id, imageUrl, username, lastMessageContent, lastMessageSender, isGroup }: DMConversationItemProps) => {
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

    return <Link href={`/conversations/${id}`} className="w-full">
        <Card className="p-2 flex flex-row items-center gap-4 truncate">
            <div className="flex flex-row items-center gap-4 truncate">
                <Avatar className="h-12 w-12 rounded-full">
                    <AvatarImage src={finalImageUrl} className="rounded-full" />
                    <AvatarFallback>
                        <User />
                    </AvatarFallback>
                </Avatar>
                <div className="flex flex-col truncate">
                    <h4 className="truncate">
                        <EmojiParser text={username} />
                    </h4>
                    {lastMessageSender && lastMessageContent ?
                        <span className="text-sm text-muted-foreground flex truncate overflow-ellipsis">
                            <p className="font-semibold">
                                <EmojiParser text={lastMessageSender} />
                                {":"}&nbsp;
                            </p>
                            <p className='truncate overflow-ellipsis'>
                                <EmojiParser text={lastMessageContent} />
                            </p>
                        </span> :
                        <p className="text-sm text-muted-foreground truncate">Start the conversation!</p>}
                </div>
            </div>
        </Card>
    </Link>
}

export default DMConversationItem