package app.labora.plus.bubble;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/** Pedido confirmado por el rider, pendiente de subir (o ya subido). Solo campos confirmados. */
public final class PendingOrder {
    public final String id;          // uuid generado en el móvil: reintentos idempotentes
    public final String userId;      // dueño de la sesión cuando se guardó
    public final String platform;
    public final String occurredAt;  // ISO-8601 UTC
    public final String status;      // accepted | rejected
    public final Double amount;
    public final Double km;
    public final String rejectReason; // too_far | low_pay | zone | other | null

    public PendingOrder(String id, String userId, String platform, String occurredAt, String status, Double amount, Double km, String rejectReason) {
        this.id = id;
        this.userId = userId;
        this.platform = platform;
        this.occurredAt = occurredAt;
        this.status = status;
        this.amount = amount;
        this.km = km;
        this.rejectReason = rejectReason;
    }

    public static PendingOrder create(String userId, String platform, String occurredAt, String status, Double amount, Double km, String rejectReason) {
        return new PendingOrder(UUID.randomUUID().toString(), userId, platform, occurredAt, status, amount, km, rejectReason);
    }

    /** Misma validación que la tabla (checks) y services/orderLog.ts. Devuelve null si es válido. */
    public String validate() {
        if (platform == null || platform.trim().isEmpty()) return "Elige una plataforma.";
        if (platform.trim().length() > 60) return "Nombre de plataforma demasiado largo.";
        if (!"accepted".equals(status) && !"rejected".equals(status)) return "Estado no válido.";
        if ("accepted".equals(status) && (amount == null || amount <= 0)) return "Pon el importe del pedido aceptado.";
        if (amount != null && (amount < 0 || amount > 100000)) return "Importe no válido.";
        if (km != null && (km < 0 || km > 1000)) return "Km no válidos.";
        if (rejectReason != null && !"rejected".equals(status)) return "El motivo solo aplica a rechazados.";
        return null;
    }

    /** Cuerpo para POST /rest/v1/delivery_orders. user_id lo pone la BD (default auth.uid(), RLS). */
    public JSONObject toRestBody() throws JSONException {
        JSONObject body = new JSONObject();
        body.put("id", id);
        body.put("platform", platform.trim());
        body.put("occurred_at", occurredAt);
        body.put("status", status);
        body.put("amount", amount == null ? JSONObject.NULL : amount);
        body.put("km", km == null ? JSONObject.NULL : km);
        body.put("reject_reason", rejectReason == null ? JSONObject.NULL : rejectReason);
        return body;
    }

    public JSONObject toJson() throws JSONException {
        JSONObject o = toRestBody();
        o.put("user_id", userId);
        return o;
    }

    public static PendingOrder fromJson(JSONObject o) {
        return new PendingOrder(
            o.optString("id"),
            o.optString("user_id"),
            o.optString("platform"),
            o.optString("occurred_at"),
            o.optString("status"),
            o.isNull("amount") ? null : o.optDouble("amount"),
            o.isNull("km") ? null : o.optDouble("km"),
            o.isNull("reject_reason") ? null : o.optString("reject_reason")
        );
    }

    public static String listToJson(List<PendingOrder> orders) throws JSONException {
        JSONArray array = new JSONArray();
        for (PendingOrder order : orders) array.put(order.toJson());
        return array.toString();
    }

    public static List<PendingOrder> listFromJson(String raw) {
        List<PendingOrder> out = new ArrayList<>();
        if (raw == null || raw.isEmpty()) return out;
        try {
            JSONArray array = new JSONArray(raw);
            for (int i = 0; i < array.length(); i++) out.add(fromJson(array.getJSONObject(i)));
        } catch (JSONException ignored) {
            // cola corrupta: se descarta en vez de romper el servicio
        }
        return out;
    }
}
