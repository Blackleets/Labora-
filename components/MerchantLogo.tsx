import React from 'react';
import {
  type MerchantCategory,
  resolveMerchantBrand,
} from '../data/merchantBrands';

export interface MerchantLogoProps {
  merchantName: string;
  category?: MerchantCategory;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE_CLASS: Record<NonNullable<MerchantLogoProps['size']>, string> = {
  sm: 'h-9 w-9 text-xs rounded-xl',
  md: 'h-11 w-11 text-sm rounded-2xl',
  lg: 'h-14 w-14 text-base rounded-2xl',
};

const FALLBACK_STYLE: Record<MerchantCategory, { background: string; foreground: string; border: string }> = {
  fuel: { background: '#eef5f1', foreground: '#315d4b', border: '#c8d9d0' },
  restaurant: { background: '#fff3ea', foreground: '#8e4c2e', border: '#ead0bd' },
  supermarket: { background: '#f0f3f7', foreground: '#45596f', border: '#cdd5df' },
  other: { background: '#f4f1eb', foreground: '#5f5a52', border: '#d9d2c7' },
};

const fallbackInitial = (merchantName: string, category: MerchantCategory): string => {
  const first = merchantName.trim().match(/[\p{L}\p{N}]/u)?.[0];
  if (first) return first.toLocaleUpperCase('es');
  return ({ fuel: 'G', restaurant: 'R', supermarket: 'S', other: '·' })[category];
};

const MerchantLogo: React.FC<MerchantLogoProps> = ({
  merchantName,
  category = 'other',
  size = 'md',
  className = '',
}) => {
  const resolution = resolveMerchantBrand(merchantName);
  const style = resolution.brand?.colors ?? FALLBACK_STYLE[category];
  const label = resolution.brand?.shortLabel ?? fallbackInitial(merchantName, category as MerchantCategory);
  const accessibleName = resolution.brand?.name ?? (merchantName.trim() || 'Comercio sin identificar');

  return (
    <span
      aria-label={`Comercio: ${accessibleName}`}
      data-merchant-brand={resolution.brand?.id ?? 'unknown'}
      data-match-confidence={resolution.matchConfidence}
      role="img"
      title={accessibleName}
      className={`inline-flex shrink-0 items-center justify-center border font-extrabold leading-none tracking-tight shadow-sm ${SIZE_CLASS[size]} ${className}`}
      style={{
        backgroundColor: style.background,
        borderColor: style.border,
        color: style.foreground,
      }}
    >
      {label}
    </span>
  );
};

export default MerchantLogo;
