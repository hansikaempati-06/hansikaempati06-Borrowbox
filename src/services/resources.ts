import { supabase } from "@/lib/supabase";
import type {
  Resource,
  BorrowingHistory,
  AIRecommendResponse,
  AICategorizeResponse,
} from "@/types";

// ---- Resource CRUD operations ----

export async function fetchResources(): Promise<Resource[]> {
  const { data, error } = await supabase
    .from("resources")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function fetchResourceById(id: string): Promise<Resource | null> {
  const { data, error } = await supabase
    .from("resources")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function createResource(
  payload: Omit<Resource, "id" | "created_at" | "availability_status" | "borrower_name" | "borrower_id" | "borrowed_at" | "expected_return_date">
): Promise<Resource> {
  const { data, error } = await supabase
    .from("resources")
    .insert({
      name: payload.name,
      category: payload.category,
      description: payload.description,
      owner_name: payload.owner_name,
      owner_id: payload.owner_id,
      owner_contact: payload.owner_contact,
      condition: payload.condition,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateResource(id: string, updates: Partial<Resource>): Promise<Resource> {
  const { data, error } = await supabase
    .from("resources")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteResource(id: string): Promise<void> {
  const { error } = await supabase.from("resources").delete().eq("id", id);
  if (error) throw error;
}

// ---- Borrow workflow ----
// Before borrowing, re-fetch the resource to verify it's still available.
// This prevents double-borrowing in a concurrent scenario.

export async function borrowResource(
  resourceId: string,
  borrowerName: string,
  borrowerId: string,
  expectedReturnDate: string
): Promise<Resource> {
  // Re-fetch to verify availability (optimistic concurrency check)
  const current = await fetchResourceById(resourceId);
  if (!current) {
    throw new Error("Resource not found.");
  }
  if (current.availability_status !== "Available") {
    throw new Error("This resource has already been borrowed by someone else.");
  }

  // Update the resource to Borrowed status
  const { data, error } = await supabase
    .from("resources")
    .update({
      availability_status: "Borrowed",
      borrower_name: borrowerName,
      borrower_id: borrowerId,
      borrowed_at: new Date().toISOString(),
      expected_return_date: expectedReturnDate,
    })
    .eq("id", resourceId)
    .eq("availability_status", "Available") // extra guard: only update if still available
    .select()
    .single();

  if (error) throw error;
  if (!data) {
    throw new Error("This resource was borrowed by someone else just now. Please refresh and try again.");
  }
  return data;
}

// ---- Return workflow ----
// Returns the resource and creates a borrowing_history record.

export async function returnResource(resourceId: string): Promise<void> {
  const resource = await fetchResourceById(resourceId);
  if (!resource) {
    throw new Error("Resource not found.");
  }
  if (resource.availability_status !== "Borrowed") {
    throw new Error("This resource is not currently borrowed.");
  }

  // Create a borrowing history record
  const { error: historyError } = await supabase.from("borrowing_history").insert({
    resource_id: resource.id,
    resource_name: resource.name,
    borrower_name: resource.borrower_name || "Unknown",
    borrower_id: resource.borrower_id || "Unknown",
    borrowed_at: resource.borrowed_at || new Date().toISOString(),
    returned_at: new Date().toISOString(),
    expected_return_date: resource.expected_return_date,
  });
  if (historyError) throw historyError;

  // Clear borrower info and set back to Available
  const { error: updateError } = await supabase
    .from("resources")
    .update({
      availability_status: "Available",
      borrower_name: null,
      borrower_id: null,
      borrowed_at: null,
      expected_return_date: null,
    })
    .eq("id", resourceId);
  if (updateError) throw updateError;
}

// ---- Borrowing history ----

export async function fetchBorrowingHistory(): Promise<BorrowingHistory[]> {
  const { data, error } = await supabase
    .from("borrowing_history")
    .select("*")
    .order("returned_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

// ---- Statistics ----

export async function fetchStats(): Promise<{
  total: number;
  available: number;
  borrowed: number;
}> {
  const { count: total, error: totalError } = await supabase
    .from("resources")
    .select("*", { count: "exact", head: true });
  if (totalError) throw totalError;

  const { count: available, error: availError } = await supabase
    .from("resources")
    .select("*", { count: "exact", head: true })
    .eq("availability_status", "Available");
  if (availError) throw availError;

  const { count: borrowed, error: borrowedError } = await supabase
    .from("resources")
    .select("*", { count: "exact", head: true })
    .eq("availability_status", "Borrowed");
  if (borrowedError) throw borrowedError;

  return {
    total: total || 0,
    available: available || 0,
    borrowed: borrowed || 0,
  };
}

export async function fetchHistoryCount(): Promise<number> {
  const { count, error } = await supabase
    .from("borrowing_history")
    .select("*", { count: "exact", head: true });
  if (error) throw error;
  return count || 0;
}

// ---- AI services (calls edge functions which proxy to OpenAI) ----

export async function getAIRecommendations(requirement: string): Promise<AIRecommendResponse> {
  const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-recommend`;
  const response = await fetch(functionUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ requirement }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData?.aiUnavailable
      ? "AI service is temporarily unavailable. You can still browse and search resources manually."
      : `AI request failed (${response.status})`;
    throw new Error(message);
  }

  const data = await response.json();
  // Validate response shape before returning
  if (!data || !Array.isArray(data.recommendations) || typeof data.message !== "string") {
    throw new Error("AI returned an unexpected response format.");
  }
  return data as AIRecommendResponse;
}

export async function getAICategory(name: string, description: string): Promise<AICategorizeResponse> {
  const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-categorize`;
  const response = await fetch(functionUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ name, description }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData?.aiUnavailable
      ? "AI service is temporarily unavailable. Please select a category manually."
      : `AI request failed (${response.status})`;
    throw new Error(message);
  }

  const data = await response.json();
  if (!data || typeof data.category !== "string") {
    throw new Error("AI returned an unexpected response format.");
  }
  return data as AICategorizeResponse;
}
