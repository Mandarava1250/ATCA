// ============================================
// 浏览状态检测中间件测试
// 验证爬虫检测和内存清理功能
// ============================================

const { isBot } = require('./browseState');

// ============================================
// 爬虫检测测试
// ============================================
describe('爬虫检测功能', () => {
  describe('isBot函数', () => {
    it('应该正确识别Google爬虫', () => {
      const userAgent = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';
      expect(isBot(userAgent)).toBe(true);
    });

    it('应该正确识别Bing爬虫', () => {
      const userAgent = 'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)';
      expect(isBot(userAgent)).toBe(true);
    });

    it('应该正确识别百度爬虫', () => {
      const userAgent = 'Mozilla/5.0 (compatible; Baiduspider/2.0; +http://www.baidu.com/search/spider.html)';
      expect(isBot(userAgent)).toBe(true);
    });

    it('应该正确识别搜狗爬虫', () => {
      const userAgent = 'Sogou web spider/4.0(+http://www.sogou.com/docs/help/webmasters.htm#07)';
      expect(isBot(userAgent)).toBe(true);
    });

    it('应该正确识别普通浏览器', () => {
      const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
      expect(isBot(userAgent)).toBe(false);
    });

    it('应该正确识别移动端浏览器', () => {
      const userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1';
      expect(isBot(userAgent)).toBe(false);
    });

    it('应该处理空字符串User-Agent', () => {
      expect(isBot('')).toBe(false);
    });

    it('应该处理undefined User-Agent', () => {
      expect(isBot(undefined)).toBe(false);
    });

    it('应该正确识别包含bot关键字的爬虫', () => {
      const userAgent = 'MyCustomBot/1.0';
      expect(isBot(userAgent)).toBe(true);
    });

    it('应该正确识别包含crawler关键字的爬虫', () => {
      const userAgent = 'SiteCrawler/2.0';
      expect(isBot(userAgent)).toBe(true);
    });

    it('应该正确识别包含spider关键字的爬虫', () => {
      const userAgent = 'WebSpider/3.0';
      expect(isBot(userAgent)).toBe(true);
    });

    it('应该正确识别包含slurp关键字的爬虫(Yahoo)', () => {
      const userAgent = 'Mozilla/5.0 (compatible; Yahoo! Slurp; http://help.yahoo.com/help/us/ysearch/slurp)';
      expect(isBot(userAgent)).toBe(true);
    });
  });
});