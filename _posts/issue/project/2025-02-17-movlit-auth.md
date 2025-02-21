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
last_modified_at: 2025-02-21
---

> [Movlit 프로젝트](https://github.com/venus-lion/movlit-plus)에 대한 설명입니다.

## 프로젝트 개요

1. **JWT 기반 인증**: `UsernamePasswordAuthenticationToken`과 JWT를 사용해 인증 로직을 수행.
2. **Refresh Token 발급**: Access Token 만료 시, 저장해둔 Refresh Token을 통해 새로운 Access Token 재발급.
3. **OAuth2 소셜 로그인**: Google, Kakao, Naver 등의 OAuth2 정보로 로그인.
4. **로그아웃/Blacklist**: 로그아웃 시 Access Token을 Blacklist에 등록해 만료 전에도 효력 상실 처리.

---

## JwtRequestFilter: JWT 검증 필터

`OncePerRequestFilter`를 상속받아 요청마다 JWT를 확인하고, 검증된 사용자 정보를 `SecurityContextHolder`에 등록합니다.

```java
package movlit.be.common.filter;

import io.jsonwebtoken.ExpiredJwtException;
import io.micrometer.common.lang.NonNullApi;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import movlit.be.auth.application.service.MyMemberDetailsService;
import movlit.be.common.util.JwtTokenUtil;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
@RequiredArgsConstructor
@Slf4j
public class JwtRequestFilter extends OncePerRequestFilter {

    private final JwtTokenUtil jwtTokenUtil;
    private final MyMemberDetailsService myMemberDetailsService;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain)
            throws ServletException, IOException {

        Optional<String> jwtOptional = extractJwtFromHeader(request);

        if (jwtOptional.isPresent()) {
            String jwt = jwtOptional.get();
            Optional<String> emailOptional = extractEmail(jwt, response);

            if (emailOptional.isEmpty()) {
                return; // 이미 에러로 응답 처리
            }

            String email = emailOptional.get();

            // SecurityContext에 인증 정보가 없으면 새로 설정
            if (SecurityContextHolder.getContext().getAuthentication() == null) {
                UserDetails userDetails = myMemberDetailsService.loadUserByUsername(email);

                if (!authenticateUser(userDetails, jwt, request, response)) {
                    return; // 잘못된 토큰 처리로 종료
                }
            }
        }

        chain.doFilter(request, response);
    }

    private Optional<String> extractJwtFromHeader(HttpServletRequest request) {
        String authorizationHeader = request.getHeader("Authorization");
        if (authorizationHeader != null && authorizationHeader.startsWith("Bearer ")) {
            return Optional.of(authorizationHeader.substring(7));
        }
        return Optional.empty();
    }

    private Optional<String> extractEmail(String jwt, HttpServletResponse response) throws IOException {
        try {
            return Optional.ofNullable(jwtTokenUtil.extractEmail(jwt));
        } catch (ExpiredJwtException e) {
            setUnauthorizedResponse(response, "Token Expired");
        } catch (Exception e) {
            setUnauthorizedResponse(response, "Invalid Token");
        }
        return Optional.empty();
    }

    private boolean authenticateUser(UserDetails userDetails,
                                     String jwt,
                                     HttpServletRequest request,
                                     HttpServletResponse response) throws IOException {
        try {
            if (jwtTokenUtil.validateToken(jwt, userDetails.getUsername())) {
                UsernamePasswordAuthenticationToken token =
                        new UsernamePasswordAuthenticationToken(
                                userDetails,
                                null,
                                userDetails.getAuthorities()
                        );
                token.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(token);
                return true;
            } else {
                setUnauthorizedResponse(response, "Invalid Token");
                return false;
            }
        } catch (ExpiredJwtException e) {
            setUnauthorizedResponse(response, "Token Expired");
            return false;
        }
    }

    private void setUnauthorizedResponse(HttpServletResponse response, String message) throws IOException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.getWriter().write(message);
    }

}
```

**주요 포인트**

- `Bearer `로 시작하는 **Authorization 헤더**를 추출하여 JWT를 얻음.
- 토큰 만료(`ExpiredJwtException`) 또는 기타 예외 발생 시 **401 Unauthorized** 처리.
- 토큰이 정상이라면 `UserDetailsService`를 통해 UserDetails를 조회 후, `SecurityContextHolder`에 `Authentication` 설정.

---

## AuthenticationService: 인증 처리 로직

일반적인 ID/Password 인증 시, `AuthenticationManager`를 사용하여 검증하고 JWT 토큰을 발급합니다.

```java
package movlit.be.auth.application.service;

import java.util.Map;
import java.util.Objects;
import lombok.RequiredArgsConstructor;
import movlit.be.common.exception.MemberNotFoundException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Service;
import movlit.be.auth.domain.repository.AuthCodeStorage;
import movlit.be.auth.domain.repository.RefreshTokenStorage;
import movlit.be.common.filter.dto.AuthenticationRequest;
import movlit.be.common.filter.dto.AuthenticationResponse;
import movlit.be.common.util.JwtTokenUtil;

@Service
@RequiredArgsConstructor
public class AuthenticationService {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenUtil jwtTokenUtil;
    private final AuthCodeStorage authCodeStorage;
    private final RefreshTokenStorage refreshTokenStorage;

    public AuthenticationResponse authenticate(AuthenticationRequest request) throws Exception {
        String email = request.getEmail();
        String password = request.getPassword();

        try {
            // 인증 매니저를 통해 Spring Security의 AuthenticationProvider가
            // 내부적으로 DB 조회/패스워드 대조 등의 과정을 수행함
            authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(email, password));
        } catch (BadCredentialsException e) {
            throw new MemberNotFoundException(); // 예외 처리
        }

        // 인증 성공 시, Access & Refresh 토큰 생성
        String accessToken = jwtTokenUtil.generateAccessToken(email);
        String refreshToken = jwtTokenUtil.generateRefreshToken(email);
        return new AuthenticationResponse(accessToken, refreshToken);
    }

    public ResponseEntity<?> refreshToken(String refreshToken) {
        String email = jwtTokenUtil.extractEmail(refreshToken);

        // refresh 토큰 자체 유효성 검증
        if (!jwtTokenUtil.validateToken(refreshToken, email)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid refresh Token");
        }

        // 유효하다면, 새 AccessToken만 발급
        String newAccessToken = jwtTokenUtil.generateAccessToken(email);
        return ResponseEntity.ok(new AuthenticationResponse(newAccessToken, refreshToken));
    }

    // OAuth2 소셜로그인 시, code 파라미터로 AccessToken 교환
    public ResponseEntity<?> exchangeToken(String code) {
        String email = authCodeStorage.fetchEmailForCode(code);

        if (Objects.isNull(email)) {
            return ResponseEntity.badRequest().body(Map.of("error", "잘못된 code입니다. code = " + code));
        }

        String accessToken = jwtTokenUtil.generateAccessToken(email);
        String refreshToken = jwtTokenUtil.generateRefreshToken(email);

        refreshTokenStorage.saveRefreshToken(email, refreshToken);
        authCodeStorage.removeCode(code);

        return ResponseEntity.ok(new AuthenticationResponse(accessToken, refreshToken));
    }

}
```

**주요 포인트**

- `AuthenticationManager` 통해 Spring Security의 `AuthenticationProvider`가 사용자 검증 로직을 수행.
- 인증 성공 시 JWT발급(`accessToken`, `refreshToken`).
- 만료된 Access Token은 `refreshToken()` 메서드에서 새 Access Token으로 갱신.

---

## Refresh Token Storage: `ConcurrentRefreshTokenStorage`

Refresh Token을 **인메모리**에 저장하고, 사용자가 로그아웃 하거나 만료가 필요한 경우 Blacklist에 추가하는 로직을 예시로 보여줍니다.

```java
package movlit.be.auth.infra.persistence;

import java.util.concurrent.ConcurrentHashMap;
import lombok.RequiredArgsConstructor;
import movlit.be.auth.domain.repository.RefreshTokenStorage;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ConcurrentRefreshTokenStorage implements RefreshTokenStorage {

    private final ConcurrentHashMap<String, String> refreshTokens = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, Long> blacklist = new ConcurrentHashMap<>();

    @Override
    public void saveRefreshToken(String email, String refreshToken) {
        refreshTokens.put(email, refreshToken);
    }

    @Override
    public String findByToken(String email) {
        return refreshTokens.get(email);
    }

    @Override
    public void addBlacklist(String token, long exp) {
        blacklist.put(token, exp);
    }

    @Override
    public boolean isBlacklist(String token) {
        return blacklist.containsKey(token);
    }

    @Override
    public void deleteByToken(String email) {
        refreshTokens.remove(email);
    }

}
```

**주요 포인트**

- `ConcurrentHashMap`으로 단순히 이메일 ↔ Refresh Token을 맵핑.
- 로그아웃 처리 시 `addBlacklist()`로 Access Token 만료 전에도 유효하지 않도록 처리 가능.
- 실제 운영 환경에서는 Redis 등의 영속화 스토어를 사용하기도 함.

---

## OAuth2 연동 구조

소셜 로그인의 과정에서 `OAuth2AuthenticationSuccessHandler`를 사용하여, 인증 성공 후 **`code`**를 발급하고, **프론트엔드로 리다이렉트**하는 예시입니다.

```java
package movlit.be.auth.application.service;// OAuth2AuthenticationSuccessHandler.java

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import movlit.be.auth.domain.repository.AuthCodeStorage;
import movlit.be.common.util.IdGenerator;
import movlit.be.common.util.JwtTokenUtil;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

@Component
@RequiredArgsConstructor
@Slf4j
public class OAuth2AuthenticationSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final AuthCodeStorage authCodeStorage;
    private final JwtTokenUtil jwtTokenUtil;

    @Value("${share.url}")
    private String url;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication)
            throws IOException {

        // OAuth2User로부터 email 정보를 가져옴
        MyMemberDetails oAuth2User = (MyMemberDetails) authentication.getPrincipal();
        String email = oAuth2User.getMember().getEmail();

        // 자체적으로 code 발급 후 저장
        String code = IdGenerator.generate();
        authCodeStorage.saveCode(code, email);

        // 임의로 Access Token을 바로 발급해서 Header에 넣어주는 예시
        String accessToken = jwtTokenUtil.generateAccessToken(email);
        response.setHeader("Authorization", "Bearer " + accessToken);

        // code를 프론트엔드로 전달하기 위해 리다이렉트 URL 구성
        String targetUrl = UriComponentsBuilder.fromUriString(url + "/oauth/callback")
                .queryParam("code", code)
                .build().toUriString();

        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }

}
```

**주요 포인트**

- 소셜 로그인 성공 시 추가 정보(예: 닉네임, 생년월일) 등을 가져와야 할 경우 `OAuth2UserService`에서 처리.
- `onAuthenticationSuccess()` 내부에서 `authCodeStorage.saveCode(code, email)` 형태로 임시 발급 코드를 저장.
- 프론트엔드가 `code`를 받으면 다시 백엔드의 `/api/token`에 요청하여 최종적으로 JWT 발급 가능.

---

## SecurityConfig: 핵심 보안 설정

스프링 시큐리티 설정의 핵심은 `SecurityFilterChain` 구성입니다. `JwtRequestFilter`를 시큐리티 필터 체인에서 `UsernamePasswordAuthenticationFilter` 앞단에 등록합니다.

```java
package movlit.be.common.config;

import jakarta.servlet.http.HttpServletResponse;
import java.util.Arrays;
import java.util.List;
import lombok.RequiredArgsConstructor;
import movlit.be.auth.application.service.MyOAuth2MemberService;
import movlit.be.auth.application.service.OAuth2AuthenticationSuccessHandler;
import movlit.be.common.filter.JwtRequestFilter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.annotation.web.configurers.HeadersConfigurer.FrameOptionsConfig;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    @Value("${share.url}")
    private String url; // 배포 환경의 프론트엔드 URL

    private final MyOAuth2MemberService myOAuth2MemberService;
    private final JwtRequestFilter jwtRequestFilter;
    private final OAuth2AuthenticationSuccessHandler oAuth2AuthenticationSuccessHandler;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http,
                                                   CorsConfigurationSource corsConfigurationSource)
            throws Exception {

        http
            .cors(Customizer.withDefaults())
            .csrf(AbstractHttpConfigurer::disable)
            .headers(headers -> headers.frameOptions(FrameOptionsConfig::disable))  // H2 콘솔 사용 시
            .authorizeHttpRequests(auth -> auth
                // permitAll() URL 및 메서드 예시
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                .requestMatchers("/testBook/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/books/{bookId}/detail").permitAll()
                // ... 기타 공개 경로 설정 ...
                .anyRequest().authenticated() // 나머지는 인증 필요
            )
            .formLogin(AbstractHttpConfigurer::disable)
            .logout(logout -> logout
                .logoutUrl("/api/members/logout")
                .permitAll()
                .logoutSuccessHandler((request, response, authentication) ->
                    response.setStatus(HttpServletResponse.SC_NO_CONTENT)
                )
                .deleteCookies("refreshToken")
            )
            .oauth2Login(oauth -> oauth
                .userInfoEndpoint(userInfo -> userInfo.userService(myOAuth2MemberService))
                .successHandler(oAuth2AuthenticationSuccessHandler)
            )
            // JWT 필터를 UsernamePasswordAuthenticationFilter 앞에 추가
            .addFilterBefore(jwtRequestFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        // 배포 주소 허용
        configuration.setAllowedOrigins(List.of(url));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    // Authentication Manager 빈 등록
    @Bean
    public AuthenticationManager authenticationManager(
        AuthenticationConfiguration authenticationConfiguration) throws Exception {
        return authenticationConfiguration.getAuthenticationManager();
    }

}
```

**주요 포인트**

- `HttpSecurity` 빌더를 통해 **CORS** 허용, **CSRF 비활성화**, **URL별 권한** 설정.
- OAuth2 로그인을 사용 시, `oauth2Login().userInfoEndpoint().userService(...)` 설정.
- `jwtRequestFilter`를 시큐리티 체인에 **추가**하여 Controller 진입 전 JWT 검사 수행.

---

## 정리

- **JWT + Refresh Token**을 통한 인증 구조와 **소셜 로그인**까지 종합적으로 다룬 예시입니다.
- 실무에서는 인메모리 대신 **Redis**나 DB를 사용하여 Token 관리 및 블랙리스트를 운영하며, 보안 강화를 위해 HTTPS, 쿠키 기반 세션, HttpOnly 쿠키, OAuth2 PKCE 등을 함께 고려할 수 있습니다.
- Spring Boot 3.x에서 `jakarta` 패키지를 사용하는 점, `SecurityFilterChain` 기반의 시큐리티 설정 등이 2.x와 차별점입니다.

---

## 전체 소스 코드

> 아래는 본 글에서 언급된 주요 파일들의 전체 코드입니다.

### 1. `JwtRequestFilter.java`

```java
package movlit.be.common.filter;

import io.jsonwebtoken.ExpiredJwtException;
import io.micrometer.common.lang.NonNullApi;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import movlit.be.auth.application.service.MyMemberDetailsService;
import movlit.be.common.util.JwtTokenUtil;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
@RequiredArgsConstructor
@Slf4j
public class JwtRequestFilter extends OncePerRequestFilter {

    private final JwtTokenUtil jwtTokenUtil;
    private final MyMemberDetailsService myMemberDetailsService;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain)
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

    private Optional<String> extractJwtFromHeader(HttpServletRequest request) {
        String authorizationHeader = request.getHeader("Authorization");
        if (authorizationHeader != null && authorizationHeader.startsWith("Bearer ")) {
            return Optional.of(authorizationHeader.substring(7));
        }

        return Optional.empty();
    }

    private Optional<String> extractEmail(String jwt, HttpServletResponse response) throws IOException {
        try {
            return Optional.ofNullable(jwtTokenUtil.extractEmail(jwt));
        } catch (ExpiredJwtException e) {
            setUnauthorizedResponse(response, "Token Expired");
        } catch (Exception e) {
            setUnauthorizedResponse(response, "Invalid Token");
        }

        return Optional.empty();
    }

    private boolean authenticateUser(UserDetails userDetails, String jwt,
                                     HttpServletRequest request, HttpServletResponse response)
                                     throws IOException {
        try {
            if (jwtTokenUtil.validateToken(jwt, userDetails.getUsername())) {
                UsernamePasswordAuthenticationToken token =
                    new UsernamePasswordAuthenticationToken(
                        userDetails,
                        null,
                        userDetails.getAuthorities()
                    );
                token.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(token);
                return true;
            } else {
                setUnauthorizedResponse(response, "Invalid Token");
                return false;
            }
        } catch (ExpiredJwtException e) {
            setUnauthorizedResponse(response, "Token Expired");
            return false;
        }
    }

    private void setUnauthorizedResponse(HttpServletResponse response, String message) throws IOException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.getWriter().write(message);
    }

}
```

### 2. `AuthenticationService.java`

```java
package movlit.be.auth.application.service;

import java.util.Map;
import java.util.Objects;
import lombok.RequiredArgsConstructor;
import movlit.be.common.exception.MemberNotFoundException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Service;
import movlit.be.auth.domain.repository.AuthCodeStorage;
import movlit.be.auth.domain.repository.RefreshTokenStorage;
import movlit.be.common.filter.dto.AuthenticationRequest;
import movlit.be.common.filter.dto.AuthenticationResponse;
import movlit.be.common.util.JwtTokenUtil;

@Service
@RequiredArgsConstructor
public class AuthenticationService {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenUtil jwtTokenUtil;
    private final AuthCodeStorage authCodeStorage;
    private final RefreshTokenStorage refreshTokenStorage;

    public AuthenticationResponse authenticate(AuthenticationRequest request) throws Exception {
        String email = request.getEmail();
        String password = request.getPassword();

        try {
            authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, password)
            );
        } catch (BadCredentialsException e) {
            throw new MemberNotFoundException();
        }

        String accessToken = jwtTokenUtil.generateAccessToken(email);
        String refreshToken = jwtTokenUtil.generateRefreshToken(email);
        return new AuthenticationResponse(accessToken, refreshToken);
    }

    public ResponseEntity<?> refreshToken(String refreshToken) {
        String email = jwtTokenUtil.extractEmail(refreshToken);

        if (!jwtTokenUtil.validateToken(refreshToken, email)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid refresh Token");
        }

        String newAccessToken = jwtTokenUtil.generateAccessToken(email);
        return ResponseEntity.ok(new AuthenticationResponse(newAccessToken, refreshToken));
    }

    public ResponseEntity<?> exchangeToken(String code) {
        String email = authCodeStorage.fetchEmailForCode(code);

        if (Objects.isNull(email)) {
            return ResponseEntity.badRequest().body(Map.of("error", "잘못된 code입니다. code = " + code));
        }

        String accessToken = jwtTokenUtil.generateAccessToken(email);
        String refreshToken = jwtTokenUtil.generateRefreshToken(email);

        refreshTokenStorage.saveRefreshToken(email, refreshToken);
        authCodeStorage.removeCode(code);

        return ResponseEntity.ok(new AuthenticationResponse(accessToken, refreshToken));
    }

}
```

### 3. `ConcurrentRefreshTokenStorage.java`

```java
package movlit.be.auth.infra.persistence;

import java.util.concurrent.ConcurrentHashMap;
import lombok.RequiredArgsConstructor;
import movlit.be.auth.domain.repository.RefreshTokenStorage;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ConcurrentRefreshTokenStorage implements RefreshTokenStorage {

    private final ConcurrentHashMap<String, String> refreshTokens = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, Long> blacklist = new ConcurrentHashMap<>();

    @Override
    public void saveRefreshToken(String email, String refreshToken) {
        refreshTokens.put(email, refreshToken);
    }

    @Override
    public String findByToken(String email) {
        return refreshTokens.get(email);
    }

    @Override
    public void addBlacklist(String token, long exp) {
        blacklist.put(token, exp);
    }

    @Override
    public boolean isBlacklist(String token) {
        return blacklist.containsKey(token);
    }

    @Override
    public void deleteByToken(String email) {
        refreshTokens.remove(email);
    }

}
```

### 4. `OAuth2AuthenticationSuccessHandler.java`

```java
package movlit.be.auth.application.service;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import movlit.be.auth.domain.repository.AuthCodeStorage;
import movlit.be.common.util.IdGenerator;
import movlit.be.common.util.JwtTokenUtil;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

@Component
@RequiredArgsConstructor
@Slf4j
public class OAuth2AuthenticationSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final AuthCodeStorage authCodeStorage;
    private final JwtTokenUtil jwtTokenUtil;

    @Value("${share.url}")
    private String url;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication)
            throws IOException {

        MyMemberDetails oAuth2User = (MyMemberDetails) authentication.getPrincipal();
        String email = oAuth2User.getMember().getEmail();

        String code = IdGenerator.generate();
        authCodeStorage.saveCode(code, email);

        // 헤더에 Access Token
        String accessToken = jwtTokenUtil.generateAccessToken(email);
        response.setHeader("Authorization", "Bearer " + accessToken);

        // 프론트엔드로 code를 전달하기 위해 Redirect
        String targetUrl = UriComponentsBuilder.fromUriString(url + "/oauth/callback")
                .queryParam("code", code)
                .build().toUriString();

        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }
}
```

### 5. `SecurityConfig.java`

```java
package movlit.be.common.config;

import jakarta.servlet.http.HttpServletResponse;
import java.util.Arrays;
import java.util.List;
import lombok.RequiredArgsConstructor;
import movlit.be.auth.application.service.MyOAuth2MemberService;
import movlit.be.auth.application.service.OAuth2AuthenticationSuccessHandler;
import movlit.be.common.filter.JwtRequestFilter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.annotation.web.configurers.HeadersConfigurer.FrameOptionsConfig;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    @Value("${share.url}")
    private String url;

    private final MyOAuth2MemberService myOAuth2MemberService;
    private final JwtRequestFilter jwtRequestFilter;
    private final OAuth2AuthenticationSuccessHandler oAuth2AuthenticationSuccessHandler;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http,
                                                   CorsConfigurationSource corsConfigurationSource)
            throws Exception {

        http
            .cors(Customizer.withDefaults())
            .csrf(AbstractHttpConfigurer::disable)
            .headers(x -> x.frameOptions(FrameOptionsConfig::disable))
            .authorizeHttpRequests(requests -> requests
                    .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                    .requestMatchers("/testBook/**").permitAll()
                    // ... 기타 URL 패턴 ...
                    .anyRequest().authenticated()
            )
            .formLogin(AbstractHttpConfigurer::disable)
            .logout(logout -> logout
                .logoutUrl("/api/members/logout")
                .permitAll()
                .logoutSuccessHandler(((request, response, authentication) ->
                        response.setStatus(HttpServletResponse.SC_NO_CONTENT)
                ))
                .deleteCookies("refreshToken")
            )
            .oauth2Login(auth -> auth
                .userInfoEndpoint(userInfoEndpointConfig ->
                    userInfoEndpointConfig.userService(myOAuth2MemberService)
                )
                .successHandler(oAuth2AuthenticationSuccessHandler)
            )
            .addFilterBefore(jwtRequestFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of(url));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source =
            new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    // Authentication Manager 빈 등록
    @Bean
    public AuthenticationManager authenticationManager(
        AuthenticationConfiguration authenticationConfiguration) throws Exception {
        return authenticationConfiguration.getAuthenticationManager();
    }
}
```

그 외 `MyMemberDetailsService`, `MyOAuth2MemberService`, `MyMemberDetails`, `JwtTokenUtil`, DTO 클래스 등은 **생략**했지만, 위 구조만으로도 전반적인 JWT 인증 흐름과 OAuth2 소셜 로그인 연동이 어떻게 동작하는지 파악하실 수 있습니다.

> **참고**: OAuth2 연동 로직을 위해 `spring-boot-starter-oauth2-client`가 추가되어 있어야 합니다.

---

**이상으로 Spring Boot 3.4 & Spring Security를 사용한 JWT 인증 + OAuth2 소셜 로그인 구현 예시였습니다.**

- 인증/인가 흐름, 필터 사용법, 커스텀 로직 등의 큰 그림을 잡을 수 있습니다.
- 필요에 따라 세부적인 엔티티/클래스 설계, JWT 유효기간 및 보안 이슈, 소셜 프로필과 회원 매핑 방식 등을 확장해서 사용하시면 됩니다.
