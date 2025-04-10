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
last_modified_at: 2025-04-10
---

> [Movlit 프로젝트](https://github.com/venus-lion/movlit-plus)의 JWT 인증 구현에 대한 기술적 분석입니다.

## 개요: JWT 기반 인증 흐름

이 글에서는 Spring Boot와 Spring Security를 사용하여 구현한 JWT(JSON Web Token) 기반 인증 시스템의 핵심 기술 요소들을 살펴봅니다.

1.  **JWT Access Token**: 사용자가 성공적으로 인증(ID/PW 또는 OAuth2)하면, 서버는 상태 비저장(Stateless) 인증 증표인 **JWT Access Token**을 발급합니다. 클라이언트는 이후 API 요청 시 이 토큰을 `Authorization: Bearer <token>` 헤더에 담아 전송해야 합니다.
2.  **JWT Refresh Token**: Access Token은 탈취 위험을 줄이기 위해 유효 기간이 짧습니다. 사용자 편의를 위해, 유효 기간이 더 긴 **Refresh Token**을 함께 발급합니다. Access Token 만료 시, 클라이언트는 이 Refresh Token을 사용하여 새로운 Access Token을 재발급받습니다. Refresh Token 자체는 서버 측 저장소에서 관리됩니다.
3.  **OAuth2 연동 후 JWT 발급**: 외부 소셜 로그인(Google, Kakao 등) 성공 시, 최종적으로 우리 시스템에서 사용할 자체 JWT Access/Refresh Token을 발급하여 일관된 인증 방식을 유지합니다.
4.  **토큰 무효화 (Blacklist)**: 사용자가 로그아웃하면, 아직 유효 기간이 남은 Access Token이라도 즉시 사용 불가능하도록 **Blacklist**에 등록하여 보안을 강화합니다.

## JwtRequestFilter: 모든 요청의 JWT 검증 게이트웨이

`JwtRequestFilter`는 Spring Security 필터 체인의 가장 앞단에서 모든 들어오는 요청을 가로채 JWT Access Token의 유효성을 검증하는 핵심 컴포넌트입니다. `OncePerRequestFilter`를 상속하여 요청당 단 한 번만 실행됩니다.

**주요 동작:**

1.  **토큰 추출**: `Authorization: Bearer <token>` 헤더에서 JWT 문자열을 추출합니다.
2.  **블랙리스트 확인**: 추출된 토큰이 로그아웃 등으로 인해 블랙리스트에 등록되었는지 확인합니다. (`refreshTokenStorage.isBlacklist(jwt)`)
3.  **토큰 파싱 및 기본 검증**: 토큰의 형식이 올바른지, 만료되지 않았는지, 서명이 유효한지 등을 확인하며 사용자 식별자(여기서는 이메일)를 추출합니다. (`jwtTokenUtil.extractEmail(jwt)`)
4.  **인증 객체 생성 및 등록**: 토큰이 유효하고 블랙리스트에 없다면, 토큰 정보 기반으로 `UserDetails`를 조회하고 `UsernamePasswordAuthenticationToken`을 생성하여 `SecurityContextHolder`에 등록합니다. 이 시점부터 해당 요청은 인증된 사용자의 요청으로 간주됩니다.
5.  **예외 처리**: 토큰이 없거나, 블랙리스트에 있거나, 만료/형식 오류/서명 불일치 등으로 유효하지 않으면, **401 Unauthorized** 응답을 즉시 반환하고 필터 체인 진행을 중단합니다.

```java
// package movlit.be.common.filter; // (패키지 생략)

@Component
@RequiredArgsConstructor
@Slf4j
public class JwtRequestFilter extends OncePerRequestFilter {

    private final JwtTokenUtil jwtTokenUtil;
    private final MyMemberDetailsService myMemberDetailsService;
    private final RefreshTokenStorage refreshTokenStorage; // Blacklist 포함

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {

        Optional<String> jwtOptional = extractJwtFromHeader(request);

        if (jwtOptional.isPresent()) {
            String jwt = jwtOptional.get();

            // 1. Blacklist 확인
            if (refreshTokenStorage.isBlacklist(jwt)) {
                setUnauthorizedResponse(response, "Invalid Token (Blacklisted)");
                return;
            }

            // 2. 토큰 파싱 및 기본 검증 (이메일 추출 시도)
            Optional<String> emailOptional = extractEmail(jwt, response);
            if (emailOptional.isEmpty()) return; // 오류 시 401 응답 처리됨

            String email = emailOptional.get();

            // 3. SecurityContext에 인증 정보 없으면 설정
            if (SecurityContextHolder.getContext().getAuthentication() == null) {
                UserDetails userDetails = myMemberDetailsService.loadUserByUsername(email);

                // 4. 토큰 최종 유효성 검증 및 SecurityContext 등록
                if (!authenticateUser(userDetails, jwt, request, response)) {
                    return; // 오류 시 401 응답 처리됨
                }
                log.info("Authenticated user via JWT: {}", email);
            }
        }

        chain.doFilter(request, response); // 다음 필터로 전달
    }

    // 헤더에서 JWT 추출 ("Bearer " 제거)
    private Optional<String> extractJwtFromHeader(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            return Optional.of(authHeader.substring(7));
        }
        return Optional.empty();
    }

    // 토큰에서 이메일 추출 (만료/형식 오류 시 401 응답)
    private Optional<String> extractEmail(String jwt, HttpServletResponse response) throws IOException {
        try {
            return Optional.ofNullable(jwtTokenUtil.extractEmail(jwt));
        } catch (ExpiredJwtException e) {
            setUnauthorizedResponse(response, "Token Expired");
        } catch (Exception e) { // MalformedJwtException, SignatureException 등
            setUnauthorizedResponse(response, "Invalid Token Format/Signature");
        }
        return Optional.empty();
    }

    // UserDetails 기반 토큰 유효성 검증 및 SecurityContext 설정
    private boolean authenticateUser(UserDetails userDetails, String jwt, HttpServletRequest request, HttpServletResponse response) throws IOException {
        try {
            if (jwtTokenUtil.validateToken(jwt, userDetails.getUsername())) {
                UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                        userDetails, null, userDetails.getAuthorities());
                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authentication);
                return true;
            } else {
                setUnauthorizedResponse(response, "Token Validation Failed"); // 서명 불일치 등
                return false;
            }
        } catch (ExpiredJwtException e) { // validate 중 만료될 수도 있음
             setUnauthorizedResponse(response, "Token Expired During Validation");
             return false;
        } catch (Exception e) {
             log.error("Error during JWT authentication: {}", e.getMessage(), e);
             setUnauthorizedResponse(response, "Authentication Error");
             return false;
        }
    }

    // 401 Unauthorized 응답 설정
    private void setUnauthorizedResponse(HttpServletResponse response, String message) throws IOException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType("application/json;charset=UTF-8");
        response.getWriter().write("{\"error\": \"" + message + "\"}");
    }
}
```

**핵심:** `JwtRequestFilter`는 상태 비저장(Stateless)인 JWT 인증의 핵심으로, 들어오는 모든 요청에 대해 토큰의 유효성을 검사하고 인증 상태를 설정하는 역할을 담당합니다. 블랙리스트 확인이 중요한 보안 요소입니다.

---

## AuthenticationService: JWT 발급 및 관리의 중심

`AuthenticationService`는 JWT의 생성(발급), 갱신, 그리고 무효화(로그아웃) 로직을 담당하는 서비스입니다.

**주요 기능:**

1.  **`authenticate(email, password)`**:
    *   ID/Password 검증 (`AuthenticationManager` 위임).
    *   성공 시: `jwtTokenUtil`을 사용하여 **새로운 Access Token과 Refresh Token을 생성**.
    *   생성된 **Refresh Token은 `RefreshTokenStorage`에 사용자와 매핑하여 저장**.
    *   두 토큰을 클라이언트에게 반환.

2.  **`refreshToken(providedRefreshToken)`**:
    *   클라이언트가 제시한 Refresh Token의 형식과 서명, 만료 여부를 1차 검증 (`jwtTokenUtil`).
    *   **`RefreshTokenStorage`에서 해당 사용자의 저장된 Refresh Token을 조회하여 일치 여부 확인**. (매우 중요! 탈취된 토큰 사용 방지)
    *   저장된 토큰과 일치하고 유효하다면, **새로운 Access Token만 재발급**하여 반환. (Refresh Token은 유지하거나, 보안 강화를 위해 Rotation 정책 적용 가능)
    *   유효하지 않거나 저장소의 토큰과 불일치 시 401 Unauthorized 응답.

3.  **`exchangeToken(code)`**: (OAuth2 로그인 후처리)
    *   프론트엔드로부터 받은 임시 `code`를 검증 (`AuthCodeStorage` 사용).
    *   유효한 `code`이면, 해당 사용자 정보(이메일)를 기반으로 **새로운 Access Token과 Refresh Token을 생성**.
    *   생성된 **Refresh Token을 `RefreshTokenStorage`에 저장**.
    *   두 토큰을 클라이언트에게 반환하고, 사용된 `code`는 제거.

4.  **`logout(accessToken, email)`**:
    *   **`RefreshTokenStorage`에서 해당 사용자의 Refresh Token을 삭제**하여 더 이상 토큰 갱신이 불가능하게 함.
    *   요청 헤더에서 받은 **Access Token을 추출하여 `RefreshTokenStorage`의 Blacklist에 만료 시간과 함께 등록**.
    *   `SecurityContextHolder`를 클리어.

```java
// package movlit.be.auth.application.service; // (패키지 생략)

@Service
@RequiredArgsConstructor
public class AuthenticationService {

    private final AuthenticationManager authenticationManager; // ID/PW 검증용
    private final JwtTokenUtil jwtTokenUtil;
    private final AuthCodeStorage authCodeStorage; // OAuth 임시 코드용
    private final RefreshTokenStorage refreshTokenStorage; // Refresh Token 저장 및 Blacklist
    // private final MyMemberDetailsService memberDetailsService; // 필요시 주입

    // ID/PW 로그인 시 토큰 발급
    public AuthenticationResponse authenticate(AuthenticationRequest request) throws Exception {
        // ... (AuthenticationManager 통한 인증 로직은 생략) ...
        // 인증 성공 가정
        String email = request.getEmail();

        // 1. Access/Refresh Token 생성
        String accessToken = jwtTokenUtil.generateAccessToken(email);
        String refreshToken = jwtTokenUtil.generateRefreshToken(email);

        // 2. Refresh Token 저장
        refreshTokenStorage.saveRefreshToken(email, refreshToken);

        log.info("JWTs issued for user {}", email);
        return new AuthenticationResponse(accessToken, refreshToken);
    }

    // Refresh Token으로 Access Token 재발급
    public ResponseEntity<?> refreshToken(String providedRefreshToken) {
        try {
            // 1. Refresh Token 기본 검증 (형식, 서명, 만료)
            if (!jwtTokenUtil.validateTokenFormat(providedRefreshToken)) {
                 return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Invalid refresh token format"));
            }
            String email = jwtTokenUtil.extractEmail(providedRefreshToken); // 만료 시 여기서 예외 발생 가능

            // 2. 저장된 Refresh Token과 비교
            String storedRefreshToken = refreshTokenStorage.findByToken(email);
            if (storedRefreshToken == null || !storedRefreshToken.equals(providedRefreshToken)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Invalid or expired refresh token (mismatch)"));
            }

            // 3. Refresh Token 최종 유효성 확인 (DB 사용자 확인 불필요 시 email 매칭만으로도 가능)
            if (!jwtTokenUtil.validateToken(providedRefreshToken, email)) { // 실제 만료/서명/email 매칭 확인
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Refresh token validation failed"));
            }

            // 4. 새 Access Token 발급
            String newAccessToken = jwtTokenUtil.generateAccessToken(email);
            log.info("Access token refreshed for user {}", email);

            // Access Token만 갱신하여 반환 (Refresh Token은 유지)
            return ResponseEntity.ok(new AuthenticationResponse(newAccessToken, providedRefreshToken));

        } catch (ExpiredJwtException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Refresh token expired"));
        } catch (Exception e) {
            log.error("Error refreshing token: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Token refresh failed"));
        }
    }

    // OAuth2 로그인 후 임시 code를 JWT로 교환
    public ResponseEntity<?> exchangeToken(String code) {
        String email = authCodeStorage.fetchEmailForCode(code); // 임시 코드 -> 이메일 조회
        if (Objects.isNull(email)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid or expired code: " + code));
        }

        // 1. Access/Refresh Token 생성
        String accessToken = jwtTokenUtil.generateAccessToken(email);
        String refreshToken = jwtTokenUtil.generateRefreshToken(email);

        // 2. Refresh Token 저장
        refreshTokenStorage.saveRefreshToken(email, refreshToken);

        // 3. 임시 코드 제거
        authCodeStorage.removeCode(code);

        log.info("JWTs issued via code exchange for user {}", email);
        return ResponseEntity.ok(new AuthenticationResponse(accessToken, refreshToken));
    }

    // 로그아웃: Refresh Token 삭제 및 Access Token 블랙리스트
     public ResponseEntity<?> logout(String authHeader, String email) {
        try {
            // 1. Refresh Token 삭제
            refreshTokenStorage.deleteByToken(email);

            // 2. Access Token 블랙리스트 추가
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                 String token = authHeader.substring(7);
                 try {
                     long expirationTime = jwtTokenUtil.extractExpiration(token).getTime();
                     refreshTokenStorage.addBlacklist(token, expirationTime);
                     log.info("Access token blacklisted for user {}", email);
                 } catch (Exception e) {
                     log.warn("Could not extract expiration from token on logout for user {}: {}", email, e.getMessage());
                     // 만료 시간 추출 실패해도 블랙리스트 시도는 해볼 수 있음 (만료시간 0 등으로)
                     // refreshTokenStorage.addBlacklist(token, 0);
                 }
            }

            SecurityContextHolder.clearContext();
            return ResponseEntity.ok(Map.of("message", "Logout successful"));

        } catch (Exception e) {
            log.error("Error during logout for user {}: {}", email, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Logout failed"));
        }
     }
}
```

**핵심:** `AuthenticationService`는 JWT의 라이프사이클(생성, 갱신, 소멸)을 관리하는 중추적인 역할을 하며, `JwtTokenUtil`과 `RefreshTokenStorage`에 크게 의존합니다. Refresh Token의 안전한 저장 및 검증, Access Token의 블랙리스트 처리가 보안의 핵심입니다.

---

## Refresh Token Storage: 토큰과 블랙리스트의 저장소

`RefreshTokenStorage` 인터페이스는 Refresh Token과 블랙리스트된 Access Token을 저장하고 관리하는 역할을 정의합니다. 여기서는 간단한 인메모리 구현(`ConcurrentRefreshTokenStorage`) 예시를 사용합니다.

**주요 책임:**

*   **Refresh Token 관리**:
    *   `saveRefreshToken(email, refreshToken)`: 사용자 이메일과 Refresh Token을 매핑하여 저장합니다.
    *   `findByToken(email)`: 이메일로 저장된 Refresh Token을 조회합니다. (토큰 갱신 시 검증용)
    *   `deleteByToken(email)`: 로그아웃 또는 탈퇴 시 Refresh Token을 삭제합니다.
*   **Blacklist 관리**:
    *   `addBlacklist(accessToken, expirationTimeMillis)`: 로그아웃된 Access Token과 그 만료 시간을 저장합니다.
    *   `isBlacklist(accessToken)`: 주어진 Access Token이 블랙리스트에 있고 아직 만료되지 않았는지 확인합니다. (`JwtRequestFilter`에서 사용)

```java
// package movlit.be.auth.infra.persistence; // (패키지 생략)

@Service
@Slf4j
public class ConcurrentRefreshTokenStorage implements RefreshTokenStorage {

    // (email -> refreshToken)
    private final ConcurrentHashMap<String, String> refreshTokens = new ConcurrentHashMap<>();
    // (accessToken -> expirationTimeMillis)
    private final ConcurrentHashMap<String, Long> blacklist = new ConcurrentHashMap<>();
    // 주기적 블랙리스트 정리용 스케줄러
    private ScheduledExecutorService cleanupScheduler;

    @Override
    public void saveRefreshToken(String email, String refreshToken) {
        refreshTokens.put(email, refreshToken);
    }

    @Override
    public String findByToken(String email) {
        return refreshTokens.get(email);
    }

    @Override
    public void addBlacklist(String token, long expirationTimeMillis) {
        if (token != null && expirationTimeMillis > System.currentTimeMillis()) {
           blacklist.put(token, expirationTimeMillis);
        }
    }

    @Override
    public boolean isBlacklist(String token) {
        if (token == null) return false;
        Long expirationTime = blacklist.get(token);
        // 블랙리스트에 있고, 아직 만료되지 않았는지 확인
        return expirationTime != null && expirationTime > System.currentTimeMillis();
    }

    @Override
    public void deleteByToken(String email) {
        refreshTokens.remove(email);
    }

    // 주기적으로 만료된 블랙리스트 토큰 정리
    private void cleanupExpiredBlacklistTokens() {
        long now = System.currentTimeMillis();
        blacklist.entrySet().removeIf(entry -> entry.getValue() <= now);
        // (로그 생략)
    }

    // 스케줄러 시작/종료 로직 (@PostConstruct, @PreDestroy 사용)
    // ... (코드 생략) ...
}
```

**핵심:** 인메모리 방식은 간단하지만, 앱 재시작 시 데이터가 유실되고 스케일 아웃에 불리합니다. **운영 환경에서는 Redis 같은 외부 저장소 사용을 강력히 권장합니다.** Redis의 TTL 기능을 활용하면 블랙리스트 자동 만료 처리가 용이합니다.

---

## OAuth2 연동: 소셜 로그인 후 JWT 발급 흐름

OAuth2 소셜 로그인 자체는 복잡한 프로토콜이지만, 우리 시스템과의 연동 목표는 최종적으로 **인증된 사용자에 대해 우리 시스템의 JWT를 발급하는 것**입니다.

`OAuth2AuthenticationSuccessHandler`는 Spring Security가 소셜 로그인을 성공적으로 처리한 *직후* 호출됩니다. 여기서 직접 JWT를 발급하는 대신, **더 안전하고 깔끔한 Code 교환 방식**을 사용합니다.

**흐름:**

1.  **사용자 식별**: `Authentication` 객체에서 소셜 로그인으로 인증된 사용자의 식별자(이메일)를 추출합니다.
2.  **임시 Code 생성**: 안전하고 고유한 임시 `code`를 생성합니다.
3.  **Code 저장**: `AuthCodeStorage`에 생성된 `code`와 사용자 이메일을 짧은 만료 시간(예: 5분)과 함께 저장합니다. 이 `code`는 일회용입니다.
4.  **프론트엔드 리다이렉트**: 프론트엔드의 특정 콜백 URI로 리다이렉트하면서, 생성된 `code`를 쿼리 파라미터로 전달합니다. (예: `https://myapp.com/oauth/callback?code=xxxxxxx`)
5.  **프론트엔드의 토큰 교환 요청**: 프론트엔드는 리다이렉트된 페이지에서 `code`를 추출하여 백엔드의 `/api/auth/token/exchange` 엔드포인트(위 `AuthenticationService.exchangeToken` 메서드)로 요청을 보냅니다.
6.  **JWT 발급**: `AuthenticationService`는 `code`를 검증하고, 유효하면 해당 사용자에 대한 최종 JWT Access/Refresh Token을 발급하여 프론트엔드에 응답합니다.

```java
// package movlit.be.auth.application.service; // (패키지 생략)

@Component
@RequiredArgsConstructor
@Slf4j
public class OAuth2AuthenticationSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final AuthCodeStorage authCodeStorage; // 임시 코드 저장/관리
    @Value("${oauth.redirect-uri}") // 프론트엔드 콜백 URI
    private String frontendRedirectUri;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication)
            throws IOException {

        // 1. 사용자 이메일 추출 (Principal 타입에 따라 다름)
        String email = extractEmailFromPrincipal(authentication.getPrincipal());
        if (email == null) {
            // 에러 처리 및 리다이렉트
            response.sendRedirect("/error-page?message=email-extraction-failed");
            return;
        }

        // 2. 임시 code 생성 및 저장 (5분 유효)
        String code = IdGenerator.generate(); // UUID 등 사용
        authCodeStorage.saveCode(code, email, 5 * 60 * 1000);
        log.info("Generated temporary OAuth code {} for user {}", code, email);

        // 3. code를 포함하여 프론트엔드로 리다이렉트
        String targetUrl = UriComponentsBuilder.fromUriString(frontendRedirectUri)
                .queryParam("code", code)
                .build().toUriString();

        // (캐시 제어 헤더 설정 등은 생략)
        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }

    // Principal에서 이메일 추출하는 헬퍼 메서드 (구현 필요)
    private String extractEmailFromPrincipal(Object principal) {
        // ... (MyMemberDetails, OAuth2User 등 타입 체크 및 이메일 추출 로직) ...
        return "user@example.com"; // 임시 반환값
    }
}
```

**핵심:** OAuth2 성공 후 직접 JWT를 발급하지 않고, 임시 `code`를 통해 한 단계를 더 거침으로써 토큰 발급 로직을 `AuthenticationService`로 중앙화하고, Refresh Token 같은 민감 정보가 URL에 노출될 위험을 줄입니다.

---

## SecurityConfig: JWT 필터 통합 및 보안 규칙 설정

`SecurityConfig`에서는 Spring Security의 전반적인 설정을 구성하며, 특히 JWT 인증과 관련된 중요한 설정들을 포함합니다.

**JWT 관련 주요 설정:**

1.  **CSRF 비활성화**: `.csrf(AbstractHttpConfigurer::disable)`
    *   Stateless한 JWT 기반 API에서는 일반적으로 CSRF 보호가 불필요하므로 비활성화합니다.
2.  **세션 정책 STATELESS**: `.sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))`
    *   서버가 세션을 생성하거나 사용하지 않도록 설정하여 완전한 Stateless 서버를 구현합니다. JWT 인증 방식과 일치합니다.
3.  **`JwtRequestFilter` 통합**: `.addFilterBefore(jwtRequestFilter, UsernamePasswordAuthenticationFilter.class)`
    *   **매우 중요**: 우리가 만든 `JwtRequestFilter`를 기본 로그인 필터(`UsernamePasswordAuthenticationFilter`) *앞에* 추가합니다. 이렇게 해야 모든 요청에 대해 ID/Password 검증보다 JWT 검증이 먼저 이루어집니다.
4.  **인증/인가 규칙**: `.authorizeHttpRequests(...)`
    *   인증(`Authentication`)이 필요한 경로 (`.anyRequest().authenticated()`) 와 필요 없는 경로 (인증 API `/api/auth/**`, 토큰 갱신 `/api/token/refresh` 등은 `permitAll()`) 를 정의합니다.
5.  **로그아웃 설정**: `.logout(...)`
    *   로그아웃 엔드포인트 (`/api/auth/logout`) 를 설정하고, 커스텀 `LogoutHandler`를 추가하여 `AuthenticationService.logout()` 메소드 (Refresh Token 삭제 및 Access Token 블랙리스트 등록)가 호출되도록 연동할 수 있습니다.
6.  **OAuth2 설정**: `.oauth2Login(...)`
    *   OAuth2 로그인을 활성화하고, `successHandler(oAuth2AuthenticationSuccessHandler)`를 통해 로그인 성공 시 위에서 설명한 임시 `code` 발급 및 리다이렉트 로직이 실행되도록 연결합니다.

```java
// package movlit.be.common.config; // (패키지 생략)

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    // ... (주입: jwtRequestFilter, oAuth2AuthenticationSuccessHandler, myOAuth2MemberService 등) ...
    // private final AuthenticationService authenticationService; // Logout 핸들러에서 사용 시 필요

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .cors(Customizer.withDefaults()) // CORS 설정 (별도 Bean 정의)
            .csrf(AbstractHttpConfigurer::disable) // CSRF 비활성화 (JWT 사용)
            .headers(headers -> headers.frameOptions(FrameOptionsConfig::sameOrigin)) // H2 Console용 (개발 시)

            // 세션 STATELESS 설정
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

            // 폼 로그인, HTTP Basic 비활성화
            .formLogin(AbstractHttpConfigurer::disable)
            .httpBasic(AbstractHttpConfigurer::disable)

            // 요청 경로별 인가 설정
            .authorizeHttpRequests(auth -> auth
                // 인증 없이 접근 허용 경로
                .requestMatchers("/api/auth/**", "/oauth2/**", "/login/**").permitAll() // 인증 관련
                .requestMatchers("/api/token/refresh").permitAll() // 토큰 갱신 (별도 Refresh Token 검증)
                // ... 기타 공개 경로 ...
                // 나머지 모든 요청은 인증 필요
                .anyRequest().authenticated()
            )

            // 로그아웃 설정
            .logout(logout -> logout
                .logoutUrl("/api/auth/logout")
                .permitAll()
                .addLogoutHandler((request, response, authentication) -> {
                    // 여기서 AuthenticationService.logout 호출
                    String authHeader = request.getHeader("Authorization");
                    String email = (authentication != null && authentication.getPrincipal() instanceof UserDetails)
                            ? ((UserDetails) authentication.getPrincipal()).getUsername() : null;
                    if (email != null) {
                        // authenticationService.logout(authHeader, email); // 주입 후 호출
                    }
                })
                .logoutSuccessHandler((request, response, authentication) -> {
                    // 성공 응답 설정
                    response.setStatus(HttpServletResponse.SC_OK);
                    response.getWriter().write("{\"message\": \"Logout successful\"}");
                })
            )

            // OAuth2 로그인 설정
            .oauth2Login(oauth -> oauth
                .userInfoEndpoint(userInfo -> userInfo.userService(myOAuth2MemberService)) // 사용자 정보 처리
                .successHandler(oAuth2AuthenticationSuccessHandler) // 성공 시 code 발급 핸들러
            )

            // !!! JwtRequestFilter 추가 (UsernamePasswordAuthenticationFilter 앞에) !!!
            .addFilterBefore(jwtRequestFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    // ... (CorsConfigurationSource, PasswordEncoder, AuthenticationManager Bean 설정은 생략) ...
}
```

**핵심:** `SecurityConfig`는 JWT 기반 인증 시스템을 Spring Security 프레임워크에 통합하는 접착제 역할을 합니다. 특히 `JwtRequestFilter`의 올바른 위치 설정과 세션 정책 `STATELESS` 지정이 중요합니다.

---

## 정리: JWT 라이프사이클 요약

1.  **발급 (Issue)**: 로그인(ID/PW, OAuth2 후 Code 교환) 성공 시 `AuthenticationService`가 Access Token과 Refresh Token을 생성. Refresh Token은 `RefreshTokenStorage`에 저장.
2.  **사용 (Use)**: 클라이언트는 API 요청 시마다 Access Token을 `Authorization` 헤더에 담아 전송.
3.  **검증 (Validate)**: `JwtRequestFilter`가 모든 요청에서 Access Token 추출, Blacklist 확인, 유효성(서명, 만료 등) 검증 후 `SecurityContextHolder`에 인증 정보 설정.
4.  **갱신 (Refresh)**: Access Token 만료 시, 클라이언트는 Refresh Token으로 토큰 갱신 API 호출. `AuthenticationService`는 `RefreshTokenStorage`와 대조하여 유효성을 검증하고 새 Access Token 발급.
5.  **무효화 (Invalidate)**: 로그아웃 시 `AuthenticationService`가 `RefreshTokenStorage`에서 Refresh Token 삭제 및 Access Token을 Blacklist에 등록. `JwtRequestFilter`는 이후 해당 Access Token 접근 차단.
