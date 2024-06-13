---
title: "[Spring] MyBatis 사용법"
excerpt: "spring boot, mybatis"

categories:
    - Spring
tags:
    - [spring-boot, mybatis]

toc: true
toc_sticky: true

sidebar:
    nav: "categories"

date: 2024-06-13
last_modified_at: 2024-06-13
---

# MyBatis 소개

-   `JdbcTemplate`보다 더 많은 기능을 제공하는 **SQL Mapper**이다.
    -   기본적으로 `JdbcTemplate`이 제공하는 대부분의 기능을 제공하고, SQL을 XML으로 동적 쿼리도 활용하여 편리하게 작성할 수 있다.

<br>

# SQL 여러줄

## JdbcTemplate

```java
String sql = "update item " +
"set item_name=:itemName, price=:price, quantity=:quantity " +
"where id=:id";
```

## MyBatis

```xml
<update id="update">
    update item
    set item_name=#{itemName},
        price=#{price},
        quantity=#{quantity}
    where id = #{id}
</update>
```

-   MyBatis는 XML에 작성하기 때문에 라인이 길어져도 문자 더하기에 대한 불편함이 없다
    -   즉, 공백을 신경쓸 필요가 없음

<br>

# Mapper Interface

```java
@Mapper
public interface ItemMapper {

    void save(Item item);

    void update(@Param("id") Long id, @Param("updateParam") ItemUpdateDto updateParam);

    Optional<Item> findById(Long id);

    List<Item> findAll(ItemSearchCond itemSearch);

}
```

-   매퍼 인터페이스(`@Mapper`)는 MyBatis Mapping XML을 호출해 준다.
-   이 인터페이스의 메서드를 호출하면, xml 파일의 해당 SQL을 실행하고 결과를 돌려준다.
    -   xml에서의 `id`가 인터페이스의 메서드명임

## Mapper Interface의 구현체가 없는데 동작한 이유

<img width="1067" alt="Screenshot 2024-06-15 at 9 56 55 PM" src="https://github.com/devbattery/devbattery.github.io/assets/62871026/0f81853d-6b29-475f-926b-b3e619378eba">

1. 애플리케이션 로딩 시점에 MyBatis 스프링 연동 모듈은 `@Mapper`가 붙어 있는 인터페이스를 조사한다.
2. 해당 인터페이스가 발견되면, 동적 프록시 기술을 사용해서 **매퍼 인터페이스**의 구현체를 만든다.
3. 생성된 매퍼 인터페이스의 구현체를 스프링 빈으로 등록한다.

<br>

-   위와 같이 매퍼 인터페이스의 구현체가 없어도, MyBatis 스프링 연동 모듈에서 자동으로 처리해주기 때문에 정상적으로 동작할 수 있게 된다.
    -   이로 데이터베이스 커넥션, 트랜잭션과 관련된 기능도 MyBatis와 함께 연동하고 동기화해줌

## 매퍼 구현체

-   MyBatis 스프링 연동 모듈이 만들어 주는 매퍼 인터페이스의 구현체 덕분에, 인터페이스만으로 편리하게 XML의 데이터를 찾아서 호출할 수 있다.
-   원래 MyBatis를 사용하려면 더 번잡한 코드를 거쳐야 하지만, 이런 부분을 인터페이스 하나로 깔끔하고 편리하게 사용할 수 있다.
-   매퍼 구현체는 예외 변환까지 처리해 준다.
    -   MyBatis에서 발생한 예외를 스프링 예외 추상화에 맞게 변환해서 반환해 줌 (JdbcTemplate이 제공하는 예외 변환 기능)

<br>

# 동적 쿼리

## JdbcTemplate

```java
String sql = "select id, item_name, price, quantity from item";

if (StringUtils.hasText(itemName) || maxPrice != null) {
    sql += " where";
}

boolean andFlag = false;

if (StringUtils.hasText(itemName)) {
    sql += " item_name like concat('%',:itemName,'%')";
    andFlag = true;
}

if (maxPrice != null) {
    if (andFlag) {
        sql += " and";
    }

    sql += " price <= :maxPrice";
}

log.info("sql={}", sql);
return template.query(sql, param, itemRowMapper());
```

-   JdbcTemplate은 자바 코드로 직접 동적 쿼리를 작성해야 한다.

## MyBatis

```xml
<select id="findAll" resultType="Item">
    select id, item_name, price, quantity
    from item
    <where>
        <if test="itemName != null and itemName != ''">
            and item_name like concat('%', #{itemName}, '%')
        </if>
        <if test="maxPrice != null">
            and price &lt;= #{maxPrice}
        </if>
    </where>
</select>
```

-   반면에, MyBatis는 동적 쿼리를 매우 편리하게 작성할 수 있는 다양한 기능들을 제공해 준다.

<br>

# Reference

-   [스프링 DB 2편 - 데이터 접근 활용 기술](https://www.inflearn.com/course/%EC%8A%A4%ED%94%84%EB%A7%81-db-2/dashboard)
