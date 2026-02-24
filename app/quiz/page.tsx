"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  postQuizStart,
  postQuizComplete,
  postQuizAbandon,
} from "@/lib/api";
import { getStoredAccountId } from "@/lib/account";

export default function QuizPage() {
  const router = useRouter();
  const [accountId, setAccountId] = useState<string | null>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [scoreInput, setScoreInput] = useState<string>("");
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setAccountId(getStoredAccountId());
  }, []);

  const handleStart = () => {
    if (!accountId) {
      setError("테스트 계정 사용 후 이용해 주세요.");
      return;
    }
    setError(null);
    setResult(null);
    setScoreInput("");
    postQuizStart(accountId, "quiz-1", "MID")
      .then((r) => setAttemptId(r.attempt_id))
      .catch((e) => setError(String(e)));
  };

  const handleFinish = () => {
    if (!accountId || !attemptId) {
      setError("먼저 Start를 눌러 퀴즈를 시작해 주세요.");
      return;
    }
    const score = scoreInput.trim() === "" ? null : parseInt(scoreInput, 10);
    if (score === null || Number.isNaN(score) || score < 0 || score > 100) {
      setError("점수를 0~100 사이 숫자로 입력해 주세요.");
      return;
    }
    setError(null);
    postQuizComplete(accountId, attemptId, score)
      .then(() => {
        setResult(`퀴즈 종료. 점수 ${score}점이 저장되었습니다.`);
        setAttemptId(null);
        setScoreInput("");
      })
      .catch((e) => setError(String(e)));
  };

  const handleExit = () => {
    if (attemptId && accountId) {
      setError(null);
      postQuizAbandon(accountId, attemptId)
        .then(() => router.push("/"))
        .catch((e) => setError(String(e)));
    } else {
      router.push("/");
    }
  };

  return (
    <main>
      <h1>Quiz</h1>
      <Link href="/">← Home</Link>
      {error && <p style={{ color: "crimson" }}>{error}</p>}
      {result && <p>{result}</p>}
      <section style={{ marginTop: "1rem" }}>
        <div style={{ marginBottom: "0.5rem" }}>
          <label htmlFor="score">점수 </label>
          <input
            id="score"
            type="number"
            min={0}
            max={100}
            value={scoreInput}
            onChange={(e) => setScoreInput(e.target.value)}
            placeholder="0~100"
          />
        </div>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <button type="button" onClick={handleStart}>
            Start
          </button>
          <button type="button" onClick={handleFinish}>
            Finish
          </button>
          <button type="button" onClick={handleExit}>
            Exit
          </button>
        </div>
        {attemptId && <p style={{ marginTop: "0.5rem", fontSize: "0.9rem" }}>퀴즈 진행 중 (Attempt ID: {attemptId})</p>}
      </section>
    </main>
  );
}
