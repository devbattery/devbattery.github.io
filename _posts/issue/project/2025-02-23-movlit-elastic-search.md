---
title: "[Project] Spring Boot와 Elastic Search를 연동하여 영화 검색 추천 서비스 구현"
excerpt: "movlit, spring, elastic-search, mapping, analyzer, nested-query"

categories:
  - Project
tags:
  - [movlit, spring, elastic-search, mapping, analyzer, nested-query]

toc: true
toc_sticky: true

sidebar:
  nav: "categories"

date: 2025-02-23
last_modified_at: 2025-04-13
---

> [Movlit 프로젝트](https://github.com/venus-lion/movlit-plus)에 대한 설명입니다.

우리 서비스에서 제공하는 영화 추천 시스템을 검색할 수 있는 기능을 Elastic Search로 구현하였습니다. MySQL로도 충분히 구현할 수 있지만, Elasticsearch의 강력한 전문 검색(Full-Text Search) 기능과 유연한 스키마, 분석기(Analyzer), 점수 조절(Scoring) 등의 장점을 활용해보고 싶었습니다.

## 1. Elasticsearch 데이터 구조 정의: `MovieDocument.java`

Elasticsearch를 효과적으로 사용하려면 먼저 데이터를 어떻게 저장하고 분석할지 정의해야 합니다. Spring Data Elasticsearch에서는 `@Document` 어노테이션이 붙은 클래스로 이를 표현합니다. 우리의 `MovieDocument`를 살펴봅시다.

```java
package movlit.be.movie.domain.document;

// ... (imports) ...

@Document(indexName = "movies") // Elasticsearch 인덱스 이름 지정
@Setting(settingPath = "/mappings/movie-setting.json") // 분석기(Analyzer) 등 인덱스 설정 파일 경로
@Mapping(mappingPath = "/mappings/movie-mapping.json") // 필드 타입, 매핑 등 스키마 정의 파일 경로
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MovieDocument {

    @Id
    private Long movieId; // 문서의 고유 ID (Primary Key 역할)

    // === Multi-field 예시: title ===
    @MultiField(mainField = @Field(type = FieldType.Text, analyzer = "korean_analyzer"), // 기본 필드: 한국어 분석
            otherFields = {
                    @InnerField(suffix = "en", type = FieldType.Text, analyzer = "english_analyzer"), // .en 필드: 영어 분석
                    @InnerField(suffix = "ngram", type = FieldType.Text, analyzer = "my_ngram_analyzer"), // .ngram 필드: Ngram 분석 (부분일치)
                    @InnerField(suffix = "standard", type = FieldType.Text, analyzer = "standard") // .standard 필드: 표준 분석 (Fuzzy 등)
            })
    private String title; // 원본 데이터는 하나, 인덱싱은 여러 방식으로!

    @Field(type = FieldType.Text)
    private String originalTitle; // 단순 텍스트 (기본 분석기 또는 매핑 파일 설정 따름)

    // === Multi-field 예시: overview ===
    @MultiField(mainField = @Field(type = FieldType.Text, analyzer = "korean_analyzer"),
            otherFields = { /* title과 유사 */ })
    private String overview;

    // === 숫자/날짜/키워드 필드 ===
    @Field(type = FieldType.Double)
    private Double popularity; // 정렬, 범위 검색 등에 용이

    @Field(type = FieldType.Text) // URL 등, Keyword가 더 적합할 수도 있음
    private String posterPath;

    @Field(type = FieldType.Date, format = DateFormat.date, pattern = "yyyy-MM-dd") // 날짜 형식 지정
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    private LocalDate releaseDate; // 날짜 범위 검색 활용

    @Field(type = FieldType.Keyword) // 분석 없이 정확한 값 매칭용
    private String originalLanguage; // 필터링, 집계(Aggregation)에 주로 사용

    @Field(type = FieldType.Long)
    private Long voteCount;

    @Field(type = FieldType.Double)
    private Double voteAverage;

    @Field(type = FieldType.Keyword)
    private String productionCountry; // Keyword 타입: 필터링에 적합

    @Field(type = FieldType.Integer)
    private Integer runtime;

    @Field(type = FieldType.Keyword)
    private String status; // Keyword 타입: 정확한 상태 값 매칭

    // === Multi-field 예시: tagline ===
    @MultiField(mainField = @Field(type = FieldType.Text, analyzer = "korean_analyzer"),
            otherFields = { /* title과 유사 */ })
    private String tagline;

    @Field(type = FieldType.Boolean)
    private boolean delYn; // 삭제 여부 플래그

    // === Nested Type 예시: 영화 장르 ===
    @Field(type = FieldType.Nested) // 객체 배열, 각 객체 내부 필드 관계 유지!
    private List<MovieGenreForDocument> movieGenre = new ArrayList<>();

    // === Nested Type 예시: 영화 제작진 ===
    @Field(type = FieldType.Nested)
    private List<MovieCrewForDocument> movieCrew = new ArrayList<>();

    @Field(type = FieldType.Nested)
    private List<MovieTagForDocument> movieTag = new ArrayList<>();

    // --- 내부 중첩 객체 정의 (예시) ---
    // 실제로는 별도 클래스거나 static inner class 형태일 수 있음
    @Getter @NoArgsConstructor @AllArgsConstructor
    public static class MovieGenreForDocument {
        @Field(type = FieldType.Long) // 또는 Keyword
        private Long genreId;
        @Field(type = FieldType.Keyword) // 장르 이름은 보통 Keyword
        private String genreName;
    }

    @Getter @NoArgsConstructor @AllArgsConstructor
    public static class MovieCrewForDocument {
        @Field(type = FieldType.Long) // 또는 Keyword
        private Long crewId;
        // 이름은 검색 대상이므로 Text, 혹은 MultiField 가능
        @Field(type = FieldType.Object) // 이름 필드를 객체로 묶음
        private NameFields name;
        @Field(type = FieldType.Keyword)
        private String role; // 역할 (Director, Actor 등)
        @Field(type = FieldType.Integer)
        private Integer priority; // 중요도
    }

    @Getter @NoArgsConstructor @AllArgsConstructor
    public static class NameFields { // 이름 필드를 위한 객체
        @Field(type = FieldType.Text, analyzer = "korean_analyzer")
        private String ko;
        @Field(type = FieldType.Text, analyzer = "english_analyzer")
        private String en;
        // 필요시 ngram, standard 등 추가
    }

    // MovieTagForDocument 정의 ...
}
```

### 주요 Elasticsearch 매핑 설명:

1.  **`@Document`, `@Setting`, `@Mapping`**:
    *   `@Document(indexName = "movies")`: 이 클래스의 객체가 Elasticsearch의 `movies` 인덱스에 저장될 문서임을 나타냅니다.
    *   `@Setting(settingPath = "/mappings/movie-setting.json")`: 인덱스 생성 시 적용될 설정을 담은 JSON 파일 경로입니다. 주로 **사용자 정의 분석기(Custom Analyzer)** (예: `korean_analyzer`, `my_ngram_analyzer`) 등을 여기서 정의합니다.
    *   `@Mapping(mappingPath = "/mappings/movie-mapping.json")`: 각 필드의 데이터 타입(`text`, `keyword`, `date`, `nested` 등)과 분석 방법 등을 상세히 정의하는 매핑 파일 경로입니다. 어노테이션으로도 가능하지만, 복잡한 설정은 파일을 이용하는 것이 관리하기 편합니다.

2.  **`@MultiField`**:
    *   하나의 원본 필드 데이터(`title`, `overview`, `tagline`)를 **여러 가지 방식**으로 분석하고 인덱싱하고 싶을 때 사용합니다.
    *   `mainField`: 주로 기본 검색에 사용될 방식 (여기서는 `korean_analyzer` 적용).
    *   `otherFields`: 추가적인 분석 방식 정의 (`InnerField`).
        *   `suffix = "en"`: `title.en` 이라는 이름의 하위 필드가 생성되며, `english_analyzer`가 적용됩니다. 영어 제목 검색에 사용됩니다.
        *   `suffix = "ngram"`: `title.ngram` 필드가 생성되며, `my_ngram_analyzer`가 적용됩니다. Ngram 분석기는 단어를 짧은 단위(예: 2글자)로 쪼개어 인덱싱하므로 "어벤져스"를 "어벤", "벤져", "져스" 등으로 저장하여 **부분 일치 검색**이나 오타에 강한 검색을 가능하게 합니다.
        *   `suffix = "standard"`: `title.standard` 필드가 생성되며, 기본 `standard` 분석기가 적용됩니다. 주로 **Fuzzy 검색(오타 교정)** 의 기반 필드로 사용됩니다.
    *   이렇게 하면 `"어벤져스"`라는 제목 하나로 한국어 검색, 영어 검색(`"Avengers"`), 부분 검색(`"벤져"`), 오타 검색(`"어벤저스"`) 등 다양한 요구사항을 효과적으로 처리할 수 있습니다.

3.  **`@Field(type = FieldType.Keyword)`**:
    *   `originalLanguage`, `productionCountry`, `status` 등에 사용됩니다.
    *   `Keyword` 타입은 입력된 텍스트를 **분석하지 않고** 그대로 저장합니다.
    *   따라서 **정확히 일치하는 값**을 찾거나(Filtering), 특정 값으로 그룹화하여 통계를 내는(Aggregation) 용도에 매우 적합합니다. 예를 들어 "US" 국가 코드를 가진 영화만 필터링할 때 유용합니다.

4.  **`@Field(type = FieldType.Nested)`**:
    *   `movieGenre`, `movieCrew`, `movieTag` 같이 **객체의 배열** 형태인 필드에 사용됩니다. 이것이 이 프로젝트의 핵심 중 하나입니다!
    *   **왜 중요할까요?** 만약 `nested`가 아니면 Elasticsearch는 내부적으로 배열 안의 객체 구조를 깨뜨리고 평탄화합니다. 예를 들어 `movieGenre`가 `[{genreId: 1, genreName: "액션"}, {genreId: 2, genreName: "코미디"}]` 일 때, `nested`가 없으면 `movieGenre.genreId: [1, 2]` 와 `movieGenre.genreName: ["액션", "코미디"]` 처럼 저장될 수 있습니다. 이 경우 "genreId가 1이면서 genreName이 코미디인" 잘못된 조합으로 검색될 위험이 있습니다.
    *   `Nested` 타입은 각 객체(`{genreId: 1, genreName: "액션"}`)를 독립적인 내부 문서처럼 취급하여 **객체 내 필드 간의 관계를 유지**합니다.
    *   따라서, "1번 장르(액션)를 포함하는 영화" 또는 "특정 배우(crewId=123)가 '주연(role=Actor)'으로 참여한 영화" 와 같이 **객체 내부의 여러 조건을 조합**하여 정확하게 검색하려면 반드시 `Nested` 타입과 **`NestedQuery`** 를 함께 사용해야 합니다.

5.  **기타 타입**: `Text`, `Date`, `Double`, `Boolean` 등은 각 데이터 특성에 맞게 사용되며, 특히 `Date` 타입은 날짜 범위 검색에, 숫자 타입은 정렬이나 범위 필터링에 활용됩니다.

이제 이 `MovieDocument` 구조를 기반으로 실제 검색 로직이 어떻게 구현되는지 살펴보겠습니다.

## 2. 전체 구조: 검색 요청은 어떻게 흘러갈까요?

### Controller (MovieSearchController)

```java
// ... (기존 코드와 동일) ...
@RestController
@RequestMapping("/api/movies/search")
@RequiredArgsConstructor
@Slf4j
public class MovieSearchController {

    private final MovieSearchService movieSearchService;

    // 1. 사용자의 관심 장르 기반 영화 추천
    @GetMapping("/interestGenre")
    public ResponseEntity<MovieListResponseDto> fetchMovieByMemberInterestGenre(
            @AuthenticationPrincipal MyMemberDetails details,
            @RequestParam(required = false, defaultValue = "1") int page,
            @RequestParam(required = false, defaultValue = "10") int pageSize
    ) { /* ... 기존 코드 ... */ }

    // 2. 사용자가 최근 찜한 영화 기반 영화 추천
    @GetMapping("/lastHeart")
    public ResponseEntity<MovieListResponseDto> getMovieByUserRecentHeart(
            @AuthenticationPrincipal MyMemberDetails details,
            @RequestParam(required = false, defaultValue = "1") int page,
            @RequestParam(required = false, defaultValue = "20") int pageSize
    ) { /* ... 기존 코드 ... */ }

    // 3. 일반 텍스트 검색 (제목, 배우, 장르 등)
    @GetMapping("/searchMovie")
    public ResponseEntity<MovieDocumentResponseDto> getSearchMovie(
            @RequestParam(required = false, defaultValue = "1") int page,
            @RequestParam(required = false, defaultValue = "20") int pageSize,
            @RequestParam String inputStr) { /* ... 기존 코드 ... */ }
}
```

Controller는 사용자 요청을 받아 적절한 Service 메소드를 호출하는 역할은 동일합니다.

### Service (MovieSearchService)

```java
// ... (기존 코드와 동일) ...
@Service
@RequiredArgsConstructor
@Slf4j
public class MovieSearchService {

    private final MemberGenreService memberGenreService;
    private final MovieHeartService movieHeartService;
    private final MovieCrewReadService movieCrewReadService;
    private final MovieSearchRepository movieSearchRepository; // Elasticsearch 검색 로직 호출

    @Transactional(readOnly = true)
    public MovieListResponseDto searchMovieByMemberInterestGenre(MemberId currentMemberId, int page, int pageSize) {
        List<Genre> movieGenreList = memberGenreService.fetchMemberInterestGenre(currentMemberId);
        Pageable pageable = Pageable.ofSize(pageSize).withPage(page - 1);
        // Repository에게 장르 목록과 페이징 정보 전달
        List<Movie> movieList = movieSearchRepository.searchMovieByMemberInterestGenre(movieGenreList, pageable);
        return new MovieListResponseDto(movieList);
    }

    public MovieListResponseDto fetchMovieByMemberRecentHeart(MemberId currentMemberId, int page, int pageSize) {
        try {
            List<MovieHeart> movieHeartList = movieHeartService.fetchMovieHeartRecentByMember(currentMemberId);
            List<Long> movieIds = movieHeartList.stream().map(MovieHeart::getMovieId).toList();
            List<MovieCrewResponseDto> heartedMovieCrewList = movieCrewReadService.fetchMovieCrewByMovieId(movieIds);
            Pageable pageable = Pageable.ofSize(pageSize).withPage(page - 1);
             // Repository에게 관련 Crew 정보와 페이징 전달
            List<Movie> movieList = movieSearchRepository.searchMovieByMemberHeartCrew(heartedMovieCrewList, pageable);
            return new MovieListResponseDto(movieList);
        } catch (NotExistMovieHeartByMember e) {
            log.info("사용자 ID {} 에 대한 찜한 영화가 없어 빈 리스트를 반환합니다.", currentMemberId);
            return new MovieListResponseDto(Collections.emptyList());
        }
    }

    @Transactional(readOnly = true)
    public MovieDocumentResponseDto getSearchMovie(String inputStr, int page, int pageSize) {
        Pageable pageable = Pageable.ofSize(pageSize).withPage(page - 1);
        // Repository에게 검색어와 페이징 전달
        return movieSearchRepository.searchMovieList(inputStr, pageable);
    }
}
```

Service 계층의 역할도 이전과 동일하게, 비즈니스 로직 처리 후 검색에 필요한 데이터를 Repository에 넘겨주는 것입니다. 여기서 중요한 것은 Repository가 이 데이터를 받아 *어떻게* Elasticsearch 쿼리를 만드는가 입니다.

---

## 3. Elasticsearch 연동: Repository 구조

### Repository 인터페이스

```java
public interface MovieSearchRepository {
    // 관심 장르 기반 검색 (Genre 객체 리스트 사용)
    List<Movie> searchMovieByMemberInterestGenre(List<Genre> genreList, Pageable pageable);
    // 최근 찜 영화의 Crew 기반 검색 (Crew DTO 리스트 사용)
    List<Movie> searchMovieByMemberHeartCrew(List<MovieCrewResponseDto> dto, Pageable pageable);
    // 일반 텍스트 검색 (검색어 문자열 사용)
    MovieDocumentResponseDto searchMovieList(String inputStr, Pageable pageable);
}
```

이 인터페이스를 구현하는 `MovieSearchRepositoryImpl`에서 Elasticsearch 쿼리를 직접 생성하고 실행합니다. `ElasticsearchOperations`를 사용하여 `MovieDocument`의 구조(특히 `nested` 타입과 `multi-field`)를 활용하는 복잡한 쿼리를 작성할 것입니다.

---

## 4. Repository 구현체: Elasticsearch 쿼리의 향연 (feat. MovieDocument 활용) 🚀

`MovieSearchRepositoryImpl`에서 `MovieDocument`의 필드 정의를 어떻게 활용하여 쿼리를 만드는지 집중적으로 살펴봅시다.

```java
@Repository
@RequiredArgsConstructor
@Slf4j
public class MovieSearchRepositoryImpl implements MovieSearchRepository {

    private final ElasticsearchOperations elasticsearchOperations;
    // private final MovieDocumentConverter converter; // 변환 로직 담당

    // ... (executeSearch, convertToMovies 등 공통 메소드는 기존과 유사) ...

    @Override
    public List<Movie> searchMovieByMemberInterestGenre(List<Genre> genreList, Pageable pageable) {
        // 1. 관심 장르 검색 쿼리 생성 (FunctionScore + NestedQuery 활용)
        //    MovieDocument의 'movieGenre' (nested) 필드를 타겟으로 함
        Query query = buildMemberInterestGenreQuery(genreList);
        SearchHits<MovieDocument> searchHits = executeSearch(query, pageable, MovieDocument.class);
        return convertToMovies(searchHits);
    }

    @Override
    public List<Movie> searchMovieByMemberHeartCrew(List<MovieCrewResponseDto> crewList, Pageable pageable) {
        // 1. 최근 찜 영화 Crew 기반 검색 쿼리 생성 (Bool + FunctionScore + NestedQuery 활용)
        //    MovieDocument의 'movieCrew' (nested) 필드와 그 안의 'name' 필드를 타겟
        Query query = buildMemberHeartCrewQuery(crewList);
        SearchHits<MovieDocument> searchHits = executeSearch(query, pageable, MovieDocument.class);
        return convertToMovies(searchHits);
    }

    @Override
    public MovieDocumentResponseDto searchMovieList(String inputStr, Pageable pageable) {
        // 1. 일반 텍스트 검색 쿼리 생성 (Bool + MultiMatch/Match + NestedQuery 등 활용)
        //    MovieDocument의 'title', 'title.en', 'title.ngram', 'movieGenre.genreName', 'movieCrew.name.ko' 등 다양한 필드 타겟
        Query query = buildSearchMovieListQuery(inputStr);
        SearchHits<MovieDocument> searchHits = executeSearch(query, pageable, MovieDocument.class);
        List<MovieDocument> result = searchHits.stream().map(SearchHit::getContent).toList();
        long totalHits = searchHits.getTotalHits();
        int pageSize = pageable.getPageSize();
        long totalPages = (totalHits + pageSize - 1) / pageSize;
        return new MovieDocumentResponseDto(result, totalPages);
    }

    // --- ElasticsearchOperations를 사용하는 공통 메소드 ---
    private <T> SearchHits<T> executeSearch(Query query, Pageable pageable, Class<T> clazz) {
        NativeQuery nativeQuery = NativeQuery.builder()
                .withQuery(query)
                .withPageable(pageable)
                // .withSort(...) // 필요시 정렬 조건 추가 (예: 인기도순)
                .build();
        return elasticsearchOperations.search(nativeQuery, clazz);
    }

    // --- 결과 변환 로직 ---
    private List<Movie> convertToMovies(SearchHits<MovieDocument> searchHits) {
        // MovieDocumentConverter를 사용하여 Document -> Domain 변환
        return searchHits.stream()
                .map(SearchHit::getContent)
                .map(MovieDocumentConverter::documentToDomain)
                .toList();
    }

    // ... (쿼리 빌더 메소드 상세 설명) ...
}
```

이제 각 쿼리 빌더가 `MovieDocument`의 구조를 어떻게 활용하는지 보겠습니다.

### 4.1 사용자 관심 장르 검색 (Function Score + Nested Query on `movieGenre`)

```java
// 관심 장르 검색 쿼리 생성
private Query buildMemberInterestGenreQuery(List<Genre> genreList) {
    // 기본 조건: MovieDocument의 'movieGenre' 필드(nested 타입) 내에서
    // 사용자의 관심 장르 ID 중 하나라도 포함하는 영화를 찾는다.
    Query genreNestedQuery = buildGenreNestedQuery(genreList);

    // 점수 조절 함수: 특정 장르 ID를 포함할 때 가중치 부여
    List<FunctionScore> functions = genreList.stream()
            .map(this::buildGenreFunctionScore)
            .collect(Collectors.toList());

    return FunctionScoreQuery.of(f -> f
            .query(genreNestedQuery) // 기본 필터링 조건
            .functions(functions)    // 점수 조절 함수 목록
            .scoreMode(FunctionScoreMode.Sum) // 점수 합산
            .boostMode(FunctionBoostMode.Sum) // 점수 합산
    )._toQuery();
}

// 'movieGenre'(Nested) 필드 내 'genreId' 검색 쿼리 생성
private Query buildGenreNestedQuery(List<Genre> genreList) {
    // 각 장르 ID에 대한 Term 쿼리 생성 (Term: 분석 없이 정확한 값 매칭)
    List<Query> genreQueries = genreList.stream()
        // MovieDocument.MovieGenreForDocument의 genreId 필드를 타겟
        .map(genre -> Query.of(q -> q.term(t -> t.field("movieGenre.genreId").value(genre.getId()))))
        .toList();

    // 'movieGenre' 필드는 @Field(type = FieldType.Nested)로 정의되었으므로,
    // NestedQuery를 사용하여 각 장르 객체 내부에서 검색을 수행해야 함.
    return NestedQuery.of(n -> n
            .path("movieGenre") // Nested 필드의 경로 명시
            .query(q -> q.bool(b -> b.should(genreQueries))) // 여러 장르 ID 중 하나라도 맞으면 OK (OR 조건)
    )._toQuery();
}

// 특정 장르 ID('movieGenre.genreId')에 매칭 시 가중치 부여 함수 생성
private FunctionScore buildGenreFunctionScore(Genre genre) {
    // FunctionScore의 필터 조건: 역시 NestedQuery 사용
    Query filterQuery = NestedQuery.of(n -> n
        .path("movieGenre")
        .query(q -> q.term(t -> t.field("movieGenre.genreId").value(genre.getId())))
    )._toQuery();

    // 이 필터(filterQuery)에 매칭되는 문서에 가중치(weight) 1.5 부여
    return FunctionScore.of(f -> f.filter(filterQuery).weight(1.5));
}
```

- **핵심**: `movieGenre` 필드가 `MovieDocument`에서 `Nested` 타입으로 정의되었기 때문에, 관련 검색은 반드시 `NestedQuery`를 사용해야 합니다. `path("movieGenre")`를 통해 해당 중첩 구조 내에서 `genreId` 필드를 정확히 타겟팅합니다. `FunctionScore`의 `filter`에도 동일하게 `NestedQuery`를 적용하여 특정 장르 영화에 점수를 부여합니다.

### 4.2 최근 찜 영화의 Crew 기반 영화 검색 (Bool + FunctionScore + Nested Query on `movieCrew`)

```java
// 최근 찜 영화 Crew 기반 검색 쿼리 생성
public List<Movie> searchMovieByMemberHeartCrew(List<MovieCrewResponseDto> crewList, Pageable pageable) {
    Set<String> crewNameSet = extractImportantCrewNames(crewList);
    // 제외 조건(mustNot): 이미 찜한 영화(movieId) 제외 (Term Query 사용)
    List<Query> mustNotQueries = buildCrewMustNotQueries(crewList);
    // 필수 조건(must): MovieDocument의 'movieCrew' 필드(nested) 내에서
    // 추출된 Crew 이름 중 하나라도 포함하는 영화 검색
    Query crewNestedQuery = buildCrewNestedQuery(crewNameSet);

    BoolQuery topLevelBoolQuery = BoolQuery.of(b -> b
        .must(crewNestedQuery)
        .mustNot(mustNotQueries)
    );

    // 점수 조절: 특정 Crew 이름 포함 시 가중치 부여 (FunctionScore + NestedQuery)
    List<FunctionScore> functions = buildCrewFunctionScores(crewNameSet);

    Query query = FunctionScoreQuery.of(f -> f
            .query(topLevelBoolQuery._toQuery())
            .functions(functions)
            .scoreMode(FunctionScoreMode.Sum)
            .boostMode(FunctionBoostMode.Sum)
    )._toQuery();

    SearchHits<MovieDocument> searchHits = executeSearch(query, pageable, MovieDocument.class);
    return convertToMovies(searchHits);
}

// ... (extractImportantCrewNames, buildCrewMustNotQueries는 기존과 유사) ...

// 'movieCrew'(Nested) 필드 내 이름 검색 쿼리 생성
private Query buildCrewNestedQuery(Set<String> crewNameSet) {
    // 각 이름에 대해 MovieDocument.MovieCrewForDocument.NameFields의 'ko'와 'en' 필드를 Match 쿼리로 검색
    List<Query> crewNameQueries = crewNameSet.stream()
        .flatMap(name -> Stream.of(
            // 'movieCrew.name.ko' 필드 (korean_analyzer 적용됨)
            Query.of(q -> q.match(t -> t.field("movieCrew.name.ko").query(name))),
            // 'movieCrew.name.en' 필드 (english_analyzer 적용됨)
            Query.of(q -> q.match(t -> t.field("movieCrew.name.en").query(name)))
        ))
        .toList();

    // 'movieCrew' 필드는 @Field(type = FieldType.Nested)이므로 NestedQuery 사용
    return NestedQuery.of(n -> n
            .path("movieCrew") // Nested 경로 지정
            .query(q -> q.bool(b -> b.should(crewNameQueries))) // 이름 중 하나라도 매치되면 OK (OR)
    )._toQuery();
}

// 특정 Crew 이름('movieCrew.name.ko', 'movieCrew.name.en') 포함 시 가중치 부여 함수 생성
private List<FunctionScore> buildCrewFunctionScores(Set<String> crewNameSet) {
    List<FunctionScore> functions = new ArrayList<>();
    crewNameSet.forEach(name -> {
        // 한국어 이름('ko') 필터 및 가중치 (Nested + Match)
        functions.add(FunctionScore.of(f -> f
                .filter(NestedQuery.of(n -> n.path("movieCrew").query(q -> q.match(t -> t.field("movieCrew.name.ko").query(name))))._toQuery())
                .weight(1.5)
        ));
        // 영어 이름('en') 필터 및 가중치 (Nested + Match)
        functions.add(FunctionScore.of(f -> f
                .filter(NestedQuery.of(n -> n.path("movieCrew").query(q -> q.match(t -> t.field("movieCrew.name.en").query(name))))._toQuery())
                .weight(1.5)
        ));
    });
    return functions;
}
```

- **핵심**: 여기서도 `movieCrew`가 `Nested` 타입이므로 `NestedQuery`를 사용합니다. 특히 `movieCrew` 내부의 `name` 필드가 다시 `ko`와 `en`으로 나뉘어 있고 각각 다른 분석기(`korean_analyzer`, `english_analyzer`)가 적용되어 있으므로, `match` 쿼리를 사용하여 해당 필드(`movieCrew.name.ko`, `movieCrew.name.en`)를 정확히 타겟팅합니다. `FunctionScore` 역시 이 `nested` 구조 안의 이름 필드를 `filter` 조건으로 사용합니다.

### 4.3 일반 문자열 검색 (Multi-field와 Nested field 활용)

```java
// 일반 텍스트 검색 쿼리 생성
private Query buildSearchMovieListQuery(String inputStr) {
    List<Query> queries = new ArrayList<>();

    // 1. 제목 관련 필드 검색: MovieDocument의 'title' Multi-field 활용
    queries.addAll(buildTitleQueries(inputStr));
    // 2. 장르 관련 필드 검색: MovieDocument의 'movieGenre' (Nested) 필드 활용
    queries.addAll(buildGenreQueries(inputStr));
    // 3. 제작진 관련 필드 검색: MovieDocument의 'movieCrew' (Nested) 필드 활용
    queries.addAll(buildCrewQueries(inputStr));
    // 4. 개요(overview) 등 다른 Text 필드 검색도 추가 가능 (Multi-field 활용)
    // queries.add(Query.of(q -> q.match(m -> m.field("overview").query(inputStr).boost(0.8f)))); // 예시

    // 모든 쿼리들을 OR 조건(should)으로 묶음
    return Query.of(q -> q.bool(b -> b.should(queries).minimumShouldMatch("1")));
}

// 제목 필드('@MultiField') 검색 쿼리 생성
private List<Query> buildTitleQueries(String inputStr) {
    List<Query> titleQueries = new ArrayList<>();
    // MovieDocument에서 @MultiField로 정의된 하위 필드들을 타겟으로 함
    // 기본 한국어 분석 필드 ('title') - 가장 높은 가중치
    titleQueries.add(Query.of(q -> q.match(m -> m.field("title").query(inputStr).boost(2.0f))));
    // 영어 분석 필드 ('title.en')
    titleQueries.add(Query.of(q -> q.match(m -> m.field("title.en").query(inputStr).boost(1.8f))));
    // Ngram 분석 필드 ('title.ngram') - 부분 일치, 오타 보완
    titleQueries.add(Query.of(q -> q.match(m -> m.field("title.ngram").query(inputStr).boost(1.5f))));
    // Fuzzy 검색 (오타 교정) - standard 분석 필드('title.standard') 타겟
    titleQueries.add(
        Query.of(q -> q.fuzzy(f -> f.field("title.standard")
                                 .value(inputStr)
                                 .fuzziness("AUTO") // 편집 거리 자동 계산
                                 .boost(1.4f)))
    );
    return titleQueries;
}

// 장르 이름('movieGenre.genreName', Nested) 검색 쿼리 생성
private List<Query> buildGenreQueries(String inputStr) {
    List<Query> genreQueries = new ArrayList<>();
    // 'movieGenre'는 Nested 타입이므로 NestedQuery 사용
    // 'genreName'은 Keyword 타입일 가능성이 높으므로 Term 쿼리 사용 가능
    // (만약 Text 타입이면 Match 쿼리 사용)
    genreQueries.add(Query.of(q -> q.nested(n -> n
            .path("movieGenre")
            .query(Query.of(nq -> nq.term(t -> t.field("movieGenre.genreName").value(inputStr).boost(1.8f)))) // 또는 match
    )));
    return genreQueries;
}

// Crew 이름('movieCrew.name.ko', 'movieCrew.name.en', Nested) 검색 쿼리 생성
private List<Query> buildCrewQueries(String inputStr) {
    List<Query> crewQueries = new ArrayList<>();
    // 'movieCrew'는 Nested 타입
    // 한국어 이름 ('ko', Text 타입, korean_analyzer)
    crewQueries.add(Query.of(q -> q.nested(n -> n
            .path("movieCrew")
            .query(Query.of(nq -> nq.match(m -> m.field("movieCrew.name.ko").query(inputStr).boost(1.8f))))
    )));
    // 영어 이름 ('en', Text 타입, english_analyzer)
    crewQueries.add(Query.of(q -> q.nested(n -> n
            .path("movieCrew")
            .query(Query.of(nq -> nq.match(m -> m.field("movieCrew.name.en").query(inputStr).boost(1.6f))))
    )));
    // 필요시 Crew 이름에 대해서도 Ngram, Fuzzy 쿼리 추가 가능 (해당 필드가 Multi-field로 정의되었다면)
    return crewQueries;
}
```

- **핵심**: 일반 검색에서는 `MovieDocument`에 정의된 다양한 필드 타입을 총동원합니다.
    - `title` 검색 시 `@MultiField`로 생성된 `title`, `title.en`, `title.ngram`, `title.standard` 필드를 모두 활용하여 한국어, 영어, 부분 일치, 오타 교정 검색을 한 번에 수행하고, `boost`로 각 필드의 중요도를 조절합니다.
    - `movieGenre`와 `movieCrew` 검색 시에는 `NestedQuery`를 사용하여 해당 `nested` 구조 안의 필드(`genreName`, `name.ko`, `name.en`)를 정확히 타겟팅합니다. 필드의 타입(Keyword or Text)에 따라 `term` 또는 `match` 쿼리를 적절히 사용합니다.

---

## 5. MovieDocument와 Domain 객체 변환의 중요성

```java
public class MovieDocumentConverter {

    // RDB Entity -> Elasticsearch Document 변환
    public static MovieDocument entityToDocument(MovieEntity movieEntity) {
        // Entity 정보를 MovieDocument 구조에 맞게 매핑
        return MovieDocument.builder()
            .movieId(movieEntity.getMovieId())
            .title(movieEntity.getTitle())
            // ...
            // Genre Entity List -> MovieGenreForDocument List 변환
            .movieGenre(
                movieEntity.getMovieGenreEntityList().stream()
                    .map(entity -> new MovieDocument.MovieGenreForDocument(
                            entity.getGenre().getId(),
                            entity.getGenre().getName()))
                    .toList()
            )
            // Crew Entity List -> MovieCrewForDocument List 변환
            .movieCrew(
                movieEntity.getMovieRCrewEntityList().stream()
                    .map(entity -> new MovieDocument.MovieCrewForDocument(
                            entity.getCrew().getId(),
                            // NameFields 객체 생성
                            new MovieDocument.NameFields(entity.getCrew().getNameKo(), entity.getCrew().getNameEn()),
                            entity.getRole(),
                            entity.getPriority()))
                    .toList()
            )
            .build();
    }

    // Elasticsearch Document -> Application Domain 객체 변환
    public static Movie documentToDomain(MovieDocument movieDocument) {
        // MovieDocument 정보를 Movie 도메인 객체 구조에 맞게 매핑
        return Movie.builder()
            .movieId(movieDocument.getMovieId())
            .title(movieDocument.getTitle())
            // ...
            .movieGenreList(movieDocument.getMovieGenre().stream()
                .map(genreDoc -> new MovieGenre(genreDoc.getGenreId(), genreDoc.getGenreName()))
                .toList()
            )
            .movieRCrewList(movieDocument.getMovieCrew().stream()
                .map(crewDoc -> MovieRCrew.builder()
                        .crewId(crewDoc.getCrewId())
                        .nameKo(crewDoc.getName().getKo()) // Nested 객체의 하위 필드 접근
                        .nameEn(crewDoc.getName().getEn())
                        .role(crewDoc.getRole())
                        .priority(crewDoc.getPriority())
                        .build())
                .toList()
            )
            .build();
    }
    // ... (내부 변환 메소드 생략) ...
}
```

- `MovieDocumentConverter`는 RDB의 `MovieEntity`, Elasticsearch의 `MovieDocument`, 그리고 애플리케이션의 `Movie` 도메인 객체 사이의 변환을 담당합니다.
- 특히 `entityToDocument`에서는 RDB 데이터를 Elasticsearch 매핑(`MovieDocument` 구조)에 맞게 변환하고, `documentToDomain`에서는 Elasticsearch 검색 결과를 다시 애플리케이션에서 사용하기 좋은 형태로 변환합니다.
- `MovieDocument`는 Elasticsearch의 데이터 표현 방식 그 자체이며, 이 구조를 이해하고 정의하는 것이 효과적인 검색 쿼리 작성의 첫걸음입니다.

---

## 6. 결론

1.  **`MovieDocument` 정의가 핵심**: Elasticsearch 검색 성능과 기능은 인덱스 매핑(`@Mapping`, `@Field`, `@MultiField`, `@Nested`)과 설정(`@Setting`, 분석기)에 크게 의존합니다. 어떤 필드를 어떻게 검색할지 미리 고민하여 `MovieDocument`를 설계해야 합니다.
2.  **`@MultiField` 활용**: 하나의 필드를 다양한 분석기로 인덱싱하여 여러 검색 요구사항(다국어, 부분 일치, 오타 교정 등)을 충족시킬 수 있습니다.
3.  **`@Nested`와 `NestedQuery`는 필수**: 객체 배열 필드 내의 관계를 유지하며 정확하게 검색하려면 `Nested` 타입으로 매핑하고 `NestedQuery`를 사용해야 합니다.
4.  **쿼리 조합과 점수 조절**: `BoolQuery`로 여러 조건을 조합하고, `FunctionScoreQuery`로 특정 조건 만족 시 점수를 조절하여 검색 결과의 관련성(Relevance)과 순위를 제어할 수 있습니다.
5.  **변환 계층**: `MovieDocumentConverter` 등을 통해 Elasticsearch Document와 애플리케이션 Domain 객체 간의 변환을 명확히 분리하여 유연성을 확보합니다.

> **✨ 핵심 포인트 Recap ✨**
>
> - **매핑 먼저!**: `@Document`의 필드 타입 정의(특히 `text` vs `keyword`, `nested`, `multi-field`)가 쿼리 작성의 기초입니다.
> - **`NestedQuery` 잊지 말자!**: 객체 배열(`List<SomeObject>`) 필드는 `@Nested` + `NestedQuery` 조합이 필수입니다.
> - **`MultiField`로 검색 능력 UP!**: `@MultiField`와 다양한 분석기(`korean`, `english`, `ngram` 등)를 활용해 사용자 친화적 검색(다국어, 부분 일치, 오타 등)을 구현하세요.
> - **`FunctionScore`로 순위 조절!**: 비즈니스 로직에 맞게 검색 결과의 중요도를 조절하고 싶을 때 강력한 도구입니다.

Elasticsearch의 이러한 기능들을 `MovieDocument` 정의 단계부터 고려하고 Spring Data Elasticsearch를 통해 적절히 활용한다면, 단순 키워드 매칭을 넘어 사용자의 의도에 맞는 훨씬 지능적이고 만족스러운 검색 기능을 구축할 수 있습니다.