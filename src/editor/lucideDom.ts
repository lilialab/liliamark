import type { LucideIcon } from 'lucide-react';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

/** lucide → 静态 SVG 字符串（给非 React DOM 用） */
export function lucideMarkup(Icon: LucideIcon, size: number, strokeWidth = 2): string {
  return renderToStaticMarkup(
    createElement(Icon, {
      size,
      strokeWidth,
      'aria-hidden': true,
    }),
  );
}

/** 把按钮内容换成 lucide 图标 */
export function setButtonIcon(
  button: HTMLButtonElement,
  Icon: LucideIcon,
  size = 16,
): void {
  button.innerHTML = lucideMarkup(Icon, size);
}
