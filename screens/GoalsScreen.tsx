import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Pressable,
  TextInput,
  Platform,
  Alert,
  Modal,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  FadeIn,
} from "react-native-reanimated";
import { ScreenScrollView } from "@/components/ScreenScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import Spacer from "@/components/Spacer";
import { useGoals, Goal } from "@/contexts/GoalContext";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const GOAL_CATEGORIES = [
  { id: "form", label: "Form", icon: "target" as const },
  { id: "strength", label: "Strength", icon: "activity" as const },
  { id: "consistency", label: "Consistency", icon: "repeat" as const },
  { id: "speed", label: "Speed", icon: "zap" as const },
  { id: "flexibility", label: "Flexibility", icon: "move" as const },
];

const SPORTS = [
  "Basketball",
  "Baseball",
  "Football",
  "Soccer",
  "Tennis",
  "Golf",
  "Swimming",
  "Running",
  "Volleyball",
  "Other",
];

function showAlert(title: string, message: string, buttons?: { text: string; onPress?: () => void; style?: "cancel" | "destructive" }[]) {
  if (Platform.OS === "web") {
    if (buttons && buttons.length > 1) {
      const confirmed = window.confirm(`${title}\n\n${message}`);
      if (confirmed) {
        const confirmBtn = buttons.find(b => b.style !== "cancel");
        confirmBtn?.onPress?.();
      } else {
        const cancelBtn = buttons.find(b => b.style === "cancel");
        cancelBtn?.onPress?.();
      }
    } else {
      window.alert(`${title}\n\n${message}`);
      buttons?.[0]?.onPress?.();
    }
  } else {
    Alert.alert(
      title,
      message,
      buttons?.map(b => ({ text: b.text, onPress: b.onPress, style: b.style }))
    );
  }
}

interface GoalCardProps {
  goal: Goal;
  onPress: () => void;
  onDelete: () => void;
}

function GoalCard({ goal, onPress, onDelete }: GoalCardProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);
  const progress = goal.targetValue > 0 ? (goal.currentValue / goal.targetValue) * 100 : 0;
  const daysLeft = Math.max(0, Math.ceil((goal.deadline - Date.now()) / (1000 * 60 * 60 * 24)));

  const getCategoryIcon = () => {
    const cat = GOAL_CATEGORIES.find((c) => c.id === goal.category);
    return cat?.icon || "target";
  };

  const getProgressColor = () => {
    if (goal.isCompleted) return theme.success;
    if (progress >= 75) return theme.success;
    if (progress >= 50) return "#FFB800";
    if (progress >= 25) return theme.warning;
    return theme.primary;
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPress={onPress}
      onLongPress={() => {
        showAlert(
          "Delete Goal",
          `Are you sure you want to delete "${goal.title}"?`,
          [
            { text: "Cancel", style: "cancel" },
            { text: "Delete", onPress: onDelete, style: "destructive" },
          ]
        );
      }}
      onPressIn={() => {
        scale.value = withSpring(0.98, { damping: 15 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 15 });
      }}
      style={[
        styles.goalCard,
        { backgroundColor: theme.backgroundDefault },
        goal.isCompleted && { borderColor: theme.success, borderWidth: 1 },
        animatedStyle,
      ]}
    >
      <View style={styles.goalHeader}>
        <View style={[styles.categoryIcon, { backgroundColor: getProgressColor() + "20" }]}>
          <Feather name={getCategoryIcon()} size={18} color={getProgressColor()} />
        </View>
        <View style={styles.goalHeaderText}>
          <ThemedText type="body" style={{ fontWeight: "600" }} numberOfLines={1}>
            {goal.title}
          </ThemedText>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            {goal.sport}
          </ThemedText>
        </View>
        {goal.isCompleted ? (
          <View style={[styles.completedBadge, { backgroundColor: theme.success }]}>
            <Feather name="check" size={14} color="#FFFFFF" />
          </View>
        ) : (
          <View style={[styles.daysLeftBadge, { backgroundColor: daysLeft < 7 ? theme.warning + "20" : theme.backgroundSecondary }]}>
            <ThemedText type="small" style={{ color: daysLeft < 7 ? theme.warning : theme.textSecondary, fontWeight: "600" }}>
              {daysLeft}d
            </ThemedText>
          </View>
        )}
      </View>

      <View style={styles.progressSection}>
        <View style={styles.progressValues}>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            {goal.currentValue} / {goal.targetValue} {goal.unit}
          </ThemedText>
          <ThemedText type="small" style={{ color: getProgressColor(), fontWeight: "600" }}>
            {Math.round(progress)}%
          </ThemedText>
        </View>
        <View style={[styles.progressBar, { backgroundColor: theme.backgroundSecondary }]}>
          <Animated.View
            style={[
              styles.progressFill,
              {
                backgroundColor: getProgressColor(),
                width: `${Math.min(progress, 100)}%`,
              },
            ]}
          />
        </View>
      </View>

      {goal.milestones.length > 0 ? (
        <View style={styles.milestonesRow}>
          {goal.milestones.map((m, i) => (
            <View
              key={i}
              style={[
                styles.milestoneDot,
                {
                  backgroundColor: m.achievedAt
                    ? theme.success
                    : theme.backgroundSecondary,
                },
              ]}
            />
          ))}
        </View>
      ) : null}
    </AnimatedPressable>
  );
}

interface AddGoalModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (goal: Omit<Goal, "id" | "createdAt" | "updatedAt" | "isCompleted">) => void;
}

function AddGoalModal({ visible, onClose, onAdd }: AddGoalModalProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [sport, setSport] = useState("Basketball");
  const [category, setCategory] = useState<Goal["category"]>("form");
  const [targetValue, setTargetValue] = useState("");
  const [unit, setUnit] = useState("sessions");
  const [deadlineDays, setDeadlineDays] = useState("30");
  const [showSportPicker, setShowSportPicker] = useState(false);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setSport("Basketball");
    setCategory("form");
    setTargetValue("");
    setUnit("sessions");
    setDeadlineDays("30");
  };

  const handleAdd = () => {
    if (!title.trim()) {
      showAlert("Missing Title", "Please enter a goal title.");
      return;
    }
    if (!targetValue || isNaN(Number(targetValue)) || Number(targetValue) <= 0) {
      showAlert("Invalid Target", "Please enter a valid target value.");
      return;
    }

    const target = Number(targetValue);
    const milestones = [
      { value: Math.round(target * 0.25), achievedAt: null },
      { value: Math.round(target * 0.5), achievedAt: null },
      { value: Math.round(target * 0.75), achievedAt: null },
    ];

    onAdd({
      title: title.trim(),
      description: description.trim(),
      sport,
      category,
      targetValue: target,
      currentValue: 0,
      unit,
      deadline: Date.now() + Number(deadlineDays) * 24 * 60 * 60 * 1000,
      milestones,
    });

    resetForm();
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <ThemedView style={[styles.modalContainer, { paddingTop: insets.top + Spacing.lg }]}>
        <View style={styles.modalHeader}>
          <ThemedText type="h3">New Goal</ThemedText>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <Feather name="x" size={24} color={theme.text} />
          </Pressable>
        </View>

        <ScreenScrollView>
          <ThemedText type="body" style={{ fontWeight: "600", marginBottom: Spacing.sm }}>
            Goal Title
          </ThemedText>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="e.g., Improve throwing accuracy"
            placeholderTextColor={theme.textSecondary}
            style={[
              styles.input,
              { backgroundColor: theme.backgroundDefault, color: theme.text, borderColor: theme.border },
            ]}
          />

          <Spacer height={Spacing.lg} />

          <ThemedText type="body" style={{ fontWeight: "600", marginBottom: Spacing.sm }}>
            Description (Optional)
          </ThemedText>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Add more details about your goal"
            placeholderTextColor={theme.textSecondary}
            multiline
            numberOfLines={3}
            style={[
              styles.input,
              styles.textArea,
              { backgroundColor: theme.backgroundDefault, color: theme.text, borderColor: theme.border },
            ]}
          />

          <Spacer height={Spacing.lg} />

          <ThemedText type="body" style={{ fontWeight: "600", marginBottom: Spacing.sm }}>
            Sport
          </ThemedText>
          <Pressable
            onPress={() => setShowSportPicker(!showSportPicker)}
            style={[
              styles.input,
              styles.picker,
              { backgroundColor: theme.backgroundDefault, borderColor: theme.border },
            ]}
          >
            <ThemedText>{sport}</ThemedText>
            <Feather name={showSportPicker ? "chevron-up" : "chevron-down"} size={20} color={theme.textSecondary} />
          </Pressable>
          {showSportPicker ? (
            <View style={[styles.pickerOptions, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
              {SPORTS.map((s) => (
                <Pressable
                  key={s}
                  onPress={() => {
                    setSport(s);
                    setShowSportPicker(false);
                  }}
                  style={[styles.pickerOption, sport === s && { backgroundColor: theme.primary + "20" }]}
                >
                  <ThemedText style={{ color: sport === s ? theme.primary : theme.text }}>{s}</ThemedText>
                </Pressable>
              ))}
            </View>
          ) : null}

          <Spacer height={Spacing.lg} />

          <ThemedText type="body" style={{ fontWeight: "600", marginBottom: Spacing.sm }}>
            Category
          </ThemedText>
          <View style={styles.categoryGrid}>
            {GOAL_CATEGORIES.map((cat) => (
              <Pressable
                key={cat.id}
                onPress={() => setCategory(cat.id as Goal["category"])}
                style={[
                  styles.categoryButton,
                  { backgroundColor: theme.backgroundDefault, borderColor: theme.border },
                  category === cat.id && { borderColor: theme.primary, backgroundColor: theme.primary + "10" },
                ]}
              >
                <Feather
                  name={cat.icon}
                  size={18}
                  color={category === cat.id ? theme.primary : theme.textSecondary}
                />
                <ThemedText
                  type="small"
                  style={{ color: category === cat.id ? theme.primary : theme.text, marginTop: 4 }}
                >
                  {cat.label}
                </ThemedText>
              </Pressable>
            ))}
          </View>

          <Spacer height={Spacing.lg} />

          <View style={styles.row}>
            <View style={styles.halfInput}>
              <ThemedText type="body" style={{ fontWeight: "600", marginBottom: Spacing.sm }}>
                Target
              </ThemedText>
              <TextInput
                value={targetValue}
                onChangeText={setTargetValue}
                placeholder="e.g., 10"
                placeholderTextColor={theme.textSecondary}
                keyboardType="numeric"
                style={[
                  styles.input,
                  { backgroundColor: theme.backgroundDefault, color: theme.text, borderColor: theme.border },
                ]}
              />
            </View>
            <View style={styles.halfInput}>
              <ThemedText type="body" style={{ fontWeight: "600", marginBottom: Spacing.sm }}>
                Unit
              </ThemedText>
              <TextInput
                value={unit}
                onChangeText={setUnit}
                placeholder="e.g., sessions"
                placeholderTextColor={theme.textSecondary}
                style={[
                  styles.input,
                  { backgroundColor: theme.backgroundDefault, color: theme.text, borderColor: theme.border },
                ]}
              />
            </View>
          </View>

          <Spacer height={Spacing.lg} />

          <ThemedText type="body" style={{ fontWeight: "600", marginBottom: Spacing.sm }}>
            Deadline (days from now)
          </ThemedText>
          <TextInput
            value={deadlineDays}
            onChangeText={setDeadlineDays}
            placeholder="30"
            placeholderTextColor={theme.textSecondary}
            keyboardType="numeric"
            style={[
              styles.input,
              { backgroundColor: theme.backgroundDefault, color: theme.text, borderColor: theme.border },
            ]}
          />

          <Spacer height={Spacing["2xl"]} />

          <Pressable
            onPress={handleAdd}
            style={[styles.addButton, { backgroundColor: theme.primary }]}
          >
            <Feather name="plus" size={20} color="#FFFFFF" />
            <ThemedText type="body" style={{ color: "#FFFFFF", fontWeight: "600", marginLeft: Spacing.sm }}>
              Create Goal
            </ThemedText>
          </Pressable>

          <Spacer height={Spacing["4xl"]} />
        </ScreenScrollView>
      </ThemedView>
    </Modal>
  );
}

export default function GoalsScreen() {
  const { theme } = useTheme();
  const { goals, addGoal, deleteGoal, getActiveGoals, getCompletedGoals } = useGoals();
  const [showAddModal, setShowAddModal] = useState(false);
  const [filter, setFilter] = useState<"active" | "completed" | "all">("active");

  const activeGoals = getActiveGoals();
  const completedGoals = getCompletedGoals();

  const filteredGoals =
    filter === "active"
      ? activeGoals
      : filter === "completed"
      ? completedGoals
      : goals;

  const stats = {
    total: goals.length,
    active: activeGoals.length,
    completed: completedGoals.length,
    avgProgress: goals.length > 0
      ? Math.round(
          goals.reduce((sum, g) => sum + (g.currentValue / g.targetValue) * 100, 0) / goals.length
        )
      : 0,
  };

  return (
    <ScreenScrollView>
      <View style={[styles.statsCard, { backgroundColor: theme.backgroundDefault }]}>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <ThemedText type="h2" style={{ color: theme.primary }}>
              {stats.active}
            </ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              Active
            </ThemedText>
          </View>
          <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
          <View style={styles.statItem}>
            <ThemedText type="h2" style={{ color: theme.success }}>
              {stats.completed}
            </ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              Completed
            </ThemedText>
          </View>
          <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
          <View style={styles.statItem}>
            <ThemedText type="h2" style={{ color: "#FFB800" }}>
              {stats.avgProgress}%
            </ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              Avg Progress
            </ThemedText>
          </View>
        </View>
      </View>

      <Spacer height={Spacing.lg} />

      <View style={styles.filterRow}>
        {(["active", "completed", "all"] as const).map((f) => (
          <Pressable
            key={f}
            onPress={() => setFilter(f)}
            style={[
              styles.filterButton,
              { backgroundColor: filter === f ? theme.primary : theme.backgroundDefault },
            ]}
          >
            <ThemedText
              type="small"
              style={{ color: filter === f ? "#FFFFFF" : theme.text, fontWeight: "600", textTransform: "capitalize" }}
            >
              {f}
            </ThemedText>
          </Pressable>
        ))}
      </View>

      <Spacer height={Spacing.lg} />

      {filteredGoals.length === 0 ? (
        <Animated.View entering={FadeIn} style={[styles.emptyState, { backgroundColor: theme.backgroundDefault }]}>
          <View style={[styles.emptyIcon, { backgroundColor: theme.primary + "20" }]}>
            <Feather name="target" size={32} color={theme.primary} />
          </View>
          <ThemedText type="body" style={{ fontWeight: "600", marginTop: Spacing.md }}>
            {filter === "active" ? "No Active Goals" : filter === "completed" ? "No Completed Goals" : "No Goals Yet"}
          </ThemedText>
          <ThemedText type="small" style={{ color: theme.textSecondary, textAlign: "center", marginTop: Spacing.xs }}>
            {filter === "active"
              ? "Create a goal to start tracking your progress"
              : filter === "completed"
              ? "Complete some goals to see them here"
              : "Tap the + button to create your first goal"}
          </ThemedText>
        </Animated.View>
      ) : (
        filteredGoals.map((goal) => (
          <React.Fragment key={goal.id}>
            <GoalCard
              goal={goal}
              onPress={() => {}}
              onDelete={() => deleteGoal(goal.id)}
            />
            <Spacer height={Spacing.sm} />
          </React.Fragment>
        ))
      )}

      <Spacer height={Spacing["4xl"]} />

      <Pressable
        onPress={() => setShowAddModal(true)}
        style={[styles.fab, { backgroundColor: theme.primary }]}
      >
        <Feather name="plus" size={24} color="#FFFFFF" />
      </Pressable>

      <AddGoalModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={addGoal}
      />
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  statsCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  statsGrid: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statDivider: {
    width: 1,
    height: 40,
  },
  filterRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  filterButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.xs,
  },
  goalCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  goalHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  categoryIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  goalHeaderText: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  completedBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  daysLeftBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.xs,
  },
  progressSection: {
    gap: Spacing.xs,
  },
  progressValues: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  milestonesRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.md,
    justifyContent: "center",
  },
  milestoneDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  emptyState: {
    padding: Spacing["2xl"],
    borderRadius: BorderRadius.md,
    alignItems: "center",
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  fab: {
    position: "absolute",
    right: 0,
    bottom: Spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalContainer: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  closeButton: {
    padding: Spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: 16,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  picker: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pickerOptions: {
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.xs,
    overflow: "hidden",
  },
  pickerOption: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  categoryButton: {
    width: "30%",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    alignItems: "center",
  },
  row: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  halfInput: {
    flex: 1,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
});
