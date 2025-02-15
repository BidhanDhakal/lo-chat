"use client";


import { Card } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { api } from '@/convex/_generated/api';
import { useConversation } from '@/hooks/useConversation';
import { useMutationState } from '@/hooks/useMutationState';
import { zodResolver } from '@hookform/resolvers/zod';
import { ConvexError } from 'convex/values';
import React, { useRef } from 'react'
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod'
import TextareaAutosize from "react-textarea-autosize"
import { Button } from '@/components/ui/button';
import { SendHorizonal } from 'lucide-react';

const chatMessageSchema = z.object({
    content: z.string().min(1, { message: "Message cannot be empty" }),
});

const ChatInput = () => {
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);
    const { conversationId } = useConversation();
    const { mutate: createMessage, pending } = useMutationState(api.message.create);

    const form = useForm<z.infer<typeof chatMessageSchema>>({
        resolver: zodResolver(chatMessageSchema),
        defaultValues: { content: "" }
    });

    const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        const { value } = event.target;
        form.setValue("content", value);
    };

    const handleSubmit = async (values: z.infer<typeof chatMessageSchema>) => {
        try {
            await createMessage({
                conversationId: conversationId as string, // Add type assertion
                type: "text",
                content: [values.content.trim()] // Trim whitespace
            });
            form.reset();
        } catch (error) {
            toast.error(error instanceof ConvexError ? error.data : "Unexpected error occurred");
        }
    };

    return (
        <Card className='w-full p-2 rounded-lg relative'>
            <div className='flex gap-2 items-end w-full'>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className='flex gap-2 items-end w-full'>
                        <FormField
                            control={form.control}
                            name='content'
                            render={({ field }) => (
                                <FormItem className='h-full w-full'>
                                    <FormControl>
                                        <TextareaAutosize
                                            {...field}
                                            onChange={handleInputChange}
                                            onKeyDown={async (e) => {
                                                if (e.key === "Enter" && !e.shiftKey) {
                                                    e.preventDefault();
                                                    const content = form.getValues("content");
                                                    if (content.trim()) {
                                                        await form.handleSubmit(handleSubmit)();
                                                    }
                                                }
                                            }}
                                            rows={1}
                                            maxRows={3}
                                            placeholder='Type a message...'
                                            className='min-h-full w-full resize-none border-0 outline-0 bg-card text-card-foreground placeholder:text-muted-foreground p-1.5'
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button 
                            disabled={pending || !form.getValues("content").trim()} 
                            size="icon" 
                            type="submit"
                        >
                            <SendHorizonal />
                        </Button>
                    </form>
                </Form>
            </div>
        </Card>
    );
};

export default ChatInput;