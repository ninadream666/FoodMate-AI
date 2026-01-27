FROM python:3.11-slim

WORKDIR /app

# 复制依赖文件
COPY requirements.txt .

# 安装Python依赖
RUN pip install --no-cache-dir -r requirements.txt

# 复制应用代码
COPY app/ ./app/
COPY agent_orchestrator.py .
COPY enhanced_mcp_server.py .
COPY mcp_http_server.py .

# 暴露端口
EXPOSE 8082

# 启动命令
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8082"]