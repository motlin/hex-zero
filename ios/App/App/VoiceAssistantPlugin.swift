import Foundation
import Capacitor
import Intents
import IntentsUI

@objc(VoiceAssistantPlugin)
public class VoiceAssistantPlugin: CAPPlugin {

    @objc func donateShortcut(_ call: CAPPluginCall) {
        guard let identifier = call.getString("identifier"),
              let title = call.getString("title"),
              let suggestedPhrase = call.getString("suggestedPhrase"),
              let difficulty = call.getString("difficulty") else {
            call.reject("Missing required parameters")
            return
        }

        // Create user activity
        let activity = NSUserActivity(activityType: identifier)
        activity.title = title
        activity.isEligibleForSearch = true
        activity.isEligibleForPrediction = true
        activity.persistentIdentifier = identifier
        activity.userInfo = ["difficulty": difficulty]

        // Set suggested invocation phrase
        if #available(iOS 12.0, *) {
            activity.suggestedInvocationPhrase = suggestedPhrase
        }

        // Donate the activity
        activity.becomeCurrent()

        call.resolve()
    }

    @objc func isAvailable(_ call: CAPPluginCall) {
        if #available(iOS 12.0, *) {
            call.resolve(["available": true])
        } else {
            call.resolve(["available": false])
        }
    }

    @objc func presentShortcutSetup(_ call: CAPPluginCall) {
        guard let identifier = call.getString("identifier") else {
            call.reject("Missing identifier parameter")
            return
        }

        if #available(iOS 12.0, *) {
            DispatchQueue.main.async {
                guard let activityType = SiriShortcuts.ActivityType(rawValue: identifier) else {
                    call.reject("Invalid activity type")
                    return
                }

                // Create the activity
                let activity = NSUserActivity(activityType: identifier)
                activity.title = activityType.title
                activity.isEligibleForSearch = true
                activity.isEligibleForPrediction = true
                activity.persistentIdentifier = identifier
                activity.userInfo = ["difficulty": activityType.difficulty]
                activity.suggestedInvocationPhrase = activityType.suggestedPhrase

                // Present the shortcut view controller
                let shortcut = INShortcut(userActivity: activity)
                let viewController = INUIAddVoiceShortcutViewController(shortcut: shortcut)
                viewController.delegate = self

                if let rootViewController = UIApplication.shared.keyWindow?.rootViewController {
                    rootViewController.present(viewController, animated: true, completion: nil)
                }
            }
        } else {
            call.reject("Siri shortcuts require iOS 12.0 or later")
        }
    }
}

// MARK: - INUIAddVoiceShortcutViewControllerDelegate
extension VoiceAssistantPlugin: INUIAddVoiceShortcutViewControllerDelegate {
    public func addVoiceShortcutViewController(_ controller: INUIAddVoiceShortcutViewController, didFinishWith voiceShortcut: INVoiceShortcut?, error: Error?) {
        controller.dismiss(animated: true, completion: nil)
    }

    public func addVoiceShortcutViewControllerDidCancel(_ controller: INUIAddVoiceShortcutViewController) {
        controller.dismiss(animated: true, completion: nil)
    }
}
