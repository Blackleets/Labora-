package app.labora.plus.export;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import org.junit.Test;
import static org.junit.Assert.*;

public class ExportFileWriterTest {
    @Test public void writesExactBytesAndClosesBeforeReturning() throws Exception {
        boolean[] closed = {false};
        ByteArrayOutputStream stream = new ByteArrayOutputStream() {
            @Override public void close() { closed[0] = true; }
        };
        byte[] data = {0, 1, 2, (byte) 255};
        ExportFileWriter.write(() -> stream, data);
        assertArrayEquals(data, stream.toByteArray());
        assertTrue(closed[0]);
    }
    @Test public void nullOrUnavailableProviderCannotConfirmSave() {
        assertThrows(IOException.class, () -> ExportFileWriter.write(() -> null, new byte[] {1}));
        assertThrows(IOException.class, () -> ExportFileWriter.write(() -> { throw new IOException(); }, new byte[] {1}));
    }
    @Test public void failedWriteStillClosesAndPropagatesFailure() {
        boolean[] closed = {false};
        OutputStream stream = new OutputStream() {
            @Override public void write(int value) throws IOException { throw new IOException(); }
            @Override public void close() { closed[0] = true; }
        };
        assertThrows(IOException.class, () -> ExportFileWriter.write(() -> stream, new byte[] {1}));
        assertTrue(closed[0]);
    }
    @Test public void closeFailureCannotConfirmSave() {
        OutputStream stream = new ByteArrayOutputStream() {
            @Override public void close() throws IOException { throw new IOException(); }
        };
        assertThrows(IOException.class, () -> ExportFileWriter.write(() -> stream, new byte[] {1}));
    }
}
