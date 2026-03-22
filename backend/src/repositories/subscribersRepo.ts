import { supabase } from "../supabase/supabase";

const TABLE = "subscribers";

export interface Subscriber {
  id: number;
  email: string | null;
  updated_at: string | null;
  created_at: string | null;
  last_sent_board_number: number | null;
}

// 삽입
export async function insertSubscribers(
  email: string,
  last_sent_board_number: number | null
): Promise<Subscriber> {
  const payload: Partial<Subscriber> = {
    email: email,
    last_sent_board_number: last_sent_board_number,
  };
  const { data, error } = await supabase
    .from(TABLE)
    .insert(payload)
    .select()
    .single();
  if (error) {
    console.error("Subscribers insert failed:", error);
    throw error;
  } else {
    console.log("Subscribers inserted:", data);
  }
  return data!;
}

// 조회
export async function getSubscribers(): Promise<Subscriber[]> {
  const { data, error } = await supabase.from(TABLE).select("*");
  if (error) {
    console.error("Subscribers select failed:", error);
    throw error;
  } else {
    console.log("Subscribers selected:", data);
  }
  return data!;
}

export async function isExistSubscribers(email: string): Promise<boolean> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("email", email)
    .single();
  if (error) {
    console.error("This email is not exist in Subscribers:", error);
    return false;
  } else {
    console.log("This email is exist in Subscribers:", data);
    return true;
  }
}

// 업데이트
export async function updateSubscribers(
  email: string,
  last_sent_board_number: number | 0
): Promise<Subscriber> {
  const payload: Partial<Subscriber> = {
    last_sent_board_number: last_sent_board_number,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from(TABLE)
    .update(payload)
    .eq("email", email)
    .select()
    .single();
  if (error) {
    console.error("Subscribers update failed:", error);
    throw error;
  } else {
    console.log("Subscribers updated:", data);
  }
  return data!;
}
