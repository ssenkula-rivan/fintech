// src/utils/useNotification.ts
// Toast notification hook - works without context
import Toast from 'react-native-toast-message';

export const useNotification = () => {
  const showSuccess = (title: string, message?: string, _emoji?: string) => {
    Toast.show({
      type: 'success',
      text1: title,
      text2: message,
      visibilityTime: 3000,
      position: 'top',
    });
  };

  const showError = (title: string, message?: string, _emoji?: string) => {
    Toast.show({
      type: 'error',
      text1: title,
      text2: message,
      visibilityTime: 4000,
      position: 'top',
    });
  };

  const showInfo = (title: string, message?: string, _emoji?: string) => {
    Toast.show({
      type: 'info',
      text1: title,
      text2: message,
      visibilityTime: 3000,
      position: 'top',
    });
  };

  const showWarning = (title: string, message?: string, _emoji?: string) => {
    Toast.show({
      type: 'error',
      text1: `⚠️ ${title}`,
      text2: message,
      visibilityTime: 3500,
      position: 'top',
    });
  };

  return { showSuccess, showError, showInfo, showWarning };
};
