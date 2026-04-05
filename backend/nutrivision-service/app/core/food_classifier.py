import os
import re
import base64
import logging
from io import BytesIO
import torch
import timm
from torchvision import transforms
from PIL import Image

logger = logging.getLogger(__name__)

class FoodClassifier:
    """
    本地 CV 大模型推理类（单例模式）
    """
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(FoodClassifier, cls).__new__(cls)
            cls._instance._initialize()
        return cls._instance

    def _initialize(self):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        logger.info(f"正在初始化本地 CV 分类模型，使用设备: {self.device}")

        # 动态获取模型绝对路径（相对于当前文件所在目录）
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        self.model_path = os.path.join(base_dir, "models", "efficientnet_b0_best.pth")
        self.classes_path = os.path.join(base_dir, "models", "class_names.txt")

        # 加载类别字典
        self.class_names = []
        if os.path.exists(self.classes_path):
            with open(self.classes_path, 'r', encoding='utf-8') as f:
                self.class_names = [line.strip() for line in f.readlines() if line.strip()]
        else:
            logger.error(f"找不到类别字典文件: {self.classes_path}")

        # 加载模型架构与权重
        try:
            num_classes = len(self.class_names) if self.class_names else 101
            self.model = timm.create_model('efficientnet_b0', pretrained=False, num_classes=num_classes)
            if os.path.exists(self.model_path):
                self.model.load_state_dict(torch.load(self.model_path, map_location=self.device, weights_only=True))
                logger.info(f"本地 CV 模型权重加载成功: {self.model_path}")
            else:
                logger.error(f"找不到模型权重文件: {self.model_path}，分类器将输出随机结果！")
            
            self.model.to(self.device)
            self.model.eval()
        except Exception as e:
            logger.error(f"初始化本地模型失败: {str(e)}")

        # 图像预处理流水线
        self.transform = transforms.Compose([
            transforms.Resize(256),
            transforms.CenterCrop(224),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        ])

    def predict(self, base64_img: str) -> tuple:
        """
        接收 Base64 图片，返回识别出的菜品名称和置信度（food_name, confidence）
        """
        try:
            # 清理base64头
            clean_b64 = re.sub(r'^data:image/.+;base64,', '', base64_img)
            image_data = base64.b64decode(clean_b64)
            image = Image.open(BytesIO(image_data)).convert('RGB')

            # 预处理与推理
            img_tensor = self.transform(image).unsqueeze(0).to(self.device)
            
            with torch.no_grad():
                outputs = self.model(img_tensor)
                # 使用softmax获取各类别的概率
                probabilities = torch.nn.functional.softmax(outputs[0], dim=0)
                # 获取最大概率及其对应的索引
                confidence, predicted = torch.max(probabilities, 0)
                
                class_idx = predicted.item()
                confidence_score = confidence.item()

            if self.class_names and class_idx < len(self.class_names):
                food_name = self.class_names[class_idx]
                food_name = food_name.replace('_', ' ').title()
                logger.info(f"本地 CV 模型识别结果: {food_name}, 置信度: {confidence_score:.4f}")
                return food_name, confidence_score
            else:
                return "Unknown Food", 0.0
                
        except Exception as e:
            logger.error(f"CV 推理失败: {str(e)}")
            return "Unknown Food", 0.0

# 实例化单例
food_classifier = FoodClassifier()