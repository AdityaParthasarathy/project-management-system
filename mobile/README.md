# Mobile (Expo)

See the [root README](../README.md).

```bash
npm install
EXPO_PUBLIC_API_URL=http://<LAN-IP>:5000/api npx expo start   # PowerShell: $env:EXPO_PUBLIC_API_URL="..."; npx expo start
npx tsc --noEmit
npx expo export --platform web --output-dir .web-build
npx eas-cli@latest build -p android --profile preview          # APK
```
