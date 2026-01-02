'use client';

import { useState } from 'react';

export default function CopyButton({ content, label, copiedLabel, theme }: any) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button onClick={handleCopy} className={`text-xs font-bold uppercase px-3 py-1 rounded border ${copied ? 'bg-[#F6821F] text-white border-[#F6821F]' : 'border-gray-300'}`}>
      {copied ? copiedLabel : label}
    </button>
  );
}
