"use client";

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { api } from '@/convex/_generated/api';
import { useMutation } from 'convex/react';
import { Loader2, UserPlus } from 'lucide-react';
import React from 'react';
import { toast } from 'sonner';
import { ConvexError } from 'convex/values';

interface AddFriendDialogProps {
  children?: React.ReactNode;
}

const AddFriendDialog = ({ children }: AddFriendDialogProps) => {
  const [open, setOpen] = React.useState(false);
  const [email, setEmail] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const createRequest = useMutation(api.request.create);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!email) return;

    try {
      setIsSubmitting(true);
      await createRequest({ email });
      setEmail("");
      toast.success("Friend request sent successfully");
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof ConvexError ? error.data : "Unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button size="icon" variant="ghost">
            <UserPlus className="h-5 w-5" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a friend</DialogTitle>
          <DialogDescription>
            Send a friend request to start chatting
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit}>
          <div className="py-4">
            <Input
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
          <DialogFooter>
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Request"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddFriendDialog;