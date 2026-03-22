import { useState, useEffect } from "react";
import { AnimatePresence, motion, Transition } from "framer-motion";
import { Loader2Icon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { useVerification } from "../hooks/useVerification";
import { VerifyResult, SendCodeResult } from "@/types/auth";
import { NoticeAlert } from "@/components/NoticeAlert";

interface AlertItem {
  id: string;
  variant: "success" | "info" | "warning" | "destructive";
  title: string;
}

export function VerifyForm() {
  const { sendCode, verify, loading, error } = useVerification();
  const [step, setStep] = useState<"initial" | "enterEmail" | "enterCode">(
    "initial"
  );
  const [email, setEmail] = useState("");
  const [domain, setDomain] = useState("@pukyong.ac.kr");
  const [code, setCode] = useState("");
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [timer, setTimer] = useState(0);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);

  const pageVariants = {
    initial: { opacity: 0, x: 12, scale: 0.98 },
    animate: { opacity: 1, x: 0, scale: 1 },
    exit: { opacity: 0, x: -12, scale: 0.98 },
  };
  const pageTransition: Transition<any> = { duration: 0.3, ease: "easeOut" };

  const btnVariants = {
    show: { opacity: 1, y: 0, scale: 1, height: "auto" },
    hide: { opacity: 0, y: 8, scale: 0.98, height: 0 },
  };

  // Alert 관리: 추가, 자동 제거
  const showAlert = (variant: AlertItem["variant"], title: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setAlerts((prev) => [...prev, { id, variant, title }]);
    setTimeout(() => {
      setAlerts((prev) => prev.filter((a) => a.id !== id));
    }, 3000);
  };

  const getRidOfDomain = (emailAddr: string) => {
    return emailAddr.includes("@")
      ? emailAddr.substring(0, emailAddr.indexOf("@"))
      : emailAddr;
  };

  const onSend = async () => {
    if (!email) {
      setStep("enterEmail");
      return;
    }
    const result: SendCodeResult = await sendCode(email + domain);
    console.log(result.status);
    if (result.status === "subscriber") {
      showAlert("info", "이미 구독자입니다.");
      return;
    }
    if (result.status === "locked") {
      setLocked(true);
      showAlert(
        "destructive",
        `5회 초과: ${new Date(result.lockedUntil).toLocaleTimeString("ko-KR", {
          hour: "2-digit",
          minute: "2-digit",
        })}까지 인증 불가`
      );
      return;
    }
    if (result.status === "ok") {
      setExpiresAt(result.expiresAt);
      if (step !== "enterCode") setStep("enterCode");
      setLocked(false);
      setCode("");
      showAlert("success", "인증번호가 전송되었습니다.");
      localStorage.setItem("verifyStep", "enterCode");
      localStorage.setItem("verifyExpires", result.expiresAt); // ISO 문자열
    }
  };

  const clearStorage = () => {
    localStorage.removeItem("verifyStep");
    localStorage.removeItem("verifyExpires");
  };

  const onVerify = async () => {
    const result: VerifyResult = await verify(email + domain, code);
    if (result.ok) {
      showAlert("success", "인증이 완료되었습니다.");
      clearStorage();
      // 추가 성공 로직...
      return;
    }
    if (result.ok === false)
      switch (result.reason) {
        case "wrong_code":
          showAlert("destructive", "인증번호가 올바르지 않습니다.");
          break;
        case "expired":
          showAlert("warning", "인증 시간이 만료되었습니다. 재전송 해주세요.");
          clearStorage();
          break;
        case "locked":
          setLocked(true);
          showAlert(
            "destructive",
            `5회 초과: ${new Date(
              result.lockedUntil!
            ).toLocaleTimeString()}까지 인증 불가`
          );
          break;
      }
  };

  useEffect(() => {
    const savedStep = localStorage.getItem("verifyStep");
    const savedExp = localStorage.getItem("verifyExpires");
    if (
      savedStep === "enterCode" &&
      savedExp &&
      new Date(savedExp).getTime() > Date.now()
    ) {
      setStep("enterCode");
      setExpiresAt(savedExp);
    } else {
      // 만료되었거나 저장된 게 없으면 완전 초기 상태로
      clearStorage();
    }
  }, []);

  // Timer 등록
  useEffect(() => {
    if (!expiresAt) return;
    const update = () => {
      const diff = Math.ceil(
        (new Date(expiresAt).getTime() - Date.now()) / 1000
      );
      setTimer(diff > 0 ? diff : 0);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  const minutes = Math.floor(timer / 60);
  const seconds = timer % 60;

  const isSoon = !locked && timer >= 0 && timer <= 30;

  return (
    <div className="relative h-[45vh] bg-gradient-to-b from-sky-200/50 to-emerald-100/50">
      {" "}
      {/* h-[30vh] */}
      {/* 알림 영역: 화면 상단 중앙 */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-30">
        <AnimatePresence>
          {alerts.map((alert) => (
            <motion.div
              key={alert.id}
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -50, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="mb-2 w-[60vw]"
            >
              <NoticeAlert variant={alert.variant}>{alert.title}</NoticeAlert>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      <div className="space-y-6 p-4 text-center flex items-center justify-center flex-col">
        {" "}
        {/* h-[100%] */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={step} // ★ 중요: step이 바뀌면 이전 뷰 exit, 새 뷰 initial→animate
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={pageTransition}
            layout // 높이 변화도 부드럽게
            className="w-full flex flex-col items-center"
          >
            {step === "enterEmail" ? (
              <>
                <div className="flex gap-3 justify-center">
                  <Input
                    name="email"
                    className="w-[calc(25vw*1.65)] max-w-72 h-[50px] placeholder:text-[0.85rem] bg-white border-indigo-300/50 focus-visible:ring-sky-300/50 rounded-[12px]"
                    style={{ fontSize: "1rem" }}
                    placeholder="이메일을 입력해주세요"
                    value={email}
                    autoComplete="true"
                    onChange={(e) => setEmail(getRidOfDomain(e.target.value))}
                  />
                  <Select value={domain} onValueChange={setDomain}>
                    <SelectTrigger
                      className="w-[160px] text-[1rem] bg-white border-indigo-300/50 rounded-[12px]"
                      style={{ height: "50px" }}
                    >
                      <SelectValue placeholder="@domain 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem
                        value="@pukyong.ac.kr"
                        className="text-[0.95rem]"
                      >
                        @pukyong.ac.kr
                      </SelectItem>
                      <SelectItem
                        value="@pknu.ac.kr"
                        className="text-[0.95rem]"
                      >
                        @pknu.ac.kr
                      </SelectItem>
                      <SelectItem value="@naver.com" className="text-[0.95rem]">
                        @naver.com
                      </SelectItem>
                      <SelectItem value="@gmail.com" className="text-[0.95rem]">
                        @gmail.com
                      </SelectItem>
                      <SelectItem value="@daum.net" className="text-[0.95rem]">
                        @daum.net
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <motion.div
                  layout
                  initial={false}
                  animate={email ? { height: "auto" } : { height: 0 }}
                  transition={{ layout: { duration: 0.4, ease: "easeInOut" } }}
                  style={{ overflow: "hidden" }} // 높이 애니메이션 필수
                  className="mt-5"
                >
                  <motion.div
                    initial={false}
                    animate={email ? "show" : "hide"}
                    variants={btnVariants}
                  >
                    <Button
                      className="send-button w-[160px] h-[45px] rounded-[16px] text-[1rem] bg-gradient-to-tr from-emerald-300 to-sky-300 hover:from-sky-300 hover:to-emerald-300 active:from-sky-300 active:to-emerald-300 transition-colors duration-700 cursor-pointer select-none"
                      onClick={onSend}
                      disabled={!email}
                    >
                      {loading ? (
                        <Loader2Icon className="animate-spin mr-2" />
                      ) : null}
                      {loading ? "전송 중..." : "인증번호 전송"}
                    </Button>
                  </motion.div>
                </motion.div>
              </>
            ) : step === "enterCode" ? (
              <>
                <div className="flex items-center gap-2 justify-center">
                  <Input
                    name="code"
                    maxLength={6}
                    className="w-[calc(30vw*1.5)] max-w-72 h-[50px] bg-white placeholder:text-[0.85rem] border-indigo-300/50 focus-visible:ring-sky-300/50 rounded-[12px]"
                    style={{ fontSize: "1rem" }}
                    placeholder="인증번호를 입력해주세요"
                    autoComplete="false"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                  />
                  <span
                    className={[
                      "text-sm w-[100px]",
                      isSoon ? "text-rose-400" : "text-muted-foreground",
                    ].join(" ")}
                  >
                    {!locked && timer > 0
                      ? minutes > 0
                        ? `${minutes}분 ${seconds}초 남음`
                        : `${seconds}초 남음`
                      : "만료됨"}
                  </span>
                </div>
                <div className="flex justify-center gap-4">
                  {timer > 0 && (
                    <motion.div
                      layout
                      initial={false}
                      animate={code ? { height: "auto" } : { height: 0 }}
                      transition={{
                        layout: { duration: 0.4, ease: "easeInOut" },
                      }}
                      style={{ overflow: "hidden" }}
                    >
                      <motion.div
                        initial={false}
                        animate={code ? "show" : "hide"}
                        variants={btnVariants}
                      >
                        <Button
                          className="send-button mt-6 w-[160px] h-[45px] rounded-[16px] text-[1rem] bg-gradient-to-tr from-emerald-300/50 to-sky-300/50 hover:from-sky-300 hover:to-emerald-300 active:from-sky-300 active:to-emerald-300 transition-colors duration-700 cursor-pointer select-none"
                          variant="default"
                          onClick={locked || !code ? undefined : onVerify}
                          disabled={locked || !code}
                        >
                          인증 확인
                        </Button>
                      </motion.div>
                    </motion.div>
                  )}
                  {timer <= 0 && (
                    <Button
                      className="send-button mt-6 w-[160px] h-[45px] rounded-[16px] text-[1rem] text-rose-400 bg-gradient-to-bl from-rose-300/50 to-pink-300/50 hover:from-pink-300 hover:to-rose-300 hover:text-red-900 active:from-pink-300 active:to-rose-300 active:text-red-900 transition-colors duration-700 cursor-pointer select-none"
                      variant="outline"
                      onClick={onSend}
                    >
                      {loading ? (
                        <Loader2Icon className="animate-spin mr-2" />
                      ) : null}
                      {loading ? "전송 중..." : "재전송"}
                    </Button>
                  )}
                </div>
              </>
            ) : (
              <Button
                className="send-button w-[172px] h-[72px] bg-gradient-to-bl from-white-100/50 to-sky-400/50 text-white text-3xl hover:from-sky-200 hover:to-emerald-200 hover:text-white active:from-sky-200 active:to-emerald-200 transition-colors duration-1000 ease-in-out cursor-pointer rounded-[24px] shadow-xl select-none"
                onClick={() => setStep("enterEmail")}
              >
                Mail ON
              </Button>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
