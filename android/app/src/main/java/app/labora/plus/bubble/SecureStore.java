package app.labora.plus.bubble;

import android.content.Context;
import android.content.SharedPreferences;
import android.util.Log;

import androidx.security.crypto.EncryptedSharedPreferences;
import androidx.security.crypto.MasterKey;

import java.util.ArrayList;
import java.util.List;

/**
 * Almacén cifrado (EncryptedSharedPreferences, clave en Android Keystore):
 * JWT de sesión (access token, NO refresh token), cola offline y preferencias de la burbuja.
 * Nunca se guarda la service key (no existe en la app).
 */
public final class SecureStore {
    private static final String TAG = "LaboraBubble";
    private static final String FILE = "labora_bubble_secure";
    private static SharedPreferences prefs;

    private SecureStore() {}

    public static synchronized SharedPreferences prefs(Context context) {
        if (prefs != null) return prefs;
        try {
            MasterKey key = new MasterKey.Builder(context.getApplicationContext())
                .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
                .build();
            prefs = EncryptedSharedPreferences.create(
                context.getApplicationContext(), FILE, key,
                EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
                EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM);
        } catch (Exception e) {
            // Sin almacén cifrado no guardamos la sesión: fallar cerrado.
            Log.e(TAG, "EncryptedSharedPreferences no disponible", e);
            throw new IllegalStateException("Almacén cifrado no disponible", e);
        }
        return prefs;
    }

    // --- Sesión ---
    public static final class Session {
        public final String supabaseUrl, anonKey, accessToken, userId;
        public final long expiresAtMs;
        Session(String supabaseUrl, String anonKey, String accessToken, String userId, long expiresAtMs) {
            this.supabaseUrl = supabaseUrl; this.anonKey = anonKey; this.accessToken = accessToken; this.userId = userId; this.expiresAtMs = expiresAtMs;
        }
        public boolean isUsable(long now) { return accessToken != null && !accessToken.isEmpty() && expiresAtMs - 30_000 > now; }
    }

    public static void saveSession(Context c, String url, String anonKey, String accessToken, String userId, long expiresAtMs) {
        prefs(c).edit()
            .putString("url", url).putString("anon", anonKey)
            .putString("jwt", accessToken).putString("uid", userId)
            .putLong("exp", expiresAtMs).apply();
    }

    public static Session session(Context c) {
        SharedPreferences p = prefs(c);
        String jwt = p.getString("jwt", null);
        if (jwt == null) return null;
        return new Session(p.getString("url", null), p.getString("anon", null), jwt, p.getString("uid", null), p.getLong("exp", 0));
    }

    public static void clearSession(Context c) {
        prefs(c).edit().remove("jwt").remove("uid").remove("exp").apply();
    }

    // --- Cola offline ---
    public static synchronized List<PendingOrder> queue(Context c) {
        return PendingOrder.listFromJson(prefs(c).getString("queue", "[]"));
    }

    public static synchronized void saveQueue(Context c, List<PendingOrder> orders) {
        try {
            prefs(c).edit().putString("queue", PendingOrder.listToJson(orders)).apply();
        } catch (Exception e) {
            Log.e(TAG, "No se pudo guardar la cola", e);
        }
    }

    public static synchronized void enqueue(Context c, PendingOrder order) {
        List<PendingOrder> q = new ArrayList<>(queue(c));
        q.add(order);
        saveQueue(c, q);
    }

    // --- Preferencias ---
    public static void setPlatforms(Context c, String csv) { prefs(c).edit().putString("platforms", csv).apply(); }
    public static String platforms(Context c) { return prefs(c).getString("platforms", "Uber Eats|Glovo|Just Eat"); }
    public static void setLastPlatform(Context c, String p) { prefs(c).edit().putString("last_platform", p).apply(); }
    public static String lastPlatform(Context c) { return prefs(c).getString("last_platform", null); }
    public static void setNotificationAssist(Context c, boolean on) { prefs(c).edit().putBoolean("notif_assist", on).apply(); }
    public static boolean notificationAssist(Context c) { return prefs(c).getBoolean("notif_assist", false); }
    public static void setGlovoAssist(Context c, boolean on) { prefs(c).edit().putBoolean("glovo_assist", on).apply(); }
    public static boolean glovoAssist(Context c) { return prefs(c).getBoolean("glovo_assist", false); }
    public static void setBubbleX(Context c, int side, int y) { prefs(c).edit().putInt("bubble_side", side).putInt("bubble_y", y).apply(); }
    public static int bubbleSide(Context c) { return prefs(c).getInt("bubble_side", 1); }
    public static int bubbleY(Context c) { return prefs(c).getInt("bubble_y", 400); }
}
