"use client";

import React from "react";
import ShieldTooltip from "./shield-tooltip";
import CrownTooltip from "./crown-tooltip";

interface EmojiParserProps {
    text: string | React.ReactNode[];
    className?: string;
}

/**
 * A component that parses text for shield and crown emojis and replaces them with the respective tooltip components.
 * This allows the Verified and Premium tooltips to appear on hover of specific emojis throughout the app.
 */
const EmojiParser = ({ text, className }: EmojiParserProps) => {
    // If text is already ReactNode[], we assume it's already been processed for links
    if (Array.isArray(text)) {
        // Process each node in the array
        return (
            <span className={className}>
                {text.map((node, index) => {
                    // If node is a string, parse it for emojis
                    if (typeof node === 'string') {
                        return <EmojiParser key={index} text={node} />;
                    }
                    // If node is a React element (like an <a> tag), return it as is
                    return node;
                })}
            </span>
        );
    }

    // If text is a string, process it for both emojis
    if (typeof text === 'string') {
        // Process the shield emoji first
        const shieldParts = text.split("🛡️");

        // If there are no shield emojis, check for crown emojis
        if (shieldParts.length === 1) {
            // Check for crown emoji
            const crownParts = text.split("👑");

            // If no crown emojis either, just return the text
            if (crownParts.length === 1) {
                return <span className={className}>{text}</span>;
            }

            // Construct a new array with the parts and crown tooltips
            const crownResult = crownParts.reduce((acc: React.ReactNode[], part, index) => {
                // Always push the text part
                acc.push(<span key={`text-${index}`}>{part}</span>);

                // If not the last part, push a crown tooltip
                if (index < crownParts.length - 1) {
                    acc.push(<CrownTooltip key={`crown-${index}`} />);
                }

                return acc;
            }, []);

            return <span className={className}>{crownResult}</span>;
        }

        // Process shield emojis, and then check for crown emojis in each part
        const result = shieldParts.reduce((acc: React.ReactNode[], part, index) => {
            // Check if this part contains crown emojis
            const crownParts = part.split("👑");

            if (crownParts.length === 1) {
                // No crown emojis in this part
                acc.push(<span key={`text-${index}`}>{part}</span>);
            } else {
                // This part contains crown emojis, process them
                const crownResult = crownParts.reduce((crownAcc: React.ReactNode[], crownPart, crownIndex) => {
                    crownAcc.push(<span key={`crown-text-${index}-${crownIndex}`}>{crownPart}</span>);

                    // If not the last part, push a crown tooltip
                    if (crownIndex < crownParts.length - 1) {
                        crownAcc.push(<CrownTooltip key={`crown-${index}-${crownIndex}`} />);
                    }

                    return crownAcc;
                }, []);

                acc.push(<span key={`text-${index}`}>{crownResult}</span>);
            }

            // If not the last part, push a shield tooltip
            if (index < shieldParts.length - 1) {
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