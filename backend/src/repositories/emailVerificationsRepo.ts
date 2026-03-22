import { supabase } from "../supabase/supabase";

const TABLE = "email_verifications";

export interface EmailVerifications {
  id: string;
  email: string | null;
  code_hash: string | null;
  attempts: number | null;
  expires_at: string | null;
  locked_until: string | null;
  updated_at: string | null;
  created_at: string;
}

// 삽입
export async function insertEmailVerifications(
  email: string,
  code_hash: string,
  attempts: number,
  expires_at: string,
  locked_until: string | null
): Promise<EmailVerifications> {
  const payload: Partial<EmailVerifications> = {
    email: email,
    code_hash: code_hash,
    attempts: attempts,
    expires_at: expires_at,
    locked_until: locked_until,
  };
  const { data, error } = await supabase
    .from(TABLE)
    .insert(payload)
    .select()
    .single();
  if (error) {
    console.error("Email Verifications insert failed:", error);
    throw error;
  } else {
    console.log("Email Verifications inserted:", data);
  }
  return data!;
}

// 조회
export async function getEmailVerifications(
  email: string
): Promise<EmailVerifications> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("email", email)
    .single();
  if (error) {
    console.error("Email Verifications select failed:", error);
    throw error;
  } else {
    console.log("Email Verifications selected:", data);
  }
  return data!;
}

export async function isExistEmailVerifications(
  email: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("email", email)
    .single();
  if (error) {
    console.error("This email is not exist in Email Verifications:", error);
    return false;
  }
  console.log("This email is already exist in Email Verifications:", data);
  return true;
}

// 업데이트
export async function updateEmailVerifications(
  email: string,
  code_hash: string | null,
  attempts: number,
  expires_at: string | null,
  locked_until: string | null,
  updated_at: string
): Promise<EmailVerifications> {
  const payload: Partial<EmailVerifications> = {
    email: email,
    code_hash: code_hash,
    attempts: attempts,
    expires_at: expires_at,
    locked_until: locked_until,
    updated_at: updated_at,
  };

  const { data, error } = await supabase
    .from(TABLE)
    .update(payload)
    .eq("email", email)
    .select()
    .single();
  if (error) {
    console.error("Email Verifications update failed:", error);
    throw error;
  } else {
    console.log("Email Verifications updated:", data);
  }
  return data!;
}

export async function updateEmailVerificationsAttempt(
  email: string,
  attempts: number
): Promise<EmailVerifications> {
  const payload: Partial<EmailVerifications> = {
    email: email,
    attempts: attempts,
  };

  const { data, error } = await supabase
    .from(TABLE)
    .update(payload)
    .eq("email", email)
    .select()
    .single();
  if (error) {
    console.error("Email Verifications Attempt update failed:", error);
    throw error;
  } else {
    console.log("Email Verifications Attempt updated:", data);
  }
  return data!;
}

export async function deleteEmailVerifications(email: string) {
  const { data, error } = await supabase
    .from(TABLE)
    .delete()
    .eq("email", email)
    .select()
    .single();
  if (error) {
    console.error("Email Verifications delete failed:", error);
    throw error;
  } else {
    console.log("Email Verifications deleted:", data);
  }
  return;
}
