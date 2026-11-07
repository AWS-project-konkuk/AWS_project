FROM eclipse-temurin:25-jdk AS build
WORKDIR /src

COPY . .
RUN sh ./gradlew --no-daemon test bootJar

FROM eclipse-temurin:25-jre
WORKDIR /app

COPY --from=build /src/build/libs/*.jar /app/backend.jar

USER 10001:10001
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/backend.jar"]
