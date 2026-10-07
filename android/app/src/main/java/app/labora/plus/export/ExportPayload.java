package app.labora.plus.export;

/** Pure validation, also exercised by JVM tests. No filesystem paths or remote URLs accepted. */
final class ExportPayload {
    static final int MAX_BYTES = 10 * 1024 * 1024;

    static void validate(String filename, String mimeType, String base64) {
        String extension = "text/csv".equals(mimeType) ? ".csv" : "application/pdf".equals(mimeType) ? ".pdf" : null;
        if (extension == null || filename == null || filename.trim().isEmpty() || filename.length() > 180
            || !filename.toLowerCase(java.util.Locale.ROOT).endsWith(extension) || filename.equals(extension)
            || filename.matches("(?s).*[\\\\/\\x00-\\x1f\\x7f].*")) {
            throw new IllegalArgumentException("invalid_export");
        }
        if (base64 == null || base64.isEmpty() || base64.length() > ((MAX_BYTES + 2) / 3) * 4
            || base64.length() % 4 != 0 || !validBase64(base64)) {
            throw new IllegalArgumentException("invalid_export");
        }
        int padding = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0;
        int size = base64.length() / 4 * 3 - padding;
        if (size < 1 || size > MAX_BYTES) throw new IllegalArgumentException("export_too_large");
    }

    private static boolean validBase64(String value) {
        int end = value.length();
        if (value.endsWith("==")) end -= 2;
        else if (value.endsWith("=")) end--;
        for (int i = 0; i < end; i++) {
            char c = value.charAt(i);
            if (!(c >= 'A' && c <= 'Z') && !(c >= 'a' && c <= 'z') && !(c >= '0' && c <= '9') && c != '+' && c != '/') return false;
        }
        return end >= 2;
    }
}
