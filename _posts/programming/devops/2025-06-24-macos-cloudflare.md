---
title: "[Devops] 맥북(MacOS)을 EC2 서버처럼 써보자! - Cloudflare, DNS"
excerpt: "devops, cloudflare"

categories:
    - Java
tags:
    - [devops, aws, elb]

toc: true
toc_sticky: true

sidebar:
    nav: "categories"

date: 2025-06-24
last_modified_at: 2025-06-24
---

우리는 항상 만든 토이 프로젝트를 배포하려면 AWS의 EC2를 사용하여 RDS, 로드밸런서 등의 기술이 필요하다는 것을 들어왔을 것이다.  
하지만 Cloudflare 서비스와 맥북만 있다면 EC2 서버처럼 DNS에 실시간 연결하여 무료로 서버를 사용할 수가 있게 된다.  

> 어렵지 않다. 차근차근 해보자.  
> Vite-React 서버와 Spring Boot 서버를 동시에 연결했다.

## 1. DNS 구입

나는 토이 프로젝트를 진행할 때, 늘 가비아에서 1년에 500원짜리 싼 DNS를 구매한다.

## 2. Cloudflare

### 2-1. Cloudflare 가입

간단하게 OAuth 로그인으로 1초 가입해주자.

### 2-2. Cloudflare 설치

```shell
brew install cloudflared
```

- 만약 `homebrew`가 없다면 구글링해서 설치 후에 진행하자

### 2-3. Cloudflare에 DNS 등록

아까 가입을 했으면 도메인 주소를 입력하라는 란이 나올 것이다. 입력해 주자.  

그 후 계획은 Free로 하자.

### 2-4. 가비아 네임 서버 등록

<img width="1271" alt="Screenshot 2025-06-24 at 20 24 14" src="https://github.com/user-attachments/assets/c97b9761-d96a-4cad-a790-3c2041ef4781" />

- 도메인 주소를 입력했다면 이 페이지로 들어올 수 있는데, "개요"에서 제공하는 **cloudflare 네임 서버 2개**를 복사하자.
- 그걸 가비아 1차, 2차 네임서버에 각각 붙여넣어 주면 끝이다.

### 2-5. 설정 완료하기

"개요"의 하단에 보면 Cloudflare 측에 "네임 서버 설정 완료했어요~"라고 알려주는 버튼이 있을 것이다. 눌러주자.

## 3. tunnel 설정

이제 거의 다 왔다. 맥 터미널을 키자.

### 3-1. 로그인

```shell
cloudflared tunnel login
```

- 위 명령어를 입력한다면 cloudflare 사이트에 연결이 되고, DNS를 선택하라고 할 때 우리가 설정한 걸 선택하면 된다.

### 3-2. tunnel 생성

```shell
cloudflared tunnel create englishteacher
```

- `englishteacher`는 내가 정한 터널 이름이다. 마음대로 설정해 주자.
- (주의) 생성될 때 tunnel id와 json 파일이 같이 생성될 건데, 이건 중요하니까 잘 저장해 두자.

### 3-3. dns route 설정

```shell
cloudflared tunnel route dns englishteacher englishteacher.store
```

- 다시 말하지만, `englishteacher`는 내가 정한 터널 이름이다.
  - `englishteacher.store`는 당연히 DNS다.
- 성공하면 `CNAME`가 잘 생성된 걸 볼 수 있을 거다.

### 3-4. 프론트엔드, 백엔드 개념 분리

`englishteacher.store`로 들어오는 것은 5173 포트인 프론트엔드로 생각할 수 있다.  
하지만 백엔드 개념으로는 어떻게 해야 할지 처음에는 막막할 것이다.  

그럴 때는 `api.englishteacher.store`처럼 8080 포트로 접속한다는 것을 의도적으로 설정해주면 된다.

<img width="901" alt="Screenshot 2025-06-24 at 21 57 13" src="https://github.com/user-attachments/assets/d73e7e29-576a-407e-ba48-be10a72be702" />

- "Cloudflare -> DNS -> 레코드"에서 "유형: CNAME, 이름: api, 대상: 동일"을 추가해주자.

### 3-5. Vite React 서버, Spring Boot 서버 동시 연결

프론트엔드, 백엔드 서버를 각각 동시에 연결해야 하기 때문에 config 개념을 이용한다.  

```shell
vim ~/.cloudflared/config.yml
```

```shell
# 터널의 UUID
tunnel: ~

credentials-file: /Users/pc명/.cloudflared/~.json

ingress:
  # 1. englishteacher.store으로 들어오는 요청은 localhost:5173 (React)으로 보냅니다.
  - hostname: englishteacher.store
    service: http://localhost:5173

  # 2. api.englishteacher.store으로 들어오는 요청은 localhost:8080 (Spring Boot)으로 보냅니다.
  - hostname: api.englishteacher.store
    service: http://localhost:8080

  # 3. 위 규칙에 해당하지 않는 모든 요청은 404 에러를 반환합니다. (필수)
  - service: http_status:404
```

- 위처럼 해주면 끝이다.

### 3-6. 접속하기 (이걸로만 계속)

이제 다 끝났으니 접속만 이 명령어로 계속 하면 된다.

```shell
cloudflared tunnel run englishteacher
```

- `englishteacher`는 아까 계속 말했던 터널 이름이다.

## 4. TIP

보통 OAuth2 기능은 필수적으로 넣을 텐데 그럴 때마다 헷갈릴 분들을 위해 몇 개의 팁만 남겨 두겠다.

### 4-1. 리디렉션 URI 설정

<img width="545" alt="Screenshot 2025-06-24 at 21 48 24" src="https://github.com/user-attachments/assets/33292fa1-5170-4aa1-8e36-15e462d20db5" />

- JavsScript 원본은 5173 포트로 생각하고, 리디렉션 URI는 8080 포트로 생각하면 편하다.
- 똑같이 프로젝트에도 적용해주면 된다.

### 4-2. URI는 하드 코딩 지양

각자 구현한 프로젝트에 URI가 하드 코딩으로 되어 있는 부분이 은근 있을 것이다.  
무조건 `.yml`이나 `.env`로 다 옮기는 것을 추천한다.  

하나에서 둘쯤은 `localhost`가 남아 있어서 분명 오류가 터질 것이다.  

특히 `VITE_API_BASE_URL=https://api.englishteacher.store`는 꼭 바꿔주자
