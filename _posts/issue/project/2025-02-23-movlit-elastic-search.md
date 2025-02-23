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
last_modified_at: 2025-02-23
---

> [Movlit 프로젝트](https://github.com/venus-lion/movlit-plus)에 대한 설명입니다.

## 1. 전체 구조

이 프로젝트의 전반적인 **검색 흐름**은 다음과 같습니다.

1. **Controller** – 사용자의 API 요청을 받는다.  
2. **Service** – 비즈니스 로직(사용자 관심 장르, 최근 찜한 영화 등)을 처리하고, Repository를 통해 실제 검색 로직을 호출한다.  
3. **Repository** – Spring Data Elasticsearch를 사용해 **ElasticsearchOperations**로 쿼리를 날리고, 응답(SearchHits)을 받아서 Domain 객체로 변환한다.

아래 그림(개념도)을 참고해보세요:

```
[Controller] ---> [Service] ---> [MovieSearchRepository (Interface)]
                                 |
                                 --> [MovieSearchRepositoryImpl (Implementation)]
                                       --> [ElasticsearchOperations] --> [Elasticsearch Index]
```

### Controller (MovieSearchController)

```java
@RestController
@RequestMapping("/api/movies/search")
@RequiredArgsConstructor
@Slf4j
public class MovieSearchController {

    private final MovieSearchService movieSearchService;

    @GetMapping("/interestGenre")
    public ResponseEntity<MovieListResponseDto> fetchMovieByMemberInterestGenre(
            @AuthenticationPrincipal MyMemberDetails details,
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

`@RestController`와 함께, 관심 장르 기반 검색, 최근 찜한 영화 기반 검색, 그리고 일반적인 문자열 검색(`searchMovie`)을 위한 API 세 가지가 있습니다.

### Service (MovieSearchService)

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class MovieSearchService {

    private final MemberGenreService memberGenreService;
    private final MovieHeartService movieHeartService;
    private final MovieCrewReadService movieCrewReadService;
    private final MovieSearchRepository movieSearchRepository;

    @Transactional(readOnly = true)
    public MovieListResponseDto searchMovieByMemberInterestGenre(MemberId currentMemberId, int page, int pageSize) {
        // 로그인 유저의 취향 장르 3개 가져오기
        List<Genre> movieGenreList = memberGenreService.fetchMemberInterestGenre(currentMemberId);

        Pageable pageable = Pageable.ofSize(pageSize).withPage(page - 1);

        // Elasticsearch에서 가져오기
        List<Movie> movieList = movieSearchRepository.searchMovieByMemberInterestGenre(movieGenreList, pageable);
        return new MovieListResponseDto(movieList);
    }

    public MovieListResponseDto fetchMovieByMemberRecentHeart(MemberId currentMemberId, int page, int pageSize) {
        try {
            List<MovieHeart> movieHeartList = movieHeartService.fetchMovieHeartRecentByMember(currentMemberId);
            List<Long> movieIds = movieHeartList.stream().map(MovieHeart::getMovieId).toList();

            // 최근에 찜한 영화들의 주요 제작진(crew) 정보를 가져온 후, 
            // 해당 제작진과 유사한 영화를 Elasticsearch로부터 조회
            List<MovieCrewResponseDto> heartedMovieCrewList = movieCrewReadService.fetchMovieCrewByMovieId(movieIds);
            Pageable pageable = Pageable.ofSize(pageSize).withPage(page - 1);

            List<Movie> movieList = movieSearchRepository.searchMovieByMemberHeartCrew(heartedMovieCrewList, pageable);
            return new MovieListResponseDto(movieList);

        } catch (NotExistMovieHeartByMember e) {
            // 만약 찜한 영화가 없다면 빈 리스트
            return new MovieListResponseDto(Collections.emptyList());
        }
    }

    @Transactional(readOnly = true)
    public MovieDocumentResponseDto getSearchMovie(String inputStr, int page, int pageSize) {
        Pageable pageable = Pageable.ofSize(pageSize).withPage(page - 1);
        return movieSearchRepository.searchMovieList(inputStr, pageable);
    }
}
```

비즈니스 로직은 크게 두 가지를 담당합니다.

1. **사용자 관심 장르** 3개를 이용한 검색 (`searchMovieByMemberInterestGenre`)  
2. **가장 최근에 찜한 영화의 crew** 정보를 이용한 영화 검색 (`searchMovieByMemberHeartCrew`)  
3. **일반 검색** (제목, 장르명, 출연진 이름 등 텍스트 검색) (`searchMovieList`)

마지막에 `movieSearchRepository`를 통해 실제 Elasticsearch 쿼리를 보내고 있습니다.

---

## 2. Elasticsearch 연동: Repository 구조

### Repository 인터페이스

```java
public interface MovieSearchRepository {
    List<Movie> searchMovieByMemberInterestGenre(List<Genre> genreList, Pageable pageable);
    List<Movie> searchMovieByMemberHeartCrew(List<MovieCrewResponseDto> dto, Pageable pageable);
    MovieDocumentResponseDto searchMovieList(String inputStr, Pageable pageable);
}
```

위 인터페이스를 **구현**한 클래스로 `MovieSearchRepositoryImpl`이 있습니다. 이 구현체에서 **ElasticsearchOperations**를 사용해 실제 쿼리를 실행합니다.

---

## 3. Repository 구현체에서의 ElasticSearch 쿼리

이제 **가장 핵심적인 부분**이라 할 수 있는 `MovieSearchRepositoryImpl`을 살펴봅시다.

```java
@Repository
@RequiredArgsConstructor
@Slf4j
public class MovieSearchRepositoryImpl implements MovieSearchRepository {

    private final ElasticsearchOperations elasticsearchOperations;
    
    ...
    
    @Override
    public List<Movie> searchMovieByMemberInterestGenre(List<Genre> genreList, Pageable pageable) {
        Query query = buildMemberInterestGenreQuery(genreList);
        SearchHits<MovieDocument> searchHits = executeSearch(query, pageable, MovieDocument.class);
        return convertToMovies(searchHits);
    }

    @Override
    public List<Movie> searchMovieByMemberHeartCrew(List<MovieCrewResponseDto> crewList, Pageable pageable) {
        ...
        // Bool 쿼리 + FunctionScore 쿼리
        SearchHits<MovieDocument> searchHits = executeSearch(query, pageable, MovieDocument.class);
        return convertToMovies(searchHits);
    }

    @Override
    public MovieDocumentResponseDto searchMovieList(String inputStr, Pageable pageable) {
        ...
        SearchHits<MovieDocument> searchHits = executeSearch(query, pageable, MovieDocument.class);
        return new MovieDocumentResponseDto(result, totalPages);
    }

    ...
}
```

### 3.1 사용자 관심 장르 검색 (Function Score + Nested Query)

```java
private Query buildMemberInterestGenreQuery(List<Genre> genreList) {
    // genreNestedQuery : "movieGenre" 필드를 NestedQuery로 감싸서
    // 장르 ID가 일치하는 문서를 찾도록 구성
    Query genreNestedQuery = buildGenreNestedQuery(genreList);

    // FunctionScore: 특정 장르에 해당될 때 점수를 높이기
    List<FunctionScore> functions = genreList.stream()
            .map(this::buildGenreFunctionScore)
            .collect(Collectors.toList());

    return FunctionScoreQuery.of(f -> f
            .query(genreNestedQuery)
            .functions(functions)
            .scoreMode(FunctionScoreMode.Sum)
            .boostMode(FunctionBoostMode.Sum)
    )._toQuery();
}

private Query buildGenreNestedQuery(List<Genre> genreList) {
    // genreId를 조건으로 하는 Term Query를 여러 개 만든 뒤
    // should(...) 조건으로 묶어준다
    List<Query> genreQueries = genreList.stream()
        .map(genre -> Query.of(q -> q.term(t -> t.field("movieGenre.genreId").value(genre.getId()))))
        .toList();

    // movieGenre가 Nested Field이기 때문에 NestedQuery를 감싸야 한다
    return NestedQuery.of(n -> n
            .path("movieGenre")
            .query(q -> q.bool(b -> b.should(genreQueries)))
    )._toQuery();
}

private FunctionScore buildGenreFunctionScore(Genre genre) {
    Query filterQuery = NestedQuery.of(n -> n
        .path("movieGenre")
        .query(q -> q.term(t -> t.field("movieGenre.genreId").value(genre.getId())))
    )._toQuery();

    return FunctionScore.of(f -> f.filter(filterQuery).weight(1.5));
}
```

- **왜 NestedQuery를 쓸까?**  
  `movieGenre`가 **nested type**으로 매핑되어 있기 때문입니다. 일반 필드와 다르게 nested 필드는 `path`로 필드 경로를 명시해야 정상적으로 쿼리할 수 있습니다.  

- **FunctionScoreQuery**로 각 장르에 가중치(`weight`)를 줬습니다.  
  - 만약 장르가 여러 개면, **scoreMode**와 **boostMode**를 `Sum`으로 설정해 점수를 합산하도록 했습니다.

### 3.2 최근 찜 영화의 Crew 기반 영화 검색

```java
public List<Movie> searchMovieByMemberHeartCrew(List<MovieCrewResponseDto> crewList, Pageable pageable) {
    // crewNameSet: 최근 찜한 영화에서 중요한(앞순위) Crew 이름들만 추출
    Set<String> crewNameSet = extractCrewNames(crewList);

    // mustNot : 이미 "찜"한 영화는 결과에서 제외 (movieId)
    List<Query> mustNotQueries = buildCrewMustNotQueries(crewList);

    // must : crewNameSet에 해당하는 Crew가 들어있는 영화
    Query crewNestedQuery = buildCrewNestedQuery(crewNameSet);

    BoolQuery topLevelBoolQuery = BoolQuery.of(b -> b
        .must(crewNestedQuery)
        .mustNot(mustNotQueries)
    );

    // crewNameSet에 대해 가중치를 높이기 (FunctionScore)
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
```

#### 3.2.1 mustNot 쿼리로 제거할 `movieId`

```java
private List<Query> buildCrewMustNotQueries(List<MovieCrewResponseDto> crewList) {
    return crewList.stream()
        .map(c -> Query.of(q -> q.term(t -> t.field("movieId").value(c.movieId()))))
        .toList();
}
```

- 찜한 영화의 `movieId`가 결과로 나오는 것을 방지하기 위해 `mustNot`에 Term Query를 넣어줍니다.

#### 3.2.2 `movieCrew`를 NestedQuery로 검색

```java
private Query buildCrewNestedQuery(Set<String> crewNameSet) {
    // "movieCrew.name.ko" 혹은 "movieCrew.name.en" 필드 중 하나에
    // crewName이 match 되도록 should(...)
    List<Query> crewNameQueries = crewNameSet.stream()
        .flatMap(name -> Stream.of(
            Query.of(q -> q.match(t -> t.field("movieCrew.name.ko").query(name))),
            Query.of(q -> q.match(t -> t.field("movieCrew.name.en").query(name)))
        ))
        .toList();

    return NestedQuery.of(n -> n
        .path("movieCrew")
        .query(q -> q.bool(b -> b.should(crewNameQueries)))
    )._toQuery();
}
```

- `movieCrew`가 nested 필드이므로 `NestedQuery`로 감싼 뒤 `bool(...).should(...)`로 여러 `Query`(ko, en 필드)를 합쳤습니다.

#### 3.2.3 FunctionScore로 가중치 부여

```java
private List<FunctionScore> buildCrewFunctionScores(Set<String> crewNameSet) {
    List<FunctionScore> functions = new ArrayList<>();
    crewNameSet.forEach(name -> {
        functions.add(FunctionScore.of(f -> f
                .filter(
                        NestedQuery.of(n -> n
                                .path("movieCrew")
                                .query(q -> q.match(t -> t.field("movieCrew.name.ko").query(name)))
                        )._toQuery()
                )
                .weight(1.5)
        ));
        functions.add(FunctionScore.of(f -> f
                .filter(
                        NestedQuery.of(n -> n
                                .path("movieCrew")
                                .query(q -> q.match(t -> t.field("movieCrew.name.en").query(name)))
                        )._toQuery()
                )
                .weight(1.5)
        ));
    });
    return functions;
}
```

- `filter` 항목에 **NestedQuery**를 넣어, 해당 크루 이름이 match될 경우 점수를 1.5배로 높이도록 했습니다.  
- `scoreMode`와 `boostMode`를 사용해 점수를 합산합니다.

### 3.3 일반 문자열 검색 (제목, 장르, 출연진 등)

```java
@Override
public MovieDocumentResponseDto searchMovieList(String inputStr, Pageable pageable) {
    Query query = buildSearchMovieListQuery(inputStr);
    SearchHits<MovieDocument> searchHits = executeSearch(query, pageable, MovieDocument.class);

    List<MovieDocument> result = searchHits.stream()
            .map(SearchHit::getContent)
            .toList();

    int pageSize = pageable.getPageSize();
    long totalHits = searchHits.getTotalHits();
    long totalPages = (totalHits + pageSize - 1) / pageSize;

    return new MovieDocumentResponseDto(result, totalPages);
}

private Query buildSearchMovieListQuery(String inputStr) {
    List<Query> queries = new ArrayList<>();
    queries.addAll(buildTitleQueries(inputStr));
    queries.addAll(buildGenreQueries(inputStr));
    queries.addAll(buildCrewQueries(inputStr));

    // OR 조건의 should(...)로 묶어
    // 제목, 장르, 출연진 등 어딘가 일치하면 검색되도록 구성
    return Query.of(q -> q.bool(b -> b.should(queries)));
}
```

- **여러 필드**(제목, 장르, 출연진, ...) 중 하나라도 일치하면 검색되도록 `bool().should(...)`를 사용했습니다.

#### 3.3.1 제목 검색 쿼리

```java
private List<Query> buildTitleQueries(String inputStr) {
    List<Query> titleQueries = new ArrayList<>();
    titleQueries.add(Query.of(q -> q.match(m -> m.field("title").query(inputStr).boost(1.8f))));
    titleQueries.add(Query.of(q -> q.match(m -> m.field("title.en").query(inputStr).boost(1.8f))));
    titleQueries.add(Query.of(q -> q.match(m -> m.field("title.ngram").query(inputStr).boost(1.8f))));
    titleQueries.add(
        Query.of(q -> q.fuzzy(f -> f.field("title.standard").value(inputStr).fuzziness("AUTO").boost(1.4f)))
    );
    return titleQueries;
}
```

- **`title`, `title.en`, `title.ngram`, `title.standard`** 등 다양한 서브 필드를 매핑하여 더 정교한 검색을 한다.  
- `boost` 값을 다르게 설정해 특정 필드(ko / en)에 우선순위를 줄 수도 있습니다.  
- `fuzzy`를 사용하면 오타가 있더라도 유사 검색이 가능합니다.

#### 3.3.2 장르 검색 쿼리

```java
private List<Query> buildGenreQueries(String inputStr) {
    List<Query> genreQueries = new ArrayList<>();
    genreQueries.add(Query.of(q -> q.nested(n -> n
            .path("movieGenre")
            .query(Query.of(nq -> nq.term(t -> t.field("movieGenre.genreName").value(inputStr).boost(1.8f))))
    )));
    ...
    return genreQueries;
}
```

- 마찬가지로 `movieGenre`는 nested 필드이므로 `NestedQuery`로 감싸 장르 이름이 일치하는지 확인합니다.

#### 3.3.3 출연진/제작진 검색 쿼리

```java
private List<Query> buildCrewQueries(String inputStr) {
    List<Query> crewQueries = new ArrayList<>();
    crewQueries.add(Query.of(q -> q.nested(n -> n
            .path("movieCrew")
            .query(Query.of(nq -> nq.match(m -> m.field("movieCrew.name.ko").query(inputStr).boost(1.8f))))
    )));
    // movieCrew.name.en, movieCrew.name.ngram, fuzzy etc...
    return crewQueries;
}
```

- `movieCrew.name.ko`, `movieCrew.name.en` 등을 대상으로 match / fuzzy 쿼리를 사용합니다.

---

## 4. MovieDocument와 Domain 변환

Elasticsearch는 `MovieDocument` 형태로 인덱싱해둔 자료를 반환하지만,  
우리는 **도메인 객체**(`Movie`) 형태로 사용할 때가 많습니다.  

이를 위해 **Converter** 클래스(`MovieDocumentConverter`)를 만들어,  
Document ↔ Domain 사이 변환을 담당합니다.

```java
public class MovieDocumentConverter {

    public static MovieDocument entityToDocument(MovieEntity movieEntity) {
        // DB Entity -> Elasticsearch Document
        return MovieDocument.builder()
            .movieId(movieEntity.getMovieId())
            .title(movieEntity.getTitle())
            ...
            .movieGenre(
                movieEntity.getMovieGenreEntityList().stream()
                    .map(MovieDocumentConverter::entityToForDocument)
                    .toList()
            )
            .movieCrew(
                MovieDocumentConverter.entityToForDocument(movieEntity.getMovieRCrewEntityList())
            )
            .build();
    }

    public static Movie documentToDomain(MovieDocument movieDocument) {
        // Elasticsearch Document -> Domain Model
        return Movie.builder()
            .movieId(movieDocument.getMovieId())
            .title(movieDocument.getTitle())
            ...
            .movieGenreList(movieDocument.getMovieGenre().stream()
                .map(x -> new MovieGenre(x.getGenreId(), x.getGenreName()))
                .toList()
            )
            .movieRCrewList(movieDocument.getMovieCrew().stream()
                .map(m -> MovieRCrew.builder()
                        ...
                    .build())
                .toList()
            )
            .build();
    }
}
```

- `entityToDocument`: RDB 테이블로부터 가져온 엔티티를 Elasticsearch 도큐먼트로 변환해 인덱싱할 때 사용  
- `documentToDomain`: Elasticsearch 검색 결과(도큐먼트)를 `Movie` 도메인 객체로 전환해 애플리케이션 계층에서 활용  

---

## 5. 결론

정리해보자면,

1. **Controller** 계층에서 사용자 검색 요청을 받으면,  
2. **Service** 계층에서 비즈니스 로직(관심 장르, 최근 찜한 영화의 crew, 일반 검색 등)을 처리한 후,  
3. **MovieSearchRepository** 구현체에서 **ElasticsearchOperations**를 통해 실제 쿼리를 **FunctionScoreQuery**, **BoolQuery**, **NestedQuery** 등으로 구성해 실행합니다.

이런 방식을 통해 **장르별 가중치**, **제작진 이름 기반 가중치**, **오타 허용(fuzzy) 검색** 등의 고급 검색 기능을 쉽게 녹여낼 수 있습니다.

> **팁**: `NestedQuery`는 **nested 타입**의 필드에 접근할 때 필수적이고,  
> `FunctionScoreQuery`는 특정 조건을 만족할 때 점수를 높여랄 때 유용합니다.  
> `fuzzy`나 `ngram`은 사용자의 **오타**나 **부분 검색**을 허용해 더 풍부한 검색 기능을 제공할 수 있습니다.

---

### 요약

- **Spring Boot + Spring Data Elasticsearch**로 검색 기능을 구현할 때,  
  1) **도큐먼트**(MovieDocument)로 인덱싱하고,  
  2) `Repository`에서 `ElasticsearchOperations`를 이용해 **NativeQuery**를 빌드해서 실행한다.  
- **NestedQuery**를 통해 중첩 구조 필드(`movieGenre`, `movieCrew`)를 검색하고,  
- **FunctionScoreQuery**로 특정 조건(장르, crew 이름 등)에 가중치를 높일 수 있다.  
- (옵션) `fuzzy`, `ngram` 등 다양한 분석기를 통해 오타 허용 및 부분 일치 검색을 구현할 수 있다.
