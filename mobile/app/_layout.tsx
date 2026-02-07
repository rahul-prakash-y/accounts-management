import { useEffect, useCallback } from "react";
import { Slot, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useAuthStore } from "@/store/authStore";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
import { View } from "react-native";

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { isAuthenticated, user, isLoading, checkSession } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  const [fontsLoaded] = useFonts({
    "Outfit-Light": require("../assets/fonts/Outfit_300Light.ttf"),
    "Outfit-Regular": require("../assets/fonts/Outfit_400Regular.ttf"),
    "Outfit-Medium": require("../assets/fonts/Outfit_500Medium.ttf"),
    "Outfit-SemiBold": require("../assets/fonts/Outfit_600SemiBold.ttf"),
    "Outfit-Bold": require("../assets/fonts/Outfit_700Bold.ttf"),
  });

  useEffect(() => {
    // Initial session check
    checkSession();
  }, [checkSession]);

  useEffect(() => {
    if (isLoading || !fontsLoaded) return;

    const inAuthGroup = segments[0] === "(auth)";
    const inAdminGroup = segments[0] === "(admin)";

    // Auth Guard Logic
    if (!isAuthenticated && !inAuthGroup) {
      if (inAdminGroup) {
        router.replace("/(auth)/login");
      } else if (segments[0] === "(public)") {
        router.replace("/");
      }
    } else if (isAuthenticated) {
      if (
        user?.role !== "super_admin" &&
        user?.role !== "admin" &&
        inAdminGroup
      ) {
        router.replace("/");
      }
    }
  }, [isAuthenticated, segments, isLoading, user, fontsLoaded, router]);

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded && !isLoading) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, isLoading]);

  if (!fontsLoaded || isLoading) {
    return null;
  }

  return (
    <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <Slot />
      <StatusBar style="auto" />
    </View>
  );
}
