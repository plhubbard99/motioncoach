import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Pressable,
  TextInput,
  ScrollView,
  Linking,
} from "react-native";
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
import { Spacing, BorderRadius, Typography } from "@/constants/theme";
import Spacer from "@/components/Spacer";
import type { LibraryStackParamList } from "@/navigation/LibraryStackNavigator";
import {
  useSport,
  getDrillsForSport,
  SPORT_DRILLS,
} from "@/contexts/SportContext";

type LibraryScreenProps = {
  navigation: NativeStackNavigationProp<LibraryStackParamList, "Library">;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const SPORTS = ["All", ...Object.keys(SPORT_DRILLS)];

type SearchSource = "library" | "external";

interface DrillCardProps {
  title: string;
  sport: string;
  duration: string;
  focus: string;
  onPress: () => void;
}

function DrillCard({ title, sport, duration, focus, onPress }: DrillCardProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

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
        styles.drillCard,
        { backgroundColor: theme.backgroundDefault },
        animatedStyle,
      ]}
    >
      <View
        style={[
          styles.drillThumbnail,
          { backgroundColor: theme.backgroundSecondary },
        ]}
      >
        <Feather name="play-circle" size={32} color={theme.primary} />
      </View>
      <View style={styles.drillContent}>
        <ThemedText type="body" style={styles.drillTitle}>
          {title}
        </ThemedText>
        <View style={styles.drillMeta}>
          <View style={styles.metaItem}>
            <Feather
              name="clock"
              size={12}
              color={theme.textSecondary}
              style={styles.metaIcon}
            />
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              {duration}
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
              {focus}
            </ThemedText>
          </View>
        </View>
        <ThemedText
          type="small"
          style={{ color: theme.textSecondary, marginTop: Spacing.xs }}
        >
          {sport}
        </ThemedText>
      </View>
    </AnimatedPressable>
  );
}

interface ExternalResultCardProps {
  title: string;
  source: string;
  url: string;
  verified: boolean;
  onPress: () => void;
}

function ExternalResultCard({
  title,
  source,
  verified,
  onPress,
}: ExternalResultCardProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

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
        styles.externalCard,
        { backgroundColor: theme.backgroundDefault },
        animatedStyle,
      ]}
    >
      <View
        style={[
          styles.externalIcon,
          { backgroundColor: theme.backgroundSecondary },
        ]}
      >
        <Feather name="external-link" size={20} color={theme.primary} />
      </View>
      <View style={styles.externalContent}>
        <ThemedText type="body" style={styles.externalTitle} numberOfLines={2}>
          {title}
        </ThemedText>
        <View style={styles.sourceRow}>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            {source}
          </ThemedText>
          {verified ? (
            <View
              style={[
                styles.verifiedBadge,
                { backgroundColor: theme.success + "20" },
              ]}
            >
              <Feather name="check-circle" size={10} color={theme.success} />
              <ThemedText
                type="small"
                style={[styles.verifiedText, { color: theme.success }]}
              >
                Verified
              </ThemedText>
            </View>
          ) : null}
        </View>
      </View>
      <Feather name="chevron-right" size={20} color={theme.textSecondary} />
    </AnimatedPressable>
  );
}

interface FilterChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

function FilterChip({ label, selected, onPress }: FilterChipProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.95, { damping: 15 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 15 });
      }}
      style={[
        styles.filterChip,
        {
          backgroundColor: selected ? theme.primary : theme.backgroundDefault,
          borderColor: selected ? theme.primary : theme.border,
        },
        animatedStyle,
      ]}
    >
      <ThemedText
        type="small"
        style={[
          styles.filterChipText,
          { color: selected ? "#FFFFFF" : theme.text },
        ]}
      >
        {label}
      </ThemedText>
    </AnimatedPressable>
  );
}

interface SourceToggleProps {
  source: SearchSource;
  onSourceChange: (source: SearchSource) => void;
}

function SourceToggle({ source, onSourceChange }: SourceToggleProps) {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.sourceToggle,
        { backgroundColor: theme.backgroundSecondary },
      ]}
    >
      <Pressable
        onPress={() => onSourceChange("library")}
        style={[
          styles.sourceOption,
          source === "library" && { backgroundColor: theme.primary },
        ]}
      >
        <Feather
          name="folder"
          size={14}
          color={source === "library" ? "#FFFFFF" : theme.textSecondary}
        />
        <ThemedText
          type="small"
          style={[
            styles.sourceText,
            { color: source === "library" ? "#FFFFFF" : theme.text },
          ]}
        >
          Pocket Coach
        </ThemedText>
      </Pressable>
      <Pressable
        onPress={() => onSourceChange("external")}
        style={[
          styles.sourceOption,
          source === "external" && { backgroundColor: theme.primary },
        ]}
      >
        <Feather
          name="globe"
          size={14}
          color={source === "external" ? "#FFFFFF" : theme.textSecondary}
        />
        <ThemedText
          type="small"
          style={[
            styles.sourceText,
            { color: source === "external" ? "#FFFFFF" : theme.text },
          ]}
        >
          External Sites
        </ThemedText>
      </Pressable>
    </View>
  );
}

function getSportForDrill(drillId: string): string {
  for (const [sport, drills] of Object.entries(SPORT_DRILLS)) {
    if (drills.some((d) => d.id === drillId)) {
      return sport;
    }
  }
  return "General";
}

const MOCK_EXTERNAL_RESULTS = [
  {
    id: "e1",
    title: "Complete Guide to Basketball Shooting Form",
    source: "YouTube - Coach Carter",
    url: "https://youtube.com",
    verified: true,
  },
  {
    id: "e2",
    title: "Golf Swing Tips from PGA Pros",
    source: "Golf Digest",
    url: "https://golfdigest.com",
    verified: true,
  },
  {
    id: "e3",
    title: "Tennis Serve Masterclass",
    source: "Tennis Channel Academy",
    url: "https://tennischannel.com",
    verified: true,
  },
  {
    id: "e4",
    title: "Pro Running Form Analysis",
    source: "Runner's World",
    url: "https://runnersworld.com",
    verified: true,
  },
  {
    id: "e5",
    title: "Softball Pitching Techniques",
    source: "Fastpitch Network",
    url: "https://fastpitch.com",
    verified: false,
  },
  {
    id: "e6",
    title: "NFL Quarterback Training",
    source: "ESPN Training",
    url: "https://espn.com",
    verified: true,
  },
];

export default function LibraryScreen({ navigation }: LibraryScreenProps) {
  const { theme } = useTheme();
  const { selectedSport: globalSport } = useSport();
  const [searchQuery, setSearchQuery] = useState("");
  const [localSelectedSport, setLocalSelectedSport] = useState("All");
  const [searchSource, setSearchSource] = useState<SearchSource>("library");

  const effectiveSport =
    globalSport && localSelectedSport === "All"
      ? globalSport
      : localSelectedSport;
  const allDrills = getDrillsForSport(
    effectiveSport === "All" ? null : effectiveSport,
  );

  const filteredDrills = allDrills
    .filter((drill) => {
      const matchesSearch = drill.title
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      return matchesSearch;
    })
    .map((drill) => ({
      ...drill,
      sport: getSportForDrill(drill.id),
    }));

  const filteredExternal = MOCK_EXTERNAL_RESULTS.filter((result) =>
    result.title.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleExternalPress = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch {}
  };

  return (
    <ScreenScrollView>
      <View
        style={[
          styles.searchContainer,
          { backgroundColor: theme.backgroundDefault },
        ]}
      >
        <Feather
          name="search"
          size={18}
          color={theme.textSecondary}
          style={styles.searchIcon}
        />
        <TextInput
          style={[styles.searchInput, { color: theme.text }]}
          placeholder={
            searchSource === "library"
              ? "Search Pocket Coach drills..."
              : "Search verified external sites..."
          }
          placeholderTextColor={theme.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 ? (
          <Pressable
            onPress={() => setSearchQuery("")}
            hitSlop={8}
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
          >
            <Feather name="x" size={18} color={theme.textSecondary} />
          </Pressable>
        ) : null}
      </View>

      <Spacer height={Spacing.md} />

      <SourceToggle source={searchSource} onSourceChange={setSearchSource} />

      <Spacer height={Spacing.lg} />

      {searchSource === "library" ? (
        <>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersContainer}
          >
            {SPORTS.map((sport) => (
              <FilterChip
                key={sport}
                label={sport}
                selected={localSelectedSport === sport}
                onPress={() => setLocalSelectedSport(sport)}
              />
            ))}
          </ScrollView>

          <Spacer height={Spacing.xl} />

          <ThemedText type="h4">
            {effectiveSport === "All"
              ? "All Drills"
              : `${effectiveSport} Drills`}
          </ThemedText>

          <Spacer height={Spacing.md} />

          {filteredDrills.length > 0 ? (
            filteredDrills.map((drill) => (
              <React.Fragment key={drill.id}>
                <DrillCard
                  title={drill.title}
                  sport={drill.sport}
                  duration={drill.duration}
                  focus={drill.focus}
                  onPress={() =>
                    navigation.navigate("DrillDetail", { drillId: drill.id })
                  }
                />
                <Spacer height={Spacing.md} />
              </React.Fragment>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Feather
                name="search"
                size={48}
                color={theme.textSecondary}
                style={{ opacity: 0.5 }}
              />
              <Spacer height={Spacing.md} />
              <ThemedText
                type="body"
                style={[styles.emptyText, { color: theme.textSecondary }]}
              >
                No drills found in library
              </ThemedText>
            </View>
          )}
        </>
      ) : (
        <>
          <View style={styles.externalHeader}>
            <Feather name="shield" size={16} color={theme.success} />
            <ThemedText
              type="small"
              style={{ color: theme.textSecondary, marginLeft: Spacing.sm }}
            >
              Showing results from verified coaching websites
            </ThemedText>
          </View>

          <Spacer height={Spacing.lg} />

          <ThemedText type="h4">External Resources</ThemedText>

          <Spacer height={Spacing.md} />

          {filteredExternal.length > 0 ? (
            filteredExternal.map((result) => (
              <React.Fragment key={result.id}>
                <ExternalResultCard
                  title={result.title}
                  source={result.source}
                  url={result.url}
                  verified={result.verified}
                  onPress={() => handleExternalPress(result.url)}
                />
                <Spacer height={Spacing.md} />
              </React.Fragment>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Feather
                name="globe"
                size={48}
                color={theme.textSecondary}
                style={{ opacity: 0.5 }}
              />
              <Spacer height={Spacing.md} />
              <ThemedText
                type="body"
                style={[styles.emptyText, { color: theme.textSecondary }]}
              >
                No external resources found
              </ThemedText>
            </View>
          )}
        </>
      )}

      <Spacer height={Spacing["3xl"]} />
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    height: Spacing.inputHeight,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.body.fontSize,
  },
  sourceToggle: {
    flexDirection: "row",
    borderRadius: BorderRadius.md,
    padding: 4,
  },
  sourceOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    gap: Spacing.xs,
  },
  sourceText: {
    fontWeight: "500",
  },
  filtersContainer: {
    flexDirection: "row",
    gap: Spacing.sm,
    paddingRight: Spacing.xl,
  },
  filterChip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  filterChipText: {
    fontWeight: "500",
  },
  drillCard: {
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
  },
  drillThumbnail: {
    height: 120,
    alignItems: "center",
    justifyContent: "center",
  },
  drillContent: {
    padding: Spacing.lg,
  },
  drillTitle: {
    fontWeight: "600",
    marginBottom: Spacing.sm,
  },
  drillMeta: {
    flexDirection: "row",
    alignItems: "center",
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
  externalHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
  },
  externalCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  externalIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  externalContent: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  externalTitle: {
    fontWeight: "600",
    marginBottom: 4,
  },
  sourceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: "500",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing["5xl"],
  },
  emptyText: {
    textAlign: "center",
  },
});
