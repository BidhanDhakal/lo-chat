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
import DeleteGroupDialog from './_components/dialogs/DeleteGroupDialog';
import LeaveGroupDialog from './_components/dialogs/LeaveGroupDialog';
import ManageGroupDialog from './_components/dialogs/ManageGroupDialog';
import { useRouter } from 'next/navigation';

type Props = {
  params: Promise<{
    conversationId: Id<"conversations">;
  }>
}

const ConversationPage = ({ params }: Props) => {

  const { conversationId } = React.use(params);
  const router = useRouter();

  const conversation = useQuery(api.conversation.get, {
    id: conversationId as Id<"conversations">
  });

  const isCreator = useQuery(api.conversations.isGroupCreator, {
    conversationId: conversationId as Id<"conversations">
  });

  const [removeFriendDialogOpen, setRemoveFriendDialogOpen] = React.useState(false);
  const [deleteGroupDialogOpen, setDeleteGroupDialogOpen] = React.useState(false);
  const [leaveGroupDialogOpen, setLeaveGroupDialogOpen] = React.useState(false);
  const [manageGroupDialogOpen, setManageGroupDialogOpen] = React.useState(false);
  const [callType, setCallType] = React.useState<"audio" | "video" | null>(null);

  if (conversation === undefined || isCreator === undefined) {
    return (
      <div className='w-full h-full flex items-center justify-center'>
        <Loader2 className='h-8 w-8 animate-spin' />
      </div>
    );
  }

  if (conversation === null) {
    router.push('/conversations');
    return null;
  }


  const hasOtherMember = (conv: any): conv is {
    isGroup: boolean;
    otherMember: { username?: string; imageUrl?: string }
  } => {
    return !conv.isGroup && 'otherMember' in conv;
  };

  // Get name and imageUrl
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
      return conversation.imageUrl || undefined;
    } else if (hasOtherMember(conversation)) {
      return conversation.otherMember.imageUrl;
    }
    return undefined;
  };


  const handleSuccess = () => {

    router.push('/conversations');
  };

  const getGroupOptions = () => {
    if (!conversation.isGroup) return [];

    const options = [];


    options.push({
      label: "Leave group",
      destructive: true,
      onClick: () => setLeaveGroupDialogOpen(true)
    });

    // Only creator can manage and delete the group
    if (isCreator) {
      options.unshift({
        label: "Manage group",
        destructive: false,
        onClick: () => setManageGroupDialogOpen(true)
      });

      options.push({
        label: "Delete group",
        destructive: true,
        onClick: () => setDeleteGroupDialogOpen(true)
      });
    }

    return options;
  };

  return (
    <ConversationConatiner>
      <RemoveFriendDialog
        conversationId={conversationId}
        open={removeFriendDialogOpen}
        setOpen={setRemoveFriendDialogOpen}
        onSuccess={handleSuccess}
      />

      <DeleteGroupDialog
        conversationId={conversationId}
        open={deleteGroupDialogOpen}
        setOpen={setDeleteGroupDialogOpen}
        onSuccess={handleSuccess}
      />

      <LeaveGroupDialog
        conversationId={conversationId}
        open={leaveGroupDialogOpen}
        setOpen={setLeaveGroupDialogOpen}
        onSuccess={handleSuccess}
      />

      {isCreator && conversation.isGroup && (
        <ManageGroupDialog
          conversationId={conversationId}
          currentName={getName()}
          currentImageUrl={getImageUrl()}
          open={manageGroupDialogOpen}
          setOpen={setManageGroupDialogOpen}
        />
      )}

      <Header
        name={getName()}
        imageUrl={getImageUrl()}
        options={conversation.isGroup ? getGroupOptions() : [
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