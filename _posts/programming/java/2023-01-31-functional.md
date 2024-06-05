---
title: "[Java] Java 함수형 프로그래밍 정리"
excerpt: "람다, 함수형 인터페이스, 클로저, 메서드 참조"

categories:
  - Java
tags:
  - [codesquad]

toc: true
toc_sticky: true

sidebar:
  nav: "categories"

date: 2023-01-31
last_modified_at: 2023-01-31
---

## 함수형 프로그래밍

### 람다

- 람다는 메서드처럼 특정 클래스에 종속되지 않으므로 함수라고 부른다.
- 람다 표현식은 파라미터, 화살표, 바디로 이루어진다

```java
public class Sully {
    Comparator<Apple> byWeight = new Comparator<Apple>() {
        public int compare(Apple a1, Apple a2) {
            return a1.getWeight().compareTo(a2.getWeight());
        }
    };
}
```

위 코드를 람다를 이용하여 바꾸면 아래와 같다.

```java
public class Sully {
    Comparator<Apple> byWeight =
            (Apple a1, Apple a2) // 람다 파라미터
                    -> // 화살표
                    a1.getWeight().compareTo(a2.getWeight()); // 람다 바디
}
```

- 파라미터 리스트: Comparator의 compare 메서드 파라미터 (사과 두 개)
- 화살표: 람다의 파라미터 리스트와 바디를 구분
- 람다 바디: 두 사과의 무게를 비교. 람다의 반환값에 해당되는 표현식

### 함수형 인터페이스

- 함수형 인터페이스란 정확히 하나의 `추상 메서드`를 지정하는 인터페이스다.

```java
public interface Predicate<T> {
    boolean test(T t);
}

public interface Comparator<T> {
    int compare(T o1, T o2);
}

public interface Runnable {
    void run();
}

public interface ActionListener extends EventLisner {
    void actionPerformed(ActionEvent e);
}

public interface Callable<V> {
    V call() throws Exception;
}

public interface PrivilegedAction<T> {
    T run();
}
```

- 인터페이스는 디폴트 메서드를 포함할 수 있다.
  - 디폴트 메서드: 인터페이스의 메서드를 구현하지 않은 클래스를 고려하여 기본 구현을 제공하는 바디를 포함하는 메서드
- 많은 디폴트 메서드가 있더라도 추상 메서드가 오직 하나면 함수형 인터페이스다.
- 람다 표현식으로 함수형 인터페이스의 추상 메서드 구현을 직접 전달할 수 있으므로 전체 표현식을 함수형 인터페이스의 인스턴스로 취급할 수 있다.

  - 기술적으로 따지면 함수형 인터페이스를 구현한 클래스의 인스턴스이다.

- 아래는 Runnable이 오직 하나의 추상 메서드 run을 정의하는 함수형 인터페이스의 예다.

```java
public class Sully {
    Runnable r1 = () -> System.out.println("Hello World 1"); // 람다 사용

    Runnalbe r2 = new Runnable() { // 익명 클래스 사용
        @Override
        public void run() {
            System.out.println("Hello World 2");
        }
    };

    public static void process(Runnable r) {
        r.run();
    }

    public static void main(String[] args) {
        process(r1);
        process(r2);
        process(() -> System.out.println("Hello World 3"));
    }
}
```

- "왜 함수형 인터페이스를 **인수**로 받는 메서드에만 람다 표현식을 사용할 수 있을까?"

  - 이는 대부분의 자바 프로그래머가 하나의 추상 메서드를 갖는 인터페이스에 익숙하기 때문이다.

- `@FunctionalInterface` 어노테이션이란?
  - 이는 함수형 인터페이스임을 가리키는 어노테이션이다.
  - 예를 들어 추상 메서드가 두 개 이상이라면 함수형 인터페이스가 아니기 때문에 컴파일러가 에러를 발생시킨다.

#### Predicate

- `Predicate<T>` 인터페이스는 `test()`라는 추상 메서드를 정의한다.
  - `test()`는 제네릭 형식 T의 객체를 인수로 받아 `boolean`을 반환한다.
- 따로 정의할 필요 없이 바로 사용할 수 있다는 점이 특징이다.
- T 형식의 객체를 사용하는 `boolean` 표현식이 필요한 상황에서 `Predicate` 인터페이스를 사용할 수 있다.

- 아래는 String 객체를 인수로 받는 람다의 예제다.

```java

@FunctionalInterface
public interface Predicate<T> {
    boolean test(T t);
}

public class Sully {
    public <T> List<T> filter(List<T> list, Predicate<T> p) {
        List<T> results = new ArrayList<>();
        for (T t : list) {
            if (p.test(t)) {
                results.add(t);
            }
        }
        return results;
    }

    Predicate<String> nonEmptyStringPredicate = (String s) -> !s.isEmpty();
    List<String> nonEmpty = filter(listOfStrings, nonEmptyStringPredicate);
}
```

#### Consumer

- `Consumer<T>` 인터페이스는 제네릭 형식 T 객체를 받아서 `void`를 반환하는 `accept()`라는 추상 메서드를 정의한다.
- T 형식의 객체를 인수로 받아서 어떤 동작을 수행하고 싶을 때 `Consumer` 인터페이스를 사용할 수 있다.

- 아래는 `forEach()`와 람다를 이용해서 리스트의 모든 항목을 출력하는 예제다.

```java

@FunctionalInterface
public interface Consumer<T> {
    void accept(T t);
}

public class Sully {
    public <T> void forEach(List<T> list, Consumer<T> c) {
        for (T t : list) {
            c.accept(t);
        }
    }

    public static void main(String[] args) {
        forEach(
                Arrays.asList(1, 2, 3, 4, 5),
                (Integer i) -> System.out.println(i) // Consumer<T>의 accept()를 구현하는 람다
        );
    }
}
```

#### Function

- `Function<T, R>` 인터페이스는 제네릭 형식 T를 인수로 받아서 제네릭 형식 R 객체를 반환하는 추상 메서드 `apply()`를 정의한다.
- 입력을 출력으로 매핑하는 람다를 정의할 때 `Function` 인터페이스를 활용할 수 있다.

  - 예를 들면 사과를 무게 정보를 추출하거나, 문자열을 길이와 매핑할 때를 말한다.

- 아래는 String 리스트를 인수로 받아 각 String의 길이를 포함하는 Integer 리스트로 변환시키는 `map()`을 정의하는 예제다.

```java

@FunctionalInterface
public interface Function<T, R> {
    R apply(T t);
}

public class Sully {
    public <T, R> List<R> map(List<T> list, Funciton<T, R> f) {
        List<R> result = new ArrayList<>();
        for (T t : list) {
            result.add(f.apply(t));
        }
        return result;
    }

    public static void main(String[] args) {
        // [7, 2, 6]
        List<Integer> l = map(
                Arrays.asList("lambdas", "in", "java"),
                (String s) -> s.length() // Function의 apply()를 구현하는 람다
        );
    }
}
```

<br>

- 일반적으로 특정 형식을 입력으로 받는 함수형 인터페이스의 이름 앞에 `DoublePredicate`처럼 형식명을 붙일 수 있다.
  - 이는 오토박싱 동작에서 필요 없는 메모리를 더 소비하기 때문에 생겨났다.

### 클로저

- 클로저란 함수의 비지역 변수를 자유롭게 참조할 수 있는 함수의 인스턴스를 가리킨다.

  - 예를 들어 클로저를 다른 함수의 인수로 전달할 수 있다.
  - 클로저는 클로저 외부에 정의된 변수의 값에 접근하고, 값을 바꿀 수 있다.

- 자바 8의 람다와 익명 클래스는 클로저와 비슷한 동작을 수행한다.

  - 람다와 익명 클래스 모두 메서드의 인수로 전달될 수 있으며 자신의 외부 영역의 변수에 접근할 수 있다.
  - 람다가 정의된 메서드의 지역 변숫값은 final 변수여야 한다.
    - 덕분에 람다는 변수가 아닌 값에 국한되어 어떤 동작을 수행한다는 사실이 명확해진다.

- 지역 변숫값은 스택에 존재하므로 자신을 정의한 스레드와 생존을 같이 해야 하므로 지역 변수는 final이어야 한다.
  - 가변 지역 변수를 새로운 스레드에서 캡쳐할 수 있다면 안전하지 않은 동작을 수행할 가능성이 생긴다.
    - 인스턴스 변수는 스레드가 공유하는 힙에 존재하므로 특별한 제약이 없다.

### 메서드 참조

- 메서드 참조를 이용하면 기존 메서드 구현으로 람다 표현식을 만들 수 있다.

  - 이때 명시적으로 메서드명을 참조함으로써 가독성을 높일 수 있다.

- 메서드 참조는 세 가지 유형으로 구분할 수 있다.
  1. 정적 메서드 참조
     - 예를 들어 `Integer.parseInt()` 메서드는 `Integer::parseInt`로 표현할 수 있다.
  2. 다양한 형식의 인스턴스 메서드 참조
     - 예를 들어 `String.length()` 메서드는 `String::length`로 표현할 수 있다.
  3. 기존 객체의 인스턴스 메서드 참조
     - 예를 들어 Transaction 객체를 할당받은 `expensiveTransaction` 지역 변수가 있고, Transaction 객체에는 `getValue()` 메서드가 있다면, 이를 `expensiveTransaction::getValue`로 표현할 수 있다.

## Reference

- [모던 자바 인 액션](https://www.aladin.co.kr/shop/wproduct.aspx?ItemId=200069290)
