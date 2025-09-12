from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from sqlalchemy.orm import Session
from datetime import datetime
import logging
from app.core.database import get_db
from app.models.order import Order

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 全局调度器实例
scheduler = None

def calculate_design_cycle_days(assignment_date: str) -> int:
    """
    计算设计周期（天数）
    
    Args:
        assignment_date: 分单日期，格式为 'YYYY-MM-DD'，可以为 None
    
    Returns:
        int: 设计周期天数
    """
    if assignment_date is None:
        return 0
        
    try:
        assignment = datetime.strptime(assignment_date, '%Y-%m-%d')
        today = datetime.now()
        return (today - assignment).days
    except ValueError as e:
        logger.error(f"日期格式错误: {assignment_date}, 错误: {e}")
        return 0

async def update_design_cycles():
    """
    定时任务：更新所有未下单订单的设计周期
    """
    logger.info("开始执行设计周期更新任务")
    
    # 获取数据库会话
    db_gen = get_db()
    db: Session = next(db_gen)
    
    try:
        # 查询所有状态不是"已下单"的订单
        orders = db.query(Order).filter(
            Order.order_status != "已下单"
        ).all()
        
        updated_count = 0
        
        for order in orders:
            if order.assignment_date:
                # 计算新的设计周期
                new_cycle = calculate_design_cycle_days(order.assignment_date)
                
                # 只有当设计周期发生变化时才更新
                current_cycle = int(order.design_cycle or "0")
                if new_cycle != current_cycle:
                    order.design_cycle = str(new_cycle)
                    updated_count += 1
        
        # 提交更改
        db.commit()
        
        logger.info(f"设计周期更新任务完成，共更新 {updated_count} 条订单记录")
        
    except Exception as e:
        logger.error(f"设计周期更新任务执行失败: {e}")
        db.rollback()
    finally:
        db.close()

def start_scheduler():
    """
    启动定时任务调度器
    """
    global scheduler
    
    if scheduler is None:
        scheduler = AsyncIOScheduler()
        
        # 添加定时任务：每天凌晨2点执行
        scheduler.add_job(
            update_design_cycles,
            trigger=CronTrigger(hour=2, minute=0),  # 每天凌晨2点执行
            id='update_design_cycles',
            name='更新设计周期',
            replace_existing=True
        )
        
        scheduler.start()
        logger.info("定时任务调度器已启动，设计周期更新任务已添加（每天凌晨2点执行）")
    else:
        logger.info("定时任务调度器已在运行中")

def stop_scheduler():
    """
    停止定时任务调度器
    """
    global scheduler
    
    if scheduler and scheduler.running:
        scheduler.shutdown()
        scheduler = None
        logger.info("定时任务调度器已停止")

def get_scheduler_status():
    """
    获取调度器状态
    
    Returns:
        dict: 调度器状态信息
    """
    global scheduler
    
    if scheduler is None:
        return {"status": "未启动", "jobs": []}
    
    jobs = []
    for job in scheduler.get_jobs():
        jobs.append({
            "id": job.id,
            "name": job.name,
            "next_run_time": str(job.next_run_time) if job.next_run_time else None
        })
    
    return {
        "status": "运行中" if scheduler.running else "已停止",
        "jobs": jobs
    }