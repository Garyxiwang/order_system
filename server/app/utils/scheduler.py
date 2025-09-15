from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from sqlalchemy.orm import Session
from datetime import datetime
import logging
from app.core.database import get_db
from app.models.order import Order
from app.models.split_progress import SplitProgress

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

def calculate_split_progress_cycle_days(order_date: str, actual_date: str = None) -> int:
    """
    计算拆单进度周期天数
    
    Args:
        order_date: 下单日期，格式为 'YYYY-MM-DD'
        actual_date: 实际日期（拆单日期或采购日期），格式为 'YYYY-MM-DD'，可以为 None
    
    Returns:
        int: 周期天数
    """
    if order_date is None:
        return 0
        
    try:
        order_dt = datetime.strptime(order_date, '%Y-%m-%d')
        
        if actual_date:
            # 如果有实际日期，计算实际日期 - 下单日期
            actual_dt = datetime.strptime(actual_date, '%Y-%m-%d')
            return (actual_dt - order_dt).days
        else:
            # 如果没有实际日期，计算当天 - 下单日期
            today = datetime.now()
            return (today - order_dt).days
            
    except ValueError as e:
        logger.error(f"日期格式错误: order_date={order_date}, actual_date={actual_date}, 错误: {e}")
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

async def update_split_progress_cycles():
    """
    定时任务：更新所有拆单进度的周期天数
    """
    logger.info("开始执行拆单进度周期更新任务")
    
    # 获取数据库会话
    db_gen = get_db()
    db: Session = next(db_gen)
    
    try:
        # 查询所有拆单进度记录，并关联订单信息
        progress_items = db.query(SplitProgress).join(
            Order, SplitProgress.order_number == Order.order_number
        ).all()
        
        updated_count = 0
        
        for progress in progress_items:
            # 获取关联的订单信息
            order = db.query(Order).filter(
                Order.order_number == progress.order_number
            ).first()
            
            if order and order.order_date:
                # 根据项目类型确定实际日期
                actual_date = None
                if progress.item_type.value == "internal" and progress.split_date:
                    actual_date = progress.split_date
                elif progress.item_type.value == "external" and progress.purchase_date:
                    actual_date = progress.purchase_date
                
                # 计算新的周期天数
                new_cycle = calculate_split_progress_cycle_days(
                    order.order_date, 
                    actual_date
                )
                
                # 只有当周期天数发生变化时才更新
                current_cycle = int(progress.cycle_days or "0")
                if new_cycle != current_cycle:
                    progress.cycle_days = str(new_cycle)
                    updated_count += 1
        
        # 提交更改
        db.commit()
        
        logger.info(f"拆单进度周期更新任务完成，共更新 {updated_count} 条进度记录")
        
    except Exception as e:
        logger.error(f"拆单进度周期更新任务执行失败: {e}")
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
        
        # 添加定时任务：每天凌晨2点执行设计周期更新
        scheduler.add_job(
            update_design_cycles,
            trigger=CronTrigger(hour=2, minute=0),  # 每天凌晨2点执行
            id='update_design_cycles',
            name='更新设计周期',
            replace_existing=True
        )
        
        # 添加定时任务：每天凌晨2点30分执行拆单进度周期更新
        scheduler.add_job(
            update_split_progress_cycles,
            trigger=CronTrigger(hour=2, minute=30),  # 每天凌晨2点30分执行
            id='update_split_progress_cycles',
            name='更新拆单进度周期',
            replace_existing=True
        )
        
        scheduler.start()
        logger.info("定时任务调度器已启动，设计周期更新任务已添加（每天凌晨2点执行），拆单进度周期更新任务已添加（每天凌晨2点30分执行）")
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