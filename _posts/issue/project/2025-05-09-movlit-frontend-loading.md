---
title: "[Project] Vite React 환경에서 이미지 컴포넌트 로딩 최적화 방법"
excerpt: "movlit, vite, react, image, loading"

categories:
  - Project
tags:
  - [movlit, vite, react, image, loading]

toc: true
toc_sticky: true

sidebar:
  nav: "categories"

date: 2025-05-09
last_modified_at: 2025-05-12
---

> [Movlit 프로젝트](https://github.com/venus-lion/movlit-plus)에 대한 설명입니다.

## 서론

Movlit 프로젝트에서 이미지 로딩은 TMDB의 고화질 포스터의 이미지 url을 가져오는 것이기 때문에 필연적으로 로딩이 발생할 수밖에 없습니다.  
새로고침 시, 뒤죽박죽 이미지가 로딩이 되어 사용자에게 불편함을 줄 수 있다는 점을 인지하여 아래 요소들을 만족시키는 해결 방안을 찾아보게 되었습니다.  

1. 세로 컴포넌트들은 순서대로 화면에 표시됩니다.
2. 가로 컴포넌트들은 그 안의 모든 컴포넌트들이 로딩이 되어야 화면에 표시됩니다.

## 핵심 구현

메인 페이지 역할을 하는 `MovieHome` 컴포넌트에서 전체 로딩을 관리합니다.

### 1. 컴포넌트 지연 로딩 (Lazy Loading)

가장 먼저, 화면을 구성하는 각 섹션 컴포넌트들을 `React.lazy`를 사용해 동적으로 임포트합니다. 이렇게 하면 초기 크기를 줄여 첫 페이지 로딩 속도를 개선할 수 있습니다.

```javascript
// MovieHome.jsx
import React, { lazy, Suspense, useCallback, useEffect, useState } from "react";
// ... 기타 import

// Lazy-load the components
const PopularMoviesComponent = lazy(() =>
  import("./PopularMoviesComponent.jsx")
);
const LatestMoviesComponent = lazy(() => import("./LatestMoviesComponent.jsx"));
const GenreMoviesComponent = lazy(() => import("./GenreMoviesComponent.jsx"));
// ... (나머지 컴포넌트들도 동일)
```

- `lazy()` 함수는 동적 `import()`를 호출하는 함수를 인자로 받습니다.
- 해당 컴포넌트가 처음 렌더링될 때만 실제 코드를 불러옵니다.

### 2. 로딩 상태 관리

각 컴포넌트 섹션의 "영화 데이터 로딩 완료" 상태를 추적하기 위한 state를 정의합니다.

```javascript
// MovieHome.jsx
function MovieHome() {
  // ...
  const [componentsLoaded, setComponentsLoaded] = useState({
    popular: false,
    latest: false,
    recentHeart: false,
    interestGenre: false,
    genre: new Array(4).fill(false), // 장르 컴포넌트는 여러 개이므로 배열로 관리
  });
  // ...
}
```

- `popular`, `latest` 등 각 키는 해당 컴포넌트의 영화 데이터가 준비되었는지 여부를 나타냅니다.
- `genre`는 여러 장르 컴포넌트의 상태를 배열로 관리합니다.

### 3. 데이터 로드 완료 조건

자식 컴포넌트로부터 영화 목록을 받았을 때, "완전히 로드되었다"고 판단하는 기준의 함수입니다.

```javascript
// MovieHome.jsx
const areMoviesLoaded = (movies) => {
  return (
    movies && movies.length > 0 && movies.every((movie) => movie.posterPath)
  );
};
```

### 4. 로딩 상태 업데이트 함수

자식 컴포넌트가 영화 데이터 로딩을 마치면 이 콜백 함수를 호출하여 `componentsLoaded` 상태를 업데이트합니다. `useCallback`으로 감싸 불필요한 재생성을 방지합니다.

```javascript
// MovieHome.jsx
const updateComponentLoaded = useCallback(
  (componentName, isLoaded, index = null) => {
    setComponentsLoaded((prev) => {
      if (index !== null) {
        // GenreMoviesComponent의 경우
        const newGenreStatus = [...prev.genre];
        newGenreStatus[index] = isLoaded;
        // 상태가 실제로 변경되었을 때만 새 객체 반환 (불필요한 리렌더링 방지)
        if (JSON.stringify(prev.genre) === JSON.stringify(newGenreStatus)) {
          return prev;
        }
        return { ...prev, genre: newGenreStatus };
      }

      // 다른 단일 컴포넌트의 경우
      if (prev[componentName] === isLoaded) {
        return prev;
      }
      return { ...prev, [componentName]: isLoaded };
    });
  },
  []
);
```

- `GenreMoviesComponent`처럼 여러 인스턴스가 있는 경우 `index`를 받아 배열 내 특정 요소의 상태를 업데이트합니다.
- 상태가 실제로 변경되었는지 간단히 비교하여 불필요한 리렌더링을 방지하는 최적화가 포함되어 있습니다. (실제 프로덕션에서는 더 정교한 비교나 라이브러리 사용을 고려할 수 있습니다.)

### 5. `Suspense`와 조건부 렌더링

`Suspense` 컴포넌트는 `lazy`로 로드되는 컴포넌트들이 준비될 때까지 `fallback` UI(로딩 스피너 등)를 보여줍니다.
그리고 `componentsLoaded` 상태에 따라 각 컴포넌트를 순차적으로 렌더링하고, `hidden`을 통해 실제 표시 여부를 제어합니다.

```jsx
// MovieHome.jsx
return (
  <div className="movie-home">
    <Suspense
      fallback={
        <div className="loading-container">
          {" "}
          {/* 전체 로딩 폴백 */}
          <div className="spinner"></div>
          <p>로딩 중입니다.</p>
        </div>
      }
    >
      {/* 1. 인기 영화 */}
      <PopularMoviesComponent
        onMoviesLoaded={(movies) =>
          updateComponentLoaded("popular", areMoviesLoaded(movies))
        }
        hidden={!componentsLoaded.popular} // 자신의 데이터가 로드되어야 보임
      />

      {/* 2. 최신 영화 - 인기 영화 데이터가 로드된 후에 렌더링 시도 */}
      {componentsLoaded.popular && (
        <LatestMoviesComponent
          onMoviesLoaded={(movies) =>
            updateComponentLoaded("latest", areMoviesLoaded(movies))
          }
          hidden={!componentsLoaded.latest} // 자신의 데이터가 로드되어야 보임
        />
      )}

      {/* 3. 장르별 영화 - 최신 영화 데이터가 로드된 후에 렌더링 시도 */}
      {componentsLoaded.latest &&
        randomGenreIds.map((genreId, index) => (
          <GenreMoviesComponent
            key={genreId}
            genreId={genreId}
            onMoviesLoaded={(movies) =>
              updateComponentLoaded("genre", areMoviesLoaded(movies), index)
            }
            hidden={!componentsLoaded.genre[index]} // 각 장르별 데이터 로드 시 보임
          />
        ))}

      {/* 4. 최근 찜 기반 추천 (로그인 시) - 인기 영화 데이터 로드 후 & 로그인 상태일 때 */}
      {componentsLoaded.popular && isLoggedIn && (
        <RecentHeartSimilarCrewMoviesComponent
          onMoviesLoaded={(movies) =>
            updateComponentLoaded("recentHeart", areMoviesLoaded(movies))
          }
          hidden={!componentsLoaded.recentHeart}
        />
      )}

      {/* 5. 관심 장르 기반 추천 (로그인 시) - 찜 기반 추천 데이터 로드 후 & 로그인 상태일 때 */}
      {componentsLoaded.recentHeart && isLoggedIn && (
        <InterestGenreMoviesComponent
          onMoviesLoaded={(movies) =>
            updateComponentLoaded("interestGenre", areMoviesLoaded(movies))
          }
          hidden={!componentsLoaded.interestGenre}
        />
      )}
    </Suspense>
  </div>
);
```

- `PopularMoviesComponent`는 항상 렌더링을 시도합니다. `LatestMoviesComponent`는 `componentsLoaded.popular`가 `true`일 때, 즉 인기 영화 데이터가 준비되었을 때 렌더링을 시도합니다. 이런 식으로 다음 컴포넌트는 이전 필수 컴포넌트의 데이터 로딩 완료 여부에 따라 렌더링이 결정됩니다.
- 각 컴포넌트는 렌더링되더라도 `hidden`이 `true`이면 (즉, `componentsLoaded`의 해당 상태가 `false`이면) 내부적으로 `null`을 반환하여 화면에 아무것도 그리지 않습니다. 이를 통해 "데이터가 완전히 준비되었을 때만 표시"하는 요구사항을 만족합니다.

## 자식 컴포넌트의 역할

각 영화 목록을 보여주는 자식 컴포넌트들은 비슷한 구조를 가집니다.

```javascript
// PopularMoviesComponent.jsx
import React, { useEffect, useState } from "react";
import useMovieList from "../hooks/useMovieList"; // 영화 데이터 fetching 커스텀 훅
import MovieCarousel from "./MovieCarousel";

function PopularMoviesComponent({ onMoviesLoaded, hidden }) {
  const { movies, loading, error } = useMovieList({
    // 영화 데이터 가져오기
    endpoint: "/movies/main/popular",
    params: { pageSize: 20 },
  });

  // ... (캐러셀 관련 로직은 생략)

  useEffect(() => {
    // 영화 데이터가 변경되거나 onMoviesLoaded 콜백이 변경될 때 실행
    if (onMoviesLoaded && movies) {
      onMoviesLoaded(movies); // 부모에게 영화 데이터가 로드되었음을 알림
    }
  }, [movies, onMoviesLoaded]);

  if (loading)
    return (
      // 컴포넌트 자체의 데이터 로딩 중 UI
      <div className="loading-container">
        <div className="spinner"></div>
        <p>인기 있는 영화 목록을 불러오는 중입니다!</p>
      </div>
    );
  if (error)
    return (
      <div>
        <p>Error loading popular movies.</p>
      </div>
    );

  // hidden이 true이면 (부모가 아직 보이지 말라고 하면) null 반환
  if (hidden) return null;

  return (
    <MovieCarousel
      title="인기 많은 영화"
      movies={movies}
    />
  );
}

export default PopularMoviesComponent;
```

- `useEffect`를 사용하여 `movies` 데이터가 성공적으로 로드되면 부모로부터 받은 `onMoviesLoaded` 콜백 함수를 호출합니다. 이때 `MovieHome`의 `areMoviesLoaded` 함수를 통해 "완전 로드" 여부가 판단됩니다.
- 부모 컴포넌트(`MovieHome`)에서 전달받은 `hidden`이 `true`이면, 이 컴포넌트는 `null`을 반환하여 아무것도 렌더링하지 않습니다. 즉, 데이터가 내부적으로는 로드되었더라도, 부모가 "이제 보여줘도 돼"라고 하기 전까지는 화면에 나타나지 않습니다.
- 각 자식 컴포넌트는 자신의 데이터를 `useMovieList` (또는 유사한 커스텀 훅)를 통해 가져오는 동안 자체적인 로딩 UI (예: `인기 있는 영화 목록을 불러오는 중입니다!`)를 표시합니다.

## 결론

1.  사용자는 중요한 콘텐츠부터 순차적으로 보게 되어 전체 로딩이 완료되지 않았더라도 페이지가 빠르게 반응하는 것처럼 느끼게 됩니다.
2.  컴포넌트별 로딩 스피너와 `Suspense`의 `fallback` UI는 사용자에게 현재 진행 상황을 알려주게 됩니다.
3.  데이터가 완전히 준비된 후에만 컴포넌트 내용이 표시되므로, 로딩 중에 레이아웃이 깨지거나 빈 공간이 오래 보이는 현상을 방지합니다.
4.  API 요청이 한 번에 몰리지 않고 분산될 수 있습니다.
