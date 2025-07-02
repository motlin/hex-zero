package com.hexzero.game;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.hexzero.game.plugins.WidgetPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Register the widget plugin
        registerPlugin(WidgetPlugin.class);
    }
}
