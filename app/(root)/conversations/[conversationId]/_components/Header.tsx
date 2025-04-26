import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@radix-ui/react-avatar';
import { CircleArrowLeft, Settings } from 'lucide-react';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import EmojiParser from '@/components/ui/emoji-parser';
import { api } from '@/convex/_generated/api';
import { useMutation } from 'convex/react';

type Props = {
    imageUrl?: string;
    name: string;
    options?: {
        label: string;
        destructive: boolean;
        onClick: () => void;
    }[];
}

const Header = ({ imageUrl, name, options }: Props) => {
    const [finalImageUrl, setFinalImageUrl] = useState<string | undefined>(imageUrl);
    const getUrl = useMutation(api.files.getUrl);

    // Check if this is a Convex Storage ID and get the URL if needed
    useEffect(() => {
        const loadConvexImage = async () => {
            if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('/')) {
                try {
                    const url = await getUrl({ storageId: imageUrl });
                    if (url) {
                        setFinalImageUrl(url);
                    }
                } catch (error) {
                    console.error("Error loading image from Convex:", error);
                }
            }
        };

        loadConvexImage();
    }, [imageUrl, getUrl]);

    return (
        <Card className="w-full flex roulded-lg items-center p-2 justify-between">
            <div className='flex items-center gap-2'>
                <Link href="/conversations" className="block lg:hidden"><CircleArrowLeft /></Link>
                <Avatar className='h-8 w-8 rounded-full'>
                    <AvatarImage src={finalImageUrl} className='rounded-full' />
                    <AvatarFallback className='rounded-full'>{name.substring(0, 1)}</AvatarFallback>
                </Avatar>
                <h2 className='font-semibold'>
                    <EmojiParser text={name} />
                </h2>
            </div>
            <div className='flex gap-2'>
                {options ? <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="secondary">
                            <Settings />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        {options.map((option, id) => {
                            return <DropdownMenuItem key={id} onClick={option.onClick} className={cn("font-semibold",
                                { "text-distructve": option.destructive, }
                            )}>
                                <EmojiParser text={option.label} />
                            </DropdownMenuItem>
                        })}
                    </DropdownMenuContent>
                </DropdownMenu> : null}
            </div>
        </Card>
    )
}

export default Header