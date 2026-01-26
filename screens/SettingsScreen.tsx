import React, { useState, useEffect } from "react";
import { StyleSheet, View, Pressable, Switch, Platform, TextInput, Alert } from "react-native";
import { Feather } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { ScreenScrollView } from "@/components/ScreenScrollView";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import Spacer from "@/components/Spacer";
import type { ProfileStackParamList } from "@/navigation/ProfileStackNavigator";
import { saveApiKey, getApiKey, deleteApiKey, hasApiKey } from "@/services/AnalysisService";

type SettingsScreenProps = {
  navigation: NativeStackNavigationProp<ProfileStackParamList, "Settings">;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface SettingRowProps {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value?: string;
  hasSwitch?: boolean;
  switchValue?: boolean;
  onSwitchChange?: (value: boolean) => void;
  onPress?: () => void;
}

function SettingRow({
  icon,
  label,
  value,
  hasSwitch,
  switchValue,
  onSwitchChange,
  onPress,
}: SettingRowProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const content = (
    <View style={styles.settingRowContent}>
      <View
        style={[
          styles.settingIcon,
          { backgroundColor: theme.primary + "20" },
        ]}
      >
        <Feather name={icon} size={18} color={theme.primary} />
      </View>
      <ThemedText type="body" style={styles.settingLabel}>
        {label}
      </ThemedText>
      {hasSwitch ? (
        <Switch
          value={switchValue}
          onValueChange={onSwitchChange}
          trackColor={{
            false: theme.backgroundSecondary,
            true: theme.primary + "80",
          }}
          thumbColor={switchValue ? theme.primary : theme.backgroundTertiary}
        />
      ) : value ? (
        <View style={styles.settingValueRow}>
          <ThemedText
            type="small"
            style={{ color: theme.textSecondary }}
          >
            {value}
          </ThemedText>
          <Feather
            name="chevron-right"
            size={18}
            color={theme.textSecondary}
          />
        </View>
      ) : (
        <Feather
          name="chevron-right"
          size={18}
          color={theme.textSecondary}
        />
      )}
    </View>
  );

  if (onPress) {
    return (
      <AnimatedPressable
        onPress={onPress}
        onPressIn={() => {
          scale.value = withSpring(0.98, { damping: 15 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 15 });
        }}
        style={[
          styles.settingRow,
          { backgroundColor: theme.backgroundDefault },
          animatedStyle,
        ]}
      >
        {content}
      </AnimatedPressable>
    );
  }

  return (
    <View
      style={[
        styles.settingRow,
        { backgroundColor: theme.backgroundDefault },
      ]}
    >
      {content}
    </View>
  );
}

export default function SettingsScreen({ navigation }: SettingsScreenProps) {
  const { theme } = useTheme();
  const [notifications, setNotifications] = useState(true);
  const [hapticFeedback, setHapticFeedback] = useState(true);
  const [autoSave, setAutoSave] = useState(true);
  const [apiKeyConfigured, setApiKeyConfigured] = useState(false);
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    checkApiKey();
  }, []);

  const checkApiKey = async () => {
    const configured = await hasApiKey();
    setApiKeyConfigured(configured);
  };

  const handleSaveApiKey = async () => {
    if (!apiKeyInput.trim()) {
      Alert.alert("Error", "Please enter an API key");
      return;
    }
    if (!apiKeyInput.startsWith("sk-")) {
      Alert.alert("Error", "Invalid API key format. Key should start with 'sk-'");
      return;
    }
    setIsSaving(true);
    try {
      await saveApiKey(apiKeyInput.trim());
      setApiKeyConfigured(true);
      setShowApiKeyInput(false);
      setApiKeyInput("");
      Alert.alert("Success", "API key saved securely");
    } catch (error) {
      Alert.alert("Error", "Failed to save API key");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveApiKey = () => {
    Alert.alert(
      "Remove API Key",
      "Are you sure you want to remove your OpenAI API key? You won't be able to analyze videos until you add a new one.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            await deleteApiKey();
            setApiKeyConfigured(false);
          },
        },
      ]
    );
  };

  return (
    <ScreenScrollView>
      <ThemedText type="h4">Preferences</ThemedText>
      <Spacer height={Spacing.md} />

      <SettingRow
        icon="bell"
        label="Notifications"
        hasSwitch
        switchValue={notifications}
        onSwitchChange={setNotifications}
      />
      <Spacer height={Spacing.sm} />
      <SettingRow
        icon="smartphone"
        label="Haptic Feedback"
        hasSwitch
        switchValue={hapticFeedback}
        onSwitchChange={setHapticFeedback}
      />
      <Spacer height={Spacing.sm} />
      <SettingRow
        icon="save"
        label="Auto-save Recordings"
        hasSwitch
        switchValue={autoSave}
        onSwitchChange={setAutoSave}
      />

      <Spacer height={Spacing["2xl"]} />

      <ThemedText type="h4">Camera</ThemedText>
      <Spacer height={Spacing.md} />

      <SettingRow
        icon="video"
        label="Video Quality"
        value="1080p"
        onPress={() => {}}
      />
      <Spacer height={Spacing.sm} />
      <SettingRow
        icon="grid"
        label="Default Grid"
        value="Off"
        onPress={() => {}}
      />

      <Spacer height={Spacing["2xl"]} />

      <ThemedText type="h4">AI Analysis</ThemedText>
      <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: Spacing.xs }}>
        Configure OpenAI for video biomechanics analysis
      </ThemedText>
      <Spacer height={Spacing.md} />

      {apiKeyConfigured ? (
        <View style={[styles.apiKeyCard, { backgroundColor: theme.backgroundDefault }]}>
          <View style={styles.apiKeyHeader}>
            <View style={[styles.apiKeyStatus, { backgroundColor: theme.success + "20" }]}>
              <Feather name="check-circle" size={16} color={theme.success} />
            </View>
            <View style={styles.apiKeyInfo}>
              <ThemedText type="body" style={{ fontWeight: "500" }}>
                API Key Configured
              </ThemedText>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                Stored securely on device
              </ThemedText>
            </View>
          </View>
          <Pressable
            onPress={handleRemoveApiKey}
            style={[styles.removeButton, { backgroundColor: theme.warning + "15" }]}
          >
            <Feather name="trash-2" size={14} color={theme.warning} />
            <ThemedText type="small" style={{ color: theme.warning, marginLeft: Spacing.xs }}>
              Remove
            </ThemedText>
          </Pressable>
        </View>
      ) : showApiKeyInput ? (
        <View style={[styles.apiKeyCard, { backgroundColor: theme.backgroundDefault }]}>
          <ThemedText type="small" style={{ color: theme.textSecondary, marginBottom: Spacing.sm }}>
            Enter your OpenAI API key to enable AI video analysis
          </ThemedText>
          <TextInput
            style={[
              styles.apiKeyInput,
              {
                backgroundColor: theme.backgroundSecondary,
                color: theme.text,
                borderColor: theme.border,
              },
            ]}
            placeholder="sk-..."
            placeholderTextColor={theme.textSecondary}
            value={apiKeyInput}
            onChangeText={setApiKeyInput}
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry
          />
          <View style={styles.apiKeyButtons}>
            <Pressable
              onPress={() => {
                setShowApiKeyInput(false);
                setApiKeyInput("");
              }}
              style={[styles.cancelButton, { borderColor: theme.border }]}
            >
              <ThemedText type="small">Cancel</ThemedText>
            </Pressable>
            <Pressable
              onPress={handleSaveApiKey}
              style={[
                styles.saveButton,
                { backgroundColor: theme.primary, opacity: isSaving ? 0.6 : 1 },
              ]}
              disabled={isSaving}
            >
              <ThemedText type="small" style={{ color: "#FFFFFF" }}>
                {isSaving ? "Saving..." : "Save Key"}
              </ThemedText>
            </Pressable>
          </View>
          <ThemedText
            type="small"
            style={{ color: theme.textSecondary, marginTop: Spacing.md, lineHeight: 18 }}
          >
            Your key is stored securely on your device using encrypted storage. Get your API key at platform.openai.com
          </ThemedText>
        </View>
      ) : (
        <SettingRow
          icon="key"
          label="OpenAI API Key"
          value="Not configured"
          onPress={() => setShowApiKeyInput(true)}
        />
      )}

      <Spacer height={Spacing["2xl"]} />

      <ThemedText type="h4">App</ThemedText>
      <Spacer height={Spacing.md} />

      <SettingRow
        icon="moon"
        label="Appearance"
        value="System"
        onPress={() => {}}
      />
      <Spacer height={Spacing.sm} />
      <SettingRow
        icon="globe"
        label="Language"
        value="English"
        onPress={() => {}}
      />

      <Spacer height={Spacing["2xl"]} />

      <ThemedText type="h4">Support</ThemedText>
      <Spacer height={Spacing.md} />

      <SettingRow
        icon="help-circle"
        label="Help Center"
        onPress={() => {}}
      />
      <Spacer height={Spacing.sm} />
      <SettingRow
        icon="message-circle"
        label="Contact Us"
        onPress={() => {}}
      />
      <Spacer height={Spacing.sm} />
      <SettingRow
        icon="file-text"
        label="Privacy Policy"
        onPress={() => {}}
      />
      <Spacer height={Spacing.sm} />
      <SettingRow
        icon="book"
        label="Terms of Service"
        onPress={() => {}}
      />

      <Spacer height={Spacing["2xl"]} />

      <View style={styles.versionInfo}>
        <ThemedText
          type="small"
          style={{ color: theme.textSecondary, textAlign: "center" }}
        >
          Pocket Coach v1.0.0
        </ThemedText>
      </View>

      <Spacer height={Spacing["4xl"]} />
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  settingRow: {
    borderRadius: BorderRadius.md,
    overflow: "hidden",
  },
  settingRowContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  settingLabel: {
    flex: 1,
    fontWeight: "500",
  },
  settingValueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  versionInfo: {
    alignItems: "center",
    paddingVertical: Spacing.xl,
  },
  apiKeyCard: {
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
  },
  apiKeyHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  apiKeyStatus: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  apiKeyInfo: {
    flex: 1,
  },
  removeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    alignSelf: "flex-start",
  },
  apiKeyInput: {
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    fontSize: 14,
    borderWidth: 1,
  },
  apiKeyButtons: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    borderWidth: 1,
  },
  saveButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
  },
});
