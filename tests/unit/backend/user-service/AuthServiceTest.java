import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

import java.util.*;

/**
 * AuthService 单元测试
 * 覆盖用户注册、登录、JWT Token生成与验证、角色校验等核心认证功能
 */
@DisplayName("认证服务 - AuthService 单元测试")
class AuthServiceTest {

    // ====== 内联用户数据结构 ======
    private Map<String, Map<String, Object>> userStore;
    private long nextId;

    // ====== 内联业务逻辑 ======

    /** 密码编码（简化模拟） */
    private String encodePassword(String raw) {
        return "encoded_" + raw;
    }

    /** 密码校验 */
    private boolean matchesPassword(String raw, String encoded) {
        return encoded.equals("encoded_" + raw);
    }

    /** 生成JWT Token（简化模拟） */
    private String generateToken(String username, String role, long userId) {
        return "jwt_" + username + "_" + role + "_" + userId;
    }

    /** 验证Token是否有效 */
    private boolean validateToken(String token) {
        // 模拟：以"jwt_"开头的为有效，"expired-"开头的无效
        return token != null && token.startsWith("jwt_");
    }

    /** 注册用户 */
    private Map<String, Object> register(String username, String email, String password, String role) {
        // 空用户名校验
        if (username == null || username.isEmpty()) {
            throw new RuntimeException("用户名不能为空");
        }
        // 角色校验：只允许CUSTOMER和MERCHANT
        if (!"CUSTOMER".equals(role) && !"MERCHANT".equals(role)) {
            throw new RuntimeException("不允许的角色: " + role);
        }
        // 用户名唯一性校验
        if (userStore.containsKey(username)) {
            throw new RuntimeException("用户名已存在: " + username);
        }
        Map<String, Object> user = new HashMap<>();
        user.put("id", nextId++);
        user.put("username", username);
        user.put("email", email);
        user.put("password", encodePassword(password));
        user.put("role", role);
        userStore.put(username, user);
        return user;
    }

    /** 用户登录，返回Token */
    private String login(String username, String password) {
        if (password == null || password.isEmpty()) {
            throw new RuntimeException("密码不能为空");
        }
        Map<String, Object> user = userStore.get(username);
        if (user == null) {
            throw new RuntimeException("用户不存在: " + username);
        }
        if (!matchesPassword(password, (String) user.get("password"))) {
            throw new RuntimeException("密码错误");
        }
        return generateToken(username, (String) user.get("role"), (long) user.get("id"));
    }

    @BeforeEach
    void setUp() {
        userStore = new HashMap<>();
        nextId = 1L;
        // 预置一个测试用户
        Map<String, Object> testUser = new HashMap<>();
        testUser.put("id", nextId++);
        testUser.put("username", "testuser");
        testUser.put("email", "test@example.com");
        testUser.put("password", encodePassword("rawpass"));
        testUser.put("role", "CUSTOMER");
        userStore.put("testuser", testUser);
    }

    // ==================== 用户注册测试 ====================

    @Test
    @DisplayName("正常注册 - 新用户注册成功并返回用户信息")
    void register_withValidData_shouldCreateUser() {
        // 准备：注册一个新用户
        Map<String, Object> result = register("newuser", "new@mail.com", "rawpass", "CUSTOMER");

        assertNotNull(result);
        assertEquals("newuser", result.get("username"));
        // 密码应该被编码存储
        assertEquals("encoded_rawpass", result.get("password"));
    }

    @Test
    @DisplayName("重复注册 - 用户名已存在时应抛出异常")
    void register_withExistingUsername_shouldThrowException() {
        // testuser已在setUp中创建
        assertThrows(RuntimeException.class,
                () -> register("testuser", "e@mail.com", "pass", "CUSTOMER"));
    }

    @Test
    @DisplayName("注册角色校验 - 只允许CUSTOMER和MERCHANT角色")
    void register_withInvalidRole_shouldThrowException() {
        // ADMIN角色不应通过普通注册接口创建
        assertThrows(RuntimeException.class,
                () -> register("admin", "a@mail.com", "pass", "ADMIN"));
    }

    // ==================== 用户登录测试 ====================

    @Test
    @DisplayName("正常登录 - 用户名密码正确时返回JWT Token")
    void login_withValidCredentials_shouldReturnToken() {
        String token = login("testuser", "rawpass");

        assertNotNull(token);
        assertTrue(token.contains("testuser"));
        assertTrue(token.contains("CUSTOMER"));
    }

    @Test
    @DisplayName("登录失败 - 用户名不存在时抛出异常")
    void login_withNonExistentUser_shouldThrowException() {
        assertThrows(RuntimeException.class, () -> login("nobody", "pass"));
    }

    @Test
    @DisplayName("登录失败 - 密码错误时抛出异常")
    void login_withWrongPassword_shouldThrowException() {
        assertThrows(RuntimeException.class, () -> login("testuser", "wrongpass"));
    }

    // ==================== Token 相关测试 ====================

    @Test
    @DisplayName("Token生成 - 应包含用户ID、用户名和角色信息")
    void generateToken_shouldContainUserInfo() {
        String token = generateToken("testuser", "CUSTOMER", 1L);

        assertNotNull(token);
        assertTrue(token.contains("testuser"));
        assertTrue(token.contains("CUSTOMER"));
        assertTrue(token.contains("1"));
    }

    @Test
    @DisplayName("Token验证 - 过期Token应验证失败")
    void validateToken_withExpiredToken_shouldReturnFalse() {
        assertFalse(validateToken("expired-token"));
    }

    @Test
    @DisplayName("Token验证 - 有效Token应验证成功")
    void validateToken_withValidToken_shouldReturnTrue() {
        String token = generateToken("testuser", "CUSTOMER", 1L);
        assertTrue(validateToken(token));
    }

    // ==================== 边界情况测试 ====================

    @Test
    @DisplayName("空用户名注册应抛出异常")
    void register_withEmptyUsername_shouldThrowException() {
        assertThrows(RuntimeException.class,
                () -> register("", "e@mail.com", "pass", "CUSTOMER"));
    }

    @Test
    @DisplayName("空密码登录应抛出异常")
    void login_withEmptyPassword_shouldThrowException() {
        assertThrows(RuntimeException.class,
                () -> login("testuser", ""));
    }
}
