import { useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'camera_lighting_tip_shown';
const AUTO_DISMISS_DELAY_MS = 3000;

export interface LightingTipState {
  visible: boolean;
  dismiss: () => void;
}

/** Manages first-use lighting tip visibility backed by AsyncStorage. */
export function useLightingTip(): LightingTipState {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (!stored) {
          setVisible(true);
          AsyncStorage.setItem(STORAGE_KEY, 'true');
          timerRef.current = setTimeout(() => {
            setVisible(false);
            timerRef.current = null;
          }, AUTO_DISMISS_DELAY_MS);
        }
      })
      .catch((error) => console.error('Error checking lighting tip flag:', error));

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  const dismiss = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setVisible(false);
  };

  return { visible, dismiss };
}
