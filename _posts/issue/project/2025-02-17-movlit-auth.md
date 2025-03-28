---
title: "[Project] Spring Boot와 Spring Security로 JWT 기반 로그인 구현하기"
excerpt: "movlit, spring, auth"

categories:
  - Project
tags:
  - [movlit, auth]

toc: true
toc_sticky: true

sidebar:
  nav: "categories"

date: 2025-02-17
last_modified_at: 2025-03-28
---

> [Movlit 프로젝트](https://github.com/venus-lion/movlit-plus)에 대한 설명입니다.

## 프로젝트 개요: 우리가 만들 인증 시스템

먼저 우리가 만들 인증 시스템의 주요 기능들을 요약해 볼게요.

1.  **JWT 기반 인증**: 사용자가 ID/Password로 로그인하면, 서버는 `UsernamePasswordAuthenticationToken`으로 사용자를 확인하고, 인증의 증표로 **JWT Access Token**을 발급합니다. 이후 사용자는 요청마다 이 토큰을 제시해야 해요.
2.  **Refresh Token 발급 및 관리**: Access Token은 보안을 위해 유효 기간이 짧습니다. 만료 시 사용자가 다시 로그인해야 하는 불편함을 줄이기 위해, 유효 기간이 더 긴 **Refresh Token**을 함께 발급합니다. Access Token이 만료되면, 사용자는 이 Refresh Token을 제시하여 새로운 Access Token을 재발급받을 수 있습니다.
3.  **OAuth2 소셜 로그인**: Google, Kakao, Naver 같은 외부 서비스 계정으로도 우리 서비스에 로그인할 수 있게 합니다. OAuth2 프로토콜을 사용하여 안전하게 사용자 정보를 받아옵니다.
4.  **로그아웃/Blacklist**: 사용자가 로그아웃하면, 아직 유효 기간이 남은 Access Token이라도 더 이상 사용할 수 없도록 **Blacklist**에 등록하여 즉시 효력을 상실시킵니다.

이 기능들을 구현하기 위한 핵심 코드들을 하나씩 살펴보겠습니다.

---

## JwtRequestFilter: 모든 요청의 첫 관문, JWT 검증 필터

`JwtRequestFilter`는 스프링 시큐리티 필터 체인의 앞단에 위치하여, 클라이언트로부터 들어오는 **모든 요청**을 가장 먼저 맞이하는 중요한 역할을 합니다. `OncePerRequestFilter`를 상속받아 각 요청당 **단 한 번만** 실행되도록 보장합니다.

이 필터의 주된 임무는 요청 헤더(주로 `Authorization` 헤더)에 JWT Access Token이 포함되어 있는지 확인하고, 있다면 토큰의 유효성을 검증하는 것입니다. 검증이 성공하면, 토큰에서 추출한 사용자 정보를 바탕으로 `Authentication` 객체를 생성하고, 이를 `SecurityContextHolder`에 등록하여 해당 요청 동안 사용자가 인증되었음을 시스템에 알립니다.

```java
package movlit.be.common.filter;

@Component
@RequiredArgsConstructor
@Slf4j
public class JwtRequestFilter extends OncePerRequestFilter {

    private final JwtTokenUtil jwtTokenUtil;
    private final MyMemberDetailsService myMemberDetailsService;
    private final RefreshTokenStorage refreshTokenStorage; // Blacklist 저장소 주입

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain)
            throws ServletException, IOException {

        // 1. Request Header에서 JWT 토큰 추출
        Optional<String> jwtOptional = extractJwtFromHeader(request);

        if (jwtOptional.isPresent()) {
            String jwt = jwtOptional.get();

            // 2. Blacklist 확인 (로그아웃 처리된 토큰인지?)
            if (refreshTokenStorage.isBlacklist(jwt)) {
                setUnauthorizedResponse(response, "Invalid Token (Blacklisted)");
                return; // 블랙리스트된 토큰이면 더 이상 진행하지 않음
            }

            // 3. 토큰에서 사용자 이메일 추출 (만료 또는 형식 오류 시 여기서 걸림)
            Optional<String> emailOptional = extractEmail(jwt, response);

            if (emailOptional.isEmpty()) {
                // extractEmail 내부에서 이미 401 응답 처리됨
                return;
            }

            String email = emailOptional.get();

            // 4. SecurityContext에 인증 정보가 없는 경우, 토큰 기반으로 인증 정보 생성/등록
            // (이미 다른 필터 등에서 인증 정보가 설정되었다면 중복 처리 방지)
            if (SecurityContextHolder.getContext().getAuthentication() == null) {
                // DB에서 사용자 정보 조회
                UserDetails userDetails = myMemberDetailsService.loadUserByUsername(email);

                // 토큰 유효성 최종 검증 (Signature, 만료 시간 등) 및 SecurityContext에 등록
                if (!authenticateUser(userDetails, jwt, request, response)) {
                    // authenticateUser 내부에서 401 응답 처리됨
                    return;
                }
                log.info("Authenticated user: {}, setting security context", email);
            }
        }

        // 5. 다음 필터로 요청 전달
        chain.doFilter(request, response);
    }

    // "Authorization: Bearer {JWT}" 형식의 헤더에서 토큰 값만 추출
    private Optional<String> extractJwtFromHeader(HttpServletRequest request) {
        String authorizationHeader = request.getHeader("Authorization");
        if (authorizationHeader != null && authorizationHeader.startsWith("Bearer ")) {
            return Optional.of(authorizationHeader.substring(7));
        }
        log.trace("No JWT token found in request headers");
        return Optional.empty();
    }

    // JWT 토큰에서 이메일(Subject) 추출, 예외 발생 시 401 응답 설정
    private Optional<String> extractEmail(String jwt, HttpServletResponse response) throws IOException {
        try {
            return Optional.ofNullable(jwtTokenUtil.extractEmail(jwt));
        } catch (ExpiredJwtException e) {
            log.warn("JWT token is expired: {}", e.getMessage());
            setUnauthorizedResponse(response, "Token Expired");
        } catch (Exception e) { // MalformedJwtException, SignatureException 등 포함
            log.warn("Invalid JWT token: {}", e.getMessage());
            setUnauthorizedResponse(response, "Invalid Token");
        }
        return Optional.empty();
    }

    // UserDetails와 JWT 토큰의 유효성을 검증하고, 성공 시 SecurityContext에 Authentication 등록
    private boolean authenticateUser(UserDetails userDetails,
                                     String jwt,
                                     HttpServletRequest request,
                                     HttpServletResponse response) throws IOException {
        try {
            // 토큰 자체의 유효성(서명, 만료시간) + 토큰의 사용자 정보와 DB 조회 사용자 정보 일치 여부 확인
            if (jwtTokenUtil.validateToken(jwt, userDetails.getUsername())) {
                // 인증 성공! Spring Security가 이해할 수 있는 Authentication 객체 생성
                UsernamePasswordAuthenticationToken authenticationToken =
                        new UsernamePasswordAuthenticationToken(
                                userDetails, // Principal (주체) - 보통 UserDetails 객체
                                null,        // Credentials (자격 증명) - JWT 방식에서는 보통 null
                                userDetails.getAuthorities() // Authorities (권한)
                        );
                // 요청 세부 정보 설정 (e.g., IP 주소, 세션 ID 등)
                authenticationToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                // SecurityContextHolder에 인증 정보 설정 -> 이제 이 요청은 인증된 사용자의 요청으로 간주됨!
                SecurityContextHolder.getContext().setAuthentication(authenticationToken);
                return true;
            } else {
                log.warn("JWT token validation failed for user: {}", userDetails.getUsername());
                setUnauthorizedResponse(response, "Invalid Token");
                return false;
            }
        } catch (ExpiredJwtException e) { // validateToken 내에서도 만료 예외 발생 가능
            log.warn("JWT token is expired during validation: {}", e.getMessage());
            setUnauthorizedResponse(response, "Token Expired");
            return false;
        } catch (Exception e) {
             log.error("Error during user authentication: {}", e.getMessage(), e);
             setUnauthorizedResponse(response, "Authentication Error");
             return false;
        }
    }

    // 클라이언트에게 401 Unauthorized 응답 전송
    private void setUnauthorizedResponse(HttpServletResponse response, String message) throws IOException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType("application/json;charset=UTF-8"); // 응답 타입 명시
        response.getWriter().write("{\"error\": \"" + message + "\"}"); // 간단한 JSON 응답
    }

}
```

**주요 포인트 & 추가 설명**

- **`OncePerRequestFilter`**: 각 HTTP 요청에 대해 필터 체인 내에서 딱 한 번만 실행됨을 보장합니다. 서블릿 컨테이너의 내부 디스패치(forward, include 등) 시에도 중복 실행되지 않아요.
- **Blacklist 확인**: 토큰 유효성 검사 전에, 해당 토큰이 로그아웃 등으로 인해 블랙리스트에 등록되었는지 먼저 확인합니다. (`refreshTokenStorage.isBlacklist(jwt)`)
- **`SecurityContextHolder`**: 현재 실행 스레드에 대한 보안 컨텍스트를 저장하는 곳입니다. 여기에 `Authentication` 객체를 넣어두면, 이후 애플리케이션 코드 어디서든 `SecurityContextHolder.getContext().getAuthentication()` 를 통해 현재 인증된 사용자 정보에 접근할 수 있습니다.
- **`UserDetails`**: Spring Security가 사용자를 나타내는 핵심 인터페이스입니다. `MyMemberDetailsService`는 이 인터페이스의 구현체를 DB 등에서 조회하는 역할을 하죠.
- **`UsernamePasswordAuthenticationToken`**: `Authentication` 인터페이스의 가장 일반적인 구현체 중 하나입니다. 꼭 ID/Password 인증이 아니더라도, 인증된 사용자의 정보(Principal, Credentials, Authorities)를 담는 데 사용될 수 있습니다. JWT 인증에서는 보통 Credentials를 null로 둡니다.
- **오류 응답**: 토큰 만료(`ExpiredJwtException`), 서명 불일치(`SignatureException`), 형식 오류(`MalformedJwtException`) 등 다양한 이유로 토큰 검증이 실패할 수 있습니다. 이때 단순히 필터 체인을 계속 진행하는 것이 아니라, `setUnauthorizedResponse`를 호출하여 클라이언트에게 명확한 **401 Unauthorized** 상태와 함께 오류 메시지를 즉시 반환하는 것이 중요합니다.

---

## AuthenticationService: 인증 로직의 심장부

`AuthenticationService`는 실제 인증 과정을 처리하고, 성공 시 JWT 토큰(Access & Refresh)을 발급하는 핵심 서비스입니다. ID/Password 기반의 일반 로그인, Refresh Token을 이용한 Access Token 갱신, 그리고 OAuth2 로그인 후처리 로직(code 교환) 등을 담당합니다.

```java
package movlit.be.auth.application.service;

@Service
@RequiredArgsConstructor
public class AuthenticationService {

    // Spring Security의 인증 처리를 총괄하는 관리자 역할
    private final AuthenticationManager authenticationManager;
    private final JwtTokenUtil jwtTokenUtil;
    // OAuth2 로그인 시 임시 코드 저장/조회용 (인메모리 또는 Redis 등)
    private final AuthCodeStorage authCodeStorage;
    // Refresh Token 저장/조회/삭제용 (인메모리 또는 Redis 등)
    private final RefreshTokenStorage refreshTokenStorage;
    // 사용자 정보 조회 서비스
    private final MyMemberDetailsService memberDetailsService; // UserDetails 로드 위해 추가 (선택적)

    /**
     * 일반적인 이메일/패스워드 기반 로그인 처리
     */
    public AuthenticationResponse authenticate(AuthenticationRequest request) throws Exception {
        String email = request.getEmail();
        String password = request.getPassword();

        try {
            // 1. AuthenticationManager에게 인증 요청 위임
            // 내부적으로 등록된 AuthenticationProvider (e.g., DaoAuthenticationProvider)가
            // MyMemberDetailsService를 통해 UserDetails를 로드하고,
            // 입력된 password와 DB의 인코딩된 password를 비교하여 인증 수행
            Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, password)
            );

            // (선택적) 인증 성공 후 SecurityContext에 저장할 수도 있음 (Stateless면 보통 안 함)
            // SecurityContextHolder.getContext().setAuthentication(authentication);

        } catch (BadCredentialsException e) {
            // 인증 실패 시 (이메일 또는 비밀번호 불일치)
            throw new MemberNotFoundException("Invalid credentials"); // 혹은 더 구체적인 예외
        } catch (Exception e) {
            // 기타 인증 관련 예외 처리 (e.g., 계정 잠김, 비활성화 등)
             log.error("Authentication failed for user {}: {}", email, e.getMessage());
             throw e;
        }

        // 2. 인증 성공! Access Token과 Refresh Token 생성
        String accessToken = jwtTokenUtil.generateAccessToken(email);
        String refreshToken = jwtTokenUtil.generateRefreshToken(email);

        // 3. 생성된 Refresh Token을 저장소에 저장 (기존 것이 있다면 덮어쓰거나, 관리 정책에 따라 처리)
        refreshTokenStorage.saveRefreshToken(email, refreshToken);

        log.info("User {} authenticated successfully. Tokens issued.", email);
        return new AuthenticationResponse(accessToken, refreshToken);
    }

    /**
     * Refresh Token을 사용하여 새로운 Access Token 재발급
     */
    public ResponseEntity<?> refreshToken(String providedRefreshToken) {
        try {
            // 1. Refresh Token 자체의 유효성 검증 (만료, 서명 등)
            if (!jwtTokenUtil.validateTokenFormat(providedRefreshToken)) {
                 return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Invalid refresh token format"));
            }

            String email = jwtTokenUtil.extractEmail(providedRefreshToken);

            // 2. 저장소에 저장된 Refresh Token과 비교 (실제 유효한 토큰인지?)
            String storedRefreshToken = refreshTokenStorage.findByToken(email);
            if (storedRefreshToken == null || !storedRefreshToken.equals(providedRefreshToken)) {
                log.warn("Provided refresh token does not match stored token for user {}", email);
                // 보안상 이유로 저장된 리프레시 토큰 삭제 고려
                // refreshTokenStorage.deleteByToken(email);
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Invalid or expired refresh token"));
            }

            // 3. Refresh Token 유효성 최종 검증 (validateToken은 내부적으로 만료 체크도 함)
            // UserDetails 로드는 선택사항. Refresh Token 자체만으로 유효성 판단 가능하면 생략 가능.
            // UserDetails userDetails = memberDetailsService.loadUserByUsername(email);
            if (!jwtTokenUtil.validateToken(providedRefreshToken, email)) { // email 매칭 및 만료/서명 검증
                log.warn("Refresh token validation failed for user {}", email);
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Invalid refresh token"));
            }

            // 4. 유효하다면, 새로운 AccessToken만 발급 (Refresh Token은 유지 또는 재발급 - 정책에 따름)
            String newAccessToken = jwtTokenUtil.generateAccessToken(email);
            log.info("Access token refreshed successfully for user {}", email);

            // (선택적) Refresh Token Rotation: 보안 강화를 위해 Refresh Token도 재발급하고 이전 것은 무효화
            // String newRefreshToken = jwtTokenUtil.generateRefreshToken(email);
            // refreshTokenStorage.saveRefreshToken(email, newRefreshToken);
            // return ResponseEntity.ok(new AuthenticationResponse(newAccessToken, newRefreshToken));

            // 여기서는 Access Token만 갱신하고 기존 Refresh Token 반환
            return ResponseEntity.ok(new AuthenticationResponse(newAccessToken, providedRefreshToken));

        } catch (ExpiredJwtException e) {
            log.warn("Refresh token is expired: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Refresh token expired"));
        } catch (Exception e) {
            log.error("Error refreshing token: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Token refresh failed"));
        }
    }

    /**
     * OAuth2 소셜 로그인 성공 후, 프론트엔드에서 받은 임시 code를 Access/Refresh Token으로 교환
     */
    public ResponseEntity<?> exchangeToken(String code) {
        // 1. 임시 저장소에서 code에 해당하는 이메일(사용자 식별자) 조회
        String email = authCodeStorage.fetchEmailForCode(code);

        if (Objects.isNull(email)) {
            log.warn("Invalid or expired OAuth code received: {}", code);
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid or expired code: " + code));
        }

        // 2. 해당 이메일로 Access Token 및 Refresh Token 생성
        String accessToken = jwtTokenUtil.generateAccessToken(email);
        String refreshToken = jwtTokenUtil.generateRefreshToken(email);

        // 3. 생성된 Refresh Token 저장
        refreshTokenStorage.saveRefreshToken(email, refreshToken);

        // 4. 사용된 임시 code는 저장소에서 제거 (일회성)
        authCodeStorage.removeCode(code);

        log.info("OAuth code exchanged successfully for user {}. Tokens issued.", email);
        return ResponseEntity.ok(new AuthenticationResponse(accessToken, refreshToken));
    }

    /**
     * 로그아웃 처리: Refresh Token 삭제 및 Access Token 블랙리스트 등록
     */
     public ResponseEntity<?> logout(String accessToken, String email) {
        try {
            // 1. Refresh Token 저장소에서 해당 유저의 Refresh Token 삭제
            refreshTokenStorage.deleteByToken(email);

            // 2. 현재 사용 중이던 Access Token을 Blacklist에 추가
            //    - 토큰 자체와 만료 시간을 함께 저장하여, 나중에 만료된 엔트리 정리 가능
            if (accessToken != null && accessToken.startsWith("Bearer ")) {
                 String token = accessToken.substring(7);
                 long expirationTime = jwtTokenUtil.extractExpiration(token).getTime();
                 refreshTokenStorage.addBlacklist(token, expirationTime);
                 log.info("User {} logged out. Access token blacklisted.", email);
            } else {
                 log.warn("Logout request for user {} without a valid access token header.", email);
            }

            // SecurityContext 클리어 (선택적, 상태 유지 세션이 없는 경우 큰 의미 없음)
            SecurityContextHolder.clearContext();

            return ResponseEntity.ok(Map.of("message", "Logout successful"));

        } catch (Exception e) {
            log.error("Error during logout for user {}: {}", email, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Logout failed"));
        }
     }
}
```

**주요 포인트 & 추가 설명**

- **`AuthenticationManager`**: Spring Security의 인증 과정을 추상화한 인터페이스입니다. 실제 인증 로직(DB 조회, 비밀번호 비교 등)은 `AuthenticationProvider` 구현체(주로 `DaoAuthenticationProvider`)가 담당하며, `AuthenticationManager`는 이 Provider들에게 인증 요청을 위임합니다. `SecurityConfig`에서 Bean으로 등록하여 주입받아 사용합니다.
- **`authenticate()`**:
  - `BadCredentialsException`: 사용자가 제공한 자격증명(이메일/비밀번호)이 잘못되었을 때 발생하는 표준 예외입니다. 이를 잡아서 사용자 친화적인 메시지나 커스텀 예외로 변환해주는 것이 좋습니다.
  - Refresh Token 저장: 인증 성공 후 발급된 Refresh Token은 반드시 서버 측 저장소(Redis, DB 등)에 **사용자와 매핑하여 저장**해야 합니다. 이후 Access Token 재발급 요청 시, 클라이언트가 제시한 Refresh Token이 저장된 값과 일치하는지 확인하기 위함입니다.
- **`refreshToken()`**:
  - 저장소 비교: 클라이언트가 보낸 Refresh Token이 서버에 저장된 유효한 토큰인지 반드시 확인해야 합니다. 탈취된 Refresh Token 사용을 막는 중요한 방어선입니다.
  - **Refresh Token Rotation (선택적)**: 보안을 더욱 강화하는 방법입니다. Access Token 재발급 시, 기존 Refresh Token을 무효화하고 새로운 Refresh Token을 발급하는 방식입니다. 만약 Refresh Token이 탈취되더라도, 원래 사용자가 먼저 사용하면 탈취범이 가진 토큰은 무효화됩니다. 구현 시 약간의 복잡성이 추가됩니다.
- **`exchangeToken()`**:
  - **OAuth2 Code Flow**: 소셜 로그인 시 `OAuth2AuthenticationSuccessHandler`에서 직접 토큰을 발급하지 않고 임시 `code`를 발급하여 프론트엔드로 리다이렉트하는 이유가 있습니다. 이는 프론트엔드와 백엔드의 역할을 분리하고, 토큰 발급 로직을 한 곳(`AuthenticationService`)으로 모으기 위함입니다. 프론트엔드는 이 `code`를 받아 백엔드의 `/api/token/exchange` 같은 엔드포인트로 보내 최종 토큰을 받아옵니다. 이 `code`는 매우 짧은 시간(수 분) 동안만 유효하며 일회용입니다.
  - 임시 코드 관리: `AuthCodeStorage`는 이 임시 코드를 저장하고 조회/삭제하는 역할을 합니다. 보안을 위해 만료 시간을 설정하고 관리하는 것이 중요합니다. (예: Caffeine Cache, Redis 사용)
- **`logout()`**:
  - Refresh Token 삭제: 로그아웃 시 가장 먼저 해당 사용자의 Refresh Token을 저장소에서 삭제하여 더 이상 Access Token 재발급이 불가능하도록 합니다.
  - Access Token 블랙리스트: Access Token은 상태가 없기 때문에 서버에서 강제로 만료시킬 수 없습니다. 대신, 로그아웃된 Access Token을 Blacklist에 등록하고, `JwtRequestFilter`에서 모든 요청마다 이 Blacklist를 확인하여 접근을 차단하는 방식을 사용합니다. Blacklist에 저장할 때는 토큰 자체와 만료 시간을 함께 저장하면, 나중에 만료된 토큰들을 주기적으로 정리(Cleanup)하는 데 유용합니다.

---

## Refresh Token Storage: 토큰 저장소 구현 예시 (`ConcurrentRefreshTokenStorage`)

Refresh Token과 Blacklist를 관리하기 위한 저장소 구현이 필요합니다. 여기서는 가장 간단한 형태인 **인메모리** `ConcurrentHashMap`을 사용한 예시를 보여줍니다. 실제 운영 환경에서는 데이터 유실 방지와 확장성을 위해 **Redis**나 데이터베이스를 사용하는 것이 일반적입니다.

```java
package movlit.be.auth.infra.persistence;

@Service
@Slf4j
public class ConcurrentRefreshTokenStorage implements RefreshTokenStorage {

    // 사용자 이메일(Key)과 Refresh Token(Value) 매핑
    private final ConcurrentHashMap<String, String> refreshTokens = new ConcurrentHashMap<>();
    // 블랙리스트된 Access Token(Key)과 만료 시간(Value, Unix timestamp) 매핑
    private final ConcurrentHashMap<String, Long> blacklist = new ConcurrentHashMap<>();

    // 만료된 블랙리스트 토큰 정리를 위한 스케줄러
    private ScheduledExecutorService cleanupScheduler;

    // 이메일로 Refresh Token 저장 (기존 값 덮어씀)
    @Override
    public void saveRefreshToken(String email, String refreshToken) {
        refreshTokens.put(email, refreshToken);
        log.debug("Saved refresh token for user: {}", email);
    }

    // 이메일로 저장된 Refresh Token 조회
    @Override
    public String findByToken(String email) {
        return refreshTokens.get(email);
    }

    // Access Token을 Blacklist에 추가 (만료 시간과 함께)
    @Override
    public void addBlacklist(String token, long expirationTimeMillis) {
        // 이미 블랙리스트에 있거나 만료 시간이 유효하지 않으면 추가하지 않음
        if (token != null && expirationTimeMillis > System.currentTimeMillis()) {
           blacklist.put(token, expirationTimeMillis);
           log.debug("Added token to blacklist. Expires at: {}", new java.util.Date(expirationTimeMillis));
        }
    }

    // 주어진 Access Token이 Blacklist에 있는지 확인
    @Override
    public boolean isBlacklist(String token) {
        if (token == null) return false;
        // 블랙리스트에 존재하고, 아직 만료 시간이 지나지 않았는지 확인
        Long expirationTime = blacklist.get(token);
        boolean isBlacklisted = expirationTime != null && expirationTime > System.currentTimeMillis();
        if (isBlacklisted) {
            log.trace("Token found in blacklist: {}", token);
        }
        return isBlacklisted;
    }

    // 이메일 기준으로 Refresh Token 삭제 (로그아웃 또는 탈퇴 시)
    @Override
    public void deleteByToken(String email) {
        if(refreshTokens.remove(email) != null) {
             log.debug("Deleted refresh token for user: {}", email);
        }
    }

    // 주기적으로 만료된 블랙리스트 토큰 정리 작업
    private void cleanupExpiredBlacklistTokens() {
        long now = System.currentTimeMillis();
        log.debug("Running blacklist cleanup task...");
        int initialSize = blacklist.size();
        blacklist.entrySet().removeIf(entry -> entry.getValue() <= now);
        int removedCount = initialSize - blacklist.size();
        if (removedCount > 0) {
             log.info("Removed {} expired tokens from blacklist.", removedCount);
        }
    }

    // 빈 초기화 시 스케줄러 시작
    @PostConstruct
    public void startCleanupScheduler() {
        cleanupScheduler = Executors.newSingleThreadScheduledExecutor();
        // 매 시간마다 만료된 블랙리스트 토큰 정리 작업 실행
        cleanupScheduler.scheduleAtFixedRate(this::cleanupExpiredBlacklistTokens, 1, 1, TimeUnit.HOURS);
        log.info("Blacklist cleanup scheduler started.");
    }

    // 빈 소멸 시 스케줄러 종료
    @PreDestroy
    public void stopCleanupScheduler() {
        if (cleanupScheduler != null && !cleanupScheduler.isShutdown()) {
            cleanupScheduler.shutdown();
            log.info("Blacklist cleanup scheduler stopped.");
        }
    }
}
```

**주요 포인트 & 추가 설명**

- **`ConcurrentHashMap`**: 여러 스레드에서 동시에 접근해도 데이터 일관성을 보장하는(Thread-safe) Map 구현체입니다. 웹 애플리케이션과 같이 다중 요청을 처리하는 환경에서 인메모리 저장소로 사용하기에 적합합니다.
- **Blacklist 관리**:
  - `addBlacklist()`: 로그아웃 시 호출되어 Access Token과 **만료 시간(Unix timestamp)** 을 함께 저장합니다.
  - `isBlacklist()`: `JwtRequestFilter`에서 호출되어, 토큰이 블랙리스트에 있는지 **그리고 아직 만료되지 않았는지** 확인합니다. 만료 시간이 지난 토큰은 어차피 유효하지 않으므로 블랙리스트 검사에서 제외합니다.
- **만료된 토큰 정리**: 인메모리 블랙리스트가 계속 커지는 것을 방지하기 위해, 주기적으로 만료된 토큰들을 제거하는 작업(`cleanupExpiredBlacklistTokens`)이 필요합니다. `@PostConstruct`와 `@PreDestroy`를 사용하여 애플리케이션 시작/종료 시 스케줄러를 관리합니다.
- **한계점**: 인메모리 방식은 애플리케이션 재시작 시 모든 데이터가 사라지고, 서버를 여러 대 운영(Scale-out)할 경우 서버 간 데이터 동기화가 어렵다는 단점이 있습니다. 따라서 **Redis** 같은 외부 저장소를 사용하는 것이 일반적이며, Redis의 **TTL(Time-To-Live)** 기능을 활용하면 만료된 데이터 자동 삭제를 더 쉽게 구현할 수 있습니다.

---

## OAuth2 연동 구조: 소셜 로그인 처리 흐름

OAuth2 소셜 로그인은 크게 두 단계로 나뉩니다.

1.  **인증 및 사용자 정보 처리**: 사용자가 소셜 로그인 버튼을 클릭하면, 백엔드는 해당 소셜 서비스(Google, Kakao 등)의 인증 페이지로 리다이렉트합니다. 사용자가 로그인을 완료하면, 소셜 서비스는 설정된 `redirect-uri`로 사용자를 다시 돌려보내면서 **Authorization Code**를 전달합니다. Spring Security OAuth2 Client 라이브러리는 이 과정을 처리하고, `Authorization Code`를 이용해 소셜 서비스로부터 **Access Token**을 얻어옵니다. 이 Access Token으로 사용자 정보를 조회하여 `OAuth2User` 객체를 만듭니다. 이 과정에서 `MyOAuth2MemberService` 같은 커스텀 `OAuth2UserService`를 구현하여 우리 시스템의 User 객체로 변환하거나 DB에 저장/업데이트하는 로직을 수행할 수 있습니다.

2.  **인증 성공 후 처리 (`OAuth2AuthenticationSuccessHandler`)**: `MyOAuth2MemberService`까지 성공적으로 완료되면, 즉 소셜 로그인을 통해 우리 시스템의 사용자를 식별하거나 생성했다면, `OAuth2AuthenticationSuccessHandler`가 호출됩니다. 여기서 우리는 "인증 성공 이후 무엇을 할 것인가?"를 정의합니다. 일반적인 방법은 우리 시스템에서 사용할 자체 **JWT Access Token과 Refresh Token**을 발급해주는 것입니다.

하지만 핸들러에서 직접 토큰을 발급하여 응답에 담아줄 수도 있지만, 좀 더 깔끔한 방법은 **임시 `code`**를 발급하여 프론트엔드로 리다이렉트 시키는 것입니다. 프론트엔드는 이 `code`를 받아서 다시 백엔드의 토큰 발급 전용 API(`AuthenticationService.exchangeToken`)를 호출하여 최종 JWT 토큰들을 받아옵니다.

```java
package movlit.be.auth.application.service; // 패키지 위치는 예시입니다.

@Component
@RequiredArgsConstructor
@Slf4j
public class OAuth2AuthenticationSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final AuthCodeStorage authCodeStorage; // 임시 코드 저장/관리
    // private final JwtTokenUtil jwtTokenUtil; // 직접 토큰 발급 시 필요

    @Value("${oauth.redirect-uri}") // 프론트엔드의 OAuth 콜백 처리 페이지 주소 (application.yml 등에서 설정)
    private String frontendRedirectUri;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) // 인증 성공 정보
            throws IOException {

        // 1. 인증된 사용자 정보 가져오기
        // Principal은 MyOAuth2MemberService에서 반환한 객체 (OAuth2User 또는 커스텀 UserDetails)
        Object principal = authentication.getPrincipal();
        String email;

        if (principal instanceof MyMemberDetails) {
            // MyOAuth2MemberService에서 우리 시스템의 UserDetails 구현체로 반환한 경우
            MyMemberDetails userDetails = (MyMemberDetails) principal;
            email = userDetails.getMember().getEmail(); // 예시: Member 객체에서 이메일 추출
            log.info("OAuth2 Success: UserDetails - {}", email);
        } else if (principal instanceof OAuth2User) {
            // 기본 OAuth2User 타입으로 반환된 경우 (커스텀 처리가 덜 된 상태)
            OAuth2User oAuth2User = (OAuth2User) principal;
            // OAuth2 공급자마다 이메일을 얻는 방식이 다를 수 있음 (attributes 맵 확인 필요)
            email = oAuth2User.getAttribute("email"); // Google, Kakao 등 공통적인 속성 시도
            if (email == null) {
                // Naver의 경우 response 객체 안에 정보가 있을 수 있음
                 Map<String, Object> responseAttributes = oAuth2User.getAttribute("response");
                 if (responseAttributes != null) {
                     email = (String) responseAttributes.get("email");
                 }
            }
            log.info("OAuth2 Success: OAuth2User - Attributes: {}", oAuth2User.getAttributes());
            if (email == null) {
                 log.error("Could not extract email from OAuth2User principal.");
                 // 예외 처리 또는 에러 페이지 리다이렉트 필요
                 response.sendRedirect("/error-page?message=email-extraction-failed");
                 return;
            }
        } else {
            log.error("Unknown principal type after OAuth2 authentication: {}", principal.getClass());
            response.sendRedirect("/error-page?message=unknown-principal");
            return;
        }


        // 2. 임시 code 생성 및 저장 (프론트가 토큰으로 교환할 때 사용할 일회용 코드)
        String code = IdGenerator.generate(); // 랜덤하고 고유한 코드 생성 (UUID 등)
        // 코드와 사용자 이메일 매핑하여 저장 (만료 시간 설정 필요 - 예: 5분)
        authCodeStorage.saveCode(code, email, 5 * 60 * 1000); // (code, email, TTL millis)
        log.info("Generated temporary code {} for user {}", code, email);

        /* --- 직접 토큰 발급 방식 (덜 선호됨) ---
        // 3. (대안) 여기서 직접 Access/Refresh Token 발급
        String accessToken = jwtTokenUtil.generateAccessToken(email);
        String refreshToken = jwtTokenUtil.generateRefreshToken(email);
        // refreshToken 저장
        // refreshTokenStorage.saveRefreshToken(email, refreshToken);

        // 4. 프론트엔드로 토큰을 전달하기 위해 리다이렉트 URL 구성 (쿼리 파라미터 사용 등)
        String targetUrl = UriComponentsBuilder.fromUriString(frontendRedirectUri)
                .queryParam("accessToken", accessToken)
                .queryParam("refreshToken", refreshToken) // 보안상 비추천: Refresh Token은 URL 노출 피해야 함
                .build().toUriString();
        log.info("Redirecting to frontend with tokens (Not Recommended for Refresh Token): {}", targetUrl);
        */

        // --- Code 발급 방식 (권장) ---
        // 3. 임시 code를 포함하여 프론트엔드 콜백 URI로 리다이렉트
        String targetUrl = UriComponentsBuilder.fromUriString(frontendRedirectUri)
                .queryParam("code", code) // 프론트는 이 code를 받아서 백엔드에 토큰 교환 요청
                .build().toUriString();
        log.info("Redirecting to frontend with code: {}", targetUrl);

        // 4. 응답 캐시 제어 설정 (리다이렉션 후 브라우저 캐시 방지)
        clearAuthenticationAttributes(request); // 세션에 저장된 임시 인증 속성 제거 (선택적)
        response.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        response.setHeader("Pragma", "no-cache");
        response.setDateHeader("Expires", 0);

        // 5. 최종 리다이렉트 실행
        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }
}
```

**주요 포인트 & 추가 설명**

- **Trigger**: 이 핸들러는 Spring Security가 OAuth2 인증 흐름을 성공적으로 완료하고, `OAuth2UserService`(`MyOAuth2MemberService`)가 사용자 정보를 처리한 *직후*에 호출됩니다.
- **Principal**: `authentication.getPrincipal()`을 통해 얻는 객체는 `MyOAuth2MemberService`에서 최종적으로 반환한 사용자 객체입니다. 보통은 우리 시스템의 `UserDetails` 구현체(`MyMemberDetails`)이거나, 기본적인 `OAuth2User` 인터페이스 타입일 수 있습니다. 여기서 사용자 식별자(이메일 등)를 추출하는 것이 중요합니다.
- **임시 Code 발급 (권장)**:
  - `IdGenerator.generate()`: 예측 불가능하고 충돌 확률이 매우 낮은 고유한 문자열(예: UUID)을 생성합니다.
  - `AuthCodeStorage.saveCode()`: 생성된 `code`와 사용자 이메일을 **짧은 만료 시간(예: 5분)** 과 함께 저장합니다. 이 `code`는 딱 한 번, 토큰 교환에만 사용되어야 합니다.
  - **Redirect**: 프론트엔드에서 OAuth 로그인 후 최종적으로 돌아갈 페이지(`frontendRedirectUri`, 예를 들어 `https://myapp.com/oauth/callback`) URL에 이 `code`를 쿼리 파라미터로 붙여 리다이렉트합니다. (`.../oauth/callback?code=xxxxxxx`)
- **프론트엔드의 역할**: 리다이렉트된 프론트엔드 페이지는 URL에서 `code` 파라미터를 추출하여 즉시 백엔드의 토큰 교환 API(예: `/api/auth/token/exchange?code=xxxxxxx`)를 호출합니다. 백엔드는 이 `code`를 검증하고 유효하면 JWT Access/Refresh Token을 발급하여 응답합니다. 프론트엔드는 이 토큰들을 안전하게 저장(예: 메모리, Secure HttpOnly Cookie)하고 이후 API 요청 시 사용합니다.
- **직접 토큰 발급 (비권장)**: 핸들러에서 바로 토큰을 발급하여 리다이렉트 URL에 담아 보내는 것은 간단해 보일 수 있지만, Refresh Token과 같이 민감한 정보를 URL에 노출시킬 위험이 있고, 토큰 발급 로직이 분산될 수 있습니다. Code 방식이 더 안전하고 깔끔한 아키텍처입니다.
- **`@Value("${oauth.redirect-uri}")`**: `application.yml` 이나 `application.properties` 파일에 프론트엔드의 OAuth 처리 완료 후 돌아갈 URL을 설정해두고 주입받아 사용합니다.

---

## SecurityConfig: 보안 설정의 집결지

Spring Security의 모든 설정을 한 곳에 모아 관리하는 `SecurityConfig` 클래스입니다. HTTP 요청에 대한 보안 규칙(어떤 URL에 접근을 허용하고, 어떤 URL은 인증이 필요한지 등), CORS 설정, CSRF 보호 비활성화, OAuth2 로그인 설정, 그리고 우리가 만든 `JwtRequestFilter`를 필터 체인에 통합하는 등의 핵심 작업을 수행합니다.

```java
package movlit.be.common.config;

@Configuration
@EnableWebSecurity // Spring Security 활성화
@RequiredArgsConstructor
public class SecurityConfig {

    @Value("${cors.allowed-origins}") // CORS 허용 출처 (application.yml 등에서 설정, e.g., http://localhost:3000)
    private String[] allowedOrigins;

    private final MyOAuth2MemberService myOAuth2MemberService; // OAuth2 로그인 시 사용자 정보 처리 로직
    private final JwtRequestFilter jwtRequestFilter; // JWT 토큰 검증 필터
    private final OAuth2AuthenticationSuccessHandler oAuth2AuthenticationSuccessHandler; // OAuth2 로그인 성공 후 처리 로직
    // private final AuthenticationService authenticationService; // 로그아웃 핸들러에서 사용 시 주입

    // SecurityFilterChain 빈을 정의하여 HTTP 보안 설정 구성
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

        http
            // 1. CORS 설정 (CorsConfigurationSource Bean 사용)
            .cors(Customizer.withDefaults())

            // 2. CSRF 보호 비활성화 (Stateless JWT 기반 API에서는 보통 비활성화)
            //    Session 기반이거나 페이지 렌더링 방식이면 활성화 필요
            .csrf(AbstractHttpConfigurer::disable)

            // 3. H2 콘솔 사용 시 frame 옵션 허용 (개발 환경용)
            .headers(headers -> headers.frameOptions(FrameOptionsConfig::sameOrigin)) // H2 console 사용시 sameOrigin 또는 disable

            // 4. HTTP 요청에 대한 인가(Authorization) 규칙 설정
            .authorizeHttpRequests(auth -> auth
                // 특정 경로/메서드에 대한 접근 허용 (permitAll)
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll() // Preflight 요청 허용
                .requestMatchers("/api/auth/**", "/oauth2/**", "/login/**").permitAll() // 인증 관련 엔드포인트
                .requestMatchers("/error", "/favicon.ico").permitAll() // 기본 에러 페이지 및 파비콘
                .requestMatchers("/swagger-ui/**", "/v3/api-docs/**").permitAll() // Swagger UI (필요시)
                .requestMatchers("/h2-console/**").permitAll() // H2 콘솔 (개발용)
                .requestMatchers(HttpMethod.GET, "/api/public/**").permitAll() // 예: 공개 API 경로
                // ... 기타 공개 경로 설정 ...

                // 나머지 모든 요청은 인증(Authentication) 필요
                .anyRequest().authenticated()
            )

            // 5. 기본 Form 로그인 방식 비활성화 (JWT 사용하므로)
            .formLogin(AbstractHttpConfigurer::disable)
            // 6. 기본 HTTP Basic 인증 방식 비활성화 (JWT 사용하므로)
            .httpBasic(AbstractHttpConfigurer::disable)

            // 7. 세션 관리 정책 설정 (STATELESS: 서버가 세션을 생성하거나 사용하지 않음 - JWT에 적합)
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

            // 8. 로그아웃 설정
            .logout(logout -> logout
                .logoutUrl("/api/auth/logout") // 로그아웃 처리 URL
                .permitAll() // 로그아웃 URL 접근은 누구나 가능
                .addLogoutHandler((request, response, authentication) -> {
                    // 로그아웃 시 추가 작업 (예: Blacklist 등록 등)
                    // SecurityContext에서 Authentication 객체 가져오기
                     String accessToken = request.getHeader("Authorization");
                     if (authentication != null && authentication.getPrincipal() instanceof UserDetails) {
                         String email = ((UserDetails) authentication.getPrincipal()).getUsername();
                         // AuthenticationService의 logout 메소드 호출 (주입 필요)
                         // authenticationService.logout(accessToken, email);
                         log.info("Logout handler executed for user: {}", email);
                     } else {
                         log.warn("Logout handler executed but no authenticated user found in context.");
                     }
                })
                .logoutSuccessHandler((request, response, authentication) -> {
                    // 로그아웃 성공 시 클라이언트에게 보낼 응답 설정
                    response.setStatus(HttpServletResponse.SC_OK); // 200 OK
                    response.setContentType("application/json;charset=UTF-8");
                    response.getWriter().write("{\"message\": \"Logout successful\"}");
                    log.info("Logout successful response sent.");
                })
                // .deleteCookies("refreshToken") // Refresh Token을 쿠키로 관리했다면 삭제
            )

            // 9. OAuth2 로그인 설정
            .oauth2Login(oauth -> oauth
                // Authorization Endpoint 설정 (생략 시 기본값 사용)
                // .authorizationEndpoint(endpoint -> endpoint.baseUri("/oauth2/authorization"))
                // Redirection Endpoint 설정 (생략 시 기본값 사용)
                // .redirectionEndpoint(endpoint -> endpoint.baseUri("/login/oauth2/code/*"))
                // 사용자 정보(User Info) 가져오는 Endpoint 및 처리 서비스 설정
                .userInfoEndpoint(userInfo -> userInfo
                    .userService(myOAuth2MemberService) // **핵심**: 소셜 로그인 성공 후 사용자 정보를 처리할 서비스 지정
                )
                // 로그인 성공 시 호출될 핸들러 지정
                .successHandler(oAuth2AuthenticationSuccessHandler) // **핵심**: 로그인 성공 후 토큰 발급/리다이렉트 로직
                // (선택적) 로그인 실패 시 핸들러 지정
                // .failureHandler(oAuth2AuthenticationFailureHandler)
            )

            // 10. 우리가 만든 JwtRequestFilter를 Spring Security 필터 체인에 추가
            //    UsernamePasswordAuthenticationFilter **앞에** 추가하여 JWT 인증을 먼저 시도하도록 함
            .addFilterBefore(jwtRequestFilter, UsernamePasswordAuthenticationFilter.class);
            // (선택적) 예외 처리 필터 추가 (e.g., 인증/인가 예외 공통 처리)
            // .addFilterBefore(exceptionHandlingFilter, JwtRequestFilter.class);

        return http.build();
    }

    // CORS 설정을 위한 Bean 정의
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        // 설정 파일에서 읽어온 허용 Origin 설정
        configuration.setAllowedOrigins(List.of(allowedOrigins));
        // 허용할 HTTP 메서드 설정 ("*" 대신 명시적으로 지정 권장)
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        // 허용할 요청 헤더 설정
        configuration.setAllowedHeaders(List.of("*")); // 또는 "Authorization", "Content-Type" 등 명시
        // 브라우저에게 노출할 응답 헤더 설정 (e.g., 커스텀 헤더)
        // configuration.setExposedHeaders(List.of("X-Custom-Header"));
        // 자격 증명(쿠키, 인증 헤더 등) 포함 요청 허용 여부
        configuration.setAllowCredentials(true);
        // Preflight 요청 결과를 캐시할 시간 (초 단위)
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        // 모든 경로("/**")에 대해 위 CORS 설정 적용
        source.registerCorsConfiguration("/**", configuration);
        log.info("CORS configuration registered for origins: {}", List.of(allowedOrigins));
        return source;
    }

    // PasswordEncoder 빈 등록 (비밀번호 암호화에 사용)
    @Bean
    public PasswordEncoder passwordEncoder() {
        // BCryptPasswordEncoder 사용 (강도 조절 가능)
        return new BCryptPasswordEncoder();
    }

    // AuthenticationManager 빈 등록 (AuthenticationService 등에서 주입받아 사용)
    // Spring Boot 3.x 에서는 AuthenticationConfiguration 통해 가져옴
    @Bean
    public AuthenticationManager authenticationManager(
        AuthenticationConfiguration authenticationConfiguration) throws Exception {
        return authenticationConfiguration.getAuthenticationManager();
    }
}
```

**주요 포인트 & 추가 설명**

- **`@EnableWebSecurity`**: Spring Security 설정을 활성화하는 어노테이션입니다.
- **`SecurityFilterChain` Bean**: HTTP 요청에 대한 보안 처리를 정의하는 핵심 빌더입니다. `HttpSecurity` 객체를 통해 체이닝 방식으로 설정을 구성합니다.
- **CORS (Cross-Origin Resource Sharing)**: 다른 도메인(Origin)의 프론트엔드 애플리케이션(예: `http://localhost:3000`)이 백엔드 API(`http://localhost:8080`)를 호출할 수 있도록 허용하는 설정입니다. `corsConfigurationSource()` Bean에서 허용할 Origin, HTTP 메서드, 헤더 등을 상세하게 정의합니다.
- **CSRF (Cross-Site Request Forgery)**: 사용자가 자신의 의지와 무관하게 공격자가 의도한 행위(수정, 삭제 등)를 특정 웹사이트에 요청하게 만드는 공격입니다. 상태를 유지하는(Stateful) 세션 기반 애플리케이션에서는 중요하지만, 상태가 없는(Stateless) JWT 토큰 기반 API에서는 토큰 자체가 인증 수단이므로 보통 비활성화합니다 (`.csrf(AbstractHttpConfigurer::disable)`).
- **`authorizeHttpRequests`**: URL 패턴과 HTTP 메서드별로 접근 권한을 설정합니다. `permitAll()`은 누구나 접근 가능, `authenticated()`는 인증된 사용자만 접근 가능, `hasRole("ADMIN")` 등 특정 권한을 요구할 수도 있습니다. **순서가 중요합니다!** 구체적인 경로 규칙을 먼저 정의하고, 가장 마지막에 `.anyRequest().authenticated()`를 두어 나머지 모든 요청은 인증이 필요하도록 설정하는 것이 일반적입니다.
- **`sessionManagement(SessionCreationPolicy.STATELESS)`**: JWT 기반 인증은 서버에 세션 상태를 저장하지 않으므로, `STATELESS` 정책을 사용하여 Spring Security가 세션을 생성하거나 사용하지 않도록 명시합니다.
- **`logout`**: 로그아웃 처리 URL, 로그아웃 핸들러(추가 작업 수행), 로그아웃 성공 핸들러(클라이언트 응답 정의) 등을 설정합니다. 여기에 Access Token 블랙리스트 등록 로직을 연동할 수 있습니다.
- **`oauth2Login`**: OAuth2 소셜 로그인을 활성화하고 관련 설정을 구성합니다.
  - `userInfoEndpoint().userService(myOAuth2MemberService)`: 소셜 서비스로부터 사용자 정보를 성공적으로 가져온 후, 해당 정보를 처리할 커스텀 서비스를 지정합니다. 여기서 우리 시스템의 회원 가입/조회/업데이트 로직이 수행됩니다.
  - `successHandler(oAuth2AuthenticationSuccessHandler)`: `userService` 처리까지 성공적으로 완료되었을 때 호출될 핸들러를 지정합니다. 여기서 임시 code 발급 및 프론트엔드 리다이렉트가 이루어집니다.
- **`addFilterBefore(jwtRequestFilter, UsernamePasswordAuthenticationFilter.class)`**: **매우 중요한 설정**입니다. 우리가 만든 `JwtRequestFilter`를 Spring Security의 기본 필터 중 하나인 `UsernamePasswordAuthenticationFilter` (폼 로그인 처리 필터) **앞에** 위치시킵니다. 이렇게 해야 ID/Password 로그인 방식보다 JWT 토큰 검증이 먼저 시도됩니다. 요청 헤더에 유효한 JWT가 있다면, `JwtRequestFilter`에서 인증 처리가 완료되고 뒤따르는 `UsernamePasswordAuthenticationFilter`는 실행될 필요가 없어집니다.
- **`PasswordEncoder`**: 사용자의 비밀번호를 안전하게 저장하기 위해 반드시 필요합니다. 회원가입 시 사용자가 입력한 비밀번호를 `passwordEncoder.encode()` 하여 DB에 저장하고, 로그인 시에는 사용자가 입력한 비밀번호와 DB에 저장된 인코딩된 비밀번호를 `passwordEncoder.matches()` 로 비교합니다. `BCryptPasswordEncoder`가 현재 널리 사용되는 강력한 해시 알고리즘입니다.
- **`AuthenticationManager` Bean**: `AuthenticationService`에서 ID/Password 인증을 위해 주입받아 사용합니다. Spring Boot 3.x부터는 `AuthenticationConfiguration`을 통해 얻어오는 것이 표준 방식입니다.

---

## 정리

- **핵심 흐름**:
  - 로그인 시: `AuthenticationService`가 `AuthenticationManager`를 통해 사용자 검증 -> 성공 시 JWT Access/Refresh Token 발급 -> Refresh Token은 서버 저장소(`RefreshTokenStorage`)에 저장.
  - API 요청 시: `JwtRequestFilter`가 요청 헤더의 Access Token 검증 (Blacklist 확인 포함) -> 유효하면 `SecurityContextHolder`에 인증 정보 등록.
  - Access Token 만료 시: 클라이언트는 Refresh Token으로 `AuthenticationService`의 토큰 갱신 API 호출 -> 서버는 Refresh Token 유효성 검증 (저장소 비교 포함) -> 성공 시 새 Access Token 발급.
  - 소셜 로그인 시: `SecurityConfig`의 `oauth2Login` 설정 -> `MyOAuth2MemberService`가 사용자 정보 처리 -> `OAuth2AuthenticationSuccessHandler`가 임시 `code` 발급 및 프론트 리다이렉트 -> 프론트가 `code`로 `AuthenticationService`의 토큰 교환 API 호출 -> 최종 JWT 토큰 발급.
  - 로그아웃 시: `AuthenticationService`가 Refresh Token 삭제 및 Access Token을 Blacklist(`RefreshTokenStorage`)에 등록.
