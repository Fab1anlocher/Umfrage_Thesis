export type GroupAssignment = 'A' | 'B';

export type DecisionStyle = 'rational' | 'ausgewogen' | 'emotional';

export interface Demographics {
  ageGroup: string;
  gender: 'männlich' | 'weiblich';
  politicalOrientation: number; // 1–5
  decisionStyle: DecisionStyle;
}

export interface BannerData {
  bannerUrl: string | null;
  bannerType: 'personalized' | 'neutral';
  fallbackUsed: boolean;
}

export interface ParticipantPayload {
  group_assignment: GroupAssignment;
  age_group: string;
  gender: string;
  political_orientation: number;
  decision_style: DecisionStyle;
}

export interface ResponsePayload {
  participant_id: string;
  initiative_id: number;
  group_assignment: GroupAssignment;
  banner_type: 'personalized' | 'neutral';
  voting_intention: number;   // 1–7
  credibility: number;        // 1–7
  personalization_felt: number; // 1–7
  fallback_used: boolean;
}
