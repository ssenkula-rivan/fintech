// GMG Global - Notification Sound Service
// Plays iPhone-style sounds for in-app notifications
import { Audio } from 'expo-av';
import { Platform, Vibration } from 'react-native';
import * as Haptics from 'expo-haptics';

// iPhone-style notification sound URLs (royalty-free alternatives)
const SOUND_URLS = {
  // Clean success chime - similar to iOS payment success
  success: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3',
  // Soft error tone - similar to iOS error
  error: 'https://assets.mixkit.co/active_storage/sfx/2955/2955-preview.mp3',
  // Transaction complete - cash register style
  transaction: 'https://assets.mixkit.co/active_storage/sfx/888/888-preview.mp3',
  // Info notification - gentle ping
  info: 'https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3',
};

class NotificationSoundService {
  private isInitialized = false;
  private sounds: { [key: string]: Audio.Sound | null } = {
    success: null,
    error: null,
    transaction: null,
    info: null,
  };

  async init() {
    if (this.isInitialized) return;
    
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
      this.isInitialized = true;
      console.log('[NotificationSound] Initialized');
      
      // Preload sounds in background
      this.preloadSounds();
    } catch (error) {
      console.error('[NotificationSound] Init error:', error);
    }
  }

  private async preloadSounds() {
    try {
      // Preload all sounds for faster playback
      for (const [key, url] of Object.entries(SOUND_URLS)) {
        try {
          const { sound } = await Audio.Sound.createAsync(
            { uri: url },
            { shouldPlay: false, volume: 0.7 }
          );
          this.sounds[key] = sound;
          console.log(`[NotificationSound] Preloaded: ${key}`);
        } catch (e) {
          console.log(`[NotificationSound] Failed to preload ${key}:`, e);
        }
      }
    } catch (error) {
      console.log('[NotificationSound] Preload error:', error);
    }
  }

  async playNotificationSound(type: 'success' | 'error' | 'info' | 'transaction' = 'info') {
    try {
      await this.init();
      
      // Play haptic feedback first (instant)
      await this.triggerHaptic(type);
      
      // Play sound
      await this.playSound(type);
      
      // Also vibrate for emphasis
      this.vibrate(type);
      
      console.log('[NotificationSound] Played:', type);
    } catch (error) {
      console.error('[NotificationSound] Error:', error);
      // Fallback to vibration
      this.vibrate(type);
    }
  }

  private async playSound(type: string) {
    try {
      // Try to use preloaded sound first
      if (this.sounds[type]) {
        await this.sounds[type]!.setPositionAsync(0);
        await this.sounds[type]!.playAsync();
        return;
      }

      // Fallback: create and play new sound
      const url = SOUND_URLS[type as keyof typeof SOUND_URLS];
      if (url) {
        const { sound } = await Audio.Sound.createAsync(
          { uri: url },
          { shouldPlay: true, volume: 0.7 }
        );
        
        // Clean up after playing
        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) {
            sound.unloadAsync();
          }
        });
      }
    } catch (e) {
      console.log('[NotificationSound] Sound playback error:', e);
    }
  }

  private async triggerHaptic(type: string) {
    try {
      switch (type) {
        case 'success':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
        case 'error':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          break;
        case 'transaction':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          // Double haptic for transactions
          setTimeout(() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          }, 150);
          break;
        default:
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
    } catch (e) {
      console.log('[NotificationSound] Haptic error:', e);
    }
  }

  private vibrate(type: string) {
    if (Platform.OS === 'web') return;
    
    try {
      switch (type) {
        case 'success':
          Vibration.vibrate([0, 100, 50, 100]); // Short double vibrate
          break;
        case 'error':
          Vibration.vibrate([0, 200, 100, 200, 100, 200]); // Triple long vibrate
          break;
        case 'transaction':
          Vibration.vibrate([0, 150, 75, 150]); // Medium double vibrate
          break;
        default:
          Vibration.vibrate(150); // Single short vibrate
      }
    } catch (e) {
      // Vibration not available
    }
  }

  async playSuccess() {
    await this.playNotificationSound('success');
  }

  async playError() {
    await this.playNotificationSound('error');
  }

  async playTransaction() {
    await this.playNotificationSound('transaction');
  }

  async playInfo() {
    await this.playNotificationSound('info');
  }

  // Cleanup when app closes
  async cleanup() {
    for (const sound of Object.values(this.sounds)) {
      if (sound) {
        try {
          await sound.unloadAsync();
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    }
    this.sounds = { success: null, error: null, transaction: null, info: null };
  }
}

export const notificationSound = new NotificationSoundService();
export default notificationSound;
