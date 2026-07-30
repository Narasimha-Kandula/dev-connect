'use client';

import { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';
const API_ORIGIN = API_BASE.replace('/api/v1', '');

export function avatarSrc(url: string | undefined | null): string | null {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/uploads/')) return `${API_ORIGIN}${url}`;
  if (url.startsWith('/')) return `${API_ORIGIN}${url}`;
  return url;
}

const SIZE_MAP = {
  xs: { class: 'h-6 w-6 text-[9px]', px: 24 },
  sm: { class: 'h-8 w-8 text-xs', px: 32 },
  md: { class: 'h-10 w-10 text-sm', px: 40 },
  lg: { class: 'h-12 w-12 text-base', px: 48 },
  xl: { class: 'h-20 w-20 text-2xl', px: 80 },
} as const;

type AvatarSize = keyof typeof SIZE_MAP;

interface AvatarProps {
  src?: string | null;
  name: string;
  size?: AvatarSize;
  className?: string;
  border?: boolean;
}

export function Avatar({ src, name, size = 'md', className = '', border = false }: AvatarProps) {
  const imgSrc = avatarSrc(src);
  const [failed, setFailed] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const initial = name?.charAt(0)?.toUpperCase() ?? '?';

  const handleError = useCallback(() => {
    if (retryKey === 0) {
      setTimeout(() => setRetryKey(1), 2000);
    }
    setFailed(true);
  }, [retryKey]);

  const handleRetry = useCallback(() => {
    setFailed(false);
    setRetryKey((k) => k + 1);
  }, []);

  useEffect(() => {
    setFailed(false);
    setRetryKey(0);
  }, [src]);

  const { class: sizeClass, px } = SIZE_MAP[size];
  const borderClass = border ? 'border-2 border-border' : '';

  if (imgSrc && !failed) {
    return (
      <div className={`relative shrink-0 ${className}`}>
        <Image
          key={retryKey}
          src={imgSrc}
          alt={name}
          width={px}
          height={px}
          className={`rounded-full object-cover ${sizeClass} ${borderClass}`}
          onError={handleError}
        />
      </div>
    );
  }

  return (
    <div
      className={`relative shrink-0 flex items-center justify-center rounded-full bg-primary text-primary-foreground font-bold ${sizeClass} ${borderClass} ${className}`}
      title={failed ? 'Avatar failed to load. Click to retry.' : undefined}
      onClick={failed ? handleRetry : undefined}
      role={failed ? 'button' : undefined}
      tabIndex={failed ? 0 : undefined}
      onKeyDown={failed ? (e) => { if (e.key === 'Enter') handleRetry(); } : undefined}
    >
      {initial}
      {failed && (
        <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-danger text-[7px] text-white shadow-sm">
          !
        </span>
      )}
    </div>
  );
}
