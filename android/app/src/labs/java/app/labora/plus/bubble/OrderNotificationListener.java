package app.labora.plus.bubble;

import android.app.Notification;
import android.os.Bundle;
import android.service.notification.NotificationListenerService;
import android.service.notification.StatusBarNotification;

/**
 * SOLO flavour «labs» (fuera de Play). OPT-IN: el componente está deshabilitado en el manifiesto hasta el consentimiento.
 *
 * Privacidad (docs/LEGAL_PLAY_ORDER_BUBBLE.md §3.1):
 *  - Se descarta todo paquete fuera de la lista ANTES de leer extras. Uber por defecto; Glovo solo si el rider lo activa aparte.
 *  - Solo se leen título y texto; se parsean en el dispositivo y se descartan en el acto (no se guardan en campos,
 *    disco, logs, crash reports ni red). Solo queda un borrador en memoria con importe/km.
 *  - NUNCA se registra el texto en Logcat. No hay ninguna llamada a Log en esta clase.
 *  - No responde, no pulsa acciones, no descarta ni modifica notificaciones, no interactúa con la app de la plataforma.
 */
public class OrderNotificationListener extends NotificationListenerService {
    @Override
    public void onNotificationPosted(StatusBarNotification sbn) {
        if (sbn == null) return;
        final String pkg = sbn.getPackageName();
        final boolean assist, glovo;
        try {
            assist = SecureStore.notificationAssist(this);
            glovo = SecureStore.glovoAssist(this);
        } catch (Exception e) {
            return; // sin almacén cifrado: no procesar
        }
        if (!assist || !PlatformAllowlist.isAllowed(pkg, glovo)) return;
        Notification n = sbn.getNotification();
        if (n == null || n.extras == null) return;
        OfferParser.Result r = parseAndDiscard(n.extras);
        if (r.isEmpty()) return;
        DraftStore.put(PlatformAllowlist.platformFor(pkg), r.amount, r.km, System.currentTimeMillis());
    }

    /** Lee título/texto en variables locales, parsea y no conserva nada más que importe/km. */
    private static OfferParser.Result parseAndDiscard(Bundle extras) {
        CharSequence title = extras.getCharSequence(Notification.EXTRA_TITLE);
        CharSequence text = extras.getCharSequence(Notification.EXTRA_BIG_TEXT);
        if (text == null) text = extras.getCharSequence(Notification.EXTRA_TEXT);
        OfferParser.Result result = OfferParser.parse(title == null ? null : title.toString(), text == null ? null : text.toString());
        title = null; // descarte explícito: no se guarda en ningún sitio
        text = null;
        return result;
    }
}
