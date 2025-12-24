# Build Stage
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app

# Copy necessary project files
COPY pom.xml .
COPY common-lib ./common-lib
COPY payment-service ./payment-service

# Install parent pom (non-recursive)
RUN mvn -N install

# Install common-lib
RUN mvn -f common-lib/pom.xml install -DskipTests

# Package payment-service
RUN mvn -f payment-service/pom.xml clean package -DskipTests

# Run Stage
FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /app/payment-service/target/*.jar app.jar
ENTRYPOINT ["java", "-jar", "app.jar"]
