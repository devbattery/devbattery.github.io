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
last_modified_at: 2025-08-25
---

> 나는 동시 접속자를 최대 1500명으로 생각하고 워스트 케이스를 잡았다.  
> 프론트엔드는 Vercel로 배포했으므로 이 글에서는 생략하겠다.

## 인프라 환경

- EC2 Auto Scaling Group (SpringBoot Server Scale-out)
- ElastiCache for Valkey (Redis)
- AmazonMQ for ActiveMQ (Message Broker)
- RDS for MySQL (DB)
- Atlas for MongoDB (DB for Message)

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
