#import <Capacitor/Capacitor.h>

CAP_PLUGIN(VoiceAssistantPlugin, "VoiceAssistant",
    CAP_PLUGIN_METHOD(donateShortcut, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(isAvailable, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(presentShortcutSetup, CAPPluginReturnPromise);
)
