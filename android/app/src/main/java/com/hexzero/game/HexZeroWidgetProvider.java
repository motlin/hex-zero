package com.hexzero.game;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.widget.RemoteViews;
import android.os.Build;

public class HexZeroWidgetProvider extends AppWidgetProvider {
    private static final String PREFS_NAME = "HexZeroWidgetPrefs";
    private static final String PREF_GAMES_PLAYED = "widget_gamesPlayed";
    private static final String PREF_GAMES_WON = "widget_gamesWon";
    private static final String PREF_CURRENT_STREAK = "widget_currentStreak";
    private static final String PREF_LAST_PLAYED = "widget_lastPlayed";

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }

    static void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        // Load game statistics from shared preferences
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        int gamesPlayed = prefs.getInt(PREF_GAMES_PLAYED, 0);
        int gamesWon = prefs.getInt(PREF_GAMES_WON, 0);
        int currentStreak = prefs.getInt(PREF_CURRENT_STREAK, 0);

        // Calculate win rate
        int winRate = gamesPlayed > 0 ? (gamesWon * 100) / gamesPlayed : 0;

        // Create RemoteViews for the widget layout
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.hex_zero_widget);

        // Update the widget views with statistics
        views.setTextViewText(R.id.widget_games_played, String.valueOf(gamesPlayed));
        views.setTextViewText(R.id.widget_win_rate, winRate + "%");

        if (currentStreak > 0) {
            views.setTextViewText(R.id.widget_streak, "🔥 " + currentStreak);
            views.setViewVisibility(R.id.widget_streak_container, android.view.View.VISIBLE);
        } else {
            views.setViewVisibility(R.id.widget_streak_container, android.view.View.GONE);
        }

        // Create intent to launch the app when widget is clicked
        Intent intent = new Intent(context, MainActivity.class);
        intent.setAction("com.hexzero.game.PLAY_GAME");
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            flags |= PendingIntent.FLAG_IMMUTABLE;
        }
        PendingIntent pendingIntent = PendingIntent.getActivity(context, 0, intent, flags);
        views.setOnClickPendingIntent(R.id.widget_layout, pendingIntent);

        // Update the widget
        appWidgetManager.updateAppWidget(appWidgetId, views);
    }

    // Method to be called from the app to update widget data
    public static void updateWidgetData(Context context, int gamesPlayed, int gamesWon, int currentStreak) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        SharedPreferences.Editor editor = prefs.edit();
        editor.putInt(PREF_GAMES_PLAYED, gamesPlayed);
        editor.putInt(PREF_GAMES_WON, gamesWon);
        editor.putInt(PREF_CURRENT_STREAK, currentStreak);
        editor.putLong(PREF_LAST_PLAYED, System.currentTimeMillis());
        editor.apply();

        // Request widget update
        Intent intent = new Intent(context, HexZeroWidgetProvider.class);
        intent.setAction(AppWidgetManager.ACTION_APPWIDGET_UPDATE);
        context.sendBroadcast(intent);
    }
}
