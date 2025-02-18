"use client";


import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useMutationState } from '@/hooks/useMutationState';
import React, { Dispatch, SetStateAction } from 'react'

type Props = {
    conversationId: Id<"conversations">;
    open: boolean;
    setOpen: Dispatch<SetStateAction<boolean>>;
}

const RemoveFriendDialog = ({ conversationId, open, setOpen }: Props) => {
    const {mutate: removeFriend, pending} = useMutationState(api.friend.remove);
  return (
    <div>RemoveFriendDialog</div>
  )
}

export default RemoveFriendDialog