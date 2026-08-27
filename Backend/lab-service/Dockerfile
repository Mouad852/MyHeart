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
COPY lab-service/pom.xml lab-service/
RUN mvn -B -f lab-service/pom.xml dependency:go-offline
COPY lab-service/src lab-service/src
RUN mvn -B -f lab-service/pom.xml clean package -DskipTests

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
RUN addgroup -S medical && adduser -S medical -G medical
COPY --from=build /build/lab-service/target/*.jar app.jar

# The storage directory has to exist in the image, owned by the user the service
# runs as. Docker seeds an empty named volume from the image path it is mounted
# over, ownership included; without this the volume is created root-owned and
# every upload fails with a permission error at the first write.
RUN mkdir -p /var/lib/medcore/lab-results     && chown -R medical:medical /var/lib/medcore

USER medical
EXPOSE 8005
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:8005/actuator/health || exit 1
ENTRYPOINT ["java", "-jar", "app.jar"]
