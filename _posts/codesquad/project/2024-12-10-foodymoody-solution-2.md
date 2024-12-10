---
title: "[Project] 기본 프로필 관련 로직 변경 과정"
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

<img width="568" alt="Screenshot 2024-12-10 at 10 21 54" src="https://github.com/user-attachments/assets/952e2a86-6c30-4ab3-8aae-091754efa2ea">

- 분명 기본 이미지를 s3와 연동시켜 데이터베이스에 넣어놨는데도 불구하고, 프로필의 기본 이미지에만 이런 숫자 프로필이 생기는 트러블이 있었다. 기본 이미지를 단순하게 이걸로 설정한 것이 아니냐는 생각을 한 적도 있었지만

<img width="567" alt="Screenshot 2024-12-10 at 10 33 56" src="https://github.com/user-attachments/assets/b2576481-bca4-4e8a-abaa-2df589c71f73">

- 이와 같이 푸디무디 활동을 한다면, 프로필에는 정상적으로 데이터베이스에 저장되어 있는 기본 이미지 데이터를 불러오는 걸 볼 수 있다.

## 문제 원인

`MemberProfileImage` 도메인 클래스에 있는 아래의 필드가 원인이었다.

```java
public static final MemberProfileImage DEFAULT =
            MemberProfileImage.of(
                    IdFactory.createImageId("member-profile-default"),
                    "http://dummyimage.com/236x100.png/5fa2dd/ffffff");
```

내가 짰던 로직은 아니지만, 초반에는 기본 이미지니까 이런 api로 생성하고, 나중에 데이터베이스에 직접 프론트분들이 만들어준 사진을 넣었던 게 아닌가 싶다.

이 `DEFAULT`라는 필드가 public 필드다 보니, 역시 많은 곳에서 쓰고 있기 때문에 고민이 많았다. 사실 그냥 간단하게만 생각한다면, DEFAULT라는 필드에 기본 프로필 이미지를 가져와 저장해두고 사용하는 방법이 있을 거 같다.

하지만, 도메인에서 레포지토리 계층에 접근한다는 것은 나중에 아주 큰 문제를 불러 일으킬 수도 있다. 유지 보수를 죽을 때까지 해야 하는 개발자라면 이런 고민을 대충해서는 안 된다고 생각한다.

## 문제 해결 과정

### 1단계

```java
public static final ImageId defaultBasicProfileId = new ImageId("member-profile-default");
```

- `ImageDefaultProfileData` 클래스에서 기존에 있던 `DEFAULT` 필드를 Image의 Id 자체만을 저장하는 필드로 변경하였다.

### 2단계

```java
package com.foodymoody.be.image.application.dto;

import com.foodymoody.be.common.util.ids.ImageId;
import lombok.Getter;

@Getter
public class ImageDefaultProfileData {

    private ImageId id;
    private String profileImageUrl;

    public ImageDefaultProfileData() {
    }

    private ImageDefaultProfileData(ImageId id, String profileImageUrl) {
        this.id = id;
        this.profileImageUrl = profileImageUrl;
    }

    public static ImageDefaultProfileData of(ImageId id, String profileImageUrl) {
        return new ImageDefaultProfileData(id, profileImageUrl);
    }

}
```

- 새롭게 Image의 id와 그 url을 전달할 dto를 생성하였다.

### 3단계

```java
@Component
public interface ImageRepository {

    Optional<Image> fetchImageDefaultProfile(ImageId defaultId);

    // ...
}
```

```java
@Repository
@RequiredArgsConstructor
public class ImageRepositoryImpl implements ImageRepository {

    private final ImageJpaRepository jpaRepository;

    @Override
    public Optional<Image> fetchImageDefaultProfile(ImageId defaultId) {
        return jpaRepository.findById(defaultId);
    }
    
    // ...

}
```

- Service단에서 default ImageId를 가져오고 그걸 레포지토리쪽으로 요청하는 로직을 작성했다.

### 4단계

```java
@Service
@Transactional
@RequiredArgsConstructor
public class ImageService {

    private final ImageStorage imageStorage;
    private final ImageRepository imageRepository;

    public ImageDefaultProfileData fetchImageDefaultProfile() {
        Image image = imageRepository.fetchImageDefaultProfile(MemberProfileImage.defaultBasicProfileId)
                .orElseThrow(NotFoundDefaultProfileImageException::new);
        return ImageDefaultProfileData.of(image.getId(), image.getUrl());
    }

    // ...
}
```

- MemberProfileImage에 만들어둔 id 필드를 가져오고 그걸 Service단에 넘겨준다.
- 그럴 일은 없겠지만, 혹시나 데이터 변경이나 이상한 에러로 인해서 가져오지 못했을 경우에는 Custom Exception이 터지도록 구현했다.
- 위에서 생성했던 Data dto 타입으로 넘겨준다.

### 5단계

```java
@Entity
@NoArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class Member {

    // ...

    public Member(
            MemberId id,
            SupportedAuthProvider authProvider,
            String email,
            String nickname,
            String password,
            TasteMood tasteMood,
            MemberProfileImage profileImage,
            LocalDateTime createdAt) {
        this.id = id;
        this.authProvider = authProvider;
        this.email = email;
        this.nickname = nickname;
        this.password = password;
        this.tasteMood = tasteMood;
        this.profileImage = profileImage;
        this.myFollowings = new MyFollowings();
        this.myFollowers = new MyFollowers();
        this.createdAt = createdAt;
        EventManager.raise(toMemberCreatedEvent());
    }

    public static Member of(
            MemberId id,
            SupportedAuthProvider authProvider,
            String email,
            String nickname,
            String password,
            MemberProfileImage profileImage,
            TasteMood tasteMood,
            LocalDateTime now) {
        return new Member(id, authProvider, email, nickname, password, tasteMood, profileImage, now);
    }

    // ...

}
```

```java
@Service
@Transactional
@RequiredArgsConstructor
public class LocalSignUpUseCase {

    private final TasteMoodReadService tasteMoodReadService;
    private final MemberWriteService memberWriteService;
    private final ImageService imageService;

    public MemberSignupResponse signUp(SignupRequest request) {
        TasteMood tasteMood = tasteMoodReadService.findById(request.getTasteMoodId());
        MemberId memberId = IdFactory.createMemberId();
        Member member = memberWriteService.create(
                memberId,
                SupportedAuthProvider.LOCAL,
                request.getEmail(),
                request.getNickname(),
                request.getPassword(),
                tasteMood,
                imageService.fetchImageDefaultProfile().getId(),
                imageService.fetchImageDefaultProfile().getProfileImageUrl(),
                LocalDateTime.now()
        );
        return MemberMapper.toSignupResponse(member.getId());
    }

}
```

```java
@Service
@RequiredArgsConstructor
@Transactional
public class MemberWriteService {

    private final MemberRepository memberRepository;
    private final ImageService imageService;

    public Member create(MemberId id, SupportedAuthProvider authProvider, String email, String nickname,
                         String password, TasteMood tasteMood, ImageId profileImageId, String profileImageUrl,
                         LocalDateTime now) {
        validateNicknameDuplication(nickname);
        validateEmailDuplication(email);

        ImageDefaultProfileData imageDefaultProfileData = imageService.fetchImageDefaultProfile();
        MemberProfileImage profileImage = MemberProfileImage.of(profileImageId, profileImageUrl, imageDefaultProfileData);

        Member forSave = Member.of(id, authProvider, email, nickname, password, profileImage, tasteMood, now);

        return memberRepository.save(forSave);
    }

    // ***

```

- LocalSignUpUseCase의 `MemberProfileImage.DEFAULT.getId()`와 같은 형태에서 imageService를 참조하여 직접 가져오도록 구현했다.
  - 이렇게 구현하기 위해 Member 클래스도 손볼 수밖에 없었다.
- Member 생성자의 기존 코드는 `this.profileImage = Objects.isNull(profileImage) ? MemberProfileImage.DEFAULT : profileImage;`와 같은 형태였지만, MemberWriteService의 `create()`에서만 이 생성자를 사용하기도 하고, 로직 수정으로 이미 ImageDefaultProfileData 객체를 검증하고 넘겨주니 그냥 `profileImag`e를 넘겨주기만 하면 된다.

### 6단계

```java
package com.foodymoody.be.member.application.usecase;

import com.foodymoody.be.common.util.ids.ImageId;
import com.foodymoody.be.common.util.ids.MemberId;
import com.foodymoody.be.common.util.ids.TasteMoodId;
import com.foodymoody.be.image.application.dto.ImageDefaultProfileData;
import com.foodymoody.be.image.application.service.ImageService;
import com.foodymoody.be.image.domain.Image;
import com.foodymoody.be.member.application.dto.request.UpdateProfileRequest;
import com.foodymoody.be.member.application.service.MemberReadService;
import com.foodymoody.be.member.application.service.TasteMoodReadService;
import com.foodymoody.be.member.domain.Member;
import com.foodymoody.be.member.domain.MemberProfileImage;
import com.foodymoody.be.member.domain.TasteMood;
import java.util.Objects;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
@Transactional
public class UpdateMemberProfileUseCase {

    private final MemberReadService memberReadService;
    private final ImageService imageService;
    private final TasteMoodReadService tasteMoodReadService;

    // ...

    private void updateProfileImage(MemberId currentMemberId, Member member, Image image) {
        ImageId defaultImageId = MemberProfileImage.defaultBasicProfileId;
        ImageId currentImageId = member.getProfileImageId();
        if (!Objects.equals(currentImageId, defaultImageId)) {
            imageService.softDelete(currentMemberId, member.getProfileImageId());
        }
        member.updateProfileImage(MemberProfileImage.of(image.getId(), image.getUrl(), new ImageDefaultProfileData()));
    }

    // ...

}

```

- 사실상 `MemberProfileImage.defaultBasicProfileId` 이 부분은 현재 이미지와 같은지 아닌지를 확인하기 위해 필요할 뿐이다.
- 이 메서드에서의 `member.updateProfileImage()`에서는 기본 이미지가 필요 없기 떄문에 비어 있는 객체로 넘겼다.

## 해결 완료

<img width="565" alt="Screenshot 2024-12-10 at 15 52 10" src="https://github.com/user-attachments/assets/c14a5b26-4d99-4648-8cf5-fb4e6e94bf50">

> [해당 이슈 + 커밋](https://github.com/foody-moody/foodymoody/issues/635)
