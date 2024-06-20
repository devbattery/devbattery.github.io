---
title: "[Database] M1 docker, MySQL 설치, 인텔리제이 연동"
excerpt: "applie silicon, docker, mysql, vim, locale, connector, "

categories:
  - Database
tags:
  - [codesquad]

toc: true
toc_sticky: true

sidebar:
  nav: "categories"

date: 2023-02-21
last_modified_at: 2023-02-21
---

> 코드 삽입 부분은 과감하게 삭제했다.

# docker 설치

- `homebrew` 명령어 사용으로 설치
  - `docker-compose`, `docker-machine`을 같이 설치해줌

```
$ brew install --cask docker
```

# Docker MySQL 설치

- 나는 M1 Pro 맥북을 사용하고 있으므로 `--platform linux/amd64`를 지정 후 설치
- mysql 8 버전 설치
- 비밀번호: 1234

```dockerfile
docker run --platform linux/amd64 --name mysql -d -p 3306:3306 -e MYSQL_ROOT_PASSWORD=1234 mysql:8.0.28
```

- `docker run` 명령어는 컨테이너를 create 후, start 역할
- `--name` 옵션: 컨테이너 이름 지정
  - 이름이 중복되면 conflict
  - 실행중인 컨테이너의 정보를 보려면 `docker ps -a` 커맨드로 확인 가능
- `-d` 옵션: background에서 동작
- `-p` 옵션: port 매핑
- `-e` 옵션: environment 환경 설정 key, value 형태로 보냄

## Docker MySQL 실행

- 요구사항에 따라 `bash`로 실행

```dockerfile
docker exec -it mysql bash
```

- `docker exec` 명령어는 실행중인 컨테이너에, 그 뒤에 오는 명령어를 실행
- `-i` 옵션: STDIN 표준 입출력 오픈
- `-t` 옵션: 가상 tty(pseudo-TTY)를 통해서 접속

## vim 설치

- docker container에서 vim 설치가 되어있찌 않으므로 아래의 명령어를 통해 설치

```
$ apt-get update
$ apt-get install vim
```

## utf8 설정

- 컨테이너 접속
- vim 사용해서 /etc/mysql/my.cnf 파일 수정

```dockerfile
root@32f08c0def9e:/# vim /etc/mysql/my.cnf
```

- 아래와 같은 내용 추가

```
[client]
default-character-set = utf8

[mysqld]
init_connect = "SET collation_connection = utf8_general_ci"
init_connect = "SET NAMES utf8"
character-set-server = utf8
collation-server = utf8_general_ci

[mysql]
default-character-set = utf8
```

<img width="884" alt="스크린샷 2023-02-20 오후 2 05 45" src="https://user-images.githubusercontent.com/62871026/220014034-00c0c148-0b7a-4c29-b050-13269a53a7d5.png">

- 위처럼 설정하면 아래와 같이 성공적으로 `latin1`에서 `utf8`로 변경된 것을 확인할 수 있다.

## MySQL 접속 확인

<img width="1382" alt="스크린샷 2023-02-20 오전 11 31 42" src="https://user-images.githubusercontent.com/62871026/220013988-c4a4ca53-3a44-4f82-ac69-8a469e8f9f9b.png">
<img width="1422" alt="스크린샷 2023-02-20 오후 2 26 38" src="https://user-images.githubusercontent.com/62871026/220016440-5721012d-c49f-435d-9c0e-cd3ae9b8cfd4.png">

# locale

- 사용 가능한 locale 확인 후
- MySQL 시간 설정

<img width="679" alt="스크린샷 2023-02-20 오후 2 33 43" src="https://user-images.githubusercontent.com/62871026/220017672-051ba37f-d467-4aac-86b5-73644d0aeb3c.png">

# 대용량 데이터 생성

- `USE mysql` 명령어로 `mysql` DB를 사용한다.

```
nickname varchar(64),
money dec(10, 2),
last_visit datetime
```

- 위의 정보를 포함하는 user_log 테이블을 생성하는 명령어는 아래와 같다.

```sql
CREATE TABLE user_log
(
    nickname   varchar(64),
    money      dec(10, 2),
    last_visit datetime
);
```

<br>

- TABLES 조회 결과 마지막 테이블에 `user_log`가 있는 것을 확인할 수 있다.

<img width="696" alt="스크린샷 2023-02-20 오후 3 39 04" src="https://user-images.githubusercontent.com/62871026/220031660-42528457-6198-4c4f-9a79-d0337c19abf0.png">

# MySQL Workbench

- docker VM IP 알아내는 명령어 사용

<img width="1481" alt="스크린샷 2023-02-20 오후 3 51 36" src="https://user-images.githubusercontent.com/62871026/220033973-8a181543-6c80-437e-a9f2-dfdf3a12bbcd.png">

<br>

- `cs14`라는 스키마 생성

<br>

- 아래의 명령어로 test 입력

```sql
INSERT INTO user_log
values ('test', 10000.00, '2023-02-20');
```

<br>

- 오류 없이 조회 성공

<img width="1292" alt="스크린샷 2023-02-20 오후 4 31 14" src="https://user-images.githubusercontent.com/62871026/220040727-778e553d-e4c9-4cf3-aae2-2b435dfe7a81.png">

# MySQL Connector

- 내가 설치한 MySQL 버전은 8.0.28이므로 이 버전에 맞게 설치 후 라이브러리 경로를 설정해준다.

<img width="1429" alt="스크린샷 2023-02-20 오후 3 07 28" src="https://user-images.githubusercontent.com/62871026/220023902-b7c4a634-2e23-46ea-b6b2-3d2f7646efcf.png">

- import 성공

<img width="368" alt="스크린샷 2023-02-20 오후 3 09 27" src="https://user-images.githubusercontent.com/62871026/220024225-724f744c-1155-4068-a61f-3c44d7b7335b.png">

# 완전 갈아엎음

- 지금 몇시간을 날린지 난 모르겠다.. 5시간째 진척은 없고, 삽질만 엄청 하다가 겨우 해결

## 인텔리제이 DB 연동

- [구세주](https://medium.com/tech-learn-share/docker-mysql-access-denied-for-user-172-17-0-1-using-password-yes-c5eadad582d3)
  일단 제일 먼저 인텔리제이 연동에 계속 실패를 하다가 겨우 이 사이트 명령어로 성공적으로 연동에 성공했다.

<img width="382" alt="스크린샷 2023-02-21 오전 12 02 57" src="https://user-images.githubusercontent.com/62871026/220141259-205ee105-357b-4396-9d1c-5985dd33fd8d.png">

# MySQL Enable LOAD DATA LOCAL INFILE

<img width="678" alt="스크린샷 2023-02-21 오후 2 26 19" src="https://user-images.githubusercontent.com/62871026/220255354-a21f3a38-e6a3-4af3-ae99-4590ad7268bd.png">

# Reference

- [docker docs](https://docs.docker.com/reference/)
- [Digital Ocean](https://www.digitalocean.com/community/tutorials/how-to-install-and-use-docker-on-ubuntu-22-04)
- [Udemy Docker](https://www.udemy.com/course/docker-kubernetes-2022/#instructor-1)
- [가장 쉽게 배우는 도커](https://www.yalco.kr/36_docker/)
- [M1 MySQL](https://umanking.github.io/2022/08/06/docker-mysql-m1/)
- [locale < 어?](https://velog.io/@kyukim/docker-mysql)
- [Docker DB](https://woonizzooni.tistory.com/entry/Docker-mysql-%EC%84%A4%EC%B9%98-DB%EC%83%9D%EC%84%B1-%ED%85%8C%EC%9D%B4%EB%B8%94%EC%83%9D%EC%84%B1-%EC%98%88%EC%8B%9C)
- [MySQL TABLES](https://dasima.xyz/mysql-show-tables/)
  - [Example](https://jhnyang.tistory.com/307)
- [Public Key Retrieval is not allowed](https://deeplify.dev/database/troubleshoot/public-key-retrieval-is-not-allowed)
- [구세주](https://medium.com/tech-learn-share/docker-mysql-access-denied-for-user-172-17-0-1-using-password-yes-c5eadad582d3)
- [DBConnection Connection 1](https://dlagusgh1.tistory.com/274)
- [DBConnection Connection 2](https://yoo11052.tistory.com/20)
- [신 Honux(bulk insert)](https://youtu.be/qYM6d-0gW4w)
- [LEFT(UUID(), 3)](https://www.delftstack.com/howto/mysql/mysql-generate-random-string/)
- [ORDER BY RAND() 튜닝](https://blog.naver.com/sinjoker/221524576602)
- [날짜 입력: from_unixtime / unix_timestamp](https://mizykk.tistory.com/86)
- [일 ~ 초 변환기](https://convertlive.com/ko/u/%EB%B3%80%ED%99%98/%EC%9D%BC/%EB%B0%9B%EB%8A%94-%EC%82%AC%EB%9E%8C/%EC%B4%88)
- [JDBC DB 연결](https://hsunnystory.tistory.com/160?category=791615)
- [PreparedStatement in JDBC](https://itjy2.tistory.com/222)
