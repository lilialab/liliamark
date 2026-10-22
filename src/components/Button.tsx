import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '../utils/cn';

const variantClass = {
  default: cn(
    'rounded border border-(--app-border) bg-(--app-surface) px-3 py-1.5 text-sm text-(--app-fg)',
    'hover:bg-(--app-surface-hover) disabled:cursor-not-allowed disabled:opacity-50',
  ),
  ghost: cn(
    'rounded-sm text-(--app-muted)',
    'hover:bg-(--app-surface-hover) hover:text-(--app-fg)',
    'disabled:cursor-not-allowed disabled:opacity-50',
  ),
  menu: cn(
    'block w-full px-3 py-1.5 text-left text-sm text-(--app-fg)',
    'hover:bg-(--app-surface-hover)',
  ),
} as const;

export type ButtonVariant = keyof typeof variantClass;

export type ButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'> & {
  variant?: ButtonVariant;
  /**
   * 是否进入 Tab 焦点序。
   * 壳上控件默认 false；对话框里需要键盘切换时传 true。
   */
  tabFocusable?: boolean;
  type?: 'button' | 'submit' | 'reset';
  children?: ReactNode;
};

/** 统一按钮样式；默认不进 Tab 序，避免抢编辑器焦点 */
export function Button({
  variant = 'default',
  tabFocusable = false,
  type = 'button',
  className,
  children,
  tabIndex,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      tabIndex={tabFocusable ? tabIndex : -1}
      className={cn(variantClass[variant], className)}
      {...rest}
    >
      {children}
    </button>
  );
}
