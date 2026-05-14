import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { StatusBar, Style } from '@capacitor/status-bar';
import { App } from '@capacitor/app';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';

class NativeService {
  isNative = Capacitor.isNativePlatform();

  async impact(style: ImpactStyle = ImpactStyle.Light) {
    if (this.isNative) {
      await Haptics.impact({ style });
    }
  }

  async vibrate() {
    if (this.isNative) {
      await Haptics.vibrate();
    }
  }

  async setStatusBar(isDark: boolean) {
    if (this.isNative) {
      try {
        await StatusBar.setStyle({
          style: isDark ? Style.Dark : Style.Light
        });
      } catch (e) {
        console.warn('StatusBar not available');
      }
    }
  }

  async share(title: string, text: string, url: string) {
    if (this.isNative) {
      await Share.share({
        title,
        text,
        url,
        dialogTitle: 'Share with the Empire',
      });
    } else {
      if (navigator.share) {
        await navigator.share({ title, text, url });
      } else {
        await navigator.clipboard.writeText(`${text}\n${url}`);
      }
    }
  }

  initHardwareButtons(onBack: () => void) {
    if (this.isNative) {
      App.addListener('backButton', () => {
        onBack();
      });
    }
  }
}

export const nativeService = new NativeService();
