import { EventEmitter } from "eventemitter3";

// Global event emitter for real-time notifications
export const globalEvents = new EventEmitter();

// Event types
export const EVENT_TYPES = {
  QUEST_COMPLETED: 'quest:completed',
  QUEST_APPROVED: 'quest:approved', 
  QUEST_REJECTED: 'quest:rejected',
  TREASURE_COLLECTED: 'treasure:collected',
  FAMILY_MEMBER_ADDED: 'family:member_added',
  FAMILY_MEMBER_UPDATED: 'family:member_updated',
  POINTS_UPDATED: 'points:updated',
} as const;

// Event payload types
export interface QuestCompletedEvent {
  type: typeof EVENT_TYPES.QUEST_COMPLETED;
  familyId: string;
  questId: string;
  userId: string;
  userName: string;
  questTitle: string;
  completionId: string;
}

export interface QuestApprovedEvent {
  type: typeof EVENT_TYPES.QUEST_APPROVED;
  familyId: string;
  questId: string;
  userId: string;
  userName: string;
  questTitle: string;
  points: number;
  completionId: string;
}

export interface QuestRejectedEvent {
  type: typeof EVENT_TYPES.QUEST_REJECTED;
  familyId: string;
  questId: string;
  userId: string;
  userName: string;
  questTitle: string;
  completionId: string;
}

export interface TreasureCollectedEvent {
  type: typeof EVENT_TYPES.TREASURE_COLLECTED;
  familyId: string;
  questId: string;
  userId: string;
  userName: string;
  questTitle: string;
  points: number;
  completionId: string;
}

export interface FamilyMemberEvent {
  type: typeof EVENT_TYPES.FAMILY_MEMBER_ADDED | typeof EVENT_TYPES.FAMILY_MEMBER_UPDATED;
  familyId: string;
  userId: string;
  userName: string;
  role: string;
}

export interface PointsUpdatedEvent {
  type: typeof EVENT_TYPES.POINTS_UPDATED;
  familyId: string;
  userId: string;
  userName: string;
  newPoints: number;
  pointsChange: number;
}

export type FamilyEvent = 
  | QuestCompletedEvent 
  | QuestApprovedEvent 
  | QuestRejectedEvent 
  | TreasureCollectedEvent 
  | FamilyMemberEvent 
  | PointsUpdatedEvent;

// Helper function to emit family events
export function emitFamilyEvent(event: FamilyEvent) {
  globalEvents.emit(event.type, event);
  globalEvents.emit(`family:${event.familyId}`, event);
}