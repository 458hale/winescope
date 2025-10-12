---
title: "EARS 요구사항 정의서"
author: "458hale"
tags: [requirements]
created: 2025-10-12 09:25
updated: 2025-10-12 09:25
---

## User Story

나는 {역할}로서, {목표}를 하고 싶다.  그 결과 {효익/가치}를 얻을 수 있다.

## Acceptance Criteria (EARS)

### Ubiquitous

- 시스템은 {항상 보장할 동작}을 수행해야 한다.
- 시스템은 {추가 동작}을 반드시 제공해야 한다.

### Event

- {조건/이벤트}가 발생하면, 시스템은 {기대 동작}을 수행해야 한다.
- {다른 조건/이벤트}가 발생하면, 시스템은 {다른 기대 동작}을 수행해야 한다.

### State

- {상태/맥락}인 동안, 시스템은 {기대 동작}을 수행해야 한다.
- {다른 상태/맥락}인 동안, 시스템은 {추가 기대 동작}을 수행해야 한다.

### Optional

- {선택 기능이 활성화된 경우}, 시스템은 {동작}을 수행해야 한다.
- {다른 선택 조건}일 경우, 시스템은 {추가 동작}을 수행해야 한다.

### Unwanted

- {금지 상황/에러 조건}에서는, 시스템은 {금지 동작}을 해서는 안 되며, 대신 {대체 동작}을 수행해야 한다.
- {추가 금지 상황}에서는, 시스템은 {추가 금지 동작}을 해서는 안 된다.

## Business Rules

- R1. {정책/규칙}
- R2. {요금/요율/라벨링 등}

## Data Contract

- Request schema: {필드/타입/제약}
- Response schema: {필드/타입/제약}
- Error schema: {코드/메시지/복구 가이드}

## Non-functional

- Latency P95 ≤ {값}, Throughput ≥ {값}, Availability ≥ {값}.
- Observability: {metrics/log/trace 키}.
