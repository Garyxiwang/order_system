#!/usr/bin/env python3
"""
快速查看数据库连接信息的脚本
"""

import os
import sys
from pathlib import Path
from urllib.parse import urlparse

def check_env_variable():
    """检查环境变量"""
    print("=" * 60)
    print("1. 环境变量检查")
    print("=" * 60)
    
    database_url = os.getenv("DATABASE_URL", "")
    if database_url:
        parsed = urlparse(database_url)
        print(f"✓ 找到 DATABASE_URL")
        print(f"  数据库主机: {parsed.hostname}")
        print(f"  数据库端口: {parsed.port or 5432}")
        print(f"  数据库名: {parsed.path.lstrip('/')}")
        print(f"  用户名: {parsed.username}")
        if parsed.password:
            print(f"  密码: {'*' * len(parsed.password)} (已隐藏)")
        else:
            print(f"  密码: 未设置")
        print(f"\n  完整连接字符串（隐藏密码）:")
        if parsed.password:
            safe_url = database_url.replace(f":{parsed.password}@", ":***@")
        else:
            safe_url = database_url
        print(f"  {safe_url}")
        return parsed
    else:
        print("✗ 未找到 DATABASE_URL 环境变量")
        return None

def check_docker_compose():
    """检查 Docker Compose 配置"""
    print("\n" + "=" * 60)
    print("2. Docker Compose 配置检查")
    print("=" * 60)
    
    compose_files = [
        Path("docker-compose.yml"),
        Path("../docker-compose.yml"),
        Path("cloud-deployment/docker-compose.production.yml"),
    ]
    
    found = False
    for compose_file in compose_files:
        if compose_file.exists():
            print(f"✓ 找到配置文件: {compose_file}")
            found = True
            try:
                with open(compose_file, 'r', encoding='utf-8') as f:
                    content = f.read()
                    if 'POSTGRES' in content or 'DATABASE' in content:
                        lines = content.split('\n')
                        in_db_section = False
                        for i, line in enumerate(lines):
                            if 'database:' in line.lower() or 'db:' in line.lower():
                                in_db_section = True
                            if in_db_section:
                                if 'POSTGRES_DB' in line or 'POSTGRES_USER' in line or 'POSTGRES_PASSWORD' in line:
                                    print(f"  {line.strip()}")
                                if 'environment:' in line and i > 0:
                                    in_db_section = False
            except Exception as e:
                print(f"  读取文件时出错: {e}")
    
    if not found:
        print("✗ 未找到 docker-compose.yml 文件")

def check_docker_containers():
    """检查 Docker 容器"""
    print("\n" + "=" * 60)
    print("3. Docker 容器检查")
    print("=" * 60)
    
    try:
        import subprocess
        result = subprocess.run(['docker', 'ps', '--format', '{{.Names}}'], 
                              capture_output=True, text=True, timeout=5)
        if result.returncode == 0 and result.stdout.strip():
            containers = result.stdout.strip().split('\n')
            db_containers = [c for c in containers if 'db' in c.lower() or 'postgres' in c.lower()]
            if db_containers:
                print(f"✓ 找到数据库容器: {', '.join(db_containers)}")
                for container in db_containers:
                    print(f"\n  容器 {container} 的环境变量:")
                    env_result = subprocess.run(['docker', 'exec', container, 'env'], 
                                              capture_output=True, text=True, timeout=5)
                    if env_result.returncode == 0:
                        for line in env_result.stdout.split('\n'):
                            if 'POSTGRES' in line:
                                # 隐藏密码
                                if 'PASSWORD' in line:
                                    parts = line.split('=')
                                    if len(parts) == 2:
                                        print(f"    {parts[0]}=***")
                                    else:
                                        print(f"    {line}")
                                else:
                                    print(f"    {line}")
            else:
                print("✗ 未找到数据库容器")
        else:
            print("✗ Docker 未运行或无法访问")
    except FileNotFoundError:
        print("✗ Docker 未安装")
    except subprocess.TimeoutExpired:
        print("✗ Docker 命令超时")
    except Exception as e:
        print(f"✗ 检查 Docker 时出错: {e}")

def generate_psql_command(parsed):
    """生成 psql 连接命令"""
    if not parsed:
        return
    
    print("\n" + "=" * 60)
    print("4. 推荐的连接命令")
    print("=" * 60)
    
    host = parsed.hostname or "localhost"
    port = parsed.port or 5432
    database = parsed.path.lstrip('/') or "order_system"
    user = parsed.username or "postgres"
    
    print(f"使用环境变量方式（推荐）:")
    print(f"  export PGPASSWORD='your_password'")
    print(f"  psql -h {host} -p {port} -U {user} -d {database}")
    print(f"\n或者直接连接（会提示输入密码）:")
    print(f"  psql -h {host} -p {port} -U {user} -d {database}")
    print(f"\n执行修复脚本:")
    print(f"  export PGPASSWORD='your_password'")
    print(f"  psql -h {host} -p {port} -U {user} -d {database} -f fix_admin_role_simple.sql")

def main():
    """主函数"""
    print("\n" + "=" * 60)
    print("数据库连接信息检查工具")
    print("=" * 60)
    print()
    
    # 添加项目路径
    project_root = Path(__file__).parent
    if str(project_root) not in sys.path:
        sys.path.insert(0, str(project_root))
    
    # 检查各种来源
    parsed = check_env_variable()
    check_docker_compose()
    check_docker_containers()
    generate_psql_command(parsed)
    
    print("\n" + "=" * 60)
    print("检查完成")
    print("=" * 60)
    print("\n提示: 如果找不到信息，请检查:")
    print("  1. 系统服务配置文件")
    print("  2. 启动脚本")
    print("  3. 云服务控制台（如果使用云数据库）")

if __name__ == "__main__":
    main()

