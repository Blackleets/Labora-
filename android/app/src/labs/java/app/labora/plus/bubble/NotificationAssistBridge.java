package app.labora.plus.bubble;

import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Build;
import android.provider.Settings;

import androidx.core.app.NotificationManagerCompat;

/** Flavour «labs» (fuera de Play): lectura opcional de notificaciones, desactivada por defecto. */
public final class NotificationAssistBridge {
    private NotificationAssistBridge() {}

    public static boolean isSupported() { return true; }

    private static ComponentName component(Context c) { return new ComponentName(c, OrderNotificationListener.class); }

    public static boolean isAccessGranted(Context c) {
        return NotificationManagerCompat.getEnabledListenerPackages(c).contains(c.getPackageName());
    }

    /** El componente está deshabilitado en el manifiesto; solo se habilita tras el consentimiento. */
    public static void setComponentEnabled(Context c, boolean enabled) {
        c.getPackageManager().setComponentEnabledSetting(component(c),
            enabled ? PackageManager.COMPONENT_ENABLED_STATE_ENABLED : PackageManager.COMPONENT_ENABLED_STATE_DISABLED,
            PackageManager.DONT_KILL_APP);
    }

    public static Intent settingsIntent(Context c) {
        Intent i;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            i = new Intent(Settings.ACTION_NOTIFICATION_LISTENER_DETAIL_SETTINGS);
            i.putExtra(Settings.EXTRA_NOTIFICATION_LISTENER_COMPONENT_NAME, component(c).flattenToString());
        } else {
            i = new Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS);
        }
        return i;
    }
}
