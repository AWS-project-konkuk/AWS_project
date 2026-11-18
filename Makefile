NAMESPACE 	?= container-3
RELEASE	  	?= blockml
ENV_FILE 	?= .env
VALUES		?= chart/values-local.yaml
QUOTA		?= quota.yaml
TEST_PORT	?= 18081

BACKEND_IMAGE	?= blockml-backend
FRONTEND_IMAGE	?= blockml-frontend
TAG				?= $(shell git rev-parse --short HEAD 2>/dev/null || echo dev)

# Minikube 컨텍스트로 실행 설정 (실수로 EKS에 배포를 방지)
KUBECTL := kubectl --context minikube
HELM	:= helm --kube-context minikube

# .env 에서 값 읽기
envval = grep '^$(1)=' $(ENV_FILE) | cut -d= -f2-

.DEFAULT_GOAL := lint
.PHONY: up build build-be build-fe load lint check-env namespace quota secret deploy test clean

up: build load deploy test

check-env:
	@test -f $(ENV_FILE) || { echo "$(ENV_FILE)이 없습니다. cp .env.example .env 후 값을 채워주세요"; exit 1; }
	@for k in SUPABASE_DB_URL VLLM_API_KEY VLLM_BASE_URL; do \
		v=$$(grep "^$$k=" $(ENV_FILE) | cut -d= -f2-); \
		[ -n "$$v" ] || { echo "$$k 값이 비어 있습니다 ($(ENV_FILE))"; exit 1; }; \
	done

build: build-be build-fe

build-be: check-env
	@SUPABASE_DB_URL="$$($(call envval,SUPABASE_DB_URL))" \
	  docker build --secret id=SUPABASE_DB_URL,env=SUPABASE_DB_URL -t $(BACKEND_IMAGE):$(TAG) ./backend

build-fe:
	@docker build -t $(FRONTEND_IMAGE):$(TAG) ./Frontend

load:
	minikube image load $(BACKEND_IMAGE):$(TAG)
	minikube image load $(FRONTEND_IMAGE):$(TAG)

lint:
	helm lint chart/ -f $(VALUES) --set backend.image.tag=$(TAG) --set frontend.image.tag=$(TAG)
	@helm template $(RELEASE) chart/ -f $(VALUES) --set backend.image.tag=$(TAG) --set frontend.image.tag=$(TAG) >/dev/null && echo "OK helm template 렌더링 성공"

namespace:
	@$(KUBECTL) create namespace $(NAMESPACE) --dry-run=client -o yaml | $(KUBECTL) apply -f - >/dev/null

quota: namespace
	@test -f $(QUOTA) || { echo "$(QUOTA) 파일이 존재하지 않습니다."; exit 1; }
	$(KUBECTL) apply -n $(NAMESPACE) -f $(QUOTA)

secret: namespace check-env
	@$(KUBECTL) create secret generic backend-secret -n $(NAMESPACE) --from-env-file=$(ENV_FILE) --dry-run=client -o yaml | $(KUBECTL) apply -f -

deploy: quota secret
	$(HELM) upgrade --install $(RELEASE) chart/ -n $(NAMESPACE) \
	  -f $(VALUES) \
	  --set backend.image.tag=$(TAG) --set frontend.image.tag=$(TAG) \
	  --set-string backend.vllm.baseUrl="$$($(call envval,VLLM_BASE_URL))"
	$(KUBECTL) rollout restart deploy/$(RELEASE)-backend -n $(NAMESPACE)
	$(KUBECTL) rollout status deploy/$(RELEASE)-backend -n $(NAMESPACE) --timeout=300s
	$(KUBECTL) rollout status deploy/$(RELEASE)-frontend -n $(NAMESPACE) --timeout=120s

test:
	@$(KUBECTL) wait --for=condition=available deploy/$(RELEASE)-backend deploy/$(RELEASE)-frontend -n $(NAMESPACE) --timeout=120s
	@$(KUBECTL) port-forward -n $(NAMESPACE) svc/$(RELEASE)-frontend $(TEST_PORT):80 >/dev/null 2>&1 & \
	PF=$$!; trap 'kill $$PF 2>/dev/null' EXIT; \
	base=http://localhost:$(TEST_PORT); fail=0; \
	for i in $$(seq 1 30); do curl -s -o /dev/null $$base/ && break; sleep 1; done; \
	code=$$(curl -s -o /dev/null -w '%{http_code}' $$base/); \
	if [ "$$code" = 200 ]; then echo "OK   1) FE 화면          GET  /           -> $$code"; else echo "FAIL 1) FE 화면          GET  /           -> $$code"; fail=1; fi; \
	code=$$(curl -s -o /dev/null -w '%{http_code}' $$base/api/posts); \
	if [ "$$code" = 200 ]; then echo "OK   2) 게시글 목록      GET  /api/posts  -> $$code (nginx -> BE -> DB)"; else echo "FAIL 2) 게시글 목록      GET  /api/posts  -> $$code"; fail=1; fi; \
	body=$$(curl -s --max-time 130 -X POST $$base/api/chat -H 'Content-Type: application/json; charset=UTF-8' -d '{"message":"안녕"}'); \
	if echo "$$body" | grep -q '"answer"'; then echo "OK   3) AI 채팅          POST /api/chat   -> answer 수신 (BE -> vLLM)"; \
	else echo "FAIL 3) AI 채팅          POST /api/chat   -> $$(echo "$$body" | head -c 200)"; fail=1; fi; \
	body=$$(curl -s --max-time 130 -X POST $$base/api/chat/ai/explain \
		-H 'Content-Type: application/json; charset=UTF-8' \
		-d '{"lessonId":"lesson-01","question":"EC2와 S3의 역할은 무엇인가요?","options":["EC2는 컴퓨팅, S3는 데이터 저장을 담당한다.","EC2는 데이터 저장, S3는 컴퓨팅을 담당한다."],"correct":0,"explanation":"EC2는 컴퓨팅 서비스이고 S3는 객체 스토리지 서비스입니다.","selected":0,"reason":"EC2는 프로그램을 실행하고 S3는 파일을 저장하기 때문입니다."}'); \
	if echo "$$body" | grep -q '"verdict"'; then echo "OK   4) AI 답안 평가      POST /api/chat/ai/explain -> verdict 수신 (BE -> vLLM)"; \
	else echo "FAIL 4) AI 답안 평가      POST /api/chat/ai/explain -> $$(echo "$$body" | head -c 300)"; fail=1; fi; \
	exit $$fail

clean:
	-$(HELM) uninstall $(RELEASE) -n $(NAMESPACE)