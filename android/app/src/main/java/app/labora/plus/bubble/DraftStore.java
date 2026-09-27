package app.labora.plus.bubble;

/**
 * Borrador del último aviso de oferta (importe/km). SOLO en memoria: nunca se guarda en disco ni se sube.
 * Caduca a los 10 minutos. El texto bruto de la notificación no se conserva.
 */
public final class DraftStore {
    private DraftStore() {}

    public static final long TTL_MS = 10 * 60 * 1000L;

    public static final class Draft {
        public final String platform;
        public final Double amount;
        public final Double km;
        public final long createdAt;
        Draft(String platform, Double amount, Double km, long createdAt) {
            this.platform = platform; this.amount = amount; this.km = km; this.createdAt = createdAt;
        }
    }

    public interface Listener { void onDraft(Draft draft); }

    private static Draft current;
    private static Listener listener;

    public static synchronized void put(String platform, Double amount, Double km, long now) {
        current = new Draft(platform, amount, km, now);
        if (listener != null) listener.onDraft(current);
    }

    public static synchronized Draft get(long now) {
        if (current != null && now - current.createdAt > TTL_MS) current = null;
        return current;
    }

    public static synchronized void clear() {
        current = null;
        if (listener != null) listener.onDraft(null);
    }

    public static synchronized void setListener(Listener l) { listener = l; }
}
