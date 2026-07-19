<template>
  <div class="overview-page">
    <Navbar />
    <div class="overview-container">
      <aside class="sidebar-nav">
        <nav class="sidebar-menu">
          <ul class="menu-list">
            <li v-for="item in navItems" :key="item.id">
              <a 
                :href="'#' + item.id" 
                class="menu-item"
                :class="{ active: activeSection === item.id }"
                @click="scrollToSection(item.id)"
              >
                <span class="menu-number">{{ item.number }}</span>
                <span class="menu-label">{{ item.label }}</span>
              </a>
            </li>
          </ul>
        </nav>
      </aside>
      <main class="overview-content">
        <section class="section-hero">
      <div class="hero-content">
        <h1 class="hero-title">华夏营造</h1>
        <p class="hero-subtitle">中国古代建筑文化虚拟展览馆</p>
        <div class="hero-badge">项目总览</div>
      </div>
    </section>

    <section id="section-background" class="section-content">
      <div class="section-card">
        <div class="section-header">
          <span class="section-number">一</span>
          <h2 class="section-title">项目背景与意义</h2>
        </div>

        <div class="two-column">
          <div class="column">
            <h3 class="subsection-title">选题背景</h3>
            <p class="intro-text">中国传统古建筑蕴含数千年营造智慧，但数字化传播面临四大挑战：</p>
            <div class="feature-grid">
              <div class="feature-card">
                <div class="feature-icon">
                  <svg viewBox="0 0 24 24" width="24" height="24">
                    <path d="M18 4H6c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-2 14H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V7h-2v2h2z" fill="currentColor"/>
                  </svg>
                </div>
                <h4 class="feature-title">传播方式单一</h4>
                <p class="feature-desc">传统图文缺乏交互性与沉浸感</p>
              </div>
              <div class="feature-card">
                <div class="feature-icon">
                  <svg viewBox="0 0 24 24" width="24" height="24">
                    <path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z" fill="currentColor"/>
                  </svg>
                </div>
                <h4 class="feature-title">知识门槛高</h4>
                <p class="feature-desc">专业知识体系复杂难学</p>
              </div>
              <div class="feature-card">
                <div class="feature-icon">
                  <svg viewBox="0 0 24 24" width="24" height="24">
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zm-5-7l-3 3.72L9 13l-3 4h12l-4-5z" fill="currentColor"/>
                  </svg>
                </div>
                <h4 class="feature-title">资源分散</h4>
                <p class="feature-desc">优质数字内容缺乏统一门户</p>
              </div>
              <div class="feature-card">
                <div class="feature-icon">
                  <svg viewBox="0 0 24 24" width="24" height="24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" fill="currentColor"/>
                  </svg>
                </div>
                <h4 class="feature-title">参与度低</h4>
                <p class="feature-desc">公众缺少便捷学习途径</p>
              </div>
            </div>
          </div>

          <div class="column">
            <h3 class="subsection-title">项目意义</h3>
            <div class="significance-list">
              <div class="significance-item">
                <div class="significance-icon">
                  <svg viewBox="0 0 24 24" width="20" height="20">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" fill="currentColor"/>
                  </svg>
                </div>
                <div class="significance-content">
                  <h4>文化传承</h4>
                  <p>通过数字化手段保护和传播中国传统建筑文化</p>
                </div>
              </div>
              <div class="significance-item">
                <div class="significance-icon">
                  <svg viewBox="0 0 24 24" width="20" height="20">
                    <path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z" fill="currentColor"/>
                  </svg>
                </div>
                <div class="significance-content">
                  <h4>知识普及</h4>
                  <p>降低古建筑知识学习门槛，让更多人了解营造技艺</p>
                </div>
              </div>
              <div class="significance-item">
                <div class="significance-icon">
                  <svg viewBox="0 0 24 24" width="20" height="20">
                    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z" fill="currentColor"/>
                  </svg>
                </div>
                <div class="significance-content">
                  <h4>技术创新</h4>
                  <p>融合3D建模、AI对话、知识图谱等现代技术</p>
                </div>
              </div>
              <div class="significance-item">
                <div class="significance-icon">
                  <svg viewBox="0 0 24 24" width="20" height="20">
                    <path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z" fill="currentColor"/>
                  </svg>
                </div>
                <div class="significance-content">
                  <h4>教育价值</h4>
                  <p>可作为建筑学、历史学等相关专业的辅助教学平台</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section id="section-requirements" class="section-content">
      <div class="section-card">
        <div class="section-header">
          <span class="section-number">二</span>
          <h2 class="section-title">功能需求与非功能需求</h2>
        </div>

        <div class="two-column">
          <div class="column">
            <h3 class="subsection-title">功能需求</h3>
            <table class="requirement-table">
              <thead>
                <tr>
                  <th>模块</th>
                  <th>功能描述</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>古建筑浏览</td>
                  <td>按朝代、类型分类浏览，支持搜索筛选，详情页展示历史沿革</td>
                </tr>
                <tr>
                  <td>用户系统</td>
                  <td>注册/登录、个人信息管理、积分体系、等级成长</td>
                </tr>
                <tr>
                  <td>收藏功能</td>
                  <td>收藏感兴趣的古建筑，列表页实时显示收藏状态</td>
                </tr>
                <tr>
                  <td>知识竞赛</td>
                  <td>多种题型答题竞赛，支持排行榜、积分奖励</td>
                </tr>
                <tr>
                  <td>3D建模工坊</td>
                  <td>基于Three.js的3D编辑器，OBJ导入、场景编辑、环境控制</td>
                </tr>
                <tr>
                  <td>AI智能问答</td>
                  <td>集成讯飞星火、通义千问、DeepSeek多模型问答</td>
                </tr>
                <tr>
                  <td>每日签到</td>
                  <td>每日打卡题目，可选题库已有题目或新建</td>
                </tr>
                <tr>
                  <td>活动管理</td>
                  <td>线上/线下活动发布管理，支持积分奖励</td>
                </tr>
                <tr>
                  <td>管理后台</td>
                  <td>用户、建筑、题库、AI、模型、活动全生命周期管理</td>
                </tr>
                <tr>
                  <td>精选模型</td>
                  <td>管理员标记精选，首页展示推荐内容</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="column">
            <h3 class="subsection-title">非功能需求</h3>
            <div class="non-functional-grid">
              <div class="non-functional-card">
                <div class="non-functional-icon">
                  <svg viewBox="0 0 24 24" width="24" height="24">
                    <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z" fill="currentColor"/>
                  </svg>
                </div>
                <h4>性能</h4>
                <p>首屏加载 &lt; 3秒，3D渲染 60fps</p>
              </div>
              <div class="non-functional-card">
                <div class="non-functional-icon">
                  <svg viewBox="0 0 24 24" width="24" height="24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" fill="currentColor"/>
                  </svg>
                </div>
                <h4>兼容性</h4>
                <p>支持 Chrome、Firefox、Edge、Safari</p>
              </div>
              <div class="non-functional-card">
                <div class="non-functional-icon">
                  <svg viewBox="0 0 24 24" width="24" height="24">
                    <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 11c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" fill="currentColor"/>
                  </svg>
                </div>
                <h4>安全性</h4>
                <p>JWT认证、SQL注入防护、XSS防护</p>
              </div>
              <div class="non-functional-card">
                <div class="non-functional-icon">
                  <svg viewBox="0 0 24 24" width="24" height="24">
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" fill="currentColor"/>
                  </svg>
                </div>
                <h4>可扩展性</h4>
                <p>模块化架构，便于功能扩展维护</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section id="section-tech" class="section-content">
      <div class="section-card">
        <div class="section-header">
          <span class="section-number">三</span>
          <h2 class="section-title">技术栈总览与选型理由</h2>
        </div>

        <div class="tech-section">
          <div class="tech-grid">
            <div class="tech-table-card">
              <h3 class="tech-table-title">前端技术栈</h3>
              <table class="tech-table">
                <thead>
                  <tr>
                    <th>模块</th>
                    <th>版本</th>
                    <th>功能描述</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Vue 3</td>
                    <td>3.4+</td>
                    <td>渐进式前端框架，Composition API</td>
                  </tr>
                  <tr>
                    <td>TypeScript</td>
                    <td>5.4+</td>
                    <td>静态类型检查，提升可维护性</td>
                  </tr>
                  <tr>
                    <td>Vite</td>
                    <td>5.0+</td>
                    <td>极速冷启动与HMR构建工具</td>
                  </tr>
                  <tr>
                    <td>Three.js</td>
                    <td>0.160+</td>
                    <td>3D图形渲染引擎，支撑建模工坊</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="tech-table-card">
              <h3 class="tech-table-title">后端技术栈</h3>
              <table class="tech-table">
                <thead>
                  <tr>
                    <th>模块</th>
                    <th>版本</th>
                    <th>功能描述</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Express.js</td>
                    <td>4.18+</td>
                    <td>Node.js Web框架，RESTful API</td>
                  </tr>
                  <tr>
                    <td>TypeScript</td>
                    <td>5.4+</td>
                    <td>全栈类型安全</td>
                  </tr>
                  <tr>
                    <td>SQL Server</td>
                    <td>2019+</td>
                    <td>关系型数据库，结构化数据存储</td>
                  </tr>
                  <tr>
                    <td>JWT</td>
                    <td>9.0+</td>
                    <td>JSON Web Token身份认证</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="selection-reasons">
            <h3 class="subsection-title">核心选型理由</h3>
            <div class="reason-card">
              <div class="reason-icon">
                <svg viewBox="0 0 24 24" width="24" height="24">
                  <path d="M12 2L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z" fill="currentColor"/>
                </svg>
              </div>
              <h4>为什么选择 Vue 3？</h4>
              <ul>
                <li>Composition API 逻辑组织直观</li>
                <li>适合中小型项目快速迭代</li>
                <li>模板语法学习成本低</li>
                <li>生态完善，第三方插件丰富</li>
              </ul>
            </div>
            <div class="reason-card">
              <div class="reason-icon">
                <svg viewBox="0 0 24 24" width="24" height="24">
                  <path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z" fill="currentColor"/>
                </svg>
              </div>
              <h4>为什么选择 Three.js？</h4>
              <ul>
                <li>原生 WebGL 封装</li>
                <li>无需额外运行时</li>
                <li>3D文件多格式支持完善</li>
              </ul>
            </div>
            <div class="reason-card">
              <div class="reason-icon">
                <svg viewBox="0 0 24 24" width="24" height="24">
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" fill="currentColor"/>
                </svg>
              </div>
              <h4>为什么选择 SQL Server？</h4>
              <ul>
                <li>Windows Server 兼容性更好</li>
                <li>支持 T-SQL 存储过程</li>
                <li>便于复杂查询优化</li>
                <li>Node.js mssql 驱动成熟</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section id="section-features" class="section-content">
      <div class="section-card">
        <div class="section-header">
          <span class="section-number">四</span>
          <h2 class="section-title">核心功能实现</h2>
        </div>

        <div class="core-features">
          <div class="feature-section">
            <h3 class="subsection-title">核心设计亮点</h3>
            <p class="intro-text">可选认证架构实现了无感知的用户体验 — 未登录可浏览，登录后自动显示收藏状态，无需强制跳转登录。多AI模型融合确保系统稳定性。</p>
          </div>

          <div class="feature-section">
            <h3 class="subsection-title">古建筑浏览与收藏</h3>
            <div class="feature-card-grid">
              <div class="feature-item-card">
                <div class="feature-item-icon">
                  <svg viewBox="0 0 24 24" width="24" height="24">
                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" fill="currentColor"/>
                  </svg>
                </div>
                <h4>可选认证中间件</h4>
                <p>未登录用户可正常浏览，登录用户附加收藏状态，实现"浏览公开、收藏需登录"的无感知体验</p>
              </div>
              <div class="feature-item-card">
                <div class="feature-item-icon">
                  <svg viewBox="0 0 24 24" width="24" height="24">
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" fill="currentColor"/>
                  </svg>
                </div>
                <h4>收藏状态查询优化</h4>
                <p>通过 LEFT JOIN 将收藏状态合并到建筑列表查询，一条SQL完成，避免N+1查询问题</p>
              </div>
              <div class="feature-item-card">
                <div class="feature-item-icon">
                  <svg viewBox="0 0 24 24" width="24" height="24">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="currentColor"/>
                  </svg>
                </div>
                <h4>收藏状态实时反馈</h4>
                <p>卡片右上角心形按钮(@click.stop阻止冒泡)，已收藏卡片红色边框高亮，实时状态反馈</p>
              </div>
            </div>
          </div>

          <div class="feature-section">
            <h3 class="subsection-title">AI智能问答系统</h3>
            <div class="feature-card-grid">
              <div class="feature-item-card">
                <div class="feature-item-icon">
                  <svg viewBox="0 0 24 24" width="24" height="24">
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" fill="currentColor"/>
                  </svg>
                </div>
                <h4>多模型统一接入</h4>
                <p>统一抽象层封装讯飞星火(WebSocket)、通义千问(HTTP REST)、DeepSeek三种接入方式</p>
              </div>
              <div class="feature-item-card">
                <div class="feature-item-icon">
                  <svg viewBox="0 0 24 24" width="24" height="24">
                    <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" fill="currentColor"/>
                  </svg>
                </div>
                <h4>讯飞星火 WebSocket鉴权</h4>
                <p>HMAC-SHA256六步鉴权：RFC1123时间戳 → 构建host/date → 拼接签权串 → 签名 → Base64编码</p>
              </div>
              <div class="feature-item-card">
                <div class="feature-item-icon">
                  <svg viewBox="0 0 24 24" width="24" height="24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" fill="currentColor"/>
                  </svg>
                </div>
                <h4>双模式降级机制</h4>
                <p>WebSocket超时自动降级为HTTP REST，wss://用HTTP，wss://用HTTPS，温度参数自动校正</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section id="section-workshop" class="section-content">
      <div class="section-card workshop-section">
        <div class="section-header workshop-header">
          <span class="section-number">五</span>
          <h2 class="section-title">3D建模工坊与知识竞赛</h2>
        </div>
        <div class="workshop-main">
          <div class="workshop-image-container">
            <img src="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=ancient%20Chinese%20traditional%20architecture%20pagoda%20temple%20with%20intricate%20wooden%20details%20and%20beautiful%20landscape&image_size=landscape_16_9" alt="古建筑" class="workshop-image" />
            <div class="workshop-3d-card">
              <h3 class="workshop-3d-title">3D建模工坊</h3>
              <div class="workshop-feature-list">
                <div class="workshop-feature-item">
                  <div class="workshop-feature-icon">
                    <svg viewBox="0 0 24 24" width="20" height="20">
                      <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" fill="currentColor"/>
                    </svg>
                  </div>
                  <div class="workshop-feature-content">
                    <h4>Three.js 渲染管线</h4>
                    <p>WebGLRenderer + PerspectiveCamera + Scene + OrbitControls轨道控制</p>
                  </div>
                </div>
                <div class="workshop-feature-item">
                  <div class="workshop-feature-icon">
                    <svg viewBox="0 0 24 24" width="20" height="20">
                      <path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z" fill="currentColor"/>
                    </svg>
                  </div>
                  <div class="workshop-feature-content">
                    <h4>OBJ模型分块异步解析</h4>
                    <p>6阶段进度条：解析顶点 → 计算包围盒 → 解析面数据 → 三角化 → 批量合并 → 导入编辑器</p>
                  </div>
                </div>
                <div class="workshop-feature-item">
                  <div class="workshop-feature-icon">
                    <svg viewBox="0 0 24 24" width="20" height="20">
                      <path d="M12 2L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z" fill="currentColor"/>
                    </svg>
                  </div>
                  <div class="workshop-feature-content">
                    <h4>坐标系转换处理</h4>
                    <p>Z-up/Y-up坐标转换 x'=x, y'=z, z'=-y，确保模型正确站立</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="knowledge-competition">
          <h3 class="competition-title">知识竞赛与排行榜</h3>
          <div class="competition-grid">
            <div class="competition-card">
              <div class="competition-icon">
                <svg viewBox="0 0 24 24" width="24" height="24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="currentColor"/>
                </svg>
              </div>
              <h4>积分排行榜</h4>
              <p>基于 SQL Server RANK()窗口函数实现高效排名，基于SQL Server排除管理员账户</p>
            </div>
            <div class="competition-card">
              <div class="competition-icon">
                <svg viewBox="0 0 24 24" width="24" height="24">
                  <path d="M12 2L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z" fill="currentColor"/>
                </svg>
              </div>
              <h4>奖牌视觉设计</h4>
              <p>金 #f5c842→#e6a817 / 银 #c0c0c0→#a0a0a0 / 铜 #cd7f32→#b87333 渐变色图标</p>
            </div>
            <div class="competition-card">
              <div class="competition-icon">
                <svg viewBox="0 0 24 24" width="24" height="24">
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" fill="currentColor"/>
                </svg>
              </div>
              <h4>每日签到系统</h4>
              <p>每日签到选择"从题库选择"和"新建题目"两种模式，新建题目可配置是否同步到公共题库</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="section-content">
      <div class="section-card tech-challenge-section">
        <div class="tech-challenge-header">
          <h2 class="section-title">关键技术难点与解决方案</h2>
        </div>
        <div class="tech-challenge-grid">
          <div class="tech-challenge-card">
            <div class="tech-challenge-number">01</div>
            <h3 class="tech-challenge-title">大型OBJ文件解析性能</h3>
            <div class="tech-challenge-content">
              <div class="tech-challenge-item">
                <span class="tech-label">问题:</span>
                <span class="tech-value">文件过大导致浏览器卡死</span>
              </div>
              <div class="tech-challenge-item">
                <span class="tech-label">方案:</span>
              </div>
              <ul class="tech-solution-list">
                <li>分块异步解析：每16384行yield一次，不阻塞UI</li>
                <li>分块异步解析：每16384行yield一次，不阻塞UI</li>
                <li>批量合并：8000三角/组件，从10万降到约26个</li>
                <li>TypedArray优化：Float32Array存储，减少GC</li>
              </ul>
            </div>
          </div>
          <div class="tech-challenge-card">
            <div class="tech-challenge-number">02</div>
            <h3 class="tech-challenge-title">跨源资源共享 (CORS)</h3>
            <div class="tech-challenge-content">
              <div class="tech-challenge-item">
                <span class="tech-label">问题:</span>
                <span class="tech-value">开发环境vite代理在生产环境不可用</span>
              </div>
              <div class="tech-challenge-item">
                <span class="tech-label">方案:</span>
              </div>
              <ul class="tech-solution-list">
                <li>开发环境：Vite server.server.proxy配置代理</li>
                <li>生产环境：Nginx统一代理，同域名部署</li>
                <li>生产环境：Nginx统一代理，同域名部署</li>
                <li>后端cors中间件配置允许的源</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="section-content">
      <div class="section-card innovation-section">
        <div class="innovation-header">
          <div class="innovation-number">05</div>
          <div class="innovation-title-container">
            <span class="innovation-tag">技术创新</span>
            <h2 class="section-title">项目特色、创新与总结</h2>
          </div>
        </div>
        <div class="innovation-grid">
          <div class="innovation-card">
            <div class="innovation-icon">
              <svg viewBox="0 0 24 24" width="48" height="48">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="currentColor"/>
              </svg>
            </div>
            <h3>多AI模型融合</h3>
            <p>统一封装三种不同协议的AI接入方式，支持动态切换与自动降级，确保问答服务的高可用性</p>
          </div>
          <div class="innovation-card">
            <div class="innovation-icon">
              <svg viewBox="0 0 24 24" width="48" height="48">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" fill="currentColor"/>
              </svg>
            </div>
            <h3>3D建模+文化融合</h3>
            <p>将专业级3D建模技术引入文化展示领域，用户可亲手"建造"古建筑，实现文化传承与技术创新的结合</p>
          </div>
          <div class="innovation-card">
            <div class="innovation-icon">
              <svg viewBox="0 0 24 24" width="48" height="48">
                <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 11c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" fill="currentColor"/>
              </svg>
            </div>
            <h3>可选认证架构</h3>
            <p>optionalAuthMiddleware设计实现"浏览公开、操作需登录"的无感知用户体验，降低用户使用门槛</p>
          </div>
        </div>
      </div>
    </section>
    
    <section id="section-er" class="section-content">
      <div class="section-card">
        <div class="section-header">
          <span class="section-number">六</span>
          <h2 class="section-title">数据库E-R图</h2>
        </div>
        <div class="er-image-container">
          <img src="/images/er.png" alt="数据库E-R图" class="er-image">
        </div>
      </div>
    </section>

    <section id="section-architecture-flow" class="section-content">
      <div class="section-card">
        <div class="section-header">
          <span class="section-number">七</span>
          <h2 class="section-title">系统架构流程图</h2>
        </div>

        <div class="mermaid-section">
          <h3 class="subsection-title">1.1 整体架构层次图</h3>
          <MermaidChart :code="mermaidArchitecture" />
        </div>

        <div class="mermaid-section">
          <h3 class="subsection-title">1.2 核心模块交互流程图</h3>
          <MermaidChart :code="mermaidCoreModule" />
        </div>

      </div>
    </section>

    <section id="section-auth" class="section-content">
      <div class="section-card">
        <div class="section-header">
          <span class="section-number">八</span>
          <h2 class="section-title">用户认证流程图</h2>
        </div>

        <div class="mermaid-section">
          <h3 class="subsection-title">2.1 登录认证完整流程</h3>
          <MermaidChart :code="mermaidLoginFlow" />
        </div>

        <div class="mermaid-section">
          <h3 class="subsection-title">2.2 Token验证与刷新流程</h3>
          <MermaidChart :code="mermaidTokenRefresh" />
        </div>

        <div class="mermaid-section">
          <h3 class="subsection-title">2.3 会话管理与安全机制</h3>
          <MermaidChart :code="mermaidSessionSecurity" />
        </div>
      </div>
    </section>

    <section id="section-db-pool" class="section-content">
      <div class="section-card">
        <div class="section-header">
          <span class="section-number">九</span>
          <h2 class="section-title">数据库连接池管理流程图</h2>
        </div>

        <div class="mermaid-section">
          <h3 class="subsection-title">3.1 连接池初始化流程</h3>
          <MermaidChart :code="mermaidPoolInit" />
        </div>

        <div class="mermaid-section">
          <h3 class="subsection-title">3.2 连接池分配与回收流程</h3>
          <MermaidChart :code="mermaidPoolRecycle" />
        </div>
      </div>
    </section>

    <section id="section-ai-manager" class="section-content">
      <div class="section-card">
        <div class="section-header">
          <span class="section-number">十</span>
          <h2 class="section-title">本地AI管理器工作流程图</h2>
        </div>

        <div class="mermaid-section">
          <h3 class="subsection-title">4.1 AI初始化流程</h3>
          <MermaidChart :code="mermaidAIInit" />
        </div>

        <div class="mermaid-section">
          <h3 class="subsection-title">4.2 RAG查询处理流程</h3>
          <MermaidChart :code="mermaidRAGQuery" />
        </div>

        <div class="mermaid-section">
          <h3 class="subsection-title">4.3 冲突检测与偏离分析流程</h3>
          <MermaidChart :code="mermaidConflictDetection" />
        </div>
      </div>
    </section>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import MermaidChart from '@/components/common/MermaidChart.vue';
import Navbar from '@/components/common/CommonNavbar.vue';

const activeSection = ref('');
let lastScrollPosition = 0;
let lastActiveSection = '';

const navItems = [
  { id: 'section-background', number: '一', label: '项目背景'},
  { id: 'section-requirements', number: '二', label: '需求分析'},
  { id: 'section-tech', number: '三', label: '技术栈' },
  { id: 'section-features', number: '四', label: '核心功能'},
  { id: 'section-workshop', number: '五', label: '3D工坊'},
  { id: 'section-er', number: '六', label: '数据库E-R图' },
  { id: 'section-architecture-flow', number: '七', label: '系统架构' },
  { id: 'section-auth', number: '八', label: '用户认证'},
  { id: 'section-db-pool', number: '九', label: '连接池' },
  { id: 'section-ai-manager', number: '十', label: 'AI管理器'},
];

function scrollToSection(id: string) {
  const element = document.getElementById(id);
  if (element) {
    const navbarHeight = 68;
    const offset = element.offsetTop - navbarHeight - 20;
    window.scrollTo({ top: offset, behavior: 'smooth' });
  }
}

function updateActiveSection() {
  const navbarHeight = 68;
  const viewportHeight = window.innerHeight;
  const scrollPosition = window.scrollY + navbarHeight + viewportHeight * 0.35;

  for (let i = navItems.length - 1; i >= 0; i--) {
    const section = document.getElementById(navItems[i].id);
    if (section && section.offsetTop <= scrollPosition) {
      const candidateSection = navItems[i].id;
      const scrollDiff = Math.abs(window.scrollY - lastScrollPosition);
      
      if (scrollDiff > 50 || candidateSection === lastActiveSection) {
        activeSection.value = candidateSection;
        lastActiveSection = candidateSection;
      }
      break;
    }
  }
  lastScrollPosition = window.scrollY;
}

let scrollTimeout: ReturnType<typeof setTimeout>;
function debounceScroll() {
  clearTimeout(scrollTimeout);
  scrollTimeout = setTimeout(updateActiveSection, 150);
}

onMounted(() => {
  window.addEventListener('scroll', debounceScroll);
  updateActiveSection();
});

onUnmounted(() => {
  window.removeEventListener('scroll', debounceScroll);
  clearTimeout(scrollTimeout);
});

const mermaidArchitecture = ref(`
graph TB
    subgraph "前端架构层 Frontend Layer"
        A1[Vue 3 Views 页面组件]
        A2[Vue Components 功能组件]
        A3[Vue Services API服务层]
        A4[Pinia Stores 状态管理]
        A5[Vue Utils 工具函数库]
        A6[Vue Router 路由管理]
        A7[Three.js 3D渲染引擎]
    end
    
    subgraph "通信层 Communication Layer"
        B1[RESTful API HTTP通信]
        B2[WebSocket 实时通信]
        B3[Axios HTTP客户端]
        B4[Socket.io-client WebSocket客户端]
    end
    
    subgraph "后端架构层 Backend Layer"
        C1[Express Server 应用服务器]
        C2[Middleware 中间件链]
        C3[Controllers 控制器层]
        C4[Modules 业务模块层]
        C5[Services 核心服务层]
        C6[ServiceRegistry 服务注册中心]
    end
    
    subgraph "数据层 Data Layer"
        D1[SQL Server 关系数据库集群]
        D2[Redis 分布式缓存]
        D3[文件系统 文件存储]
    end
    
    subgraph "外部服务层 External Services"
        E1[通义千问 AI模型]
        E2[DeepSeek AI模型]
        E3[讯飞星火 AI模型]
    end
    
    A1 --> A2
    A2 --> A3
    A3 --> A4
    A4 --> A5
    A1 --> A6
    A1 --> A7
    
    A3 --> B3
    A3 --> B4
    B3 --> B1
    B4 --> B2
    
    B1 --> C1
    B2 --> C1
    C1 --> C2
    C2 --> C3
    C3 --> C4
    C4 --> C5
    C5 --> C6
    
    C4 --> D1
    C5 --> D2
    C4 --> D3
    
    C5 --> E1
    C5 --> E2
    C5 --> E3
    
    style A1 fill:#42b983
    style A7 fill:#000000
    style C1 fill:#339933
    style D1 fill:#cc2927
    style D2 fill:#d82c20
    style E1 fill:#ff6600
    style E2 fill:#4285f4
    style E3 fill:#00bfff
`);

const mermaidCoreModule = ref(`
graph LR
    subgraph "用户交互流程"
        Start[用户访问] --> Route{路由判断}
        Route -->|公开页面| Public[公开内容展示]
        Route -->|需认证| AuthCheck{认证检查}
        AuthCheck -->|未登录| Login[登录页面]
        AuthCheck -->|已登录| Authorized[授权页面]
        Login --> AuthSuccess{登录成功}
        AuthSuccess -->|Yes| TokenStore[存储Token]
        AuthSuccess -->|No| Error[错误提示]
        TokenStore --> Authorized
    end
    
    subgraph "核心业务模块"
        Authorized --> ModuleChoice{模块选择}
        ModuleChoice -->|3D工坊| Workshop[3D建模工坊]
        ModuleChoice -->|知识竞赛| Quiz[知识竞赛系统]
        ModuleChoice -->|AI助手| Assistant[AI智能助手]
        ModuleChoice -->|社区| Community[社区互动平台]
        ModuleChoice -->|后台管理| Admin[后台管理系统]
        
        Workshop --> WorkshopDB[Media_3D数据库]
        Quiz --> QuizDB[Competition数据库]
        Assistant --> AIModel[外部AI模型]
        Assistant --> KnowledgeDB[Architecture数据库]
        Community --> SocialDB[Social数据库]
        Admin --> AllDB[全部数据库]
    end
    
    subgraph "数据持久化流程"
        WorkshopDB --> DBCache[Redis缓存层]
        QuizDB --> DBCache
        KnowledgeDB --> DBCache
        SocialDB --> DBCache
        AllDB --> DBCache
        
        DBCache --> ConnectionPool[数据库连接池]
        ConnectionPool --> SQLServer[SQL Server集群]
        
        AIModel --> KnowledgeBase[本地知识库]
        KnowledgeBase --> KnowledgeData[knowledgeData.json]
    end
    
    style Start fill:#f9f
    style Authorized fill:#9f9
    style Workshop fill:#ff9
    style Quiz fill:#9ff
    style Assistant fill:#f9f
    style SQLServer fill:#cc2927
    style DBCache fill:#d82c20
`);

const mermaidLoginFlow = ref(`
graph TB
    Start[用户输入登录信息] --> InputValidation{输入验证}
    
    InputValidation -->|验证失败| ValidationError[显示验证错误]
    InputValidation -->|验证成功| RateLimitCheck{限流检查}
    
    RateLimitCheck -->|超过限制| Lockout[账号锁定15分钟]
    RateLimitCheck -->|正常| SendRequest[发送登录请求]
    
    SendRequest --> BackendReceive[后端接收请求]
    BackendReceive --> QueryUser[查询用户数据]
    
    QueryUser --> UserExists{用户是否存在}
    UserExists -->|不存在| LoginFailed[登录失败: 用户不存在]
    UserExists -->|存在| PasswordVerify{密码验证}
    
    PasswordVerify -->|验证失败| IncrementAttempts[增加失败计数]
    IncrementAttempts --> AttemptsCheck{尝试次数检查}
    AttemptsCheck -->|≥5次| AccountLock[账号锁定]
    AttemptsCheck -->|<5次| LoginFailed
    
    PasswordVerify -->|验证成功| GenerateTokens[生成JWT Tokens]
    GenerateTokens --> AccessToken[生成AccessToken<br/>有效期: 24小时]
    GenerateTokens --> RefreshToken[生成RefreshToken<br/>有效期: 7天]
    
    AccessToken --> StoreTokens[存储Token到客户端]
    RefreshToken --> StoreTokens
    
    StoreTokens --> LocalStorage[localStorage存储]
    StoreTokens --> PiniaStore[Pinia状态存储]
    
    LocalStorage --> UpdateUserState[更新用户状态]
    PiniaStore --> UpdateUserState
    
    UpdateUserState --> WebSocketConnect[建立WebSocket连接]
    WebSocketConnect --> LoadUserData[加载用户数据]
    LoadUserData --> Redirect[重定向到目标页面]
    
    style Start fill:#f9f
    style ValidationError fill:#f66
    style Lockout fill:#f66
    style LoginFailed fill:#f66
    style AccountLock fill:#f66
    style GenerateTokens fill:#9f9
    style Redirect fill:#9f9
`);

const mermaidTokenRefresh = ref(`
graph TB
    Request[用户发起API请求] --> TokenExtract[提取AccessToken]
    
    TokenExtract --> TokenExists{Token是否存在}
    TokenExists -->|不存在| Unauthorized[返回401未认证]
    TokenExists -->|存在| BlacklistCheck{黑名单检查}
    
    BlacklistCheck -->|Redis检查| RedisQuery[查询Redis黑名单]
    BlacklistCheck -->|内存检查| MemoryQuery[查询内存黑名单]
    
    RedisQuery --> IsBlacklisted{是否在黑名单}
    MemoryQuery --> IsBlacklisted
    
    IsBlacklisted -->|Yes| TokenInvalid[Token已失效]
    IsBlacklisted -->|No| JWTVerify{JWT验证}
    
    JWTVerify -->|验证失败| TokenInvalid
    JWTVerify -->|验证成功| ExtractUserInfo[提取用户信息<br/>userId, username, role]
    
    ExtractUserInfo --> AttachToRequest[附加到Request对象]
    AttachToRequest --> PermissionCheck{权限检查}
    
    PermissionCheck --> RoleCheck{角色检查}
    RoleCheck -->|admin| AdminAccess[管理员权限]
    RoleCheck -->|user| UserAccess[普通用户权限]
    RoleCheck -->|guest| GuestAccess[访客权限]
    
    AdminAccess --> ProceedRequest[继续处理请求]
    UserAccess --> ProceedRequest
    GuestAccess --> ProceedRequest
    
    TokenInvalid --> RefreshAttempt{尝试刷新Token}
    RefreshAttempt -->|有RefreshToken| RefreshAPI[调用刷新API]
    RefreshAttempt -->|无RefreshToken| RedirectToLogin[重定向登录页]
    
    RefreshAPI --> RefreshVerify{RefreshToken验证}
    RefreshVerify -->|验证成功| NewTokens[生成新Tokens]
    RefreshVerify -->|验证失败| RedirectToLogin
    
    NewTokens --> UpdateTokens[更新客户端Tokens]
    UpdateTokens --> RetryRequest[重试原请求]
    
    style Request fill:#f9f
    style Unauthorized fill:#f66
    style TokenInvalid fill:#f66
    style ProceedRequest fill:#9f9
    style NewTokens fill:#9f9
`);

const mermaidSessionSecurity = ref(`
graph TB
    subgraph "会话生命周期管理"
        SessionStart[会话开始] --> SessionInit[初始化会话状态]
        SessionInit --> ActivityTimer[启动活跃计时器]
        ActivityTimer --> UserActivity{用户活动检测}
        
        UserActivity -->|有活动| ResetTimer[重置计时器]
        UserActivity -->|无活动>30分钟| SessionTimeout[会话超时]
        
        SessionTimeout --> LogoutProcess[登出流程]
        LogoutProcess --> BlacklistAdd[Token加入黑名单]
        BlacklistAdd --> RedisStore[存储到Redis<br/>TTL: 24小时]
        BlacklistAdd --> MemoryStore[存储到内存<br/>定时删除]
        
        RedisStore --> ClearClient[清除客户端数据]
        MemoryStore --> ClearClient
        ClearClient --> RedirectToLogin[重定向登录页]
        
        ResetTimer --> ContinueSession[继续会话]
        ContinueSession --> UserActivity
    end
    
    subgraph "并发会话管理"
        MultiLogin[多设备登录检测] --> DeviceCheck{设备数量检查}
        DeviceCheck -->|≤3设备| AllowMulti[允许多设备]
        DeviceCheck -->|>3设备| ForceLogout[强制最早设备登出]
        
        ForceLogout --> NotifyUser[通知用户]
        NotifyUser --> UpdateDeviceList[更新设备列表]
        UpdateDeviceList --> AllowNewDevice[允许新设备登录]
        
        AllowMulti --> TrackDevice[记录设备信息]
        AllowNewDevice --> TrackDevice
        TrackDevice --> SessionMap[会话映射表<br/>userId → deviceIds]
    end
    
    subgraph "安全保护机制"
        BruteForce[暴力破解防护] --> LoginLimiter[登录限流器]
        LoginLimiter --> AttemptCount[尝试次数计数]
        AttemptCount --> Threshold{达到阈值5次}
        Threshold -->|Yes| AccountLockout[账号锁定15分钟]
        Threshold -->|No| AllowRetry[允许继续尝试]
        
        SQLInjection[SQL注入检测] --> QueryAnalysis[查询分析器]
        QueryAnalysis --> PatternMatch{模式匹配}
        PatternMatch -->|检测到注入| BlockRequest[拒绝请求]
        PatternMatch -->|安全| AllowQuery[允许执行]
        
        CSRFProtection[CSRF防护] --> TokenValidation[Token验证]
        TokenValidation --> HeaderCheck{检查X-CSRF-Token}
        HeaderCheck -->|匹配| AllowRequest[允许请求]
        HeaderCheck -->|不匹配| DenyRequest[拒绝请求]
    end
    
    style SessionStart fill:#f9f
    style SessionTimeout fill:#f66
    style BruteForce fill:#f66
    style SQLInjection fill:#f66
    style CSRFProtection fill:#f66
`);

const mermaidPoolInit = ref(`
graph TB
    AppStart[应用启动] --> LoadConfig[加载数据库配置]
    
    LoadConfig --> ParseEnv[解析环境变量]
    ParseEnv --> BuildConfigs[构建6个数据库配置]
    
    BuildConfigs --> ConfigValidation{配置验证}
    ConfigValidation -->|缺少必要参数| ConfigError[配置错误提示]
    ConfigValidation -->|配置完整| PreconnectAll[预连接所有数据库]
    
    PreconnectAll --> ConnectLoop[遍历数据库列表]
    
    ConnectLoop --> DB1[连接User数据库]
    ConnectLoop --> DB2[连接Architecture数据库]
    ConnectLoop --> DB3[连接Media_3D数据库]
    ConnectLoop --> DB4[连接Competition数据库]
    ConnectLoop --> DB5[连接Activity数据库]
    ConnectLoop --> DB6[连接Social数据库]
    
    DB1 --> RetryLogic{连接重试逻辑}
    DB2 --> RetryLogic
    DB3 --> RetryLogic
    DB4 --> RetryLogic
    DB5 --> RetryLogic
    DB6 --> RetryLogic
    
    RetryLogic --> Attempt1[第1次尝试]
    Attempt1 --> ConnectSuccess1{连接成功}
    ConnectSuccess1 -->|Yes| PoolCache1[缓存连接池]
    ConnectSuccess1 -->|No| Delay1[等待1秒]
    Delay1 --> Attempt2[第2次尝试]
    
    Attempt2 --> ConnectSuccess2{连接成功}
    ConnectSuccess2 -->|Yes| PoolCache2[缓存连接池]
    ConnectSuccess2 -->|No| Delay2[等待2秒]
    Delay2 --> Attempt3[第3次尝试]
    
    Attempt3 --> ConnectSuccess3{连接成功}
    ConnectSuccess3 -->|Yes| PoolCache3[缓存连接池]
    ConnectSuccess3 -->|No| MarkFailed[标记数据库失败]
    
    PoolCache1 --> ResultsCollect[收集连接结果]
    PoolCache2 --> ResultsCollect
    PoolCache3 --> ResultsCollect
    MarkFailed --> ResultsCollect
    
    ResultsCollect --> SuccessCount{统计成功数}
    SuccessCount -->|全部成功| ReadyMode[正常模式运行]
    SuccessCount -->|部分成功| HybridMode[混合模式运行<br/>部分Mock]
    SuccessCount -->|全部失败| MockMode[完全Mock模式]
    
    ReadyMode --> AppReady[应用就绪]
    HybridMode --> AppReady
    MockMode --> AppReady
    
    style AppStart fill:#f9f
    style ConfigError fill:#f66
    style ReadyMode fill:#9f9
    style MockMode fill:#ff9
`);

const mermaidPoolRecycle = ref(`
graph TB
    QueryRequest[查询请求到达] --> GetPool[获取连接池]
    
    GetPool --> PoolExists{连接池是否存在}
    PoolExists -->|不存在| CreatePool[创建新连接池]
    PoolExists -->|存在| PoolConnected{连接池是否已连接}
    
    PoolConnected -->|未连接| ReconnectPool[重新连接]
    PoolConnected -->|已连接| CheckAvailable{检查可用连接}
    
    CreatePool --> PoolConfig[应用连接池配置<br/>max:3, min:0, idle:15s]
    PoolConfig --> EstablishConn[建立数据库连接]
    EstablishConn --> PoolCache[缓存连接池]
    PoolCache --> CheckAvailable
    
    ReconnectPool --> RetryConnect[重试连接逻辑]
    RetryConnect --> ConnectResult{连接结果}
    ConnectResult -->|成功| PoolCache
    ConnectResult -->|失败| UseMock[使用Mock数据]
    
    CheckAvailable --> AvailableConn{可用连接}
    AvailableConn -->|有可用| AcquireConn[获取连接]
    AvailableConn -->|无可用| WaitQueue[加入等待队列]
    
    WaitQueue --> QueueTimeout{等待超时}
    QueueTimeout -->|超时10秒| QueryError[查询超时错误]
    QueueTimeout -->|有连接释放| AcquireConn
    
    AcquireConn --> ExecuteQuery[执行SQL查询]
    ExecuteQuery --> QuerySuccess{查询成功}
    
    QuerySuccess -->|成功| ReturnData[返回查询数据]
    QuerySuccess -->|失败| QueryError
    
    ReturnData --> ReleaseConn[释放连接]
    QueryError --> ReleaseConn
    
    ReleaseConn --> ReturnToPool{归还连接池}
    ReturnToPool -->|连接健康| IdlePool[放入空闲池]
    ReturnToPool -->|连接异常| DestroyConn[销毁连接]
    
    IdlePool --> IdleTimeoutCheck{空闲超时检查}
    IdleTimeoutCheck -->|超过15秒| DestroyConn
    IdleTimeoutCheck -->|未超时| KeepIdle[保持空闲状态]
    
    DestroyConn --> PoolMinCheck{连接数检查}
    PoolMinCheck -->|低于最小值| CreateNewConn[创建新连接]
    PoolMinCheck -->|高于最小值| RemoveFromPool[从池中移除]
    
    KeepIdle --> WaitQueueNotify[通知等待队列]
    CreateNewConn --> PoolCache
    RemoveFromPool --> PoolCache
    WaitQueueNotify --> WaitQueue
    
    UseMock --> ReturnMockData[返回Mock数据]
    
    style QueryRequest fill:#f9f
    style AcquireConn fill:#9f9
    style ExecuteQuery fill:#9ff
    style QueryError fill:#f66
    style ReleaseConn fill:#ff9
`);

const mermaidAIInit = ref(`
graph TB
    UserRequest[用户请求AI功能] --> ManagerCheck{AIManager状态检查}
    
    ManagerCheck -->|已初始化| DirectQuery[直接执行查询]
    ManagerCheck -->|未初始化| InitializeStart[开始初始化]
    
    InitializeStart --> ProgressUI[显示加载进度UI]
    ProgressUI --> Progress1[进度20%: 连接后端服务]
    
    Progress1 --> BackendConnect[POST /assistant/local-ai/initialize]
    BackendConnect --> BackendResponse{后端响应}
    
    BackendResponse -->|成功| Progress2[进度40%: 加载知识库]
    BackendResponse -->|失败| InitError[初始化失败]
    
    Progress2 --> LoadKnowledgeData[加载knowledgeData.json]
    LoadKnowledgeData --> KnowledgeLoadResult{知识库加载结果}
    
    KnowledgeLoadResult -->|成功| Progress3[进度60%: 初始化RAG引擎]
    KnowledgeLoadResult -->|失败| InitError
    
    Progress3 --> InitializeServices[初始化核心服务]
    InitializeServices --> ServiceInit{服务初始化}
    
    ServiceInit --> KnowledgeRetrieverInit[初始化KnowledgeRetriever]
    ServiceInit --> ConflictDetectorInit[初始化ConflictDetector]
    ServiceInit --> KnowledgeGraphServiceInit[初始化KnowledgeGraphService]
    
    KnowledgeRetrieverInit --> Progress4[进度80%: 验证模型状态]
    ConflictDetectorInit --> Progress4
    KnowledgeGraphServiceInit --> Progress4
    
    Progress4 --> ModelValidation[验证AI模型配置]
    ModelValidation --> ValidationResult{验证结果}
    
    ValidationResult -->|成功| Progress5[进度100%: 初始化完成]
    ValidationResult -->|失败| InitError
    
    Progress5 --> UpdateState[更新AIManager状态]
    UpdateState --> ReadyState[状态: Ready]
    
    ReadyState --> DirectQuery
    InitError --> ErrorHandle[错误处理与提示]
    
    style UserRequest fill:#f9f
    style ReadyState fill:#9f9
    style InitError fill:#f66
`);

const mermaidRAGQuery = ref(`
graph TB
    QueryInput[用户输入问题] --> Preprocess[问题预处理]
    
    Preprocess --> ExtractKeywords[提取关键词]
    Preprocess --> IdentifyType[识别问题类型]
    Preprocess --> BuildVector[构建查询向量]
    
    ExtractKeywords --> KeywordList[关键词列表]
    IdentifyType --> QuestionType[问题类型<br/>定义/关系/工艺/历史]
    BuildVector --> QueryVector[查询向量]
    
    KeywordList --> RetrievalStart[开始检索]
    QuestionType --> RetrievalStart
    QueryVector --> RetrievalStart
    
    RetrievalStart --> BM25Search[BM25文本检索]
    RetrievalStart --> VectorSearch[向量相似度检索]
    
    BM25Search --> BM25Results[BM25候选结果<br/>Top-20]
    VectorSearch --> VectorResults[向量候选结果<br/>Top-20]
    
    BM25Results --> HybridMerge[混合结果融合]
    VectorResults --> HybridMerge
    
    HybridMerge --> ScoreCalculation[计算综合得分]
    ScoreCalculation --> TopKSelection[Top-K选择<br/>K=5]
    
    TopKSelection --> CandidateKnowledge[候选知识条目]
    CandidateKnowledge --> GraphEnhance[知识图谱增强]
    
    GraphEnhance --> EntityQuery[实体关系查询]
    EntityQuery --> RelationExpand[关系扩展]
    RelationExpand --> ContextChain[上下文知识链]
    
    ContextChain --> PromptBuild[构建Prompt模板]
    PromptBuild --> SystemRole[系统角色设定]
    PromptBuild --> KnowledgeInjection[知识库上下文注入]
    PromptBuild --> QuestionEmbed[用户问题嵌入]
    
    SystemRole --> CompletePrompt[完整Prompt]
    KnowledgeInjection --> CompletePrompt
    QuestionEmbed --> CompletePrompt
    
    CompletePrompt --> AIModelCall[调用AI模型]
    AIModelCall --> ModelChoice{模型选择}
    
    ModelChoice -->|千问| QwenAPI[通义千问API]
    ModelChoice -->|DeepSeek| DeepSeekAPI[DeepSeek API]
    ModelChoice -->|讯飞| XunfeiAPI[讯飞星火API]
    
    QwenAPI --> AIResponse[AI生成回答]
    DeepSeekAPI --> AIResponse
    XunfeiAPI --> AIResponse
    
    AIResponse --> ConflictDetection[冲突检测]
    ConflictDetection --> CompareKnowledge{对比知识库}
    
    CompareKnowledge --> FactualCheck[事实性检查]
    CompareKnowledge --> LogicalCheck[逻辑矛盾检查]
    
    FactualCheck --> ConflictList1[冲突列表1]
    LogicalCheck --> ConflictList2[冲突列表2]
    
    ConflictList1 --> MergeConflicts[合并冲突]
    ConflictList2 --> MergeConflicts
    
    MergeConflicts --> HasConflict{是否有冲突}
    HasConflict -->|有冲突| GenerateReport[生成冲突报告]
    HasConflict -->|无冲突| CleanResponse[纯净回答]
    
    GenerateReport --> FinalResult[最终结果]
    CleanResponse --> FinalResult
    
    FinalResult --> FormatOutput[格式化输出]
    FormatOutput --> ReturnToFrontend[返回前端]
    
    ReturnToFrontend --> DisplayUI[显示回答UI]
    DisplayUI --> ShowResponse[显示回答文本]
    DisplayUI --> ShowKnowledge[显示引用知识]
    DisplayUI --> ShowMetadata[显示推理元数据]
    DisplayUI --> ShowConflict[显示冲突提示]
    
    style QueryInput fill:#f9f
    style CandidateKnowledge fill:#9ff
    style AIResponse fill:#ff9
    style FinalResult fill:#9f9
`);

const mermaidConflictDetection = ref(`
graph TB
    AIResponse[AI回答文本] --> ConflictDetectionStart[启动冲突检测]
    
    ConflictDetectionStart --> LoadKnowledge[加载相关知识条目]
    LoadKnowledge --> KnowledgeMatch[知识匹配]
    
    KnowledgeMatch --> EntityExtraction[实体提取]
    KnowledgeMatch --> RelationExtraction[关系提取]
    KnowledgeMatch --> FactExtraction[事实提取]
    
    EntityExtraction --> EntityList[实体列表]
    RelationExtraction --> RelationList[关系列表]
    FactExtraction --> FactList[事实列表]
    
    EntityList --> ComparePhase[对比分析阶段]
    RelationList --> ComparePhase
    FactList --> ComparePhase
    
    ComparePhase --> EntityCompare{实体对比}
    ComparePhase --> RelationCompare{关系对比}
    ComparePhase --> FactCompare{事实对比}
    
    EntityCompare --> EntityMismatch[实体不一致]
    RelationCompare --> RelationMismatch[关系不一致]
    FactCompare --> FactMismatch[事实不一致]
    
    EntityMismatch --> ConflictType1[冲突类型: 实体错误]
    RelationMismatch --> ConflictType2[冲突类型: 关系错误]
    FactMismatch --> ConflictType3[冲突类型: 事实错误]
    
    ConflictType1 --> SeverityAssess1[严重性评估]
    ConflictType2 --> SeverityAssess2[严重性评估]
    ConflictType3 --> SeverityAssess3[严重性评估]
    
    SeverityAssess1 --> SeverityLevel1[严重级别: High/Medium/Low]
    SeverityAssess2 --> SeverityLevel2[严重级别: High/Medium/Low]
    SeverityAssess3 --> SeverityLevel3[严重级别: High/Medium/Low]
    
    SeverityLevel1 --> ConflictCollect[冲突收集]
    SeverityLevel2 --> ConflictCollect
    SeverityLevel3 --> ConflictCollect
    
    ConflictCollect --> GenerateConflictReport[生成冲突报告]
    
    GenerateConflictReport --> ReportStructure[报告结构构建]
    ReportStructure --> SummarySection[摘要部分]
    ReportStructure --> DetailsSection[详细部分]
    ReportStructure --> RecommendationSection[建议部分]
    
    SummarySection --> ConflictCount[冲突数量统计]
    SummarySection --> SeverityDistribution[严重性分布]
    
    DetailsSection --> ConflictDescription[冲突描述]
    DetailsSection --> KnowledgeReference[知识参考]
    DetailsSection --> AnalysisReason[分析原因]
    DetailsSection --> CorrectionSuggestion[修正建议]
    
    RecommendationSection --> ActionSuggest[行动建议]
    RecommendationSection --> KnowledgeUpdate[知识库更新建议]
    
    ConflictCount --> FinalReport[完整报告]
    SeverityDistribution --> FinalReport
    ConflictDescription --> FinalReport
    KnowledgeReference --> FinalReport
    AnalysisReason --> FinalReport
    CorrectionSuggestion --> FinalReport
    ActionSuggest --> FinalReport
    KnowledgeUpdate --> FinalReport
    
    FinalReport --> DeviationAnalysis[偏离分析启动]
    
    DeviationAnalysis --> CoverageCalc[知识覆盖率计算]
    DeviationAnalysis --> QualityAssess[回答质量评估]
    
    CoverageCalc --> CoverageScore[覆盖率得分<br/>0-100%]
    QualityAssess --> QualityScore[质量得分<br/>A/B/C/D等级]
    
    CoverageScore --> FinalAnalysis[最终分析结果]
    QualityScore --> FinalAnalysis
    
    FinalAnalysis --> ReturnResult[返回检测结果]
    ReturnResult --> DisplayToFrontend[前端显示]
    
    DisplayToFrontend --> ShowConflictReport[显示冲突报告]
    DisplayToFrontend --> ShowCoverage[显示覆盖率]
    DisplayToFrontend --> ShowQuality[显示质量评级]
    DisplayToFrontend --> ShowRecommendation[显示修正建议]
    
    style AIResponse fill:#f9f
    style ConflictDetectionStart fill:#ff9
    style FinalReport fill:#9ff
    style FinalAnalysis fill:#9f9
`);
</script>

<style scoped>
.overview-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #1A1714 0%, #24201C 100%);
  padding-top: 68px;
}

.section-hero {
  position: relative;
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: linear-gradient(135deg, #1A1714 0%, #2C241E 50%, #1A1714 100%);
}

.section-hero::before {
  content: '';
  position: absolute;
  inset: 0;
  background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cpath d='M50 10 L60 30 L80 35 L65 50 L70 70 L50 60 L30 70 L35 50 L20 35 L40 30 Z' fill='none' stroke='rgba(201,169,110,0.05)' stroke-width='0.5'/%3E%3C/svg%3E");
  background-size: 200px 200px;
}

.hero-content {
  position: relative;
  z-index: 1;
  text-align: center;
}

.hero-title {
  font-family: 'Noto Serif SC','STSong',serif;
  font-size: 3.5rem;
  font-weight: 700;
  color: var(--gold);
  letter-spacing: 0.3em;
  margin: 0;
}

.hero-subtitle {
  font-size: 1.125rem;
  color: var(--text-muted);
  margin: 12px 0 24px;
  letter-spacing: 0.1em;
}

.hero-badge {
  display: inline-block;
  padding: 8px 24px;
  background: rgba(201, 169, 110, 0.15);
  border: 1px solid rgba(201, 169, 110, 0.3);
  border-radius: var(--r-full);
  color: var(--gold);
  font-size: 0.875rem;
  font-weight: 500;
  letter-spacing: 0.1em;
}

.section-content {
  padding: 60px 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.section-card {
  background: rgba(36, 32, 28, 0.8);
  border: 1px solid rgba(201, 169, 110, 0.1);
  border-radius: var(--r-lg);
  padding: 48px;
  margin-bottom: 40px;
  backdrop-filter: blur(12px);
}

.section-header {
  display: flex;
  align-items: baseline;
  gap: 16px;
  margin-bottom: 32px;
}

.section-number {
  font-size: 2.5rem;
  font-weight: 700;
  color: rgba(201, 169, 110, 0.3);
  font-family: 'Noto Serif SC','STSong',serif;
}

.section-title {
  font-size: 1.75rem;
  font-weight: 600;
  color: var(--gold);
  font-family: 'Noto Serif SC','STSong',serif;
  margin: 0;
}

.subsection-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #C9A96E;
  font-family: 'Noto Serif SC','STSong',serif;
  margin: 0 0 16px;
}

.intro-text {
  font-size: 0.9375rem;
  color: var(--text-muted);
  line-height: 1.8;
  margin: 0 0 24px;
}

.two-column {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 40px;
}

.feature-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.feature-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: var(--r-md);
  padding: 20px;
  transition: all var(--t);
}

.feature-card:hover {
  background: rgba(201, 169, 110, 0.05);
  border-color: rgba(201, 169, 110, 0.15);
}

.feature-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(201, 169, 110, 0.1);
  border-radius: var(--r-sm);
  color: var(--gold);
  margin-bottom: 12px;
}

.feature-title {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--text);
  margin: 0 0 6px;
}

.feature-desc {
  font-size: 0.8125rem;
  color: var(--text-muted);
  margin: 0;
  line-height: 1.6;
}

.significance-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.significance-item {
  display: flex;
  gap: 16px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: var(--r-md);
}

.significance-icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(201, 169, 110, 0.1);
  border-radius: var(--r-sm);
  color: var(--gold);
  flex-shrink: 0;
}

.significance-content h4 {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--text);
  margin: 0 0 4px;
}

.significance-content p {
  font-size: 0.8125rem;
  color: var(--text-muted);
  margin: 0;
  line-height: 1.6;
}

.tech-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-bottom: 32px;
}

.tech-table-card {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.04);
  border-radius: var(--r-md);
  overflow: hidden;
}

.tech-table-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--gold);
  padding: 16px;
  margin: 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  background: rgba(201, 169, 110, 0.05);
}

.tech-table {
  width: 100%;
  border-collapse: collapse;
}

.tech-table th,
.tech-table td {
  padding: 12px 16px;
  text-align: left;
  font-size: 0.8125rem;
}

.tech-table th {
  color: var(--gold);
  font-weight: 600;
  background: rgba(201, 169, 110, 0.03);
}

.tech-table td {
  color: var(--text-muted);
  border-bottom: 1px solid rgba(255, 255, 255, 0.03);
}

.tech-table tr:last-child td {
  border-bottom: none;
}

.selection-reasons {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.04);
  border-radius: var(--r-md);
  padding: 24px;
}

.reason-card {
  display: flex;
  gap: 16px;
  padding: 16px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.03);
}

.reason-card:last-child {
  border-bottom: none;
}

.reason-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(201, 169, 110, 0.1);
  border-radius: var(--r-sm);
  color: var(--gold);
  flex-shrink: 0;
}

.reason-card h4 {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--text);
  margin: 0 0 8px;
}

.reason-card ul {
  margin: 0;
  padding-left: 20px;
}

.reason-card li {
  font-size: 0.8125rem;
  color: var(--text-muted);
  line-height: 1.8;
}

.core-features {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.feature-section {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.04);
  border-radius: var(--r-md);
  padding: 24px;
}

.feature-card-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 16px;
  margin-top: 16px;
}

.feature-item-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: var(--r-md);
  padding: 20px;
}

.feature-item-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(201, 169, 110, 0.1);
  border-radius: var(--r-sm);
  color: var(--gold);
  margin-bottom: 12px;
}

.feature-item-card h4 {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--text);
  margin: 0 0 8px;
}

.feature-item-card p {
  font-size: 0.8125rem;
  color: var(--text-muted);
  margin: 0;
  line-height: 1.6;
}

.requirement-table {
  width: 100%;
  border-collapse: collapse;
}

.requirement-table th {
  background: #8B2635;
  color: #fff;
  padding: 12px 16px;
  font-size: 0.875rem;
  font-weight: 600;
  text-align: left;
}

.requirement-table td {
  padding: 12px 16px;
  font-size: 0.8125rem;
  color: var(--text-muted);
  border-bottom: 1px solid rgba(255, 255, 255, 0.03);
}

.requirement-table tr:nth-child(even) td {
  background: rgba(139, 38, 53, 0.05);
}

.requirement-table tr:nth-child(odd) td {
  background: rgba(139, 38, 53, 0.1);
}

.non-functional-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.non-functional-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: var(--r-md);
  padding: 20px;
}

.non-functional-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(201, 169, 110, 0.1);
  border-radius: var(--r-sm);
  color: var(--gold);
  margin-bottom: 12px;
}

.non-functional-card h4 {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--text);
  margin: 0 0 6px;
}

.non-functional-card p {
  font-size: 0.8125rem;
  color: var(--text-muted);
  margin: 0;
}

.architecture-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  margin-bottom: 32px;
}

.layer-card {
  width: 100%;
  border-radius: var(--r-md);
  overflow: hidden;
}

.layer-header {
  padding: 12px 20px;
  font-size: 1rem;
  font-weight: 600;
  color: #fff;
  margin: 0;
}

.frontend-layer {
  background: #8B2635;
}

.frontend-layer .layer-header {
  background: #6B1D29;
}

.backend-layer {
  background: #C9A96E;
}

.backend-layer .layer-header {
  background: #A88B4A;
  color: #1A1714;
}

.data-layer {
  background: #4A4A4A;
}

.data-layer .layer-header {
  background: #3A3A3A;
}

.layer-modules {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 16px 20px;
}

.module-item {
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: var(--r-sm);
  font-size: 0.8125rem;
  color: #fff;
}

.backend-layer .module-item {
  color: #1A1714;
  background: rgba(26, 23, 20, 0.15);
}

.arrow-container {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  justify-content: center;
}

.arrow-line {
  flex: 1;
  height: 2px;
  background: rgba(201, 169, 110, 0.3);
}

.arrow-label {
  font-size: 0.75rem;
  color: var(--gold);
  white-space: nowrap;
  padding: 4px 12px;
  background: rgba(201, 169, 110, 0.15);
  border-radius: var(--r-sm);
}

.arrow-head {
  width: 0;
  height: 0;
  border-left: 8px solid rgba(201, 169, 110, 0.5);
  border-top: 6px solid transparent;
  border-bottom: 6px solid transparent;
}

.route-division {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.04);
  border-radius: var(--r-md);
  padding: 24px;
}

.route-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 16px;
}

.route-table th {
  background: #8B2635;
  color: #fff;
  padding: 12px 16px;
  font-size: 0.875rem;
  font-weight: 600;
  text-align: left;
}

.route-table td {
  padding: 12px 16px;
  font-size: 0.8125rem;
  color: var(--text-muted);
  border-bottom: 1px solid rgba(255, 255, 255, 0.03);
}

.route-table tr:nth-child(even) td {
  background: rgba(139, 38, 53, 0.05);
}

.route-table tr:nth-child(odd) td {
  background: rgba(139, 38, 53, 0.1);
}

.workshop-section {
  background: transparent;
  border: none;
  padding: 0;
}

.workshop-main {
  background: rgba(36, 32, 28, 0.8);
  border: 1px solid rgba(201, 169, 110, 0.1);
  border-radius: var(--r-lg);
  padding: 0;
  overflow: hidden;
}

.workshop-image-container {
  position: relative;
  height: 300px;
}

.workshop-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.workshop-3d-card {
  position: absolute;
  bottom: 24px;
  left: 24px;
  background: rgba(26, 23, 20, 0.95);
  border: 1px solid rgba(201, 169, 110, 0.2);
  border-radius: var(--r-md);
  padding: 20px;
  max-width: 400px;
  backdrop-filter: blur(8px);
}

.workshop-3d-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--gold);
  margin: 0 0 16px;
  font-family: 'Noto Serif SC','STSong',serif;
}

.workshop-feature-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.workshop-feature-item {
  display: flex;
  gap: 12px;
}

.workshop-feature-icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(201, 169, 110, 0.15);
  border-radius: var(--r-sm);
  color: var(--gold);
  flex-shrink: 0;
}

.workshop-feature-content h4 {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text);
  margin: 0 0 4px;
}

.workshop-feature-content p {
  font-size: 0.75rem;
  color: var(--text-muted);
  margin: 0;
  line-height: 1.6;
}

.knowledge-competition {
  margin-top: 24px;
  background: rgba(36, 32, 28, 0.8);
  border: 1px solid rgba(201, 169, 110, 0.1);
  border-radius: var(--r-lg);
  padding: 32px;
}

.competition-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--gold);
  margin: 0 0 24px;
  font-family: 'Noto Serif SC','STSong',serif;
}

.competition-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 16px;
}

.competition-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: var(--r-md);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.competition-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(201, 169, 110, 0.15);
  border-radius: var(--r-sm);
  color: #f5c842;
}

.competition-card h4 {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--text);
  margin: 0;
}

.competition-card p {
  font-size: 0.8125rem;
  color: var(--text-muted);
  margin: 0;
  line-height: 1.6;
}

.tech-challenge-section {
  background: rgba(36, 32, 28, 0.8);
  border: 1px solid rgba(201, 169, 110, 0.1);
  border-radius: var(--r-lg);
}

.tech-challenge-header {
  margin-bottom: 32px;
}

.tech-challenge-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.tech-challenge-card {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.04);
  border-radius: var(--r-md);
  padding: 24px;
}

.tech-challenge-number {
  font-size: 2rem;
  font-weight: 700;
  color: rgba(201, 169, 110, 0.3);
  font-family: 'Noto Serif SC','STSong',serif;
  margin-bottom: 12px;
}

.tech-challenge-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text);
  margin: 0 0 16px;
}

.tech-challenge-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tech-challenge-item {
  display: flex;
  gap: 8px;
}

.tech-label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--gold);
}

.tech-value {
  font-size: 0.8125rem;
  color: var(--text-muted);
}

.tech-solution-list {
  margin: 8px 0 0;
  padding-left: 20px;
}

.tech-solution-list li {
  font-size: 0.8125rem;
  color: var(--text-muted);
  line-height: 1.8;
}

.innovation-section {
  background: rgba(36, 32, 28, 0.8);
  border: 1px solid rgba(201, 169, 110, 0.1);
  border-radius: var(--r-lg);
}

.innovation-header {
  display: flex;
  align-items: baseline;
  gap: 16px;
  margin-bottom: 32px;
}

.innovation-number {
  font-size: 3rem;
  font-weight: 700;
  color: rgba(201, 169, 110, 0.2);
  font-family: 'Noto Serif SC','STSong',serif;
}

.innovation-title-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.innovation-tag {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--gold);
  letter-spacing: 0.1em;
}

.innovation-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 24px;
}

.innovation-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: var(--r-md);
  padding: 28px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 16px;
}

.innovation-icon {
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(139, 38, 53, 0.3);
  border-radius: var(--r-md);
  color: #C9A96E;
}

.innovation-card h3 {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text);
  margin: 0;
}

.innovation-card p {
  font-size: 0.8125rem;
  color: var(--text-muted);
  margin: 0;
  line-height: 1.6;
}

.mermaid-section {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.04);
  border-radius: var(--r-md);
  padding: 24px;
  margin-bottom: 24px;
}

.mermaid-section:last-child {
  margin-bottom: 0;
}

.er-image-container {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 24px;
  background: rgba(255, 255, 255, 0.02);
  border-radius: var(--r-md);
  overflow-x: auto;
}

.er-image {
  max-width: 100%;
  height: auto;
  border-radius: var(--r-sm);
}

.overview-container {
  display: flex;
  gap: 24px;
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 24px;
}

.sidebar-nav {
  position: sticky;
  top: 92px;
  flex-shrink: 0;
  width: 200px;
  height: calc(100vh - 92px);
  overflow-y: auto;
}

.sidebar-menu {
  background: rgba(36, 32, 28, 0.8);
  border: 1px solid rgba(201, 169, 110, 0.1);
  border-radius: var(--r-lg);
  padding: 16px 0;
}

.menu-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  color: var(--text-muted);
  text-decoration: none;
  font-size: 0.8125rem;
  transition: all 0.2s ease;
  border-left: 3px solid transparent;
}

.menu-item:hover {
  background: rgba(201, 169, 110, 0.08);
  color: var(--text);
}

.menu-item.active {
  background: rgba(201, 169, 110, 0.12);
  color: var(--gold);
  border-left-color: var(--gold);
}

.menu-icon {
  font-size: 1rem;
}

.menu-number {
  font-size: 0.75rem;
  font-weight: 600;
  color: rgba(201, 169, 110, 0.6);
  min-width: 24px;
}

.menu-item.active .menu-number {
  color: var(--gold);
}

.menu-label {
  flex: 1;
}

.overview-content {
  flex: 1;
  min-width: 0;
}

.section-icon {
  font-size: 1.25rem;
  margin-right: 12px;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid rgba(201, 169, 110, 0.15);
}

.section-number {
  font-size: 2rem;
  font-weight: 700;
  color: var(--gold);
  font-family: 'Noto Serif SC','STSong',serif;
  min-width: 40px;
}

.section-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text);
  margin: 0;
  font-family: 'Noto Serif SC','STSong',serif;
}

.section-content {
  margin-bottom: 32px;
}

.workshop-header {
  background: transparent;
  border: none;
  padding-bottom: 0;
  margin-bottom: 20px;
}

@media screen and (max-width: 1024px) {
  .sidebar-nav {
    display: none;
  }
  
  .overview-container {
    padding: 0 16px;
  }
}

@media screen and (max-width: 768px) {
  .two-column {
    grid-template-columns: 1fr;
    gap: 24px;
  }

  .feature-grid {
    grid-template-columns: 1fr;
  }

  .tech-grid {
    grid-template-columns: 1fr;
  }

  .feature-card-grid {
    grid-template-columns: 1fr;
  }

  .non-functional-grid {
    grid-template-columns: 1fr;
  }

  .section-card {
    padding: 24px;
  }

  .hero-title {
    font-size: 2rem;
  }

  .hero-subtitle {
    font-size: 0.9375rem;
  }

  .section-hero {
    height: 200px;
  }

  .workshop-image-container {
    height: 200px;
  }

  .workshop-3d-card {
    position: static;
    max-width: 100%;
    margin: -20px 16px 16px;
    position: relative;
  }

  .competition-grid {
    grid-template-columns: 1fr;
  }

  .tech-challenge-grid {
    grid-template-columns: 1fr;
  }

  .innovation-grid {
    grid-template-columns: 1fr;
  }

  .innovation-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .innovation-number {
    font-size: 2rem;
  }
}
</style>