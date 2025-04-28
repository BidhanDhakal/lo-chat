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
                    </p> : conversations.map((conversationItem, idx) => {
                        const isLast = idx === conversations.length - 1;
                        if (conversationItem.conversation.isGroup) {
                            return (
                                <DMConversationItem
                                    key={conversationItem.conversation._id}
                                    id={conversationItem.conversation._id}
                                    username={conversationItem.conversation.name || "Group"}
                                    imageUrl={conversationItem.conversation.imageUrl || "/images/placeholder.jpg"}
                                    lastMessageContent={conversationItem.lastMessage?.content}
                                    lastMessageSender={conversationItem.lastMessage?.sender}
                                    isGroup={true}
                                    className={isLast ? "mb-32" : ""}
                                />
                            );
                        } else {
                            return (
                                <DMConversationItem
                                    key={conversationItem.conversation._id}
                                    id={conversationItem.conversation._id}
                                    username={conversationItem.otherMember?.username || ""}
                                    imageUrl={conversationItem.otherMember?.imageUrl || ""}
                                    lastMessageContent={conversationItem.lastMessage?.content}
                                    lastMessageSender={conversationItem.lastMessage?.sender}
                                    className={isLast ? "mb-32" : ""}
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