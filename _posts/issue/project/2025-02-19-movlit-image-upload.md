---
title: "[Project] Spring Boot와 S3를 이용한 이미지 업로드"
excerpt: "movlit, image, s3, spring boot, aws"

categories:
  - Project
tags:
  - [movlit, image, s3, spring boot, aws]

toc: true
toc_sticky: true

sidebar:
  nav: "categories"

date: 2025-02-19
last_modified_at: 2025-04-19
---

> [Movlit 프로젝트](https://github.com/venus-lion/movlit-plus)에 대한 설명입니다.

## 요청부터 S3 저장까지 핵심 흐름

1.  **클라이언트 요청**: 사용자가 프로필 이미지를 선택하고 업로드 (HTTP POST `/api/images/profile`, `multipart/form-data`).
2.  **Controller 수신**: Spring MVC가 요청을 받아 `@RequestPart`로 파일 데이터를, `@AuthenticationPrincipal`로 사용자 정보를 추출합니다.
3.  **Service 처리**:
    - 기존 프로필 이미지가 있다면 S3 및 DB에서 **삭제**합니다.
    - 새 이미지를 S3에 **업로드**하고 URL을 얻습니다.
    - 이미지 메타데이터(URL, 사용자 ID 등)를 DB에 **저장**합니다.
    - 사용자(Member) 정보의 프로필 이미지 URL을 **업데이트**합니다.
4.  **S3 연동**: `S3Service`가 AWS SDK를 이용해 실제 파일 업로드/삭제를 수행합니다.
5.  **DB 연동**: `ImageRepository`(JPA)가 이미지 메타데이터를 영속화합니다.

## AWS S3 연동

애플리케이션에서 S3와 통신하려면 AWS SDK의 `S3Client`가 필요합니다. `@Configuration`을 통해 이 클라이언트를 스프링 빈으로 등록하여 애플리케이션 전역에서 주입받아 사용할 수 있도록 합니다.

```java
package movlit.be.config;

@Configuration
public class AwsS3Config {

    @Value("${aws.region}")
    private String awsRegion;

    @Bean
    public S3Client s3Client() {
        return S3Client.builder()
                .region(Region.of(awsRegion))
                .credentialsProvider(DefaultCredentialsProvider.create())
                .build();
    }
}
```

- **`DefaultCredentialsProvider`**: 다양한 환경(로컬, EC2, ECS 등)에서 별도 설정 없이 AWS 자격 증명을 안전하게 로드하는 표준 방식입니다. 코드에 Access Key를 하드코딩하는 것을 방지합니다.

## 파일 수신 및 사용자 인증

API 엔드포인트에서는 파일(`MultipartFile`)과 인증된 사용자 정보를 받아 서비스층으로 전달합니다.

```java
package movlit.be.image.presentation;

@RestController
@RequestMapping("/api/images")
@RequiredArgsConstructor
public class ImageController {

    private final ImageService imageService;

    @PostMapping("/profile")
    public ResponseEntity<ImageResponse> uploadProfileImage(
            // Spring Security의 인증된 사용자 정보를 주입받습니다.
            // MyMemberDetails는 UserDetails 인터페이스 구현체로, 사용자 ID 등을 포함합니다.
            @AuthenticationPrincipal MyMemberDetails details,
            // multipart/form-data 요청에서 'file' 파트의 데이터를 MultipartFile 객체로 받습니다.
            @RequestPart(value = "file") MultipartFile file
    ) {
        // 기본적인 파일 null/empty 체크 (Service 레이어에서 더 상세한 검증 가능)
        if (file == null || file.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        MemberId memberId = details.getMemberId(); // 사용자 ID 추출
        // 핵심 로직은 Service 레이어에 위임
        ImageResponse response = imageService.uploadProfileImage(memberId, file);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // ... fetchProfileImage 생략 ...
}
```

- **`@AuthenticationPrincipal`**: 현재 요청을 보낸 사용자의 Principal 객체를 파라미터로 주입받습니다. Spring Security 설정에 따라 `UserDetails` 구현체를 가져옵니다.
- **`@RequestPart("file")`**: `multipart/form-data` 요청의 특정 파트(`file`이라는 이름의 파트)를 `MultipartFile` 타입으로 바인딩합니다. 파일 업로드 처리에 필수적입니다.

## 핵심 비즈니스 로직

`ImageService`는 이미지 업로드의 주요 로직을 담당합니다.

```java
package movlit.be.image.application.service;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class ImageService {

    private final ImageRepository imageRepository;
    private final S3Service s3Service;
    // ... Member 서비스, EventPublisher 주입 생략 ...

    public ImageResponse uploadProfileImage(MemberId memberId, MultipartFile file) {
        // 0. 파일 유효성 검증 (Service 레벨에서도 필요)
        validateFile(file);

        // 1. 핵심: 기존 프로필 이미지 처리 (존재 시 S3 객체 삭제 + DB 레코드 삭제)
        deleteExistingProfileImageIfPresent(memberId);

        // 2. S3에 새 이미지 업로드
        String imageUrl = s3Service.uploadImage(file, folderName); // S3 실제 업로드 호출
        // DB 저장을 위한 Entity 생성
        ImageEntity imageEntity = ImageConverter.toImageEntity(imageUrl, memberId);
        // Image 정보 DB 저장
        ImageEntity savedImageEntity = imageRepository.save(imageEntity);

        // 3. Member 엔티티의 프로필 URL 업데이트
        updateMemberProfileImageUrl(memberId, savedImageEntity.getUrl());

        log.info("Profile image uploaded for member: {}, URL: {}", memberId.getValue(), savedImageEntity.getUrl());
        return new ImageResponse(savedImageEntity.getImageId(), savedImageEntity.getUrl());
    }

    /**
     * 멤버 ID로 기존 프로필 이미지를 찾아 S3와 DB에서 삭제합니다.
     */
    private void deleteExistingProfileImageIfPresent(MemberId memberId) {
        imageRepository.findByMemberId(memberId).ifPresent(existingImage -> {
            log.info("Deleting existing profile image: {}", existingImage.getUrl());
            try {
                // 중요: S3에서 실제 파일 삭제 호출
                s3Service.deleteImageFromS3(existingImage.getUrl());
            } catch (Exception e) {
                // S3 삭제 실패 시 로깅. 트랜잭션 롤백 여부 결정 필요.
                // 여기서는 DB 삭제는 계속 진행하도록 로깅만 하지만,
                // 요구사항에 따라 여기서 예외를 던져 전체 롤백을 유도할 수도 있습니다.
                log.error("Failed to delete image from S3: {}. Proceeding with DB deletion.", existingImage.getUrl(), e);
            }
            // DB에서 이미지 메타데이터 삭제
            imageRepository.delete(existingImage); // 또는 deleteByMemberId 사용
        });
    }

    /**
     * Member 테이블의 profileImgUrl 필드를 업데이트합니다.
     */
    private void updateMemberProfileImageUrl(MemberId memberId, String imageUrl) {
        MemberEntity member = memberReadService.fetchEntityByMemberId(memberId); // Member 조회
        member.updateProfileImgUrl(imageUrl); // Member 엔티티 상태 변경
        // @Transactional 환경에서는 영속성 컨텍스트의 변경 감지(dirty checking)에 의해
        // 트랜잭션 커밋 시점에 UPDATE 쿼리가 자동으로 실행될 수 있습니다.
        // 명시적 save 호출이 필요 없을 수 있지만, MemberWriteService 구현에 따라 다릅니다.
        // memberWriteService.save(member); // 필요 시 호출
        log.info("Updated member profile URL for member: {}", memberId.getValue());
    }

    // ... fetchProfileImage, validateFile 생략 ...
}
```

- **`deleteExistingProfileImageIfPresent`**: 이 부분이 핵심입니다. 새 이미지를 올리기 전에 반드시 이전 이미지를 정리(S3 객체 삭제 + DB 레코드 삭제)해야 스토리지가 불필요하게 낭비되는 것을 막을 수 있습니다.

## S3 통신 (업로드, 삭제)

`S3Service`는 AWS SDK를 사용하여 S3 버킷과 직접 통신하는 로직을 캡슐화합니다.

```java
package movlit.be.image.application.service;

// ... imports ...

@Service
@RequiredArgsConstructor
@Slf4j
public class S3Service {

    private final S3Client s3Client; // Config에서 주입받은 S3Client

    @Value("${aws.s3.bucket.name}")
    private String bucketName;

    /**
     * S3에 파일을 업로드합니다.
     */
    public String uploadImage(MultipartFile file, String folderName) {
        // ... 파라미터 검증 생략 ...

        // ★ 핵심: 고유 파일명 생성 (충돌 방지 및 추적 용이성)
        String fileName = generateFileName(file.getOriginalFilename(), folderName);

        // S3 업로드 요청 객체 생성
        PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                .bucket(bucketName)
                .key(fileName) // S3 내 객체 키 (경로 포함 파일명)
                .contentType(file.getContentType()) // 브라우저가 파일을 올바르게 해석하도록 Content-Type 설정
                .build();

        try {
            // 핵심: S3 Client를 사용하여 파일 업로드 실행
            // RequestBody.fromInputStream: 파일 데이터를 스트림으로 S3에 전송
            s3Client.putObject(putObjectRequest,
                RequestBody.fromInputStream(file.getInputStream(), file.getSize()));

            // 업로드된 객체의 URL 생성 (버킷 정책에 따라 접근 가능해야 함)
            URL url = s3Client.utilities().getUrl(builder -> builder.bucket(bucketName).key(fileName));
            return url.toExternalForm();

        } catch (IOException | S3Exception | SdkException e) {
            log.error("Error during S3 upload", e);
            // 구체적인 커스텀 예외로 변환하여 던지는 것이 좋음
            throw new ImageUploadException("S3 upload failed.", e);
        }
    }

    /**
     * S3에서 이미지 객체를 삭제합니다.
     */
    public void deleteImageFromS3(String imageUrl) {
        // ... 파라미터 검증 생략 ...

        try {
            // 핵심: S3 URL로부터 객체 키(Key) 추출
            // 예: "https://<bucket>.s3.<region>.amazonaws.com/profile-images/uuid-image.jpg" -> "profile-images/uuid-image.jpg"
            String key = extractKeyFromUrl(imageUrl);
            if (key == null) throw new ImageDeleteException("Invalid S3 URL format.");

            // S3 삭제 요청 객체 생성
            DeleteObjectRequest deleteObjectRequest = DeleteObjectRequest.builder()
                    .bucket(bucketName)
                    .key(key) // 삭제할 객체의 키 지정
                    .build();

            // 핵심: S3 Client를 사용하여 객체 삭제 실행
            s3Client.deleteObject(deleteObjectRequest);
            log.info("Successfully deleted object from S3. Key: {}", key);

        } catch (S3Exception | SdkException e) {
            log.error("Error deleting object from S3. URL: {}", imageUrl, e);
            throw new ImageDeleteException("S3 deletion failed for URL: " + imageUrl, e);
        } catch (Exception e) { // URL 파싱 예외 등
            log.error("Unexpected error during S3 deletion process. URL: {}", imageUrl, e);
            throw new ImageDeleteException("Unexpected error deleting image from S3.", e);
        }
    }

    /**
     * 고유 파일명 생성 (폴더명/UUID-원본파일명.확장자)
     * UUID를 사용하여 파일명 중복을 방지합니다.
     */
    private String generateFileName(String originalFilename, String folderName) {
        String extension = StringUtils.getFilenameExtension(originalFilename);
        String uniqueName = UUID.randomUUID().toString() + "-" + originalFilename;
        // 실제로는 파일명 길이 제한, 특수문자 처리(sanitizeFileName) 등이 더 필요합니다.
        return (StringUtils.hasText(folderName) ? folderName + "/" : "") + uniqueName;
    }

    /**
     * S3 객체 URL에서 Key(파일 경로)를 추출합니다.
     * URL 형식에 따라 구현이 달라질 수 있습니다 (예: CloudFront URL).
     */
    private String extractKeyFromUrl(String imageUrl) {
        try {
            URL url = new URL(imageUrl);
            String path = url.getPath(); // 예: "/profile-images/uuid-image.jpg"
            // 맨 앞의 '/' 제거 및 URL 디코딩
            return URLDecoder.decode(path.substring(1), StandardCharsets.UTF_8);
        } catch (Exception e) {
            log.error("Failed to parse S3 URL to extract key: {}", imageUrl, e);
            return null;
        }
    }
}
```

- **`generateFileName`**: UUID 등을 이용해 고유한 파일명을 생성하는 것은 매우 중요합니다. 동일한 이름의 파일이 업로드될 경우 덮어쓰는 문제를 방지하고, 파일 관리를 용이하게 합니다.
- **`putObject`**: S3에 객체를 생성(업로드)하는 핵심 메소드입니다. `RequestBody`를 통해 파일 데이터를 전달합니다.
- **`deleteObject`**: S3에서 객체를 삭제하는 메소드입니다. 삭제할 객체의 `bucket`과 `key`를 정확히 지정해야 합니다.
- **`extractKeyFromUrl`**: S3 객체를 삭제하려면 버킷 이름과 함께 객체의 **키(Key)**가 필요합니다. DB에는 보통 전체 URL을 저장하므로, 삭제 시 URL에서 이 키 값을 추출하는 로직이 필요합니다. URL 형식(표준 S3 URL인지, CloudFront 등 CDN URL인지)에 따라 구현이 달라질 수 있습니다.

## 5. JPA Entity 및 Repository

이미지 메타데이터를 저장하는 `ImageEntity`와 데이터 접근을 담당하는 `ImageRepository`입니다.

```java
package movlit.be.image.domain.entity;

@Getter
@Entity
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "image")
public class ImageEntity {

    @EmbeddedId
    private ImageId imageId;

    @Column(nullable = false, length = 2048)
    private String url; // S3에 업로드된 이미지의 URL

    @AttributeOverride(name = "value", column = @Column(name = "member_id", nullable = false, updatable = false))
    @Embedded
    private MemberId memberId; // 이미지 소유자

    @Column(nullable = false, updatable = false)
    private LocalDateTime regDt; // 등록 시각

    // ... 생성자 ...
}
```

```java
package movlit.be.image.infra.persistence.jpa;

// Spring Data JPA Repository 인터페이스

public interface ImageJpaRepository extends JpaRepository<ImageEntity, ImageId> {

    // 메소드 이름 기반 쿼리 생성: memberId 필드로 ImageEntity 조회
    Optional<ImageEntity> findByMemberId(MemberId memberId);

    // JPQL을 이용한 벌크 삭제 쿼리 (기존 이미지 삭제 시 사용 가능)
    @Modifying
    @Query("DELETE FROM ImageEntity i WHERE i.memberId = :memberId")
    void deleteByMemberId(@Param("memberId") MemberId memberId);

    // existsBy... 등 다양한 쿼리 메소드 활용 가능
}
```

- **`@AttributeOverride`**: `@Embedded`된 타입(`MemberId`) 내부의 필드(`value`)가 매핑될 컬럼 정보를 재정의합니다. 여기서는 `MemberId`의 `value` 필드를 `member_id` 컬럼에 매핑합니다.
- **`JpaRepository`**: Spring Data JPA는 인터페이스 정의만으로 기본적인 CRUD 및 다양한 쿼리 메소드를 자동으로 구현해 줍니다. `findByMemberId`처럼 규칙에 맞는 메소드 이름을 사용하면 JPQL 없이도 쿼리를 실행할 수 있습니다.
