import React, { useEffect, useMemo, useState } from 'react';
import { Building2, Car, CreditCard, FileText, Package } from 'lucide-react';

export interface LogoResolverProps {
  id: string;
  name: string;
  domain?: string;
  category?: 'delivery' | 'mobility' | 'banking' | 'payments' | 'accounting' | 'other';
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

const SIMPLE_ICON_SLUGS: Record<string, string> = {
  uber_eats: 'ubereats',
  uber: 'uber',
  uber_driver: 'uber',
  glovo: 'glovo',
  just_eat: 'justeat',
  deliveroo: 'deliveroo',
  doordash: 'doordash',
  amazon_flex: 'amazon',
  ifood: 'ifood',
  lyft: 'lyft',
  paypal: 'paypal',
  stripe: 'stripe',
  revolut: 'revolut',
  wise: 'wise',
  n26: 'n26',
};

const SIZE = {
  sm: 'h-8 w-8 rounded-xl p-1.5',
  md: 'h-12 w-12 rounded-2xl p-2.5',
  lg: 'h-16 w-16 rounded-2xl p-3',
  xl: 'h-24 w-24 rounded-[1.5rem] p-4',
  '2xl': 'h-32 w-32 rounded-[2rem] p-5',
};

const LogoResolver: React.FC<LogoResolverProps> = ({
  id,
  name,
  domain,
  category = 'other',
  className = '',
  size = 'md',
}) => {
  const [sourceIndex, setSourceIndex] = useState(0);
  const simpleSlug = SIMPLE_ICON_SLUGS[id];

  const sources = useMemo(() => {
    const result: string[] = [];
    if (simpleSlug) result.push(`https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/${simpleSlug}.svg`);
    if (domain) result.push(`https://${domain.replace(/^https?:\/\//, '').replace(/\/$/, '')}/favicon.ico`);
    return result;
  }, [domain, simpleSlug]);

  useEffect(() => setSourceIndex(0), [id, domain]);

  const boxClass = `${SIZE[size]} ${className} flex shrink-0 items-center justify-center overflow-hidden border border-stone-200 bg-white shadow-sm`;
  const source = sources[sourceIndex];

  if (source) {
    return (
      <div className={boxClass} title={name}>
        <img
          src={source}
          alt={`${name} logo`}
          className="h-full w-full object-contain"
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setSourceIndex((value) => value + 1)}
        />
      </div>
    );
  }

  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  const icon = category === 'delivery'
    ? <Package className="h-4 w-4" />
    : category === 'mobility'
      ? <Car className="h-4 w-4" />
      : category === 'banking'
        ? <Building2 className="h-4 w-4" />
        : category === 'payments'
          ? <CreditCard className="h-4 w-4" />
          : <FileText className="h-4 w-4" />;

  return (
    <div className={`${boxClass} bg-[#F5F0E7] text-[#2E5A44]`} title={`${name}: marca no incluida en el paquete local`}>
      <div className="flex flex-col items-center gap-0.5">
        {icon}
        <span className="text-[9px] font-black tracking-wide">{initials}</span>
      </div>
    </div>
  );
};

export default LogoResolver;
