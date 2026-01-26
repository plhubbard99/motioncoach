import React, { useState } from "react";
import { StyleSheet, View, Pressable } from "react-native";
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
import { useGoals } from "@/contexts/GoalContext";
import { useCoaches } from "@/contexts/CoachContext";

type ProfileScreenProps = {
  navigation: NativeStackNavigationProp<ProfileStackParamList, "Profile">;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface StatItemProps {
  value: string;
  label: string;
}

function StatItem({ value, label }: StatItemProps) {
  const { theme } = useTheme();
  return (
    <View style={styles.statItem}>
      <ThemedText type="h3" style={styles.statValue}>
        {value}
      </ThemedText>
      <ThemedText type="small" style={[styles.statLabel, { color: theme.textSecondary }]}>
        {label}
      </ThemedText>
    </View>
  );
}

interface MenuItemProps {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  onPress: () => void;
  showChevron?: boolean;
  danger?: boolean;
  badge?: number;
}

function MenuItem({
  icon,
  label,
  onPress,
  showChevron = true,
  danger = false,
  badge,
}: MenuItemProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const color = danger ? theme.warning : theme.text;

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
        styles.menuItem,
        { backgroundColor: theme.backgroundDefault },
        animatedStyle,
      ]}
    >
      <View
        style={[
          styles.menuIconContainer,
          { backgroundColor: danger ? theme.warning + "20" : theme.primary + "20" },
        ]}
      >
        <Feather name={icon} size={18} color={danger ? theme.warning : theme.primary} />
      </View>
      <ThemedText type="body" style={[styles.menuLabel, { color }]}>
        {label}
      </ThemedText>
      {badge !== undefined && badge > 0 ? (
        <View style={[styles.badge, { backgroundColor: theme.primary }]}>
          <ThemedText type="small" style={{ color: "#FFFFFF", fontSize: 11, fontWeight: "600" }}>
            {badge}
          </ThemedText>
        </View>
      ) : null}
      {showChevron ? (
        <Feather name="chevron-right" size={20} color={theme.textSecondary} />
      ) : null}
    </AnimatedPressable>
  );
}

const AVATAR_COLORS = ["#0066FF", "#00D9A3", "#FF6B35", "#9B59B6"];

const FOCUS_AREAS = [
  { id: "1", name: "Throwing Mechanics", icon: "target" },
  { id: "2", name: "Lower Body Power", icon: "zap" },
  { id: "3", name: "Core Stability", icon: "shield" },
  { id: "4", name: "Balance & Control", icon: "crosshair" },
  { id: "5", name: "Flexibility", icon: "move" },
  { id: "6", name: "Endurance", icon: "activity" },
];

export default function ProfileScreen({ navigation }: ProfileScreenProps) {
  const { theme } = useTheme();
  const [selectedAvatar, setSelectedAvatar] = useState(0);
  const [displayName] = useState("Athlete");
  const [selectedFocusAreas, setSelectedFocusAreas] = useState<string[]>(["1", "3"]);
  const { goals } = useGoals();
  const { coaches } = useCoaches();

  const activeGoals = goals.filter((g) => !g.isCompleted).length;

  const toggleFocusArea = (id: string) => {
    if (selectedFocusAreas.includes(id)) {
      setSelectedFocusAreas(selectedFocusAreas.filter((a) => a !== id));
    } else {
      setSelectedFocusAreas([...selectedFocusAreas, id]);
    }
  };

  return (
    <ScreenScrollView>
      <View style={styles.profileHeader}>
        <View style={[styles.avatarContainer, { backgroundColor: AVATAR_COLORS[selectedAvatar] }]}>
          <Feather name="user" size={40} color="#FFFFFF" />
        </View>
        <Spacer height={Spacing.md} />
        <ThemedText type="h3">{displayName}</ThemedText>
        <Spacer height={Spacing.xs} />
        <ThemedText type="small" style={{ color: theme.textSecondary }}>
          Training since Dec 2024
        </ThemedText>
      </View>

      <Spacer height={Spacing["2xl"]} />

      <View style={[styles.statsCard, { backgroundColor: theme.backgroundDefault }]}>
        <StatItem value="24" label="Total Analyses" />
        <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
        <StatItem value="+18%" label="Improvement" />
        <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
        <StatItem value="12" label="Drills Done" />
      </View>

      <Spacer height={Spacing["2xl"]} />

      <ThemedText type="h4">Focus Areas</ThemedText>
      <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: Spacing.xs }}>
        Select areas you want to prioritize
      </ThemedText>
      <Spacer height={Spacing.md} />

      <View style={styles.focusAreasGrid}>
        {FOCUS_AREAS.map((area) => {
          const isSelected = selectedFocusAreas.includes(area.id);
          return (
            <Pressable
              key={area.id}
              onPress={() => toggleFocusArea(area.id)}
              style={[
                styles.focusAreaChip,
                {
                  backgroundColor: isSelected ? theme.primary : theme.backgroundDefault,
                  borderColor: isSelected ? theme.primary : theme.border,
                },
              ]}
            >
              <Feather
                name={area.icon as any}
                size={14}
                color={isSelected ? "#FFFFFF" : theme.textSecondary}
              />
              <ThemedText
                type="small"
                style={{
                  color: isSelected ? "#FFFFFF" : theme.text,
                  marginLeft: Spacing.xs,
                  fontWeight: isSelected ? "600" : "400",
                }}
              >
                {area.name}
              </ThemedText>
              {isSelected ? (
                <Feather name="check" size={14} color="#FFFFFF" style={{ marginLeft: Spacing.xs }} />
              ) : null}
            </Pressable>
          );
        })}
      </View>

      <Spacer height={Spacing["2xl"]} />

      <ThemedText type="h4">Avatar</ThemedText>
      <Spacer height={Spacing.md} />
      <View style={styles.avatarPicker}>
        {AVATAR_COLORS.map((color, index) => (
          <Pressable
            key={index}
            onPress={() => setSelectedAvatar(index)}
            style={({ pressed }) => [
              styles.avatarOption,
              { backgroundColor: color, opacity: pressed ? 0.8 : 1 },
              selectedAvatar === index && styles.avatarSelected,
            ]}
          >
            <Feather name="user" size={20} color="#FFFFFF" />
          </Pressable>
        ))}
      </View>

      <Spacer height={Spacing["2xl"]} />

      <ThemedText type="h4">Training</ThemedText>
      <Spacer height={Spacing.md} />

      <MenuItem
        icon="target"
        label="Goal Tracking"
        onPress={() => navigation.navigate("Goals")}
        badge={activeGoals}
      />
      <Spacer height={Spacing.sm} />
      <MenuItem
        icon="users"
        label="My Coaches"
        onPress={() => navigation.navigate("Coaches")}
        badge={coaches.length}
      />

      <Spacer height={Spacing["2xl"]} />

      <ThemedText type="h4">Settings</ThemedText>
      <Spacer height={Spacing.md} />

      <MenuItem
        icon="settings"
        label="Preferences"
        onPress={() => navigation.navigate("Settings")}
      />
      <Spacer height={Spacing.sm} />
      <MenuItem
        icon="bell"
        label="Notifications"
        onPress={() => navigation.navigate("Settings")}
      />
      <Spacer height={Spacing.sm} />
      <MenuItem
        icon="help-circle"
        label="Help & Support"
        onPress={() => {}}
      />

      <Spacer height={Spacing["2xl"]} />

      <ThemedText type="h4">Account</ThemedText>
      <Spacer height={Spacing.md} />

      <MenuItem
        icon="log-out"
        label="Sign Out"
        onPress={() => {}}
        showChevron={false}
      />
      <Spacer height={Spacing.sm} />
      <MenuItem
        icon="trash-2"
        label="Delete Account"
        onPress={() => {}}
        showChevron={false}
        danger
      />

      <Spacer height={Spacing["4xl"]} />
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  profileHeader: {
    alignItems: "center",
    paddingVertical: Spacing.xl,
  },
  avatarContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  statsCard: {
    flexDirection: "row",
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {},
  statLabel: {
    marginTop: Spacing.xs,
    textAlign: "center",
  },
  statDivider: {
    width: 1,
    marginHorizontal: Spacing.md,
  },
  focusAreasGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  focusAreaChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  avatarPicker: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  avatarOption: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarSelected: {
    borderWidth: 3,
    borderColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  menuIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  menuLabel: {
    flex: 1,
    fontWeight: "500",
  },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xs,
    marginRight: Spacing.sm,
  },
});
