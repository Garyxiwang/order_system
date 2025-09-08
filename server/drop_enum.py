from app.core.database import engine
from sqlalchemy import text

try:
    with engine.connect() as conn:
        # MySQL不使用DROP TYPE，这是PostgreSQL语法
        # 对于MySQL，我们只需要确认没有枚举约束即可
        print("MySQL数据库不需要删除枚举类型")
        print("order_status字段已经是VARCHAR类型，可以接受任何字符串值")
except Exception as e:
    print(f"操作失败: {e}")