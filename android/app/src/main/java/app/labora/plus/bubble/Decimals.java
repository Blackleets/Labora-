package app.labora.plus.bubble;

/** Lectura de importes/km escritos por el rider («4,50», «3.2»). Null si no es un número válido ≥ 0. */
public final class Decimals {
    private Decimals() {}

    public static Double parse(String raw) {
        if (raw == null) return null;
        String value = raw.trim().replace(',', '.');
        if (value.isEmpty()) return null;
        try {
            double parsed = Double.parseDouble(value);
            if (Double.isNaN(parsed) || Double.isInfinite(parsed) || parsed < 0) return null;
            return Math.round(parsed * 100.0) / 100.0;
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
