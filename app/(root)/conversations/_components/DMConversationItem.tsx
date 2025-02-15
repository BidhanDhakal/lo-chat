import { Card } from '@/components/ui/card';
import { Id } from '@/convex/_generated/dataModel'
import { Avatar, AvatarFallback, AvatarImage } from '@radix-ui/react-avatar';
import { User } from 'lucide-react';
import Link from 'next/link';
import React from 'react'

type Props = {
    id: Id <"conversations">
    imageUrl: string;
    username: string;
}

const DMConversationItem = ({id, imageUrl, username}: Props) => {
  return <Link href={`/conversations/${id}`} className="w-full">
    <Card className="p-2 flex flex-row items-center gap-4 truncate">
        <div className="flex flex-row items-center gap-4 truncate">
            <Avatar className="h-12 w-12 rounded-full">
                <AvatarImage src={imageUrl} className="rounded-full"/>
                <AvatarFallback>
                    <User/>
                </AvatarFallback>
            </Avatar>
            <div className="flex flex-col truncate">
                <h4 className="truncate">{username}</h4>
                <p className="text-sm text-muted-foreground truncate">Start the conversation!</p>
            </div>
        </div>
    </Card>
  </Link>
}

export default DMConversationItem