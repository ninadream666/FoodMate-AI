from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, JSON
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()

class SalesHistory(Base):
    """
    销售历史记录：从OrderCompletedEvent聚合而来
    """
    __tablename__ = "sales_history"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, index=True)
    menu_item_id = Column(Integer, index=True)
    merchant_id = Column(Integer, index=True)
    quantity = Column(Integer)
    unit_price = Column(Float)
    transaction_time = Column(DateTime, default=datetime.utcnow)

class PricingProposal(Base):
    """
    AI生成的定价提案
    """
    __tablename__ = "pricing_proposals"

    id = Column(Integer, primary_key=True, index=True)
    merchant_id = Column(Integer, index=True)
    menu_item_id = Column(Integer, index=True)
    
    current_price = Column(Float)
    suggested_price = Column(Float)
    
    # 状态: PENDING, AUTO_APPROVED, MERCHANT_APPROVED, REJECTED, ROLLED_BACK
    status = Column(String, default="PENDING") 
    
    reasoning = Column(String)
    strategy_type = Column(String)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    applied_at = Column(DateTime, nullable=True)