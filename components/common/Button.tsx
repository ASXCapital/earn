import { ButtonHTMLAttributes } from 'react';
import clsx from 'clsx';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'icon';
}

export function Button({
  variant = 'primary',
  size = 'default',
  className,
  ...props
}: ButtonProps) {
  const base = 'rounded-md font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed';
  const variantStyles =
    variant === 'primary'
      ? 'bg-asx-cyan/90 hover:bg-asx-cyan text-black border border-asx-cyan/90'
      : variant === 'outline'
      ? 'border border-white/20 text-white/90 hover:text-white hover:border-white/40'
      : 'text-white/60 hover:text-white hover:bg-white/10';
  const sizeStyles =
    size === 'sm'
      ? 'px-3 py-1.5 text-xs'
      : size === 'icon'
      ? 'p-2'
      : 'px-4 py-2 text-sm';
  return <button className={clsx(base, variantStyles, sizeStyles, className)} {...props} />;
}
