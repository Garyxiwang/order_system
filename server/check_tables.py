from app.core.database import engine
from sqlalchemy import inspect

def check_database_tables():
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    
    print('=== 数据库表结构检查 ===')
    print(f'数据库连接成功，共有 {len(tables)} 个表')
    print(f'表列表: {tables}')
    
    for table in tables:
        print(f'\n表: {table}')
        columns = inspector.get_columns(table)
        for col in columns:
            print(f'  {col["name"]} - {col["type"]} - nullable: {col["nullable"]}')

if __name__ == '__main__':
    check_database_tables()