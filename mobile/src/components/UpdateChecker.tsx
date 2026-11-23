// GMG Global - Update Checker Component
// Checks for app updates on mount and shows alert if update available
import React, { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import appUpdate, { checkForUpdate, showUpdateAlert } from '../services/appUpdate';

interface UpdateCheckerProps {
  checkOnResume?: boolean; // Check when app comes to foreground
}

export function UpdateChecker({ checkOnResume = true }: UpdateCheckerProps) {
  const appState = useRef(AppState.currentState);
  const hasChecked = useRef(false);

  // Check for updates
  const performUpdateCheck = async () => {
    try {
      console.log('[UpdateChecker] Checking for updates...');
      const updateInfo = await checkForUpdate();
      
      if (updateInfo.isUpdateAvailable) {
        console.log('[UpdateChecker] Update available:', updateInfo.latestVersion);
        showUpdateAlert(updateInfo);
      } else {
        console.log('[UpdateChecker] App is up to date');
      }
    } catch (error) {
      console.error('[UpdateChecker] Error:', error);
    }
  };

  // Check on mount
  useEffect(() => {
    if (!hasChecked.current) {
      hasChecked.current = true;
      // Delay check slightly to not block app startup
      const timer = setTimeout(performUpdateCheck, 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  // Check when app comes to foreground
  useEffect(() => {
    if (!checkOnResume) return;

    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App has come to foreground - check for updates
        performUpdateCheck();
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [checkOnResume]);

  // This component doesn't render anything
  return null;
}

export default UpdateChecker;
