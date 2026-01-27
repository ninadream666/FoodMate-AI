"""
和风天气JWT认证服务
支持Ed25519算法的JWT token生成
"""

import jwt
import time
import os
from typing import Optional
from pathlib import Path

class QWeatherJWTService:
    """和风天气JWT认证服务"""
    
    def __init__(self, key_id: str = None, project_id: str = None, private_key_path: str = None, private_key_content: str = None):
        """
        初始化JWT服务
        
        Args:
            key_id: 凭据ID（在和风天气控制台获取）
            project_id: 项目ID（在和风天气控制台获取）
            private_key_path: 私钥文件路径
            private_key_content: 私钥内容字符串
        """
        self.key_id = key_id or os.getenv("QWEATHER_KEY_ID")
        self.project_id = project_id or os.getenv("QWEATHER_PROJECT_ID") 
        
        # 优先使用环境变量中的私钥内容，其次使用文件路径
        if private_key_content:
            self.private_key = private_key_content
        elif private_key_path and Path(private_key_path).exists():
            with open(private_key_path, 'r', encoding='utf-8') as f:
                self.private_key = f.read()
        else:
            # 使用新的私钥加载方法
            raw_private_key = QWeatherJWTService.load_private_key_from_env()
            if raw_private_key:
                self.private_key = self._process_private_key(raw_private_key)
            else:
                # 尝试默认私钥文件路径
                default_key_path = os.path.join(os.getcwd(), "ed25519-private.pem")
                if Path(default_key_path).exists():
                    with open(default_key_path, 'r', encoding='utf-8') as f:
                        self.private_key = self._process_private_key(f.read())
                else:
                    self.private_key = None
    
    def _process_private_key(self, raw_key: str) -> str:
        """
        处理私钥格式，确保Ed25519私钥格式正确
        
        Args:
            raw_key: 原始私钥字符串
            
        Returns:
            处理后的私钥字符串
        """
        if not raw_key:
            return None
            
        # 处理换行符和去除首尾空白
        key = raw_key.replace('\\n', '\n').strip()
        
        # 如果私钥没有PEM格式，尝试添加
        if not key.startswith('-----BEGIN PRIVATE KEY-----'):
            # 检查是否是纯base64格式的Ed25519私钥
            clean_key = key.replace('\n', '').replace(' ', '')
            if len(clean_key) == 88:  # Ed25519私钥的base64长度
                key = f"-----BEGIN PRIVATE KEY-----\n{clean_key}\n-----END PRIVATE KEY-----"
        
        # 验证PEM格式
        if not (key.startswith('-----BEGIN PRIVATE KEY-----') and key.endswith('-----END PRIVATE KEY-----')):
            print(f"警告：私钥格式可能不正确")
            print(f"开始标记: {key.startswith('-----BEGIN PRIVATE KEY-----')}")
            print(f"结束标记: {key.endswith('-----END PRIVATE KEY-----')}")
        
        return key
    
    @classmethod
    @classmethod
    def load_private_key_from_env(cls) -> str:
        """
        从环境变量或.env文件中加载私钥
        专门处理多行私钥格式
        """
        # 首先尝试环境变量
        env_key = os.getenv("QWEATHER_PRIVATE_KEY")
        if env_key:
            return env_key
        
        # 尝试从.env文件读取多行私钥
        env_file = Path(os.getcwd()) / '.env'
        if not env_file.exists():
            return None
            
        private_key_lines = []
        in_private_key = False
        
        try:
            with open(env_file, 'r', encoding='utf-8') as f:
                for line in f:
                    line_stripped = line.strip()
                    
                    if 'QWEATHER_PRIVATE_KEY=' in line_stripped:
                        in_private_key = True
                        # 提取第一行内容
                        key_part = line_stripped.split('=', 1)[1].strip().strip('"')
                        if key_part:
                            private_key_lines.append(key_part)
                        continue
                    
                    if in_private_key:
                        if '-----END PRIVATE KEY-----' in line_stripped:
                            # 找到结束标记，只取到结束标记为止
                            end_part = line_stripped.strip('"')
                            if '-----END PRIVATE KEY-----' in end_part:
                                end_index = end_part.find('-----END PRIVATE KEY-----') + len('-----END PRIVATE KEY-----')
                                private_key_lines.append(end_part[:end_index])
                            break
                        else:
                            private_key_lines.append(line_stripped.strip('"'))
            
            if private_key_lines:
                return '\n'.join(private_key_lines)
                
        except Exception as e:
            print(f"读取.env文件私钥失败: {e}")
            
        return None
    
    def generate_jwt_token(self, expires_in: int = 900) -> Optional[str]:
        """
        生成JWT token
        
        Args:
            expires_in: token有效期（秒），默认15分钟，最长24小时
            
        Returns:
            JWT token字符串，如果配置不完整则返回None
        """
        if not all([self.key_id, self.project_id, self.private_key]):
            missing = []
            if not self.key_id:
                missing.append("key_id")
            if not self.project_id:
                missing.append("project_id") 
            if not self.private_key:
                missing.append("private_key")
            print(f"JWT配置不完整，缺少: {', '.join(missing)}")
            return None
        
        try:
            # 限制有效期不超过24小时
            expires_in = min(expires_in, 86400)
            
            current_time = int(time.time())
            
            # JWT Header
            headers = {
                'alg': 'EdDSA',
                'kid': self.key_id
            }
            
            # JWT Payload
            payload = {
                'sub': self.project_id,  # 签发主体（项目ID）
                'iat': current_time - 30,  # 签发时间（提前30秒避免时间误差）
                'exp': current_time + expires_in  # 过期时间
            }
            
            # 生成JWT token
            from cryptography.hazmat.primitives import serialization
            
            # 加载私钥
            try:
                private_key_obj = serialization.load_pem_private_key(
                    self.private_key.encode('utf-8'),
                    password=None
                )
            except Exception as key_error:
                print(f"私钥加载失败: {key_error}")
                print(f"私钥格式: {self.private_key[:50]}...")
                return None
            
            token = jwt.encode(
                payload=payload,
                key=private_key_obj,  # 使用私钥对象而不是字符串
                algorithm='EdDSA',
                headers=headers
            )
            
            return token
            
        except Exception as e:
            print(f"生成JWT token失败: {e}")
            return None
    
    def verify_configuration(self) -> dict:
        """
        验证JWT配置是否正确
        
        Returns:
            配置状态字典
        """
        status = {
            "key_id": bool(self.key_id),
            "project_id": bool(self.project_id),
            "private_key": bool(self.private_key),
            "can_generate_token": False
        }
        
        if all([self.key_id, self.project_id, self.private_key]):
            # 尝试生成一个token来验证配置
            try:
                test_token = self.generate_jwt_token(60)  # 1分钟有效期的测试token
                status["can_generate_token"] = bool(test_token)
                if test_token:
                    status["sample_token"] = test_token[:50] + "..."  # 只显示前50个字符
            except Exception as e:
                status["error"] = str(e)
        
        return status
    
    @classmethod
    def from_env(cls) -> 'QWeatherJWTService':
        """
        从环境变量创建JWT服务实例
        """
        return cls()
    
    @classmethod  
    def from_files(cls, key_id: str, project_id: str, private_key_path: str) -> 'QWeatherJWTService':
        """
        从文件创建JWT服务实例
        
        Args:
            key_id: 凭据ID
            project_id: 项目ID
            private_key_path: 私钥文件路径
        """
        return cls(key_id=key_id, project_id=project_id, private_key_path=private_key_path)