FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline -B
COPY src ./src
RUN mvn clean package -DskipTests

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
RUN addgroup -S medical && adduser -S medical -G medical
USER medical
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8003
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:8003/actuator/health || exit 1
ENTRYPOINT ["java", "-jar", "app.jar"]