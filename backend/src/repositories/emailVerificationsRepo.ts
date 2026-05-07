import { db } from "../firebase/firebase";

const COLLECTION = "email_verifications";

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

// email을 문서 ID로 사용
function docIdFromEmail(email: string): string {
  return encodeURIComponent(email);
}

// 삽입
export async function insertEmailVerifications(
  email: string,
  code_hash: string,
  attempts: number,
  expires_at: string,
  locked_until: string | null
): Promise<EmailVerifications> {
  const now = new Date().toISOString();
  const payload = {
    email,
    code_hash,
    attempts,
    expires_at,
    locked_until,
    created_at: now,
    updated_at: now,
  };
  try {
    const docId = docIdFromEmail(email);
    const ref = db.collection(COLLECTION).doc(docId);
    await ref.set(payload);
    const result: EmailVerifications = { id: docId, ...payload };
    console.log("Email Verifications inserted:", result);
    return result;
  } catch (error) {
    console.error("Email Verifications insert failed:", error);
    throw error;
  }
}

// 조회
export async function getEmailVerifications(
  email: string
): Promise<EmailVerifications> {
  try {
    const snap = await db
      .collection(COLLECTION)
      .doc(docIdFromEmail(email))
      .get();
    if (!snap.exists) {
      const err = new Error(`Email verification not found for ${email}`);
      console.error("Email Verifications select failed:", err);
      throw err;
    }
    const result: EmailVerifications = {
      id: snap.id,
      ...(snap.data() as Omit<EmailVerifications, "id">),
    };
    console.log("Email Verifications selected:", result);
    return result;
  } catch (error) {
    console.error("Email Verifications select failed:", error);
    throw error;
  }
}

export async function isExistEmailVerifications(
  email: string
): Promise<boolean> {
  try {
    const snap = await db
      .collection(COLLECTION)
      .doc(docIdFromEmail(email))
      .get();
    if (!snap.exists) {
      console.error("This email is not exist in Email Verifications:", email);
      return false;
    }
    console.log("This email is already exist in Email Verifications:", {
      id: snap.id,
      ...snap.data(),
    });
    return true;
  } catch (error) {
    console.error("This email is not exist in Email Verifications:", error);
    return false;
  }
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
  const payload = {
    email,
    code_hash,
    attempts,
    expires_at,
    locked_until,
    updated_at,
  };
  try {
    const ref = db.collection(COLLECTION).doc(docIdFromEmail(email));
    await ref.set(payload, { merge: true });
    const snap = await ref.get();
    if (!snap.exists) {
      throw new Error(`Email verification not found for ${email}`);
    }
    const result: EmailVerifications = {
      id: snap.id,
      ...(snap.data() as Omit<EmailVerifications, "id">),
    };
    console.log("Email Verifications updated:", result);
    return result;
  } catch (error) {
    console.error("Email Verifications update failed:", error);
    throw error;
  }
}

export async function updateEmailVerificationsAttempt(
  email: string,
  attempts: number
): Promise<EmailVerifications> {
  const payload = {
    email,
    attempts,
    updated_at: new Date().toISOString(),
  };
  try {
    const ref = db.collection(COLLECTION).doc(docIdFromEmail(email));
    await ref.set(payload, { merge: true });
    const snap = await ref.get();
    if (!snap.exists) {
      throw new Error(`Email verification not found for ${email}`);
    }
    const result: EmailVerifications = {
      id: snap.id,
      ...(snap.data() as Omit<EmailVerifications, "id">),
    };
    console.log("Email Verifications Attempt updated:", result);
    return result;
  } catch (error) {
    console.error("Email Verifications Attempt update failed:", error);
    throw error;
  }
}

export async function deleteEmailVerifications(email: string) {
  try {
    const ref = db.collection(COLLECTION).doc(docIdFromEmail(email));
    const snap = await ref.get();
    if (!snap.exists) {
      const err = new Error(`Email verification not found for ${email}`);
      console.error("Email Verifications delete failed:", err);
      throw err;
    }
    await ref.delete();
    console.log("Email Verifications deleted:", { id: snap.id, ...snap.data() });
    return;
  } catch (error) {
    console.error("Email Verifications delete failed:", error);
    throw error;
  }
}
