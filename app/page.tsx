"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { postEngagementVisit } from "@/lib/api";
import { getStoredAccountId, setStoredAccountId } from "@/lib/account";

function randomUuid(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const BACKEND_DOWN_MSG =
  "백엔드 서버에 연결할 수 없습니다. 백엔드를 실행했는지 확인하세요 (포트 8000).";

export default function HomePage() {
  const [visited, setVisited] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);

  useEffect(() => {
    const id = getStoredAccountId();
    setAccountId(id);
    if (!id) {
      setError("테스트 계정 사용 버튼을 눌러 주세요.");
      return;
    }
    postEngagementVisit(id)
      .then(() => setVisited(true))
      .catch((e) => setError(e?.message?.includes("fetch") ? BACKEND_DOWN_MSG : String(e)));
  }, []);

  const useTestAccount = () => {
    const id = randomUuid();
    setError(null);
    postEngagementVisit(id)
      .then(() => {
        setStoredAccountId(id);
        setAccountId(id);
        setVisited(true);
      })
      .catch((e) =>
        setError(e?.message?.includes("fetch") ? BACKEND_DOWN_MSG : String(e))
      );
  };

  return (
    <main>
      <h1>Learning MVP</h1>
      {error && <p style={{ color: "crimson" }}>{error}</p>}
      {!accountId && (
        <button type="button" onClick={useTestAccount}>
          테스트 계정 사용
        </button>
      )}
      {visited && <p>Visit recorded.</p>}
      <nav>
        <Link href="/quiz">
          <button type="button">Start Quiz</button>
        </Link>
        <Link href="/analytics">
          <button type="button">View Analytics</button>
        </Link>
      </nav>
      {accountId && <p><small>account_id: {accountId}</small></p>}
    </main>
  );
}
