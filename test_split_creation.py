#!/usr/bin/env python3
import requests
import json
import time

# 服务器地址
BASE_URL = "http://localhost:8000/api/v1"

def test_split_auto_creation():
    print("=== 测试订单状态变更自动创建拆单记录 ===")
    
    # 生成唯一订单编号
    order_number = f"TEST{int(time.time())}"
    
    # 1. 创建测试订单
    print("\n1. 创建测试订单...")
    order_data = {
        "order_number": order_number,
        "customer_name": "测试客户",
        "address": "测试地址",
        "designer": "测试设计师",
        "salesperson": "测试销售员",
        "assignment_date": "2025-01-15",
        "order_date": "2025-01-15T10:00:00",
        "category_name": "橱柜",
        "design_cycle": "正常",
        "order_type": "定制",
        "order_status": "待处理",
        "order_amount": 10000.0,
        "cabinet_area": 15.5,
        "wall_panel_area": 8.0,
        "remarks": "测试订单"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/orders/", json=order_data)
        if response.status_code == 200:
            order = response.json()
            order_id = order['id']
            print(f"✅ 订单创建成功，ID: {order_id}")
            print(f"   订单编号: {order_number}")
            print(f"   当前状态: {order['order_status']}")
        else:
            print(f"❌ 订单创建失败: {response.status_code} - {response.text}")
            return
    except Exception as e:
        print(f"❌ 请求失败: {e}")
        return
    
    # 2. 检查拆单记录（应该不存在）
    print("\n2. 检查拆单记录（订单状态为pending时不应存在）...")
    try:
        split_query = {
            "order_number": order_number,
            "page": 1,
            "page_size": 10
        }
        response = requests.post(f"{BASE_URL}/splits/list", json=split_query)
        if response.status_code == 200:
            splits = response.json()
            print(f"   拆单记录数量: {splits['total']}")
            if splits['total'] == 0:
                print("✅ 确认：pending状态下未自动创建拆单记录")
            else:
                print("⚠️  意外：pending状态下已存在拆单记录")
        else:
            print(f"❌ 查询拆单记录失败: {response.status_code}")
    except Exception as e:
        print(f"❌ 查询拆单记录失败: {e}")
    
    # 3. 更新订单状态为下单
    print("\n3. 更新订单状态为下单...")
    try:
        status_update = {
            "order_status": "已下单"
        }
        response = requests.patch(f"{BASE_URL}/orders/{order_id}/status", json=status_update)
        if response.status_code == 200:
            updated_order = response.json()
            print(f"✅ 订单状态更新成功")
            print(f"   订单编号: {updated_order['order_number']}")
            print(f"   新状态: {updated_order['order_status']}")
        else:
            print(f"❌ 订单状态更新失败: {response.status_code} - {response.text}")
            return
    except Exception as e:
        print(f"❌ 更新订单状态失败: {e}")
        return
    
    # 4. 再次检查拆单记录（应该自动创建）
    print("\n4. 检查拆单记录（订单状态为confirmed后应自动创建）...")
    try:
        response = requests.post(f"{BASE_URL}/splits/list", json=split_query)
        if response.status_code == 200:
            splits = response.json()
            print(f"   拆单记录数量: {splits['total']}")
            if splits['total'] > 0:
                split = splits['items'][0]
                print("✅ 成功：自动创建了拆单记录")
                print(f"   拆单ID: {split['id']}")
                print(f"   订单编号: {split['order_number']}")
                print(f"   客户名称: {split['customer_name']}")
                print(f"   订单状态: {split['order_status']}")
                print(f"   报价状态: {split['quote_status']}")
                print(f"   厂内生产项: {split['internal_production_items']}")
            else:
                print("❌ 失败：订单状态更新后未自动创建拆单记录")
        else:
            print(f"❌ 查询拆单记录失败: {response.status_code}")
    except Exception as e:
        print(f"❌ 查询拆单记录失败: {e}")
    
    print("\n=== 测试完成 ===")

if __name__ == "__main__":
    test_split_auto_creation()