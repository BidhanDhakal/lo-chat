"use client";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Loader2, ImagePlus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Image from "next/image";
import EmojiParser from "@/components/ui/emoji-parser";

interface GroupChatDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const GroupChatDialog = ({
    open,
    onOpenChange,
}: GroupChatDialogProps) => {
    const [isLoading, setIsLoading] = useState(false);
    const [groupName, setGroupName] = useState("");
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const [groupImage, setGroupImage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

    const friends = useQuery(api.friend.getFriends);
    const createGroupChat = useMutation(api.conversations.createGroupChat);
    const generateUploadUrl = useMutation(api.files.generateUploadUrl);

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Preview the image
            const reader = new FileReader();
            reader.onload = (e) => {
                if (e.target?.result) {
                    setGroupImage(e.target.result as string);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const removeImage = () => {
        setGroupImage(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleCreateGroup = async () => {
        if (!groupName || selectedUsers.length === 0) {
            toast.error("Please provide a group name and select at least one friend");
            return;
        }

        try {
            setIsLoading(true);

            let imageUrl = undefined;

            // Upload image if one was selected
            if (groupImage && fileInputRef.current?.files?.[0]) {
                try {
                    const file = fileInputRef.current.files[0];
                    // Get upload URL from Convex
                    const postUrl = await generateUploadUrl();

                    // Upload the file to the URL
                    const result = await fetch(postUrl, {
                        method: "POST",
                        headers: { "Content-Type": file.type },
                        body: file,
                    });

                    if (!result.ok) {
                        throw new Error(`Failed to upload image: ${result.statusText}`);
                    }

                    // Get the storageId from the response
                    const { storageId } = await result.json();
                    imageUrl = storageId;
                } catch (error) {
                    console.error("Error uploading image:", error);
                    toast.error("Failed to upload group image");
                }
            }

            // Create the group chat with the image if available
            const conversationId = await createGroupChat({
                name: groupName,
                memberIds: selectedUsers,
                imageUrl: imageUrl,
            });

            setGroupName("");
            setSelectedUsers([]);
            setGroupImage(null);
            onOpenChange(false);
            toast.success("Group chat created successfully");

            // Navigate to the new conversation
            router.push(`/conversations/${conversationId}`);
        } catch (error) {
            toast.error("Failed to create group chat");
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleUserSelection = (userId: string) => {
        if (selectedUsers.includes(userId)) {
            setSelectedUsers(selectedUsers.filter(id => id !== userId));
        } else {
            setSelectedUsers([...selectedUsers, userId]);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Create a Group Chat</DialogTitle>
                    <DialogDescription>
                        Create a new group chat with your friends
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 my-4">
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

                    <Input
                        placeholder="Group Name"
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                        disabled={isLoading}
                    />

                    <div className="mt-4">
                        <h3 className="text-sm font-medium mb-2">Select Friends</h3>
                        <div className="max-h-60 overflow-y-auto space-y-2 border rounded-md p-2">
                            {!friends ? (
                                <div className="flex justify-center items-center h-20">
                                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                </div>
                            ) : friends.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-4">
                                    No friends found
                                </p>
                            ) : (
                                friends.map((friend: any) => (
                                    <div
                                        key={friend._id}
                                        className={`flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-muted ${selectedUsers.includes(friend._id) ? "bg-muted" : ""
                                            }`}
                                        onClick={() => toggleUserSelection(friend._id)}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedUsers.includes(friend._id)}
                                            onChange={() => { }}
                                            className="h-4 w-4"
                                        />
                                        <span className="font-medium">
                                            <EmojiParser text={friend.username} />
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
                        onClick={() => onOpenChange(false)}
                        disabled={isLoading}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleCreateGroup}
                        disabled={isLoading || !groupName || selectedUsers.length === 0}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Creating...
                            </>
                        ) : (
                            "Create Group"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}; 