package app.labora.plus.export;

import java.io.IOException;
import java.io.OutputStream;

/** A successful return means both the provider write and close completed. */
final class ExportFileWriter {
    interface OpenOutput { OutputStream open() throws IOException; }

    static void write(OpenOutput output, byte[] bytes) throws IOException {
        try (OutputStream stream = output.open()) {
            if (stream == null) throw new IOException("output_unavailable");
            stream.write(bytes);
        }
    }
}
