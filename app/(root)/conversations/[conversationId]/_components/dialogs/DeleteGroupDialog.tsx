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

interface DeleteGroupDialogProps {
    conversationId: Id<"conversations">;
    open: boolean;
    setOpen: (open: boolean) => void;
    onSuccess?: () => void;
}

const DeleteGroupDialog = ({
    conversationId,
    open,
    setOpen,
    onSuccess
}: DeleteGroupDialogProps) => {
    const router = useRouter();
    const deleteGroup = useMutation(api.conversations.deleteGroup);
    const [isLoading, setIsLoading] = useState(false);

    const handleDelete = async () => {
        try {
            setIsLoading(true);
            await deleteGroup({ conversationId });

            toast.success("Group successfully deleted");
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
            toast.error("Failed to delete group");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Delete Group</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to delete this group? This action cannot be undone and all messages will be permanently deleted.
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
                        onClick={handleDelete}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Deleting...
                            </>
                        ) : (
                            'Delete Group'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default DeleteGroupDialog; 