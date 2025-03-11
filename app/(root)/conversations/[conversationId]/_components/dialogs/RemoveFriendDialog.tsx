"use client";

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useMutation } from 'convex/react';
import { useRouter } from 'next/navigation';
import React from 'react';

interface RemoveFriendDialogProps {
  conversationId: Id<"conversations">;
  open: boolean;
  setOpen: (open: boolean) => void;
  onSuccess?: () => void; // Add optional onSuccess callback
}

const RemoveFriendDialog = ({ 
  conversationId, 
  open, 
  setOpen,
  onSuccess 
}: RemoveFriendDialogProps) => {
  const router = useRouter();
  const removeFriend = useMutation(api.friend.remove);
  const [isLoading, setIsLoading] = React.useState(false);

  const onRemove = async () => {
    try {
      setIsLoading(true);
      await removeFriend({ conversationId });
      setOpen(false);
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      } else {
        // Default behavior - navigate to conversations
        router.push('/conversations');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Remove friend</DialogTitle>
          <DialogDescription>
            Are you sure you want to remove this friend? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onRemove}
            disabled={isLoading}
          >
            Remove
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RemoveFriendDialog;