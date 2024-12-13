---
title: "[Spring Security] OAuth2 공식 문서 번역 (1)"
excerpt: "spring-security, oauth"

categories:
  - Spring
tags:
  - [spring-security, oauth]

toc: true
toc_sticky: true

sidebar:
  nav: "categories"

date: 2024-12-13
last_modified_at: 2024-12-13
---

> [해당 공식 문서 원본 링크](https://docs.spring.io/spring-security/reference/servlet/oauth2/index.html)

# OAuth 2.0

Spring Security는 포괄적인 OAuth 2.0 지원을 제공합니다. 이 섹션에서는 서블릿 기반 애플리케이션에 OAuth 2.0을 통합하는 방법에 대해 설명합니다.

## 개요

Spring Security의 OAuth 2.0 지원은 주로 두 가지 주요 기능으로 구성됩니다.

- **OAuth2 리소스 서버**
- **OAuth2 클라이언트**

OAuth2 로그인은 매우 강력한 OAuth2 클라이언트 기능이지만, 자체적인 섹션에서 다룰 예정입니다. 단독 기능이 아니며 작동하려면 OAuth2 클라이언트가 필요합니다.

이러한 기능은 OAuth 2.0 인증 프레임워크에 정의된 리소스 서버 및 클라이언트 역할을 다루고, 인증 서버 역할은 Spring Security를 기반으로 구축된 별도의 프로젝트인 **Spring Authorization Server**에서 다룹니다.

OAuth2에서 리소스 서버와 클라이언트 역할은 일반적으로 하나 이상의 서버 측 애플리케이션으로 표현됩니다. 또한 인증 서버 역할은 하나 이상의 타사(조직 내에서 ID 관리 및/또는 인증을 중앙 집중화하는 경우)로 표현되거나 애플리케이션(Spring Authorization Server의 경우)으로 표현될 수 있습니다.

예를 들어, 일반적인 OAuth2 기반 마이크로서비스 아키텍처는 단일 사용자 대면 클라이언트 애플리케이션, REST API를 제공하는 여러 백엔드 리소스 서버 및 사용자 및 인증 문제를 관리하는 타사 인증 서버로 구성될 수 있습니다. 또한 이러한 역할 중 하나만 나타내는 단일 애플리케이션이 다른 역할을 제공하는 하나 이상의 타사와 통합해야 하는 경우도 흔합니다.

Spring Security는 이러한 시나리오 등을 처리합니다. 다음 섹션에서는 Spring Security에서 제공하는 역할에 대해 설명하고 일반적인 시나리오에 대한 예를 포함합니다.

## OAuth2 리소스 서버

이 섹션에는 예제가 포함된 OAuth2 리소스 서버 기능에 대한 요약이 포함되어 있습니다. 전체 참조 문서는 [OAuth 2.0 리소스 서버](https://docs.spring.io/spring-security/reference/servlet/oauth2/resource-server/index.html)를 참조하세요.

시작하려면 프로젝트에 `spring-security-oauth2-resource-server` 의존성을 추가합니다. Spring Boot를 사용하는 경우 다음 스타터를 추가합니다.

**Spring Boot를 사용한 OAuth2 클라이언트**

- **Gradle**

  ```gradle
  implementation 'org.springframework.boot:spring-boot-starter-oauth2-resource-server'
  ```

- **Maven**

  ```xml
  <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-oauth2-resource-server</artifactId>
  </dependency>
  ```

Spring Boot를 사용하지 않는 경우 추가 옵션은 [Getting Spring Security](https://docs.spring.io/spring-security/reference/servlet/getting-spring-security.html)를 참조하세요.

OAuth2 리소스 서버에 대한 다음 사용 사례를 고려하세요.

- OAuth2를 사용하여 API에 대한 액세스를 보호하려고 합니다(인증 서버는 JWT 또는 불투명 액세스 토큰을 제공함).
- JWT(사용자 정의 토큰)를 사용하여 API에 대한 액세스를 보호하려고 합니다.

### OAuth2 액세스 토큰으로 액세스 보호

OAuth2 액세스 토큰을 사용하여 API에 대한 액세스를 보호하는 것은 매우 일반적입니다. 대부분의 경우 Spring Security는 OAuth2로 애플리케이션을 보호하기 위해 최소한의 구성만 필요합니다.

Spring Security에서 지원하는 두 가지 유형의 Bearer 토큰이 있으며 각각 유효성 검사에 다른 구성 요소를 사용합니다.

- **JWT 지원**은 `JwtDecoder` 빈을 사용하여 서명을 확인하고 토큰을 디코딩합니다.
- **불투명 토큰 지원**은 `OpaqueTokenIntrospector` 빈을 사용하여 토큰을 검사합니다.

#### JWT 지원

다음 예제는 Spring Boot 구성 속성을 사용하여 `JwtDecoder` 빈을 구성합니다.

```yaml
spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          issuer-uri: https://my-auth-server.com
```

Spring Boot를 사용하는 경우 이것이 필요한 전부입니다. Spring Boot에서 제공하는 기본 설정은 다음과 같습니다.

**JWT를 사용한 리소스 서버 구성**

- **Java**

  ```java
  @Configuration
  @EnableWebSecurity
  public class SecurityConfig {

      @Bean
      public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
          http
              .authorizeHttpRequests((authorize) -> authorize
                  .anyRequest().authenticated()
              )
              .oauth2ResourceServer((oauth2) -> oauth2
                  .jwt(Customizer.withDefaults())
              );
          return http.build();
      }

      @Bean
      public JwtDecoder jwtDecoder() {
          return JwtDecoders.fromIssuerLocation("https://my-auth-server.com");
      }

  }
  ```

- **Kotlin**

  ```kotlin
  @Configuration
  @EnableWebSecurity
  class SecurityConfig {

      @Bean
      fun securityFilterChain(http: HttpSecurity): SecurityFilterChain {
          http
              .authorizeHttpRequests { authorize ->
                  authorize.anyRequest().authenticated()
              }
              .oauth2ResourceServer { oauth2 ->
                  oauth2.jwt { }
              }
          return http.build()
      }

      @Bean
      fun jwtDecoder(): JwtDecoder {
          return JwtDecoders.fromIssuerLocation("https://my-auth-server.com")
      }

  }
  ```

#### 불투명 토큰 지원

다음 예제는 Spring Boot 구성 속성을 사용하여 `OpaqueTokenIntrospector` 빈을 구성합니다.

```yaml
spring:
  security:
    oauth2:
      resourceserver:
        opaquetoken:
          introspection-uri: https://my-auth-server.com/oauth2/introspect
          client-id: my-client-id
          client-secret: my-client-secret
```

Spring Boot를 사용하는 경우 이것이 필요한 전부입니다. Spring Boot에서 제공하는 기본 설정은 다음과 같습니다.

**불투명 토큰을 사용한 리소스 서버 구성**

- **Java**

  ```java
  @Configuration
  @EnableWebSecurity
  public class SecurityConfig {

      @Bean
      public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
          http
              .authorizeHttpRequests((authorize) -> authorize
                  .anyRequest().authenticated()
              )
              .oauth2ResourceServer((oauth2) -> oauth2
                  .opaqueToken(Customizer.withDefaults())
              );
          return http.build();
      }

      @Bean
      public OpaqueTokenIntrospector opaqueTokenIntrospector() {
          return new SpringOpaqueTokenIntrospector(
              "https://my-auth-server.com/oauth2/introspect", "my-client-id", "my-client-secret");
      }

  }
  ```

- **Kotlin**

  ```kotlin
  @Configuration
  @EnableWebSecurity
  class SecurityConfig {

      @Bean
      fun securityFilterChain(http: HttpSecurity): SecurityFilterChain {
          http
              .authorizeHttpRequests { authorize ->
                  authorize.anyRequest().authenticated()
              }
              .oauth2ResourceServer { oauth2 ->
                  oauth2.opaqueToken { }
              }
          return http.build()
      }

      @Bean
      fun opaqueTokenIntrospector(): OpaqueTokenIntrospector {
          return SpringOpaqueTokenIntrospector(
              "https://my-auth-server.com/oauth2/introspect", "my-client-id", "my-client-secret"
          )
      }

  }
  ```

### 사용자 정의 JWT로 액세스 보호

특히 프런트엔드가 단일 페이지 애플리케이션으로 개발된 경우 JWT를 사용하여 API에 대한 액세스를 보호하는 것이 일반적인 목표입니다. Spring Security의 OAuth2 리소스 서버 지원은 사용자 정의 JWT를 포함한 모든 유형의 Bearer 토큰에 사용할 수 있습니다.

JWT를 사용하여 API를 보호하는 데 필요한 것은 `JwtDecoder` 빈뿐이며, 이 빈은 서명을 확인하고 토큰을 디코딩하는 데 사용됩니다. Spring Security는 제공된 빈을 사용하여 `SecurityFilterChain` 내에서 보호를 자동으로 구성합니다.

다음 예제는 Spring Boot 구성 속성을 사용하여 `JwtDecoder` 빈을 구성합니다.

```yaml
spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          public-key-location: classpath:my-public-key.pub
```

공개 키를 클래스 경로 리소스(이 예에서는 `my-public-key.pub`라고 함)로 제공할 수 있습니다.

Spring Boot를 사용하는 경우 이것이 필요한 전부입니다. Spring Boot에서 제공하는 기본 설정은 다음과 같습니다.

**사용자 정의 JWT를 사용한 리소스 서버 구성**

- **Java**

  ```java
  @Configuration
  @EnableWebSecurity
  public class SecurityConfig {

      @Bean
      public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
          http
              .authorizeHttpRequests((authorize) -> authorize
                  .anyRequest().authenticated()
              )
              .oauth2ResourceServer((oauth2) -> oauth2
                  .jwt(Customizer.withDefaults())
              );
          return http.build();
      }

      @Bean
      public JwtDecoder jwtDecoder() {
          return NimbusJwtDecoder.withPublicKey(publicKey()).build();
      }

      private RSAPublicKey publicKey() {
          // ...
      }

  }
  ```

- **Kotlin**

  ```kotlin
  @Configuration
  @EnableWebSecurity
  class SecurityConfig {

      @Bean
      fun securityFilterChain(http: HttpSecurity): SecurityFilterChain {
          http
              .authorizeHttpRequests { authorize ->
                  authorize.anyRequest().authenticated()
              }
              .oauth2ResourceServer { oauth2 ->
                  oauth2.jwt { }
              }
          return http.build()
      }

      @Bean
      fun jwtDecoder(): JwtDecoder {
          return NimbusJwtDecoder.withPublicKey(publicKey()).build()
      }

      private fun publicKey(): RSAPublicKey {
          // ...
      }

  }
  ```

Spring Security는 토큰을 생성하는 엔드포인트를 제공하지 않습니다. 그러나 Spring Security는 `JwtEncoder` 인터페이스와 하나의 구현인 `NimbusJwtEncoder`를 제공합니다.

## OAuth2 클라이언트

이 섹션에는 예제가 포함된 OAuth2 클라이언트 기능에 대한 요약이 포함되어 있습니다. 전체 참조 문서는 [OAuth 2.0 클라이언트](https://docs.spring.io/spring-security/reference/servlet/oauth2/client/index.html) 및 [OAuth 2.0 로그인](https://docs.spring.io/spring-security/reference/servlet/oauth2/login/index.html)을 참조하세요.

시작하려면 프로젝트에 `spring-security-oauth2-client` 의존성을 추가합니다. Spring Boot를 사용하는 경우 다음 스타터를 추가합니다.

**Spring Boot를 사용한 OAuth2 클라이언트**

- **Gradle**

  ```gradle
  implementation 'org.springframework.boot:spring-boot-starter-oauth2-client'
  ```

- **Maven**

  ```xml
  <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-oauth2-client</artifactId>
  </dependency>
  ```

Spring Boot를 사용하지 않는 경우 추가 옵션은 [Getting Spring Security](https://docs.spring.io/spring-security/reference/servlet/getting-spring-security.html)를 참조하세요.

OAuth2 클라이언트에 대한 다음 사용 사례를 고려하세요.

- OAuth 2.0 또는 OpenID Connect 1.0을 사용하여 사용자를 로그인하려고 합니다.
- `RestClient`를 사용하여 사용자를 위한 액세스 토큰을 얻어 타사 API에 액세스하려고 합니다.
- `WebClient`를 사용하여 사용자를 위한 액세스 토큰을 얻어 타사 API에 액세스하려고 합니다.
- 두 가지 모두(사용자 로그인 및 타사 API 액세스)를 하려고 합니다.
- `client_credentials` 부여 유형을 사용하여 애플리케이션당 단일 토큰을 얻으려고 합니다.
- 확장 부여 유형을 활성화하려고 합니다.
- 기존 부여 유형을 사용자 정의하려고 합니다.
- 토큰 요청 매개변수를 사용자 정의하려고 합니다.
- OAuth2 클라이언트 구성 요소에서 사용하는 `RestOperations`를 사용자 정의하려고 합니다.

### OAuth2로 사용자 로그인

OAuth2를 통해 사용자를 로그인해야 하는 경우는 매우 일반적입니다. OpenID Connect 1.0은 `id_token`이라는 특수 토큰을 제공하여 OAuth2 클라이언트가 사용자 ID 확인을 수행하고 사용자를 로그인할 수 있는 기능을 제공합니다. 특정 경우 OAuth2를 직접 사용하여 사용자를 로그인할 수 있습니다(예: GitHub 및 Facebook과 같이 OpenID Connect를 구현하지 않는 인기 있는 소셜 로그인 제공업체의 경우).

다음 예제는 OAuth2 또는 OpenID Connect로 사용자를 로그인할 수 있는 OAuth2 클라이언트 역할을 하도록 애플리케이션을 구성합니다.

**OAuth2 로그인 구성**

- **Java**

  ```java
  @Configuration
  @EnableWebSecurity
  public class SecurityConfig {

      @Bean
      public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
          http
              // ...
              .oauth2Login(Customizer.withDefaults());
          return http.build();
      }

  }
  ```

- **Kotlin**

  ```kotlin
  @Configuration
  @EnableWebSecurity
  class SecurityConfig {

      @Bean
      fun securityFilterChain(http: HttpSecurity): SecurityFilterChain {
          http
              // ...
              .oauth2Login { }
          return http.build()
      }

  }
  ```

위의 구성 외에도 애플리케이션은 `ClientRegistrationRepository` 빈을 사용하여 하나 이상의 `ClientRegistration`을 구성해야 합니다. 다음 예제는 Spring Boot 구성 속성을 사용하여 `InMemoryClientRegistrationRepository` 빈을 구성합니다.

```yaml
spring:
  security:
    oauth2:
      client:
        registration:
          my-oidc-client:
            provider: my-oidc-provider
            client-id: my-client-id
            client-secret: my-client-secret
            authorization-grant-type: authorization_code
            scope: openid,profile
        provider:
          my-oidc-provider:
            issuer-uri: https://my-oidc-provider.com
```

위의 구성을 사용하면 애플리케이션은 이제 두 개의 추가 엔드포인트를 지원합니다.

- 로그인 엔드포인트(예: `/oauth2/authorization/my-oidc-client`)는 로그인을 시작하고 타사 인증 서버로 리디렉션하는 데 사용됩니다.
- 리디렉션 엔드포인트(예: `/login/oauth2/code/my-oidc-client`)는 인증 서버에서 클라이언트 애플리케이션으로 다시 리디렉션하는 데 사용되며 액세스 토큰 요청을 통해 `id_token` 및/또는 `access_token`을 얻는 데 사용되는 `code` 매개변수를 포함합니다.

위의 구성에서 `openid` 범위가 있으면 OpenID Connect 1.0을 사용해야 함을 나타냅니다. 이는 Spring Security에 요청 처리 중에 OIDC 특정 구성 요소(예: `OidcUserService`)를 사용하도록 지시합니다. 이 범위가 없으면 Spring Security는 OAuth2 특정 구성 요소(예: `DefaultOAuth2UserService`)를 대신 사용합니다.

### 보호된 리소스 액세스

OAuth2로 보호되는 타사 API에 요청하는 것은 OAuth2 클라이언트의 핵심 사용 사례입니다. 이는 클라이언트(Spring Security의 `OAuth2AuthorizedClient` 클래스로 표현됨)를 인증하고 아웃바운드 요청의 `Authorization` 헤더에 Bearer 토큰을 배치하여 보호된 리소스에 액세스함으로써 수행됩니다.

다음 예제는 타사 API에서 보호된 리소스를 요청할 수 있는 OAuth2 클라이언트 역할을 하도록 애플리케이션을 구성합니다.

**OAuth2 클라이언트 구성**

- **Java**

  ```java
  @Configuration
  @EnableWebSecurity
  public class SecurityConfig {

      @Bean
      public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
          http
              // ...
              .oauth2Client(Customizer.withDefaults());
          return http.build();
      }

  }
  ```

- **Kotlin**

  ```kotlin
  @Configuration
  @EnableWebSecurity
  class SecurityConfig {

      @Bean
      fun securityFilterChain(http: HttpSecurity): SecurityFilterChain {
          http
              // ...
              .oauth2Client { }
          return http.build()
      }

  }
  ```

위의 예제는 사용자를 로그인하는 방법을 제공하지 않습니다. 다른 로그인 메커니즘(예: `formLogin()`)을 사용할 수 있습니다. `oauth2Client()`와 `oauth2Login()`을 결합한 예는 다음 섹션을 참조하세요.

위의 구성 외에도 애플리케이션은 `ClientRegistrationRepository` 빈을 사용하여 하나 이상의 `ClientRegistration`을 구성해야 합니다. 다음 예제는 Spring Boot 구성 속성을 사용하여 `InMemoryClientRegistrationRepository` 빈을 구성합니다.

```yaml
spring:
  security:
    oauth2:
      client:
        registration:
          my-oauth2-client:
            provider: my-auth-server
            client-id: my-client-id
            client-secret: my-client-secret
            authorization-grant-type: authorization_code
            scope: message.read,message.write
        provider:
          my-auth-server:
            issuer-uri: https://my-auth-server.com
```

Spring Security가 OAuth2 클라이언트 기능을 지원하도록 구성하는 것 외에도 보호된 리소스에 액세스하는 방법을 결정하고 그에 따라 애플리케이션을 구성해야 합니다. Spring Security는 보호된 리소스에 액세스하는 데 사용할 수 있는 액세스 토큰을 얻기 위해 `OAuth2AuthorizedClientManager`의 구현을 제공합니다.

Spring Security는 `OAuth2AuthorizedClientManager` 빈이 없는 경우 기본 `OAuth2AuthorizedClientManager` 빈을 등록합니다.

`OAuth2AuthorizedClientManager`를 사용하는 가장 쉬운 방법은 `spring-web`이 클래스 경로에 있을 때 이미 사용 가능한 `RestClient`를 통한 요청을 가로채는 `ClientHttpRequestInterceptor`를 사용하는 것입니다.

다음 예제는 기본 `OAuth2AuthorizedClientManager`를 사용하여 각 요청의 `Authorization` 헤더에 Bearer 토큰을 배치하여 보호된 리소스에 액세스할 수 있는 `RestClient`를 구성합니다.

**ClientHttpRequestInterceptor를 사용한 RestClient 구성**

- **Java**

  ```java
  @Configuration
  public class RestClientConfig {

      @Bean
      public RestClient restClient(OAuth2AuthorizedClientManager authorizedClientManager) {
          OAuth2ClientHttpRequestInterceptor requestInterceptor =
                  new OAuth2ClientHttpRequestInterceptor(authorizedClientManager);
          return RestClient.builder()
                  .requestInterceptor(requestInterceptor)
                  .build();
      }

  }
  ```

- **Kotlin**

  ```kotlin
  @Configuration
  class RestClientConfig {

      @Bean
      fun restClient(authorizedClientManager: OAuth2AuthorizedClientManager): RestClient {
          val requestInterceptor = OAuth2ClientHttpRequestInterceptor(authorizedClientManager)
          return RestClient.builder()
              .requestInterceptor(requestInterceptor)
              .build()
      }

  }
  ```

이 구성된 `RestClient`는 다음 예제와 같이 사용할 수 있습니다.

**RestClient를 사용하여 보호된 리소스 액세스**

- **Java**

  ```java
  import static org.springframework.security.oauth2.client.web.client.RequestAttributeClientRegistrationIdResolver.clientRegistrationId;

  @RestController
  public class MessagesController {

      private final RestClient restClient;

      public MessagesController(RestClient restClient) {
          this.restClient = restClient;
      }

      @GetMapping("/messages")
      public ResponseEntity<List<Message>> messages() {
          Message[] messages = this.restClient.get()
                  .uri("http://localhost:8090/messages")
                  .attributes(clientRegistrationId("my-oauth2-client"))
                  .retrieve()
                  .body(Message[].class);
          return ResponseEntity.ok(Arrays.asList(messages));
      }

      public record Message(String message) {
      }

  }
  ```

- **Kotlin**

  ```kotlin
  import org.springframework.security.oauth2.client.web.client.RequestAttributeClientRegistrationIdResolver.clientRegistrationId

  @RestController
  class MessagesController(private val restClient: RestClient) {

      @GetMapping("/messages")
      fun messages(): ResponseEntity<List<Message>> {
          val messages = restClient.get()
              .uri("http://localhost:8090/messages")
              .attributes(clientRegistrationId("my-oauth2-client"))
              .retrieve()
              .body(Array<Message>::class.java)
          return ResponseEntity.ok(messages?.toList() ?: emptyList())
      }

      data class Message(val message: String)
  }
  ```

### WebClient를 사용하여 보호된 리소스 액세스

OAuth2로 보호되는 타사 API에 요청하는 것은 OAuth2 클라이언트의 핵심 사용 사례입니다. 이는 클라이언트(Spring Security의 `OAuth2AuthorizedClient` 클래스로 표현됨)를 인증하고 아웃바운드 요청의 `Authorization` 헤더에 Bearer 토큰을 배치하여 보호된 리소스에 액세스함으로써 수행됩니다.

다음 예제는 타사 API에서 보호된 리소스를 요청할 수 있는 OAuth2 클라이언트 역할을 하도록 애플리케이션을 구성합니다.

**OAuth2 클라이언트 구성**

- **Java**

  ```java
  @Configuration
  @EnableWebSecurity
  public class SecurityConfig {

      @Bean
      public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
          http
              // ...
              .oauth2Client(Customizer.withDefaults());
          return http.build();
      }

  }
  ```

- **Kotlin**

  ```kotlin
  @Configuration
  @EnableWebSecurity
  class SecurityConfig {

      @Bean
      fun securityFilterChain(http: HttpSecurity): SecurityFilterChain {
          http
              // ...
              .oauth2Client { }
          return http.build()
      }

  }
  ```

위의 예제는 사용자를 로그인하는 방법을 제공하지 않습니다. 다른 로그인 메커니즘(예: `formLogin()`)을 사용할 수 있습니다. `oauth2Client()`와 `oauth2Login()`을 결합한 예는 이전 섹션을 참조하세요.

위의 구성 외에도 애플리케이션은 `ClientRegistrationRepository` 빈을 사용하여 하나 이상의 `ClientRegistration`을 구성해야 합니다. 다음 예제는 Spring Boot 구성 속성을 사용하여 `InMemoryClientRegistrationRepository` 빈을 구성합니다.

```yaml
spring:
  security:
    oauth2:
      client:
        registration:
          my-oauth2-client:
            provider: my-auth-server
            client-id: my-client-id
            client-secret: my-client-secret
            authorization-grant-type: authorization_code
            scope: message.read,message.write
        provider:
          my-auth-server:
            issuer-uri: https://my-auth-server.com
```

Spring Security가 OAuth2 클라이언트 기능을 지원하도록 구성하는 것 외에도 보호된 리소스에 액세스하는 방법을 결정하고 그에 따라 애플리케이션을 구성해야 합니다. Spring Security는 보호된 리소스에 액세스하는 데 사용할 수 있는 액세스 토큰을 얻기 위해 `OAuth2AuthorizedClientManager`의 구현을 제공합니다.

Spring Security는 `OAuth2AuthorizedClientManager` 빈이 없는 경우 기본 `OAuth2AuthorizedClientManager` 빈을 등록합니다.

`RestClient`를 구성하는 대신 `OAuth2AuthorizedClientManager`를 사용하는 또 다른 방법은 `WebClient`를 통한 요청을 가로채는 `ExchangeFilterFunction`을 사용하는 것입니다. `WebClient`를 사용하려면 `spring-webflux` 의존성과 반응형 클라이언트 구현을 추가해야 합니다.

**Spring WebFlux 의존성 추가**

- **Gradle**

  ```gradle
  implementation 'org.springframework:spring-webflux'
  implementation 'io.projectreactor.netty:reactor-netty'
  ```

- **Maven**

  ```xml
  <dependency>
      <groupId>org.springframework</groupId>
      <artifactId>spring-webflux</artifactId>
  </dependency>
  <dependency>
      <groupId>io.projectreactor.netty</groupId>
      <artifactId>reactor-netty</artifactId>
  </dependency>
  ```

다음 예제는 기본 `OAuth2AuthorizedClientManager`를 사용하여 각 요청의 `Authorization` 헤더에 Bearer 토큰을 배치하여 보호된 리소스에 액세스할 수 있는 `WebClient`를 구성합니다.

**ExchangeFilterFunction을 사용한 WebClient 구성**

- **Java**

  ```java
  @Configuration
  public class WebClientConfig {

      @Bean
      public WebClient webClient(OAuth2AuthorizedClientManager authorizedClientManager) {
          ServletOAuth2AuthorizedClientExchangeFilterFunction filter =
                  new ServletOAuth2AuthorizedClientExchangeFilterFunction(authorizedClientManager);
          return WebClient.builder()
                  .apply(filter.oauth2Configuration())
                  .build();
      }

  }
  ```

- **Kotlin**

  ```kotlin
  @Configuration
  class WebClientConfig {

      @Bean
      fun webClient(authorizedClientManager: OAuth2AuthorizedClientManager): WebClient {
          val filter = ServletOAuth2AuthorizedClientExchangeFilterFunction(authorizedClientManager)
          return WebClient.builder()
              .apply(filter.oauth2Configuration())
              .build()
      }

  }
  ```

이 구성된 `WebClient`는 다음 예제와 같이 사용할 수 있습니다.

**WebClient를 사용하여 보호된 리소스 액세스**

- **Java**

  ```java
  import static org.springframework.security.oauth2.client.web.reactive.function.client.ServletOAuth2AuthorizedClientExchangeFilterFunction.clientRegistrationId;

  @RestController
  public class MessagesController {

      private final WebClient webClient;

      public MessagesController(WebClient webClient) {
          this.webClient = webClient;
      }

      @GetMapping("/messages")
      public ResponseEntity<List<Message>> messages() {
          return this.webClient.get()
                  .uri("http://localhost:8090/messages")
                  .attributes(clientRegistrationId("my-oauth2-client"))
                  .retrieve()
                  .toEntityList(Message.class)
                  .block();
      }

      public record Message(String message) {
      }

  }
  ```

- **Kotlin**

  ```kotlin
  import org.springframework.security.oauth2.client.web.reactive.function.client.ServletOAuth2AuthorizedClientExchangeFilterFunction.clientRegistrationId

  @RestController
  class MessagesController(private val webClient: WebClient) {

      @GetMapping("/messages")
      fun messages(): ResponseEntity<List<Message>>? {
          return webClient.get()
              .uri("http://localhost:8090/messages")
              .attributes(clientRegistrationId("my-oauth2-client"))
              .retrieve()
              .toEntityList(Message::class.java)
              .block()
      }

      data class Message(val message: String)
  }
  ```

### 현재 사용자를 위한 보호된 리소스 액세스

사용자가 OAuth2 또는 OpenID Connect를 통해 로그인하면 인증 서버는 보호된 리소스에 직접 액세스하는 데 사용할 수 있는 액세스 토큰을 제공할 수 있습니다. 이는 두 가지 사용 사례 모두에 대해 단일 `ClientRegistration`만 구성하면 되기 때문에 편리합니다.

이 섹션에서는 [OAuth2로 사용자 로그인](#oauth2로-사용자-로그인) 및 [보호된 리소스 액세스](#보호된-리소스-액세스)를 단일 구성으로 결합합니다. 로그인 및 보호된 리소스 액세스를 위해 별도의 `ClientRegistration`을 구성하는 것과 같은 다른 고급 시나리오도 있습니다. 이러한 모든 시나리오는 동일한 기본 구성을 사용합니다.

다음 예제는 사용자를 로그인하고 타사 API에서 보호된 리소스를 요청할 수 있는 OAuth2 클라이언트 역할을 하도록 애플리케이션을 구성합니다.

**OAuth2 로그인 및 OAuth2 클라이언트 구성**

- **Java**

  ```java
  @Configuration
  @EnableWebSecurity
  public class SecurityConfig {

      @Bean
      public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
          http
              // ...
              .oauth2Login(Customizer.withDefaults())
              .oauth2Client(Customizer.withDefaults());
          return http.build();
      }

  }
  ```

- **Kotlin**

  ```kotlin
  @Configuration
  @EnableWebSecurity
  class SecurityConfig {

      @Bean
      fun securityFilterChain(http: HttpSecurity): SecurityFilterChain {
          http
              // ...
              .oauth2Login { }
              .oauth2Client { }
          return http.build()
      }

  }
  ```

위의 구성 외에도 애플리케이션은 `ClientRegistrationRepository` 빈을 사용하여 하나 이상의 `ClientRegistration`을 구성해야 합니다. 다음 예제는 Spring Boot 구성 속성을 사용하여 `InMemoryClientRegistrationRepository` 빈을 구성합니다.

```yaml
spring:
  security:
    oauth2:
      client:
        registration:
          my-combined-client:
            provider: my-auth-server
            client-id: my-client-id
            client-secret: my-client-secret
            authorization-grant-type: authorization_code
            scope: openid,profile,message.read,message.write
        provider:
          my-auth-server:
            issuer-uri: https://my-auth-server.com
```

이전 예제([OAuth2로 사용자 로그인](#oauth2로-사용자-로그인), [보호된 리소스 액세스](#보호된-리소스-액세스))와 이 예제의 주요 차이점은 `scope` 속성을 통해 구성되는 내용입니다. 이 속성은 표준 범위 `openid` 및 `profile`과 사용자 정의 범위 `message.read` 및 `message.write`를 결합합니다.

Spring Security가 OAuth2 클라이언트 기능을 지원하도록 구성하는 것 외에도 보호된 리소스에 액세스하는 방법을 결정하고 그에 따라 애플리케이션을 구성해야 합니다. Spring Security는 보호된 리소스에 액세스하는 데 사용할 수 있는 액세스 토큰을 얻기 위해 `OAuth2AuthorizedClientManager`의 구현을 제공합니다.

Spring Security는 `OAuth2AuthorizedClientManager` 빈이 없는 경우 기본 `OAuth2AuthorizedClientManager` 빈을 등록합니다.

`OAuth2AuthorizedClientManager`를 사용하는 가장 쉬운 방법은 `spring-web`이 클래스 경로에 있을 때 이미 사용 가능한 `RestClient`를 통한 요청을 가로채는 `ClientHttpRequestInterceptor`를 사용하는 것입니다.

다음 예제는 기본 `OAuth2AuthorizedClientManager`를 사용하여 각 요청의 `Authorization` 헤더에 Bearer 토큰을 배치하여 보호된 리소스에 액세스할 수 있는 `RestClient`를 구성합니다.

**ClientHttpRequestInterceptor를 사용한 RestClient 구성**

- **Java**

  ```java
  @Configuration
  public class RestClientConfig {

      @Bean
      public RestClient restClient(OAuth2AuthorizedClientManager authorizedClientManager) {
          OAuth2ClientHttpRequestInterceptor requestInterceptor =
                  new OAuth2ClientHttpRequestInterceptor(authorizedClientManager, clientRegistrationIdResolver());
          return RestClient.builder()
                  .requestInterceptor(requestInterceptor)
                  .build();
      }

      private static ClientRegistrationIdResolver clientRegistrationIdResolver() {
          return (request) -> {
              Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
              return (authentication instanceof OAuth2AuthenticationToken principal)
                  ? principal.getAuthorizedClientRegistrationId()
                  : null;
          };
      }

  }
  ```

- **Kotlin**

  ```kotlin
  @Configuration
  class RestClientConfig {

      @Bean
      fun restClient(authorizedClientManager: OAuth2AuthorizedClientManager): RestClient {
          val requestInterceptor = OAuth2ClientHttpRequestInterceptor(authorizedClientManager, clientRegistrationIdResolver())
          return RestClient.builder()
              .requestInterceptor(requestInterceptor)
              .build()
      }

      private fun clientRegistrationIdResolver(): ClientRegistrationIdResolver {
          return ClientRegistrationIdResolver { request ->
              val authentication = SecurityContextHolder.getContext().authentication
              if (authentication is OAuth2AuthenticationToken) {
                  authentication.authorizedClientRegistrationId
              } else {
                  null
              }
          }
      }

  }
  ```

이 구성된 `RestClient`는 다음 예제와 같이 사용할 수 있습니다.

**RestClient를 사용하여 보호된 리소스 액세스(현재 사용자)**

- **Java**

  ```java
  @RestController
  public class MessagesController {

      private final RestClient restClient;

      public MessagesController(RestClient restClient) {
          this.restClient = restClient;
      }

      @GetMapping("/messages")
      public ResponseEntity<List<Message>> messages() {
          Message[] messages = this.restClient.get()
                  .uri("http://localhost:8090/messages")
                  .retrieve()
                  .body(Message[].class);
          return ResponseEntity.ok(Arrays.asList(messages));
      }

      public record Message(String message) {
      }

  }
  ```

- **Kotlin**

  ```kotlin
  @RestController
  class MessagesController(private val restClient: RestClient) {

      @GetMapping("/messages")
      fun messages(): ResponseEntity<List<Message>> {
          val messages = restClient.get()
              .uri("http://localhost:8090/messages")
              .retrieve()
              .body(Array<Message>::class.java)
          return ResponseEntity.ok(messages?.toList() ?: emptyList())
      }

      data class Message(val message: String)
  }
  ```

이전 예제와 달리 사용할 `clientRegistrationId`에 대해 Spring Security에 알릴 필요가 없습니다. 이는 현재 로그인한 사용자로부터 파생될 수 있기 때문입니다.

### Client Credentials Grant 사용

이 섹션에서는 `client_credentials` 부여 유형에 대한 추가 고려 사항에 중점을 둡니다. 모든 부여 유형에 대한 일반적인 설정 및 사용법은 [보호된 리소스 액세스](#보호된-리소스-액세스)를 참조하세요.

`client_credentials` 부여를 통해 클라이언트는 자신을 대신하여 `access_token`을 얻을 수 있습니다. `client_credentials` 부여는 리소스 소유자(즉, 사용자)를 포함하지 않는 간단한 흐름입니다.

`client_credentials` 부여의 일반적인 사용은 모든 요청(또는 사용자)이 잠재적으로 액세스 토큰을 얻고 리소스 서버에 보호된 리소스 요청을 할 수 있음을 의미한다는 점에 유의하는 것이 중요합니다. 모든 요청이 액세스 토큰을 얻을 수 있으므로 사용자가 승인되지 않은 요청을 할 수 없도록 애플리케이션을 설계할 때 주의해야 합니다.

사용자가 로그인할 수 있는 웹 애플리케이션 내에서 액세스 토큰을 얻을 때 Spring Security의 기본 동작은 사용자당 액세스 토큰을 얻는 것입니다.

기본적으로 액세스 토큰은 현재 사용자의 주체 이름으로 범위가 지정됩니다. 즉, 모든 사용자는 고유한 액세스 토큰을 받습니다.

`client_credentials` 부여를 사용하는 클라이언트는 일반적으로 액세스 토큰이 개별 사용자가 아닌 애플리케이션으로 범위가 지정되어야 하므로 애플리케이션당 하나의 액세스 토큰만 있습니다. 액세스 토큰을 애플리케이션으로 범위 지정하려면 사용자 정의 주체 이름을 확인하기 위한 전략을 설정해야 합니다. 다음 예제에서는 `RequestAttributePrincipalResolver`를 사용하여 `RestClient`를 구성하여 이를 수행합니다.

**client_credentials를 위한 RestClient 구성**

- **Java**

  ```java
  @Configuration
  public class RestClientConfig {

      @Bean
      public RestClient restClient(OAuth2AuthorizedClientManager authorizedClientManager) {
          OAuth2ClientHttpRequestInterceptor requestInterceptor =
                  new OAuth2ClientHttpRequestInterceptor(authorizedClientManager);
          requestInterceptor.setPrincipalResolver(new RequestAttributePrincipalResolver());
          return RestClient.builder()
                  .requestInterceptor(requestInterceptor)
                  .build();
      }

  }
  ```

- **Kotlin**

  ```kotlin
  @Configuration
  class RestClientConfig {

      @Bean
      fun restClient(authorizedClientManager: OAuth2AuthorizedClientManager): RestClient {
          val requestInterceptor = OAuth2ClientHttpRequestInterceptor(authorizedClientManager)
          requestInterceptor.principalResolver = RequestAttributePrincipalResolver()
          return RestClient.builder()
              .requestInterceptor(requestInterceptor)
              .build()
      }

  }
  ```

위의 구성을 사용하면 각 요청에 대해 주체 이름을 지정할 수 있습니다. 다음 예제는 주체 이름을 지정하여 액세스 토큰을 애플리케이션으로 범위 지정하는 방법을 보여줍니다.

**액세스 토큰을 애플리케이션으로 범위 지정**

- **Java**

  ```java
  import static org.springframework.security.oauth2.client.web.client.RequestAttributeClientRegistrationIdResolver.clientRegistrationId;
  import static org.springframework.security.oauth2.client.web.client.RequestAttributePrincipalResolver.principal;

  @RestController
  public class MessagesController {

      private final RestClient restClient;

      public MessagesController(RestClient restClient) {
          this.restClient = restClient;
      }

      @GetMapping("/messages")
      public ResponseEntity<List<Message>> messages() {
          Message[] messages = this.restClient.get()
                  .uri("http://localhost:8090/messages")
                  .attributes(clientRegistrationId("my-oauth2-client"))
                  .attributes(principal("my-application"))
                  .retrieve()
                  .body(Message[].class);
          return ResponseEntity.ok(Arrays.asList(messages));
      }

      public record Message(String message) {
      }

  }
  ```

- **Kotlin**

  ```kotlin
  import org.springframework.security.oauth2.client.web.client.RequestAttributeClientRegistrationIdResolver.clientRegistrationId
  import org.springframework.security.oauth2.client.web.client.RequestAttributePrincipalResolver.principal

  @RestController
  class MessagesController(private val restClient: RestClient) {

      @GetMapping("/messages")
      fun messages(): ResponseEntity<List<Message>> {
          val messages = restClient.get()
              .uri("http://localhost:8090/messages")
              .attributes(clientRegistrationId("my-oauth2-client"))
              .attributes(principal("my-application"))
              .retrieve()
              .body(Array<Message>::class.java)
          return ResponseEntity.ok(messages?.toList() ?: emptyList())
      }

      data class Message(val message: String)
  }
  ```

위의 예제와 같이 속성을 통해 주체 이름을 지정하면 단일 액세스 토큰만 존재하며 모든 요청에 사용됩니다.

### 확장 Grant Type 활성화

일반적인 사용 사례는 확장 부여 유형을 활성화 및/또는 구성하는 것입니다. 예를 들어, Spring Security는 `jwt-bearer` 및 `token-exchange` 부여 유형에 대한 지원을 제공하지만 핵심 OAuth 2.0 사양의 일부가 아니기 때문에 기본적으로 활성화하지 않습니다.

Spring Security 6.2 이상에서는 하나 이상의 `OAuth2AuthorizedClientProvider`에 대한 빈을 게시하기만 하면 자동으로 선택됩니다. 다음 예제는 `jwt-bearer` 부여 유형을 간단히 활성화합니다.

**jwt-bearer Grant Type 활성화**

- **Java**

  ```java
  @Configuration
  public class SecurityConfig {

      @Bean
      public OAuth2AuthorizedClientProvider jwtBearer() {
          return new JwtBearerOAuth2AuthorizedClientProvider();
      }

  }
  ```

- **Kotlin**

  ```kotlin
  @Configuration
  class SecurityConfig {

      @Bean
      fun jwtBearer(): OAuth2AuthorizedClientProvider {
          return JwtBearerOAuth2AuthorizedClientProvider()
      }

  }
  ```

기본 `OAuth2AuthorizedClientManager`는 제공되지 않은 경우 Spring Security에서 자동으로 게시합니다.

모든 사용자 정의 `OAuth2AuthorizedClientProvider` 빈은 기본 부여 유형 이후에 선택되어 제공된 `OAuth2AuthorizedClientManager`에 적용됩니다.

Spring Security 6.2 이전 버전에서 위의 구성을 달성하려면 이 빈을 직접 게시하고 기본 부여 유형도 다시 활성화해야 했습니다. 이 구성이 내부적으로 어떻게 작동하는지 이해하려면 다음과 같은 구성을 참고하세요.

**jwt-bearer Grant Type 활성화 (6.2 이전)**

- **Java**

  ```java
  @Configuration
  public class SecurityConfig {

      @Bean
      public OAuth2AuthorizedClientManager authorizedClientManager(
              ClientRegistrationRepository clientRegistrationRepository,
              OAuth2AuthorizedClientRepository authorizedClientRepository) {

          OAuth2AuthorizedClientProvider authorizedClientProvider =
              OAuth2AuthorizedClientProviderBuilder.builder()
                  .authorizationCode()
                  .refreshToken()
                  .clientCredentials()
                  .password()
                  .provider(new JwtBearerOAuth2AuthorizedClientProvider())
                  .build();

          DefaultOAuth2AuthorizedClientManager authorizedClientManager =
              new DefaultOAuth2AuthorizedClientManager(
                  clientRegistrationRepository, authorizedClientRepository);
          authorizedClientManager.setAuthorizedClientProvider(authorizedClientProvider);

          return authorizedClientManager;
      }

  }
  ```

- **Kotlin**

  ```kotlin
  @Configuration
  class SecurityConfig {

      @Bean
      fun authorizedClientManager(
          clientRegistrationRepository: ClientRegistrationRepository,
          authorizedClientRepository: OAuth2AuthorizedClientRepository
      ): OAuth2AuthorizedClientManager {
          val authorizedClientProvider = OAuth2AuthorizedClientProviderBuilder.builder()
              .authorizationCode()
              .refreshToken()
              .clientCredentials()
              .password()
              .provider(JwtBearerOAuth2AuthorizedClientProvider())
              .build()

          val authorizedClientManager = DefaultOAuth2AuthorizedClientManager(
              clientRegistrationRepository, authorizedClientRepository
          )
          authorizedClientManager.setAuthorizedClientProvider(authorizedClientProvider)

          return authorizedClientManager
      }

  }
  ```

### 기존 Grant Type 사용자 정의

확장 부여 유형을 활성화하는 기능은 기본값을 다시 정의할 필요 없이 기존 부여 유형을 사용자 정의할 수 있는 기회를 제공합니다. 예를 들어, `client_credentials` 부여에 대한 `OAuth2AuthorizedClientProvider`의 클럭 스큐를 사용자 정의하려는 경우 다음과 같이 빈을 게시하기만 하면 됩니다.

**Client Credentials Grant Type 사용자 정의**

- **Java**

  ```java
  @Configuration
  public class SecurityConfig {

      @Bean
      public OAuth2AuthorizedClientProvider clientCredentials() {
          ClientCredentialsOAuth2AuthorizedClientProvider authorizedClientProvider =
                  new ClientCredentialsOAuth2AuthorizedClientProvider();
          authorizedClientProvider.setClockSkew(Duration.ofMinutes(5));

          return authorizedClientProvider;
      }

  }
  ```

- **Kotlin**

  ```kotlin
  @Configuration
  class SecurityConfig {

      @Bean
      fun clientCredentials(): OAuth2AuthorizedClientProvider {
          val authorizedClientProvider = ClientCredentialsOAuth2AuthorizedClientProvider()
          authorizedClientProvider.clockSkew = Duration.ofMinutes(5)
          return authorizedClientProvider
      }

  }
  ```

### 토큰 요청 매개변수 사용자 정의

액세스 토큰을 얻을 때 요청 매개변수를 사용자 정의해야 하는 경우는 상당히 일반적입니다. 예를 들어, 공급자가 `authorization_code` 부여에 이 매개변수를 요구하기 때문에 토큰 요청에 사용자 정의 `audience` 매개변수를 추가하려고 합니다.

Spring Security 6.2 이상에서는 제네릭 타입 `OAuth2AuthorizationCodeGrantRequest`를 사용하는 `OAuth2AccessTokenResponseClient` 타입의 빈을 게시하기만 하면 Spring Security에서 OAuth2 클라이언트 구성 요소를 구성하는 데 사용합니다.

다음 예제는 DSL 없이 `authorization_code` 부여에 대한 토큰 요청 매개변수를 사용자 정의합니다.

**Authorization Code Grant에 대한 토큰 요청 매개변수 사용자 정의**

- **Java**

  ```java
  @Configuration
  public class SecurityConfig {

      @Bean
      public OAuth2AccessTokenResponseClient<OAuth2AuthorizationCodeGrantRequest> authorizationCodeAccessTokenResponseClient() {
          OAuth2AuthorizationCodeGrantRequestEntityConverter requestEntityConverter =
              new OAuth2AuthorizationCodeGrantRequestEntityConverter();
          requestEntityConverter.addParametersConverter(parametersConverter());

          DefaultAuthorizationCodeTokenResponseClient accessTokenResponseClient =
              new DefaultAuthorizationCodeTokenResponseClient();
          accessTokenResponseClient.setRequestEntityConverter(requestEntityConverter);

          return accessTokenResponseClient;
      }

      private static Converter<OAuth2AuthorizationCodeGrantRequest, MultiValueMap<String, String>> parametersConverter() {
          return (grantRequest) -> {
              MultiValueMap<String, String> parameters = new LinkedMultiValueMap<>();
              parameters.set("audience", "xyz_value");

              return parameters;
          };
      }

  }
  ```

- **Kotlin**

  ```kotlin
  @Configuration
  class SecurityConfig {

      @Bean
      fun authorizationCodeAccessTokenResponseClient(): OAuth2AccessTokenResponseClient<OAuth2AuthorizationCodeGrantRequest> {
          val requestEntityConverter = OAuth2AuthorizationCodeGrantRequestEntityConverter()
          requestEntityConverter.addParametersConverter(parametersConverter())

          val accessTokenResponseClient = DefaultAuthorizationCodeTokenResponseClient()
          accessTokenResponseClient.requestEntityConverter = requestEntityConverter

          return accessTokenResponseClient
      }

      private fun parametersConverter(): Converter<OAuth2AuthorizationCodeGrantRequest, MultiValueMap<String, String>> {
          return Converter { grantRequest ->
              val parameters = LinkedMultiValueMap<String, String>()
              parameters["audience"] = "xyz_value"
              parameters
          }
      }

  }
  ```

이 경우 `SecurityFilterChain` 빈을 사용자 정의할 필요가 없으며 기본값을 사용할 수 있습니다. 추가 사용자 정의 없이 Spring Boot를 사용하는 경우 실제로 `SecurityFilterChain` 빈을 완전히 생략할 수 있습니다.

Spring Security 6.2 이전에는 Spring Security DSL을 사용하여 OAuth2 로그인(이 기능을 사용하는 경우)과 OAuth2 클라이언트 구성 요소 모두에 이 사용자 정의가 적용되도록 해야 했습니다. 이 구성이 내부적으로 어떻게 작동하는지 이해하려면 다음과 같은 구성을 참고하세요.

**Authorization Code Grant에 대한 토큰 요청 매개변수 사용자 정의 (6.2 이전)**

- **Java**

  ```java
  @Configuration
  @EnableWebSecurity
  public class SecurityConfig {

      @Bean
      public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
          OAuth2AuthorizationCodeGrantRequestEntityConverter requestEntityConverter =
              new OAuth2AuthorizationCodeGrantRequestEntityConverter();
          requestEntityConverter.addParametersConverter(parametersConverter());

          DefaultAuthorizationCodeTokenResponseClient accessTokenResponseClient =
              new DefaultAuthorizationCodeTokenResponseClient();
          accessTokenResponseClient.setRequestEntityConverter(requestEntityConverter);

          http
              .authorizeHttpRequests((authorize) -> authorize
                  .anyRequest().authenticated()
              )
              .oauth2Login((oauth2Login) -> oauth2Login
                  .tokenEndpoint((tokenEndpoint) -> tokenEndpoint
                      .accessTokenResponseClient(accessTokenResponseClient)
                  )
              )
              .oauth2Client((oauth2Client) -> oauth2Client
                  .authorizationCodeGrant((authorizationCode) -> authorizationCode
                      .accessTokenResponseClient(accessTokenResponseClient)
                  )
              );

          return http.build();
      }

      private static Converter<OAuth2AuthorizationCodeGrantRequest, MultiValueMap<String, String>> parametersConverter() {
          // ...
      }

  }
  ```

- **Kotlin**

  ```kotlin
  @Configuration
  @EnableWebSecurity
  class SecurityConfig {

      @Bean
      fun securityFilterChain(http: HttpSecurity): SecurityFilterChain {
          val requestEntityConverter = OAuth2AuthorizationCodeGrantRequestEntityConverter()
          requestEntityConverter.addParametersConverter(parametersConverter())

          val accessTokenResponseClient = DefaultAuthorizationCodeTokenResponseClient()
          accessTokenResponseClient.requestEntityConverter = requestEntityConverter

          http
              .authorizeHttpRequests { authorize ->
                  authorize.anyRequest().authenticated()
              }
              .oauth2Login { oauth2Login ->
                  oauth2Login
                      .tokenEndpoint { tokenEndpoint ->
                          tokenEndpoint
                              .accessTokenResponseClient(accessTokenResponseClient)
                      }
              }
              .oauth2Client { oauth2Client ->
                  oauth2Client
                      .authorizationCodeGrant { authorizationCode ->
                          authorizationCode
                              .accessTokenResponseClient(accessTokenResponseClient)
                      }
              }

          return http.build()
      }

      private fun parametersConverter(): Converter<OAuth2AuthorizationCodeGrantRequest, MultiValueMap<String, String>> {
          // ...
      }

  }
  ```

다른 부여 유형의 경우 추가 `OAuth2AccessTokenResponseClient` 빈을 게시하여 기본값을 재정의할 수 있습니다. 예를 들어, `client_credentials` 부여에 대한 토큰 요청을 사용자 정의하려면 다음 빈을 게시할 수 있습니다.

**Client Credentials Grant에 대한 토큰 요청 매개변수 사용자 정의**

- **Java**

  ```java
  @Configuration
  public class SecurityConfig {

      @Bean
      public OAuth2AccessTokenResponseClient<OAuth2ClientCredentialsGrantRequest> clientCredentialsAccessTokenResponseClient() {
          OAuth2ClientCredentialsGrantRequestEntityConverter requestEntityConverter =
              new OAuth2ClientCredentialsGrantRequestEntityConverter();
          requestEntityConverter.addParametersConverter(parametersConverter());

          DefaultClientCredentialsTokenResponseClient accessTokenResponseClient =
                  new DefaultClientCredentialsTokenResponseClient();
          accessTokenResponseClient.setRequestEntityConverter(requestEntityConverter);

          return accessTokenResponseClient;
      }

      private static Converter<OAuth2ClientCredentialsGrantRequest, MultiValueMap<String, String>> parametersConverter() {
          // ...
      }

  }
  ```

- **Kotlin**

  ```kotlin
  @Configuration
  class SecurityConfig {

      @Bean
      fun clientCredentialsAccessTokenResponseClient(): OAuth2AccessTokenResponseClient<OAuth2ClientCredentialsGrantRequest> {
          val requestEntityConverter = OAuth2ClientCredentialsGrantRequestEntityConverter()
          requestEntityConverter.addParametersConverter(parametersConverter())

          val accessTokenResponseClient = DefaultClientCredentialsTokenResponseClient()
          accessTokenResponseClient.requestEntityConverter = requestEntityConverter

          return accessTokenResponseClient
      }

      private fun parametersConverter(): Converter<OAuth2ClientCredentialsGrantRequest, MultiValueMap<String, String>> {
          // ...
      }

  }
  ```

Spring Security는 다음 제네릭 타입의 `OAuth2AccessTokenResponseClient` 빈을 자동으로 확인합니다.

- `OAuth2AuthorizationCodeGrantRequest` (참조: `DefaultAuthorizationCodeTokenResponseClient`)
- `OAuth2RefreshTokenGrantRequest` (참조: `DefaultRefreshTokenTokenResponseClient`)
- `OAuth2ClientCredentialsGrantRequest` (참조: `DefaultClientCredentialsTokenResponseClient`)
- `OAuth2PasswordGrantRequest` (참조: `DefaultPasswordTokenResponseClient`)
- `JwtBearerGrantRequest` (참조: `DefaultJwtBearerTokenResponseClient`)
- `TokenExchangeGrantRequest` (참조: `DefaultTokenExchangeTokenResponseClient`)

`OAuth2AccessTokenResponseClient<JwtBearerGrantRequest>` 타입의 빈을 게시하면 별도로 구성할 필요 없이 `jwt-bearer` 부여 유형이 자동으로 활성화됩니다.

`OAuth2AccessTokenResponseClient<TokenExchangeGrantRequest>` 타입의 빈을 게시하면 별도로 구성할 필요 없이 `token-exchange` 부여 유형이 자동으로 활성화됩니다.

### OAuth2 클라이언트 구성 요소에서 사용하는 RestOperations 사용자 정의

또 다른 일반적인 사용 사례는 액세스 토큰을 얻을 때 사용되는 `RestOperations`를 사용자 정의해야 하는 경우입니다. 사용자 정의 `HttpMessageConverter`를 통해 응답 처리를 사용자 정의하거나 기업 네트워크에 대한 프록시 설정을 사용자 정의된 `ClientHttpRequestFactory`를 통해 적용하기 위해 이 작업을 수행해야 할 수 있습니다.

Spring Security 6.2 이상에서는 `OAuth2AccessTokenResponseClient` 타입의 빈을 게시하기만 하면 Spring Security에서 `OAuth2AuthorizedClientManager` 빈을 구성하고 게시합니다.

다음 예제는 지원되는 모든 부여 유형에 대한 `RestOperations`를 사용자 정의합니다.

**OAuth2 클라이언트에 대한 RestOperations 사용자 정의**

- **Java**

  ```java
  @Configuration
  public class SecurityConfig {

      @Bean
      public OAuth2AccessTokenResponseClient<OAuth2AuthorizationCodeGrantRequest> authorizationCodeAccessTokenResponseClient() {
          DefaultAuthorizationCodeTokenResponseClient accessTokenResponseClient =
              new DefaultAuthorizationCodeTokenResponseClient();
          accessTokenResponseClient.setRestOperations(restTemplate());

          return accessTokenResponseClient;
      }

      @Bean
      public OAuth2AccessTokenResponseClient<OAuth2RefreshTokenGrantRequest> refreshTokenAccessTokenResponseClient() {
          DefaultRefreshTokenTokenResponseClient accessTokenResponseClient =
              new DefaultRefreshTokenTokenResponseClient();
          accessTokenResponseClient.setRestOperations(restTemplate());

          return accessTokenResponseClient;
      }

      @Bean
      public OAuth2AccessTokenResponseClient<OAuth2ClientCredentialsGrantRequest> clientCredentialsAccessTokenResponseClient() {
          DefaultClientCredentialsTokenResponseClient accessTokenResponseClient =
              new DefaultClientCredentialsTokenResponseClient();
          accessTokenResponseClient.setRestOperations(restTemplate());

          return accessTokenResponseClient;
      }

      @Bean
      public OAuth2AccessTokenResponseClient<OAuth2PasswordGrantRequest> passwordAccessTokenResponseClient() {
          DefaultPasswordTokenResponseClient accessTokenResponseClient =
              new DefaultPasswordTokenResponseClient();
          accessTokenResponseClient.setRestOperations(restTemplate());

          return accessTokenResponseClient;
      }

      @Bean
      public OAuth2AccessTokenResponseClient<JwtBearerGrantRequest> jwtBearerAccessTokenResponseClient() {
          DefaultJwtBearerTokenResponseClient accessTokenResponseClient =
              new DefaultJwtBearerTokenResponseClient();
          accessTokenResponseClient.setRestOperations(restTemplate());

          return accessTokenResponseClient;
      }

      @Bean
      public OAuth2AccessTokenResponseClient<TokenExchangeGrantRequest> tokenExchangeAccessTokenResponseClient() {
          DefaultTokenExchangeTokenResponseClient accessTokenResponseClient =
              new DefaultTokenExchangeTokenResponseClient();
          accessTokenResponseClient.setRestOperations(restTemplate());

          return accessTokenResponseClient;
      }

      @Bean
      public RestTemplate restTemplate() {
          // ...
      }

  }
  ```

- **Kotlin**

  ```kotlin
  @Configuration
  class SecurityConfig {

      @Bean
      fun authorizationCodeAccessTokenResponseClient(): OAuth2AccessTokenResponseClient<OAuth2AuthorizationCodeGrantRequest> {
          val accessTokenResponseClient = DefaultAuthorizationCodeTokenResponseClient()
          accessTokenResponseClient.restOperations = restTemplate()
          return accessTokenResponseClient
      }

      @Bean
      fun refreshTokenAccessTokenResponseClient(): OAuth2AccessTokenResponseClient<OAuth2RefreshTokenGrantRequest> {
          val accessTokenResponseClient = DefaultRefreshTokenTokenResponseClient()
          accessTokenResponseClient.restOperations = restTemplate()
          return accessTokenResponseClient
      }

      @Bean
      fun clientCredentialsAccessTokenResponseClient(): OAuth2AccessTokenResponseClient<OAuth2ClientCredentialsGrantRequest> {
          val accessTokenResponseClient = DefaultClientCredentialsTokenResponseClient()
          accessTokenResponseClient.restOperations = restTemplate()
          return accessTokenResponseClient
      }

      @Bean
      fun passwordAccessTokenResponseClient(): OAuth2AccessTokenResponseClient<OAuth2PasswordGrantRequest> {
          val accessTokenResponseClient = DefaultPasswordTokenResponseClient()
          accessTokenResponseClient.restOperations = restTemplate()
          return accessTokenResponseClient
      }

      @Bean
      fun jwtBearerAccessTokenResponseClient(): OAuth2AccessTokenResponseClient<JwtBearerGrantRequest> {
          val accessTokenResponseClient = DefaultJwtBearerTokenResponseClient()
          accessTokenResponseClient.restOperations = restTemplate()
          return accessTokenResponseClient
      }

      @Bean
      fun tokenExchangeAccessTokenResponseClient(): OAuth2AccessTokenResponseClient<TokenExchangeGrantRequest> {
          val accessTokenResponseClient = DefaultTokenExchangeTokenResponseClient()
          accessTokenResponseClient.restOperations = restTemplate()
          return accessTokenResponseClient
      }

      @Bean
      fun restTemplate(): RestTemplate {
          // ...
      }

  }
  ```

기본 `OAuth2AuthorizedClientManager`는 제공되지 않은 경우 Spring Security에서 자동으로 게시합니다.

이 경우 `SecurityFilterChain` 빈을 사용자 정의할 필요가 없으며 기본값을 사용할 수 있습니다. 추가 사용자 정의 없이 Spring Boot를 사용하는 경우 실제로 `SecurityFilterChain` 빈을 완전히 생략할 수 있습니다.

Spring Security 6.2 이전에는 OAuth2 로그인(이 기능을 사용하는 경우)과 OAuth2 클라이언트 구성 요소 모두에 이 사용자 정의가 적용되도록 해야 했습니다. `authorization_code` 부여에 대한 Spring Security DSL과 다른 부여 유형에 대한 `OAuth2AuthorizedClientManager` 타입의 빈을 게시해야 했습니다. 이 구성이 내부적으로 어떻게 작동하는지 이해하려면 다음과 같은 구성을 참고하세요.

**OAuth2 클라이언트에 대한 RestOperations 사용자 정의 (6.2 이전)**

- **Java**

  ```java
  @Configuration
  @EnableWebSecurity
  public class SecurityConfig {

      @Bean
      public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
          DefaultAuthorizationCodeTokenResponseClient accessTokenResponseClient =
              new DefaultAuthorizationCodeTokenResponseClient();
          accessTokenResponseClient.setRestOperations(restTemplate());

          http
              // ...
              .oauth2Login((oauth2Login) -> oauth2Login
                  .tokenEndpoint((tokenEndpoint) -> tokenEndpoint
                      .accessTokenResponseClient(accessTokenResponseClient)
                  )
              )
              .oauth2Client((oauth2Client) -> oauth2Client
                  .authorizationCodeGrant((authorizationCode) -> authorizationCode
                      .accessTokenResponseClient(accessTokenResponseClient)
                  )
              );

          return http.build();
      }

      @Bean
      public OAuth2AuthorizedClientManager authorizedClientManager(
              ClientRegistrationRepository clientRegistrationRepository,
              OAuth2AuthorizedClientRepository authorizedClientRepository) {

          DefaultRefreshTokenTokenResponseClient refreshTokenAccessTokenResponseClient =
              new DefaultRefreshTokenTokenResponseClient();
          refreshTokenAccessTokenResponseClient.setRestOperations(restTemplate());

          DefaultClientCredentialsTokenResponseClient clientCredentialsAccessTokenResponseClient =
              new DefaultClientCredentialsTokenResponseClient();
          clientCredentialsAccessTokenResponseClient.setRestOperations(restTemplate());

          DefaultPasswordTokenResponseClient passwordAccessTokenResponseClient =
              new DefaultPasswordTokenResponseClient();
          passwordAccessTokenResponseClient.setRestOperations(restTemplate());

          DefaultJwtBearerTokenResponseClient jwtBearerAccessTokenResponseClient =
              new DefaultJwtBearerTokenResponseClient();
          jwtBearerAccessTokenResponseClient.setRestOperations(restTemplate());

          JwtBearerOAuth2AuthorizedClientProvider jwtBearerAuthorizedClientProvider =
              new JwtBearerOAuth2AuthorizedClientProvider();
          jwtBearerAuthorizedClientProvider.setAccessTokenResponseClient(jwtBearerAccessTokenResponseClient);

          DefaultTokenExchangeTokenResponseClient tokenExchangeAccessTokenResponseClient =
              new DefaultTokenExchangeTokenResponseClient();
          tokenExchangeAccessTokenResponseClient.setRestOperations(restTemplate());

          TokenExchangeOAuth2AuthorizedClientProvider tokenExchangeAuthorizedClientProvider =
              new TokenExchangeOAuth2AuthorizedClientProvider();
          tokenExchangeAuthorizedClientProvider.setAccessTokenResponseClient(tokenExchangeAccessTokenResponseClient);

          OAuth2AuthorizedClientProvider authorizedClientProvider =
              OAuth2AuthorizedClientProviderBuilder.builder()
                  .authorizationCode()
                  .refreshToken((refreshToken) -> refreshToken
                      .accessTokenResponseClient(refreshTokenAccessTokenResponseClient)
                  )
                  .clientCredentials((clientCredentials) -> clientCredentials
                      .accessTokenResponseClient(clientCredentialsAccessTokenResponseClient)
                  )
                  .password((password) -> password
                      .accessTokenResponseClient(passwordAccessTokenResponseClient)
                  )
                  .provider(jwtBearerAuthorizedClientProvider)
                  .provider(tokenExchangeAuthorizedClientProvider)
                  .build();

          DefaultOAuth2AuthorizedClientManager authorizedClientManager =
              new DefaultOAuth2AuthorizedClientManager(
                  clientRegistrationRepository, authorizedClientRepository);
          authorizedClientManager.setAuthorizedClientProvider(authorizedClientProvider);

          return authorizedClientManager;
      }

      @Bean
      public RestTemplate restTemplate() {
          // ...
      }

  }
  ```

- **Kotlin**

  ```kotlin
  @Configuration
  @EnableWebSecurity
  class SecurityConfig {

      @Bean
      fun securityFilterChain(http: HttpSecurity): SecurityFilterChain {
          val accessTokenResponseClient = DefaultAuthorizationCodeTokenResponseClient()
          accessTokenResponseClient.restOperations = restTemplate()

          http
              // ...
              .oauth2Login { oauth2Login ->
                  oauth2Login
                      .tokenEndpoint { tokenEndpoint ->
                          tokenEndpoint
                              .accessTokenResponseClient(accessTokenResponseClient)
                      }
              }
              .oauth2Client { oauth2Client ->
                  oauth2Client
                      .authorizationCodeGrant { authorizationCode ->
                          authorizationCode
                              .accessTokenResponseClient(accessTokenResponseClient)
                      }
              }

          return http.build()
      }

      @Bean
      fun authorizedClientManager(
          clientRegistrationRepository: ClientRegistrationRepository,
          authorizedClientRepository: OAuth2AuthorizedClientRepository
      ): OAuth2AuthorizedClientManager {

          val refreshTokenAccessTokenResponseClient = DefaultRefreshTokenTokenResponseClient()
          refreshTokenAccessTokenResponseClient.restOperations = restTemplate()

          val clientCredentialsAccessTokenResponseClient = DefaultClientCredentialsTokenResponseClient()
          clientCredentialsAccessTokenResponseClient.restOperations = restTemplate()

          val passwordAccessTokenResponseClient = DefaultPasswordTokenResponseClient()
          passwordAccessTokenResponseClient.restOperations = restTemplate()

          val jwtBearerAccessTokenResponseClient = DefaultJwtBearerTokenResponseClient()
          jwtBearerAccessTokenResponseClient.restOperations = restTemplate()

          val jwtBearerAuthorizedClientProvider = JwtBearerOAuth2AuthorizedClientProvider()
          jwtBearerAuthorizedClientProvider.accessTokenResponseClient = jwtBearerAccessTokenResponseClient

          val tokenExchangeAccessTokenResponseClient = DefaultTokenExchangeTokenResponseClient()
          tokenExchangeAccessTokenResponseClient.restOperations = restTemplate()

          val tokenExchangeAuthorizedClientProvider = TokenExchangeOAuth2AuthorizedClientProvider()
          tokenExchangeAuthorizedClientProvider.accessTokenResponseClient = tokenExchangeAccessTokenResponseClient

          val authorizedClientProvider = OAuth2AuthorizedClientProviderBuilder.builder()
              .authorizationCode()
              .refreshToken { refreshToken ->
                  refreshToken
                      .accessTokenResponseClient(refreshTokenAccessTokenResponseClient)
              }
              .clientCredentials { clientCredentials ->
                  clientCredentials
                      .accessTokenResponseClient(clientCredentialsAccessTokenResponseClient)
              }
              .password { password ->
                  password
                      .accessTokenResponseClient(passwordAccessTokenResponseClient)
              }
              .provider(jwtBearerAuthorizedClientProvider)
              .provider(tokenExchangeAuthorizedClientProvider)
              .build()

          val authorizedClientManager = DefaultOAuth2AuthorizedClientManager(
              clientRegistrationRepository, authorizedClientRepository
          )
          authorizedClientManager.setAuthorizedClientProvider(authorizedClientProvider)

          return authorizedClientManager
      }

      @Bean
      fun restTemplate(): RestTemplate {
          // ...
      }

  }
  ```

## 더 읽어보기

이전 섹션에서는 일반적인 시나리오에 대한 예제와 함께 OAuth2에 대한 Spring Security의 지원을 소개했습니다. 참조 문서의 다음 섹션에서 OAuth2 클라이언트 및 리소스 서버에 대한 자세한 내용을 읽을 수 있습니다.

- [OAuth 2.0 로그인](https://docs.spring.io/spring-security/reference/servlet/oauth2/login/index.html)
- [OAuth 2.0 클라이언트](https://docs.spring.io/spring-security/reference/servlet/oauth2/client/index.html)
- [OAuth 2.0 리소스 서버](https://docs.spring.io/spring-security/reference/servlet/oauth2/resource-server/index.html)
