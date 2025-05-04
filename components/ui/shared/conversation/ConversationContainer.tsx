import React from 'react';
import { Card } from '@/components/ui/card';

type Props = React.PropsWithChildren<{}>;

const ConversationConatiner = ({ children }: Props) => {
  return (
    <Card className='w-full h-[calc(100svh-32px)] lg:h-screen lg:rounded-none border-0 md:border md:border-l p-2 flex flex-col gap-2'>
      {children}
    </Card>
  );
};

export default ConversationConatiner;