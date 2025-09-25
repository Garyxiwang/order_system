# SSM Parameter Store 配置 - 用于管理敏感配置

# 应用密钥
resource "aws_ssm_parameter" "secret_key" {
  name  = "/${var.project_name}/${var.environment}/secret-key"
  type  = "SecureString"
  value = var.secret_key
  
  description = "Application secret key for ${var.project_name}"
  
  tags = {
    Name        = "${var.project_name}-secret-key"
    Environment = var.environment
  }
}

# 数据库密码
resource "aws_ssm_parameter" "db_password" {
  name  = "/${var.project_name}/${var.environment}/db-password"
  type  = "SecureString"
  value = var.db_password
  
  description = "Database password for ${var.project_name}"
  
  tags = {
    Name        = "${var.project_name}-db-password"
    Environment = var.environment
  }
}

# Redis 认证令牌
resource "aws_ssm_parameter" "redis_auth_token" {
  count = var.redis_auth_token != null ? 1 : 0
  
  name  = "/${var.project_name}/${var.environment}/redis-auth-token"
  type  = "SecureString"
  value = var.redis_auth_token
  
  description = "Redis authentication token for ${var.project_name}"
  
  tags = {
    Name        = "${var.project_name}-redis-auth-token"
    Environment = var.environment
  }
}

# JWT 密钥
resource "aws_ssm_parameter" "jwt_secret" {
  name  = "/${var.project_name}/${var.environment}/jwt-secret"
  type  = "SecureString"
  value = var.jwt_secret
  
  description = "JWT secret key for ${var.project_name}"
  
  tags = {
    Name        = "${var.project_name}-jwt-secret"
    Environment = var.environment
  }
}

# 数据库连接字符串
resource "aws_ssm_parameter" "database_url" {
  name  = "/${var.project_name}/${var.environment}/database-url"
  type  = "SecureString"
  value = "postgresql://admin:${var.db_password}@${aws_db_instance.main.endpoint}:5432/order_system"
  
  description = "Database connection URL for ${var.project_name}"
  
  tags = {
    Name        = "${var.project_name}-database-url"
    Environment = var.environment
  }
}

# Redis 连接字符串
resource "aws_ssm_parameter" "redis_url" {
  name  = "/${var.project_name}/${var.environment}/redis-url"
  type  = "String"
  value = "redis://${aws_elasticache_replication_group.main.primary_endpoint_address}:6379"
  
  description = "Redis connection URL for ${var.project_name}"
  
  tags = {
    Name        = "${var.project_name}-redis-url"
    Environment = var.environment
  }
}

# 邮件服务配置
resource "aws_ssm_parameter" "smtp_host" {
  name  = "/${var.project_name}/${var.environment}/smtp-host"
  type  = "String"
  value = var.smtp_host
  
  description = "SMTP host for ${var.project_name}"
  
  tags = {
    Name        = "${var.project_name}-smtp-host"
    Environment = var.environment
  }
}

resource "aws_ssm_parameter" "smtp_port" {
  name  = "/${var.project_name}/${var.environment}/smtp-port"
  type  = "String"
  value = var.smtp_port
  
  description = "SMTP port for ${var.project_name}"
  
  tags = {
    Name        = "${var.project_name}-smtp-port"
    Environment = var.environment
  }
}

resource "aws_ssm_parameter" "smtp_username" {
  name  = "/${var.project_name}/${var.environment}/smtp-username"
  type  = "String"
  value = var.smtp_username
  
  description = "SMTP username for ${var.project_name}"
  
  tags = {
    Name        = "${var.project_name}-smtp-username"
    Environment = var.environment
  }
}

resource "aws_ssm_parameter" "smtp_password" {
  name  = "/${var.project_name}/${var.environment}/smtp-password"
  type  = "SecureString"
  value = var.smtp_password
  
  description = "SMTP password for ${var.project_name}"
  
  tags = {
    Name        = "${var.project_name}-smtp-password"
    Environment = var.environment
  }
}

# 第三方 API 密钥
resource "aws_ssm_parameter" "payment_api_key" {
  count = var.payment_api_key != null ? 1 : 0
  
  name  = "/${var.project_name}/${var.environment}/payment-api-key"
  type  = "SecureString"
  value = var.payment_api_key
  
  description = "Payment API key for ${var.project_name}"
  
  tags = {
    Name        = "${var.project_name}-payment-api-key"
    Environment = var.environment
  }
}

# 应用配置参数
resource "aws_ssm_parameter" "app_debug" {
  name  = "/${var.project_name}/${var.environment}/app-debug"
  type  = "String"
  value = var.environment == "production" ? "false" : "true"
  
  description = "Debug mode for ${var.project_name}"
  
  tags = {
    Name        = "${var.project_name}-app-debug"
    Environment = var.environment
  }
}

resource "aws_ssm_parameter" "log_level" {
  name  = "/${var.project_name}/${var.environment}/log-level"
  type  = "String"
  value = var.environment == "production" ? "INFO" : "DEBUG"
  
  description = "Log level for ${var.project_name}"
  
  tags = {
    Name        = "${var.project_name}-log-level"
    Environment = var.environment
  }
}

# ECS 任务定义需要的 SSM 访问权限
resource "aws_iam_policy" "ssm_access" {
  name        = "${var.project_name}-ssm-access-policy"
  description = "Policy for accessing SSM parameters"
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ssm:GetParameter",
          "ssm:GetParameters",
          "ssm:GetParametersByPath"
        ]
        Resource = [
          "arn:aws:ssm:${var.aws_region}:${data.aws_caller_identity.current.account_id}:parameter/${var.project_name}/${var.environment}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt"
        ]
        Resource = [
          "arn:aws:kms:${var.aws_region}:${data.aws_caller_identity.current.account_id}:key/*"
        ]
        Condition = {
          StringEquals = {
            "kms:ViaService" = "ssm.${var.aws_region}.amazonaws.com"
          }
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_task_ssm_access" {
  role       = aws_iam_role.ecs_task_execution_role.name
  policy_arn = aws_iam_policy.ssm_access.arn
}

# 变量定义
variable "secret_key" {
  description = "Application secret key"
  type        = string
  sensitive   = true
}

variable "jwt_secret" {
  description = "JWT secret key"
  type        = string
  sensitive   = true
}

variable "smtp_host" {
  description = "SMTP host"
  type        = string
  default     = "smtp.gmail.com"
}

variable "smtp_port" {
  description = "SMTP port"
  type        = string
  default     = "587"
}

variable "smtp_username" {
  description = "SMTP username"
  type        = string
  default     = ""
}

variable "smtp_password" {
  description = "SMTP password"
  type        = string
  sensitive   = true
  default     = ""
}

variable "payment_api_key" {
  description = "Payment API key"
  type        = string
  sensitive   = true
  default     = null
}

# 输出
output "ssm_parameter_arns" {
  description = "ARNs of created SSM parameters"
  value = {
    secret_key    = aws_ssm_parameter.secret_key.arn
    db_password   = aws_ssm_parameter.db_password.arn
    jwt_secret    = aws_ssm_parameter.jwt_secret.arn
    database_url  = aws_ssm_parameter.database_url.arn
    redis_url     = aws_ssm_parameter.redis_url.arn
  }
  sensitive = true
}