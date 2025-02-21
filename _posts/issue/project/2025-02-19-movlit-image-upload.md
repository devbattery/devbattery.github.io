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
last_modified_at: 2025-02-21
---

> [Movlit 프로젝트](https://github.com/venus-lion/movlit-plus)에 대한 설명입니다.

## 개요

- **AWS S3**: 클라우드 기반 객체 스토리지 서비스. 이미지, 동영상, 파일 등을 저장하는 데 특화.
- **Spring Boot**: REST API 서버로, 요청을 받아서 S3에 파일 업로드 후 경로를 DB에 기록.
- **Security & 인증**: 스프링 시큐리티를 통해 `@AuthenticationPrincipal`로 현재 사용자 식별.

**핵심 기능**:

1. **이미지 업로드**
2. **이미지 조회**
3. **DB 저장**: 이미지 메타데이터(`url`, 등록 시각, 소유자 등)
4. **중복 이미지 삭제**: 기존 프로필이 있으면 제거 후 새 이미지 등록

---

## 전체 흐름 & 구조

1. **사용자**가 `POST /api/images/profile`로 이미지를 업로드.
2. **`ImageController`**: S3 업로드를 담당하는 `ImageService.uploadProfileImage()` 호출.
3. **`S3Service`**: 실제 S3로 파일 전송 → **이미지 URL** 생성.
4. **DB 저장** (`ImageRepository`): 이미지 정보(`url`, `memberId`)를 저장.
5. **회원 테이블**(`MemberEntity`)의 `profileImgUrl`도 업데이트.
6. 조회 시 `GET /api/images/profile`로 사용자 프로필 이미지 `URL`을 반환.

**간단 다이어그램**:

```
[Client]
  -> [ImageController] -> [ImageService] -> [S3Service] -> [AWS S3]
                                    |
                                    -> [ImageRepository] -> [ImageEntity in DB]
```

---

## ImageController: API 엔드포인트

**클라이언트**(웹/모바일)는 `MultipartFile`을 `POST /api/images/profile`로 전송합니다.

````java
```java
package movlit.be.image.presentation;

import lombok.RequiredArgsConstructor;
import movlit.be.auth.application.service.MyMemberDetails;
import movlit.be.common.util.ids.MemberId;
import movlit.be.image.application.service.ImageService;
import movlit.be.image.presentation.dto.response.ImageResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequiredArgsConstructor
public class ImageController {

    private final ImageService imageService;

    @PostMapping("/api/images/profile")
    public ResponseEntity<ImageResponse> uploadProfileImage(
            @AuthenticationPrincipal MyMemberDetails details,
            @RequestPart(value = "file", required = false) MultipartFile file
    ) {
        MemberId memberId = details.getMemberId();
        var response = imageService.uploadProfileImage(memberId, file);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/api/images/profile")
    public ResponseEntity<ImageResponse> fetchProfileImage(
            @AuthenticationPrincipal MyMemberDetails details
    ) {
        var response = imageService.fetchProfileImage(details.getMemberId());
        return ResponseEntity.ok(response);
    }

}
````

### 주요 포인트

- `@AuthenticationPrincipal MyMemberDetails details`: 스프링 시큐리티를 통해 인증된 사용자 식별.
- `@RequestPart("file") MultipartFile file`: MultipartFile 형태로 이미지를 받음.
- `@PostMapping("/api/images/profile")` → 이미지 업로드, `@GetMapping("/api/images/profile")` → 이미지 조회.

---

## ImageService: 비즈니스 로직 & DB 처리

**이미지 업로드 로직**과 **DB 저장**을 담당합니다.

````java
```java
package movlit.be.image.application.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import movlit.be.chat_room.application.service.dto.ProfileImageUpdatedEvent;
import movlit.be.common.util.ids.MemberId;
import movlit.be.image.application.convertor.ImageConverter;
import movlit.be.image.domain.entity.ImageEntity;
import movlit.be.image.domain.repository.ImageRepository;
import movlit.be.image.presentation.dto.response.ImageResponse;
import movlit.be.member.application.service.MemberReadService;
import movlit.be.member.application.service.MemberWriteService;
import movlit.be.member.domain.entity.MemberEntity;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

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
        // 1. 기존 프로필 이미지가 존재한다면 삭제
        deleteExistingProfileImageIfPresent(memberId);

        // 2. S3에 업로드 후 ImageEntity 생성
        String imageUrl = s3Service.uploadImage(file, folderName);
        ImageEntity imageEntity = ImageConverter.toImageEntity(imageUrl, memberId);
        ImageEntity savedImageEntity = imageRepository.upload(imageEntity);

        // 3. Member 테이블의 profileImgUrl 필드 업데이트
        updateMemberProfileImageUrl(memberId, savedImageEntity.getUrl());

        // 4. 이벤트 발행 (예: 채팅방 프로필 업데이트 등 추가 로직에 활용)
        eventPublisher.publishEvent(new ProfileImageUpdatedEvent(memberId));

        return new ImageResponse(savedImageEntity.getImageId(), savedImageEntity.getUrl());
    }

    private void deleteExistingProfileImageIfPresent(MemberId memberId) {
        if (imageRepository.existsByMemberId(memberId)) {
            imageRepository.deleteByMemberId(memberId);
        }
    }

    private void updateMemberProfileImageUrl(MemberId memberId, String imageUrl) {
        MemberEntity member = memberReadService.fetchEntityByMemberId(memberId);
        member.updateProfileImgUrl(imageUrl);
        memberWriteService.save(member);
    }

    public ImageResponse fetchProfileImage(MemberId memberId) {
        return imageRepository.fetchProfileImageByMemberId(memberId);
    }

}
````

### 주요 포인트

1. **기존 프로필 이미지** 삭제 로직: `deleteExistingProfileImageIfPresent`
   - 실제 S3 객체 삭제 로직이 필요하다면 추가 구현.
2. **S3 업로드**: `s3Service.uploadImage(file, folderName)`
3. **이미지 엔티티** 생성: `ImageConverter.toImageEntity(url, memberId)`
4. **이벤트 발행**: `eventPublisher.publishEvent(...)`를 통해 다른 컴포넌트에서 업데이트 감지 가능.

---

## S3Service: S3 업로드 로직

**AWS S3**로 이미지를 전송하고 **URL**을 생성해 반환합니다.

````java
```java
package movlit.be.image.application.service;

import java.io.IOException;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import movlit.be.common.exception.ImageUploadException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

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
            s3Client.putObject(putObjectRequest,
                RequestBody.fromInputStream(file.getInputStream(), file.getSize()));
        } catch (IOException e) {
            log.error("Error uploading file to S3", e);
            throw new ImageUploadException();
        }

        // 업로드 후 해당 파일의 접근 URL 생성
        return s3Client.utilities().getUrl(builder -> builder.bucket(bucketName).key(fileName))
                .toExternalForm();
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
````

### 주요 포인트

- **`S3Client`**(AWS SDK for Java v2) 사용.
- `bucketName`, `folderName`: `application.yml`에 설정 (예: `aws.s3.bucket.name`, `aws.s3.bucket.folderName`).
- 예외 발생 시 `ImageUploadException`을 던져 처리.
- 파일명에 `UUID`를 추가하여 **중복 방지**.

> **주의**: S3 권한(Access Key, Secret Key, IAM Role) 설정을 미리 해주어야 합니다.

---

## ImageEntity & Repository

**ImageEntity**는 `@EmbeddedId`로 `ImageId`(커스텀 VO) 사용 중입니다.

````java
```java
package movlit.be.image.domain.entity;

import jakarta.persistence.AttributeOverride;
import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import movlit.be.common.util.ids.ImageId;
import movlit.be.common.util.ids.MemberId;

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
````

### ImageRepository

JPA 기반으로 이미지 정보를 DB에 저장/삭제/조회하는 **Repository** 계층.

#### 1) `ImageRepository` (Interface)

````java
```java
package movlit.be.image.domain.repository;

import movlit.be.common.util.ids.MemberId;
import movlit.be.image.domain.entity.ImageEntity;
import movlit.be.image.presentation.dto.response.ImageResponse;

public interface ImageRepository {

    ImageEntity upload(ImageEntity imageEntity);

    boolean existsByMemberId(MemberId memberId);

    ImageResponse fetchProfileImageByMemberId(MemberId memberId);

    void deleteByMemberId(MemberId memberId);

}
````

#### 2) `ImageJpaRepository`

````java
```java
package movlit.be.image.infra.persistence.jpa;

import movlit.be.common.util.ids.ImageId;
import movlit.be.common.util.ids.MemberId;
import movlit.be.image.domain.entity.ImageEntity;
import movlit.be.image.presentation.dto.response.ImageResponse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ImageJpaRepository extends JpaRepository<ImageEntity, ImageId> {

    boolean existsByMemberId(MemberId memberId);

    @Query("SELECT NEW movlit.be.image.presentation.dto.response.ImageResponse(i.imageId, i.url) "
            + "FROM ImageEntity i "
            + "WHERE i.memberId = :memberId")
    ImageResponse findProfileImageByMemberId(@Param("memberId") MemberId memberId);

    void deleteByMemberId(MemberId memberId);

}
````

#### 3) `ImageRepositoryImpl`

````java
```java
package movlit.be.image.infra.persistence;

import lombok.RequiredArgsConstructor;
import movlit.be.common.util.ids.MemberId;
import movlit.be.image.domain.entity.ImageEntity;
import movlit.be.image.domain.repository.ImageRepository;
import movlit.be.image.infra.persistence.jpa.ImageJpaRepository;
import movlit.be.image.presentation.dto.response.ImageResponse;
import org.springframework.stereotype.Repository;

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
````

> **Note**: `ImageRepositoryImpl`를 통해 `JpaRepository`를 감싸서 **추가 로직**이나 **커스텀 쿼리**를 확장할 수 있게 합니다.

---

## 정리

- **프로필 이미지**를 업로드할 때 **S3**를 사용하면 **대용량 파일**에 대한 확장성, 안전성 확보.
- **DB**에는 오직 **메타데이터**(URL, 소유 사용자, 등록일 등)만 저장하고, 실제 파일은 S3로 관리.
- 중복 파일이 없는지, 이미지를 교체할 때 이전 파일을 삭제할 것인지, 파일 크기 제한, 이미지 리사이즈/썸네일 처리가 필요한지 등을 종합적으로 고려해야 합니다.
- 스프링 이벤트(`ApplicationEventPublisher`)로 **프로필 이미지 변경**을 다른 서비스나 모듈에서 **비동기로 감지**할 수 있습니다.

---

## 전체 소스 코드

### **ImageController.java**

```java
package movlit.be.image.presentation;

import lombok.RequiredArgsConstructor;
import movlit.be.auth.application.service.MyMemberDetails;
import movlit.be.common.util.ids.MemberId;
import movlit.be.image.application.service.ImageService;
import movlit.be.image.presentation.dto.response.ImageResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequiredArgsConstructor
public class ImageController {

    private final ImageService imageService;

    @PostMapping("/api/images/profile")
    public ResponseEntity<ImageResponse> uploadProfileImage(
            @AuthenticationPrincipal MyMemberDetails details,
            @RequestPart(value = "file", required = false) MultipartFile file
    ) {
        MemberId memberId = details.getMemberId();
        var response = imageService.uploadProfileImage(memberId, file);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/api/images/profile")
    public ResponseEntity<ImageResponse> fetchProfileImage(
            @AuthenticationPrincipal MyMemberDetails details
    ) {
        var response = imageService.fetchProfileImage(details.getMemberId());
        return ResponseEntity.ok(response);
    }

}
```

### **ImageService.java**

```java
package movlit.be.image.application.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import movlit.be.chat_room.application.service.dto.ProfileImageUpdatedEvent;
import movlit.be.common.util.ids.MemberId;
import movlit.be.image.application.convertor.ImageConverter;
import movlit.be.image.domain.entity.ImageEntity;
import movlit.be.image.domain.repository.ImageRepository;
import movlit.be.image.presentation.dto.response.ImageResponse;
import movlit.be.member.application.service.MemberReadService;
import movlit.be.member.application.service.MemberWriteService;
import movlit.be.member.domain.entity.MemberEntity;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

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
        deleteExistingProfileImageIfPresent(memberId);

        String imageUrl = s3Service.uploadImage(file, folderName);
        ImageEntity imageEntity = ImageConverter.toImageEntity(imageUrl, memberId);
        ImageEntity savedImageEntity = imageRepository.upload(imageEntity);

        updateMemberProfileImageUrl(memberId, savedImageEntity.getUrl());
        eventPublisher.publishEvent(new ProfileImageUpdatedEvent(memberId));

        return new ImageResponse(savedImageEntity.getImageId(), savedImageEntity.getUrl());
    }

    private void deleteExistingProfileImageIfPresent(MemberId memberId) {
        if (imageRepository.existsByMemberId(memberId)) {
            imageRepository.deleteByMemberId(memberId);
        }
    }

    private void updateMemberProfileImageUrl(MemberId memberId, String imageUrl) {
        MemberEntity member = memberReadService.fetchEntityByMemberId(memberId);
        member.updateProfileImgUrl(imageUrl);
        memberWriteService.save(member);
    }

    public ImageResponse fetchProfileImage(MemberId memberId) {
        return imageRepository.fetchProfileImageByMemberId(memberId);
    }

}
```

### **ImageConverter.java**

```java
package movlit.be.image.application.convertor;

import movlit.be.common.util.IdFactory;
import movlit.be.common.util.ids.MemberId;
import movlit.be.image.domain.entity.ImageEntity;

public class ImageConverter {

    public static ImageEntity toImageEntity(String url, MemberId memberId) {
        return new ImageEntity(IdFactory.createImageId(), url, memberId);
    }

}
```

### **S3Service.java**

```java
package movlit.be.image.application.service;

import java.io.IOException;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import movlit.be.common.exception.ImageUploadException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

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
            s3Client.putObject(putObjectRequest,
                RequestBody.fromInputStream(file.getInputStream(), file.getSize()));
        } catch (IOException e) {
            log.error("Error uploading file to S3", e);
            throw new ImageUploadException();
        }

        return s3Client.utilities().getUrl(builder -> builder.bucket(bucketName).key(fileName))
                .toExternalForm();
    }

    public String generateFileName(String originalFilename, String folderName) {
        String sanitizedFilename = sanitizeFileName(originalFilename);
        return folderName + "/" + UUID.randomUUID() + "-" + sanitizedFilename;
    }

    private String sanitizeFileName(String originalFilename) {
        if (originalFilename == null) {
            return "unknown";
        }
        return originalFilename.replaceAll("[^a-zA-Z0-9\\.\\-_]", "");
    }

}
```

### **ImageEntity.java**

```java
package movlit.be.image.domain.entity;

import jakarta.persistence.AttributeOverride;
import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import movlit.be.common.util.ids.ImageId;
import movlit.be.common.util.ids.MemberId;

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

### **ImageRepository.java**

```java
package movlit.be.image.domain.repository;

import movlit.be.common.util.ids.MemberId;
import movlit.be.image.domain.entity.ImageEntity;
import movlit.be.image.presentation.dto.response.ImageResponse;

public interface ImageRepository {

    ImageEntity upload(ImageEntity imageEntity);

    boolean existsByMemberId(MemberId memberId);

    ImageResponse fetchProfileImageByMemberId(MemberId memberId);

    void deleteByMemberId(MemberId memberId);

}
```

### **ImageJpaRepository.java**

```java
package movlit.be.image.infra.persistence.jpa;

import movlit.be.common.util.ids.ImageId;
import movlit.be.common.util.ids.MemberId;
import movlit.be.image.domain.entity.ImageEntity;
import movlit.be.image.presentation.dto.response.ImageResponse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ImageJpaRepository extends JpaRepository<ImageEntity, ImageId> {

    boolean existsByMemberId(MemberId memberId);

    @Query("SELECT NEW movlit.be.image.presentation.dto.response.ImageResponse(i.imageId, i.url) "
            + "FROM ImageEntity i "
            + "WHERE i.memberId = :memberId")
    ImageResponse findProfileImageByMemberId(@Param("memberId") MemberId memberId);

    void deleteByMemberId(MemberId memberId);

}
```

### **ImageRepositoryImpl.java**

```java
package movlit.be.image.infra.persistence;

import lombok.RequiredArgsConstructor;
import movlit.be.common.util.ids.MemberId;
import movlit.be.image.domain.entity.ImageEntity;
import movlit.be.image.domain.repository.ImageRepository;
import movlit.be.image.infra.persistence.jpa.ImageJpaRepository;
import movlit.be.image.presentation.dto.response.ImageResponse;
import org.springframework.stereotype.Repository;

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

### **ImageResponse.java**

```java
package movlit.be.image.presentation.dto.response;

import movlit.be.common.util.ids.ImageId;

public record ImageResponse(ImageId imageId, String url) {

}
```

### **MemberProfileUpdateDto.java** (예시)

```java
package movlit.be.image.presentation.dto.response;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class MemberProfileUpdateDto {

    private String profileImgUrl;

}
```

---

## 결론

- 추가로 파일 **용량** 제한, S3 객체 삭제 로직, 썸네일 생성, 이미지 **확장자 검증** 등을 개선해나갈 것입니다.
