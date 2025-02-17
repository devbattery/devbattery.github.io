---
title: "[Project] Spring Security로 구현한 인증/인가 로직"
excerpt: "movlit, auth"

categories:
  - Project
tags:
  - [movlit, auth]

toc: true
toc_sticky: true

sidebar:
  nav: "categories"

date: 2025-02-17
last_modified_at: 2025-02-17
---

> [Movlit 프로젝트](https://github.com/venus-lion/movlit-plus)에 대한 설명입니다.

---

# Spring Boot 3.4와 Spring Security로 구현한 로그인 시스템

이번 포스팅에서는 Spring Boot 3.4와 Spring Security를 기반으로 JWT 인증, OAuth2 소셜 로그인, 토큰 갱신 등 로그인 관련 기능을 어떻게 구현했는지 말씀드리겠습니다. 각 구성요소가 어떻게 서로 연동되어 보안 및 사용자 인증을 처리하는지 살펴보겠습니다.

---

## 1. JWT 기반 인증 필터

### JwtRequestFilter 개요

JWT 기반 인증 로직의 핵심은 클라이언트 요청 헤더에 포함된 토큰을 추출, 검증한 후 SecurityContext에 사용자 인증 정보를 설정하는 것입니다. 이를 위해 `OncePerRequestFilter`를 상속한 `JwtRequestFilter`를 구현했습니다.

- **토큰 추출 및 검증**  
  `extractJwtFromHeader` 메서드를 통해 HTTP 요청의 Authorization 헤더에서 Bearer 토큰을 추출합니다. 추출한 토큰은 `JwtTokenUtil`을 통해 이메일 정보를 파싱하고, 유효성 검증 과정을 거칩니다.

- **SecurityContext 설정**  
  토큰이 유효하면, `MyMemberDetailsService`를 이용해 사용자 정보를 로드하고, `UsernamePasswordAuthenticationToken`을 생성하여 Spring Security의 `SecurityContextHolder`에 인증 객체를 설정합니다. 이를 통해 이후 요청에서 인증된 사용자 정보를 활용할 수 있습니다.

```java
@Override
protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
        throws ServletException, IOException {
    Optional<String> jwtOptional = extractJwtFromHeader(request);

    if (jwtOptional.isPresent()) {
        String jwt = jwtOptional.get();
        Optional<String> emailOptional = extractEmail(jwt, response);

        if (emailOptional.isEmpty()) {
            return;
        }

        String email = emailOptional.get();

        if (SecurityContextHolder.getContext().getAuthentication() == null) {
            UserDetails userDetails = myMemberDetailsService.loadUserByUsername(email);
            if (!authenticateUser(userDetails, jwt, request, response)) {
                return;
            }
        }
    }

    chain.doFilter(request, response);
}
```

이처럼 필터 내부에서 JWT를 검증하여 사용자 인증 정보를 설정하는 방식은 API 요청의 보안을 강화하는 핵심 역할을 합니다.

---

## 2. OAuth2 소셜 로그인 통합

### 소셜 로그인 처리 흐름

OAuth2 로그인 기능을 통해 구글, 카카오, 네이버 등 다양한 소셜 로그인 제공자를 지원합니다. 각 제공자마다 사용자 정보 구조가 다르기 때문에, 인터페이스(`OAuth2UserInfo`)와 이를 구현한 클래스(`GoogleOAuth2UserInfo`, `KakaoOAuth2UserInfo`, `NaverOAuth2UserInfo`)를 정의하여 일관된 방식으로 사용자 정보를 추출합니다.

- **OAuth2UserInfo 인터페이스**  
  이메일, 프로필 이미지 URL, 생년월일 등 필요한 속성을 추출하는 메서드를 정의합니다.

- **OAuth2AuthenticationSuccessHandler**  
  소셜 로그인 성공 시, 사용자 이메일을 기반으로 인증 코드를 생성하고 이를 저장한 후, 프론트엔드 URL로 리다이렉트합니다. 이 과정에서 JWT Access Token도 헤더에 설정하여 클라이언트가 이후 요청에 활용할 수 있도록 합니다.

```java
@Override
public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                    Authentication authentication) throws IOException {

    MyMemberDetails oAuth2User = (MyMemberDetails) authentication.getPrincipal();
    String email = oAuth2User.getMember().getEmail();

    String code = IdGenerator.generate();
    authCodeStorage.saveCode(code, email);

    String accessToken = jwtTokenUtil.generateAccessToken(email);
    response.setHeader("Authorization", "Bearer " + accessToken);

    String targetUrl = UriComponentsBuilder.fromUriString(url + "/oauth/callback")
            .queryParam("code", code)
            .build().toUriString();

    getRedirectStrategy().sendRedirect(request, response, targetUrl);
}
```

### MyOAuth2MemberService 역할

소셜 로그인 시 전달받은 사용자 정보를 기반으로 기존 회원 여부를 확인합니다. 회원이 존재하지 않으면 신규 등록 로직(`registerOAuth2Member`)을 호출해 데이터베이스에 저장합니다. 이를 통해 소셜 로그인과 기존 회원 관리 로직을 통합적으로 관리할 수 있습니다.

---

## 3. 인증 및 토큰 발행 서비스

### AuthenticationController와 서비스 계층

로그인 관련 엔드포인트는 크게 세 가지로 나뉩니다.

- **/authenticate**  
  전통적인 이메일/비밀번호 로그인으로, `AuthenticationRequest`를 받아 `AuthenticationService`의 `authenticate` 메서드를 호출합니다. 이 과정에서 Spring Security의 `AuthenticationManager`를 활용하여 자격 증명을 검증합니다.

- **/api/refresh**  
  기존 리프레시 토큰을 사용해 새로운 Access Token을 발급받습니다. 토큰 유효성 검증 후 새 토큰을 생성하는 로직이 포함되어 있습니다.

- **/api/token**  
  OAuth2 로그인 후 프론트엔드와 백엔드 간의 토큰 교환을 위해, 미리 저장된 인증 코드를 기반으로 Access Token과 Refresh Token을 발급합니다.

```java
@PostMapping("/authenticate")
public ResponseEntity<?> createAuthenticationToken(@RequestBody AuthenticationRequest request)
        throws Exception {
    return ResponseEntity.ok(authenticationService.authenticate(request));
}
```

### 토큰 관리 및 블랙리스트 처리

`AuthTokenService`와 `ConcurrentRefreshTokenStorage`를 통해 JWT 토큰을 발급하고, 리프레시 토큰을 저장합니다. 또한 토큰이 만료되거나 취소된 경우 블랙리스트에 추가하여 재사용을 방지하는 로직을 구현했습니다.

```java
public void revoke(String accessToken) {
    long exp = jwtTokenUtil.extractExpirationAsLong(accessToken);
    refreshTokenStorage.addBlacklist(accessToken, exp);
}
```

이와 같이 토큰의 안전성을 강화하는 동시에, 간단한 ConcurrentHashMap을 활용한 스토리지 구현으로 동시성 이슈를 해결할 수 있었습니다.

---

## 4. 보안 구성 및 CORS 설정

### SecurityConfig에서의 설정

Spring Security의 전반적인 보안 설정은 `SecurityConfig` 클래스에서 이루어집니다. 주요 설정 포인트는 다음과 같습니다.

- **필터 체인 구성**  
  `jwtRequestFilter`를 `UsernamePasswordAuthenticationFilter` 이전에 등록하여, 모든 요청에 대해 JWT 토큰 검증이 먼저 이루어지도록 합니다.

- **엔드포인트 권한 설정**  
  다양한 HTTP 메서드와 URL 패턴에 대해 접근 권한을 세밀하게 설정하였습니다. 이를 통해 공개 API와 인증이 필요한 API를 명확히 구분할 수 있습니다.

- **CORS 설정**  
  `CorsConfigurationSource`를 등록하여, 프론트엔드 도메인에서의 요청을 허용함과 동시에 필요한 HTTP 메서드와 헤더를 지정합니다.

```java
@Bean
public SecurityFilterChain securityFilterChain(HttpSecurity http, CorsConfigurationSource corsConfigurationSource)
        throws Exception {
    http
            .cors(Customizer.withDefaults())
            .csrf(AbstractHttpConfigurer::disable)
            .headers(x -> x.frameOptions(FrameOptionsConfig::disable))
            .authorizeHttpRequests(requests -> requests
                    .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                    // 기타 공개 엔드포인트 설정
                    .anyRequest().authenticated()
            )
            .oauth2Login(auth -> auth
                    .userInfoEndpoint(userInfoEndpointConfig -> userInfoEndpointConfig.userService(myOAuth2MemberService))
                    .successHandler(oAuth2AuthenticationSuccessHandler)
            )
            .addFilterBefore(jwtRequestFilter, UsernamePasswordAuthenticationFilter.class);

    return http.build();
}
```

이와 같이 체계적인 보안 설정을 통해 다양한 로그인 방식과 API 보호를 동시에 달성할 수 있습니다.

---

## 5. 결론

- **JWT 필터**는 클라이언트 요청의 인증 정보를 검증하고 SecurityContext에 설정하여, API 보안을 강화합니다.  
- **OAuth2 로그인** 통합은 다양한 소셜 로그인 제공자와의 연동을 손쉽게 처리하며, 사용자 정보의 일관성을 유지합니다.  
- **토큰 관리**는 Access Token과 Refresh Token을 효과적으로 발급 및 관리하며, 블랙리스트를 통한 보안 강화도 이뤄집니다.  
- **보안 구성**은 세밀한 엔드포인트 권한 설정과 CORS 구성을 통해 안정적인 애플리케이션 환경을 제공합니다.

이와 같은 접근 방식은 확장 가능하고 유지보수하기 좋은 보안 구조를 구현하는 데 큰 도움이 됩니다.
