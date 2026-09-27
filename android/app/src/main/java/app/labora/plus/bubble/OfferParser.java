package app.labora.plus.bubble;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Extrae importe (€) y distancia (km) del TÍTULO y TEXTO de una notificación.
 * Nunca inventa: si no hay un valor claro (o hay varios ambiguos sin palabra clave), deja el campo en null.
 * Clase pura (sin Android) para poder testearla con JUnit.
 */
public final class OfferParser {
    private OfferParser() {}

    public static final class Result {
        public final Double amount;
        public final Double km;
        Result(Double amount, Double km) { this.amount = amount; this.km = km; }
        public boolean isEmpty() { return amount == null && km == null; }
    }

    // 4,50 € · 4.50€ · 12 € · € 4,50 · 4,50 EUR · EUR 4.50
    private static final Pattern EURO_AFTER = Pattern.compile("(?<![\\d.,])(\\d{1,4}(?:[.,]\\d{1,2})?)\\s?(?:€|eur\\b|euros?\\b)", Pattern.CASE_INSENSITIVE);
    private static final Pattern EURO_BEFORE = Pattern.compile("(?<!\\d)(?<!\\d\\s)(?:€|\\beur\\b)\\s?(\\d{1,4}(?:[.,]\\d{1,2})?)(?![\\d])", Pattern.CASE_INSENSITIVE);
    // 3,2 km · 3.2km · 12 kms · 800 m
    private static final Pattern KM = Pattern.compile("(?<![\\d.,])(\\d{1,3}(?:[.,]\\d{1,2})?)\\s?(?:km|kms|kilómetros|kilometros)\\b", Pattern.CASE_INSENSITIVE);
    private static final Pattern METERS = Pattern.compile("(?<![\\d.,])(\\d{2,4})\\s?(?:m|metros)\\b(?!\\s?in)", Pattern.CASE_INSENSITIVE);

    private static final String[] AMOUNT_KEYWORDS = {"total", "ganancia", "ganas", "gana", "pago", "tarifa", "estimad", "earn", "fare"};
    private static final String[] KM_KEYWORDS = {"total", "recorrido", "trayecto", "distancia"};

    public static Result parse(String title, String text) {
        String joined = ((title == null ? "" : title) + "\n" + (text == null ? "" : text)).trim();
        if (joined.isEmpty()) return new Result(null, null);
        return new Result(pickAmount(joined), pickKm(joined));
    }

    static Double toNumber(String raw) {
        if (raw == null) return null;
        String value = raw.trim().replace(',', '.');
        try {
            double parsed = Double.parseDouble(value);
            if (Double.isNaN(parsed) || Double.isInfinite(parsed) || parsed < 0) return null;
            return Math.round(parsed * 100.0) / 100.0;
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private static final class Hit {
        final double value; final int start;
        Hit(double value, int start) { this.value = value; this.start = start; }
    }

    private static List<Hit> collect(Pattern pattern, String input) {
        List<Hit> hits = new ArrayList<>();
        Matcher m = pattern.matcher(input);
        while (m.find()) {
            Double value = toNumber(m.group(1));
            if (value != null) hits.add(new Hit(value, m.start()));
        }
        return hits;
    }

    private static Double choose(List<Hit> hits, String input, String[] keywords) {
        if (hits.isEmpty()) return null;
        Set<Double> distinct = new LinkedHashSet<>();
        for (Hit h : hits) distinct.add(h.value);
        if (distinct.size() == 1) return distinct.iterator().next();
        // Varios valores distintos: solo aceptamos uno si va precedido (en la misma línea, cerca) de una palabra clave.
        String lower = input.toLowerCase(Locale.ROOT);
        Double keyed = null;
        for (Hit h : hits) {
            int lineStart = lower.lastIndexOf('\n', Math.max(0, h.start - 1)) + 1;
            String before = lower.substring(Math.max(lineStart, h.start - 24), h.start);
            for (String k : keywords) {
                if (before.contains(k)) {
                    if (keyed != null && keyed != h.value) return null; // dos claves distintas: ambiguo
                    keyed = h.value;
                }
            }
        }
        return keyed;
    }

    private static Double pickAmount(String input) {
        List<Hit> hits = collect(EURO_AFTER, input);
        hits.addAll(collect(EURO_BEFORE, input));
        Double value = choose(hits, input, AMOUNT_KEYWORDS);
        return value != null && value > 0 && value <= 1000 ? value : null;
    }

    private static Double pickKm(String input) {
        List<Hit> hits = collect(KM, input);
        if (hits.isEmpty()) {
            List<Hit> meters = collect(METERS, input);
            List<Hit> asKm = new ArrayList<>();
            for (Hit h : meters) asKm.add(new Hit(Math.round(h.value / 10.0) / 100.0, h.start));
            hits = asKm;
        }
        Double value = choose(hits, input, KM_KEYWORDS);
        return value != null && value > 0 && value <= 500 ? value : null;
    }
}
