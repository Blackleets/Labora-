/**
 * Spanish fail-closed send error. Never claims the message was queued for later.
 */
export const messagingSendErrorEs = (error?: unknown): string => {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return 'Sin conexión. El mensaje no se envió; no se ha encolado para envío posterior.';
  }
  const raw =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : (error as { message?: string } | null | undefined)?.message || '';
  if (/failed to fetch|networkerror|network request failed|load failed|err_internet|offline/i.test(String(raw))) {
    return 'No hay red o el servidor no responde. El mensaje no se envió; no se ha encolado.';
  }
  const trimmed = String(raw || '').trim();
  if (trimmed && !/^\[object\s/i.test(trimmed)) return trimmed;
  return 'No se pudo enviar el mensaje.';
};
