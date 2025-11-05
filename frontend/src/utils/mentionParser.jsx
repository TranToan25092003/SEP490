import React from "react";

/**
 * Parse mention links from message content
 * Format: @[Product Name](productId)
 * Example: "Check out @[Lốp xe](123abc) for your bike"
 */
export const parseMentions = (text) => {
  if (!text) return [];
  
  const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
  const mentions = [];
  let match;
  
  while ((match = mentionRegex.exec(text)) !== null) {
    mentions.push({
      fullMatch: match[0],
      name: match[1],
      productId: match[2],
      index: match.index,
      length: match[0].length,
    });
  }
  
  return mentions;
};

/**
 * Render message with clickable mention links
 * Returns array of JSX elements or text nodes
 */
export const renderMessageWithMentions = (text, onProductClick) => {
  if (!text) return text;
  
  const mentions = parseMentions(text);
  if (mentions.length === 0) return text;
  
  const parts = [];
  let lastIndex = 0;
  
  mentions.forEach((mention, idx) => {
    // Add text before mention
    if (mention.index > lastIndex) {
      const beforeText = text.substring(lastIndex, mention.index);
      if (beforeText) {
        parts.push(beforeText);
      }
    }
    
    // Add mention link
    parts.push({
      type: 'mention',
      name: mention.name,
      productId: mention.productId,
      key: `mention-${idx}`,
    });
    
    lastIndex = mention.index + mention.length;
  });
  
  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }
  
  return parts.map((part, idx) => {
    if (typeof part === 'string') {
      return <span key={`text-${idx}`}>{part}</span>;
    }
    
    if (part.type === 'mention') {
      return (
        <span
          key={part.key}
          onClick={(e) => {
            e.preventDefault();
            if (onProductClick) {
              onProductClick(part.productId);
            }
          }}
          className="text-blue-600 hover:text-blue-800 underline cursor-pointer font-medium"
          title={`Xem chi tiết: ${part.name}`}
        >
          @{part.name}
        </span>
      );
    }
    
    return null;
  });
};

/**
 * Convert plain text with @ProductName to mention format
 * Example: "@Lốp xe" -> "@[Lốp xe](productId)"
 */
export const formatMention = (productName, productId) => {
  return `@[${productName}](${productId})`;
};

