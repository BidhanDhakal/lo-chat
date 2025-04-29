"use client";

import { UserButton } from "@clerk/nextjs";
import { Card } from "@/components/ui/card";
import { useNavigation } from "@/hooks/useNavigation";
import Link from "next/link";
import { Tooltip } from "@radix-ui/react-tooltip";
import { TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { useConversation } from "@/hooks/useConversation";
import { ThemeToggle } from "@/components/ui/theme/theme-toggle";
import { Badge } from "@/components/ui/badge";

const MobileNav = () => {
    const paths = useNavigation();

    const { isActive } = useConversation();
    if (isActive) return null;

    return (
        <Card className="fixed bottom-0 w-[calc(100%-32px)] lg:hidden flex items-center px-4 py-2 z-50">
            <nav className="w-full">
                <ul className="flex justify-evenly items-center">
                    {paths.map((path, id) => {
                        return (
                            <li key={id} className="relative">
                                <Link href={path.href}>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button size="icon" variant={path.active ? "default" : "outline"}>
                                                {path.icon}
                                                {
                                                    path.count ? (
                                                        <Badge className="absolute left-6 bottom-6 px-2">
                                                            {path.count}
                                                        </Badge>
                                                    ) : null
                                                }
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>{path.name}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </Link>
                            </li>
                        );
                    })}
                    <li><ThemeToggle /></li>
                    <li>
                        <UserButton />
                    </li>
                </ul>
            </nav>
        </Card>
    );
};


export default MobileNav;