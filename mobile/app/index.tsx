import { useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/store/authStore";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { ShoppingBag, Warehouse, ShieldCheck } from "lucide-react-native";

export default function LandingScreen() {
  const { staffEnter, isLoading, isAuthenticated, user } = useAuthStore();
  const router = useRouter();

  const handleStaffEnter = async (role: "sales" | "warehouse") => {
    await staffEnter(role);
    router.replace(
      role === "sales" ? "/(public)/sales" : "/(public)/warehouse",
    );
  };

  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      const timer = setTimeout(() => {
        if (user.role === "sales") router.replace("/(public)/sales");
        else if (user.role === "warehouse")
          router.replace("/(public)/warehouse");
        else if (user.role === "admin" || user.role === "super_admin")
          router.replace("/(admin)/dashboard");
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isLoading, isAuthenticated, user]);

  if (isLoading || (isAuthenticated && user)) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ffffff" />
        {isAuthenticated && user && (
          <Text style={styles.loadingText}>Welcome back, {user.name}...</Text>
        )}
      </View>
    );
  }

  return (
    <LinearGradient
      colors={["#f8fafc", "#f1f5f9", "#e2e8f0"]}
      style={styles.container}
    >
      <SafeAreaView style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.brandTitle}>SIVANI AGENCIES</Text>
          <Text style={styles.brandSubtitle}>Select Operational Mode</Text>
        </View>

        <View style={styles.cardContainer}>
          <TouchableOpacity
            style={styles.card}
            onPress={() => handleStaffEnter("sales")}
            activeOpacity={0.9}
            disabled={isLoading}
          >
            <LinearGradient
              colors={["#3b82f6", "#2563eb"]}
              style={styles.iconContainer}
            >
              <ShoppingBag size={32} color="white" />
            </LinearGradient>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Sales Staff</Text>
              <Text style={styles.cardDesc}>
                Manage orders, customers, and sales routes.
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.card}
            onPress={() => handleStaffEnter("warehouse")}
            activeOpacity={0.9}
            disabled={isLoading}
          >
            <LinearGradient
              colors={["#10b981", "#059669"]}
              style={styles.iconContainer}
            >
              <Warehouse size={32} color="white" />
            </LinearGradient>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Warehouse Board</Text>
              <Text style={styles.cardDesc}>
                Inventory, purchases, and stock management.
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push("/(auth)/login")}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={["#64748b", "#475569"]}
              style={styles.iconContainer}
            >
              <ShieldCheck size={32} color="white" />
            </LinearGradient>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Admin Access</Text>
              <Text style={styles.cardDesc}>
                System configuration and user management.
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#f8fafc",
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  loadingText: {
    color: "#475569",
    fontSize: 16,
    fontFamily: "Outfit-Medium",
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: "space-between",
  },
  header: {
    marginTop: 40,
    marginBottom: 40,
  },
  brandTitle: {
    fontSize: 32,
    fontFamily: "Outfit-Bold",
    color: "#0f172a",
    letterSpacing: 1,
    marginBottom: 8,
  },
  brandSubtitle: {
    fontSize: 16,
    color: "#64748b",
    fontFamily: "Outfit-Medium",
  },
  cardContainer: {
    flex: 1,
    gap: 20,
    justifyContent: "center",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#f1f5f9",
    gap: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 20,
    fontFamily: "Outfit-Bold",
    color: "#0f172a",
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 13,
    color: "#64748b",
    lineHeight: 18,
    fontFamily: "Outfit-Regular",
  },
});
