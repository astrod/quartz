---
date created: 화요일, 2월 15일 2022, 4:33:45 오후
date modified: 일요일, 3월 3일 2024, 9:35:14 오후
---
# Helm
- The package manager for Kubernetes
- Helm is the best way to find, share, and use software built for Kubernetes
- 쿠버네티스에 여러 툴들을 편하게 설치할 수 있게 해 주는, 쿠버네티스의 패키지 매니저
- 현재는 Helm3 이 나와있지만, 나는 지금 Helm2 를 사용하고 있기 때문에, 이 글에서는 Helm 2 기준으로 이야기 할 예정
- 실제로 사용하는 명령어들을 설명하려고 한다

# Install
 ```shell
  # 최신 버전
  brew install helm

  # 과거 버전을 설치하려면 다음과 같이 한다
  curl -fsSL -o get_helm.sh https://raw.githubusercontent.com/helm/helm/master/scripts/get-helm-3
  chmod 700 get_helm.sh
  ./get_helm.sh -v v2.14.3
```
## Helm2
- Helm2 를 설치한다면 다음 명령어를 수행해준다
```shell
  helm init --override spec.selector.matchLabels.'name'='tiller',spec.selector.matchLabels.'app'='helm' --output yaml | sed 's@apiVersion: extensions/v1beta1@apiVersion: apps/v1@' | kubectl apply -f -
```
# Chart
- Helm 은 Chart 라는 yaml 파일을 통해 선언형 방식으로 패키지를 설치할 수 있게 한다
- 기존에 생성된 여러 가지 챠트를 외부 래포지토리에서 가져와서 사용할 수도 있다
- @See https://helm.sh/docs/topics/charts/
# 요구사항
- 쿠버네티스 클러스터가 있어야 한다
- 보안 설정이 있다면, 설치시에 어떤 보안 설정을 추가할지 확인해야 한다
- Helm 을 설치하고 설정을 마쳐놓은 상태여야 한다
# list
- 설치되어 있는 패키지 목록 확인 가능
 ```shell
  helm list
  ```
# install
```shell
helm repo add bitnami https://charts.bitnami.com/bitnami # add chart repo
helm repo update              # Make sure we get the latest list of charts
helm install bitnami/mysql --generate-name
```
# Upgrade
- 생성한 helm chart 를 패키지에 반영한다
 ```shell
helm upgrade [RELEASE] [CHART] [flags]

# example
helm upgrade -f <path-to-helm-chart> <release> <chart> --version 7.4.4
```
- **-f (--values strings)** : YMAL 파일이나 URL 의 value 를 세팅한다. 해당 챠트의 value 를 override 하여 자신이 원하는 프로퍼티를 세팅할 수 있다
# Uninstall
 ```shell
  helm uninstall mysql-1612624192

  # result
  release "mysql-1612624192" uninstalled
```
# General Conventions
## Chart Name
- 챠트 네임은 소문자로 하고, dash 로 연결한다
- nginx-lego
## Formatting YAML
- 2 space 로 인덴트를 구성한다