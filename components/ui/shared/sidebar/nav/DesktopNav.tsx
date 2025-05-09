"use client";

import { UserButton } from "@clerk/nextjs";
import { Card } from "@/components/ui/card";
import { useNavigation } from "@/hooks/useNavigation";
import Link from "next/link";
import { Tooltip } from "@radix-ui/react-tooltip";
import { TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const DesktopNav = () => {
    const paths = useNavigation();
    return (
        <Card className="hidden lg:flex lg:flex-col lg:justify-between lg:items-center lg:fixed lg:left-0 lg:top-0 lg:h-screen lg:w-16 lg:z-50 lg:rounded-none lg:border-r lg:px-2 lg:py-4">
            <nav>
                <ul className="flex flex-col items-center gap-4">
                    {paths.map((path, id) => {
                        return (
                            <li key={id} className="relative">
                                <Link href={path.href}>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className={cn(
                                                        "hover:bg-transparent",
                                                        path.active && "bg-transparent hover:bg-transparent"
                                                    )}
                                                >
                                                    <span className={cn(
                                                        "p-2 rounded-lg transition-all duration-200",
                                                        path.active
                                                            ? "bg-blue-500/20 ring-1 ring-blue-500/30"
                                                            : "hover:bg-muted/50"
                                                    )}>
                                                        <span className={cn(
                                                            "text-xl dark:text-white text-black",
                                                            path.active && "text-blue-600 dark:text-blue-200"
                                                        )}>
                                                            {path.icon}
                                                        </span>
                                                    </span>
                                                </Button>
                                                {path.count ? <Badge className="absolute left-6 bottom-7 px-2">{path.count}</Badge> : null}
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>{path.name}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>
            <div className="flex flex-col items-center gap-4">
                <ThemeToggle />
                <UserButton />
            </div>
        </Card>
    );
};

export default DesktopNav;