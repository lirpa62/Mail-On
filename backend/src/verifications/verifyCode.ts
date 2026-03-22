import {
  getEmailVerifications,
  updateEmailVerifications,
  deleteEmailVerifications,
} from "../repositories/emailVerificationsRepo";
import { insertSubscribers } from "../repositories/subscribersRepo";
import { fetchJobDetail } from "../scrapers/jobBoardScraper";
import { getBoardState } from "../repositories/boardStateRepo";
import { sendEmail } from "../processors/sendEmail";
import { VerifyResult } from "../types/auth";

import bcrypt from "bcrypt";

export async function verifyCode(
  email: string,
  verifyingCode: string,
): Promise<VerifyResult> {
  const ATTEMPT_COUNT = 5;
  const LOCKED_MINUTES = 30;
  const BOARD_ID = "ce/1813";
  const baseUrl = "https://ce.pknu.ac.kr";
  const boardUrl = `${baseUrl}/ce/1813`;

  const transformDate = (date: Date) => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    return `${hours}:${minutes}`;
  };

  try {
    const record = await getEmailVerifications(email).catch(() => null);

    if (!record) {
      return {
        ok: false,
        reason: "expired",
        message: "인증 요청이 없거나 만료되었습니다.",
      };
    }

    const { code_hash, attempts, expires_at } =
      await getEmailVerifications(email);
    if (!code_hash)
      return { ok: false, reason: "expired", message: "인증 요청이 없습니다." };

    const currentTime = new Date().getTime();
    const expiresAt = new Date(expires_at!).getTime();

    if (currentTime > expiresAt) {
      return {
        ok: false,
        reason: "expired",
        message: "인증번호가 만료되었습니다.",
      };
    }

    const isMatch = await bcrypt.compare(verifyingCode, code_hash);
    if (
      isMatch &&
      expiresAt >= currentTime &&
      (attempts ?? 0) <= ATTEMPT_COUNT
    ) {
      const { current_board_number, last_processed_link } =
        await getBoardState(BOARD_ID);
      const lastProcessedLink = boardUrl + last_processed_link;
      const detail = await fetchJobDetail(lastProcessedLink);
      if (!last_processed_link) throw new Error("No last processed link");
      if (!detail) throw new Error("No detail");

      await insertSubscribers(email, current_board_number);
      await deleteEmailVerifications(email);
      console.log("✔ Subscribe Complete. Delete record.");

      sendEmail(
        email,
        `신규 구독을 환영합니다 🎉`,
        `
        <div style="margin-bottom: 20px;">
        <p style="font-size: 1.4rem;"><b>🍈 지금부터 당신의 Mail을 ON 하세요!</b></p>
        </div>
        <div style="font-size: 0.95rem;margin-left: 10px;line-height: 2rem;">
        😃 지금부터 취업 게시물을 받을 수 있습니다! <br>
        📬 월요일~금요일 오전 10시, 오후 2시, 오후 6시 총 3번 메일이 발송됩니다.<br>
        ⚠️ 단, 최신 게시물이 없을 경우 발송되지 않습니다!
        </div>
        `,
      );

      sendEmail(email, detail.title, detail.content);

      return { ok: true };
    }
    if ((attempts ?? 0) + 1 > ATTEMPT_COUNT) {
      const updatedTime = new Date();
      const lockedUntil = new Date(Date.now() + LOCKED_MINUTES * 60 * 1000);

      await updateEmailVerifications(
        email,
        null,
        0,
        null,
        lockedUntil.toISOString(),
        updatedTime.toISOString(),
      );
      console.log(
        "⚠️ Verifying code lockout due to too many failed verification attempts",
      );
      return {
        ok: false,
        reason: "locked",
        message: `5회 이상 실패하여 ${transformDate(
          lockedUntil,
        )}까지 잠금되었습니다.`,
        lockedUntil: lockedUntil.toISOString(),
      };
    }

    await updateEmailVerifications(
      email,
      code_hash,
      (attempts ?? 0) + 1,
      expires_at!,
      null,
      new Date().toISOString(),
    );
    return {
      ok: false,
      reason: "wrong_code",
      message: "인증번호가 올바르지 않습니다.",
    };
  } catch (err) {
    console.error("❌ Error on verifying code:", err);
    throw err;
  }
}
