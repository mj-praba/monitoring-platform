import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { SafeAreaView, StyleSheet } from "react-native";
import { MonitorScreen } from "./src/screens/MonitorScreen";
import { ScanScreen } from "./src/screens/ScanScreen";

export default function App() {
  const [paired, setPaired] = useState<{ deviceId: string; deviceToken: string } | null>(null);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      {paired ? (
        <MonitorScreen deviceId={paired.deviceId} deviceToken={paired.deviceToken} />
      ) : (
        <ScanScreen onPaired={(deviceId, deviceToken) => setPaired({ deviceId, deviceToken })} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#0f1115" },
});
