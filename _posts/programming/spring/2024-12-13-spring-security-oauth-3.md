---
title: "[Spring Security] OAuth2 공식 문서 번역 (3)"
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

> [해당 공식 문서 원본 링크](https://docs.spring.io/spring-security/reference/servlet/oauth2/login/core.html)

# 핵심 구성

## Spring Boot 샘플

Spring Boot는 OAuth 2.0 로그인에 대한 전체 자동 구성 기능을 제공합니다.

이 섹션에서는 Google을 인증 공급자로 사용하여 OAuth 2.0 로그인 샘플을 구성하는 방법을 보여주고 다음 주제를 다룹니다.

- 초기 설정
- 리디렉션 URI 설정
- application.yml 구성
- 애플리케이션 시작

## 초기 설정

로그인을 위해 Google의 OAuth 2.0 인증 시스템을 사용하려면 Google API 콘솔에서 프로젝트를 설정하여 OAuth 2.0 자격 증명을 얻어야 합니다.

인증을 위한 Google의 OAuth 2.0 구현은 OpenID Connect 1.0 사양을 따르며 OpenID 인증을 받았습니다.

OpenID Connect 페이지의 "OAuth 2.0 설정" 섹션부터 시작하여 지침을 따르세요.

"OAuth 2.0 자격 증명 얻기" 지침을 완료한 후에는 클라이언트 ID와 클라이언트 암호로 구성된 자격 증명이 있는 새 OAuth 클라이언트가 있어야 합니다.

## 리디렉션 URI 설정

리디렉션 URI는 사용자가 Google로 인증하고 동의 페이지에서 OAuth 클라이언트(이전 단계에서 생성됨)에 대한 액세스 권한을 부여한 후 최종 사용자의 사용자 에이전트가 리디렉션되는 애플리케이션의 경로입니다.

"리디렉션 URI 설정" 하위 섹션에서 승인된 리디렉션 URI 필드가 `localhost:8080/login/oauth2/code/google`로 설정되어 있는지 확인합니다.

기본 리디렉션 URI 템플릿은 `{baseUrl}/login/oauth2/code/{registrationId}`입니다. `registrationId`는 `ClientRegistration`의 고유 식별자입니다.

OAuth 클라이언트가 프록시 서버 뒤에서 실행되는 경우 애플리케이션이 올바르게 구성되었는지 확인하려면 프록시 서버 구성을 확인해야 합니다. 또한 redirect-uri에 지원되는 URI 템플릿 변수를 참조하세요.

## application.yml 구성

이제 Google에 새 OAuth 클라이언트가 있으므로 인증 흐름에 OAuth 클라이언트를 사용하도록 애플리케이션을 구성해야 합니다. 그렇게 하려면:

`application.yml`로 이동하여 다음 구성을 설정합니다.

```yaml
spring:
  security:
    oauth2:
      client:
        registration:
          google:
            client-id: google-client-id
            client-secret: google-client-secret
```

### OAuth 클라이언트 속성

- `spring.security.oauth2.client.registration`은 OAuth 클라이언트 속성의 기본 속성 접두사입니다.
- 기본 속성 접두사 다음에는 Google과 같은 `ClientRegistration`의 ID가 옵니다.
- `client-id` 및 `client-secret` 속성의 값을 이전에 생성한 OAuth 2.0 자격 증명으로 바꿉니다.

## 애플리케이션 시작

Spring Boot 샘플을 시작하고 `localhost:8080`으로 이동합니다. 그러면 Google에 대한 링크가 표시되는 기본 자동 생성 로그인 페이지로 리디렉션됩니다.

Google 링크를 클릭하면 인증을 위해 Google로 리디렉션됩니다.

Google 계정 자격 증명으로 인증하면 동의 화면이 표시됩니다. 동의 화면에서 이전에 생성한 OAuth 클라이언트에 대한 액세스를 허용하거나 거부하도록 요청합니다. 허용을 클릭하여 OAuth 클라이언트가 이메일 주소와 기본 프로필 정보에 액세스하도록 승인합니다.

이 시점에서 OAuth 클라이언트는 UserInfo 엔드포인트에서 이메일 주소와 기본 프로필 정보를 검색하고 인증된 세션을 설정합니다.

## Spring Boot 속성 매핑

다음 표는 Spring Boot OAuth 클라이언트 속성을 `ClientRegistration` 속성에 매핑하는 방법을 간략하게 설명합니다.

| Spring Boot                                                                                | ClientRegistration                                       |
| :----------------------------------------------------------------------------------------- | :------------------------------------------------------- |
| `spring.security.oauth2.client.registration.[registrationId]`                              | `registrationId`                                         |
| `spring.security.oauth2.client.registration.[registrationId].client-id`                    | `clientId`                                               |
| `spring.security.oauth2.client.registration.[registrationId].client-secret`                | `clientSecret`                                           |
| `spring.security.oauth2.client.registration.[registrationId].client-authentication-method` | `clientAuthenticationMethod`                             |
| `spring.security.oauth2.client.registration.[registrationId].authorization-grant-type`     | `authorizationGrantType`                                 |
| `spring.security.oauth2.client.registration.[registrationId].redirect-uri`                 | `redirectUri`                                            |
| `spring.security.oauth2.client.registration.[registrationId].scope`                        | `scopes`                                                 |
| `spring.security.oauth2.client.registration.[registrationId].client-name`                  | `clientName`                                             |
| `spring.security.oauth2.client.provider.[providerId].authorization-uri`                    | `providerDetails.authorizationUri`                       |
| `spring.security.oauth2.client.provider.[providerId].token-uri`                            | `providerDetails.tokenUri`                               |
| `spring.security.oauth2.client.provider.[providerId].jwk-set-uri`                          | `providerDetails.jwkSetUri`                              |
| `spring.security.oauth2.client.provider.[providerId].issuer-uri`                           | `providerDetails.issuerUri`                              |
| `spring.security.oauth2.client.provider.[providerId].user-info-uri`                        | `providerDetails.userInfoEndpoint.uri`                   |
| `spring.security.oauth2.client.provider.[providerId].user-info-authentication-method`      | `providerDetails.userInfoEndpoint.authenticationMethod`  |
| `spring.security.oauth2.client.provider.[providerId].user-name-attribute`                  | `providerDetails.userInfoEndpoint.userNameAttributeName` |

`spring.security.oauth2.client.provider.[providerId].issuer-uri` 속성을 지정하여 OpenID Connect Provider의 구성 엔드포인트 또는 Authorization Server의 메타데이터 엔드포인트 검색을 사용하여 `ClientRegistration`을 처음에 구성할 수 있습니다.

## CommonOAuth2Provider

`CommonOAuth2Provider`는 Google, GitHub, Facebook, Okta와 같이 잘 알려진 여러 제공자에 대한 기본 클라이언트 속성 집합을 사전에 정의합니다.

예를 들어 `authorization-uri`, `token-uri` 및 `user-info-uri`는 제공자에 대해 자주 변경되지 않습니다. 따라서 필요한 구성을 줄이기 위해 기본값을 제공하는 것이 좋습니다.

이전에 설명한 것처럼 Google 클라이언트를 구성할 때 `client-id` 및 `client-secret` 속성만 필요합니다.

다음 목록은 예제를 보여줍니다.

```yaml
spring:
  security:
    oauth2:
      client:
        registration:
          google:
            client-id: google-client-id
            client-secret: google-client-secret
```

`registrationId`(google)가 `CommonOAuth2Provider`의 `GOOGLE` 열거형(대소문자 구분 안 함)과 일치하기 때문에 클라이언트 속성의 자동 기본 설정이 여기에서 원활하게 작동합니다.

`google-login`과 같이 다른 `registrationId`를 지정하려는 경우 `provider` 속성을 구성하여 클라이언트 속성의 자동 기본 설정을 계속 활용할 수 있습니다.

다음 목록은 예제를 보여줍니다.

```yaml
spring:
  security:
    oauth2:
      client:
        registration:
          google-login:
            provider: google
            client-id: google-client-id
            client-secret: google-client-secret
```

- `registrationId`가 `google-login`으로 설정됩니다.
- `provider` 속성은 `google`로 설정되며, 이는 `CommonOAuth2Provider.GOOGLE.getBuilder()`에 설정된 클라이언트 속성의 자동 기본 설정을 활용합니다.

## 사용자 정의 제공자 속성 구성

일부 OAuth 2.0 제공자는 다중 테넌트를 지원하므로 각 테넌트(또는 하위 도메인)에 대해 다른 프로토콜 엔드포인트가 생성됩니다.

예를 들어 Okta에 등록된 OAuth 클라이언트는 특정 하위 도메인에 할당되고 자체 프로토콜 엔드포인트가 있습니다.

이러한 경우를 위해 Spring Boot는 사용자 정의 제공자 속성을 구성하기 위해 다음과 같은 기본 속성을 제공합니다: `spring.security.oauth2.client.provider.[providerId]`.

다음 목록은 예제를 보여줍니다.

```yaml
spring:
  security:
    oauth2:
      client:
        registration:
          okta:
            client-id: okta-client-id
            client-secret: okta-client-secret
        provider:
          okta:
            authorization-uri: https://your-subdomain.oktapreview.com/oauth2/v1/authorize
            token-uri: https://your-subdomain.oktapreview.com/oauth2/v1/token
            user-info-uri: https://your-subdomain.oktapreview.com/oauth2/v1/userinfo
            user-name-attribute: sub
            jwk-set-uri: https://your-subdomain.oktapreview.com/oauth2/v1/keys
```

기본 속성(`spring.security.oauth2.client.provider.okta`)은 프로토콜 엔드포인트 위치의 사용자 정의 구성을 허용합니다.

## Spring Boot 자동 구성 재정의

OAuth 클라이언트 지원을 위한 Spring Boot 자동 구성 클래스는 `OAuth2ClientAutoConfiguration`입니다.

다음 작업을 수행합니다.

- 구성된 OAuth 클라이언트 속성에서 `ClientRegistration`으로 구성된 `ClientRegistrationRepository` `@Bean`을 등록합니다.
- `SecurityFilterChain` `@Bean`을 등록하고 `httpSecurity.oauth2Login()`을 통해 OAuth 2.0 로그인을 활성화합니다.

특정 요구 사항에 따라 자동 구성을 재정의해야 하는 경우 다음과 같은 방법으로 수행할 수 있습니다.

- `ClientRegistrationRepository` `@Bean` 등록
- `SecurityFilterChain` `@Bean` 등록
- 자동 구성을 완전히 재정의

### ClientRegistrationRepository @Bean 등록

다음 예제는 `ClientRegistrationRepository` `@Bean`을 등록하는 방법을 보여줍니다.

```kotlin
@Configuration
class OAuth2LoginConfig {
    @Bean
    fun clientRegistrationRepository(): ClientRegistrationRepository {
        return InMemoryClientRegistrationRepository(googleClientRegistration())
    }

    private fun googleClientRegistration(): ClientRegistration {
        return ClientRegistration.withRegistrationId("google")
                .clientId("google-client-id")
                .clientSecret("google-client-secret")
                .clientAuthenticationMethod(ClientAuthenticationMethod.CLIENT_SECRET_BASIC)
                .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
                .redirectUri("{baseUrl}/login/oauth2/code/{registrationId}")
                .scope("openid", "profile", "email", "address", "phone")
                .authorizationUri("https://accounts.google.com/o/oauth2/v2/auth")
                .tokenUri("https://www.googleapis.com/oauth2/v4/token")
                .userInfoUri("https://www.googleapis.com/oauth2/v3/userinfo")
                .userNameAttributeName(IdTokenClaimNames.SUB)
                .jwkSetUri("https://www.googleapis.com/oauth2/v3/certs")
                .clientName("Google")
                .build()
    }
}
```

### SecurityFilterChain @Bean 등록

다음 예제는 `@EnableWebSecurity`를 사용하여 `SecurityFilterChain` `@Bean`을 등록하고 `httpSecurity.oauth2Login()`을 통해 OAuth 2.0 로그인을 활성화하는 방법을 보여줍니다.

```kotlin
@Configuration
@EnableWebSecurity
class OAuth2LoginSecurityConfig {

    @Bean
    open fun filterChain(http: HttpSecurity): SecurityFilterChain {
        http {
            authorizeRequests {
                authorize(anyRequest, authenticated)
            }
            oauth2Login { }
        }
        return http.build()
    }
}
```

### 자동 구성을 완전히 재정의

다음 예제는 `ClientRegistrationRepository` `@Bean`과 `SecurityFilterChain` `@Bean`을 등록하여 자동 구성을 완전히 재정의하는 방법을 보여줍니다.

```kotlin
@Configuration
class OAuth2LoginConfig {

    @Bean
    open fun filterChain(http: HttpSecurity): SecurityFilterChain {
        http {
            authorizeRequests {
                authorize(anyRequest, authenticated)
            }
            oauth2Login { }
        }
        return http.build()
    }

    @Bean
    fun clientRegistrationRepository(): ClientRegistrationRepository {
        return InMemoryClientRegistrationRepository(googleClientRegistration())
    }

    private fun googleClientRegistration(): ClientRegistration {
        return ClientRegistration.withRegistrationId("google")
                .clientId("google-client-id")
                .clientSecret("google-client-secret")
                .clientAuthenticationMethod(ClientAuthenticationMethod.CLIENT_SECRET_BASIC)
                .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
                .redirectUri("{baseUrl}/login/oauth2/code/{registrationId}")
                .scope("openid", "profile", "email", "address", "phone")
                .authorizationUri("https://accounts.google.com/o/oauth2/v2/auth")
                .tokenUri("https://www.googleapis.com/oauth2/v4/token")
                .userInfoUri("https://www.googleapis.com/oauth2/v3/userinfo")
                .userNameAttributeName(IdTokenClaimNames.SUB)
                .jwkSetUri("https://www.googleapis.com/oauth2/v3/certs")
                .clientName("Google")
                .build()
    }
}
```

## Spring Boot 없이 Java 구성

Spring Boot를 사용할 수 없고 `CommonOAuth2Provider`에 사전 정의된 제공자(예: Google) 중 하나를 구성하려는 경우 다음 구성을 적용합니다.

```kotlin
@Configuration
@EnableWebSecurity
class OAuth2LoginConfig {

    @Bean
    fun filterChain(http: HttpSecurity): SecurityFilterChain {
        http
            .authorizeHttpRequests(authorize -> authorize
                .anyRequest().authenticated()
            )
            .oauth2Login(withDefaults())
        return http.build()
    }

    @Bean
    fun clientRegistrationRepository(): ClientRegistrationRepository {
        return InMemoryClientRegistrationRepository(googleClientRegistration())
    }

    @Bean
    fun authorizedClientService(
            clientRegistrationRepository: ClientRegistrationRepository): OAuth2AuthorizedClientService {
        return InMemoryOAuth2AuthorizedClientService(clientRegistrationRepository)
    }

    @Bean
    fun authorizedClientRepository(
            authorizedClientService: OAuth2AuthorizedClientService): OAuth2AuthorizedClientRepository {
        return AuthenticatedPrincipalOAuth2AuthorizedClientRepository(authorizedClientService)
    }

    private fun googleClientRegistration(): ClientRegistration {
        return CommonOAuth2Provider.GOOGLE.getBuilder("google")
            .clientId("google-client-id")
            .clientSecret("google-client-secret")
            .build()
    }
}
```
