"use client";

import React from "react";
import ShieldTooltip from "./shield-tooltip";

interface EmojiParserProps {
    text: string | React.ReactNode[];
    className?: string;
}

/**
 * A component that parses text for shield emojis and replaces them with the ShieldTooltip component.
 * This allows the Meta Verified tooltip to appear on hover of shield emojis throughout the app.
 */
const EmojiParser = ({ text, className }: EmojiParserProps) => {
    // If text is already ReactNode[], we assume it's already been processed for links
    if (Array.isArray(text)) {
        // Process each node in the array
        return (
            <span className={className}>
                {text.map((node, index) => {
                    // If node is a string, parse it for shield emojis
                    if (typeof node === 'string') {
                        return <EmojiParser key={index} text={node} />;
                    }
                    // If node is a React element (like an <a> tag), return it as is
                    return node;
                })}
            </span>
        );
    }

    // If text is a string, process it for shield emojis
    if (typeof text === 'string') {
        // Split the text by the shield emoji
        const parts = text.split("🛡️");

        // If there are no shield emojis, just return the text
        if (parts.length === 1) {
            return <span className={className}>{text}</span>;
        }

        // Construct a new array with the parts and shield tooltips
        const result = parts.reduce((acc: React.ReactNode[], part, index) => {
            // Always push the text part
            acc.push(<span key={`text-${index}`}>{part}</span>);

            // If not the last part, push a shield tooltip
            if (index < parts.length - 1) {
                acc.push(<ShieldTooltip key={`shield-${index}`} />);
            }

            return acc;
        }, []);

        return <span className={className}>{result}</span>;
    }

    // Default fallback
    return <span className={className}>{text}</span>;
};

export default EmojiParser; 