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
import RemoveFriendDialog from './_components/dialogs/RemoveFriendDialog';
import { useRouter } from 'next/navigation';

type Props = {
  params: Promise<{
    conversationId: Id<"conversations">;
  }>
}

const ConversationPage = ({ params }: Props) => {
  // Unwrap params using React.use()
  const { conversationId } = React.use(params);
  const router = useRouter();
  
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

  // Type guard to check if conversation has otherMember property
  const hasOtherMember = (conv: any): conv is { 
    isGroup: boolean; 
    otherMember: { username?: string; imageUrl?: string }
  } => {
    return !conv.isGroup && 'otherMember' in conv;
  };

  // Get name and imageUrl safely
  const getName = () => {
    if (conversation.isGroup) {
      return conversation.name || "";
    } else if (hasOtherMember(conversation)) {
      return conversation.otherMember.username || "";
    }
    return "";
  };

  const getImageUrl = () => {
    if (conversation.isGroup) {
      return undefined;
    } else if (hasOtherMember(conversation)) {
      return conversation.otherMember.imageUrl;
    }
    return undefined;
  };

  // Handle successful friend removal
  const handleRemoveFriendSuccess = () => {
    // Navigate away from this conversation to avoid the "Conversation not found" error
    router.push('/conversations');
  };

  return (
    <ConversationConatiner>
      <RemoveFriendDialog 
        conversationId={conversationId} 
        open={removeFriendDialogOpen} 
        setOpen={setRemoveFriendDialogOpen}
        onSuccess={handleRemoveFriendSuccess}
      />
      <Header 
        name={getName()}
        imageUrl={getImageUrl()}
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
      {/* Pass an empty array if members doesn't exist */}
      <Body members={[]} />
      <ChatInput />
    </ConversationConatiner>
  );
}

export default ConversationPage;