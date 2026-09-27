package app.labora.plus.bubble;

/**
 * Únicas apps cuyas notificaciones se procesan (flavour labs, y solo si el rider lo activa).
 * Paquetes verificados en Google Play (27-09-2026):
 *  - com.ubercab.driver        «Uber Driver» (la usan también los repartidores de Uber Eats) → activo por defecto al activar el asistente
 *  - com.logistics.rider.glovo «Glovo Rider for Couriers» → SOLO si el rider activa Glovo aparte (riesgo laboral en España)
 *  - com.glovoapp.courier      «Glovo Couriers» (app anterior) → igual que Glovo
 * Los nombres se usan solo de forma descriptiva (sin logos).
 */
public final class PlatformAllowlist {
    private PlatformAllowlist() {}

    public static final String UBER_DRIVER = "com.ubercab.driver";
    public static final String GLOVO_RIDER = "com.logistics.rider.glovo";
    public static final String GLOVO_COURIERS_LEGACY = "com.glovoapp.courier";

    public static boolean isGlovo(String pkg) { return GLOVO_RIDER.equals(pkg) || GLOVO_COURIERS_LEGACY.equals(pkg); }

    public static boolean isAllowed(String pkg, boolean glovoEnabled) {
        if (pkg == null) return false;
        if (UBER_DRIVER.equals(pkg)) return true;
        return glovoEnabled && isGlovo(pkg);
    }

    /** Nombre descriptivo para el borrador, o null si no está en la lista. */
    public static String platformFor(String pkg) {
        if (UBER_DRIVER.equals(pkg)) return "Uber Eats";
        if (isGlovo(pkg)) return "Glovo";
        return null;
    }
}
