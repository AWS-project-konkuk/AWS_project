# 우리 팀 번호 (이 줄만 바꾼다)
TEAM  ?= 3
NS    := container-$(TEAM)
# local | eks
ENV   ?= local
TAG   ?= 1.0.0
IMAGE ?= ghcr.io/aws-project-konkuk/aws_project
ALB   ?= k8s-sbgdemo-efa2aa8cf7-2001705629.ap-northeast-2.elb.amazonaws.com
# 백엔드 이미지 빌드(테스트 단계)에 필요한 DB 주소를 .env 에서 읽는다
DB_URL = $(shell grep '^SUPABASE_DB_URL=' .env | cut -d= -f2-)

build:
	@SUPABASE_DB_URL='$(DB_URL)' docker build --secret id=SUPABASE_DB_URL,env=SUPABASE_DB_URL -t blockml-backend:dev ./backend
	docker build -t blockml-frontend:dev ./Frontend
load:
	minikube image load blockml-backend:dev
	minikube image load blockml-frontend:dev
push:
	@SUPABASE_DB_URL='$(DB_URL)' docker buildx build --platform linux/amd64 --secret id=SUPABASE_DB_URL,env=SUPABASE_DB_URL -t $(IMAGE)/backend:$(TAG) --push ./backend
	docker buildx build --platform linux/amd64 -t $(IMAGE)/frontend:$(TAG) --push ./Frontend
lint:
	helm lint ./chart -f chart/values.yaml -f chart/values-$(ENV).yaml
deploy:
ifeq ($(ENV),local)
	kubectl apply -n $(NS) -f quota.yaml
	helm upgrade --install app ./chart -n $(NS) -f chart/values.yaml -f chart/values-local.yaml
else
	helm upgrade --install app ./chart -n $(NS) -f chart/values.yaml -f chart/values-eks.yaml --set backend.image.tag=$(TAG) --set frontend.image.tag=$(TAG)
endif
test:
ifeq ($(ENV),local)
	curl -fsS http://127.0.0.1:8080/$(NS)/health
else
	curl -fsS http://$(ALB)/$(NS)/health
endif
rollback:
	helm rollback app -n $(NS)
clean:
	helm uninstall app -n $(NS)

.PHONY: build load push lint deploy test rollback clean
