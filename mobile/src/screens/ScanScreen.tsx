import { CameraView, useCameraPermissions } from "expo-camera";
import { useState } from "react";
import { ActivityIndicator, Button, StyleSheet, Text, TextInput, View } from "react-native";
import { claimPairingCode } from "../services/api";

interface Props {
  onPaired: (deviceId: string, deviceToken: string) => void;
}

export function ScanScreen({ onPaired }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const [manualCode, setManualCode] = useState("");
  const [scanned, setScanned] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function claim(code: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await claimPairingCode(code);
      onPaired(res.device_id, res.device_token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to pair device");
      setScanned(false);
    } finally {
      setLoading(false);
    }
  }

  function handleBarcodeScanned({ data }: { data: string }) {
    if (scanned || loading) return;
    setScanned(true);
    try {
      const payload = JSON.parse(data) as { code: string };
      claim(payload.code);
    } catch {
      claim(data);
    }
  }

  if (!permission) {
    return <ActivityIndicator style={styles.center} />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Connect this device</Text>
      <Text style={styles.subtitle}>Scan the pairing QR code from the web dashboard.</Text>

      {permission.granted ? (
        <View style={styles.cameraWrap}>
          <CameraView
            style={styles.camera}
            barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
            onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
          />
        </View>
      ) : (
        <Button title="Grant camera permission" onPress={requestPermission} />
      )}

      {loading && <ActivityIndicator style={{ marginTop: 12 }} />}
      {error && <Text style={styles.error}>{error}</Text>}

      <Text style={styles.orText}>or enter the 6-digit code manually</Text>
      <TextInput
        style={styles.input}
        placeholder="123456"
        keyboardType="number-pad"
        maxLength={6}
        value={manualCode}
        onChangeText={setManualCode}
      />
      <Button title="Connect" disabled={manualCode.length !== 6 || loading} onPress={() => claim(manualCode)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 60, backgroundColor: "#0f1115" },
  center: { flex: 1, justifyContent: "center" },
  title: { color: "#e7e9ee", fontSize: 22, fontWeight: "700", marginBottom: 6 },
  subtitle: { color: "#8b93a3", marginBottom: 16 },
  cameraWrap: { height: 320, borderRadius: 12, overflow: "hidden", marginBottom: 16 },
  camera: { flex: 1 },
  orText: { color: "#8b93a3", textAlign: "center", marginVertical: 12 },
  input: {
    borderWidth: 1,
    borderColor: "#2b2f3a",
    borderRadius: 8,
    padding: 12,
    color: "#e7e9ee",
    fontSize: 20,
    textAlign: "center",
    letterSpacing: 6,
    marginBottom: 12,
  },
  error: { color: "#ff5d5d", marginTop: 8, textAlign: "center" },
});
