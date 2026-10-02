import React, { useState } from 'react';
import { resolveMerchantBrand, type MerchantBrand } from '../services/merchantBrands';
import { withBaseUrl } from './brandMarks';

interface MerchantLogoProps {
  merchant?: string | null;
  fallback?: React.ReactNode;
}

const BrandImage: React.FC<{ brand?: MerchantBrand; fallback?: React.ReactNode }> = ({ brand, fallback }) => {
  const [failed, setFailed] = useState(false);
  const showImage = brand && !failed;
  return (
    <span
      className="flex h-[42px] w-[42px] shrink-0 items-center justify-center overflow-hidden rounded-[14px] border border-[var(--labora-border)] bg-[var(--labora-surface)] p-1.5 text-[var(--labora-muted)]"
      title={brand ? `${brand.name}${failed ? ': imagen no disponible' : ' · marca reconocida'}` : 'Comercio sin marca identificada'}
    >
      {showImage ? <img
        src={withBaseUrl(`brand/merchants/${brand.asset}`)}
        alt={`Identificador de ${brand.name}`}
        className="h-full w-full object-contain"
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
      /> : fallback || <span aria-label={brand ? `${brand.name}: imagen no disponible` : 'Sin marca identificada'} className="text-xs font-extrabold">{brand?.name.slice(0, 2).toUpperCase() || '?'}</span>}
    </span>
  );
};

/** A new identity gets fresh error state; an old image event cannot hide a new mark. */
const MerchantLogo: React.FC<MerchantLogoProps> = ({ merchant, fallback }) => {
  const brand = resolveMerchantBrand(merchant);
  return <BrandImage key={brand?.id || 'unknown'} brand={brand} fallback={fallback} />;
};

export const MerchantBrandPreview: React.FC<{ merchant?: string | null }> = ({ merchant }) => {
  const brand = resolveMerchantBrand(merchant);
  if (!brand) return null;
  return <div className="mt-2 flex items-center gap-2.5">
    <MerchantLogo merchant={merchant} />
    <p className="text-xs text-[var(--labora-muted)]"><span className="font-bold text-[var(--labora-ink)]">{brand.name}</span><br />Marca reconocida · conserva el nombre del ticket</p>
  </div>;
};

export default MerchantLogo;
