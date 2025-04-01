---
title: "[Project] Spring Boot와 Elastic Search 연동하여 영화 검색 추천 서비스 구현"
excerpt: "movlit, spring, elastic-search"

categories:
  - Project
tags:
  - [movlit, spring, elastic-search]

toc: true
toc_sticky: true

sidebar:
  nav: "categories"

date: 2025-02-23
last_modified_at: 2025-04-01
---

> [Movlit 프로젝트](https://github.com/venus-lion/movlit-plus)에 대한 설명입니다.

## 1. 전체 구조: 검색 요청은 어떻게 흘러갈까요?

1.  **Controller (`MovieSearchController`)** – 사용자의 API 요청을 제일 먼저 받습니다. "이런 영화 찾아줘!" 하는 요청이죠.
2.  **Service (`MovieSearchService`)** – 실제 비즈니스 로직을 처리합니다. 예를 들어, "사용자가 좋아하는 장르가 뭐지?", "최근에 어떤 영화를 찜했더라?" 같은 정보를 파악하고, 이를 바탕으로 어떤 검색을 할지 결정합니다. 그런 다음 Repository에게 "자, 이걸로 Elasticsearch에서 찾아봐!" 하고 일을 넘깁니다.
3.  **Repository (`MovieSearchRepositoryImpl`)** – 드디어 Elasticsearch와 직접 만나는 곳입니다! Spring Data Elasticsearch가 제공하는 강력한 `ElasticsearchOperations`를 사용해 실제 검색 쿼리를 만들고 Elasticsearch 클러스터로 전송합니다. 응답(`SearchHits`)을 받으면, 이걸 우리 애플리케이션에서 사용하기 좋은 형태(Domain 객체)로 변환해서 돌려줍니다.

### Controller (MovieSearchController)

```java
@RestController
@RequestMapping("/api/movies/search")
@RequiredArgsConstructor
@Slf4j
public class MovieSearchController {

    private final MovieSearchService movieSearchService;

    // 1. 사용자의 관심 장르 기반 영화 추천
    @GetMapping("/interestGenre")
    public ResponseEntity<MovieListResponseDto> fetchMovieByMemberInterestGenre(
            @AuthenticationPrincipal MyMemberDetails details, // Spring Security로 인증된 사용자 정보 가져오기
            @RequestParam(required = false, defaultValue = "1") int page,
            @RequestParam(required = false, defaultValue = "10") int pageSize
    ) {
        MemberId currentMemberId = details.getMemberId();
        var response = movieSearchService.searchMovieByMemberInterestGenre(
                currentMemberId,
                page,
                pageSize
        );
        return ResponseEntity.ok(response);
    }

    // 2. 사용자가 최근 찜한 영화 기반 영화 추천
    @GetMapping("/lastHeart")
    public ResponseEntity<MovieListResponseDto> getMovieByUserRecentHeart(
            @AuthenticationPrincipal MyMemberDetails details,
            @RequestParam(required = false, defaultValue = "1") int page,
            @RequestParam(required = false, defaultValue = "20") int pageSize
    ) {
        MemberId currentMemberId = details.getMemberId();
        var response = movieSearchService.fetchMovieByMemberRecentHeart(currentMemberId, page, pageSize);
        return ResponseEntity.ok(response);
    }

    // 3. 일반 텍스트 검색 (제목, 배우, 장르 등)
    @GetMapping("/searchMovie")
    public ResponseEntity<MovieDocumentResponseDto> getSearchMovie(
            @RequestParam(required = false, defaultValue = "1") int page,
            @RequestParam(required = false, defaultValue = "20") int pageSize,
            @RequestParam String inputStr) {
        MovieDocumentResponseDto response = movieSearchService.getSearchMovie(inputStr, page, pageSize);
        return ResponseEntity.ok(response);
    }
}
```

`@RestController` 어노테이션으로 이 클래스가 API 요청을 처리한다는 것을 명시합니다. 여기서는 세 가지 주요 검색 API를 제공하고 있어요.

1.  `interestGenre`: 사용자가 선호하는 **관심 장르**를 기반으로 영화를 추천합니다.
2.  `lastHeart`: 사용자가 **최근에 '찜'한 영화**와 유사한(여기서는 주요 제작진이 겹치는) 영화를 추천합니다.
3.  `searchMovie`: 사용자가 입력한 **문자열**로 영화 제목, 장르, 배우/감독 등을 통합 검색합니다.

`@AuthenticationPrincipal`은 Spring Security를 통해 현재 로그인된 사용자의 상세 정보(`MyMemberDetails`)를 편리하게 받아오는 방법입니다. 이를 통해 사용자 ID(`MemberId`)를 얻어 개인화된 검색 결과를 제공할 수 있죠.

### Service (MovieSearchService)

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class MovieSearchService {

    private final MemberGenreService memberGenreService; // 사용자 관심 장르 조회
    private final MovieHeartService movieHeartService;     // 사용자 찜 목록 조회
    private final MovieCrewReadService movieCrewReadService; // 영화 제작진 정보 조회
    private final MovieSearchRepository movieSearchRepository; // Elasticsearch 검색 로직 호출

    @Transactional(readOnly = true)
    public MovieListResponseDto searchMovieByMemberInterestGenre(MemberId currentMemberId, int page, int pageSize) {
        // 1. 로그인 유저의 취향 장르 (최대 3개) 가져오기
        List<Genre> movieGenreList = memberGenreService.fetchMemberInterestGenre(currentMemberId);

        Pageable pageable = Pageable.ofSize(pageSize).withPage(page - 1); // 페이징 처리 (0-based index)

        // 2. Repository를 통해 Elasticsearch에서 관심 장르 영화 검색
        List<Movie> movieList = movieSearchRepository.searchMovieByMemberInterestGenre(movieGenreList, pageable);
        return new MovieListResponseDto(movieList);
    }

    public MovieListResponseDto fetchMovieByMemberRecentHeart(MemberId currentMemberId, int page, int pageSize) {
        try {
            // 1. 사용자가 최근에 찜한 영화 목록 가져오기
            List<MovieHeart> movieHeartList = movieHeartService.fetchMovieHeartRecentByMember(currentMemberId);
            List<Long> movieIds = movieHeartList.stream().map(MovieHeart::getMovieId).toList();

            // 2. 찜한 영화들의 주요 제작진(crew) 정보 가져오기 (예: 감독, 주연 배우 등)
            // 이 정보를 기반으로 "비슷한 스타일"의 영화를 찾으려는 전략!
            List<MovieCrewResponseDto> heartedMovieCrewList = movieCrewReadService.fetchMovieCrewByMovieId(movieIds);
            Pageable pageable = Pageable.ofSize(pageSize).withPage(page - 1);

            // 3. Repository를 통해 Elasticsearch에서 관련 제작진 영화 검색
            List<Movie> movieList = movieSearchRepository.searchMovieByMemberHeartCrew(heartedMovieCrewList, pageable);
            return new MovieListResponseDto(movieList);

        } catch (NotExistMovieHeartByMember e) {
            // 4. 사용자가 찜한 영화가 없을 경우, 에러 대신 빈 목록 반환 (Graceful Handling)
            log.info("사용자 ID {} 에 대한 찜한 영화가 없어 빈 리스트를 반환합니다.", currentMemberId);
            return new MovieListResponseDto(Collections.emptyList());
        }
    }

    @Transactional(readOnly = true)
    public MovieDocumentResponseDto getSearchMovie(String inputStr, int page, int pageSize) {
        Pageable pageable = Pageable.ofSize(pageSize).withPage(page - 1);
        // Repository를 통해 Elasticsearch에서 일반 텍스트 검색 실행
        return movieSearchRepository.searchMovieList(inputStr, pageable);
    }
}
```

서비스 계층에서는 실제 "어떻게" 검색할지에 대한 로직이 들어갑니다.

1.  **관심 장르 기반 검색 (`searchMovieByMemberInterestGenre`)**:
    - `MemberGenreService`를 통해 사용자가 선호하는 장르 목록을 가져옵니다.
    - 가져온 장르 목록을 `MovieSearchRepository`에 전달하여 검색을 요청합니다.
2.  **최근 찜 영화 기반 검색 (`fetchMovieByMemberRecentHeart`)**:
    - `MovieHeartService`로 최근 찜한 영화 ID 목록을 가져옵니다.
    - `MovieCrewReadService`를 이용해 해당 영화들의 주요 제작진(감독, 주연 배우 등) 정보를 조회합니다. "이 배우/감독이 참여한 다른 영화는 없을까?" 하는 아이디어에서 출발한 로직이죠.
    - 이 제작진 정보를 `MovieSearchRepository`에 넘겨 관련 영화를 검색합니다.
    - 만약 사용자가 찜한 영화가 없다면 (`NotExistMovieHeartByMember` 예외 발생 시), 사용자 경험을 해치지 않도록 빈 리스트를 반환합니다.
3.  **일반 텍스트 검색 (`getSearchMovie`)**:
    - 사용자가 입력한 검색어(`inputStr`)와 페이징 정보를 `MovieSearchRepository`에 그대로 전달하여 검색을 위임합니다.

핵심은, 서비스 계층은 **무엇을** 검색할지 결정하고, 실제 Elasticsearch 쿼리는 **어떻게** 만들지는 Repository에게 맡긴다는 점입니다. 이것이 바로 **관심사의 분리(Separation of Concerns)**죠!

---

## 2. Elasticsearch 연동: Repository 구조

이제 Elasticsearch와 직접 통신하는 Repository 부분을 살펴봅시다.

### Repository 인터페이스

```java
public interface MovieSearchRepository {
    // 관심 장르 기반 검색
    List<Movie> searchMovieByMemberInterestGenre(List<Genre> genreList, Pageable pageable);
    // 최근 찜 영화의 Crew 기반 검색
    List<Movie> searchMovieByMemberHeartCrew(List<MovieCrewResponseDto> dto, Pageable pageable);
    // 일반 텍스트 검색
    MovieDocumentResponseDto searchMovieList(String inputStr, Pageable pageable);
}
```

이 인터페이스는 우리가 구현할 검색 기능의 명세를 정의합니다. 각 메소드는 Service 계층에서 호출하는 기능과 일치하죠.

이 인터페이스를 **구현**한 클래스가 바로 `MovieSearchRepositoryImpl`입니다. 이 구현체 안에서 **ElasticsearchOperations** 객체를 주입받아, 복잡하고 동적인 Elasticsearch 쿼리를 직접 만들고 실행하게 됩니다. (`ElasticsearchRepository` 같은 Spring Data의 기본 Repository 인터페이스를 상속하는 대신 `ElasticsearchOperations`를 직접 사용하는 이유는, Function Score나 Nested Query처럼 좀 더 세밀한 제어가 필요한 쿼리를 만들기 위해서입니다.)

---

## 3. Repository 구현체: Elasticsearch 쿼리의 향연 🚀

자, 이제 프로젝트의 심장부! `MovieSearchRepositoryImpl`에서 어떻게 Elasticsearch 쿼리를 조립하는지 자세히 알아봅시다. 여기가 바로 마법이 일어나는 곳입니다 ✨

```java
@Repository
@RequiredArgsConstructor
@Slf4j
public class MovieSearchRepositoryImpl implements MovieSearchRepository {

    // Elasticsearch와 상호작용하기 위한 핵심 객체
    private final ElasticsearchOperations elasticsearchOperations;

    // ... (Converter 등 다른 메소드)

    @Override
    public List<Movie> searchMovieByMemberInterestGenre(List<Genre> genreList, Pageable pageable) {
        // 1. 관심 장르 검색을 위한 Elasticsearch 쿼리 생성
        Query query = buildMemberInterestGenreQuery(genreList);
        // 2. Elasticsearch에 쿼리 실행 요청 (페이징 포함)
        SearchHits<MovieDocument> searchHits = executeSearch(query, pageable, MovieDocument.class);
        // 3. 검색 결과(Document)를 Domain 객체(Movie)로 변환
        return convertToMovies(searchHits);
    }

    @Override
    public List<Movie> searchMovieByMemberHeartCrew(List<MovieCrewResponseDto> crewList, Pageable pageable) {
        // 1. 최근 찜 영화 Crew 기반 검색 쿼리 생성 (Bool + FunctionScore)
        Query query = buildMemberHeartCrewQuery(crewList); // 내부 로직은 아래에서 설명
        // 2. 쿼리 실행
        SearchHits<MovieDocument> searchHits = executeSearch(query, pageable, MovieDocument.class);
        // 3. 결과 변환
        return convertToMovies(searchHits);
    }

    @Override
    public MovieDocumentResponseDto searchMovieList(String inputStr, Pageable pageable) {
        // 1. 일반 텍스트 검색 쿼리 생성 (다양한 필드 대상 Bool Query)
        Query query = buildSearchMovieListQuery(inputStr); // 내부 로직은 아래에서 설명
        // 2. 쿼리 실행
        SearchHits<MovieDocument> searchHits = executeSearch(query, pageable, MovieDocument.class);
        // 3. 결과 변환 및 페이징 정보 포함하여 DTO 생성
        List<MovieDocument> result = searchHits.stream()
                                           .map(SearchHit::getContent)
                                           .toList();
        long totalHits = searchHits.getTotalHits();
        int pageSize = pageable.getPageSize();
        long totalPages = (totalHits + pageSize - 1) / pageSize; // 총 페이지 수 계산
        return new MovieDocumentResponseDto(result, totalPages);
    }

    // ElasticsearchOperations를 사용해 실제 쿼리를 실행하는 공통 메소드
    private <T> SearchHits<T> executeSearch(Query query, Pageable pageable, Class<T> clazz) {
        // NativeQuery 사용: 우리가 만든 Query 객체와 페이징 정보를 담아 Elasticsearch에 전달
        NativeQuery nativeQuery = NativeQuery.builder()
                .withQuery(query)
                .withPageable(pageable)
                .build();
        // search() 메소드로 쿼리 실행 및 결과(SearchHits) 반환
        // SearchHits에는 검색된 Document 목록 외에도 총 결과 수, 최고 점수 등의 메타데이터가 포함됨
        return elasticsearchOperations.search(nativeQuery, clazz);
    }

    // SearchHits<MovieDocument> -> List<Movie> 변환 로직
    private List<Movie> convertToMovies(SearchHits<MovieDocument> searchHits) {
        return searchHits.stream()
                .map(SearchHit::getContent) // 실제 Document 객체 추출
                .map(MovieDocumentConverter::documentToDomain) // Document -> Domain 변환
                .toList();
    }

    // ... (쿼리 빌더 메소드들은 아래에 상세 설명)
}
```

여기서 중요한 점은 `executeSearch` 메소드입니다. `ElasticsearchOperations.search()`를 호출하여 우리가 만든 `Query` 객체와 `Pageable` 정보를 담은 `NativeQuery`를 실행합니다. 반환되는 `SearchHits` 객체는 검색 결과 목록뿐만 아니라 총 결과 수(`getTotalHits()`) 같은 유용한 메타 정보도 담고 있어서 페이징 처리에 활용할 수 있습니다.

이제 각 검색 유형별 쿼리 빌더 메소드를 자세히 살펴볼까요?

### 3.1 사용자 관심 장르 검색 (Function Score + Nested Query)

사용자가 좋아하는 장르의 영화를 더 높은 순위로 보여주고 싶을 때, `FunctionScoreQuery`가 아주 유용합니다.

```java
// 관심 장르 검색을 위한 최종 Query 객체 생성
private Query buildMemberInterestGenreQuery(List<Genre> genreList) {
    // 기본 조건: 사용자의 관심 장르 중 하나라도 포함하는 영화를 찾는다 (Nested Query 사용)
    Query genreNestedQuery = buildGenreNestedQuery(genreList);

    // 점수 조절: 특정 장르에 해당될 때 점수를 추가로 부여 (가중치 적용)
    List<FunctionScore> functions = genreList.stream()
            .map(this::buildGenreFunctionScore) // 각 장르별 FunctionScore 생성
            .collect(Collectors.toList());

    // FunctionScoreQuery 조립!
    return FunctionScoreQuery.of(f -> f
            .query(genreNestedQuery) // 기본 쿼리 설정
            .functions(functions)    // 점수 조절 함수 목록 설정
            .scoreMode(FunctionScoreMode.Sum) // 여러 function 점수를 어떻게 합칠지 (여기선 합산)
            .boostMode(FunctionBoostMode.Sum) // 기본 쿼리 점수와 function 점수를 어떻게 합칠지 (여기선 합산)
    )._toQuery(); // Elasticsearch Core Query 객체로 변환
}

// Nested 필드인 'movieGenre'에서 장르 ID 목록으로 검색하는 쿼리 생성
private Query buildGenreNestedQuery(List<Genre> genreList) {
    // 각 장르 ID에 대한 Term Query 생성
    List<Query> genreQueries = genreList.stream()
        .map(genre -> Query.of(q -> q.term(t -> t.field("movieGenre.genreId").value(genre.getId()))))
        .toList();

    // 'movieGenre' 필드는 여러 장르 정보를 담는 객체 배열(nested type)이므로 NestedQuery로 감싸야 함
    // 그래야 각 장르 객체 내에서 'genreId'가 정확히 일치하는지 검사 가능
    return NestedQuery.of(n -> n
            .path("movieGenre") // nested 필드의 경로 지정
            .query(q -> q.bool(b -> b.should(genreQueries))) // 여러 Term Query를 OR 조건(should)으로 묶음
    )._toQuery();
}

// 특정 장르(genreId)에 매칭될 경우 가중치(weight)를 부여하는 FunctionScore 생성
private FunctionScore buildGenreFunctionScore(Genre genre) {
    // FunctionScore의 필터 조건: 특정 장르 ID를 가진 영화 (Nested Query 사용)
    Query filterQuery = NestedQuery.of(n -> n
        .path("movieGenre")
        .query(q -> q.term(t -> t.field("movieGenre.genreId").value(genre.getId())))
    )._toQuery();

    // 이 필터(filterQuery)에 걸리는 문서에 대해 1.5배의 가중치(weight)를 부여
    return FunctionScore.of(f -> f.filter(filterQuery).weight(1.5));
}
```

- **🤔 왜 `NestedQuery`를 써야 할까요?**
  `movieGenre` 필드는 Elasticsearch에서 **`nested` 타입**으로 매핑되어 있습니다. 이는 `movieGenre`가 [{genreId: 1, genreName: "액션"}, {genreId: 2, genreName: "코미디"}] 와 같이 객체의 배열 형태이기 때문입니다. 만약 `nested` 타입이 아니라면 Elasticsearch는 내부적으로 필드를 평탄화시켜 저장하는데 (`movieGenre.genreId: [1, 2]`, `movieGenre.genreName: ["액션", "코미디"]`), 이렇게 되면 "1번 장르이면서 코미디" 같은 잘못된 조합도 검색될 수 있습니다. `NestedQuery`는 각 객체 내부의 연관성을 유지하면서 검색할 수 있게 해줍니다. 그래서 `path`를 명시하여 해당 경로 내에서 쿼리를 수행하도록 지정해야 합니다.

- **🚀 `FunctionScoreQuery`로 맞춤 점수 부여!**
  기본적으로 Elasticsearch는 TF-IDF 같은 알고리즘으로 검색어와 문서의 관련성 점수(\_score)를 계산합니다. 하지만 우리는 사용자의 관심 장르에 해당하는 영화에 *추가 점수*를 주고 싶습니다. 이때 `FunctionScoreQuery`를 사용합니다.
  - `filter`: 어떤 문서에 추가 점수를 줄지 조건을 정의합니다. 여기서는 `NestedQuery`를 사용해 특정 장르 ID를 가진 영화를 필터링합니다.
  - `weight`: 필터 조건을 만족하는 문서에 곱해질 가중치입니다. 1.5로 설정하면 기본 점수의 1.5배가 됩니다.
  - `scoreMode`, `boostMode`: 여러 `FunctionScore`가 적용되거나 기본 쿼리 점수와 합쳐질 때, 점수를 어떻게 계산할지 정합니다. `Sum`은 점수들을 모두 더하는 방식입니다. 사용자가 여러 관심 장르를 가지고 있을 때, 해당 장르들에 매칭될수록 점수가 더 높아지게 됩니다.

### 3.2 최근 찜 영화의 Crew 기반 영화 검색

이번엔 사용자가 최근에 찜한 영화들의 **주요 제작진(감독, 배우 등)** 정보를 활용하여, 이 제작진이 참여한 다른 영화를 추천하는 로직입니다. "이 감독/배우 좋아하면 이 영화도 좋아할 거야!" 같은 추천 방식이죠.

```java
// 최근 찜 영화 Crew 기반 검색 쿼리 생성
public List<Movie> searchMovieByMemberHeartCrew(List<MovieCrewResponseDto> crewList, Pageable pageable) {
    // 1. 추천 대상 Crew 이름 목록 추출 (중복 제거 및 중요도 고려 가능 - 여기선 이름만 Set으로 추출)
    //    (실제 구현에서는 crewList에서 감독이나 주연 배우 등 특정 역할만 필터링할 수도 있음)
    Set<String> crewNameSet = extractImportantCrewNames(crewList); // 아래 설명 참고

    // 2. 제외 조건(mustNot): 이미 사용자가 찜한 영화는 결과에서 제외
    List<Query> mustNotQueries = buildCrewMustNotQueries(crewList);

    // 3. 필수 조건(must): 추출된 Crew 이름 중 하나라도 포함하는 영화 검색 (Nested Query 사용)
    Query crewNestedQuery = buildCrewNestedQuery(crewNameSet);

    // 4. Bool 쿼리로 must, mustNot 조건 조합
    BoolQuery topLevelBoolQuery = BoolQuery.of(b -> b
        .must(crewNestedQuery)   // 이 제작진이 참여한 영화여야 하고,
        .mustNot(mustNotQueries) // 이미 찜한 영화는 아니어야 함
    );

    // 5. 점수 조절(FunctionScore): 특정 Crew 이름이 포함될 때마다 가중치 부여
    List<FunctionScore> functions = buildCrewFunctionScores(crewNameSet);

    // 6. FunctionScoreQuery로 최종 쿼리 조립
    Query query = FunctionScoreQuery.of(f -> f
            .query(topLevelBoolQuery._toQuery()) // 기본 Bool 쿼리
            .functions(functions)             // Crew 이름별 가중치 함수
            .scoreMode(FunctionScoreMode.Sum)  // 점수 합산
            .boostMode(FunctionBoostMode.Sum)  // 점수 합산
    )._toQuery();

    // 7. 쿼리 실행 및 결과 반환
    SearchHits<MovieDocument> searchHits = executeSearch(query, pageable, MovieDocument.class);
    return convertToMovies(searchHits);
}

// crewList에서 추천에 사용할 Crew 이름 Set 추출 (예시)
private Set<String> extractImportantCrewNames(List<MovieCrewResponseDto> crewList) {
    // 예: 모든 crew의 한국어/영어 이름을 중복 없이 추출
    return crewList.stream()
                   .flatMap(crew -> Stream.of(crew.nameKo(), crew.nameEn()))
                   .filter(Objects::nonNull) // null 이름 제외
                   .collect(Collectors.toSet());
    // 실제로는 감독(Director), 주연(Actor) 등 특정 역할만 필터링하거나,
    // 찜 목록에서 자주 등장하는 Crew에 더 높은 가중치를 주는 등의 로직 추가 가능
}
```

#### 3.2.1 `mustNot` 쿼리로 이미 찜한 영화 제외

```java
// 제외할 영화 ID 목록으로 Term Query 리스트 생성
private List<Query> buildCrewMustNotQueries(List<MovieCrewResponseDto> crewList) {
    // crewList에 포함된 모든 movieId를 가져옴 (이 영화들은 결과에 나오면 안 됨)
    Set<Long> heartedMovieIds = crewList.stream()
                                      .map(MovieCrewResponseDto::movieId)
                                      .collect(Collectors.toSet());

    // 각 movieId에 대해 "movieId 필드 값이 일치하는 문서는 제외하라"는 Term Query 생성
    return heartedMovieIds.stream()
        .map(id -> Query.of(q -> q.term(t -> t.field("movieId").value(id))))
        .toList();
}
```

- 추천 결과에 사용자가 이미 찜한 영화가 또 나오면 안 되겠죠? `BoolQuery`의 `mustNot` 절에 `term` 쿼리를 사용하여 특정 `movieId`를 가진 문서를 결과에서 제외시킵니다. `term` 쿼리는 분석 과정을 거치지 않고 정확히 일치하는 값을 찾을 때 주로 사용됩니다 (ID나 키워드 등).

#### 3.2.2 `movieCrew` 필드를 `NestedQuery`로 검색

```java
// Nested 필드인 'movieCrew'에서 Crew 이름 목록으로 검색하는 쿼리 생성
private Query buildCrewNestedQuery(Set<String> crewNameSet) {
    // 각 Crew 이름에 대해 한국어 이름(ko) 또는 영어 이름(en) 필드와 매치되는지 확인하는 Match Query 생성
    List<Query> crewNameQueries = crewNameSet.stream()
        .flatMap(name -> Stream.of(
            // "movieCrew.name.ko" 필드에서 name과 일치하는지 (텍스트 분석 적용됨)
            Query.of(q -> q.match(t -> t.field("movieCrew.name.ko").query(name))),
            // "movieCrew.name.en" 필드에서 name과 일치하는지
            Query.of(q -> q.match(t -> t.field("movieCrew.name.en").query(name)))
        ))
        .toList();

    // 'movieCrew'는 nested 타입이므로 NestedQuery로 감싸야 함
    return NestedQuery.of(n -> n
        .path("movieCrew") // nested 필드 경로 지정
        .query(q -> q.bool(b -> b.should(crewNameQueries))) // 여러 Match Query를 OR 조건(should)으로 묶음
                                                            // => Crew 이름 중 하나라도 맞으면 검색 대상
    )._toQuery();
}
```

- `movieCrew` 필드 역시 `nested` 타입일 가능성이 높습니다 (한 영화에 여러 제작진 정보가 객체 형태로 들어감). 따라서 `NestedQuery`를 사용합니다.
- 제작진 이름은 보통 일반 텍스트이므로, 분석기(Analyzer)를 통해 형태소 분석이나 동의어 처리 등이 적용되는 `match` 쿼리를 사용합니다. `.ko`와 `.en` 필드를 모두 검색하여 한국어/영어 이름 둘 다 대응하도록 `bool().should(...)`로 묶어줍니다.

#### 3.2.3 `FunctionScore`로 관련 Crew 포함 시 가중치 부여

```java
// 특정 Crew 이름이 포함될 경우 가중치를 부여하는 FunctionScore 리스트 생성
private List<FunctionScore> buildCrewFunctionScores(Set<String> crewNameSet) {
    List<FunctionScore> functions = new ArrayList<>();
    crewNameSet.forEach(name -> {
        // 한국어 이름(ko) 필터 및 가중치
        functions.add(FunctionScore.of(f -> f
                .filter( // 필터 조건: 이 Crew의 한국어 이름이 포함된 영화 (Nested + Match)
                        NestedQuery.of(n -> n
                                .path("movieCrew")
                                .query(q -> q.match(t -> t.field("movieCrew.name.ko").query(name)))
                        )._toQuery()
                )
                .weight(1.5) // 가중치 1.5배
        ));
        // 영어 이름(en) 필터 및 가중치
        functions.add(FunctionScore.of(f -> f
                .filter( // 필터 조건: 이 Crew의 영어 이름이 포함된 영화 (Nested + Match)
                        NestedQuery.of(n -> n
                                .path("movieCrew")
                                .query(q -> q.match(t -> t.field("movieCrew.name.en").query(name)))
                        )._toQuery()
                )
                .weight(1.5) // 가중치 1.5배
        ));
    });
    return functions;
}
```

- 관심 장르 검색과 마찬가지로, `FunctionScoreQuery`를 사용하여 특정 제작진(Crew)의 이름이 포함된 영화에 가중치를 줍니다.
- `filter` 조건에 `NestedQuery`와 `match` 쿼리를 조합하여 해당 Crew 이름을 가진 문서를 식별하고, `weight`로 점수를 높여줍니다.
- 이렇게 하면, 사용자가 찜한 영화들과 **겹치는 제작진이 많을수록** 추천 점수가 높아져 더 관련성 높은 영화가 상위에 랭크될 확률이 높아집니다.

### 3.3 일반 문자열 검색 (제목, 장르, 출연진 등 통합 검색)

가장 흔한 검색 방식이죠. 사용자가 입력한 키워드로 영화 제목, 장르, 배우, 감독 등 다양한 필드를 한 번에 검색하는 기능입니다.

```java
@Override
public MovieDocumentResponseDto searchMovieList(String inputStr, Pageable pageable) {
    // 1. 입력 문자열(inputStr)로 다양한 필드를 검색하는 통합 쿼리 생성
    Query query = buildSearchMovieListQuery(inputStr);
    // 2. 쿼리 실행 (executeSearch는 위에서 정의한 공통 메소드)
    SearchHits<MovieDocument> searchHits = executeSearch(query, pageable, MovieDocument.class);

    // 3. 결과(Document) 목록 추출
    List<MovieDocument> result = searchHits.stream()
            .map(SearchHit::getContent)
            .toList();

    // 4. 페이징 정보 계산
    int pageSize = pageable.getPageSize();
    long totalHits = searchHits.getTotalHits();
    long totalPages = (totalHits + pageSize - 1) / pageSize;

    // 5. 최종 응답 DTO 생성
    return new MovieDocumentResponseDto(result, totalPages);
}

// 일반 텍스트 검색을 위한 통합 Bool Query 생성
private Query buildSearchMovieListQuery(String inputStr) {
    List<Query> queries = new ArrayList<>();

    // 1. 제목(title) 관련 필드 검색 쿼리 추가
    queries.addAll(buildTitleQueries(inputStr));
    // 2. 장르(genre) 관련 필드 검색 쿼리 추가 (Nested)
    queries.addAll(buildGenreQueries(inputStr));
    // 3. 제작진(crew) 관련 필드 검색 쿼리 추가 (Nested)
    queries.addAll(buildCrewQueries(inputStr));
    // 4. 감독(director), 개요(overview) 등 다른 필드 쿼리도 필요하다면 추가...

    // 최종적으로 모든 쿼리들을 OR 조건(should)으로 묶음
    // => 제목 OR 장르 OR 제작진 ... 중 어디든 일치하면 검색 결과에 포함
    return Query.of(q -> q.bool(b -> b.should(queries).minimumShouldMatch("1")));
    // minimumShouldMatch("1"): should 절 중 최소 1개는 만족해야 결과로 인정 (사실상 OR 조건)
}
```

- 핵심은 **여러 필드에 걸쳐 검색**하고, 그 결과를 합치는 것입니다. `bool().should(...)`를 사용하면 여러 쿼리 중 **하나라도 만족**하면 결과에 포함시킬 수 있습니다 (OR 연산과 유사). `minimumShouldMatch("1")`은 `should` 절이 하나라도 있을 때, 그중 최소 하나는 매치되어야 함을 명시합니다.

#### 3.3.1 제목 검색 쿼리 (다양한 분석기 활용)

```java
// 제목 필드 검색을 위한 다양한 쿼리 생성 (Match, Fuzzy 등)
private List<Query> buildTitleQueries(String inputStr) {
    List<Query> titleQueries = new ArrayList<>();
    // 기본 한국어 제목 검색 (boost로 가중치 높게)
    titleQueries.add(Query.of(q -> q.match(m -> m.field("title").query(inputStr).boost(2.0f))));
    // 영어 제목 검색 (가중치)
    titleQueries.add(Query.of(q -> q.match(m -> m.field("title.en").query(inputStr).boost(1.8f))));
    // Ngram 분석기 적용된 필드 검색 (부분 일치, 오타에 강함)
    titleQueries.add(Query.of(q -> q.match(m -> m.field("title.ngram").query(inputStr).boost(1.5f))));
    // Fuzzy 검색 (오타 교정, 예: '어벤져스' -> '어벤저스' 검색 가능)
    titleQueries.add(
        Query.of(q -> q.fuzzy(f -> f.field("title.standard") // Standard Analyzer 적용된 필드 대상
                                 .value(inputStr)
                                 .fuzziness("AUTO") // 편집 거리 자동 계산 (길이에 따라 1 또는 2)
                                 .boost(1.4f))) // Fuzzy는 정확도가 낮을 수 있어 boost는 조금 낮게
    );
    // 필요하다면 초성 검색용 필드 쿼리도 추가 가능
    // titleQueries.add(Query.of(q -> q.match(m -> m.field("title.chosung").query(inputStr).boost(1.2f))));
    return titleQueries;
}
```

- **하나의 필드도 여러 방법으로 검색!** Elasticsearch의 강점 중 하나는 **다중 필드(multi-fields)** 와 **분석기(Analyzer)** 를 활용하는 것입니다.
  - `title`: 기본적인 한국어 분석기(예: `nori`)가 적용된 필드.
  - `title.en`: 영어 분석기(`standard` 또는 `english`)가 적용된 필드.
  - `title.ngram`: **Ngram Tokenizer**를 사용한 필드. "어벤져스"를 "어벤", "벤져", "져스" 등으로 잘게 쪼개어 인덱싱하므로, 사용자가 "벤져"만 입력해도 "어벤져스"를 찾을 수 있게 도와줍니다. **부분 일치 검색**에 효과적입니다.
  - `title.standard`: 기본적인 공백/구두점 제거 등 표준 분석만 적용된 필드. 주로 **Fuzzy 검색**의 대상으로 사용됩니다.
  - (추가 가능) `title.chosung`: 한글 초성("ㅇㅂㅈㅅ")으로도 검색 가능하게 만든 필드.
- **`boost`로 중요도 조절**: `match` 쿼리 등에 `boost` 값을 설정하여 특정 필드에서 일치했을 때 점수를 더 높게 줄 수 있습니다. 예를 들어, 정확한 제목(`title`)에서 일치하는 경우를 Ngram 일치보다 더 중요하게 생각한다면 `boost` 값을 더 높게 설정합니다 (예: `title`은 2.0, `title.ngram`은 1.5).
- **`fuzzy`로 오타 포용**: `fuzzy` 쿼리는 **편집 거리(Edit Distance)** 개념을 사용하여, 사용자가 입력한 단어와 약간 다른(오타가 있는) 단어도 찾아줍니다. `fuzziness("AUTO")`는 단어 길이에 따라 허용할 편집 거리(보통 1 또는 2)를 자동으로 설정해 편리합니다.

#### 3.3.2 장르 검색 쿼리 (Nested + Term/Match)

```java
// 장르 이름 검색을 위한 Nested Query 생성
private List<Query> buildGenreQueries(String inputStr) {
    List<Query> genreQueries = new ArrayList<>();
    // 장르 이름 필드(movieGenre.genreName)가 정확히 일치하는지 확인 (Term Query)
    // 장르 이름은 보통 고정된 키워드이므로 Term이 적합할 수 있음
    genreQueries.add(Query.of(q -> q.nested(n -> n
            .path("movieGenre")
            .query(Query.of(nq -> nq.term(t -> t.field("movieGenre.genreName").value(inputStr).boost(1.8f))))
    )));
    // 만약 장르 이름도 Ngram이나 Fuzzy 검색을 하고 싶다면 Match 쿼리로 변경 가능
    // genreQueries.add(Query.of(q -> q.nested(n -> n
    //        .path("movieGenre")
    //        .query(Query.of(nq -> nq.match(m -> m.field("movieGenre.genreName.ngram").query(inputStr).boost(1.5f))))
    // )));
    return genreQueries;
}
```

- `movieGenre`는 nested 필드이므로 `NestedQuery`로 감싸줍니다.
- 장르 이름(`movieGenre.genreName`)은 "액션", "코미디"처럼 비교적 고정된 키워드일 수 있으므로, 정확히 일치하는 것을 찾는 `term` 쿼리가 적합할 수 있습니다. (만약 분석기를 적용하고 싶다면 `match` 쿼리를 사용합니다.)
- 여기에도 `boost`를 적용하여 장르 이름 일치 시 점수 가중치를 줄 수 있습니다.

#### 3.3.3 출연진/제작진 검색 쿼리 (Nested + Match/Fuzzy 등)

```java
// Crew 이름 검색을 위한 Nested Query 생성
private List<Query> buildCrewQueries(String inputStr) {
    List<Query> crewQueries = new ArrayList<>();
    // 한국어 이름(ko) Match 쿼리 (boost 적용)
    crewQueries.add(Query.of(q -> q.nested(n -> n
            .path("movieCrew")
            .query(Query.of(nq -> nq.match(m -> m.field("movieCrew.name.ko").query(inputStr).boost(1.8f))))
    )));
    // 영어 이름(en) Match 쿼리
    crewQueries.add(Query.of(q -> q.nested(n -> n
            .path("movieCrew")
            .query(Query.of(nq -> nq.match(m -> m.field("movieCrew.name.en").query(inputStr).boost(1.6f))))
    )));
    // Crew 이름도 Ngram, Fuzzy 등 다양한 방식으로 검색 쿼리 추가 가능
    // crewQueries.add(Query.of(q -> q.nested(n -> n
    //        .path("movieCrew")
    //        .query(Query.of(nq -> nq.match(m -> m.field("movieCrew.name.ngram").query(inputStr).boost(1.5f))))
    // )));
    // crewQueries.add(Query.of(q -> q.nested(n -> n
    //        .path("movieCrew")
    //        .query(Query.of(nq -> nq.fuzzy(f -> f.field("movieCrew.name.standard").value(inputStr).fuzziness("AUTO").boost(1.3f))))
    // )));
    return crewQueries;
}
```

- `movieCrew` 필드 역시 `nested` 타입이므로 `NestedQuery`를 사용합니다.
- 제작진 이름(`movieCrew.name.ko`, `movieCrew.name.en`)은 사람 이름이므로, 띄어쓰기나 다양한 표현을 고려하여 `match` 쿼리를 사용하는 것이 일반적입니다.
- 필요에 따라 제목 검색처럼 `ngram`, `fuzzy` 쿼리를 추가하여 검색 품질을 높일 수 있습니다. 각 쿼리에는 적절한 `boost` 값을 부여하여 결과 순서에 영향을 줄 수 있습니다.

---

## 4. MovieDocument와 Domain 객체 변환의 중요성

Elasticsearch는 JSON 형태의 **도큐먼트(`MovieDocument`)** 로 데이터를 저장하고 검색 결과를 반환합니다. 하지만 우리 애플리케이션 로직에서는 비즈니스 규칙과 행위를 담고 있는 **도메인 객체(`Movie`)** 를 사용하는 것이 더 자연스럽고 객체지향적입니다.

그래서 이 둘 사이를 변환해주는 역할이 필요합니다. 여기서는 `MovieDocumentConverter`라는 유틸리티 클래스를 만들어 사용했습니다.

```java
public class MovieDocumentConverter {

    // RDB의 MovieEntity -> Elasticsearch의 MovieDocument 로 변환
    public static MovieDocument entityToDocument(MovieEntity movieEntity) {
        // DB에서 조회한 Entity 객체의 필드 값을 Document 객체 필드에 매핑
        return MovieDocument.builder()
            .movieId(movieEntity.getMovieId())
            .title(movieEntity.getTitle())
            // ... (다른 필드들 매핑) ...
            // Nested 객체인 장르 정보도 변환하여 리스트로 매핑
            .movieGenre(
                movieEntity.getMovieGenreEntityList().stream()
                    .map(MovieDocumentConverter::genreEntityToDocument) // 내부 변환 메소드 호출
                    .toList()
            )
            // Nested 객체인 제작진 정보도 변환
            .movieCrew(
                MovieDocumentConverter.crewEntityListToDocument(movieEntity.getMovieRCrewEntityList()) // 내부 변환 메소드 호출
            )
            .build();
    }

    // Elasticsearch 검색 결과 MovieDocument -> 애플리케이션 Domain 객체 Movie 로 변환
    public static Movie documentToDomain(MovieDocument movieDocument) {
        // Document 객체의 필드 값을 Domain 객체 필드에 매핑
        return Movie.builder()
            .movieId(movieDocument.getMovieId())
            .title(movieDocument.getTitle())
            // ... (다른 필드들 매핑) ...
            // Document의 Nested 객체 리스트를 Domain 객체 리스트로 변환
            .movieGenreList(movieDocument.getMovieGenre().stream()
                .map(genreDoc -> new MovieGenre(genreDoc.getGenreId(), genreDoc.getGenreName()))
                .toList()
            )
            // Document의 Nested 객체 리스트를 Domain 객체 리스트로 변환
            .movieRCrewList(movieDocument.getMovieCrew().stream()
                .map(crewDoc -> MovieRCrew.builder()
                        .crewId(crewDoc.getCrewId())
                        .nameKo(crewDoc.getName().getKo()) // Document의 하위 필드 접근
                        .nameEn(crewDoc.getName().getEn())
                        // ...
                    .build())
                .toList()
            )
            .build();
    }

    // --- 내부 변환 메소드들 (예시) ---
    private static MovieDocument.MovieGenreDocument genreEntityToDocument(MovieGenreEntity entity) {
        return new MovieDocument.MovieGenreDocument(entity.getGenre().getId(), entity.getGenre().getName());
    }

    private static List<MovieDocument.MovieCrewDocument> crewEntityListToDocument(List<MovieRCrewEntity> entities) {
        return entities.stream().map(entity ->
            new MovieDocument.MovieCrewDocument(
                entity.getCrew().getId(),
                new MovieDocument.NameFields(entity.getCrew().getNameKo(), entity.getCrew().getNameEn()), // 이름 필드 객체 생성
                entity.getRole(),
                entity.getPriority()
            )
        ).toList();
    }
}
```

- **`entityToDocument`**: 주로 RDB에서 데이터를 가져와 Elasticsearch에 처음 **인덱싱(색인)** 하거나 업데이트할 때 사용됩니다. DB의 Entity 구조를 Elasticsearch Document 구조에 맞게 변환합니다.
- **`documentToDomain`**: Elasticsearch에서 **검색한 결과(`MovieDocument`)** 를 받아서, Service나 Controller 등 다른 애플리케이션 계층에서 사용하기 좋은 `Movie` 도메인 객체 형태로 변환할 때 사용됩니다.

이렇게 변환 계층을 두면, Elasticsearch의 데이터 구조가 변경되더라도 도메인 모델에 미치는 영향을 최소화할 수 있고, 각 객체가 자신의 책임(데이터 저장/검색 vs 비즈니스 로직)에만 집중할 수 있게 됩니다. **느슨한 결합(Loose Coupling)** 을 유지하는 좋은 방법이죠.

---

## 5. 결론

1.  **Controller**에서 사용자 요청을 받고, **Service**에서 필요한 비즈니스 로직(사용자 정보 조회 등)을 처리합니다.
2.  **Service**는 검색에 필요한 정보(관심 장르 목록, Crew 목록, 검색어 등)를 **Repository**에 전달합니다.
3.  **Repository 구현체(`MovieSearchRepositoryImpl`)** 에서는 `ElasticsearchOperations`를 이용해 동적으로 Elasticsearch 쿼리를 생성합니다. 이때,
    - **`NestedQuery`**: `movieGenre`, `movieCrew` 같이 객체 배열 형태의 필드를 정확하게 검색하기 위해 사용합니다.
    - **`FunctionScoreQuery`**: 특정 조건(예: 관심 장르 일치, 특정 Crew 포함)을 만족하는 결과에 가중치(점수)를 부여하여 검색 결과의 순위를 조절합니다.
    - **`BoolQuery` (`must`, `should`, `mustNot`)**: 여러 검색 조건을 논리적으로 조합합니다 (AND, OR, NOT).
    - **`Match`, `Term`, `Fuzzy` 등 다양한 쿼리**: 필드의 특성(텍스트, 키워드, ID 등)과 검색 요구사항(정확 일치, 부분 일치, 오타 허용 등)에 맞게 선택하여 사용합니다.
    - **다중 필드(`multi-fields`)와 분석기(`Analyzer`, `Ngram`)**: 검색 정확도와 사용자 경험(오타, 부분 검색 허용)을 높이기 위해 활용합니다.
4.  Elasticsearch 검색 결과(`SearchHits<MovieDocument>`)를 애플리케이션에서 사용하기 편한 **도메인 객체(`Movie`)** 로 변환하여 반환합니다.

> **✨ 핵심 포인트 ✨**
>
> - `NestedQuery`는 **중첩된 객체 배열(nested type)** 필드를 다룰 때 필수입니다. 잊지 마세요!
> - `FunctionScoreQuery`는 검색 결과의 **순위(relevance)** 를 내 입맛대로 조절하고 싶을 때 강력한 무기가 됩니다.
> - `fuzzy` (오타 허용), `ngram` (부분 일치) 같은 기능을 활용하면 사용자가 조금 부정확하게 입력해도 원하는 결과를 찾아주는, 훨씬 **사용자 친화적인 검색**을 만들 수 있습니다.

이런 기법들을 잘 활용하면, 단순히 키워드가 포함된 문서를 찾는 것을 넘어, 사용자의 의도와 맥락을 파악하여 **더욱 관련성 높고 만족스러운 검색 결과**를 제공하는 똑똑한 검색 엔진을 구축할 수 있습니다.
