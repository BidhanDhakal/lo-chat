import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, User } from 'lucide-react';
import EmojiParser from '@/components/ui/emoji-parser';

interface GroupMembersDialogProps {
    conversationId: Id<"conversations">;
    open: boolean;
    setOpen: (open: boolean) => void;
}

const GroupMembersDialog = ({ conversationId, open, setOpen }: GroupMembersDialogProps) => {
    const members = useQuery(api.conversation.getMembers, {
        conversationId
    });

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Group Members</DialogTitle>
                </DialogHeader>
                <div className="mt-4 max-h-[60vh] overflow-y-auto pr-1">
                    <div className="space-y-4 pr-2">
                        {!members ? (
                            <div className="flex justify-center items-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : members.length === 0 ? (
                            <p className="text-center text-muted-foreground py-8">
                                No members found
                            </p>
                        ) : (
                            members.map((member, index) => (
                                <div
                                    key={member.userId?.toString() || index}
                                    className="flex items-center gap-3 p-3 rounded-md hover:bg-muted/50"
                                >
                                    <Avatar className="h-10 w-10">
                                        <AvatarImage src={member.imageUrl} />
                                        <AvatarFallback>
                                            <User className="h-5 w-5" />
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                        <p className="font-medium">
                                            <EmojiParser text={member.username || "Unknown"} />
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default GroupMembersDialog; 