'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';

import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-go';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-rust';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import 'prismjs/components/prism-csharp';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-php';
import 'prismjs/components/prism-ruby';
import 'prismjs/components/prism-swift';
import 'prismjs/components/prism-kotlin';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-css';

import 'prismjs/themes/prism-tomorrow.css';
import { useApp } from './ClientShell';

const getApiUrl = () => {
  const host = process.env.NEXT_PUBLIC_API_HOST || 'http://localhost:8080';
  return host.includes('://') ? host : `https://${host}`;
};

export default function Home() {
  const [code, setCode] = useState<string>('');
  const [language, setLanguage] = useState<string>('javascript');
  const [loading, setLoading] = useState<boolean>(false);
  const [mounted, setMounted] = useState(false);
  
  const router = useRouter();
  const { theme, t } = useApp();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleCreate = async () => {
    if (!code.trim() || loading) return;
    setLoading(true);
    try {
      const res = await fetch(`${getApiUrl()}/api/pastes`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-CodeDrop-Token': 'secure-access-v1'
        },
        body: JSON.stringify({
          content: code,
          language: language,
          ttl_seconds: 604800,
        }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      router.push(`/${data.id}`);
    } catch {
      alert('Error');
    } finally {
      setLoading(false);
    }
  };

  const highlightCode = (code: string) => {
    if (!mounted) return code;
    const grammar = Prism.languages[language];
    if (!grammar) return code;
    try {
      return Prism.highlight(code, grammar, language);
    } catch (e) {
      return code;
    }
  };

  if (!mounted) return null;

  return (
    <main className="flex-grow flex flex-col p-6 max-w-screen-2xl mx-auto w-full">
      <style jsx global>{`
        .token.comment, .token.prolog, .token.doctype, .token.cdata { color: #6a9955 !important; }
        .token.punctuation { color: #d4d4d4 !important; }
        .token.property, .token.tag, .token.boolean, .token.number, .token.constant, .token.symbol, .token.deleted { color: #b5cea8 !important; }
        .token.selector, .token.attr-name, .token.string, .token.char, .token.builtin, .token.inserted { color: #ce9178 !important; }
        .token.operator, .token.entity, .token.url { color: #d4d4d4 !important; }
        .token.atrule, .token.attr-value, .token.keyword { color: #569cd6 !important; }
        .token.function, .token.class-name { color: #dcdcaa !important; }
        .token.regex, .token.important, .token.variable { color: #d16969 !important; }
        .token.parameter { color: #9cdcfe !important; }
      `}</style>
      
      <div className="flex flex-col flex-grow">
        <div className="flex justify-between items-center mb-4">
          <select 
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className={`text-[10px] font-bold uppercase tracking-widest outline-none bg-transparent cursor-pointer hover:text-[#F6821F] transition-colors`}
          >
            <option value="javascript">JavaScript</option>
            <option value="typescript">TypeScript</option>
            <option value="python">Python</option>
            <option value="go">Go</option>
            <option value="rust">Rust</option>
            <option value="c">C</option>
            <option value="cpp">C++</option>
            <option value="csharp">C#</option>
            <option value="java">Java</option>
            <option value="php">PHP</option>
            <option value="ruby">Ruby</option>
            <option value="swift">Swift</option>
            <option value="kotlin">Kotlin</option>
            <option value="bash">Bash</option>
            <option value="sql">SQL</option>
            <option value="json">JSON</option>
            <option value="yaml">YAML</option>
            <option value="markdown">Markdown</option>
            <option value="markup">HTML</option>
            <option value="css">CSS</option>
          </select>

          <button 
            onClick={handleCreate} 
            disabled={!code.trim() || loading} 
            className="text-[10px] font-black uppercase tracking-[0.2em] text-[#F6821F] hover:opacity-50 transition-all disabled:opacity-20"
          >
            {loading ? t('creating') : t('create')}
          </button>
        </div>

        <div className={`flex-grow flex flex-col border ${theme === 'dark' ? 'border-neutral-900 bg-[#0f0f0f]' : 'border-neutral-100 bg-[#fafafa]'} rounded-sm`}>
          <Editor
            value={code}
            onValueChange={setCode}
            highlight={highlightCode}
            padding={24}
            className="font-mono text-xs leading-relaxed flex-grow"
            style={{ 
              backgroundColor: 'transparent',
              fontFamily: '"JetBrains Mono", monospace',
              color: theme === 'dark' ? '#d4d4d4' : '#1a1a1a',
              minHeight: 'calc(100vh - 250px)'
            }}
            textareaClassName="outline-none focus:ring-0"
          />
        </div>
      </div>
    </main>
  );
}
