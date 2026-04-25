import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "space.thecommoncollective.app",
  appName: "The Common Collective",
  webDir: "public/native-shell",
  server: {
    url: "https://www.thecommoncollective.space",
    cleartext: false,
    allowNavigation: ["www.thecommoncollective.space", "thecommoncollective.space"],
  },
  ios: {
    scheme: "CommonCollective",
    contentInset: "automatic",
  },
};

export default config;
