FROM python:3.11-slim

WORKDIR /app

# 复制依赖文件
COPY requirements.txt .

# 安装Python依赖
RUN pip install --upgrade pip \
    && pip install --no-cache-dir torch==2.5.1+cpu torchvision==0.20.1+cpu --extra-index-url https://download.pytorch.org/whl/cpu \
    && pip install --no-cache-dir -r requirements.txt

# 复制应用代码
COPY app/ ./app/
COPY agent_orchestrator.py .
COPY enhanced_mcp_server.py .
COPY mcp_http_server.py .

# 创建ML模型&训练数据目录（容器内持久化通过volume挂载）
RUN mkdir -p /app/models /app/ml_data

# ML相关环境变量默认值
ENV ML_DATA_DIR=/app/ml_data
ENV ML_MODEL_DIR=/app/models

# 暴露端口
EXPOSE 8082

# 启动命令
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8082"]