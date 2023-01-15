/* global __DEV__ */
import * as React from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { Image, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Font from 'expo-font';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Updates from 'expo-updates';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

const splashScreem = require('./assets/splash.png');

SplashScreen.preventAutoHideAsync().catch(() => {
});

function AppLoader({ children }: { children: React.ReactNode }) {
  const [isAppReady, setAppReady] = React.useState(false);

  async function getEnvironment() {
    try {
      const update = await Updates.checkForUpdateAsync();
      if (update.isAvailable) {
        await Updates.fetchUpdateAsync();
        // ... notify user of update ...
        await Updates.reloadAsync();
      }
    } catch (e) {
      console.log(e);
    }
  }

  const onImageLoaded = React.useMemo(() => async () => {
    try {
      await SplashScreen.hideAsync();
      if (!__DEV__) { await getEnvironment(); }
      await Font.loadAsync({
        semibold: require('./assets/fonts/Inter-SemiBold.ttf'),
        medium: require('./assets/fonts/Inter-Medium.ttf'),
        regular: require('./assets/fonts/Inter-Regular.ttf'),
        bold: require('./assets/fonts/Inter-Bold.ttf'),
        ...Ionicons.font,
      });
    } catch (e) {
      console.log('error', e);
    } finally {
      setAppReady(true);
    }
  }, []);

  return (
    <View style={{ flex: 1 }}>
      {!isAppReady && navigationRef.isReady && (
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: 'white' }]}>
          <Image
            style={{
              resizeMode: 'cover',
              width: '100%',
              height: '100%',
            }}
            source={splashScreem}
            onLoadEnd={onImageLoaded}
            fadeDuration={2000}
          />
        </View>
      )}
      {isAppReady && children}

    </View>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>

      <SafeAreaProvider>
        <AppLoader>
          <Main />
        </AppLoader>
      </SafeAreaProvider>

    </GestureHandlerRootView>
  );
}
