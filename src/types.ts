export type ReflectionMode = 'reflection' | 'summary' | 'brainstorm' | 'conversation';

export interface ConversationTurn {
  role: 'user' | 'model';
  content: string;
  timestamp: string;
}

export interface JournalLocation {
  latitude: number;
  longitude: number;
  name?: string;
  address?: string;
  placeId?: string;
}

export interface UserInteraction {
  id: string;
  userId: string;
  title: string;
  prompt: string;
  response: string;
  mode: ReflectionMode;
  turns: ConversationTurn[];
  location?: JournalLocation;
  createdAt: string;
  updatedAt: string;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export interface LinkedInProfile {
  sub: string;
  name: string;
  email?: string;
  picture?: string;
  given_name?: string;
  family_name?: string;
}

export interface LinkedInStatus {
  isConnected: boolean;
  profile: LinkedInProfile | null;
  configured: boolean;
}

export interface LinkedInShareRequest {
  commentary: string;
  title?: string;
  prompt?: string;
  response?: string;
  location?: JournalLocation;
  tags?: string[];
}

export interface LinkedInShareResponse {
  success: boolean;
  postId?: string;
  postUrl?: string;
  error?: string;
}
