package app.labora.plus.bubble;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

/**
 * REST mínimo contra Supabase PostgREST con el JWT del rider (RLS owner-only). Sin service key.
 * Llamar SIEMPRE fuera del hilo principal.
 */
public final class OrderApi {
    private OrderApi() {}

    public enum Outcome { OK, RETRY, AUTH, REJECTED }

    public static Outcome insert(SecureStore.Session s, PendingOrder order) {
        HttpURLConnection conn = null;
        try {
            conn = open(s, "/rest/v1/delivery_orders", "POST");
            conn.setRequestProperty("Content-Type", "application/json");
            conn.setRequestProperty("Prefer", "return=minimal");
            conn.setDoOutput(true);
            byte[] body = order.toRestBody().toString().getBytes(StandardCharsets.UTF_8);
            try (OutputStream out = conn.getOutputStream()) { out.write(body); }
            int code = conn.getResponseCode();
            return classify(code);
        } catch (Exception e) {
            return Outcome.RETRY; // sin red, timeout, DNS…
        } finally {
            if (conn != null) conn.disconnect();
        }
    }

    static Outcome classify(int code) {
        if (code >= 200 && code < 300) return Outcome.OK;
        if (code == 409) return Outcome.OK; // mismo id ya insertado (reintento): idempotente
        if (code == 401 || code == 403) return Outcome.AUTH;
        if (code == 408 || code == 429 || code >= 500) return Outcome.RETRY;
        return Outcome.REJECTED; // 400/422: datos inválidos, no reintentar en bucle
    }

    /** Resumen de hoy (aceptados, € de aceptados, rechazados) desde medianoche local. null si falla. */
    public static double[] todaySummary(SecureStore.Session s, String sinceIso) {
        HttpURLConnection conn = null;
        try {
            String path = "/rest/v1/delivery_orders?select=status,amount&occurred_at=gte." + URLEncoder.encode(sinceIso, "UTF-8");
            conn = open(s, path, "GET");
            if (conn.getResponseCode() != 200) return null;
            StringBuilder sb = new StringBuilder();
            try (InputStream in = conn.getInputStream(); BufferedReader r = new BufferedReader(new InputStreamReader(in, StandardCharsets.UTF_8))) {
                String line;
                while ((line = r.readLine()) != null) sb.append(line);
            }
            JSONArray rows = new JSONArray(sb.toString());
            double accepted = 0, euros = 0, rejected = 0;
            for (int i = 0; i < rows.length(); i++) {
                JSONObject row = rows.getJSONObject(i);
                if ("accepted".equals(row.optString("status"))) {
                    accepted++;
                    euros += row.isNull("amount") ? 0 : row.optDouble("amount", 0);
                } else rejected++;
            }
            return new double[]{accepted, euros, rejected};
        } catch (Exception e) {
            return null;
        } finally {
            if (conn != null) conn.disconnect();
        }
    }

    private static HttpURLConnection open(SecureStore.Session s, String path, String method) throws Exception {
        if (s.supabaseUrl == null || !s.supabaseUrl.startsWith("https://")) throw new IllegalStateException("URL no válida");
        HttpURLConnection conn = (HttpURLConnection) new URL(s.supabaseUrl + path).openConnection();
        conn.setRequestMethod(method);
        conn.setConnectTimeout(8000);
        conn.setReadTimeout(10000);
        conn.setRequestProperty("apikey", s.anonKey);
        conn.setRequestProperty("Authorization", "Bearer " + s.accessToken);
        conn.setRequestProperty("Accept", "application/json");
        return conn;
    }
}
