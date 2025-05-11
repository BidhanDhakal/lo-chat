"use client";

import { api } from '@/convex/_generated/api';
import { useQuery } from 'convex/react';
import React, { useEffect, useRef } from 'react';
import Request from './_components/Request';
import { Loader2, UserPlus } from 'lucide-react';
import AddFriendDialog from './_components/AddFriendDialog';
import { Button } from '@/components/ui/button';
import notificationSound from '@/lib/NotificationSound';

const FriendsPage = () => {
  const requests = useQuery(api.requests.get);
  const prevRequestsCountRef = useRef<number>(0);


  useEffect(() => {
    if (requests && requests.length > prevRequestsCountRef.current) {

      if (prevRequestsCountRef.current > 0) {
        notificationSound.playRequestSound();
        console.log("Playing notification sound for new friend request");
      }
      prevRequestsCountRef.current = requests.length;
    } else if (requests) {
      prevRequestsCountRef.current = requests.length;
    }
  }, [requests]);

  if (requests === undefined) {
    return (
      <div className="flex flex-col flex-1 justify-center items-center lg:ml-16">
        <Loader2 className="h-7 w-7 text-muted-foreground animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 p-4 space-y-6 lg:ml-16">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Friend Requests</h1>
        <AddFriendDialog>
          <Button size="sm" variant="ghost">
            <UserPlus className="h-5 w-5 mr-2" />
            Add Friend
          </Button>
        </AddFriendDialog>
      </div>

      {requests.length === 0 ? (
        <p className="text-muted-foreground">No friends yet. Add to start chatting.</p>
      ) : (
        <div className="space-y-2">
          {requests.map((request) => (
            <Request
              key={request._id}
              id={request._id}
              imageUrl={request.sender?.imageUrl || ""}
              username={request.sender?.username || ""}
              email={request.sender?.email || ""}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default FriendsPage; 