"use client";

import { Card } from "@/components/ui/card";
import { useConversation } from "@/hooks/useConversation";
import { cn } from "@/lib/utils";
import { PropsWithChildren } from "react";
import './item-list-scrollbar.css';

type Props = PropsWithChildren<{
  title: string;
  action?: React.ReactNode;
}>;

const ItemList = ({ children, title, action: Action }: Props) => {
  const { isActive } = useConversation();
  return (
    <Card className={cn("hidden h-full w-full lg:flex-none lg:w-80 lg:ml-16 p-2 border-0", { block: !isActive, "lg:block": isActive })}>
      <div className="mb-3 flex items-center justify-between w-full px-2">
        <h1 className="text-2xl font-semibold tracking-tighter text-left">{title}</h1>
        <div className="flex-shrink-0 flex items-center justify-end">{Action ? Action : null}</div>
      </div>
      <div className="w-full h-full overflow-y-auto flex flex-col items-stretch justify-start gap-1 pb-20 lg:pb-12 hide-scrollbar">{children}</div>
    </Card>
  );
};


export default ItemList;