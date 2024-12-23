---
title: "[Project] Docker를 활용한 GitHub Actions 기반 CI/CD 자동화 배포"
excerpt: "ci-cd, docker, github-actions"

categories:
  - Project
tags:
  - [ci-cd, docker, github-actions]

toc: true
toc_sticky: true

sidebar:
  nav: "categories"

date: 2024-11-22
last_modified_at: 2024-12-21
---

> [FoodyMoody 프로젝트](https://github.com/foody-moody/foodymoody) 중 **자동화 배포**에 대한 설명입니다.

## Docker Compose

### 백엔드 Docker Compose `docker-compose-be-app.yml`

```yaml
version: "1.0"

services:
  be-app:
    image: won4885/foodymoody_be_hub:latest
    container_name: be-app
    ports:
      - "8080:8080"
    environment:
      - SPRING_PROFILES_ACTIVE=aws
      - TZ=Asia/Seoul
    networks:
      - default-network
    volumes:
      - /home/ubuntu/be/conf:/be/conf/
    restart: always

networks:
  default-network:
    driver: bridge
```

- **`version: "1.0"`**: Docker Compose 파일의 버전을 명시합니다.
- **`services:`**: 실행할 서비스들을 정의합니다.
  - **`be-app:`**: 백엔드 서비스의 이름입니다.
    - **`image: won4885/foodymoody_be_hub:latest`**: 사용할 Docker 이미지를 지정합니다. `won4885/foodymoody_be_hub`라는 Docker Hub 저장소에서 최신(`latest`) 버전의 이미지를 가져옵니다.
    - **`container_name: be-app`**: 생성될 컨테이너의 이름을 `be-app`으로 지정합니다.
    - **`ports: - "8080:8080"`**: 호스트의 8080 포트를 컨테이너의 8080 포트와 연결합니다. 즉, 외부에서 8080 포트로 접근하면 이 컨테이너로 연결됩니다.
    - **`environment:`**: 컨테이너 내에서 사용할 환경 변수를 설정합니다.
      - **`SPRING_PROFILES_ACTIVE=aws`**: Spring Boot 애플리케이션의 프로파일을 `aws`로 설정합니다. 이를 통해 AWS 환경에 맞는 설정이 적용될 것입니다.
      - **`TZ=Asia/Seoul`**: 컨테이너의 시간대를 서울 시간으로 설정합니다.
    - **`networks: - default-network`**: 컨테이너가 `default-network`라는 네트워크에 연결됩니다.
    - **`volumes: - /home/ubuntu/be/conf:/be/conf/`**: 호스트의 `/home/ubuntu/be/conf` 디렉토리를 컨테이너의 `/be/conf/` 디렉토리와 연결합니다. 이를 통해 호스트에서 설정 파일을 수정하면 컨테이너에도 바로 반영됩니다.
    - **`restart: always`**: 컨테이너가 종료될 경우 항상 재시작하도록 설정합니다.
- **`networks:`**: 사용할 네트워크를 정의합니다.
  - **`default-network:`**: `default-network`라는 이름의 네트워크를 정의합니다.
    - **`driver: bridge`**: 네트워크 드라이버를 `bridge`로 설정합니다. `bridge` 네트워크는 동일한 호스트 내의 컨테이너 간 통신을 가능하게 합니다.

### 프론트엔드 Docker Compose `docker-compose-fe-app.yml`

```yaml
version: "1.0"

services:
  fe-app:
    image: won4885/foodymoody_fe_hub:latest
    container_name: fe-app
    ports:
      - "80:3000"
    environment:
      - TZ=Asia/Seoul
    networks:
      - default-network
    volumes:
      - /home/ubuntu/be/conf:/be/conf/ # 이 부분은 fe-app에 필요한 설정인지 확인 필요
    restart: always

networks:
  default-network:
    driver: bridge
```

- **`version: "1.0"`**: Docker Compose 파일의 버전을 명시합니다.
- **`services:`**: 실행할 서비스들을 정의합니다.
  - **`fe-app:`**: 프론트엔드 서비스의 이름입니다.
    - **`image: won4885/foodymoody_fe_hub:latest`**: 사용할 Docker 이미지를 지정합니다. `won4885/foodymoody_fe_hub`라는 Docker Hub 저장소에서 최신(`latest`) 버전의 이미지를 가져옵니다.
    - **`container_name: fe-app`**: 생성될 컨테이너의 이름을 `fe-app`으로 지정합니다.
    - **`ports: - "80:3000"`**: 호스트의 80 포트를 컨테이너의 3000 포트와 연결합니다. 즉, 외부에서 80 포트로 접근하면 이 컨테이너로 연결됩니다. 일반적으로 프론트엔드는 80 포트(HTTP) 또는 443 포트(HTTPS)를 사용합니다.
    - **`environment: - TZ=Asia/Seoul`**: 컨테이너의 시간대를 서울 시간으로 설정합니다.
    - **`networks: - default-network`**: 컨테이너가 `default-network`라는 네트워크에 연결됩니다.
    - **`volumes: - /home/ubuntu/be/conf:/be/conf/`**: **이 부분은 주의가 필요합니다.** 프론트엔드 컨테이너가 백엔드의 설정 디렉토리를 마운트하고 있습니다. 프론트엔드에 필요한 설정인지 확인해야 합니다. 만약 필요 없는 설정이라면 이 부분을 제거하는 것이 좋습니다.
    - **`restart: always`**: 컨테이너가 종료될 경우 항상 재시작하도록 설정합니다.
- **`networks:`**: 사용할 네트워크를 정의합니다.
  - **`default-network:`**: `default-network`라는 이름의 네트워크를 정의합니다.
    - **`driver: bridge`**: 네트워크 드라이버를 `bridge`로 설정합니다.

## Dockerfile

Dockerfile은 애플리케이션을 컨테이너화하기 위한 설정 파일입니다. 각 서비스(프론트엔드와 백엔드)마다 별도의 Dockerfile이 존재하며, 이를 통해 필요한 환경을 구성하고 애플리케이션을 패키징합니다.

### 프론트엔드 Dockerfile (`Dockerfile.fe`)

```
FROM node:18
WORKDIR /app
COPY ./fe/package.json .
RUN npm install
COPY ./fe .
RUN npm run build
RUN npm install -g serve
ENTRYPOINT ["npx", "serve", "-s", "dist"]
```

1. **베이스 이미지 설정**
   - `FROM node:18`: Node.js 18 버전을 베이스 이미지로 사용합니다. 이 이미지는 Node.js 환경이 미리 구성되어 있어 프론트엔드 애플리케이션을 빌드하고 실행하는 데 필요합니다.
2. **작업 디렉토리 설정**
   - `WORKDIR /app`: 컨테이너 내에서 `/app` 디렉토리를 작업 디렉토리로 설정합니다. 이후의 모든 명령어는 이 디렉토리 내에서 실행됩니다.
3. **의존성 설치**
   - `COPY ./fe/package.json .`: 호스트의 `./fe/package.json` 파일을 컨테이너의 작업 디렉토리로 복사합니다.
   - `RUN npm install`: `package.json`에 명시된 의존성을 설치합니다.
4. **애플리케이션 코드 복사 및 빌드**
   - `COPY ./fe .`: 호스트의 `./fe` 디렉토리 내 모든 파일을 컨테이너의 작업 디렉토리로 복사합니다.
   - `RUN npm run build`: 프론트엔드 애플리케이션을 빌드하여 최적화된 정적 파일을 생성합니다.
5. **Serve 패키지 설치**
   - `RUN npm install -g serve`: 빌드된 정적 파일을 서빙하기 위해 `serve` 패키지를 글로벌로 설치합니다.
6. **컨테이너 실행 시 명령어 설정**
   - `ENTRYPOINT ["npx", "serve", "-s", "dist"]`: 컨테이너가 시작될 때 `serve` 명령어를 사용하여 `dist` 디렉토리에 빌드된 정적 파일을 서빙합니다.

즉, 프론트엔드 Dockerfile은 Node.js 환경에서 애플리케이션을 빌드하고, `serve`를 사용하여 정적 파일을 서빙하는 컨테이너를 생성합니다.

### 백엔드 Dockerfile (`Dockerfile.be`)

```
FROM openjdk:11
COPY ./be/build/libs/*.jar app.jar
ENTRYPOINT ["java","-Dspring.config.location=file:/be/conf/","-jar","app.jar","--spring.profiles.active=dev"]
```

1. **베이스 이미지 설정**
   - `FROM openjdk:11`: OpenJDK 11을 베이스 이미지로 사용합니다. 이는 Spring Boot 애플리케이션을 실행하기 위한 Java 런타임 환경을 제공합니다.
2. **애플리케이션 JAR 파일 복사**
   - `COPY ./be/build/libs/*.jar app.jar`: 호스트의 `./be/build/libs/` 디렉토리 내 JAR 파일을 컨테이너의 루트 디렉토리로 복사하고, 이름을 `app.jar`로 변경합니다.
3. **컨테이너 실행 시 명령어 설정**
   - `ENTRYPOINT ["java","-Dspring.config.location=file:/be/conf/","-jar","app.jar","--spring.profiles.active=dev"]`: 컨테이너가 시작될 때 Java를 사용하여 `app.jar` 파일을 실행하며, 추가적인 Spring 설정 파일 위치와 활성 프로파일을 지정합니다.

즉, 백엔드 Dockerfile은 OpenJDK 환경에서 Spring Boot 애플리케이션을 실행하는 컨테이너를 생성합니다. 유연한 설정을 위해 설정 파일 경로와 프로파일을 명시적으로 지정합니다.

---

## CI/CD 워크플로우

GitHub Actions를 활용하여 CI/CD 파이프라인을 구축합니다. 각각의 워크플로우(`.yml` 파일들)는 특정 이벤트(ex. Push, Pull Request 등)에 반응하여 자동으로 빌드, 테스트, 배포를 수행합니다.

### 백엔드 배포 워크플로우 (`be-cd.yml`)

```yaml
name: be-cd
on:
  push:
    branches:
      - release
    paths:
      - "be/**"
env:
  ROOT_PATH: ${{ github.workspace }}/be
  MAIN_RESOURCE_PATH: ${{ github.workspace }}/be/src/main/resources
  TEST_RESOURCE_PATH: ${{ github.workspace }}/be/src/test/resources

jobs:
  be-cd:
    runs-on: ubuntu-latest
    steps:
      - name: 레포지토리를 체크아웃한다
        uses: actions/checkout@v4
      - name: 자바를 설치한다
        uses: actions/setup-java@v3
        with:
          distribution: "corretto"
          java-version: "11"
      - name: 설정파일을 추가한다
        run: |
          cd ${{ env.MAIN_RESOURCE_PATH }}
          echo "${{ secrets.APPLICATION_AWS_YML }}" > application-aws.yml
          echo "${{ secrets.APPLICATION_JWT_YML }}" > application-jwt.yml
          echo "${{ secrets.APPLICATION_OAUTH_YML }}" > application-oauth.yml
      - name: 어플리케이션을 빌드한다
        run: |
          chmod +x gradlew
          ./gradlew build
        working-directory: ${{ env.ROOT_PATH }}
      - name: 도커 허브에 로그인한다
        uses: docker/login-action@v2
        with:
          username: ${{ secrets.DOCKER_HUB_USERNAME }}
          password: ${{ secrets.DOCKER_HUB_PASSWORD }}
      - name: 어플리케이션의 도커 이미지를 빌드하고 도커 허브에 푸시한다
        uses: docker/build-push-action@v4
        with:
          context: .
          file: ./Dockerfile.be
          push: true
          tags: ${{ secrets.BE_DOCKER_IMAGE_NAME }}
      - name: 어플리케이션을 배포한다
        env:
          PRIVATE_KEY: ${{ secrets.EC2_SSH_PRIVATE_KEY }}
          HOST: ${{ secrets.HOST_ADDRESS }}
          USER: ${{ secrets.HOST_USERNAME }}
          TAG: ${{ secrets.BE_DOCKER_IMAGE_NAME }}
        run: |
          # Private key를 파일로 생성합니다.
          echo "$PRIVATE_KEY" > private_key.pem
          chmod 600 private_key.pem

          # EC2 인스턴스에 SSH로 접속하여 Docker 컨테이너를 관리합니다.
          ssh -o StrictHostKeyChecking=no -i private_key.pem $USER@$HOST "
            sudo docker compose -f docker-compose-be-app.yml down -v
            sudo docker compose -f docker-compose-be-app.yml pull
            sudo docker compose -f docker-compose-be-app.yml up -d
            sudo docker image prune -f
          "
```

1. **워크플로우 트리거**
   - `push` 이벤트가 `release` 브랜치에 발생하고, `be/**` 경로 내 파일이 변경되면 워크플로우가 실행됩니다.
2. **환경 변수 설정**
   - `ROOT_PATH`: 백엔드 코드의 루트 디렉토리 경로
   - `MAIN_RESOURCE_PATH`: 백엔드 메인 리소스 디렉토리 경로
   - `TEST_RESOURCE_PATH`: 백엔드 테스트 리소스 디렉토리 경로
3. **작업 단계 (`jobs.be-cd.steps`)**
   - **레포지토리 체크아웃**
     - `actions/checkout@v4`를 사용하여 현재 레포지토리를 체크아웃합니다.
   - **Java 설치**
     - `actions/setup-java@v3`를 사용하여 Java 11 (Corretto 배포판)을 설치합니다.
   - **설정 파일 추가**
     - 백엔드 애플리케이션의 설정 파일을 `secrets`에 저장된 값으로 생성합니다.
     - `APPLICATION_AWS_YML`, `APPLICATION_JWT_YML`, `APPLICATION_OAUTH_YML` 시크릿을 이용하여 각각 `application-aws.yml`, `application-jwt.yml`, `application-oauth.yml` 파일을 생성합니다.
   - **어플리케이션 빌드**
     - `gradlew build` 명령어를 실행하여 백엔드 애플리케이션을 빌드합니다.
     - `chmod +x gradlew`로 Gradle Wrapper에 실행 권한을 부여합니다.
   - **도커 허브 로그인**
     - `docker/login-action@v2`를 사용하여 도커 허브에 로그인합니다.
     - 로그인 정보는 시크릿(`DOCKER_HUB_USERNAME`, `DOCKER_HUB_PASSWORD`)을 사용합니다.
   - **도커 이미지 빌드 및 푸시**
     - `docker/build-push-action@v4`를 사용하여 백엔드 도커 이미지를 빌드하고 도커 허브에 푸시합니다.
     - 빌드 컨텍스트는 현재 디렉토리(`.`)이고, `Dockerfile.be`를 사용합니다.
     - 이미지 태그는 시크릿(`BE_DOCKER_IMAGE_NAME`)을 사용합니다.
   - **애플리케이션 배포**
     - EC2 인스턴스에 SSH로 접속하여 Docker Compose를 통해 애플리케이션을 배포합니다.
     - 배포 과정:
       1. 기존 컨테이너를 중지하고 삭제 (`docker compose down -v`)
       2. 최신 도커 이미지를 풀 (`docker compose pull`)
       3. 컨테이너를 백그라운드에서 실행 (`docker compose up -d`)
       4. 사용하지 않는 도커 이미지를 정리 (`docker image prune -f`)
     - SSH 접속 정보는 시크릿(`EC2_SSH_PRIVATE_KEY`, `HOST_ADDRESS`, `HOST_USERNAME`)을 사용합니다.

즉, `be-cd.yml`은 `release` 브랜치에 백엔드 관련 코드가 푸시될 때 자동으로 빌드, 도커 이미지 생성 및 푸시, 그리고 EC2 인스턴스에 배포하는 과정을 자동화합니다.

### 백엔드 CI 워크플로우 (`be-ci.yml`)

```yaml
name: be-ci
on:
  pull_request:
    branches:
      - dev-be

env:
  ROOT_PATH: ${{ github.workspace }}/be
  MAIN_RESOURCE_PATH: ${{ github.workspace }}/be/src/main/resources
  TEST_RESOURCE_PATH: ${{ github.workspace }}/be/src/test/resources
  COVERALLS_PATH: ${{ github.workspace }}/be/build/reports/jacoco/test/jacocoTestReport.xml

jobs:
  be-ci:
    runs-on: ubuntu-latest
    steps:
      - name: 레포지토리를 체크아웃한다
        uses: actions/checkout@v4
      - name: 자바를 설치한다
        uses: actions/setup-java@v3
        with:
          distribution: "corretto"
          java-version: "11"
      - name: 설정파일을 추가한다
        run: |
          cd ${{ env.MAIN_RESOURCE_PATH }}
          echo "${{ secrets.APPLICATION_AWS_YML }}" > application-aws.yml
          echo "${{ secrets.APPLICATION_JWT_YML }}" > application-jwt.yml
          echo "${{ secrets.APPLICATION_OAUTH_YML }}" > application-oauth.yml
      - name: 어플리케이션을 빌드한다
        run: |
          chmod +x gradlew
          ./gradlew build
        working-directory: ${{ env.ROOT_PATH }}
```

1. **워크플로우 트리거**
   - `pull_request` 이벤트가 `dev-be` 브랜치에 대해 발생할 때 워크플로우가 실행됩니다. 이는 백엔드 코드의 변경사항에 대해 자동으로 빌드와 테스트를 수행하기 위함입니다.
2. **환경 변수 설정**
   - `ROOT_PATH`, `MAIN_RESOURCE_PATH`, `TEST_RESOURCE_PATH`, `COVERALLS_PATH`: 빌드 및 테스트 과정에서 필요한 디렉토리 경로를 설정합니다.
3. **작업 단계 (`jobs.be-ci.steps`)**
   - **레포지토리 체크아웃**
     - `actions/checkout@v4`를 사용하여 현재 레포지토리를 체크아웃합니다.
   - **Java 설치**
     - `actions/setup-java@v3`를 사용하여 Java 11 (Corretto 배포판)을 설치합니다.
   - **설정 파일 추가**
     - 백엔드 애플리케이션의 설정 파일을 시크릿을 이용하여 생성합니다.
   - **어플리케이션 빌드**
     - `gradlew build` 명령어를 실행하여 백엔드 애플리케이션을 빌드합니다.
     - 이 단계에서 테스트도 함께 실행됩니다.

즉,`be-ci.yml`은 `dev-be` 브랜치로의 풀 리퀘스트가 발생할 때 자동으로 백엔드 애플리케이션을 빌드하고 테스트합니다.

### 커버리지 리포트 워크플로우 (`coveralls-report.yml`)

```yaml
name: coveralls-report
on:
  push:
    branches:
      - dev-be

env:
  ROOT_PATH: ${{ github.workspace }}/be
  MAIN_RESOURCE_PATH: ${{ github.workspace }}/be/src/main/resources
  TEST_RESOURCE_PATH: ${{ github.workspace }}/be/src/test/resources
  COVERALLS_PATH: ${{ github.workspace }}/be/build/reports/jacoco/test/jacocoTestReport.xml

jobs:
  be-ci:
    runs-on: ubuntu-latest
    steps:
      - name: 레포지토리를 체크아웃한다
        uses: actions/checkout@v4
      - name: 자바를 설치한다
        uses: actions/setup-java@v3
        with:
          distribution: "corretto"
          java-version: "11"
      - name: 설정파일을 추가한다
        run: |
          cd ${{ env.MAIN_RESOURCE_PATH }}
          echo "${{ secrets.APPLICATION_AWS_YML }}" > application-aws.yml
          echo "${{ secrets.APPLICATION_JWT_YML }}" > application-jwt.yml
          echo "${{ secrets.APPLICATION_OAUTH_YML }}" > application-oauth.yml
      - name: 어플리케이션을 빌드한다
        run: |
          chmod +x gradlew
          ./gradlew build
        working-directory: ${{ env.ROOT_PATH }}
      - name: CoverAlls를 실행한다
        uses: coverallsapp/github-action@v2
        with:
          base-path: COVERALLS_PATH
```

1. **워크플로우 트리거**
   - `push` 이벤트가 `dev-be` 브랜치에 발생할 때 워크플로우가 실행됩니다. 이는 커버리지 리포트를 생성하고 Coveralls에 업로드하기 위함입니다.
2. **환경 변수 설정**
   - `COVERALLS_PATH`: JaCoCo를 통해 생성된 테스트 커버리지 리포트 파일의 경로를 설정합니다.
3. **작업 단계 (`jobs.be-ci.steps`)**
   - **레포지토리 체크아웃**, **Java 설치**, **설정 파일 추가**, **어플리케이션 빌드**: 이전 워크플로우(`be-ci.yml`)와 동일한 단계를 수행하여 애플리케이션을 빌드합니다.
   - **Coveralls 실행**
     - `coverallsapp/github-action@v2`를 사용하여 커버리지 리포트를 Coveralls 서비스에 업로드합니다.
     - `base-path`는 커버리지 리포트 파일의 경로로 설정됩니다.

즉, `coveralls-report.yml`은 `dev-be` 브랜치에 코드가 푸시될 때 자동으로 테스트 커버리지 리포트를 생성하고 Coveralls에 업로드하여 코드의 테스트 커버리지를 시각화합니다.

### 프론트엔드 배포 워크플로우 (`fe-cd.yml`)

```yaml
name: fe-cd
on:
  push:
    branches:
      - release
    paths:
      - "fe/**"

env:
  ROOT_PATH: "./fe"

jobs:
  fe-cd:
    runs-on: ubuntu-latest
    steps:
      - name: 레포지토리를 체크아웃한다
        uses: actions/checkout@v4
      - name: 노드를 설치한다
        uses: actions/setup-node@v3
        with:
          node-version: "18"
      - name: 설정파일을 추가한다
        run: |
          cd ./fe
          echo "${{ secrets.FE_ENV }}" > .env
      - name: 어플리케이션을 빌드한다
        run: |
          npm install
          npm run build
        working-directory: ${{ env.ROOT_PATH }}
      - name: 도커 허브에 로그인한다
        uses: docker/login-action@v2
        with:
          username: ${{ secrets.DOCKER_HUB_USERNAME }}
          password: ${{ secrets.DOCKER_HUB_PASSWORD }}
      - name: 어플리케이션의 도커 이미지를 빌드하고 도커 허브에 푸시한다
        uses: docker/build-push-action@v4
        with:
          context: .
          file: ./Dockerfile.fe
          push: true
          tags: ${{ secrets.FE_DOCKER_IMAGE_NAME }}
      - name: 어플리케이션을 배포한다
        env:
          PRIVATE_KEY: ${{ secrets.EC2_SSH_PRIVATE_KEY }}
          HOST: ${{ secrets.HOST_ADDRESS }}
          USER: ${{ secrets.HOST_USERNAME }}
          TAG: ${{ secrets.BE_DOCKER_IMAGE_NAME }}
        run: |
          # Private key를 파일로 생성합니다.
          echo "$PRIVATE_KEY" > private_key.pem
          chmod 600 private_key.pem

          # EC2 인스턴스에 SSH로 접속하여 Docker 컨테이너를 관리합니다.
          ssh -o StrictHostKeyChecking=no -i private_key.pem $USER@$HOST "
            sudo docker compose -f docker-compose-fe-app.yml down -v
            sudo docker compose -f docker-compose-fe-app.yml pull
            sudo docker compose -f docker-compose-fe-app.yml up -d
            sudo docker image prune -f
          "
```

1. **워크플로우 트리거**
   - `push` 이벤트가 `release` 브랜치에 발생하고, `fe/**` 경로 내 파일이 변경되면 워크플로우가 실행됩니다.
2. **환경 변수 설정**
   - `ROOT_PATH`: 프론트엔드 코드의 루트 디렉토리 경로(`./fe`).
3. **작업 단계 (`jobs.fe-cd.steps`)**
   - **레포지토리 체크아웃**
     - `actions/checkout@v4`를 사용하여 현재 레포지토리를 체크아웃합니다.
   - **Node.js 설치**
     - `actions/setup-node@v3`를 사용하여 Node.js 18 버전을 설치합니다.
   - **설정 파일 추가**
     - 프론트엔드 애플리케이션의 환경 설정 파일 `.env`를 시크릿(`FE_ENV`)을 이용하여 생성합니다.
   - **어플리케이션 빌드**
     - `npm install`로 의존성을 설치하고, `npm run build`로 프론트엔드 애플리케이션을 빌드합니다.
   - **도커 허브 로그인**
     - `docker/login-action@v2`를 사용하여 도커 허브에 로그인합니다.
   - **도커 이미지 빌드 및 푸시**
     - `docker/build-push-action@v4`를 사용하여 프론트엔드 도커 이미지를 빌드하고 도커 허브에 푸시합니다.
     - 빌드 컨텍스트는 현재 디렉토리(`.`)이고, `Dockerfile.fe`를 사용합니다.
     - 이미지 태그는 시크릿(`FE_DOCKER_IMAGE_NAME`)을 사용합니다.
   - **애플리케이션 배포**
     - EC2 인스턴스에 SSH로 접속하여 Docker Compose를 통해 애플리케이션을 배포합니다.
     - 배포 과정:
       1. 기존 컨테이너를 중지하고 삭제 (`docker compose down -v`)
       2. 최신 도커 이미지를 풀 (`docker compose pull`)
       3. 컨테이너를 백그라운드에서 실행 (`docker compose up -d`)
       4. 사용하지 않는 도커 이미지를 정리 (`docker image prune -f`)
     - SSH 접속 정보는 시크릿(`EC2_SSH_PRIVATE_KEY`, `HOST_ADDRESS`, `HOST_USERNAME`)을 사용합니다.

즉, `fe-cd.yml`은 `release` 브랜치에 프론트엔드 관련 코드가 푸시될 때 자동으로 빌드, 도커 이미지 생성 및 푸시, 그리고 EC2 인스턴스에 배포하는 과정을 자동화합니다.

## 배포 과정

### Docker 이미지 빌드 및 푸시

1. **코드 변경 및 푸시**
   - 개발자가 `release` 브랜치에 프론트엔드 또는 백엔드 코드를 푸시하면 해당 워크플로우가 트리거됩니다.
2. **CI/CD 워크플로우 실행**
   - GitHub Actions가 해당 `.yml` 파일을 읽고 정의된 작업을 순차적으로 실행합니다.
3. **의존성 설치 및 애플리케이션 빌드**
   - 백엔드의 경우 `gradlew build`를 통해 애플리케이션을 빌드하고, 프론트엔드는 `npm install`과 `npm run build`를 통해 애플리케이션을 빌드합니다.
4. **도커 이미지 빌드**
   - 각 서비스의 Dockerfile을 기반으로 도커 이미지를 빌드합니다.
   - 백엔드는 `Dockerfile.be`, 프론트엔드는 `Dockerfile.fe`를 사용합니다.
5. **도커 허브에 이미지 푸시**
   - 빌드된 도커 이미지를 도커 허브에 푸시합니다.
   - 이미지 태그는 시크릿으로 관리하여 보안성을 유지합니다.

- **백엔드 도커 이미지 빌드 및 푸시**

```yaml
- name: 어플리케이션의 도커 이미지를 빌드하고 도커 허브에 푸시한다
  uses: docker/build-push-action@v4
  with:
	context: .
	file: ./Dockerfile.be
	push: true
	tags: ${{ secrets.BE_DOCKER_IMAGE_NAME }}
```

- **프론트엔드 도커 이미지 빌드 및 푸시**

```yaml
- name: 어플리케이션의 도커 이미지를 빌드하고 도커 허브에 푸시한다
  uses: docker/build-push-action@v4
  with:
	context: .
	file: ./Dockerfile.fe
	push: true
	tags: ${{ secrets.FE_DOCKER_IMAGE_NAME }}
```

### EC2 인스턴스에 배포

1. **SSH 접속 설정**
   - 워크플로우 내에서 EC2 인스턴스에 SSH로 접속하기 위해 프라이빗 키(`EC2_SSH_PRIVATE_KEY`)를 생성하고 파일로 저장합니다.
   - 권한 설정(`chmod 600 private_key.pem`)을 통해 보안성을 강화합니다.
2. **Docker Compose를 통한 컨테이너 관리**

   - SSH를 통해 EC2 인스턴스에 접속하여 Docker Compose 명령어를 실행합니다.

   1. **기존 컨테이너 중지 및 삭제**
      - `sudo docker compose -f docker-compose-be-app.yml down -v`
   2. **최신 도커 이미지 풀**
      - `sudo docker compose -f docker-compose-be-app.yml pull`
   3. **컨테이너 재시작**
      - `sudo docker compose -f docker-compose-be-app.yml up -d`
   4. **사용하지 않는 도커 이미지 정리**
      - `sudo docker image prune -f`

- **백엔드 배포**

```yaml
- name: 어플리케이션을 배포한다
  env:
	PRIVATE_KEY: ${{ secrets.EC2_SSH_PRIVATE_KEY }}
	HOST: ${{ secrets.HOST_ADDRESS }}
	USER: ${{ secrets.HOST_USERNAME }}
	TAG: ${{ secrets.BE_DOCKER_IMAGE_NAME }}
  run: |
	# Private key를 파일로 생성합니다.
	echo "$PRIVATE_KEY" > private_key.pem
	chmod 600 private_key.pem

	# EC2 인스턴스에 SSH로 접속하여 Docker 컨테이너를 관리합니다.
	ssh -o StrictHostKeyChecking=no -i private_key.pem $USER@$HOST "
	  sudo docker compose -f docker-compose-be-app.yml down -v
	  sudo docker compose -f docker-compose-be-app.yml pull
	  sudo docker compose -f docker-compose-be-app.yml up -d
	  sudo docker image prune -f
	"
```

- **프론트엔드 배포**

```yaml
- name: 어플리케이션을 배포한다
  env:
	PRIVATE_KEY: ${{ secrets.EC2_SSH_PRIVATE_KEY }}
	HOST: ${{ secrets.HOST_ADDRESS }}
	USER: ${{ secrets.HOST_USERNAME }}
	TAG: ${{ secrets.BE_DOCKER_IMAGE_NAME }}
  run: |
	# Private key를 파일로 생성합니다.
	echo "$PRIVATE_KEY" > private_key.pem
	chmod 600 private_key.pem

	# EC2 인스턴스에 SSH로 접속하여 Docker 컨테이너를 관리합니다.
	ssh -o StrictHostKeyChecking=no -i private_key.pem $USER@$HOST "
	  sudo docker compose -f docker-compose-fe-app.yml down -v
	  sudo docker compose -f docker-compose-fe-app.yml pull
	  sudo docker compose -f docker-compose-fe-app.yml up -d
	  sudo docker image prune -f
	"
```

즉, 도커 이미지를 빌드하고 도커 허브에 푸시한 후, SSH를 통해 EC2 인스턴스에 접속하여 Docker Compose를 사용해 애플리케이션을 배포합니다. 이를 통해 최신 버전의 애플리케이션이 실행 중인 컨테이너로 교체됩니다.

## 정리

### 핵심 기술

- **Docker:** 애플리케이션을 컨테이너화하여 환경에 구애받지 않고 일관되게 실행하도록 지원합니다.
  - `Dockerfile.fe`: 프론트엔드 애플리케이션용 Dockerfile
  - `Dockerfile.be`: 백엔드 애플리케이션용 Dockerfile
- **Docker Compose:** 여러 개의 Docker 컨테이너를 정의하고 실행하는 오케스트레이션 도구. 프론트엔드와 백엔드 컨테이너를 함께 관리합니다.
  - `docker-compose-fe-app.yml`: 프론트엔드 배포용
  - `docker-compose-be-app.yml`: 백엔드 배포용
- **GitHub Actions:** CI/CD (지속적 통합 및 지속적 배포) 자동화를 위한 플랫폼. 코드 변경, 풀 리퀘스트 등 특정 이벤트에 따라 빌드, 테스트, 배포 등의 작업을 자동화합니다.
  - `be-cd.yml`: 백엔드 배포 워크플로우
  - `be-ci.yml`: 백엔드 CI (빌드 및 테스트) 워크플로우
  - `coveralls-report.yml`: 테스트 커버리지 리포트 생성 및 업로드 워크플로우
  - `fe-cd.yml`: 프론트엔드 배포 워크플로우
- **Docker Hub:** Docker 이미지를 저장하고 공유하는 레지스트리 서비스. 빌드된 이미지를 Docker Hub에 푸시하고, EC2 인스턴스에서 이를 풀(pull)하여 배포합니다.

### 배포 방식

1. **코드 변경 및 푸시:** `release` 브랜치에 코드를 푸시합니다.
2. **GitHub Actions 트리거:** `release` 브랜치에 대한 푸시 이벤트 또는 `dev-be`에 대한 PR 이벤트를 감지하여 해당 워크플로우가 실행됩니다.
3. **빌드 및 테스트:**
   - 프론트엔드: `npm install`로 의존성을 설치하고 `npm run build`로 빌드합니다.
   - 백엔드: `gradlew build`로 빌드 및 테스트를 수행합니다.
4. **Docker 이미지 빌드 및 푸시:** 각 서비스의 Dockerfile을 사용하여 Docker 이미지를 빌드하고 Docker Hub에 푸시합니다.
5. **EC2 배포:**
   - GitHub Actions에서 SSH를 통해 EC2 인스턴스에 접속합니다.
   - Docker Compose를 사용하여 최신 이미지를 풀(pull)하고, 기존 컨테이너를 중지/삭제한 후 새 컨테이너를 실행합니다.

## 무중단 배포

이제 이 자동화 파일을 가지고 AWS 홈페이지에 들어가 본격적인 세팅이 필요합니다.  
이 작업은 추후 2편 포스트로 돌아오겠습니다.
