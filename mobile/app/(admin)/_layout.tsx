import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Drawer } from "expo-router/drawer";
import {
  Grid,
  Power,
  Settings,
  Users,
  UserRoundCog,
  Package,
  ShoppingCart,
  ArrowLeft,
  ShoppingBag,
  BarChart3,
  CircleDollarSign,
  Shield,
} from "lucide-react-native";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "expo-router";
import {
  DrawerContentScrollView,
  DrawerItemList,
  DrawerItem,
} from "@react-navigation/drawer";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

function CustomDrawerContent(props: any) {
  const { user, signOut } = useAuthStore();
  const router = useRouter();

  return (
    <DrawerContentScrollView {...props} contentContainerStyle={{ flex: 1 }}>
      <View style={styles.drawerHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.name?.charAt(0)?.toLocaleUpperCase() || "A"}
          </Text>
        </View>
        <Text style={styles.username}>{user?.name || "Admin"}</Text>
        <Text style={styles.role}>{user?.role}</Text>
      </View>

      <DrawerItemList {...props} />

      <View style={{ flex: 1 }} />

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.signOutBtn}
          onPress={async () => {
            await signOut();
            router.replace("/(auth)/login");
          }}
        >
          <Power size={20} color="#ef4444" />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </DrawerContentScrollView>
  );
}

export default function AdminLayout() {
  const { user } = useAuthStore();
  const router = useRouter();
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Drawer
        drawerContent={(props) => <CustomDrawerContent {...props} />}
        screenOptions={{
          headerShown: true,
          headerStyle: { backgroundColor: "#fff" },
          headerTintColor: "#111",
          headerTitleStyle: { fontFamily: "Outfit-Bold" },
          drawerActiveBackgroundColor: "#f3f4f6",
          drawerActiveTintColor: "#111",
          drawerInactiveTintColor: "#666",
          drawerLabelStyle: { fontFamily: "Outfit-Medium" },
        }}
      >
        <Drawer.Screen
          name="admins"
          options={{
            drawerLabel: "Admins",
            title: "Admin Management",
            drawerItemStyle: {
              display: user?.role === "super_admin" ? "flex" : "none",
            },
            drawerIcon: ({ color, size }) => (
              <Shield size={size} color={color} />
            ),
          }}
        />
        <Drawer.Screen
          name="customers"
          options={{
            drawerLabel: "Customers",
            title: "Customer Management",
            drawerIcon: ({ color, size }) => (
              <Users size={size} color={color} />
            ),
          }}
        />
        <Drawer.Screen
          name="dashboard"
          options={{
            drawerLabel: "Dashboard",
            title: "Admin Dashboard",
            drawerIcon: ({ color, size }) => <Grid size={size} color={color} />,
          }}
        />
        <Drawer.Screen
          name="employees"
          options={{
            drawerLabel: "Employees",
            title: "Employee Management",
            drawerIcon: ({ color, size }) => (
              <UserRoundCog size={size} color={color} />
            ),
          }}
        />
        <Drawer.Screen
          name="inventory"
          options={{
            drawerLabel: "Inventory",
            title: "Inventory Management",
            drawerIcon: ({ color, size }) => (
              <Package size={size} color={color} />
            ),
          }}
        />
        <Drawer.Screen
          name="orders"
          options={{
            drawerLabel: "Orders",
            title: "Order Management",
            drawerIcon: ({ color, size }) => (
              <ShoppingCart size={size} color={color} />
            ),
          }}
        />
        <Drawer.Screen
          name="new-order"
          options={{
            drawerItemStyle: { display: "none" },
            headerShown: false,
          }}
        />
        <Drawer.Screen
          name="purchases"
          options={{
            drawerLabel: "Purchases",
            title: "Purchase Management",
            drawerIcon: ({ color, size }) => (
              <ShoppingBag size={size} color={color} />
            ),
          }}
        />
        <Drawer.Screen
          name="new-purchase"
          options={{
            drawerItemStyle: { display: "none" },
            headerShown: false,
          }}
        />
        <Drawer.Screen
          name="reports"
          options={{
            drawerLabel: "Reports",
            title: "Financial Reports",
            drawerIcon: ({ color, size }) => (
              <BarChart3 size={size} color={color} />
            ),
          }}
        />
        <Drawer.Screen
          name="settings"
          options={{
            drawerLabel: "Settings",
            title: "Admin Settings",
            drawerIcon: ({ color, size }) => (
              <Settings size={size} color={color} />
            ),
          }}
        />
        <Drawer.Screen
          name="transactions"
          options={{
            drawerLabel: "Transactions",
            title: "Settlements & Transactions",
            drawerIcon: ({ color, size }) => (
              <CircleDollarSign size={size} color={color} />
            ),
          }}
        />
        <Drawer.Screen
          name="new-transaction"
          options={{
            drawerItemStyle: { display: "none" },
            headerShown: false,
          }}
        />
        {/* Placeholder screens for other admin routes */}
      </Drawer>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  drawerHeader: {
    padding: 20,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    alignItems: "center",
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#2563eb",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  avatarText: {
    color: "white",
    fontSize: 24,
    fontFamily: "Outfit-Bold",
  },
  username: {
    fontSize: 18,
    fontFamily: "Outfit-Bold",
    color: "#111",
  },
  role: {
    fontSize: 14,
    color: "#666",
    fontFamily: "Outfit-Regular",
    textTransform: "capitalize",
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  signOutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fef2f2",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  signOutText: {
    color: "#ef4444",
    fontSize: 16,
    fontFamily: "Outfit-SemiBold",
  },
});
