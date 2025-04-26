"use client";

import ItemList from '@/components/ui/shared/item-list/ItemList';
import { api } from '@/convex/_generated/api';
import { useQuery } from 'convex/react';
import { Loader2 } from 'lucide-react';
import React from 'react'
import DMConversationItem from './_components/DMConversationItem';
import { GroupChatDialog } from './_components/GroupChatDialog';
import { Button } from '@/components/ui/button';

type Props = React.PropsWithChildren<{}>;

const ConversationsLayout = ({ children }: Props) => {
    const [groupDialogOpen, setGroupDialogOpen] = React.useState(false);
    const conversations = useQuery(api.conversations.get)

    return (
        <>
            <ItemList
                title="Conversations"
                action={
                    <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full h-8 w-8 border border-slate-200 dark:border-slate-800"
                        onClick={() => setGroupDialogOpen(true)}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                            <path d="M12 5v14M5 12h14" />
                        </svg>
                    </Button>
                }
            >
                {conversations ? conversations.length === 0 ?
                    <p className="w-full h-full flex items-center justify-center">
                        No conversations found
                    </p> : conversations.map(conversations => {
                        if (conversations.conversation.isGroup) {
                            return (
                                <DMConversationItem
                                    key={conversations.conversation._id}
                                    id={conversations.conversation._id}
                                    username={conversations.conversation.name || "Group"}
                                    imageUrl={conversations.conversation.imageUrl || "/images/placeholder.jpg"}
                                    lastMessageContent={conversations.lastMessage?.content}
                                    lastMessageSender={conversations.lastMessage?.sender}
                                    isGroup={true}
                                />
                            );
                        } else {
                            return (
                                <DMConversationItem
                                    key={conversations.conversation._id}
                                    id={conversations.conversation._id}
                                    username={conversations.otherMember?.username || ""}
                                    imageUrl={conversations.otherMember?.imageUrl || ""}
                                    lastMessageContent={conversations.lastMessage?.content}
                                    lastMessageSender={conversations.lastMessage?.sender}
                                />
                            );
                        }
                    }) : (<Loader2 />
                )}
            </ItemList>
            <GroupChatDialog open={groupDialogOpen} onOpenChange={setGroupDialogOpen} />
            {children}
        </>
    )
};

export default ConversationsLayout;