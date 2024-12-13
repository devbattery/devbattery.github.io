---
title: "[Spring Security] OAuth2 공식 문서 번역 (5)"
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

> [해당 공식 문서 원본 링크](https://docs.spring.io/spring-security/reference/servlet/oauth2/login/logout.html)

# OIDC 로그아웃

최종 사용자가 애플리케이션에 로그인할 수 있게 되면 로그아웃 방법에 대해서도 고려하는 것이 중요합니다.

일반적으로 고려해야 할 세 가지 사용 사례가 있습니다.

- 로컬 로그아웃만 수행하고 싶습니다.
- 애플리케이션과 OIDC 제공자 모두에서 로그아웃하고 싶습니다. (애플리케이션에서 시작)
- 애플리케이션과 OIDC 제공자 모두에서 로그아웃하고 싶습니다. (OIDC 제공자에서 시작)

## 로컬 로그아웃

로컬 로그아웃을 수행하는 데는 특별한 OIDC 구성이 필요하지 않습니다. Spring Security는 자동으로 로컬 로그아웃 엔드포인트를 제공하며, `logout()` DSL을 통해 구성할 수 있습니다.

## OpenID Connect 1.0 클라이언트 초기화 로그아웃

OpenID Connect Session Management 1.0은 클라이언트를 사용하여 제공자에서 최종 사용자를 로그아웃하는 기능을 허용합니다. 사용 가능한 전략 중 하나는 RP 초기화 로그아웃입니다.

OpenID 제공자가 세션 관리와 검색을 모두 지원하는 경우 클라이언트는 OpenID 제공자의 검색 메타데이터에서 `end_session_endpoint` URL을 얻을 수 있습니다. 다음과 같이 `issuer-uri`로 `ClientRegistration`을 구성하여 이를 수행할 수 있습니다.

```yaml
spring:
  security:
    oauth2:
      client:
        registration:
          okta:
            client-id: okta-client-id
            client-secret: okta-client-secret
            ...
        provider:
          okta:
            issuer-uri: https://dev-1234.oktapreview.com
```

또한 RP 초기화 로그아웃을 구현하는 `OidcClientInitiatedLogoutSuccessHandler`를 다음과 같이 구성해야 합니다.

```java
@Configuration
@EnableWebSecurity
class OAuth2LoginSecurityConfig {
    @Autowired
    private lateinit var clientRegistrationRepository: ClientRegistrationRepository

    @Bean
    open fun filterChain(http: HttpSecurity): SecurityFilterChain {
        http {
            authorizeHttpRequests {
                authorize(anyRequest, authenticated)
            }
            oauth2Login { }
            logout {
                logoutSuccessHandler = oidcLogoutSuccessHandler()
            }
        }
        return http.build()
    }

    private fun oidcLogoutSuccessHandler(): LogoutSuccessHandler {
        val oidcLogoutSuccessHandler = OidcClientInitiatedLogoutSuccessHandler(clientRegistrationRepository)

        // 제공자에서 로그아웃이 수행된 후 최종 사용자의 사용자 에이전트가 리디렉션될 위치를 설정합니다.
        oidcLogoutSuccessHandler.setPostLogoutRedirectUri("{baseUrl}")
        return oidcLogoutSuccessHandler
    }
}
```

`OidcClientInitiatedLogoutSuccessHandler`는 `{baseUrl}` 플레이스홀더를 지원합니다. 사용되는 경우 요청 시 `app.example.org`와 같은 애플리케이션의 기본 URL이 대체됩니다.

## OpenID Connect 1.0 백채널 로그아웃

OpenID Connect Session Management 1.0은 제공자가 클라이언트에 대한 API 호출을 하도록 하여 클라이언트에서 최종 사용자를 로그아웃하는 기능을 허용합니다. 이를 OIDC 백채널 로그아웃이라고 합니다.

이를 활성화하려면 다음과 같이 DSL에서 백채널 로그아웃 엔드포인트를 설정할 수 있습니다.

```java
@Bean
fun oidcLogoutHandler(): OidcBackChannelLogoutHandler {
    return OidcBackChannelLogoutHandler()
}

@Bean
open fun filterChain(http: HttpSecurity): SecurityFilterChain {
    http {
        authorizeRequests {
            authorize(anyRequest, authenticated)
        }
        oauth2Login { }
        oidcLogout {
            backChannel { }
        }
    }
    return http.build()
}
```

그런 다음 이전 `OidcSessionInformation` 항목을 제거하기 위해 Spring Security에서 게시한 이벤트를 수신하는 방법이 필요합니다.

```java
@Bean
open fun sessionEventPublisher(): HttpSessionEventPublisher {
    return HttpSessionEventPublisher()
}
```

이렇게 하면 `HttpSession#invalidate`가 호출되면 세션도 메모리에서 제거됩니다.

그리고 이것이 전부입니다!

이렇게 하면 OIDC 제공자가 애플리케이션에서 최종 사용자의 지정된 세션을 무효화하기 위해 요청할 수 있는 엔드포인트 `/logout/connect/back-channel/{registrationId}`가 설정됩니다.

- `oidcLogout`을 사용하려면 `oauth2Login`도 구성해야 합니다.
- `oidcLogout`은 백채널을 통해 각 세션을 올바르게 로그아웃하려면 세션 쿠키를 `JSESSIONID`라고 해야 합니다.

## 백채널 로그아웃 아키텍처

식별자가 `registrationId`인 `ClientRegistration`을 고려하십시오.

백채널 로그아웃의 전체 흐름은 다음과 같습니다.

1. 로그인 시 Spring Security는 ID 토큰, CSRF 토큰 및 제공자 세션 ID(있는 경우)를 해당 `OidcSessionRegistry` 구현의 애플리케이션 세션 ID와 상호 연결합니다.
2. 그런 다음 로그아웃 시 OIDC 제공자는 로그아웃할 `sub`(최종 사용자) 또는 `sid`(제공자 세션 ID)를 나타내는 로그아웃 토큰을 포함하여 `/logout/connect/back-channel/registrationId`에 대한 API 호출을 합니다.
3. Spring Security는 토큰의 서명과 클레임을 검증합니다.
4. 토큰에 `sid` 클레임이 포함된 경우 해당 제공자 세션과 연관된 클라이언트의 세션만 종료됩니다.
5. 그렇지 않고 토큰에 `sub` 클레임이 포함된 경우 해당 최종 사용자에 대한 모든 클라이언트 세션이 종료됩니다.

Spring Security의 OIDC 지원은 다중 테넌트임을 기억하십시오. 즉, 클라이언트가 로그아웃 토큰의 `aud` 클레임과 일치하는 세션만 종료합니다.

이 아키텍처 구현의 주목할 만한 부분 중 하나는 해당 세션에 대해 내부적으로 들어오는 백채널 요청을 전파한다는 것입니다. 처음에는 이것이 불필요해 보일 수 있습니다. 그러나 Servlet API는 `HttpSession` 저장소에 대한 직접 액세스를 제공하지 않는다는 점을 기억하십시오. 내부 로그아웃 호출을 하면 해당 세션의 유효성을 검사할 수 있습니다.

또한 내부적으로 로그아웃 호출을 위조하면 각 `LogoutHandler` 집합을 해당 세션 및 해당 `SecurityContext`에 대해 실행할 수 있습니다.

## 세션 로그아웃 엔드포인트 사용자 정의

`OidcBackChannelLogoutHandler`가 게시되면 세션 로그아웃 엔드포인트는 `{baseUrl}/logout/connect/back-channel/{registrationId}`입니다.

`OidcBackChannelLogoutHandler`가 연결되지 않은 경우 URL은 `{baseUrl}/logout/connect/back-channel/{registrationId}`이며, CSRF 토큰 전달이 필요하기 때문에 권장되지 않습니다. 이는 애플리케이션에서 사용하는 저장소 종류에 따라 어려울 수 있습니다.

엔드포인트를 사용자 정의해야 하는 경우 다음과 같이 URL을 제공할 수 있습니다.

```java
http {
    oidcLogout {
        backChannel {
            logoutUri = "http://localhost:9000/logout/connect/back-channel/+{registrationId}+"
        }
    }
}
```

## 세션 로그아웃 쿠키 이름 사용자 정의

기본적으로 세션 로그아웃 엔드포인트는 `JSESSIONID` 쿠키를 사용하여 세션을 해당 `OidcSessionInformation`과 연관시킵니다.

그러나 Spring Session의 기본 쿠키 이름은 `SESSION`입니다.

다음과 같이 DSL에서 Spring Session의 쿠키 이름을 구성할 수 있습니다.

```java
@Bean
open fun oidcLogoutHandler(val sessionRegistry: OidcSessionRegistry): OidcBackChannelLogoutHandler {
    val logoutHandler = OidcBackChannelLogoutHandler(sessionRegistry)
    logoutHandler.setSessionCookieName("SESSION")
    return logoutHandler
}
```

## OIDC 제공자 세션 레지스트리 사용자 정의

기본적으로 Spring Security는 OIDC 제공자 세션과 클라이언트 세션 간의 모든 링크를 메모리에 저장합니다.

클러스터형 애플리케이션과 같이 데이터베이스와 같은 별도의 위치에 저장하는 것이 좋은 여러 상황이 있습니다.

다음과 같이 사용자 정의 `OidcSessionRegistry`를 구성하여 이를 달성할 수 있습니다.

```java
@Component
class MySpringDataOidcSessionRegistry: OidcSessionRegistry {
    val sessions: OidcProviderSessionRepository

    // ...

    @Override
    fun saveSessionInformation(info: OidcSessionInformation) {
        this.sessions.save(info)
    }

    @Override
    fun removeSessionInformation(clientSessionId: String): OidcSessionInformation {
       return this.sessions.removeByClientSessionId(clientSessionId);
    }

    @Override
    fun removeSessionInformation(token: OidcLogoutToken): Iterable<OidcSessionInformation> {
        return token.getSessionId() != null ?
            this.sessions.removeBySessionIdAndIssuerAndAudience(...) :
            this.sessions.removeBySubjectAndIssuerAndAudience(...);
    }
}
```
