import { generateCode } from "./generateCode";
import {
  getEmailVerifications,
  isExistEmailVerifications,
  insertEmailVerifications,
  updateEmailVerifications,
} from "../repositories/emailVerificationsRepo";
import { sendEmail } from "../processors/sendEmail";
import { isExistSubscribers } from "../repositories/subscribersRepo";
import { SendCodeResult } from "../types/auth";

import bcrypt from "bcrypt";

export async function sendVerificationEmail(
  verifyingEmail: string
): Promise<SendCodeResult> {
  const ATTEMPT_COUNT = 5;
  const EXPIRED_MINUTES = 5;

  let code = generateCode(6);
  let codeHash = await bcrypt.hash(code, 10);

  let content = "";

  const expiresAt = new Date(Date.now() + EXPIRED_MINUTES * 60 * 1000);
  const isExistEmail = await isExistEmailVerifications(verifyingEmail);
  const isSubscriber = await isExistSubscribers(verifyingEmail);

  try {
    if (isSubscriber) return { status: "subscriber" };
    if (isExistEmail) {
      const { code_hash, attempts, locked_until } = await getEmailVerifications(
        verifyingEmail
      );
      const currentTime = new Date();
      const lockedUntil = new Date(locked_until!);
      const diffTime = currentTime.getTime() - lockedUntil.getTime();

      if (locked_until !== null) {
        if (diffTime < 0) {
          return { status: "locked", lockedUntil: locked_until };
        } else {
          await updateEmailVerifications(
            verifyingEmail,
            codeHash,
            attempts ?? 0,
            null,
            null,
            currentTime.toISOString()
          );
        }
      }

      while (await bcrypt.compare(code, code_hash ?? "")) {
        code = generateCode(6);
        codeHash = await bcrypt.hash(code, 10);
      }
      // verify 버튼을 클릭하면 인증되게 하는 방법도 생각
      if ((attempts ?? 0) <= ATTEMPT_COUNT && diffTime >= 0) {
        content = `
    <div style="width: clamp(350px, 30vw, 35vw);margin: auto;display: flex;flex-direction: column;align-items: center;border: #a3efca 3px solid;border-radius: 12px;padding: 5px;">
    <div style="margin: 10px auto;max-width: 90%;">
    <p style="font-size: 1.5rem;"><b>🍈 인증하여 Mail을 ON 하세요!</b></p>
    </div>
    <div style="font-size: 1.25rem;"><b>인증번호</b></div>
    <div style="display: flex; justify-content: center;">
    <div style="height: 55px;border: #5088bf 0.5px solid;width: 120px;display: flex;justify-content: center;align-items: center;margin: 5px;border-radius: 7px;font-family: monospace, serif;font-size: 1.3rem;letter-spacing: 3px;box-shadow: 3px 4px 2px 1px rgba(0, 0, 255, 0.2);">${code}</div>
    </div>
    <div style="max-width: 90%;font-size: 0.85rem;color: #a6a6a6;margin: 20px auto 10px auto;">
    <div>
    현재 남은 재시도 횟수는
    <span style="margin: auto 3px;color: red;"><b>${
      ATTEMPT_COUNT - attempts!
    }</b></span>
    입니다.
    </div>
    <div><p>
    MailON 구독을 위한 인증번호입니다.
    </p></div>
    <div><p>
    위 인증번호를 입력하여 이메일 주소 인증을 완료해 주세요.
    </p></div>
    </div>
    </div>
    `;
        await updateEmailVerifications(
          verifyingEmail,
          codeHash,
          attempts ?? 0,
          expiresAt.toISOString(),
          null,
          currentTime.toISOString()
        );
      }
    } else {
      content = `
    <div style="width: clamp(350px, 30vw, 35vw);margin: auto;display: flex;flex-direction: column;align-items: center;border: #a3efca 3px solid;border-radius: 12px;padding: 5px;">
    <div style="margin: 10px auto;max-width: 90%;">
    <p style="font-size: 1.5rem;"><b>🍈 인증하여 Mail을 ON 하세요!</b></p>
    </div>
    <div style="font-size: 1.25rem;"><b>인증번호</b></div>
    <div style="display: flex; justify-content: center;">
    <div style="height: 55px;border: #5088bf 0.5px solid;width: 120px;display: flex;justify-content: center;align-items: center;margin: 5px;border-radius: 7px;font-family: monospace, serif;font-size: 1.3rem;letter-spacing: 3px;box-shadow: 3px 4px 2px 1px rgba(0, 0, 255, 0.2);">${code}</div>
    </div>
    <div style="max-width: 90%;font-size: 0.85rem;color: #a6a6a6;margin: 20px auto 10px auto;">
    <div>
    <p>
    MailON 구독을 위한 인증번호입니다.
    </p>
    <div><p>
    위 인증번호를 입력하여 이메일 주소 인증을 완료해 주세요.
    </p></div>
    </div>
    </div>
    `;
      await insertEmailVerifications(
        verifyingEmail,
        codeHash,
        0,
        expiresAt.toISOString(),
        null
      );
    }
    if (content) {
      await sendEmail(verifyingEmail, "이메일 인증을 진행해주세요", content);
      return { status: "ok", expiresAt: expiresAt.toISOString() };
    }
  } catch (err) {
    throw err;
  }
  return { status: "error" };
}
