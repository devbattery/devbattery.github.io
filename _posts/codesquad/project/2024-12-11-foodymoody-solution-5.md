---
title: "[Project] Google OAuth2에서 지속적인 401 invalid_client 에러 해결 과정"
excerpt: "foodymoody, solution"

categories:
  - Project
tags:
  - [foodymoody, solution]

toc: true
toc_sticky: true

sidebar:
  nav: "categories"

date: 2024-12-11
last_modified_at: 2024-12-16
---

> [FoodyMoody 프로젝트](https://github.com/foody-moody/foodymoody)에 대한 설명입니다.

## 문제 발생

이 문제는 서버 재운영 후 가장 먼저 만나게 된 에러였다. 하지만, 대부분의 블로그들에서는 백엔드의 잘못, 즉 client_id 혹은 client_secret란을 yml 파일에 잘못 올렸던 것이 원인이었다.

하지만, 아무리 봐도 client_id와 client_secret은 틀린 것이 없었고, redirect_url마저 교차 검증을 진행했음에도 문제가 없었다. OAuth 동의 화면에서도 이미 프로덕션 단계로 넘어가 있는 상태였고, 도저히 원인을 모르겠어서 일단 다른 문제를 해결하고 있었다.

몇 주 동안 끙끙 앓으며 대체 왜 이런 문제가 발생하는 걸까를 생각해왔지만, 도저히 알 길이 없었다. 왜냐하면 백엔드의 테스트 코드에서는 아주 잘 작동되고, 프론트로 넘어가는 데에 아무 문제가 없었기 때문이다.

## 문제 해결

결국 원인은 프론트 코드에 있었다. 아무리 검색을 해 봐도 프론트 코드의 오류로 인해 발생한 포스트가 없었기 때문에 더 오래 걸렸던 것 같다. 이런 걸 보면 결국 오류를 해결해주는 건 검색이 아닌 나 자신의 사고인 것 같다. 프론트쪽의 문제가 아닐까하고 계속 의문을 품어왔지만, 리액트 코드를 봐도 전혀 모르겠기도 했고 보통 백엔드의 문제로 401 에러가 발생한다는 사고 방식으로 생각했던 게 문제의 원인이었다.

### 이전 코드

```jsx
import { styled } from "styled-components";
import { GoogleIcon } from "../icon/icons";
import { PATH } from "constants/path";

const { MODE, VITE_GOOGLE_CLIENT_ID } = import.meta.env;

export const OAuthButton = () => {
  const isDev = MODE === "development";
  console.log("isDev", isDev);

  const LOCAL_URL = "http://localhost:5173";
  const GOOGLE_URL = `https://accounts.google.com/o/oauth2/v2/auth?scope=https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email&client_id=${VITE_GOOGLE_CLIENT_ID}&response_type=code&redirect_uri=${
    isDev ? LOCAL_URL + PATH.GOOGLE : "https://foodymoody.site" + PATH.GOOGLE
  }&access_type=offline`;
  // const GOOGLE_URL = `https://accounts.google.com/o/oauth2/v2/auth?
  // 	client_id=${VITE_GOOGLE_CLIENT_ID}
  // 	&redirect_uri=${isDev ? LOCAL_URL + PATH.GOOGLE : VITE_API_URL + PATH.GOOGLE}
  // 	&response_type=code
  // 	&scope=email profile`;
  const handleOauthLogin = () => {
    location.replace(GOOGLE_URL); // 이동
    // window.open(GOOGLE_URL, '_blank', 'width=500,height=600,left=50,top=10'); // 새창
  };

  return (
    <Wrapper onClick={handleOauthLogin} type="button">
      <GoogleIcon />
      <Text>Google로 계속하기</Text>
    </Wrapper>
  );
};

const Wrapper = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  height: 48px;
  padding: 16px;
  border-radius: 4px;

  cursor: pointer;
  border: 1px solid ${({ theme: { colors } }) => colors.textTertiary};
  background-color: ${({ theme: { colors } }) => colors.white};
  transition: all 0.2s ease-in-out;
  &:hover {
    background-color: ${({ theme: { colors } }) => colors.bgGray50};
  }
`;

const Text = styled.p`
  font: ${({ theme: { fonts } }) => fonts.displayB14};
  color: ${({ theme: { colors } }) => colors.textSecondary};
  flex: 1;
`;
```

### 수정 코드

```jsx
import { styled } from "styled-components";
import { GoogleIcon } from "../icon/icons";
// import { PATH } from 'constants/path';

const { MODE, VITE_GOOGLE_CLIENT_ID, VITE_REDIRECT_ADDRESS } = import.meta.env;

export const OAuthButton = () => {
  const isDev = MODE === "development";
  console.log("isDev", isDev);

  // const LOCAL_URL = 'http://localhost:5173';
  const GOOGLE_URL = `https://accounts.google.com/o/oauth2/v2/auth?scope=https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email&client_id=${VITE_GOOGLE_CLIENT_ID}&response_type=code&redirect_uri=${VITE_REDIRECT_ADDRESS}&access_type=offline`;
  // const GOOGLE_URL = `https://accounts.google.com/o/oauth2/v2/auth?
  // 	client_id=${VITE_GOOGLE_CLIENT_ID}
  // 	&redirect_uri=${isDev ? LOCAL_URL + PATH.GOOGLE : VITE_API_URL + PATH.GOOGLE}
  // 	&response_type=code
  // 	&scope=email profile`;
  const handleOauthLogin = () => {
    location.replace(GOOGLE_URL); // 이동
    // window.open(GOOGLE_URL, '_blank', 'width=500,height=600,left=50,top=10'); // 새창
  };

  return (
    <Wrapper onClick={handleOauthLogin} type="button">
      <GoogleIcon />
      <Text>Google로 계속하기</Text>
    </Wrapper>
  );
};

const Wrapper = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  height: 48px;
  padding: 16px;
  border-radius: 4px;

  cursor: pointer;
  border: 1px solid ${({ theme: { colors } }) => colors.textTertiary};
  background-color: ${({ theme: { colors } }) => colors.white};
  transition: all 0.2s ease-in-out;
  &:hover {
    background-color: ${({ theme: { colors } }) => colors.bgGray50};
  }
`;

const Text = styled.p`
  font: ${({ theme: { fonts } }) => fonts.displayB14};
  color: ${({ theme: { colors } }) => colors.textSecondary};
  flex: 1;
`;
```

### 문제 부분

```jsx
const { MODE, VITE_GOOGLE_CLIENT_ID } = import.meta.env;

export const OAuthButton = () => {
  const isDev = MODE === 'development';
  console.log('isDev', isDev);

  const LOCAL_URL = 'http://localhost:5173';
  const GOOGLE_URL = `https://accounts.google.com/o/oauth2/v2/auth?scope=https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email&client_id=${VITE_GOOGLE_CLIENT_ID}&response_type=code&redirect_uri=${
    isDev ? LOCAL_URL + PATH.GOOGLE : 'https://foodymoody.site' + PATH.GOOGLE
  }&access_type=offline`;
```

```jsx
const { MODE, VITE_GOOGLE_CLIENT_ID, VITE_REDIRECT_ADDRESS } = import.meta.env;

export const OAuthButton = () => {
    const isDev = MODE === 'development';
    console.log('isDev', isDev);

    // const LOCAL_URL = 'http://localhost:5173';
    const GOOGLE_URL = https://accounts.google.com/o/oauth2/v2/auth?scope=https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email&client_id=${VITE_GOOGLE_CLIENT_ID}&response_type=code&redirect_uri=${VITE_REDIRECT_ADDRESS}&access_type=offline;
```

- `VITE_GOOGLE_CLIENT_ID`
  - 이전에 공유됐던 .ENV 파일만 믿고, 멋대로 백엔드에서 넘겨줬으니 괜찮다는 생각을 했던 것 같다.
    - 포스트에는 올리지 않았지만, 어제 해결했던 kakao api와 naver api 문제도 결국은 .ENV 파일의 VITE 미작성 문제였기 때문에 이 부분을 생각했어야 했다.
    - 백엔드에서의 yml 파일은, 프론트엔드에서 .ENV 파일로 구분된다는 걸 뼈저리게 느꼈다..
- `redirect_uri=${VITE_REDIRECT_ADDRESS}`
  - 이 부분도 같은 이유로 제대로 작동하지 않아서 VITE로 다시 넣어주자 하고 변경했다.

## 2차 문제 발생

### 1st 해결 시도

<img width="1124" alt="Screenshot 2024-12-11 at 10 20 26" src="https://github.com/user-attachments/assets/5f81a9e5-3c29-4657-85f0-057f8388562f">

- 이 화면을 보고, 잘 작동하는구나 싶었는데 플래그를 괜히 세운 것 같다.

<img width="1512" alt="Screenshot 2024-12-11 at 10 21 17" src="https://github.com/user-attachments/assets/2caa5cc7-f6ed-4c4d-93f4-fe897c695715">

- 로그인을 하면 이런 식으로 errorPage가 뜬다.

### 2nd 해결 시도

redirect_url 부분에서 프론트의 코드가 괜히 그렇게 되어 있던 건 아닌 거 같아서 좀 찾아봤더니 redirect 백엔드의 url과 프론트엔드의 url은 다르다고 하는 것 같다.

```jsx
const isDev = MODE === "development";
console.log("isDev", isDev);

const LOCAL_URL = "http://localhost:5173";
// const GOOGLE_URL = `https://accounts.google.com/o/oauth2/v2/auth?scope=https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email&client_id=${VITE_GOOGLE_CLIENT_ID}&response_type=code&redirect_uri=${VITE_REDIRECT_ADDRESS}&access_type=offline`;

console.log("RedirectAddress", "https://foodymoody.store" + PATH.GOOGLE);

const GOOGLE_URL = `https://accounts.google.com/o/oauth2/v2/auth?scope=https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email&client_id=${VITE_GOOGLE_CLIENT_ID}&response_type=code&redirect_uri=${
  isDev ? LOCAL_URL + PATH.GOOGLE : "https://foodymoody.store" + PATH.GOOGLE
}&access_type=offline`;
```

- 그래서 다시 이런 식으로 변경하고 로그를 확인하니 아래와 같이 출력됐다.

```
isDev false
RedirectAddress https://foodymoody.store/redirect/oauth
```

- 이 부분에서 갑자기 번뜩 떠올랐다.
- 그렇다, 승인된 리디렉션 URI 란에 이 프론트에서 사용하는 URI를 허용해주지 않은 것이다.

<img width="507" alt="Screenshot 2024-12-11 at 10 43 38" src="https://github.com/user-attachments/assets/8e4d2d0f-6e6a-4e07-8397-93c676c611e5">

- 허용해 주니 아까처럼 로그인창도 잘 뜨고, 로그인도 잘 되는 것 같다.
- 하지만 `https://foodymoody.store/redirect/oauth?code=4%2F0AanRRrtGJpJ4aeiSGXkq4JYEQLtl7U-cMBRE0YSOqapKbBWWC_o7_0CkwRRJIxwIi3xSqw&scope=email+profile+openid+https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fuserinfo.profile+https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fuserinfo.email&authuser=0&prompt=consent` 이와 같은 리다이렉트 URL이 나오면서 400 에러가 발생한다.

### 3rd 해결 시도

```java
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final LogoutUseCase logoutUseCase;
    private final LocalLoginUseCase localLoginUseCase;
    private final TokenReissueUseCase tokenReissueUseCase;
    private final OAuthLoginUseCase oAuthLoginUseCase;

    @GetMapping("/oauth/{provider}")
    public ResponseEntity<TokenIssueResponse> oAuthLogin(
            @PathVariable String provider,
            @RequestParam("code") String code) {
        TokenIssueResponse response = oAuthLoginUseCase.login(provider, code);
        return ResponseEntity.status(HttpStatus.OK).body(response);
    }
}

// ... 생략
```

```jsx
GOOGLE: '/api/auth/oauth/google',
```

- 백엔드 코드에서는 `https://foodymoody.store/api/auth/oauth/google`의 경로로 받으니, 이걸 승인된 리디렉션 URI에 넣어주고 프론트 코드도 맞게 수정해 보았다.
  - 사실상 `PATH.GOOGLE`의 경로만 백엔드와 맞게 수정한 것이다.
- 하지만 이렇게 백엔드와 일치시키는 게 아니라는 걸 프론트엔드의 엔드포인트를 보고 깨달았다.

### 4th 해결 시도 (해결)

4th 해결 시도라고는 했지만, 해결할 며칠 동안 문서 작성할 여유도 없을 정도로 정말 많은 문서도 뒤져보고, AI랑 가장 많은 대화를 나눠본 것 같다.

다음에는 무조건 이렇게만 해야겠다라는 마음으로 그동안의 실패 원인을 아주 간단하게만 작성하겠다.

```jsx
const GOOGLE_URL = `https://accounts.google.com/o/oauth2/v2/auth?scope=https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email&client_id=${VITE_GOOGLE_CLIENT_ID}&response_type=code&redirect_uri=${
  isDev ? LOCAL_URL + PATH.GOOGLE : "https://foodymoody.store" + PATH.GOOGLE
}&access_type=offline`;
console.log("RedirectAddress", "https://foodymoody.store" + PATH.GOOGLE);
```

```jsx
export const PATH = {
  // ... 생략
  GOOGLE: "/login/oauth2/code/google", // 원인 -> GOOGLE: '/redirect/oauth',
};
```

- 문제 발생 redirect url
  - 프론트 redirect url: `https://foodymoody.store/redirect/oauth`
  - 백엔드 redirect url: `https://foodymoody.store/login/oauth2/code/google`
- 문제 해결 redirect url
  - 프론트 redirect url: `https://foodymoody.store/login/oauth2/code/google`
  - 백엔드 redirect url: `https://foodymoody.store/login/oauth2/code/google`

## 결론

그냥 프론트와 백엔드 redirect url을 통일해주면 되는 문제였음..

너무나도 허탈하고 어이가 없는 수준의 문제를 며칠 동안 잡아 끌었으니 이젠 OAuth 구현할 때 절대 안 까먹겠다는 생각이 들었다.

> [해당 이슈 링크](https://github.com/foody-moody/foodymoody/issues/637)
