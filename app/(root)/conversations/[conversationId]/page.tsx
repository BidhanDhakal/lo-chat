"use client";

import ConversationConatiner from '@/components/ui/shared/conversation/ConversationContainer'
import { api } from '@/convex/_generated/api'
import { Id } from '@/convex/_generated/dataModel'
import { useQuery } from 'convex/react'
import { Loader2 } from 'lucide-react';
import React from 'react'
import Header from './_components/Header';
import Body from './_components/body/Body';
import ChatInput from './_components/input/ChatInput';

type Props = {
  params: Promise<{
    conversationId: Id<"conversations">;
  }>
}

const ConversationPage = ({ params }: Props) => {
  // Unwrap params using React.use()
  const { conversationId } = React.use(params);
  
  const conversation = useQuery(api.conversation.get, { 
    id: conversationId as Id<"conversations"> 
  });

  const [removeFriendDialogOpen, setRemoveFriendDialogOpen] = React.useState(false);
  const [deleteGroupDialogOpen, setDeleteGroupDialogOpen] = React.useState(false);
  const [leaveGroupDialogOpen, setLeaveGroupDialogOpen] = React.useState(false);
  const [callType, setCallType] = React.useState<"audio" | "video" | null>(null);

  if (conversation === undefined) {
    return (
      <div className='w-full h-full flex items-center justify-center'>
        <Loader2 className='h-8 w-8 animate-spin'/>
      </div>
    );
  }

  if (conversation === null) {
    return (
      <p className='w-full h-full flex items-center justify-center'>
        Conversation not found
      </p>
    );
  }

  return (
    <ConversationConatiner>
      <Header 
        name={(conversation.isGroup ? conversation.name : conversation.otherMember.username) || ""} 
        imageUrl={conversation.isGroup ? undefined : conversation.otherMember.imageUrl}
        options={conversation.isGroup ? [
          {
            label: "Leave group",
            destructive: false,
            onClick: () => setLeaveGroupDialogOpen(true)
          },
          {
            label: "Delete group",
            destructive: true,
            onClick: () => setDeleteGroupDialogOpen(true)
          }
        ] : [
          {
            label: "Remove friend",
            destructive: true,
            onClick: () => setRemoveFriendDialogOpen(true)
          }
        ]}
      />
      <Body members={conversation.members} />
      <ChatInput />
    </ConversationConatiner>
  );
}

export default ConversationPage;