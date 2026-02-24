"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getKakaoAccessToken, postAccountSync } from "@/lib/api";
import { setStoredAccountId } from "@/lib/account";

function CallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get("code");
    if (!code) {
      setError("인가 코드가 없습니다.");
      return;
    }
    getKakaoAccessToken(code)
      .then((res) => {
        const kakaoId = res.user_info?.id;
        if (kakaoId == null) {
          setError("사용자 정보를 가져올 수 없습니다.");
          return undefined;
        }
        return postAccountSync(kakaoId);
      })
      .then((res) => {
        if (res?.account_id) {
          setStoredAccountId(res.account_id);
          router.replace("/");
        }
      })
      .catch((e) => setError(String(e)));
  }, [searchParams, router]);

  if (error) {
    return (
      <main style={{ padding: "1rem" }}>
        <h1>카카오 로그인 오류</h1>
        <p style={{ color: "crimson" }}>{error}</p>
        <a href="/">홈으로 돌아가기</a>
      </main>
    );
  }

  return (
    <main style={{ padding: "1rem" }}>
      <p>로그인 처리 중…</p>
    </main>
  );
}

export default function KakaoCallbackPage() {
  return (
    <Suspense fallback={<main style={{ padding: "1rem" }}><p>로딩 중…</p></main>}>
      <CallbackContent />
    </Suspense>
  );
}
