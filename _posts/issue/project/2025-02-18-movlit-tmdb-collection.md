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
last_modified_at: 2025-03-29
---

> [Movlit 프로젝트](https://github.com/venus-lion/movlit-plus)에 대한 설명입니다.

## TMDB 영화 데이터, Spring Boot로 수집하고 저장하기! 🎬

안녕하세요! 오늘은 영화나 TV 시리즈 팬이라면 익숙할 **TMDB(The Movie Database)**의 방대한 데이터를 활용하는 방법을 알아볼 거예요. TMDB는 고맙게도 다양한 영화 정보를 **무료 API**로 제공해주는데요, 이걸 **Spring Boot**와 **JPA**를 이용해서 우리만의 데이터베이스에 차곡차곡 쌓는 과정을 단계별로 살펴보겠습니다.

- **TMDB**: 영화, TV 시리즈, 배우 등 엔터테인먼트 관련 데이터를 제공하는 거대한 커뮤니티 기반 데이터베이스입니다. 우리는 여기서 제공하는 API를 통해 원하는 정보를 가져올 거예요.
- **Spring Boot**: Java 기반 웹 프레임워크인 Spring을 더 쉽고 빠르게 사용할 수 있게 해주는 도구입니다. 이걸로 외부 API를 호출하고 데이터를 처리하는 **REST API 서버**를 뚝딱 만들어 볼 겁니다.
- **JpaRepository**: Java 진영의 표준 ORM(객체-관계 매핑) 기술인 JPA를 쉽게 사용하게 해주는 Spring Data JPA의 핵심 인터페이스입니다. 코드로 객체를 다루듯 데이터베이스 작업을 처리할 수 있게 해줘서, 수집한 데이터를 우리 **DB에 영구적으로 저장(영속화)**하는 데 사용됩니다.

### 아키텍처 한눈에 보기 🏗️

데이터가 어떻게 흘러가는지 간단한 그림으로 먼저 살펴볼까요?

```
[TMDB API] <---- HTTP 요청 ----> [TmdbApiClient] <---- 메서드 호출 ----> [MovieCollectionService] <---- 데이터 전달 ----> [JPA Repository] <---- SQL 실행 ----> [우리 DB]
   (외부)                     (우리 서버 내부)                       (우리 서버 내부)                      (우리 서버 내부)                  (우리 서버 내부)
```

각 컴포넌트(구성 요소)의 역할을 좀 더 자세히 알아볼게요.

- **`MovieCollectionController`**: 우리 서버의 '입구' 역할을 합니다. 외부(예: 웹 브라우저, 포스트맨)에서 특정 URL로 **HTTP 요청**이 들어오면, 해당 요청에 맞는 **Service 계층의 메서드를 호출**해주는 다리 역할을 해요.
- **`TmdbApiClient`**: '외부'인 TMDB API와 직접 통신하는 친구입니다. 마치 해외 특파원처럼, 필요한 정보를 TMDB에 **HTTP 요청**으로 물어보고 응답을 받아오는 **클라이언트** 역할을 담당합니다.
- **`MovieCollectionService`**: 여기가 바로 **핵심 비즈니스 로직**이 처리되는 '작업실'입니다. `TmdbApiClient`로부터 받은 데이터를 그냥 저장하는 게 아니라, 우리 서비스에 맞게 **가공**하고, 필요한 경우 여러 API 호출 결과를 **조합**하는 등 실제적인 **데이터 처리** 작업을 수행합니다.
- **`JpaRepository`**: Service에서 처리된 데이터를 최종적으로 **데이터베이스(DB)에 저장**하거나 조회하는 '창고 관리자'입니다. JPA 기술을 이용해 복잡한 SQL 없이도 DB 작업을 할 수 있게 도와줍니다.

---

## MovieCollectionController: 데이터 수집 시작 버튼 🕹️

이제 실제 코드를 보면서 이야기해볼게요. `MovieCollectionController`는 데이터 수집 로직을 실행시키는 **HTTP GET 요청**을 받는 엔드포인트(URL 경로)들을 정의하는 클래스입니다. 예를 들어, 웹 브라우저나 관리자 도구에서 `GET /collect/movie/discover` 같은 주소로 요청을 보내면, TMDB에서 영화 정보를 가져와 우리 DB에 저장하는 작업이 시작되는 거죠.

```java
package movlit.be.data_collection.movie;

@RestController // 1. 이 클래스는 REST API 요청을 처리하는 컨트롤러입니다.
@RequestMapping("/collect/movie") // 2. 이 컨트롤러 내의 모든 메서드는 '/collect/movie' 경로 하위에 매핑됩니다.
@RequiredArgsConstructor // 3. final 필드에 대한 생성자를 자동으로 만들어줘서 의존성 주입(DI)을 쉽게 합니다. (여기서는 MovieCollectionService)
@Slf4j // 4. 로그 객체(log)를 자동으로 생성해줍니다. (Lombok 덕분!)
public class MovieCollectionController {

    private final MovieCollectionService movieCollectionService; // 실제 데이터 수집 로직을 수행할 서비스 객체

    // '/collect/movie/discover' 경로로 GET 요청이 오면 이 메서드가 실행됩니다.
    @GetMapping("/discover")
    public ResponseEntity<Void> collectDiscoverMovies() {
        log.info("GET /collect/movie/discover 요청 수신 - 영화 목록(Discover) 수집 시작");
        movieCollectionService.collectDiscoverMovies(); // 서비스의 메서드를 호출해서 실제 작업을 위임
        log.info("영화 목록(Discover) 수집 작업 완료");
        // 작업이 성공적으로 끝나면 HTTP 상태 코드 200 OK 와 함께 빈 응답 본문을 반환합니다.
        return ResponseEntity.ok().build();
    }

    // '/collect/movie/keywords' 경로로 GET 요청이 오면 이 메서드가 실행됩니다.
    @GetMapping("/keywords")
    public ResponseEntity<Void> collectMovieKeywords() {
        log.info("GET /collect/movie/keywords 요청 수신 - 영화 키워드 수집 시작");
        movieCollectionService.collectMovieKeywords();
        log.info("영화 키워드 수집 작업 완료");
        return ResponseEntity.ok().build();
    }

    // '/collect/movie/genres' 경로로 GET 요청이 오면 이 메서드가 실행됩니다.
    @GetMapping("/genres")
    public ResponseEntity<Void> collectMovieGenres() {
        log.info("GET /collect/movie/genres 요청 수신 - 영화 장르 수집 시작");
        movieCollectionService.collectMovieGenres();
        log.info("영화 장르 수집 작업 완료");
        return ResponseEntity.ok().build();
    }

    // '/collect/movie/discover/crew' 경로로 GET 요청이 오면 이 메서드가 실행됩니다.
    // (경로 이름이 '/crew' 또는 '/credits' 가 더 명확해 보일 수도 있겠네요!)
    @GetMapping("/discover/crew") // TODO: URL 경로명 변경 고려 ('/crew' or '/credits')
    public ResponseEntity<Void> collectMovieCrew() {
        log.info("GET /collect/movie/discover/crew 요청 수신 - 영화 크루(감독/배우) 수집 시작");
        movieCollectionService.collectMovieCrew();
        log.info("영화 크루(감독/배우) 수집 작업 완료");
        return ResponseEntity.ok().build();
    }

}
```

### 주요 포인트 짚어보기 📌

- **역할 분담**: 컨트롤러는 요청을 받고, 적절한 서비스 메서드를 호출한 뒤, 성공/실패 여부를 HTTP 응답으로 알려주는 역할만 합니다. 복잡한 로직은 가지지 않는 것이 좋은 설계입니다.
- **`@RestController`**: 이 어노테이션 덕분에 각 메서드의 반환값(여기서는 `ResponseEntity`)이 자동으로 HTTP 응답 본문으로 변환됩니다. 일반 `@Controller`와 달리 뷰(HTML 페이지)를 찾지 않아요.
- **`@GetMapping`**: HTTP GET 메서드 요청을 특정 경로와 연결해줍니다.
- **`ResponseEntity<Void>`**: 데이터 수집 작업은 보통 결과를 즉시 반환하기보다는 백그라운드에서 진행되므로, 성공 여부(HTTP 200 OK)만 알려주기 위해 본문(`Body`)이 없는 `Void` 타입을 사용했습니다.
- **`@RequiredArgsConstructor` (Lombok)**: `final`로 선언된 `movieCollectionService` 필드를 위한 생성자를 자동으로 만들어줍니다. 이를 통해 Spring이 의존성 주입(Dependency Injection)을 해줄 수 있어요. 생성자 주입 방식은 권장되는 DI 방법 중 하나입니다.

---

## TmdbApiClient: TMDB와 대화하는 창구 📞

`TmdbApiClient` 클래스는 우리 서버가 TMDB API와 통신할 수 있도록 도와주는 '통신 전문가'입니다. Spring에서 제공하는 **`RestTemplate`** (또는 최신 프로젝트에서는 `WebClient`)을 사용해서 지정된 TMDB API 엔드포인트(URL)로 HTTP 요청을 보내고, 그 결과를 받아오는 역할을 합니다. 여기서는 TMDB가 주로 JSON 형식으로 응답하기 때문에, 결과를 Java에서 다루기 쉬운 `Map` 또는 `List<Map<String, Object>>` 형태로 변환해서 받습니다.

```java
package movlit.be.movie_collect.application;

@Component // Spring이 이 클래스의 인스턴스를 관리하도록 Bean으로 등록합니다.
public class TmdbApiClient {

    private final RestTemplate restTemplate; // 실제 HTTP 요청을 보내는 객체
    private final String apiKey; // TMDB API 인증을 위한 API 키
    // TMDB API v3는 주로 API Key를 URL 파라미터로 사용하지만, v4 등에서는 Access Token을 헤더에 사용하기도 합니다.
    // 여기서는 Access Token도 주입받고 헤더에 설정하는 코드가 있네요. (TMDB API 정책 확인 필요)

    // API 호출 URL을 만들 때 재사용할 상수들을 정의해두면 편리합니다.
    private static final String LANGUAGE_KO = "&language=ko-KR"; // 결과를 한국어로 받기 위한 파라미터 (ko-KR 권장)
    private static final String REGION_KR = "&region=KR";       // 한국 지역 필터링 파라미터
    private static final String INCLUDE_ADULT_FALSE = "&include_adult=false"; // 성인 영화 제외 파라미터
    private static final String RELEASE_DATE_GTE = "&release_date.gte=2023-01-01"; // 특정 날짜 이후 개봉작 필터 (예시)
    private static final String RELEASE_DATE_LTE = "&release_date.lte=2024-12-31"; // 특정 날짜 이전 개봉작 필터 (예시)
    private static final String SORT_BY = "&sort_by=popularity.desc"; // 정렬 기준 (예: 인기순 내림차순) - vote_average는 표본 적을 시 왜곡 가능성 있음

    // 생성자를 통해 필요한 의존성(RestTemplateBuilder, 설정값)을 주입받습니다.
    public TmdbApiClient(RestTemplateBuilder builder,
                         @Value("${tmdb.key}") String apiKey, // application.yml(또는 properties) 파일의 tmdb.key 값을 주입
                         @Value("${tmdb.accessToken}") String accessToken) { // tmdb.accessToken 값을 주입
        this.apiKey = apiKey;

        // 요청 헤더 설정 (API v4 Access Token 사용 시)
        HttpHeaders headers = new HttpHeaders();
        headers.add("Content-Type", "application/json"); // 요청 본문 타입을 JSON으로 명시 (GET 요청에서는 크게 의미 없을 수 있음)
        headers.add("Authorization", "Bearer " + accessToken); // Bearer 토큰 인증 방식 사용

        // RestTemplate 설정 및 생성
        this.restTemplate = builder
                // .defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken) // 모든 요청에 헤더 추가하는 다른 방법
                .build(); // RestTemplateBuilder를 이용해 RestTemplate 인스턴스 생성

        // TMDB API 응답이 UTF-8 인코딩인데, 기본 설정 문제로 한글이 깨질 경우를 대비해 UTF-8 메시지 컨버터를 추가합니다.
        // (최신 Spring Boot 버전에서는 기본적으로 UTF-8 처리가 잘 될 수도 있습니다.)
        this.restTemplate.getMessageConverters()
                .add(0, new StringHttpMessageConverter(StandardCharsets.UTF_8));
    }

    /**
     * TMDB의 Discover API를 호출하여 특정 페이지의 영화 목록을 가져옵니다.
     * @param page 가져올 페이지 번호 (1부터 시작)
     * @return 영화 목록 (List<Map<String, Object>>) 또는 빈 리스트
     */
    public List<Map<String, Object>> fetchDiscoverMovies(String page) {
        // 요청 URL 조립: 기본 URL + API 키 + 페이지 번호 + 각종 필터링/정렬 옵션
        // (URL 빌더 사용을 고려하면 더 깔끔하고 안전하게 URL을 만들 수 있습니다: UriComponentsBuilder)
        String url = "https://api.themoviedb.org/3/discover/movie?api_key=" + apiKey +
                "&page=" + page + LANGUAGE_KO + REGION_KR + INCLUDE_ADULT_FALSE +
                RELEASE_DATE_GTE + RELEASE_DATE_LTE + SORT_BY;

        // restTemplate.getForObject: GET 요청을 보내고, 응답 본문을 지정된 클래스 타입(여기서는 Map)으로 변환 시도
        // 만약 API 응답 구조가 복잡하다면, Map<String, Object> 대신 전용 DTO 클래스를 만들어 사용하는 것이 더 안전하고 유지보수하기 좋습니다.
        Map<String, Object> response = restTemplate.getForObject(url, Map.class);

        // API 응답이 없거나, 응답 구조에 'results' 키가 없는 경우 빈 리스트 반환 (NullPointerException 방지)
        if (response == null || response.get("results") == null) {
            log.warn("TMDB Discover API 호출 결과가 비어있거나 'results' 필드가 없습니다. URL: {}", url);
            return List.of(); // Java 9+ Immutable List
        }
        // 'results' 키의 값 (영화 목록)을 List 형태로 캐스팅하여 반환
        // (주의: 캐스팅 실패 시 ClassCastException 발생 가능. DTO 사용 시 이런 위험 감소)
        return (List<Map<String, Object>>) response.get("results");
    }

    /**
     * 특정 영화의 상세 정보를 TMDB API를 통해 가져옵니다.
     * @param apiId TMDB 영화 ID
     * @return 영화 상세 정보 (Map<String, Object>) 또는 null (오류 발생 시)
     */
    public Map<String, Object> fetchMovieDetails(String apiId) {
        // 상세 정보 API는 보통 language 파라미터만 필요합니다.
        String url = "https://api.themoviedb.org/3/movie/" + apiId + "?api_key=" + apiKey + LANGUAGE_KO;
        // 여기서도 getForObject 사용. 오류 발생 시 RestClientException 발생 가능.
        return restTemplate.getForObject(url, Map.class);
    }

    /**
     * 특정 영화의 키워드 정보를 TMDB API를 통해 가져옵니다.
     * @param movieId TMDB 영화 ID
     * @return 영화 키워드 정보 (Map<String, Object>) 또는 null
     */
    public Map<String, Object> fetchMovieKeywords(Long movieId) {
        String url = "https://api.themoviedb.org/3/movie/" + movieId + "/keywords?api_key=" + apiKey;
        return restTemplate.getForObject(url, Map.class);
    }

    /**
     * 특정 영화의 출연진(Cast) 및 제작진(Crew) 정보를 TMDB API를 통해 가져옵니다.
     * @param movieId TMDB 영화 ID
     * @return 영화 크레딧 정보 (Map<String, Object>) 또는 null
     */
    public Map<String, Object> fetchMovieCredits(Long movieId) {
        String url = "https://api.themoviedb.org/3/movie/" + movieId + "/credits?api_key=" + apiKey + LANGUAGE_KO;
        return restTemplate.getForObject(url, Map.class);
    }

}
```

### 주요 포인트 짚어보기 📌

- **`@Value("${...}")`**: `application.yml`이나 `application.properties` 파일, 또는 환경 변수에 정의된 설정 값을 Java 코드 내 변수로 가져올 때 사용합니다. API 키처럼 민감하거나 변경될 수 있는 정보는 코드에 직접 넣기보다 이렇게 외부 설정으로 관리하는 것이 좋습니다.
- **`RestTemplate` vs `WebClient`**: `RestTemplate`은 Spring의 전통적인 동기(Synchronous) 방식 HTTP 클라이언트입니다. 사용하기 간편하지만, 요청을 보내고 응답이 올 때까지 스레드가 대기(Blocking)해야 합니다. 최신 Spring 프로젝트에서는 비동기(Asynchronous)/논블로킹(Non-blocking) 방식의 **`WebClient`** 사용이 권장됩니다. 특히 대량의 API 호출이 필요한 경우 성능상 이점이 있습니다.
- **`Map<String, Object>` vs DTO**: API 응답을 `Map`으로 받는 것은 유연하지만, 어떤 키가 있는지, 각 키의 값 타입이 무엇인지 컴파일 시점에 알기 어렵고, 잘못된 키를 사용하거나 타입 캐스팅 오류가 발생하기 쉽습니다. API 응답 구조에 맞춰 **DTO(Data Transfer Object) 클래스**를 정의하고 `restTemplate.getForObject(url, MovieDetailsDto.class)`처럼 사용하면, 코드 가독성과 안정성이 크게 향상됩니다. (Jackson 라이브러리가 자동으로 JSON <-> DTO 변환을 해줍니다.)
- **상수 활용**: API 요청 URL에 반복적으로 사용되는 파라미터(언어, 지역 등)는 상수로 정의하면 오타를 줄이고 유지보수가 용이해집니다.
- **에러 처리의 중요성**: 현재 코드는 `restTemplate.getForObject()` 호출 시 네트워크 오류, 4xx/5xx 응답 코드 등 다양한 예외가 발생할 수 있습니다. 실제 서비스에서는 `try-catch` 블록으로 감싸거나, `RestTemplate`의 `setErrorHandler()`를 커스터마이징하여 **예외 상황을 더 견고하게 처리**해야 합니다. 예를 들어, 404 Not Found 응답을 받았을 때 어떻게 처리할지 등을 정의해야 안정적인 데이터 수집이 가능합니다.

> **Tip 💡**: `UriComponentsBuilder`를 사용하면 URL 문자열을 직접 조립하는 것보다 더 안전하고 깔끔하게 URL과 파라미터를 관리할 수 있습니다. `builder.path("/discover/movie").queryParam("api_key", apiKey)...build().toUriString()` 와 같이 사용할 수 있어요.

---

## MovieCollectionService: 데이터 가공과 저장의 핵심 엔진 ⚙️

`MovieCollectionService`는 이번 프로젝트의 '심장'과 같은 역할을 합니다. `TmdbApiClient`를 통해 가져온 원시(raw) 데이터를 우리 서비스에 필요한 형태로 **가공**하고, **비즈니스 규칙**을 적용하며, 최종적으로 `JpaRepository`를 통해 **데이터베이스에 저장**하는 모든 핵심 로직이 여기에 구현되어 있습니다.

이 서비스는 크게 네 가지 데이터 수집 기능을 제공합니다:

1.  **영화 목록 수집 (Discover)**: TMDB의 Discover API를 통해 특정 조건(예: 최신 인기작)의 영화 목록을 가져와 기본 정보를 저장합니다.
2.  **영화 키워드 수집**: 이미 저장된 영화들에 대해 TMDB에서 관련 키워드를 가져와 저장합니다.
3.  **영화 장르 수집**: 영화 상세 정보에서 장르 데이터를 추출하고, 우리 시스템의 장르 분류 체계에 맞게 매핑하여 저장합니다.
4.  **크루(감독, 배우) 수집**: 영화의 출연진(Cast)과 제작진(Crew), 특히 감독 정보를 가져와 저장하고 영화와 연결합니다.

```java
package movlit.be.movie_collect.application.service;

@Slf4j
@Service // 1. 이 클래스는 비즈니스 로직을 처리하는 서비스 계층의 Bean입니다.
@Transactional // 2. 클래스 레벨에 붙이면 이 클래스의 public 메서드는 기본적으로 하나의 트랜잭션 안에서 실행됩니다.
               // 메서드 실행 중 예외가 발생하면 진행된 DB 작업이 롤백됩니다. (데이터 일관성 유지)
@RequiredArgsConstructor // 3. Lombok: final 필드에 대한 생성자 자동 생성 (DI 용도)
public class MovieCollectionService {

    // 의존성 주입: 필요한 클라이언트, 리포지토리, 다른 서비스들을 주입받습니다.
    private final TmdbApiClient tmdbApiClient;
    private final MovieCollectRepository movieCollectRepository; // 영화 정보
    private final MovieTagRepository movieTagRepository;         // 영화 키워드(태그)
    private final MovieGenreCollectRepository movieGenreCollectRepository; // 영화 장르 관계
    private final MovieCrewJpaRepository movieCrewJpaRepository;     // 영화인(배우/감독) 정보
    private final MovieRCrewJpaRepository movieRCrewJpaRepository;   // 영화-영화인 매핑 정보
    private final MovieHeartCountService movieHeartCountService;   // 영화 좋아요 수 (별도 관리)

    // API 호출 제어를 위한 상수 정의
    private static final int MAX_DISCOVER_PAGE = 5;      // Discover API로 가져올 최대 페이지 수
    private static final int DISCOVER_SLEEP_MOD = 2;     // Discover 페이지 처리 시 몇 페이지마다 잠시 쉴지 결정 (2페이지마다)
    private static final int KEYWORD_GENRE_SLEEP_MOD = 40; // 키워드/장르 수집 시 몇 건마다 잠시 쉴지 결정 (40건마다)
    private static final int SLEEP_INTERVAL_MILLIS = 1000; // 잠시 쉬는 시간 (1000ms = 1초)

    // --- 1) 영화 목록 수집 (Discover API 활용) ---
    public void collectDiscoverMovies() {
        log.info("=== 영화 목록(Discover) 수집 시작 ===");
        // 1페이지부터 최대 MAX_DISCOVER_PAGE 페이지까지 순회
        for (int i = 1; i <= MAX_DISCOVER_PAGE; i++) {
            log.info("Discover API 호출 - 페이지: {}", i);
            // a. TMDB Discover API 호출하여 한 페이지 분량의 영화 목록(기본 정보) 가져오기
            List<Map<String, Object>> discoverResults = tmdbApiClient.fetchDiscoverMovies(String.valueOf(i));

            // 결과가 비어있으면 더 이상 페이지가 없는 것이므로 중단
            if (discoverResults.isEmpty()) {
                log.info("Discover API 결과 없음. 수집 중단. (페이지: {})", i);
                break;
            }

            List<MovieEntity> movieEntities = new ArrayList<>();
            // b. 목록의 각 영화에 대해 상세 정보 추가 호출 (런타임, 제작 국가 등)
            for (Map<String, Object> result : discoverResults) {
                String apiId = String.valueOf(result.get("id")); // TMDB 영화 ID 추출
                // (주의!) N+1 API 호출 문제: 목록 조회 1번에 N개의 상세 조회 API 호출 발생.
                // 대량 데이터 처리 시 성능 저하 및 Rate Limit 초과 위험. 개선 필요! (예: 상세 정보는 별도 배치 작업으로 분리)
                log.debug("Movie Detail API 호출 - 영화 ID: {}", apiId);
                Map<String, Object> detailResult = tmdbApiClient.fetchMovieDetails(apiId);

                // c. API 응답(Map)을 우리 시스템의 MovieEntity 객체로 변환
                MovieEntity movie = convertToMovieEntity(result, detailResult);

                // d. 변환된 MovieEntity가 유효하면 (null이 아니면) 리스트에 추가
                if (movie != null) {
                    movieEntities.add(movie);
                    log.debug("영화 처리 완료 (DB 저장 대기): ID={}, 제목={}", movie.getMovieId(), movie.getTitle());
                }
            }

            // e. 해당 페이지에서 처리된 영화 엔티티들을 DB에 한 번에 저장 (Batch Insert 효과)
            if (!movieEntities.isEmpty()) {
                log.info("DB 저장 시도 - {} 건의 영화 정보 (페이지: {})", movieEntities.size(), i);
                movieCollectRepository.saveAll(movieEntities); // JPA saveAll 사용
            }

            // f. API Rate Limit 준수를 위해 일정 페이지마다 잠시 대기 (간단한 방식)
            if (i % DISCOVER_SLEEP_MOD == 0) {
                log.info("Discover API 호출 조절을 위해 잠시 대기 ({}ms)...", SLEEP_INTERVAL_MILLIS);
                sleep(SLEEP_INTERVAL_MILLIS);
            }
        }
        log.info("=== 영화 목록(Discover) 수집 종료 ===");
    }

    // API 응답(Map)을 MovieEntity 객체로 변환하는 헬퍼 메서드
    private MovieEntity convertToMovieEntity(Map<String, Object> result, Map<String, Object> detailResult) {
        // 필수 값 Null 체크 및 타입 변환 (실제로는 더 견고한 예외 처리 필요)
        try {
            LocalDate today = LocalDate.now();
            Integer id = (Integer) result.get("id"); // TMDB ID
            String title = (String) result.get("title");
            String originalTitle = (String) result.get("original_title");
            String overview = (String) result.get("overview");
            // TMDB API는 JSON Number를 Double 또는 Integer로 줄 수 있으므로 유연하게 처리 필요
            Double popularity = ((Number) result.getOrDefault("popularity", 0.0)).doubleValue();

            // 포스터/배경 이미지 경로는 없을 수 있으므로 Optional 처리 후 전체 URL 생성
            String posterPath = Optional.ofNullable((String) result.get("poster_path"))
                    .map(path -> "http://image.tmdb.org/t/p/original" + path) // w500 등 다른 사이즈 사용 가능
                    .orElse(""); // 없으면 빈 문자열

            String backdropPath = Optional.ofNullable((String) result.get("backdrop_path"))
                    .map(path -> "http://image.tmdb.org/t/p/original" + path)
                    .orElse("");

            // 개봉일 파싱 (문자열 -> LocalDate)
            String releaseDateStr = (String) result.get("release_date");
            LocalDate releaseDate = null;
            if (releaseDateStr != null && !releaseDateStr.isEmpty()) {
                try {
                    releaseDate = LocalDate.parse(releaseDateStr, DateTimeFormatter.ISO_LOCAL_DATE);
                } catch (Exception e) {
                    log.warn("개봉일 파싱 실패: movieId={}, dateStr={}", id, releaseDateStr, e);
                    // 파싱 실패 시 처리 로직 (예: null 유지 또는 기본값 설정)
                }
            }

            // 오늘 이후 개봉 영화는 수집 대상에서 제외 (서비스 정책)
            if (releaseDate != null && releaseDate.isAfter(today)) {
                log.debug("미래 개봉 영화 스킵: movieId={}, releaseDate={}", id, releaseDate);
                return null;
            }

            String originalLanguage = (String) result.get("original_language");
            Long voteCount = ((Number) result.getOrDefault("vote_count", 0)).longValue();
            Double voteAverage = ((Number) result.getOrDefault("vote_average", 0.0)).doubleValue();

            // 상세 정보 API 결과에서 추가 정보 추출
            String productionCountry = "미확인"; // 기본값
            if (detailResult != null) {
                List<Map<String, Object>> productionCountries = (List<Map<String, Object>>) detailResult.get("production_countries");
                if (productionCountries != null && !productionCountries.isEmpty()) {
                    // 첫 번째 국가의 ISO 코드 사용 (ProductionCountry 유틸리티 클래스 필요)
                    productionCountry = ProductionCountry.getNameFromCode(
                            (String) productionCountries.get(0).get("iso_3166_1")
                    );
                }
            } else {
                log.warn("영화 상세 정보(detailResult)가 null입니다. movieId={}", id);
            }

            // Integer나 Long 타입 필드는 null 가능성을 염두에 두어야 함
            Integer runtime = (detailResult != null) ? (Integer) detailResult.get("runtime") : null;
            String status = (detailResult != null) ? (String) detailResult.get("status") : null;
            String tagline = (detailResult != null) ? (String) detailResult.get("tagline") : null;

            // MovieEntity 객체 생성 (Builder 패턴 사용)
            MovieEntity movie = MovieEntity.builder()
                    .movieId(Long.valueOf(id)) // TMDB ID를 우리 시스템 ID로 사용
                    .title(title)
                    .originalTitle(originalTitle)
                    .overview(overview)
                    .popularity(popularity)
                    .posterPath(posterPath)
                    .backdropPath(backdropPath)
                    .releaseDate(releaseDate) // 파싱 실패 시 null 저장될 수 있음
                    .originalLanguage(originalLanguage)
                    .voteCount(voteCount)
                    .voteAverage(voteAverage)
                    .productionCountry(productionCountry)
                    .runtime(runtime)
                    .status(status)
                    .tagline(tagline)
                    // 엔티티 공통 필드 설정 (생성/수정 시각, 삭제 여부)
                    .regDt(LocalDateTime.now())
                    .updDt(LocalDateTime.now())
                    .delYn(false)
                    .build();

            // (부가 기능) 영화가 생성될 때, 연관된 좋아요 카운트 레코드도 생성/초기화
            // MovieHeartCountService는 이 서비스의 주 관심사가 아니므로 분리하는 것이 좋음 (SRP 원칙)
            movieHeartCountService.save(MovieConvertor.toMovieHeartCountEntity(movie.getMovieId()));

            return movie;

        } catch (Exception e) {
            // 데이터 변환 중 예외 발생 시 로그 남기고 null 반환 (해당 영화 데이터는 저장되지 않음)
            log.error("MovieEntity 변환 중 오류 발생: result={}, detailResult={}", result, detailResult, e);
            return null;
        }
    }

    // --- 2) 영화 키워드 수집 ---
    public void collectMovieKeywords() {
        log.info("=== 영화 키워드 수집 시작 ===");
        // a. DB에 저장된 모든 영화 정보 조회 (주의: 영화가 매우 많으면 메모리 부족 발생 가능! Paging 처리나 Stream 방식 고려)
        List<MovieEntity> movies = movieCollectRepository.findAll();
        log.info("키워드 수집 대상 영화 {} 건", movies.size());
        int count = 0;

        // b. 각 영화에 대해 TMDB 키워드 API 호출
        for (MovieEntity movie : movies) {
            try {
                log.debug("키워드 API 호출 - 영화 ID: {}", movie.getMovieId());
                fetchAndSaveMovieKeywords(movie); // 키워드 조회 및 저장 로직 호출
                count++;

                // c. Rate Limit 준수를 위한 sleep
                if (count % KEYWORD_GENRE_SLEEP_MOD == 0) {
                    log.info("키워드 API 호출 조절을 위해 잠시 대기 ({}ms)... (처리 건수: {})", SLEEP_INTERVAL_MILLIS, count);
                    sleep(SLEEP_INTERVAL_MILLIS);
                }
            } catch (Exception e) {
                log.error("영화 ID {} 키워드 수집 중 오류 발생", movie.getMovieId(), e);
                // 특정 영화에서 오류 발생 시, 전체 작업이 중단되지 않도록 try-catch 처리
            }
        }
        log.info("=== 영화 키워드 수집 종료 (처리 건수: {}) ===", count);
    }

    // 특정 영화의 키워드를 TMDB에서 가져와 DB에 저장하는 메서드
    private List<MovieTagEntity> fetchAndSaveMovieKeywords(MovieEntity movie) {
        Map<String, Object> keywordResponse = tmdbApiClient.fetchMovieKeywords(movie.getMovieId());

        // API 응답 유효성 검사
        if (keywordResponse == null || keywordResponse.get("keywords") == null) {
            log.warn("키워드 API 응답 없음 또는 'keywords' 필드 없음. 영화 ID: {}", movie.getMovieId());
            return List.of();
        }

        List<Map<String, Object>> keywords = (List<Map<String, Object>>) keywordResponse.get("keywords");
        if (keywords.isEmpty()) {
            return List.of(); // 키워드가 없는 경우
        }

        List<MovieTagEntity> tagEntities = new ArrayList<>();
        for (Map<String, Object> keyword : keywords) {
            Long tagApiId = ((Number) keyword.get("id")).longValue(); // TMDB 키워드 ID
            String name = (String) keyword.get("name");

            // 복합 키 (영화 ID, 태그 API ID)를 사용하는 엔티티 ID 생성
            MovieTagIdForEntity tagId = new MovieTagIdForEntity(tagApiId, movie.getMovieId());

            // MovieTagEntity 생성
            MovieTagEntity tag = MovieTagEntity.builder()
                    .movieTagIdForEntity(tagId) // 복합 키 설정
                    .name(name)
                    .movieEntity(movie) // 연관된 영화 엔티티 설정 (JPA 관계 매핑)
                    .regDt(LocalDateTime.now())
                    .updDt(LocalDateTime.now())
                    .delYn(false)
                    .build();
            tagEntities.add(tag);
        }

        // 해당 영화의 키워드들을 한 번에 저장
        log.debug("DB 저장 시도 - 영화 ID {}의 키워드 {} 건", movie.getMovieId(), tagEntities.size());
        movieTagRepository.saveAll(tagEntities);
        return tagEntities;
    }

    // --- 3) 영화 장르 수집 ---
    public void collectMovieGenres() {
        log.info("=== 영화 장르 수집 시작 ===");
        List<MovieEntity> movies = movieCollectRepository.findAll(); // 키워드와 동일하게 대량 데이터 처리 시 주의
        log.info("장르 수집 대상 영화 {} 건", movies.size());
        int count = 0;

        for (MovieEntity movie : movies) {
            try {
                log.debug("장르 정보 처리를 위해 상세 API 호출 - 영화 ID: {}", movie.getMovieId());
                // (개선점) Discover 수집 시 이미 상세 정보를 받아왔다면, 그 정보를 재사용하거나
                // DB에 저장된 영화 정보에서 장르 ID 목록을 가져오는 것이 효율적. 현재는 중복 호출.
                fetchAndSaveMovieGenres(movie);
                count++;

                if (count % KEYWORD_GENRE_SLEEP_MOD == 0) {
                    log.info("장르 API 호출 조절을 위해 잠시 대기 ({}ms)... (처리 건수: {})", SLEEP_INTERVAL_MILLIS, count);
                    sleep(SLEEP_INTERVAL_MILLIS);
                }
            } catch (Exception e) {
                log.error("영화 ID {} 장르 수집 중 오류 발생", movie.getMovieId(), e);
            }
        }
        log.info("=== 영화 장르 수집 종료 (처리 건수: {}) ===", count);
    }

    // 특정 영화의 장르 정보를 TMDB에서 가져와 DB에 저장하는 메서드
    private List<MovieGenreEntity> fetchAndSaveMovieGenres(MovieEntity movie) {
        // 영화 상세 정보 API를 다시 호출 (비효율적 - 개선 필요)
        Map<String, Object> detailResponse = tmdbApiClient.fetchMovieDetails(movie.getMovieId().toString());

        if (detailResponse == null || detailResponse.get("genres") == null) {
            log.warn("상세 API 응답 없음 또는 'genres' 필드 없음. 영화 ID: {}", movie.getMovieId());
            return List.of();
        }

        List<Map<String, Object>> genres = (List<Map<String, Object>>) detailResponse.get("genres");
        if (genres.isEmpty()) {
            return List.of();
        }

        // 중복 처리를 위해 Set 사용 (영화-장르 관계 복합 키 기준)
        Set<MovieGenreIdForEntity> genreIdSet = new LinkedHashSet<>();
        for (Map<String, Object> genre : genres) {
            Integer apiGenreId = (Integer) genre.get("id"); // TMDB 장르 ID

            // a. TMDB 장르 ID를 우리 서비스의 내부 장르 ID로 매핑
            Long serviceGenreId = mapApiGenreIdToServiceGenreId(apiGenreId);

            // b. 유효한 장르 ID만 처리 (99999L은 매핑 실패 또는 기타 장르)
            if (serviceGenreId != 99999L) {
                // 복합 키 생성 (영화 ID, 서비스 장르 ID)
                genreIdSet.add(new MovieGenreIdForEntity(movie.getMovieId(), serviceGenreId));
            } else {
                log.warn("매핑되지 않은 TMDB 장르 ID 발견: apiGenreId={}, 영화 ID: {}", apiGenreId, movie.getMovieId());
            }
        }

        List<MovieGenreEntity> genreEntities = new ArrayList<>();
        for (MovieGenreIdForEntity id : genreIdSet) {
            // MovieGenreEntity 는 복합 키와 영화 엔티티 참조를 가짐
            MovieGenreEntity genreEntity = new MovieGenreEntity(id, movie);
            // (참고: MovieGenreEntity 에 생성/수정 시각 필드가 있다면 여기서 설정 필요)
            genreEntities.add(genreEntity);
        }

        // 해당 영화의 장르 관계 정보들을 한 번에 저장
        if (!genreEntities.isEmpty()) {
            log.debug("DB 저장 시도 - 영화 ID {}의 장르 관계 {} 건", movie.getMovieId(), genreEntities.size());
            movieGenreCollectRepository.saveAll(genreEntities);
        }
        return genreEntities;
    }

    // TMDB 장르 ID를 우리 서비스의 장르 ID로 변환하는 메서드
    private Long mapApiGenreIdToServiceGenreId(int apiGenreId) {
        // switch 표현식 (Java 14+) 사용
        return switch (apiGenreId) {
            case 28, 12 -> 1L;   // 액션(28), 모험(12) -> 우리 서비스 장르 1L
            case 16 -> 2L;       // 애니메이션(16) -> 2L
            case 35 -> 3L;       // 코미디(35) -> 3L
            case 80 -> 4L;       // 범죄(80) -> 4L
            case 99 -> 5L;       // 다큐멘터리(99) -> 5L
            case 18, 10751 -> 6L;// 드라마(18), 가족(10751) -> 6L
            case 14 -> 7L;       // 판타지(14) -> 7L
            case 36 -> 8L;       // 역사(36) -> 8L
            case 10402 -> 9L;    // 음악(10402) -> 9L
            case 9648 -> 10L;    // 미스터리(9648) -> 10L
            case 10749 -> 11L;   // 로맨스(10749) -> 11L
            case 878 -> 12L;     // SF(878) -> 12L
            case 10770 -> 13L;   // TV 영화(10770) -> 13L (별도 처리 필요할 수도)
            case 27, 53 -> 14L;  // 공포(27), 스릴러(53) -> 14L
            case 10752 -> 15L;   // 전쟁(10752) -> 15L
            case 37 -> 16L;      // 서부(37) -> 16L
            default -> 99999L;   // 매핑되지 않은 장르는 특수 ID 반환 (또는 예외 발생 등 정책 결정 필요)
        };
        // (참고: 이 매핑 정보는 DB나 설정 파일 등으로 관리하는 것이 더 유연할 수 있습니다.)
    }

    // --- 4) 크루(감독, 배우) 정보 수집 ---
    public void collectMovieCrew() {
        log.info("=== 영화 크루(감독/배우) 수집 시작 ===");
        List<MovieEntity> movies = movieCollectRepository.findAll(); // 역시 대량 데이터 처리 시 주의
        log.info("크루 수집 대상 영화 {} 건", movies.size());

        // 크루(인물) 정보와 영화-크루 관계 정보를 분리해서 저장 준비
        List<MovieCrewEntity> crewEntitiesToSave = new ArrayList<>();
        List<MovieRCrewEntity> movieRCrewEntitiesToSave = new ArrayList<>();
        // (개선점) 중복된 인물(같은 배우/감독)이 여러 영화에 나올 경우, 인물 정보를 한 번만 저장하도록 처리 필요 (예: Map<ApiPersonId, MovieCrewEntity> 활용)
        // Set<Long> processedCrewApiIds = new HashSet<>(); // TMDB 인물 ID 기준 중복 체크용

        int movieCount = 0;
        for (MovieEntity movie : movies) {
            try {
                log.debug("크레딧 API 호출 - 영화 ID: {}", movie.getMovieId());
                Map<String, Object> creditsResponse = tmdbApiClient.fetchMovieCredits(movie.getMovieId());

                if (creditsResponse == null) {
                    log.warn("크레딧 API 응답 없음. 영화 ID: {}", movie.getMovieId());
                    continue; // 다음 영화로
                }

                // a. 출연진(Cast) 정보 처리
                List<Map<String, Object>> castList = (List<Map<String, Object>>) creditsResponse.get("cast");
                if (castList != null) {
                    for (Map<String, Object> cast : castList) {
                        // Long personApiId = ((Number) cast.get("id")).longValue(); // TMDB 인물 ID
                        // if (!processedCrewApiIds.contains(personApiId)) { // 중복 인물 저장 방지
                        MovieCrewEntity crewEntity = createMovieCrewEntityFromCast(cast); // 배우 정보 엔티티 생성
                        crewEntitiesToSave.add(crewEntity);
                        // processedCrewApiIds.add(personApiId);
                        // } else { crewEntity = existingCrewMap.get(personApiId); } // 기존 인물 정보 가져오기

                        MovieRCrewEntity rCrewEntity = createMovieRCrewEntity(movie, crewEntity); // 영화-배우 관계 엔티티 생성
                        movieRCrewEntitiesToSave.add(rCrewEntity);
                        log.trace("처리된 배우: 이름={}, 역할={}", crewEntity.getName(), crewEntity.getCharName());
                    }
                }

                // b. 제작진(Crew) 정보 처리 - 여기서는 '감독(Director)'만 추출
                List<Map<String, Object>> crewList = (List<Map<String, Object>>) creditsResponse.get("crew");
                if (crewList != null && !crewList.isEmpty()) {
                    // Stream API를 사용하여 'job'이 'Director'인 사람 필터링
                    Optional<Map<String, Object>> directorOpt = crewList.stream()
                            .filter(crew -> "Director".equals(crew.get("job")))
                            .findFirst(); // 감독이 여러 명일 수 있지만, 여기서는 첫 번째만 처리

                    if (directorOpt.isPresent()) {
                        Map<String, Object> directorMap = directorOpt.get();
                        // Long directorApiId = ((Number) directorMap.get("id")).longValue();
                        // if (!processedCrewApiIds.contains(directorApiId)) {
                        MovieCrewEntity directorEntity = createMovieCrewEntityForDirector(directorMap); // 감독 정보 엔티티 생성
                        crewEntitiesToSave.add(directorEntity);
                        // processedCrewApiIds.add(directorApiId);
                        // } else { directorEntity = existingCrewMap.get(directorApiId); }

                        MovieRCrewEntity rCrewEntity = createMovieRCrewEntity(movie, directorEntity); // 영화-감독 관계 엔티티 생성
                        movieRCrewEntitiesToSave.add(rCrewEntity);
                        log.trace("처리된 감독: 이름={}", directorEntity.getName());
                    }
                }

                movieCount++;
                // (개선점) 여기에도 Rate Limit 제어를 위한 sleep 로직 추가 필요
                // if (movieCount % SLEEP_MOD == 0) sleep(SLEEP_INTERVAL_MILLIS);

            } catch (Exception e) {
                log.error("영화 ID {} 크루 수집 중 오류 발생", movie.getMovieId(), e);
            }
        }

        // c. 수집된 크루 정보와 관계 정보를 DB에 일괄 저장
        // (개선점) crewEntitiesToSave 에 중복된 인물이 있을 수 있음. saveAll 전에 중복 제거 로직 필요.
        // Map<MovieCrewId, MovieCrewEntity> uniqueCrewMap = crewEntitiesToSave.stream().collect(Collectors.toMap(MovieCrewEntity::getMovieCrewId, Function.identity(), (existing, replacement) -> existing));
        // movieCrewJpaRepository.saveAll(uniqueCrewMap.values());
        if (!crewEntitiesToSave.isEmpty()) {
            log.info("DB 저장 시도 - 크루(인물) 정보 {} 건", crewEntitiesToSave.size());
            // 실제로는 중복 인물 처리 후 저장 필요!
            movieCrewJpaRepository.saveAll(crewEntitiesToSave);
        }
        if (!movieRCrewEntitiesToSave.isEmpty()) {
            log.info("DB 저장 시도 - 영화-크루 관계 정보 {} 건", movieRCrewEntitiesToSave.size());
            movieRCrewJpaRepository.saveAll(movieRCrewEntitiesToSave);
        }

        log.info("=== 영화 크루(감독/배우) 수집 종료 (처리 영화 수: {}) ===", movieCount);
    }

    // Cast 정보(Map)로부터 MovieCrewEntity(배우) 객체를 생성하는 메서드
    private MovieCrewEntity createMovieCrewEntityFromCast(Map<String, Object> cast) {
        MovieCrewId crewId = IdFactory.createMovieCrewId(); // 우리 시스템 고유 ID 생성
        String name = (String) cast.get("name");
        MovieRole role = MovieRole.CAST; // 역할: 배우
        String charName = (String) cast.get("character"); // 배역 이름
        // 프로필 이미지 경로 (null 처리 및 전체 URL 생성)
        String profileImgUrl = Optional.ofNullable((String) cast.get("profile_path"))
                                 .map(path -> "http://image.tmdb.org/t/p/w185" + path) // 적절한 사이즈 사용
                                 .orElse(null);
        int orderNo = (Integer) cast.getOrDefault("order", 999); // 출연 순서 (없으면 큰 값)

        // TODO: 동일 인물(같은 TMDB ID)에 대해 중복 생성되지 않도록 로직 추가 필요
        // 예: Map<Long, MovieCrewId> tmdbIdToOurIdMap;

        return MovieCrewEntity.builder()
                .movieCrewId(crewId)
                // .tmdbPersonId(((Number) cast.get("id")).longValue()) // TMDB 인물 ID도 저장하면 좋음
                .name(name)
                .role(role)
                .charName(charName)
                .profileImgUrl(profileImgUrl)
                .orderNo(orderNo)
                // .regDt(LocalDateTime.now()) ... // 생성/수정 시각 설정
                .build();
    }

    // Crew 정보(Map)로부터 MovieCrewEntity(감독) 객체를 생성하는 메서드
    private MovieCrewEntity createMovieCrewEntityForDirector(Map<String, Object> crew) {
        MovieCrewId crewId = IdFactory.createMovieCrewId();
        String name = (String) crew.get("name");
        MovieRole role = MovieRole.DIRECTOR; // 역할: 감독
        String charName = null; // 감독은 배역명이 없음
        String profileImgUrl = Optional.ofNullable((String) crew.get("profile_path"))
                                 .map(path -> "http://image.tmdb.org/t/p/w185" + path)
                                 .orElse(null);
        int orderNo = -1; // 감독은 출연 순서가 의미 없으므로 특수값 사용

        // TODO: 동일 인물 중복 생성 방지 로직 추가 필요

        return MovieCrewEntity.builder()
                .movieCrewId(crewId)
                // .tmdbPersonId(((Number) crew.get("id")).longValue())
                .name(name)
                .role(role)
                .charName(charName)
                .profileImgUrl(profileImgUrl)
                .orderNo(orderNo)
                // .regDt(LocalDateTime.now()) ...
                .build();
    }

    // 영화와 크루(인물) 사이의 N:M 관계를 나타내는 MovieRCrewEntity 객체를 생성하는 메서드
    private MovieRCrewEntity createMovieRCrewEntity(MovieEntity movie, MovieCrewEntity crewEntity) {
        // 복합 키 생성 (영화 ID, 크루 ID)
        MovieRCrewIdForEntity rCrewId = new MovieRCrewIdForEntity(movie.getMovieId(), crewEntity.getMovieCrewId());
        // 관계 엔티티 생성 (복합키, 크루 엔티티 참조, 영화 엔티티 참조)
        return new MovieRCrewEntity(rCrewId, crewEntity, movie);
        // (참고: 이 엔티티에도 생성/수정 시각 필드가 있다면 설정 필요)
    }

    // --- 기타 유틸리티 메서드 ---

    // 지정된 시간(밀리초) 동안 현재 스레드를 잠시 멈추는 메서드 (Rate Limiting 용도)
    private void sleep(int millis) {
        try {
            Thread.sleep(millis);
        } catch (InterruptedException e) {
            // InterruptedException 발생 시, 현재 스레드의 인터럽트 상태를 다시 설정하는 것이 좋음
            Thread.currentThread().interrupt();
            // 또는 로깅 후 무시하거나, 애플리케이션 정책에 따라 처리
            log.warn("Thread sleep 중 InterruptedException 발생", e);
            // 여기서는 RuntimeException으로 감싸서 전파하지만, 상황에 따라 다른 처리 가능
            throw new RuntimeException(e);
        }
    }

}
```

### 핵심 로직 해부 🔬

1.  **영화 목록 수집 (`collectDiscoverMovies`)**:

    - `TmdbApiClient.fetchDiscoverMovies()`로 영화 목록(페이지 단위)을 가져옵니다.
    - **중요**: 목록의 각 영화마다 `fetchMovieDetails()`를 또 호출합니다. 이는 **N+1 API 호출 문제**를 야기합니다. 영화 20개 목록을 가져오면, 상세 정보 호출까지 총 1 + 20 = 21번의 API 호출이 발생합니다. TMDB는 Rate Limit(단위 시간당 호출 횟수 제한)이 있으므로, 대량 수집 시 문제가 될 수 있습니다.
      - **개선 방안**: 상세 정보 수집은 별도의 배치(Batch) 작업으로 분리하거나, 필요한 최소 정보만 Discover 단계에서 얻고 나머지는 나중에 채우는 전략을 고려해야 합니다.
    - `convertToMovieEntity()`: API 응답 `Map`을 `MovieEntity` 객체로 변환합니다. 이 과정에서 필드 누락, 타입 불일치, 날짜 형식 오류 등 다양한 예외 상황이 발생할 수 있으므로 견고한 처리가 필요합니다. (`Optional`, `try-catch`, 기본값 설정 등)
    - 미래 개봉 영화는 `releaseDate.isAfter(today)` 조건으로 걸러냅니다. (서비스 정책)
    - `movieCollectRepository.saveAll()`: 변환된 `MovieEntity` 리스트를 DB에 한 번의 INSERT (또는 UPDATE) 쿼리로 저장합니다. 하나씩 `save()` 하는 것보다 성능상 훨씬 유리합니다.
    - `sleep()`: TMDB API 호출 제한을 피하기 위해 주기적으로 `Thread.sleep()`을 호출합니다. 가장 간단한 방법이지만, 더 정교한 Rate Limiter 라이브러리(예: Resilience4j) 사용을 고려할 수 있습니다.

2.  **키워드 수집 (`collectMovieKeywords`)**:

    - `movieCollectRepository.findAll()`: DB에 저장된 **모든** 영화를 조회합니다. 영화 수가 수만 건 이상으로 많아지면 **OutOfMemoryError**가 발생할 수 있습니다!
      - **개선 방안**: 페이징(Paging) 기법을 사용하거나 (`Pageable` 인터페이스 활용), Spring Batch의 `JpaPagingItemReader` 등을 사용하여 대량의 데이터를 안전하게 처리해야 합니다.
    - 각 영화에 대해 `fetchAndSaveMovieKeywords()`를 호출합니다.
    - `fetchAndSaveMovieKeywords()`: `tmdbApiClient.fetchMovieKeywords()`로 키워드를 가져오고, `MovieTagEntity`를 생성하여 `movieTagRepository.saveAll()`로 저장합니다. `MovieTagEntity`는 영화와 키워드의 관계를 나타내며, 아마도 (영화 ID, 키워드 API ID)를 복합 키로 가질 것입니다.

3.  **장르 수집 (`collectMovieGenres`)**:

    - 키워드 수집과 마찬가지로 `findAll()`의 위험성을 내포합니다.
    - **중요**: 현재 로직은 각 영화마다 `fetchMovieDetails()`를 **다시 호출**하여 장르 정보를 가져옵니다. 이는 매우 비효율적입니다.
      - **개선 방안**: Discover 수집 단계에서 얻은 상세 정보를 활용하거나, `MovieEntity`에 TMDB 장르 ID 목록을 임시 저장했다가 이 단계에서 매핑만 처리하는 것이 좋습니다.
    - `mapApiGenreIdToServiceGenreId()`: TMDB의 장르 ID를 우리 서비스 내부에서 사용하는 장르 ID 체계로 **매핑**합니다. 이는 외부 시스템(TMDB)의 변화가 우리 시스템 내부에 직접적인 영향을 미치지 않도록 하는 중요한 단계입니다. `switch` 표현식을 사용했는데, 이 매핑 정보는 DB나 설정 파일로 관리하는 것이 더 유연합니다.
    - `LinkedHashSet`: 중복된 장르 관계가 저장되는 것을 방지합니다.
    - `movieGenreCollectRepository.saveAll()`: 영화와 매핑된 서비스 장르 ID 관계(`MovieGenreEntity`)를 저장합니다.

4.  **크루(감독, 배우) 수집 (`collectMovieCrew`)**:
    - 역시 `findAll()`의 위험성을 가집니다.
    - `tmdbApiClient.fetchMovieCredits()`: 영화의 출연진(`cast`)과 제작진(`crew`) 정보를 한 번에 가져옵니다.
    - **Cast 처리**: `cast` 리스트를 순회하며 배우 정보를 `MovieCrewEntity`로 만듭니다. 이때 `MovieRole`을 `CAST`로 설정합니다.
    - **Crew 처리 (감독)**: `crew` 리스트에서 `job`이 "Director"인 사람을 찾아 `MovieCrewEntity`로 만듭니다. `MovieRole`은 `DIRECTOR`로 설정합니다.
    - `createMovieCrewEntity...()`: Cast/Crew 정보를 바탕으로 `MovieCrewEntity`(인물 정보)를 생성합니다. **중요**: 현재 코드는 같은 배우나 감독이 여러 영화에 등장할 경우, `MovieCrewEntity`가 **중복 생성**될 수 있습니다.
      - **개선 방안**: TMDB 인물 ID(`cast.get("id")`, `crew.get("id")`)를 기준으로 이미 처리된 인물인지 확인하고, 중복 생성을 피해야 합니다. `Map<Long, MovieCrewEntity>` 등을 사용하여 TMDB ID로 기존 엔티티를 관리하는 방식이 필요합니다.
    - `createMovieRCrewEntity()`: 영화(`MovieEntity`)와 인물(`MovieCrewEntity`) 사이의 **N:M 관계**를 표현하는 `MovieRCrewEntity`(매핑 테이블용 엔티티)를 생성합니다.
    - `movieCrewJpaRepository.saveAll()` / `movieRCrewJpaRepository.saveAll()`: 수집된 인물 정보와 영화-인물 관계 정보를 각각 일괄 저장합니다. (인물 정보 저장 시 중복 제거 후 저장해야 함!)

#### 기타 팁 및 주의사항 ⚠️

- **트랜잭션 관리 (`@Transactional`)**: `saveAll`과 같은 여러 DB 작업을 하나의 논리적인 단위로 묶어줍니다. 중간에 오류가 발생하면 모든 작업이 롤백되어 데이터 일관성을 유지하는 데 중요합니다.
- **ID 생성 (`IdFactory`)**: `MovieCrewId`와 같이 서비스 내부에서 사용할 고유 ID를 생성하는 로직이 필요합니다. UUID를 사용하거나, 별도의 시퀀스 전략을 사용할 수 있습니다.
- **데이터 품질**: TMDB 데이터에도 누락되거나 잘못된 정보가 있을 수 있습니다. 수집 과정에서 기본적인 유효성 검사(null 체크, 형식 체크 등)를 추가하고, 필요하다면 데이터 정제(Data Cleansing) 로직을 고려해야 합니다.
- **성능 및 확장성**: 현재 방식은 간단하지만, 수집할 영화 수가 많아지면 성능 문제가 발생할 가능성이 높습니다 (N+1 API 호출, `findAll()` 사용 등).
  - **병렬 처리**: `@Async` 어노테이션을 사용한 비동기 메서드 호출, `CompletableFuture`, 또는 `Project Reactor` / `RxJava` 등을 이용해 API 호출 및 데이터 처리를 병렬화할 수 있습니다.
  - **배치 처리**: 대규모 데이터 처리에 특화된 **Spring Batch** 프레임워크 도입을 적극 고려해볼 만합니다. 안정적인 대용량 데이터 읽기/처리/쓰기, 재시도, 로깅, 트랜잭션 관리 등을 체계적으로 지원합니다.
  - **메시지 큐**: API 호출 요청을 메시지 큐(예: RabbitMQ, Kafka)에 넣고, 별도의 워커(Worker) 프로세스들이 큐에서 작업을 가져와 처리하는 방식으로 분산 처리 및 Rate Limit 제어를 더 유연하게 할 수 있습니다.

---

## 전체 소스 코드 묶음 📦

> 위에서 설명한 주요 클래스들의 전체 코드를 다시 한번 정리했습니다.

### `MovieCollectionController.java`

```java
// (위에 제시된 코드와 동일)
package movlit.be.data_collection.movie;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import movlit.be.movie_collect.application.service.MovieCollectionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/collect/movie")
@RequiredArgsConstructor
@Slf4j
public class MovieCollectionController {

    private final MovieCollectionService movieCollectionService;

    @GetMapping("/discover")
    public ResponseEntity<Void> collectDiscoverMovies() {
        log.info("GET /collect/movie/discover 요청 수신");
        movieCollectionService.collectDiscoverMovies();
        log.info("collectDiscoverMovies 작업 완료 응답");
        return ResponseEntity.ok().build();
    }

    @GetMapping("/keywords")
    public ResponseEntity<Void> collectMovieKeywords() {
        log.info("GET /collect/movie/keywords 요청 수신");
        movieCollectionService.collectMovieKeywords();
        log.info("collectMovieKeywords 작업 완료 응답");
        return ResponseEntity.ok().build();
    }

    @GetMapping("/genres")
    public ResponseEntity<Void> collectMovieGenres() {
        log.info("GET /collect/movie/genres 요청 수신");
        movieCollectionService.collectMovieGenres();
        log.info("collectMovieGenres 작업 완료 응답");
        return ResponseEntity.ok().build();
    }

    @GetMapping("/discover/crew") // TODO: URL 변경 고려
    public ResponseEntity<Void> collectMovieCrew() {
        log.info("GET /collect/movie/discover/crew 요청 수신");
        movieCollectionService.collectMovieCrew();
        log.info("collectMovieCrew 작업 완료 응답");
        return ResponseEntity.ok().build();
    }

}
```

### `TmdbApiClient.java`

```java
package movlit.be.movie_collect.application;

@Component
@Slf4j // 로깅 추가
public class TmdbApiClient {

    private final RestTemplate restTemplate;
    private final String apiKey;

    private static final String BASE_URL = "https://api.themoviedb.org/3";
    private static final String LANGUAGE_KO = "ko-KR"; // 언어 코드
    private static final String REGION_KR = "KR";       // 지역 코드
    // ... (다른 상수들)
    private static final String SORT_BY_POPULARITY = "popularity.desc";

    public TmdbApiClient(RestTemplateBuilder builder,
                         @Value("${tmdb.key}") String apiKey,
                         @Value("${tmdb.accessToken}") String accessToken) { // AccessToken 사용 여부 확인 필요
        this.apiKey = apiKey;
        // AccessToken 헤더 설정 (필요한 경우)
        // HttpHeaders headers = new HttpHeaders();
        // headers.setBearerAuth(accessToken);
        // builder = builder.defaultHeaders(headers);

        this.restTemplate = builder.build();
        this.restTemplate.getMessageConverters().add(0, new StringHttpMessageConverter(StandardCharsets.UTF_8));
    }

    public List<Map<String, Object>> fetchDiscoverMovies(String page) {
        // UriComponentsBuilder 사용 예시 (더 권장됨)
        String url = BASE_URL + "/discover/movie";
        // String url = UriComponentsBuilder.fromHttpUrl(BASE_URL).path("/discover/movie")
        //         .queryParam("api_key", apiKey)
        //         .queryParam("page", page)
        //         .queryParam("language", LANGUAGE_KO)
        //         .queryParam("region", REGION_KR)
        //         .queryParam("include_adult", "false")
        //         .queryParam("release_date.gte", "2023-01-01") // 값은 설정 파일 등에서 관리 가능
        //         .queryParam("release_date.lte", "2024-12-31")
        //         .queryParam("sort_by", SORT_BY_POPULARITY)
        //         .toUriString();
         String url_legacy = "https://api.themoviedb.org/3/discover/movie?api_key=" + apiKey +
                 "&page=" + page + "&language=" + LANGUAGE_KO + "&region=" + REGION_KR + "&include_adult=false" +
                 "&release_date.gte=2023-01-01&release_date.lte=2024-12-31&sort_by=" + SORT_BY_POPULARITY; // 레거시 방식 URL


        try {
            Map<String, Object> response = restTemplate.getForObject(url_legacy, Map.class);
            if (response == null || response.get("results") == null) {
                log.warn("TMDB Discover API 응답 결과 또는 results 필드 null. URL: {}", url_legacy);
                return Collections.emptyList(); // 빈 Immutable 리스트 반환
            }
            // 타입 안정성을 위해 List<?> 로 받고, 내부에서 캐스팅 검사하는 것이 더 안전할 수 있음
            return (List<Map<String, Object>>) response.get("results");
        } catch (RestClientException e) {
            log.error("TMDB Discover API 호출 중 오류 발생. URL: {}", url_legacy, e);
            return Collections.emptyList(); // 오류 시 빈 리스트 반환 (정책에 따라 null 또는 예외 던지기 가능)
        }
    }

    public Map<String, Object> fetchMovieDetails(String apiId) {
        String url = BASE_URL + "/movie/" + apiId + "?api_key=" + apiKey + "&language=" + LANGUAGE_KO;
        try {
            return restTemplate.getForObject(url, Map.class);
        } catch (RestClientException e) {
            log.error("TMDB Movie Detail API 호출 중 오류 발생. Movie ID: {}", apiId, e);
            return null; // 오류 시 null 반환 (또는 예외)
        }
    }

    public Map<String, Object> fetchMovieKeywords(Long movieId) {
        String url = BASE_URL + "/movie/" + movieId + "/keywords?api_key=" + apiKey;
        try {
            return restTemplate.getForObject(url, Map.class);
        } catch (RestClientException e) {
            log.error("TMDB Movie Keywords API 호출 중 오류 발생. Movie ID: {}", movieId, e);
            return null;
        }
    }

    public Map<String, Object> fetchMovieCredits(Long movieId) {
        String url = BASE_URL + "/movie/" + movieId + "/credits?api_key=" + apiKey + "&language=" + LANGUAGE_KO;
        try {
            return restTemplate.getForObject(url, Map.class);
        } catch (RestClientException e) {
            log.error("TMDB Movie Credits API 호출 중 오류 발생. Movie ID: {}", movieId, e);
            return null;
        }
    }
}
```

### `MovieCollectionService.java`

```java
package movlit.be.movie_collect.application.service;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class MovieCollectionService {

    private final TmdbApiClient tmdbApiClient;
    private final MovieCollectRepository movieCollectRepository;
    private final MovieTagRepository movieTagRepository;
    private final MovieGenreCollectRepository movieGenreCollectRepository;
    private final MovieCrewJpaRepository movieCrewJpaRepository;
    private final MovieRCrewJpaRepository movieRCrewJpaRepository;
    private final MovieHeartCountService movieHeartCountService;

    private static final int MAX_DISCOVER_PAGE = 5; // 설정 파일로 관리 가능
    private static final int DISCOVER_SLEEP_MOD = 2;
    private static final int KEYWORD_GENRE_SLEEP_MOD = 40;
    private static final int SLEEP_INTERVAL_MILLIS = 1000; // 1초

    // --- 1) Discover 영화 수집 ---
    public void collectDiscoverMovies() {
        log.info("=== 영화 목록(Discover) 수집 시작 ===");
        for (int i = 1; i <= MAX_DISCOVER_PAGE; i++) {
            log.info("Discover API 호출 - 페이지: {}", i);
            List<Map<String, Object>> discoverResults = tmdbApiClient.fetchDiscoverMovies(String.valueOf(i));
            if (discoverResults.isEmpty()) {
                log.info("Discover API 결과 없음. 수집 중단. (페이지: {})", i);
                break;
            }

            List<MovieEntity> movieEntities = new ArrayList<>();
            for (Map<String, Object> result : discoverResults) {
                String apiId = String.valueOf(result.get("id"));
                // TODO: N+1 API 호출 문제 해결 필요! (상세 정보는 별도 배치로 분리하거나, 최소 정보만 사용)
                log.debug("Movie Detail API 호출 - 영화 ID: {}", apiId);
                Map<String, Object> detailResult = tmdbApiClient.fetchMovieDetails(apiId);
                try {
                    MovieEntity movie = convertToMovieEntity(result, detailResult);
                    if (movie != null) {
                        movieEntities.add(movie);
                        log.debug("영화 처리 완료 (DB 저장 대기): ID={}, 제목={}", movie.getMovieId(), movie.getTitle());
                    }
                } catch (Exception e) {
                    log.error("MovieEntity 변환 중 예측 못한 오류 발생. Movie API ID: {}", apiId, e);
                    // 개별 영화 변환 실패 시 계속 진행
                }
            }

            if (!movieEntities.isEmpty()) {
                try {
                    log.info("DB 저장 시도 - {} 건의 영화 정보 (페이지: {})", movieEntities.size(), i);
                    movieCollectRepository.saveAll(movieEntities);
                } catch (DataAccessException e) { // JPA 관련 예외 처리
                    log.error("영화 정보 DB 저장 중 오류 발생 (페이지: {})", i, e);
                    // 필요시 예외 처리 정책 구현 (재시도, 로깅 후 무시 등)
                }
            }

            if (i % DISCOVER_SLEEP_MOD == 0 && i < MAX_DISCOVER_PAGE) { // 마지막 페이지 후에는 sleep 불필요
                log.info("Discover API 호출 조절을 위해 잠시 대기 ({}ms)...", SLEEP_INTERVAL_MILLIS);
                sleep(SLEEP_INTERVAL_MILLIS);
            }
        }
        log.info("=== 영화 목록(Discover) 수집 종료 ===");
    }

    private MovieEntity convertToMovieEntity(Map<String, Object> result, Map<String, Object> detailResult) {
        // 이 메서드 내부에 try-catch를 두어 개별 변환 오류가 전체를 멈추지 않게 함
        try {
            Integer id = (Integer) result.get("id");
            if (id == null) {
                log.warn("API 응답에 영화 ID가 없습니다. result: {}", result);
                return null; // ID 없으면 처리 불가
            }

            LocalDate today = LocalDate.now();
            // ... (null 체크 및 타입 캐스팅 강화)
            String title = (String) result.get("title");
            String originalTitle = (String) result.get("original_title");
            String overview = (String) result.get("overview");
            Double popularity = result.get("popularity") != null ? ((Number) result.get("popularity")).doubleValue() : 0.0;

            String posterPath = Optional.ofNullable(result.get("poster_path")).map(String::valueOf).filter(s -> !s.isEmpty()).map(path -> "http://image.tmdb.org/t/p/original" + path).orElse(null);
            String backdropPath = Optional.ofNullable(result.get("backdrop_path")).map(String::valueOf).filter(s -> !s.isEmpty()).map(path -> "http://image.tmdb.org/t/p/original" + path).orElse(null);

            String releaseDateStr = (String) result.get("release_date");
            LocalDate releaseDate = null;
            if (releaseDateStr != null && !releaseDateStr.trim().isEmpty()) {
                try {
                    releaseDate = LocalDate.parse(releaseDateStr, DateTimeFormatter.ISO_LOCAL_DATE);
                } catch (DateTimeParseException e) {
                    log.warn("개봉일({}) 파싱 실패. Movie ID: {}", releaseDateStr, id);
                }
            }

            if (releaseDate != null && releaseDate.isAfter(today)) {
                log.debug("미래 개봉 영화 스킵: movieId={}, releaseDate={}", id, releaseDate);
                return null;
            }

            String originalLanguage = (String) result.get("original_language");
            Long voteCount = result.get("vote_count") != null ? ((Number) result.get("vote_count")).longValue() : 0L;
            Double voteAverage = result.get("vote_average") != null ? ((Number) result.get("vote_average")).doubleValue() : 0.0;

            String productionCountry = "미확인";
            Integer runtime = null;
            String status = null;
            String tagline = null;

            if (detailResult != null) {
                // 상세 정보에서 값 추출 (null 체크 강화)
                Object countriesObj = detailResult.get("production_countries");
                if (countriesObj instanceof List && !((List<?>) countriesObj).isEmpty()) {
                    Map<?, ?> firstCountry = (Map<?, ?>) ((List<?>) countriesObj).get(0);
                    productionCountry = ProductionCountry.getNameFromCode(String.valueOf(firstCountry.get("iso_3166_1")));
                }
                runtime = detailResult.get("runtime") != null ? ((Number) detailResult.get("runtime")).intValue() : null;
                status = (String) detailResult.get("status");
                tagline = (String) detailResult.get("tagline");
            } else {
                 log.warn("영화 상세 정보(detailResult)가 null입니다. movieId={}", id);
            }


            MovieEntity movie = MovieEntity.builder()
                    .movieId(Long.valueOf(id))
                    .title(title)
                    .originalTitle(originalTitle)
                    .overview(overview)
                    .popularity(popularity)
                    .posterPath(posterPath)
                    .backdropPath(backdropPath)
                    .releaseDate(releaseDate)
                    .originalLanguage(originalLanguage)
                    .voteCount(voteCount)
                    .voteAverage(voteAverage)
                    .productionCountry(productionCountry)
                    .runtime(runtime)
                    .status(status)
                    .tagline(tagline)
                    .regDt(LocalDateTime.now())
                    .updDt(LocalDateTime.now())
                    .delYn(false)
                    .build();

            // 좋아요 카운트 초기화
            movieHeartCountService.save(MovieConvertor.toMovieHeartCountEntity(movie.getMovieId()));
            return movie;

        } catch (ClassCastException | NullPointerException e) {
            log.error("MovieEntity 변환 중 데이터 오류 발생. result={}, detailResult={}", result, detailResult, e);
            return null; // 오류 발생 시 null 반환
        }
    }

    // --- 2) 영화 키워드 수집 ---
    public void collectMovieKeywords() {
        log.info("=== 영화 키워드 수집 시작 ===");
        // TODO: findAll() 대신 페이징 처리 구현 필요!
        // Pageable pageable = PageRequest.of(0, 100); // 예: 100개씩 처리
        // Page<MovieEntity> moviePage;
        // do {
        //     moviePage = movieCollectRepository.findAll(pageable);
        //     processKeywordPage(moviePage.getContent());
        //     pageable = moviePage.nextPageable();
        // } while (moviePage.hasNext());

        List<MovieEntity> movies = movieCollectRepository.findAll(); // 임시 사용
        log.info("키워드 수집 대상 영화 {} 건", movies.size());
        int count = 0;
        for (MovieEntity movie : movies) {
            try {
                log.debug("키워드 API 호출 - 영화 ID: {}", movie.getMovieId());
                fetchAndSaveMovieKeywords(movie);
                count++;
                if (count % KEYWORD_GENRE_SLEEP_MOD == 0) {
                    log.info("키워드 API 호출 조절 대기 ({}ms)... (처리 건수: {})", SLEEP_INTERVAL_MILLIS, count);
                    sleep(SLEEP_INTERVAL_MILLIS);
                }
            } catch (Exception e) {
                log.error("영화 ID {} 키워드 수집 중 오류 발생", movie.getMovieId(), e);
            }
        }
        log.info("=== 영화 키워드 수집 종료 (처리 건수: {}) ===", count);
    }

    // private void processKeywordPage(List<MovieEntity> moviesInPage) { ... } // 페이징 처리 시 로직 분리

    private List<MovieTagEntity> fetchAndSaveMovieKeywords(MovieEntity movie) {
        Map<String, Object> keywordResponse = tmdbApiClient.fetchMovieKeywords(movie.getMovieId());
        if (keywordResponse == null || !(keywordResponse.get("keywords") instanceof List)) {
            log.warn("키워드 API 응답/형식 오류. 영화 ID: {}", movie.getMovieId());
            return Collections.emptyList();
        }

        List<Map<String, Object>> keywords = (List<Map<String, Object>>) keywordResponse.get("keywords");
        if (keywords.isEmpty()) return Collections.emptyList();

        List<MovieTagEntity> tagEntities = new ArrayList<>();
        for (Map<String, Object> keyword : keywords) {
             try {
                Long id = keyword.get("id") != null ? ((Number) keyword.get("id")).longValue() : null;
                String name = (String) keyword.get("name");
                if (id == null || name == null) continue; // 필수 정보 없으면 스킵

                MovieTagIdForEntity tagId = new MovieTagIdForEntity(id, movie.getMovieId());
                MovieTagEntity tag = MovieTagEntity.builder()
                        .movieTagIdForEntity(tagId)
                        .name(name)
                        .movieEntity(movie)
                        .regDt(LocalDateTime.now())
                        .updDt(LocalDateTime.now())
                        .delYn(false)
                        .build();
                tagEntities.add(tag);
             } catch (ClassCastException e) {
                 log.warn("키워드 데이터 형식 오류. 영화 ID: {}, 키워드 데이터: {}", movie.getMovieId(), keyword, e);
             }
        }

        if (!tagEntities.isEmpty()) {
            try {
                log.debug("DB 저장 시도 - 영화 ID {}의 키워드 {} 건", movie.getMovieId(), tagEntities.size());
                movieTagRepository.saveAll(tagEntities);
            } catch (DataAccessException e) {
                log.error("영화 키워드 DB 저장 중 오류 발생. 영화 ID: {}", movie.getMovieId(), e);
            }
        }
        return tagEntities;
    }


    // --- 3) 영화 장르 수집 ---
    public void collectMovieGenres() {
        log.info("=== 영화 장르 수집 시작 ===");
        // TODO: findAll() 대신 페이징 처리 구현 필요!
        List<MovieEntity> movies = movieCollectRepository.findAll();
        log.info("장르 수집 대상 영화 {} 건", movies.size());
        int count = 0;
        for (MovieEntity movie : movies) {
            try {
                // TODO: 상세 API 중복 호출 개선 필요! (Discover 단계 정보 재활용 등)
                log.debug("장르 정보 처리를 위해 상세 API 호출 - 영화 ID: {}", movie.getMovieId());
                fetchAndSaveMovieGenres(movie);
                count++;
                if (count % KEYWORD_GENRE_SLEEP_MOD == 0) {
                    log.info("장르 API 호출 조절 대기 ({}ms)... (처리 건수: {})", SLEEP_INTERVAL_MILLIS, count);
                    sleep(SLEEP_INTERVAL_MILLIS);
                }
            } catch (Exception e) {
                log.error("영화 ID {} 장르 수집 중 오류 발생", movie.getMovieId(), e);
            }
        }
        log.info("=== 영화 장르 수집 종료 (처리 건수: {}) ===", count);
    }

    private List<MovieGenreEntity> fetchAndSaveMovieGenres(MovieEntity movie) {
        Map<String, Object> detailResponse = tmdbApiClient.fetchMovieDetails(movie.getMovieId().toString());
        if (detailResponse == null || !(detailResponse.get("genres") instanceof List)) {
            log.warn("상세 API 응답/형식 오류 (장르). 영화 ID: {}", movie.getMovieId());
            return Collections.emptyList();
        }

        List<Map<String, Object>> genres = (List<Map<String, Object>>) detailResponse.get("genres");
        if (genres.isEmpty()) return Collections.emptyList();

        Set<MovieGenreIdForEntity> genreIdSet = new LinkedHashSet<>();
        for (Map<String, Object> genre : genres) {
            try {
                Integer apiGenreId = genre.get("id") != null ? ((Number) genre.get("id")).intValue() : null;
                if (apiGenreId == null) continue;

                Long serviceGenreId = mapApiGenreIdToServiceGenreId(apiGenreId);
                if (serviceGenreId != 99999L) { // 매핑된 경우만
                    genreIdSet.add(new MovieGenreIdForEntity(movie.getMovieId(), serviceGenreId));
                } else {
                    log.debug("매핑되지 않은 TMDB 장르 ID: apiGenreId={}, 영화 ID: {}", apiGenreId, movie.getMovieId());
                }
            } catch(ClassCastException e) {
                 log.warn("장르 데이터 형식 오류. 영화 ID: {}, 장르 데이터: {}", movie.getMovieId(), genre, e);
            }
        }

        if (!genreIdSet.isEmpty()) {
            List<MovieGenreEntity> genreEntities = new ArrayList<>();
            for (MovieGenreIdForEntity id : genreIdSet) {
                MovieGenreEntity genreEntity = new MovieGenreEntity(id, movie);
                // genreEntity.setRegDt(LocalDateTime.now()); // 필요시 설정
                genreEntities.add(genreEntity);
            }
            try {
                log.debug("DB 저장 시도 - 영화 ID {}의 장르 관계 {} 건", movie.getMovieId(), genreEntities.size());
                movieGenreCollectRepository.saveAll(genreEntities);
                return genreEntities;
            } catch (DataAccessException e) {
                log.error("영화 장르 관계 DB 저장 중 오류 발생. 영화 ID: {}", movie.getMovieId(), e);
            }
        }
        return Collections.emptyList();
    }

    // TMDB 장르 ID -> 서비스 장르 ID 매핑
    private Long mapApiGenreIdToServiceGenreId(int apiGenreId) {
        // (위에 제시된 코드와 동일)
        return switch (apiGenreId) {
            case 28, 12 -> 1L;   // 액션, 모험
            case 16 -> 2L;       // 애니메이션
            case 35 -> 3L;       // 코미디
            case 80 -> 4L;       // 범죄
            case 99 -> 5L;       // 다큐
            case 18, 10751 -> 6L;// 드라마, 가족
            case 14 -> 7L;       // 판타지
            case 36 -> 8L;       // 역사
            case 10402 -> 9L;    // 음악
            case 9648 -> 10L;    // 미스터리
            case 10749 -> 11L;   // 로맨스
            case 878 -> 12L;     // SF
            case 10770 -> 13L;   // TV 영화
            case 27, 53 -> 14L;  // 공포, 스릴러
            case 10752 -> 15L;   // 전쟁
            case 37 -> 16L;      // 서부
            default -> 99999L;   // 없는 장르
        };
        // TODO: 이 매핑 정보는 DB나 Enum으로 관리하는 것이 더 좋음
    }

    // --- 4) 크루(감독, 배우) 수집 ---
    public void collectMovieCrew() {
        log.info("=== 영화 크루(감독/배우) 수집 시작 ===");
        // TODO: findAll() 대신 페이징 처리 구현 필요!
        List<MovieEntity> movies = movieCollectRepository.findAll();
        log.info("크루 수집 대상 영화 {} 건", movies.size());

        // TODO: 중복 인물 처리 로직 강화 필요 (Map<Long, MovieCrewEntity> 활용 등)
        Map<Long, MovieCrewEntity> processedCrewMap = new HashMap<>(); // <TMDB Person ID, MovieCrewEntity>

        List<MovieRCrewEntity> movieRCrewEntitiesToSave = new ArrayList<>();
        int movieCount = 0;

        for (MovieEntity movie : movies) {
            try {
                log.debug("크레딧 API 호출 - 영화 ID: {}", movie.getMovieId());
                Map<String, Object> creditsResponse = tmdbApiClient.fetchMovieCredits(movie.getMovieId());
                if (creditsResponse == null) {
                     log.warn("크레딧 API 응답 없음. 영화 ID: {}", movie.getMovieId());
                     continue;
                }

                // a. Cast (배우) 처리
                if (creditsResponse.get("cast") instanceof List) {
                    List<Map<String, Object>> castList = (List<Map<String, Object>>) creditsResponse.get("cast");
                    for (Map<String, Object> cast : castList) {
                        try {
                            Long personApiId = cast.get("id") != null ? ((Number) cast.get("id")).longValue() : null;
                            if (personApiId == null) continue;

                            MovieCrewEntity crewEntity = processedCrewMap.computeIfAbsent(personApiId,
                                    id -> createMovieCrewEntityFromCast(cast, personApiId)); // 없으면 생성, 있으면 기존 것 사용

                            MovieRCrewEntity rCrewEntity = createMovieRCrewEntity(movie, crewEntity);
                            movieRCrewEntitiesToSave.add(rCrewEntity);
                        } catch (Exception e) { // 개별 cast 처리 오류
                             log.warn("Cast 처리 중 오류. 영화 ID: {}, Cast 데이터: {}", movie.getMovieId(), cast, e);
                        }
                    }
                }

                // b. Crew (감독) 처리
                if (creditsResponse.get("crew") instanceof List) {
                    List<Map<String, Object>> crewList = (List<Map<String, Object>>) creditsResponse.get("crew");
                     crewList.stream()
                        .filter(crew -> "Director".equals(crew.get("job")))
                        .findFirst() // 첫번째 감독만 처리 (정책에 따라 변경 가능)
                        .ifPresent(directorMap -> {
                            try {
                                Long directorApiId = directorMap.get("id") != null ? ((Number) directorMap.get("id")).longValue() : null;
                                if (directorApiId == null) return;

                                MovieCrewEntity directorEntity = processedCrewMap.computeIfAbsent(directorApiId,
                                        id -> createMovieCrewEntityForDirector(directorMap, directorApiId));

                                MovieRCrewEntity rCrewEntity = createMovieRCrewEntity(movie, directorEntity);
                                movieRCrewEntitiesToSave.add(rCrewEntity);
                            } catch (Exception e) { // 개별 director 처리 오류
                                log.warn("Director 처리 중 오류. 영화 ID: {}, Director 데이터: {}", movie.getMovieId(), directorMap, e);
                            }
                        });
                }

                movieCount++;
                // TODO: 여기에 Rate Limit 제어 sleep 추가 필요
                 if (movieCount % KEYWORD_GENRE_SLEEP_MOD == 0) { // 예시: 키워드/장르와 동일한 기준 사용
                     log.info("크레딧 API 호출 조절 대기 ({}ms)... (처리 영화 수: {})", SLEEP_INTERVAL_MILLIS, movieCount);
                     sleep(SLEEP_INTERVAL_MILLIS);
                 }

            } catch (Exception e) {
                log.error("영화 ID {} 크루 수집 중 오류 발생", movie.getMovieId(), e);
            }
        }

        // c. 최종 저장 (중복 제거된 인물 정보 + 관계 정보)
        if (!processedCrewMap.isEmpty()) {
            try {
                 // 새롭게 추가된 Crew만 필터링해서 저장하거나, Update 로직 고려 필요
                 // 여기서는 간단히 모든 processed된 Crew 저장 시도
                log.info("DB 저장 시도 - 유니크 크루(인물) 정보 {} 건", processedCrewMap.size());
                movieCrewJpaRepository.saveAll(processedCrewMap.values());
            } catch (DataAccessException e) {
                log.error("크루 정보 DB 저장 중 오류 발생", e);
            }
        }
        if (!movieRCrewEntitiesToSave.isEmpty()) {
             try {
                log.info("DB 저장 시도 - 영화-크루 관계 정보 {} 건", movieRCrewEntitiesToSave.size());
                movieRCrewJpaRepository.saveAll(movieRCrewEntitiesToSave);
             } catch (DataAccessException e) {
                 log.error("영화-크루 관계 정보 DB 저장 중 오류 발생", e);
             }
        }

        log.info("=== 영화 크루(감독/배우) 수집 종료 (처리 영화 수: {}) ===", movieCount);
    }

    // Cast 정보 -> MovieCrewEntity 변환 (중복 체크 로직 반영)
    private MovieCrewEntity createMovieCrewEntityFromCast(Map<String, Object> cast, Long personApiId) {
        MovieCrewId crewId = IdFactory.createMovieCrewId(); // 고유 ID 생성
        String name = (String) cast.get("name");
        MovieRole role = MovieRole.CAST;
        String charName = (String) cast.get("character");
        String profileImgUrl = Optional.ofNullable(cast.get("profile_path")).map(String::valueOf).filter(s -> !s.isEmpty()).map(path -> "http://image.tmdb.org/t/p/w185" + path).orElse(null);
        int orderNo = cast.get("order") != null ? ((Number) cast.get("order")).intValue() : 999;

        return MovieCrewEntity.builder()
                .movieCrewId(crewId)
                .tmdbPersonId(personApiId) // TMDB 인물 ID 저장
                .name(name)
                .role(role)
                .charName(charName)
                .profileImgUrl(profileImgUrl)
                .orderNo(orderNo)
                .regDt(LocalDateTime.now())
                .updDt(LocalDateTime.now())
                .build();
    }

    // Director 정보 -> MovieCrewEntity 변환 (중복 체크 로직 반영)
    private MovieCrewEntity createMovieCrewEntityForDirector(Map<String, Object> crew, Long personApiId) {
        MovieCrewId crewId = IdFactory.createMovieCrewId();
        String name = (String) crew.get("name");
        MovieRole role = MovieRole.DIRECTOR;
        String profileImgUrl = Optional.ofNullable(crew.get("profile_path")).map(String::valueOf).filter(s -> !s.isEmpty()).map(path -> "http://image.tmdb.org/t/p/w185" + path).orElse(null);

        return MovieCrewEntity.builder()
                .movieCrewId(crewId)
                .tmdbPersonId(personApiId) // TMDB 인물 ID 저장
                .name(name)
                .role(role)
                .profileImgUrl(profileImgUrl)
                .orderNo(-1) // 감독은 순서 의미 없음
                .regDt(LocalDateTime.now())
                .updDt(LocalDateTime.now())
                .build();
    }


    private MovieRCrewEntity createMovieRCrewEntity(MovieEntity movie, MovieCrewEntity crewEntity) {
        MovieRCrewIdForEntity rCrewId = new MovieRCrewIdForEntity(movie.getMovieId(), crewEntity.getMovieCrewId());
        // TODO: 이미 해당 관계가 존재하는지 확인하는 로직 추가 고려 (Unique 제약 조건 등 활용)
        return new MovieRCrewEntity(rCrewId, crewEntity, movie);
    }

    private void sleep(int millis) {
        try {
            Thread.sleep(millis);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            log.warn("Thread sleep 중 InterruptedException 발생", e);
            // throw new RuntimeException(e); // 필요시 예외 전파
        }
    }
}
```

---

## 정리

지금까지 Spring Boot와 JPA를 이용해 TMDB API에서 영화 데이터를 수집하고 우리 DB에 저장하는 기본적인 과정을 살펴봤습니다.

- **`MovieCollectionController`**: 외부 요청을 받아 데이터 수집 작업을 트리거합니다.
- **`TmdbApiClient`**: `RestTemplate` (또는 `WebClient`)을 사용해 TMDB API와 통신합니다. DTO 사용과 에러 처리 강화가 필요합니다.
- **`MovieCollectionService`**: 핵심 로직을 담당하며, API 데이터를 가공하고 JPA Repository를 통해 DB에 저장합니다. N+1 문제, `findAll()` 성능 이슈, 중복 데이터 처리 등 개선할 점이 많습니다.
- **`JpaRepository`**: `saveAll()` 등을 통해 효율적인 DB 작업을 지원합니다.
