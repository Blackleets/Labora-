package app.labora.plus.export;

import org.junit.Test;
import static org.junit.Assert.assertThrows;

public class ExportPayloadTest {
    @Test public void acceptsCsvPdfAndUnicodeNames() {
        ExportPayload.validate("café.csv", "text/csv", "YQ==");
        ExportPayload.validate("trimestre.PDF", "application/pdf", "YWJj");
    }
    @Test public void rejectsPathsAndControlCharacters() {
        for (String name : new String[] {"../a.csv", "a/b.csv", "a\\b.csv", "a\n.csv", "a\u0000.csv", ".csv", ""}) {
            assertThrows(IllegalArgumentException.class, () -> ExportPayload.validate(name, "text/csv", "YQ=="));
        }
    }
    @Test public void rejectsUnsupportedOrMismatchedTypes() {
        assertThrows(IllegalArgumentException.class, () -> ExportPayload.validate("a.pdf", "text/csv", "YQ=="));
        assertThrows(IllegalArgumentException.class, () -> ExportPayload.validate("a.html", "text/html", "YQ=="));
        assertThrows(IllegalArgumentException.class, () -> ExportPayload.validate(null, "text/csv", "YQ=="));
    }
    @Test public void rejectsInvalidBase64AndEmptyBytes() {
        for (String body : new String[] {"", "Y", "Y===", "====", "YQ==\n", "data:application/pdf;base64,YQ==", "https://example.com", "YQ==YWJj"}) {
            assertThrows(IllegalArgumentException.class, () -> ExportPayload.validate("a.csv", "text/csv", body));
        }
    }
    @Test public void enforcesDecodedSizeEvenWhenEncodedLengthMatchesTheLimit() {
        // 10 MiB is 1 modulo 3: same encoded length can contain 10 MiB + 2 bytes.
        int length = ((ExportPayload.MAX_BYTES + 2) / 3) * 4;
        char[] value = new char[length];
        java.util.Arrays.fill(value, 'A');
        assertThrows(IllegalArgumentException.class, () -> ExportPayload.validate("a.csv", "text/csv", new String(value)));
        value[length - 1] = '=';
        value[length - 2] = '=';
        ExportPayload.validate("a.csv", "text/csv", new String(value));
    }
}
