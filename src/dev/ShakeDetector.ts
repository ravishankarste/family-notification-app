import { Accelerometer } from 'expo-sensors';

export class ShakeDetector {
  private subscription: any = null;
  private lastShake = 0;
  private SHAKE_COOLDOWN = 1000;
  private SHAKE_THRESHOLD = 1.5;

  start(onShake: () => void) {
    if (this.subscription) return;

    Accelerometer.setUpdateInterval(200); // 5 times a second
    this.subscription = Accelerometer.addListener(accelerometerData => {
      const { x, y, z } = accelerometerData;
      
      // Calculate total acceleration (subtracting gravity which is ~1g)
      const acceleration = Math.sqrt(x * x + y * y + z * z);
      const isShaking = acceleration > this.SHAKE_THRESHOLD;

      if (isShaking) {
        const now = Date.now();
        if (now - this.lastShake > this.SHAKE_COOLDOWN) {
          this.lastShake = now;
          onShake();
        }
      }
    });
  }

  stop() {
    if (this.subscription) {
      this.subscription.remove();
      this.subscription = null;
    }
  }
}

export const shakeDetector = new ShakeDetector();
