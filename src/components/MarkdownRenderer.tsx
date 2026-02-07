import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

const MarkdownRenderer = ({ content, className }: MarkdownRendererProps) => {
  return (
    <div className={cn("prose prose-sm dark:prose-invert max-w-none", className)}>
      <ReactMarkdown
        components={{
        // Code blocks
        code: ({ node, className, children, ...props }) => {
          const isInline = !className;
          if (isInline) {
            return (
              <code
                className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono text-primary"
                {...props}
              >
                {children}
              </code>
            );
          }
          return (
            <code
              className={cn(
                "block bg-muted/80 p-3 rounded-lg text-sm font-mono overflow-x-auto border",
                className
              )}
              {...props}
            >
              {children}
            </code>
          );
        },
        // Pre blocks (wraps code blocks)
        pre: ({ children }) => (
          <pre className="bg-muted/80 p-0 rounded-lg overflow-x-auto my-3 border">
            {children}
          </pre>
        ),
        // Paragraphs
        p: ({ children }) => (
          <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>
        ),
        // Headings
        h1: ({ children }) => (
          <h1 className="text-xl font-bold mb-3 mt-4 first:mt-0">{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-lg font-semibold mb-2 mt-3 first:mt-0">{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-base font-semibold mb-2 mt-3 first:mt-0">{children}</h3>
        ),
        // Lists
        ul: ({ children }) => (
          <ul className="list-disc list-inside space-y-1 mb-2 ml-2">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal list-inside space-y-1 mb-2 ml-2">{children}</ol>
        ),
        li: ({ children }) => (
          <li className="text-sm leading-relaxed">{children}</li>
        ),
        // Links
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            {children}
          </a>
        ),
        // Blockquotes
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 border-primary/30 pl-4 py-1 my-2 italic text-muted-foreground">
            {children}
          </blockquote>
        ),
        // Strong/Bold
        strong: ({ children }) => (
          <strong className="font-semibold">{children}</strong>
        ),
        // Emphasis/Italic
        em: ({ children }) => (
          <em className="italic">{children}</em>
        ),
        // Horizontal rule
        hr: () => <hr className="my-4 border-border" />,
        // Tables
        table: ({ children }) => (
          <div className="overflow-x-auto my-3">
            <table className="min-w-full border border-border rounded-lg overflow-hidden">
              {children}
            </table>
          </div>
        ),
        thead: ({ children }) => (
          <thead className="bg-muted">{children}</thead>
        ),
        th: ({ children }) => (
          <th className="px-3 py-2 text-left text-sm font-semibold border-b">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="px-3 py-2 text-sm border-b border-border">{children}</td>
        ),
      }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;
