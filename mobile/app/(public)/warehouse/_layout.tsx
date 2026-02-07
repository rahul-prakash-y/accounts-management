import { Tabs } from "expo-router";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  ShoppingCart,
  Power,
} from "lucide-react-native";
import { TouchableOpacity, Alert, Platform } from "react-native";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "expo-router";

const COLORS = {
  primary: "#4f46e5", // Indigo 600
  background: "#f8fafc", // Slate 50
  border: "#e2e8f0", // Slate 200
  textSecondary: "#64748b", // Slate 500
  headerBg: "#ffffff",
};

export default function WarehouseLayout() {
  const { signOut } = useAuthStore();
  const router = useRouter();

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await signOut();
          router.replace("/");
        },
      },
    ]);
  };

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarStyle: {
          backgroundColor: COLORS.headerBg,
          borderTopWidth: 1,
          borderTopColor: COLORS.border,
          height: Platform.OS === "ios" ? 85 : 65,
          paddingBottom: Platform.OS === "ios" ? 28 : 10,
          paddingTop: 8,
          elevation: 8,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontFamily: "Outfit-SemiBold",
          marginBottom: 0,
        },
        headerStyle: {
          backgroundColor: COLORS.headerBg,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: COLORS.border,
        },
        headerTitleStyle: {
          fontFamily: "Outfit-Bold",
          color: "#1e293b",
          fontSize: 20,
        },
        headerTitleAlign: "left",
        headerRight: () => (
          <TouchableOpacity
            onPress={handleLogout}
            style={{ marginRight: 16, padding: 8 }}
          >
            <Power size={22} color="#ef4444" />
          </TouchableOpacity>
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          headerTitle: "Warehouse",
          tabBarIcon: ({ color }) => (
            <LayoutDashboard size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: "Orders",
          headerTitle: "Orders",
          tabBarIcon: ({ color }) => <ShoppingCart size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="inventory"
        options={{
          title: "Stock",
          headerShown: false,
          tabBarIcon: ({ color }) => <Package size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="purchases"
        options={{
          title: "Purchases",
          headerShown: false,
          tabBarIcon: ({ color }) => <ShoppingBag size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="new-purchase"
        options={{
          href: null,
          title: "New Purchase",
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="edit-purchase"
        options={{
          href: null,
          title: "Edit Purchase",
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="new-order"
        options={{
          href: null,
          title: "New Order",
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="edit-order"
        options={{
          href: null,
          title: "Edit Order",
          headerShown: false,
        }}
      />
    </Tabs>
  );
}
