# 构建阶段
FROM maven:3.9-eclipse-temurin-21 AS builder
WORKDIR /app

COPY maven-settings.xml /app/maven-settings.xml

# 1. 安装公共依赖
COPY food-platform-common /app/food-platform-common
RUN mvn -s /app/maven-settings.xml -f /app/food-platform-common/pom.xml clean install -DskipTests

# 2. 构建服务
COPY platform-service/pom.xml /app/platform-service/
COPY platform-service/src /app/platform-service/src
WORKDIR /app/platform-service
RUN mvn -s /app/maven-settings.xml clean package -DskipTests

# 运行阶段
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=builder /app/platform-service/target/*.jar app.jar
EXPOSE 8088
ENTRYPOINT ["java", "-jar", "app.jar"]
