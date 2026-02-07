import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { AlertCircle, RefreshCcw } from "lucide-react-native";

interface ErrorBannerProps {
  message: string | null;
  onRetry?: () => void;
}

export const ErrorBanner: React.FC<ErrorBannerProps> = ({
  message,
  onRetry,
}) => {
  if (!message) return null;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <AlertCircle size={20} color="#ef4444" />
        <Text style={styles.message} numberOfLines={2}>
          {message}
        </Text>
      </View>
      {onRetry && (
        <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
          <RefreshCcw size={16} color="#ef4444" />
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fee2e2",
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 20,
    marginVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  content: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  message: {
    fontSize: 14,
    color: "#b91c1c",
    fontFamily: "Outfit-Medium",
    flex: 1,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#fee2e2",
  },
  retryText: {
    fontSize: 13,
    color: "#ef4444",
    fontFamily: "Outfit-SemiBold",
  },
});
