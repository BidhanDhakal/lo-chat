"use client";

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel'
import { useMutation } from 'convex/react';
import { Check, Loader2, User, X } from 'lucide-react';
import React from 'react'
import { toast } from 'sonner';
import { ConvexError } from 'convex/values';
import EmojiParser from '@/components/ui/emoji-parser';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface RequestProps {
  id: Id<"requests">;
  imageUrl: string;
  username: string;
  email: string;
}

const Request = ({ id, imageUrl, username, email }: RequestProps) => {
  const [isAccepting, setIsAccepting] = React.useState(false);
  const [isDenying, setIsDenying] = React.useState(false);

  const accept = useMutation(api.request.accept);
  const deny = useMutation(api.request.deny);

  const onAccept = async () => {
    try {
      setIsAccepting(true);
      await accept({ id });
      toast.success("Request accepted successfully");
    } catch (error) {
      toast.error(error instanceof ConvexError ? error.data : "Unexpected error occurred");
    } finally {
      setIsAccepting(false);
    }
  };

  const onDeny = async () => {
    try {
      setIsDenying(true);
      await deny({ id });
      toast.success("Request denied successfully");
    } catch (error) {
      toast.error(error instanceof ConvexError ? error.data : "Unexpected error occurred");
    } finally {
      setIsDenying(false);
    }
  };

  return (
    <Card className="w-full p-3 flex flex-row items-center justify-between gap-3">
      <div className="flex gap-3 truncate items-center">
        <Avatar>
          <AvatarImage src={imageUrl} className="object-cover" />
          <AvatarFallback>
            {username[0]}
            {username.length > 1 ? username[1] : ''}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col truncate">
          <h4 className="truncate">
            <EmojiParser text={username} />
          </h4>
          <p className="text-xs text-muted-foreground truncate">{email}</p>
        </div>
      </div>

      <div className="flex flex-row items-center justify-center gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                className="bg-blue-600 hover:bg-blue-700 text-white"
                disabled={isAccepting || isDenying}
                onClick={onAccept}
              >
                {isAccepting ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Check className="h-5 w-5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Accept friend request</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="destructive"
                className=""
                disabled={isAccepting || isDenying}
                onClick={onDeny}
              >
                {isDenying ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <X className="h-5 w-5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Reject friend request</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </Card>
  )
}

export default Request