import { memo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { CheckCircle2, Clock } from "lucide-react-native";

// Using memo for performance in FlashList
export const OrderListItem = memo(({ item }: { item: any }) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.customer}>
          {item.customer_name || "Guest Customer"}
        </Text>
        <Text
          style={[
            styles.status,
            { color: item.status === "Completed" ? "green" : "orange" },
          ]}
        >
          {item.status}
        </Text>
      </View>

      <View style={styles.details}>
        <Text style={styles.info}>#{item.id?.substring(0, 8)}</Text>
        <Text style={styles.info}>
          {new Date(item.created_at || Date.now()).toLocaleDateString()}
        </Text>
      </View>

      <View style={styles.footer}>
        <Text style={styles.total}>₹{(item.total || 0).toLocaleString()}</Text>
        <View style={styles.paymentInfo}>
          {item.paymentStatus === "Paid" ? (
            <CheckCircle2 size={14} color="#666" />
          ) : (
            <Clock size={14} color="#666" />
          )}
          <Text style={styles.paymentText}>
            {item.paymentStatus || "Unpaid"}
          </Text>
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    padding: 12,
    marginVertical: 4,
    marginHorizontal: 12,
    borderRadius: 8,
    // Shadow for depth
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  customer: {
    fontFamily: "Outfit-Bold",
    fontSize: 16,
    color: "#333",
  },
  status: {
    fontSize: 12,
    fontFamily: "Outfit-SemiBold",
    textTransform: "uppercase",
  },
  details: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  info: {
    color: "#666",
    fontSize: 12,
    fontFamily: "Outfit-Medium",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  total: {
    fontFamily: "Outfit-Bold",
    fontSize: 16,
    color: "#2563eb",
  },
  paymentInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  paymentText: {
    fontSize: 12,
    color: "#666",
    fontFamily: "Outfit-Medium",
  },
});
