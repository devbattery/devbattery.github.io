---
title: "[Project] Vite + React 환경에서 OAuth 2.0 로그인 구현 방법 (프론트엔드 시점)"
excerpt: "movlit, vite, react, oauth"

categories:
  - Project
tags:
  - [movlit, vite, react, oauth]

toc: true
toc_sticky: true

sidebar:
  nav: "categories"

date: 2025-04-25
last_modified_at: 2025-04-28
---

> [Movlit 프로젝트](https://github.com/venus-lion/movlit-plus)에 대한 설명입니다.  
> [백엔드 시점 OAuth 2.0 로그인 구현 방법](TODO)의 링크를 참고하시면 좋습니다.

## OAuth 2.0 로그인 흐름

1.  **사용자 로그인 요청**: 사용자가 우리 서비스에서 "Google로 로그인" 같은 버튼을 클릭합니다.
2.  **인증 서버로 리디렉션**: 사용자는 OAuth 제공자(예: Google)의 인증 페이지로 이동합니다.
3.  **사용자 인증 및 권한 부여**: 사용자는 해당 OAuth 제공자 계정으로 로그인하고, 우리 서비스가 요청하는 정보 접근 권한을 승인합니다.
4.  **Authorization Code 발급 및 리디렉션**: 인증 성공 시, OAuth 제공자는 지정된 우리 서비스의 콜백(Callback) URI로 사용자를 리디렉션시키며, 이때 `authorization_code`를 함께 전달합니다.
5.  **토큰 교환**: 우리 프론트엔드는 이 `authorization_code`를 백엔드 서버로 전달합니다. 백엔드 서버는 이 코드를 사용하여 OAuth 제공자에게 `Access Token`과 `Refresh Token`을 요청하고 발급받습니다.
6.  **토큰 저장 및 사용**: 백엔드는 발급받은 토큰을 프론트엔드로 전달합니다. 프론트엔드는 이 토큰들(주로 `Access Token`)을 저장해두고, 이후 API 요청 시 인증 헤더에 담아 사용합니다. `Refresh Token`은 `Access Token`이 만료되었을 때 새 `Access Token`을 발급받는 데 사용됩니다.

## OAuth 콜백 처리

사용자가 OAuth 제공자(Google, Kakao 등)에서 인증을 마치면, 제공자는 우리 애플리케이션의 미리 지정된 콜백 URL로 사용자를 리디렉션 시킵니다. 이때 URL 쿼리 파라미터로 `authorization_code`가 함께 전달됩니다. `OAuthCallback.jsx` 컴포넌트는 이 코드를 받아 백엔드에 토큰을 요청하는 역할을 합니다.

```jsx
// OAuthCallback.jsx
import React, { useEffect } from "react";
import { useLocation, useNavigate, useOutletContext } from "react-router-dom";
import axiosInstance from "./axiosInstance.js"; // API 요청을 위한 axios 인스턴스

const OAuthCallback = () => {
  const location = useLocation(); // 현재 URL 정보를 가져오기 위함
  const navigate = useNavigate(); // 페이지 이동을 위함
  const { updateLoginStatus } = useOutletContext(); // App.jsx로부터 로그인 상태 업데이트 함수를 받음

  useEffect(() => {
    const fetchToken = async () => {
      const queryParams = new URLSearchParams(location.search);
      const code = queryParams.get("code"); // URL에서 'code' 파라미터 추출

      console.log("code:", code);

      if (code) {
        try {
          // 백엔드의 토큰 교환 엔드포인트로 POST 요청
          // 백엔드는 이 code를 받아 OAuth 제공자로부터 accessToken과 refreshToken을 받아옴
          const response = await axiosInstance.post("/token", { code });
          const { accessToken, refreshToken } = response.data;

          // AccessToken은 localStorage에 저장 (API 요청 시 주로 사용)
          localStorage.setItem("accessToken", accessToken);

          // RefreshToken은 HttpOnly, Secure, SameSite=None 속성의 쿠키로 저장하는 것이 보안상 권장됨
          // Max-Age는 초 단위 (여기서는 14일)
          document.cookie = `refreshToken=${refreshToken}; SameSite=None; Secure; Path=/; Max-Age=1209600`;

          console.log("OAuth2 로그인 성공, accessToken=", accessToken);
          updateLoginStatus(true); // 전역 로그인 상태 업데이트
          navigate("/"); // 메인 페이지로 리다이렉트
        } catch (error) {
          console.error("토큰 교환 실패", error);
          navigate("/member/login"); // 실패 시 로그인 페이지로
        }
      } else {
        console.error("OAuth2 로그인 실패: 인증 코드가 없습니다.");
        navigate("/member/login"); // 코드가 없으면 로그인 페이지로
      }
    };

    fetchToken();
  }, [location, navigate, updateLoginStatus]); // 의존성 배열

  return <div>OAuth2 로그인 처리 중...</div>;
};

export default OAuthCallback;
```

- `useLocation` Hook을 사용하여 URL의 쿼리 문자열에서 `code`를 추출합니다.
- 추출된 `code`를 백엔드 서버(`/token` 엔드포인트)로 보내 `Access Token`과 `Refresh Token`을 받아옵니다.
- **토큰 저장**:
  - `Access Token`: `localStorage`에 저장합니다. JavaScript로 접근이 가능하여 API 요청 시 헤더에 쉽게 첨부할 수 있습니다.
  - `Refresh Token`: 보안을 위해 `HttpOnly`, `Secure`, `SameSite=None` 속성을 가진 쿠키에 저장하는 것이 좋습니다. `HttpOnly`는 JavaScript로 토큰에 접근하는 것을 막아 XSS 공격으로부터 토큰을 보호합니다. `Secure`는 HTTPS를 통해서만 쿠키가 전송되도록 합니다. `SameSite=None`은 크로스-오리진 요청 시 쿠키를 전송하기 위해 필요하며, 이 경우 `Secure` 속성도 함께 설정해야 합니다. (예제 코드에서는 `document.cookie`를 사용했지만, 백엔드에서 `Set-Cookie` 헤더로 내려주는 것이 일반적입니다.)
- `updateLoginStatus(true)`를 호출하여 `App.jsx`의 로그인 상태를 업데이트하고, 사용자를 메인 페이지로 이동시킵니다.

## API 요청 및 토큰 관리

로그인 후 모든 API 요청에는 `Access Token`을 포함해야 합니다. 또한, `Access Token`이 만료되었을 경우 `Refresh Token`을 사용하여 자동으로 새 `Access Token`을 발급받는 로직이 필요합니다. `axios` 인터셉터를 사용하면 이를 효율적으로 관리할 수 있습니다.

```javascript
// axiosInstance.js
import axios from "axios";

const axiosInstance = axios.create({
  baseURL: process.env.VITE_BASE_URL, // .env 파일에서 API 기본 URL 가져오기
  withCredentials: true, // 쿠키를 포함한 요청을 보내기 위함 (Refresh Token 쿠키 사용 시)
});

let isRefreshing = false; // RefreshToken 요청 중복 방지 플래그
let refreshSubscribers = []; // RefreshToken 요청 완료 후 재시도할 요청들을 담는 배열

// 콜백 함수를 배열에 추가
function subscribeTokenRefresh(cb) {
  refreshSubscribers.push(cb);
}

// 모든 콜백 함수 실행 (새로운 토큰으로)
function onRefreshed(accessToken) {
  refreshSubscribers.forEach((cb) => cb(accessToken));
  refreshSubscribers = []; // 배열 비우기
}

// Request Interceptor: 모든 요청 전에 실행
axiosInstance.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem("accessToken");
    if (accessToken) {
      config.headers["Authorization"] = `Bearer ${accessToken}`; // Authorization 헤더에 토큰 추가
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: 모든 응답 수신 시 실행
axiosInstance.interceptors.response.use(
  (response) => {
    // 로그인/토큰갱신 응답 등에서 accessToken이 내려오면 localStorage에 저장
    if (response.data && response.data.accessToken) {
      localStorage.setItem("accessToken", response.data.accessToken);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // 401 Unauthorized 에러이고, 재시도한 요청이 아닐 경우
    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true; // 재시도 플래그 설정 (무한 재귀 방지)

      // 현재 Refresh Token으로 Access Token 갱신 시도가 없다면
      if (!isRefreshing) {
        isRefreshing = true; // 갱신 시도 중 플래그 설정

        // RefreshToken 가져오기 (여기서는 localStorage를 사용했지만, HttpOnly 쿠키에서 가져오는 로직이 더 안전)
        // 실제로는 백엔드에서 HttpOnly 쿠키를 읽어 처리하거나, 프론트에서 특별한 엔드포인트를 호출하여 처리
        const refreshToken = localStorage.getItem("refreshToken"); // OAuthCallback.jsx에서 쿠키로 설정했다면, 이 부분 수정 필요

        if (!refreshToken) {
          console.error("No refresh token available.");
          isRefreshing = false;
          // 로그인 페이지로 리디렉션 또는 로그인 상태 초기화 로직
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken"); // 쿠키 삭제 로직도 추가 필요
          // window.location.href = '/member/login'; // 예시
          return Promise.reject(error);
        }

        try {
          // 백엔드의 토큰 갱신 엔드포인트로 POST 요청
          const refreshResponse = await axiosInstance.post("/refresh", {
            refreshToken,
          });
          const newAccessToken = refreshResponse.data.accessToken;

          localStorage.setItem("accessToken", newAccessToken); // 새 AccessToken 저장
          isRefreshing = false; // 갱신 완료
          onRefreshed(newAccessToken); // 대기 중이던 다른 요청들 재시도

          originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
          return axiosInstance(originalRequest); // 원래 요청 재시도
        } catch (refreshError) {
          // RefreshToken 갱신 실패 (RefreshToken 만료 또는 유효하지 않음)
          console.error("Unable to refresh token", refreshError);
          isRefreshing = false;
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken"); // 또는 쿠키 삭제
          // 로그인 페이지로 리디렉션 또는 로그인 상태 초기화
          // window.location.href = '/member/login'; // 예시
          return Promise.reject(refreshError);
        }
      } else {
        // 이미 Refresh Token 갱신 중이면, 현재 요청은 대기열에 추가
        return new Promise((resolve) => {
          subscribeTokenRefresh((accessToken) => {
            originalRequest.headers["Authorization"] = `Bearer ${accessToken}`;
            resolve(axiosInstance(originalRequest));
          });
        });
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
```

**Request Interceptor**

- 모든 API 요청이 백엔드로 전송되기 전에 가로채어, `localStorage`에서 `Access Token`을 가져와 `Authorization: Bearer ${accessToken}` 형태로 HTTP 헤더에 추가합니다.

**Response Interceptor**

- API 응답을 받았을 때 실행됩니다.
- **401 Unauthorized 에러 처리**: `Access Token`이 만료되었거나 유효하지 않을 때 백엔드에서 401 에러를 반환하면, 이 인터셉터가 이를 감지합니다.
- **토큰 갱신 로직**:
  - `isRefreshing` 플래그: 여러 API 요청이 동시에 401 에러를 반환했을 때, 토큰 갱신 요청이 중복으로 발생하는 것을 방지합니다. 첫 번째 401 에러에 대해서만 갱신을 시도하고, 나머지는 대기합니다.
  - `refreshSubscribers`: 토큰 갱신이 진행되는 동안 실패한 다른 요청들을 이 배열에 저장해 둡니다.
  - `localStorage.getItem('refreshToken')`: 저장된 `Refresh Token`을 가져옵니다. (앞서 언급했듯, `HttpOnly` 쿠키에 저장했다면 백엔드가 이 쿠키를 직접 읽어 처리하거나, 프론트는 `/refresh` 요청 시 별도의 본문 없이 요청만 보내고 백엔드가 쿠키를 확인하도록 구현하는 것이 더 안전합니다. 코드에서는 `localStorage`를 사용하고 있습니다.)
  - `/refresh` 엔드포인트 호출: 백엔드에 `Refresh Token`을 보내 새 `Access Token`을 요청합니다.
  - **성공 시**: 새 `Access Token`을 `localStorage`에 저장하고, `isRefreshing` 플래그를 `false`로, 그리고 `onRefreshed(newAccessToken)`를 호출하여 대기 중이던 요청(`refreshSubscribers`)들을 새 토큰으로 재시도합니다. 원래 실패했던 요청도 새 토큰으로 재시도합니다.
  - **실패 시**: `Refresh Token` 마저 만료되었거나 유효하지 않으면, 사용자를 로그아웃 처리하고 로그인 페이지로 이동시킵니다.
- `originalRequest._retry = true;`: 토큰 갱신 후 원래 요청을 재시도할 때, 이 재시도 요청이 또다시 401 에러를 발생시켜 무한 루프에 빠지는 것을 방지하기 위한 플래그입니다.

## 로그인 상태 관리

애플리케이션 전역에서 로그인 상태를 공유하고, 이에 따라 UI(예: 네비게이션 바)를 다르게 보여줘야 합니다. `React Context`를 사용하면 편리합니다.

```jsx
// App.jsx
import React, {
  createContext,
  useCallback,
  useEffect,
  useState /* ... */,
} from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import axiosInstance from "./axiosInstance"; // 우리가 만든 axios 인스턴스
// ... (다른 import들)

export const AppContext = createContext(); // Context 생성

function App() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(
    !!localStorage.getItem("accessToken") // 초기 로그인 상태는 accessToken 존재 유무로 판단
  );
  // ... (userInfo, snackbar 등 다른 상태들)

  const updateLoginStatus = useCallback(
    (status) => {
      setIsLoggedIn(status);
      if (!status) {
        // 로그아웃 시 토큰 제거
        localStorage.removeItem("accessToken");
        // refreshToken 쿠키 삭제 로직 추가 (예: document.cookie = "refreshToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";)
        // 또는 백엔드에 로그아웃 요청을 보내 서버에서 쿠키를 만료시키는 것이 더 확실함
        navigate("/member/login");
      }
    },
    [navigate]
  );

  // ... (SSE, 알림 관련 useEffect 등)

  // 로그인 상태에 따라 SSE 연결 설정
  useEffect(() => {
    let eventSource = null;
    // ... (SSE 설정 로직)
    if (isLoggedIn) {
      // 로그인 되었을 때만 SSE 연결 시도
      setupSSE();
    }
    // ...
    return () => {
      if (eventSource) eventSource.close();
    };
  }, [isLoggedIn]); // isLoggedIn 상태가 변경될 때마다 실행

  return (
    // AppContext.Provider로 하위 컴포넌트에 상태와 함수 전달
    <AppContext.Provider value={{ updateLoginStatus, isLoggedIn /* ... */ }}>
      <nav className="navbar">
        {/* ... (네비게이션 링크들) ... */}
        <div className="nav-right">
          {/* ... (검색창) ... */}
          {!isLoggedIn && ( // 로그인 안했을 때
            <>
              <NavLink to="/member/login">로그인</NavLink>
              <NavLink to="/member/register">회원가입</NavLink>
            </>
          )}
          {isLoggedIn && ( // 로그인 했을 때
            <div className="nav-right-logged-in">
              {/* 알림, 마이페이지 아이콘 등 */}
              <NavLink to="/mypage">
                {userInfo.profileImgUrl ? (
                  <img
                    src={userInfo.profileImgUrl}
                    alt="프로필"
                    className="nav-mypage-img"
                  />
                ) : (
                  <FaUserCircle className="nav-mypage-icon" />
                )}
              </NavLink>
              {/* 로그아웃 버튼 예시 (실제 구현 시에는 updateLoginStatus(false) 호출) */}
              <button onClick={() => updateLoginStatus(false)}>로그아웃</button>
            </div>
          )}
        </div>
      </nav>

      {/* Outlet을 통해 자식 라우트 컴포넌트들이 context 값을 사용할 수 있도록 전달 */}
      <Outlet context={{ updateLoginStatus, isLoggedIn /* ... */ }} />

      {/* ... (Snackbar 등) ... */}
    </AppContext.Provider>
  );
}

export default App;
```

- `AppContext`: `isLoggedIn` 상태와 `updateLoginStatus` 함수를 하위 컴포넌트에 제공합니다. `OAuthCallback.jsx`에서 이 `updateLoginStatus`를 호출하여 로그인 상태를 변경합니다.
- `isLoggedIn` 상태: `localStorage`에 `accessToken`이 있는지 여부로 초기화합니다.
- `updateLoginStatus`: 로그인 상태를 변경하는 함수입니다. 로그아웃 시에는 `accessToken` (및 `refreshToken` 쿠키)을 제거하고 로그인 페이지로 이동시킵니다.
- **조건부 렌더링**: `isLoggedIn` 상태에 따라 네비게이션 바에 "로그인/회원가입" 링크 또는 "마이페이지/알림/로그아웃" 등의 UI를 다르게 표시합니다.
- **인증 필요한 기능**: 예시로 SSE(Server-Sent Events) 연결 로직이 `isLoggedIn` 상태가 `true`일 때만 실행되도록 하여, 인증된 사용자만 특정 기능을 사용할 수 있게 합니다. SSE 연결 시에도 `axiosInstance`처럼 `Authorization` 헤더에 토큰을 담아 보내야 합니다 (EventSourcePolyfill의 headers 옵션).

## VITE 환경 설정 (Proxy 설정)

개발 중에는 프론트엔드 서버(예: `localhost:3000`)와 백엔드 API 서버(예: `localhost:8080`)가 다른 포트에서 실행되는 경우가 많습니다. 이 경우 브라우저의 동일 출처 정책(Same-Origin Policy)으로 인해 CORS(Cross-Origin Resource Sharing) 에러가 발생할 수 있습니다. Vite의 프록시 설정을 사용하면 이 문제를 해결할 수 있습니다.

```javascript
// vite.config.js
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), ""); // .env 파일 로드

  const isDev = env.VITE_IS_DEV === "true"; // 개발 모드 여부 (.env 파일에 VITE_IS_DEV=true 설정)

  const proxyConfig = {};

  // 개발 모드인 경우에만 프록시 설정
  if (isDev) {
    // '/api'로 시작하는 모든 요청을 VITE_BASE_URL_FOR_CONF (예: http://localhost:8080)로 전달
    proxyConfig["/api"] = {
      target: `${env.VITE_BASE_URL_FOR_CONF}`, // 실제 백엔드 서버 주소
      changeOrigin: true, // 요청 헤더의 host를 target의 host로 변경
      secure: false, // HTTPS가 아닌 HTTP 백엔드에 대한 경고 무시 (개발용)
      // rewrite: (path) => path.replace(/^\/api/, '') // 필요에 따라 경로 재작성
    };
    // OAuth 관련 경로도 동일하게 프록시
    proxyConfig["/oauth2"] = {
      // 예: /oauth2/authorization/google
      target: `${env.VITE_BASE_URL_FOR_CONF}`,
      changeOrigin: true,
      secure: false,
    };
    proxyConfig["/token"] = {
      // OAuthCallback.jsx에서 사용하는 /token 엔드포인트
      target: `${env.VITE_BASE_URL_FOR_CONF}`,
      changeOrigin: true,
      secure: false,
    };
    proxyConfig["/refresh"] = {
      // axiosInstance.js에서 사용하는 /refresh 엔드포인트
      target: `${env.VITE_BASE_URL_FOR_CONF}`,
      changeOrigin: true,
      secure: false,
    };
    // SSE 또는 WebSocket 경로 프록시 (App.jsx의 SSE 경로와 일치시켜야 함)
    // EventSourcePolyfill URL이 `${import.meta.env.VITE_BASE_URL}/subscribe/${userId}` 라면,
    // VITE_BASE_URL 자체가 http://localhost:8080/api 와 같은 형태라면,
    // proxyConfig['/api/subscribe'] 와 같이 설정하거나,
    // VITE_BASE_URL을 http://localhost:3000/api (프록시 경로)로 설정하고
    // /api를 백엔드로 프록시 하도록 설정해야 합니다.
    // 코드에서는 EventSourcePolyfill URL이 VITE_BASE_URL (http://localhost:8080)로 직접 연결되므로,
    // /subscribe 경로를 프록시 대상으로 지정하면 됩니다.
    proxyConfig["/subscribe"] = {
      target: `${env.VITE_BASE_URL_FOR_CONF}`, // 백엔드 SSE 엔드포인트
      changeOrigin: true,
      secure: false,
      // ws: true // WebSocket의 경우 true로 설정
    };
  }

  const config = {
    plugins: [react()],
    define: {
      "process.env": env, // process.env를 통해 환경 변수 접근 가능하도록
      global: "globalThis", // sockjs-client 등 일부 라이브러리 호환성
    },
    server: {
      port: 3000, // Vite 개발 서버 포트
      proxy: proxyConfig, // 프록시 설정 적용
    },
  };

  return config;
});
```

- `.env` 파일에 `VITE_BASE_URL_FOR_CONF=http://localhost:8080` (백엔드 서버 주소) 와 `VITE_IS_DEV=true`를 설정합니다.
- `proxyConfig`: 특정 경로(예: `/api`, `/oauth2`, `/token`, `/refresh`, `/subscribe`)로 시작하는 요청을 `target`에 지정된 백엔드 서버로 전달합니다. 이렇게 하면 프론트엔드는 마치 같은 출처에서 API를 호출하는 것처럼 동작하여 CORS 문제를 우회할 수 있습니다.
- `changeOrigin: true`: 가상 호스팅되는 서버로 요청을 보낼 때 필요합니다.
- `axiosInstance`의 `baseURL`은 프록시를 통하지 않는 실제 API 주소 (예: `http://localhost:8080/api`) 또는 프록시 경로 (예: `/api`)로 설정할 수 있습니다. 만약 `baseURL`을 `/api` 와 같이 상대경로로 설정했다면, `vite.config.js`에서 `/api`를 백엔드로 프록시해주면 됩니다.
  - 제공된 `App.jsx`에서 `EventSourcePolyfill` URL은 `import.meta.env.VITE_BASE_URL`을 직접 사용하고, `axiosInstance`의 `baseURL`도 `process.env.VITE_BASE_URL`을 사용합니다. 이 `VITE_BASE_URL`이 `http://localhost:8080`과 같은 실제 백엔드 주소라면, `vite.config.js`의 `proxyConfig` 키는 `/subscribe`, `/token`, `/refresh` 등 실제 엔드포인트 경로의 시작 부분이 되어야 합니다. (위 예시에서는 `/api` prefix 없이 직접적인 경로로 설정)

## 정리

1.  **콜백 처리**: OAuth 제공자로부터 `authorization_code`를 받아 백엔드에 토큰을 요청하고 저장합니다.
2.  **토큰 저장**: `Access Token`은 `localStorage`에, `Refresh Token`은 보안을 위해 `HttpOnly` 쿠키에 저장하는 것을 권장합니다.
3.  **Axios 인터셉터**: API 요청 시 `Access Token`을 자동으로 헤더에 추가하고, 401 에러 발생 시 `Refresh Token`으로 `Access Token`을 자동 갱신하는 로직을 구현합니다.
4.  **전역 상태 관리**: `React Context` 등을 사용하여 로그인 상태를 애플리케이션 전역에서 공유하고 UI를 업데이트합니다.
5.  **개발 환경 프록시**: 개발 시 CORS 문제를 해결하기 위해 Vite의 프록시 기능을 활용합니다.
