export enum Platform {
  ANDROID = "android",
  IOS = "ios",
}

const ANDROID_APP_ID = "com.referral.app";
const IOS_APP_ID = "1234567890";
const APP_DOMAIN = "referral.com";

export function getDeepLink({
  parentReferralCode,
  code,
  platform,
}: {
  parentReferralCode: string;
  code: string;
  platform: Platform;
}): string {
  return platform === Platform.ANDROID
    ? `https://play.google.com/store/apps/details?id=${ANDROID_APP_ID}&referrer=parentReferralCode=${parentReferralCode}&code=${code}`
    : `https://apps.apple.com/us/app/id${IOS_APP_ID}?app-argument=https://${APP_DOMAIN}?parentReferralCode=${parentReferralCode}&code=${code}`;
}
