import React from 'react';

export const WarningTextFormatter = ({ text, className }: { text?: string, className?: string }) => {
  if (!text) return null;
  const parts = text.split(/(warning\b[^\n]*)/i);
  return (
    <span className={className}>
      {parts.map((part, i) => 
        part.toLowerCase().startsWith('warning') ? (
          <strong key={i} className="text-red-600 font-bold">
            {part}
          </strong>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
};
