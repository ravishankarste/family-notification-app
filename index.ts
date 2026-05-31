import { registerRootComponent } from 'expo';
import App from './App';
import * as Notifications from 'expo-notifications';
import RemoteLogger from './src/dev/Logger';

// FCM background handling is now entirely managed by the Native Android FCMService and FCMReceiver.
// JS is no longer responsible for receiving background emergencies.

registerRootComponent(App);
