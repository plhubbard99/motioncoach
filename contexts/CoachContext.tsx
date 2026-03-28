import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const COACHES_STORAGE_KEY = "pocket_coach_coaches";

export interface CoachContact {
  id: string;
  name: string;
  specialty: string;
  availability: string;
  phone?: string;
  email?: string;
  notes?: string;
  isFavorite: boolean;
  createdAt: number;
}

interface CoachContextType {
  coaches: CoachContact[];
  addCoach: (
    coach: Omit<CoachContact, "id" | "createdAt" | "isFavorite">,
  ) => void;
  updateCoach: (id: string, updates: Partial<CoachContact>) => void;
  deleteCoach: (id: string) => void;
  toggleFavorite: (id: string) => void;
  getFavoriteCoaches: () => CoachContact[];
}

const CoachContext = createContext<CoachContextType | undefined>(undefined);

export function CoachProvider({ children }: { children: ReactNode }) {
  const [coaches, setCoaches] = useState<CoachContact[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const stored = await AsyncStorage.getItem(COACHES_STORAGE_KEY);
      if (stored) {
        setCoaches(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Failed to load coaches:", error);
    }
    setIsLoaded(true);
  };

  const saveData = useCallback(async () => {
    try {
      await AsyncStorage.setItem(COACHES_STORAGE_KEY, JSON.stringify(coaches));
    } catch (error) {
      console.error("Failed to save coaches:", error);
    }
  }, [coaches]);

  useEffect(() => {
    if (isLoaded) {
      saveData();
    }
  }, [coaches, isLoaded, saveData]);

  const addCoach = (
    coachData: Omit<CoachContact, "id" | "createdAt" | "isFavorite">,
  ) => {
    const now = Date.now();
    const newCoach: CoachContact = {
      ...coachData,
      id: `coach_${now}_${Math.random().toString(36).substring(7)}`,
      createdAt: now,
      isFavorite: false,
    };
    setCoaches((prev) => [...prev, newCoach]);
  };

  const updateCoach = (id: string, updates: Partial<CoachContact>) => {
    setCoaches((prev) =>
      prev.map((coach) => (coach.id === id ? { ...coach, ...updates } : coach)),
    );
  };

  const deleteCoach = (id: string) => {
    setCoaches((prev) => prev.filter((coach) => coach.id !== id));
  };

  const toggleFavorite = (id: string) => {
    setCoaches((prev) =>
      prev.map((coach) =>
        coach.id === id ? { ...coach, isFavorite: !coach.isFavorite } : coach,
      ),
    );
  };

  const getFavoriteCoaches = () => {
    return coaches.filter((c) => c.isFavorite);
  };

  return (
    <CoachContext.Provider
      value={{
        coaches,
        addCoach,
        updateCoach,
        deleteCoach,
        toggleFavorite,
        getFavoriteCoaches,
      }}
    >
      {children}
    </CoachContext.Provider>
  );
}

export function useCoaches() {
  const context = useContext(CoachContext);
  if (!context) {
    throw new Error("useCoaches must be used within a CoachProvider");
  }
  return context;
}
