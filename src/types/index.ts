export const CATEGORIES = [
  "Books",
  "Calculators",
  "Electronics",
  "Lab Equipment",
  "Stationery",
  "Study Materials",
  "Other",
] as const;

export const CONDITIONS = ["New", "Good", "Fair", "Used"] as const;

export const AVAILABILITY_STATUSES = ["Available", "Borrowed"] as const;

export type Category = (typeof CATEGORIES)[number];
export type Condition = (typeof CONDITIONS)[number];
export type AvailabilityStatus = (typeof AVAILABILITY_STATUSES)[number];

export interface Resource {
  id: string;
  name: string;
  category: string;
  description: string;
  owner_name: string;
  owner_id: string;
  owner_contact: string;
  condition: string;
  availability_status: string;
  borrower_name: string | null;
  borrower_id: string | null;
  borrowed_at: string | null;
  expected_return_date: string | null;
  created_at: string;
}

export interface BorrowingHistory {
  id: string;
  resource_id: string | null;
  resource_name: string;
  borrower_name: string;
  borrower_id: string;
  borrowed_at: string;
  returned_at: string;
  expected_return_date: string | null;
  created_at: string;
}

export interface AIRecommendation {
  resource_id: string;
  reason: string;
  resource: {
    id: string;
    name: string;
    category: string;
    description: string;
    condition: string;
  };
}

export interface AIRecommendResponse {
  recommendations: AIRecommendation[];
  message: string;
}

export interface AICategorizeResponse {
  category: string;
  confidence: string;
}
