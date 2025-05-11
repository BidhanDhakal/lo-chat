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
  const [inputValue, setInputValue] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const createRequestByEmail = useMutation(api.request.create);
  const createRequestByUsername = useMutation(api.request.createByUsername);

  const isEmail = (value: string) => {

    return /\S+@\S+\.\S+/.test(value);
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!inputValue.trim()) return;

    try {
      setIsSubmitting(true);

      if (isEmail(inputValue)) {

        await createRequestByEmail({ email: inputValue });
      } else {

        await createRequestByUsername({ username: inputValue });
      }

      setInputValue("");
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
              placeholder="Email address or username"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground mt-2">
              Enter an email address or username to send a friend request
            </p>
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