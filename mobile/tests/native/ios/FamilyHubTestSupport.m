#import <React/RCTBridgeModule.h>
@interface RCT_EXTERN_MODULE(FamilyHubTestSupport, NSObject)
RCT_EXTERN_METHOD(control:(NSString *)command raw:(NSString *)raw resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject)
@end
