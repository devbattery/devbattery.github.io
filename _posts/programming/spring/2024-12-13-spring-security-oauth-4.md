---
title: "[Spring Security] OAuth2 공식 문서 번역 (4)"
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

> [해당 공식 문서 원본 링크](https://docs.spring.io/spring-security/reference/servlet/oauth2/login/advanced.html)

# 고급 구성

`HttpSecurity.oauth2Login()`은 OAuth 2.0 로그인을 사용자 정의하기 위한 다양한 구성 옵션을 제공합니다. 주요 구성 옵션은 해당 프로토콜 엔드포인트별로 그룹화됩니다.

예를 들어, `oauth2Login().authorizationEndpoint()`는 Authorization Endpoint 구성을 허용하는 반면, `oauth2Login().tokenEndpoint()`는 Token Endpoint 구성을 허용합니다.

다음 코드는 예제를 보여줍니다.

**고급 OAuth2 로그인 구성**

```java
@Configuration
@EnableWebSecurity
class OAuth2LoginSecurityConfig {

    @Bean
    open fun filterChain(http: HttpSecurity): SecurityFilterChain {
        http {
            oauth2Login {
                authorizationEndpoint {
                    ...
                }
                redirectionEndpoint {
                    ...
                }
                tokenEndpoint {
                    ...
                }
                userInfoEndpoint {
                    ...
                }
            }
        }
        return http.build()
    }
}
```

`oauth2Login()` DSL의 주요 목표는 사양에 정의된 대로 이름 지정과 밀접하게 일치시키는 것입니다.

OAuth 2.0 Authorization Framework는 프로토콜 엔드포인트를 다음과 같이 정의합니다.

- 인증 프로세스는 두 개의 인증 서버 엔드포인트(HTTP 리소스)를 사용합니다.
  - Authorization Endpoint: 클라이언트가 사용자 에이전트 리디렉션을 통해 리소스 소유자로부터 권한을 얻는 데 사용됩니다.
  - Token Endpoint: 클라이언트가 일반적으로 클라이언트 인증을 사용하여 권한 부여를 액세스 토큰으로 교환하는 데 사용됩니다.
- 인증 프로세스는 또한 하나의 클라이언트 엔드포인트를 사용합니다.
  - Redirection Endpoint: 인증 서버가 리소스 소유자 사용자 에이전트를 통해 클라이언트에 인증 자격 증명을 포함하는 응답을 반환하는 데 사용됩니다.

OpenID Connect Core 1.0 사양은 UserInfo Endpoint를 다음과 같이 정의합니다.

- UserInfo Endpoint는 인증된 최종 사용자에 대한 클레임을 반환하는 OAuth 2.0 보호 리소스입니다. 최종 사용자에 대한 요청된 클레임을 얻기 위해 클라이언트는 OpenID Connect 인증을 통해 얻은 액세스 토큰을 사용하여 UserInfo Endpoint에 요청을 합니다. 이러한 클레임은 일반적으로 클레임에 대한 이름-값 쌍의 컬렉션을 포함하는 JSON 객체로 표시됩니다.

다음 코드는 `oauth2Login()` DSL에 사용 가능한 전체 구성 옵션을 보여줍니다.

**OAuth2 로그인 구성 옵션**

```java
@Configuration
@EnableWebSecurity
class OAuth2LoginSecurityConfig {

    @Bean
    open fun filterChain(http: HttpSecurity): SecurityFilterChain {
        http {
            oauth2Login {
                clientRegistrationRepository = clientRegistrationRepository()
                authorizedClientRepository = authorizedClientRepository()
                authorizedClientService = authorizedClientService()
                loginPage = "/login"
                authorizationEndpoint {
                    baseUri = authorizationRequestBaseUri()
                    authorizationRequestRepository = authorizationRequestRepository()
                    authorizationRequestResolver = authorizationRequestResolver()
                }
                redirectionEndpoint {
                    baseUri = authorizationResponseBaseUri()
                }
                tokenEndpoint {
                    accessTokenResponseClient = accessTokenResponseClient()
                }
                userInfoEndpoint {
                    userAuthoritiesMapper = userAuthoritiesMapper()
                    userService = oauth2UserService()
                    oidcUserService = oidcUserService()
                }
            }
        }
        return http.build()
    }
}
```

`oauth2Login()` DSL 외에도 XML 구성도 지원됩니다.

다음 코드는 보안 네임스페이스에서 사용할 수 있는 전체 구성 옵션을 보여줍니다.

**OAuth2 로그인 XML 구성 옵션**

```xml
<http>
	<oauth2-login client-registration-repository-ref="clientRegistrationRepository"
				  authorized-client-repository-ref="authorizedClientRepository"
				  authorized-client-service-ref="authorizedClientService"
				  authorization-request-repository-ref="authorizationRequestRepository"
				  authorization-request-resolver-ref="authorizationRequestResolver"
				  access-token-response-client-ref="accessTokenResponseClient"
				  user-authorities-mapper-ref="userAuthoritiesMapper"
				  user-service-ref="oauth2UserService"
				  oidc-user-service-ref="oidcUserService"
				  login-processing-url="/login/oauth2/code/*"
				  login-page="/login"
				  authentication-success-handler-ref="authenticationSuccessHandler"
				  authentication-failure-handler-ref="authenticationFailureHandler"
				  jwt-decoder-factory-ref="jwtDecoderFactory"/>
</http>
```

다음 섹션에서는 사용 가능한 각 구성 옵션에 대해 자세히 설명합니다.

- OAuth 2.0 로그인 페이지
- 리디렉션 엔드포인트
- UserInfo Endpoint
- ID 토큰 서명 확인
- [oauth2login-advanced-oidc-logout]

## OAuth 2.0 로그인 페이지

기본적으로 OAuth 2.0 로그인 페이지는 `DefaultLoginPageGeneratingFilter`에 의해 자동 생성됩니다. 기본 로그인 페이지는 구성된 각 OAuth 클라이언트를 `ClientRegistration.clientName`과 함께 링크로 표시하며, 이 링크는 Authorization Request(또는 OAuth 2.0 로그인)를 시작할 수 있습니다.

`DefaultLoginPageGeneratingFilter`가 구성된 OAuth 클라이언트에 대한 링크를 표시하려면 등록된 `ClientRegistrationRepository`가 `Iterable<ClientRegistration>`도 구현해야 합니다. 참고를 위해 `InMemoryClientRegistrationRepository`를 참조하세요.

각 OAuth 클라이언트에 대한 링크의 대상은 기본적으로 다음과 같습니다.

`OAuth2AuthorizationRequestRedirectFilter.DEFAULT_AUTHORIZATION_REQUEST_BASE_URI + "/{registrationId}"`

다음 줄은 예제를 보여줍니다.

`<a href="/oauth2/authorization/google">Google</a>`

기본 로그인 페이지를 재정의하려면 `oauth2Login().loginPage()` 및 (선택적으로) `oauth2Login().authorizationEndpoint().baseUri()`를 구성합니다.

다음 목록은 예제를 보여줍니다.

**OAuth2 로그인 페이지 구성**

```java
@Configuration
@EnableWebSecurity
public class OAuth2LoginSecurityConfig {

	@Bean
	public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
		http
			.oauth2Login(oauth2 -> oauth2
			    .loginPage("/login/oauth2")
			    ...
			    .authorizationEndpoint(authorization -> authorization
			        .baseUri("/login/oauth2/authorization")
			        ...
			    )
			);
		return http.build();
	}
}
```

사용자 정의 로그인 페이지를 렌더링할 수 있는 `@RequestMapping("/login/oauth2")`이 있는 `@Controller`를 제공해야 합니다.

앞서 언급했듯이 `oauth2Login().authorizationEndpoint().baseUri()` 구성은 선택 사항입니다. 그러나 사용자 정의하기로 선택한 경우 각 OAuth 클라이언트에 대한 링크가 `authorizationEndpoint().baseUri()`와 일치하는지 확인하세요.

다음 줄은 예제를 보여줍니다.

`<a href="/login/oauth2/authorization/google">Google</a>`

## 리디렉션 엔드포인트

리디렉션 엔드포인트는 인증 서버가 리소스 소유자 사용자 에이전트를 통해 클라이언트에 인증 응답(인증 자격 증명을 포함)을 반환하는 데 사용됩니다.

OAuth 2.0 로그인은 Authorization Code Grant를 활용합니다. 따라서 인증 자격 증명은 authorization code입니다.

기본 인증 응답 `baseUri`(리디렉션 엔드포인트)는 `/login/oauth2/code/*`이며, 이는 `OAuth2LoginAuthenticationFilter.DEFAULT_FILTER_PROCESSES_URI`에 정의되어 있습니다.

인증 응답 `baseUri`를 사용자 정의하려면 다음과 같이 구성합니다.

**리디렉션 엔드포인트 구성**

```java
@Configuration
@EnableWebSecurity
public class OAuth2LoginSecurityConfig {

    @Bean
	public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
		http
			.oauth2Login(oauth2 -> oauth2
			    .redirectionEndpoint(redirection -> redirection
			        .baseUri("/login/oauth2/callback/*")
			        ...
			    )
			);
		return http.build();
	}
}
```

또한 `ClientRegistration.redirectUri`가 사용자 정의 인증 응답 `baseUri`와 일치하는지 확인해야 합니다.

다음 목록은 예제를 보여줍니다.

```java
return CommonOAuth2Provider.GOOGLE.getBuilder("google")
    .clientId("google-client-id")
    .clientSecret("google-client-secret")
    .redirectUri("{baseUrl}/login/oauth2/callback/{registrationId}")
    .build()
```

## UserInfo Endpoint

UserInfo Endpoint에는 다음 하위 섹션에 설명된 대로 여러 구성 옵션이 포함되어 있습니다.

- 사용자 권한 매핑
- OAuth 2.0 UserService
- OpenID Connect 1.0 UserService

### 사용자 권한 매핑

사용자가 OAuth 2.0 제공자로 성공적으로 인증한 후 `OAuth2User.getAuthorities()`(또는 `OidcUser.getAuthorities()`)에는 `OAuth2UserRequest.getAccessToken().getScopes()`에서 채워지고 `SCOPE_` 접두사가 붙은 권한 목록이 포함됩니다. 이러한 권한은 인증을 완료할 때 `OAuth2AuthenticationToken`에 제공되는 새로운 `GrantedAuthority` 인스턴스 집합으로 매핑될 수 있습니다.

`OAuth2AuthenticationToken.getAuthorities()`는 `hasRole('USER')` 또는 `hasRole('ADMIN')`과 같이 요청을 승인하는 데 사용됩니다.

사용자 권한을 매핑할 때 선택할 수 있는 몇 가지 옵션이 있습니다.

- `GrantedAuthoritiesMapper` 사용
- `OAuth2UserService`를 사용한 위임 기반 전략

#### GrantedAuthoritiesMapper 사용

`GrantedAuthoritiesMapper`에는 `OAuth2UserAuthority` 유형의 특수 권한과 권한 문자열 `OAUTH2_USER`(또는 `OidcUserAuthority` 및 권한 문자열 `OIDC_USER`)를 포함하는 권한 목록이 제공됩니다.

`GrantedAuthoritiesMapper` 구현을 제공하고 다음과 같이 구성합니다.

**권한 매퍼 구성**

```java
@Configuration
@EnableWebSecurity
public class OAuth2LoginSecurityConfig {

    @Bean
	public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
		http
			.oauth2Login(oauth2 -> oauth2
			    .userInfoEndpoint(userInfo -> userInfo
			        .userAuthoritiesMapper(this.userAuthoritiesMapper())
			        ...
			    )
			);
		return http.build();
	}

	private GrantedAuthoritiesMapper userAuthoritiesMapper() {
		return (authorities) -> {
			Set<GrantedAuthority> mappedAuthorities = new HashSet<>();

			authorities.forEach(authority -> {
				if (OidcUserAuthority.class.isInstance(authority)) {
					OidcUserAuthority oidcUserAuthority = (OidcUserAuthority)authority;

					OidcIdToken idToken = oidcUserAuthority.getIdToken();
					OidcUserInfo userInfo = oidcUserAuthority.getUserInfo();

					// idToken 및/또는 userInfo에서 찾은 클레임을
					// 하나 이상의 GrantedAuthority에 매핑하고 mappedAuthorities에 추가

				} else if (OAuth2UserAuthority.class.isInstance(authority)) {
					OAuth2UserAuthority oauth2UserAuthority = (OAuth2UserAuthority)authority;

					Map<String, Object> userAttributes = oauth2UserAuthority.getAttributes();

					// userAttributes에서 찾은 속성을
					// 하나 이상의 GrantedAuthority에 매핑하고 mappedAuthorities에 추가

				}
			});

			return mappedAuthorities;
		};
	}
}
```

또는 `GrantedAuthoritiesMapper` `@Bean`을 등록하여 다음과 같이 구성에 자동으로 적용되도록 할 수 있습니다.

**권한 매퍼 Bean 구성**

```java
@Configuration
@EnableWebSecurity
class OAuth2LoginSecurityConfig {

    @Bean
    open fun filterChain(http: HttpSecurity): SecurityFilterChain {
        http {
            oauth2Login { }
        }
        return http.build()
    }

    @Bean
    fun userAuthoritiesMapper(): GrantedAuthoritiesMapper {
        ...
    }
}
```

#### OAuth2UserService를 사용한 위임 기반 전략

이 전략은 `GrantedAuthoritiesMapper`를 사용하는 것보다 고급입니다. 그러나 OAuth 2.0 `UserService`를 사용할 때는 `OAuth2UserRequest` 및 `OAuth2User`에 액세스할 수 있고 OpenID Connect 1.0 `UserService`를 사용할 때는 `OidcUserRequest` 및 `OidcUser`에 액세스할 수 있으므로 더 유연합니다.

`OAuth2UserRequest`(및 `OidcUserRequest`)는 연결된 `OAuth2AccessToken`에 대한 액세스를 제공합니다. 이는 위임자가 사용자에 대한 사용자 정의 권한을 매핑하기 전에 보호된 리소스에서 권한 정보를 가져와야 하는 경우에 매우 유용합니다.

다음 예제는 OpenID Connect 1.0 `UserService`를 사용하여 위임 기반 전략을 구현하고 구성하는 방법을 보여줍니다.

**OAuth2UserService 구성**

```java
@Configuration
@EnableWebSecurity
public class OAuth2LoginSecurityConfig {

	@Bean
	public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
		http
			.oauth2Login(oauth2 -> oauth2
			    .userInfoEndpoint(userInfo -> userInfo
			        .oidcUserService(this.oidcUserService())
			        ...
			    )
			);
		return http.build();
	}

	private OAuth2UserService<OidcUserRequest, OidcUser> oidcUserService() {
		final OidcUserService delegate = new OidcUserService();

		return (userRequest) -> {
			// 사용자를 로드하기 위한 기본 구현에 위임
			OidcUser oidcUser = delegate.loadUser(userRequest);

			OAuth2AccessToken accessToken = userRequest.getAccessToken();
			Set<GrantedAuthority> mappedAuthorities = new HashSet<>();

			// TODO
			// 1) accessToken을 사용하여 보호된 리소스에서 권한 정보를 가져옵니다.
			// 2) 권한 정보를 하나 이상의 GrantedAuthority에 매핑하고 mappedAuthorities에 추가합니다.

			// 3) oidcUser의 복사본을 만들되 mappedAuthorities를 대신 사용합니다.
			ProviderDetails providerDetails = userRequest.getClientRegistration().getProviderDetails();
			String userNameAttributeName = providerDetails.getUserInfoEndpoint().getUserNameAttributeName();
			if (StringUtils.hasText(userNameAttributeName)) {
				oidcUser = new DefaultOidcUser(mappedAuthorities, oidcUser.getIdToken(), oidcUser.getUserInfo(), userNameAttributeName);
			} else {
				oidcUser = new DefaultOidcUser(mappedAuthorities, oidcUser.getIdToken(), oidcUser.getUserInfo());
			}

			return oidcUser;
		};
	}
}
```

### OAuth 2.0 UserService

`DefaultOAuth2UserService`는 표준 OAuth 2.0 제공자를 지원하는 `OAuth2UserService`의 구현입니다.

`OAuth2UserService`는 UserInfo Endpoint에서 최종 사용자(리소스 소유자)의 사용자 속성을 가져오고(인증 흐름 중에 클라이언트에 부여된 액세스 토큰을 사용) `OAuth2User` 형식으로 `AuthenticatedPrincipal`을 반환합니다.

`DefaultOAuth2UserService`는 UserInfo Endpoint에서 사용자 속성을 요청할 때 `RestOperations` 인스턴스를 사용합니다.

UserInfo 요청의 사전 처리를 사용자 정의해야 하는 경우 `DefaultOAuth2UserService.setRequestEntityConverter()`에 사용자 정의 `Converter<OAuth2UserRequest, RequestEntity<?>>`를 제공할 수 있습니다. 기본 구현 `OAuth2UserRequestEntityConverter`는 기본적으로 Authorization 헤더에 `OAuth2AccessToken`을 설정하는 UserInfo 요청의 `RequestEntity` 표현을 빌드합니다.

반면에 UserInfo 응답의 사후 처리를 사용자 정의해야 하는 경우 `DefaultOAuth2UserService.setRestOperations()`에 사용자 정의 구성된 `RestOperations`를 제공해야 합니다. 기본 `RestOperations`는 다음과 같이 구성됩니다.

```java
RestTemplate restTemplate = new RestTemplate();
restTemplate.setErrorHandler(new OAuth2ErrorResponseErrorHandler());
```

`OAuth2ErrorResponseErrorHandler`는 OAuth 2.0 오류(400 Bad Request)를 처리할 수 있는 `ResponseErrorHandler`입니다. OAuth 2.0 오류 매개변수를 `OAuth2Error`로 변환하기 위해 `OAuth2ErrorHttpMessageConverter`를 사용합니다.

`DefaultOAuth2UserService`를 사용자 정의하든 `OAuth2UserService`의 자체 구현을 제공하든 다음과 같이 구성해야 합니다.

```java
@Configuration
@EnableWebSecurity
class OAuth2LoginSecurityConfig {

    @Bean
    open fun filterChain(http: HttpSecurity): SecurityFilterChain {
        http {
            oauth2Login {
                userInfoEndpoint {
                    userService = oauth2UserService()
                    // ...
                }
            }
        }
        return http.build()
    }

    private fun oauth2UserService(): OAuth2UserService<OAuth2UserRequest, OAuth2User> {
        // ...
    }
}
```

### OpenID Connect 1.0 UserService

`OidcUserService`는 OpenID Connect 1.0 제공자를 지원하는 `OAuth2UserService`의 구현입니다.

`OidcUserService`는 UserInfo Endpoint에서 사용자 속성을 요청할 때 `DefaultOAuth2UserService`를 활용합니다.

UserInfo 요청의 사전 처리 또는 UserInfo 응답의 사후 처리를 사용자 정의해야 하는 경우 `OidcUserService.setOauth2UserService()`에 사용자 정의 구성된 `DefaultOAuth2UserService`를 제공해야 합니다.

`OidcUserService`를 사용자 정의하든 OpenID Connect 1.0 제공자에 대한 `OAuth2UserService`의 자체 구현을 제공하든 다음과 같이 구성해야 합니다.

```java
@Configuration
@EnableWebSecurity
class OAuth2LoginSecurityConfig {

    @Bean
    open fun filterChain(http: HttpSecurity): SecurityFilterChain {
        http {
            oauth2Login {
                userInfoEndpoint {
                    oidcUserService = oidcUserService()
                    // ...
                }
            }
        }
        return http.build()
    }

    private fun oidcUserService(): OAuth2UserService<OidcUserRequest, OidcUser> {
        // ...
    }
}
```

## ID 토큰 서명 확인

OpenID Connect 1.0 인증은 클라이언트에서 사용할 때 인증 서버에 의한 최종 사용자 인증에 대한 클레임을 포함하는 보안 토큰인 ID 토큰을 도입합니다.

ID 토큰은 JSON 웹 토큰(JWT)으로 표시되며 JSON 웹 서명(JWS)을 사용하여 서명해야 합니다.

`OidcIdTokenDecoderFactory`는 `OidcIdToken` 서명 확인에 사용되는 `JwtDecoder`를 제공합니다. 기본 알고리즘은 RS256이지만 클라이언트 등록 중에 할당될 때 다를 수 있습니다. 이러한 경우 특정 클라이언트에 할당된 예상 JWS 알고리즘을 반환하도록 리졸버를 구성할 수 있습니다.

JWS 알고리즘 리졸버는 `ClientRegistration`을 허용하고 클라이언트에 대한 예상 `JwsAlgorithm`(예: `SignatureAlgorithm.RS256` 또는 `MacAlgorithm.HS256`)을 반환하는 함수입니다.

다음 코드는 모든 `ClientRegistration` 인스턴스에 대해 기본값을 `MacAlgorithm.HS256`으로 설정하도록 `OidcIdTokenDecoderFactory` `@Bean`을 구성하는 방법을 보여줍니다.

```java
@Bean
fun idTokenDecoderFactory(): JwtDecoderFactory<ClientRegistration?> {
    val idTokenDecoderFactory = OidcIdTokenDecoderFactory()
    idTokenDecoderFactory.setJwsAlgorithmResolver { MacAlgorithm.HS256 }
    return idTokenDecoderFactory
}
```

MAC 기반 알고리즘(예: HS256, HS384 또는 HS512)의 경우 `client-id`에 해당하는 `client-secret`이 서명 확인을 위한 대칭 키로 사용됩니다.

OpenID Connect 1.0 인증에 대해 둘 이상의 `ClientRegistration`이 구성된 경우 JWS 알고리즘 리졸버는 제공된 `ClientRegistration`을 평가하여 반환할 알고리즘을 결정할 수 있습니다.

그런 다음 로그아웃 구성을 진행할 수 있습니다.
