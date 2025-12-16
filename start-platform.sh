#!/bin/bash
set -e

echo "🧹 Cleaning previous builds..."
rm -rf backend/**/target
echo "🚀 Building Backend Services (Maven)..."
cd backend
mvn clean package -DskipTests
cd ..

echo "🐳 Starting Platform with Docker Compose..."
echo "🧹 Cleaning up potential conflicts..."
docker-compose down --remove-orphans || true

docker-compose up -d --build

echo "✅ Platform Started Successfully!"
echo "------------------------------------------------"
echo "🌐 Frontend:    http://localhost"
echo "🔌 API Gateway: http://localhost:8080"
echo "🐘 Postgres:    localhost:5432"
echo "🧠 Redis:       localhost:6379"
echo "------------------------------------------------"
echo "To stop: docker-compose down"
