# ============================================================
# Patient Service - Dockerfile
# Multi-stage build for optimized production image
# ============================================================

# Stage 1: Build the application using Maven
FROM maven:3.9.6-eclipse-temurin-17 AS build

WORKDIR /app

# Copy pom.xml first for dependency caching (Docker layer cache optimization)
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source code and build
COPY src ./src
RUN mvn clean package -DskipTests

# ============================================================
# Stage 2: Runtime image (smaller - no Maven/JDK tools)
# ============================================================
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# Add a non-root user for security
RUN addgroup -S medical && adduser -S medical -G medical
USER medical

# Copy the built JAR from Stage 1
COPY --from=build /app/target/*.jar app.jar

# Expose the service port
EXPOSE 8081

# Health check (Docker will use this to monitor the container)
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:8081/actuator/health || exit 1

# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"]
