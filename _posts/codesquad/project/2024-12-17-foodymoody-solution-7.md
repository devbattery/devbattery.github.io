---
title: "[Project] OAuth 회원가입 시 닉네임 중복 문제 해결 과정"
excerpt: "foodymoody, solution"

categories:
  - Project
tags:
  - [foodymoody, solution]

toc: true
toc_sticky: true

sidebar:
  nav: "categories"

date: 2024-12-13
last_modified_at: 2024-12-13
---

> [FoodyMoody 프로젝트](https://github.com/foody-moody/foodymoody)에 대한 설명입니다.

## 문제 발생 (1)

[이전 게시물](https://devbattery.com/project/foodymoody-solution-5/)에서 mismatch redirect url 문제는 해결했지만, 또 하나의 문제를 발견했다.

그것은 바로, 일반 회원과 OAuth 회원의 닉네임이 겹치는 문제다.

현재의 로직은 OAuth로 회원가입을 할 때 Google 닉네임으로 가입되게끔 했지만, 이는 겹칠 수 있는 요인이 너무 많다. 실제로 이 문제를 발견하게 된 것도 우연히 OAuth 닉네임과 일반 회원 닉네임을 내가 같게 만들었기 때문이다. 이렇게 우연히 발견할 수 있음에 너무 감사하다.

## 문제 해결 (1)

사실, 이 문제는 크게 고민할 건 없었다.

왜냐하면 수많은 앱을 사용하면서 자동 닉네임 생성을 이미 경험했기 때문이다. 그 경험을 바탕으로 아래와 같이 UniqueNicknameGenerator를 구현하였다.

```java
import java.util.Random;

public class UniqueNicknameGenerator {

    private static final String[] ADJECTIVES = {"기운찬", "씩씩한", "멋진", "예쁜", "빛나는", "귀여운", "대담한", "신비한", "상쾌한", "행복한"};
    private static final String[] NOUNS = {"호랑이", "독수리", "고양이", "강아지", "코끼리", "돌고래", "해바라기", "별", "우주", "바다"};

    public static String generate() {
        Random random = new Random();
        String adjective = ADJECTIVES[random.nextInt(ADJECTIVES.length)];
        String noun = NOUNS[random.nextInt(NOUNS.length)];
        int number = random.nextInt(1000);
        return adjective + noun + number;
    }

}
```

- 사실, 위 단어들을 조합하는 것만으로는 당연히 중복될 가능성이 엄청 높겠지만 마지막에 **0부터 999까지의 숫자**를 붙여주기만 하면 그 확률은 0에 수렴하게 된다.
  - 사용자가 10000명에 가까워졌을 때는 겹칠 확률이 올라가기 때문에, 1000명씩 돌파할 때마다 형용사, 명사, 랜덤 숫자 범위를 늘려주기만 하면 된다.
- 실제 구현 코드는 이렇게 엉성하지는 않겠지만, 큰 틀의 로직은 비슷하다고 생각한다.

## 문제 발생 (2)

위와 같은 방식으로 해결이 된 줄 알았으나, 막상 서버에 띄워보니 null이 들어오는 문제가 발생했다.

<img width="567" alt="Screenshot 2024-12-16 at 14 54 24" src="https://github.com/user-attachments/assets/d3b05c38-b890-426c-b7e0-c9632613991d" />

- 이는 정말 어이가 없는 방식으로 해결했다.

```java
    @Override
    public OAuthMemberDetails getOAuthMemberDetails(String accessToken) {
        Map<String, Object> userInfo = WebClient.create()
                .get()
                .uri(userInfoUri)
                .headers(header -> header.setBearerAuth(accessToken))
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {
                })
                .block();

        String nickname = makeUniqueNicknameFieldName();
        return OAuthMemberDetails.of(
                String.valueOf(userInfo.get(emailFieldName)),
                String.valueOf(userInfo.get(nickname)),
                String.valueOf(userInfo.get(profileImageFieldName)
                ));
    }

    private String makeUniqueNicknameFieldName() {
        return UniqueNicknameGenerator.generate();
    }
```

- `String.valueOf(userInfo.get(nickname))` 이 부분을 보면 뭔가 이상하지 않는가?
  - 사실 가볍게 본다면 전혀 문제가 없는 코드라고 생각할 것이다.
- 하지만 이 로직에서는 `userInfo`에 nickname이 없기 때문에 완전히 틀린 로직이라고 할 수 있다.
  - 원래는 Google 정보에서 nickname을 가져왔었기 때문에 이 로직이 맞지만, 현재는 내가 직접 만들어주기 때문에 이렇게 만들면 큰일 날 수 있다.

## 문제 해결 (2)

```java
    @Override
    public OAuthMemberDetails getOAuthMemberDetails(String accessToken) {
        Map<String, Object> userInfo = WebClient.create()
                .get()
                .uri(userInfoUri)
                .headers(header -> header.setBearerAuth(accessToken))
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {
                })
                .block();

        String nickname = makeUniqueNicknameFieldName();
        return OAuthMemberDetails.of(
                String.valueOf(userInfo.get(emailFieldName)),
                nickname,
                String.valueOf(userInfo.get(profileImageFieldName)
                ));
    }

    private String makeUniqueNicknameFieldName() {
        return UniqueNicknameGenerator.generate();
    }
```

- 이렇게 nickname으로만 넣어준다면 문제가 깔끔하게 해결된다.

<img width="565" alt="Screenshot 2024-12-16 at 15 36 50" src="https://github.com/user-attachments/assets/48966b95-4e67-450a-a792-810cff6f2a86" />

- 이제 원하던 닉네임이 만들어진다! 이런 어이 없는 실수 좀 줄이자..

## 결론

혼자 유지 보수과 기능 추가를 하면서 느끼고 있는 점은, 역시 혼자 하는 것보다 팀원들과 같이 하는 게 장점이 훨씬 많다는 생각이 들었다. 솔직히 삽질을 계속 한 것들의 대부분이 제 3자의 눈으로 본다면 금방 찾을 수 있는 것들이라고 생각한다. 실력이 비슷한 개발자들이 서로 코드를 봐주는 것과 혼자만 개발하는 것의 차이는 극심할 것이다 분명.

> [해당 이슈 링크](https://github.com/foody-moody/foodymoody/issues/639)
