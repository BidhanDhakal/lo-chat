"use client";

import ItemList from '@/components/ui/shared/item-list/ItemList';
import { api } from '@/convex/_generated/api';
import { useQuery } from 'convex/react';
import { Loader2, Search, UserPlus, UsersRound, MoreVertical } from 'lucide-react';
import React, { useState } from 'react'
import DMConversationItem from './_components/DMConversationItem';
import { GroupChatDialog } from './_components/GroupChatDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Props = React.PropsWithChildren<{}>;

const ConversationsLayout = ({ children }: Props) => {
    const [groupDialogOpen, setGroupDialogOpen] = React.useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const conversations = useQuery(api.conversations.get)


    const filteredConversations = conversations?.filter(conversation => {
        if (!searchQuery) return true;

        const searchLower = searchQuery.toLowerCase();

        if (conversation.conversation.isGroup) {

            return conversation.conversation.name?.toLowerCase().includes(searchLower);
        } else {

            return conversation.otherMember?.username?.toLowerCase().includes(searchLower);
        }
    });

    return (
        <>
            <ItemList
                title="Conversations"
                action={
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="rounded-full h-8 w-8"
                                        >
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => setGroupDialogOpen(true)}>
                                            <UsersRound className="h-4 w-4 mr-2" />
                                            Create Group
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>More options</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                }
            >
                {/* Search input */}
                <div className="relative mb-4">
                    <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-8 bg-muted/50 border-none focus-visible:ring-1 focus-visible:ring-ring rounded-3xl"
                        />
                    </div>
                </div>

                {conversations ? filteredConversations?.length === 0 ?
                    <p className="w-full h-full flex items-center justify-center">
                        {searchQuery ? "No friends found" : "No conversations found"}
                    </p> : filteredConversations?.map((conversationItem, idx) => {
                        const isLast = idx === filteredConversations.length - 1;
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
                                    groupMembers={conversationItem.groupMembers || []}
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