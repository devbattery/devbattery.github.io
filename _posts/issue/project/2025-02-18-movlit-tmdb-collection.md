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
last_modified_at: 2025-02-21
---

> [Movlit 프로젝트](https://github.com/venus-lion/movlit-plus)에 대한 설명입니다.

## 개요

- **TMDB**: 영화, TV 시리즈 관련 데이터베이스 API를 무료로 제공.
- **Spring Boot**: REST API 서버를 빠르게 구축.
- **JpaRepository**: 수집된 데이터를 DB에 영속화.

아키텍처 개념도(간단 예시):

```
[TMDB API] <---> [TmdbApiClient] <---> [MovieCollectionService] <---> [JPA Repository] <---> [DB]
```

- **Controller**: 외부 호출(HTTP 요청) → Service 메서드 호출.
- **TmdbApiClient**: 외부 TMDB API 호출 담당.
- **Service**: 비즈니스 로직 & 데이터 처리.
- **Repository**: DB 저장.

---

## MovieCollectionController: API 엔드포인트

수집 로직을 실행하는 **HTTP GET 요청**을 정의하는 컨트롤러 클래스입니다.  
프론트엔드나 관리자 페이지에서 `GET /collect/movie/discover`처럼 호출하면 **TMDB 데이터가 DB에 저장**되는 구조입니다.

````java
```java
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
````

### 주요 포인트

- **각 메서드**는 `MovieCollectionService`의 해당 로직 메서드를 호출한 뒤, 단순히 `OK`(HTTP 200) 응답을 반환.
- 실제 데이터 수집/가공 로직은 **Service** 내부에 위치.

---

## TmdbApiClient: TMDB API 호출 클라이언트

**RestTemplate**를 사용해 TMDB 엔드포인트에 HTTP 요청을 보내고, 응답을 `Map` 혹은 `List<Map<String, Object>>` 형태로 받아옵니다.

````java
```java
package movlit.be.movie_collect.application;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.HttpHeaders;
import org.springframework.http.converter.StringHttpMessageConverter;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

@Component
public class TmdbApiClient {

    private final RestTemplate restTemplate;
    private final String apiKey;

    // API 호출에 사용할 상수
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
        this.restTemplate.getMessageConverters().add(
            0, new StringHttpMessageConverter(StandardCharsets.UTF_8)
        );
    }

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

    public Map<String, Object> fetchMovieDetails(String apiId) {
        String url = "https://api.themoviedb.org/3/movie/" + apiId + "?api_key=" + apiKey + "&language=ko-KR";
        return restTemplate.getForObject(url, Map.class);
    }

    public Map<String, Object> fetchMovieKeywords(Long movieId) {
        String url = "https://api.themoviedb.org/3/movie/" + movieId + "/keywords?api_key=" + apiKey;
        return restTemplate.getForObject(url, Map.class);
    }

    public Map<String, Object> fetchMovieCredits(Long movieId) {
        String url = "https://api.themoviedb.org/3/movie/" + movieId + "/credits?api_key=" + apiKey + LANGUAGE_KO;
        return restTemplate.getForObject(url, Map.class);
    }

}
````

### 주요 포인트

- **`@Value("${tmdb.key}")`**: `application.yml` 또는 환경변수에서 TMDB API 키를 주입받아 사용.
- `Bearer [accessToken]`을 사용한 인증 방식.
- 주요 메서드:
  - `fetchDiscoverMovies`: 인기 영화 목록(Discover) 호출.
  - `fetchMovieDetails`: 단일 영화 상세 정보.
  - `fetchMovieKeywords`: 영화 키워드.
  - `fetchMovieCredits`: 영화 출연진 및 스탭(감독, 작가 등) 정보.

> **Tip**: 에러 처리, 예외 처리를 더욱 견고하게 하려면 `try-catch` 또는 RestTemplate의 `ResponseErrorHandler`를 활용할 수 있습니다.

---

## MovieCollectionService: 수집 로직의 핵심 구현

`MovieCollectionService`는 다음 기능을 제공합니다.

1. **영화 목록 수집** (Discover)
2. **영화 키워드 수집**
3. **영화 장르 수집**
4. **크루(감독, 배우) 수집**

**비즈니스 로직**과 **DB 저장**(`JpaRepository.saveAll()`) 로직이 함께 들어있습니다.

````java
```java
package movlit.be.movie_collect.application.service;

import jakarta.transaction.Transactional;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import movlit.be.common.util.IdFactory;
import movlit.be.common.util.ids.MovieCrewId;
import movlit.be.movie.application.converter.detail.MovieConvertor;
import movlit.be.movie.domain.MovieRole;
import movlit.be.movie.domain.ProductionCountry;
import movlit.be.movie.domain.entity.*;
import movlit.be.movie.infra.persistence.jpa.MovieCrewJpaRepository;
import movlit.be.movie.infra.persistence.jpa.MovieRCrewJpaRepository;
import movlit.be.movie_collect.application.TmdbApiClient;
import movlit.be.movie_collect.infra.jpa.MovieCollectRepository;
import movlit.be.movie_collect.infra.jpa.MovieGenreCollectRepository;
import movlit.be.movie_collect.infra.jpa.MovieTagRepository;
import movlit.be.movie_heart_count.application.service.MovieHeartCountService;
import org.springframework.stereotype.Service;

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

    // 상수 정의
    private static final int MAX_DISCOVER_PAGE = 5;
    private static final int DISCOVER_SLEEP_MOD = 2;
    private static final int KEYWORD_GENRE_SLEEP_MOD = 40;
    private static final int SLEEP_INTERVAL_MILLIS = 1000;

    // 1) Discover 영화 수집
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

            // 페이지 진행 시, API 부하 줄이기 위해 일정 간격 sleep
            if (i % DISCOVER_SLEEP_MOD == 0) {
                sleep(SLEEP_INTERVAL_MILLIS);
            }
        }
    }

    private MovieEntity convertToMovieEntity(Map<String, Object> result, Map<String, Object> detailResult) {
        LocalDate today = LocalDate.now();
        Integer id = (Integer) result.get("id");
        String title = (String) result.get("title");
        String originalTitle = (String) result.get("original_title");
        String overview = (String) result.get("overview");
        Double popularity = (Double) result.get("popularity");

        String posterPath = Optional.ofNullable((String) result.get("poster_path")).orElse("");
        if (!posterPath.isEmpty()) {
            posterPath = "http://image.tmdb.org/t/p/original" + posterPath;
        }

        String backdropPath = Optional.ofNullable((String) result.get("backdrop_path")).orElse("");
        if (!backdropPath.isEmpty()) {
            backdropPath = "http://image.tmdb.org/t/p/original" + backdropPath;
        }

        String releaseDateStr = (String) result.get("release_date");
        LocalDate releaseDate = LocalDate.parse(releaseDateStr, DateTimeFormatter.ISO_LOCAL_DATE);
        if (releaseDate.isAfter(today)) {
            return null; // 미래 개봉 영화는 스킵
        }

        String originalLanguage = (String) result.get("original_language");
        Long voteCount = Long.valueOf((Integer) result.get("vote_count"));
        Double voteAverage = (Double) result.get("vote_average");

        // 제작 국가
        String productionCountry = "NONE";
        List<Map<String, Object>> productionCountries = (List<Map<String, Object>>) detailResult.get("production_countries");
        if (productionCountries != null && !productionCountries.isEmpty()) {
            productionCountry = ProductionCountry.getNameFromCode(
                (String) productionCountries.get(0).get("iso_3166_1")
            );
        }

        Integer runtime = (Integer) detailResult.get("runtime");
        String status = (String) detailResult.get("status");
        String tagline = (String) detailResult.get("tagline");

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

        // 하트(좋아요) 카운트를 별도 테이블에 저장
        movieHeartCountService.save(MovieConvertor.toMovieHeartCountEntity(movie.getMovieId()));
        return movie;
    }

    // 2) 키워드 수집
    public void collectMovieKeywords() {
        List<MovieEntity> movies = movieCollectRepository.findAll();
        int count = 0;
        for (MovieEntity movie : movies) {
            fetchAndSaveMovieKeywords(movie);
            count++;
            if (count % KEYWORD_GENRE_SLEEP_MOD == 0) {
                sleep(SLEEP_INTERVAL_MILLIS);
            }
            log.info("Processed keywords for movie id={}", movie.getMovieId());
        }
    }

    private List<MovieTagEntity> fetchAndSaveMovieKeywords(MovieEntity movie) {
        Map<String, Object> keywordResponse = tmdbApiClient.fetchMovieKeywords(movie.getMovieId());
        if (keywordResponse == null || keywordResponse.get("keywords") == null) {
            return List.of();
        }

        List<Map<String, Object>> keywords = (List<Map<String, Object>>) keywordResponse.get("keywords");
        List<MovieTagEntity> tagEntities = new ArrayList<>();
        for (Map<String, Object> keyword : keywords) {
            Long id = Long.valueOf((Integer) keyword.get("id"));
            String name = (String) keyword.get("name");
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
        }
        movieTagRepository.saveAll(tagEntities);
        return tagEntities;
    }

    // 3) 장르 수집
    public void collectMovieGenres() {
        List<MovieEntity> movies = movieCollectRepository.findAll();
        int count = 0;
        for (MovieEntity movie : movies) {
            fetchAndSaveMovieGenres(movie);
            count++;
            if (count % KEYWORD_GENRE_SLEEP_MOD == 0) {
                sleep(SLEEP_INTERVAL_MILLIS);
            }
            log.info("Processed genres for movie id={}", movie.getMovieId());
        }
    }

    private List<MovieGenreEntity> fetchAndSaveMovieGenres(MovieEntity movie) {
        Map<String, Object> detailResponse = tmdbApiClient.fetchMovieDetails(movie.getMovieId().toString());
        if (detailResponse == null) {
            return List.of();
        }
        List<Map<String, Object>> genres = (List<Map<String, Object>>) detailResponse.get("genres");
        if (genres == null) {
            return List.of();
        }
        Set<MovieGenreIdForEntity> genreIdSet = new LinkedHashSet<>();
        for (Map<String, Object> genre : genres) {
            Integer apiGenreId = (Integer) genre.get("id");
            Long genreId = mapApiGenreIdToServiceGenreId(apiGenreId);
            genreIdSet.add(new MovieGenreIdForEntity(movie.getMovieId(), genreId));
        }

        List<MovieGenreEntity> genreEntities = new ArrayList<>();
        for (MovieGenreIdForEntity id : genreIdSet) {
            MovieGenreEntity genreEntity = new MovieGenreEntity(id, movie);
            genreEntities.add(genreEntity);
        }
        movieGenreCollectRepository.saveAll(genreEntities);
        return genreEntities;
    }

    private Long mapApiGenreIdToServiceGenreId(int apiGenreId) {
        // TMDB 장르 ID -> 우리 서비스 장르 ID 매핑
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
    }

    // 4) 크루(감독, 배우) 수집
    public void collectMovieCrew() {
        List<MovieEntity> movies = movieCollectRepository.findAll();
        List<MovieCrewEntity> crewEntities = new ArrayList<>();
        List<MovieRCrewEntity> movieRCrewEntities = new ArrayList<>();

        for (MovieEntity movie : movies) {
            Map<String, Object> creditsResponse = tmdbApiClient.fetchMovieCredits(movie.getMovieId());
            // 캐스트
            List<Map<String, Object>> castList = (List<Map<String, Object>>) creditsResponse.get("cast");
            if (castList != null) {
                for (Map<String, Object> cast : castList) {
                    MovieCrewEntity crewEntity = createMovieCrewEntityFromCast(cast);
                    MovieRCrewEntity rCrewEntity = createMovieRCrewEntity(movie, crewEntity);
                    crewEntities.add(crewEntity);
                    movieRCrewEntities.add(rCrewEntity);
                    log.info("Processed cast member: {}", crewEntity.getName());
                }
            }
            // 크루(감독)
            List<Map<String, Object>> crewList = (List<Map<String, Object>>) creditsResponse.get("crew");
            if (crewList != null && !crewList.isEmpty()) {
                Optional<Map<String, Object>> directorOpt = crewList.stream()
                        .filter(crew -> "Director".equals(crew.get("job")))
                        .findFirst();
                if (directorOpt.isPresent()) {
                    Map<String, Object> directorMap = directorOpt.get();
                    MovieCrewEntity directorEntity = createMovieCrewEntityForDirector(directorMap);
                    MovieRCrewEntity rCrewEntity = createMovieRCrewEntity(movie, directorEntity);
                    crewEntities.add(directorEntity);
                    movieRCrewEntities.add(rCrewEntity);
                    log.info("Processed director: {}", directorEntity.getName());
                }
            }
        }
        // 일괄 저장
        movieCrewJpaRepository.saveAll(crewEntities);
        movieRCrewJpaRepository.saveAll(movieRCrewEntities);
    }

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

    private MovieCrewEntity createMovieCrewEntityForDirector(Map<String, Object> crew) {
        MovieCrewId crewId = IdFactory.createMovieCrewId();
        String name = (String) crew.get("name");
        MovieRole role = MovieRole.DIRECTOR;
        String charName = (String) crew.get("character");
        String profileImgUrl = (String) crew.get("profile_path");
        int orderNo = -1;

        return MovieCrewEntity.builder()
                .movieCrewId(crewId)
                .name(name)
                .role(role)
                .charName(charName)
                .profileImgUrl(profileImgUrl)
                .orderNo(orderNo)
                .build();
    }

    private MovieRCrewEntity createMovieRCrewEntity(MovieEntity movie, MovieCrewEntity crewEntity) {
        MovieRCrewIdForEntity rCrewId = new MovieRCrewIdForEntity(movie.getMovieId(), crewEntity.getMovieCrewId());
        return new MovieRCrewEntity(rCrewId, crewEntity, movie);
    }

    // 기타
    private void sleep(int millis) {
        try {
            Thread.sleep(millis);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException(e);
        }
    }

}
````

### 1) 영화 목록 수집 `collectDiscoverMovies()`

- **Discover API**를 통해 1페이지부터 최대 `MAX_DISCOVER_PAGE`(5)까지 영화 목록을 가져옵니다.
- 각 영화마다 상세 정보를 또 한 번 호출하여 제작 국가, 런타임 등의 추가 정보를 확보.
- **DB 저장**: `movieCollectRepository.saveAll(movieEntities)`.
- **미래 개봉 영화**는 현재 사용 목적상 스킵.

### 2) 키워드 수집 `collectMovieKeywords()`

- DB에 저장된 모든 영화(`MovieEntity`)를 대상으로 TMDB 키워드 목록 조회.
- `KEYWORD_GENRE_SLEEP_MOD`(40)개 단위로 Thread Sleep하여 API Rate Limit 완화.
- 수집한 키워드를 `MovieTagEntity` 형태로 DB에 저장.

### 3) 장르 수집 `collectMovieGenres()`

- `MovieEntity` 마다 `fetchMovieDetails`로부터 `genres` 목록을 받고, 서비스 내부 장르 ID로 매핑.
- 중복 제거를 위해 `LinkedHashSet` 사용.
- **스위치**를 통해 TMDB 장르 ID → 프로젝트 내 장르 ID 변환.

### 4) 크루(감독, 배우) 수집 `collectMovieCrew()`

- TMDB `credits` API로 캐스트(`cast`)와 크루(`crew`)를 분리해서 가져옴.
- **캐스트**는 `MovieRole.CAST`로, **감독**은 `MovieRole.DIRECTOR`로 저장.
- 각각을 `MovieCrewEntity`로 만들고, 영화와의 **N:M 관계**를 `MovieRCrewEntity`로 연결.

#### 기타 팁 및 주의사항

- 실제 TMDB API는 **사용량 제한**(Rate Limit)이 있으므로, 다량 호출 시 `sleep()`을 주거나 **별도 큐**로 처리 권장.
- 데이터 품질 보장(예: 중복, 유효성 검사, 없는 필드 처리) 로직도 고려해야 함.
- **병렬** 처리가 필요하다면 스레드 풀, `@Async` 또는 **Spring Batch**를 검토.

---

## 전체 소스 코드

> 아래는 본 글에서 다룬 주요 클래스의 전체 코드입니다.

### `MovieCollectionController.java`

```java
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

### `TmdbApiClient.java`

```java
package movlit.be.movie_collect.application;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.HttpHeaders;
import org.springframework.http.converter.StringHttpMessageConverter;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

@Component
public class TmdbApiClient {

    private final RestTemplate restTemplate;
    private final String apiKey;

    // API 호출에 사용할 상수
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
        this.restTemplate.getMessageConverters().add(
            0, new StringHttpMessageConverter(StandardCharsets.UTF_8)
        );
    }

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

    public Map<String, Object> fetchMovieDetails(String apiId) {
        String url = "https://api.themoviedb.org/3/movie/" + apiId + "?api_key=" + apiKey + "&language=ko-KR";
        return restTemplate.getForObject(url, Map.class);
    }

    public Map<String, Object> fetchMovieKeywords(Long movieId) {
        String url = "https://api.themoviedb.org/3/movie/" + movieId + "/keywords?api_key=" + apiKey;
        return restTemplate.getForObject(url, Map.class);
    }

    public Map<String, Object> fetchMovieCredits(Long movieId) {
        String url = "https://api.themoviedb.org/3/movie/" + movieId + "/credits?api_key=" + apiKey + LANGUAGE_KO;
        return restTemplate.getForObject(url, Map.class);
    }

}
```

### `MovieCollectionService.java`

```java
package movlit.be.movie_collect.application.service;

import jakarta.transaction.Transactional;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import movlit.be.common.util.IdFactory;
import movlit.be.common.util.ids.MovieCrewId;
import movlit.be.movie.application.converter.detail.MovieConvertor;
import movlit.be.movie.domain.MovieRole;
import movlit.be.movie.domain.ProductionCountry;
import movlit.be.movie.domain.entity.*;
import movlit.be.movie.infra.persistence.jpa.MovieCrewJpaRepository;
import movlit.be.movie.infra.persistence.jpa.MovieRCrewJpaRepository;
import movlit.be.movie_collect.application.TmdbApiClient;
import movlit.be.movie_collect.infra.jpa.MovieCollectRepository;
import movlit.be.movie_collect.infra.jpa.MovieGenreCollectRepository;
import movlit.be.movie_collect.infra.jpa.MovieTagRepository;
import movlit.be.movie_heart_count.application.service.MovieHeartCountService;
import org.springframework.stereotype.Service;

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

    // 상수 정의
    private static final int MAX_DISCOVER_PAGE = 5;
    private static final int DISCOVER_SLEEP_MOD = 2;
    private static final int KEYWORD_GENRE_SLEEP_MOD = 40;
    private static final int SLEEP_INTERVAL_MILLIS = 1000;

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

    private MovieEntity convertToMovieEntity(Map<String, Object> result, Map<String, Object> detailResult) {
        LocalDate today = LocalDate.now();
        Integer id = (Integer) result.get("id");
        String title = (String) result.get("title");
        String originalTitle = (String) result.get("original_title");
        String overview = (String) result.get("overview");
        Double popularity = (Double) result.get("popularity");

        String posterPath = Optional.ofNullable((String) result.get("poster_path")).orElse("");
        if (!posterPath.isEmpty()) {
            posterPath = "http://image.tmdb.org/t/p/original" + posterPath;
        }

        String backdropPath = Optional.ofNullable((String) result.get("backdrop_path")).orElse("");
        if (!backdropPath.isEmpty()) {
            backdropPath = "http://image.tmdb.org/t/p/original" + backdropPath;
        }

        String releaseDateStr = (String) result.get("release_date");
        LocalDate releaseDate = LocalDate.parse(releaseDateStr, DateTimeFormatter.ISO_LOCAL_DATE);
        if (releaseDate.isAfter(today)) {
            return null; // 미래 개봉 영화 스킵
        }

        String originalLanguage = (String) result.get("original_language");
        Long voteCount = Long.valueOf((Integer) result.get("vote_count"));
        Double voteAverage = (Double) result.get("vote_average");

        String productionCountry = "NONE";
        List<Map<String, Object>> productionCountries = (List<Map<String, Object>>) detailResult.get("production_countries");
        if (productionCountries != null && !productionCountries.isEmpty()) {
            productionCountry = ProductionCountry.getNameFromCode(
                (String) productionCountries.get(0).get("iso_3166_1")
            );
        }
        Integer runtime = (Integer) detailResult.get("runtime");
        String status = (String) detailResult.get("status");
        String tagline = (String) detailResult.get("tagline");

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

        movieHeartCountService.save(MovieConvertor.toMovieHeartCountEntity(movie.getMovieId()));
        return movie;
    }

    public void collectMovieKeywords() {
        List<MovieEntity> movies = movieCollectRepository.findAll();
        int count = 0;
        for (MovieEntity movie : movies) {
            fetchAndSaveMovieKeywords(movie);
            count++;
            if (count % KEYWORD_GENRE_SLEEP_MOD == 0) {
                sleep(SLEEP_INTERVAL_MILLIS);
            }
            log.info("Processed keywords for movie id={}", movie.getMovieId());
        }
    }

    private List<MovieTagEntity> fetchAndSaveMovieKeywords(MovieEntity movie) {
        Map<String, Object> keywordResponse = tmdbApiClient.fetchMovieKeywords(movie.getMovieId());
        if (keywordResponse == null || keywordResponse.get("keywords") == null) {
            return List.of();
        }
        List<Map<String, Object>> keywords = (List<Map<String, Object>>) keywordResponse.get("keywords");
        List<MovieTagEntity> tagEntities = new ArrayList<>();
        for (Map<String, Object> keyword : keywords) {
            Long id = Long.valueOf((Integer) keyword.get("id"));
            String name = (String) keyword.get("name");
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
        }
        movieTagRepository.saveAll(tagEntities);
        return tagEntities;
    }

    public void collectMovieGenres() {
        List<MovieEntity> movies = movieCollectRepository.findAll();
        int count = 0;
        for (MovieEntity movie : movies) {
            fetchAndSaveMovieGenres(movie);
            count++;
            if (count % KEYWORD_GENRE_SLEEP_MOD == 0) {
                sleep(SLEEP_INTERVAL_MILLIS);
            }
            log.info("Processed genres for movie id={}", movie.getMovieId());
        }
    }

    private List<MovieGenreEntity> fetchAndSaveMovieGenres(MovieEntity movie) {
        Map<String, Object> detailResponse = tmdbApiClient.fetchMovieDetails(movie.getMovieId().toString());
        if (detailResponse == null) {
            return List.of();
        }
        List<Map<String, Object>> genres = (List<Map<String, Object>>) detailResponse.get("genres");
        if (genres == null) {
            return List.of();
        }
        Set<MovieGenreIdForEntity> genreIdSet = new LinkedHashSet<>();
        for (Map<String, Object> genre : genres) {
            Integer apiGenreId = (Integer) genre.get("id");
            Long genreId = mapApiGenreIdToServiceGenreId(apiGenreId);
            genreIdSet.add(new MovieGenreIdForEntity(movie.getMovieId(), genreId));
        }

        List<MovieGenreEntity> genreEntities = new ArrayList<>();
        for (MovieGenreIdForEntity id : genreIdSet) {
            MovieGenreEntity genreEntity = new MovieGenreEntity(id, movie);
            genreEntities.add(genreEntity);
        }
        movieGenreCollectRepository.saveAll(genreEntities);
        return genreEntities;
    }

    private Long mapApiGenreIdToServiceGenreId(int apiGenreId) {
        return switch (apiGenreId) {
            case 28, 12 -> 1L;
            case 16 -> 2L;
            case 35 -> 3L;
            case 80 -> 4L;
            case 99 -> 5L;
            case 18, 10751 -> 6L;
            case 14 -> 7L;
            case 36 -> 8L;
            case 10402 -> 9L;
            case 9648 -> 10L;
            case 10749 -> 11L;
            case 878 -> 12L;
            case 10770 -> 13L;
            case 27, 53 -> 14L;
            case 10752 -> 15L;
            case 37 -> 16L;
            default -> 99999L;
        };
    }

    public void collectMovieCrew() {
        List<MovieEntity> movies = movieCollectRepository.findAll();
        List<MovieCrewEntity> crewEntities = new ArrayList<>();
        List<MovieRCrewEntity> movieRCrewEntities = new ArrayList<>();

        for (MovieEntity movie : movies) {
            Map<String, Object> creditsResponse = tmdbApiClient.fetchMovieCredits(movie.getMovieId());
            List<Map<String, Object>> castList = (List<Map<String, Object>>) creditsResponse.get("cast");
            if (castList != null) {
                for (Map<String, Object> cast : castList) {
                    MovieCrewEntity crewEntity = createMovieCrewEntityFromCast(cast);
                    MovieRCrewEntity rCrewEntity = createMovieRCrewEntity(movie, crewEntity);
                    crewEntities.add(crewEntity);
                    movieRCrewEntities.add(rCrewEntity);
                    log.info("Processed cast member: {}", crewEntity.getName());
                }
            }
            List<Map<String, Object>> crewList = (List<Map<String, Object>>) creditsResponse.get("crew");
            if (crewList != null && !crewList.isEmpty()) {
                Optional<Map<String, Object>> directorOpt = crewList.stream()
                        .filter(crew -> "Director".equals(crew.get("job")))
                        .findFirst();
                if (directorOpt.isPresent()) {
                    Map<String, Object> directorMap = directorOpt.get();
                    MovieCrewEntity directorEntity = createMovieCrewEntityForDirector(directorMap);
                    MovieRCrewEntity rCrewEntity = createMovieRCrewEntity(movie, directorEntity);
                    crewEntities.add(directorEntity);
                    movieRCrewEntities.add(rCrewEntity);
                    log.info("Processed director: {}", directorEntity.getName());
                }
            }
        }
        movieCrewJpaRepository.saveAll(crewEntities);
        movieRCrewJpaRepository.saveAll(movieRCrewEntities);
    }

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

    private MovieCrewEntity createMovieCrewEntityForDirector(Map<String, Object> crew) {
        MovieCrewId crewId = IdFactory.createMovieCrewId();
        String name = (String) crew.get("name");
        MovieRole role = MovieRole.DIRECTOR;
        String charName = (String) crew.get("character");
        String profileImgUrl = (String) crew.get("profile_path");
        int orderNo = -1;
        return MovieCrewEntity.builder()
                .movieCrewId(crewId)
                .name(name)
                .role(role)
                .charName(charName)
                .profileImgUrl(profileImgUrl)
                .orderNo(orderNo)
                .build();
    }

    private MovieRCrewEntity createMovieRCrewEntity(MovieEntity movie, MovieCrewEntity crewEntity) {
        MovieRCrewIdForEntity rCrewId = new MovieRCrewIdForEntity(movie.getMovieId(), crewEntity.getMovieCrewId());
        return new MovieRCrewEntity(rCrewId, crewEntity, movie);
    }

    private void sleep(int millis) {
        try {
            Thread.sleep(millis);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException(e);
        }
    }

}
```

---

## 결론

- **`RestTemplate`**나 **`WebClient`**를 통해 외부 API 호출 가능.
- **`JpaRepository`**로 DB 영속화.
- API 사용 시 `Rate Limit`과 예외 처리를 고려해야 안전한 데이터 수집이 가능합니다.
