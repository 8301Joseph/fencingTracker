export type Weapon = 'foil' | 'epee' | 'sabre';
export type SessionType = 'lesson' | 'open_fencing' | 'drills' | 'competition' | 'conditioning' | 'other';

export type TakeawayCategory =
  | 'technique'
  | 'footwork'
  | 'tactics'
  | 'bouts'
  | 'conditioning'
  | 'mental'
  | 'coach_feedback'
  | 'action_item'
  | 'injury';

export interface TakeawayPayload {
  category: TakeawayCategory;
  content: string;
  is_action_item: boolean;
}

export interface ExtractedSession {
  summary: string;
  weapon: Weapon | null;
  session_type: SessionType | null;
  takeaways: TakeawayPayload[];
}

export interface SessionRow {
  id: string;
  user_name: 'Joseph' | 'Sophia';
  session_date: string;
  weapon: Weapon | null;
  session_type: SessionType | null;
  duration_minutes: number | null;
  club: string | null;
  coach: string | null;
  audio_url: string | null;
  transcript: string;
  summary: string | null;
  created_at: string;
}

export interface TakeawayRow {
  id: string;
  session_id: string;
  category: TakeawayCategory;
  content: string;
  is_action_item: boolean;
  completed: boolean;
  created_at: string;
}
