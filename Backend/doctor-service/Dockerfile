FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /build

# The build context is Backend/, not this folder, because the service needs
# common-lib beside it. The shared library is installed into the local
# repository first and then resolved as an ordinary dependency, so the image
# never needs the aggregator pom or the other services' modules.
COPY common-lib/pom.xml common-lib/
COPY common-lib/src common-lib/src
RUN mvn -B -f common-lib/pom.xml install -DskipTests

# Poms before sources, so a source-only change does not re-resolve everything.
COPY doctor-service/pom.xml doctor-service/
RUN mvn -B -f doctor-service/pom.xml dependency:go-offline
COPY doctor-service/src doctor-service/src
RUN mvn -B -f doctor-service/pom.xml clean package -DskipTests

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
RUN addgroup -S medical && adduser -S medical -G medical
USER medical
COPY --from=build /build/doctor-service/target/*.jar app.jar
EXPOSE 8003
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:8003/actuator/health || exit 1
ENTRYPOINT ["java", "-jar", "app.jar"]