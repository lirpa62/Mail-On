import { db } from "../firebase/firebase";

const COLLECTION = "board_state";

export interface BoardState {
  board_id: string;
  current_board_number: number | null;
  last_processed_link: string | null;
  updated_at: string | null;
}

// Firestore 문서 ID에 '/'가 포함되면 서브컬렉션 경로로 해석되므로 인코딩
function docIdFromBoardId(boardId: string): string {
  return encodeURIComponent(boardId);
}

// 조회
export async function getBoardState(boardId: string): Promise<BoardState> {
  try {
    const snap = await db
      .collection(COLLECTION)
      .doc(docIdFromBoardId(boardId))
      .get();
    if (!snap.exists) {
      const err = new Error(`Board state not found for ${boardId}`);
      console.error("Board state select failed:", err);
      throw err;
    }
    const data = snap.data() as Omit<BoardState, "board_id">;
    const result: BoardState = { board_id: boardId, ...data };
    console.log("Board state selected:", result);
    return result;
  } catch (error) {
    console.error("Board state select failed:", error);
    throw error;
  }
}

// 업데이트
export async function updateBoardState(
  boardId: string,
  currentBoardNumber: number,
  last_processed_link: string
): Promise<BoardState> {
  const payload: Partial<BoardState> = {
    current_board_number: currentBoardNumber,
    updated_at: new Date().toISOString(),
  };
  if (last_processed_link !== undefined)
    payload.last_processed_link = last_processed_link;

  try {
    const ref = db.collection(COLLECTION).doc(docIdFromBoardId(boardId));
    await ref.set(payload, { merge: true });
    const snap = await ref.get();
    const data = snap.data() as Omit<BoardState, "board_id">;
    const result: BoardState = { board_id: boardId, ...data };
    console.log("Board state updated:", result);
    return result;
  } catch (error) {
    console.error("Board state update failed:", error);
    throw error;
  }
}
