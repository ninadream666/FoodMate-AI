# 构建阶段
FROM maven:3.9-eclipse-temurin-21 AS builder
WORKDIR /app

# 1. 安装公共依赖
COPY food-platform-common /app/food-platform-common
RUN mvn -f /app/food-platform-common/pom.xml clean install -DskipTests

# 2. 构建服务
COPY merchant-service/pom.xml /app/merchant-service/
COPY merchant-service/src /app/merchant-service/src
WORKDIR /app/merchant-service
RUN mvn clean package -DskipTests

# 运行阶段
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=builder /app/merchant-service/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]