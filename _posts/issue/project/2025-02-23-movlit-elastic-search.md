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
last_modified_at: 2025-04-20
---

> [Movlit 프로젝트](https://github.com/venus-lion/movlit-plus)에 대한 설명입니다.

## Elasticsearch 데이터 정의

Elasticsearch 사용의 첫 단계는 데이터 구조, 즉 인덱스 매핑을 정의하는 것입니다. Spring Data Elasticsearch에서는 `@Document` 어노테이션과 관련 필드 어노테이션을 사용합니다.

```java
package movlit.be.movie.domain.document;

@Document(indexName = "movies") // 1. 인덱스 이름 지정
@Setting(settingPath = "/mappings/movie-setting.json") // 2. 인덱스 설정 (분석기 등)
@Mapping(mappingPath = "/mappings/movie-mapping.json") // 3. 필드 매핑 상세 정의
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MovieDocument {

    @Id
    private Long movieId;

    // 4. Multi-field 예시: 다양한 분석 방식 적용
    @MultiField(mainField = @Field(type = FieldType.Text, analyzer = "korean_analyzer"), // 기본: 한국어 분석
            otherFields = {
                    @InnerField(suffix = "en", type = FieldType.Text, analyzer = "english_analyzer"), // 영어 분석용 (.en)
                    @InnerField(suffix = "ngram", type = FieldType.Text, analyzer = "my_ngram_analyzer"), // 부분일치용 (.ngram)
                    @InnerField(suffix = "standard", type = FieldType.Text, analyzer = "standard") // Fuzzy 검색 기반용 (.standard)
            })
    private String title;

    // 5. Keyword 타입 예시: 정확한 값 매칭 (필터링/집계용)
    @Field(type = FieldType.Keyword)
    private String originalLanguage;

    @Field(type = FieldType.Keyword)
    private String productionCountry;

    @Field(type = FieldType.Date, format = DateFormat.date, pattern = "yyyy-MM-dd")
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    private LocalDate releaseDate;

    // 6. Nested 타입 예시: 객체 배열 필드 (관계 유지)
    @Field(type = FieldType.Nested)
    private List<MovieGenreForDocument> movieGenre = new ArrayList<>();

    @Field(type = FieldType.Nested)
    private List<MovieCrewForDocument> movieCrew = new ArrayList<>();

    // --- 내부 중첩 객체 정의 ---
    @Getter @NoArgsConstructor @AllArgsConstructor
    public static class MovieGenreForDocument {
        @Field(type = FieldType.Long) // 또는 Keyword
        private Long genreId;
        @Field(type = FieldType.Keyword) // 보통 Keyword
        private String genreName;
    }

    @Getter @NoArgsConstructor @AllArgsConstructor
    public static class MovieCrewForDocument {
        @Field(type = FieldType.Long)
        private Long crewId;
        // 7. 객체 내 객체 필드 (Multi-field 가능)
        @Field(type = FieldType.Object) // 객체 타입으로 이름 필드 그룹화
        private NameFields name;
        @Field(type = FieldType.Keyword)
        private String role;
        @Field(type = FieldType.Integer)
        private Integer priority;
    }

    @Getter @NoArgsConstructor @AllArgsConstructor
    public static class NameFields { // 이름 다국어 지원 등
        @Field(type = FieldType.Text, analyzer = "korean_analyzer")
        private String ko;
        @Field(type = FieldType.Text, analyzer = "english_analyzer")
        private String en;
    }

    // ... other fields and nested types ...
}
```

1.  **`@Document(indexName = "movies")`**: 이 클래스가 Elasticsearch의 `movies` 인덱스에 매핑될 문서임을 나타냅니다.
2.  **`@Setting(...)`**: 인덱스 생성 시 적용될 설정 파일 경로입니다. 사용자 정의 분석기(`korean_analyzer`, `my_ngram_analyzer` 등) 정의가 주로 포함됩니다. 이 분석기들은 `@Field`나 `@MultiField`에서 참조됩니다.
3.  **`@Mapping(...)`**: 필드별 데이터 타입, 분석기 등을 상세히 정의하는 매핑 파일 경로입니다. 어노테이션으로 정의하기 복잡한 경우 유용합니다.
4.  **`@MultiField`**: `title` 필드 하나가 여러 방식으로 인덱싱되도록 합니다.
    - `mainField`: `title` 필드는 기본적으로 `korean_analyzer`를 사용합니다.
    - `otherFields`: 추가적인 하위 필드를 생성합니다.
      - `title.en`: `english_analyzer`를 사용해 영어 검색에 최적화됩니다.
      - `title.ngram`: `my_ngram_analyzer`를 사용해 "어벤져스" -> "어벤", "벤져", "져스" 등으로 분해하여 부분 일치 검색(`"벤져"`)을 가능하게 합니다.
      - `title.standard`: 표준 분석기를 사용하며, Fuzzy 검색(오타 교정) 시 기반 필드로 활용될 수 있습니다.
    - **효과**: 하나의 원본 데이터로 다양한 검색 요구사항(한국어, 영어, 부분일치, 오타보정 등)을 처리할 수 있습니다.
5.  **`@Field(type = FieldType.Keyword)`**: `originalLanguage`, `productionCountry` 등 분석 없이 원본 텍스트 그대로 저장해야 하는 필드에 사용됩니다. 정확한 값 필터링(예: `originalLanguage: "ko"`) 이나 집계(Aggregation)에 필수적입니다.
6.  **`@Field(type = FieldType.Nested)`**: `movieGenre`, `movieCrew`와 같은 객체 리스트에 사용됩니다. Elasticsearch는 기본적으로 배열 내 객체 구조를 평탄화시켜 `genreId: [1, 2]` 와 `genreName: ["Action", "Comedy"]` 처럼 저장할 수 있습니다. 이 경우 "1번 ID의 Comedy" 같은 잘못된 조합이 매칭될 수 있습니다. `Nested` 타입은 각 객체(`{genreId: 1, genreName: "Action"}`)를 내부 문서처럼 취급하여 **객체 내 필드 간의 관계를 유지**합니다. "1번 장르(Action)를 포함하는 영화"와 같이 객체 내부 조건을 조합하여 정확하게 검색하려면 `Nested` 타입과 `NestedQuery`가 반드시 필요합니다.
7.  **`@Field(type = FieldType.Object)`**: `NameFields`처럼 중첩된 단순 객체에 사용됩니다. `Nested`와 달리 배열이 아니며, 단순히 필드를 구조화합니다. 이 내부 필드(`ko`, `en`)들은 각자의 분석기를 가질 수 있습니다. 검색 시 `movieCrew.name.ko` 와 같이 경로를 통해 접근합니다.

## Elasticsearch Repository 구현

실제 Elasticsearch 쿼리는 Repository 구현체에서 `ElasticsearchOperations`를 사용하여 작성됩니다.

```java
@Repository
@RequiredArgsConstructor
public class MovieSearchRepositoryImpl implements MovieSearchRepository {

    private final ElasticsearchOperations elasticsearchOperations;
    // private final MovieDocumentConverter converter; // Domain <-> Document 변환

    // --- 공통 검색 실행 메소드 ---
    private <T> SearchHits<T> executeSearch(Query query, Pageable pageable, Class<T> clazz) {
        NativeQuery nativeQuery = NativeQuery.builder()
                .withQuery(query) // 1. 생성된 Elasticsearch 쿼리 객체
                .withPageable(pageable) // 2. 페이징 정보
                // .withSort(...) // 필요시 정렬 추가
                .build();
        return elasticsearchOperations.search(nativeQuery, clazz); // 3. 쿼리 실행
    }

    // --- 각 검색 시나리오별 메소드 ---
    // (searchMovieByMemberInterestGenre, searchMovieByMemberHeartCrew, searchMovieList)
    // 이 메소드들은 내부적으로 아래의 쿼리 빌더 메소드들을 호출합니다.

    // --- 쿼리 빌더 메소드 (핵심 로직) ---
    // private Query buildMemberInterestGenreQuery(List<Genre> genreList) { ... }
    // private Query buildMemberHeartCrewQuery(List<MovieCrewResponseDto> crewList) { ... }
    // private Query buildSearchMovieListQuery(String inputStr) { ... }

    // --- 결과 변환 로직 ---
    // private List<Movie> convertToMovies(SearchHits<MovieDocument> searchHits) { ... }
}
```

**기술 설명:**

1.  **`Query query`**: Java DSL (Domain Specific Language)을 사용하여 Elasticsearch 쿼리를 객체 형태로 표현합니다. `BoolQuery`, `MatchQuery`, `TermQuery`, `NestedQuery`, `FunctionScoreQuery` 등이 사용됩니다.
2.  **`Pageable pageable`**: Spring Data의 페이징 정보를 전달하여 결과 크기와 페이지 번호를 지정합니다.
3.  **`elasticsearchOperations.search(...)`**: 생성된 `NativeQuery`를 Elasticsearch 클러스터로 전송하고, 검색 결과를 `SearchHits` 객체로 받아옵니다. `SearchHits`는 검색된 문서(`MovieDocument`) 목록과 총 히트 수 등의 메타데이터를 포함합니다.

이제 구체적인 쿼리 빌더 메소드들을 살펴보겠습니다.

## 3. 핵심 쿼리 구현

### 3-1. 관심 장르 검색 (Nested Query + Function Score)

사용자의 관심 장르 목록(`genreList`)을 받아 관련 영화를 검색하고, 관심 장르와 일치하는 영화에 더 높은 점수를 부여합니다.

```java
// 관심 장르 검색 쿼리 생성
private Query buildMemberInterestGenreQuery(List<Genre> genreList) {
    // 1. 기본 조건: Nested 쿼리로 관심 장르 ID 중 하나라도 포함하는 영화 검색
    Query genreNestedQuery = buildGenreNestedQuery(genreList);

    // 2. 점수 조절 함수: 각 관심 장르 ID 포함 시 가중치 부여
    List<FunctionScore> functions = genreList.stream()
            .map(this::buildGenreFunctionScore)
            .collect(Collectors.toList());

    // 3. FunctionScoreQuery: 기본 쿼리 + 점수 함수 결합
    return FunctionScoreQuery.of(f -> f
            .query(genreNestedQuery)
            .functions(functions)
            .scoreMode(FunctionScoreMode.Sum) // 점수 합산 방식
            .boostMode(FunctionBoostMode.Sum) // 부스트 적용 방식
    )._toQuery();
}

// 'movieGenre'(Nested) 필드 내 'genreId' 검색 쿼리 생성
private Query buildGenreNestedQuery(List<Genre> genreList) {
    List<Query> genreQueries = genreList.stream()
        // TermQuery: 'movieGenre.genreId' 필드가 정확히 일치하는지 확인 (Keyword/Long 타입에 적합)
        .map(genre -> Query.of(q -> q.term(t -> t.field("movieGenre.genreId").value(genre.getId()))))
        .toList();

    // NestedQuery: 'movieGenre' 경로 내에서 쿼리 실행 (객체 관계 유지)
    return NestedQuery.of(n -> n
            .path("movieGenre") // @Field(type=FieldType.Nested) 필드 경로
            .query(q -> q.bool(b -> b.should(genreQueries))) // 여러 장르 ID 중 하나라도 일치 (OR 조건)
    )._toQuery();
}

// 특정 장르 ID('movieGenre.genreId') 매칭 시 가중치 부여 함수 생성
private FunctionScore buildGenreFunctionScore(Genre genre) {
    // FunctionScore의 필터 조건도 NestedQuery 사용!
    Query filterQuery = NestedQuery.of(n -> n
        .path("movieGenre")
        .query(q -> q.term(t -> t.field("movieGenre.genreId").value(genre.getId())))
    )._toQuery();

    // filterQuery와 일치하는 문서에 가중치(weight) 부여
    return FunctionScore.of(f -> f.filter(filterQuery).weight(1.5));
}
```

1.  **`buildGenreNestedQuery`**:
    - `movieGenre` 필드는 `MovieDocument`에서 `@Nested`로 정의되었으므로, 관련 검색은 `NestedQuery`를 사용해야 합니다.
    - `path("movieGenre")`는 검색 대상이 `nested` 필드임을 명시합니다.
    - 내부에서는 `TermQuery`를 사용해 `movieGenre.genreId` (각 중첩 객체 내의 ID)가 주어진 `genre.getId()`와 정확히 일치하는지 확인합니다.
    - `bool/should`는 여러 `TermQuery`를 OR 조건으로 묶어, 관심 장르 ID 중 하나라도 포함하면 매칭되도록 합니다.
2.  **`buildGenreFunctionScore`**:
    - `FunctionScoreQuery`는 기본 쿼리 결과에 추가 점수를 부여하여 순위를 조절합니다.
    - 여기서는 `filter` 조건을 사용합니다. 이 `filter`는 특정 장르 ID(`genre.getId()`)를 포함하는지 확인하는 `NestedQuery`입니다.
    - 해당 `filter`를 만족하는 문서(즉, 특정 관심 장르를 가진 영화)는 `weight(1.5)`에 의해 1.5배의 가중치를 받아 검색 결과 상위에 노출될 확률이 높아집니다.
3.  **`buildMemberInterestGenreQuery`**: 이 두 쿼리(기본 `NestedQuery`와 점수 조절용 `FunctionScore` 목록)를 `FunctionScoreQuery`로 조합하여 최종 쿼리를 완성합니다.

### 3-2. 찜한 영화 Crew 기반 검색 (Nested Query + Function Score)

사용자가 최근 찜한 영화들의 주요 제작진(`crewList`) 정보를 기반으로, 해당 제작진이 참여한 다른 영화를 추천합니다.

```java
// 'movieCrew'(Nested) 필드 내 이름 검색 쿼리 생성
private Query buildCrewNestedQuery(Set<String> crewNameSet) {
    // 이름 Set을 기반으로 한국어('ko')와 영어('en') 이름 필드 모두 검색
    List<Query> crewNameQueries = crewNameSet.stream()
        .flatMap(name -> Stream.of(
            // MatchQuery: 'movieCrew.name.ko' 필드 검색 (korean_analyzer 적용)
            Query.of(q -> q.match(t -> t.field("movieCrew.name.ko").query(name))),
            // MatchQuery: 'movieCrew.name.en' 필드 검색 (english_analyzer 적용)
            Query.of(q -> q.match(t -> t.field("movieCrew.name.en").query(name)))
        ))
        .toList();

    // NestedQuery: 'movieCrew' 경로 내에서 검색 (Crew 객체 단위)
    return NestedQuery.of(n -> n
            .path("movieCrew") // @Nested 필드 경로
            .query(q -> q.bool(b -> b.should(crewNameQueries))) // 이름 중 하나라도 매치 (OR)
    )._toQuery();
}

// 특정 Crew 이름 포함 시 가중치 부여 함수 생성
private List<FunctionScore> buildCrewFunctionScores(Set<String> crewNameSet) {
    List<FunctionScore> functions = new ArrayList<>();
    crewNameSet.forEach(name -> {
        // 한국어 이름('ko') 매칭 시 가중치 부여
        functions.add(FunctionScore.of(f -> f
                .filter( // Filter 조건: Nested Query 사용
                    NestedQuery.of(n -> n.path("movieCrew")
                        .query(q -> q.match(t -> t.field("movieCrew.name.ko").query(name))) // Match로 이름 검색
                    )._toQuery()
                ).weight(1.5)
        ));
        // 영어 이름('en') 매칭 시 가중치 부여
        functions.add(FunctionScore.of(f -> f
                .filter( // Filter 조건: Nested Query 사용
                    NestedQuery.of(n -> n.path("movieCrew")
                         .query(q -> q.match(t -> t.field("movieCrew.name.en").query(name))) // Match로 이름 검색
                    )._toQuery()
                ).weight(1.5)
        ));
    });
    return functions;
}

// 전체 로직 (searchMovieByMemberHeartCrew 메소드 내)
// 1. crewList에서 주요 이름(crewNameSet) 추출
// 2. 이미 찜한 영화 제외 쿼리 생성 (mustNot, TermQuery on movieId)
// 3. Crew 이름 기반 기본 검색 쿼리 생성 (must, buildCrewNestedQuery 사용)
// 4. BoolQuery로 must, mustNot 조합
// 5. Crew 이름 포함 시 가중치 부여 함수 리스트 생성 (buildCrewFunctionScores 사용)
// 6. FunctionScoreQuery로 BoolQuery와 함수 리스트 결합
```

- **`buildCrewNestedQuery`**:
  - `movieCrew` 필드 역시 `@Nested` 타입이므로 `NestedQuery`를 사용합니다.
  - `movieCrew` 객체 내부의 `name` 객체(`NameFields`) 안의 `ko`와 `en` 필드를 타겟으로 검색합니다 (`movieCrew.name.ko`, `movieCrew.name.en`).
  - 이름은 분석이 필요한 텍스트이므로 `TermQuery` 대신 `MatchQuery`를 사용합니다. `MovieDocument` 정의에 따라 `ko` 필드는 `korean_analyzer`, `en` 필드는 `english_analyzer`가 적용됩니다.
  - `bool/should`를 사용해 주어진 이름 목록 중 하나라도 한국어 또는 영어 이름과 일치하면 매칭됩니다.
- **`buildCrewFunctionScores`**:
  - 관심 장르와 유사하게, 특정 제작진의 이름이 포함된 영화에 가중치를 부여합니다.
  - `FunctionScore`의 `filter` 조건으로 `NestedQuery`를 사용하며, 내부에서 `MatchQuery`로 `movieCrew.name.ko` 또는 `movieCrew.name.en` 필드를 검색하여 해당 이름이 포함된 영화 문서에 `weight`를 적용합니다.

### 3-3. 일반 텍스트 검색 (Multi-field, Nested, Fuzzy)

사용자가 입력한 문자열(`inputStr`)을 기반으로 영화 제목, 장르, 제작진 등 다양한 필드에서 검색합니다.

```java
// 일반 텍스트 검색 쿼리 생성
private Query buildSearchMovieListQuery(String inputStr) {
    List<Query> queries = new ArrayList<>();

    // 1. 제목(@MultiField) 관련 필드 검색 쿼리 추가
    queries.addAll(buildTitleQueries(inputStr));
    // 2. 장르(@Nested) 관련 필드 검색 쿼리 추가
    queries.addAll(buildGenreQueries(inputStr));
    // 3. 제작진(@Nested) 관련 필드 검색 쿼리 추가
    queries.addAll(buildCrewQueries(inputStr));
    // 4. 필요시 다른 필드(overview 등) 검색 쿼리 추가 가능

    // BoolQuery: 모든 하위 쿼리들을 OR 조건(should)으로 결합
    // minimumShouldMatch("1"): should 절 중 최소 1개는 만족해야 함
    return Query.of(q -> q.bool(b -> b.should(queries).minimumShouldMatch("1")));
}

// 제목 필드('@MultiField') 검색 쿼리 생성
private List<Query> buildTitleQueries(String inputStr) {
    List<Query> titleQueries = new ArrayList<>();
    // MovieDocument에서 @MultiField로 정의된 하위 필드들을 타겟
    // 기본 한국어 필드 ('title') - 높은 가중치
    titleQueries.add(Query.of(q -> q.match(m -> m.field("title").query(inputStr).boost(2.0f))));
    // 영어 필드 ('title.en')
    titleQueries.add(Query.of(q -> q.match(m -> m.field("title.en").query(inputStr).boost(1.8f))));
    // Ngram 필드 ('title.ngram') - 부분 일치
    titleQueries.add(Query.of(q -> q.match(m -> m.field("title.ngram").query(inputStr).boost(1.5f))));
    // Fuzzy 검색 (오타 교정) - 'title.standard' 필드 타겟
    titleQueries.add(
        Query.of(q -> q.fuzzy(f -> f.field("title.standard") // .standard 필드 사용
                                 .value(inputStr)
                                 .fuzziness("AUTO") // 편집 거리 자동 설정
                                 .boost(1.4f)))
    );
    return titleQueries;
}

// 장르 이름('movieGenre.genreName', Nested) 검색 쿼리 생성
private List<Query> buildGenreQueries(String inputStr) {
    // NestedQuery 사용 (movieGenre는 Nested 타입)
    return List.of(Query.of(q -> q.nested(n -> n
            .path("movieGenre")
            // genreName이 Keyword 타입이라면 Term, Text 타입이라면 Match 사용
            .query(Query.of(nq -> nq.term(t -> t.field("movieGenre.genreName").value(inputStr).boost(1.8f)))) // Term 예시
            // .query(Query.of(nq -> nq.match(m -> m.field("movieGenre.genreName").query(inputStr).boost(1.8f)))) // Match 예시
    )));
}

// Crew 이름('movieCrew.name.ko', 'movieCrew.name.en', Nested) 검색 쿼리 생성
private List<Query> buildCrewQueries(String inputStr) {
    List<Query> crewQueries = new ArrayList<>();
    // NestedQuery 사용 (movieCrew는 Nested 타입)
    // 한국어 이름 ('ko', Text, korean_analyzer)
    crewQueries.add(Query.of(q -> q.nested(n -> n
            .path("movieCrew")
            .query(Query.of(nq -> nq.match(m -> m.field("movieCrew.name.ko").query(inputStr).boost(1.8f))))
    )));
    // 영어 이름 ('en', Text, english_analyzer)
    crewQueries.add(Query.of(q -> q.nested(n -> n
            .path("movieCrew")
            .query(Query.of(nq -> nq.match(m -> m.field("movieCrew.name.en").query(inputStr).boost(1.6f))))
    )));
    return crewQueries;
}
```

- **`buildTitleQueries`**:
  - `MovieDocument`의 `title` 필드에 정의된 `@MultiField`를 최대한 활용합니다.
  - `match` 쿼리를 사용하여 `title`(한국어 분석), `title.en`(영어 분석), `title.ngram`(부분 일치) 필드를 각각 검색합니다.
  - `fuzzy` 쿼리를 사용하여 `title.standard` 필드를 대상으로 오타 교정 검색을 수행합니다 (`fuzziness("AUTO")`).
  - 각 쿼리에는 `boost` 값을 주어 검색 결과의 점수에 영향을 미칩니다 (예: 기본 `title` 필드 매칭 시 더 높은 점수 부여).
- **`buildGenreQueries` / `buildCrewQueries`**:
  - `movieGenre`와 `movieCrew`는 `@Nested` 타입이므로 `NestedQuery`를 사용합니다.
  - `path`를 지정하고, 내부 쿼리에서 해당 중첩 객체 내의 필드(`movieGenre.genreName`, `movieCrew.name.ko`, `movieCrew.name.en`)를 타겟으로 검색합니다.
  - 필드 타입(`Keyword` 또는 `Text`)과 분석 필요 여부에 따라 `TermQuery` 또는 `MatchQuery`를 적절히 선택합니다.
- **`buildSearchMovieListQuery`**:
  - 각 필드 그룹(제목, 장르, 제작진 등)에 대한 쿼리 목록을 생성합니다.
  - 최종적으로 이 모든 쿼리들을 `BoolQuery`의 `should` 절에 넣어 OR 조건으로 결합합니다. 즉, 제목, 장르, 제작진 중 어디에서든 입력 문자열과 관련된 결과가 나오면 해당 영화를 검색 결과에 포함시킵니다. `minimumShouldMatch("1")`은 `should` 조건 중 하나 이상은 만족해야 함을 의미합니다.

## Document 데이터 변환

Elasticsearch 검색 결과(`MovieDocument`)를 애플리케이션 도메인 객체(`Movie`)로, 또는 RDB 엔티티(`MovieEntity`)를 Elasticsearch 문서(`MovieDocument`)로 변환하는 로직입니다.

```java
public class MovieDocumentConverter {

    // RDB Entity -> Elasticsearch Document
    public static MovieDocument entityToDocument(MovieEntity movieEntity) {
        return MovieDocument.builder()
            .movieId(movieEntity.getMovieId())
            .title(movieEntity.getTitle())
            // ... other fields ...
            // Nested List 변환
            .movieGenre(movieEntity.getMovieGenreEntityList().stream()
                    .map(entity -> new MovieDocument.MovieGenreForDocument(
                            entity.getGenre().getId(),
                            entity.getGenre().getName())) // Entity -> Document 내부 클래스
                    .toList())
            .movieCrew(movieEntity.getMovieRCrewEntityList().stream()
                    .map(entity -> new MovieDocument.MovieCrewForDocument(
                            entity.getCrew().getId(),
                            // NameFields 객체 생성 및 매핑
                            new MovieDocument.NameFields(entity.getCrew().getNameKo(), entity.getCrew().getNameEn()),
                            entity.getRole(),
                            entity.getPriority()))
                    .toList())
            .build();
    }

    // Elasticsearch Document -> Application Domain Object
    public static Movie documentToDomain(MovieDocument movieDocument) {
        return Movie.builder()
            .movieId(movieDocument.getMovieId())
            .title(movieDocument.getTitle())
            // ... other fields ...
            // Nested List 변환
            .movieGenreList(movieDocument.getMovieGenre().stream()
                .map(genreDoc -> new MovieGenre(genreDoc.getGenreId(), genreDoc.getGenreName())) // Document 내부 클래스 -> Domain 객체
                .toList())
            .movieRCrewList(movieDocument.getMovieCrew().stream()
                .map(crewDoc -> MovieRCrew.builder()
                        .crewId(crewDoc.getCrewId())
                        // Nested 객체의 필드 접근
                        .nameKo(crewDoc.getName().getKo())
                        .nameEn(crewDoc.getName().getEn())
                        .role(crewDoc.getRole())
                        .priority(crewDoc.getPriority())
                        .build())
                .toList())
            .build();
    }
}
```

- 이 클래스는 객체 간의 구조적 차이를 메우는 역할을 합니다.
- 특히 `Nested` 타입 필드(`movieGenre`, `movieCrew`)를 변환할 때, 리스트 내의 각 객체를 순회하며 `MovieDocument`의 내부 static 클래스(`MovieGenreForDocument`, `MovieCrewForDocument`)와 도메인/엔티티 객체 간에 필드를 매핑합니다.
- `MovieCrewForDocument` 내의 `NameFields` 객체와 같이 중첩된 객체 구조도 정확히 매핑해주어야 합니다.
