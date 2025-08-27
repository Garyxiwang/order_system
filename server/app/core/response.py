from typing import Any, Dict, Optional
from fastapi import HTTPException
from fastapi.responses import JSONResponse


def success_response(
    data: Any = None,
    message: str = "操作成功",
    code: int = 200
) -> Dict[str, Any]:
    """成功响应格式"""
    return {
        "code": code,
        "message": message,
        "data": data
    }


def error_response(
    message: str = "操作失败",
    code: int = 400,
    data: Any = None
) -> Dict[str, Any]:
    """错误响应格式"""
    return {
        "code": code,
        "message": message,
        "data": data
    }


def paginated_response(
    items: list,
    total: int,
    page: int,
    page_size: int,
    message: str = "查询成功"
) -> Dict[str, Any]:
    """分页响应格式"""
    return {
        "code": 200,
        "message": message,
        "data": {
            "items": items,
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": (total + page_size - 1) // page_size
        }
    }


class APIException(HTTPException):
    """自定义API异常"""
    def __init__(self, message: str = "操作失败", code: int = 400):
        super().__init__(status_code=code, detail=message)
        self.message = message
        self.code = code