FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline -B
COPY src ./src
RUN mvn clean package -DskipTests

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
RUN addgroup -S medical && adduser -S medical -G medical
COPY --from=build /app/target/*.jar app.jar

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
