---
title: "[Project] Rest Assured로 테스트 코드 성공 시, Rest Docs가 생성되게 구현하는 법"
excerpt: "movlit, recap, rest-assured, rest-docs, spring-boot"

categories:
  - Project
tags:
  - [movlit, recap, rest-assured, rest-docs, spring-boot]

toc: true
toc_sticky: true

sidebar:
  nav: "categories"

date: 2025-04-04
last_modified_at: 2025-04-04
---

> [Movlit 프로젝트](https://github.com/venus-lion/movlit-plus)에 대한 설명입니다.

## 서론

정말 많은 블로그에 Rest Assured와 Rest Docs를 연동하는 글이 있지만, 여러 가지 버전 문제 때문에 잘 안 되는 분들께 공유 드리고자 합니다.  

스프링부트 버전은 `3.4.1`을 사용했으며, 인수 테스트를 중심으로 개발하였습니다.

## `build.gradle`

```gradle
plugins {
    id 'java'
    id 'org.springframework.boot' version '3.4.1'
    id 'io.spring.dependency-management' version '1.0.11.RELEASE'
    id "org.asciidoctor.jvm.convert" version "3.3.2"
}

group = 'movlit'
version = '0.0.1-SNAPSHOT'

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(17)
    }
}

configurations {
    compileOnly {
        extendsFrom annotationProcessor
    }

    asciidoctorExt
}


repositories {
    mavenCentral()
}

dependencies {
    // Rest Assured
    testImplementation 'io.rest-assured:rest-assured:5.3.0'
    testImplementation 'io.rest-assured:json-path:5.3.0'
    testImplementation 'io.rest-assured:xml-path:5.3.0'

    // Spring REST Docs
    testImplementation 'org.springframework.restdocs:spring-restdocs-mockmvc'
    asciidoctorExt 'org.springframework.restdocs:spring-restdocs-asciidoctor'
    testImplementation 'org.springframework.restdocs:spring-restdocs-restassured:3.0.0' // Rest Assured와 함께 사용
}

ext {
    snippetsDir = file('build/generated-snippets')
}

test {
    outputs.dir snippetsDir
}

asciidoctor {
    inputs.dir snippetsDir
    configurations 'asciidoctorExt'
    dependsOn test
}

bootJar {
    dependsOn asciidoctor
    from("${asciidoctor.outputDir}") {
        into "BOOT-INF/classes/static/docs"
    }
}
tasks.named('test') {
    useJUnitPlatform()
}
```

- dependencies에 연동만을 위한 구현체만 존재하기 때문에 현재 프로젝트에서 사용되는 구현체를 추가해주시면 됩니다.

## asciidoc 생성

```adoc
= Venus Application API Document
:doctype: book
:icons: font
:source-highlighter: highlightjs
:toc: left
:toclevels: 2
:sectlinks:


[[auth]]
== 인증/인가

=== 로그인

==== 성공
operation::login_success[snippets='http-request,http-response']

==== 실패
operation::login_failedByUnregisteredEmail[snippets='http-request,http-response']

=== 로그아웃

==== 성공
operation::logout_success[snippets='http-request,http-response']

```

- `src/docs/asciidoc/index.adoc` 위치에 있는 index 파일을 생성합니다.
- 양식은 `[[auth]]`처럼 커스텀 방식으로 도메인에 따라 늘려나가시면 됩니다.

## Rest Assured 인수 테스트 설정

```java
package movlit.be.acceptance;

@SpringBootTest(webEnvironment = WebEnvironment.RANDOM_PORT)
@ExtendWith(RestDocumentationExtension.class)
@ActiveProfiles("test")
public abstract class AcceptanceTest {

    public static final DockerImageName MYSQL_IMAGE = DockerImageName.parse("mysql:8.0");
    public static final DockerImageName REDIS_IMAGE = DockerImageName.parse("redis:7.2");
    public static final MySQLContainer<?> MYSQL = new MySQLContainer<>(MYSQL_IMAGE)
            .withDatabaseName("test").withUsername("root").withPassword("1234").withReuse(true);
    public static final GenericContainer<?> REDIS = new GenericContainer<>(REDIS_IMAGE).withReuse(true);

    static {
        MYSQL.setPortBindings(List.of("3307:3306"));
        REDIS.setPortBindings(List.of("6379:6379"));
    }

    @LocalServerPort
    public int port;

    public String 회원_원준_액세스토큰;
    public String 회원_지원_액세스토큰;
    public String 회원_민지_액세스토큰;
    public String 회원_윤기_액세스토큰;

    @Autowired
    protected DatabaseCleanup databaseCleanup;

    @Autowired
    protected TableCleanup tableCleanup;

    @Autowired
    protected SqlFileExecutor sqlFileExecutor;
    protected RequestSpecification spec;

    public static void api_문서_타이틀(String documentName, RequestSpecification specification) {
        specification.filter(document(
                documentName,
                Preprocessors.preprocessRequest(Preprocessors.prettyPrint()),
                Preprocessors.preprocessResponse(Preprocessors.prettyPrint())
        ));
    }

    @PostConstruct
    public void setRestAssuredPort() {
        RestAssured.port = port;
    }

    protected void 데이터베이스를_초기화한다() {
        databaseCleanup.execute();
        sqlFileExecutor.execute("data_mainTest.sql");
    }

    protected void 테이블을_비운다(String tableName) {
        tableCleanup.setTableName(tableName);
        tableCleanup.execute();
    }

    @BeforeEach
    void setSpec(RestDocumentationContextProvider provider) {
        데이터베이스를_초기화한다();
        initAccessToken();
        this.spec = new RequestSpecBuilder().addFilter(
                RestAssuredRestDocumentation.documentationConfiguration(provider)).build();
    }

    @BeforeAll
    static void startContainer() {
        MYSQL.start();
        REDIS.start();
    }

    private void initAccessToken() {
        회원_원준_액세스토큰 = 원준_액세스토큰_요청();
        회원_민지_액세스토큰 = 민지_액세스토큰_요청();
        회원_윤기_액세스토큰 = 윤기_액세스토큰_요청();
        회원_지원_액세스토큰 = 지원_액세스토큰_요청();
    }

    private static String 원준_액세스토큰_요청() {
        원준_회원가입();
        return 원준이_로그인한다(new RequestSpecBuilder().build()).jsonPath().getString("accessToken");
    }

    private static String 민지_액세스토큰_요청() {
        민지_회원가입();
        return 민지가_로그인한다(new RequestSpecBuilder().build()).jsonPath().getString("accessToken");
    }

    private static String 윤기_액세스토큰_요청() {
        윤기_회원가입();
        return 윤기가_로그인한다(new RequestSpecBuilder().build()).jsonPath().getString("accessToken");
    }

    private static String 지원_액세스토큰_요청() {
        지원_회원가입();
        return 지원이_로그인한다(new RequestSpecBuilder().build()).jsonPath().getString("accessToken");
    }

}
```

```java
// (예시)
@DisplayName("영화 코멘트를 작성하는 데 성공하면, 상태코드 200과 body를 반환한다.")
@Test
void when_create_movie_comment_then_response_200_and_body() {
    // docs
    api_문서_타이틀("createMovieComment_success", spec);

    // given
    String accessToken = 회원_원준_액세스토큰;

    // when
    var response = 영화_코멘트_작성을_요청한다(accessToken, movieId, spec);

    // then
    상태코드가_200이다(response);
}
```

- 이것은 제가 프로젝트에 적용했던 인수 테스트 설정 파일입니다.
- 인수 테스트를 진행할 때, `AcceptanceTest`를 상속한 클래스에 (예시) 메서드처럼 구현을 하게 된다면 완성입니다.
- 결론만 말씀드리면, `static/docs/index.html`으로 잘 변환이 되어 API 문서가 생성되게 됩니다.

## RestDocsController

```java
package movlit.be.common;

@RestController
public class RestDocsController {

    @GetMapping("/api/docs")
    public ResponseEntity<Resource> getDocs() {
        Resource resource = new ClassPathResource("static/docs/index.html");

        if (!resource.exists()) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }

        return ResponseEntity.ok()
                .contentType(MediaType.TEXT_HTML).body(resource);
    }

}
```

- 이 컨트롤러를 이용하시면 향후 배포가 되었을 때, `/api/docs` 경로로 API 문서를 접근할 수 있게 됩니다.
- Vite React 개발 환경에서는 **프록시에 경로 추가**, 배포 환경에서는 **리스너 규칙에 경로 추가** 하는 것도 꼭 잊지 말아주세요!

### 성공 시 화면

<img src="https://github.com/user-attachments/assets/8577372b-633b-4e48-bda3-54d269e5a6cb" style="width: 600px" alt="API Documentation Example">
