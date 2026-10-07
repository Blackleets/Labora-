package app.labora.plus;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

import app.labora.plus.bubble.LaboraBubblePlugin;
import app.labora.plus.export.LaboraFileExportPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(LaboraBubblePlugin.class);
        registerPlugin(LaboraFileExportPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
