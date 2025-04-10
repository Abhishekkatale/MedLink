import { User, Post, Document, Event, Profile } from "@shared/schema";

export type SidebarLink = {
  href: string;
  label: string;
  icon: string;
  active?: boolean;
};

export type ColleagueDisplay = {
  id: number;
  name: string;
  initials: string;a
  colorClass: string;
};

export type StatCard = {
  title: string;
  value: number;
  icon: string;
  iconColor: string;
  change: number;
  timeframe: string;
};

export type PostWithAuthor = Post & {
  author: User;
  category: { name: string; color: string };
  discussCount: number;
  participants: { 
    id: number; 
    initials: string; 
    colorClass: string; 
  }[];
  saved: boolean;
};

export type DocumentWithSharing = Document & {
  icon: string;
  typeLabel: { name: string; color: string };
  sharedWith: {
    id: number;
    initials: string;
    colorClass: string;
  }[];
};

export type PeerSuggestion = User & {
  specialty: string;
  organization: string;
  mutualConnections: number;
  initials: string;
  colorClass: string;
};

export type UpcomingEvent = Event & {
  attendeeCount: number;
  eventType: { name: string; color: string };
  dateFormatted: {
    month: string;
    day: string;
  };
};

export type UserProfile = Profile & {
  name: string;
  initials: string;
  title: string;
  organization: string;
  profileCompletion: number;
  remainingItems: number;
  networkGrowth: number;
  networkGrowthDays: number;
};
