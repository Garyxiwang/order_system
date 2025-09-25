from datetime import datetime
import logging

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 全局调度器实例
scheduler = None


def calculate_design_cycle_days(assignment_date: str, order_date: str = None, order_status: str = None) -> int:
    """
    计算设计周期（天数）

    Args:
        assignment_date: 分单日期，格式为 'YYYY-MM-DD'，可以为 None
        order_date: 下单日期，格式为 'YYYY-MM-DD'，可以为 None
        order_status: 订单状态，可以为 None

    Returns:
        int: 设计周期天数，最少为1天
    """
    if assignment_date is None:
        return 1

    try:
        assignment = datetime.strptime(assignment_date, '%Y-%m-%d')
        
        # 如果是已下单状态且有下单日期，计算下单日期减去分单日期
        if order_status == "已下单" and order_date:
            try:
                order_dt = datetime.strptime(order_date, '%Y-%m-%d')
                days = (order_dt - assignment).days
                return max(1, days)
            except ValueError as e:
                logger.error(f"下单日期格式错误: {order_date}, 错误: {e}")
                # 如果下单日期格式错误，回退到当前日期计算
                pass
        
        # 其他情况计算当前日期减去分单日期
        today = datetime.now()
        days = (today - assignment).days
        # 确保至少返回1天
        return max(1, days)
    except ValueError as e:
        logger.error(f"分单日期格式错误: {assignment_date}, 错误: {e}")
        return 1
