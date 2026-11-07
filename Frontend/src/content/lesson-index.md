# 강의 MDX 본문 목록

각 `.mdx` 파일에서 본문과 실습 배치를 수정합니다. 제목·순서·평가·실습 구성은 같은 이름의 `.lesson.ts`에서 수정합니다.

| 단원 | 순서 | 문서                                                                          | 제목                                      |
| ---- | ---- | ----------------------------------------------------------------------------- | ----------------------------------------- |
| 0    | 1    | [mlops-overview](lessons/00-overview/mlops-overview.mdx)                      | MLOps란?                                  |
| 0    | 2    | [ec2-compute](lessons/00-overview/ec2-compute.mdx)                            | EC2는 코드를 실행하는 컴퓨터              |
| 0    | 3    | [s3-objects](lessons/00-overview/s3-objects.mdx)                              | S3는 객체를 보관하는 저장소               |
| 1    | 1    | [container-isolation](lessons/02-runtime/container-isolation.mdx)             | 커널을 공유하면서 어떻게 격리할까         |
| 1    | 2    | [k8s-control-traffic](lessons/02-runtime/k8s-control-traffic.mdx)             | Pod 배치와 요청 전달의 경로 나누기        |
| 1    | 3    | [docker-image](lessons/02-runtime/docker-image.mdx)                           | 이미지와 컨테이너의 관계                  |
| 1    | 4    | [docker-commands](lessons/02-runtime/docker-commands.mdx)                     | Docker 명령으로 상태 바꾸기               |
| 1    | 5    | [vm-container](lessons/02-runtime/vm-container.mdx)                           | VM과 컨테이너는 무엇을 공유할까           |
| 1    | 6    | [k8s-basics](lessons/02-runtime/k8s-basics.mdx)                               | Kubernetes는 컨테이너의 실행을 관리한다   |
| 1    | 7    | [week2-workflow](lessons/02-runtime/week2-workflow.mdx)                       | 같은 이미지로 서비스를 복구하기           |
| 2    | 1    | [storage-lifecycle](lessons/03-storage/storage-lifecycle.mdx)                 | 파일의 수명과 공유 조건 판단하기          |
| 2    | 2    | [storage-compare](lessons/03-storage/storage-compare.mdx)                     | Block·File·Object의 접근 방식             |
| 2    | 3    | [object-mlops](lessons/03-storage/object-mlops.mdx)                           | MLOps에서 Object Storage를 쓰는 이유      |
| 2    | 4    | [io-starvation](lessons/03-storage/io-starvation.mdx)                         | 데이터가 늦으면 GPU도 기다린다            |
| 2    | 5    | [pv-pvc](lessons/03-storage/pv-pvc.mdx)                                       | PV와 PVC로 Pod 밖의 데이터 연결           |
| 2    | 6    | [week3-workflow](lessons/03-storage/week3-workflow.mdx)                       | GPU까지 끊기지 않는 데이터 공급           |
| 3    | 1    | [dvc-pipeline](lessons/04-reproducibility/dvc-pipeline.mdx)                   | 입력이 바뀌면 어느 단계부터 다시 실행할까 |
| 3    | 2    | [lakehouse-time-travel](lessons/04-reproducibility/lakehouse-time-travel.mdx) | 파일 묶음에 테이블과 시점을 부여하기      |
| 3    | 3    | [git-large](lessons/04-reproducibility/git-large.mdx)                         | Git에 큰 파일을 계속 넣으면               |
| 3    | 4    | [git-lfs](lessons/04-reproducibility/git-lfs.mdx)                             | Git LFS는 큰 파일을 포인터로 추적         |
| 3    | 5    | [dvc-architecture](lessons/04-reproducibility/dvc-architecture.mdx)           | DVC의 Git·캐시·원격 저장소                |
| 3    | 6    | [dvc-restore](lessons/04-reproducibility/dvc-restore.mdx)                     | 과거 코드와 데이터를 함께 복원            |
| 3    | 7    | [week4-workflow](lessons/04-reproducibility/week4-workflow.mdx)               | 과거 실험의 코드와 데이터 되찾기          |
| 4    | 1    | [gpu-specs-accumulation](lessons/05-gpu/gpu-specs-accumulation.mdx)           | GPU 사양과 유효 배치 크기 읽기            |
| 4    | 2    | [cpu-gpu](lessons/05-gpu/cpu-gpu.mdx)                                         | 딥러닝에서 GPU를 사용하는 이유            |
| 4    | 3    | [cuda-layers](lessons/05-gpu/cuda-layers.mdx)                                 | CUDA는 프레임워크와 GPU를 잇는다          |
| 4    | 4    | [vram-oom](lessons/05-gpu/vram-oom.mdx)                                       | VRAM이 부족하면 OOM이 발생한다            |
| 4    | 5    | [data-parallel](lessons/05-gpu/data-parallel.mdx)                             | 데이터 병렬: 모델은 복제, 데이터는 분할   |
| 4    | 6    | [model-parallel](lessons/05-gpu/model-parallel.mdx)                           | 모델 병렬: 레이어를 나누어 배치           |
| 4    | 7    | [tensor-parallel](lessons/05-gpu/tensor-parallel.mdx)                         | 텐서 병렬: 하나의 연산을 나누기           |
| 4    | 8    | [week1-workflow](lessons/05-gpu/week1-workflow.mdx)                           | GPU 두 장으로 큰 모델 학습하기            |
| 5    | 1    | [feature-point-in-time](lessons/06-features/feature-point-in-time.mdx)        | 과거 시점에 알 수 있었던 피처만 사용하기  |
| 5    | 2    | [feature-store](lessons/06-features/feature-store.mdx)                        | Feature Store로 학습과 서빙을 맞추기      |
| 5    | 3    | [feature-workflow](lessons/06-features/feature-workflow.mdx)                  | 학습과 추론의 두 피처 경로                |
| 6    | 1    | [ann-hnsw](lessons/07-rag/ann-hnsw.mdx)                                       | 정확 검색과 근사 검색의 비용 비교하기     |
| 6    | 2    | [embedding](lessons/07-rag/embedding.mdx)                                     | 임베딩은 의미를 비교할 좌표               |
| 6    | 3    | [vector-search](lessons/07-rag/vector-search.mdx)                             | 조건 검색과 유사도 검색의 차이            |
| 6    | 4    | [rag](lessons/07-rag/rag.mdx)                                                 | RAG는 검색한 근거를 생성에 전달           |
| 6    | 5    | [rag-workflow](lessons/07-rag/rag-workflow.mdx)                               | 문서 준비와 질문 응답의 두 경로           |
| 7    | 1    | [serving-protocols](lessons/08-serving/serving-protocols.mdx)                 | HTTP와 gRPC는 무엇을 바꿀까               |
| 7    | 2    | [serving-modes](lessons/08-serving/serving-modes.mdx)                         | Batch와 Real-time 서빙                    |
| 7    | 3    | [recreate-release](lessons/08-serving/recreate-release.mdx)                   | 중단 배포에서 요청은 어떻게 될까          |
| 7    | 4    | [blue-green](lessons/08-serving/blue-green.mdx)                               | Blue·Green: 준비 후 한 번에 전환          |
| 7    | 5    | [canary](lessons/08-serving/canary.mdx)                                       | Canary: 일부 실제 요청부터                |
| 7    | 6    | [shadow](lessons/08-serving/shadow.mdx)                                       | Shadow: 요청은 복제, 응답은 기존 모델     |
| 7    | 7    | [week6-workflow](lessons/08-serving/week6-workflow.mdx)                       | 사용자 응답을 지키며 모델 전환하기        |
| 8    | 1    | [observability-signals](lessons/09-monitoring/observability-signals.mdx)      | 지표·로그·트레이스로 하나의 요청 조사하기 |
| 8    | 2    | [model-drift](lessons/09-monitoring/model-drift.mdx)                          | 시간이 지나며 모델 품질이 달라진다        |
| 8    | 3    | [prometheus](lessons/09-monitoring/prometheus.mdx)                            | Prometheus로 지표를 수집하기              |
| 8    | 4    | [monitor-improve](lessons/09-monitoring/monitor-improve.mdx)                  | 관측에서 검증된 개선까지                  |
| 8    | 5    | [week7-workflow](lessons/09-monitoring/week7-workflow.mdx)                    | 모델 품질 경고에서 검증된 개선까지        |
| 9    | 1    | [week5-workflow](lessons/10-capstone/week5-workflow.mdx)                      | 피처와 검색 근거로 상품 상담 만들기       |
| 9    | 2    | [pipeline-capstone](lessons/10-capstone/pipeline-capstone.mdx)                | 전체 파이프라인: 자료를 따라 끝까지       |

0단원은 기존 0·1단원을 통합했습니다. 다른 폴더의 이름은 유지하며 실제 단원과 순서는 설정의 `unit`, `order`가 결정합니다.
