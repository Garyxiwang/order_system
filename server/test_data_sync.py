#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
测试设计管理和拆单管理之间的数据同步功能
"""

import requests
import json
from datetime import datetime

# API基础URL
BASE_URL = "http://localhost:8000/api/v1"

def test_design_to_split_sync():
    """测试设计管理修改下单类目时同步到拆单管理"""
    print("\n=== 测试设计管理到拆单管理的同步 ===")
    
    # 1. 获取现有订单
    response = requests.post(f"{BASE_URL}/orders/list", json={"page": 1, "page_size": 10})
    if response.status_code != 200:
        print(f"获取订单列表失败: {response.text}")
        return False
    
    orders = response.json()["items"]
    if not orders:
        print("没有找到订单")
        return False
    
    order = orders[0]
    order_id = order["id"]
    order_number = order["order_number"]
    
    print(f"测试订单: {order_number} (ID: {order_id})")
    print(f"当前类目: {order.get('category_name', '无')}")
    
    # 2. 修改设计管理中的下单类目
    new_categories = "柜体,石材,门板,五金"
    update_data = {
        "category_name": new_categories
    }
    
    response = requests.put(f"{BASE_URL}/orders/{order_id}", json=update_data)
    if response.status_code != 200:
        print(f"更新订单失败: {response.text}")
        return False
    
    print(f"设计管理中已更新类目为: {new_categories}")
    
    # 3. 检查拆单管理中是否同步更新
    response = requests.post(f"{BASE_URL}/splits/list", json={"page": 1, "page_size": 10})
    if response.status_code != 200:
        print(f"获取拆单列表失败: {response.text}")
        return False
    
    splits = response.json()["items"]
    target_split = None
    for split in splits:
        if split["order_number"] == order_number:
            target_split = split
            break
    
    if not target_split:
        print(f"未找到订单号为 {order_number} 的拆单记录")
        return False
    
    # 检查拆单中的类目是否已同步
    internal_items = target_split.get("internal_production_items", "")
    external_items = target_split.get("external_purchase_items", "")
    
    print(f"拆单中的厂内生产项: {internal_items}")
    print(f"拆单中的外购项: {external_items}")
    
    # 验证类目是否包含在拆单项中
    all_split_categories = []
    if internal_items:
        for item in internal_items.split(","):
            if item.strip():
                category = item.split(":")[0].strip()
                all_split_categories.append(category)
    
    if external_items:
        for item in external_items.split(","):
            if item.strip():
                category = item.split(":")[0].strip()
                all_split_categories.append(category)
    
    expected_categories = [cat.strip() for cat in new_categories.split(",")]
    
    sync_success = all(cat in all_split_categories for cat in expected_categories)
    
    if sync_success:
        print("✅ 设计管理到拆单管理的同步成功")
        return True
    else:
        print("❌ 设计管理到拆单管理的同步失败")
        print(f"期望类目: {expected_categories}")
        print(f"实际类目: {all_split_categories}")
        return False

def test_split_to_design_sync():
    """测试拆单管理修改下单类目时同步到设计管理"""
    print("\n=== 测试拆单管理到设计管理的同步 ===")
    
    # 1. 获取现有拆单
    response = requests.post(f"{BASE_URL}/splits/list", json={"page": 1, "page_size": 10})
    if response.status_code != 200:
        print(f"获取拆单列表失败: {response.text}")
        return False
    
    splits = response.json()["items"]
    if not splits:
        print("没有找到拆单")
        return False
    
    split = splits[0]
    split_id = split["id"]
    order_number = split["order_number"]
    
    print(f"测试拆单: {order_number} (ID: {split_id})")
    
    # 2. 修改拆单中的下单类目
    new_internal_items = "超级板材:2025-01-15:-,定制柜体:2025-01-16:-"
    new_external_items = "进口石材:2025-01-17:-,高端五金:2025-01-18:-"
    
    update_data = {
        "internal_production_items": new_internal_items,
        "external_purchase_items": new_external_items
    }
    
    response = requests.put(f"{BASE_URL}/splits/{split_id}", json=update_data)
    if response.status_code != 200:
        print(f"更新拆单失败: {response.text}")
        return False
    
    print(f"拆单管理中已更新厂内生产项: {new_internal_items}")
    print(f"拆单管理中已更新外购项: {new_external_items}")
    
    # 3. 检查设计管理中是否同步更新
    response = requests.post(f"{BASE_URL}/orders/list", json={"page": 1, "page_size": 10})
    if response.status_code != 200:
        print(f"获取订单列表失败: {response.text}")
        return False
    
    orders = response.json()["items"]
    target_order = None
    for order in orders:
        if order["order_number"] == order_number:
            target_order = order
            break
    
    if not target_order:
        print(f"未找到订单号为 {order_number} 的设计订单")
        return False
    
    # 检查设计管理中的类目是否已同步
    current_categories = target_order.get("category_name", "")
    print(f"设计管理中的当前类目: {current_categories}")
    
    # 验证类目是否包含拆单中的所有类目
    expected_categories = []
    
    # 从厂内生产项提取类目
    for item in new_internal_items.split(","):
        if item.strip():
            category = item.split(":")[0].strip()
            expected_categories.append(category)
    
    # 从外购项提取类目
    for item in new_external_items.split(","):
        if item.strip():
            category = item.split(":")[0].strip()
            expected_categories.append(category)
    
    current_category_list = [cat.strip() for cat in current_categories.split(",") if cat.strip()]
    
    sync_success = all(cat in current_category_list for cat in expected_categories)
    
    if sync_success:
        print("✅ 拆单管理到设计管理的同步成功")
        return True
    else:
        print("❌ 拆单管理到设计管理的同步失败")
        print(f"期望类目: {expected_categories}")
        print(f"实际类目: {current_category_list}")
        return False

def main():
    """主测试函数"""
    print("开始测试设计管理和拆单管理之间的数据同步功能...")
    print(f"测试时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    try:
        # 测试设计管理到拆单管理的同步
        result1 = test_design_to_split_sync()
        
        # 测试拆单管理到设计管理的同步
        result2 = test_split_to_design_sync()
        
        print("\n=== 测试结果汇总 ===")
        print(f"设计管理 → 拆单管理同步: {'✅ 通过' if result1 else '❌ 失败'}")
        print(f"拆单管理 → 设计管理同步: {'✅ 通过' if result2 else '❌ 失败'}")
        
        if result1 and result2:
            print("\n🎉 所有数据同步测试通过！")
            return True
        else:
            print("\n⚠️  部分数据同步测试失败，请检查相关功能")
            return False
            
    except Exception as e:
        print(f"\n❌ 测试过程中发生错误: {str(e)}")
        return False

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)