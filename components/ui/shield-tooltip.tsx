"use client";

import React from "react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { CheckCircle } from "lucide-react";

interface ShieldTooltipProps {
    size?: number;
    className?: string;
}

/**
 * A component that displays a verified badge icon with a tooltip when hovered.
 * This component can be used anywhere in the app where you want to show the verified badge.
 */
const ShieldTooltip = ({ size = 20, className }: ShieldTooltipProps) => {
    // Calculate new size that's 25% larger
    const displaySize = Math.round(size * 1.25);

    return (
        <TooltipProvider>
            <Tooltip delayDuration={200}>
                <TooltipTrigger asChild>
                    <span
                        className="relative inline-block align-middle transition-transform hover:scale-110 cursor-pointer"
                        style={{ verticalAlign: 'middle', display: 'inline-flex' }}
                    >
                        <svg
                            width={displaySize}
                            height={displaySize}
                            viewBox="0 0 72 72"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            {/* Starburst shape */}
                            <path
                                d="M36 0L41.2 10.3L47.9 2.1L49.8 13.5L59 8.1L56.9 19.7L67.5 17.6L62.1 26.8L73.5 28.7L65.3 35.4L75.6 40.6L65.3 45.8L73.5 52.5L62.1 54.4L67.5 63.6L56.9 61.5L59 73.1L49.8 67.7L47.9 79.1L41.2 70.9L36 81.2L30.8 70.9L24.1 79.1L22.2 67.7L13 73.1L15.1 61.5L4.5 63.6L9.9 54.4L-1.5 52.5L6.7 45.8L-3.6 40.6L6.7 35.4L-1.5 28.7L9.9 26.8L4.5 17.6L15.1 19.7L13 8.1L22.2 13.5L24.1 2.1L30.8 10.3L36 0Z"
                                fill="#00ACFF"
                                transform="scale(0.5) translate(36, 36)"
                            />

                            {/* White checkmark - perfectly centered */}
                            <path
                                d="M27 36L34 43L45 28"
                                stroke="white"
                                strokeWidth="5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                transform="translate(0, 1)"
                            />
                        </svg>
                    </span>
                </TooltipTrigger>
                <TooltipContent
                    side="top"
                    align="center"
                    className="bg-blue-600 border-blue-700 meta-verified-tooltip"
                >
                    <div className="flex items-center justify-center text-white">
                        <span className="font-medium">Verified</span>
                    </div>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
};

export default ShieldTooltip; 