---
title: "[Project] Spring Security 환경에서 OAuth 2.0 로그인 구현 방법 (백엔드 시점)"
excerpt: "movlit, spring, spring-boot, spring-security, oauth"

categories:
  - Project
tags:
  - [movlit, spring, spring-boot, spring-security, oauth]

toc: true
toc_sticky: true

sidebar:
  nav: "categories"

date: 2025-04-29
last_modified_at: 2025-04-30
---

> [Movlit 프로젝트](https://github.com/venus-lion/movlit-plus)에 대한 설명입니다.  
> [프론트엔드 시점 OAuth 2.0 로그인 구현 방법](TODO)의 링크를 참고하시면 좋습니다.

## 백엔드 OAuth 2.0 로그인 흐름 (Spring Security)

프론트엔드에서 "Google로 로그인" 버튼을 클릭하면, 사용자는 `/oauth2/authorization/{provider}` (예: `/oauth2/authorization/google`)와 같은 Spring Security가 기본적으로 제공하는 엔드포인트로 이동합니다. 이후의 흐름은 다음과 같습니다.

1.  **OAuth 제공자로 리디렉션 (Spring Security 처리)**: Spring Security의 `OAuth2LoginAuthenticationFilter`가 요청을 가로채고, 설정에 따라 사용자를 Google, Kakao 등의 인증 서버로 리디렉션합니다.
2.  **사용자 인증 및 권한 부여 (OAuth 제공자)**: 사용자는 OAuth 제공자 사이트에서 로그인하고, 우리 서비스가 요청한 정보 접근 권한을 승인합니다.
3.  **백엔드 콜백으로 리디렉션 (Spring Security 처리)**: 인증 성공 시, OAuth 제공자는 Spring Security에 설정된 리디렉션 URI(기본적으로 `/login/oauth2/code/{provider}`)로 사용자를 리디렉션시키며, 이때 OAuth 제공자가 발급한 `authorization_code`를 전달합니다.
4.  **Access Token 교환 (Spring Security 처리)**: Spring Security는 이 `authorization_code`를 사용하여 OAuth 제공자에게 `Access Token`을 요청하고 받아옵니다.
5.  **사용자 정보 조회 및 처리 (Custom OAuth2UserService)**: Spring Security는 발급받은 `Access Token`을 사용하여 OAuth 제공자로부터 사용자 정보를 조회합니다. 이 과정에서 우리가 커스텀한 `MyOAuth2MemberService`가 사용됩니다.
    - `MyOAuth2MemberService`는 조회된 사용자 정보(이메일, 프로필 사진 등)를 바탕으로 우리 서비스의 DB에서 사용자를 찾거나, 없다면 새로 가입시킵니다.
    - 인증된 사용자 정보를 담은 `MyMemberDetails` (커스텀 `OAuth2User` 또는 `UserDetails` 구현체) 객체를 생성하여 Spring Security 컨텍스트에 저장합니다.
6.  **인증 성공 후 처리 (Custom AuthenticationSuccessHandler)**: `OAuth2AuthenticationSuccessHandler`가 실행됩니다.
    - 이 핸들러는 우리 서비스 내부용 **임시 `code`**를 생성합니다. (프론트엔드 글에서 언급된 `authorization_code`와는 다른, 우리 시스템 내에서 사용할 코드입니다.)
    - 이 임시 `code`와 함께 프론트엔드의 OAuth 콜백 페이지 (`/oauth/callback`)로 사용자를 리디렉션 시킵니다. (예: `https://your-frontend.com/oauth/callback?code=backend_generated_temp_code`)
    - (선택적으로, 이때 백엔드에서 즉시 사용할 수 있는 Access Token을 응답 헤더에 포함시켜 전달할 수도 있습니다. Movlit 코드에서는 `Authorization` 헤더에 JWT Access Token을 설정합니다.)
7.  **프론트엔드의 토큰 요청**: 프론트엔드의 `OAuthCallback.jsx` 컴포넌트는 리디렉션 시 URL 쿼리 파라미터로 받은 **임시 `code`**를 백엔드의 `/token` 엔드포인트로 전송합니다.
8.  **최종 토큰 발급 (백엔드 `/token` 엔드포인트)**:
    - 백엔드는 전달받은 **임시 `code`**를 검증합니다 (예: `AuthCodeStorage`를 통해).
    - 검증이 성공하면, 해당 사용자에 대한 우리 서비스의 `Access Token`과 `Refresh Token` (JWT 기반)을 생성하여 프론트엔드에 응답으로 전달합니다.
9.  **프론트엔드의 토큰 저장**: 프론트엔드는 이 토큰들을 저장하고 이후 API 요청에 사용합니다.

## Spring Security 설정 (`SecurityConfig.java`)

Spring Security 설정을 통해 OAuth 2.0 로그인 과정을 구성합니다.

먼저, `HttpSecurity`를 사용하여 전반적인 웹 보안 설정을 구성합니다.

```java
// SecurityConfig.java
@Bean
public SecurityFilterChain securityFilterChain(HttpSecurity http, CorsConfigurationSource corsConfigurationSource)
        throws Exception {
    http
            // ... (다른 설정들)
            .oauth2Login(auth -> auth // OAuth2 로그인 설정 시작
                    .userInfoEndpoint( // 사용자 정보 가져오는 설정
                            userInfoEndpointConfig -> userInfoEndpointConfig.userService(myOAuth2MemberService) // 커스텀 서비스 지정
                    )
                    .successHandler(oAuth2AuthenticationSuccessHandler) // 인증 성공 시 커스텀 핸들러 지정
            )
            // ... (다른 설정들)
    return http.build();
}
```

- **`oauth2Login()`**: OAuth2 로그인을 활성화합니다.
  - `userInfoEndpoint().userService(myOAuth2MemberService)`: OAuth 제공자로부터 사용자 정보를 성공적으로 가져온 후, 이를 처리할 커스텀 `OAuth2UserService`로 `MyOAuth2MemberService`를 지정합니다.
  - `successHandler(oAuth2AuthenticationSuccessHandler)`: OAuth2 인증이 최종적으로 성공했을 때 실행될 커스텀 핸들러로 `OAuth2AuthenticationSuccessHandler`를 지정합니다. 이 핸들러는 프론트엔드로의 리디렉션을 담당합니다.

다음으로, API 엔드포인트에 대한 접근 권한을 설정합니다.

```java
// SecurityConfig.java
// ...
.authorizeHttpRequests(requests -> requests
        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll() // CORS preflight 요청은 모두 허용
        .requestMatchers("/api/members/login", "/token", "/refresh").permitAll() // 자체 토큰 발급/갱신 엔드포인트
        .requestMatchers("/oauth2/**", "/login/oauth2/**").permitAll() // Spring Security OAuth2 내부 처리 경로
        // ... (기타 공개적으로 접근 가능한 경로들) ...
        .anyRequest().authenticated() // 그 외 모든 요청은 인증 필요
)
// ...
```

- `/oauth2/**`, `/login/oauth2/**`: Spring Security가 OAuth2 인증 흐름(제공자로의 리디렉션, 콜백 처리 등)을 위해 내부적으로 사용하는 경로들입니다. 이 경로들은 인증 없이 접근 가능해야 합니다.
- `/token`, `/refresh`: 프론트엔드가 우리 서비스의 JWT Access Token과 Refresh Token을 발급받거나 갱신하기 위해 호출하는 엔드포인트입니다. 이 역시 인증 없이 접근 가능해야 합니다.

CORS(Cross-Origin Resource Sharing) 설정은 프론트엔드와 백엔드가 다른 도메인 또는 포트에서 실행될 때 필요합니다.

```java
// SecurityConfig.java
// ...
.cors(Customizer.withDefaults()) // 아래 corsConfigurationSource Bean 설정을 사용
// ...

@Bean
public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration configuration = new CorsConfiguration();
    configuration.setAllowedOrigins(List.of(url)); // 프론트엔드 URL 허용 (`url`은 @Value로 주입)
    configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS")); // 허용할 HTTP 메소드
    configuration.setAllowedHeaders(List.of("*")); // 모든 요청 헤더 허용
    configuration.setAllowCredentials(true); // 쿠키 등 자격 증명 정보 허용

    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", configuration); // 모든 경로에 대해 위 설정 적용
    return source;
}
```

- `cors(Customizer.withDefaults())`: `corsConfigurationSource()` Bean에서 정의한 CORS 설정을 적용합니다.
- `corsConfigurationSource()`: 프론트엔드 애플리케이션(`url` 변수에 지정된 주소)으로부터의 요청을 허용하도록 설정합니다. `allowCredentials(true)`는 쿠키 기반의 Refresh Token을 주고받기 위해 중요합니다.

마지막으로, 우리가 구현한 `JwtRequestFilter`를 Spring Security 필터 체인에 추가하여, OAuth2 로그인이 아닌 일반적인 API 요청에 대해 JWT 토큰을 검증하도록 합니다.

```java
// SecurityConfig.java
// ...
.addFilterBefore(jwtRequestFilter, UsernamePasswordAuthenticationFilter.class); // JWT 필터 추가
// ...
```

- `addFilterBefore(...)`: `UsernamePasswordAuthenticationFilter` (일반적인 사용자명/비밀번호 인증 처리 필터)보다 먼저 `jwtRequestFilter`가 실행되도록 설정하여, 모든 요청에서 JWT의 유효성을 먼저 검사합니다.

기타 설정:

```java
// SecurityConfig.java
// ...
.csrf(AbstractHttpConfigurer::disable) // CSRF 보호 비활성화 (Stateless JWT 사용 시 일반적)
.headers(x -> x.frameOptions(FrameOptionsConfig::disable)) // H2 콘솔 사용 위한 설정 (개발 시)
.formLogin(AbstractHttpConfigurer::disable) // 기본 폼 로그인 비활성화
.logout(logout -> logout // 로그아웃 설정
        .logoutUrl("/api/members/logout")
        .permitAll()
        .logoutSuccessHandler(((request, response, authentication) -> response.setStatus(
                HttpServletResponse.SC_NO_CONTENT)))
        .deleteCookies("refreshToken") // 로그아웃 시 refreshToken 쿠키 삭제
)
// ...
```

- CSRF 보호는 Stateless한 JWT 인증 방식에서는 일반적으로 비활성화합니다.
- `formLogin(AbstractHttpConfigurer::disable)`: Spring Security가 제공하는 기본 로그인 폼을 사용하지 않도록 설정합니다.
- 로그아웃 시에는 `/api/members/logout` 경로를 사용하고, 성공하면 HTTP 204 (No Content)를 반환하며 `refreshToken` 쿠키를 삭제합니다.

## 사용자 정보 처리 (`MyOAuth2MemberService.java`)

OAuth 제공자로부터 사용자 정보를 받아와 우리 서비스의 사용자로 처리(조회 또는 신규 등록)하는 역할을 합니다. `DefaultOAuth2UserService`를 상속받아 `loadUser` 메소드를 오버라이드합니다.

```java
// MyOAuth2MemberService.java
@Override
public OAuth2User loadUser(OAuth2UserRequest memberRequest) {
    // 1. Spring Security의 기본 로직을 통해 OAuth 제공자로부터 사용자 정보 로드
    OAuth2User oAuth2User = super.loadUser(memberRequest);

    // 2. 어떤 OAuth 제공자인지 식별 (e.g., "google", "kakao")
    String provider = memberRequest.getClientRegistration().getRegistrationId();

    // 3. 제공자별로 상이한 사용자 정보 형식을 표준화된 방식으로 파싱
    // OAuth2UserInfoFactory는 직접 구현해야 하는 유틸리티 클래스
    OAuth2UserInfo oAuth2UserInfo = OAuth2UserInfoFactory.getOAuth2UserInfo(provider, oAuth2User.getAttributes());
    String email = oAuth2UserInfo.getEmail(); // 표준화된 이메일 정보 가져오기

    Member member;
    try {
        // 4. 추출된 이메일을 사용하여 우리 서비스 DB에서 기존 회원 조회
        member = memberReadService.fetchMemberByEmail(email);
        log.info("기존 OAuth2 회원 로그인: {}", email);
        // TODO: 기존 회원이지만 다른 provider로 가입한 경우, provider 정보 업데이트 등의 로직 추가 가능
    } catch (MemberNotFoundException e) {
        // 5. DB에 해당 이메일의 회원이 없으면, 신규 회원으로 가입 처리
        MemberRegisterOAuth2Request request = makeRequest(email, oAuth2UserInfo);
        member = memberWriteService.registerOAuth2Member(request);
        log.info("신규 OAuth2 회원 가입: {}", email);
    }

    // 6. 우리 서비스의 Member 엔티티와 OAuth 속성을 담은 MyMemberDetails 객체 반환
    // MyMemberDetails는 Spring Security의 Principal로 사용됨
    return new MyMemberDetails(member, oAuth2User.getAttributes());
}
```

- `super.loadUser(memberRequest)`: 부모 클래스의 메서드를 호출하여 OAuth 제공자로부터 기본적인 사용자 정보를 가져옵니다.
- `OAuth2UserInfoFactory`: Google, Kakao 등 다양한 제공자가 반환하는 사용자 정보의 구조가 다르므로, 이를 공통 인터페이스(`OAuth2UserInfo`)로 추상화하여 일관된 방식으로 이메일, 프로필 URL 등을 추출하는 유틸리티입니다. (이 클래스는 별도 구현 필요)
- 이메일을 기준으로 `MemberReadService`를 통해 우리 DB에서 사용자를 조회합니다.
- 사용자가 없으면(`MemberNotFoundException`), `makeRequest` 헬퍼 메소드를 통해 회원 가입에 필요한 DTO(`MemberRegisterOAuth2Request`)를 생성하고 `MemberWriteService`로 신규 회원을 등록합니다.
- `MyMemberDetails`는 `org.springframework.security.core.userdetails.UserDetails`와 `org.springframework.security.oauth2.core.user.OAuth2User`를 모두 구현한 커스텀 클래스로, Spring Security가 인증된 사용자 정보를 관리하는 데 사용됩니다.

신규 OAuth2 사용자를 위한 요청 DTO 생성 로직은 다음과 같습니다.

```java
// MyOAuth2MemberService.java
private MemberRegisterOAuth2Request makeRequest(String email, OAuth2UserInfo oAuth2UserInfo) {
    String profileUrl = oAuth2UserInfo.getProfileImageUrl();
    String dob = oAuth2UserInfo.getDob(); // 생년월일 (제공자가 지원하는 경우)
    // 소셜 로그인의 경우, 실제 비밀번호를 사용하지 않으므로 임의의 값을 암호화하여 저장
    String hashedPwd = bCryptPasswordEncoder.encode("Social Login Provider Password");
    return new MemberRegisterOAuth2Request(email, hashedPwd, profileUrl, dob);
}
```

- 소셜 로그인 사용자는 우리 서비스의 비밀번호를 직접 설정하지 않으므로, `bCryptPasswordEncoder`를 사용하여 임의의 문자열("Social Login Provider Password")을 암호화하여 저장합니다. 이는 Member 엔티티의 password 필드가 non-null 제약조건을 가질 경우 등을 대비한 조치입니다.

## 인증 성공 후 처리 및 프론트엔드 리디렉션 (`OAuth2AuthenticationSuccessHandler.java`)

OAuth2 인증이 성공적으로 완료되면, 이 핸들러가 실행되어 프론트엔드로 특정 정보를 포함하여 리디렉션합니다. `SimpleUrlAuthenticationSuccessHandler`를 상속합니다.

```java
// OAuth2AuthenticationSuccessHandler.java
@Override
public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                    Authentication authentication) throws IOException {

    // 1. 인증된 사용자 정보 (MyMemberDetails) 가져오기
    MyMemberDetails oAuth2User = (MyMemberDetails) authentication.getPrincipal();
    String email = oAuth2User.getMember().getEmail(); // 사용자의 이메일 추출

    // 2. 프론트엔드에 전달할 임시 코드(tempCode) 생성
    // 이 코드는 프론트엔드가 백엔드의 /token 엔드포인트 호출 시 사용하여 최종 JWT를 발급받음
    String tempCode = IdGenerator.generate(); // 유니크한 랜덤 문자열 생성 (IdGenerator는 자체 구현 유틸)
    authCodeStorage.saveCode(tempCode, email); // 생성된 임시 코드를 (예: Redis에) 사용자의 이메일과 매핑하여 저장 (짧은 만료 시간 설정 권장)
    log.info("OAuth2 인증 성공. 사용자: {}, 발급된 임시 코드: {}", email, tempCode);

    // Movlit의 원본 코드에서는 이 단계에서 응답 헤더에 AccessToken을 설정했으나,
    // 프론트엔드 포스트에서는 /oauth/callback에서 받은 code로 /token 엔드포인트를 호출하여
    // AccessToken과 RefreshToken을 모두 받는 흐름으로 설명되어 있습니다.
    // 여기서는 프론트엔드 포스트의 흐름을 따릅니다.
    // 만약 여기서 AccessToken을 바로 내려주고 싶다면 아래 주석 해제:
    // String accessToken = jwtTokenUtil.generateAccessToken(email);
    // response.setHeader("Authorization", "Bearer " + accessToken);


    // 3. 프론트엔드의 OAuth 콜백 URL로 리디렉션할 최종 URL 구성
    String targetUrl = UriComponentsBuilder.fromUriString(frontendBaseUrl + "/oauth/callback") // 프론트엔드 콜백 경로 (`frontendBaseUrl`은 @Value로 주입)
            .queryParam("code", tempCode) // 생성한 임시 코드를 "code"라는 쿼리 파라미터로 추가
            .build().toUriString();

    log.info("프론트엔드 리디렉션 URL: {}", targetUrl);
    // 4. 실제 리디렉션 수행
    getRedirectStrategy().sendRedirect(request, response, targetUrl);
}
```

- `authentication.getPrincipal()`: Spring Security 컨텍스트에서 인증된 사용자 정보(`MyMemberDetails` 객체)를 가져옵니다.
- `IdGenerator.generate()`: 프론트엔드에 전달할 일회성 임시 코드를 생성합니다. (이 `IdGenerator`는 직접 구현해야 합니다.)
- `authCodeStorage.saveCode(tempCode, email)`: 생성된 임시 코드를 해당 사용자의 이메일과 함께 `AuthCodeStorage`(예: Redis 같은 외부 저장소)에 저장합니다. 이 코드는 잠시 후 프론트엔드가 `/token` 엔드포인트를 호출할 때 검증용으로 사용됩니다. (보안을 위해 짧은 유효 시간을 설정하는 것이 좋습니다.)
- `UriComponentsBuilder`: 프론트엔드의 콜백 페이지 (`/oauth/callback`)로 리디렉션할 URL을 안전하게 구성합니다. 여기에 생성된 `tempCode`를 `code`라는 쿼리 파라미터로 추가합니다.
  - 결과 URL 예시: `http://localhost:3000/oauth/callback?code=a1b2c3d4e5f6`
- `getRedirectStrategy().sendRedirect()`: 사용자를 구성된 `targetUrl`로 리디렉션시킵니다.

## 토큰 발급 및 갱신 엔드포인트 (컨트롤러 - 예시)

프론트엔드의 `OAuthCallback.jsx` 및 `axiosInstance.js`에서 호출하는 `/token` 및 `/refresh` 엔드포인트는 별도의 컨트롤러에서 구현합니다.

### `/token` 엔드포인트: 임시 코드로 JWT 발급

프론트엔드의 `OAuthCallback.jsx`는 `OAuth2AuthenticationSuccessHandler`로부터 리디렉션될 때 받은 임시 코드를 사용하여 이 `/token` 엔드포인트를 호출합니다.

```java
// AuthController.java (예시)
@RestController
@RequiredArgsConstructor
public class AuthController {

    private final TokenService tokenService; // 토큰 관련 로직을 처리하는 서비스

    // 프론트엔드의 OAuthCallback.jsx에서 호출됨
    @PostMapping("/token")
    public ResponseEntity<TokenResponse> issueToken(@RequestBody TokenRequest tokenRequest, HttpServletResponse response) {
        // tokenRequest DTO에는 프론트엔드가 전달한 임시 code가 담겨있음
        String code = tokenRequest.getCode();

        // 1. TokenService를 호출하여 임시 code를 검증하고, AccessToken과 RefreshToken을 발급받음
        TokenResponse tokenResponseData = tokenService.issueTokensFromAuthCode(code);

        // 2. RefreshToken은 HttpOnly, Secure 속성의 쿠키로 설정하여 응답에 추가
        Cookie refreshTokenCookie = new Cookie("refreshToken", tokenResponseData.getRefreshToken());
        refreshTokenCookie.setHttpOnly(true); // JavaScript에서 접근 불가
        refreshTokenCookie.setSecure(true);   // HTTPS 환경에서만 전송 (배포 시 중요)
        refreshTokenCookie.setPath("/");      // 애플리케이션 전체 경로에서 사용 가능
        refreshTokenCookie.setMaxAge(14 * 24 * 60 * 60); // 예: 14일 유효기간 (초 단위)
        // 프론트엔드와 백엔드의 도메인이 다른 경우 SameSite=None 설정이 필요할 수 있음
        // refreshTokenCookie.setSameSite("None"); // 이 경우 Secure=true는 필수

        response.addCookie(refreshTokenCookie);

        // 3. AccessToken은 응답 본문(JSON)으로 전달
        // (RefreshToken은 쿠키로 전달했으므로, 응답 DTO에서는 null 또는 제외 가능)
        return ResponseEntity.ok(new TokenResponse(tokenResponseData.getAccessToken(), null));
    }
    // ...
}
```

- `@PostMapping("/token")`: `/token` 경로로 오는 POST 요청을 처리합니다.
- `@RequestBody TokenRequest tokenRequest`: 요청 본문에 포함된 JSON 데이터를 `TokenRequest` DTO 객체로 변환하여 받습니다. 이 DTO에는 프론트엔드가 전달한 임시 `code`가 들어있습니다.
- `tokenService.issueTokensFromAuthCode(code)`: `TokenService`에 임시 코드를 전달하여 실제 JWT `AccessToken`과 `RefreshToken`을 발급받습니다.
- `Cookie refreshTokenCookie = new Cookie(...)`: `RefreshToken`을 담을 쿠키를 생성합니다.
  - `setHttpOnly(true)`: JavaScript 코드로 쿠키에 접근하는 것을 막아 XSS(Cross-Site Scripting) 공격으로부터 `RefreshToken`을 보호합니다.
  - `setSecure(true)`: HTTPS를 통해서만 쿠키가 전송되도록 합니다. (개발 중 HTTP 환경에서는 이 설정을 `false`로 하거나 주석 처리해야 할 수 있습니다.)
  - `setPath("/")`: 쿠키가 애플리케이션의 모든 경로에서 유효하도록 설정합니다.
  - `setMaxAge(...)`: 쿠키의 유효 기간을 설정합니다. (예: 14일)
- `response.addCookie(refreshTokenCookie)`: 생성한 `RefreshToken` 쿠키를 HTTP 응답에 추가하여 클라이언트(브라우저)로 전달합니다.
- `ResponseEntity.ok(new TokenResponse(tokenResponseData.getAccessToken(), null))`: `AccessToken`은 JSON 응답 본문에 담아 전달합니다. `RefreshToken`은 이미 쿠키로 전달했으므로, 응답 DTO에서는 `null`로 설정하거나 필드를 제외할 수 있습니다.

### `/refresh` 엔드포인트: RefreshToken으로 AccessToken 갱신

프론트엔드의 `axiosInstance.js` 인터셉터는 `AccessToken` 만료로 인해 401 에러가 발생했을 때, 이 `/refresh` 엔드포인트를 호출하여 새 `AccessToken`을 발급받습니다.

```java
// AuthController.java (예시)
// ...
    // 프론트엔드의 axiosInstance.js 인터셉터에서 호출됨
    @PostMapping("/refresh")
    public ResponseEntity<TokenResponse> refreshToken(
            // @CookieValue 어노테이션을 사용하여 쿠키에서 직접 RefreshToken을 읽어올 수 있음
            // @CookieValue(value = "refreshToken", required = false) String refreshTokenFromCookie,
            // 또는 프론트엔드가 요청 본문에 refreshToken을 담아 보낸다면 @RequestBody 사용
            @RequestBody TokenRequest tokenRequest,
            HttpServletResponse httpServletResponse) {

        // 여기서는 요청 본문으로 받는 것으로 가정 (프론트엔드 구현에 따라 달라짐)
        // 또는 @CookieValue("refreshToken") String refreshToken 사용
        String refreshToken = tokenRequest.getRefreshToken();
        // if (refreshToken == null && refreshTokenFromCookie != null) {
        //    refreshToken = refreshTokenFromCookie;
        // }

        if (refreshToken == null) {
            // 적절한 예외 처리 또는 에러 응답
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(null);
        }

        // 1. TokenService를 호출하여 RefreshToken을 검증하고, 새 AccessToken을 발급받음
        TokenResponse tokenResponseData = tokenService.refreshAccessToken(refreshToken);

        // (선택적) Refresh Token Rotation: 새 RefreshToken도 발급하여 기존 쿠키를 갱신할 수 있음
        // if (tokenResponseData.getNewRefreshToken() != null) {
        //    Cookie newRefreshTokenCookie = new Cookie("refreshToken", tokenResponseData.getNewRefreshToken());
        //    // ... (새 쿠키 설정: HttpOnly, Secure, Path, MaxAge 등)
        //    httpServletResponse.addCookie(newRefreshTokenCookie);
        // }

        // 2. 새로 발급된 AccessToken을 응답 본문으로 전달
        return ResponseEntity.ok(new TokenResponse(tokenResponseData.getAccessToken(), null));
    }
}
```

- `@PostMapping("/refresh")`: `/refresh` 경로로 오는 POST 요청을 처리합니다.
- `RefreshToken`을 가져오는 방법:
  - `@CookieValue("refreshToken") String refreshToken`: 브라우저가 요청 시 자동으로 첨부하는 `refreshToken` 쿠키 값을 직접 읽어올 수 있습니다. (권장)
  - `@RequestBody TokenRequest tokenRequest`: 만약 프론트엔드가 `RefreshToken`을 요청 본문에 담아 보낸다면 이 방식을 사용합니다. (프론트엔드 포스트에서는 `localStorage`에서 `refreshToken`을 읽어와 보내는 예시가 있었으나, HttpOnly 쿠키로 관리하는 것이 더 안전합니다. 백엔드에서 HttpOnly 쿠키를 설정했다면, 프론트는 요청 본문에 `refreshToken`을 담을 필요 없이 브라우저가 자동으로 쿠키를 전송합니다.)
- `tokenService.refreshAccessToken(refreshToken)`: `TokenService`에 `RefreshToken`을 전달하여 유효성을 검증하고, 유효하다면 새 `AccessToken`을 발급받습니다.
- (선택) Refresh Token Rotation: 보안 강화를 위해 `AccessToken` 갱신 시 새로운 `RefreshToken`도 함께 발급하고, 기존 `RefreshToken`은 만료시키는 전략입니다. 이 경우, 새로운 `RefreshToken`도 이전과 동일하게 HttpOnly 쿠키로 설정하여 응답에 포함시켜야 합니다.
- 새로 발급된 `AccessToken`을 JSON 응답 본문에 담아 전달합니다.

## 토큰 처리 로직 (`TokenService.java` - 예시)

`TokenService`는 실제 토큰 발급, 검증, 갱신 로직을 담당합니다.

### 임시 코드로 JWT 발급 (`issueTokensFromAuthCode`)

```java
// TokenService.java (예시 - 실제 로직 필요)
@Service
@RequiredArgsConstructor
public class TokenService {

    private final AuthCodeStorage authCodeStorage; // 임시 코드 저장/조회 (예: Redis)
    private final JwtTokenUtil jwtTokenUtil;       // JWT 생성 및 검증 유틸리티
    // private final MemberReadService memberReadService; // 필요시 사용자 정보 조회

    public TokenResponse issueTokensFromAuthCode(String code) {
        // 1. AuthCodeStorage에서 전달받은 code로 저장된 사용자 이메일 조회
        //    이 과정에서 code의 유효성(존재 여부, 만료 시간 등)도 검증해야 함
        String email = authCodeStorage.getEmailByCode(code);
        if (email == null) {
            // 유효하지 않거나 만료된 코드일 경우 예외 발생
            throw new BadCredentialsException("유효하지 않거나 만료된 인증 코드입니다.");
        }
        // 2. 한 번 사용된 임시 코드는 보안을 위해 즉시 삭제
        authCodeStorage.deleteCode(code);

        // (선택적) email로 Member 객체를 다시 조회하여 추가 정보 활용 가능
        // Member member = memberReadService.fetchMemberByEmail(email);

        // 3. 해당 사용자를 위한 AccessToken 및 RefreshToken 생성
        String accessToken = jwtTokenUtil.generateAccessToken(email);  // 사용자 식별자(email) 기반으로 생성
        String refreshToken = jwtTokenUtil.generateRefreshToken(email); // 사용자 식별자(email) 기반으로 생성

        // TODO: 생성된 RefreshToken 자체를 (또는 해시된 값을) DB나 Redis에 저장하여,
        //       추후 /refresh 요청 시 해당 사용자의 유효한 RefreshToken인지 검증하는 데 사용 (탈취 대비).
        //       예: saveUserRefreshToken(email, refreshToken);

        return new TokenResponse(accessToken, refreshToken);
    }
    // ...
}
```

- `authCodeStorage.getEmailByCode(code)`: `OAuth2AuthenticationSuccessHandler`에서 저장했던 임시 코드를 사용하여 매핑된 사용자 이메일을 조회합니다. 이 과정에서 코드의 유효성(존재 여부, 만료 시간 등)을 함께 검증합니다.
- `authCodeStorage.deleteCode(code)`: 보안을 위해 한 번 사용된 임시 코드는 즉시 삭제합니다.
- `jwtTokenUtil.generateAccessToken(email)` / `jwtTokenUtil.generateRefreshToken(email)`: `JwtTokenUtil` (별도 구현된 JWT 처리 유틸리티)을 사용하여 사용자의 이메일(또는 다른 고유 식별자)을 기반으로 `AccessToken`과 `RefreshToken`을 생성합니다.
- 생성된 `RefreshToken`은 나중에 `/refresh` 요청 시 검증할 수 있도록 DB나 Redis 등에 저장하는 것이 좋습니다 (탈취된 `RefreshToken`을 무효화하기 위함).

### RefreshToken으로 AccessToken 갱신 (`refreshAccessToken`)

```java
// TokenService.java (예시 - 실제 로직 필요)
// ...
    public TokenResponse refreshAccessToken(String refreshTokenValue) {
        // 1. 전달받은 RefreshToken의 유효성 검증 (만료 여부, 서명 정확성 등)
        if (!jwtTokenUtil.validateToken(refreshTokenValue)) {
            // 유효하지 않은 토큰일 경우 예외 발생
            throw new BadCredentialsException("유효하지 않거나 만료된 Refresh Token입니다.");
        }

        // 2. RefreshToken에서 사용자 식별자(예: 이메일) 추출
        String email = jwtTokenUtil.getEmailFromToken(refreshTokenValue);

        // (보안 강화) DB 또는 Redis에 저장된 해당 사용자의 RefreshToken과 일치하는지,
        // 또는 탈취되어 블랙리스트에 등록된 토큰은 아닌지 등을 추가로 검증할 수 있음.
        // if (!isRefreshTokenValidInStorage(email, refreshTokenValue)) {
        //    throw new BadCredentialsException("서버에 등록되지 않았거나 만료된 Refresh Token입니다.");
        // }

        // 3. 새로운 AccessToken 생성
        String newAccessToken = jwtTokenUtil.generateAccessToken(email);

        // (선택적) Refresh Token Rotation 전략을 사용하는 경우:
        // 새로운 RefreshToken도 함께 발급하고, 기존 RefreshToken은 저장소에서 만료/삭제 처리.
        // String newRefreshToken = jwtTokenUtil.generateRefreshToken(email);
        // updateUserRefreshTokenInStorage(email, newRefreshToken, refreshTokenValue); // 기존 것 무효화, 새것 저장
        // return new TokenResponse(newAccessToken, newRefreshToken);

        // 여기서는 새 AccessToken만 반환하는 기본 경우
        return new TokenResponse(newAccessToken, null);
    }
}
```

- `jwtTokenUtil.validateToken(refreshTokenValue)`: 전달받은 `RefreshToken`의 기본적인 유효성(만료 시간, 서명 등)을 검사합니다.
- `jwtTokenUtil.getEmailFromToken(refreshTokenValue)`: 유효한 `RefreshToken`에서 사용자 이메일(또는 다른 식별자)을 추출합니다.
- (보안 강화) 추출된 이메일과 `RefreshToken` 값을 사용하여, DB나 Redis에 저장된 해당 사용자의 `RefreshToken`과 일치하는지, 혹은 탈취되어 사용이 금지된 토큰은 아닌지 등을 추가로 검증하는 로직을 구현할 수 있습니다.
- `jwtTokenUtil.generateAccessToken(email)`: 유효한 `RefreshToken`임이 확인되면, 해당 사용자를 위해 새로운 `AccessToken`을 발급합니다.
- Refresh Token Rotation을 적용한다면, 새로운 `RefreshToken`도 발급하고 이를 `TokenResponse`에 담아 반환하며, 이전 `RefreshToken`은 저장소에서 무효화합니다. 여기서는 새 `AccessToken`만 반환하는 것을 기본으로 합니다.

## 정리

백엔드에서는 Spring Security의 OAuth2 기능을 활용하여 외부 OAuth 제공자와의 인증 과정을 처리합니다.

1.  **`SecurityConfig`**: OAuth2 로그인 흐름을 정의하고, 커스텀 `OAuth2UserService`와 `AuthenticationSuccessHandler`를 등록합니다. CORS 설정도 중요합니다.
2.  **`MyOAuth2MemberService`**: OAuth 제공자로부터 받은 사용자 정보를 기반으로 우리 서비스의 회원 정보를 조회하거나 새로 생성합니다.
3.  **`OAuth2AuthenticationSuccessHandler`**: 인증 성공 후, 프론트엔드의 특정 콜백 (`/oauth/callback`)으로 리디렉션시키며, 이때 프론트엔드가 최종 토큰을 요청하는 데 사용할 **임시 코드**를 전달합니다.
4.  **`AuthController` (및 `TokenService`)**: 프론트엔드가 임시 코드를 보내 토큰을 요청하는 `/token` 엔드포인트와, `AccessToken` 만료 시 `RefreshToken`으로 새 토큰을 요청하는 `/refresh` 엔드포인트를 제공합니다. `RefreshToken`은 `HttpOnly` 쿠키로 관리하는 것이 보안상 좋습니다.
5.  **`JwtRequestFilter`**: 로그인 이후의 모든 API 요청에 대해 `AccessToken`을 검증합니다.

이러한 백엔드 구성은 프론트엔드에서 설명한 OAuth 2.0 로그인 및 토큰 관리 흐름과 긴밀하게 연동되어 동작합니다.
