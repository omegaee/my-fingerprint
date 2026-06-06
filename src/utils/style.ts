import { twMerge } from 'tailwind-merge';

export function cn(...args: (string | false | null | undefined)[]) {
  return twMerge(args.filter(Boolean).join(' '));
}