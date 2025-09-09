#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
测试生产管理模块功能
验证拆单下单时自动创建生产记录的功能
"""

import requests
import json
import time
from datetime import datetime, date

# 服务器配置
BASE_URL = "http://localhost:8000/api/v1"

def test_production_auto_creation():
    """
    测试拆单下单时自动创建生产记录
    """
    print("=== 测试生产管理模块 ===")
    
    # 生成唯一的订单编号
    timestamp = int(time.time())
    order_number = f"PROD{timestamp}"
    print(f"使用订单编号: {order_number}")
    
    # 1. 创建订单
    print("\n1. 创建订单...")
    order_data = {
        "order_number": order_number,
        "customer_name": "生产测试客户",
        "contact_info": "13800138000",
        "address": "北京市朝阳区生产测试地址",
        "designer": "设计师A",
        "salesperson": "销售员B",
        "category_name": "全屋定制",

        "unit_price": 800.0,
        "total_amount": 96400.0,
        "order_amount": 96400.0,
        "customer_payment_date": "2024-01-15",
        "order_date": "2024-01-20",
        "assignment_date": "2024-01-18",
        "order_type": "定制",
        "design_cycle": "正常",
        "expected_delivery_date": "2024-03-15",
        "is_installation": True,
        "remarks": "生产管理测试订单"
    }
    
    response = requests.post(f"{BASE_URL}/orders", json=order_data)
    if response.status_code == 200:
        order_result = response.json()
        order_id = order_result['id']
        print(f"✓ 订单创建成功: ID={order_id}, 状态={order_result['order_status']}")
    else:
        print(f"✗ 订单创建失败: {response.status_code} - {response.text}")
        return
    
    # 2. 更新订单状态为下单，触发拆单自动创建
    print("\n2. 更新订单状态为下单...")
    status_update_data = {
        "order_status": "已下单"
    }
    
    status_response = requests.patch(f"{BASE_URL}/orders/{order_id}/status", json=status_update_data)
    if status_response.status_code == 200:
        status_result = status_response.json()
        print(f"✓ 订单状态更新成功: 状态={status_result['order_status']}")
    else:
        print(f"✗ 订单状态更新失败: {status_response.status_code} - {status_response.text}")
        return
    
    # 3. 检查拆单是否自动创建
    print("\n3. 检查拆单记录...")
    time.sleep(1)  # 等待数据库操作完成
    
    splits_response = requests.post(f"{BASE_URL}/splits/list", json={
        "page": 1,
        "page_size": 10,
        "order_number": order_number
    })
    
    if splits_response.status_code == 200:
        splits_result = splits_response.json()
        if splits_result['items']:
            split = splits_result['items'][0]
            split_id = split['id']
            print(f"✓ 找到拆单记录: ID={split_id}, 状态={split['order_status']}")
        else:
            print("✗ 未找到拆单记录")
            return
    else:
        print(f"✗ 查询拆单失败: {splits_response.status_code}")
        return
    
    # 4. 检查生产记录（此时应该不存在）
    print("\n4. 检查生产记录（拆单下单前）...")
    productions_response = requests.post(f"{BASE_URL}/productions/list", json={
        "page": 1,
        "page_size": 10,
        "order_number": order_number
    })
    
    if productions_response.status_code == 200:
        productions_result = productions_response.json()
        if productions_result['data']:
            print(f"! 意外发现生产记录: {len(productions_result['data'])}条")
        else:
            print("✓ 确认暂无生产记录")
    else:
        print(f"✗ 查询生产记录失败: {productions_response.status_code}")
    
    # 5. 执行拆单下单
    print("\n5. 执行拆单下单...")
    place_order_response = requests.put(f"{BASE_URL}/splits/{split_id}/place-order")
    
    if place_order_response.status_code == 200:
        place_order_result = place_order_response.json()
        print(f"✓ 拆单下单成功: 状态={place_order_result['order_status']}")
    else:
        print(f"✗ 拆单下单失败: {place_order_response.status_code} - {place_order_response.text}")
        return
    
    # 6. 检查生产记录是否自动创建
    print("\n6. 检查生产记录（拆单下单后）...")
    time.sleep(1)  # 等待数据库操作完成
    
    productions_response = requests.post(f"{BASE_URL}/productions/list", json={
        "page": 1,
        "page_size": 10,
        "order_number": order_number
    })
    
    if productions_response.status_code == 200:
        productions_result = productions_response.json()
        if productions_result['data']:
            production = productions_result['data'][0]
            print(f"✓ 生产记录自动创建成功!")
            print(f"  - 生产ID: {production['id']}")
            print(f"  - 订单编号: {production['order_number']}")
            print(f"  - 客户名称: {production['customer_name']}")
            print(f"  - 拆单下单日期: {production['split_order_date']}")
            print(f"  - 采购状态: {production['purchase_status']}")
            print(f"  - 订单状态: {production['order_status']}")
            print(f"  - 下单天数: {production['order_days']}")
            
            # 7. 测试编辑生产记录
            print("\n7. 测试编辑生产记录...")
            edit_data = {
                "board_18_quantity": 15,
                "board_09_quantity": 8,
                "expected_delivery_date": "2024-03-20",
                "remarks": "已更新材料数量和交货日期"
            }
            
            edit_response = requests.put(f"{BASE_URL}/productions/{production['id']}", json=edit_data)
            if edit_response.status_code == 200:
                edit_result = edit_response.json()
                print(f"✓ 生产记录编辑成功")
                print(f"  - 18板数量: {edit_result['board_18_quantity']}")
                print(f"  - 09板数量: {edit_result['board_09_quantity']}")
            else:
                print(f"✗ 生产记录编辑失败: {edit_response.status_code}")
            
            # 8. 测试生产进度更新
            print("\n8. 测试生产进度更新...")
            progress_data = {
                "cutting_date": "2024-02-01",
                "finished_storage_date": "2024-02-15",
                "expected_shipment_date": "2024-02-20"
            }
            
            progress_response = requests.patch(f"{BASE_URL}/productions/{production['id']}/progress", json=progress_data)
            if progress_response.status_code == 200:
                progress_result = progress_response.json()
                print(f"✓ 生产进度更新成功")
                print(f"  - 下料日期: {progress_result['cutting_date']}")
                print(f"  - 成品入库日期: {progress_result['finished_storage_date']}")
                print(f"  - 预计出货日期: {progress_result['expected_shipment_date']}")
            else:
                print(f"✗ 生产进度更新失败: {progress_response.status_code}")
                
        else:
            print("✗ 生产记录未自动创建")
    else:
        print(f"✗ 查询生产记录失败: {productions_response.status_code}")
    
    print("\n=== 测试完成 ===")

if __name__ == "__main__":
    test_production_auto_creation()