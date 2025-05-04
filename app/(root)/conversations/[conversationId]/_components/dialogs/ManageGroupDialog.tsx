import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useMutation, useQuery } from 'convex/react';
import { ImagePlus, Loader2, X, UserMinus } from 'lucide-react';
import Image from 'next/image';
import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import EmojiParser from '@/components/ui/emoji-parser';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type ManageGroupDialogProps = {
    conversationId: Id<"conversations">;
    currentName: string;
    currentImageUrl?: string;
    open: boolean;
    setOpen: (open: boolean) => void;
};

const ManageGroupDialog = ({
    conversationId,
    currentName,
    currentImageUrl,
    open,
    setOpen
}: ManageGroupDialogProps) => {
    // State for form values
    const [isLoading, setIsLoading] = useState(false);
    const [groupName, setGroupName] = useState(currentName);
    const [groupImage, setGroupImage] = useState<string | null>(null);
    const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
    const [originalImageId, setOriginalImageId] = useState<string | undefined>(
        currentImageUrl && !currentImageUrl.startsWith('http') && !currentImageUrl.startsWith('/')
            ? currentImageUrl
            : undefined
    );

    // File input ref
    const fileInputRef = useRef<HTMLInputElement>(null);

    // State for member removal confirmation
    const [memberToRemove, setMemberToRemove] = useState<{ id: string, name: string } | null>(null);
    const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false);

    // Initialize group name when dialog opens
    useEffect(() => {
        if (open) {
            setGroupName(currentName);
        }
    }, [open, currentName]);

    // Initialize image when dialog opens
    useEffect(() => {
        if (open && currentImageUrl) {
            // If it's already a URL, use it directly
            if (currentImageUrl.startsWith('http') || currentImageUrl.startsWith('/')) {
                setGroupImage(currentImageUrl);
            }
        } else {
            setGroupImage(null);
        }
    }, [open, currentImageUrl]);

    // Get friends list
    const friends = useQuery(api.friend.getFriends);

    // Get current members to exclude from friend selection
    const members = useQuery(api.conversation.getMembers, {
        conversationId
    });

    // Get conversation data
    const conversation = useQuery(api.conversation.get, {
        id: conversationId
    });

    // Get Convex mutations
    const updateGroupName = useMutation(api.conversations.updateGroupName);
    const updateGroupImage = useMutation(api.conversations.updateGroupImage);
    const addGroupMembers = useMutation(api.conversations.addGroupMembers);
    const removeGroupMember = useMutation(api.conversations.removeGroupMember);
    const generateUploadUrl = useMutation(api.files.generateUploadUrl);
    const getUrl = useMutation(api.files.getUrl);

    // Load Convex image if needed
    useEffect(() => {
        const loadConvexImage = async () => {
            if (originalImageId && !groupImage) {
                try {
                    const url = await getUrl({ storageId: originalImageId });
                    if (url) {
                        setGroupImage(url);
                    }
                } catch (error) {
                    console.error("Error loading image from Convex:", error);
                }
            }
        };

        if (open) {
            loadConvexImage();
        }
    }, [open, originalImageId, groupImage, getUrl]);

    // Handle image selection
    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Preview the image
            const reader = new FileReader();
            reader.onload = (e) => {
                if (e.target?.result) {
                    setGroupImage(e.target.result as string);
                    // Clear original image ID when a new image is selected
                    setOriginalImageId(undefined);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    // Remove image
    const removeImage = () => {
        setGroupImage(null);
        setOriginalImageId(undefined);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Toggle friend selection
    const toggleFriendSelection = (userId: string) => {
        if (selectedFriends.includes(userId)) {
            setSelectedFriends(selectedFriends.filter(id => id !== userId));
        } else {
            setSelectedFriends([...selectedFriends, userId]);
        }
    };

    // Check if a friend is already a member
    const isFriendAlreadyMember = (friendId: string) => {
        if (!members) return false;
        return members.some(member => member.userId === friendId);
    };

    // Handle member removal (opens confirmation dialog)
    const openRemoveMemberDialog = (memberId: string, memberName: string) => {
        setMemberToRemove({ id: memberId, name: memberName });
        setIsRemoveDialogOpen(true);
    };

    // Confirm and execute member removal
    const confirmRemoveMember = async () => {
        if (!memberToRemove) return;

        try {
            setIsLoading(true);
            await removeGroupMember({
                conversationId,
                memberId: memberToRemove.id
            });

            toast.success("Member removed from group");
            setIsRemoveDialogOpen(false);
            setMemberToRemove(null);
        } catch (error) {
            console.error("Error removing member:", error);
            toast.error("Failed to remove member");
        } finally {
            setIsLoading(false);
        }
    };

    // Handle save function
    const handleSave = async () => {
        if (!groupName.trim()) {
            toast.error("Group name cannot be empty");
            return;
        }

        try {
            setIsLoading(true);

            // Update name if changed
            if (groupName !== currentName) {
                await updateGroupName({
                    conversationId,
                    name: groupName.trim()
                });
            }

            // Update image if changed
            if ((groupImage && !originalImageId) || (groupImage === null && originalImageId)) {
                // Upload new image if selected
                if (groupImage && fileInputRef.current?.files?.[0]) {
                    const file = fileInputRef.current.files[0];
                    const postUrl = await generateUploadUrl();

                    const result = await fetch(postUrl, {
                        method: "POST",
                        headers: { "Content-Type": file.type },
                        body: file,
                    });

                    if (!result.ok) {
                        throw new Error(`Failed to upload image: ${result.statusText}`);
                    }

                    const { storageId } = await result.json();

                    // Update group image in database
                    await updateGroupImage({
                        conversationId,
                        imageUrl: storageId
                    });
                }
                // If image was removed
                else if (groupImage === null && originalImageId) {
                    await updateGroupImage({
                        conversationId,
                        imageUrl: ""
                    });
                }
            }

            // Add new members if selected
            if (selectedFriends.length > 0) {
                const result = await addGroupMembers({
                    conversationId,
                    memberIds: selectedFriends
                });

                if (result.addedCount > 0) {
                    toast.success(`Added ${result.addedCount} new member${result.addedCount > 1 ? 's' : ''} to the group`);
                }
            }

            toast.success("Group updated successfully");
            setOpen(false);
            // Reset state
            setSelectedFriends([]);

        } catch (error) {
            console.error("Error updating group:", error);
            toast.error("Failed to update group");
        } finally {
            setIsLoading(false);
        }
    };

    // Filter friends to show only those who aren't already members
    const filteredFriends = friends?.filter(friend => !isFriendAlreadyMember(friend._id));

    return (
        <>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto hide-scrollbar">
                    <DialogHeader>
                        <DialogTitle>Manage Group</DialogTitle>
                        <DialogDescription>
                            Update group details or add new members
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 my-4">
                        {/* Group Image Section */}
                        <div>
                            <div className="flex justify-center mb-4">
                                <div className="relative">
                                    <div
                                        className="h-20 w-20 rounded-full bg-muted flex items-center justify-center cursor-pointer overflow-hidden border-2 border-primary/20"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        {groupImage ? (
                                            <Image
                                                src={groupImage}
                                                alt="Group image"
                                                fill
                                                style={{ objectFit: 'cover' }}
                                            />
                                        ) : (
                                            <ImagePlus className="h-8 w-8 text-muted-foreground" />
                                        )}
                                    </div>
                                    {groupImage && (
                                        <button
                                            type="button"
                                            onClick={removeImage}
                                            className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-1 h-6 w-6 flex items-center justify-center"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                ref={fileInputRef}
                                onChange={handleImageSelect}
                                disabled={isLoading}
                            />
                            <p className="text-xs text-muted-foreground text-center mb-4">
                                {groupImage ? "Click to change group image" : "Click to add group image"}
                            </p>
                        </div>

                        {/* Group Name Input */}
                        <div>
                            <label className="text-sm font-medium mb-2 block">Group Name</label>
                            <Input
                                placeholder="Group Name"
                                value={groupName}
                                onChange={(e) => setGroupName(e.target.value)}
                                disabled={isLoading}
                            />
                        </div>

                        {/* Current Members Section */}
                        <div>
                            <h3 className="text-sm font-medium mb-2">Current Members</h3>
                            <div className="max-h-60 overflow-y-auto space-y-2 border rounded-md p-2 hide-scrollbar">
                                {!members ? (
                                    <div className="flex justify-center items-center h-20">
                                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                    </div>
                                ) : members.length === 0 ? (
                                    <p className="text-sm text-muted-foreground text-center py-4">
                                        No members found
                                    </p>
                                ) : (
                                    members.map(member => (
                                        <div
                                            key={member.userId}
                                            className="flex items-center justify-between gap-2 p-2 rounded-md hover:bg-muted/50"
                                        >
                                            <div className="flex items-center gap-2">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarImage src={member.imageUrl} />
                                                    <AvatarFallback>{member.username?.[0]?.toUpperCase() || "?"}</AvatarFallback>
                                                </Avatar>
                                                <span className="font-medium">
                                                    <EmojiParser text={member.username || ""} />
                                                </span>
                                            </div>
                                            {/* Don't show remove button for the group creator */}
                                            {member.userId?.toString() !== conversation?.creatorId?.toString() && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => openRemoveMemberDialog(member.userId as string, member.username || "this member")}
                                                    disabled={isLoading}
                                                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                    title="Remove member"
                                                >
                                                    <UserMinus className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Add Members Section */}
                        <div>
                            <h3 className="text-sm font-medium mb-2">Add New Members</h3>
                            <div className="max-h-60 overflow-y-auto space-y-2 border rounded-md p-2 hide-scrollbar">
                                {!friends ? (
                                    <div className="flex justify-center items-center h-20">
                                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                    </div>
                                ) : filteredFriends?.length === 0 ? (
                                    <p className="text-sm text-muted-foreground text-center py-4">
                                        All your friends are already in this group
                                    </p>
                                ) : (
                                    filteredFriends?.map(friend => (
                                        <div
                                            key={friend._id}
                                            className={`flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-muted ${selectedFriends.includes(friend._id) ? "bg-muted" : ""}`}
                                            onClick={() => toggleFriendSelection(friend._id)}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedFriends.includes(friend._id)}
                                                onChange={() => { }}
                                                className="h-4 w-4"
                                            />
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src={friend.imageUrl} />
                                                <AvatarFallback>{friend.username?.[0]?.toUpperCase() || "?"}</AvatarFallback>
                                            </Avatar>
                                            <span className="font-medium">
                                                <EmojiParser text={friend.username || ""} />
                                            </span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={isLoading || !groupName.trim()}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                "Save Changes"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Custom Remove Member Confirmation Dialog */}
            <AlertDialog open={isRemoveDialogOpen} onOpenChange={setIsRemoveDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remove Group Member</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to remove <span className="font-medium">{memberToRemove?.name}</span> from the group?
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmRemoveMember}
                            disabled={isLoading}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Removing...
                                </>
                            ) : (
                                "Remove"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};

export default ManageGroupDialog; 