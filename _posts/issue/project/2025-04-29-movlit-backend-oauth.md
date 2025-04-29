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
last_modified_at: 2025-04-29
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
    *   `MyOAuth2MemberService`는 조회된 사용자 정보(이메일, 프로필 사진 등)를 바탕으로 우리 서비스의 DB에서 사용자를 찾거나, 없다면 새로 가입시킵니다.
    *   인증된 사용자 정보를 담은 `MyMemberDetails` (커스텀 `OAuth2User` 또는 `UserDetails` 구현체) 객체를 생성하여 Spring Security 컨텍스트에 저장합니다.
6.  **인증 성공 후 처리 (Custom AuthenticationSuccessHandler)**: `OAuth2AuthenticationSuccessHandler`가 실행됩니다.
    *   이 핸들러는 우리 서비스 내부용 **임시 `code`**를 생성합니다. (프론트엔드 글에서 언급된 `authorization_code`와는 다른, 우리 시스템 내에서 사용할 코드입니다.)
    *   이 임시 `code`와 함께 프론트엔드의 OAuth 콜백 페이지 (`/oauth/callback`)로 사용자를 리디렉션 시킵니다. (예: `https://your-frontend.com/oauth/callback?code=backend_generated_temp_code`)
    *   (선택적으로, 이때 백엔드에서 즉시 사용할 수 있는 Access Token을 응답 헤더에 포함시켜 전달할 수도 있습니다. Movlit 코드에서는 `Authorization` 헤더에 JWT Access Token을 설정합니다.)
7.  **프론트엔드의 토큰 요청**: 프론트엔드의 `OAuthCallback.jsx` 컴포넌트는 리디렉션 시 URL 쿼리 파라미터로 받은 **임시 `code`**를 백엔드의 `/token` 엔드포인트로 전송합니다.
8.  **최종 토큰 발급 (백엔드 `/token` 엔드포인트)**:
    *   백엔드는 전달받은 **임시 `code`**를 검증합니다 (예: `AuthCodeStorage`를 통해).
    *   검증이 성공하면, 해당 사용자에 대한 우리 서비스의 `Access Token`과 `Refresh Token` (JWT 기반)을 생성하여 프론트엔드에 응답으로 전달합니다.
9.  **프론트엔드의 토큰 저장**: 프론트엔드는 이 토큰들을 저장하고 이후 API 요청에 사용합니다.

## Spring Security 설정 (`SecurityConfig.java`)

Spring Security 설정을 통해 OAuth 2.0 로그인 과정을 구성합니다.

```java
// SecurityConfig.java
package movlit.be.common.config;

import jakarta.servlet.http.HttpServletResponse;
import java.util.Arrays;
import java.util.List;
import lombok.RequiredArgsConstructor;
import movlit.be.auth.application.service.MyOAuth2MemberService; // 사용자 정보 처리 서비스
import movlit.be.auth.application.service.OAuth2AuthenticationSuccessHandler; // 인증 성공 후 처리 핸들러
import movlit.be.common.filter.JwtRequestFilter; // JWT 인증 필터
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

    @Value("${share.url}") // 프론트엔드 애플리케이션의 기본 URL
    private String url;

    private final MyOAuth2MemberService myOAuth2MemberService;
    private final JwtRequestFilter jwtRequestFilter;
    private final OAuth2AuthenticationSuccessHandler oAuth2AuthenticationSuccessHandler;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http, CorsConfigurationSource corsConfigurationSource)
            throws Exception {
        http
                .cors(Customizer.withDefaults()) // CORS 설정 적용
                .csrf(AbstractHttpConfigurer::disable) // CSRF 보호 비활성화 (Stateless JWT 사용 시)
                .headers(x -> x.frameOptions(FrameOptionsConfig::disable)) // H2 콘솔 사용 위한 설정
                .authorizeHttpRequests(requests -> requests
                        // ... (permitAll() 경로 설정들) ...
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll() // OPTIONS 요청 허용 (CORS preflight)
                        .requestMatchers("/api/members/login", "/token", "/refresh").permitAll() // 로그인, 토큰 관련 엔드포인트
                        .requestMatchers("/oauth2/**", "/login/oauth2/**").permitAll() // OAuth 관련 경로
                        // ... (기타 public 경로들) ...
                        .anyRequest().authenticated() // 나머지 요청은 인증 필요
                )
                .formLogin(AbstractHttpConfigurer::disable) // 기본 폼 로그인 비활성화
                .logout(logout -> logout // 로그아웃 설정
                        .logoutUrl("/api/members/logout")
                        .permitAll()
                        .logoutSuccessHandler(((request, response, authentication) -> response.setStatus(
                                HttpServletResponse.SC_NO_CONTENT)))
                        .deleteCookies("refreshToken") // refreshToken 쿠키 삭제
                )
                .oauth2Login(auth -> auth // OAuth2 로그인 설정
                        .userInfoEndpoint( // 사용자 정보 가져오는 설정
                                userInfoEndpointConfig -> userInfoEndpointConfig.userService(myOAuth2MemberService) // 커스텀 서비스 지정
                        )
                        .successHandler(oAuth2AuthenticationSuccessHandler) // 인증 성공 시 커스텀 핸들러 지정
                        // OAuth 제공자로부터 리디렉션될 기본 URI는 /login/oauth2/code/*
                        // 별도 설정 시: .redirectionEndpoint(redirection -> redirection.baseUri("/custom-oauth2-callback/*"))
                )
                .addFilterBefore(jwtRequestFilter, UsernamePasswordAuthenticationFilter.class); // JWT 필터 추가

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of(url)); // 프론트엔드 URL 허용
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*")); // 모든 헤더 허용
        configuration.setAllowCredentials(true); // 자격 증명(쿠키 등) 허용

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authenticationConfiguration)
            throws Exception {
        return authenticationConfiguration.getAuthenticationManager();
    }
}
```

-   **`cors(Customizer.withDefaults())`**: `corsConfigurationSource` Bean을 사용하여 CORS 설정을 적용합니다.
-   **`authorizeHttpRequests`**: 특정 경로에 대한 접근 권한을 설정합니다.
    -   `/oauth2/**`, `/login/oauth2/**`: Spring Security가 OAuth2 흐름을 처리하기 위해 사용하는 내부 경로들입니다.
    -   `/api/members/login`, `/token`, `/refresh`: 프론트엔드가 직접 호출하는 로그인 및 토큰 관련 엔드포인트입니다. (주의: `/api/members/login`은 소셜 로그인이 아닌 일반 로그인일 수 있으며, OAuth2에서는 `/token`이 중요합니다.)
-   **`oauth2Login()`**: OAuth2 로그인을 활성화하고 세부 설정을 구성합니다.
    -   `userInfoEndpoint().userService(myOAuth2MemberService)`: OAuth 제공자로부터 사용자 정보를 가져온 후, 이를 처리할 커스텀 `OAuth2UserService`인 `MyOAuth2MemberService`를 지정합니다.
    -   `successHandler(oAuth2AuthenticationSuccessHandler)`: OAuth2 인증이 성공적으로 완료된 후 실행될 `OAuth2AuthenticationSuccessHandler`를 지정합니다. 이 핸들러에서 프론트엔드로의 최종 리디렉션 및 임시 코드 생성을 담당합니다.
-   **`addFilterBefore(jwtRequestFilter, UsernamePasswordAuthenticationFilter.class)`**: 모든 요청에 대해 JWT 토큰을 검증하는 `JwtRequestFilter`를 `UsernamePasswordAuthenticationFilter`보다 먼저 실행되도록 추가합니다.
-   **`corsConfigurationSource()`**: 프론트엔드 애플리케이션(`share.url`에 지정된 주소)과의 CORS 통신을 허용하도록 설정합니다. `allowedOrigins`, `allowedMethods`, `allowedHeaders`, `allowCredentials` 등을 설정합니다.

## 사용자 정보 처리 (`MyOAuth2MemberService.java`)

OAuth 제공자로부터 사용자 정보를 받아와 우리 서비스의 사용자로 처리(조회 또는 신규 등록)하는 역할을 합니다.

```java
// MyOAuth2MemberService.java
package movlit.be.auth.application.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import movlit.be.common.exception.MemberNotFoundException;
import movlit.be.common.util.OAuth2UserInfoFactory; // OAuth 제공자별 정보 파싱
import movlit.be.member.application.service.MemberReadService; // 회원 조회 서비스
import movlit.be.member.application.service.MemberWriteService; // 회원 가입/수정 서비스
import movlit.be.member.domain.Member;
import movlit.be.member.presentation.dto.request.MemberRegisterOAuth2Request; // OAuth2용 회원가입 DTO
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class MyOAuth2MemberService extends DefaultOAuth2UserService {

    private final MemberReadService memberReadService;
    private final MemberWriteService memberWriteService;
    private final BCryptPasswordEncoder bCryptPasswordEncoder; // 비밀번호 암호화 (소셜 로그인은 임의 값 사용)

    @Override
    public OAuth2User loadUser(OAuth2UserRequest memberRequest) {
        // 1. OAuth 제공자로부터 사용자 정보 로드
        OAuth2User oAuth2User = super.loadUser(memberRequest);

        // 2. OAuth 제공자 이름 (e.g., "google", "kakao")
        String provider = memberRequest.getClientRegistration().getRegistrationId();

        // 3. OAuth2UserInfoFactory를 사용하여 제공자별로 사용자 정보 추출
        OAuth2UserInfo oAuth2UserInfo = OAuth2UserInfoFactory.getOAuth2UserInfo(provider, oAuth2User.getAttributes());
        String email = oAuth2UserInfo.getEmail();

        Member member;
        try {
            // 4. 이메일로 기존 회원 조회
            member = memberReadService.fetchMemberByEmail(email);
            // TODO: 기존 회원이지만 다른 provider로 가입한 경우 등에 대한 처리 추가 가능
        } catch (MemberNotFoundException e) {
            // 5. 회원이 없으면 새로 가입
            MemberRegisterOAuth2Request request = makeRequest(email, oAuth2UserInfo);
            member = memberWriteService.registerOAuth2Member(request);
            log.info("신규 OAuth2 회원 가입: {}", email);
        }

        // 6. Spring Security가 관리하는 Principal 객체 (MyMemberDetails) 반환
        return new MyMemberDetails(member, oAuth2User.getAttributes());
    }

    private MemberRegisterOAuth2Request makeRequest(String email, OAuth2UserInfo oAuth2UserInfo) {
        String profileUrl = oAuth2UserInfo.getProfileImageUrl();
        String dob = oAuth2UserInfo.getDob(); // 생년월일
        // 소셜 로그인의 경우, 실제 비밀번호를 사용하지 않으므로 임의의 값을 암호화하여 저장
        String hashedPwd = bCryptPasswordEncoder.encode("Social Login Provider Password");
        return new MemberRegisterOAuth2Request(email, hashedPwd, profileUrl, dob);
    }
}
```

-   `DefaultOAuth2UserService`를 상속받아 `loadUser` 메소드를 오버라이드합니다.
-   `super.loadUser(memberRequest)`를 호출하여 Spring Security가 OAuth 제공자로부터 사용자 정보를 가져오도록 합니다.
-   `OAuth2UserInfoFactory` (직접 구현해야 하는 유틸리티 클래스)를 사용하여 Google, Kakao, Naver 등 다양한 제공자로부터 반환되는 사용자 정보 형식을 표준화하여 이메일, 프로필 URL 등을 추출합니다.
-   추출된 이메일로 `MemberReadService`를 통해 기존 사용자인지 확인합니다.
-   사용자가 존재하지 않으면 `MemberWriteService`를 통해 `MemberRegisterOAuth2Request` DTO를 사용하여 새 사용자를 등록합니다. 소셜 로그인 사용자는 실제 비밀번호가 없으므로, 임의의 문자열을 `BCryptPasswordEncoder`로 암호화하여 저장합니다.
-   최종적으로 `MyMemberDetails` 객체(Spring Security의 `UserDetails`와 `OAuth2User`를 함께 구현한 커스텀 객체)를 반환하여 인증 주체(Principal)로 사용됩니다.

## 인증 성공 후 처리 및 프론트엔드 리디렉션 (`OAuth2AuthenticationSuccessHandler.java`)

OAuth2 인증이 성공적으로 완료되면, 이 핸들러가 실행되어 프론트엔드로 특정 정보를 포함하여 리디렉션합니다.

```java
// OAuth2AuthenticationSuccessHandler.java
package movlit.be.auth.application.service;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import movlit.be.auth.domain.repository.AuthCodeStorage; // 임시 코드 저장소 (예: Redis 기반)
import movlit.be.common.util.IdGenerator; // 임시 코드 생성 유틸리티
import movlit.be.common.util.JwtTokenUtil; // JWT 토큰 생성 유틸리티
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

@Component
@RequiredArgsConstructor
@Slf4j
public class OAuth2AuthenticationSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final AuthCodeStorage authCodeStorage; // 임시 코드 저장/조회
    private final JwtTokenUtil jwtTokenUtil;       // JWT 생성

    @Value("${share.url}") // 프론트엔드 애플리케이션의 기본 URL (e.g., http://localhost:3000)
    private String frontendBaseUrl;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                        Authentication authentication) throws IOException {

        // 1. 인증된 사용자 정보 가져오기
        MyMemberDetails oAuth2User = (MyMemberDetails) authentication.getPrincipal();
        String email = oAuth2User.getMember().getEmail(); // 사용자의 이메일

        // 2. 프론트엔드에 전달할 임시 코드 생성
        // 이 코드는 프론트엔드가 /token 엔드포인트 호출 시 사용
        String tempCode = IdGenerator.generate(); // 랜덤 문자열 생성
        authCodeStorage.saveCode(tempCode, email); // 임시 코드를 이메일과 매핑하여 저장 (유효 시간 설정 필요)
        log.info("OAuth2 인증 성공. 사용자: {}, 발급된 임시 코드: {}", email, tempCode);

        // (선택 사항) 초기 Access Token을 여기서 발급하여 헤더에 넣어줄 수 있음
        // 프론트엔드 글에서는 /token 엔드포인트를 통해 토큰을 받는 것을 기준으로 설명했으므로,
        // 여기서는 해당 로직을 주석 처리하거나, /token 응답과 일관성 있게 관리해야 함.
        // String accessToken = jwtTokenUtil.generateAccessToken(email);
        // response.setHeader("Authorization", "Bearer " + accessToken);

        // 3. 프론트엔드의 OAuth 콜백 URL로 리디렉션
        String targetUrl = UriComponentsBuilder.fromUriString(frontendBaseUrl + "/oauth/callback") // 프론트엔드 콜백 경로
                .queryParam("code", tempCode) // 생성한 임시 코드를 쿼리 파라미터로 전달
                .build().toUriString();

        log.info("프론트엔드 리디렉션 URL: {}", targetUrl);
        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }
}
```

-   `SimpleUrlAuthenticationSuccessHandler`를 상속합니다.
-   인증된 사용자(`MyMemberDetails`)로부터 이메일 등의 정보를 가져옵니다.
-   **임시 코드 (`tempCode`) 생성**: `IdGenerator`를 사용하여 고유한 임시 코드를 생성하고, `AuthCodeStorage` (예: Redis)에 사용자의 이메일과 함께 잠시 저장합니다. 이 코드는 프론트엔드가 `/token` 엔드포인트에 최종 토큰을 요청할 때 사용됩니다.
-   **프론트엔드 리디렉션**: `UriComponentsBuilder`를 사용하여 프론트엔드의 `/oauth/callback` 경로로 리디렉션 URL을 만듭니다. 이때, 생성된 `tempCode`를 `code`라는 쿼리 파라미터로 포함시킵니다.
    -   예: `http://localhost:3000/oauth/callback?code=abcdef12345`
-   `getRedirectStrategy().sendRedirect()`를 호출하여 사용자를 해당 URL로 보냅니다.
-   Movlit의 원본 코드에서는 이 단계에서 `Authorization` 헤더에 `accessToken`을 설정하지만, 프론트엔드 포스트에서는 `/oauth/callback`에서 받은 `code`로 `/token` 엔드포인트를 호출하여 `accessToken`과 `refreshToken`을 모두 받는 흐름으로 설명되어 있습니다. 일관성을 위해, 프론트엔드가 `/token` 엔드포인트에서 최종 토큰을 받도록 하는 것이 더 명확할 수 있습니다.

## 토큰 발급 및 갱신 엔드포인트 (컨트롤러 - 예시)

프론트엔드의 `OAuthCallback.jsx` 및 `axiosInstance.js`에서 호출하는 `/token` 및 `/refresh` 엔드포인트는 별도의 컨트롤러에서 구현해야 합니다.

```java
// AuthController.java (예시)
package movlit.be.auth.presentation.controller;

import lombok.RequiredArgsConstructor;
import movlit.be.auth.application.service.TokenService; // 토큰 발급/검증/갱신 서비스
import movlit.be.auth.presentation.dto.request.TokenRequest; // 프론트에서 code 또는 refreshToken을 받는 DTO
import movlit.be.auth.presentation.dto.response.TokenResponse; // accessToken, refreshToken을 담아 보내는 DTO
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import jakarta.servlet.http.Cookie; // Refresh Token을 쿠키로 설정하기 위함
import jakarta.servlet.http.HttpServletResponse;

@RestController
@RequiredArgsConstructor
public class AuthController {

    private final TokenService tokenService; // 실제 토큰 로직을 처리하는 서비스

    // 프론트엔드의 OAuthCallback.jsx에서 호출
    @PostMapping("/token")
    public ResponseEntity<TokenResponse> issueToken(@RequestBody TokenRequest tokenRequest, HttpServletResponse response) {
        // tokenRequest에는 프론트가 받은 임시 code가 담겨있음
        String code = tokenRequest.getCode();
        TokenResponse tokenResponse = tokenService.issueTokensFromAuthCode(code); // code 검증 및 JWT 토큰들 발급

        // RefreshToken을 HttpOnly 쿠키로 설정
        Cookie refreshTokenCookie = new Cookie("refreshToken", tokenResponse.getRefreshToken());
        refreshTokenCookie.setHttpOnly(true);
        refreshTokenCookie.setSecure(true); // HTTPS 환경에서만 전송
        refreshTokenCookie.setPath("/");    // 전체 경로에서 사용 가능
        refreshTokenCookie.setMaxAge(14 * 24 * 60 * 60); // 예: 14일 유효기간 (초 단위)
        // refreshTokenCookie.setSameSite("None"); // 크로스-사이트 요청 시 필요 (프론트/백엔드 도메인 다를 때)
                                                 // SameSite=None을 사용하려면 Secure=true가 필수

        response.addCookie(refreshTokenCookie);

        // AccessToken은 응답 본문으로 전달
        return ResponseEntity.ok(new TokenResponse(tokenResponse.getAccessToken(), null)); // refreshToken은 쿠키로 갔으므로 본문에서는 null 또는 제외
    }

    // 프론트엔드의 axiosInstance.js 인터셉터에서 호출
    @PostMapping("/refresh")
    public ResponseEntity<TokenResponse> refreshToken(@RequestBody TokenRequest tokenRequest, HttpServletResponse httpServletResponse) {
         // tokenRequest에는 프론트가 쿠키에서 직접 읽기 어렵지만,
         // 여기서는 요청 본문으로 받는 것으로 가정. 또는 @CookieValue("refreshToken") String refreshToken 사용
        String refreshToken = tokenRequest.getRefreshToken(); // 혹은 쿠키에서 직접 추출
        TokenResponse tokenResponse = tokenService.refreshAccessToken(refreshToken);

        // (선택적) Refresh Token Rotation: 새 RefreshToken 발급 시 기존 쿠키 갱신
        // Cookie newRefreshTokenCookie = new Cookie("refreshToken", tokenResponse.getNewRefreshToken());
        // ... (쿠키 설정)
        // httpServletResponse.addCookie(newRefreshTokenCookie);

        return ResponseEntity.ok(new TokenResponse(tokenResponse.getAccessToken(), null));
    }
}
```

```java
// TokenService.java (예시 - 실제 로직 필요)
package movlit.be.auth.application.service;

import lombok.RequiredArgsConstructor;
import movlit.be.auth.domain.repository.AuthCodeStorage;
import movlit.be.common.util.JwtTokenUtil;
import movlit.be.auth.presentation.dto.response.TokenResponse;
import movlit.be.member.domain.Member; // 필요시
import movlit.be.member.application.service.MemberReadService; // 필요시
import org.springframework.stereotype.Service;
import org.springframework.security.authentication.BadCredentialsException; // 예외 처리

@Service
@RequiredArgsConstructor
public class TokenService {

    private final AuthCodeStorage authCodeStorage;
    private final JwtTokenUtil jwtTokenUtil;
    private final MemberReadService memberReadService; // email로 회원 정보 조회 시

    public TokenResponse issueTokensFromAuthCode(String code) {
        // 1. AuthCodeStorage에서 code로 email 조회 및 code 유효성 검증/삭제
        String email = authCodeStorage.getEmailByCode(code);
        if (email == null) {
            throw new BadCredentialsException("유효하지 않거나 만료된 인증 코드입니다.");
        }
        authCodeStorage.deleteCode(code); // 한 번 사용된 코드는 삭제

        // (선택적) email로 Member 객체 조회
        // Member member = memberReadService.fetchMemberByEmail(email);

        // 2. AccessToken 및 RefreshToken 생성
        String accessToken = jwtTokenUtil.generateAccessToken(email);
        String refreshToken = jwtTokenUtil.generateRefreshToken(email);

        // TODO: 생성된 RefreshToken을 DB 등에 저장하여 추후 검증에 사용 (탈취 대비)

        return new TokenResponse(accessToken, refreshToken);
    }

    public TokenResponse refreshAccessToken(String refreshTokenValue) {
        // 1. RefreshToken 유효성 검증 (만료 여부, 서명 등)
        if (!jwtTokenUtil.validateToken(refreshTokenValue)) {
            throw new BadCredentialsException("유효하지 않은 Refresh Token입니다.");
        }

        // 2. RefreshToken에서 email (또는 사용자 식별자) 추출
        String email = jwtTokenUtil.getEmailFromToken(refreshTokenValue);

        // (선택적) DB에 저장된 RefreshToken과 일치하는지, 탈취된 토큰은 아닌지 검증

        // 3. 새 AccessToken 생성
        String newAccessToken = jwtTokenUtil.generateAccessToken(email);

        // (선택적) Refresh Token Rotation: 새 RefreshToken도 발급하는 경우
        // String newRefreshToken = jwtTokenUtil.generateRefreshToken(email);
        // TODO: 기존 RefreshToken은 만료시키고 새 RefreshToken을 DB에 저장

        return new TokenResponse(newAccessToken, null); // 새 RefreshToken 발급 시 함께 반환
    }
}
```

-   **`/token` 엔드포인트**:
    -   프론트엔드로부터 `code`(임시 코드)를 받습니다.
    -   `AuthCodeStorage`에서 해당 `code`를 검증하고, 연결된 사용자 이메일을 가져옵니다.
    -   `JwtTokenUtil`을 사용하여 해당 사용자를 위한 `AccessToken`과 `RefreshToken`을 발급합니다.
    -   `AccessToken`은 JSON 응답 본문에 담아 전달하고, `RefreshToken`은 보안을 위해 `HttpOnly`, `Secure`, `SameSite` 속성을 가진 쿠키로 설정하여 전달하는 것이 권장됩니다. 프론트엔드에서 `document.cookie`로 `RefreshToken`을 설정하는 것보다 백엔드에서 `Set-Cookie` 헤더를 통해 내려주는 것이 더 안전합니다.
-   **`/refresh` 엔드포인트**:
    -   프론트엔드로부터 `RefreshToken`(쿠키에서 자동으로 전달되거나, 명시적으로 요청 본문에 담아)을 받습니다.
    -   `JwtTokenUtil`을 사용하여 `RefreshToken`을 검증합니다. (DB에 저장된 값과 비교하는 로직 추가 가능)
    -   유효하다면 새로운 `AccessToken`을 발급하여 응답합니다.
    -   (선택) Refresh Token Rotation 전략을 사용하여 새 `RefreshToken`도 함께 발급하고 기존 `RefreshToken`은 만료시킬 수 있습니다.

## 정리

백엔드에서는 Spring Security의 OAuth2 기능을 활용하여 외부 OAuth 제공자와의 인증 과정을 처리합니다.
1.  **`SecurityConfig`**: OAuth2 로그인 흐름을 정의하고, 커스텀 `OAuth2UserService`와 `AuthenticationSuccessHandler`를 등록합니다. CORS 설정도 중요합니다.
2.  **`MyOAuth2MemberService`**: OAuth 제공자로부터 받은 사용자 정보를 기반으로 우리 서비스의 회원 정보를 조회하거나 새로 생성합니다.
3.  **`OAuth2AuthenticationSuccessHandler`**: 인증 성공 후, 프론트엔드의 특정 콜백 (`/oauth/callback`)으로 리디렉션시키며, 이때 프론트엔드가 최종 토큰을 요청하는 데 사용할 **임시 코드**를 전달합니다.
4.  **`AuthController` (및 `TokenService`)**: 프론트엔드가 임시 코드를 보내 토큰을 요청하는 `/token` 엔드포인트와, `AccessToken` 만료 시 `RefreshToken`으로 새 토큰을 요청하는 `/refresh` 엔드포인트를 제공합니다. `RefreshToken`은 `HttpOnly` 쿠키로 관리하는 것이 보안상 좋습니다.
5.  **`JwtRequestFilter`**: 로그인 이후의 모든 API 요청에 대해 `AccessToken`을 검증합니다.

이러한 백엔드 구성은 프론트엔드에서 설명한 OAuth 2.0 로그인 및 토큰 관리 흐름과 긴밀하게 연동되어 동작합니다.
