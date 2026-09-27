package app.labora.plus.bubble;

import android.Manifest;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;

import androidx.core.app.NotificationManagerCompat;
import androidx.core.content.ContextCompat;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@CapacitorPlugin(
    name = "LaboraBubble",
    permissions = { @Permission(alias = "notifications", strings = { Manifest.permission.POST_NOTIFICATIONS }) }
)
public class LaboraBubblePlugin extends Plugin {
    private static LaboraBubblePlugin instance;
    private final ExecutorService io = Executors.newSingleThreadExecutor();

    @Override public void load() { instance = this; }

    @Override protected void handleOnDestroy() { if (instance == this) instance = null; super.handleOnDestroy(); }

    static void notifySynced(OrderSync.Result r) {
        LaboraBubblePlugin p = instance;
        if (p == null) return;
        JSObject data = new JSObject();
        data.put("uploaded", r.uploaded);
        data.put("pending", r.pending);
        data.put("dropped", r.dropped);
        data.put("needsSession", r.needsSession);
        p.notifyListeners("ordersSynced", data);
    }

    private Context ctx() { return getContext().getApplicationContext(); }


    @PluginMethod
    public void getStatus(PluginCall call) {
        JSObject r = new JSObject();
        r.put("available", true);
        r.put("overlayGranted", Settings.canDrawOverlays(ctx()));
        r.put("running", BubbleService.isRunning());
        r.put("notificationsGranted", NotificationManagerCompat.from(ctx()).areNotificationsEnabled());
        boolean supported = NotificationAssistBridge.isSupported();
        boolean assist = false, glovo = false;
        int queued = 0;
        try {
            queued = SecureStore.queue(ctx()).size();
            if (supported) { assist = SecureStore.notificationAssist(ctx()); glovo = SecureStore.glovoAssist(ctx()); }
        } catch (Exception ignored) {}
        r.put("notificationAssistSupported", supported);
        r.put("notificationAssistEnabled", assist);
        r.put("glovoAssistEnabled", glovo);
        r.put("notificationAccessGranted", supported && NotificationAssistBridge.isAccessGranted(ctx()));
        r.put("inactivityMinutes", BubbleService.INACTIVITY_MS / 60000);
        r.put("queued", queued);
        call.resolve(r);
    }

    @PluginMethod
    public void openOverlaySettings(PluginCall call) {
        Intent i = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION, Uri.parse("package:" + ctx().getPackageName()));
        i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        getContext().startActivity(i);
        call.resolve();
    }

    @PluginMethod
    public void openNotificationAccessSettings(PluginCall call) {
        Intent i = NotificationAssistBridge.settingsIntent(ctx());
        if (i == null) { call.reject("not_supported"); return; }
        i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        try { getContext().startActivity(i); }
        catch (Exception e) {
            getContext().startActivity(new Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));
        }
        call.resolve();
    }

    /** El web pasa el JWT de la sesión (access token). Se guarda cifrado. Nunca refresh token ni service key. */
    @PluginMethod
    public void setSession(PluginCall call) {
        String url = call.getString("supabaseUrl");
        String anon = call.getString("anonKey");
        String token = call.getString("accessToken");
        String userId = call.getString("userId");
        Long expiresAt = call.getLong("expiresAtMs");
        if (url == null || !url.startsWith("https://") || anon == null || token == null || userId == null || expiresAt == null) {
            call.reject("Sesión incompleta");
            return;
        }
        try { SecureStore.saveSession(ctx(), url, anon, token, userId, expiresAt); }
        catch (Exception e) { call.reject("Almacén cifrado no disponible"); return; }
        call.resolve();
        flushInBackground();
    }

    @PluginMethod
    public void clearSession(PluginCall call) {
        try { SecureStore.clearSession(ctx()); } catch (Exception ignored) {}
        if (BubbleService.isRunning()) ctx().startService(new Intent(ctx(), BubbleService.class).setAction(BubbleService.ACTION_STOP));
        call.resolve();
    }

    @PluginMethod
    public void flushQueue(PluginCall call) {
        io.execute(() -> {
            OrderSync.Result r = OrderSync.flush(ctx());
            JSObject data = new JSObject();
            data.put("uploaded", r.uploaded);
            data.put("pending", r.pending);
            data.put("dropped", r.dropped);
            data.put("needsSession", r.needsSession);
            call.resolve(data);
        });
    }

    private void flushInBackground() {
        io.execute(() -> {
            OrderSync.Result r = OrderSync.flush(ctx());
            if (r.uploaded > 0 || r.dropped > 0) notifySynced(r);
            if (BubbleService.isRunning()) ctx().startService(new Intent(ctx(), BubbleService.class).setAction(BubbleService.ACTION_REFRESH));
        });
    }

    @PluginMethod
    public void start(PluginCall call) {
        JSArray platforms = call.getArray("platforms");
        try {
            if (platforms != null && platforms.length() > 0) {
                StringBuilder sb = new StringBuilder();
                for (int i = 0; i < platforms.length() && i < 12; i++) {
                    String p = platforms.getString(i).replace("|", " ").trim();
                    if (p.isEmpty() || p.length() > 60) continue;
                    if (sb.length() > 0) sb.append('|');
                    sb.append(p);
                }
                if (sb.length() > 0) SecureStore.setPlatforms(ctx(), sb.toString());
            }
        } catch (Exception ignored) {}
        if (!Settings.canDrawOverlays(ctx())) { call.reject("overlay_permission_missing"); return; }
        if (Build.VERSION.SDK_INT >= 33 && getPermissionState("notifications") != PermissionState.GRANTED) {
            requestPermissionForAlias("notifications", call, "afterNotificationPermission");
            return;
        }
        startService(call);
    }

    @PermissionCallback
    private void afterNotificationPermission(PluginCall call) {
        // Aunque se deniegue, el servicio funciona; solo no se verá la notificación con acciones.
        startService(call);
    }

    private void startService(PluginCall call) {
        Intent i = new Intent(ctx(), BubbleService.class).setAction(BubbleService.ACTION_START);
        ContextCompat.startForegroundService(ctx(), i);
        call.resolve();
    }

    @PluginMethod
    public void stop(PluginCall call) {
        if (BubbleService.isRunning()) ctx().startService(new Intent(ctx(), BubbleService.class).setAction(BubbleService.ACTION_STOP));
        call.resolve();
    }

    /** Consentimiento de lectura de notificaciones (solo flavour labs). Activa/desactiva además el componente del listener. */
    @PluginMethod
    public void setNotificationAssist(PluginCall call) {
        if (!NotificationAssistBridge.isSupported()) { call.reject("not_supported"); return; }
        boolean enabled = Boolean.TRUE.equals(call.getBoolean("enabled", false));
        try {
            SecureStore.setNotificationAssist(ctx(), enabled);
            if (!enabled) SecureStore.setGlovoAssist(ctx(), false);
        } catch (Exception e) { call.reject("Almacén cifrado no disponible"); return; }
        NotificationAssistBridge.setComponentEnabled(ctx(), enabled);
        if (!enabled) DraftStore.clear(); // borrar borradores pendientes al revocar
        call.resolve();
    }

    /** Glovo: apagado salvo activación explícita aparte (riesgo laboral para riders asalariados en España). */
    @PluginMethod
    public void setGlovoAssist(PluginCall call) {
        if (!NotificationAssistBridge.isSupported()) { call.reject("not_supported"); return; }
        boolean enabled = Boolean.TRUE.equals(call.getBoolean("enabled", false));
        try {
            if (enabled && !SecureStore.notificationAssist(ctx())) { call.reject("assist_disabled"); return; }
            SecureStore.setGlovoAssist(ctx(), enabled);
        } catch (Exception e) { call.reject("Almacén cifrado no disponible"); return; }
        if (!enabled) DraftStore.clear();
        call.resolve();
    }
}
