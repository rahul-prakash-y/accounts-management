import { Tabs } from "expo-router";
import { ShoppingCart, Users, Power } from "lucide-react-native";
import { TouchableOpacity, Alert, View } from "react-native";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "expo-router";

const COLORS = {
  primary: "#4f46e5", // Indigo 600
  background: "#f8fafc", // Slate 50
  headerBg: "#ffffff",
  textPrincipal: "#0f172a", // Slate 900
  textSecondary: "#64748b", // Slate 500
  border: "#e2e8f0", // Slate 200
  danger: "#ef4444",
};

export default function SalesLayout() {
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
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontFamily: "Outfit-SemiBold",
        },
        headerStyle: {
          backgroundColor: COLORS.headerBg,
          borderBottomWidth: 1,
          borderBottomColor: COLORS.border,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTitleStyle: {
          fontFamily: "Outfit-Bold",
          color: COLORS.textPrincipal,
          fontSize: 18,
        },
        headerRight: () => (
          <TouchableOpacity
            onPress={handleLogout}
            style={{ marginRight: 16, padding: 8 }}
          >
            <Power size={20} color={COLORS.danger} />
          </TouchableOpacity>
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "My Orders",
          tabBarLabel: "Orders",
          tabBarIcon: ({ color }) => <ShoppingCart size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="customers"
        options={{
          title: "My Customers",
          tabBarLabel: "Customers",
          tabBarIcon: ({ color }) => <Users size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="new-order"
        options={{
          href: null,
          title: "Create New Order",
          headerShown: true,
          tabBarStyle: { display: "none" }, // Hide tab bar on form
        }}
      />
      <Tabs.Screen
        name="new-customer"
        options={{
          href: null,
          title: "Add New Customer",
          headerShown: true,
          tabBarStyle: { display: "none" }, // Hide tab bar on form
        }}
      />
    </Tabs>
  );
}
