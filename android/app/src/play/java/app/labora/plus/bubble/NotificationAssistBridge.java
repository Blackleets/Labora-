package app.labora.plus.bubble;

import android.content.Context;
import android.content.Intent;

/**
 * Flavour «play»: SIN lectura de notificaciones. No hay NotificationListenerService en el manifiesto ni en el código.
 * Todos los métodos son no-op para que el plugin compile igual en ambos flavours.
 */
public final class NotificationAssistBridge {
    private NotificationAssistBridge() {}
    public static boolean isSupported() { return false; }
    public static boolean isAccessGranted(Context c) { return false; }
    public static void setComponentEnabled(Context c, boolean enabled) { /* no existe en play */ }
    public static Intent settingsIntent(Context c) { return null; }
}
