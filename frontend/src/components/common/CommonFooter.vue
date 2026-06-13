<template>
  <footer class="footer">
    <!-- 装饰线 -->
    <div class="footer-ornament">
      <div class="ornament-line"></div>
      <svg class="ornament-icon" viewBox="0 0 48 48" fill="none">
        <path d="M24 4L28 16H40L30 24L34 36L24 28L14 36L18 24L8 16H20L24 4Z" fill="currentColor" opacity="0.2"/>
      </svg>
      <div class="ornament-line"></div>
    </div>

    <div class="container">
      <div class="footer-grid">
        <!-- Brand -->
        <div class="footer-brand-col">
          <div class="footer-brand">
            <svg class="brand-icon" viewBox="0 0 40 40" fill="none">
              <path d="M20 4L4 16H10V32H16V22H24V32H30V16H36L20 4Z" fill="currentColor"/>
            </svg>
            <div>
              <h3 class="footer-title">华夏营造</h3>
              <p class="footer-subtitle">中国古代建筑文化传承平台</p>
            </div>
          </div>
          <p class="footer-desc">传承千年营造智慧， digitally 复原古建之美。以三维互动与人工智能，让每一座古建重生于数字世界。</p>
          <div class="footer-stats">
            <div><strong>6</strong><span>朝建筑</span></div>
            <div><strong>5</strong><span>竞赛模式</span></div>
            <div><strong>18</strong><span>传统构件</span></div>
          </div>
        </div>

        <!-- Links -->
        <div class="footer-links-col">
          <h4>功 能</h4>
          <router-link to="/architecture">古建筑馆</router-link>
          <router-link to="/quiz">知识竞赛</router-link>
          <router-link to="/workshop">3D工坊</router-link>
          <router-link to="/community">社区讨论</router-link>
        </div>

        <div class="footer-links-col">
          <h4>关 于</h4>
          <a href="#">展览简介</a>
          <a href="#">使用指南</a>
          <a href="#">联系我们</a>
          <a href="#">隐私政策</a>
        </div>
      </div>

      <!-- Bottom -->
      <div class="footer-bottom">
        <p> 2024 华夏营造 Ancient Chinese Architecture Digital Exhibition &nbsp;|&nbsp; 
          <a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer" class="icp-link">沪ICP备2026025927号</a>
        </p>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  background: linear-gradient(180deg, #24201C 0%, #1A1714 100%);
  border-top: 1px solid var(--border);
  padding-top: 0;
}

.footer-ornament {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 32px 0 24px;
}
.ornament-line {
  flex: 1;
  max-width: 160px;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--border-light), transparent);
}
.ornament-icon {
  width: 32px;
  height: 32px;
  color: var(--border-light);
}

.footer-grid {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: 48px;
  padding-bottom: 40px;
}

.footer-brand-col { max-width: 360px; }
.footer-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}
.brand-icon {
  width: 28px;
  height: 28px;
  color: var(--gold);
}
.footer-title {
  font-family: 'Noto Serif SC','STSong',serif;
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--gold);
  letter-spacing: 0.1em;
}
.footer-subtitle {
  font-size: 0.6875rem;
  color: var(--text-muted);
  letter-spacing: 0.05em;
}
.footer-desc {
  font-size: 0.8125rem;
  color: var(--text-muted);
  line-height: 1.8;
  margin-bottom: 16px;
}

.footer-stats {
  display: flex;
  gap: 24px;
}
.footer-stats > div {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.footer-stats strong {
  font-family: 'Noto Serif SC','STSong',serif;
  font-size: 1.25rem;
  color: var(--gold);
  line-height: 1.2;
}
.footer-stats span {
  font-size: 0.6875rem;
  color: var(--text-muted);
  letter-spacing: 0.05em;
}

.footer-links-col h4 {
  font-family: 'Noto Serif SC','STSong',serif;
  font-size: 0.9375rem;
  font-weight: 600;
  margin-bottom: 16px;
  color: var(--text);
  letter-spacing: 0.1em;
}
.footer-links-col a {
  display: block;
  color: var(--text-muted);
  font-size: 0.8125rem;
  padding: 6px 0;
  letter-spacing: 0.04em;
  transition: all var(--t);
}
.footer-links-col a:hover {
  color: var(--gold);
  padding-left: 6px;
}

.footer-bottom {
  border-top: 1px solid var(--border);
  padding: 20px 0;
  text-align: center;
  color: var(--text-muted);
  font-size: 0.75rem;
  letter-spacing: 0.03em;
}
.footer-bottom .icp-link {
  color: inherit;
  text-decoration: none;
}
.footer-bottom .icp-link:hover {
  color: var(--gold);
  text-decoration: underline;
}

@media (max-width: 768px) {
  .footer-grid { grid-template-columns: 1fr; gap: 32px; }
  .footer-brand-col { max-width: 100%; }
  .footer-links-col { border-top: 1px solid var(--border); padding-top: 16px; }
}
</style>
