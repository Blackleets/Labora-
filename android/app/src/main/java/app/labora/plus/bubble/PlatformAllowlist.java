package app.labora.plus.bubble;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

/**
 * Únicas apps cuyas notificaciones se procesan (y solo si el rider lo activa).
 * Paquetes verificados en Google Play (27-09-2026):
 *  - com.ubercab.driver        «Uber Driver» (también la usan los repartidores de Uber Eats)
 *  - com.logistics.rider.glovo «Glovo Rider for Couriers» (app actual de repartidores)
 *  - com.glovoapp.courier      «Glovo Couriers» (app anterior, aún listada)
 */
public final class PlatformAllowlist {
    private PlatformAllowlist() {}

    private static final Map<String, String> PACKAGES;
    static {
        Map<String, String> map = new HashMap<>();
        map.put("com.ubercab.driver", "Uber Eats");
        map.put("com.logistics.rider.glovo", "Glovo");
        map.put("com.glovoapp.courier", "Glovo");
        PACKAGES = Collections.unmodifiableMap(map);
    }

    public static boolean isAllowed(String packageName) {
        return packageName != null && PACKAGES.containsKey(packageName);
    }

    /** Nombre de plataforma para el borrador, o null si no está permitido. */
    public static String platformFor(String packageName) {
        return packageName == null ? null : PACKAGES.get(packageName);
    }

    public static Map<String, String> all() { return PACKAGES; }
}
