import { supabase } from "../supabase/supabase";

const TABLE = "board_state";

export interface BoardState {
  board_id: string;
  current_board_number: number | null;
  last_processed_link: string | null;
  updated_at: string | null;
}

// 조회
export async function getBoardState(boardId: string): Promise<BoardState> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("board_id", boardId)
    .single();
  if (error) {
    console.error("Board state select failed:", error);
    throw error;
  } else {
    console.log("Board state selected:", data);
  }
  return data!;
}

// 업데이트
export async function updateBoardState(
  boardId: string,
  currentBoardNumber: number,
  last_processed_link: string
): Promise<BoardState> {
  const payload: Partial<BoardState> = {
    current_board_number: currentBoardNumber,
  };
  if (last_processed_link !== undefined)
    (payload as any).last_processed_link = last_processed_link;

  const { data, error } = await supabase
    .from(TABLE)
    .update(payload)
    .eq("board_id", boardId)
    .select()
    .single();
  if (error) {
    console.error("Board state update failed:", error);
    throw error;
  } else {
    console.log("Board state updated:", data);
  }
  return data!;
}
