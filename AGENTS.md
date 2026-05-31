# SYSTEM ARCHITECTURE & AI GUIDELINES

## 🚨 CRITICAL RULE: The Native Boundary 🚨
**DO NOT write background tasks, alarms, or push notification handlers in React Native.**
This project uses a hybrid architecture specifically designed to survive MIUI/Android battery killers.
- **React Native (`src/`)** is strictly a "dumb" UI dashboard.
- **Native Android (`android/app/src/main/java/com/familynotificationapp/`)** controls ALL emergency execution.

## The Emergency Pipeline (Do Not Alter)
1. **FCM Wake:** Firebase Cloud Messaging wakes the device via `FCMService.kt` (Native).
2. **Room DB:** Natively stores the payload via `EmergencyDao.kt` (using `OnConflictStrategy.IGNORE` for duplicates).
3. **Execution Engine:** `EmergencyService.kt` handles the WakeLock, Vibration, MediaPlayer, and triggers the `EmergencyActivity.kt` lock screen overlay.
4. **Acknowledgement:** Uses lightweight `HttpURLConnection` in `EmergencyApi.kt` to hit Supabase Edge Functions.

**If you are asked to modify background behavior, YOU MUST DO IT IN KOTLIN.**

## CI/CD Rules
- **Do not use EAS Cloud Builds.** The project relies on a custom Native architecture and is built using raw Android Gradle (`./gradlew assembleDebug`) via GitHub Actions.
- Ensure any auto-generated local paths in `android/gradle.properties` (like `/opt/homebrew`) are stripped before pushing to CI.

## Expo Versioning
Read the exact versioned docs at https://docs.expo.dev/versions/v56.0.0/ before modifying the React Native UI layer.
