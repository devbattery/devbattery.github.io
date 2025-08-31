---
title: "[Devops] AWS의 Auto Scaling으로 Scale-out 하여 서버 분산하여 배포"
excerpt: "devops, aws, auto-scaling, serverless"

categories:
    - Java
tags:
    - [devops, aws, auto-scaling, serverless]

toc: true
toc_sticky: true

sidebar:
    nav: "categories"

date: 2025-08-25
last_modified_at: 2025-08-31
---

> 나는 동시 접속자를 최대 1500명으로 생각하고 워스트 케이스를 잡았다.  
> 프론트엔드는 Vercel로 배포했으므로 이 글에서는 생략하겠다.

## 인프라 환경

- EC2 Auto Scaling Group (SpringBoot Server Scale-out)
- ElastiCache for Valkey (Redis)
- AmazonMQ for ActiveMQ (Message Broker)
- RDS for MySQL (DB)
- Atlas for MongoDB (DB for Message)

<img width="7680" height="4320" alt="2d-architecture" src="https://github.com/user-attachments/assets/d92c6dcf-e1cb-4448-b8db-3ae9346392b8" />

## EC2 - 시작 템플릿

### AMI 생성

1. 새로운 EC2 인스턴스를 Ubuntu로 하여 새로 생성
2. 인스턴스의 SSH에 접속하여 Docker와 Docker Compose 설치

```bash
# OS 패키지 최신화
sudo apt-get update
sudo apt-get upgrade -y

# Docker 설치
sudo apt-get install -y docker.io
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker ubuntu

# Docker Compose 설치
sudo curl -L "https://github.com/docker/compose/releases/download/1.29.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

3. 이미지 생성

<img width="649" height="320" alt="Screenshot 2025-08-28 at 09 51 27" src="https://github.com/user-attachments/assets/c83af7d4-8dad-48cd-be7f-a6fe319c8d21" />

### EC2 인스턴스용 IAM "정책" 생성

<img width="1419" height="705" alt="Screenshot 2025-08-28 at 09 57 44" src="https://github.com/user-attachments/assets/9de83b1a-8218-4570-bd5e-592d48893b5d" />

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": "ssm:GetParameter",
            "Resource": "arn:aws:ssm:ap-northeast-2:789665426799:parameter/lionchat/be/application-local-yml"
        }
    ]
}
```
- 이름은 `Read-Lionchat-App-Config-Policy`으로 생성
- `789665426799`는 우측 최상단에 보이는 계정 ID를 넣으면 됨

### EC2 인스턴스용 IAM "역할" 생성

<img width="1421" height="681" alt="Screenshot 2025-08-28 at 09 59 56" src="https://github.com/user-attachments/assets/1b52afd5-1730-42ac-a71a-6864b38185bc" />

- 이름은 `EC2-Lionchat-App-Role`로 생성
- 위에서 만든 `Read-Lionchat-App-Config-Policy`를 권한 정책에 추가
  - `AmazonSSMManagedInstanceCore`와 `AmazonSSMManagedEC2InstanceDefaultPolicy`도 추가

### AWS Systems Manager에 yml 파일 추가

<img width="1608" height="334" alt="Screenshot 2025-08-28 at 10 05 23" src="https://github.com/user-attachments/assets/b893f7c8-34a5-45f9-bb9c-436b7ba8d69e" />

<img width="642" height="509" alt="Screenshot 2025-08-28 at 10 06 09" src="https://github.com/user-attachments/assets/3afd8935-f608-4c47-83ec-cdb2fccf025d" />

- 저 `값` 부분에 서버용 `application.yml`을 넣으면 됨

### 시작 템플릿 생성

<img width="1139" height="720" alt="Screenshot 2025-08-28 at 09 52 15" src="https://github.com/user-attachments/assets/1594b860-1ef0-47fe-8f66-b82690747b3c" />

<img width="1120" height="734" alt="Screenshot 2025-08-28 at 09 53 07" src="https://github.com/user-attachments/assets/81b36e0f-6e61-4e0d-ad6b-14f0bd0f3ffe" />

<img width="941" height="385" alt="Screenshot 2025-08-28 at 10 02 36" src="https://github.com/user-attachments/assets/7a5e9261-91dc-4ef2-823a-572b005a120f" />

<img width="765" height="480" alt="Screenshot 2025-08-28 at 10 02 55" src="https://github.com/user-attachments/assets/0b5e3b81-f4a1-4f0b-bce7-f0a9e92a1179" />

```bash
#!/bin/bash -xe

# 스크립트 실행 과정을 로그 파일로 남겨서 디버깅을 쉽게 합니다.
exec > >(tee /home/ubuntu/user-data.log|logger -t user-data -s 2>/dev/console) 2>&1

# apt가 사용자에게 질문하는 것을 방지합니다.
export DEBIAN_FRONTEND=noninteractive

# 1. 시스템 패키지 목록 업데이트
apt-get update -y

# 2. 필수 패키지 (curl, unzip, docker) 설치
# 'awscli'는 apt 목록에서 제거하고, AWS CLI 설치에 필요한 'unzip'을 추가합니다.
apt-get install -y apt-transport-https ca-certificates curl unzip software-properties-common docker.io

# 3. AWS CLI v2 공식 설치 (가장 중요한 변경점)
echo "Installing AWS CLI v2..."
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
./aws/install
rm -rf aws awscliv2.zip
echo "AWS CLI v2 installation complete."

# 4. Docker 서비스 시작 및 활성화
systemctl start docker
systemctl enable docker

# 5. 'ubuntu' 사용자가 sudo 없이 docker 명령어를 사용하도록 권한 추가
usermod -aG docker ubuntu

# 6. 설정 파일 저장 디렉토리 생성
CONF_DIR="/home/ubuntu/conf"
mkdir -p "$CONF_DIR"

# 7. SSM Parameter Store에서 설정 파일 가져오기
# 이제 aws 명령어가 정상적으로 작동할 것입니다.
aws ssm get-parameter --name "/lionchat/be/application-local-yml" --with-decryption --query "Parameter.Value" --output text --region ap-northeast-2 > "$CONF_DIR/application-local.yml"

# 8. 생성된 파일 및 디렉토리의 소유자를 ubuntu로 변경
chown -R ubuntu:ubuntu "$CONF_DIR"
chown ubuntu:ubuntu /home/ubuntu/user-data.log

# 9. Docker Hub에서 최신 이미지 가져오기
docker pull won4885/lionchat_be:latest

# 10. 기존 컨테이너가 있다면 삭제 후 실행
docker stop be-app || true
docker rm be-app || true

# 11. Docker 컨테이너 실행
docker run -d --name be-app \
-p 8080:8080 \
-v /home/ubuntu/conf/application-local.yml:/app/application-local.yml \
-e SPRING_CONFIG_ADDITIONAL_LOCATION=file:/app/application-local.yml \
--restart always \
won4885/lionchat_be:latest
```

- `won4885/lionchat_be:latest`는 Docker Hub에서 생성해준 레포지토리다.
- 아래 사진은 같이 Docker Hub에 레포지토리 생성 후 `latest`까지 버전을 붙여줘야 한다.

<img width="831" height="675" alt="Screenshot 2025-08-28 at 10 09 05" src="https://github.com/user-attachments/assets/5d9998c1-95e2-405b-b1e1-138ffc67439b" />

## Auto Scaling 그룹

<img width="1206" height="743" alt="Screenshot 2025-08-28 at 10 18 51" src="https://github.com/user-attachments/assets/50ad2ad3-bda0-4e91-a286-c321933ad3e7" />

<img width="1321" height="603" alt="Screenshot 2025-08-28 at 10 19 18" src="https://github.com/user-attachments/assets/b2dce42d-0435-442c-800d-d1617c75b83a" />

<img width="1317" height="349" alt="Screenshot 2025-08-28 at 10 23 55" src="https://github.com/user-attachments/assets/4b14a617-a140-4611-aeb5-19cfdf66a3d9" />

<img width="1313" height="738" alt="Screenshot 2025-08-28 at 10 24 15" src="https://github.com/user-attachments/assets/ae56e28d-6c81-4d52-b971-e734303e01d5" />

<img width="1328" height="592" alt="Screenshot 2025-08-28 at 10 20 49" src="https://github.com/user-attachments/assets/a58ee978-1dd7-4b93-ba06-598ee8922e39" />

- 로드 밸런서는 ALB로 8080 포트로 이동하는 대상 그룹을 선택했다.
- 그룹 크기는 "원하는 용량"으로 "기본 크기"를 설정하고, "크기 조정"으로는 늘어날 미니멈과 맥시멈 값을 조정할 수 있다.
  - 현재는 기본적으로 인스턴스 2개로 돌아가면서, CPU 사용률이 60%가 넘었을 때 최대 4개까지 늘어나게끔 설정했다.

## Github Actions용 IAM "사용자" 생성

<img width="1700" height="481" alt="Screenshot 2025-08-28 at 10 27 55" src="https://github.com/user-attachments/assets/b7f9c099-0258-4aba-8ac7-c2a02b7fa611" />

<img width="1701" height="619" alt="Screenshot 2025-08-28 at 10 32 33" src="https://github.com/user-attachments/assets/1ae890c0-e217-422a-bbe8-41f0b191332f" />

- "권한 추가"를 눌러서 `Github-Actions-ASG-Refresh-Policy` 이름의 권한을 아래와 같이 생성한다.

<img width="1421" height="582" alt="Screenshot 2025-08-28 at 10 34 02" src="https://github.com/user-attachments/assets/2eb17610-1a78-4922-917e-a79f314966ab" />

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": "autoscaling:StartInstanceRefresh",
            "Resource": "*"
        }
    ]
}
```

<img width="1406" height="529" alt="Screenshot 2025-08-28 at 10 37 55" src="https://github.com/user-attachments/assets/5121a6de-11f8-46fd-9368-3b8d0de9b40a" />

- 여기에서 액세스 키를 만들고, 아래의 환경 변수에 넣어줄 거다.

## CI/CD 연동

```yml
name: be-cd
on:
  push:
    branches:
      - dev
    paths:
      - '**'
env:
  ROOT_PATH: ${{ github.workspace }}
  MAIN_RESOURCE_PATH: ${{ github.workspace }}/src/main/resources
  TEST_RESOURCE_PATH: ${{ github.workspace }}/src/test/resources

jobs:
  be-cd:
    runs-on: ubuntu-latest
    steps:
      - name: 레포지토리를 체크아웃한다
        uses: actions/checkout@v4
      - name: 자바를 설치한다
        uses: actions/setup-java@v3
        with:
          distribution: 'corretto'
          java-version: '17'
      - name: 설정파일을 추가한다
        run: |
          cd ${{ env.TEST_RESOURCE_PATH }}
          printf '%s' "${{ secrets.APPLICATION_TEST_YML }}" > application-test.yml
          
          # 생성 후 파일 확인 명령어 추가
          ls -l ${{ env.TEST_RESOURCE_PATH }}/application-test.yml
          stat ${{ env.TEST_RESOURCE_PATH }}/application-test.yml
      - name: 어플리케이션을 빌드한다
        run: |
          chmod +x gradlew
          echo "::group::Gradle Build Logs"
          ./gradlew clean build --info
          echo "::endgroup::"

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
      - name: AWS 자격 증명 설정
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ap-northeast-2

      - name: Auto Scaling Group 인스턴스 새로고침 시작
        run: |
          aws autoscaling start-instance-refresh \
            --auto-scaling-group-name tokit-asg \
            --strategy "Rolling" \
            --preferences "MinHealthyPercentage=50"
```

- `.github/workflows/be-cd.yml` 파일이다.
- `secrets.$환경변수`로 찍혀있는 부분은 깃허브 레포의 Settings -> Security -> Secrets and variables -> Actions에서 Repository secrets에 추가하면 된다.

<img width="1160" height="475" alt="Screenshot 2025-08-28 at 10 53 05" src="https://github.com/user-attachments/assets/0ef7c853-b678-4f7b-aa2e-9af4e6f5ba20" />

- `APPLICATION_TEST_YML`: 테스트 코드용 yml 파일
- `AWS_ACCESS_KEY_ID`: Github Actions IAM 사용자를 만들 때 생성한 액세스 키에서 받은 key id
- `AWS_SECRET_ACCESS_KEY`: Github Actions IAM 사용자를 만들 때 생성한 액세스 키에서 받은 secret key
- `BE_DOCKER_IMAGE_NAME`: Docker hub의 레포지토리 네이밍 (`won4885/lionchat_be`)
  - 혹시 잘 안 되면 `won4885/lionchat_be:latest`로 `latest` 태그 추가
- `DOCKER_HUB_USERNAME`: docker hub의 id
- `DOCKER_HUB_PASSWORD`: docker hub의 access key

## 실제 서비스 경험

> `8월 23일 18시 ~ 8월 25일 12시`: 사전예약 기간  
> `8월 25일 12시 ~ 8월 26일 05시`: 본 서비스 기간

### 접속자 수

<img width="1582" height="1031" alt="스크린샷 2025-08-27 오전 10 51 03" src="https://github.com/user-attachments/assets/2157bf90-856c-45cc-8085-3ba85c1495e2" />

### EC2 인스턴스

<img width="2290" height="962" alt="Screenshot 2025-08-26 at 20 35 06" src="https://github.com/user-attachments/assets/ef21955b-2f07-465f-94a2-238160586855" />

### RDS for MySQL

<img width="1079" height="718" alt="Screenshot 2025-08-26 at 20 57 58" src="https://github.com/user-attachments/assets/96d2f719-3414-48d8-ac42-9db00d75d760" />

### ElastiCache for Valkey

<img width="1619" height="616" alt="Screenshot 2025-08-26 at 20 53 57" src="https://github.com/user-attachments/assets/60dd8ffc-a5a0-41cd-9acc-ddce69960f21" />

<img width="1643" height="307" alt="Screenshot 2025-08-26 at 20 54 13" src="https://github.com/user-attachments/assets/f7e53ad8-ad7d-42d8-8a1e-5e4d72528cfd" />

<img width="810" height="309" alt="Screenshot 2025-08-26 at 20 54 21" src="https://github.com/user-attachments/assets/f9a288bd-e551-43f2-b265-2a94c07bc576" />

### AmazonMQ for ActiveMQ

<img width="1607" height="461" alt="Screenshot 2025-08-26 at 20 55 17" src="https://github.com/user-attachments/assets/4a9dbe77-e572-4d59-bcf1-cea4819084f8" />

## 추가 정보

### Route 53

<img width="395" height="546" alt="Screenshot 2025-08-29 at 12 00 29" src="https://github.com/user-attachments/assets/3bd2a183-ed95-4fda-a009-b827a36c2016" />

- A 타입(별칭): 위 이미지를 참고하여, 백엔드용 `api.google.com`으로 api 서브 도메인을 사용하여 연결
  - A 타입(값): Vercel에서 발급 받은 A 타입 주소
- NS 타입: 가비아와 같은 도메인 사이트에서 발급받은 네임서버 넣기
- CNAME 타입(AWS): 아래의 Certificate Manager 참고
  - CNAME 타입(Vercel): Vercel에서 CNAME 값을 받고, 레코드 이름에 `www.google.com`과 같이 `www`도 지정하기

### Certificate Manager

<img width="1710" height="690" alt="Screenshot 2025-08-29 at 11 59 42" src="https://github.com/user-attachments/assets/b6586e41-b341-4b76-b944-d20055efa311" />

- 정규화 도메인을 `*.google.com`과 같이 설정
- 이렇게 한다면 `www.google.com`와 `api.google.com` 둘 다 커버 가능

### ALB

<img width="1484" height="728" alt="Screenshot 2025-08-29 at 11 54 38" src="https://github.com/user-attachments/assets/b4327a01-e1e6-43c9-8c0e-6615104fc03b" />

<img width="1235" height="785" alt="Screenshot 2025-08-29 at 11 55 28" src="https://github.com/user-attachments/assets/5787f6a5-4d6f-4b14-988f-df32c327cbb3" />

<img width="1472" height="527" alt="Screenshot 2025-08-29 at 11 55 43" src="https://github.com/user-attachments/assets/624f90b4-8b8d-4e50-8268-be1388e95439" />

### 대상 그룹

<img width="1476" height="658" alt="Screenshot 2025-08-29 at 11 56 13" src="https://github.com/user-attachments/assets/b15eaa25-06ad-4ad2-8473-d74e8e736961" />
