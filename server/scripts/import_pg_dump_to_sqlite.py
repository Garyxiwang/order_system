#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
将从 PostgreSQL 导出的 pg_dump --inserts 文件导入到本地 SQLite 数据库。

使用方法：
python server/scripts/import_pg_dump_to_sqlite.py --dump ../pg_dump.sql --db ../order_system.db [--reset]

默认：
- dump 路径：server/pg_dump.sql
- db 路径：server/order_system.db
"""

import argparse
import os
import re
import sys
from pathlib import Path
from sqlalchemy import create_engine, text


def normalize_insert(stmt: str) -> str:
    """对 INSERT 语句做兼容处理：
    - 去掉 schema 前缀 public.
    - 将 true/false 替换为 1/0（SQLite 兼容）。
    - 去掉双引号的标识符（如果有）。
    """
    # schema 前缀
    stmt = stmt.replace("INSERT INTO public.", "INSERT INTO ")

    # 标识符双引号 -> 普通（SQLite 宽松，不强制）
    # 避免替换到字符串内容，尽量仅替换表名和列名中的双引号
    # 简化处理：删除所有标识符用的双引号
    stmt = stmt.replace('"', '')

    # 布尔值
    stmt = re.sub(r"\btrue\b", "1", stmt, flags=re.IGNORECASE)
    stmt = re.sub(r"\bfalse\b", "0", stmt, flags=re.IGNORECASE)

    return stmt


def import_dump_to_sqlite(dump_path: Path, sqlite_db_path: Path):
    if not dump_path.exists():
        raise FileNotFoundError(f"找不到导出文件: {dump_path}")

    # 创建 SQLite 连接
    engine = create_engine(f"sqlite:///{sqlite_db_path}")

    total_statements = 0
    applied_statements = 0
    skipped_statements = 0

    # 使用事务上下文，确保导入成功后自动提交
    with engine.begin() as conn:
        # 临时关闭外键约束，避免导入顺序导致的外键错误
        conn.exec_driver_sql("PRAGMA foreign_keys = OFF;")

        buffer = []
        def flush_buffer():
            nonlocal total_statements, applied_statements, skipped_statements
            if not buffer:
                return
            stmt = "\n".join(buffer).strip()
            buffer.clear()
            if not stmt:
                return
            total_statements += 1

            if not stmt.upper().startswith("INSERT INTO"):
                # 跳过非 INSERT 语句（CREATE/ALTER/SET/COPY等）
                skipped_statements += 1
                return

            # 规范化语句
            normalized = normalize_insert(stmt)

            try:
                conn.exec_driver_sql(normalized)
                applied_statements += 1
            except Exception as e:
                # 如果失败，记录但不中断整体流程
                skipped_statements += 1
                print(f"⚠️ 导入失败，已跳过: {e}\n语句: {normalized[:200]}...")

        with dump_path.open('r', encoding='utf-8', errors='ignore') as f:
            for line in f:
                # 跳过注释和无关设置
                striped = line.strip()
                if not striped or striped.startswith('--') or striped.startswith('SET '):
                    continue

                buffer.append(line.rstrip('\n'))
                # 简单判断语句结束：以分号结束（注意可能有多行 INSERT）
                if striped.endswith(';'):
                    flush_buffer()

        # 处理尾部缓冲
        flush_buffer()

        # 恢复外键约束
        conn.exec_driver_sql("PRAGMA foreign_keys = ON;")

    print(f"✅ 导入完成：总语句 {total_statements}，成功 {applied_statements}，跳过 {skipped_statements}")


def main():
    parser = argparse.ArgumentParser(description="导入 pg_dump --inserts 到 SQLite")
    parser.add_argument('--dump', default=str(Path(__file__).resolve().parent.parent / 'pg_dump.sql'), help='pg_dump.sql 路径')
    parser.add_argument('--db', default=str(Path(__file__).resolve().parent.parent / 'order_system.db'), help='SQLite 数据库文件路径')
    parser.add_argument('--reset', action='store_true', help='重置数据库文件并仅初始化表结构（不插入初始数据）')
    args = parser.parse_args()

    dump_path = Path(args.dump)
    sqlite_db_path = Path(args.db)

    if args.reset:
        # 删除数据库文件以获得干净状态
        if sqlite_db_path.exists():
            try:
                os.remove(sqlite_db_path)
            except Exception:
                open(sqlite_db_path, 'w').close()
        # 让应用的数据库引擎指向该SQLite路径，并仅创建表结构
        os.environ['DATABASE_URL'] = f"sqlite:///{sqlite_db_path}"
        # 确保可以导入到 app 包（将 server 目录加入路径）
        sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
        # 导入模型以注册到 Base.metadata
        from app.models import Base  # noqa: F401
        from app.core.database import create_tables
        create_tables()
    else:
        # 确保数据库文件存在（如果不存在，创建空文件并由应用初始化）
        if not sqlite_db_path.exists():
            sqlite_db_path.touch()

    import_dump_to_sqlite(dump_path, sqlite_db_path)


if __name__ == '__main__':
    main()