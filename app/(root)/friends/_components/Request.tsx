"use client";

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel'
import { useMutation } from 'convex/react';
import { Check, User, X } from 'lucide-react';
import React from 'react'
import { toast } from 'sonner';
import { ConvexError } from 'convex/values';

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
    <Card className="w-full p-2 flex flex-row items-center justify-between gap-2">
      <div className="flex gap-4 truncate items-center">
        <Avatar>
          <AvatarImage src={imageUrl} />
          <AvatarFallback>
            {username[0]}
            {username[1]}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col truncate">
          <h4 className="truncate">{username}</h4>
          <p className="text-xs text-muted-foreground truncate">{email}</p>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <Button
          size="icon"
          disabled={isAccepting || isDenying}
          onClick={onAccept}
        >
          <Check className="h-4 w-4 text-emerald-500" />
        </Button>
        <Button
          size="icon"
          variant="destructive"
          disabled={isAccepting || isDenying}
          onClick={onDeny}
        >
          <X className="h-4 w-4 text-rose-500" />
        </Button>
      </div>
    </Card>
  )
}

export default Request