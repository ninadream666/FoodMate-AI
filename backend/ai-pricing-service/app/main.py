from fastapi import FastAPI, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from .events import start_consumers, init_db, run_pricing_cycle
from .config import settings
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

mq_connection = None
mq_channel = None
scheduler = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 初始化 DB
    await init_db()
    
    # 启动MQ连接和消费者
    global mq_connection, mq_channel
    mq_connection, mq_channel = await start_consumers()
    
    # 启动定时器：每周执行一次全量分析
    global scheduler
    scheduler = AsyncIOScheduler()
    if mq_channel:
        # 添加周期任务
        scheduler.add_job(
            run_pricing_cycle, 
            'interval', 
            seconds=604800,
            args=[mq_channel],
            id='pricing_cycle'
        )
        scheduler.start()
        logger.info("Pricing Scheduler started (Interval: 604800s).")
    else:
        logger.error("MQ not ready, Scheduler NOT started.")
    
    yield
    
    # 清理资源
    if scheduler:
        scheduler.shutdown()
    if mq_connection:
        await mq_connection.close()

app = FastAPI(title=settings.PROJECT_NAME, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:9099", # 允许Swagger UI访问
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health():
    return {"status": "ok"}

@app.post("/trigger-cycle")
async def manual_trigger(bg_tasks: BackgroundTasks):
    """
    手动触发一次分析周期
    """
    if mq_channel:
        bg_tasks.add_task(run_pricing_cycle, mq_channel)
        return {"msg": "Pricing cycle triggered"}
    return {"error": "MQ not ready"}