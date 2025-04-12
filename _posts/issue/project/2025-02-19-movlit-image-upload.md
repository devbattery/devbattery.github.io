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
last_modified_at: 2025-04-12
---

> [Movlit 프로젝트](https://github.com/venus-lion/movlit-plus)에 대한 설명입니다.

안녕하세요! 오늘은 웹 서비스의 필수 기능 중 하나인 **프로필 이미지 업로드** 기능을 Spring Boot와 AWS S3를 사용해 구현하는 방법을 알아보겠습니다. 사용자가 이미지를 올리면, 안전하고 효율적인 클라우드 스토리지 S3에 저장하고, 그 정보(URL 등)는 우리 서버의 DB에 관리하는 방식이죠.

Spring Security를 통해 현재 로그인된 사용자를 식별하고, JPA를 이용해 데이터베이스 작업을 처리하는 전체 과정을 코드와 함께 자세히 살펴보겠습니다.

## 개요: 사용할 기술 스택

- **AWS S3 (Simple Storage Service)**: 뛰어난 확장성과 내구성, 가용성을 자랑하는 클라우드 기반 객체 스토리지 서비스입니다. 이미지, 동영상, 로그 파일 등 정적 파일을 저장하고 서빙하는 데 최적화되어 있습니다. 서버의 부담을 줄이고 파일을 안전하게 관리할 수 있죠.
- **Spring Boot**: Java 기반의 웹 프레임워크로, REST API 서버를 빠르고 쉽게 구축할 수 있게 도와줍니다. 여기서는 클라이언트의 파일 업로드 요청을 받아 처리하고, S3 연동 및 DB 작업을 수행합니다.
- **Spring Security & 인증**: 스프링 시큐리티 프레임워크를 사용하여 API 접근 제어 및 사용자 인증을 처리합니다. `@AuthenticationPrincipal` 어노테이션을 통해 현재 요청을 보낸 사용자의 정보를 쉽게 가져올 수 있습니다.

**핵심 기능**:

1.  **프로필 이미지 업로드**: 사용자가 선택한 이미지를 S3에 업로드합니다.
2.  **프로필 이미지 조회**: 사용자의 현재 프로필 이미지 URL을 반환합니다.
3.  **DB 저장**: 업로드된 이미지의 메타데이터(고유 ID, S3 URL, 등록 시각, 이미지 소유자 ID 등)를 데이터베이스에 기록합니다.
4.  **기존 이미지 교체**: 사용자가 새 프로필 이미지를 업로드하면, 기존에 등록된 프로필 이미지가 있다면 **S3에서 해당 객체를 삭제**하고 DB 정보도 업데이트합니다. (이전 파일 관리 로직 포함)

## S3 연동 설정

Spring Boot 애플리케이션에서 AWS S3를 사용하려면 몇 가지 설정이 필요합니다.

**1. 의존성 추가 (build.gradle)**

AWS SDK v2 for Java와 S3 관련 라이브러리를 추가해야 합니다.

```gradle
dependencies {
    // AWS SDK v2 for S3
    implementation platform('software.amazon.awssdk:bom:2.20.43') // BOM(Bill of Materials)으로 버전 관리 추천
    implementation 'software.amazon.awssdk:s3'
}
```

**2. AWS 자격 증명 설정**

애플리케이션이 AWS 리소스(S3 버킷)에 접근할 권한이 필요합니다. 보안을 위해 **IAM 역할(Role)**을 사용하는 것이 가장 좋습니다.

**3. S3Client 빈(Bean) 등록**

S3와 통신할 `S3Client` 객체를 스프링 빈으로 등록해야 합니다.

```java
package movlit.be.config; // 적절한 패키지 위치

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;

@Configuration
public class AwsS3Config {

    @Value("${aws.region}") // application.yml 등에서 AWS 리전 설정
    private String awsRegion;

    @Bean
    public S3Client s3Client() {
        return S3Client.builder()
                .region(Region.of(awsRegion))
                // 자격증명은 DefaultCredentialsProvider가 환경변수, 자격증명 파일 등을 자동으로 찾아줌
                .credentialsProvider(DefaultCredentialsProvider.create())
                .build();
    }
}
```

**4. `application.yml` 설정**

S3 버킷 이름, 폴더 경로, AWS 리전 등을 설정 파일에 정의합니다.

```yaml
aws:
  region: ap-northeast-2 # 예: 서울 리전
  s3:
    bucket:
      name: your-s3-bucket-name # 실제 버킷 이름으로 변경
      folderName: profile-images # S3 버킷 내 폴더 경로 (선택 사항)
```

---

## ImageController: API 엔드포인트 정의

클라이언트(웹/모바일)는 이미지 파일을 `MultipartFile` 형태로 `POST /api/images/profile` API로 전송합니다.

```java
package movlit.be.image.presentation;

@RestController
@RequestMapping("/api/images") // 공통 경로 설정
@RequiredArgsConstructor
public class ImageController {

    private final ImageService imageService;

    /**
     * 현재 로그인된 사용자의 프로필 이미지를 업로드 (기존 이미지 있으면 교체)
     * @param details 현재 인증된 사용자 정보 (Spring Security로부터 주입)
     * @param file 업로드할 이미지 파일 (Multipart)
     * @return 생성된 이미지 정보 (ID, URL)
     */
    @PostMapping("/profile")
    public ResponseEntity<ImageResponse> uploadProfileImage(
            @AuthenticationPrincipal MyMemberDetails details,
            @RequestPart(value = "file") MultipartFile file // 'required = true' 가 기본값이므로 파일 없으면 예외 발생
    ) {
        // 파일 유효성 검사 (null 체크, 비어있는지 체크) - Service 레이어에서도 추가 검증 가능
        if (file == null || file.isEmpty()) {
            // 적절한 예외 처리 또는 에러 응답
            return ResponseEntity.badRequest().build(); // 예시: 400 Bad Request
        }

        MemberId memberId = details.getMemberId(); // 인증 정보에서 사용자 ID 추출
        ImageResponse response = imageService.uploadProfileImage(memberId, file);
        // 성공 시 201 Created 또는 200 OK 반환 고려
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * 현재 로그인된 사용자의 프로필 이미지 정보(URL) 조회
     * @param details 현재 인증된 사용자 정보
     * @return 현재 프로필 이미지 정보 (ID, URL)
     */
    @GetMapping("/profile")
    public ResponseEntity<ImageResponse> fetchProfileImage(
            @AuthenticationPrincipal MyMemberDetails details
    ) {
        MemberId memberId = details.getMemberId();
        ImageResponse response = imageService.fetchProfileImage(memberId);
        // 이미지가 없는 경우 등을 고려하여 404 Not Found 반환 로직 추가 가능 (Service에서 처리)
        if (response == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(response);
    }

}
```

## ImageService: 비즈니스 로직 & DB/S3 처리 조정

이미지 업로드/삭제 핵심 로직과 데이터베이스 연동을 담당합니다. **기존 S3 객체 삭제** 로직을 명확히 추가합니다.

```java
package movlit.be.image.application.service;

import java.util.Optional; // Optional 사용

@Service
@RequiredArgsConstructor
@Transactional // DB 작업(삭제, 저장, 업데이트)과 S3 작업을 하나의 트랜잭션으로 묶음 (DB 롤백 고려)
@Slf4j
public class ImageService {

    private final ImageRepository imageRepository;
    private final S3Service s3Service; // S3 업로드/삭제 담당
    private final MemberReadService memberReadService;
    private final MemberWriteService memberWriteService;
    private final ApplicationEventPublisher eventPublisher; // 이벤트 발행기

    @Value("${aws.s3.bucket.folderName}")
    private String folderName;

    public ImageResponse uploadProfileImage(MemberId memberId, MultipartFile file) {
        // 0. 파일 유효성 검증 (예: 크기, 확장자) - 필요 시 추가
        validateFile(file); // 예시 메소드

        // 1. 기존 프로필 이미지가 존재한다면 S3에서 삭제 및 DB에서 삭제
        deleteExistingProfileImageIfPresent(memberId);

        // 2. S3에 새 이미지 업로드 후 ImageEntity 생성
        String imageUrl = s3Service.uploadImage(file, folderName); // S3 업로드
        ImageEntity imageEntity = ImageConverter.toImageEntity(imageUrl, memberId); // Entity 변환
        ImageEntity savedImageEntity = imageRepository.save(imageEntity); // DB에 이미지 메타데이터 저장

        // 3. Member 테이블의 profileImgUrl 필드 업데이트
        updateMemberProfileImageUrl(memberId, savedImageEntity.getUrl());

        // 4. (선택적) 이벤트 발행: 프로필 변경 알림 등
        eventPublisher.publishEvent(new ProfileImageUpdatedEvent(memberId, savedImageEntity.getUrl())); // 이벤트에 URL도 포함 가능

        log.info("Profile image uploaded successfully for member: {}, URL: {}", memberId.getValue(), savedImageEntity.getUrl());
        return new ImageResponse(savedImageEntity.getImageId(), savedImageEntity.getUrl());
    }

    private void deleteExistingProfileImageIfPresent(MemberId memberId) {
        // DB에서 해당 멤버의 이미지 정보 조회
        Optional<ImageEntity> existingImageOpt = imageRepository.findByMemberId(memberId);

        if (existingImageOpt.isPresent()) {
            ImageEntity existingImage = existingImageOpt.get();
            log.info("Deleting existing profile image for member: {}, URL: {}", memberId.getValue(), existingImage.getUrl());

            // S3에서 실제 이미지 파일 삭제
            try {
                s3Service.deleteImageFromS3(existingImage.getUrl());
            } catch (Exception e) {
                // S3 삭제 실패 시 로깅 및 예외 처리 전략 필요
                // (예: DB 삭제는 그대로 진행할지, 전체 롤백할지 등)
                log.error("Failed to delete image from S3: {}. Continuing with DB deletion.", existingImage.getUrl(), e);
                // 또는 여기서 예외를 던져 트랜잭션 롤백 유도 가능
            }

            // DB에서 이미지 정보 삭제
            imageRepository.delete(existingImage); // 혹은 deleteByMemberId 사용
        }
    }

    private void updateMemberProfileImageUrl(MemberId memberId, String imageUrl) {
        MemberEntity member = memberReadService.fetchEntityByMemberId(memberId); // Member 조회
        member.updateProfileImgUrl(imageUrl); // Member 엔티티의 URL 업데이트 메소드 호출
        // memberWriteService.save(member); // Member 엔티티가 영속성 컨텍스트에 있다면 @Transactional에 의해 자동 변경 감지(dirty checking)되어 save 호출 불필요할 수 있음. 확인 필요.
        // 명시적으로 save 호출하는 것이 안전할 수 있습니다. MemberWriteService의 구현 확인.
        log.info("Updated member profile URL for member: {}", memberId.getValue());
    }

    @Transactional(readOnly = true) // 조회 메소드는 readOnly=true로 성능 최적화
    public ImageResponse fetchProfileImage(MemberId memberId) {
        // findProfileImageByMemberId가 Optional<ImageResponse> 등을 반환하도록 수정하거나,
        // 여기서 Optional<ImageEntity>를 받아 처리하는 것이 더 안전함.
        // 현재 코드는 결과가 없을 때 예외 발생 가능성이 있음 (JpaRepository 기본 동작).
        Optional<ImageEntity> imageOpt = imageRepository.findByMemberId(memberId);
        return imageOpt
                .map(img -> new ImageResponse(img.getImageId(), img.getUrl()))
                .orElse(null); // 이미지가 없으면 null 반환 (Controller에서 404 처리)
        // 또는 orElseThrow(() -> new EntityNotFoundException("Profile image not found for member: " + memberId));
    }

    private void validateFile(MultipartFile file) {
        // 예시: 파일 크기 제한 (application.yml 에서 설정 가능 - spring.servlet.multipart.max-file-size)
        // 예시: 파일 확장자 검증 (허용된 이미지 타입만 처리)
        String contentType = file.getContentType();
        if (contentType == null || (!contentType.equals("image/jpeg") && !contentType.equals("image/png") && !contentType.equals("image/gif"))) {
            // throw new InvalidFileFormatException("Only JPEG, PNG, GIF images are allowed.");
            log.warn("Invalid file type uploaded: {}", contentType);
            // 필요 시 커스텀 예외 발생
        }
    }

}
```

## S3Service: S3 업로드 & 삭제 로직 구현

AWS S3로 이미지를 전송하고 URL을 생성하며, **이미지 삭제 기능**을 추가합니다.

```java
package movlit.be.image.application.service;

@Service
@RequiredArgsConstructor
@Slf4j
public class S3Service {

    private final S3Client s3Client; // AWS SDK v2 S3 Client (Config에서 Bean 등록)

    @Value("${aws.s3.bucket.name}")
    private String bucketName;

    /**
     * 파일을 S3에 업로드하고, 생성된 파일의 URL을 반환합니다.
     * @param file 업로드할 MultipartFile
     * @param folderName S3 버킷 내 저장될 폴더 경로
     * @return 업로드된 파일의 S3 URL
     * @throws ImageUploadException S3 업로드 중 오류 발생 시
     */
    public String uploadImage(MultipartFile file, String folderName) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File must not be null or empty");
        }

        String originalFilename = file.getOriginalFilename();
        String fileName = generateFileName(originalFilename, folderName); // 고유 파일명 생성

        PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                .bucket(bucketName)
                .key(fileName) // 폴더명 포함된 전체 경로 + 파일명
                .contentType(file.getContentType()) // 파일 MIME 타입 설정
                // .acl(ObjectCannedACL.PUBLIC_READ) // 필요 시 ACL 설정 (권장: Bucket 정책 사용)
                .build();

        try {
            log.info("Uploading file to S3. Bucket: {}, Key: {}", bucketName, fileName);
            s3Client.putObject(putObjectRequest,
                RequestBody.fromInputStream(file.getInputStream(), file.getSize())); // InputStream으로 S3에 전송

            // 업로드 후 해당 파일의 접근 URL 생성
            URL url = s3Client.utilities().getUrl(builder -> builder.bucket(bucketName).key(fileName));
            log.info("File uploaded successfully. URL: {}", url);
            return url.toExternalForm(); // URL 문자열 반환

        } catch (IOException e) {
            log.error("Error getting InputStream from MultipartFile", e);
            throw new ImageUploadException("Failed to read file for S3 upload.", e);
        } catch (S3Exception e) {
            log.error("Error uploading file to S3", e);
            throw new ImageUploadException("S3 upload failed.", e);
        } catch (SdkException e) {
            log.error("AWS SDK error during S3 upload", e);
            throw new ImageUploadException("AWS SDK error during S3 upload.", e);
        }
    }

    /**
     * S3에서 이미지 객체를 삭제합니다.
     * @param imageUrl 삭제할 이미지의 S3 URL
     * @throws ImageDeleteException S3 삭제 중 오류 발생 시
     */
    public void deleteImageFromS3(String imageUrl) {
        if (!StringUtils.hasText(imageUrl)) {
            log.warn("Image URL is empty or null, skipping S3 deletion.");
            return;
        }

        try {
            String key = extractKeyFromUrl(imageUrl); // URL에서 S3 객체 키 추출
            if (key == null) {
                log.error("Could not extract key from URL: {}", imageUrl);
                throw new ImageDeleteException("Invalid S3 URL format.");
            }

            log.info("Deleting object from S3. Bucket: {}, Key: {}", bucketName, key);
            DeleteObjectRequest deleteObjectRequest = DeleteObjectRequest.builder()
                    .bucket(bucketName)
                    .key(key)
                    .build();

            s3Client.deleteObject(deleteObjectRequest);
            log.info("Successfully deleted object from S3. Key: {}", key);

        } catch (S3Exception e) {
            log.error("Error deleting object from S3. URL: {}", imageUrl, e);
            throw new ImageDeleteException("S3 deletion failed for URL: " + imageUrl, e);
        } catch (SdkException e) {
            log.error("AWS SDK error during S3 deletion. URL: {}", imageUrl, e);
            throw new ImageDeleteException("AWS SDK error during S3 deletion for URL: " + imageUrl, e);
        } catch (Exception e) { // URL 파싱 등 다른 예외 처리
            log.error("Unexpected error during S3 deletion process for URL: {}", imageUrl, e);
            throw new ImageDeleteException("Unexpected error deleting image from S3.", e);
        }
    }

    /**
     * 고유하고 안전한 파일 이름을 생성합니다. (폴더명/UUID-원본파일명)
     * @param originalFilename 원본 파일명
     * @param folderName S3 내 폴더 경로
     * @return 생성된 파일명 (예: profile-images/a1b2c3d4-e5f6-7890-1234-abcdef123456-my_image.jpg)
     */
    public String generateFileName(String originalFilename, String folderName) {
        String sanitizedFilename = sanitizeFileName(originalFilename); // 파일명 정리
        String extension = StringUtils.getFilenameExtension(sanitizedFilename); // 확장자 추출
        String baseName = StringUtils.stripFilenameExtension(sanitizedFilename); // 파일 이름 부분 추출

        // UUID와 타임스탬프 등을 조합하여 고유성 보장 강화 가능
        String uniqueName = UUID.randomUUID().toString() + "-" + baseName;
        if (extension != null && !extension.isEmpty()) {
            uniqueName += "." + extension;
        }

        // 폴더명이 있으면 경로 추가
        if (StringUtils.hasText(folderName)) {
             // folderName 끝에 '/'가 있는지 확인하고 없으면 추가
            String prefix = folderName.endsWith("/") ? folderName : folderName + "/";
            return prefix + uniqueName;
        } else {
            return uniqueName;
        }
    }

    /**
     * 파일명에서 잠재적으로 문제가 될 수 있는 문자들을 제거하거나 대체합니다.
     * @param originalFilename 원본 파일명
     * @return 정리된 파일명
     */
    private String sanitizeFileName(String originalFilename) {
        if (originalFilename == null) {
            return "unknown_file"; // null일 경우 기본 이름 제공
        }
        // 예시: 공백을 언더스코어로 변경, 경로 구분자 제거, 특수 문자 제거 등
        // 여기서는 간단히 알파벳, 숫자, 점(.), 대시(-), 언더스코어(_)만 허용
        String sanitized = originalFilename.replaceAll("[^a-zA-Z0-9\\.\\-_]", "_");
        // 파일명이 너무 길 경우 자르기
        int maxFilenameLength = 100; // 예시 길이 제한
        if (sanitized.length() > maxFilenameLength) {
            String extension = StringUtils.getFilenameExtension(sanitized);
            String namePart = StringUtils.stripFilenameExtension(sanitized);
            namePart = namePart.substring(0, maxFilenameLength - (extension != null ? extension.length() + 1 : 0));
            sanitized = namePart + (extension != null ? "." + extension : "");
        }
        return sanitized;
    }

    /**
     * S3 객체 URL에서 객체 키(파일 경로 포함)를 추출합니다.
     * S3 URL 형식(예: https://<bucket-name>.s3.<region>.amazonaws.com/<key>)을 가정합니다.
     * CloudFront 등 CDN URL인 경우 파싱 로직이 달라져야 합니다.
     * @param imageUrl S3 객체 URL
     * @return 객체 키 (예: profile-images/uuid-image.jpg)
     */
    private String extractKeyFromUrl(String imageUrl) {
        try {
            URL url = new URL(imageUrl);
            // URL 경로 부분(예: /profile-images/uuid-image.jpg)에서 첫 '/' 제거
            String path = url.getPath();
            if (path.startsWith("/")) {
                path = path.substring(1);
            }
            // URL 인코딩된 문자(예: %20)가 있을 수 있으므로 디코딩
            return URLDecoder.decode(path, StandardCharsets.UTF_8);
        } catch (Exception e) {
            log.error("Failed to parse S3 URL to extract key: {}", imageUrl, e);
            return null; // 파싱 실패 시 null 반환
        }
    }
}
```

> **주의**: S3 버킷 정책이나 IAM 권한 설정이 올바르게 되어 있어야 합니다. `PutObject` 및 `DeleteObject` 권한이 필요합니다. 객체 URL 접근 권한(Public Read 또는 Presigned URL 등)도 고려해야 합니다.

## ImageEntity & Repository: 데이터 모델링과 영속성

**ImageEntity**는 이미지 메타데이터를 나타내는 JPA 엔티티입니다. `@EmbeddedId`를 사용하여 커스텀 Value Object인 `ImageId`를 기본 키로 사용하고 있습니다. (VO 사용은 타입 안정성과 도메인 표현력을 높여줍니다.)

```java
package movlit.be.image.domain.entity;

@Getter
@Entity
@NoArgsConstructor(access = AccessLevel.PROTECTED) // JPA 위한 기본 생성자 (protected)
@Table(name = "image") // DB 테이블명 'image'
public class ImageEntity {

    @EmbeddedId // 복합키나 Value Object를 ID로 사용할 때
    private ImageId imageId;

    @Column(nullable = false, length = 2048) // URL은 null 불가, 길이 제한
    private String url;

    // MemberId VO를 member_id 컬럼에 매핑
    @AttributeOverride(name = "value", column = @Column(name = "member_id", nullable = false, updatable = false))
    @Embedded // MemberId가 @Embeddable 일 경우 명시 가능 (선택적)
    private MemberId memberId; // 이미지 소유자 ID

    @Column(nullable = false, updatable = false) // 등록 시각은 null 불가, 수정 불가
    private LocalDateTime regDt;

    // 생성자를 통해 필수 값 초기화
    public ImageEntity(ImageId imageId, String url, MemberId memberId) {
        this.imageId = imageId;
        this.url = url;
        this.memberId = memberId;
        this.regDt = LocalDateTime.now(); // 생성 시 현재 시각 자동 설정
    }

    // MemberId나 URL을 변경할 필요가 있다면 setter 대신 명확한 의도의 메소드 추가 고려
    // 예: public void changeOwner(MemberId newMemberId) { ... }
}
```

### ImageRepository 계층 구조

데이터 접근 로직을 추상화하기 위해 Interface와 Impl 구조를 사용합니다. 이는 향후 구현 기술 변경(예: JPA -> QueryDSL, MyBatis)이나 테스트 용이성을 높이는 데 도움이 됩니다.

#### 1) `ImageRepository` (Interface - Domain Layer)

도메인 계층에 위치하며, 데이터 접근을 위한 명세(메소드 시그니처)를 정의합니다. 구현 기술에 독립적입니다.

```java
package movlit.be.image.domain.repository;

public interface ImageRepository {

    ImageEntity save(ImageEntity imageEntity); // 저장 및 수정

    Optional<ImageEntity> findByMemberId(MemberId memberId); // 멤버 ID로 이미지 조회 (단 건 가정)

    Optional<ImageEntity> findById(ImageId imageId); // ID로 이미지 조회

    boolean existsByMemberId(MemberId memberId); // 멤버 ID로 존재 여부 확인

    // DTO 반환보다는 Entity 반환 후 Service에서 변환하는 것이 좋음
    // Optional<ImageResponse> fetchProfileImageDtoByMemberId(MemberId memberId);
    // 대신 findByMemberId 사용 권장

    void deleteByMemberId(MemberId memberId); // 멤버 ID로 삭제

    void delete(ImageEntity imageEntity); // 엔티티 객체로 삭제
}
```

#### 2) `ImageJpaRepository` (Interface - Infrastructure Layer)

인프라 계층에 위치하며, Spring Data JPA의 `JpaRepository`를 상속받아 기본적인 CRUD 및 쿼리 메소드를 정의합니다.

```java
package movlit.be.image.infra.persistence.jpa;

import java.util.Optional;

public interface ImageJpaRepository extends JpaRepository<ImageEntity, ImageId> { // Entity와 ID 타입 지정

    // MemberId (Embeddable 타입) 필드로 조회
    Optional<ImageEntity> findByMemberId(MemberId memberId);

    boolean existsByMemberId(MemberId memberId);

    // JPQL을 이용한 커스텀 조회 (DTO 직접 반환 예시 - 필요 시 사용)
    // @Query("SELECT NEW movlit.be.image.presentation.dto.response.ImageResponse(i.imageId, i.url) "
    //        + "FROM ImageEntity i "
    //        + "WHERE i.memberId = :memberId")
    // Optional<ImageResponse> findProfileImageDtoByMemberId(@Param("memberId") MemberId memberId);

    // MemberId로 삭제하는 JPQL 쿼리 (벌크 연산)
    // 벌크 연산은 영속성 컨텍스트를 무시하므로 주의 필요 (실행 전 flush, 실행 후 clear 필요할 수 있음)
    @Modifying // DELETE, UPDATE 쿼리 시 필요
    @Query("DELETE FROM ImageEntity i WHERE i.memberId = :memberId")
    void deleteByMemberId(@Param("memberId") MemberId memberId);

    // findById(ImageId id)는 JpaRepository에 이미 존재함
}
```

#### 3) `ImageRepositoryImpl` (Class - Infrastructure Layer)

`ImageRepository` 인터페이스를 구현하며, 내부적으로 `ImageJpaRepository`를 사용하여 실제 데이터베이스 작업을 수행합니다. 복잡한 쿼리(예: QueryDSL)나 추가 로직이 필요할 때 유용합니다.

```java
package movlit.be.image.infra.persistence;

@Repository // Spring 컴포넌트 스캔 대상
@RequiredArgsConstructor
public class ImageRepositoryImpl implements ImageRepository {

    private final ImageJpaRepository imageJpaRepository; // Spring Data JPA Repository 주입

    @Override
    public ImageEntity save(ImageEntity imageEntity) {
        return imageJpaRepository.save(imageEntity);
    }

    @Override
    @Transactional(readOnly = true) // 조회 작업 명시
    public Optional<ImageEntity> findByMemberId(MemberId memberId) {
        return imageJpaRepository.findByMemberId(memberId);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<ImageEntity> findById(ImageId imageId) {
        return imageJpaRepository.findById(imageId);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean existsByMemberId(MemberId memberId) {
        return imageJpaRepository.existsByMemberId(memberId);
    }

    // DTO 직접 반환 제거
    // @Override
    // @Transactional(readOnly = true)
    // public Optional<ImageResponse> fetchProfileImageDtoByMemberId(MemberId memberId) {
    //     return imageJpaRepository.findProfileImageDtoByMemberId(memberId);
    // }

    @Override
    // @Modifying + @Query 사용 시 @Transactional 필요 (Service 레이어 @Transactional 전파)
    public void deleteByMemberId(MemberId memberId) {
        // JPQL 벌크 삭제 사용
        imageJpaRepository.deleteByMemberId(memberId);
        // 주의: 벌크 연산 후 영속성 컨텍스트와의 동기화 문제 발생 가능성 있음
        // imageJpaRepository.flush(); // 필요 시 추가
        // entityManager.clear(); // 필요 시 추가 (EntityManager 직접 주입 필요)
    }

    @Override
    public void delete(ImageEntity imageEntity) {
        // 엔티티 객체를 이용한 삭제 (영속성 컨텍스트 관리 하에 동작)
        imageJpaRepository.delete(imageEntity);
    }
}
```
