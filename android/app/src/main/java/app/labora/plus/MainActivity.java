package app.labora.plus;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

import app.labora.plus.bubble.LaboraBubblePlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(LaboraBubblePlugin.class);
        super.onCreate(savedInstanceState);
    }
}
