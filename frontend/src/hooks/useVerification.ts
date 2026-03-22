import { useState } from "react";
import { VerifyResult, SendCodeResult } from "@/types/auth";

export function useVerification() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // function isFailure(r: VerifyResult): r is VerifyFailure {
  //   return r.ok === false;
  // }

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

  async function sendCode(email: string): Promise<SendCodeResult> {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/verifications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = await res.json();

      if (json.status === "subscriber") {
        return { status: "subscriber" };
      }
      if (json.status === "ok") {
        return { status: "ok", expiresAt: json.expiresAt };
      }
      if (json.status === "locked") {
        return { status: "locked", lockedUntil: json.lockedUntil };
      }

      // 예상치 못한 응답
      return { status: "error" };
    } catch (err: any) {
      return { status: "error" };
    } finally {
      setLoading(false);
    }
  }

  async function verify(email: string, code: string): Promise<VerifyResult> {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/api/verifications/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });

      const json: VerifyResult = await res.json();

      if (!res.ok) {
        if (json.ok === false) {
          setError(json.message);
        }
        return json;
      }

      return json;
    } catch (err: any) {
      const msg = err?.message ?? "알 수 없는 오류가 발생했습니다";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return { sendCode, verify, loading, error };
}
