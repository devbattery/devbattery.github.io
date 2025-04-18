---
title: "[Project] Spring Boot와 TMDB API로 영화 데이터 수집"
excerpt: "movlit, tmdb, springboot, jpa, api, batch"

categories:
  - Project
tags:
  - [movlit, tmdb, springboot, jpa, api, batch]

toc: true
toc_sticky: true

sidebar:
  nav: "categories"

date: 2025-02-18
last_modified_at: 2025-04-19
---

> [Movlit 프로젝트](https://github.com/venus-lion/movlit-plus)에 대한 설명입니다.

[TMDB](https://developer.themoviedb.org/reference/intro/getting-started)는 방대한 영화 정보를 무료 API로 제공합니다. 저희는 **Spring Boot**로 이 데이터를 수집하고 데이터베이스에 저장하는 시스템을 구축했습니다.

## 외부 API 호출

TMDB API와 통신하기 위해 Spring의 `RestTemplate`을 사용했습니다. API Key, 언어 설정 등 반복되는 파라미터를 효율적으로 관리하고, 안전하게 URL을 생성하는 것이 중요했습니다.

```java
// TmdbApiClient.java
@Component
public class TmdbApiClient {

    private final RestTemplate restTemplate;
    private final String apiKey;

    private static final String BASE_URL = "https://api.themoviedb.org/3";
    private static final String LANGUAGE_KO = "ko-KR";
    // ... (기타 상수)

    public TmdbApiClient(RestTemplateBuilder builder,
                         @Value("${tmdb.key}") String apiKey,
                         @Value("${tmdb.accessToken}") String accessToken) { // v4용 AccessToken (여기선 사용하지 않음)
        this.apiKey = apiKey;
        this.restTemplate = builder.build();
        // UTF-8 인코딩 설정 (한글 깨짐 방지)
        this.restTemplate.getMessageConverters()
                .add(0, new StringHttpMessageConverter(StandardCharsets.UTF_8));
    }

    public List<Map<String, Object>> fetchDiscoverMovies(String page) {
        // UriComponentsBuilder 사용으로 가독성 및 안정성 향상
        String url = UriComponentsBuilder.fromHttpUrl(BASE_URL + "/discover/movie")
                .queryParam("api_key", apiKey)
                .queryParam("page", page)
                .queryParam("language", LANGUAGE_KO)
                // ... (다른 필수 파라미터 추가)
                .queryParam("sort_by", "popularity.desc")
                .encode(StandardCharsets.UTF_8) // 필요시 인코딩 지정
                .toUriString();

        try {
            // getForObject: GET 요청 후 응답 본문을 Map으로 변환 시도
            Map<String, Object> response = restTemplate.getForObject(url, Map.class);
            // ... (null 및 'results' 필드 체크)
            return (List<Map<String, Object>>) response.get("results");
        } catch (RestClientException e) {
            log.error("TMDB Discover API 호출 오류. URL: {}", url, e);
            return Collections.emptyList(); // 오류 시 빈 리스트 반환
        }
    }
    // ... (fetchMovieDetails, fetchMovieKeywords 등)
}
```

- `@Value("${tmdb.key}")`: API Key 같은 민감 정보는 `application.yml` (또는 `.properties`) 파일에 정의하고 주입받아 사용합니다.
- `RestTemplateBuilder`: `RestTemplate` 인스턴스 생성 시 다양한 설정을 쉽게 적용할 수 있게 도와줍니다. 여기서는 UTF-8 메시지 컨버터를 추가하여 API 응답의 한글 깨짐을 방지했습니다.
- **`UriComponentsBuilder`**: 문자열拼接 방식으로 URL을 만드는 것보다 `UriComponentsBuilder`를 사용하면 파라미터 인코딩 문제를 자동으로 처리해주고, 코드가 더 명확해집니다.
- `restTemplate.getForObject(url, Map.class)`: GET 요청을 보내고 응답 JSON을 `Map<String, Object>` 형태로 받습니다. 구조가 복잡하거나 타입 안정성이 중요하다면, 전용 DTO(Data Transfer Object) 클래스를 만들어 사용하는 것이 더 좋습니다. (예: `TmdbDiscoverResponseDto.class`)
- **오류 처리**: `try-catch` 블록으로 `RestClientException`(네트워크 오류, HTTP 상태 코드 오류 등)을 잡아 로깅하고, 빈 리스트나 `null`을 반환하여 전체 프로세스가 중단되지 않도록 처리했습니다.

## API 응답 변환

API 응답으로 받은 `Map` 데이터를 저희가 정의한 JPA `MovieEntity` 객체로 변환하는 과정은 오류 발생 가능성이 높습니다. Null 값, 예상치 못한 데이터 타입, 날짜 형식 불일치 등을 신중하게 처리했습니다.

```java
// MovieCollectionService.java - convertToMovieEntity 메서드 일부
private MovieEntity convertToMovieEntity(Map<String, Object> result, Map<String, Object> detailResult) {
    try {
        Integer id = (Integer) result.get("id");
        if (id == null) return null; // 필수 ID 누락 시 처리 불가

        // Optional과 map/orElse 사용하여 Null-safe 처리
        String posterPath = Optional.ofNullable(result.get("poster_path"))
                .map(String::valueOf) // Object -> String
                .filter(s -> !s.isEmpty()) // 빈 문자열 제외
                .map(path -> "http://image.tmdb.org/t/p/original" + path) // 전체 URL 생성
                .orElse(null); // 없으면 null

        // 날짜 파싱 및 예외 처리
        String releaseDateStr = (String) result.get("release_date");
        LocalDate releaseDate = null;
        if (releaseDateStr != null && !releaseDateStr.trim().isEmpty()) {
            try {
                releaseDate = LocalDate.parse(releaseDateStr, DateTimeFormatter.ISO_LOCAL_DATE);
            } catch (DateTimeParseException e) {
                log.warn("개봉일({}) 파싱 실패. Movie ID: {}", releaseDateStr, id);
                // 파싱 실패 시 null 유지 또는 기본값 설정
            }
        }

        // Number 타입 처리 (Integer 또는 Double 가능성 고려)
        Double popularity = result.get("popularity") != null ? ((Number) result.get("popularity")).doubleValue() : 0.0;

        // 상세 정보(detailResult)에서 추가 정보 추출 (null 체크 필수)
        Integer runtime = null;
        if (detailResult != null) {
            runtime = detailResult.get("runtime") != null ? ((Number) detailResult.get("runtime")).intValue() : null;
            // ... (productionCountry, status 등 추출)
        }

        // Builder 패턴으로 Entity 생성
        return MovieEntity.builder()
                .movieId(Long.valueOf(id))
                .posterPath(posterPath)
                .releaseDate(releaseDate)
                .popularity(popularity)
                .runtime(runtime)
                // ... (다른 필드 설정)
                .regDt(LocalDateTime.now())
                .updDt(LocalDateTime.now())
                .delYn(false)
                .build();

    } catch (ClassCastException | NullPointerException e) {
        // 예상치 못한 타입 변환 오류나 Null 참조 발생 시 로깅하고 null 반환
        log.error("MovieEntity 변환 중 데이터 오류 발생. result={}, detailResult={}", result, detailResult, e);
        return null;
    }
}
```

- **Null Safety**: `Optional`을 활용하거나 `getOrDefault`, `!= null` 체크를 통해 `NullPointerException`을 방지합니다. 특히 이미지 경로(`poster_path`, `backdrop_path`)처럼 없을 수 있는 필드에 유용합니다.
- **타입 변환**: JSON 숫자 타입은 Java에서 `Integer` 또는 `Double`로 해석될 수 있습니다. `(Number)`로 캐스팅 후 `.doubleValue()`, `.longValue()`, `.intValue()` 등을 사용하여 원하는 타입으로 안전하게 변환합니다.
- **날짜 파싱**: 문자열 형태의 날짜(`release_date`)는 `LocalDate.parse()`를 사용해 `LocalDate` 객체로 변환합니다. 이때 `DateTimeParseException`이 발생할 수 있으므로 `try-catch`로 감싸야 합니다. 잘못된 형식의 날짜 데이터가 들어올 경우를 대비합니다.
- **Builder 패턴**: 엔티티 객체 생성 시 Builder 패턴을 사용하면 코드가 더 읽기 쉬워지고, 필수 필드와 선택 필드를 명확히 구분하여 설정할 수 있습니다.
- **개별 오류 처리**: `convertToMovieEntity` 메서드 전체를 `try-catch`로 감싸서, 특정 영화 데이터 변환 중 오류가 발생하더라도 전체 수집 작업이 중단되지 않고 해당 영화만 건너뛸 수 있도록 합니다.

## API 제한 해결

TMDB API는 짧은 시간에 과도한 요청을 보내는 것을 막기 위해 Rate Limit(호출 횟수 제한) 정책을 가지고 있습니다. 이를 준수하기 위해 간단하게 `Thread.sleep()`을 사용했습니다.

```java
// MovieCollectionService.java
private static final int DISCOVER_SLEEP_MOD = 2; // 2 페이지마다
private static final int SLEEP_INTERVAL_MILLIS = 1000; // 1초 대기

public void collectDiscoverMovies() {
    // ...
    for (int i = 1; i <= MAX_DISCOVER_PAGE; i++) {
        // ... (API 호출 및 처리) ...
        if (i % DISCOVER_SLEEP_MOD == 0 && i < MAX_DISCOVER_PAGE) {
            log.info("Discover API 호출 조절을 위해 잠시 대기 ({}ms)...", SLEEP_INTERVAL_MILLIS);
            sleep(SLEEP_INTERVAL_MILLIS); // 스레드 잠시 멈춤
        }
    }
    // ...
}

private void sleep(int millis) {
    try {
        Thread.sleep(millis);
    } catch (InterruptedException e) {
        Thread.currentThread().interrupt(); // 인터럽트 상태 복원
        log.warn("Thread sleep 중 InterruptedException 발생", e);
    }
}
```

- `DISCOVER_SLEEP_MOD` 페이지마다 `SLEEP_INTERVAL_MILLIS` 만큼 스레드를 잠시 멈춰 API 요청 간격을 조절합니다. 키워드나 장르 수집 시에는 더 많은 API 호출이 발생하므로 `KEYWORD_GENRE_SLEEP_MOD` (예: 40건마다) 같이 다른 기준을 적용했습니다.

## 대량 데이터 처리


```java
// MovieCollectionService.java - collectMovieKeywords 메서드 (장르, 크루도 유사)
public void collectMovieKeywords() {
    log.info("=== 영화 키워드 수집 시작 ===");
    // DB의 모든 영화를 메모리로 로드 시도 (위험!)
    List<MovieEntity> movies = movieCollectRepository.findAll();
    log.info("키워드 수집 대상 영화 {} 건", movies.size());
    // ... (각 영화에 대해 API 호출 및 처리) ...
}
```

- `movieCollectRepository.findAll()`은 테이블의 모든 레코드를 조회하여 메모리에 `List<MovieEntity>` 형태로 로드합니다. 영화 수가 수만, 수십만 건이 되면 **`OutOfMemoryError`**가 발생하여 애플리케이션이 중단될 수 있습니다. 이것은 추후에 Spring Batch를 사용하여 개선해볼 생각입니다.

## 데이터 매핑

TMDB의 장르 ID 체계와 우리 서비스의 장르 분류 체계가 다를 수 있습니다. 이를 연결하기 위한 매핑 로직이 필요합니다.

```java
// MovieCollectionService.java
private Long mapApiGenreIdToServiceGenreId(int apiGenreId) {
    // switch 표현식 (Java 14+) 사용
    return switch (apiGenreId) {
        case 28, 12 -> 1L;   // 액션(28), 모험(12) -> 우리 서비스 장르 1L (액션/모험)
        case 16 -> 2L;       // 애니메이션(16) -> 2L
        // ... (다른 장르 매핑)
        case 37 -> 16L;      // 서부(37) -> 16L
        default -> 99999L;   // 매핑되지 않거나 분류되지 않은 장르는 특수 ID 반환
    };
}

private List<MovieGenreEntity> fetchAndSaveMovieGenres(MovieEntity movie) {
    // ... (상세 정보 API 호출하여 genres 리스트 얻기) ...
    Set<MovieGenreIdForEntity> genreIdSet = new LinkedHashSet<>(); // 중복 방지
    for (Map<String, Object> genre : genres) {
        Integer apiGenreId = (Integer) genre.get("id");
        Long serviceGenreId = mapApiGenreIdToServiceGenreId(apiGenreId); // 매핑 함수 호출
        if (serviceGenreId != 99999L) { // 유효한 서비스 장르 ID만 처리
            genreIdSet.add(new MovieGenreIdForEntity(movie.getMovieId(), serviceGenreId));
        }
    }
    // ... (MovieGenreEntity 생성 및 saveAll 호출) ...
}
```

- `mapApiGenreIdToServiceGenreId` 메서드는 TMDB API에서 받은 장르 ID(`apiGenreId`)를 우리 시스템 내부에서 사용하는 장르 ID(`serviceGenreId`)로 변환합니다. 이를 통해 외부 시스템(TMDB)의 ID 체계 변경이 우리 시스템 내부에 직접적인 영향을 미치는 것을 최소화합니다. (느슨한 결합)
- 매핑되지 않는 장르 ID(`default`)는 특정 값(여기서는 `99999L`)을 반환하여 처리에서 제외하거나 '기타' 장르로 분류할 수 있습니다.

## 중복 데이터 방지

한 명의 배우나 감독은 여러 영화에 출연/참여할 수 있습니다. 크루 정보를 수집할 때 동일 인물이 DB에 중복 저장되지 않도록 처리해야 합니다.

```java
// MovieCollectionService.java - collectMovieCrew 메서드 일부
public void collectMovieCrew() {
    // ...
    // <TMDB 인물 ID, 우리 시스템의 MovieCrewEntity>
    Map<Long, MovieCrewEntity> processedCrewMap = new HashMap<>();
    List<MovieRCrewEntity> movieRCrewEntitiesToSave = new ArrayList<>();

    for (MovieEntity movie : movies) {
        // ... (크레딧 API 호출) ...

        // Cast (배우) 처리
        if (creditsResponse.get("cast") instanceof List) {
            List<Map<String, Object>> castList = (List<Map<String, Object>>) creditsResponse.get("cast");
            for (Map<String, Object> cast : castList) {
                Long personApiId = cast.get("id") != null ? ((Number) cast.get("id")).longValue() : null;
                if (personApiId == null) continue;

                // Map.computeIfAbsent: 해당 ID가 Map에 없으면 새로 생성하고 Map에 넣음, 있으면 기존 값 반환
                MovieCrewEntity crewEntity = processedCrewMap.computeIfAbsent(personApiId,
                        id -> createMovieCrewEntityFromCast(cast, personApiId)); // 인물 정보 생성 (중복 방지)

                // 영화-인물 관계(N:M) 정보 생성
                MovieRCrewEntity rCrewEntity = createMovieRCrewEntity(movie, crewEntity);
                movieRCrewEntitiesToSave.add(rCrewEntity);
            }
        }
        // Crew (감독) 처리도 유사하게 computeIfAbsent 사용 ...
    }

    // 최종 저장: 중복 제거된 인물 정보 + 모든 관계 정보
    if (!processedCrewMap.isEmpty()) {
        // 주의: 이미 DB에 있는 인물 정보는 UPDATE 필요. saveAll은 INSERT 시도.
        // 실제로는 findById 등으로 조회 후 없으면 save, 있으면 update 로직 필요.
        // 또는 JPA의 save 메서드가 ID 존재 여부로 INSERT/UPDATE 분기하는 것을 활용.
        movieCrewJpaRepository.saveAll(processedCrewMap.values()); // 중복 없는 인물 목록 저장
    }
    if (!movieRCrewEntitiesToSave.isEmpty()) {
        movieRCrewJpaRepository.saveAll(movieRCrewEntitiesToSave); // 영화-인물 관계 저장
    }
    // ...
}

// 인물 Entity 생성 시 TMDB 인물 ID도 저장하도록 수정
private MovieCrewEntity createMovieCrewEntityFromCast(Map<String, Object> cast, Long personApiId) {
    // ...
    return MovieCrewEntity.builder()
            .movieCrewId(IdFactory.createMovieCrewId()) // 우리 시스템 고유 ID
            .tmdbPersonId(personApiId) // TMDB 인물 ID 저장
            .name((String) cast.get("name"))
            .role(MovieRole.CAST)
            // ...
            .build();
}
```

**설명:**

- TMDB API 응답에는 고유한 인물 ID(`id` 필드)가 포함되어 있습니다. 이 ID를 기준으로 인물 정보(`MovieCrewEntity`)의 중복 생성을 방지합니다.
- `Map<Long, MovieCrewEntity> processedCrewMap`을 사용하여, `TMDB 인물 ID`를 Key로 하고 생성된 `MovieCrewEntity`를 Value로 저장합니다.
- `computeIfAbsent(key, mappingFunction)`: Map에 `key`(TMDB 인물 ID)가 존재하면 해당 Value(`MovieCrewEntity`)를 반환하고, 존재하지 않으면 `mappingFunction`(람다식: `id -> createMovieCrewEntity...`)을 실행하여 새로운 `MovieCrewEntity`를 생성하여 Map에 저장하고 그 값을 반환합니다. 이를 통해 동일 인물에 대한 `MovieCrewEntity` 생성이 단 한 번만 일어나도록 보장합니다.
- `MovieCrewEntity`에는 TMDB 인물 ID를 저장할 필드(`tmdbPersonId`)를 추가하는 것이 좋습니다.
- **데이터 저장**: `movieCrewJpaRepository.saveAll(processedCrewMap.values())`를 호출하여 중복 없이 수집된 인물 정보들을 한 번에 저장합니다.

## `@Transactional` 활용하여 데이터 일관성 유지

데이터 수집 과정 중 여러 테이블(영화, 키워드, 장르, 크루 등)에 걸쳐 DB 작업이 일어납니다. 중간에 오류가 발생했을 때 데이터 일관성을 유지하는 것이 중요합니다.

```java
// MovieCollectionService.java
@Slf4j
@Service
@Transactional // 클래스 레벨에 선언
@RequiredArgsConstructor
public class MovieCollectionService {
    // ... Repository 및 다른 의존성 주입 ...

    // 이 클래스 내의 public 메서드들은 기본적으로 하나의 트랜잭션 내에서 실행됨
    public void collectDiscoverMovies() { /* ... */ }
    public void collectMovieKeywords() { /* ... */ }
    // ...
}
```

- `@Transactional` 어노테이션을 서비스 클래스 레벨에 추가하면, 해당 클래스의 `public` 메서드가 호출될 때 트랜잭션이 시작되고, 메서드가 성공적으로 완료되면 트랜잭션이 커밋(Commit)됩니다.
- 만약 메서드 실행 중 **RuntimeException** (또는 설정된 다른 예외 타입)이 발생하면, 진행 중이던 모든 DB 작업(INSERT, UPDATE, DELETE)이 **롤백(Rollback)** 됩니다.
- 이를 통해 예를 들어 `collectDiscoverMovies` 메서드 수행 중 영화 정보는 저장했지만 관련 좋아요 카운트 초기화에서 오류가 발생하면, 영화 정보 저장까지 모두 취소되어 데이터가 불일치 상태로 남는 것을 방지할 수 있습니다.
