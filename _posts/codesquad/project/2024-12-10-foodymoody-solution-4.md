---
title: "[Project] RDS의 TimeZone을 설정했는데도 계속 UTC로 나오는 경우 해결 방법"
excerpt: "foodymoody, solution"

categories:
  - Project
tags:
  - [foodymoody, solution]

toc: true
toc_sticky: true

sidebar:
  nav: "categories"

date: 2024-12-10
last_modified_at: 2024-12-10
---

> [FoodyMoody 프로젝트](https://github.com/foody-moody/foodymoody)에 대한 설명입니다.

## 문제 발생

<img width="1167" alt="Screenshot 2024-12-10 at 16 25 34" src="https://github.com/user-attachments/assets/6fe59bc2-2488-48e3-81f6-ffd0484579f7">

- EC2 인스턴스의 시간대와 RDS의 파라미터에서의 time_zone을 Asia/Seoul로 변경했음에도 불구하고, 여전히 서버 시간이 UTC로 설정되어 있는 문제가 있었다.

## 문제 해결

- 이걸 보는 당신도 정말 어이가 없을 것이다.
  - 그렇다, "재부팅"을 안 했기 때문일 가능성이 매우 높다.
- RDS는 EC2와는 다르게 재부팅을 할 일이 거의 없고, 대부분 할 생각조차 하지 않는다.
- EC2의 시간대도 바꿔보고, MySQL에 접속해서도 설정값을 건드려봐도 해결되지 않았던 이유는 Ec2의 MySQL은 그저 RDS를 **참조**하고 있기 때문이다.

```
mysql> SELECT @@global.time_zone, @@session.time_zone;
+--------------------+---------------------+
| @@global.time_zone | @@session.time_zone |
+--------------------+---------------------+
| UTC                | UTC                 |
+--------------------+---------------------+
1 row in set (0.00 sec)
```

```
mysql> SELECT @@global.time_zone, @@session.time_zone;
+--------------------+---------------------+
| @@global.time_zone | @@session.time_zone |
+--------------------+---------------------+
| Asia/Seoul         | Asia/Seoul          |
+--------------------+---------------------+
1 row in set (0.00 sec)
```

- 정말 허무하게 해결이 된 걸 확인할 수 있다.

## 또 다른 문제 발생

EC2와 RDS 모두 Asia/Seoul 시간대로 변경된 것을 확인했다. 그리고 데이터베이스에 저장되는 게 현재 시간인 것도 재차 확인했다. 하지만 프론트엔드 코드에서 `now()`를 호출하게 되면서 문제가 발생했다.

초반에는 이게 EC2을 재부팅하지 않아서 그런 거라고 생각했지만, 생각해 보니 Docker Container의 시간 설정을 따로 해주지 않았다.

이 프로젝트의 경우에는 EC2에 직접 올리는 것이 아니라, Docker를 사용하니 당연히 EC2의 시간대는 아무 상관이 없는 것이다.

## 또 다른 문제 해결

### 1. Docker Container 시간대 확인

```
ubuntu@ip-172-31-14-154:~$ sudo docker exec be-app date
Tue Dec 10 08:18:19 UTC 2024
```

- 예상한 바와 같이 UTC가 나온다.

### 2. Docker Compose 설정 파일 수정

```
    environment:
      - SPRING_PROFILES_ACTIVE=aws
      - TZ=Asia/Seoul  # 시간대 설정 추가
```

- `environment` 부분에 `TZ=Asia/Seoul`을 추가한다.
- be와 fe 둘 다 바꿔준다.

### 3. Docker Container 재시작

```
ubuntu@ip-172-31-14-154:~$ sudo docker-compose -f docker-compose-be-app.yml down
ubuntu@ip-172-31-14-154:~$ sudo docker-compose -f docker-compose-be-app.yml up -d
```

```
ubuntu@ip-172-31-14-154:~$ sudo docker-compose -f docker-compose-fe-app.yml down
ubuntu@ip-172-31-14-154:~$ sudo docker-compose -f docker-compose-fe-app.yml up -d
```

<img width="589" alt="Screenshot 2024-12-10 at 17 27 13" src="https://github.com/user-attachments/assets/4e4bcc9b-b95b-446b-ace7-7a8d84a17e3b">

- 각각 명령어 실행해주고, 느긋하게 기다리면 드디어 길고 길었던 순간인 **방금 전**을 볼 수 있게 된다.
