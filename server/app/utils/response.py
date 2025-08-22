from typing import Any, Optional, Dict
from fastapi.responses import JSONResponse
from pydantic import BaseModel


class ResponseModel(BaseModel):
    """统一响应模型"""
    code: int = 200
    message: str = "success"
    data: Optional[Any] = None
    

class ApiResponse:
    """API响应工具类"""
    
    @staticmethod
    def success(
        data: Any = None, 
        message: str = "操作成功", 
        code: int = 200
    ) -> JSONResponse:
        """成功响应"""
        return JSONResponse(
            status_code=200,
            content={
                "code": code,
                "message": message,
                "data": data,
                "success": True
            }
        )
    
    @staticmethod
    def error(
        message: str = "操作失败", 
        code: int = 400, 
        data: Any = None,
        status_code: int = 400
    ) -> JSONResponse:
        """错误响应"""
        return JSONResponse(
            status_code=status_code,
            content={
                "code": code,
                "message": message,
                "data": data,
                "success": False
            }
        )
    
    @staticmethod
    def not_found(message: str = "资源未找到") -> JSONResponse:
        """404响应"""
        return ApiResponse.error(
            message=message, 
            code=404, 
            status_code=404
        )
    
    @staticmethod
    def unauthorized(message: str = "未授权访问") -> JSONResponse:
        """401响应"""
        return ApiResponse.error(
            message=message, 
            code=401, 
            status_code=401
        )
    
    @staticmethod
    def forbidden(message: str = "禁止访问") -> JSONResponse:
        """403响应"""
        return ApiResponse.error(
            message=message, 
            code=403, 
            status_code=403
        )
    
    @staticmethod
    def server_error(message: str = "服务器内部错误") -> JSONResponse:
        """500响应"""
        return ApiResponse.error(
            message=message, 
            code=500, 
            status_code=500
        )