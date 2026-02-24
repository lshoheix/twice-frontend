"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getParticipation, getRetention4w, getQuizHistory } from "@/lib/api";
import { getStoredAccountId } from "@/lib/account";

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export default function AnalyticsPage() {
  const [participation, setParticipation] = useState<{
    finished_users: number;
    target_users: number;
    participation_rate: number;
  } | null>(null);
  const [retention, setRetention] = useState<{
    retained_users: number;
    total_users: number;
    retention_rate: number;
  } | null>(null);
  const [quizHistory, setQuizHistory] = useState<
    { id: string; quiz_id: string; difficulty_level: string; status: string; score: number | null; created_at: string; finished_at: string | null }[]
  >([]);
  const [error, setError] = useState<string | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);

  useEffect(() => {
    setAccountId(getStoredAccountId());
  }, []);

  useEffect(() => {
    if (!accountId) return;
    getQuizHistory(accountId)
      .then(setQuizHistory)
      .catch(() => setQuizHistory([]));
  }, [accountId]);

  useEffect(() => {
    const today = new Date();
    const from = new Date(today);
    from.setDate(from.getDate() - 30);
    const toStr = formatDate(today);
    const fromStr = formatDate(from);
    getParticipation(fromStr, toStr)
      .then(setParticipation)
      .catch((e) => setError(String(e)));
    getRetention4w(toStr)
      .then(setRetention)
      .catch((e) => setError(String(e)));
  }, []);

  return (
    <main>
      <h1>Analytics</h1>
      <Link href="/">← Home</Link>
      {error && <p style={{ color: "crimson" }}>{error}</p>}
      <section>
        <h2>Participation (last 30 days)</h2>
        {participation ? (
          <>
            <p><strong>서비스 접속자 수 (최근 30일):</strong> {participation.target_users}</p>
            <p>완료 사용자: {participation.finished_users}, 참여율:{" "}
              {(participation.participation_rate * 100).toFixed(1)}%</p>
          </>
        ) : (
          <p>Loading…</p>
        )}
      </section>
      <section>
        <h2>4-week retention</h2>
        {retention ? (
          <>
            <p><strong>서비스 접속자 수 (4주):</strong> {retention.total_users}</p>
            <p>지속 사용자: {retention.retained_users}, 지속률:{" "}
              {(retention.retention_rate * 100).toFixed(1)}%</p>
          </>
        ) : (
          <p>Loading…</p>
        )}
      </section>
      <section>
        <h2>내 퀴즈 이력</h2>
        {!accountId ? (
          <p>로그인 후 확인할 수 있습니다.</p>
        ) : quizHistory.length === 0 ? (
          <p>퀴즈 이력이 없습니다.</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0 }}>
            {quizHistory.map((a) => (
              <li key={a.id} style={{ marginBottom: "0.5rem", padding: "0.25rem 0", borderBottom: "1px solid #eee" }}>
                퀴즈: {a.quiz_id} | 난이도: {a.difficulty_level} | 상태: {a.status}
                {a.score != null && ` | 점수: ${a.score}`}
                {" "}| {a.created_at.slice(0, 10)}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
