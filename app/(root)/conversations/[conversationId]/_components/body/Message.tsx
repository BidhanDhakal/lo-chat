import React from 'react';
import {format} from 'date-fns';
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
type Props = {
    fromCurrentUser: boolean;
    senderImage: string;
    senderName: string;
    lastByUser: boolean;
    content: string;
    createdAt: number;
    type: string;
}

const Messages = ({
    fromCurrentUser, 
    senderImage,
    lastByUser, 
    content, 
    createdAt, 
    type, 
    senderName
}: Props) => {
  const formatTime = (timestamp: number) => {
    return format(timestamp, 'HH:mm');
  };
  
  return (
    <div className={cn("flex items-end", {
      "justify-end": fromCurrentUser,
    })}>
      <div className={cn("flex flex-col w-full mx-2", {
        "order-1 items-end": fromCurrentUser, 
        "order-2 items-start": !fromCurrentUser
      })}>
        <div className={cn("px-4 py-2 rounded-lg max-w-[70%]", {
          "bg-primary text-primary-foreground": fromCurrentUser,
          "bg-secondary text-secondary-foreground": !fromCurrentUser,
          "rounded-br-none": !lastByUser && fromCurrentUser,
          "rounded-bl-none": !lastByUser && !fromCurrentUser,
        })}>
          {type === "text" ? (
            <p className="text-wrap break-words whitespace-pre-wrap">{content}
            </p>
          ) : null}
          <p className={cn("text-xs flex w-full my-1", {
            "text-primary-foreground justify-end": fromCurrentUser,
            "text-secondary-foreground justify-start": !fromCurrentUser,
          })}>{formatTime(createdAt)}</p>
        </div>
      </div>
      <Avatar className={cn("relative w-8 h-8", {
        "order-2": fromCurrentUser,
        "order-1": !fromCurrentUser,
        "invisible": lastByUser,
      })}>
        <AvatarImage src={senderImage} />
        <AvatarFallback>
          {senderName.substring(0, 1).toUpperCase()}
        </AvatarFallback>
      </Avatar>
    </div>
  );
};

export default Messages;