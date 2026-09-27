package app.labora.plus.bubble;

import android.app.Notification;
import android.os.Bundle;
import android.service.notification.NotificationListenerService;
import android.service.notification.StatusBarNotification;

/**
 * OPT-IN (desactivado por defecto; el componente está deshabilitado en el manifiesto hasta que el rider da su consentimiento).
 * Solo mira notificaciones de la lista blanca (Uber Driver, Glovo Rider). Solo lee título y texto,
 * extrae importe/km y deja un BORRADOR en memoria. No guarda el texto, no responde, no pulsa acciones,
 * no descarta ni modifica notificaciones y no interactúa con la app de la plataforma.
 */
public class OrderNotificationListener extends NotificationListenerService {
    @Override
    public void onNotificationPosted(StatusBarNotification sbn) {
        if (sbn == null) return;
        String pkg = sbn.getPackageName();
        if (!PlatformAllowlist.isAllowed(pkg)) return;
        try {
            if (!SecureStore.notificationAssist(this)) return; // el rider lo ha desactivado
        } catch (Exception e) {
            return; // sin almacén cifrado: no procesar
        }
        Notification n = sbn.getNotification();
        if (n == null || n.extras == null) return;
        Bundle extras = n.extras;
        CharSequence title = extras.getCharSequence(Notification.EXTRA_TITLE);
        CharSequence text = extras.getCharSequence(Notification.EXTRA_BIG_TEXT);
        if (text == null) text = extras.getCharSequence(Notification.EXTRA_TEXT);
        OfferParser.Result r = OfferParser.parse(title == null ? null : title.toString(), text == null ? null : text.toString());
        if (r.isEmpty()) return;
        DraftStore.put(PlatformAllowlist.platformFor(pkg), r.amount, r.km, System.currentTimeMillis());
    }
}
