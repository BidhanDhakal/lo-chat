"use client";

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useMutation } from 'convex/react';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface LeaveGroupDialogProps {
    conversationId: Id<"conversations">;
    open: boolean;
    setOpen: (open: boolean) => void;
    onSuccess?: () => void;
}

const LeaveGroupDialog = ({
    conversationId,
    open,
    setOpen,
    onSuccess
}: LeaveGroupDialogProps) => {
    const router = useRouter();
    const leaveGroup = useMutation(api.conversations.leaveGroup);
    const [isLoading, setIsLoading] = useState(false);

    const handleLeave = async () => {
        try {
            setIsLoading(true);
            await leaveGroup({ conversationId });

            toast.success("You have left the group");
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
            toast.error("Failed to leave group");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Leave Group</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to leave this group? You will need to be added back by an existing member to rejoin.
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
                        variant="default"
                        onClick={handleLeave}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Leaving...
                            </>
                        ) : (
                            'Leave Group'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default LeaveGroupDialog; 