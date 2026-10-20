import { describe, expect, it } from 'vitest';
import { renderMarkdown } from '../../src/preview/renderMarkdown';

describe('renderMarkdown', () => {
  it('renders a heading', () => {
    expect(renderMarkdown('# Hello')).toContain('<h1>Hello</h1>');
  });

  it('does not pass through raw HTML', () => {
    expect(renderMarkdown('<script>alert(1)</script>')).not.toContain('<script>');
  });

  it('highlights fenced code with hljs classes', () => {
    const html = renderMarkdown('```js\nconst x = 1;\n```');
    expect(html).toContain('hljs');
    expect(html).toContain('hljs-keyword');
  });
});
