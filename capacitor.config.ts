import type { CapacitorConfig } from "@capacitor/cli";
import { KeyboardResize, KeyboardStyle } from "@capacitor/keyboard";

const config: CapacitorConfig = {
  appId: "space.thecommoncollective.app",
  appName: "The Common Collective",
  webDir: "public/native-shell",
  server: {
    url: "https://www.thecommoncollective.space",
    cleartext: false,
    allowNavigation: ["www.thecommoncollective.space", "thecommoncollective.space"],
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: false,
      backgroundColor: "#090806",
    },
    StatusBar: {
      overlaysWebView: true,
      style: "DARK",
    },
    Keyboard: {
      resize: KeyboardResize.Native,
      style: KeyboardStyle.Dark,
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
  },
  ios: {
    scheme: "CommonCollective",
    contentInset: "automatic",
  },
};

export default config;
