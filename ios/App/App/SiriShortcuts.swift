import Foundation
import Intents
import IntentsUI

class SiriShortcuts: NSObject {

    static let shared = SiriShortcuts()

    // Define activity types for different difficulties
    enum ActivityType: String {
        case startEasyGame = "com.hexzero.game.startEasyGame"
        case startMediumGame = "com.hexzero.game.startMediumGame"
        case startHardGame = "com.hexzero.game.startHardGame"
        case startExtremeGame = "com.hexzero.game.startExtremeGame"
        case startImpossibleGame = "com.hexzero.game.startImpossibleGame"

        var title: String {
            switch self {
            case .startEasyGame:
                return "Start Easy Hex Zero Game"
            case .startMediumGame:
                return "Start Medium Hex Zero Game"
            case .startHardGame:
                return "Start Hard Hex Zero Game"
            case .startExtremeGame:
                return "Start Extreme Hex Zero Game"
            case .startImpossibleGame:
                return "Start Impossible Hex Zero Game"
            }
        }

        var suggestedPhrase: String {
            switch self {
            case .startEasyGame:
                return "Play easy Hex Zero"
            case .startMediumGame:
                return "Play medium Hex Zero"
            case .startHardGame:
                return "Play hard Hex Zero"
            case .startExtremeGame:
                return "Play extreme Hex Zero"
            case .startImpossibleGame:
                return "Play impossible Hex Zero"
            }
        }

        var difficulty: String {
            switch self {
            case .startEasyGame:
                return "easy"
            case .startMediumGame:
                return "medium"
            case .startHardGame:
                return "hard"
            case .startExtremeGame:
                return "extreme"
            case .startImpossibleGame:
                return "impossible"
            }
        }
    }

    // Donate shortcuts when the user plays a game of a specific difficulty
    func donateShortcut(for activityType: ActivityType) {
        let activity = NSUserActivity(activityType: activityType.rawValue)
        activity.title = activityType.title
        activity.isEligibleForSearch = true
        activity.isEligibleForPrediction = true
        activity.persistentIdentifier = activityType.rawValue

        // Add search keywords
        activity.keywords = Set(["hex", "zero", "game", "puzzle", activityType.difficulty])

        // Set suggested invocation phrase
        if #available(iOS 12.0, *) {
            activity.suggestedInvocationPhrase = activityType.suggestedPhrase
        }

        // Add user info to pass difficulty parameter
        activity.userInfo = ["difficulty": activityType.difficulty]

        // Make activity current to donate it
        activity.becomeCurrent()
    }

    // Donate all shortcuts (call this on app launch or after tutorial)
    func donateAllShortcuts() {
        donateShortcut(for: .startEasyGame)
        donateShortcut(for: .startMediumGame)
        donateShortcut(for: .startHardGame)
        donateShortcut(for: .startExtremeGame)
        donateShortcut(for: .startImpossibleGame)
    }

    // Handle continuing user activity from Siri
    static func handleUserActivity(_ userActivity: NSUserActivity) -> Bool {
        guard let activityTypeString = userActivity.activityType as String?,
              let activityType = ActivityType(rawValue: activityTypeString) else {
            return false
        }

        // Notify the web app to start a game with the specified difficulty
        let jsCode = "window.handleVoiceCommand && window.handleVoiceCommand('\(activityType.difficulty)');"

        if let appDelegate = UIApplication.shared.delegate as? AppDelegate,
           let viewController = appDelegate.window?.rootViewController as? CAPBridgeViewController {
            viewController.bridge?.webView?.evaluateJavaScript(jsCode, completionHandler: nil)
        }

        return true
    }
}
