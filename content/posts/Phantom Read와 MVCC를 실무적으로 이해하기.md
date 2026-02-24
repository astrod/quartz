---
layout: post
title: Phantom Read와 MVCC를 실무적으로 이해하기
tags:
  - db
  - transaction
category:
  - db
date:
  - 2026-02-14
---

# Phantom Read와 MVCC를 실무적으로 이해하기

## Phantom Read 상황 재현

- 트랜잭션 1이 실행 중이다.
- 먼저 아래 쿼리를 실행한다.

```sql
SELECT * FROM orders WHERE price >= 100;
-- 결과: 3개 row
```

- 이 시점에서 트랜잭션 1은 3개 row를 읽은 상태다.
- 트랜잭션 2에서 데이터를 추가하고 커밋한다.

```sql
INSERT INTO orders (price) VALUES (150);
COMMIT;
```

- 트랜잭션 1에서 같은 쿼리를 다시 실행한다.

```sql
SELECT * FROM orders WHERE price >= 100;
```

- 트랜잭션 2의 `INSERT` 이후, 트랜잭션 1에서 추가 row가 조회된다.

## Phantom Read

- Phantom Read는 `SELECT` 범위를 기준으로 조회할 때 나타나는 현상이다.
- 처음 조회할 때 없던 데이터가 생기거나, 있던 데이터가 사라질 수 있다.
- 다른 트랜잭션의 커밋 결과에 영향을 받는다.

## 트랜잭션 격리 수준

| 격리 수준        | Dirty Read | Non-Repeatable Read | Phantom Read |
| ---------------- | ---------- | ------------------- | ------------ |
| READ_UNCOMMITTED | O          | O                   | O            |
| READ_COMMITTED   | X          | O                   | O            |
| REPEATABLE_READ  | X          | X                   | O            |
| SERIALIZABLE     | X          | X                   | X            |

## 대안

- MVCC는 스냅샷 버전을 기준으로 기존 row의 일관성을 보장한다.
- Phantom Read를 막으려면 predicate 범위에 대한 락이 추가로 필요하다.
- 즉, MVCC로 스냅샷 기준 row 일관성을 맞추고, 조회 범위에 추가 락을 걸어야 한다.

## 정리

- 같은 조건으로 다시 조회했는데 결과 row 집합이 달라지면 Phantom Read다.
- MVCC는 기존 row의 일관성을 맞추는 데 초점이 있다.
- Phantom Read까지 막으려면 조회 범위에 대한 락이 함께 필요하다.
