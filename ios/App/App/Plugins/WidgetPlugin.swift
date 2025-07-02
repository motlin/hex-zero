import Capacitor
import WidgetKit

@objc(WidgetPlugin)
public class WidgetPlugin: CAPPlugin {

    @objc func updateWidgetData(_ call: CAPPluginCall) {
        guard let gamesPlayed = call.getInt("gamesPlayed"),
              let gamesWon = call.getInt("gamesWon"),
              let currentStreak = call.getInt("currentStreak") else {
            call.reject("Missing required parameters")
            return
        }

        let lastPlayed = call.getDouble("lastPlayed") ?? Date().timeIntervalSince1970

        // Save to shared UserDefaults (app group)
        if let sharedDefaults = UserDefaults(suiteName: "group.com.hexzero.game") {
            sharedDefaults.set(gamesPlayed, forKey: "widget_gamesPlayed")
            sharedDefaults.set(gamesWon, forKey: "widget_gamesWon")
            sharedDefaults.set(currentStreak, forKey: "widget_currentStreak")
            sharedDefaults.set(lastPlayed, forKey: "widget_lastPlayed")
            sharedDefaults.synchronize()

            // Request widget reload on iOS 14+
            if #available(iOS 14.0, *) {
                WidgetCenter.shared.reloadAllTimelines()
            }

            call.resolve()
        } else {
            call.reject("Failed to access shared UserDefaults")
        }
    }
}
