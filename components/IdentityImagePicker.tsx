import React, { useRef, useState } from 'react';
import { Building2, Camera, ImagePlus, Trash2, UserRound } from 'lucide-react';

type IdentityMode = 'avatar' | 'logo';

interface IdentityImagePickerProps {
  mode: IdentityMode;
  value?: string;
  onChange: (dataUrl?: string) => void;
  title?: string;
  helper?: string;
  compact?: boolean;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const readImage = (file: File): Promise<HTMLImageElement> => new Promise((resolve, reject) => {
  const url = URL.createObjectURL(file);
  const image = new Image();
  image.onload = () => {
    URL.revokeObjectURL(url);
    resolve(image);
  };
  image.onerror = () => {
    URL.revokeObjectURL(url);
    reject(new Error('No se pudo leer la imagen.'));
  };
  image.src = url;
});

const prepareImage = async (file: File, mode: IdentityMode): Promise<string> => {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    throw new Error('Usa una imagen JPG, PNG o WebP.');
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('La imagen no puede superar 5 MB.');
  }

  const image = await readImage(file);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No se pudo preparar la imagen.');

  if (mode === 'avatar') {
    const outputSize = 512;
    canvas.width = outputSize;
    canvas.height = outputSize;

    const sourceSize = Math.min(image.naturalWidth, image.naturalHeight);
    const sx = (image.naturalWidth - sourceSize) / 2;
    const sy = (image.naturalHeight - sourceSize) / 2;
    ctx.drawImage(image, sx, sy, sourceSize, sourceSize, 0, 0, outputSize, outputSize);
  } else {
    const maxWidth = 800;
    const maxHeight = 400;
    const scale = Math.min(maxWidth / image.naturalWidth, maxHeight / image.naturalHeight, 1);
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));
    canvas.width = width;
    canvas.height = height;
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(image, 0, 0, width, height);
  }

  return canvas.toDataURL('image/webp', 0.86);
};

const IdentityImagePicker: React.FC<IdentityImagePickerProps> = ({
  mode,
  value,
  onChange,
  title,
  helper,
  compact = false
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleFile = async (file?: File) => {
    if (!file) return;
    setError('');
    setBusy(true);
    try {
      const dataUrl = await prepareImage(file, mode);
      onChange(dataUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar la imagen.');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const fallback = mode === 'logo' ? <Building2 size={compact ? 22 : 28} /> : <UserRound size={compact ? 22 : 28} />;
  const defaultTitle = mode === 'logo' ? 'Logo de la gestoría' : 'Foto de perfil';
  const defaultHelper = mode === 'logo'
    ? 'Se mostrará a tus clientes para identificar tu despacho.'
    : 'Se mostrará a tu gestor y en tus comunicaciones.';

  return (
    <div className={`rounded-2xl border border-[#E2DBD0] bg-white ${compact ? 'p-3.5' : 'p-4'}`}>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(event) => handleFile(event.target.files?.[0])}
      />

      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={`relative flex shrink-0 items-center justify-center overflow-hidden border border-[#D9D1C6] bg-[#F5F2ED] text-stone-400 transition hover:border-[#9EB5A6] ${
            mode === 'logo'
              ? compact ? 'h-14 w-20 rounded-xl' : 'h-16 w-24 rounded-2xl'
              : compact ? 'h-14 w-14 rounded-full' : 'h-16 w-16 rounded-full'
          }`}
          aria-label={value ? 'Cambiar imagen' : 'Añadir imagen'}
        >
          {value ? (
            <img
              src={value}
              alt="Identidad"
              className={`h-full w-full ${mode === 'logo' ? 'object-contain p-1.5' : 'object-cover'}`}
            />
          ) : fallback}
          <span className="absolute bottom-0 right-0 flex h-6 w-6 items-center justify-center rounded-full bg-[#2E5A44] text-white shadow-sm">
            <Camera size={12} />
          </span>
        </button>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-stone-900">{title || defaultTitle}</p>
          <p className="mt-1 text-[11px] leading-relaxed text-stone-500">{helper || defaultHelper}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#DCD4C9] bg-[#FCFBF8] px-2.5 py-1.5 text-[11px] font-semibold text-stone-600 hover:bg-[#F5F1EA] disabled:opacity-50"
            >
              <ImagePlus size={13} />
              {busy ? 'Procesando…' : value ? 'Cambiar' : 'Subir imagen'}
            </button>
            {value && (
              <button
                type="button"
                onClick={() => onChange(undefined)}
                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-[#9B493C] hover:bg-[#FFF3F0]"
              >
                <Trash2 size={13} />
                Quitar
              </button>
            )}
          </div>
        </div>
      </div>

      {error && <p className="mt-3 rounded-xl bg-[#FFF4F1] px-3 py-2 text-[11px] font-semibold text-[#944B3D]">{error}</p>}
    </div>
  );
};

export default IdentityImagePicker;
