// GMG Global - Haptic Feedback Utilities
// Provides easy-to-use haptic feedback functions
import * as Haptics from 'expo-haptics';

export const haptics = {
  // Light tap - for selections, toggles
  light: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
  
  // Medium tap - for button presses
  medium: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
  
  // Heavy tap - for important actions
  heavy: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy),
  
  // Success - for completed actions
  success: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  
  // Warning - for alerts
  warning: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),
  
  // Error - for failures
  error: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
  
  // Selection changed
  selection: () => Haptics.selectionAsync(),
  
  // Custom pattern - vibrate pattern
  pattern: async (pattern: ('light' | 'medium' | 'heavy' | 'pause')[]) => {
    for (const item of pattern) {
      if (item === 'pause') {
        await new Promise(resolve => setTimeout(resolve, 100));
      } else {
        await Haptics.impactAsync(
          item === 'light' ? Haptics.ImpactFeedbackStyle.Light :
          item === 'medium' ? Haptics.ImpactFeedbackStyle.Medium :
          Haptics.ImpactFeedbackStyle.Heavy
        );
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }
  },
  
  // Celebration pattern
  celebrate: async () => {
    await haptics.pattern(['light', 'pause', 'medium', 'pause', 'heavy']);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  },
  
  // Error pattern
  errorPattern: async () => {
    await haptics.pattern(['heavy', 'pause', 'heavy', 'pause', 'heavy']);
  },
};

export default haptics;
