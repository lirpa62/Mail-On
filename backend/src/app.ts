import express from "express";
import dotenv from "dotenv";
import cors from "cors";

import { processJobs } from "./processors/jobProcessor";
import { sendVerificationEmail } from "./verifications/emailVerification";
import { verifyCode } from "./verifications/verifyCode";
import { isExistSubscribers } from "./repositories/subscribersRepo";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const ALLOW_CORS_URL = process.env.ALLOW_CORS_URL || "http://localhost:5173";
const CRON_SECRET = process.env.CRON_SECRET || "";
const CODE_END_POINT = "/api/verifications";
const VERIFY_END_POINT = "/api/verifications/verify";

// 서버 시작 (내부 cron 제거 — GitHub Actions가 외부에서 트리거)
app.listen(PORT, async () => {
  console.log(`서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
});

app.use(cors({ origin: ALLOW_CORS_URL }));
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ status: "ok" });
});

// ── GitHub Actions에서 호출하는 크롤링 트리거 엔드포인트 ──
app.post("/api/cron/process", async (req, res): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
    res.status(401).json({ status: "unauthorized" });
    return;
  }

  try {
    console.log("🔔 외부 트리거(GitHub Actions)에 의해 processJobs 실행");
    await processJobs();
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  } catch (err) {
    console.error("❌ processJobs error:", err);
    res.status(500).json({ status: "error", message: String(err) });
  }
});

// 1) 인증번호 요청
app.post(CODE_END_POINT, async (req, res): Promise<void> => {
  const { email } = req.body as { email: string };
  if (await isExistSubscribers(email)) {
    return res.status(400).json({ status: "subscriber" }) as any;
  }
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
