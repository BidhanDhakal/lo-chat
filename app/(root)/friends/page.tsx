"use client";

import ItemList from '@/components/ui/shared/item-list/ItemList'
import React from 'react'
import ConversationFallback from '@/components/ui/shared/conversation/ConversationFallback'
import AddFriendDialog from './_components/AddFriendDialog'
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Loader2 } from 'lucide-react';
import Request from './_components/Request';

type Props = {}

const FriendsPage = () => {
  const requests = useQuery(api.requests.get)
  return (
    <>
      <ItemList title="Friends Request" action={<AddFriendDialog/>}>
      {
        requests ? (
          requests.length === 0 ? (
            <p className="w-full h-full flex justify-center items-center">
              No friends yet. Add to start chatting.
            </p>
          ) : (
            requests.map((request) => (
              <Request 
                key={request.request._id}
                id={request.request._id} 
                imageUrl={request.sender.imageUrl}
                username={request.sender.username}
                email={request.sender.email}
              />
            ))
          )
        ) : (
          <Loader2 className="h-8 w-8"/>
        )
      }
      </ItemList>
      <ConversationFallback/>
    </>
  )
}

export default FriendsPage 