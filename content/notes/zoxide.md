---
date created: 토요일, 12월 27일 2025, 12:16:55 오전
date modified: 토요일, 12월 27일 2025, 12:22:46 오전
title: Zoxide 설치와 사용법
date:
  - 2025-12-26
tags:
  - terminal
---

맥을 인스톨하면 꼭 사용하는 몇몇 터미널 도구가 있다. 그 중 하나가 `zoxide` 이다. 사용자가 자주 사용하는 디렉토리로 빠르게 이동할 수 있는 도구이다.

# 설치 조건
- mac 을 사용한다.
- homebrew 가 설치되어 있다.
# 설치
```shell
brew install zoxide
```

## Setup
사용하는 쉘에 맞춰 추가 설정이 필요하다. 나는 `zsh` 을 사용중이라, 이에 맞는 설정을 남겨둔다. `~/.zshrc` 에 아래 설정을 추가한다.

```shell
eval "$(zoxide init zsh)"
```

## fzf
추가로 fzf 를 같이 사용하면 좋다. optional 이긴 하지만, fzf 는 유명하고 유용한 도구이므로 같이 인스톨하는걸 추천한다
```shell
brew install fzf
```

# 용례
```shell
z foo # foo 와 가장 많이 겹치는 디렉토리로 이동한다
z foo bar # foo와 bar 하고 가장 많이 겹치는 디렉토리로 이동한다
zi foo # fzf 를 사용하여, 대화형 선택을 할 수 있다
```
