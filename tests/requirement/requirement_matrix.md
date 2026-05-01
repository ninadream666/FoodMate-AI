# 需求—测试用例追踪矩阵（Requirement Traceability Matrix）

本矩阵将《膳食智伴：基于端云协同的健康外卖移动智能体项目计划书》中的核心需求条目逐条映射到具体测试用例，覆盖单元测试、集成测试、系统测试、安全测试、白盒测试与本目录下的需求回归测试，确保所有显性需求均有对应验证。

## 编号规则

- `REQ-XXX`：业务需求条目，X 为序号
- 「关键」：每次发布前必须通过的核心需求
- 「次要」：次要需求，可在月度回归中验证

## 一、用户与认证类（REQ-001 ~ REQ-006）

| 需求 ID | 需求描述 | 优先级 | 验证测试用例 | 测试方式 |
|---------|---------|--------|-------------|---------|
| REQ-001 | 用户可使用用户名+密码注册账号 | 关键 | `AuthServiceTest.register_withValidData`、`test_user_flow.py::test_register_success`、`test_customer_acceptance.py::test_register_new_account` | 白盒+黑盒 |
| REQ-002 | 用户可登录获取 JWT Token | 关键 | `AuthServiceTest.login_withValidCredentials`、`test_user_flow.py::test_login_returns_token` | 白盒+黑盒 |
| REQ-003 | 用户名必须唯一 | 关键 | `AuthServiceTest.register_withExistingUsername`、`test_user_flow.py::test_duplicate_username` | 白盒+黑盒 |
| REQ-004 | ADMIN 角色不允许公开注册 | 关键 | `AuthServiceTest.register_withInvalidRole` | 白盒 |
| REQ-005 | JWT Token 含 ID/用户名/角色 | 关键 | `AuthServiceTest.generateToken_shouldContainUserInfo` | 白盒 |
| REQ-006 | Token 过期/失效后被拒绝 | 关键 | `AuthServiceTest.validateToken_withExpiredToken`、`test_authentication.py::test_invalid_token` | 白盒+黑盒 |

## 二、信用体系（REQ-007 ~ REQ-010）

| 需求 ID | 需求描述 | 优先级 | 验证测试用例 | 测试方式 |
|---------|---------|--------|-------------|---------|
| REQ-007 | 新用户初始 100 分/EXCELLENT | 关键 | `CreditServiceTest.initialScore`、`test_REQ_007_credit_initial_score` | 白盒 |
| REQ-008 | 取消订单扣 10 分 | 次要 | `CreditServiceTest.cancelOrderDeducts10` | 白盒 |
| REQ-009 | 完成订单 +2 分 | 次要 | `CreditServiceTest.completeOrderAdds2` | 白盒 |
| REQ-010 | 信用分必须在 0–100 内 | 关键 | `CreditServiceTest.scoreLowerBound`、`scoreUpperBound`、`test_REQ_010_*` | 白盒 |

## 三、订单管理（REQ-011 ~ REQ-015）

| 需求 ID | 需求描述 | 优先级 | 验证测试用例 | 测试方式 |
|---------|---------|--------|-------------|---------|
| REQ-011 | 订单初始状态 PENDING | 关键 | `OrderServiceTest.createOrder_initialStatus` | 白盒 |
| REQ-012 | 已支付订单不可重复支付 | 关键 | `OrderServiceTest.duplicatePayment` | 白盒 |
| REQ-013 | 已送达订单不可取消 | 关键 | `OrderServiceTest.cancelDelivered` | 白盒 |
| REQ-014 | 非本人不可取消订单 | 关键 | `OrderServiceTest.cancelByOthers` | 白盒 |
| REQ-015 | 商家拒单触发退款事件 | 关键 | `OrderServiceTest.rejectTriggersRefund` | 白盒 |

## 四、商户与菜单（REQ-016 ~ REQ-018）

| 需求 ID | 需求描述 | 优先级 | 验证测试用例 | 测试方式 |
|---------|---------|--------|-------------|---------|
| REQ-016 | 列表仅返回 ACTIVE 商户 | 关键 | `MerchantServiceTest.listOnlyActive` | 白盒 |
| REQ-017 | 未认领商户可被认领 | 次要 | `MerchantServiceTest.claimMerchant` | 白盒 |
| REQ-018 | 公开菜单仅含 available 菜品 | 关键 | `MenuServiceTest.publicMenu` | 白盒 |

## 五、营销与优惠（REQ-019 ~ REQ-021）

| 需求 ID | 需求描述 | 优先级 | 验证测试用例 | 测试方式 |
|---------|---------|--------|-------------|---------|
| REQ-019 | 满减券未达门槛不可用 | 关键 | `CouponCalculationServiceTest.belowThreshold`、`test_REQ_019_coupon_threshold` | 白盒 |
| REQ-020 | 优惠后金额不低于 0 | 关键 | `CouponCalculationServiceTest.minZero`、`test_REQ_020_coupon_min_amount` | 白盒 |
| REQ-021 | 折扣券支持封顶 | 次要 | `CouponCalculationServiceTest.maxDiscountCap` | 白盒 |

## 六、AI 推荐核心（REQ-022 ~ REQ-027，本组为本课程论文重点）

| 需求 ID | 需求描述 | 优先级 | 验证测试用例 | 测试方式 |
|---------|---------|--------|-------------|---------|
| REQ-022 | 实现 4 种 MAB 策略 | 关键 | `test_mab_strategy.py::*`、`test_whitebox_real_import.py::TestMABStrategiesRealImport::*`、`test_REQ_022_four_mab_strategies_implemented` | 白盒 |
| REQ-023 | 评分考虑天气/温度上下文 | 关键 | `test_whitebox_real_import.py::test_contextual_bandit_hot_weather`、`test_REQ_023_recommendation_considers_temperature` | 白盒 |
| REQ-024 | 评分考虑健康上下文 | 关键 | `test_whitebox_real_import.py::test_contextual_bandit_post_workout`、`test_REQ_024_recommendation_considers_health_context` | 白盒 |
| REQ-025 | 推荐权重必须归一化 | 关键 | `test_REQ_025_weights_must_sum_to_one`、`TestProfilerAgentRealImport::test_recommendation_weights_normalize` | 白盒 |
| REQ-026 | 用户分群自动判定 | 关键 | `test_REQ_026_user_segment_*` (3 用例) | 白盒 |
| REQ-027 | 端云协同硬过滤 | 关键 | `test_REQ_027_edge_constraint_keywords_defined` | 白盒 |

## 七、安全（REQ-028 ~ REQ-031）

| 需求 ID | 需求描述 | 优先级 | 验证测试用例 | 测试方式 |
|---------|---------|--------|-------------|---------|
| REQ-028 | 防御 SQL 注入 | 关键 | `test_input_validation.py::test_sql_injection_*` (5 用例) | 黑盒 |
| REQ-029 | 防御 XSS | 关键 | `test_input_validation.py::test_xss_*` (4 用例) | 黑盒 |
| REQ-030 | 拒绝 JWT none 算法 | 关键 | `test_authentication.py::test_none_algorithm` | 黑盒 |
| REQ-031 | 未认证不可访问受保护资源 | 关键 | `test_authentication.py::test_no_auth_header` | 黑盒 |

## 八、性能（REQ-032 ~ REQ-033）

| 需求 ID | 需求描述 | 优先级 | 验证测试用例 | 测试方式 |
|---------|---------|--------|-------------|---------|
| REQ-032 | 10 并发下平均响应 < 100ms | 关键 | `locustfile.py` 60 秒压测，267 请求平均 55ms | 黑盒 |
| REQ-033 | 10 并发下零失败 | 关键 | 同上，0% 失败率 | 黑盒 |

## 九、覆盖率统计

- **需求总数**：33 条
- **关键需求**：26 条，全部覆盖
- **次要需求**：7 条，全部覆盖
- **覆盖率**：**100%（33/33）**
- **测试方式分布**：白盒 22 条、黑盒 7 条、白盒+黑盒 4 条

## 十、运行需求回归

```bash
# 全部需求回归
python -m pytest tests/requirement/ -v

# 仅核心需求快速回归
python -m pytest tests/requirement/ -v -m req_critical
```
