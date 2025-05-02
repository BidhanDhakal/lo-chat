"use client";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useConversation } from "@/hooks/useConversation";
import { useQuery } from "convex/react";
import React, { useEffect, useRef, useState } from "react";
import Message from "./Message";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import notificationSound from "@/lib/NotificationSound";

type Props = {
  members: {
    lastSeenMessageId?: Id<"messages">;
    username?: string;
    [key: string]: any;
  }[];
};

const Body = ({ members }: Props) => {
  const { conversationId } = useConversation();
  const messages = useQuery(api.messages.get, { conversationId: conversationId as Id<"conversations"> });
  const messagesRef = useRef<typeof messages>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    // Skip notification on initial load
    if (isInitialLoad && messages && messages.length > 0) {
      messagesRef.current = messages;
      setIsInitialLoad(false);
      return;
    }

    // Check if there's a new message
    if (!isInitialLoad && messages && messages.length > 0 && messagesRef.current) {
      // Check if the first (newest) message is new by comparing with the previous reference
      const latestMessage = messages[0];
      const previousMessages = messagesRef.current;

      // If we have a new message that's not from the current user
      if (
        previousMessages.length === 0 ||
        (latestMessage.message._id !== previousMessages[0].message._id && !latestMessage.isCurrentUser)
      ) {
        // Play the notification sound
        notificationSound.playMessageSound();
        console.log("Playing notification sound for new message");
      }

      // Update our reference
      messagesRef.current = messages;
    }
  }, [messages, isInitialLoad]);

  return (
    <div className="flex-1 w-full flex overflow-y-scroll flex-col-reverse gap-2 p-3 no-scrollbar">
      {messages?.map(({ message, senderImage, senderName, isCurrentUser }, index) => {
        // Check if this message is from the same user as the next message
        // (since messages are in reverse order in the UI)
        const isConsecutive = index > 0 &&
          messages[index - 1].message.senderId === message.senderId;

        return (
          <Message key={message._id}
            fromCurrentUser={isCurrentUser}
            senderImage={senderImage}
            senderName={senderName}
            lastByUser={isConsecutive}
            content={message.content}
            createdAt={message._creationTime}
            type={message.type}
          />
        );
      })}
    </div>
  );
};

export default Body;