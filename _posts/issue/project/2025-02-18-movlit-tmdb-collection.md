---
title: "[Project] Spring Boot로 TMDB의 영화 데이터 수집 시스템 구축"
excerpt: "movlit, tmdb"

categories:
  - Project
tags:
  - [movlit, tmdb]

toc: true
toc_sticky: true

sidebar:
  nav: "categories"

date: 2025-02-18
last_modified_at: 2025-02-18
---

> [Movlit 프로젝트](https://github.com/venus-lion/movlit-plus)에 대한 설명입니다.

---

# Spring Boot로 구축한 영화 데이터 수집 시스템

Spring Boot 기반 애플리케이션에서 TMDB API를 호출하여 영화 관련 데이터를 수집하고, 이를 내부 도메인 엔티티로 변환하여 저장하는 과정을 말씀드리겠습니다. REST 컨트롤러, API 클라이언트, 그리고 서비스 계층의 구현을 통해 어떻게 데이터 수집 워크플로우를 구성하는지에 대한 포스트입니다.

---

## 1. REST 엔드포인트 구성 – MovieCollectionController

데이터 수집 작업은 여러 HTTP GET 엔드포인트를 통해 외부 호출로 트리거됩니다.  
컨트롤러 클래스에서는 다음과 같은 엔드포인트를 제공하고 있습니다.

- **/collect/movie/discover**  
  영화 목록(Discover Movies)을 수집합니다.
  
- **/collect/movie/keywords**  
  각 영화에 대한 키워드를 수집합니다.
  
- **/collect/movie/genres**  
  영화 장르 정보를 수집합니다.
  
- **/collect/movie/discover/crew**  
  영화 출연진 및 감독 등 크루 정보를 수집합니다.

```java
@RestController
@RequestMapping("/collect/movie")
@RequiredArgsConstructor
@Slf4j
public class MovieCollectionController {

    private final MovieCollectionService movieCollectionService;

    @GetMapping("/discover")
    public ResponseEntity<Void> collectDiscoverMovies() {
        movieCollectionService.collectDiscoverMovies();
        return ResponseEntity.ok().build();
    }

    @GetMapping("/keywords")
    public ResponseEntity<Void> collectMovieKeywords() {
        movieCollectionService.collectMovieKeywords();
        return ResponseEntity.ok().build();
    }

    @GetMapping("/genres")
    public ResponseEntity<Void> collectMovieGenres() {
        movieCollectionService.collectMovieGenres();
        return ResponseEntity.ok().build();
    }

    @GetMapping("/discover/crew")
    public ResponseEntity<Void> collectMovieCrew() {
        movieCollectionService.collectMovieCrew();
        return ResponseEntity.ok().build();
    }
}
```

> **포인트:** 컨트롤러는 단순히 서비스 계층의 메서드를 호출하는 역할만 수행하여, 관심사의 분리를 명확하게 하고 테스트 용이성을 높였습니다.

---

## 2. TMDB API 호출 – TmdbApiClient

외부 TMDB API와의 통신은 `RestTemplate`을 사용하여 구현했습니다.  
API 키, 액세스 토큰, 그리고 언어/지역 등의 파라미터를 상수로 관리하여 요청 URL을 동적으로 생성합니다.

```java
@Component
public class TmdbApiClient {

    private final RestTemplate restTemplate;
    private final String apiKey;

    // API 호출에 사용할 상수들
    private static final String LANGUAGE_KO = "&language=ko";
    private static final String REGION_KR = "&region=KR";
    private static final String INCLUDE_ADULT_FALSE = "&include_adult=false";
    private static final String RELEASE_DATE_GTE = "&release_date.gte=2023-01-01";
    private static final String RELEASE_DATE_LTE = "&release_date.lte=2024-12-31";
    private static final String SORT_BY = "&sort_by=vote_average";

    public TmdbApiClient(RestTemplateBuilder builder,
                         @Value("${tmdb.key}") String apiKey,
                         @Value("${tmdb.accessToken}") String accessToken) {
        this.apiKey = apiKey;
        HttpHeaders headers = new HttpHeaders();
        headers.add("Content-Type", "application/json");
        headers.add("Authorization", "Bearer " + accessToken);
        this.restTemplate = builder.build();
        this.restTemplate.getMessageConverters().add(0,
                new StringHttpMessageConverter(StandardCharsets.UTF_8));
    }

    // Discover API를 호출하여 영화 목록 반환
    public List<Map<String, Object>> fetchDiscoverMovies(String page) {
        String url = "https://api.themoviedb.org/3/discover/movie?api_key=" + apiKey +
                "&page=" + page + LANGUAGE_KO + REGION_KR + INCLUDE_ADULT_FALSE +
                RELEASE_DATE_GTE + RELEASE_DATE_LTE + SORT_BY;
        Map<String, Object> response = restTemplate.getForObject(url, Map.class);
        if (response == null || response.get("results") == null) {
            return List.of();
        }
        return (List<Map<String, Object>>) response.get("results");
    }

    // 영화 상세 정보, 키워드, 크레딧 등을 호출하는 추가 메서드들...
}
```

> **포인트:**  
> - **REST Template 설정:** 메시지 컨버터를 추가하여 UTF-8 인코딩 문제를 방지하고, HTTP 헤더를 통해 API 인증을 처리합니다.  
> - **동적 URL 생성:** 파라미터들을 상수로 정의하여 재사용성과 가독성을 높였습니다.

---

## 3. 데이터 수집 서비스 – MovieCollectionService

서비스 계층에서는 TMDB API로부터 수집한 데이터를 내부 도메인 엔티티로 변환하여 저장하는 로직을 구현했습니다.  
주요 기능별 메서드를 살펴보겠습니다.

### 3.1 Discover 영화 수집

`collectDiscoverMovies()` 메서드는 페이지 단위로 TMDB의 Discover API를 호출하여 영화 데이터를 수집합니다.

- **페이징 처리 및 Sleep 제어:**  
  최대 페이지 수와 일정 주기마다 스레드를 일시 중지하여 API 호출 제한(rate limit)을 고려했습니다.

- **데이터 변환:**  
  수집된 데이터는 `convertToMovieEntity` 메서드를 통해 도메인 엔티티로 변환되며, 영화 포스터 및 배경 이미지 URL을 가공하고, 미래 개봉 영화는 스킵하는 등의 조건 처리가 이루어집니다.

```java
public void collectDiscoverMovies() {
    for (int i = 1; i <= MAX_DISCOVER_PAGE; i++) {
        List<Map<String, Object>> discoverResults = tmdbApiClient.fetchDiscoverMovies(String.valueOf(i));
        if (discoverResults.isEmpty()) {
            break;
        }
        List<MovieEntity> movieEntities = new ArrayList<>();
        for (Map<String, Object> result : discoverResults) {
            String apiId = String.valueOf(result.get("id"));
            Map<String, Object> detailResult = tmdbApiClient.fetchMovieDetails(apiId);
            MovieEntity movie = convertToMovieEntity(result, detailResult);
            if (movie != null) {
                movieEntities.add(movie);
                log.info("Processed movie id={}", movie.getMovieId());
            }
        }
        movieCollectRepository.saveAll(movieEntities);
        if (i % DISCOVER_SLEEP_MOD == 0) {
            sleep(SLEEP_INTERVAL_MILLIS);
        }
    }
}
```

> **포인트:**  
> - **데이터 유효성 검증:** 영화 개봉일을 비교하여 미래 개봉 영화는 저장하지 않습니다.  
> - **로깅:** 각 영화가 처리될 때마다 로그를 남겨 모니터링에 유용합니다.

### 3.2 키워드 및 장르 수집

각 영화에 대해 추가 정보를 수집하는 메서드(`collectMovieKeywords()`, `collectMovieGenres()`)는 영화 엔티티 목록을 순회하며, TMDB API에서 키워드와 장르 정보를 가져와 JPA Repository를 통해 저장합니다.

- **키워드 저장:**  
  영화 키워드는 `MovieTagEntity`로 저장되며, 영화와의 연관 관계를 관리합니다.

- **장르 매핑:**  
  API에서 전달받은 장르 ID를 서비스 도메인에 맞게 매핑하기 위해 `mapApiGenreIdToServiceGenreId` 메서드를 사용합니다.

```java
private Long mapApiGenreIdToServiceGenreId(int apiGenreId) {
    return switch (apiGenreId) {
        case 28, 12 -> 1L;
        case 16 -> 2L;
        // 생략: 기타 케이스 처리...
        default -> 99999L;
    };
}
```

> **포인트:** API의 장르 체계를 내부 도메인에 맞춰 재정의하는 작업은 데이터 일관성을 유지하는 핵심 단계입니다.

### 3.3 영화 크루 수집

`collectMovieCrew()` 메서드는 영화의 출연진(캐스트)과 감독(Director) 정보를 수집합니다.

- **출연진과 감독 분리:**  
  - 캐스트 정보는 리스트를 순회하며 `MovieCrewEntity`를 생성합니다.  
  - 감독은 크루 목록에서 job이 "Director"인 항목을 필터링하여 처리합니다.

- **관계 엔티티 생성:**  
  영화와 크루 간의 관계는 별도의 엔티티(`MovieRCrewEntity`)로 관리됩니다.

```java
private MovieCrewEntity createMovieCrewEntityFromCast(Map<String, Object> cast) {
    MovieCrewId crewId = IdFactory.createMovieCrewId();
    String name = (String) cast.get("name");
    MovieRole role = MovieRole.CAST;
    String charName = (String) cast.get("character");
    String profileImgUrl = (String) cast.get("profile_path");
    int orderNo = (Integer) cast.get("order");
    return MovieCrewEntity.builder()
            .movieCrewId(crewId)
            .name(name)
            .role(role)
            .charName(charName)
            .profileImgUrl(profileImgUrl)
            .orderNo(orderNo)
            .build();
}
```

> **포인트:**  
> - **IdFactory 활용:** 각 크루 엔티티에 고유 식별자를 부여하여 데이터 무결성을 보장합니다.  
> - **관계 관리:** 영화와 크루의 다대다 관계를 별도 관계 엔티티로 관리함으로써, 향후 검색 및 통계 집계가 용이해집니다.

---

## 4. 기술적 고려 사항 및 설계 포인트

- **API 호출 제어:**  
  여러 메서드에서 일정 건수마다 스레드 일시 중지(sleep)를 호출하여 API rate limit 문제를 예방합니다.

- **데이터 변환 및 검증:**  
  외부 API에서 수신한 데이터를 내부 도메인 엔티티로 변환할 때, Optional 및 조건 검증을 통해 불필요한 데이터 저장을 방지합니다.

- **관심사의 분리:**  
  컨트롤러, API 클라이언트, 서비스 계층으로 기능을 명확하게 분리하여 코드의 재사용성 및 유지보수성을 높였습니다.

- **로깅 및 모니터링:**  
  각 처리 단계마다 로그를 남겨 데이터 수집 진행 상황과 문제 발생 시 빠른 대응이 가능하도록 설계되었습니다.

---

## 5. 결론

- **REST API 엔드포인트**를 통해 작업을 트리거하고,  
- **TmdbApiClient**로 외부 API 호출을 처리하며,  
- **MovieCollectionService**에서 데이터를 변환, 검증, 저장하는 전반적인 워크플로우를 구성하였습니다.

이와 같은 아키텍처 설계는 확장성과 유지보수성을 고려한 접근 방식으로, 향후 다른 외부 데이터 수집 작업에도 응용할 수 있습니다.  
