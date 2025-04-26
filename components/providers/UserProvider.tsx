"use client";

import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useEffect, useState } from "react";
import LoadingLogo from "@/components/ui/shared/LoadingLogo";

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
    const { user } = useUser();
    const createUser = useMutation(api.users.create);
    const [isLoading, setIsLoading] = useState(true);

    // Check if user exists in Convex
    const existingUser = useQuery(api.users.get, user ? { clerkId: user.id } : "skip");

    useEffect(() => {
        if (!user) {
            setIsLoading(false);
            return;
        }

        const createUserInConvex = async () => {
            try {
                if (!existingUser) {
                    await createUser({
                        clerkId: user.id,
                        username: user.username || user.firstName || "Anonymous",
                        imageUrl: user.imageUrl,
                        email: user.emailAddresses[0].emailAddress,
                    });
                }
                setIsLoading(false);
            } catch (error) {
                console.error("Error creating user in Convex:", error);
                setIsLoading(false);
            }
        };

        createUserInConvex();
    }, [user, createUser, existingUser]);

    if (isLoading) {
        return <LoadingLogo />;
    }

    return <>{children}</>;
}; 