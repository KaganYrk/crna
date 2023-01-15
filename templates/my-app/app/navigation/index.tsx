import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNavigationContainerRef, NavigationContainer } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useContext } from 'react';
import { CardStyleInterpolators, createStackNavigator, HeaderStyleInterpolators } from '@react-navigation/stack';
import { TouchableOpacity } from 'react-native';

export const navigationRef = createNavigationContainerRef();

const MainStack = createStackNavigator<MainStackParamList>();
const AppTab = createBottomTabNavigator<AppTabParamList>();

const AppTabScreens = () => {
  const insets = useSafeAreaInsets();
  return (
    <AppTab.Navigator screenOptions={{
      headerShown: false,
      tabBarShowLabel: false,

      tabBarStyle: { height: 75 + insets.bottom },
    }}
    />
  );
};

const Main = () => (
  <NavigationContainer ref={navigationRef}>
    <MainStack.Navigator initialRouteName="AppTabScreens" screenOptions={{ headerShown: false }}>
      {/* <MainStack.Screen name="AuthStackScreens" component={AuthStackScreens} /> */}
      <MainStack.Screen name="AppTabScreens" component={AppTabScreens} />
    </MainStack.Navigator>
  </NavigationContainer>
);

export default Main;

export type MainStackParamList = {

};

export type AppTabParamList={

}
