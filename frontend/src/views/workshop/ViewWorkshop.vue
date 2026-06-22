<template>
  <div class="page" :class="{ 'fullscreen-mode': isFullscreen }">
    <Navbar v-show="!isFullscreen" />
    <div class="workshop-layout" :class="{ 'fullscreen-layout': isFullscreen }">
      <!-- 左侧边栏：构件库 + 构件树 -->
      <aside class="panel panel-left" v-show="leftPanelVisible || !isFullscreen" :class="{ 'panel-hidden': !leftPanelVisible && isFullscreen }">
        <!-- 构件库 -->
        <div class="panel-section">
          <div class="panel-header" @click="libCollapsed = !libCollapsed">
            <svg viewBox="0 0 24 24" width="14" height="14"><path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
            <h3>{{ $t('workshop.components') }}</h3>
            <span class="collapse-arrow" :class="{ collapsed: libCollapsed }">&#9662;</span>
          </div>
          <div v-show="!libCollapsed" class="panel-body">
            <!-- 搜索 -->
            <div class="search-box">
              <input v-model="searchQuery" :placeholder="$t('workshop.searchComponent')" class="search-input inp" />
            </div>
            <!-- 快速构建 -->
            <div class="quick-build-section">
              <div class="section-label">{{ $t('workshop.quickBuild') }}</div>
              <div class="quick-build-grid">
                <button v-for="qb in quickBuilds" :key="qb.id" class="quick-btn" @click="quickBuild(qb.id)" :title="qb.name">
                  <span class="qb-icon">{{ qb.icon }}</span>
                  <span class="qb-name">{{ qb.name }}</span>
                </button>
              </div>
            </div>
            <div class="divider"></div>
            <!-- 分类标签 -->
            <div class="category-tabs">
              <button v-for="cat in categories" :key="cat.id" class="cat-tab" :class="{ active: activeCategory === cat.id }" @click="activeCategory = cat.id">{{ cat.name }}</button>
            </div>
            <!-- 构件列表 -->
            <div class="component-list">
              <div v-for="comp in filteredComponents" :key="comp.type" class="component-item" :class="{ selected: selectedDef?.type === comp.type }" @click="selectAndAdd(comp)" draggable="true" @dragstart="onDragStart($event, comp)">
                <span class="comp-dot" :style="{ backgroundColor: '#' + comp.material.color.toString(16).padStart(6, '0') }"></span>
                <div class="comp-info">
                  <span class="comp-name">{{ comp.name }}</span>
                  <span class="comp-desc">{{ comp.description }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 构件树 -->
        <div class="panel-section">
          <div class="panel-header" @click="treeCollapsed = !treeCollapsed">
            <svg viewBox="0 0 24 24" width="14" height="14"><path d="M12 3v18M3 12h18" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
            <h3>{{ $t('workshop.sceneTree') }}</h3>
            <span class="collapse-arrow" :class="{ collapsed: treeCollapsed }">&#9662;</span>
          </div>
          <div v-show="!treeCollapsed" class="panel-body tree-body">
            <div v-if="allComponents.length === 0" class="empty-tree">{{ $t('workshop.emptyScene') }}</div>
            <div v-for="comp in allComponents" :key="comp.uuid" class="tree-item" :class="{ selected: selectedUuids.includes(comp.uuid), hidden: !comp.visible, locked: comp.locked }" @click="selectByUuid(comp.uuid, $event)">
              <button class="tree-btn" @click.stop="toggleVisible(comp.uuid)" :title="comp.visible ? '隐藏' : '显示'">
                <svg v-if="comp.visible" viewBox="0 0 24 24" width="12" height="12"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" fill="none" stroke-width="1.5"/><circle cx="12" cy="12" r="3" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
                <svg v-else viewBox="0 0 24 24" width="12" height="12"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" stroke="currentColor" fill="none" stroke-width="1.5"/><line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" stroke-width="1.5"/></svg>
              </button>
              <button class="tree-btn" @click.stop="toggleLocked(comp.uuid)" :title="comp.locked ? '解锁' : '锁定'">
                <svg v-if="comp.locked" viewBox="0 0 24 24" width="12" height="12"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="currentColor" fill="none" stroke-width="1.5"/><path d="M7 11V7a5 5 0 0110 0v4" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
                <svg v-else viewBox="0 0 24 24" width="12" height="12"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="currentColor" fill="none" stroke-width="1.5"/><path d="M7 11V7a5 5 0 019.9-1" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
              </button>
              <span class="tree-name" :title="comp.name">{{ comp.name }}</span>
            </div>
          </div>
        </div>

        <!-- 我的模型（从数据库加载，与个人信息页一致） -->
        <div class="panel-section">
          <div class="panel-header" @click="showMyModels = !showMyModels">
            <svg viewBox="0 0 24 24" width="14" height="14"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
            <h3>我的模型</h3>
            <span style="margin-left:auto;font-size:0.7rem;color:var(--text-muted)">{{ myModels.length }}</span>
            <span class="collapse-arrow" :class="{ collapsed: !showMyModels }">&#9662;</span>
          </div>
          <div v-show="showMyModels" class="panel-body tree-body">
            <div v-if="myModelsLoading" class="empty-tree">加载中...</div>
            <div v-else-if="!myModels.length" class="empty-tree">
              暂无保存的模型<br><span style="font-size:0.65rem;color:#888">保存后将在此显示</span>
            </div>
            <div v-for="m in myModels" :key="m.model_id" class="tree-item" style="cursor:pointer" @click="loadModelFromId(String(m.model_id))" :title="m.model_name">
              <span style="font-size:0.8rem;margin-right:4px">🧊</span>
              <span style="flex:1;overflow:hidden;text-overflow:ellipsis;font-size:0.8rem">{{ m.model_name }}</span>
              <span v-if="m.created_at" style="font-size:0.6rem;color:#888">{{ new Date(m.created_at).toLocaleDateString() }}</span>
            </div>
          </div>
        </div>
      </aside>

      <!-- 中央3D画布 -->
      <main class="canvas-area atca-canvas">
        <!-- 搭建模式切换条 -->
        <div class="build-mode-bar atca-mode-bar" v-if="!isSimpleMode">
          <div class="mode-tabs">
            <button class="mode-tab" :class="{ active: buildMode === 'free' }" @click="switchMode('free')">
              <svg viewBox="0 0 24 24" width="14" height="14"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
              自由创建
            </button>
            <button class="mode-tab" :class="{ active: buildMode === 'real' }" @click="switchMode('real')">
              <svg viewBox="0 0 24 24" width="14" height="14"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
              真实搭建
            </button>
          </div>
          <button class="help-btn" @click="showGuide = true" title="使用指南">
            <svg viewBox="0 0 24 24" width="14" height="14"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM9.09 9a3 3 0 015.83 1c0 2-3 3-3 3m.08 4h.01" stroke="currentColor" fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
            帮助
          </button>
        </div>
        <!-- 顶部工具栏 -->
        <div class="toolbar atca-toolbar">
          <div class="toolbar-group">
            <button class="tool-btn" :class="{ active: transformMode === 'select' }" @click="setTransformMode('select')" title="选择 (Q)">
              <svg viewBox="0 0 24 24" width="16" height="16"><path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" stroke="currentColor" fill="none" stroke-width="1.5" stroke-linejoin="round"/></svg>
            </button>
            <button class="tool-btn" :class="{ active: transformMode === 'translate' }" @click="setTransformMode('translate')" title="移动 (T)">
              <svg viewBox="0 0 24 24" width="16" height="16"><path d="M5 9l-3 3 3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3M12 2v20M2 12h20" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
            </button>
            <button class="tool-btn" :class="{ active: transformMode === 'rotate' }" @click="setTransformMode('rotate')" title="旋转 (R)">
              <svg viewBox="0 0 24 24" width="16" height="16"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0118.8-4.3M22 12.5a10 10 0 01-18.8 4.2" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
            </button>
            <button class="tool-btn" :class="{ active: transformMode === 'scale' }" @click="setTransformMode('scale')" title="缩放 (S)">
              <svg viewBox="0 0 24 24" width="16" height="16"><path d="M21 3l-6.5 6.5M21 3v7M21 3h-7M3 21l6.5-6.5M3 21v-7M3 21h7" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
            </button>
          </div>
          <div class="toolbar-divider"></div>
          <div class="toolbar-group">
            <button class="tool-btn" :class="{ active: isMeasureMode }" @click="toggleMeasure" title="测量 (M)">
              <svg viewBox="0 0 24 24" width="16" height="16"><path d="M2 12h20M7 12v-3M12 12v-5M17 12v-2" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
            </button>
            <button class="tool-btn" :class="{ active: wireframeMode }" @click="toggleWireframe" title="线框">
              <svg viewBox="0 0 24 24" width="16" height="16"><rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" fill="none" stroke-width="1.5"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18" stroke="currentColor" fill="none" stroke-width="1"/></svg>
            </button>
            <button class="tool-btn" :class="{ active: snapEnabled }" @click="snapEnabled = !snapEnabled" title="智能吸附">
              <svg viewBox="0 0 24 24" width="16" height="16"><circle cx="12" cy="12" r="3" stroke="currentColor" fill="none" stroke-width="1.5"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
            </button>
          </div>
          <div class="toolbar-divider"></div>
          <div class="toolbar-group">
            <button class="tool-btn" @click="undo" title="撤销 (Ctrl+Z)">
              <svg viewBox="0 0 24 24" width="16" height="16"><path d="M3 7v6h6" stroke="currentColor" fill="none" stroke-width="1.5" stroke-linejoin="round"/><path d="M21 17a9 9 0 00-9-9 9 9 0 00-6 2.3L3 13" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
            </button>
            <button class="tool-btn" @click="redo" title="重做 (Ctrl+Y)">
              <svg viewBox="0 0 24 24" width="16" height="16"><path d="M21 7v6h-6" stroke="currentColor" fill="none" stroke-width="1.5" stroke-linejoin="round"/><path d="M3 17a9 9 0 019-9 9 9 0 016 2.3L21 13" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
            </button>
            <button class="tool-btn" @click="cloneSelected" title="克隆 (Ctrl+D)">
              <svg viewBox="0 0 24 24" width="16" height="16"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" stroke="currentColor" fill="none" stroke-width="1.5"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
            </button>
            <button class="tool-btn" @click="deleteSelected" title="删除 (Del)">
              <svg viewBox="0 0 24 24" width="16" height="16"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
            </button>
            <button class="tool-btn" @click="clearScene" title="清空">
              <svg viewBox="0 0 24 24" width="16" height="16"><path d="M1 4h22M8 4V2a1 1 0 011-1h6a1 1 0 011 1v2" stroke="currentColor" fill="none" stroke-width="1.5"/><path d="M5 4v16a2 2 0 002 2h10a2 2 0 002-2V4" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
            </button>
          </div>
          <div class="toolbar-divider"></div>
          <div class="toolbar-group">
            <button class="tool-btn" :class="{ active: activeView === 'perspective' }" @click="setCamera('perspective')">{{ $t('workshop.perspective') }}</button>
            <button class="tool-btn" :class="{ active: activeView === 'top' }" @click="setCamera('top')">{{ $t('workshop.topView') }}</button>
            <button class="tool-btn" :class="{ active: activeView === 'front' }" @click="setCamera('front')">{{ $t('workshop.frontView') }}</button>
            <button class="tool-btn" @click="focusSelected" title="聚焦选中 (F)">&#9673;</button>
          </div>
          <div class="toolbar-divider"></div>
          <div class="toolbar-group">
            <button class="tool-btn" :class="{ active: isSnapMode }" @click="triggerSnap" title="榫卯吸附 (N)">
              <svg viewBox="0 0 24 24" width="16" height="16"><circle cx="12" cy="12" r="3" stroke="currentColor" fill="none" stroke-width="1.5"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" stroke="currentColor" fill="none" stroke-width="1.5"/><path d="M12 8l4 4-4 4-4-4z" stroke="var(--gold)" fill="var(--gold)" opacity="0.3"/></svg>
            </button>
          </div>
          <div class="toolbar-divider"></div>
          <!-- 对齐工具 -->
          <div class="toolbar-group">
            <div class="tool-dropdown">
              <button class="tool-btn" title="对齐工具">
                <svg viewBox="0 0 24 24" width="16" height="16"><path d="M12 2H4v2h8V2zm0 18H4v2h8v-2zm0-10H2v2h10v-2zm0 6H2v2h10v-2zm10-8h-8v2h8V6zm0 6h-8v2h8v-2zm0 6h-8v2h8v-2z" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
              </button>
              <div class="tool-menu">
                <button class="tool-item" @click="alignSelected('left')">
                  <svg viewBox="0 0 24 24" width="14" height="14"><path d="M3 12h18M6 6v12" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
                  <span>左对齐</span>
                </button>
                <button class="tool-item" @click="alignSelected('center')">
                  <svg viewBox="0 0 24 24" width="14" height="14"><path d="M3 12h18M12 6v12" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
                  <span>水平居中</span>
                </button>
                <button class="tool-item" @click="alignSelected('right')">
                  <svg viewBox="0 0 24 24" width="14" height="14"><path d="M3 12h18M18 6v12" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
                  <span>右对齐</span>
                </button>
                <div class="menu-divider"></div>
                <button class="tool-item" @click="alignSelected('top')">
                  <svg viewBox="0 0 24 24" width="14" height="14"><path d="M12 3v18M6 6h12" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
                  <span>顶部对齐</span>
                </button>
                <button class="tool-item" @click="alignSelected('middle')">
                  <svg viewBox="0 0 24 24" width="14" height="14"><path d="M12 3v18M6 12h12" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
                  <span>垂直居中</span>
                </button>
                <button class="tool-item" @click="alignSelected('bottom')">
                  <svg viewBox="0 0 24 24" width="14" height="14"><path d="M12 3v18M6 18h12" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
                  <span>底部对齐</span>
                </button>
              </div>
            </div>
          </div>
          <!-- 镜像工具 -->
          <div class="toolbar-group">
            <div class="tool-dropdown">
              <button class="tool-btn" title="镜像工具">
                <svg viewBox="0 0 24 24" width="16" height="16"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15l-5-5 1.41-1.41L11 14.17l7.59-7.59L20 8l-9 9z" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
              </button>
              <div class="tool-menu">
                <button class="tool-item" @click="mirrorSelected('x')">
                  <svg viewBox="0 0 24 24" width="14" height="14"><path d="M12 3v18M5 12h7M19 12h-7M5 9l7-3M5 15l7 3" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
                  <span>X轴镜像</span>
                </button>
                <button class="tool-item" @click="mirrorSelected('y')">
                  <svg viewBox="0 0 24 24" width="14" height="14"><path d="M3 12h18M12 5v7M12 19v-7M9 5l3-3M15 5l-3-3" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
                  <span>Y轴镜像</span>
                </button>
                <button class="tool-item" @click="mirrorSelected('z')">
                  <svg viewBox="0 0 24 24" width="14" height="14"><path d="M12 3v18M5 12h14M12 6l6 3M6 18l6-3" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
                  <span>Z轴镜像</span>
                </button>
              </div>
            </div>
          </div>
          <!-- 阵列工具 -->
          <div class="toolbar-group">
            <div class="tool-dropdown">
              <button class="tool-btn" title="阵列工具">
                <svg viewBox="0 0 24 24" width="16" height="16"><path d="M3 3h6v6H3zM3 15h6v6H3zM15 3h6v6h-6zM15 15h6v6h-6z" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
              </button>
              <div class="tool-menu">
                <button class="tool-item" @click="showArrayModal = true">
                  <svg viewBox="0 0 24 24" width="14" height="14"><path d="M5 12h14M12 5v14" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
                  <span>线性阵列</span>
                </button>
                <button class="tool-item" @click="showRadialArrayModal = true">
                  <svg viewBox="0 0 24 24" width="14" height="14"><circle cx="12" cy="12" r="3" stroke="currentColor" fill="none" stroke-width="1.5"/><circle cx="12" cy="12" r="8" stroke="currentColor" fill="none" stroke-width="1.5"/><circle cx="12" cy="4" r="1" fill="currentColor"/><circle cx="20" cy="12" r="1" fill="currentColor"/><circle cx="12" cy="20" r="1" fill="currentColor"/><circle cx="4" cy="12" r="1" fill="currentColor"/></svg>
                  <span>环形阵列</span>
                </button>
              </div>
            </div>
          </div>
          <div class="toolbar-divider"></div>
          <div class="toolbar-group io-group">
            <button class="tool-btn" @click="fileInput?.click()" title="导入">
              <svg viewBox="0 0 24 24" width="14" height="14"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" fill="none" stroke-width="1.5" stroke-linejoin="round"/></svg>
            </button>
            <div class="io-dropdown">
              <button class="tool-btn" title="导出">
                <svg viewBox="0 0 24 24" width="14" height="14"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="currentColor" fill="none" stroke-width="1.5" stroke-linejoin="round"/></svg>
              </button>
              <div class="io-menu">
                <button class="io-item" @click="exportJSON">导出 JSON</button>
                <button class="io-item" @click="exportGLTF">导出 GLB</button>
              </div>
            </div>
            <button class="tool-btn primary atca-btn-gold" @click="openSaveModal" title="保存">
              <svg viewBox="0 0 24 24" width="14" height="14"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" stroke="currentColor" fill="none" stroke-width="1.5"/><polyline points="17 21 17 13 7 13 7 21" stroke="currentColor" fill="none" stroke-width="1.5"/><path d="M7 3v5h8" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
            </button>
          </div>
        </div>

        <!-- 3D画布 -->
        <div ref="canvasContainer" class="three-canvas" :class="{ measuring: isMeasureMode }" @drop="onDrop" @dragover.prevent @click="onCanvasClick" @contextmenu="onContextMenu"></div>

        <!-- 画布提示 -->
        <div class="canvas-hints">
          <span class="hint-item"><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> {{ $t('workshop.move') }}</span>
          <span class="hint-item"><kbd>Q</kbd> {{ $t('workshop.selectTool') }}</span>
          <span class="hint-item"><kbd>T</kbd> {{ $t('workshop.moveTool') }}</span>
          <span class="hint-item"><kbd>R</kbd> {{ $t('workshop.rotateTool') }}</span>
          <span class="hint-item"><kbd>S</kbd> {{ $t('workshop.scaleTool') }}</span>
          <span class="hint-item"><kbd>Del</kbd> {{ $t('workshop.del') }}</span>
          <span class="hint-item"><kbd>Ctrl</kbd>+{{ $t('workshop.click') }} {{ $t('workshop.multiSelect') }}</span>
        </div>

        <!-- 全屏 -->
        <button class="fullscreen-btn" @click="toggleFullscreen" title="全屏">&#9974;</button>

        <!-- 全屏模式下的面板切换按钮 -->
        <div v-if="isFullscreen" class="fullscreen-panels">
          <button class="panel-toggle-btn" @click="toggleLeftPanel" :title="leftPanelVisible ? '隐藏构件库' : '显示构件库'">
            <svg viewBox="0 0 24 24" width="16" height="16"><path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
          </button>
          <button class="panel-toggle-btn" @click="toggleRightPanel" :title="rightPanelVisible ? '隐藏属性面板' : '显示属性面板'">
            <svg viewBox="0 0 24 24" width="16" height="16"><path d="M12 20V10M18 20V4M6 20v-4" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
          </button>
        </div>

        <!-- 测量提示 -->
        <div v-if="isMeasureMode" class="measure-hint">
          {{ $t('workshop.measureHint') }} | {{ $t('workshop.measureClick') }}
          <button class="btn btn-sec atca-btn-sm" @click="clearMeasurements">{{ $t('workshop.clearMeasure') }}</button>
          <button class="btn atca-btn-sm" @click="stopMeasure">{{ $t('workshop.exitMeasure') }}</button>
        </div>
        <!-- 底部状态栏 -->
        <div class="status-bar">
          <span class="status-item">{{ $t('workshop.components') }}: {{ stats.componentCount }}</span>
          <span class="status-divider"></span>
          <span class="status-item">{{ $t('workshop.vertices') }}: {{ stats.vertexCount }}</span>
          <span class="status-divider"></span>
          <span class="status-item">{{ $t('workshop.faces') }}: {{ stats.faceCount }}</span>
          <span class="status-divider"></span>
          <span class="status-item">{{ $t('workshop.selected') }}: {{ stats.selectedCount }}</span>
          <span class="status-divider"></span>
          <span class="status-item">{{ $t('workshop.tool') }}: {{ transformModeLabel }}</span>
          <span class="status-item status-right">{{ $t('workshop.v2pro') }}</span>
        </div>
      </main>

      <!-- 右侧面板：属性 + 材质 + 场景设置 -->
      <aside class="panel panel-right" v-show="rightPanelVisible || !isFullscreen" :class="{ 'panel-hidden': !rightPanelVisible && isFullscreen }">
        <!-- 变换属性 -->
        <div class="panel-section">
          <div class="panel-header" @click="propCollapsed = !propCollapsed">
            <svg viewBox="0 0 24 24" width="14" height="14"><path d="M12 20V10M18 20V4M6 20v-4" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
            <h3>{{ $t('workshop.properties') }}</h3>
            <span class="collapse-arrow" :class="{ collapsed: propCollapsed }">&#9662;</span>
          </div>
          <div v-show="!propCollapsed" class="panel-body">
            <div v-if="selectedComponent">
              <div class="prop-name">{{ selectedComponent.name }} <span class="prop-type">{{ selectedComponent.type }}</span></div>

              <!-- 位置 -->
              <div class="prop-group">
                <div class="prop-group-header">{{ $t('workshop.position') }} <span class="prop-unit">(m)</span></div>
                <div class="prop-row">
                  <label class="axis-x">X</label><input type="number" step="0.1" v-model.number="selectedComponent.position.x" @change="updatePosition" />
                  <label class="axis-y">Y</label><input type="number" step="0.1" v-model.number="selectedComponent.position.y" @change="updatePosition" />
                  <label class="axis-z">Z</label><input type="number" step="0.1" v-model.number="selectedComponent.position.z" @change="updatePosition" />
                </div>
                <div class="prop-row-btns">
                  <button class="snap-btn" @click="snapToGround">{{ $t('workshop.snapGround') }}</button>
                  <button class="snap-btn" @click="alignCenter">{{ $t('workshop.alignCenter') }}</button>
                </div>
              </div>

              <!-- 旋转 -->
              <div class="prop-group">
                <div class="prop-group-header">{{ $t('workshop.rotation') }} <span class="prop-unit">(rad)</span></div>
                <div class="prop-row">
                  <label class="axis-x">X</label><input type="number" step="0.1" v-model.number="selectedComponent.rotation.x" @change="updateRotation" />
                  <label class="axis-y">Y</label><input type="number" step="0.1" v-model.number="selectedComponent.rotation.y" @change="updateRotation" />
                  <label class="axis-z">Z</label><input type="number" step="0.1" v-model.number="selectedComponent.rotation.z" @change="updateRotation" />
                </div>
                <div class="prop-row-btns">
                  <button class="snap-btn" @click="resetRotation">{{ $t('workshop.resetRotation') }}</button>
                  <button class="snap-btn" @click="rotate90">{{ $t('workshop.rotate90') }}</button>
                </div>
              </div>

              <!-- 缩放 -->
              <div class="prop-group">
                <div class="prop-group-header">{{ $t('workshop.scale') }} <span class="prop-unit">(x)</span></div>
                <div class="prop-row">
                  <label class="axis-x">X</label><input type="number" step="0.1" v-model.number="selectedComponent.scale.x" @change="updateScale" />
                  <label class="axis-y">Y</label><input type="number" step="0.1" v-model.number="selectedComponent.scale.y" @change="updateScale" />
                  <label class="axis-z">Z</label><input type="number" step="0.1" v-model.number="selectedComponent.scale.z" @change="updateScale" />
                </div>
                <div class="prop-row-btns">
                  <button class="snap-btn" v-for="s in [0.5, 1, 1.5, 2]" :key="s" @click="uniformScale(s)">{{ s }}x</button>
                </div>
              </div>

              <!-- 材质 -->
              <div class="prop-group">
                <div class="prop-group-header">{{ $t('workshop.material') }}</div>
                <div class="mat-presets">
                  <button v-for="mat in materialPresets" :key="mat.id" class="mat-preset-btn" :class="{ active: currentMaterial === mat.id }" :style="{ backgroundColor: '#' + mat.color.toString(16).padStart(6, '0') }" @click="applyMaterial(mat)" :title="mat.name">{{ mat.name.charAt(0) }}</button>
                </div>
                <div class="mat-sliders">
                  <div class="slider-row">
                    <label>{{ $t('workshop.roughness') }}</label>
                    <input type="range" min="0" max="1" step="0.05" v-model.number="materialValues.roughness" @input="updateMaterialRealtime" />
                    <span>{{ materialValues.roughness.toFixed(2) }}</span>
                  </div>
                  <div class="slider-row">
                    <label>{{ $t('workshop.metalness') }}</label>
                    <input type="range" min="0" max="1" step="0.05" v-model.number="materialValues.metalness" @input="updateMaterialRealtime" />
                    <span>{{ materialValues.metalness.toFixed(2) }}</span>
                  </div>
                  <div class="slider-row">
                    <label>{{ $t('workshop.opacity') }}</label>
                    <input type="range" min="0" max="1" step="0.05" v-model.number="materialValues.opacity" @input="updateMaterialRealtime" />
                    <span>{{ materialValues.opacity.toFixed(2) }}</span>
                  </div>
                  <div class="color-row">
                    <label>{{ $t('workshop.color') }}</label>
                    <input type="color" v-model="materialValues.colorHex" @input="updateMaterialColor" />
                  </div>
                </div>
              </div>

              <!-- 操作按钮 -->
              <div class="prop-actions">
                <button class="btn btn-sec" @click="cloneSelected">{{ $t('workshop.clone') }}</button>
                <button class="atca-btn" style="background: var(--c-red); color: white;" @click="deleteSelected">{{ $t('workshop.delete') }}</button>
              </div>
            </div>
            <div v-else class="empty-props">
              <svg viewBox="0 0 24 24" width="40" height="40" style="opacity: 0.3;"><path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" stroke="currentColor" fill="none" stroke-width="1.5" stroke-linejoin="round"/></svg>
              <p>{{ $t('workshop.noComponent') }}</p>
            </div>
          </div>
        </div>

        <!-- 场景设置 -->
        <div class="panel-section">
          <div class="panel-header" @click="sceneCollapsed = !sceneCollapsed">
            <svg viewBox="0 0 24 24" width="14" height="14"><circle cx="12" cy="12" r="3" stroke="currentColor" fill="none" stroke-width="1.5"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
            <h3>{{ $t('workshop.sceneSettings') }}</h3>
            <span class="collapse-arrow" :class="{ collapsed: sceneCollapsed }">&#9662;</span>
          </div>
          <div v-show="!sceneCollapsed" class="panel-body">
            <div class="scene-setting">
              <label>{{ $t('workshop.bgColor') }}</label>
              <input type="color" v-model="sceneSettings.bgColor" @input="updateBgColor" />
            </div>
            <div class="scene-setting">
              <label>{{ $t('workshop.gridSize') }}</label>
              <input type="range" min="0.1" max="2" step="0.1" v-model.number="sceneSettings.gridSize" @input="updateGridSize" />
              <span>{{ sceneSettings.gridSize.toFixed(1) }}m</span>
            </div>
            <div class="scene-setting">
              <label>{{ $t('workshop.gridVisible') }}</label>
              <input type="checkbox" v-model="sceneSettings.gridVisible" @change="updateGridVisible" />
            </div>
            <div class="scene-setting">
              <label>{{ $t('workshop.lightIntensity') }}</label>
              <input type="range" min="0" max="3" step="0.1" v-model.number="sceneSettings.lightIntensity" @input="updateLightIntensity" />
              <span>{{ sceneSettings.lightIntensity.toFixed(1) }}</span>
            </div>
            <div class="scene-setting">
              <label>{{ $t('workshop.ambientIntensity') }}</label>
              <input type="range" min="0" max="2" step="0.1" v-model.number="sceneSettings.ambientIntensity" @input="updateAmbientIntensity" />
              <span>{{ sceneSettings.ambientIntensity.toFixed(1) }}</span>
            </div>
          </div>
        </div>
      </aside>
    </div>

    <!-- 线性阵列弹窗 -->
    <div v-if="showArrayModal" class="modal-overlay" @click.self="showArrayModal = false">
      <div class="modal modal-sm">
        <h3>线性阵列</h3>
        <div class="array-form">
          <div class="form-row">
            <div class="form-group">
              <label>数量</label>
              <input type="number" v-model.number="arrayParams.count" min="2" max="100" class="atca-input" />
            </div>
            <div class="form-group">
              <label>间距 (m)</label>
              <input type="number" v-model.number="arrayParams.spacing" min="0.1" step="0.1" class="atca-input" />
            </div>
          </div>
          <div class="form-group">
            <label>方向</label>
            <div class="direction-buttons">
              <button class="dir-btn" :class="{ active: arrayParams.axis === 'x' }" @click="arrayParams.axis = 'x'">X轴</button>
              <button class="dir-btn" :class="{ active: arrayParams.axis === 'y' }" @click="arrayParams.axis = 'y'">Y轴</button>
              <button class="dir-btn" :class="{ active: arrayParams.axis === 'z' }" @click="arrayParams.axis = 'z'">Z轴</button>
            </div>
          </div>
          <div class="form-group">
            <label><input type="checkbox" v-model="arrayParams.includeOriginal" /> 包含原件</label>
          </div>
        </div>
        <div class="modal-actions">
          <button class="btn btn-sec" @click="showArrayModal = false">取消</button>
          <button class="btn btn-pri" @click="executeLinearArray">执行阵列</button>
        </div>
      </div>
    </div>

    <!-- 环形阵列弹窗 -->
    <div v-if="showRadialArrayModal" class="modal-overlay" @click.self="showRadialArrayModal = false">
      <div class="modal modal-sm">
        <h3>环形阵列</h3>
        <div class="array-form">
          <div class="form-row">
            <div class="form-group">
              <label>数量</label>
              <input type="number" v-model.number="radialParams.count" min="2" max="360" class="atca-input" />
            </div>
            <div class="form-group">
              <label>半径 (m)</label>
              <input type="number" v-model.number="radialParams.radius" min="0.1" step="0.1" class="atca-input" />
            </div>
          </div>
          <div class="form-group">
            <label>旋转轴</label>
            <div class="direction-buttons">
              <button class="dir-btn" :class="{ active: radialParams.axis === 'x' }" @click="radialParams.axis = 'x'">X轴</button>
              <button class="dir-btn" :class="{ active: radialParams.axis === 'y' }" @click="radialParams.axis = 'y'">Y轴</button>
              <button class="dir-btn" :class="{ active: radialParams.axis === 'z' }" @click="radialParams.axis = 'z'">Z轴</button>
            </div>
          </div>
          <div class="form-group">
            <label><input type="checkbox" v-model="radialParams.includeOriginal" /> 包含原件</label>
          </div>
          <div class="form-group">
            <label><input type="checkbox" v-model="radialParams.rotateItems" /> 自动旋转</label>
          </div>
        </div>
        <div class="modal-actions">
          <button class="btn btn-sec" @click="showRadialArrayModal = false">取消</button>
          <button class="btn btn-pri" @click="executeRadialArray">执行阵列</button>
        </div>
      </div>
    </div>

    <!-- 保存弹窗 -->
    <div v-if="showSaveModal" class="modal-overlay" @click.self="showSaveModal = false">
      <div class="modal modal-save">
        <h3>保存模型</h3>
        <div class="save-form">
          <div class="form-group full">
            <label>模型名称</label>
            <input v-model="saveForm.modelName" class="atca-input" placeholder="输入模型名称..." @keyup.enter="confirmSave" />
          </div>
          <div class="form-group full">
            <label>可见性</label>
            <div class="visibility-options">
              <label class="vis-option" :class="{ active: !saveForm.isPublic }" @click="saveForm.isPublic = false">
                <svg viewBox="0 0 24 24" width="16" height="16"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="currentColor" fill="none" stroke-width="1.5"/><path d="M7 11V7a5 5 0 0110 0v4" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
                <div>
                  <strong>私密</strong>
                  <span>仅自己可见</span>
                </div>
              </label>
              <label class="vis-option" :class="{ active: saveForm.isPublic }" @click="saveForm.isPublic = true">
                <svg viewBox="0 0 24 24" width="16" height="16"><circle cx="12" cy="12" r="10" stroke="currentColor" fill="none" stroke-width="1.5"/><path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
                <div>
                  <strong>公开</strong>
                  <span>所有人可见</span>
                </div>
              </label>
            </div>
          </div>
        </div>
        <!-- 保存动画覆盖层 -->
        <div v-if="saveAnimating" class="save-loading-overlay">
          <div class="save-spinner">
            <svg viewBox="0 0 50 50" width="40" height="40">
              <circle cx="25" cy="25" r="20" fill="none" stroke="var(--border-light)" stroke-width="3"/>
              <circle cx="25" cy="25" r="20" fill="none" stroke="var(--gold)" stroke-width="3" stroke-dasharray="60 80" stroke-linecap="round">
                <animateTransform attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="1s" repeatCount="indefinite"/>
              </circle>
            </svg>
            <span>正在保存模型...</span>
          </div>
        </div>
        <div class="modal-actions">
          <button class="btn btn-sec" @click="showSaveModal = false" :disabled="saveAnimating">取消</button>
          <button class="btn btn-pri" @click="confirmSave" :disabled="saveAnimating">
            <span v-if="saveAnimating">保存中...</span>
            <span v-else>保存</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 模板弹窗 -->
    <div v-if="showTemplates" class="modal-overlay" @click.self="showTemplates = false">
      <div class="modal">
        <h3>{{ $t('workshop.selectTemplate') }}</h3>
        <div class="template-grid">
          <div v-for="tpl in templates" :key="tpl.template_id" class="template-card" @click="loadTemplate(tpl)">
            <div class="template-thumb"></div>
            <span>{{ tpl.template_name }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 使用指南弹窗 -->
    <div v-if="showGuide" class="modal-overlay" @click.self="showGuide = false">
      <div class="modal modal-lg" style="max-width:720px">
        <div class="modal-header">
          <h3>3D建模工坊 使用指南</h3>
          <button class="modal-close" @click="showGuide = false">&times;</button>
        </div>
        <div class="modal-body guide-body" style="padding:24px;max-height:65vh;overflow-y:auto">
          <div class="guide-section">
            <h4>🎯 基础操作</h4>
            <div class="guide-grid">
              <span><kbd>Q</kbd> 选择工具</span>
              <span><kbd>T</kbd> 移动工具</span>
              <span><kbd>R</kbd> 旋转工具</span>
              <span><kbd>S</kbd> 缩放工具</span>
              <span><kbd>M</kbd> 测量模式</span>
              <span><kbd>N</kbd> 榫卯吸附</span>
              <span><kbd>F</kbd> 聚焦选中</span>
              <span><kbd>W/A/S/D</kbd> 视角移动</span>
              <span><kbd>鼠标滚轮</kbd> 缩放视角</span>
            </div>
          </div>
          <div class="guide-section">
            <h4>⚡ 快捷键</h4>
            <div class="guide-grid">
              <span><kbd>Ctrl+Z</kbd> 撤销</span>
              <span><kbd>Ctrl+Y</kbd> 重做</span>
              <span><kbd>Ctrl+D</kbd> 克隆</span>
              <span><kbd>Delete</kbd> 删除</span>
              <span><kbd>Ctrl+S</kbd> 保存</span>
              <span><kbd>Ctrl+Click</kbd> 多选</span>
              <span><kbd>Shift</kbd> 精确操作</span>
              <span><kbd>Esc</kbd> 取消选择</span>
              <span><kbd>Fullscreen</kbd> 全屏</span>
            </div>
          </div>
          <div class="guide-section">
            <h4>🏗️ 搭建模式</h4>
            <p><strong>自由创建</strong> — 无任何规则限制，随意创建构件和组合，适合自由创作和快速原型设计。</p>
            <p><strong>真实搭建</strong> — 模拟古建筑营造法则，构件间必须遵守榫卯匹配、尺寸约束等传统规矩，体验传统营造工艺。</p>
          </div>
          <div class="guide-section">
            <h4>📦 构件库</h4>
            <p>从左侧构件库选择或拖拽构件到场景。支持多种传统建筑构件：</p>
            <ul style="margin-left:16px; font-size:0.75rem; color:var(--text-muted);">
              <li><strong>柱类</strong> — 圆柱、方柱、八角柱等</li>
              <li><strong>梁类</strong> — 主梁、次梁、横梁等</li>
              <li><strong>檩椽</strong> — 檩条、椽子</li>
              <li><strong>斗拱</strong> — 栌斗、华拱、昂等</li>
              <li><strong>屋顶</strong> — 庑殿顶、歇山顶、攒尖顶等</li>
            </ul>
          </div>
          <div class="guide-section">
            <h4>📥 导入模型</h4>
            <p>支持多种3D模型格式导入：</p>
            <ul style="margin-left:16px; font-size:0.75rem; color:var(--text-muted);">
              <li><strong>.obj</strong> — Wavefront OBJ格式，支持对象分组</li>
              <li><strong>.gltf / .glb</strong> — GL Transmission Format</li>
              <li><strong>.json</strong> — 编辑器内部格式</li>
            </ul>
            <p style="margin-top:8px;">大文件采用分块异步解析，不影响界面操作。</p>
          </div>
          <div class="guide-section">
            <h4>🎨 材质调整</h4>
            <p>选中构件后可在右侧属性面板调整材质参数：</p>
            <ul style="margin-left:16px; font-size:0.75rem; color:var(--text-muted);">
              <li><strong>粗糙度</strong> — 控制表面粗糙程度</li>
              <li><strong>金属度</strong> — 控制金属质感</li>
              <li><strong>透明度</strong> — 控制透明度</li>
              <li><strong>颜色</strong> — 调整构件颜色</li>
            </ul>
          </div>
          <div class="guide-section">
            <h4>💡 实用技巧</h4>
            <ul style="margin-left:16px; font-size:0.75rem; color:var(--text-muted); line-height:1.8;">
              <li>长按画布可快速放置当前选中的构件类型</li>
              <li>开启智能吸附可自动对齐网格和构件</li>
              <li>使用测量工具可精确测量构件间距离</li>
              <li>点击场景树中的眼睛图标可隐藏/显示构件</li>
              <li>锁定构件可防止误操作</li>
            </ul>
          </div>
        </div>
        <div class="modal-actions">
          <button class="btn btn-sec" @click="showGuide = false">关闭</button>
          <button class="btn btn-pri" @click="showGuide = false; showRules = true" v-if="buildMode === 'real'">查看营造规则</button>
        </div>
      </div>
    </div>

    <!-- 真实搭建规则弹窗 -->
    <div v-if="showRules" class="modal-overlay" @click.self="showRules = false">
      <div class="modal modal-lg" style="max-width:760px">
        <div class="modal-header">
          <h3>真实搭建 — 营造规则</h3>
          <button class="modal-close" @click="showRules = false">&times;</button>
        </div>
        <div class="modal-body guide-body" style="padding:24px;max-height:65vh;overflow-y:auto">
          <div class="guide-section">
            <h4>🔗 榫卯匹配规则</h4>
            <p style="margin-bottom:12px;">构件间必须通过榫卯接口连接。每个构件有特定的榫口（凸）和卯眼（凹），尺寸必须匹配才能装配。</p>
            <div class="rule-list">
              <div class="rule-item"><span class="rule-tag">柱与梁</span> 柱头开卯，梁端出榫，榫厚为梁高的 1/3～1/2</div>
              <div class="rule-item"><span class="rule-tag">梁与檩</span> 梁上开槽承檩，檩径一般为柱径的 1/2～2/3</div>
              <div class="rule-item"><span class="rule-tag">斗拱铺作</span> 栌斗高为柱径的 1/2，华拱长按出跳计算</div>
              <div class="rule-item"><span class="rule-tag">榫头长度</span> 直榫长度为构件厚度的 1/3～1/2</div>
              <div class="rule-item"><span class="rule-tag">榫卯配合</span> 榫宽略小于卯口，留0.1～0.2厘米缝隙</div>
              <div class="rule-item"><span class="rule-tag">节点加固</span> 重要节点加木销或榫钉加固</div>
            </div>
          </div>
          <div class="guide-section">
            <h4>📐 尺寸约束</h4>
            <div class="rule-list">
              <div class="rule-item"><span class="rule-tag">材分制</span> 以材为基本模数，1材=斗拱高度，所有尺寸按材的倍数确定</div>
              <div class="rule-item"><span class="rule-tag">柱径</span> 大柱径42～60厘米，檐柱径30～45厘米</div>
              <div class="rule-item"><span class="rule-tag">柱高</span> 檐柱高为面阔的8/10～9/10</div>
              <div class="rule-item"><span class="rule-tag">开间</span> 明间最宽，次间、梢间依次递减</div>
              <div class="rule-item"><span class="rule-tag">进深</span> 由檩条数量和步架决定，步架约为1～1.5倍柱径</div>
              <div class="rule-item"><span class="rule-tag">出檐</span> 檐出约为柱高的1/3～1/4</div>
            </div>
          </div>
          <div class="guide-section">
            <h4>🏛️ 结构限制</h4>
            <div class="rule-list">
              <div class="rule-item"><span class="rule-tag">对称原则</span> 建筑平面必须中轴对称</div>
              <div class="rule-item"><span class="rule-tag">比例协调</span> 柱高与柱径比约为9:1（大式）或10:1（小式）</div>
              <div class="rule-item"><span class="rule-tag">侧脚做法</span> 柱头向内微收，侧脚约为柱高的1/100</div>
              <div class="rule-item"><span class="rule-tag">生起做法</span> 檐柱高度从当心间向两端逐柱升高</div>
              <div class="rule-item"><span class="rule-tag">举折制度</span> 屋面坡度按举高与进深的比例确定</div>
              <div class="rule-item"><span class="rule-tag">材架等级</span> 按建筑等级选用不同等级的材</div>
            </div>
          </div>
          <div class="guide-section">
            <h4>🎭 斗拱规则</h4>
            <div class="rule-list">
              <div class="rule-item"><span class="rule-tag">铺作层</span> 斗拱层数按建筑等级确定</div>
              <div class="rule-item"><span class="rule-tag">出跳</span> 每跳约30～35厘米</div>
              <div class="rule-item"><span class="rule-tag">斗拱比例</span> 斗口为基本单位，约6～8厘米</div>
              <div class="rule-item"><span class="rule-tag">拱长</span> 华拱长按出跳加拱厚</div>
            </div>
          </div>
          <div class="guide-section">
            <h4>💡 温馨提示</h4>
            <p>真实搭建模式下，系统会检测并提示违反营造规则的操作，但不会强制阻止。您可以选择遵循传统规则或自由创作，体验不同的建造方式。</p>
          </div>
        </div>
        <div class="modal-actions">
          <button class="btn btn-sec" @click="showRules = false">关闭</button>
          <button class="btn btn-pri" @click="showRules = false">我已了解</button>
        </div>
      </div>
    </div>

    <!-- 右键菜单 -->
    <div v-if="showContextMenu" class="context-menu" :style="{ left: contextMenuPos.x + 'px', top: contextMenuPos.y + 'px' }" @click.self="showContextMenu = false">
      <div class="context-menu-header">{{ contextMenuComponent?.name || '构件' }}</div>
      <div class="context-menu-divider"></div>
      <button class="context-menu-item" @click="showComponentProperties">
        <svg viewBox="0 0 24 24" width="14" height="14"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" fill="none" stroke="currentColor" stroke-width="2"/></svg>
        <span>查看属性</span>
      </button>
      <button class="context-menu-item" @click="editComponent">
        <svg viewBox="0 0 24 24" width="14" height="14"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7l-4-4zm-1 14l-4-4 1.41-1.41L10 14.17l4.59-4.59L16 11l-6 6z" fill="none" stroke="currentColor" stroke-width="2"/></svg>
        <span>编辑构件</span>
      </button>
      <div class="context-menu-divider"></div>
      <button class="context-menu-item danger" @click="deleteContextComponent">
        <svg viewBox="0 0 24 24" width="14" height="14"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" fill="none" stroke="currentColor" stroke-width="2"/></svg>
        <span>删除</span>
      </button>
    </div>

    <!-- 构件属性弹窗 -->
    <div v-if="showPropertyModal" class="modal-overlay" @click.self="showPropertyModal = false">
      <div class="modal modal-sm">
        <h3>构件属性</h3>
        <div class="property-panel" v-if="selectedComponent">
          <div class="property-section">
            <h4>基本信息</h4>
            <div class="property-row">
              <span class="property-label">名称</span>
              <span class="property-value">{{ selectedComponent.name }}</span>
            </div>
            <div class="property-row">
              <span class="property-label">类型</span>
              <span class="property-value">{{ selectedComponent.type }}</span>
            </div>
            <div class="property-row">
              <span class="property-label">分类</span>
              <span class="property-value">{{ selectedComponent.category }}</span>
            </div>
          </div>
          <div class="property-section">
            <h4>位置</h4>
            <div class="property-row">
              <span class="property-label">X</span>
              <span class="property-value">{{ selectedComponent.position.x.toFixed(2) }}</span>
            </div>
            <div class="property-row">
              <span class="property-label">Y</span>
              <span class="property-value">{{ selectedComponent.position.y.toFixed(2) }}</span>
            </div>
            <div class="property-row">
              <span class="property-label">Z</span>
              <span class="property-value">{{ selectedComponent.position.z.toFixed(2) }}</span>
            </div>
          </div>
          <div class="property-section">
            <h4>榫卯接口</h4>
            <div v-if="selectedComponent.snapPoints && selectedComponent.snapPoints.length > 0">
              <div v-for="(point, index) in selectedComponent.snapPoints" :key="index" class="snap-point-item">
                <div class="snap-point-header">
                  <span class="snap-point-id">{{ point.id }}</span>
                  <span class="snap-point-type" :class="point.type">{{ point.type === 'mortise' ? '榫眼' : point.type === 'tenon' ? '榫头' : '通用' }}</span>
                </div>
                <div class="snap-point-info">
                  <span>位置: ({{ point.localPosition[0].toFixed(2) }}, {{ point.localPosition[1].toFixed(2) }}, {{ point.localPosition[2].toFixed(2) }})</span>
                  <span v-if="point.matchSize">尺寸: {{ point.matchSize.toFixed(2) }}m</span>
                </div>
              </div>
            </div>
            <div v-else class="empty-state">该构件没有榫卯接口</div>
          </div>
        </div>
        <div class="modal-actions">
          <button class="btn btn-sec" @click="showPropertyModal = false">关闭</button>
          <button class="btn btn-pri" @click="editComponent">编辑构件</button>
        </div>
      </div>
    </div>

    <!-- 构件编辑弹窗 -->
    <div v-if="showEditModal" class="modal-overlay" @click.self="showEditModal = false">
      <div class="modal" style="max-width:500px">
        <h3>编辑构件</h3>
        <div class="edit-panel" v-if="selectedComponent">
          <div class="form-group">
            <label>构件名称</label>
            <input v-model="editForm.name" class="atca-input" />
          </div>
          <div class="form-group">
            <label>榫卯接口</label>
            <div class="snap-points-list">
              <div v-for="(point, index) in editForm.snapPoints" :key="index" class="snap-point-edit-item">
                <div class="snap-point-edit-row">
                  <input v-model="point.id" placeholder="接口ID" class="atca-input small" />
                  <select v-model="point.type" class="atca-input small">
                    <option value="mortise">榫眼</option>
                    <option value="tenon">榫头</option>
                    <option value="any">通用</option>
                  </select>
                  <input v-model.number="point.matchSize" type="number" step="0.01" placeholder="尺寸" class="atca-input small" />
                  <button class="btn btn-del" @click="removeSnapPoint(index)">×</button>
                </div>
                <div class="snap-point-coords">
                  <input v-model.number="point.localPosition[0]" type="number" step="0.01" placeholder="X" class="atca-input tiny" />
                  <input v-model.number="point.localPosition[1]" type="number" step="0.01" placeholder="Y" class="atca-input tiny" />
                  <input v-model.number="point.localPosition[2]" type="number" step="0.01" placeholder="Z" class="atca-input tiny" />
                  <span class="coord-label">位置</span>
                </div>
                <div class="snap-point-coords">
                  <input v-model.number="point.localDirection[0]" type="number" step="0.01" placeholder="DX" class="atca-input tiny" />
                  <input v-model.number="point.localDirection[1]" type="number" step="0.01" placeholder="DY" class="atca-input tiny" />
                  <input v-model.number="point.localDirection[2]" type="number" step="0.01" placeholder="DZ" class="atca-input tiny" />
                  <span class="coord-label">方向</span>
                </div>
              </div>
            </div>
            <button class="btn btn-add" @click="addSnapPoint">+ 添加榫卯接口</button>
          </div>
        </div>
        <div class="modal-actions">
          <button class="btn btn-sec" @click="showEditModal = false">取消</button>
          <button class="btn btn-pri" @click="saveComponentEdit">保存修改</button>
        </div>
      </div>
    </div>

    <input type="file" ref="fileInput" accept=".json,.obj,.fbx,.gltf,.glb,.stl,.ply,.3ds" style="display:none" @change="onFileImport" />
    
    <!-- 右键菜单 -->
    <div v-if="showContextMenu" class="context-menu" :style="{ left: contextMenuPos.x + 'px', top: contextMenuPos.y + 'px' }" @click.self="hideContextMenu">
      <div class="context-menu-header">{{ contextMenuComponent?.name || '构件' }}</div>
      <div class="context-menu-divider"></div>
      <button class="context-menu-item" @click="showComponentProperties">
        <svg viewBox="0 0 24 24" width="14" height="14"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="currentColor"/></svg>
        <span>查看属性</span>
      </button>
      <button class="context-menu-item" @click="editComponent">
        <svg viewBox="0 0 24 24" width="14" height="14"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" fill="currentColor"/></svg>
        <span>编辑属性</span>
      </button>
      <button class="context-menu-item" @click="openBuilder">
        <svg viewBox="0 0 24 24" width="14" height="14"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-1 14H5V6h14v12zM9 8h2v4H9zm4 0h2v4h-2zm4 0h2v4h-2z" fill="currentColor"/></svg>
        <span>建模修改</span>
      </button>
      <div class="context-menu-divider"></div>
      <button class="context-menu-item danger" @click="deleteContextComponent">
        <svg viewBox="0 0 24 24" width="14" height="14"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" fill="currentColor"/></svg>
        <span>删除</span>
      </button>
    </div>

    <!-- 属性弹窗 -->
    <div v-if="showPropertyModal" class="property-modal-overlay" @click.self="showPropertyModal = false">
      <div class="property-modal">
        <div class="modal-header">
          <h3 class="modal-title">构件属性</h3>
          <button class="modal-close" @click="showPropertyModal = false">
            <svg viewBox="0 0 24 24" width="16" height="16"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="currentColor"/></svg>
          </button>
        </div>
        <div class="property-content" v-if="selectedComponent">
          <div class="property-group">
            <span class="property-label">名称</span>
            <span class="property-value">{{ selectedComponent.name }}</span>
          </div>
          <div class="property-group">
            <span class="property-label">类型</span>
            <span class="property-value">{{ selectedComponent.type }}</span>
          </div>
          <div class="property-group">
            <span class="property-label">位置</span>
            <span class="property-value">X: {{ selectedComponent.position.x.toFixed(3) }} | Y: {{ selectedComponent.position.y.toFixed(3) }} | Z: {{ selectedComponent.position.z.toFixed(3) }}</span>
          </div>
          <div class="property-group">
            <span class="property-label">旋转</span>
            <span class="property-value">X: {{ (selectedComponent.rotation?.x || 0).toFixed(3) }} | Y: {{ (selectedComponent.rotation?.y || 0).toFixed(3) }} | Z: {{ (selectedComponent.rotation?.z || 0).toFixed(3) }}</span>
          </div>
          <div class="property-group">
            <span class="property-label">缩放</span>
            <span class="property-value">X: {{ (selectedComponent.scale?.x || 1).toFixed(3) }} | Y: {{ (selectedComponent.scale?.y || 1).toFixed(3) }} | Z: {{ (selectedComponent.scale?.z || 1).toFixed(3) }}</span>
          </div>
          <div class="property-group">
            <span class="property-label">榫卯接口</span>
            <div class="snap-points-list">
              <div v-for="(point, index) in selectedComponent.snapPoints" :key="index" class="snap-point-item">
                <div class="snap-point-info">
                  <div class="snap-point-title">接口 {{ index + 1 }}</div>
                  <div class="snap-point-details">
                    <div>类型: {{ point.type === 'mortise' ? '榫眼' : point.type === 'tenon' ? '榫头' : '通用' }}</div>
                    <div>位置: ({{ point.localPosition[0] }}, {{ point.localPosition[1] }}, {{ point.localPosition[2] }})</div>
                    <div>方向: {{ point.localDirection ? `(${point.localDirection[0]}, ${point.localDirection[1]}, ${point.localDirection[2]})` : '-' }}</div>
                    <div>匹配尺寸: {{ point.matchSize || '-' }}</div>
                  </div>
                </div>
              </div>
              <div v-if="!selectedComponent.snapPoints || selectedComponent.snapPoints.length === 0" class="snap-point-item">
                <span class="property-value" style="font-family: inherit;">无榫卯接口</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 编辑弹窗 -->
    <div v-if="showEditModal" class="edit-modal-overlay" @click.self="showEditModal = false">
      <div class="edit-modal">
        <div class="modal-header">
          <h3 class="modal-title">编辑构件</h3>
          <button class="modal-close" @click="showEditModal = false">
            <svg viewBox="0 0 24 24" width="16" height="16"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="currentColor"/></svg>
          </button>
        </div>
        <form class="edit-form" @submit.prevent="saveComponentEdit">
          <div class="form-group">
            <label>构件名称</label>
            <input v-model="editForm.name" type="text" placeholder="请输入构件名称" />
          </div>
          <div class="form-group">
            <label>榫卯接口</label>
            <div class="snap-points-editor">
              <div v-for="(point, index) in editForm.snapPoints" :key="point.id" class="snap-point-editor-item">
                <div class="snap-point-editor-header">
                  <span class="snap-point-editor-title">接口 {{ index + 1 }}</span>
                  <button type="button" class="snap-point-editor-remove" @click="removeSnapPoint(index)">删除</button>
                </div>
                <div class="snap-point-editor-fields">
                  <div>
                    <label>类型</label>
                    <select v-model="point.type">
                      <option value="mortise">榫眼</option>
                      <option value="tenon">榫头</option>
                      <option value="any">通用</option>
                    </select>
                  </div>
                  <div>
                    <label>匹配尺寸</label>
                    <input v-model.number="point.matchSize" type="number" step="0.01" min="0" placeholder="匹配尺寸" />
                  </div>
                  <div>
                    <label>位置 X</label>
                    <input v-model.number="point.localPosition[0]" type="number" step="0.1" />
                  </div>
                  <div>
                    <label>位置 Y</label>
                    <input v-model.number="point.localPosition[1]" type="number" step="0.1" />
                  </div>
                  <div>
                    <label>位置 Z</label>
                    <input v-model.number="point.localPosition[2]" type="number" step="0.1" />
                  </div>
                  <div>
                    <label>方向 X</label>
                    <input v-model.number="point.localDirection[0]" type="number" step="0.1" />
                  </div>
                  <div>
                    <label>方向 Y</label>
                    <input v-model.number="point.localDirection[1]" type="number" step="0.1" />
                  </div>
                  <div>
                    <label>方向 Z</label>
                    <input v-model.number="point.localDirection[2]" type="number" step="0.1" />
                  </div>
                </div>
              </div>
              <button type="button" class="add-snap-btn" @click="addSnapPoint">
                <svg viewBox="0 0 24 24" width="14" height="14"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" fill="currentColor"/></svg>
                <span>添加榫卯接口</span>
              </button>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="showEditModal = false">取消</button>
            <button type="submit" class="btn btn-primary">保存</button>
          </div>
        </form>
      </div>
    </div>

    <Footer v-show="!isFullscreen" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useUserStore } from '@/stores';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import Navbar from '@/components/common/CommonNavbar.vue';
import Footer from '@/components/common/CommonFooter.vue';
import { SceneManager, type SceneComponent, type SceneStats, type TransformMode } from '@/components/threejs/ThreejsSceneManager';
import {
  DEFAULT_COMPONENTS,
  getComponentsByCategory,
  getAllCategories,
  createSceneComponent,
  MATERIAL_PRESETS,
  type ComponentDefinition,
} from '@/components/threejs/ThreejsArchitectureComponents';
import { model3dApi } from '@/services/api';

const canvasContainer = ref<HTMLElement>();
let sceneManager: SceneManager | null = null;
const router = useRouter();
const userStore = useUserStore();

// 面板折叠状态
const libCollapsed = ref(false);
const treeCollapsed = ref(false);
const propCollapsed = ref(false);
const sceneCollapsed = ref(false);

// 全屏模式状态
const isFullscreen = ref(false);
const leftPanelVisible = ref(true);
const rightPanelVisible = ref(true);

const activeCategory = ref('pillar');
const transformMode = ref<TransformMode>('select');
const selectedComponent = ref<SceneComponent | null>(null);
const selectedDef = ref<ComponentDefinition | null>(null);
const allComponents = ref<SceneComponent[]>([]);
const selectedUuids = ref<string[]>([]);
const currentMaterial = ref('wood');
const showTemplates = ref(false);
const showSaveModal = ref(false);
const saveForm = ref({ modelName: '', isPublic: false });
const templates = ref<any[]>([]);
const snapEnabled = ref(true);
const fileInput = ref<HTMLInputElement>();
const wireframeMode = ref(false);
const isMeasureMode = ref(false);
const isSnapMode = ref(false);   // 手动吸附模式开关
const isSimpleMode = ref(false); // 精简模式开关（默认关闭，显示完整UI）
const activeView = ref('perspective');
const searchQuery = ref('');

const historyStack = ref<SceneComponent[][]>([]);
const historyIndex = ref(-1);

// 我的模型（从数据库加载，与个人信息页一致）
const myModels = ref<any[]>([]);
const myModelsLoading = ref(false);
const showMyModels = ref(true);

async function loadMyModels() {
  myModelsLoading.value = true;
  try {
    const res = await model3dApi.getMyModels();
    if (res.success) myModels.value = res.data || [];
  } catch (e) { console.error('加载我的模型失败:', e); }
  finally { myModelsLoading.value = false; }
}

// 统计
const stats = ref<SceneStats>({ componentCount: 0, vertexCount: 0, faceCount: 0, selectedCount: 0 });

// 材质值
const materialValues = ref({ roughness: 0.8, metalness: 0.1, opacity: 1, colorHex: '#8B6E4D' });

// 场景设置
const sceneSettings = ref({
  bgColor: '#f5f0e8',
  gridSize: 1,
  gridVisible: true,
  lightIntensity: 1.0,
  ambientIntensity: 0.5,
});

// 搭建模式：free=自由创建 | real=真实搭建（有古建筑规则约束）
const buildMode = ref<'free' | 'real'>('free');
const showGuide = ref(false);
const showRules = ref(false);
const showModeSwitch = ref(false);

// 阵列弹窗状态
const showArrayModal = ref(false);
const showRadialArrayModal = ref(false);

// 线性阵列参数
const arrayParams = ref({
  count: 5,
  spacing: 1,
  axis: 'x' as 'x' | 'y' | 'z',
  includeOriginal: false,
});

// 环形阵列参数
const radialParams = ref({
  count: 8,
  radius: 2,
  axis: 'y' as 'x' | 'y' | 'z',
  includeOriginal: false,
  rotateItems: true,
});

// 右键菜单
const showContextMenu = ref(false);
const contextMenuPos = ref({ x: 0, y: 0 });
const contextMenuComponent = ref<SceneComponent | null>(null);

// 属性弹窗
const showPropertyModal = ref(false);

// 编辑弹窗
const showEditModal = ref(false);
const editForm = ref({
  name: '',
  snapPoints: [] as Array<{
    id: string;
    localPosition: [number, number, number];
    localDirection?: [number, number, number];
    type: 'mortise' | 'tenon' | 'any';
    matchSize?: number;
  }>,
});

const categories = getAllCategories();
const materialPresets = MATERIAL_PRESETS;

const quickBuilds = [
  { id: 'single-pillar', name: '独柱', icon: '\u{1F4CF}' },
  { id: 'pillar-beam', name: '梁柱', icon: '\u{1F3DB}' },
  { id: 'four-pillar', name: '四柱', icon: '\u{1F3F0}' },
  { id: 'hall-frame', name: '厅堂', icon: '\u{1F3DF}' },
  { id: 'mini-pavilion', name: '亭阁', icon: '\u{26EA}' },
  { id: 'gate', name: '门楼', icon: '\u{1F6AA}' },
];

const filteredComponents = computed(() => {
  const list = getComponentsByCategory(activeCategory.value);
  if (!searchQuery.value.trim()) return list;
  const q = searchQuery.value.toLowerCase();
  return list.filter(c => c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q));
});

const transformModeLabel = computed(() => {
  const labels: Record<string, string> = {
    select: $t('workshop.selectTool'),
    translate: $t('workshop.moveTool'),
    rotate: $t('workshop.rotateTool'),
    scale: $t('workshop.scaleTool'),
  };
  return labels[transformMode.value] || transformMode.value;
});

// ===== 工具模式 =====
function setTransformMode(mode: TransformMode) {
  transformMode.value = mode;
  sceneManager?.setTransformMode(mode);
  if (isMeasureMode.value) stopMeasure();
}

function toggleWireframe() {
  wireframeMode.value = !wireframeMode.value;
  sceneManager?.setWireframe(wireframeMode.value);
}

function toggleMeasure() {
  isMeasureMode.value = !isMeasureMode.value;
  if (isMeasureMode.value) {
    sceneManager?.startMeasure();
    setTransformMode('select');
  } else {
    sceneManager?.stopMeasure();
  }
}

function stopMeasure() {
  isMeasureMode.value = false;
  sceneManager?.stopMeasure();
}

function clearMeasurements() {
  sceneManager?.clearMeasurements();
}

// ===== 构件操作 =====
function addComponent(def: ComponentDefinition, pos?: { x: number; y: number; z: number }) {
  if (!sceneManager) return;
  const sceneComp = createSceneComponent(def, pos || { x: 0, y: 2, z: 0 });
  sceneManager.addComponent(sceneComp);
  sceneManager.selectSingle(sceneComp.uuid, false);
  saveHistory();
  refreshComponents();
}

function selectAndAdd(def: ComponentDefinition) {
  selectedDef.value = def;
  addComponent(def);
}

function selectByUuid(uuid: string, event?: MouseEvent) {
  const additive = event?.ctrlKey || event?.metaKey;
  sceneManager?.selectSingle(uuid, additive);
  refreshComponents();
}

function cloneSelected() {
  const uuids = sceneManager?.getSelected() || [];
  uuids.forEach((uuid: string) => sceneManager?.cloneComponent(uuid));
  saveHistory();
  refreshComponents();
}

function deleteSelected() {
  const uuids = sceneManager?.getSelected() || [];
  uuids.forEach((uuid: string) => sceneManager?.removeComponent(uuid));
  selectedComponent.value = null;
  selectedUuids.value = [];
  saveHistory();
  refreshComponents();
}

// ===== 右键菜单 =====
function onContextMenu(e: MouseEvent) {
  if (!canvasContainer.value) return;
  
  const rect = canvasContainer.value.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  
  const clickedComp = sceneManager?.raycastComponent(x, y);
  if (clickedComp) {
    e.preventDefault();
    contextMenuComponent.value = clickedComp;
    contextMenuPos.value = { x: e.clientX, y: e.clientY };
    showContextMenu.value = true;
  }
}

function hideContextMenu() {
  showContextMenu.value = false;
  contextMenuComponent.value = null;
}

function showComponentProperties() {
  if (contextMenuComponent.value) {
    selectedComponent.value = contextMenuComponent.value;
    showPropertyModal.value = true;
    hideContextMenu();
  }
}

function editComponent() {
  if (contextMenuComponent.value) {
    selectedComponent.value = contextMenuComponent.value;
    editForm.value = {
      name: contextMenuComponent.value.name,
      snapPoints: contextMenuComponent.value.snapPoints ? 
        JSON.parse(JSON.stringify(contextMenuComponent.value.snapPoints)) : [],
    };
    showEditModal.value = true;
    hideContextMenu();
    showPropertyModal.value = false;
  }
}

function openBuilder() {
  if (contextMenuComponent.value) {
    const componentData = {
      uuid: contextMenuComponent.value.uuid,
      type: contextMenuComponent.value.type,
      category: contextMenuComponent.value.category,
      name: contextMenuComponent.value.name,
      position: contextMenuComponent.value.position,
      rotation: contextMenuComponent.value.rotation,
      scale: contextMenuComponent.value.scale,
      snapPoints: contextMenuComponent.value.snapPoints || [],
      material: contextMenuComponent.value.material,
    };
    const encodedData = encodeURIComponent(JSON.stringify(componentData));
    router.push(`/workshop/builder?component=${encodedData}`);
    hideContextMenu();
  }
}

function deleteContextComponent() {
  if (contextMenuComponent.value) {
    sceneManager?.removeComponent(contextMenuComponent.value.uuid);
    saveHistory();
    refreshComponents();
    hideContextMenu();
  }
}

function addSnapPoint() {
  editForm.value.snapPoints.push({
    id: `snap_${Date.now()}`,
    localPosition: [0, 0, 0],
    localDirection: [0, 1, 0],
    type: 'mortise',
    matchSize: 0.2,
  });
}

function removeSnapPoint(index: number) {
  editForm.value.snapPoints.splice(index, 1);
}

function saveComponentEdit() {
  if (!selectedComponent.value || !sceneManager) return;
  
  // 更新名称
  sceneManager?.updateComponentName(selectedComponent.value.uuid, editForm.value.name);
  
  // 更新榫卯接口
  const updatedPoints = editForm.value.snapPoints.map(p => ({
    ...p,
    localDirection: p.localDirection || [0, 0, 0],
  }));
  sceneManager?.updateSnapPoints(selectedComponent.value.uuid, updatedPoints);
  
  // 更新选中组件的显示
  selectedComponent.value.name = editForm.value.name;
  selectedComponent.value.snapPoints = updatedPoints;
  
  saveHistory();
  refreshComponents();
  showEditModal.value = false;
}

// ===== 对齐工具 =====
function alignSelected(type: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') {
  const uuids = sceneManager?.getSelected() || [];
  if (uuids.length < 2) {
    alert('请至少选择两个构件');
    return;
  }
  
  const components = uuids.map(uuid => sceneManager?.getComponent(uuid)).filter(Boolean) as SceneComponent[];
  
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  let minZ = Infinity, maxZ = -Infinity;
  
  components.forEach(comp => {
    minX = Math.min(minX, comp.position.x);
    maxX = Math.max(maxX, comp.position.x);
    minY = Math.min(minY, comp.position.y);
    maxY = Math.max(maxY, comp.position.y);
    minZ = Math.min(minZ, comp.position.z);
    maxZ = Math.max(maxZ, comp.position.z);
  });
  
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  const centerZ = (minZ + maxZ) / 2;
  
  components.forEach(comp => {
    const newPos = { ...comp.position };
    
    switch (type) {
      case 'left': newPos.x = minX; break;
      case 'center': newPos.x = centerX; break;
      case 'right': newPos.x = maxX; break;
      case 'top': newPos.y = maxY; break;
      case 'middle': newPos.y = centerY; break;
      case 'bottom': newPos.y = minY; break;
    }
    
    sceneManager?.moveComponent(comp.uuid, newPos);
  });
  
  saveHistory();
  refreshComponents();
}

// ===== 镜像工具 =====
function mirrorSelected(axis: 'x' | 'y' | 'z') {
  const uuids = sceneManager?.getSelected() || [];
  if (uuids.length === 0) {
    alert('请选择至少一个构件');
    return;
  }
  
  // 计算选择中心作为镜像轴
  const components = uuids.map(uuid => sceneManager?.getComponent(uuid)).filter(Boolean) as SceneComponent[];
  
  let centerX = 0, centerY = 0, centerZ = 0;
  components.forEach(comp => {
    centerX += comp.position.x;
    centerY += comp.position.y;
    centerZ += comp.position.z;
  });
  centerX /= components.length;
  centerY /= components.length;
  centerZ /= components.length;
  
  components.forEach(comp => {
    const newPos = { ...comp.position };
    const newRot = { ...comp.rotation };
    
    switch (axis) {
      case 'x':
        newPos.x = centerX - (comp.position.x - centerX);
        newRot.y = -newRot.y;
        newRot.z = -newRot.z;
        break;
      case 'y':
        newPos.y = centerY - (comp.position.y - centerY);
        newRot.x = -newRot.x;
        newRot.z = -newRot.z;
        break;
      case 'z':
        newPos.z = centerZ - (comp.position.z - centerZ);
        newRot.x = -newRot.x;
        newRot.y = -newRot.y;
        break;
    }
    
    sceneManager?.moveComponent(comp.uuid, newPos);
    sceneManager?.rotateComponent(comp.uuid, newRot);
  });
  
  saveHistory();
  refreshComponents();
}

// ===== 线性阵列 =====
function executeLinearArray() {
  const uuids = sceneManager?.getSelected() || [];
  if (uuids.length === 0) {
    alert('请选择至少一个构件');
    showArrayModal.value = false;
    return;
  }
  
  const { count, spacing, axis, includeOriginal } = arrayParams.value;
  const startIndex = includeOriginal ? 0 : 1;
  
  for (let i = startIndex; i < count; i++) {
    uuids.forEach(uuid => {
      const comp = sceneManager?.getComponent(uuid);
      if (!comp) return;
      
      const cloned = sceneManager?.cloneComponent(uuid);
      if (!cloned) return;
      
      const offset = i * spacing;
      const newPos = { ...comp.position };
      
      switch (axis) {
        case 'x': newPos.x += offset; break;
        case 'y': newPos.y += offset; break;
        case 'z': newPos.z += offset; break;
      }
      
      sceneManager?.moveComponent(cloned.uuid, newPos);
    });
  }
  
  showArrayModal.value = false;
  saveHistory();
  refreshComponents();
}

// ===== 环形阵列 =====
function executeRadialArray() {
  const uuids = sceneManager?.getSelected() || [];
  if (uuids.length === 0) {
    alert('请选择至少一个构件');
    showRadialArrayModal.value = false;
    return;
  }
  
  const { count, radius, axis, includeOriginal, rotateItems } = radialParams.value;
  const startIndex = includeOriginal ? 0 : 1;
  const angleStep = (Math.PI * 2) / count;
  
  // 计算选择中心作为旋转中心
  const components = uuids.map(uuid => sceneManager?.getComponent(uuid)).filter(Boolean) as SceneComponent[];
  let centerX = 0, centerY = 0, centerZ = 0;
  components.forEach(comp => {
    centerX += comp.position.x;
    centerY += comp.position.y;
    centerZ += comp.position.z;
  });
  centerX /= components.length;
  centerY /= components.length;
  centerZ /= components.length;
  
  for (let i = startIndex; i < count; i++) {
    const angle = i * angleStep;
    
    uuids.forEach(uuid => {
      const comp = sceneManager?.getComponent(uuid);
      if (!comp) return;
      
      const cloned = sceneManager?.cloneComponent(uuid);
      if (!cloned) return;
      
      // 计算新位置
      const newPos = { ...comp.position };
      const dx = comp.position.x - centerX;
      const dy = comp.position.y - centerY;
      const dz = comp.position.z - centerZ;
      
      switch (axis) {
        case 'x':
          newPos.y = centerY + dy * Math.cos(angle) - dz * Math.sin(angle);
          newPos.z = centerZ + dy * Math.sin(angle) + dz * Math.cos(angle);
          break;
        case 'y':
          newPos.x = centerX + dx * Math.cos(angle) + dz * Math.sin(angle);
          newPos.z = centerZ - dx * Math.sin(angle) + dz * Math.cos(angle);
          break;
        case 'z':
          newPos.x = centerX + dx * Math.cos(angle) - dy * Math.sin(angle);
          newPos.y = centerY + dx * Math.sin(angle) + dy * Math.cos(angle);
          break;
      }
      
      sceneManager?.moveComponent(cloned.uuid, newPos);
      
      // 自动旋转
      if (rotateItems) {
        const newRot = { ...comp.rotation };
        switch (axis) {
          case 'x': newRot.x += angle; break;
          case 'y': newRot.y += angle; break;
          case 'z': newRot.z += angle; break;
        }
        sceneManager?.rotateComponent(cloned.uuid, newRot);
      }
    });
  }
  
  showRadialArrayModal.value = false;
  saveHistory();
  refreshComponents();
}

function toggleVisible(uuid: string) {
  const comp = sceneManager?.getComponent(uuid);
  if (comp) sceneManager?.setVisibility(uuid, !comp.visible);
  refreshComponents();
}

function toggleLocked(uuid: string) {
  const comp = sceneManager?.getComponent(uuid);
  if (comp) sceneManager?.setLocked(uuid, !comp.locked);
  refreshComponents();
}

// ===== 属性更新 =====
function updatePosition() {
  if (!sceneManager || !selectedComponent.value) return;
  sceneManager.moveComponent(selectedComponent.value.uuid, selectedComponent.value.position);
  saveHistory();
}

function updateRotation() {
  if (!sceneManager || !selectedComponent.value) return;
  sceneManager.rotateComponent(selectedComponent.value.uuid, selectedComponent.value.rotation);
  saveHistory();
}

function updateScale() {
  if (!sceneManager || !selectedComponent.value) return;
  sceneManager.scaleComponent(selectedComponent.value.uuid, selectedComponent.value.scale);
  saveHistory();
}

function snapToGround() {
  if (!sceneManager || !selectedComponent.value) return;
  const comp = selectedComponent.value;
  comp.position.y = 0;
  sceneManager.moveComponent(comp.uuid, comp.position);
  saveHistory();
}

function alignCenter() {
  if (!sceneManager || !selectedComponent.value) return;
  const comp = selectedComponent.value;
  comp.position.x = 0;
  comp.position.z = 0;
  sceneManager.moveComponent(comp.uuid, comp.position);
  saveHistory();
}

function resetRotation() {
  if (!sceneManager || !selectedComponent.value) return;
  const comp = selectedComponent.value;
  comp.rotation = { x: 0, y: 0, z: 0 };
  sceneManager.rotateComponent(comp.uuid, comp.rotation);
  saveHistory();
}

function switchMode(mode: 'free' | 'real') {
  if (buildMode.value === mode) return;
  buildMode.value = mode;
  if (sceneManager) {
    sceneManager.setBuildMode(mode);
    if (mode === 'real') { showRules.value = true; }
  }
}

function rotate90() {
  if (!sceneManager || !selectedComponent.value) return;
  const comp = selectedComponent.value;
  comp.rotation.y += Math.PI / 2;
  sceneManager.rotateComponent(comp.uuid, comp.rotation);
  saveHistory();
}

function uniformScale(s: number) {
  if (!sceneManager || !selectedComponent.value) return;
  const comp = selectedComponent.value;
  comp.scale = { x: s, y: s, z: s };
  sceneManager.scaleComponent(comp.uuid, comp.scale);
  saveHistory();
}

// ===== 材质 =====
function applyMaterial(mat: any) {
  currentMaterial.value = mat.id;
  materialValues.value = {
    roughness: mat.roughness,
    metalness: mat.metalness,
    opacity: 1,
    colorHex: '#' + mat.color.toString(16).padStart(6, '0'),
  };
  const uuids = sceneManager?.getSelected() || [];
  uuids.forEach((uuid: string) => {
    sceneManager?.updateMaterial(uuid, { color: mat.color, roughness: mat.roughness, metalness: mat.metalness, opacity: 1 });
  });
  saveHistory();
}

function updateMaterialRealtime() {
  const uuids = sceneManager?.getSelected() || [];
  const v = materialValues.value;
  const color = parseInt(v.colorHex.replace('#', ''), 16);
  uuids.forEach((uuid: string) => {
    sceneManager?.updateMaterial(uuid, { roughness: v.roughness, metalness: v.metalness, opacity: v.opacity, color });
  });
}

function updateMaterialColor() {
  updateMaterialRealtime();
}

// ===== 快速构建 =====
function quickBuild(id: string) {
  if (!sceneManager) return;
  const getDef = (type: string) => DEFAULT_COMPONENTS.find(c => c.type === type);

  switch (id) {
    case 'single-pillar': {
      const d = getDef('pillar_round');
      if (d) addComponent(d, { x: 0, y: 1.5, z: 0 });
      break;
    }
    case 'pillar-beam': {
      const pd = getDef('pillar_round');
      const bd = getDef('beam_main');
      if (pd) addComponent(pd, { x: 0, y: 1.5, z: 0 });
      if (bd) addComponent(bd, { x: 0, y: 3.1, z: 0 });
      break;
    }
    case 'four-pillar': {
      const p = getDef('pillar_round');
      const b = getDef('beam_main');
      const cross = getDef('beam_cross');
      const positions = [{ x: -2, z: -2 }, { x: 2, z: -2 }, { x: 2, z: 2 }, { x: -2, z: 2 }];
      positions.forEach(pos => { if (p) addComponent(p, { x: pos.x, y: 1.5, z: pos.z }); });
      if (b) addComponent(b, { x: 0, y: 3.1, z: -2 });
      if (b) addComponent(b, { x: 0, y: 3.1, z: 2 });
      if (cross) addComponent(cross, { x: -2, y: 3.1, z: 0 });
      if (cross) addComponent(cross, { x: 2, y: 3.1, z: 0 });
      break;
    }
    case 'hall-frame': {
      quickBuild('four-pillar');
      const roof = getDef('roof_hipped');
      const base = getDef('base_platform');
      if (base) addComponent(base, { x: 0, y: 0.4, z: 0 });
      if (roof) addComponent(roof, { x: 0, y: 4.2, z: 0 });
      break;
    }
    case 'mini-pavilion': {
      const p = getDef('pillar_round');
      const roof = getDef('roof_pyramidal');
      [{ x: -1.5, z: -1.5 }, { x: 1.5, z: -1.5 }, { x: 1.5, z: 1.5 }, { x: -1.5, z: 1.5 }].forEach(pos => {
        if (p) addComponent(p, { x: pos.x, y: 1.5, z: pos.z });
      });
      if (roof) addComponent(roof, { x: 0, y: 3.5, z: 0 });
      break;
    }
    case 'gate': {
      const p = getDef('pillar_square');
      const door = getDef('door_main');
      const roof = getDef('roof_gable');
      if (p) addComponent(p, { x: -1.5, y: 1.5, z: 0 });
      if (p) addComponent(p, { x: 1.5, y: 1.5, z: 0 });
      if (door) addComponent(door, { x: 0, y: 1.25, z: 0 });
      if (roof) addComponent(roof, { x: 0, y: 3.5, z: 0 });
      break;
    }
  }
}

// ===== 场景设置 =====
function updateBgColor() { sceneManager?.setBackgroundColor(sceneSettings.value.bgColor); }
function updateGridSize() { sceneManager?.setGridSize(sceneSettings.value.gridSize); }
function updateGridVisible() { sceneManager?.toggleGrid(sceneSettings.value.gridVisible); }
function updateLightIntensity() { sceneManager?.setLightIntensity(sceneSettings.value.lightIntensity); }
function updateAmbientIntensity() { sceneManager?.setAmbientIntensity(sceneSettings.value.ambientIntensity); }

// ===== 相机 =====
function setCamera(preset: 'perspective' | 'top' | 'front' | 'side' | 'isometric') {
  activeView.value = preset;
  sceneManager?.setCameraPreset(preset);
}

function focusSelected() { sceneManager?.focusSelected(); }

// ===== 拖拽 =====
function onDragStart(e: DragEvent, def: ComponentDefinition) {
  e.dataTransfer?.setData('component', JSON.stringify(def));
}

function onDrop(e: DragEvent) {
  const data = e.dataTransfer?.getData('component');
  if (!data || !sceneManager) return;
  const def = JSON.parse(data) as ComponentDefinition;
  addComponent(def, { x: (Math.random() - 0.5) * 4, y: 2, z: (Math.random() - 0.5) * 4 });
}

// ===== 画布点击（测量模式） =====
function onCanvasClick(event: MouseEvent) {
  if (!isMeasureMode.value || !sceneManager) return;
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
  const mouse = new THREE.Vector2(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1
  );
  const raycaster = new THREE.Raycaster();
  // 通过SceneManager的相机进行射线检测
  const camera = sceneManager?.getCamera?.() as THREE.PerspectiveCamera | undefined;
  if (!camera) return;
  raycaster.setFromCamera(mouse, camera);
  const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const intersectPoint = new THREE.Vector3();
  raycaster.ray.intersectPlane(plane, intersectPoint);
  if (intersectPoint) {
    sceneManager.addMeasurePoint(intersectPoint);
  }
}

// ===== 导入导出 =====
function importJSON() { fileInput.value?.click(); }

/** 手动触发榫卯吸附 */
function triggerSnap() {
  if (!sceneManager) return;
  const selected = sceneManager.getSelectedComponents();
  if (selected.length === 0) { alert('请先选择要吸附的构件'); return; }
  isSnapMode.value = true;
  // 对选中的每个构件尝试吸附
  let snapCount = 0;
  for (const comp of selected) {
    const others = sceneManager.getAllComponents().filter((c: any) => c.uuid !== comp.uuid);
    for (const other of others) {
      if (sceneManager.snapComponents(comp.uuid, other.uuid)) {
        snapCount++;
        break;
      }
    }
  }
  setTimeout(() => { isSnapMode.value = false; }, 500);
  if (snapCount > 0) {
    saveHistory();
    refreshComponents();
  }
  alert(snapCount > 0 ? `成功吸附 ${snapCount} 个构件` : '未找到匹配的榫卯接口');
}

async function onFileImport(e: Event) {
  const target = e.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file || !sceneManager) return;
  const ext = file.name.split('.').pop()?.toLowerCase();

  if (ext === 'json') {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const json = ev.target?.result as string;
      if (json) { sceneManager!.importFromJSON(json); saveHistory(); refreshComponents(); }
    };
    reader.readAsText(file);
  } else if (ext === 'obj') {
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const text = ev.target?.result as string;
      if (text) { await loadOBJFromText(text, file.name); saveHistory(); refreshComponents(); }
    };
    reader.readAsText(file);
  } else if (ext === 'fbx' || ext === 'stl' || ext === 'ply' || ext === '3ds') {
    alert(ext!.toUpperCase() + ' 格式文件需通过后端解析。请使用 .OBJ 或 .JSON 格式导入。');
  } else if (ext === 'gltf' || ext === 'glb') {
    const loader = new GLTFLoader();
    try {
      const url = URL.createObjectURL(file);
      const gltf = await loader.loadAsync(url);
      sceneManager!.importGLTF(gltf);
      URL.revokeObjectURL(url);
      saveHistory();
      refreshComponents();
    } catch (e: any) { alert('GLTF导入失败: ' + (e.message || '未知错误')); }
  } else {
    alert('不支持的文件格式: .' + ext + '\n支持: .obj, .json, .gltf, .glb');
  }
  target.value = '';
}

function exportJSON() {
  const json = sceneManager?.exportToJSON();
  if (json) { const blob = new Blob([json], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'model.json'; a.click(); URL.revokeObjectURL(url); }
}

function exportGLTF() {
  sceneManager?.exportToGLTF().then((blob) => {
    const isBinary = blob.type === 'model/gltf-binary';
    const ext = isBinary ? '.glb' : '.gltf';
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'model' + ext;
    a.click();
    URL.revokeObjectURL(url);
  }).catch((err) => { console.error('[Export GLTF]', err); alert('导出GLTF失败: ' + (err.message || '未知错误')); });
}

// ===== 保存 =====
function openSaveModal() {
  // 访客模式：未登录时先保存数据到localStorage，然后跳转登录
  if (!userStore.isLoggedIn) {
    const json = sceneManager?.exportToJSON();
    if (json) {
      localStorage.setItem('atca_workshop_guest_model', json);
      localStorage.setItem('atca_workshop_guest_name', saveForm.value.modelName || '我的模型');
    }
    const confirmLogin = window.confirm('保存模型需要登录，是否前往登录？\n（登录后将自动返回3D工坊并保留当前模型）');
    if (confirmLogin) {
      router.push({ path: '/login', query: { redirect: '/workshop/editor' } });
    }
    return;
  }
  saveForm.value = { modelName: '我的模型', isPublic: false };
  showSaveModal.value = true;
}

/** 截断模型JSON中的vertices数据，防止localStorage超出配额 */
function trimModelDataForStorage(json: string, maxVertsPerComp: number): string {
  try {
    const data = JSON.parse(json);
    if (!data.components || !Array.isArray(data.components)) return json;
    let totalVertsRemoved = 0;
    for (const comp of data.components) {
      if (comp.vertices && Array.isArray(comp.vertices) && comp.vertices.length > maxVertsPerComp) {
        totalVertsRemoved += comp.vertices.length - maxVertsPerComp;
        comp.vertices = comp.vertices.slice(0, maxVertsPerComp);
      }
    }
    return JSON.stringify(data);
  } catch { return json; }
}

/** 尝试保存到localStorage，超出配额时自动降级 */
function saveToLocalStorage(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (e: any) {
    if (e.name === 'QuotaExceededError' || e.code === 22 || e.code === 1014) {
      return false;
    }
    throw e; // 非配额错误重新抛出
  }
}

// 保存动画overlay引用
const saveAnimating = ref(false);

async function confirmSave() {
  if (!saveForm.value.modelName.trim()) { alert('请输入模型名称'); return; }
  saveAnimating.value = true;
  try {
    let json = sceneManager?.exportToJSON();
    if (!json) { saveAnimating.value = false; alert('模型数据为空'); return; }

    // === 本地存储：处理配额问题 ===
    const originalSize = json.length;
    const localModel = {
      model_id: -(Date.now()),
      model_name: saveForm.value.modelName.trim(),
      model_data: json,
      thumbnail_url: '',
      is_public: saveForm.value.isPublic,
      created_at: new Date().toISOString(),
      component_count: sceneManager?.getAllComponents().length || 0,
    };

    // 尝试1：完整数据
    let existing = JSON.parse(localStorage.getItem('atca_local_models') || '[]');
    existing.unshift(localModel);
    let localSaved = saveToLocalStorage('atca_local_models', JSON.stringify(existing.slice(0, 20)));

    // 尝试2：截断vertices（每个组件最多5000顶点）
    if (!localSaved) {
      const trimmedJson = trimModelDataForStorage(json, 5000);
      localModel.model_data = trimmedJson;
      existing = JSON.parse(localStorage.getItem('atca_local_models') || '[]');
      existing.unshift(localModel);
      localSaved = saveToLocalStorage('atca_local_models', JSON.stringify(existing.slice(0, 10))); // 减少到10个
    }

    // 尝试3：只保留模型元信息（不存vertices）
    if (!localSaved) {
      const minimalJson = trimModelDataForStorage(json, 500);
      localModel.model_data = minimalJson;
      existing = JSON.parse(localStorage.getItem('atca_local_models') || '[]');
      existing.unshift(localModel);
      localSaved = saveToLocalStorage('atca_local_models', JSON.stringify(existing.slice(0, 5))); // 减少到5个
    }

    // 尝试4：清空旧数据后重试
    if (!localSaved) {
      console.warn('[Save] localStorage已满，清理旧模型后重试');
      const trimmedJson = trimModelDataForStorage(json, 500);
      localModel.model_data = trimmedJson;
      localSaved = saveToLocalStorage('atca_local_models', JSON.stringify([localModel]));
      if (!localSaved) {
        console.error('[Save] localStorage无法使用，跳过本地缓存');
      }
    }

    // 检查用户是否登录，如果未登录则只保存到本地
    if (!userStore.isLoggedIn) {
      showSaveModal.value = false;
      alert('已保存到本地存储。登录后可以将模型同步到云端。');
      saveAnimating.value = false;
      return;
    }

    // === 登录用户：保存到服务器 ===
    // thumbnail base64数据过长，截断避免数据库截断
    let thumbnail = sceneManager?.takeScreenshot() || '';
    if (thumbnail.length > 250) { thumbnail = thumbnail.substring(0, 250); }

    // 发送到后端
    const res = await model3dApi.saveModel({
      modelName: saveForm.value.modelName.trim(),
      modelData: json,
      thumbnailUrl: thumbnail,
      isPublic: saveForm.value.isPublic,
    });
    showSaveModal.value = false;
    if (res.success) {
      alert('模型保存成功！');
      await loadMyModels();
    } else {
      const msg = localSaved ? '服务器保存失败，但已缓存到本地存储' : '服务器保存失败，本地存储空间不足';
      alert(msg);
    }
  } catch (e: any) {
    console.error('[Workshop] 保存失败:', e);
    alert('保存失败: ' + (e.message || '网络错误'));
    showSaveModal.value = false;
  } finally {
    saveAnimating.value = false;
  }
}

// ===== 加载模型 =====
async function loadModelFromId(modelId: string) {
  if (!sceneManager || !modelId) return;
  try {
    let modelData: string | null = null;
    let modelName = '未命名';

    // 处理模板ID (tpl_123)
    if (modelId.startsWith('tpl_')) {
      const tplId = parseInt(modelId.replace('tpl_', ''));
      if (isNaN(tplId)) { alert('模板ID格式错误'); return; }
      const res = await model3dApi.getTemplate(tplId);
      if (res.success && res.data) {
        modelData = res.data.model_data || null;
        modelName = res.data.template_name || '精选模型';
      } else {
        alert('加载模板失败: ' + ((res as any).error?.message || '未知错误')); return;
      }
    } else {
      // 普通模型ID
      const numericId = parseInt(modelId);
      if (isNaN(numericId)) { alert('模型ID格式错误: ' + modelId); return; }
      const res = await model3dApi.getModel(numericId);
      if (res.success && res.data) {
        modelData = res.data.model_data || null;
        modelName = res.data.model_name || '未命名';
      } else {
        alert('加载模型失败: ' + ((res as any).error?.message || '未知错误')); return;
      }
    }

    if (!modelData) { alert('模型数据为空'); return; }

    const jsonStr = typeof modelData === 'string' ? modelData : JSON.stringify(modelData);

    // 尝试解析JSON（编辑器原生格式）
    let parsed: any = null;
    let isValidJSON = false;
    try {
      parsed = JSON.parse(jsonStr);
      isValidJSON = true;
    } catch {
      // 不是JSON格式，可能是OBJ/MTL文本
      isValidJSON = false;
    }

    if (isValidJSON && parsed && (parsed.components || parsed.version)) {
      // 原生JSON编辑器格式
      sceneManager.importFromJSON(jsonStr);
      const compCount = parsed.components?.length || 0;
      alert(`已加载模型: ${modelName}${compCount > 0 ? ' (' + compCount + '个构件)' : ''}`);
      saveHistory();
      refreshComponents();
    } else if (!isValidJSON && /\nv\s/.test('\n' + jsonStr)) {
      // OBJ格式 — 检测内容中是否包含 "\nv " 行（支持 # 注释开头）
      await loadOBJFromText(jsonStr, modelName);
    } else if (!isValidJSON && jsonStr.includes('newmtl')) {
      // MTL材质文件 — 提示用户需要同时导入OBJ
      alert('检测到MTL材质文件，请同时导入对应的OBJ文件。MTL文件不包含几何数据。');
    } else {
      // 未知格式 — 尝试作为OBJ处理（某些OBJ可能以mtllib等开头）
      if (!isValidJSON && (jsonStr.includes('\nv ') || jsonStr.includes('mtllib') || jsonStr.includes('usemtl'))) {
        await loadOBJFromText(jsonStr, modelName);
      } else {
        alert('模型数据格式不支持。支持：编辑器JSON格式、Wavefront OBJ格式');
      }
    }
  } catch (e: any) {
    console.error('[Workshop] 加载模型失败:', e);
    alert('加载模型失败: ' + (e.message || '未知错误'));
  }
}

/** 从OBJ文本加载模型到编辑器 — 保留原始o/g对象分组，解决组件融合问题 */
async function loadOBJFromText(objText: string, modelName: string) {
  if (!sceneManager) return;

  // 创建进度提示
  const progressDiv = document.createElement('div');
  progressDiv.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;flex-direction:column;gap:16px;color:#fff;font-family:sans-serif;';
  progressDiv.innerHTML = `<div style="font-size:1.25rem;font-weight:600;">正在解析 OBJ 模型...</div><div id="obj-progress-detail" style="font-size:0.875rem;color:#ccc;">读取文件中</div><div style="width:300px;height:6px;background:rgba(255,255,255,0.2);border-radius:3px;overflow:hidden;"><div id="obj-progress-bar" style="width:0%;height:100%;background:#c9a96e;transition:width 0.3s;"></div></div>`;
  document.body.appendChild(progressDiv);

  const progressBar = progressDiv.querySelector('#obj-progress-bar') as HTMLDivElement;
  const progressDetail = progressDiv.querySelector('#obj-progress-detail') as HTMLDivElement;
  function updateProgress(pct: number, text: string) {
    if (progressBar) progressBar.style.width = pct + '%';
    if (progressDetail) progressDetail.textContent = text;
  }

  try {
    await new Promise(r => setTimeout(r, 50));

    const lines = objText.split('\n');
    const totalLines = lines.length;

    // === 阶段1: 统计v和f数量 + 检测对象分组 ===
    updateProgress(5, '分析文件结构...');
    let vCount = 0, fCount = 0;
    let hasObjectGroups = false;
    for (let i = 0; i < totalLines; i++) {
      const line = lines[i];
      if (line.length < 2) continue;
      const c0 = line.charCodeAt(0), c1 = line.charCodeAt(1);
      if (c0 === 118 && c1 === 32) vCount++;           // 'v '
      else if (c0 === 102 && c1 === 32) fCount++;      // 'f '
      else if (c0 === 111 && c1 === 32) hasObjectGroups = true; // 'o '
      else if (c0 === 103 && c1 === 32) hasObjectGroups = true; // 'g '
    }
    updateProgress(10, `发现 ${vCount.toLocaleString()} 顶点, ${fCount.toLocaleString()} 面${hasObjectGroups ? ', 含对象分组' : ''}`);
    await new Promise(r => setTimeout(r, 10));

    // === 阶段2: 解析顶点 ===
    updateProgress(12, '解析顶点数据...');
    const vertCoords = new Float32Array(vCount * 3);
    let vIdx = 0;
    for (let i = 0; i < totalLines; i++) {
      const line = lines[i];
      if (line.length < 3) continue;
      const c0 = line.charCodeAt(0), c1 = line.charCodeAt(1);
      if (c0 === 118 && c1 === 32) { // 'v '
        let si = 2;
        while (si < line.length && line.charCodeAt(si) === 32) si++;
        let ni = 0;
        for (let ci = si; ci <= line.length && ni < 3; ci++) {
          if (ci === line.length || line.charCodeAt(ci) === 32 || line.charCodeAt(ci) === 9) {
            if (ci > si) { vertCoords[vIdx * 3 + ni] = parseFloat(line.substring(si, ci)); ni++; }
            si = ci + 1;
            while (si < line.length && (line.charCodeAt(si) === 32 || line.charCodeAt(si) === 9)) si++;
            ci = si - 1;
          }
        }
        vIdx++;
      }
      if ((i & 0x3FFF) === 0) {
        updateProgress(12 + Math.floor((i / totalLines) * 18), `解析顶点... ${vIdx.toLocaleString()} / ${vCount.toLocaleString()}`);
        await new Promise(r => setTimeout(r, 0));
      }
    }

    if (vCount === 0) {
      document.body.removeChild(progressDiv);
      alert('OBJ文件中没有找到顶点数据'); return;
    }

    // === 阶段3: 计算包围盒和缩放 ===
    updateProgress(32, '计算包围盒...');
    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
    for (let i = 0; i < vCount; i++) {
      const x = vertCoords[i * 3], y = vertCoords[i * 3 + 1], z = vertCoords[i * 3 + 2];
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y; if (y > maxY) maxY = y;
      if (z < minZ) minZ = z; if (z > maxZ) maxZ = z;
    }
    const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2, cz = (minZ + maxZ) / 2;
    const size = Math.max(maxX - minX, maxY - minY, maxZ - minZ) || 1;
    const scale = 20 / size;

    const convertedVerts = new Float32Array(vCount * 3);
    for (let i = 0; i < vCount; i++) {
      convertedVerts[i * 3]     = (vertCoords[i * 3] - cx) * scale;
      convertedVerts[i * 3 + 1] = (vertCoords[i * 3 + 1] - cy) * scale;
      convertedVerts[i * 3 + 2] = (vertCoords[i * 3 + 2] - cz) * scale;
    }
    // 重新计算包围盒（转换后）
    let tMinX = Infinity, tMinY = Infinity, tMinZ = Infinity;
    let tMaxX = -Infinity, tMaxY = -Infinity, tMaxZ = -Infinity;
    for (let i = 0; i < vCount; i++) {
      const x = convertedVerts[i * 3], y = convertedVerts[i * 3 + 1], z = convertedVerts[i * 3 + 2];
      if (x < tMinX) tMinX = x; if (x > tMaxX) tMaxX = x;
      if (y < tMinY) tMinY = y; if (y > tMaxY) tMaxY = y;
      if (z < tMinZ) tMinZ = z; if (z > tMaxZ) tMaxZ = z;
    }
    const tCx = (tMinX + tMaxX) / 2;
    const tCy = tMinY;
    const tCz = (tMinZ + tMaxZ) / 2;

    // === 阶段4: 按原始 o/g 分组解析面数据 ===
    updateProgress(35, hasObjectGroups ? '按对象分组解析面数据...' : '解析面数据...');

    /** 单个面的数据 */
    interface FaceData { verts: number[]; vCount: number; }
    /** 一个对象/组的面列表 */
    interface ObjectGroup { name: string; faces: FaceData[]; }

    const objectGroups: ObjectGroup[] = [];
    let currentGroup: ObjectGroup | null = null;
    let defaultGroupName = modelName;
    let unnamedIdx = 0;

    // 创建或切换到指定名称的组
    function ensureGroup(name: string) {
      let g = objectGroups.find(og => og.name === name);
      if (!g) { g = { name, faces: [] }; objectGroups.push(g); }
      currentGroup = g;
    }

    // 解析一个'f'行，返回顶点索引数组
    function parseFaceLine(line: string): number[] | null {
      const vertIdxs: number[] = [];
      let si = 2;
      while (si < line.length && (line.charCodeAt(si) === 32 || line.charCodeAt(si) === 9)) si++;
      for (let ci = si; ci <= line.length; ci++) {
        if (ci === line.length || line.charCodeAt(ci) === 32 || line.charCodeAt(ci) === 9) {
          if (ci > si) {
            let endIdx = ci;
            for (let k = si; k < ci; k++) {
              if (line.charCodeAt(k) === 47) { endIdx = k; break; }
            }
            const vIdx0 = parseInt(line.substring(si, endIdx));
            const actualIdx = vIdx0 < 0 ? vCount + vIdx0 : vIdx0 - 1;
            if (actualIdx >= 0 && actualIdx < vCount) vertIdxs.push(actualIdx);
          }
          si = ci + 1;
          while (si < line.length && (line.charCodeAt(si) === 32 || line.charCodeAt(si) === 9)) si++;
          ci = si - 1;
        }
      }
      return vertIdxs.length >= 3 ? vertIdxs : null;
    }

    let fParsed = 0;
    for (let i = 0; i < totalLines; i++) {
      const line = lines[i];
      if (line.length < 2) continue;
      const c0 = line.charCodeAt(0), c1 = line.charCodeAt(1), c2 = line.charCodeAt(2);

      if (hasObjectGroups && (c0 === 111 || c0 === 103) && c1 === 32) {
        // 'o ' 或 'g ' — 切换对象/组
        const objName = line.substring(2).trim() || `${defaultGroupName}_${unnamedIdx++}`;
        ensureGroup(objName);
      } else if (c0 === 102 && c1 === 32) {
        // 'f ' — 解析面
        if (!currentGroup) ensureGroup(defaultGroupName);
        const vIdxs = parseFaceLine(line);
        if (vIdxs) {
          currentGroup!.faces.push({ verts: vIdxs, vCount: vIdxs.length });
          fParsed++;
        }
      }

      if ((i & 0x3FFF) === 0) {
        const groupInfo = hasObjectGroups ? ` | ${objectGroups.length} 个对象` : '';
        updateProgress(35 + Math.floor((i / totalLines) * 25), `解析面... ${fParsed.toLocaleString()} / ${fCount.toLocaleString()}${groupInfo}`);
        await new Promise(r => setTimeout(r, 0));
      }
    }

    // 确保至少有一个组
    if (objectGroups.length === 0) {
      ensureGroup(defaultGroupName);
    }

    // === 阶段5: 为每个对象组三角化并生成独立组件 ===
    updateProgress(62, `三角化 ${objectGroups.length} 个对象组...`);

    const MAX_TRIS_PER_COMPONENT = 12000; // 单组件最大三角形数（防止过大）

    const components: any[] = [];

    for (let gi = 0; gi < objectGroups.length; gi++) {
      const group = objectGroups[gi];

      // 三角化：每个多边形面拆分为三角形
      const triIndices: number[] = [];
      for (const face of group.faces) {
        const vIdxs = face.verts;
        const v0 = vIdxs[0];
        for (let vi = 1; vi < vIdxs.length - 1; vi++) {
          triIndices.push(v0, vIdxs[vi], vIdxs[vi + 1]);
        }
      }
      const totalTris = Math.floor(triIndices.length / 3);
      if (totalTris === 0) continue;

      // 如果三角形数超过上限，拆分为多个子组件
      const numSubComponents = Math.ceil(totalTris / MAX_TRIS_PER_COMPONENT);
      for (let si = 0; si < numSubComponents; si++) {
        const startTri = si * MAX_TRIS_PER_COMPONENT;
        const endTri = Math.min(startTri + MAX_TRIS_PER_COMPONENT, totalTris);
        const batchVerts: number[][] = [];

        for (let ti = startTri; ti < endTri; ti++) {
          const i0 = triIndices[ti * 3];
          const i1 = triIndices[ti * 3 + 1];
          const i2 = triIndices[ti * 3 + 2];
          batchVerts.push([convertedVerts[i0 * 3] - tCx, convertedVerts[i0 * 3 + 1] - tCy, convertedVerts[i0 * 3 + 2] - tCz]);
          batchVerts.push([convertedVerts[i1 * 3] - tCx, convertedVerts[i1 * 3 + 1] - tCy, convertedVerts[i1 * 3 + 2] - tCz]);
          batchVerts.push([convertedVerts[i2 * 3] - tCx, convertedVerts[i2 * 3 + 1] - tCy, convertedVerts[i2 * 3 + 2] - tCz]);
        }

        const subName = numSubComponents > 1 ? `${group.name}_part${si + 1}` : group.name;
        components.push({
          id: `obj_${gi}_${si}`,
          name: subName,
          type: 'mesh',
          vertices: batchVerts,
          color: '#c9a96e',
          position: [0, 0, 0],
        });
      }

      if ((gi & 3) === 0) {
        updateProgress(62 + Math.floor((gi / objectGroups.length) * 20), `处理对象... ${gi + 1} / ${objectGroups.length} (${group.name})`);
        await new Promise(r => setTimeout(r, 0));
      }
    }

    // === 阶段6: 导入到编辑器 ===
    updateProgress(85, '导入编辑器...');
    await new Promise(r => setTimeout(r, 10));

    if (components.length === 0) {
      // 没有面数据，创建点云
      const pointBatch: number[][] = [];
      for (let i = 0; i < vCount; i++) {
        pointBatch.push([convertedVerts[i * 3] - tCx, convertedVerts[i * 3 + 1] - tCy, convertedVerts[i * 3 + 2] - tCz]);
      }
      components.push({ id: 'obj_point_cloud', name: modelName, type: 'mesh', vertices: pointBatch, color: '#c9a96e', position: [0, 0, 0] });
    }

    const editorJSON = JSON.stringify({ version: '1.2', components });
    sceneManager.importFromJSON(editorJSON);
    document.body.removeChild(progressDiv);

    const totalTrisAll = components.reduce((sum: number, c: any) => sum + (c.vertices?.length || 0) / 3, 0);
    const groupCount = objectGroups.filter(g => g.faces.length > 0).length;
    alert(`已加载 OBJ 模型: ${modelName}\n顶点: ${vCount.toLocaleString()} | 三角面: ${Math.floor(totalTrisAll).toLocaleString()} | 原始对象: ${groupCount} | 组件: ${components.length}`);
    saveHistory();
    refreshComponents();
  } catch (e: any) {
    if (progressDiv.parentNode) document.body.removeChild(progressDiv);
    console.error('[Workshop] OBJ解析失败:', e);
    alert('OBJ解析失败: ' + (e.message || '未知错误'));
  }
}

async function loadTemplates() {
  try { const res = await model3dApi.getTemplates(); if (res.success) templates.value = res.data; } catch (e) { console.error(e); }
}

function loadTemplate(tpl: any) {
  showTemplates.value = false;
  alert($t('workshop.templateLoaded') + ': ' + tpl.template_name);
}

function clearScene() {
  if (!confirm('确定要清空所有构件吗？')) return;
  sceneManager?.clearScene();
  selectedComponent.value = null;
  selectedUuids.value = [];
  saveHistory();
  refreshComponents();
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
}

function handleFullscreenChange() {
  isFullscreen.value = !!document.fullscreenElement;
  if (isFullscreen.value) {
    leftPanelVisible.value = false;
    rightPanelVisible.value = false;
  } else {
    leftPanelVisible.value = true;
    rightPanelVisible.value = true;
  }
  // 触发窗口resize事件，确保布局正确更新
  setTimeout(() => {
    window.dispatchEvent(new Event('resize'));
  }, 100);
}

function toggleLeftPanel() {
  leftPanelVisible.value = !leftPanelVisible.value;
}

function toggleRightPanel() {
  rightPanelVisible.value = !rightPanelVisible.value;
}

// ===== 撤销重做 =====
function undo() {
  if (historyIndex.value > 0) { historyIndex.value--; restoreHistory(historyStack.value[historyIndex.value]); }
}

function redo() {
  if (historyIndex.value < historyStack.value.length - 1) { historyIndex.value++; restoreHistory(historyStack.value[historyIndex.value]); }
}

function saveHistory() {
  const state = JSON.parse(JSON.stringify(sceneManager?.getAllComponents() || []));
  historyStack.value = historyStack.value.slice(0, historyIndex.value + 1);
  historyStack.value.push(state);
  historyIndex.value++;
}

function restoreHistory(state: SceneComponent[]) {
  sceneManager?.clearScene();
  state.forEach((comp) => sceneManager?.addComponent(comp));
  refreshComponents();
}

// ===== 刷新状态 =====
function refreshComponents() {
  allComponents.value = sceneManager?.getAllComponents() || [];
  selectedUuids.value = sceneManager?.getSelected() || [];
  const selUuid = selectedUuids.value[0];
  if (selUuid && selectedUuids.value.length === 1) {
    selectedComponent.value = sceneManager?.getComponent(selUuid) || null;
    // 同步材质值
    if (selectedComponent.value?.material) {
      const m = selectedComponent.value.material;
      materialValues.value = {
        roughness: m.roughness ?? 0.8,
        metalness: m.metalness ?? 0.1,
        opacity: m.opacity ?? 1,
        colorHex: '#' + (m.color ?? 0x8B6E4D).toString(16).padStart(6, '0'),
      };
    }
  } else {
    selectedComponent.value = null;
  }
  stats.value = sceneManager?.getStats() || { componentCount: 0, vertexCount: 0, faceCount: 0, selectedCount: 0 };
}

// ===== 键盘 =====
function onKeyDown(e: KeyboardEvent) {
  if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
  if (e.key === 'm' || e.key === 'M') { e.preventDefault(); toggleMeasure(); }
  if (e.key === 'n' || e.key === 'N') { e.preventDefault(); triggerSnap(); }
}

// ===== i18n helper =====
function $t(key: string): string {
  const messages: Record<string, string> = {
    'workshop.components': '\u6784\u4ef6',
    'workshop.vertices': '\u9876\u70b9',
    'workshop.faces': '\u9762',
    'workshop.selected': '\u9009\u4e2d',
    'workshop.tool': '\u5de5\u5177',
    'workshop.v2pro': 'v2pro',
    'workshop.sceneTree': '\u573a\u666f\u6811',
    'workshop.searchComponent': '\u641c\u7d22\u6784\u4ef6...',
    'workshop.quickBuild': '\u5feb\u901f\u6784\u5efa',
    'workshop.properties': '\u5c5e\u6027',
    'workshop.sceneSettings': '\u573a\u666f\u8bbe\u7f6e',
    'workshop.position': '\u4f4d\u7f6e',
    'workshop.rotation': '\u65cb\u8f6c',
    'workshop.scale': '\u7f29\u653e',
    'workshop.material': '\u6750\u8d28',
    'workshop.roughness': '\u7c97\u7cd9\u5ea6',
    'workshop.metalness': '\u91d1\u5c5e\u5ea6',
    'workshop.opacity': '\u900f\u660e\u5ea6',
    'workshop.color': '\u989c\u8272',
    'workshop.snapGround': '\u8d34\u5730',
    'workshop.alignCenter': '\u5c45\u4e2d',
    'workshop.resetRotation': '\u91cd\u7f6e\u65cb\u8f6c',
    'workshop.rotate90': '\u65cb\u8f6c90\u00b0',
    'workshop.clone': '\u514b\u9686',
    'workshop.delete': '\u5220\u9664',
    'workshop.noComponent': '\u8bf7\u9009\u62e9\u4e00\u4e2a\u6784\u4ef6\u4ee5\u7f16\u8f91\u5c5e\u6027',
    'workshop.emptyScene': '\u573a\u666f\u4e3a\u7a7a',
    'workshop.bgColor': '\u80cc\u666f\u8272',
    'workshop.gridSize': '\u7f51\u683c\u5927\u5c0f',
    'workshop.gridVisible': '\u663e\u793a\u7f51\u683c',
    'workshop.lightIntensity': '\u4e3b\u5149\u7167\u5ea6',
    'workshop.ambientIntensity': '\u73af\u5883\u5149\u7167\u5ea6',
    'workshop.perspective': '\u900f\u89c6',
    'workshop.topView': '\u9876\u89c6',
    'workshop.frontView': '\u6b63\u89c6',
    'workshop.import': '\u5bfc\u5165',
    'workshop.exportJSON': 'JSON',
    'workshop.exportGLTF': 'GLTF',
    'workshop.save': '\u4fdd\u5b58',
    'workshop.selectTemplate': '\u9009\u62e9\u6a21\u677f',
    'workshop.templateLoaded': '\u5df2\u52a0\u8f7d\u6a21\u677f',
    'workshop.undo': '\u64a4\u9500',
    'workshop.redo': '\u91cd\u505a',
    'workshop.clear': '\u6e05\u7a7a',
    'workshop.snap': '\u5438\u9644',
    'workshop.freeMode': '\u81ea\u7531',
    'workshop.guidedMode': '\u5f15\u5bfc',
    'workshop.templateMode': '\u6a21\u677f',
    'workshop.move': '\u79fb\u52a8',
    'workshop.selectTool': '\u9009\u62e9',
    'workshop.moveTool': '\u79fb\u52a8',
    'workshop.rotateTool': '\u65cb\u8f6c',
    'workshop.scaleTool': '\u7f29\u653e',
    'workshop.del': '\u5220\u9664',
    'workshop.multiSelect': '\u591a\u9009',
    'workshop.click': '\u70b9\u51fb',
    'workshop.measureHint': '\u6d4b\u91cf\u6a21\u5f0f\uff1a\u70b9\u51fb\u573a\u666f\u6d4b\u91cf\u8ddd\u79bb',
    'workshop.measureClick': '\u70b9\u51fb\u6dfb\u52a0\u6d4b\u91cf\u70b9',
    'workshop.clearMeasure': '\u6e05\u9664',
    'workshop.exitMeasure': '\u9000\u51fa',
  };
  return messages[key] || key;
}

// ===== 生命周期 =====
onMounted(async () => {
  if (canvasContainer.value) {
    sceneManager = new SceneManager(canvasContainer.value);
    sceneManager.setBuildMode(buildMode.value);
    sceneManager.onSelect((uuids: string[]) => { refreshComponents(); });
    sceneManager.onTransform(() => { refreshComponents(); });
    sceneManager.onUndo(() => { undo(); });
    sceneManager.onRedo(() => { redo(); });
    sceneManager.onClone(() => { cloneSelected(); });
    sceneManager.onDelete(() => { deleteSelected(); });
    sceneManager.onToolChange(() => { transformMode.value = sceneManager?.getTransformMode() || 'select'; });
    sceneManager.onLongPressPlace((position: any) => {
      // 在长按位置放置当前选中的构件类型
      if (selectedDef.value) {
        addComponent(selectedDef.value, { x: position.x, y: position.y, z: position.z });
      }
    });
    await loadTemplates();
    await loadMyModels(); // 加载数据库中的模型列表（与个人信息页同步）

    // 恢复访客模型（登录后返回）
    const guestModel = localStorage.getItem('atca_workshop_guest_model');
    if (guestModel && userStore.isLoggedIn) {
      try {
        sceneManager?.importFromJSON(guestModel);
        localStorage.removeItem('atca_workshop_guest_model');
        localStorage.removeItem('atca_workshop_guest_name');
      } catch (e) { console.error('[Workshop] 恢复访客模型失败:', e); }
    }

    // 从URL参数设置搭建模式（?mode=free 或 ?mode=real）
    const params = new URLSearchParams(window.location.search);
    const modeParam = params.get('mode');
    if (modeParam === 'free' || modeParam === 'real') {
      buildMode.value = modeParam;
      sceneManager?.setBuildMode(modeParam);
      if (modeParam === 'real') showRules.value = true;
    }
    // 从URL参数加载模型（?load=123）
    const loadId = params.get('load');
    if (loadId) {
      setTimeout(() => { loadModelFromId(loadId); }, 300);
    }
  }
  window.addEventListener('keydown', onKeyDown);
  document.addEventListener('fullscreenchange', handleFullscreenChange);
});

onUnmounted(() => {
  sceneManager?.destroy();
  sceneManager = null;
  window.removeEventListener('keydown', onKeyDown);
  document.removeEventListener('fullscreenchange', handleFullscreenChange);
});
</script>

<style scoped>
.page { min-height: 100vh; display: flex; flex-direction: column; }

.workshop-layout {
  display: flex;
  flex: 1;
  height: calc(100vh - 68px - 28px);
  min-height: 500px;
  padding-top: 68px;
  position: relative;
  transition: all 0.3s ease;
}

/* ===== 面板 ===== */
.panel {
  width: 290px;
  background: linear-gradient(180deg, var(--bg-card) 0%, var(--bg-light) 100%);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  overflow: hidden;
  box-shadow: 2px 0 12px rgba(0, 0, 0, 0.2);
  transition: transform 0.3s ease, opacity 0.3s ease;
}
.panel-right {
  border-right: none;
  border-left: 1px solid var(--border);
}
.panel-section {
  border-bottom: 1px solid var(--border-light);
  flex-shrink: 0;
  background: var(--bg-card);
  display: flex;
  flex-direction: column;
  max-height: 50vh;
  overflow: hidden;
}
.panel-section:last-child { 
  border-bottom: none; 
  flex: 1; 
  display: flex; 
  flex-direction: column; 
  background: transparent;
  max-height: none;
}
.panel-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 14px;
  background: linear-gradient(180deg, rgba(139, 37, 0, 0.02) 0%, transparent 100%);
  border-bottom: 1px solid var(--border-light);
  cursor: pointer;
  user-select: none;
  transition: all var(--t);
  position: relative;
}
.panel-header::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 16px;
  background: var(--gold);
  border-radius: 0 2px 2px 0;
  opacity: 0;
  transition: opacity var(--t);
}
.panel-header:hover::before { opacity: 1; }
.panel-header:hover { 
  background: rgba(var(--gold-rgb), 0.04);
  border-bottom-color: rgba(var(--gold-rgb), 0.2);
}
.panel-header h3 {
  flex: 1;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--text);
  letter-spacing: 0.02em;
}
.panel-header svg { 
  color: var(--text-muted); 
  flex-shrink: 0;
  transition: color var(--t);
}
.panel-header:hover svg { color: var(--gold); }
.collapse-arrow {
  font-size: 0.625rem;
  color: var(--text-muted);
  transition: all var(--t);
}
.collapse-arrow.collapsed { 
  transform: rotate(-90deg); 
  opacity: 0.6;
}
.panel-body {
  padding: 12px;
  overflow-y: auto;
  overflow-x: hidden;
  flex: 1;
  min-height: 0;
}
.tree-body { padding: 6px; }

/* ===== 搜索 ===== */
.search-box { margin-bottom: 12px; position: relative; }
.search-input {
  width: 100%;
  padding: 8px 12px 8px 32px;
  border: 1px solid var(--border);
  border-radius: var(--r-md);
  font-size: 0.75rem;
  background: var(--bg);
  color: var(--text);
  transition: all var(--t);
}
.search-input:focus { 
  outline: none; 
  border-color: var(--gold); 
  box-shadow: 0 0 0 3px rgba(var(--gold-rgb), 0.1);
}
.search-box::before {
  content: '';
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  width: 14px;
  height: 14px;
  background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='14' height='14'%3E%3Cpath d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' stroke='%239ca3af' fill='none' stroke-width='1.5'/%3E%3C/svg%3E") no-repeat center;
}

/* ===== 快速构建 ===== */
.quick-build-section { margin-bottom: 14px; }
.section-label { 
  font-size: 0.625rem; 
  font-weight: 600; 
  color: var(--text-muted); 
  margin-bottom: 8px; 
  text-transform: uppercase; 
  letter-spacing: 0.06em;
  display: flex;
  align-items: center;
  gap: 6px;
}
.section-label::before {
  content: '';
  width: 8px;
  height: 1px;
  background: var(--gold);
}
.quick-build-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
.quick-btn { 
  display: flex; 
  flex-direction: column; 
  align-items: center; 
  gap: 4px; 
  padding: 10px 4px; 
  border-radius: var(--r-md); 
  background: linear-gradient(180deg, var(--bg-card) 0%, var(--bg-light) 100%);
  border: 1px solid var(--border-light); 
  cursor: pointer; 
  transition: all var(--t);
  position: relative;
  overflow: hidden;
}
.quick-btn::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(var(--gold-rgb), 0.08) 0%, rgba(var(--gold-rgb), 0.02) 100%);
  opacity: 0;
  transition: opacity var(--t);
}
.quick-btn:hover::before { opacity: 1; }
.quick-btn:hover { 
  border-color: var(--gold); 
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(var(--gold-rgb), 0.12);
}
.qb-icon { font-size: 1.25rem; transition: transform var(--t); }
.quick-btn:hover .qb-icon { transform: scale(1.1); }
.qb-name { font-size: 0.6875rem; color: var(--text-muted); font-weight: 500; }

.divider { 
  height: 1px; 
  background: linear-gradient(90deg, transparent 0%, var(--border-light) 20%, var(--border-light) 80%, transparent 100%); 
  margin: 12px 0; 
}

/* ===== 分类标签 ===== */
.category-tabs { display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 10px; }
.cat-tab { 
  padding: 4px 10px; 
  border-radius: 20px; 
  font-size: 0.6875rem; 
  font-weight: 500;
  background: var(--bg-hover); 
  color: var(--text-muted); 
  transition: all var(--t);
  border: 1px solid transparent;
}
.cat-tab:hover { 
  background: rgba(var(--gold-rgb), 0.06); 
  color: var(--text);
}
.cat-tab.active { 
  background: rgba(139, 37, 0, 0.1); 
  color: var(--c-red);
  border-color: rgba(139, 37, 0, 0.2);
}

.component-list { display: flex; flex-direction: column; gap: 4px; }
.component-item { 
  display: flex; 
  align-items: center; 
  gap: 10px; 
  padding: 10px 12px; 
  border-radius: var(--r-md); 
  cursor: pointer; 
  transition: all var(--t); 
  border: 1px solid transparent;
  position: relative;
  overflow: hidden;
}
.component-item::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: var(--gold);
  transform: scaleY(0);
  transition: transform var(--t);
}
.component-item:hover::before { transform: scaleY(1); }
.component-item:hover { 
  background: rgba(var(--gold-rgb), 0.04);
  border-color: rgba(var(--gold-rgb), 0.15);
}
.component-item.selected { 
  background: rgba(var(--gold-rgb), 0.08); 
  border-color: var(--gold);
  box-shadow: 0 2px 8px rgba(var(--gold-rgb), 0.1);
}
.component-item.selected::before { transform: scaleY(1); }
.comp-dot { 
  width: 12px; 
  height: 12px; 
  border-radius: 3px; 
  flex-shrink: 0; 
  border: 1px solid rgba(0,0,0,0.12);
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
}
.comp-info { display: flex; flex-direction: column; min-width: 0; }
.comp-name { 
  font-size: 0.8125rem; 
  font-weight: 500; 
  white-space: nowrap; 
  overflow: hidden; 
  text-overflow: ellipsis;
  color: var(--text);
}
.comp-desc { 
  font-size: 0.6875rem; 
  color: var(--text-muted); 
  white-space: nowrap; 
  overflow: hidden; 
  text-overflow: ellipsis;
}

/* ===== 构件树 ===== */
.empty-tree { 
  text-align: center; 
  padding: 24px 0; 
  font-size: 0.75rem; 
  color: var(--text-muted);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}
.empty-tree svg { opacity: 0.4; }
.tree-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 8px;
  border-radius: var(--r-sm);
  font-size: 0.75rem;
  cursor: pointer;
  transition: all var(--t);
  user-select: none;
  position: relative;
}
.tree-item::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 2px;
  height: 12px;
  background: var(--gold);
  border-radius: 0 1px 1px 0;
  opacity: 0;
  transition: opacity var(--t);
}
.tree-item:hover { 
  background: rgba(var(--gold-rgb), 0.04);
}
.tree-item:hover::before { opacity: 1; }
.tree-item.selected { 
  background: rgba(var(--gold-rgb), 0.1);
  border-left: 2px solid var(--gold);
}
.tree-item.selected::before { opacity: 0; }
.tree-item.hidden .tree-name { opacity: 0.4; text-decoration: line-through; }
.tree-item.locked .tree-name { color: var(--gold); }
.tree-btn { 
  padding: 3px; 
  border-radius: var(--r-sm); 
  color: var(--text-muted); 
  flex-shrink: 0; 
  display: flex; 
  align-items: center;
  transition: all var(--t);
}
.tree-btn:hover { 
  color: var(--gold); 
  background: rgba(var(--gold-rgb), 0.1);
  transform: scale(1.1);
}
.tree-name { 
  flex: 1; 
  overflow: hidden; 
  text-overflow: ellipsis; 
  white-space: nowrap;
  color: var(--text);
}

/* ===== 画布区 ===== */
.canvas-area { 
  flex: 1; 
  display: flex; 
  flex-direction: column; 
  position: relative; 
  min-width: 0;
  min-height: 0;
  width: 100%;
}

.fullscreen-mode .canvas-area {
  height: 100%;
  width: 100%;
  min-height: 100%;
}

/* ===== 工具栏 ===== */
.toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: linear-gradient(180deg, var(--bg-card) 0%, rgba(var(--gold-rgb), 0.02) 100%);
  border-bottom: 1px solid var(--border-light);
  overflow-x: auto;
  flex-shrink: 0;
  position: relative;
}
.toolbar::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent 0%, rgba(var(--gold-rgb), 0.1) 50%, transparent 100%);
}
.toolbar-group { display: flex; gap: 3px; }
.toolbar-divider { 
  width: 1px; 
  height: 26px; 
  background: var(--border-light); 
  flex-shrink: 0;
  border-radius: 1px;
}
.tool-btn {
  padding: 6px 11px;
  border-radius: var(--r-md);
  font-size: 0.7rem;
  background: transparent;
  color: var(--text-muted);
  white-space: nowrap;
  transition: all var(--t);
  display: flex;
  align-items: center;
  gap: 4px;
  border: 1px solid transparent;
  position: relative;
}
.tool-btn::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: var(--r-md);
  background: rgba(var(--gold-rgb), 0.06);
  opacity: 0;
  transition: opacity var(--t);
}
.tool-btn:hover { 
  color: var(--text);
}
.tool-btn:hover::before { opacity: 1; }
.tool-btn.active { 
  background: rgba(var(--gold-rgb), 0.15); 
  color: var(--gold); 
  border-color: rgba(139, 37, 0, 0.25);
  box-shadow: 0 2px 8px rgba(139, 37, 0, 0.1);
}
.tool-btn.primary { 
  background: linear-gradient(180deg, var(--gold) 0%, var(--gold-dim) 100%); 
  color: var(--bg); 
  border-color: var(--gold);
  box-shadow: 0 2px 8px rgba(var(--gold-rgb), 0.3);
}
.tool-btn.primary:hover {
  background: linear-gradient(180deg, var(--gold-light) 0%, var(--gold) 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(var(--gold-rgb), 0.4);
}
.tool-btn svg { 
  flex-shrink: 0; 
  transition: transform var(--t);
}
.tool-btn:hover svg { transform: scale(1.1); }
.tool-btn.active svg { transform: scale(1.1); }

/* ===== 3D画布 ===== */
.three-canvas { 
  flex: 1; 
  min-height: 0; 
  min-width: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(180deg, var(--bg) 0%, var(--bg-light) 100%); 
  cursor: crosshair;
  transition: background var(--t);
}

.fullscreen-mode .three-canvas {
  height: 100vh !important;
  width: 100vw !important;
  min-height: 100vh !important;
  min-width: 100vw !important;
}
.three-canvas.measuring { cursor: crosshair; }

/* ===== 选中高亮效果 ===== */
.selected-highlight {
  animation: pulse-glow 2s ease-in-out infinite;
}

@keyframes pulse-glow {
  0%, 100% {
    opacity: 1;
    filter: drop-shadow(0 0 8px rgba(139, 37, 0, 0.3));
  }
  50% {
    opacity: 0.9;
    filter: drop-shadow(0 0 16px rgba(139, 37, 0, 0.5));
  }
}

/* ===== 操作反馈动画 ===== */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
  20%, 40%, 60%, 80% { transform: translateX(4px); }
}

.animate-fadeInUp {
  animation: fadeInUp 0.3s ease-out forwards;
}

.animate-scaleIn {
  animation: scaleIn 0.2s ease-out forwards;
}

.animate-shake {
  animation: shake 0.5s ease-in-out;
}

/* ===== 按钮点击波纹效果 ===== */
.btn-ripple {
  position: relative;
  overflow: hidden;
}

.btn-ripple::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  transition: width 0.4s ease-out, height 0.4s ease-out;
}

.btn-ripple:active::after {
  width: 200px;
  height: 200px;
}

/* ===== 画布提示 ===== */
.canvas-hints {
  position: absolute;
  bottom: 50px;
  left: 10px;
  display: flex;
  gap: 12px;
  font-size: 0.625rem;
  color: var(--text-muted);
  pointer-events: none;
  z-index: 10;
}
.hint-item { display: flex; align-items: center; gap: 2px; }
.hint-item kbd { background: var(--bg-card); border: 1px solid var(--border); border-radius: 3px; padding: 1px 4px; font-size: 0.5625rem; margin-right: 2px; }

/* ===== 测量提示 ===== */
.measure-hint {
  position: absolute;
  top: 8px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  background: rgba(139, 37, 0, 0.9);
  color: white;
  border-radius: var(--r-md);
  font-size: 0.75rem;
  z-index: 50;
}

/* ===== 全屏按钮 ===== */
.fullscreen-btn {
  position: absolute;
  bottom: 50px;
  right: 8px;
  width: 32px;
  height: 32px;
  border-radius: var(--r-md);
  background: var(--bg-card);
  border: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  color: var(--text-muted);
  cursor: pointer;
  transition: all var(--t);
  z-index: 20;
}
.fullscreen-btn:hover { background: var(--c-red); color: white; border-color: var(--c-red); }

/* ===== 全屏模式 ===== */
.fullscreen-mode {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: var(--bg);
  height: 100vh;
  width: 100vw;
}

.fullscreen-mode .workshop-layout {
  height: 100vh !important;
  padding-top: 0 !important;
  position: fixed !important;
  inset: 0 !important;
  margin: 0 !important;
  overflow: hidden !important;
  flex: none !important;
}

.fullscreen-panels {
  position: absolute;
  top: 8px;
  left: 8px;
  display: flex;
  gap: 6px;
  z-index: 100;
}

.panel-toggle-btn {
  width: 36px;
  height: 36px;
  border-radius: var(--r-md);
  background: rgba(var(--bg-card-rgb, 255, 255, 255), 0.95);
  border: 1px solid var(--border-light);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  cursor: pointer;
  transition: all var(--t);
  backdrop-filter: blur(8px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.panel-toggle-btn:hover {
  background: rgba(var(--gold-rgb), 0.1);
  border-color: var(--gold);
  color: var(--gold);
  transform: scale(1.05);
}

.panel-toggle-btn svg {
  transition: transform var(--t);
}

.panel-toggle-btn:hover svg {
  transform: scale(1.1);
}

.panel-hidden {
  width: 0 !important;
  opacity: 0;
  pointer-events: none;
  overflow: hidden;
  border-width: 0 !important;
  box-shadow: none !important;
}

.panel-right.panel-hidden {
  width: 0 !important;
  opacity: 0;
  pointer-events: none;
  overflow: hidden;
  border-width: 0 !important;
  box-shadow: none !important;
}

/* ===== 属性面板 ===== */
.prop-name { 
  font-size: 0.875rem; 
  font-weight: 600; 
  margin-bottom: 14px; 
  padding-bottom: 10px; 
  border-bottom: 1px solid var(--border-light);
  position: relative;
}
.prop-name::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  width: 24px;
  height: 2px;
  background: var(--gold);
  border-radius: 1px;
}
.prop-type { font-size: 0.6875rem; font-weight: 400; color: var(--text-muted); margin-left: 8px; }
.prop-group { margin-bottom: 16px; }
.prop-group-header { 
  font-size: 0.7rem; 
  font-weight: 600; 
  color: var(--text-muted); 
  margin-bottom: 8px; 
  display: flex; 
  align-items: center; 
  gap: 4px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.prop-unit { font-weight: 400; color: var(--text-muted); }
.prop-row { display: grid; grid-template-columns: 20px 1fr 20px 1fr 20px 1fr; gap: 4px; align-items: center; margin-bottom: 6px; }
.prop-row label { 
  font-size: 0.65rem; 
  font-weight: 600; 
  text-align: center; 
  border-radius: 4px; 
  padding: 3px 0;
  transition: all var(--t);
}
.axis-x { background: rgba(239, 68, 68, 0.12); color: #dc2626; }
.axis-y { background: rgba(34, 197, 94, 0.12); color: #16a34a; }
.axis-z { background: rgba(59, 130, 246, 0.12); color: #2563eb; }
.prop-row input { 
  padding: 5px 7px; 
  font-size: 0.7rem; 
  border-radius: var(--r-sm); 
  border: 1px solid var(--border-light); 
  background: var(--color-background); 
  color: var(--text); 
  width: 100%;
  transition: all var(--t);
}
.prop-row input:focus { 
  outline: none; 
  border-color: var(--gold); 
  box-shadow: 0 0 0 2px rgba(var(--gold-rgb), 0.1);
}
.prop-row-btns { display: flex; gap: 5px; margin-top: 6px; }
.snap-btn { 
  flex: 1; 
  padding: 4px 8px; 
  font-size: 0.65rem; 
  background: var(--bg-hover); 
  border: 1px solid var(--border-light); 
  border-radius: var(--r-sm); 
  cursor: pointer; 
  color: var(--text-muted); 
  transition: all var(--t);
}
.snap-btn:hover { 
  background: rgba(var(--gold-rgb), 0.08); 
  border-color: var(--gold); 
  color: var(--c-red);
  transform: translateY(-1px);
}

/* ===== 材质 ===== */
.mat-presets { display: flex; gap: 4px; margin-bottom: 10px; }
.mat-preset-btn { width: 28px; height: 28px; border-radius: var(--r-sm); font-size: 0.5625rem; font-weight: 600; color: white; text-shadow: 0 1px 2px rgba(0,0,0,0.6); border: 2px solid transparent; cursor: pointer; transition: all var(--t); display: flex; align-items: center; justify-content: center; }
.mat-preset-btn.active { border-color: var(--c-red); box-shadow: 0 0 0 1px var(--c-red); }
.mat-preset-btn:hover { transform: scale(1.1); }
.mat-sliders { display: flex; flex-direction: column; gap: 8px; }
.slider-row { display: grid; grid-template-columns: 60px 1fr 28px; gap: 6px; align-items: center; }
.slider-row label { font-size: 0.6875rem; color: var(--text-muted); }
.slider-row span { font-size: 0.625rem; color: var(--text-muted); text-align: right; }
.slider-row input[type="range"] { width: 100%; accent-color: var(--c-red); }
.color-row { display: grid; grid-template-columns: 60px 1fr; gap: 6px; align-items: center; }
.color-row label { font-size: 0.6875rem; color: var(--text-muted); }
.color-row input[type="color"] { width: 100%; height: 28px; border: 1px solid var(--border); border-radius: var(--r-sm); cursor: pointer; }

.prop-actions { display: flex; gap: 8px; margin-top: 14px; padding-top: 10px; border-top: 1px solid var(--border); }
.empty-props { text-align: center; padding: 32px 0; color: var(--text-muted); }
.empty-props p { font-size: 0.75rem; margin-top: 8px; }

/* ===== 场景设置 ===== */
.scene-setting { 
  display: grid; 
  grid-template-columns: 80px 1fr 40px; 
  gap: 10px; 
  align-items: center; 
  margin-bottom: 12px; 
  padding: 8px 10px;
  background: rgba(var(--gold-rgb), 0.03);
  border-radius: var(--r-sm);
  border: 1px solid transparent;
  transition: all var(--t);
}
.scene-setting:hover {
  background: rgba(var(--gold-rgb), 0.06);
  border-color: rgba(var(--gold-rgb), 0.15);
}
.scene-setting label { 
  font-size: 0.7rem; 
  color: var(--text-muted);
  font-weight: 500;
  letter-spacing: 0.02em;
}
.scene-setting span { 
  font-size: 0.65rem; 
  color: var(--gold); 
  text-align: right;
  font-family: var(--font-mono, monospace);
}
.scene-setting input[type="range"] { 
  width: 100%; 
  accent-color: var(--gold);
  height: 4px;
  cursor: pointer;
}
.scene-setting input[type="range"]::-webkit-slider-thumb {
  appearance: none;
  width: 12px;
  height: 12px;
  background: var(--gold);
  border-radius: 50%;
  cursor: pointer;
  transition: all var(--t);
}
.scene-setting input[type="range"]::-webkit-slider-thumb:hover {
  transform: scale(1.2);
  box-shadow: 0 0 8px rgba(var(--gold-rgb), 0.5);
}
.scene-setting input[type="color"] { 
  width: 100%; 
  height: 26px; 
  border: 1px solid var(--border); 
  border-radius: var(--r-sm); 
  cursor: pointer;
  padding: 2px;
}
.scene-setting input[type="color"]::-webkit-color-swatch-wrapper {
  padding: 0;
}
.scene-setting input[type="color"]::-webkit-color-swatch {
  border: none;
  border-radius: 4px;
}
.scene-setting input[type="checkbox"] { 
  accent-color: var(--gold);
  width: 16px;
  height: 16px;
  cursor: pointer;
}

/* ===== 状态栏 ===== */
.status-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px 16px;
  background: linear-gradient(180deg, rgba(var(--gold-rgb), 0.04) 0%, var(--bg-card) 100%);
  border-top: 1px solid var(--border);
  font-size: 0.6875rem;
  color: var(--text-muted);
  flex-shrink: 0;
  position: relative;
  backdrop-filter: blur(8px);
  z-index: 30;
}
.status-bar::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent 0%, rgba(var(--gold-rgb), 0.15) 50%, transparent 100%);
}
.status-divider { 
  width: 1px; 
  height: 14px; 
  background: var(--border-light); 
  border-radius: 1px;
}
.status-item { 
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 4px;
}
.status-item::before {
  content: '';
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--gold);
  opacity: 0.6;
}
.status-right { 
  margin-left: auto; 
  font-size: 0.65rem; 
  opacity: 0.5;
}
.status-right::before {
  display: none;
}

/* ===== 弹窗 ===== */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 200; }
.modal { background: var(--bg-card); border-radius: var(--r-lg); padding: 24px; max-width: 600px; width: 90%; max-height: 80vh; overflow-y: auto; }
.modal h3 { margin-bottom: 16px; }
.template-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
.template-card { padding: 16px; border: 1px solid var(--border); border-radius: var(--r-md); text-align: center; cursor: pointer; transition: all var(--t); }
.template-card:hover { border-color: var(--c-red); }
.template-thumb { height: 80px; background: var(--bg-hover); border-radius: var(--r-sm); margin-bottom: 8px; }

/* ===== 保存弹窗 ===== */
.modal-save { max-width: 420px; }
.save-form { margin: 16px 0; }
.visibility-options { display: flex; gap: 10px; }
.vis-option {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border: 1px solid var(--border);
  border-radius: var(--r-md);
  cursor: pointer;
  transition: all var(--t);
}
.vis-option:hover { border-color: var(--border-light); }
.vis-option.active { border-color: var(--c-red); background: rgba(var(--gold-rgb), 0.04); }
.vis-option svg { flex-shrink: 0; color: var(--text-muted); }
.vis-option.active svg { color: var(--c-red); }
.vis-option div { display: flex; flex-direction: column; }
.vis-option strong { font-size: 0.8125rem; font-weight: 500; }
.vis-option span { font-size: 0.6875rem; color: var(--text-muted); }
.modal-actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 16px; }

/* ===== 按钮 ===== */
.atca-btn-sm { padding: 3px 10px; font-size: 0.6875rem; }

/* ===== 搭建模式切换栏 ===== */
.build-mode-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: var(--bg-card);
  border-bottom: 1px solid var(--border);
  padding: 6px 10px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  flex-shrink: 0;
}
.mode-tabs {
  display: flex;
  gap: 2px;
}
.mode-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 14px;
  border: 1px solid transparent;
  background: transparent;
  color: var(--text-muted);
  font-size: 0.75rem;
  font-weight: 500;
  border-radius: var(--r-md);
  cursor: pointer;
  transition: all var(--t);
  white-space: nowrap;
  font-family: 'Noto Serif SC','STSong',serif;
  letter-spacing: 0.04em;
}
.mode-tab:hover {
  background: rgba(var(--gold-rgb), 0.06);
  color: var(--text);
  border-color: rgba(var(--gold-rgb), 0.2);
}
.mode-tab.active {
  background: rgba(139, 37, 0, 0.12);
  color: var(--c-red);
  border-color: rgba(139, 37, 0, 0.3);
  box-shadow: 0 1px 4px rgba(139, 37, 0, 0.15);
}
.mode-tab svg { flex-shrink: 0; }
.help-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 5px 12px;
  border: 1px solid var(--border);
  background: var(--bg-hover);
  color: var(--text-muted);
  font-size: 0.75rem;
  border-radius: var(--r-md);
  cursor: pointer;
  transition: all var(--t);
  font-family: 'Noto Serif SC','STSong',serif;
}
.help-btn:hover {
  background: rgba(var(--gold-rgb), 0.08);
  color: var(--c-red);
  border-color: rgba(var(--gold-rgb), 0.3);
}

/* ===== 使用指南弹窗 ===== */
.guide-body { padding: 20px; }
.guide-section { margin-bottom: 20px; }
.guide-section:last-child { margin-bottom: 0; }
.guide-section h4 {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 8px;
  padding-bottom: 4px;
  border-bottom: 1px solid var(--border);
}
.guide-section p {
  font-size: 0.8125rem;
  color: var(--text-muted);
  line-height: 1.7;
  margin-bottom: 6px;
}
.guide-section p strong {
  color: var(--c-red);
}
.guide-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
}
.guide-grid span {
  font-size: 0.75rem;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  gap: 6px;
}
.guide-grid kbd {
  display: inline-block;
  min-width: 28px;
  padding: 2px 6px;
  background: var(--bg-hover);
  border: 1px solid var(--border);
  border-radius: var(--r-sm);
  font-size: 0.6875rem;
  font-family: monospace;
  text-align: center;
  color: var(--text);
}

/* ===== 真实搭建规则弹窗 ===== */
.rule-list { display: flex; flex-direction: column; gap: 8px; }
.rule-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 0.8125rem;
  color: var(--text-muted);
  line-height: 1.6;
  padding: 6px 8px;
  background: var(--bg-light);
  border-radius: var(--r-sm);
}
.rule-tag {
  display: inline-block;
  padding: 1px 8px;
  background: rgba(var(--gold-rgb), 0.08);
  color: var(--c-red);
  border-radius: var(--r-sm);
  font-size: 0.6875rem;
  font-weight: 500;
  white-space: nowrap;
  flex-shrink: 0;
}

/* ===== 自由创建模式提示 ===== */
.mode-free-notice {
  position: absolute;
  top: 36px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 15;
  padding: 4px 12px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--r-md);
  font-size: 0.6875rem;
  color: var(--text-muted);
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  white-space: nowrap;
}

/* ===== 真实搭建模式规则警告面板 ===== */
.rule-warnings {
  position: absolute;
  top: 36px;
  right: 16px;
  z-index: 15;
  max-width: 280px;
  max-height: 200px;
  overflow-y: auto;
  background: var(--bg-card);
  border: 1px solid rgba(201, 48, 44, 0.2);
  border-radius: var(--r-md);
  padding: 10px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}
.rule-warnings .warn-title {
  font-size: 0.6875rem;
  font-weight: 600;
  color: var(--c-red);
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  gap: 4px;
}
.rule-warnings .warn-item {
  font-size: 0.6875rem;
  color: var(--text-muted);
  padding: 3px 0;
  border-bottom: 1px solid var(--border);
  line-height: 1.4;
}
.rule-warnings .warn-item:last-child { border-bottom: none; }

/* ===== 保存动画覆盖层 ===== */
.save-loading-overlay {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.92);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  border-radius: var(--r-lg);
  animation: fadeIn 0.2s ease;
}
.save-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: var(--text);
  font-size: 0.875rem;
  font-weight: 500;
}
.save-spinner svg { filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1)); }
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* ===== 导入/导出下拉菜单 ===== */
.io-group { position: relative; }
.io-dropdown { position: relative; display: inline-block; }
.io-dropdown:hover .io-menu { display: flex; }
.io-menu {
  display: none;
  position: absolute;
  top: calc(100% + 4px);
  right: 0;
  flex-direction: column;
  gap: 2px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--r-md);
  padding: 4px;
  z-index: 200;
  box-shadow: 0 4px 16px rgba(0,0,0,0.12);
  min-width: 120px;
}
.io-menu::before {
  content: '';
  position: absolute;
  top: -8px;
  right: 10px;
  width: 12px;
  height: 12px;
  background: var(--bg-card);
  border-left: 1px solid var(--border);
  border-top: 1px solid var(--border);
  transform: rotate(45deg);
}
/* ===== 工具下拉菜单 ===== */
.tool-dropdown { position: relative; display: inline-block; }
.tool-dropdown:hover .tool-menu { display: flex; }
.tool-menu {
  display: none;
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  flex-direction: column;
  gap: 2px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--r-md);
  padding: 4px;
  z-index: 200;
  box-shadow: 0 4px 16px rgba(0,0,0,0.12);
  min-width: 140px;
}
.tool-menu::before {
  content: '';
  position: absolute;
  top: -8px;
  left: 10px;
  width: 12px;
  height: 12px;
  background: var(--bg-card);
  border-left: 1px solid var(--border);
  border-top: 1px solid var(--border);
  transform: rotate(45deg);
}
.tool-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 12px;
  border: none;
  background: transparent;
  color: var(--text);
  font-size: 0.8rem;
  cursor: pointer;
  border-radius: var(--r-sm);
  transition: background var(--t-fast);
}
.tool-item:hover {
  background: var(--bg-hover);
}
.menu-divider {
  height: 1px;
  background: var(--border);
  margin: 4px 0;
}

/* ===== 阵列弹窗样式 ===== */
.modal-sm {
  max-width: 360px;
}
.array-form {
  padding: 16px 0;
}
.array-form .form-row {
  display: flex;
  gap: 12px;
}
.array-form .form-group {
  flex: 1;
}
.array-form .form-group label {
  display: block;
  margin-bottom: 6px;
  font-size: 0.85rem;
  color: var(--text-muted);
}
.array-form .form-group input[type="number"] {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--border);
  border-radius: var(--r-sm);
  background: var(--bg);
  color: var(--text);
  font-size: 0.875rem;
}
.direction-buttons {
  display: flex;
  gap: 8px;
}
.dir-btn {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid var(--border);
  border-radius: var(--r-sm);
  background: var(--bg);
  color: var(--text);
  font-size: 0.8rem;
  cursor: pointer;
  transition: all var(--t-fast);
}
.dir-btn:hover {
  border-color: var(--gold);
  color: var(--gold);
}
.dir-btn.active {
  background: var(--gold);
  border-color: var(--gold);
  color: var(--bg);
}
.array-form .form-group input[type="checkbox"] {
  margin-right: 8px;
  cursor: pointer;
}

.io-item {
  display: block;
  width: 100%;
  padding: 6px 10px;
  border: none;
  border-radius: var(--r-sm);
  background: transparent;
  color: var(--text);
  font-size: 0.75rem;
  cursor: pointer;
  text-align: left;
  white-space: nowrap;
  transition: background var(--t);
}
.io-item:hover { background: var(--bg-hover); }

/* ===== 3D编辑器古建风格增强 ===== */

/* 工具栏 */
.atca-toolbar {
  background: var(--bg-card) !important;
  border-bottom: 1px solid var(--border) !important;
  box-shadow: 0 1px 3px rgba(0,0,0,0.2) !important;
}
.atca-toolbar .tool-btn {
  font-family: 'Noto Serif SC','STSong',serif;
  font-size: 0.8125rem;
  letter-spacing: 0.04em;
  transition: all var(--t);
}
.atca-toolbar .tool-btn:hover {
  background: rgba(var(--gold-rgb), 0.06);
  color: var(--c-red);
}
.atca-toolbar .tool-btn.active {
  background: rgba(var(--gold-rgb), 0.1);
  color: var(--c-red);
  border-color: var(--c-red);
}

/* 侧边栏 */
.atca-sidebar {
  background: var(--bg-card) !important;
  border-right: 1px solid var(--border) !important;
}
.atca-sidebar .sidebar-title {
  font-family: 'Noto Serif SC','STSong',serif;
  font-weight: 600;
  letter-spacing: 0.06em;
}

/* 画布区域 */
.atca-canvas {
  background:
      radial-gradient(ellipse at 20% 50%, rgba(139,37,0,0.015) 0%, transparent 60%),
      radial-gradient(ellipse at 80% 50%, rgba(184,134,11,0.015) 0%, transparent 60%),
      var(--bg-hover) !important;
}

/* 模式切换栏 */
.atca-mode-bar {
  background: rgba(var(--gold-rgb), 0.04) !important;
  border: 1px solid rgba(var(--gold-rgb), 0.15) !important;
}
.atca-mode-bar .mode-tab {
  font-family: 'Noto Serif SC','STSong',serif;
  letter-spacing: 0.06em;
  transition: all var(--t);
}
.atca-mode-bar .mode-tab.active {
  background: var(--c-red) !important;
  color: #fff !important;
  box-shadow: 0 2px 8px rgba(var(--gold-rgb), 0.3);
}

/* 帮助按钮 */
.help-btn {
  font-family: 'Noto Serif SC','STSong',serif;
}

/* 弹出面板 */
.guide-panel, .rules-panel, .modal-content {
  border: 1px solid var(--border) !important;
}
.guide-panel h3, .rules-panel h3 {
  font-family: 'Noto Serif SC','STSong',serif;
}

/* 保存动画 */
.save-spinner span {
  font-family: 'Noto Serif SC','STSong',serif;
}

/* 属性面板 */
.property-panel {
  background: var(--bg-card) !important;
  border-left: 1px solid var(--border) !important;
}

/* 文件上传区 */
.file-drop-zone {
  border: 2px dashed var(--border) !important;
  background: var(--bg-hover) !important;
  transition: all var(--t);
}
.file-drop-zone:hover {
  border-color: var(--c-red) !important;
  background: rgba(var(--gold-rgb), 0.02) !important;
}

/* 组件库 */
.component-list .component-item {
  transition: all var(--t);
  border: 1px solid transparent;
}
.component-list .component-item:hover {
  border-color: var(--border-light);
  background: var(--bg-hover);
}

/* 视图切换按钮 */
.view-switch-btn {
  font-family: 'Noto Serif SC','STSong',serif;
  font-size: 0.75rem;
}

/* ===== 右键菜单 ===== */
.context-menu {
  position: fixed;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--r-md);
  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
  z-index: 1000;
  min-width: 160px;
  overflow: hidden;
}
.context-menu-header {
  padding: 8px 12px;
  background: var(--bg-hover);
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--text);
  border-bottom: 1px solid var(--border);
}
.context-menu-divider {
  height: 1px;
  background: var(--border);
}
.context-menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border: none;
  background: transparent;
  font-size: 0.75rem;
  color: var(--text);
  cursor: pointer;
  width: 100%;
  text-align: left;
  transition: background var(--t);
}
.context-menu-item:hover {
  background: var(--bg-hover);
}
.context-menu-item.danger {
  color: var(--c-red);
}
.context-menu-item.danger:hover {
  background: rgba(var(--red-rgb), 0.08);
}

/* ===== 属性弹窗 ===== */
.property-modal-overlay, .edit-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}
.property-modal, .edit-modal {
  background: var(--bg-card);
  border-radius: var(--r-lg);
  padding: 20px;
  width: 480px;
  max-height: 80vh;
  overflow-y: auto;
}
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border);
}
.modal-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text);
}
.modal-close {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  color: var(--text-muted);
}
.modal-close:hover {
  color: var(--text);
}

.property-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.property-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.property-label {
  font-size: 0.75rem;
  color: var(--text-muted);
}
.property-value {
  font-size: 0.8125rem;
  color: var(--text);
  padding: 8px;
  background: var(--bg-hover);
  border-radius: var(--r-sm);
  font-family: monospace;
}

.snap-points-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.snap-point-item {
  padding: 10px;
  background: var(--bg-hover);
  border-radius: var(--r-sm);
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}
.snap-point-info {
  flex: 1;
}
.snap-point-title {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--text);
  margin-bottom: 4px;
}
.snap-point-details {
  font-size: 0.6875rem;
  color: var(--text-muted);
  line-height: 1.5;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 20px;
  padding-top: 12px;
  border-top: 1px solid var(--border);
}

/* ===== 编辑弹窗表单 ===== */
.edit-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.form-group label {
  font-size: 0.75rem;
  color: var(--text-muted);
  font-weight: 500;
}
.form-group input,
.form-group select {
  padding: 8px 10px;
  border: 1px solid var(--border);
  border-radius: var(--r-sm);
  background: var(--bg-hover);
  font-size: 0.8125rem;
  color: var(--text);
}

.snap-points-editor {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.snap-point-editor-item {
  padding: 12px;
  background: var(--bg-hover);
  border-radius: var(--r-sm);
  border: 1px solid var(--border);
}
.snap-point-editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}
.snap-point-editor-title {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--text);
}
.snap-point-editor-remove {
  background: none;
  border: none;
  color: var(--c-red);
  cursor: pointer;
  font-size: 0.75rem;
}
.snap-point-editor-fields {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.snap-point-editor-fields input {
  width: 100%;
}
.snap-point-editor-fields .full-width {
  grid-column: 1 / -1;
}

.add-snap-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px;
  border: 1px dashed var(--border);
  border-radius: var(--r-sm);
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 0.75rem;
  transition: all var(--t);
}
.add-snap-btn:hover {
  border-color: var(--gold);
  color: var(--gold);
  background: rgba(var(--gold-rgb), 0.02);
}
</style>