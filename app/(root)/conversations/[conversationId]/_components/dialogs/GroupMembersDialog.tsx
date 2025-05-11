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
import { cn } from '@/lib/utils';

interface GroupMembersDialogProps {
    conversationId: Id<"conversations">;
    open: boolean;
    setOpen: (open: boolean) => void;
}

// Custom CSS class for hiding scrollbars
const hideScrollbarClass = "scrollbar-hide";

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
                <div
                    className={cn(
                        "mt-4 max-h-[60vh] overflow-y-auto pr-1",
                        // CSS to hide scrollbar across browsers
                        "[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                    )}
                >
                    <div className="pr-2">
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
                                    className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50"
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