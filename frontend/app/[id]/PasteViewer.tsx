'use client';

import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, ghcolors } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useApp } from '../ClientShell';
import CopyButton from './CopyButton';

export default function PasteViewer({ paste }: { paste: any }) {
  const { theme, t } = useApp();
  const bytes = new TextEncoder().encode(paste.content).length;

  return (
    <main className="flex-grow flex flex-col p-6 max-w-screen-2xl mx-auto w-full">
      <div className="flex flex-col flex-grow">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest opacity-40">
            <span>{paste.id}</span>
            <span>{paste.language}</span>
            <span>{bytes} B</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="/" className="text-[10px] font-bold uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity">{t('newPaste')}</a>
            <CopyButton content={paste.content} label={t('copy')} copiedLabel={t('copied')} theme={theme} />
          </div>
        </div>
        
        <div className={`flex-grow border ${theme === 'dark' ? 'border-neutral-900 bg-[#0f0f0f]' : 'border-neutral-100 bg-[#fafafa]'} rounded-sm overflow-hidden`}>
          <SyntaxHighlighter
            language={paste.language}
            style={theme === 'dark' ? vscDarkPlus : ghcolors}
            showLineNumbers={false}
            customStyle={{ 
              margin: 0, 
              padding: '24px', 
              fontSize: '12px', 
              lineHeight: '1.6',
              backgroundColor: 'transparent',
              fontFamily: '"JetBrains Mono", monospace',
            }}
          >
            {paste.content}
          </SyntaxHighlighter>
        </div>
      </div>
    </main>
  );
}
