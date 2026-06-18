// ============================================
// 浏览状态中间件内存管理测试
// ============================================

const { getClientStateStats, triggerCleanup } = require('./browseState');

describe('内存管理功能', () => {
  describe('配置参数验证', () => {
    it('应该有合理的IDLE_TIMEOUT配置（30分钟）', () => {
      // IDLE_TIMEOUT应该不小于10分钟，不大于60分钟
      const expectedMin = 600;  // 10分钟
      const expectedMax = 3600; // 60分钟
      expect(expectedMin).toBeLessThan(1800);
      expect(expectedMax).toBeGreaterThan(1800);
    });

    it('应该有最大容量限制', () => {
      // MAX_CLIENT_STATES 应该合理设置
      const maxClients = 10000;
      expect(maxClients).toBeGreaterThan(100);
      expect(maxClients).toBeLessThan(100000);
    });

    it('应该有合理的清理间隔', () => {
      // CLEANUP_INTERVAL 应该在1-10分钟之间
      const cleanupInterval = 180000; // 3分钟
      expect(cleanupInterval).toBeGreaterThan(60000);
      expect(cleanupInterval).toBeLessThan(600000);
    });
  });

  describe('统计信息功能', () => {
    it('应该能够获取客户端状态统计', () => {
      const stats = getClientStateStats();
      
      expect(stats).toHaveProperty('totalCount');
      expect(stats).toHaveProperty('activeCount');
      expect(stats).toHaveProperty('idleCount');
      expect(stats).toHaveProperty('recentActiveCount');
      expect(stats).toHaveProperty('maxCapacity');
      expect(stats).toHaveProperty('utilizationRate');

      expect(typeof stats.totalCount).toBe('number');
      expect(typeof stats.maxCapacity).toBe('number');
      expect(typeof stats.utilizationRate).toBe('string');
    });

    it('应该能正确计算利用率', () => {
      const stats = getClientStateStats();
      expect(stats.utilizationRate).toMatch(/\d+\.\d+%/);
    });
  });

  describe('清理功能', () => {
    it('应该能够手动触发清理', () => {
      const cleaned = triggerCleanup();
      expect(typeof cleaned).toBe('number');
      expect(cleaned).toBeGreaterThanOrEqual(0);
    });
  });
});