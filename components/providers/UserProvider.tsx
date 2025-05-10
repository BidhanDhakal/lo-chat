"use client";

import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useEffect, useState, useRef } from "react";
import LoadingLogo from "@/components/ui/shared/LoadingLogo";

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
    const { user } = useUser();
    const createUser = useMutation(api.users.create);
    const updateUser = useMutation(api.users.update);
    const [isLoading, setIsLoading] = useState(true);


    const prevImageUrlRef = useRef<string | null>(null);
    const prevUsernameRef = useRef<string | null>(null);


    const existingUser = useQuery(api.users.get, user ? { clerkId: user.id } : "skip");

    useEffect(() => {
        if (!user) {
            setIsLoading(false);
            return;
        }

        const syncUserWithConvex = async () => {
            try {
                if (!existingUser) {

                    await createUser({
                        clerkId: user.id,
                        username: user.username || user.firstName || "Anonymous",
                        imageUrl: user.imageUrl || "",
                        email: user.emailAddresses[0].emailAddress,
                    });
                    console.log("Created new user in Convex");
                } else {

                    const currentImageUrl = user.imageUrl || "";
                    const currentUsername = user.username || user.firstName || "Anonymous";

                    const imageChanged = prevImageUrlRef.current !== null &&
                        prevImageUrlRef.current !== currentImageUrl &&
                        existingUser.imageUrl !== currentImageUrl;

                    const usernameChanged = prevUsernameRef.current !== null &&
                        prevUsernameRef.current !== currentUsername &&
                        existingUser.username !== currentUsername;


                    if (imageChanged || usernameChanged) {
                        console.log("Detected profile changes from Clerk, syncing to Convex");

                        const updates: {
                            username?: string;
                            imageUrl?: string;
                        } = {};

                        if (imageChanged) {
                            updates.imageUrl = currentImageUrl;
                            console.log(`Updating image URL: ${currentImageUrl}`);
                        }

                        if (usernameChanged) {

                            let processedUsername = currentUsername;
                            if (processedUsername.length > 0) {
                                processedUsername = processedUsername.charAt(0).toUpperCase() + processedUsername.slice(1);
                            }

                            updates.username = processedUsername;
                            console.log(`Updating username: ${processedUsername}`);
                        }

                        await updateUser(updates);
                    }

                    prevImageUrlRef.current = currentImageUrl;
                    prevUsernameRef.current = currentUsername;
                }

                setIsLoading(false);
            } catch (error) {
                console.error("Error syncing user with Convex:", error);
                setIsLoading(false);
            }
        };

        syncUserWithConvex();
    }, [user, createUser, updateUser, existingUser]);

    if (isLoading) {
        return <LoadingLogo />;
    }

    return <>{children}</>;
}; 