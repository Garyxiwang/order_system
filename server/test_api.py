#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
测试API功能
"""

import requests
import json

def test_split_list_api():
    """
    测试拆单列表API
    """
    url = "http://localhost:8000/api/v1/splits/list"
    
    # 测试数据
    test_data = {
        "page": 1,
        "page_size": 10
    }
    
    try:
        response = requests.post(url, json=test_data)
        print(f"状态码: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("API响应成功！")
            print(f"返回数据: {json.dumps(data, indent=2, ensure_ascii=False)}")
            
            # 检查时间字段类型
            if 'data' in data and len(data['data']) > 0:
                first_item = data['data'][0]
                if 'created_at' in first_item:
                    print(f"created_at类型: {type(first_item['created_at'])}, 值: {first_item['created_at']}")
                if 'updated_at' in first_item:
                    print(f"updated_at类型: {type(first_item['updated_at'])}, 值: {first_item['updated_at']}")
        else:
            print(f"API请求失败: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ 无法连接到服务器，请确保服务器正在运行")
    except Exception as e:
        print(f"❌ 测试过程中出现错误: {e}")

if __name__ == "__main__":
    print("开始测试拆单列表API...")
    test_split_list_api()