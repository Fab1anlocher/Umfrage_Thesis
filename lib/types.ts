export type GroupAssignment = 'A' | 'B';

export interface Demographics {
  ageGroup: string;
  regionType: 'stadt' | 'agglomeration' | 'land';
  gender: string;
  politicalOrientation: number; // 1–5
  decisionStyle: number; // 1–5
}

export interface BannerData {
  bannerAUrl: string | null;
  bannerBUrl: string | null;
  bannerAType: 'personalized' | 'neutral';
  bannerBType: 'personalized' | 'neutral';
  fallbackUsed: boolean;
}

export interface ParticipantPayload {
  group_assignment: GroupAssignment;
  age_group: string;
  region_type: string;
  gender: string;
  political_orientation: number;
  decision_style: number;
}

export interface ResponsePayload {
  participant_id: string;
  initiative_id: number;
  group_assignment: GroupAssignment;
  banner_a_type: 'personalized' | 'neutral';
  banner_b_type: 'personalized' | 'neutral';
  voting_intention: number;
  preferred_banner: 'A' | 'B' | 'none';
  persuasiveness_a: number;
  persuasiveness_b: number;
  fallback_used: boolean;
}
