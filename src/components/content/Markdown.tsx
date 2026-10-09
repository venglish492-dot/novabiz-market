import Link from 'next/link';
import type { ReactNode } from 'react';

/**
 * Minimal, safe Markdown renderer for editorial content: headings, paragraphs,
 * lists, bold and links. Everything is rendered as React text (never as raw
 * HTML), and only http(s) or site-relative links are allowed.
 */
function inline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = /\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^)\s]+)\)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let index = 0;
  while ((match = pattern.exec(text))) {
    if (match.index > last) nodes.push(text.slice(last, match.index));
    if (match[1]) {
      nodes.push(<strong key={`${keyPrefix}-b${index}`}>{match[1]}</strong>);
    } else {
      const href = match[3];
      const safe = /^https?:\/\//.test(href) || (href.startsWith('/') && !href.startsWith('//'));
      if (!safe) nodes.push(match[2]);
      else if (href.startsWith('/'))
        nodes.push(
          <Link key={`${keyPrefix}-l${index}`} href={href}>
            {match[2]}
          </Link>,
        );
      else
        nodes.push(
          <a key={`${keyPrefix}-l${index}`} href={href} target="_blank" rel="noopener noreferrer nofollow">
            {match[2]}
          </a>,
        );
    }
    last = pattern.lastIndex;
    index += 1;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

export function Markdown({ source }: { source: string }) {
  const blocks = source.replace(/\r\n/g, '\n').split(/\n{2,}/);
  return (
    <div className="prose-vl">
      {blocks.map((block, blockIndex) => {
        const trimmed = block.trim();
        const key = `md-${blockIndex}`;
        if (!trimmed) return null;
        if (trimmed.startsWith('### ')) return <h3 key={key}>{inline(trimmed.slice(4), key)}</h3>;
        if (trimmed.startsWith('## ')) return <h2 key={key}>{inline(trimmed.slice(3), key)}</h2>;
        const lines = trimmed.split('\n');
        if (lines.every((line) => /^[-*] /.test(line))) {
          return (
            <ul key={key}>
              {lines.map((line, i) => (
                <li key={`${key}-${i}`}>{inline(line.slice(2), `${key}-${i}`)}</li>
              ))}
            </ul>
          );
        }
        if (lines.every((line) => /^\d+\. /.test(line))) {
          return (
            <ol key={key} className="list-decimal pl-5">
              {lines.map((line, i) => (
                <li key={`${key}-${i}`}>{inline(line.replace(/^\d+\. /, ''), `${key}-${i}`)}</li>
              ))}
            </ol>
          );
        }
        return <p key={key}>{inline(lines.join(' '), key)}</p>;
      })}
    </div>
  );
}
