package app.labora.plus.export;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.provider.DocumentsContract;
import android.util.Base64;
import androidx.activity.result.ActivityResult;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicBoolean;

/** Save As via SAF in both play and labs. No broad storage permission or persistent file access. */
@CapacitorPlugin(name = "LaboraFileExport")
public class LaboraFileExportPlugin extends Plugin {
    private final AtomicBoolean busy = new AtomicBoolean(false);
    private final ExecutorService io = Executors.newSingleThreadExecutor();
    private byte[] pendingBytes;

    @PluginMethod
    public void save(PluginCall call) {
        if (!busy.compareAndSet(false, true)) { call.reject("export_busy"); return; }
        try {
            String filename = call.getString("filename");
            String mimeType = call.getString("mimeType");
            String base64 = call.getString("base64");
            ExportPayload.validate(filename, mimeType, base64);
            pendingBytes = Base64.decode(base64, Base64.NO_WRAP);
            if (pendingBytes.length < 1 || pendingBytes.length > ExportPayload.MAX_BYTES) throw new IllegalArgumentException();
            // Keep bytes only in this plugin instance; do not persist the payload in saved calls.
            call.getData().remove("base64");
            Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
            intent.addCategory(Intent.CATEGORY_OPENABLE);
            intent.setType(mimeType);
            intent.putExtra(Intent.EXTRA_TITLE, filename);
            startActivityForResult(call, intent, "afterSaveLocation");
        } catch (Exception ignored) {
            pendingBytes = null;
            call.getData().remove("base64");
            busy.set(false);
            call.reject("export_unavailable");
        }
    }

    @ActivityCallback
    private void afterSaveLocation(PluginCall call, ActivityResult result) {
        byte[] bytes = pendingBytes;
        pendingBytes = null;
        if (call == null) { busy.set(false); return; }
        if (result.getResultCode() == Activity.RESULT_CANCELED) {
            busy.set(false);
            JSObject response = new JSObject();
            response.put("status", "cancelled");
            call.resolve(response);
            return;
        }
        Uri uri = result.getData() == null ? null : result.getData().getData();
        if (result.getResultCode() != Activity.RESULT_OK || uri == null || !"content".equals(uri.getScheme()) || bytes == null) {
            busy.set(false);
            call.reject("export_interrupted");
            return;
        }
        try {
            io.execute(() -> {
            try {
                // Resolve only after writing AND closing the provider stream successfully.
                ExportFileWriter.write(() -> getContext().getContentResolver().openOutputStream(uri, "w"), bytes);
                JSObject response = new JSObject();
                response.put("status", "saved");
                call.resolve(response);
            } catch (Exception ignored) {
                // CREATE_DOCUMENT always creates a new file. Try to remove our partial output only.
                try { DocumentsContract.deleteDocument(getContext().getContentResolver(), uri); } catch (Exception cleanupIgnored) {}
                call.reject("export_write_failed");
            } finally {
                busy.set(false);
            }
            });
        } catch (java.util.concurrent.RejectedExecutionException ignored) {
            busy.set(false);
            call.reject("export_interrupted");
        }
    }

    @Override
    protected void handleOnDestroy() {
        pendingBytes = null;
        io.shutdown();
        super.handleOnDestroy();
    }
}
