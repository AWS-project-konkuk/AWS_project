BACKEND_IMAGE := blockml-backend
FRONTEND_IMAGE := blockml-frontend
TAG := dev1

NAMESPACE := container-3
RELEASE := blockml

SHELL := /bin/bash

.PHONY: build-backend build-frontend build \
		load-backend load-frontend load \
		lint deploy clean \
		start init_setting secret
		
start:
	minikube start --driver=docker --memory=3072 --cpus=2

init_setting:
	kubectl create namespace $(NAMESPACE) --dry-run=client -o yaml | kubectl apply -f -
	kubectl apply -n $(NAMESPACE) -f quota.yaml
	kubectl describe resourcequota team-quota -n $(NAMESPACE)

secret:
	@read -s SUPABASE_DB_URL && export SUPABASE_DB_URL \
	echo "${SUPABASE_DB_URL:0:18}" \
	kubectl create secret generic backend-secret -n $(NAMESPACE) \
		--from-literal=SUPABASE_DB_URL="${SUPABASE_DB_URL}" \
		--from-literal=VLLM_API_KEY=""
		--dry-run=clint -o yaml | kubectl apply -f -

build-backend:
	docker build \
		--secret id=SUPABASE_DB_URL,env=SUPABASE_DB_URL \
		-t $(BACKEND_IMAGE):$(TAG) ./backend

build-frontend:
	docker build -t $(FRONTEND_IMAGE):$(TAG) ./frontend

build: build-backend build-frontend

load-backend:
	minikube image load $(BACKEND_IMAGE):$(TAG)

load-frontend:
	minikube image load $(FRONTEND_IMAGE):$(TAG)

load: load-backend load-frontend

lint:
	helm lint chart/

deploy:
	helm upgrade --install $(RELEASE) chart/ -n $(NAMESPACE) \
		--set backend.image.tag=$(TAG) \
		--set frontend.image.tag=$(TAG) \
		--set frontend.replicas=0 \
		--set-string backend.vllm.baseUrl=""

clean:
	helm uninstall $(RELEASE) -n $(NAMESPACE)

#test 필요(애플리케이션이 잘 돌아가는지 API확인 필요)



