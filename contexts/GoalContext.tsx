import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const GOALS_STORAGE_KEY = "pocket_coach_goals";

export interface Goal {
  id: string;
  title: string;
  description: string;
  sport: string;
  category: "form" | "strength" | "consistency" | "speed" | "flexibility";
  targetValue: number;
  currentValue: number;
  unit: string;
  deadline: number;
  createdAt: number;
  updatedAt: number;
  isCompleted: boolean;
  milestones: {
    value: number;
    achievedAt: number | null;
  }[];
}

interface GoalProgress {
  goalId: string;
  value: number;
  recordedAt: number;
  videoId?: string;
  analysisScore?: number;
  notes?: string;
}

interface GoalContextType {
  goals: Goal[];
  progressHistory: GoalProgress[];
  addGoal: (
    goal: Omit<Goal, "id" | "createdAt" | "updatedAt" | "isCompleted">,
  ) => void;
  updateGoal: (id: string, updates: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
  recordProgress: (progress: Omit<GoalProgress, "recordedAt">) => void;
  getGoalProgress: (goalId: string) => GoalProgress[];
  getActiveGoals: () => Goal[];
  getCompletedGoals: () => Goal[];
}

const GoalContext = createContext<GoalContextType | undefined>(undefined);

export function GoalProvider({ children }: { children: ReactNode }) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [progressHistory, setProgressHistory] = useState<GoalProgress[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const stored = await AsyncStorage.getItem(GOALS_STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        setGoals(data.goals || []);
        setProgressHistory(data.progressHistory || []);
      }
    } catch (error) {
      console.error("Failed to load goals:", error);
    }
    setIsLoaded(true);
  };

  const saveData = useCallback(async () => {
    try {
      await AsyncStorage.setItem(
        GOALS_STORAGE_KEY,
        JSON.stringify({ goals, progressHistory }),
      );
    } catch (error) {
      console.error("Failed to save goals:", error);
    }
  }, [goals, progressHistory]);

  useEffect(() => {
    if (isLoaded) {
      saveData();
    }
  }, [goals, progressHistory, isLoaded, saveData]);

  const addGoal = (
    goalData: Omit<Goal, "id" | "createdAt" | "updatedAt" | "isCompleted">,
  ) => {
    const now = Date.now();
    const newGoal: Goal = {
      ...goalData,
      id: `goal_${now}_${Math.random().toString(36).substring(7)}`,
      createdAt: now,
      updatedAt: now,
      isCompleted: false,
    };
    setGoals((prev) => [...prev, newGoal]);
  };

  const updateGoal = (id: string, updates: Partial<Goal>) => {
    setGoals((prev) =>
      prev.map((goal) =>
        goal.id === id ? { ...goal, ...updates, updatedAt: Date.now() } : goal,
      ),
    );
  };

  const deleteGoal = (id: string) => {
    setGoals((prev) => prev.filter((goal) => goal.id !== id));
    setProgressHistory((prev) => prev.filter((p) => p.goalId !== id));
  };

  const recordProgress = (progress: Omit<GoalProgress, "recordedAt">) => {
    const newProgress: GoalProgress = {
      ...progress,
      recordedAt: Date.now(),
    };
    setProgressHistory((prev) => [...prev, newProgress]);

    const goal = goals.find((g) => g.id === progress.goalId);
    if (goal) {
      const isCompleted = progress.value >= goal.targetValue;
      const updatedMilestones = goal.milestones.map((m) =>
        m.achievedAt === null && progress.value >= m.value
          ? { ...m, achievedAt: Date.now() }
          : m,
      );

      updateGoal(progress.goalId, {
        currentValue: progress.value,
        isCompleted,
        milestones: updatedMilestones,
      });
    }
  };

  const getGoalProgress = (goalId: string) => {
    return progressHistory
      .filter((p) => p.goalId === goalId)
      .sort((a, b) => a.recordedAt - b.recordedAt);
  };

  const getActiveGoals = () => {
    return goals.filter((g) => !g.isCompleted);
  };

  const getCompletedGoals = () => {
    return goals.filter((g) => g.isCompleted);
  };

  return (
    <GoalContext.Provider
      value={{
        goals,
        progressHistory,
        addGoal,
        updateGoal,
        deleteGoal,
        recordProgress,
        getGoalProgress,
        getActiveGoals,
        getCompletedGoals,
      }}
    >
      {children}
    </GoalContext.Provider>
  );
}

export function useGoals() {
  const context = useContext(GoalContext);
  if (!context) {
    throw new Error("useGoals must be used within a GoalProvider");
  }
  return context;
}
