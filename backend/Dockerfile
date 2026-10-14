# ----------------------------------------------------
# Stage 1: Build Application with Maven
# ----------------------------------------------------
FROM eclipse-temurin:21-jdk-alpine AS builder

WORKDIR /build

# Copy Maven wrapper and POM for dependency pre-fetching
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
RUN chmod +x mvnw && ./mvnw dependency:go-offline -B

# Copy application source code and package executable fat JAR
COPY src/ src/
RUN ./mvnw clean package -DskipTests -B

# ----------------------------------------------------
# Stage 2: Minimal Distroless / Hardened Alpine Runtime
# ----------------------------------------------------
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# Create unprivileged system group and user
RUN addgroup -S devtrack && adduser -S devtrack -G devtrack

# Copy executable jar from builder stage
COPY --from=builder /build/target/devtrack-backend-*.jar app.jar
RUN chown devtrack:devtrack app.jar

# Drop root privileges
USER devtrack:devtrack

# Default JVM parameters optimized for container memory constraints
ENV JAVA_OPTS="-XX:+UseG1GC -XX:MaxRAMPercentage=75.0 -XX:+ExitOnOutOfMemoryError"
ENV SERVER_PORT=8080

EXPOSE 8080

# Native healthcheck using wget (bundled in Alpine busybox) against Spring Boot Actuator
HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:${SERVER_PORT}/actuator/health || exit 1

ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar app.jar"]
