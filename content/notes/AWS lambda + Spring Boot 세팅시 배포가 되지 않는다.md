---
title: AWS lambda + Spring Boot 세팅시 ClassNotFoundException 에러 발생
tags:
  - java
  - aws
date:
  - 2022-03-06
date created: 일요일, 3월 6일 2022, 10:36:51 오후
date modified: 수요일, 6월 18일 2025, 10:04:50 오후
---
# 문제점
AWS lambda + Spring Boot 로 세팅시에, jar 를 빌드해서 업로드하면 Class 를 찾지 못한다는 에러가 발생함
> ClassNotFoundException’ 또는 ‘NoSuchMethodError’ 오류가 발생

# 환경
- AWS Lambda
- Spring Boot 2.6.4

# 원인
- [Spring Initializer](https://start.spring.io) 를 사용하면, maven build 시에 기본적으로 Spring-boot-maven-plugin 이 세팅됨
  - 이 플러그인이 없이 jar 를 빌드하면, jar 에 의존성이 있는 라이브러리가 같이 빌드되지 않는 문제점이 있다
  - 즉, - main class 와 start class, 컴파일 된 class 의 path, pom.xml 이 의존하고 있는 라이브러리의 경로를 MENIFEST.MF 에 세팅해준다
- spring-boot-maven-plugin 으로 빌드시, 1.5.9.RELEASE jar file 에는 **com, lib, META-INF, and org** 디렉토리가 있음
- Spring Boot 2.0.0 부터는 **BOOT-INF, META-INF and org** 디렉토리가 있고, 모든 클래스 파일은 **BOOT-INF** 에 저장됨
- 클래스 파일이 저장되는 위치가 다르기 때문에, 실제로 class file 을 찾을 수가 없다

# 해결책
- AWS 공식 가이드에 있는 빌드 플러그인을 사용한다([가이드](https://docs.aws.amazon.com/ko_kr/lambda/latest/dg/java-package.html#java-package-maven))
  - [Maven-shade-plugin](https://maven.apache.org/plugins/maven-shade-plugin/)

# 참고 
- [AWS lambda 빌드 플러그인 가이드](https://docs.aws.amazon.com/ko_kr/lambda/latest/dg/java-package.html#java-package-maven)
- [빌드 path 가 달라졌다는 stack overflow 글](https://stackoverflow.com/questions/58176456/spring-boot-maven-plugin-boot-inf-directory-causing-aws-lambda-application-to)
- maven-shade-plugin
  - 모든 의존성을 포함한, 하나의 single jar 파일을 생성해준다. 이를 uber jar 라고 부름
  - spring-boot-maven-plguin 과 하는 일이 비슷하다