---
layout: "post"
title: "JPA에서 엔티티를 수정하면 언제 UPDATE 쿼리가 나갈까"
tags:
  - java
  - jpa
  - db
category:
  - db
date:
  - 2026-04-12
---

# 들어가며

JPA를 처음 사용할 때 가장 헷갈렸던 점 중 하나는, 엔티티의 값을 바꿨는데도 바로 `UPDATE` 쿼리가 나가지 않는다는 점이었다.

예를 들어 다음과 같은 코드를 작성했다고 하자.

```java
Member member = em.find(Member.class, 1L);
member.setName("changed");
```

코드를 처음 보면 `setName()`을 호출하는 순간 데이터베이스에 바로 `update` 쿼리가 날아갈 것처럼 느껴진다. 하지만 실제로는 그렇지 않다. 어떤 경우에는 메서드가 끝날 때까지 조용하고, 어떤 경우에는 `flush()`를 호출하는 순간 쿼리가 실행된다. 또 어떤 경우에는 `clear()`를 호출한 뒤에 다시 조회했더니 예상과 다른 동작을 보이기도 한다.

이번 글에서는 JPA가 엔티티 변경을 어떻게 추적하고, 실제 `UPDATE` 쿼리를 언제 데이터베이스로 보내는지 정리해보려고 한다.

# 예제

먼저 가장 단순한 예제를 보자.

```java
EntityManager em = emf.createEntityManager();
EntityTransaction tx = em.getTransaction();

tx.begin();

Member member = em.find(Member.class, 1L);
member.setName("changed");

tx.commit();
```

이 코드를 보면 `find()`로 회원 엔티티를 조회한 뒤, 이름을 변경하고 커밋한다. 이때 SQL의 흐름은 대체로 다음과 같다.

```sql
select m.id, m.name
from member m
where m.id = 1;

update member
set name = 'changed'
where id = 1;
```

중요한 점은 `member.setName("changed")`를 호출한 순간 바로 `update`가 실행되는 것이 아니라는 점이다. JPA는 일단 엔티티의 변경을 메모리에서 추적하고 있다가, 나중에 적절한 시점에 SQL을 실행한다.

이 동작을 이해하려면 먼저 영속성 컨텍스트와 1차 캐시를 이해해야 한다.

# 영속성 컨텍스트와 1차 캐시

JPA에서 조회한 엔티티는 그냥 자바 객체 하나를 반환하고 끝나는 것이 아니다. 엔티티 매니저는 조회한 엔티티를 영속성 컨텍스트 안에서 관리한다. 흔히 이 내부 저장 공간을 1차 캐시라고 부른다.

즉, 아래와 같은 코드가 있다면

```java
Member member1 = em.find(Member.class, 1L);
Member member2 = em.find(Member.class, 1L);
```

같은 트랜잭션, 같은 엔티티 매니저 안에서는 두 번째 조회 시 데이터베이스를 다시 조회하지 않고, 영속성 컨텍스트에 들어 있는 엔티티를 그대로 반환한다.

이 구조 덕분에 JPA는 단순히 객체를 조회하는 수준을 넘어서, 현재 이 엔티티가 처음 조회됐을 때 어떤 상태였는가, 지금 어떤 값으로 바뀌었는가를 추적할 수 있게 된다.

# Dirty Checking

JPA는 영속 상태의 엔티티가 변경되었는지를 자동으로 감지하는데, 이를 Dirty Checking이라고 한다.

동작 순서는 대략 다음과 같다.

1. 엔티티를 조회해서 영속성 컨텍스트에 올린다.
2. 이때 최초 상태를 스냅샷처럼 내부에 보관한다.
3. 개발자가 엔티티의 값을 수정한다.
4. `flush()` 또는 `commit()` 시점에 현재 값과 최초 값을 비교한다.
5. 값이 달라졌다면 `UPDATE` 쿼리를 만든다.

즉, 개발자가 `update` 메서드를 직접 호출하지 않아도, 영속 상태의 엔티티만 잘 관리되고 있다면 변경 사항을 자동으로 데이터베이스에 반영할 수 있다.

그래서 JPA에서는 다음과 같은 코드가 자연스럽다.

```java
Member member = em.find(Member.class, 1L);
member.setName("changed");
```

여기에는 `save()`도 없고 `update()`도 없지만, 트랜잭션이 정상적으로 끝나면 변경 내용이 반영된다. 이 점이 JPA를 처음 접할 때는 편리하기도 하지만, 내부 동작을 모르면 오히려 더 혼란스럽기도 하다.

# flush는 무엇인가

그렇다면 실제 `UPDATE` 쿼리는 언제 나갈까? 이 시점과 관련된 핵심이 `flush()`다.

`flush()`는 영속성 컨텍스트의 변경 내용을 데이터베이스에 반영하도록 SQL을 내보내는 작업이다. 다시 말해서, 메모리에서만 관리되던 변경 사항을 실제 SQL로 변환하여 데이터베이스로 전달하는 시점이다.

예를 들어 아래 코드를 보자.

```java
tx.begin();

Member member = em.find(Member.class, 1L);
member.setName("changed");

em.flush();

tx.commit();
```

이 경우 `em.flush()`를 호출하는 순간 `update` 쿼리가 실행될 수 있다. 다만 여기서 주의해야 할 점은, `flush()`가 곧 `commit()`은 아니라는 점이다.

`flush()`는 SQL을 보내는 것이고, `commit()`은 트랜잭션을 최종 확정하는 것이다. 따라서 `flush()` 이후에는 현재 트랜잭션 안에서는 변경 내용을 확인할 수 있지만, 다른 트랜잭션에서 그 값이 바로 보이는 것은 아니다. 최종 반영 여부는 여전히 커밋에 달려 있다.

이 때문에 `flush`와 `commit`을 같은 개념으로 이해하면 여러 곳에서 오해가 생긴다.

# Write-Behind

JPA가 변경 시점마다 바로 SQL을 날리지 않고, `flush`나 `commit` 시점까지 미루는 방식을 보통 Write-Behind라고 부른다.

즉, 엔티티를 수정했다고 해서 그 자리에서 즉시 쓰기 요청을 보내지 않는다. 일단 영속성 컨텍스트 안에 변경 내역을 쌓아두고, 나중에 적절한 시점에 한꺼번에 SQL을 실행한다.

이 방식은 다음과 같은 장점이 있다.

- 트랜잭션 범위 안에서 객체 중심으로 작업할 수 있다.
- SQL 실행 시점을 어느 정도 모아서 다룰 수 있다.
- Dirty Checking과 함께 동작하면서 개발자가 직접 변경 쿼리를 관리할 부담을 줄여준다.

반대로, 내부 동작을 이해하지 못하면 왜 값을 바꿨는데 아직 DB에 반영이 안 되었지 같은 혼란을 만들기도 한다.

# clear는 flush와 다르다

`clear()`는 `flush()`와 자주 같이 언급되지만, 역할은 완전히 다르다.

`flush()`가 변경 내용을 데이터베이스에 반영하는 작업이라면, `clear()`는 영속성 컨텍스트를 비워서 현재 관리 중인 엔티티들을 더 이상 관리하지 않게 만드는 작업이다.

예를 들면 다음과 같다.

```java
Member member = em.find(Member.class, 1L);
member.setName("changed");

em.clear();
```

이 경우 `clear()`만 호출했다면, 영속성 컨텍스트가 비워지므로 `member`는 더 이상 영속 상태가 아니다. 따라서 이후에는 Dirty Checking의 대상도 아니게 된다.

이 점은 배치나 테스트 코드를 작성할 때 특히 중요하다. 지금 보고 있는 객체가 정말 영속성 컨텍스트에 의해 관리되고 있는 상태인지, 아니면 이미 분리된 상태인지를 구분하지 못하면 예상과 다른 결과를 만나기 쉽다.

# 한 가지 더: @DynamicUpdate

Dirty Checking이 변경을 감지한다고 해서, 항상 변경된 컬럼만 넣은 `UPDATE` 쿼리가 만들어지는 것은 아니다.

Hibernate는 기본적으로 `UPDATE` 시 전체 컬럼을 대상으로 쿼리를 생성할 수 있다. 만약 정말 수정된 필드만 포함한 쿼리를 만들고 싶다면 `@DynamicUpdate`를 고려할 수 있다.

다만 이 부분은 Dirty Checking이 동작하는가와는 다른 주제다. Dirty Checking은 변경 여부를 감지하는 메커니즘이고, `@DynamicUpdate`는 생성되는 SQL의 모양을 조정하는 기능에 가깝다. 이 둘은 같이 언급되지만 같은 개념은 아니다.

# 정리

JPA에서 엔티티를 수정했다고 해서 바로 `UPDATE` 쿼리가 나가는 것은 아니다.

엔티티는 먼저 영속성 컨텍스트에 올라가고, JPA는 그 안에서 엔티티의 최초 상태와 현재 상태를 비교한다. 그리고 `flush()`나 `commit()` 시점에 Dirty Checking을 수행한 뒤 실제 SQL을 실행한다. 이 과정에서 변경 내용을 뒤로 미루는 방식이 Write-Behind다.

결국 JPA의 변경 감지를 이해하려면 다음 순서를 같이 봐야 한다.

- 엔티티는 영속성 컨텍스트에서 관리된다.
- 변경은 Dirty Checking으로 감지된다.
- SQL 실행은 `flush()` 시점에 일어난다.
- 최종 반영은 `commit()`에서 확정된다.
- `clear()`는 이 관리 상태 자체를 끊어버린다.

JPA를 사용할 때 왜 쿼리가 지금 안 나가지라는 의문이 생긴다면, 대부분은 이 흐름 안에서 설명할 수 있다.
