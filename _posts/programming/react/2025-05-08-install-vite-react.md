---
title: "[React] Node.js와 npm 설치 후 Vite React 개발 서버 실행 방법"
excerpt: "react, vite, node, npm"

categories:
  - React
tags:
  - [react, vite, node, npm]

toc: true
toc_sticky: true

sidebar:
  nav: "categories"

date: 2025-05-08
last_modified_at: 2025-05-08
---

> zsh 환경 기준으로 설치하였습니다.

## 1. NVM 설치

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
```

- NVM 설치 스크립트로 아래에서 npm, node를 설치하게 됩니다.
  - 관리자 같은 역할입니다.

## 2. NVM 환경 변수 설정

```bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion
```

- 자동으로 `~/.zshrc` 파일에 환경 변수를 추가하게 됩니다.
- 그 후 `source ~/.zshrc` 혹은 터미널을 재시작하세요.

## 3. NVM 설치 확인

```bash
nvm --version
```

- 무언가 오류가 떠도 이대로 진행하면 됩니다.

## 4. Node.js 및 npm 설치

```bash
nvm install --lts
```

## 5. NVM 버전 설정

```bash
nvm use --lts
```

## 6. 버전 확인

```bash
node -v
npm -v
```

- 버전이 무사히 뜬다면 이제 서버를 띄우는 일만 남았습니다.

## 7. 개발 서버 실행

```bash
npm install
```

```bash
npm run dev
```

- 6번까지는 최초 한 번만 실행하고, 이 항목은 매번 서버를 띄울 때마다 실행해주면 됩니다.
- `npm install` 후 취약점이 발견됐다는 문구가 뜬다면 `npm audit fix`를 입력해주면 해결됩니다.
