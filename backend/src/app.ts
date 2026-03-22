import express from "express";
import dotenv from "dotenv";
import cors from "cors";

import { startJobScheduler } from "./schedulers/jobScheduler";
import { sendVerificationEmail } from "./verifications/emailVerification";
import { verifyCode } from "./verifications/verifyCode";
import { isExistSubscribers } from "./repositories/subscribersRepo";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const ALLOW_CORS_URL = process.env.ALLOW_CORS_URL || "http://localhost:5173";
const CODE_END_POINT = "/api/verifications";
const VERIFY_END_POINT = "/api/verifications/verify";

// 서버 시작
app.listen(PORT, async () => {
  console.log(`서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
  startJobScheduler(); // ← scheduler kicks off when server boots
});

app.use(cors({ origin: ALLOW_CORS_URL }));
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ status: "ok" });
});

// 1) 인증번호 요청
app.post(CODE_END_POINT, async (req, res): Promise<void> => {
  const { email } = req.body as { email: string };
  if (await isExistSubscribers(email)) {
    return res.status(400).json({ status: "subscriber" }) as any;
  }
  // 인증시간이 남아 있는데 다른 수단으로 재 인증번호 요청을 할 경우
  // 1. expiresAt과 현재 시간 비교 0 보다 크거나 같을 경우
  // 메일 발송 X, enterCode, 남은 시간
  try {
    const { email } = req.body as { email: string };
    const result = await sendVerificationEmail(email);
    if (result.status === "ok") {
      return res.json({
        status: result.status,
        expiresAt: result.expiresAt,
      }) as any;
    } else if (result.status === "locked") {
      return res.json({
        status: result.status,
        lockedUntil: result.lockedUntil,
      }) as any;
    } else if (result.status === "error") {
      return res.json({ status: "error", message: "인증 처리 실패" }) as any;
    }
  } catch (err) {
    return res
      .status(500)
      .json({ status: "error", message: err || "인증 처리 실패" }) as any;
  }
});

// 2) 인증번호 검증
app.post(VERIFY_END_POINT, async (req, res): Promise<void> => {
  const { email, code } = req.body as { email: string; code: string };

  try {
    const verifyResult = await verifyCode(email, code);

    if (!verifyResult.ok) {
      const status = verifyResult.reason === "locked" ? 423 : 400;
      if (verifyResult.reason === "locked") {
        return res.status(status).json({
          ok: false,
          reason: verifyResult.reason,
          message: verifyResult.message,
          lockedUntil: verifyResult.lockedUntil,
        }) as any;
      } else {
        return res.status(status).json({
          ok: false,
          reason: verifyResult.reason,
          message: verifyResult.message,
        }) as any;
      }
    }

    return res.json({ ok: true }) as any;
  } catch (err: any) {
    return res.status(500).json({
      ok: false,
      reason: "error",
      message: err.message || "검증 중 오류가 발생했습니다.",
    }) as any;
  }
});
