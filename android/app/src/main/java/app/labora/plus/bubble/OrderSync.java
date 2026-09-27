package app.labora.plus.bubble;

import android.content.Context;
import android.util.Log;

import java.util.ArrayList;
import java.util.List;

/** Sube la cola offline. Solo pedidos del usuario de la sesión actual. Llamar fuera del hilo principal. */
public final class OrderSync {
    private OrderSync() {}

    public static final class Result {
        public int uploaded, pending, dropped;
        public boolean needsSession;
    }

    public static synchronized Result flush(Context c) {
        Result result = new Result();
        List<PendingOrder> queue = SecureStore.queue(c);
        if (queue.isEmpty()) return result;
        SecureStore.Session s = SecureStore.session(c);
        if (s == null || !s.isUsable(System.currentTimeMillis())) {
            result.pending = queue.size();
            result.needsSession = true;
            return result;
        }
        List<PendingOrder> remaining = new ArrayList<>();
        boolean stop = false;
        for (PendingOrder order : queue) {
            if (stop || order.userId == null || !order.userId.equals(s.userId)) { remaining.add(order); continue; }
            OrderApi.Outcome outcome = OrderApi.insert(s, order);
            switch (outcome) {
                case OK: result.uploaded++; break;
                case REJECTED: result.dropped++; Log.w("LaboraBubble", "Pedido rechazado por el servidor; descartado"); break;
                case AUTH: result.needsSession = true; remaining.add(order); stop = true; break;
                default: remaining.add(order); stop = true; break;
            }
        }
        SecureStore.saveQueue(c, remaining);
        result.pending = remaining.size();
        return result;
    }
}
