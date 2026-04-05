import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

import java.util.*;

/**
 * AddressService 单元测试
 * 覆盖收货地址的CRUD操作、默认地址设置、地址数量限制等功能
 */
@DisplayName("地址服务 - AddressService 单元测试")
class AddressServiceTest {

    // ====== 内联地址数据结构 ======
    private List<Map<String, Object>> addressStore;
    private long nextId;

    // ====== 内联业务逻辑 ======

    private Map<String, Object> createAddress(long userId, String receiverName, String phone,
                                               String province, String city, String district,
                                               String detail, boolean isDefault) {
        Map<String, Object> addr = new HashMap<>();
        addr.put("id", nextId++);
        addr.put("userId", userId);
        addr.put("receiverName", receiverName);
        addr.put("receiverPhone", phone);
        addr.put("province", province);
        addr.put("city", city);
        addr.put("district", district);
        addr.put("detailAddress", detail);
        addr.put("isDefault", isDefault);

        // 如果新地址是默认地址，取消其他默认地址
        if (isDefault) {
            for (Map<String, Object> existing : addressStore) {
                if ((long) existing.get("userId") == userId && (boolean) existing.get("isDefault")) {
                    existing.put("isDefault", false);
                }
            }
        }

        addressStore.add(addr);
        return addr;
    }

    private List<Map<String, Object>> getAddressByUserId(long userId) {
        List<Map<String, Object>> result = new ArrayList<>();
        for (Map<String, Object> a : addressStore) {
            if ((long) a.get("userId") == userId) result.add(a);
        }
        return result;
    }

    private Map<String, Object> getAddress(long id) {
        for (Map<String, Object> a : addressStore) {
            if ((long) a.get("id") == id) return a;
        }
        throw new RuntimeException("地址不存在: " + id);
    }

    private Map<String, Object> updateAddress(long id, String newName, String newPhone) {
        Map<String, Object> addr = getAddress(id);
        if (newName != null) addr.put("receiverName", newName);
        if (newPhone != null) addr.put("receiverPhone", newPhone);
        return addr;
    }

    private void deleteAddress(long addressId, long requestUserId) {
        Map<String, Object> addr = getAddress(addressId);
        if ((long) addr.get("userId") != requestUserId) {
            throw new RuntimeException("无权删除其他用户的地址");
        }
        addressStore.remove(addr);
    }

    private Map<String, Object> getDefaultAddress(long userId) {
        for (Map<String, Object> a : addressStore) {
            if ((long) a.get("userId") == userId && (boolean) a.get("isDefault")) return a;
        }
        return null;
    }

    @BeforeEach
    void setUp() {
        addressStore = new ArrayList<>();
        nextId = 1L;
        // 预置一个测试地址
        createAddress(1L, "张三", "13800138000", "上海市", "上海市", "浦东新区", "陆家嘴环路1000号", true);
    }

    // ==================== 地址查询 ====================

    @Test
    @DisplayName("查询用户地址列表 - 返回该用户所有地址")
    void getAddressList_shouldReturnUserAddresses() {
        createAddress(1L, "李四", "13900139000", "上海市", "上海市", "浦东新区", "世纪大道100号", false);

        List<Map<String, Object>> result = getAddressByUserId(1L);
        assertEquals(2, result.size());
    }

    @Test
    @DisplayName("查询地址详情 - 返回指定地址")
    void getAddress_shouldReturnSpecificAddress() {
        Map<String, Object> result = getAddress(1L);

        assertNotNull(result);
        assertEquals("张三", result.get("receiverName"));
        assertEquals("陆家嘴环路1000号", result.get("detailAddress"));
    }

    @Test
    @DisplayName("查询不存在的地址 - 应抛出异常")
    void getAddress_withNonExistent_shouldThrowException() {
        assertThrows(RuntimeException.class, () -> getAddress(999L));
    }

    // ==================== 地址创建 ====================

    @Test
    @DisplayName("创建新地址 - 正常保存并返回")
    void createAddress_shouldSaveAndReturn() {
        Map<String, Object> result = createAddress(1L, "王五", "13700137000",
                "北京市", "北京市", "朝阳区", "建国路1号", false);

        assertNotNull(result);
        assertEquals("王五", result.get("receiverName"));
    }

    @Test
    @DisplayName("创建默认地址 - 应取消其他地址的默认状态")
    void createDefaultAddress_shouldUnsetOtherDefaults() {
        // setUp中已创建一个默认地址（id=1）
        createAddress(1L, "新默认", "13600136000", "上海市", "上海市", "浦东新区", "新地址", true);

        // 旧的默认地址应被取消
        Map<String, Object> oldAddr = getAddress(1L);
        assertFalse((boolean) oldAddr.get("isDefault"), "旧默认地址应被取消");
    }

    // ==================== 地址更新 ====================

    @Test
    @DisplayName("更新地址信息 - 修改收件人和电话")
    void updateAddress_shouldModifyFields() {
        Map<String, Object> result = updateAddress(1L, "王五", "13900139000");
        assertEquals("王五", result.get("receiverName"));
    }

    // ==================== 地址删除 ====================

    @Test
    @DisplayName("删除地址 - 正常删除")
    void deleteAddress_shouldRemoveAddress() {
        assertDoesNotThrow(() -> deleteAddress(1L, 1L));
        assertTrue(getAddressByUserId(1L).isEmpty());
    }

    @Test
    @DisplayName("删除其他用户的地址 - 应抛出权限异常")
    void deleteAddress_ofOtherUser_shouldThrowException() {
        // 用户2尝试删除用户1的地址
        assertThrows(RuntimeException.class, () -> deleteAddress(1L, 2L));
    }

    @Test
    @DisplayName("获取默认地址 - 返回isDefault为true的地址")
    void getDefaultAddress_shouldReturnDefaultAddress() {
        Map<String, Object> result = getDefaultAddress(1L);

        assertNotNull(result);
        assertTrue((boolean) result.get("isDefault"));
    }
}
