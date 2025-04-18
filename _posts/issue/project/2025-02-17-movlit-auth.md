---
title: "[Project] Spring Boot와 Spring Security로 JWT 기반 로그인 구현하기"
excerpt: "movlit, auth, jwt, spring"

categories:
  - Project
tags:
  - [movlit, auth, jwt, spring]

toc: true
toc_sticky: true

sidebar:
  nav: "categories"

date: 2025-02-17
last_modified_at: 2025-04-18
---

> [Movlit 프로젝트](https://github.com/venus-lion/movlit-plus)의 JWT 인증 구현에 대한 핵심 컴포넌트 분석입니다. 각 부분의 역할과 주요 코드 로직을 중심으로 설명합니다.

Stateless한 API 환경에서 사용자를 안전하고 효율적으로 인증하기 위해 주로 JWT(JSON Web Token)를 사용합니다.

## JWT 기반 인증 흐름

1.  **JWT Access Token**: 로그인 성공 시 발급되는 **상태 비저장** 인증 토큰입니다. 클라이언트는 매 요청마다 이 토큰을 헤더에 담아 보내고, 서버는 토큰 자체만으로 사용자를 검증합니다. DB 조회가 줄어드는 장점이 있습니다.
    - `Authorization: Bearer <access_token>`
2.  **JWT Refresh Token**: Access Token은 보안을 위해 유효 기간이 짧습니다 (e.g., 30분). 사용자가 계속 다시 로그인하는 불편함을 줄이기 위해, 유효 기간이 긴 (e.g., 7일) **Refresh Token**을 함께 발급합니다.
3.  **토큰 갱신**: Access Token이 만료되면, 클라이언트는 Refresh Token을 사용하여 서버에 새 Access Token 발급을 요청합니다. 이때 **Refresh Token 자체는 서버에 안전하게 저장된 값과 비교**하여 검증합니다.
4.  **OAuth2 연동**: 소셜 로그인(Google, Kakao 등) 성공 시에도 최종적으로 우리 시스템의 Access/Refresh Token을 발급하여, 내부 API 인증 방식을 통일합니다.
5.  **토큰 무효화 (Blacklist)**: 사용자가 로그아웃하면, 아직 만료되지 않은 Access Token을 즉시 사용 불가능하게 만들어야 합니다. 이를 위해 **블랙리스트** 개념을 도입합니다.

## JwtRequestFilter

### 역할

Spring Security 필터 체인의 가장 앞단에서, 들어오는 모든 요청의 `Authorization` 헤더를 검사하여 유효한 JWT Access Token이 있는지 확인하고, 있다면 사용자를 인증 상태로 설정합니다.

### 핵심 로직

1.  **헤더에서 토큰 추출**: `Authorization: Bearer <token>` 형식에서 실제 토큰 문자열만 분리합니다.

    ```java
    // JwtRequestFilter.java
    private Optional<String> extractJwtFromHeader(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            return Optional.of(authHeader.substring(7));
        }
        return Optional.empty();
    }
    ```

2.  **블랙리스트 확인**: 추출된 토큰이 로그아웃 등으로 인해 무효화된 토큰인지 확인합니다.

    ```java
    // JwtRequestFilter.java - doFilterInternal 내
    if (refreshTokenStorage.isBlacklist(jwt)) {
        setUnauthorizedResponse(response, "Invalid Token (Blacklisted)");
        return; // 요청 처리 중단
    }
    ```

3.  **토큰 유효성 검증 및 사용자 식별**: 토큰의 서명, 만료 시간 등을 검증하고, 토큰에 담긴 사용자 식별자(여기서는 이메일)를 추출합니다. 문제가 있으면 401 응답을 보냅니다.

    ```java
    // JwtRequestFilter.java - extractEmail + authenticateUser 내 핵심 로직
    try {
        String email = jwtTokenUtil.extractEmail(jwt); // 만료/형식 오류 시 예외 발생
        if (jwtTokenUtil.validateToken(jwt, email)) { // 서명, 대상 등 최종 확인
            // 유효하면 다음 단계 진행
        } else {
            setUnauthorizedResponse(response, "Token Validation Failed");
            return false; // 또는 즉시 return
        }
    } catch (ExpiredJwtException e) {
        setUnauthorizedResponse(response, "Token Expired");
        return false; // 또는 즉시 return
    } catch (Exception e) { // 기타 JWT 오류
        setUnauthorizedResponse(response, "Invalid Token Format/Signature");
        return false; // 또는 즉시 return
    }
    ```

4.  **Spring Security Context에 인증 정보 등록**: 유효한 토큰이라면, 해당 사용자의 정보를 기반으로 `Authentication` 객체를 생성하고 `SecurityContextHolder`에 설정합니다. 이 요청은 이제 '인증된 사용자'의 요청으로 처리됩니다.

    ```java
    // JwtRequestFilter.java - authenticateUser 내
    UserDetails userDetails = myMemberDetailsService.loadUserByUsername(email);
    UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
            userDetails, null, userDetails.getAuthorities());
    authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
    SecurityContextHolder.getContext().setAuthentication(authentication);
    ```

**중요**: 이 필터는 `OncePerRequestFilter`를 상속하여 요청당 단 한 번만 실행되며, `SecurityConfig`에서 다른 필터들보다 앞에 위치시켜 가장 먼저 JWT를 검사하도록 설정해야 합니다.

## AuthenticationService

### 역할 

실제 JWT 토큰을 생성(발급), 갱신(재발급), 무효화(로그아웃)하는 비즈니스 로직을 담당합니다.

### 핵심 기능

1.  **최초 토큰 발급 (로그인 시)**: ID/PW 또는 OAuth2 인증 성공 후 호출됩니다. Access Token과 Refresh Token을 생성하고, **Refresh Token은 반드시 서버 측 저장소(`RefreshTokenStorage`)에 저장**합니다.

    ```java
    // AuthenticationService.java - authenticate / exchangeToken 내
    String email = /* 인증된 사용자의 이메일 */;
    String accessToken = jwtTokenUtil.generateAccessToken(email);
    String refreshToken = jwtTokenUtil.generateRefreshToken(email);

    // Refresh Token 저장 (이게 중요!)
    refreshTokenStorage.saveRefreshToken(email, refreshToken);

    return new AuthenticationResponse(accessToken, refreshToken); // 클라이언트에 두 토큰 전달
    ```

2.  **Access Token 갱신**: 클라이언트가 만료된 Access Token 대신 Refresh Token을 보내왔을 때 호출됩니다.

    - 제공된 Refresh Token의 기본 유효성(형식, 만료, 서명)을 검사합니다.
    - **가장 중요**: `RefreshTokenStorage`에 저장된 해당 사용자의 Refresh Token과 **일치하는지 반드시 확인**합니다. 탈취된 Refresh Token 사용을 막는 핵심 방어 로직입니다.
    - 모든 검증 통과 시, **새로운 Access Token만** 발급하여 반환합니다. (Refresh Token은 그대로 두거나, 보안 강화를 위해 Rotation 시킬 수도 있습니다.)

    ```java
    // AuthenticationService.java - refreshToken 내
    String providedRefreshToken = /* 클라이언트가 보낸 리프레시 토큰 */;
    String email = jwtTokenUtil.extractEmail(providedRefreshToken); // 기본 검증 포함

    // 저장된 토큰과 비교 (매우 중요!)
    String storedRefreshToken = refreshTokenStorage.findByToken(email);
    if (storedRefreshToken == null || !storedRefreshToken.equals(providedRefreshToken)) {
        // 저장소에 없거나, 받은 토큰과 일치하지 않으면 거부
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Invalid or expired refresh token (mismatch)"));
    }

    // 최종 유효성 확인 (만료/서명 등)
    if (!jwtTokenUtil.validateToken(providedRefreshToken, email)) {
         return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Refresh token validation failed"));
    }

    // 새 Access Token 발급
    String newAccessToken = jwtTokenUtil.generateAccessToken(email);
    return ResponseEntity.ok(new AuthenticationResponse(newAccessToken, providedRefreshToken));
    ```

3.  **로그아웃 (토큰 무효화)**: 사용자가 로그아웃을 요청했을 때 호출됩니다.

    - `RefreshTokenStorage`에서 해당 사용자의 **Refresh Token을 삭제**하여 더 이상 토큰 갱신을 불가능하게 만듭니다.
    - 요청 헤더에서 현재 사용 중인 **Access Token을 추출하여 블랙리스트에 등록**합니다. `JwtRequestFilter`는 이후 이 토큰을 거부하게 됩니다.

    ```java
    // AuthenticationService.java - logout 내
    String email = /* 로그아웃 요청 사용자 이메일 */;
    String authHeader = request.getHeader("Authorization");

    // 1. Refresh Token 삭제
    refreshTokenStorage.deleteByToken(email);

    // 2. Access Token 블랙리스트 추가
    if (authHeader != null && authHeader.startsWith("Bearer ")) {
        String token = authHeader.substring(7);
        try {
            long expirationTime = jwtTokenUtil.extractExpiration(token).getTime();
            refreshTokenStorage.addBlacklist(token, expirationTime); // 만료 시간까지 블랙리스트에 보관
        } catch (Exception e) { /* 예외 처리 */ }
    }

    SecurityContextHolder.clearContext(); // Security Context 정리
    ```

## RefreshTokenStorage

### 역할

생성된 Refresh Token을 사용자별로 저장하고, 로그아웃된 Access Token을 블랙리스트로 관리합니다.  
이 프로젝트에는 인메모리 방식으로 저장하였지만, Redis와 같은 외부 저장소를 사용하여 보완할 예정입니다.

### 핵심 기능

- **Refresh Token 저장/조회/삭제**: 사용자의 이메일과 Refresh Token 문자열을 매핑하여 관리합니다.

  ```java
  // ConcurrentRefreshTokenStorage.java (In-Memory 예시)
  // (email -> refreshToken)
  private final ConcurrentHashMap<String, String> refreshTokens = new ConcurrentHashMap<>();

  public void saveRefreshToken(String email, String refreshToken) { refreshTokens.put(email, refreshToken); }
  public String findByToken(String email) { return refreshTokens.get(email); }
  public void deleteByToken(String email) { refreshTokens.remove(email); }
  ```

- **Blacklist 추가/확인**: 로그아웃된 Access Token을 그 만료 시간과 함께 저장합니다. `isBlacklist`는 토큰이 블랙리스트에 있고 아직 만료 시간이 지나지 않았는지 확인합니다.

  ```java
  // ConcurrentRefreshTokenStorage.java (In-Memory 예시)
  // (accessToken -> expirationTimeMillis)
  private final ConcurrentHashMap<String, Long> blacklist = new ConcurrentHashMap<>();

  public void addBlacklist(String token, long expirationTimeMillis) {
      if (token != null && expirationTimeMillis > System.currentTimeMillis()) {
         blacklist.put(token, expirationTimeMillis);
      }
  }

  public boolean isBlacklist(String token) {
      if (token == null) return false;
      Long expirationTime = blacklist.get(token);
      // 블랙리스트에 있고, 아직 만료 전인가?
      return expirationTime != null && expirationTime > System.currentTimeMillis();
  }

  // 주기적으로 만료된 블랙리스트 항목 정리 필요 (In-Memory 경우)
  // Redis 사용 시 TTL 기능으로 자동 처리 가능
  ```


## OAuth2 연동

### 목적

외부 OAuth2 공급자(Google, Kakao 등)를 통한 로그인 성공 후, 자체 JWT Access/Refresh Token을 안전하게 발급받도록 연결합니다.

### 흐름

직접 JWT를 발급하는 대신, **임시 Code 교환 방식**을 사용합니다.

1.  **`OAuth2AuthenticationSuccessHandler`**: Spring Security가 OAuth2 로그인을 성공적으로 처리한 직후 호출됩니다.

    - 인증된 사용자 정보(이메일)를 가져옵니다.
    - **일회용 임시 `code`를 생성**하고, 이 `code`와 사용자 이메일을 짧은 만료 시간(e.g., 5분)과 함께 `AuthCodeStorage`(Redis 등 사용 권장)에 저장합니다.
    - 프론트엔드의 특정 콜백 URL로 리다이렉트하면서, 이 `code`를 쿼리 파라미터로 전달합니다.

    ```java
    // OAuth2AuthenticationSuccessHandler.java - onAuthenticationSuccess 내
    String email = extractEmailFromPrincipal(authentication.getPrincipal());
    String code = IdGenerator.generate(); // 임시 코드 생성 (UUID 등)

    // 임시 코드 저장 (Redis 등에 저장하는 것이 좋음)
    authCodeStorage.saveCode(code, email, 5 * 60 * 1000); // 5분 유효

    // 프론트엔드 콜백 URI로 리다이렉트 (code 포함)
    String targetUrl = UriComponentsBuilder.fromUriString(frontendRedirectUri)
            .queryParam("code", code)
            .build().toUriString();
    getRedirectStrategy().sendRedirect(request, response, targetUrl);
    ```

2.  **프론트엔드**: 리다이렉트된 페이지에서 URL의 `code`를 추출합니다.
3.  **토큰 교환 요청**: 프론트엔드는 추출한 `code`를 백엔드의 토큰 교환 엔드포인트 (e.g., `/api/auth/token/exchange`)로 전송합니다.
4.  **백엔드 (`AuthenticationService.exchangeToken`)**:
    - 받은 `code`를 `AuthCodeStorage`에서 검증하고, 해당 이메일을 찾습니다.
    - 유효한 `code`이면, 위에서 설명한 `AuthenticationService`의 토큰 발급 로직을 통해 **최종 Access/Refresh Token을 생성**하고, Refresh Token을 저장한 뒤, 두 토큰을 프론트엔드에 응답합니다.
    - 사용한 `code`는 `AuthCodeStorage`에서 제거합니다 (일회용).

**이점**: 이 중간 `code` 단계는 Refresh Token과 같은 민감한 정보를 URL에 노출시키지 않고, 토큰 발급 로직을 `AuthenticationService`로 일원화하여 관리를 용이하게 합니다.

---

## SecurityConfig: 모든 것을 연결하는 설정

**역할**: Spring Security의 전반적인 설정을 담당하며, 위에서 만든 컴포넌트들을 Spring Security 필터 체인에 통합하고 보안 규칙을 정의합니다.

**JWT 관련 핵심 설정**:

- **Stateless 설정**: 서버가 세션을 사용하지 않도록 하여 JWT의 Stateless 특성과 일치시킵니다.

  ```java
  // SecurityConfig.java - securityFilterChain 내
  .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
  ```

- **CSRF 비활성화**: Stateless API에서는 일반적으로 CSRF 보호가 불필요합니다.

  ```java
  // SecurityConfig.java - securityFilterChain 내
  .csrf(AbstractHttpConfigurer::disable)
  ```

- **`JwtRequestFilter` 통합 (매우 중요)**: 우리가 만든 `JwtRequestFilter`를 ID/Password 인증 필터(`UsernamePasswordAuthenticationFilter`) **앞에** 위치시켜, 모든 요청에 대해 JWT 검증이 먼저 이루어지도록 합니다.

  ```java
  // SecurityConfig.java - securityFilterChain 내
  // !!! JwtRequestFilter 추가 (UsernamePasswordAuthenticationFilter 앞에) !!!
  .addFilterBefore(jwtRequestFilter, UsernamePasswordAuthenticationFilter.class)
  ```

- **경로별 접근 권한 설정**: 인증이 필요한 경로와 필요 없는 경로(로그인/회원가입 API, 토큰 갱신 API 등)를 명시합니다.

  ```java
  // SecurityConfig.java - securityFilterChain 내
  .authorizeHttpRequests(auth -> auth
      .requestMatchers("/api/auth/**", "/oauth2/**", "/api/token/refresh").permitAll() // 인증 불필요
      .anyRequest().authenticated() // 나머지는 인증 필요
  )
  ```

- **OAuth2 로그인 설정 연동**: OAuth2 로그인 성공 시 위에서 만든 `OAuth2AuthenticationSuccessHandler`가 동작하도록 연결합니다.

  ```java
  // SecurityConfig.java - securityFilterChain 내
  .oauth2Login(oauth -> oauth
      // .userInfoEndpoint(...) // 사용자 정보 로드 설정
      .successHandler(oAuth2AuthenticationSuccessHandler) // 성공 핸들러 지정
  )
  ```

- **로그아웃 처리 연동**: 로그아웃 요청 시 `AuthenticationService.logout` 로직(Refresh Token 삭제, Access Token 블랙리스트)이 실행되도록 `LogoutHandler`를 추가합니다.

  ```java
  // SecurityConfig.java - securityFilterChain 내
  .logout(logout -> logout
      .logoutUrl("/api/auth/logout")
      .addLogoutHandler((request, response, authentication) -> {
          // AuthenticationService.logout() 호출 로직
      })
      .logoutSuccessHandler(/* 성공 응답 처리 */)
  )
  ```

---

## JWT 사이클 정리

1.  **발급 (Issue)**: 로그인 성공(`AuthenticationService`) -> Access/Refresh Token 생성 -> Refresh Token 저장(`RefreshTokenStorage`).
2.  **사용 (Use)**: 클라이언트 요청 -> `Authorization` 헤더에 Access Token 포함.
3.  **검증 (Validate)**: `JwtRequestFilter` -> 토큰 추출 -> Blacklist 확인(`RefreshTokenStorage`) -> 서명/만료 검증 -> `SecurityContext` 설정.
4.  **갱신 (Refresh)**: Access Token 만료 -> 클라이언트가 Refresh Token 전송 -> `AuthenticationService` -> 저장된 Refresh Token과 비교 검증(`RefreshTokenStorage`) -> 새 Access Token 발급.
5.  **무효화 (Invalidate)**: 로그아웃 요청 -> `AuthenticationService` -> Refresh Token 삭제(`RefreshTokenStorage`) -> Access Token 블랙리스트 등록(`RefreshTokenStorage`).

