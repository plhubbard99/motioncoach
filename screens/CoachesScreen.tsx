import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Pressable,
  TextInput,
  Platform,
  Alert,
  Modal,
  Linking,
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
import { useCoaches, CoachContact } from "@/contexts/CoachContext";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

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

interface CoachCardProps {
  coach: CoachContact;
  onCall: () => void;
  onEmail: () => void;
  onToggleFavorite: () => void;
  onDelete: () => void;
}

function CoachCard({ coach, onCall, onEmail, onToggleFavorite, onDelete }: CoachCardProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handleLongPress = () => {
    showAlert(
      "Remove Coach",
      `Are you sure you want to remove "${coach.name}" from your contacts?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Remove", onPress: onDelete, style: "destructive" },
      ]
    );
  };

  return (
    <AnimatedPressable
      onLongPress={handleLongPress}
      onPressIn={() => {
        scale.value = withSpring(0.98, { damping: 15 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 15 });
      }}
      style={[
        styles.coachCard,
        { backgroundColor: theme.backgroundDefault },
        coach.isFavorite && { borderColor: theme.warning, borderWidth: 1 },
        animatedStyle,
      ]}
    >
      <View style={styles.coachCardHeader}>
        <View style={[styles.coachAvatar, { backgroundColor: theme.success + "20" }]}>
          <Feather name="user" size={28} color={theme.success} />
        </View>
        <Pressable onPress={onToggleFavorite} hitSlop={8} style={styles.favoriteButton}>
          <Feather
            name={coach.isFavorite ? "star" : "star"}
            size={20}
            color={coach.isFavorite ? theme.warning : theme.textSecondary}
            style={{ opacity: coach.isFavorite ? 1 : 0.5 }}
          />
        </Pressable>
      </View>

      <ThemedText type="body" style={{ fontWeight: "600", marginTop: Spacing.md }}>
        {coach.name}
      </ThemedText>
      <ThemedText type="small" style={{ color: theme.primary, marginTop: 2 }}>
        {coach.specialty}
      </ThemedText>

      <View style={styles.availabilityRow}>
        <View style={[styles.availabilityDot, { backgroundColor: theme.success }]} />
        <ThemedText type="small" style={{ color: theme.textSecondary }}>
          {coach.availability}
        </ThemedText>
      </View>

      {coach.notes ? (
        <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: Spacing.sm, fontStyle: "italic" }}>
          "{coach.notes}"
        </ThemedText>
      ) : null}

      <View style={styles.contactButtons}>
        {coach.phone ? (
          <Pressable onPress={onCall} style={[styles.contactButton, { backgroundColor: theme.success + "20" }]}>
            <Feather name="phone" size={18} color={theme.success} />
            <ThemedText type="small" style={{ color: theme.success, marginLeft: Spacing.xs, fontWeight: "600" }}>
              Call
            </ThemedText>
          </Pressable>
        ) : null}
        {coach.email ? (
          <Pressable onPress={onEmail} style={[styles.contactButton, { backgroundColor: theme.primary + "20" }]}>
            <Feather name="mail" size={18} color={theme.primary} />
            <ThemedText type="small" style={{ color: theme.primary, marginLeft: Spacing.xs, fontWeight: "600" }}>
              Email
            </ThemedText>
          </Pressable>
        ) : null}
      </View>
    </AnimatedPressable>
  );
}

interface AddCoachModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (coach: Omit<CoachContact, "id" | "createdAt" | "isFavorite">) => void;
}

function AddCoachModal({ visible, onClose, onAdd }: AddCoachModalProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [availability, setAvailability] = useState("Available on request");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");

  const resetForm = () => {
    setName("");
    setSpecialty("");
    setAvailability("Available on request");
    setPhone("");
    setEmail("");
    setNotes("");
  };

  const handleAdd = () => {
    if (!name.trim()) {
      showAlert("Missing Name", "Please enter the coach's name.");
      return;
    }
    if (!specialty.trim()) {
      showAlert("Missing Specialty", "Please enter the coach's specialty.");
      return;
    }
    if (!phone.trim() && !email.trim()) {
      showAlert("Contact Required", "Please provide at least a phone number or email address.");
      return;
    }

    onAdd({
      name: name.trim(),
      specialty: specialty.trim(),
      availability: availability.trim() || "Available on request",
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      notes: notes.trim() || undefined,
    });

    resetForm();
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <ThemedView style={[styles.modalContainer, { paddingTop: insets.top + Spacing.lg }]}>
        <View style={styles.modalHeader}>
          <ThemedText type="h3">Add Coach</ThemedText>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <Feather name="x" size={24} color={theme.text} />
          </Pressable>
        </View>

        <ScreenScrollView>
          <ThemedText type="body" style={{ fontWeight: "600", marginBottom: Spacing.sm }}>
            Coach Name
          </ThemedText>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g., Coach Sarah Johnson"
            placeholderTextColor={theme.textSecondary}
            style={[
              styles.input,
              { backgroundColor: theme.backgroundDefault, color: theme.text, borderColor: theme.border },
            ]}
          />

          <Spacer height={Spacing.lg} />

          <ThemedText type="body" style={{ fontWeight: "600", marginBottom: Spacing.sm }}>
            Specialty
          </ThemedText>
          <TextInput
            value={specialty}
            onChangeText={setSpecialty}
            placeholder="e.g., Pitching Coach, Strength Training"
            placeholderTextColor={theme.textSecondary}
            style={[
              styles.input,
              { backgroundColor: theme.backgroundDefault, color: theme.text, borderColor: theme.border },
            ]}
          />

          <Spacer height={Spacing.lg} />

          <ThemedText type="body" style={{ fontWeight: "600", marginBottom: Spacing.sm }}>
            Availability
          </ThemedText>
          <TextInput
            value={availability}
            onChangeText={setAvailability}
            placeholder="e.g., Weekdays 9am-5pm"
            placeholderTextColor={theme.textSecondary}
            style={[
              styles.input,
              { backgroundColor: theme.backgroundDefault, color: theme.text, borderColor: theme.border },
            ]}
          />

          <Spacer height={Spacing.lg} />

          <ThemedText type="body" style={{ fontWeight: "600", marginBottom: Spacing.sm }}>
            Phone Number
          </ThemedText>
          <TextInput
            value={phone}
            onChangeText={setPhone}
            placeholder="+1 (555) 123-4567"
            placeholderTextColor={theme.textSecondary}
            keyboardType="phone-pad"
            style={[
              styles.input,
              { backgroundColor: theme.backgroundDefault, color: theme.text, borderColor: theme.border },
            ]}
          />

          <Spacer height={Spacing.lg} />

          <ThemedText type="body" style={{ fontWeight: "600", marginBottom: Spacing.sm }}>
            Email Address
          </ThemedText>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="coach@example.com"
            placeholderTextColor={theme.textSecondary}
            keyboardType="email-address"
            autoCapitalize="none"
            style={[
              styles.input,
              { backgroundColor: theme.backgroundDefault, color: theme.text, borderColor: theme.border },
            ]}
          />

          <Spacer height={Spacing.lg} />

          <ThemedText type="body" style={{ fontWeight: "600", marginBottom: Spacing.sm }}>
            Notes (Optional)
          </ThemedText>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Any additional notes about this coach"
            placeholderTextColor={theme.textSecondary}
            multiline
            numberOfLines={3}
            style={[
              styles.input,
              styles.textArea,
              { backgroundColor: theme.backgroundDefault, color: theme.text, borderColor: theme.border },
            ]}
          />

          <Spacer height={Spacing["2xl"]} />

          <Pressable
            onPress={handleAdd}
            style={[styles.addButton, { backgroundColor: theme.success }]}
          >
            <Feather name="user-plus" size={20} color="#FFFFFF" />
            <ThemedText type="body" style={{ color: "#FFFFFF", fontWeight: "600", marginLeft: Spacing.sm }}>
              Add Coach
            </ThemedText>
          </Pressable>

          <Spacer height={Spacing["4xl"]} />
        </ScreenScrollView>
      </ThemedView>
    </Modal>
  );
}

export default function CoachesScreen() {
  const { theme } = useTheme();
  const { coaches, addCoach, deleteCoach, toggleFavorite, getFavoriteCoaches } = useCoaches();
  const [showAddModal, setShowAddModal] = useState(false);
  const [filter, setFilter] = useState<"all" | "favorites">("all");

  const favoriteCoaches = getFavoriteCoaches();
  const filteredCoaches = filter === "favorites" ? favoriteCoaches : coaches;

  const handleCall = async (phone: string) => {
    const url = `tel:${phone}`;
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        showAlert("Cannot Make Call", "Your device doesn't support phone calls.");
      }
    } catch (error) {
      showAlert("Error", "Failed to initiate call.");
    }
  };

  const handleEmail = async (email: string) => {
    const url = `mailto:${email}`;
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        showAlert("Cannot Send Email", "No email app available.");
      }
    } catch (error) {
      showAlert("Error", "Failed to open email.");
    }
  };

  return (
    <ScreenScrollView>
      <View style={[styles.headerCard, { backgroundColor: theme.backgroundDefault }]}>
        <View style={[styles.headerIcon, { backgroundColor: theme.success + "20" }]}>
          <Feather name="users" size={24} color={theme.success} />
        </View>
        <View style={styles.headerText}>
          <ThemedText type="h4">Your Coaching Network</ThemedText>
          <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: Spacing.xs }}>
            {coaches.length} coach{coaches.length !== 1 ? "es" : ""} in your network
          </ThemedText>
        </View>
      </View>

      <Spacer height={Spacing.lg} />

      <View style={styles.filterRow}>
        <Pressable
          onPress={() => setFilter("all")}
          style={[
            styles.filterButton,
            { backgroundColor: filter === "all" ? theme.primary : theme.backgroundDefault },
          ]}
        >
          <ThemedText
            type="small"
            style={{ color: filter === "all" ? "#FFFFFF" : theme.text, fontWeight: "600" }}
          >
            All ({coaches.length})
          </ThemedText>
        </Pressable>
        <Pressable
          onPress={() => setFilter("favorites")}
          style={[
            styles.filterButton,
            { backgroundColor: filter === "favorites" ? theme.warning : theme.backgroundDefault },
          ]}
        >
          <Feather
            name="star"
            size={14}
            color={filter === "favorites" ? "#FFFFFF" : theme.warning}
            style={{ marginRight: Spacing.xs }}
          />
          <ThemedText
            type="small"
            style={{ color: filter === "favorites" ? "#FFFFFF" : theme.text, fontWeight: "600" }}
          >
            Favorites ({favoriteCoaches.length})
          </ThemedText>
        </Pressable>
      </View>

      <Spacer height={Spacing.lg} />

      {filteredCoaches.length === 0 ? (
        <Animated.View entering={FadeIn} style={[styles.emptyState, { backgroundColor: theme.backgroundDefault }]}>
          <View style={[styles.emptyIcon, { backgroundColor: theme.success + "20" }]}>
            <Feather name="user-plus" size={32} color={theme.success} />
          </View>
          <ThemedText type="body" style={{ fontWeight: "600", marginTop: Spacing.md }}>
            {filter === "favorites" ? "No Favorite Coaches" : "No Coaches Yet"}
          </ThemedText>
          <ThemedText type="small" style={{ color: theme.textSecondary, textAlign: "center", marginTop: Spacing.xs }}>
            {filter === "favorites"
              ? "Star your favorite coaches to see them here"
              : "Add coaches to get personalized feedback and stay connected"}
          </ThemedText>
          {filter === "all" ? (
            <Pressable
              onPress={() => setShowAddModal(true)}
              style={[styles.emptyAddButton, { backgroundColor: theme.success }]}
            >
              <Feather name="plus" size={18} color="#FFFFFF" />
              <ThemedText type="body" style={{ color: "#FFFFFF", fontWeight: "600", marginLeft: Spacing.sm }}>
                Add Your First Coach
              </ThemedText>
            </Pressable>
          ) : null}
        </Animated.View>
      ) : (
        <View style={styles.coachGrid}>
          {filteredCoaches.map((coach) => (
            <CoachCard
              key={coach.id}
              coach={coach}
              onCall={() => coach.phone && handleCall(coach.phone)}
              onEmail={() => coach.email && handleEmail(coach.email)}
              onToggleFavorite={() => toggleFavorite(coach.id)}
              onDelete={() => deleteCoach(coach.id)}
            />
          ))}
        </View>
      )}

      <Spacer height={Spacing["4xl"]} />

      <Pressable
        onPress={() => setShowAddModal(true)}
        style={[styles.fab, { backgroundColor: theme.success }]}
      >
        <Feather name="plus" size={24} color="#FFFFFF" />
      </Pressable>

      <AddCoachModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={addCoach}
      />
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  headerCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  filterRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.xs,
  },
  coachGrid: {
    gap: Spacing.md,
  },
  coachCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  coachCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  coachAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  favoriteButton: {
    padding: Spacing.sm,
  },
  availabilityRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.sm,
  },
  availabilityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: Spacing.xs,
  },
  contactButtons: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
  contactButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    flex: 1,
    justifyContent: "center",
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
  emptyAddButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.lg,
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
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
});
