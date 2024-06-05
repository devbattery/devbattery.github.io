---
title: "[Java] Java 비동기 프로그래밍 정리 (1)"
excerpt: "CompletableFuture, 콜백, 동기, 비동기"

categories:
  - Java
tags:
  - [codesquad]

toc: true
toc_sticky: true

sidebar:
  nav: "categories"

date: 2023-02-11
last_modified_at: 2023-02-11
---

# 정리

## CompletableFuture 클래스 등장 배경

- Java8 이전에는 `Future` 클래스로 비동기 작업에 대한 결과값을 반환 받을 수 있었다.

- 하지만 `Future` 클래스는 아래와 같은 한계점이 있었다.

  - 외부에서 완료시킬 수 없고, get의 timeout 설정으로만 완료 가능
  - 블로킹 코드(get)을 통해서만 이후의 결과를 처리할 수 있음
  - 여러 Future를 조합할 수 없음(회원 정보를 가져오고, 알림을 발송하는 등)
  - 여러 작업을 조합하거나 예외 처리할 수 없음

- Future는 외부에서 작업을 완료시킬 수 없고, 작업 완료는 오직 get 호출 시에 timeout으로만 가능하다.
- 비동기 작업의 응답에 추가 작업을 하려면 get을 호출해야 하는데, get은 블로킹 호출이므로 좋지 않다.
- 여러 Future들을 조합할 수도 없으며 예외가 발생한 경우, 이를 위한 예외처리도 불가능하다.
- Java8부터 이러한 문제들을 모두 해결할 `CompletableFuture` 클래스가 등장하게 됐다.

## CompletableFuture 클래스란

- `CompletableFuture`는 기존의 `Future`를 기반으로 외부에서 완료시킬 수 있어서 `CompletableFuture`라는 이름을 갖게 되었다.
- `Future` 외에도 `CompletionStage` 인터페이스도 구현하고 있는데, 이는 작업들을 중첩시키거나 완료 후 콜백을 위해 추가되었다.
  - `Future`에서는 불가능했던 "몇 초 이내에 응답이 오지 않으면 기본값을 반환한다."라는 게 가능해진 것이다.
- 즉, `CompletableFuture`는 `Future`의 진화된 형태로서 **외부에서 작업을 완료시킬 수 있을 뿐만 아니라 콜백 등록 및 Future 조합 등이 가능**하다는 것이 큰 장점이다.

## CompletableFuture 클래스의 기능

### 비동기 작업 실행

- `runAsync()`

  - 반환값이 없는 경우
  - 비동기로 작업 실행 콜

- `supplyAsync()`
  - 반환값이 있는 경우
  - 비동기로 작업 실행 콜

#### runAsync 메서드

- `runAsync()`는 반환 값이 없으므로 void 타입이며, 아래의 코드를 실행해보면 `future`가 별도의 스레드에서 실행되는 것을 확인할 수 있다.

```java
class SullyTest {
    @Test
    void runAsync() throws ExecutionException, InterruptedException {
        CompletableFuture<Void> future = CompletableFuture.runAsync(() -> {
            System.out.println("Thread: " + Thread.currentThread().getName());
        });

        future.get();
        System.out.println("Thread: " + Thread.currentThread().getNamE());
    }
}
```

#### supplyAsync 메서드

- `supplyAsync()`는 `runAsync`와 달리 반환값이 존재하기 때문에 비동기 작업의 결과를 받아올 수 있다.

```java
class SullyTest {
    @Test
    void supplyAsync() throws ExecutionException, InterruptedException {
        CompletableFuture<String> future = CompletableFuture.supplyAsync(() -> {
            return "Thread: " + Thread.currentThread().getName();
        });

        System.out.println(future.get());
        System.out.println("Thread: " + Thread.currentThread.getName());
    }
}
```

<br>

- `runAsync()`와 `supplyAsync()`는 기본적으로 Java7에 추가된 `ForkJoinPool`의 `commonPool()`을 사용해 작업을 실행할 스레드를 스레드 풀로부터 얻어 실행시킨다.
- 만약 원하는 스레드 풀을 사용하려면, `ExecutorService`를 파라미터로 넘겨주자.

<br>

- 아래 [작업 콜백](#작업-콜백), [작업 조합](#작업-조합), [예외 처리](#예외-처리)에서는 예제를 생략하겠다.
  - `모던 자바 인 액션` 내용 정리할 시간도 많이 빠듯할 것 같다...
  - 그래도 함수형 프로그래밍 미션에서 모던 자바 책 읽고 정말 많은 도움이 됐으니 이번에도 그럴 거라고 믿어야지 👍🏻

### 작업 콜백

- `thenApply()`

  - 반환 값을 받아서 다른 값을 반환함
  - 함수형 인터페이스 `Function`을 파라미터로 받음

- `thenAccept()`

  - 반환 값을 받아 처리하고 값을 반환하지 않음
  - 함수형 인터페이스 `Consumer`를 파라미터로 받음

- `thenRun()`
  - 반환 값을 받지 않고 다른 작업을 실행함
  - 함수형 인터페이스 `Runnable`을 파라미터로 받음

### 작업 조합

- `thenCompose()`

  - 두 작업이 이어서 실행하도록 조합하며, 앞선 작업의 결과를 받아서 사용할 수 있음
  - 함수형 인터페이스 `Funtion`을 파라미터로 받음

- `thenCombine()`

  - 두 작업을 독립적으로 실행하고, 둘 다 완료되었을 때 콜백을 실행함
  - 함수형 인터페이스 `Function`을 파라미터로 받음

- `allOf()`

  - 여러 작업들을 동시에 실행하고, 모든 작업 결과에 콜백을 실행함

- `anyOf()`
  - 여러 작업들 중에서 가장 빨리 끝난 하나의 결과에 콜백을 실행함

### 예외 처리

- `exeptionally()`

  - 발생한 에러를 받아서 예외를 처리함
  - 함수형 인터페이스 `Function`을 파라미터로 받음

- `handle()`, `handleAsync()`
  - (결과값, 에러)를 반환 받아 에러가 발생한 경우와 아닌 경우 모두를 처리할 수 있음
  - 함수형 인터페이스 `BiFunction`을 파라미터로 받음

## CompletableFuture 클래스로 비동기 애플리케이션 만들기

- 어떤 제품이나 서비스를 이용해야 하는 상황이라고 가정한다.
- 예산을 줄일 수 있도록 여러 온라인 상점 중 가장 저렴한 가격을 제시하는 상점을 찾는 예제를 살펴본다.

- 이 애플리케이션을 만드는 동안 아래와 같은 기술을 배울 수 있다.
  1. 고객에게 비동기 API를 제공하는 방법을 배운다. (온라인 상점을 운영하고 있는 독자에게 특히 유용한 기술)
  2. 동기 API를 사용해야 할 때 코드를 비블록으로 만드는 방법을 배운다. 두 개의 비동기 동작을 파이프라인으로 만드는 방법과 두 개의 동작 결과를 하나의 비동기 계산으로 합치는 방법을 살펴본다. 예를 들어
     온라인 상점에서 우리가 사려는 물건에 대응하는 할인 코드를 반환한다고 가정하자. 우리는 다른 원격 할인 서비스에 접근해서 할인 코드에 해당하는 할인율을 찾아야 한다. 그래야 원래 가격에 할인율을 적용하여
     최정 결과를 계산할 수 있다.
  3. 비동기 동작의 완료에 대응하는 방법을 배운다. 즉, 모든 상점에서 가격 정보를 얻을 때까지 기다리는 것이 아니라 각 상점에서 가격 정보를 얻을 대마다 즉시 최저가격을 찾는 애플리케이션을 갱신하는 방법을
     설명한다. (그렇지 않으면 서버가 다운되는 등 문제가 발생했을 때 사용자에게 검은 화면만 보여주게 될 수도 있다)

## 동기 API와 비동기 API

### 동기 API

- 전통적인 동기 API에서는 메서들를 호출한 후 메서드가 계산을 완료할 때까지 기다린다.
- 메서드가 반환되면 호출자는 반환된 값으로 계속 다른 동작을 수행한다.
- 호출자와 피호출자가 각각 다른 스레드에서 실행되는 상황이었더라도 호출자는 피호출자의 동작 완료를 기다렸을 것이다.
- 이처럼 동기 API를 사용하는 상황을 **블록 호출**이라고 한다.

### 비동기 API

- 비동기 API에서는 메서드가 즉시 반환되며 끝내지 못한 나머지 작업을 호출자 스레드와 동기적으로 실행될 수 있도록 다른 스레드에 할당한다.
- 이와 같은 비동기 API를 사용하는 상황을 **비블록 호출**이라고 한다.
- 다른 스레드에 할당된 나머지 계산 결과는 콜백 메서드를 호출하여 전달하거나 호출자가 계산 결과가 끝날 때까지 기다리는 메서드를 추가로 호출하여 전달한다.
- 주로 I/O 시스템 프로그래밍에서 이와 같은 방식으로 동작을 수행한다.
- 즉, 계산 동작을 수행하는 동안 비동기적으로 디스크 접근을 수행한다.
  - 그리고 더 이상 수행할 동작이 없으면 디스크 블록이 메모리로 로딩될 때까지 기다린다.

### 비동기 API 구현

- 최저가격 검색 애플리케이션을 구현하기 위해 먼저 각각의 상점에서 제공하는 API부터 정의한다.
- 아래는 제품명에 해당하는 가격을 반환하는 메서드 정의 코드다.

```java
public class Shop {
    public double getPrice(String product) {
        // 구현해야 함
    }
}
```

<br>

- `getPrice()`는 상점의 데이터베이스를 이용해서 가격 정보를 얻는 동시에 다른 외부 서비스에도 접근할 것이다. (예를 들어 물건 발행자나 제조사 관련 프로모션 할인 등)
- 실제 호출할 서비스까지 구현할 수 없으므로 이처럼 오래 걸리는 작업을 `delay()`로 대체한다.
  - `delay()`는 인위적으로 1초를 지연시키는 메서드

```java
public class Shop {
    public static void delay() {
        try {
            Thread.sleep(1000L);
        } catch (InterruptedException e) {
            throw new RuntimeException(e);
        }
    }
}
```

<br>

- 위에서 구현한 `delay()`를 이용하여 자연을 흉내 낸 후 임의의 계산값을 반환하도록 `getPrice()`를 구현할 수 있다.
- 아무 계산값이나 반환하는 동작이 비정상적으로 보일 순 있지만, 아래 코드에서 볼 수 있는 것처럼 제품명에 `charAt()`을 적용해서 임의의 계산값을 반환한다.

```java
public class Shop {
    public double getPrice(String product) {
        return calculatePrice(product);
    }

    private double calculatePrice(String product) {
        delay();
        return random.nextDouble() * prodcut.charAt(0) + product.charAt(1);
    }
}
```

<br>

- 사용자가 이 API(최저가격 검색 애플리케이션)를 호출하면 비동기 동작이 완료될 때까지 1초 동안 블록된다.
- 최저가격 검색 애플리케이션에서 위 메서드를 사용해서 네트워크상의 모든 온라인상점의 가격을 검색해야 하므로 블록 동작은 바람직하지 않다.

### 동기 메서드를 비동기 메서드로 변환

- 동기 메서드 `getPrice()`를 비동기 메서드로 변환하려면 아래 코드처럼 이름과 반환값을 바꿔야 한다.

```java
public Future<Double> getPriceAsync(String product){}
```

<br>

- `Future`은 결과값의 핸들일 뿐이며 계산이 완료되면 `get()`으로 결과를 얻을 수 있다.
- `getPriceAsync()`는 즉시 반환되므로 호출자 스레드는 다른 작업을 수행할 수 있다.
- Java8의 `CompletableFuture` 클래스는 아래 코드처럼 `getPriceAsync()`를 쉽게 구현하는 데 도움이 되는 기능을 제공한다.

```java
public class Shop {
    public Future<Double> getPriceAsync(String product) {
        // 계산 결과를 포함할 CompletableFuture 생성
        CompletableFuture<Double> futurePrice = new CompletableFuture<>();
        new Thread(() -> {
            // 다른 스레드에서 비동기적으로 계산 숳애
            double price = calculatePrice(product);
            // 오랜 시간이 걸리는 계산이 완료되면 Future에 값을 저장
            futurePrice.complete(price);
        }).start();
        // 계산 결과가 완료되길 기다리지 않고 Future 반환
        return futurePrice;
    }
}
```

- 위 코드에서 비동기 계산과 완료 결과를 포함하는 `CompletableFuture` 인스턴스를 만들었다.
- 실제 가격을 계산할 다른 스레드를 만든 후 오래 걸리는 계산 결과를 기다리지 않고 결과를 포함할 `Future` 인스턴스를 바로 반환했다.
- 요청한 제품의 가격 정보가 도착하면 `complete()` 메서드를 이용해 `CompletableFuture`를 종료할 수 있다.
- 아래의 코드처럼 클라이언트는 `getPriceAsync()`를 활용할 수 있다.

```java
public class SullyTest {
    public static void main(String[] args) {
        Shop shop = new Shop("BestShop");
        long start = System.nanoTime();
        // 상점에 제품가격 정보 요청
        Future<Double> futurePrice = shop.getPriceAsync("my favorite product");
        long invocationTime = ((System.nanoTime() - start) / 1_000_000);
        System.out.println("Invocation returned after " + invocationTime + " msecs");

        // 제품의 가격을 계산하는 동안
        doSomethingElse();
        // 다른 상점 검색 등 다른 작업 수행
        try {
            // 가격 정보가 있으면 Future에서 가격 정보를 읽고,
            // 가격 정보가 없으면 가격 정보를 받을 때까지 블록한다.
            double price = futurePrice.get();
            System.out.printf("Price is %.2f%n", price);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }

        long retrievalTime ((System.nanoTime() - start) / 1_000_000);
        System.out.println("Price returned after " + retrievalTime + " msecs");
    }
}
```

- 위 코드에서 확인할 수 있 듯이 클라이언트는 특정 제품의 가격 정보를 상점에 요청한다.
- 상점은 비동기 API를 제공하므로 즉시 `Future`를 반환한다.
- 클라이언트는 반환된 `Future`를 이용해서 결과를 얻을 수 있다.
- 그 사이 클라이언트는 다른 상점에 가격 정보를 요청하는 등 첫 번째 상점의 결과를 기다리며 대기하지 않고 다른 작업을 처리할 수 있다.
- 나중에 클라이언트가 특별히 할일이 없으면 `Future`의 `get()`을 호출한다.

  - 이때 `Future`가 결과값을 가지고 있다면, `Future`에 포함된 값을 읽거나 값이 계산될 때까지 블록한다.

- 아래는 위 코드의 결과다.

> Invocation returned after 43 msecs <br>
> Price is 123.26 <br>
> Price returned after 1045 msecs

- 가격 계산이 끝나기 전에 `getPriceAsync()`가 반환된다는 사실을 확인할 수 있다.

### 에러 처리 방법

- 가격을 계산하는 동안 에러가 발생하면 해당 스레드에만 영향을 미친다.
  - 즉, 에러가 발생해도 가격 계산은 계속 진행되며 일의 순서가 꼬인다.
  - 결과적으로 클라이언트느 `get()` 메서드가 반환될 때까지 영원히 기다리게 될 수도 있다.
- 클라이언트는 타임아웃 값을 받는 `get()` 메서드의 오버로드 버전을 만들어 이를 해결할 수 있다.
- 이처럼 블록 문제가 발생할 수 있는 상황에서는 타임아웃을 활용하는 것이 좋다.
  - 문제가 발생했을 때 클라이언트가 영원히 블록되지 않고 타임아웃 시간이 지나면 `TimeoutException`을 받을 수 있다.
- 하지만 이때 제품 가격 계산에서 왜 에러가 발생했는지는 알 수 있는 방법이 없다.

  - `compleExceptionally()` 메서드를 이용해 `CompletableFuture` 내부에서 발생한 예외를 클라이언트로 전달해야 한다.

- 아래는 `getPriceAsync()`를 재구현한 코드다.

```java
public class Shop {
    public Future<Double> getPriceAsync(String product) {
        CompletableFuture<Double> futurePrice = new CompletableFuture<>();
        new Thread(() -> {
            try {
                double price = calculatePrice(product);
                // 계산이 정상적으로 종료되면 Future에 가젹 정보를 저장한 채로 종료한다.
                futurePrice.complete(price);
            } catch (Exception ex) {
                // 도중에 문제가 발생하면 발생한 에러를 포함시켜 Future를 종료한다,
                futurePrice.completeExceptionally(ex);
            }
        }).start();
        return futurePrice;
    }
}
```

- 이제 클라이언트는 가격 계산 메서드에서 발생한 예외 파라미터를 포함하는 `ExecutionException`을 받게 된다.
- 예를 들어 `product not available`이라는 `RuntimeExeption`이라는 예외가 발생했다면, 클라이언트는 `ExecutionException`을 받을 것이다.

### 팩토리 메서드 supplyAsync로 CompletableFuture 만들기

- 지금까지는 `CompletableFuture`를 직접 만들었지만, 좀 더 간단하게 만드는 방법도 있다.
- 예를 들어 `getPriceAsync()`를 한 행으로 재구현할 수 있다.

```java
public class Shop {
    public Future<Double> getPriceAsync(String product) {
        return CompletableFuture.supplyAsync(() -> calculatePrice(product));
    }
}
```

- `supplyAsync()` 메서드는 `Supplier`를 인수로 받아 `CompletableFuture`를 반환한다.
- `CompletableFuture`는 `Supplider`를 실행해서 비동기적으로 결과를 생성한다.
- `ForkJoinPool`의 `Executor`중 하나가 `Supplier`를 실행할 것이다.
- 하지만 두 번째 인수를 받는 `supplyAsync()` 메서드를 이용해서 다른 `Executor`를 지정할 수 있다.
- 결국 모든 `CompletableFuture`의 팩토리 메서드에 `Executor`를 선택적으로 전달할 수 있다.

- 지금부터는 Shop 클래스에서 구현한 API를 제어할 권한이 우리에게 없는 상황이며, 모든 API는 동기 방식의 블록 메서드라고 가정한다.

### 비블록 코드 만들기

- 아래와 같은 상점 리스트가 있다고 가정한다.

```java
List<Shop> shops = Arrays.asList(new Shop("BestPrice"), new Shop("LetsSaveBig"), new Shop("MyFavoriteShop"), new Shop("BuyItAll"));
```

<br>

- 다음처럼 제품명을 입력하면 상점 이름과 제품 가격 문자열 정보를 포함하는 List를 반환하는 메서드를 구현해야 한다.

```java
public List<String> findPrices(String product);
```

<br>

아래 코드에 어떤 문제가 있는지 생각해 본다.

```java
public class Shop {
    public List<String> findPrices(String product) {
        return shops.stream()
                .map(shop -> String.format("%s price is %.2f", shop.getName(), shop.getPrice(product)))
                .collect(toList());
    }
}
```

- 이제 `findPrices()` 메서드로 원하는 제품의 가격을 검색할 수 있다.

<br>

### CompletableFuture로 비동기 호출 구현하기

팩토리 메서드 `supplyAsync()`로 `CompletableFuture`를 만들어 본다.

```java
public class Shop {
    List<CompletableFuture<String>> priceFutures = shops.stream()
}
```

# Reference

- [모던 자바 인 액션 - Part V](https://www.aladin.co.kr/shop/wproduct.aspx?ItemId=200069290)
- <https://mangkyu.tistory.com/263>
