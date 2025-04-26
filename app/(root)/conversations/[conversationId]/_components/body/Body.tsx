"use client";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useConversation } from "@/hooks/useConversation";
import { useQuery } from "convex/react";
import React, { useEffect } from "react";
import Message from "./Message";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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