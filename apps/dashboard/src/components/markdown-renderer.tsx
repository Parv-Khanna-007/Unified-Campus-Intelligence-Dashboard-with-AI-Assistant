'use client';

import * as React from 'react';
import { Check, Copy } from 'lucide-react';
import { Button } from './ui/button';

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  // Parse blocks: code blocks vs text blocks
  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <div className="space-y-3 leading-relaxed text-xs">
      {parts.map((part, index) => {
        if (part.startsWith('```')) {
          // Parse code block
          const match = part.match(/```(\w*)\n([\s\S]*?)```/);
          const language = match ? match[1] : 'text';
          const code = match ? match[2] : part.slice(3, -3);
          return <CodeBlock key={index} language={language} code={code.trim()} />;
        } else {
          // Render markdown text blocks
          return <TextBlock key={index} text={part} />;
        }
      })}
    </div>
  );
}

// -------------------------------------------------------------
// Interactive Code Block Component
// -------------------------------------------------------------
function CodeBlock({ language, code }: { language: string; code: string }) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code', err);
    }
  };

  // Basic regex tokenizer for keywords, strings, comments and numbers
  const highlightToken = (line: string) => {
    if (!line.trim()) return <span>&nbsp;</span>;

    // Simple JSON & JS styling helper
    const tokens = line.split(/(".*?"|'.*?'|\b\d+\b|[\{\}\[\]\(\):,])/g);
    return tokens.map((token, tIdx) => {
      if ((token.startsWith('"') && token.endsWith('"')) || (token.startsWith("'") && token.endsWith("'"))) {
        return <span key={tIdx} className="text-emerald-400 dark:text-emerald-300">{token}</span>; // Strings
      }
      if (/^\b\d+\b$/.test(token)) {
        return <span key={tIdx} className="text-amber-500 dark:text-amber-400">{token}</span>; // Numbers
      }
      if (/^[\{\}\[\]\(\):,]$/.test(token)) {
        return <span key={tIdx} className="text-indigo-400 dark:text-indigo-300 font-bold">{token}</span>; // Brackets
      }
      // Highlight common programming keywords
      const words = token.split(/(\bclass\b|\bdef\b|\bimport\b|\breturn\b|\bconst\b|\blet\b|\bfunction\b|\bvar\b|\bfrom\b|\btrue\b|\bfalse\b|\bnull\b)/g);
      return words.map((w, wIdx) => {
        if (/^(class|def|import|return|const|let|function|var|from|true|false|null)$/.test(w)) {
          return <span key={wIdx} className="text-pink-500 dark:text-pink-400 font-semibold">{w}</span>; // Keywords
        }
        return w;
      });
    });
  };

  const lines = code.split('\n');

  return (
    <div className="my-3 rounded-lg overflow-hidden border border-border/80 bg-zinc-950 text-zinc-100 shadow-lg font-mono">
      {/* Code Header */}
      <div className="flex justify-between items-center px-4 py-2 border-b border-zinc-800 bg-zinc-900 text-[10px] uppercase font-semibold text-zinc-400">
        <span>{language || 'code'}</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="h-6 px-2 text-[10px] text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 mr-1.5 text-emerald-400" />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-3 w-3 mr-1.5" />
              Copy
            </>
          )}
        </Button>
      </div>

      {/* Code Viewer */}
      <div className="p-3 overflow-x-auto text-[11px] leading-relaxed max-h-[300px]">
        <table className="w-full border-collapse">
          <tbody>
            {lines.map((line, lIdx) => (
              <tr key={lIdx} className="hover:bg-zinc-900/40">
                <td className="w-8 pr-3 text-right select-none text-zinc-600 text-[10px] border-r border-zinc-900">
                  {lIdx + 1}
                </td>
                <td className="pl-3 whitespace-pre text-left">
                  {highlightToken(line)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// Markdown Text Parser Component
// -------------------------------------------------------------
function TextBlock({ text }: { text: string }) {
  const lines = text.split('\n');

  const parseInline = (line: string) => {
    // Escape simple characters & parse bold tags **bold**
    const parts = line.split(/(\*\*.*?\*\*|`.*?`)/g);

    return parts.map((part, pIdx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={pIdx} className="font-bold text-foreground">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code key={pIdx} className="bg-muted px-1.5 py-0.5 rounded text-[10px] font-mono border border-border text-primary font-medium">
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  return (
    <div className="space-y-1.5">
      {lines.map((line, idx) => {
        const trimmed = line.trim();

        if (!trimmed) return <div key={idx} className="h-1" />;

        // Header parsing
        if (trimmed.startsWith('# ')) {
          return <h1 key={idx} className="text-base font-bold text-foreground mt-3 mb-1 border-b border-border pb-1">{parseInline(trimmed.slice(2))}</h1>;
        }
        if (trimmed.startsWith('## ')) {
          return <h2 key={idx} className="text-sm font-bold text-foreground mt-2 mb-1">{parseInline(trimmed.slice(3))}</h2>;
        }
        if (trimmed.startsWith('### ')) {
          return <h3 key={idx} className="text-xs font-bold text-foreground mt-1">{parseInline(trimmed.slice(4))}</h3>;
        }

        // List item parsing
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          return (
            <ul key={idx} className="list-disc pl-4 space-y-1 my-1">
              <li>{parseInline(line.replace(/^[\s]*[-*]\s/, ''))}</li>
            </ul>
          );
        }

        // Number list parsing
        if (/^\d+\.\s/.test(trimmed)) {
          const content = trimmed.replace(/^\d+\.\s/, '');
          return (
            <ol key={idx} className="list-decimal pl-4 space-y-1 my-1">
              <li>{parseInline(content)}</li>
            </ol>
          );
        }

        // Blockquote parsing
        if (trimmed.startsWith('> ')) {
          return (
            <blockquote key={idx} className="border-l-2 border-primary bg-muted/30 px-3 py-1.5 my-2 rounded-r text-muted-foreground italic">
              {parseInline(trimmed.slice(2))}
            </blockquote>
          );
        }

        // Default paragraph
        return <p key={idx} className="text-muted-foreground">{parseInline(line)}</p>;
      })}
    </div>
  );
}
