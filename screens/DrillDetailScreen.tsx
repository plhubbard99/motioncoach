import React, { useState } from "react";
import { StyleSheet, View, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { RouteProp } from "@react-navigation/native";
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
import { getDrillById, SPORT_DRILLS } from "@/contexts/SportContext";

type DrillDetailParams = {
  DrillDetail: { drillId: string; title?: string; focus?: string };
};

type DrillDetailScreenProps = {
  route: RouteProp<DrillDetailParams, "DrillDetail">;
  navigation: NativeStackNavigationProp<DrillDetailParams, "DrillDetail">;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface StepCardProps {
  stepNumber: number;
  title: string;
  description: string;
  completed: boolean;
  onToggle: () => void;
}

function StepCard({
  stepNumber,
  title,
  description,
  completed,
  onToggle,
}: StepCardProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPress={onToggle}
      onPressIn={() => {
        scale.value = withSpring(0.98, { damping: 15 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 15 });
      }}
      style={[
        styles.stepCard,
        { backgroundColor: theme.backgroundDefault },
        animatedStyle,
      ]}
    >
      <View
        style={[
          styles.stepNumber,
          {
            backgroundColor: completed ? theme.success : theme.primary + "20",
          },
        ]}
      >
        {completed ? (
          <Feather name="check" size={16} color="#FFFFFF" />
        ) : (
          <ThemedText
            type="body"
            style={[
              styles.stepNumberText,
              { color: theme.primary },
            ]}
          >
            {stepNumber}
          </ThemedText>
        )}
      </View>
      <View style={styles.stepContent}>
        <ThemedText
          type="body"
          style={[
            styles.stepTitle,
            completed && { textDecorationLine: "line-through", opacity: 0.6 },
          ]}
        >
          {title}
        </ThemedText>
        <ThemedText
          type="small"
          style={{ color: theme.textSecondary }}
        >
          {description}
        </ThemedText>
      </View>
    </AnimatedPressable>
  );
}

const DEFAULT_DRILL = {
  id: "default",
  title: "Perfect Your Jump Shot",
  duration: "8 min",
  focus: "Form",
  description:
    "Master the fundamentals of a consistent jump shot. This drill focuses on proper shooting form, release timing, and follow-through mechanics.",
  steps: [
    { id: "1", title: "Stance Setup", description: "Position feet shoulder-width apart, knees slightly bent" },
    { id: "2", title: "Ball Placement", description: "Hold ball in shooting pocket at chest level" },
    { id: "3", title: "Elbow Alignment", description: "Keep shooting elbow under the ball, pointing at target" },
    { id: "4", title: "Release Motion", description: "Push through legs while extending arm, snap wrist at peak" },
    { id: "5", title: "Follow Through", description: "Hold finish position, fingers pointing at target" },
  ],
};

function getSportForDrill(drillId: string): string {
  for (const [sport, drills] of Object.entries(SPORT_DRILLS)) {
    if (drills.some(d => d.id === drillId)) {
      return sport;
    }
  }
  return "Training";
}

export default function DrillDetailScreen({
  route,
  navigation,
}: DrillDetailScreenProps) {
  const { theme } = useTheme();
  const { drillId, title: paramTitle, focus: paramFocus } = route.params;
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);

  const contextDrill = getDrillById(drillId);
  const drill = contextDrill ? {
    ...contextDrill,
    sport: getSportForDrill(drillId),
  } : {
    ...DEFAULT_DRILL,
    title: paramTitle || DEFAULT_DRILL.title,
    focus: paramFocus || DEFAULT_DRILL.focus,
  };

  const toggleStep = (stepId: string) => {
    setCompletedSteps((prev) =>
      prev.includes(stepId)
        ? prev.filter((id) => id !== stepId)
        : [...prev, stepId]
    );
  };

  const progress = (completedSteps.length / drill.steps.length) * 100;

  return (
    <ScreenScrollView>
      <View
        style={[
          styles.videoContainer,
          { backgroundColor: theme.backgroundSecondary },
        ]}
      >
        <Pressable
          onPress={() => setIsPlaying(!isPlaying)}
          style={styles.videoPlaceholder}
        >
          <View
            style={[
              styles.playButton,
              { backgroundColor: theme.primary },
            ]}
          >
            <Feather
              name={isPlaying ? "pause" : "play"}
              size={32}
              color="#FFFFFF"
              style={{ marginLeft: isPlaying ? 0 : 4 }}
            />
          </View>
        </Pressable>
      </View>

      <Spacer height={Spacing.xl} />

      <View style={styles.headerRow}>
        <View style={styles.headerInfo}>
          <ThemedText type="h3">{drill.title}</ThemedText>
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Feather
                name="clock"
                size={14}
                color={theme.textSecondary}
                style={styles.metaIcon}
              />
              <ThemedText
                type="small"
                style={{ color: theme.textSecondary }}
              >
                {drill.duration}
              </ThemedText>
            </View>
            <View
              style={[
                styles.focusBadge,
                { backgroundColor: theme.primary + "20" },
              ]}
            >
              <ThemedText
                type="small"
                style={[styles.focusText, { color: theme.primary }]}
              >
                {drill.focus}
              </ThemedText>
            </View>
          </View>
        </View>
      </View>

      <Spacer height={Spacing.lg} />

      <ThemedText
        type="body"
        style={{ color: theme.textSecondary }}
      >
        {drill.description}
      </ThemedText>

      <Spacer height={Spacing["2xl"]} />

      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <ThemedText type="h4">Steps</ThemedText>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            {completedSteps.length} of {drill.steps.length}
          </ThemedText>
        </View>
        <View
          style={[
            styles.progressBar,
            { backgroundColor: theme.backgroundSecondary },
          ]}
        >
          <View
            style={[
              styles.progressFill,
              {
                backgroundColor: theme.success,
                width: `${progress}%`,
              },
            ]}
          />
        </View>
      </View>

      <Spacer height={Spacing.lg} />

      {drill.steps.map((step: { id: string; title: string; description: string }, index: number) => (
        <React.Fragment key={step.id}>
          <StepCard
            stepNumber={index + 1}
            title={step.title}
            description={step.description}
            completed={completedSteps.includes(step.id)}
            onToggle={() => toggleStep(step.id)}
          />
          <Spacer height={Spacing.sm} />
        </React.Fragment>
      ))}

      <Spacer height={Spacing["2xl"]} />

      <ThemedText type="h4">Pro Tips</ThemedText>
      <Spacer height={Spacing.md} />

      <View style={styles.tipRow}>
        <View
          style={[
            styles.tipIcon,
            { backgroundColor: theme.success + "20" },
          ]}
        >
          <Feather name="check-circle" size={16} color={theme.success} />
        </View>
        <ThemedText type="body" style={styles.tipText}>
          Practice consistently for best results
        </ThemedText>
      </View>
      <View style={styles.tipRow}>
        <View
          style={[
            styles.tipIcon,
            { backgroundColor: theme.success + "20" },
          ]}
        >
          <Feather name="check-circle" size={16} color={theme.success} />
        </View>
        <ThemedText type="body" style={styles.tipText}>
          Focus on form before speed or power
        </ThemedText>
      </View>
      <View style={styles.tipRow}>
        <View
          style={[
            styles.tipIcon,
            { backgroundColor: theme.success + "20" },
          ]}
        >
          <Feather name="check-circle" size={16} color={theme.success} />
        </View>
        <ThemedText type="body" style={styles.tipText}>
          Record yourself to identify areas for improvement
        </ThemedText>
      </View>

      <Spacer height={Spacing["4xl"]} />
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  videoContainer: {
    aspectRatio: 16 / 9,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
  },
  videoPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  playButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  headerInfo: {
    flex: 1,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.sm,
    gap: Spacing.md,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  metaIcon: {
    marginRight: Spacing.xs,
  },
  focusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xs,
  },
  focusText: {
    fontWeight: "500",
  },
  progressSection: {
    gap: Spacing.sm,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
  stepCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  stepNumberText: {
    fontWeight: "600",
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  tipRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: Spacing.md,
  },
  tipIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  tipText: {
    flex: 1,
    paddingTop: 2,
  },
});
