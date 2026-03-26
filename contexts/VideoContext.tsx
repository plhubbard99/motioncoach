import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { AnalysisResult } from "@/services/AnalysisService";

const STORAGE_KEY = "@pocket_coach_videos";
const ANALYSIS_STORAGE_KEY = "@pocket_coach_analyses";

export interface RecordedVideo {
  id: string;
  uri: string;
  title: string;
  date: string;
  duration: string;
  sport: string;
  isAnalyzed: boolean;
  createdAt: number;
}

interface VideoContextType {
  videos: RecordedVideo[];
  analyses: Record<string, AnalysisResult>;
  addVideo: (video: Omit<RecordedVideo, "id" | "createdAt">) => string;
  removeVideo: (id: string) => void;
  markAsAnalyzed: (id: string, result: AnalysisResult) => void;
  getVideo: (id: string) => RecordedVideo | undefined;
  getAnalysis: (id: string) => AnalysisResult | undefined;
  isLoading: boolean;
}

const VideoContext = createContext<VideoContextType | undefined>(undefined);

export function VideoProvider({ children }: { children: ReactNode }) {
  const [videos, setVideos] = useState<RecordedVideo[]>([]);
  const [analyses, setAnalyses] = useState<Record<string, AnalysisResult>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [storedVideos, storedAnalyses] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY),
        AsyncStorage.getItem(ANALYSIS_STORAGE_KEY),
      ]);
      if (storedVideos) {
        setVideos(JSON.parse(storedVideos));
      }
      if (storedAnalyses) {
        setAnalyses(JSON.parse(storedAnalyses));
      }
    } catch (error) {
      console.log("Error loading data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveVideos = async (newVideos: RecordedVideo[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newVideos));
    } catch (error) {
      console.log("Error saving videos:", error);
    }
  };

  const saveAnalyses = async (newAnalyses: Record<string, AnalysisResult>) => {
    try {
      await AsyncStorage.setItem(
        ANALYSIS_STORAGE_KEY,
        JSON.stringify(newAnalyses),
      );
    } catch (error) {
      console.log("Error saving analyses:", error);
    }
  };

  const addVideo = (video: Omit<RecordedVideo, "id" | "createdAt">) => {
    const id = `video_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newVideo: RecordedVideo = {
      ...video,
      id,
      createdAt: Date.now(),
    };
    const newVideos = [newVideo, ...videos];
    setVideos(newVideos);
    saveVideos(newVideos);
    return id;
  };

  const removeVideo = (id: string) => {
    const newVideos = videos.filter((v) => v.id !== id);
    setVideos(newVideos);
    saveVideos(newVideos);
    const newAnalyses = { ...analyses };
    delete newAnalyses[id];
    setAnalyses(newAnalyses);
    saveAnalyses(newAnalyses);
  };

  const markAsAnalyzed = (id: string, result: AnalysisResult) => {
    const newVideos = videos.map((v) =>
      v.id === id ? { ...v, isAnalyzed: true } : v,
    );
    setVideos(newVideos);
    saveVideos(newVideos);
    const newAnalyses = { ...analyses, [id]: result };
    setAnalyses(newAnalyses);
    saveAnalyses(newAnalyses);
  };

  const getVideo = (id: string) => {
    return videos.find((v) => v.id === id);
  };

  const getAnalysis = (id: string) => {
    return analyses[id];
  };

  return (
    <VideoContext.Provider
      value={{
        videos,
        analyses,
        addVideo,
        removeVideo,
        markAsAnalyzed,
        getVideo,
        getAnalysis,
        isLoading,
      }}
    >
      {children}
    </VideoContext.Provider>
  );
}

export function useVideos() {
  const context = useContext(VideoContext);
  if (context === undefined) {
    throw new Error("useVideos must be used within a VideoProvider");
  }
  return context;
}
