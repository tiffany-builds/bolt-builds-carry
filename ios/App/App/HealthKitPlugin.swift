import Capacitor
import HealthKit

@objc(HealthKitPlugin)
public class HealthKitPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "HealthKitPlugin"
    public let jsName = "HealthKit"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "requestPermission", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "logMindfulSession", returnType: CAPPluginReturnPromise),
    ]

    @objc func requestPermission(_ call: CAPPluginCall) {
        HealthKitManager.shared.requestPermission { granted in
            call.resolve(["granted": granted])
        }
    }

    @objc func logMindfulSession(_ call: CAPPluginCall) {
        let minutes = call.getDouble("minutes") ?? 2.0
        HealthKitManager.shared.logMindfulSession(minutes: minutes)
        call.resolve()
    }
}
