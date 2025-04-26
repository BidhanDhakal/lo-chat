"use client";

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { api } from '@/convex/_generated/api';
import { useMutation } from 'convex/react';
import { Loader2 } from 'lucide-react';
import React from 'react';
import { toast } from 'sonner';
import { ConvexError } from 'convex/values';

const AddFriendForm = () => {
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
    } catch (error) {
      toast.error(error instanceof ConvexError ? error.data : "Unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add a friend</CardTitle>
        <CardDescription>
          Send a friend request to start chatting
        </CardDescription>
      </CardHeader>
      <form onSubmit={onSubmit}>
        <CardContent>
          <Input
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isSubmitting}
          />
        </CardContent>
        <CardFooter>
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
        </CardFooter>
      </form>
    </Card>
  );
};

export default AddFriendForm; 