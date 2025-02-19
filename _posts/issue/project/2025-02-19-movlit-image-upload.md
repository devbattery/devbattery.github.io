---
title: "[Project] Spring Boot로 S3 이미지 업로드 구현"
excerpt: "movlit, image"

categories:
  - Project
tags:
  - [movlit, image]

toc: true
toc_sticky: true

sidebar:
  nav: "categories"

date: 2025-02-19
last_modified_at: 2025-02-19
---

> [Movlit 프로젝트](https://github.com/venus-lion/movlit-plus)에 대한 설명입니다.

아래는 AWS S3와 연동하여 사용자 프로필 이미지를 관리하는 시스템의 기술적 구현을 분석한 블로그 포스트 예시입니다.

---

# Spring Boot와 AWS S3를 활용한 이미지 업로드

Spring Boot 애플리케이션에서 사용자 프로필 이미지를 업로드하고 관리하는 전체 플로우를 말씀드리겠습니다.  
특히, 이미지 업로드 및 삭제, S3 연동, 도메인 변환, 이벤트 발행과 JPA Repository를 활용한 데이터 저장 과정을 중심으로 살펴보겠습니다.

---

## 1. REST API 계층 – ImageController

### 역할 및 구현

컨트롤러는 클라이언트의 요청을 받아 서비스 계층으로 전달하는 역할을 수행합니다.  
`ImageController`에서는 두 가지 주요 엔드포인트를 제공합니다.

- **POST /api/images/profile**  
  - 클라이언트가 전송한 `MultipartFile`을 받아 S3 업로드 및 프로필 이미지 갱신 작업을 수행합니다.
  - 현재 인증된 사용자의 `MemberId`를 통해 업로드 대상과 관련 회원 정보를 식별합니다.

- **GET /api/images/profile**  
  - 현재 인증된 사용자의 프로필 이미지를 조회합니다.

```java
@RestController
@RequiredArgsConstructor
public class ImageController {

    private final ImageService imageService;

    @PostMapping("/api/images/profile")
    public ResponseEntity<ImageResponse> uploadProfileImage(@AuthenticationPrincipal MyMemberDetails details,
                                                            @RequestPart(value = "file", required = false) MultipartFile file) {
        MemberId memberId = details.getMemberId();
        var response = imageService.uploadProfileImage(memberId, file);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/api/images/profile")
    public ResponseEntity<ImageResponse> fetchProfileImage(@AuthenticationPrincipal MyMemberDetails details) {
        var response = imageService.fetchProfileImage(details.getMemberId());
        return ResponseEntity.ok(response);
    }

}
```

> **핵심 포인트:**  
> - **Security Integration:** `@AuthenticationPrincipal` 애노테이션을 사용해 현재 로그인한 사용자 정보를 손쉽게 가져옵니다.  
> - **RESTful 설계:** POST와 GET 방식의 명확한 엔드포인트 분리를 통해 클라이언트와의 인터페이스를 단순화했습니다.

---

## 2. 비즈니스 로직 – ImageService

### 주요 작업 흐름

`ImageService`는 프로필 이미지 업로드 및 조회에 관한 전체 비즈니스 로직을 처리합니다.

1. **기존 이미지 삭제**  
   - `deleteExistingProfileImageIfPresent` 메서드를 호출하여, 동일 회원의 기존 프로필 이미지가 있다면 먼저 삭제합니다.

2. **S3 업로드 및 엔티티 생성**  
   - `S3Service`를 통해 파일을 AWS S3 버킷에 업로드하고, 반환받은 이미지 URL을 바탕으로 도메인 엔티티(`ImageEntity`)를 생성합니다.
   - 엔티티는 `ImageConverter`를 통해 생성되며, 이후 Repository를 이용해 데이터베이스에 저장됩니다.

3. **회원 정보 업데이트**  
   - 업로드 완료 후, 회원 엔티티의 프로필 이미지 URL을 업데이트하여 최신 상태를 유지합니다.

4. **프로필 업데이트 이벤트 발행**  
   - `ApplicationEventPublisher`를 통해 이미지 변경 이벤트(`ProfileImageUpdatedEvent`)를 발행하여, 다른 서비스(예: 채팅방 등)에서 이를 구독할 수 있도록 합니다.

```java
@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class ImageService {

    private final ImageRepository imageRepository;
    private final S3Service s3Service;
    private final MemberReadService memberReadService;
    private final MemberWriteService memberWriteService;
    private final ApplicationEventPublisher eventPublisher;

    @Value("${aws.s3.bucket.folderName}")
    private String folderName;

    public ImageResponse uploadProfileImage(MemberId memberId, MultipartFile file) {
        // 1. 기존 이미지가 있다면 삭제
        deleteExistingProfileImageIfPresent(memberId);

        // 2. S3에 업로드 후 엔티티 생성
        String imageUrl = s3Service.uploadImage(file, folderName);
        ImageEntity imageEntity = ImageConverter.toImageEntity(imageUrl, memberId);
        ImageEntity savedImageEntity = imageRepository.upload(imageEntity);

        // 3. 회원 프로필 이미지 URL 업데이트
        updateMemberProfileImageUrl(memberId, savedImageEntity.getUrl());

        // 4. 프로필 업데이트 이벤트 발행
        eventPublisher.publishEvent(new ProfileImageUpdatedEvent(memberId));

        return new ImageResponse(savedImageEntity.getImageId(), savedImageEntity.getUrl());
    }

    // 나머지 보조 메서드 생략...
}
```

> **핵심 포인트:**  
> - **트랜잭션 관리:** `@Transactional`을 활용하여 데이터 변경 작업을 원자적으로 처리합니다.  
> - **이벤트 기반 아키텍처:** 이미지 변경 후 이벤트 발행을 통해 시스템 간의 느슨한 결합(loose coupling)을 실현했습니다.

---

## 3. 도메인 변환 – ImageConverter

이미지 URL과 회원 식별자를 받아 `ImageEntity`를 생성하는 간단한 유틸리티 클래스입니다.  
ID 생성은 별도의 `IdFactory`를 사용하여 고유 식별자를 부여합니다.

```java
public class ImageConverter {

    public static ImageEntity toImageEntity(String url, MemberId memberId) {
        return new ImageEntity(IdFactory.createImageId(), url, memberId);
    }

}
```

> **핵심 포인트:**  
> - **단일 책임 원칙:** 도메인 엔티티 생성과 관련된 로직을 별도 클래스로 분리하여 재사용성을 높였습니다.

---

## 4. AWS S3 연동 – S3Service

### S3 업로드 구현

`S3Service`는 AWS S3 SDK의 `S3Client`를 활용하여 이미지 파일을 업로드하는 책임을 집니다.

- **파일명 생성 및 Sanitization**  
  - 업로드 시 파일명은 UUID와 함께 생성되며, `sanitizeFileName` 메서드를 통해 특수문자를 제거하여 안전한 파일명을 보장합니다.
  
- **파일 업로드**  
  - S3의 `putObject` 메서드를 통해 파일을 업로드하며, 업로드 실패 시 `ImageUploadException`을 발생시킵니다.

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class S3Service {

    private final S3Client s3Client;

    @Value("${aws.s3.bucket.name}")
    private String bucketName;

    public String uploadImage(MultipartFile file, String folderName) {
        String fileName = generateFileName(file.getOriginalFilename(), folderName);
        PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                .bucket(bucketName)
                .key(fileName)
                .contentType(file.getContentType())
                .build();

        try {
            log.info("Uploading file to S3 with key: {}", fileName);
            s3Client.putObject(putObjectRequest, RequestBody.fromInputStream(file.getInputStream(), file.getSize()));
        } catch (IOException e) {
            log.error("Error uploading file to S3", e);
            throw new ImageUploadException();
        }

        return s3Client.utilities().getUrl(builder -> builder.bucket(bucketName).key(fileName)).toExternalForm();
    }

    public String generateFileName(String originalFilename, String folderName) {
        String sanitizedFilename = sanitizeFileName(originalFilename);
        return folderName + "/" + UUID.randomUUID() + "-" + sanitizedFilename;
    }

    private String sanitizeFileName(String originalFilename) {
        if (originalFilename == null) {
            return "unknown";
        }
        // 알파벳, 숫자, 점(.), 대시(-), 언더스코어(_)만 허용
        return originalFilename.replaceAll("[^a-zA-Z0-9\\.\\-_]", "");
    }

}
```

> **핵심 포인트:**  
> - **안정성:** 파일명 sanitization으로 보안 취약점을 최소화합니다.  
> - **예외 처리:** 업로드 중 발생할 수 있는 예외를 명확하게 처리하여, 문제 발생 시 로깅과 사용자에게 알림을 보장합니다.

---

## 5. 도메인 모델 – ImageEntity

이미지 정보를 저장하는 JPA 엔티티로, `ImageId`를 복합키로 사용하며, 회원 식별자와 이미지 URL, 등록 일시를 관리합니다.

```java
@Getter
@Entity
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "image")
public class ImageEntity {

    @EmbeddedId
    private ImageId imageId;

    private String url;

    @AttributeOverride(name = "value", column = @Column(name = "member_id"))
    private MemberId memberId;

    private LocalDateTime regDt;

    public ImageEntity(ImageId imageId, String url, MemberId memberId) {
        this.imageId = imageId;
        this.url = url;
        this.memberId = memberId;
        this.regDt = LocalDateTime.now();
    }

}
```

> **핵심 포인트:**  
> - **JPA 매핑:** `@EmbeddedId`와 `@AttributeOverride`를 통해 복합키와 사용자 정의 식별자를 명확하게 매핑합니다.  
> - **불변성:** 생성 시점의 등록 일시를 자동으로 기록하여 데이터 무결성을 유지합니다.

---

## 6. 데이터 접근 계층 – Repository 구현

### ImageRepository 인터페이스와 구현체

데이터 접근 계층은 이미지 데이터를 저장, 조회, 삭제하는 기능을 제공합니다.

- **ImageRepository 인터페이스:**  
  - 업로드, 존재 여부 체크, 프로필 이미지 조회, 삭제 메서드를 정의합니다.

- **ImageJpaRepository:**  
  - Spring Data JPA를 사용하여 기본 CRUD 및 사용자 정의 쿼리를 구현합니다.

- **ImageRepositoryImpl:**  
  - 인터페이스를 구현하여, JPA Repository를 래핑하는 형태로 도메인 로직에 맞게 사용합니다.

```java
@Repository
@RequiredArgsConstructor
public class ImageRepositoryImpl implements ImageRepository {

    private final ImageJpaRepository imageJpaRepository;

    @Override
    public ImageEntity upload(ImageEntity imageEntity) {
        return imageJpaRepository.save(imageEntity);
    }

    @Override
    public boolean existsByMemberId(MemberId memberId) {
        return imageJpaRepository.existsByMemberId(memberId);
    }

    @Override
    public ImageResponse fetchProfileImageByMemberId(MemberId memberId) {
        return imageJpaRepository.findProfileImageByMemberId(memberId);
    }

    @Override
    public void deleteByMemberId(MemberId memberId) {
        imageJpaRepository.deleteByMemberId(memberId);
    }

}
```

> **핵심 포인트:**  
> - **레이어 분리:** 도메인 로직과 데이터 접근 로직을 명확히 분리하여 유지보수와 테스트가 용이합니다.  
> - **Spring Data 활용:** JPA Repository를 활용하여 반복되는 CRUD 로직을 줄이고, 커스텀 쿼리로 효율적인 조회를 구현합니다.

---

## 7. 데이터 전송 객체 (DTO)

### ImageResponse 및 MemberProfileUpdateDto

- **ImageResponse:**  
  - 클라이언트에 전달할 이미지 ID와 URL을 캡슐화하는 record 타입의 DTO입니다.
  
- **MemberProfileUpdateDto:**  
  - 회원 프로필 이미지 URL 업데이트에 사용되는 DTO로, 요청 및 응답 시 데이터 구조를 명확히 합니다.

```java
public record ImageResponse(ImageId imageId, String url) {
}
```

> **핵심 포인트:**  
> - **불변성 & 간결성:** Java record를 사용해 DTO를 간결하게 표현함으로써, 불필요한 코드 작성을 줄였습니다.

---

## 결론

- **Controller 계층**에서는 클라이언트 요청을 받고,  
- **Service 계층**에서는 기존 이미지 삭제, S3 업로드, 도메인 엔티티 생성, 회원 정보 업데이트 및 이벤트 발행 등의 비즈니스 로직을 수행합니다.  
- **S3Service**를 통해 AWS S3와 안전하게 연동하며,  
- **JPA Repository**를 활용하여 데이터 저장 및 조회를 효과적으로 처리합니다.

이와 같은 설계는 관심사의 분리, 확장성, 유지보수성을 고려한 접근 방식으로, 향후 다른 파일 업로드 기능이나 이미지 관련 추가 기능 개발 시에도 유용하게 활용될 수 있습니다.
