"use client";

import React from 'react'
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { UserPlus } from 'lucide-react';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useMutationState } from '@/hooks/useMutationState';
import { api } from '@/convex/_generated/api';
import { toast } from "sonner";
import { ConvexError } from "convex/values";


const addFriendFormSchema = z.object({
    email: z.string().min(1, { message: "This field cant be empty" })
        .email("Please enter a valid email"),
});

const AddFriendDialog = () => {
    const { mutate: createRequest, pending } = useMutationState(api.request.create);

    const form = useForm<z.infer<typeof addFriendFormSchema>>({
        resolver: zodResolver(addFriendFormSchema),
        defaultValues: {
            email: "",
        },
    });

    const handleSubmit = async (values: z.infer<typeof addFriendFormSchema>) => {
        try {
            await createRequest({ email: values.email });
            toast.success("Friend request sent successfully!");
            form.reset();
        } catch (error: unknown) {
            toast.error(error instanceof ConvexError ? error.data : "Unexpected error occurred");
        }
    };
    return <Dialog>
        <Tooltip>
            <TooltipTrigger asChild>
                <DialogTrigger asChild>
                    <Button size="icon" variant="outline">
                        <UserPlus />
                    </Button>
                </DialogTrigger>            
                </TooltipTrigger>
            <TooltipContent>
                <p>Add Friend</p>
            </TooltipContent>
        </Tooltip>

        <DialogContent>
            <DialogHeader>
                <DialogTitle>
                    Add Friend
                </DialogTitle>
                <DialogDescription>
                    Add a friend by entering their email address
                </DialogDescription>
            </DialogHeader>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                    <Input placeholder="Email..."
                                        {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <DialogFooter>
                        <Button disabled={pending} type="submit">Send Request</Button>
                    </DialogFooter>
                </form>
            </Form>
        </DialogContent>
    </Dialog>
};

export default AddFriendDialog