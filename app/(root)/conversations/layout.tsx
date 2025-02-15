"use client";

import ItemList from '@/components/ui/shared/item-list/ItemList';
import { api } from '@/convex/_generated/api';
import { useQuery } from 'convex/react';
import { Loader2 } from 'lucide-react';
import React from 'react'
import DMConversationItem from './_components/DMConversationItem';

type Props = React.PropsWithChildren<{}>;

const ConversationsLayout = ({ children }: Props) => {

    const conversations = useQuery(api.conversations.get)
    return (
        <>
        <ItemList title="Conversations">{
            conversations ? conversations.length === 0 ? 
            <p className="w-full h-full flex items-center justify-center">
                No conversations found
            </p> : conversations.map(conversations => {
                return conversations.conversation.isGroup ? null : 
                <DMConversationItem key={conversations.conversation._id} 
                id={conversations.conversation._id} 
                username={conversations.otherMember?.username || ""} 
                imageUrl={conversations.otherMember?.imageUrl || ""}/>
            }) : (<Loader2 />
            )}
            </ItemList>
        {children}</>
    )
};

export default ConversationsLayout;