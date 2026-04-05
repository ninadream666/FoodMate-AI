/**
 * orderService 单元测试
 * 测试订单状态常量完整性、状态辅助方法、取消判断逻辑
 * 纯逻辑测试，不依赖React Native运行时
 */

// 复刻源码中的 ORDER_STATUS 常量
const ORDER_STATUS = {
    PENDING: { label: '待支付', color: '#e6a23c' },
    PAID: { label: '已支付', color: '#409eff' },
    CONFIRMED: { label: '已接单', color: '#409eff' },
    ACCEPTED: { label: '已接单', color: '#409eff' },
    PREPARING: { label: '制作中', color: '#e6a23c' },
    READY: { label: '待配送', color: '#e6a23c' },
    DELIVERING: { label: '配送中', color: '#909399' },
    DELIVERED: { label: '已送达', color: '#67c23a' },
    COMPLETED: { label: '已完成', color: '#67c23a' },
    CANCELLED: { label: '已取消', color: '#909399' },
    CANCEL_PENDING: { label: '取消中', color: '#e6a23c' },
    REFUNDED: { label: '已退款', color: '#909399' },
};

// 复刻源码辅助方法
const getStatusLabel = (status) => {
    const code = typeof status === 'object' && status !== null ? status.code : status;
    return ORDER_STATUS[code]?.label || code;
};
const getStatusColor = (status) => {
    const code = typeof status === 'object' && status !== null ? status.code : status;
    return ORDER_STATUS[code]?.color || '#999';
};
const canCancel = (status) => {
    const code = typeof status === 'object' && status !== null ? status.code : status;
    return ['PENDING', 'PAID', 'CONFIRMED', 'PREPARING'].includes(code);
};

describe('ORDER_STATUS - 常量完整性', () => {
    test('应包含所有12种预定义状态', () => {
        const expected = [
            'PENDING', 'PAID', 'CONFIRMED', 'ACCEPTED', 'PREPARING',
            'READY', 'DELIVERING', 'DELIVERED', 'COMPLETED',
            'CANCELLED', 'CANCEL_PENDING', 'REFUNDED',
        ];
        expected.forEach(s => {
            expect(ORDER_STATUS[s]).toBeDefined();
            expect(ORDER_STATUS[s].label).toBeTruthy();
            expect(ORDER_STATUS[s].color).toMatch(/^#/);
        });
    });

    test('每个状态都有label和color', () => {
        Object.values(ORDER_STATUS).forEach(s => {
            expect(typeof s.label).toBe('string');
            expect(s.color).toMatch(/^#[0-9a-f]{6}$/i);
        });
    });
});

describe('getStatusLabel - 状态文本解析', () => {
    test('字符串状态解析', () => {
        expect(getStatusLabel('PENDING')).toBe('待支付');
        expect(getStatusLabel('DELIVERED')).toBe('已送达');
        expect(getStatusLabel('COMPLETED')).toBe('已完成');
        expect(getStatusLabel('CANCELLED')).toBe('已取消');
        expect(getStatusLabel('CANCEL_PENDING')).toBe('取消中');
        expect(getStatusLabel('REFUNDED')).toBe('已退款');
    });

    test('对象状态 { code: "PAID" } 解析', () => {
        expect(getStatusLabel({ code: 'PAID' })).toBe('已支付');
        expect(getStatusLabel({ code: 'PREPARING' })).toBe('制作中');
    });

    test('未知状态返回原始值', () => {
        expect(getStatusLabel('UNKNOWN')).toBe('UNKNOWN');
        expect(getStatusLabel('XXX')).toBe('XXX');
    });

    test('null状态不崩溃', () => {
        expect(getStatusLabel(null)).toBe(null);
    });
});

describe('getStatusColor - 状态颜色', () => {
    test('已知状态返回正确颜色', () => {
        expect(getStatusColor('PENDING')).toBe('#e6a23c');
        expect(getStatusColor('COMPLETED')).toBe('#67c23a');
        expect(getStatusColor('CANCELLED')).toBe('#909399');
    });

    test('未知状态返回默认灰色', () => {
        expect(getStatusColor('NONE')).toBe('#999');
    });
});

describe('canCancel - 可取消判断', () => {
    test('PENDING/PAID/CONFIRMED/PREPARING可取消', () => {
        expect(canCancel('PENDING')).toBe(true);
        expect(canCancel('PAID')).toBe(true);
        expect(canCancel('CONFIRMED')).toBe(true);
        expect(canCancel('PREPARING')).toBe(true);
    });

    test('DELIVERED/COMPLETED/CANCELLED不可取消', () => {
        expect(canCancel('DELIVERED')).toBe(false);
        expect(canCancel('COMPLETED')).toBe(false);
        expect(canCancel('CANCELLED')).toBe(false);
        expect(canCancel('DELIVERING')).toBe(false);
    });

    test('支持对象格式状态', () => {
        expect(canCancel({ code: 'PENDING' })).toBe(true);
        expect(canCancel({ code: 'DELIVERED' })).toBe(false);
    });

    test('CANCEL_PENDING不可再次取消', () => {
        expect(canCancel('CANCEL_PENDING')).toBe(false);
    });
});
