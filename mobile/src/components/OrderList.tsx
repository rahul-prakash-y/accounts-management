import { View, StyleSheet } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { OrderListItem } from "./OrderListItem";

export const OrderList = ({ orders, onRefresh, refreshing }: any) => {
  return (
    <View style={styles.container}>
      <FlashList
        data={orders}
        renderItem={({ item }) => <OrderListItem item={item} />}
        estimatedItemSize={100} // Crucial for FlashList performance
        keyExtractor={(item: any) => item.id}
        onRefresh={onRefresh}
        refreshing={refreshing}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
  },
  listContent: {
    paddingBottom: 20,
    paddingTop: 8,
  },
});
