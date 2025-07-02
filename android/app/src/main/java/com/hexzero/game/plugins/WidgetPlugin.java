package com.hexzero.game.plugins;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.hexzero.game.HexZeroWidgetProvider;

@CapacitorPlugin(name = "Widget")
public class WidgetPlugin extends Plugin {

    @PluginMethod
    public void updateWidgetData(PluginCall call) {
        Integer gamesPlayed = call.getInt("gamesPlayed");
        Integer gamesWon = call.getInt("gamesWon");
        Integer currentStreak = call.getInt("currentStreak");

        if (gamesPlayed == null || gamesWon == null || currentStreak == null) {
            call.reject("Missing required parameters");
            return;
        }

        // Update widget data through the widget provider
        HexZeroWidgetProvider.updateWidgetData(
            getContext(),
            gamesPlayed,
            gamesWon,
            currentStreak
        );

        call.resolve();
    }
}
