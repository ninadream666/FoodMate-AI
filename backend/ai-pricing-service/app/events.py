import json
import logging
import asyncio
import aio_pika
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from datetime import datetime

from .config import settings
from .models import SalesHistory, PricingProposal, Base
from .deepseek_agent import deepseek_client
from .clients import service_client # 引入新写的 HTTP 客户端

engine = create_async_engine(settings.DATABASE_URL, echo=False)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
logger = logging.getLogger(__name__)

async def init_db():
    # 数据库初始化逻辑
    max_retries = 3
    for attempt in range(max_retries):
        try:
            async with engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)
            return
        except Exception as e:
            logger.warning(f"DB init failed, retrying... {e}")
            await asyncio.sleep(2)

# --- 消费者逻辑 (保持不变，用于收集数据做冗余备份) ---
async def process_order_event(message: aio_pika.IncomingMessage):
    """
    监听 order.events -> order.paid
    将数据写入 SalesHistory 作为物化视图 (Backup)
    """
    async with message.process():
        try:
            data = json.loads(message.body.decode())
            # logger.info(f"Processing Order Event for Pricing: {data.get('orderId')}")
            async with AsyncSessionLocal() as session:
                for item in data.get("items", []):
                    history = SalesHistory(
                        order_id=data.get("orderId"),
                        menu_item_id=item.get("menuItemId"),
                        merchant_id=data.get("merchantId"),
                        quantity=item.get("quantity"),
                        unit_price=item.get("price")
                    )
                    session.add(history)
                await session.commit()
        except Exception as e:
            logger.error(f"Error consuming event: {e}")

# --- 核心：混合驱动定价周期 (Hybrid Pricing Cycle) ---
async def run_pricing_cycle(rabbitmq_channel):
    """
    定时任务：
    1. 扫描活跃商家 (为了演示，写死 ID=1,2，实际可从 Merchant Service 拉取)
    2. HTTP 拉取最新菜单 (解决价格失忆)
    3. HTTP 拉取聚合销量 (解决计算压力)
    4. AI 分析
    5. MQ 发布提案
    """
    logger.info("Starting Hybrid Pricing Analysis Cycle...")
    
    async with AsyncSessionLocal() as session:
        try:
            # 调用 Merchant Service 获取所有 active 的 merchant IDs
            active_merchants = await service_client.get_active_merchants()
            
            if not active_merchants:
                logger.info("No active merchants found for pricing analysis.")
                return

            logger.info(f"Found {len(active_merchants)} active merchants for analysis.")
            
            for merchant in active_merchants:
                merchant_id = merchant.get('id')
                # 获取商家配置的自动审批参数，默认为 False 和 0.05
                auto_approval_enabled = merchant.get('enableAutoApproval', False)
                auto_approval_threshold = merchant.get('autoApprovalThreshold', 0.05)
                
                if merchant_id:
                    await analyze_merchant(session, rabbitmq_channel, merchant_id, auto_approval_enabled, auto_approval_threshold)
                
        except Exception as e:
            logger.error(f"Error in pricing cycle: {e}")

async def analyze_merchant(session, rabbitmq_channel, merchant_id, auto_approval_enabled, auto_approval_threshold):
    logger.info(f"Analyzing Merchant {merchant_id}...")
    
    # 并行获取【菜单】和【销量】(混合架构核心 - Async IO)
    menu_items, sales_stats = await asyncio.gather(
        service_client.get_merchant_menu(merchant_id),
        service_client.get_sales_stats(merchant_id, days=7)
    )
    
    if not menu_items:
        logger.info(f"Merchant {merchant_id} has no menu items.")
        return

    for item in menu_items:
        try:
            item_id = item['id']
            item_name = item['name']
            current_price = float(item['price']) # 这里的价格是【实时】的
            
            # 3. 匹配销量数据
            # 如果没有销量，stats 为 None, default to 0
            stats = sales_stats.get(item_id, {"totalQuantity": 0, "totalRevenue": 0})
            
            # 4. 检查是否有未处理提案 (避免重复生成 Pending 提案)
            result = await session.execute(
                select(PricingProposal).where(
                    PricingProposal.menu_item_id == item_id,
                    PricingProposal.status == "PENDING"
                )
            )
            if result.scalars().first():
                # logger.info(f"Skipping item {item_id}: Pending proposal exists.")
                continue

            # 调用 AI 分析
            analysis = await deepseek_client.analyze_price(item_name, current_price, stats)
            
            suggested = float(analysis.get("suggested_price", current_price))
            strategy = analysis.get("strategy_type", "MAINTAIN")
            reason = analysis.get("reasoning", "")

            # 过滤：如果价格没变且策略是维持，则不生成提案
            # if abs(suggested - current_price) < 0.01:
            #     continue
            
            # 强制生成提案 (调试模式)
            if abs(suggested - current_price) < 0.01:
                logger.info(f"Price unchanged for {item_name}, but forcing proposal for testing.")
                status = "AUTO_APPROVED" # 价格未变，自动通过（仅作记录）
            else:
                # 6. 自动审批逻辑
                status = "PENDING"
                
                # 只有当商家开启了自动审批，且变动幅度在阈值内时，才自动通过
                if auto_approval_enabled:
                    diff_percent = abs(suggested - current_price) / current_price if current_price > 0 else 0
                    if diff_percent <= auto_approval_threshold:
                        status = "AUTO_APPROVED"
                
            # 保存提案到本地 DB
                
            # 保存提案到本地 DB
            proposal = PricingProposal(
                merchant_id=merchant_id,
                menu_item_id=item_id,
                current_price=current_price,
                suggested_price=suggested,
                status=status,
                reasoning=reason,
                strategy_type=strategy,
                created_at=datetime.utcnow()
            )
            session.add(proposal)
            await session.commit()
            
            # 发送事件，通知Merchant Service
            routing_key = "price.proposal.auto" if status == "AUTO_APPROVED" else "price.proposal.pending"
            
            event_payload = {
                "eventType": "PRICE_PROPOSAL_CREATED",
                "proposalId": proposal.id,
                "merchantId": merchant_id,
                "menuItemId": item_id,
                "currentPrice": current_price,
                "newPrice": suggested, # 统一字段名，适配 Java 端
                "reason": reason,
                "status": status,
                "timestamp": datetime.utcnow().isoformat()
            }
            
            # 声明 Exchange (确保存在)
            # 注意：Java 端创建的 Exchange 是 durable=True 的，这里必须匹配
            exchange = await rabbitmq_channel.declare_exchange(
                "pricing.events", 
                aio_pika.ExchangeType.TOPIC,
                durable=True 
            )

            await exchange.publish(
                aio_pika.Message(body=json.dumps(event_payload).encode()),
                routing_key=routing_key
            )
            logger.info(f"Published Proposal: {item_name} -> {suggested} ({status})")
            
        except Exception as e:
            logger.error(f"Error processing item {item.get('id')}: {e}")

# --- 启动消费者 (保持不变) ---
async def start_consumers():
    max_retries = 5
    for attempt in range(max_retries):
        try:
            connection = await aio_pika.connect_robust(settings.RABBITMQ_URL)
            channel = await connection.channel()
            
            # 声明必要的 Exchange
            await channel.declare_exchange("order.events", aio_pika.ExchangeType.TOPIC, durable=True)
            
            # 声明 Queue 并绑定 (用于监听订单完成，更新本地历史)
            queue = await channel.declare_queue("ai_pricing.order_queue", durable=True)
            await queue.bind("order.events", routing_key="order.paid")
            
            await queue.consume(process_order_event)
            
            logger.info("RabbitMQ Connected & Consumer Started.")
            return connection, channel
        except Exception as e:
            logger.warning(f"RabbitMQ connection failed: {e}. Retrying...")
            await asyncio.sleep(5)
    raise Exception("RabbitMQ connection failed after retries")