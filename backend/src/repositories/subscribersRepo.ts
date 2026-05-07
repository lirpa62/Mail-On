import { db } from "../firebase/firebase";

const COLLECTION = "subscribers";

export interface Subscriber {
  id: string;
  email: string | null;
  updated_at: string | null;
  created_at: string | null;
  last_sent_board_number: number | null;
}

// email을 문서 ID로 사용 → unique 제약을 자연스럽게 보장
function docIdFromEmail(email: string): string {
  return encodeURIComponent(email);
}

// 삽입
export async function insertSubscribers(
  email: string,
  last_sent_board_number: number | null
): Promise<Subscriber> {
  const now = new Date().toISOString();
  const payload = {
    email,
    last_sent_board_number,
    created_at: now,
    updated_at: now,
  };
  try {
    const docId = docIdFromEmail(email);
    const ref = db.collection(COLLECTION).doc(docId);
    await ref.set(payload);
    const result: Subscriber = { id: docId, ...payload };
    console.log("Subscribers inserted:", result);
    return result;
  } catch (error) {
    console.error("Subscribers insert failed:", error);
    throw error;
  }
}

// 조회
export async function getSubscribers(): Promise<Subscriber[]> {
  try {
    const snap = await db.collection(COLLECTION).get();
    const result: Subscriber[] = snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<Subscriber, "id">),
    }));
    console.log("Subscribers selected:", result);
    return result;
  } catch (error) {
    console.error("Subscribers select failed:", error);
    throw error;
  }
}

export async function isExistSubscribers(email: string): Promise<boolean> {
  try {
    const snap = await db
      .collection(COLLECTION)
      .doc(docIdFromEmail(email))
      .get();
    if (!snap.exists) {
      console.error("This email is not exist in Subscribers:", email);
      return false;
    }
    console.log("This email is exist in Subscribers:", { id: snap.id, ...snap.data() });
    return true;
  } catch (error) {
    console.error("This email is not exist in Subscribers:", error);
    return false;
  }
}

// 업데이트
export async function updateSubscribers(
  email: string,
  last_sent_board_number: number | 0
): Promise<Subscriber> {
  const payload = {
    last_sent_board_number,
    updated_at: new Date().toISOString(),
  };

  try {
    const ref = db.collection(COLLECTION).doc(docIdFromEmail(email));
    await ref.set(payload, { merge: true });
    const snap = await ref.get();
    if (!snap.exists) {
      throw new Error(`Subscriber not found for ${email}`);
    }
    const result: Subscriber = {
      id: snap.id,
      ...(snap.data() as Omit<Subscriber, "id">),
    };
    console.log("Subscribers updated:", result);
    return result;
  } catch (error) {
    console.error("Subscribers update failed:", error);
    throw error;
  }
}
