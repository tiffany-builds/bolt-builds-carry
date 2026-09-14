import Foundation
import HealthKit

class HealthKitManager {
    static let shared = HealthKitManager()
    private let healthStore = HKHealthStore()
    
    func requestPermission(completion: @escaping (Bool) -> Void) {
        guard HKHealthStore.isHealthDataAvailable() else {
            completion(false)
            return
        }
        
        let mindfulType = HKObjectType.categoryType(
            forIdentifier: .mindfulSession
        )!
        
        healthStore.requestAuthorization(
            toShare: [mindfulType],
            read: []
        ) { success, _ in
            completion(success)
        }
    }
    
    func logMindfulSession(minutes: Double) {
        guard HKHealthStore.isHealthDataAvailable() else { return }
        
        let mindfulType = HKObjectType.categoryType(
            forIdentifier: .mindfulSession
        )!
        
        let now = Date()
        let start = now.addingTimeInterval(-minutes * 60)
        
        let sample = HKCategorySample(
            type: mindfulType,
            value: HKCategoryValue.notApplicable.rawValue,
            start: start,
            end: now
        )
        
        healthStore.save(sample) { _, _ in }
    }
}
