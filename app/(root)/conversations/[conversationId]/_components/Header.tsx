import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@radix-ui/react-avatar';
import { CircleArrowLeft } from 'lucide-react';
import Link from 'next/link';
import React from 'react'

type Props = {
    imageUrl?: string;
    name: string;
}

const Header = ({imageUrl, name}: Props) => {
    return (  
     <Card className="w-full flex roulded-lg items-center p-2 justify-between">
        <div className='flex items-center gap-2'>
                <Link href="/conversations" className="block lg:hidden"><CircleArrowLeft/></Link>
                <Avatar className='h-8 w-8 rounded-full'> 
                    <AvatarImage src={imageUrl} className='rounded-full'/>
                    <AvatarFallback className='rounded-full'>{name.substring(0,1)}</AvatarFallback>
                </Avatar>
                <h2 className='font-semibold'>{name}</h2>
        </div>
     </Card>
    )
}

export default Header