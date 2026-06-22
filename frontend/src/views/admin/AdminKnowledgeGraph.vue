<template>
  <div class="knowledge-graph-admin">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-info">
        <h2 class="page-title">知识图谱管理</h2>
        <p class="page-description">管理本地模型的知识图谱数据，包括实体、关系的增删改查及数据导入导出</p>
      </div>
      <div class="header-actions">
        <button class="btn btn-secondary" @click="showImportModal = true">
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path d="M12 4v16m8-8H4" stroke="currentColor" fill="none" stroke-width="1.5"/>
          </svg>
          导入数据
        </button>
        <button class="btn btn-primary" @click="showExportModal = true">
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path d="M12 19V5m0 14l-5-5m5 5l5-5" stroke="currentColor" fill="none" stroke-width="1.5"/>
          </svg>
          导出数据
        </button>
      </div>
    </div>

    <!-- 标签页导航 -->
    <div class="tabs">
      <button 
        v-for="tab in tabs" 
        :key="tab.id"
        class="tab-item"
        :class="{ active: activeTab === tab.id }"
        @click="activeTab = tab.id"
      >
        <svg :viewBox="tab.icon" width="16" height="16">
          <path :d="tab.iconPath" stroke="currentColor" fill="none" stroke-width="1.5"/>
        </svg>
        {{ tab.label }}
        <span v-if="tab.count" class="tab-count">{{ tab.count }}</span>
      </button>
    </div>

    <!-- 主内容区 -->
    <div class="main-content">
      <!-- 图谱可视化区域 -->
      <div v-if="activeTab === 'visualize'" class="visualize-panel">
        <div class="visualize-header">
          <h3>知识图谱可视化</h3>
          <div class="visualize-tools">
            <button class="tool-btn" title="缩放+" @click="zoomIn">
              <svg viewBox="0 0 24 24" width="16" height="16">
                <path d="M12 4v16m8-8H4" stroke="currentColor" fill="none" stroke-width="2"/>
              </svg>
            </button>
            <button class="tool-btn" title="缩放-" @click="zoomOut">
              <svg viewBox="0 0 24 24" width="16" height="16">
                <path d="M4 12h16" stroke="currentColor" fill="none" stroke-width="2"/>
              </svg>
            </button>
            <button class="tool-btn" title="重置" @click="resetView">
              <svg viewBox="0 0 24 24" width="16" height="16">
                <path d="M3 12a9 9 0 1118 0" stroke="currentColor" fill="none" stroke-width="2"/>
                <path d="M9 12l6-3-6-3v6z" stroke="currentColor" fill="none" stroke-width="2"/>
              </svg>
            </button>
            <button class="tool-btn" title="全屏" @click="toggleFullscreen">
              <svg viewBox="0 0 24 24" width="16" height="16">
                <path d="M7 4h10v2H7V4zm0 14h10v2H7v-2zM4 7v10h2V7H4zm14 0v10h2V7h-2z" stroke="currentColor" fill="none" stroke-width="2"/>
              </svg>
            </button>
          </div>
        </div>
        <div class="graph-canvas">
          <div class="graph-placeholder">
            <svg viewBox="0 0 200 200" width="120" height="120" class="graph-icon">
              <circle cx="100" cy="60" r="30" fill="var(--gold)" opacity="0.8"/>
              <circle cx="60" cy="140" r="25" fill="#5B8FF9" opacity="0.8"/>
              <circle cx="140" cy="140" r="25" fill="#5AD8A6" opacity="0.8"/>
              <path d="M100 90 L60 115" stroke="var(--gold)" stroke-width="2" opacity="0.6"/>
              <path d="M100 90 L140 115" stroke="var(--gold)" stroke-width="2" opacity="0.6"/>
              <path d="M60 165 L140 165" stroke="#5B8FF9" stroke-width="2" opacity="0.4" stroke-dasharray="4"/>
              <text x="100" y="65" text-anchor="middle" fill="#1A1714" font-size="14" font-weight="600">A</text>
              <text x="60" y="145" text-anchor="middle" fill="#1A1714" font-size="12" font-weight="600">B</text>
              <text x="140" y="145" text-anchor="middle" fill="#1A1714" font-size="12" font-weight="600">C</text>
            </svg>
            <p>知识图谱可视化区域</p>
            <p class="hint">点击节点查看详情，拖拽节点调整位置</p>
          </div>
        </div>
        <div class="graph-legend">
          <div class="legend-item">
            <span class="legend-dot" style="background: var(--gold)"></span>
            <span>建筑实体</span>
          </div>
          <div class="legend-item">
            <span class="legend-dot" style="background: #5B8FF9"></span>
            <span>人物实体</span>
          </div>
          <div class="legend-item">
            <span class="legend-dot" style="background: #5AD8A6"></span>
            <span>知识概念</span>
          </div>
          <div class="legend-item">
            <span class="legend-line solid"></span>
            <span>直接关系</span>
          </div>
          <div class="legend-item">
            <span class="legend-line dashed"></span>
            <span>间接关系</span>
          </div>
        </div>
      </div>

      <!-- 实体管理区域 -->
      <div v-if="activeTab === 'entities'" class="entities-panel">
        <div class="panel-header">
          <h3>实体管理</h3>
          <div class="panel-actions">
            <input 
              type="text" 
              v-model="searchQuery" 
              placeholder="搜索实体..." 
              class="search-input"
            />
            <select v-model="entityTypeFilter" class="filter-select">
              <option value="">全部类型</option>
              <option value="architecture">建筑</option>
              <option value="person">人物</option>
              <option value="concept">概念</option>
              <option value="location">地点</option>
            </select>
            <button class="btn btn-primary" @click="showAddEntityModal = true">
              <svg viewBox="0 0 24 24" width="14" height="14">
                <path d="M12 4v16m8-8H4" stroke="currentColor" fill="none" stroke-width="2"/>
              </svg>
              添加实体
            </button>
          </div>
        </div>
        <div class="entity-list">
          <div v-for="entity in entities" :key="entity.id" class="entity-card">
            <div class="entity-header">
              <div class="entity-icon" :class="entity.type">
                <svg viewBox="0 0 24 24" width="20" height="20">
                  <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.2"/>
                  <path d="M12 8v8M8 12h8" stroke="currentColor" fill="none" stroke-width="2"/>
                </svg>
              </div>
              <div class="entity-info">
                <h4>{{ entity.name }}</h4>
                <span class="entity-type">{{ getEntityTypeName(entity.type) }}</span>
              </div>
              <div class="entity-actions">
                <button class="action-btn" title="编辑" @click="editEntity(entity)">
                  <svg viewBox="0 0 24 24" width="14" height="14">
                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" fill="none" stroke-width="1.5"/>
                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" fill="none" stroke-width="1.5"/>
                  </svg>
                </button>
                <button class="action-btn" title="删除" @click="deleteEntity(entity.id)">
                  <svg viewBox="0 0 24 24" width="14" height="14">
                    <path d="M3 6h18M19 6v14c0 1.1-.9 2-2 2H7c-1.1 0-2-.9-2-2V6m3 0V4c0-1.1.9-2 2-2h4c1.1 0 2 .9 2 2v2" stroke="currentColor" fill="none" stroke-width="1.5"/>
                  </svg>
                </button>
              </div>
            </div>
            <p class="entity-description">{{ entity.description }}</p>
            <div class="entity-meta">
              <span>属性: {{ Object.keys(entity.attributes || {}).length }}</span>
              <span>关系: {{ entity.relationCount || 0 }}</span>
            </div>
          </div>
        </div>
        <div class="pagination">
          <button class="page-btn" :disabled="currentPage === 1" @click="currentPage--">上一页</button>
          <span class="page-info">第 {{ currentPage }} / {{ totalPages }} 页</span>
          <button class="page-btn" :disabled="currentPage === totalPages" @click="currentPage++">下一页</button>
        </div>
      </div>

      <!-- 关系管理区域 -->
      <div v-if="activeTab === 'relations'" class="relations-panel">
        <div class="panel-header">
          <h3>关系管理</h3>
          <div class="panel-actions">
            <input 
              type="text" 
              v-model="relationSearch" 
              placeholder="搜索关系..." 
              class="search-input"
            />
            <button class="btn btn-primary" @click="showAddRelationModal = true">
              <svg viewBox="0 0 24 24" width="14" height="14">
                <path d="M12 4v16m8-8H4" stroke="currentColor" fill="none" stroke-width="2"/>
              </svg>
              添加关系
            </button>
          </div>
        </div>
        <div class="relation-list">
          <div v-for="relation in relations" :key="relation.id" class="relation-card">
            <div class="relation-arrow">
              <div class="relation-node source">
                <span class="node-label">{{ relation.sourceName }}</span>
              </div>
              <div class="relation-line">
                <svg viewBox="0 0 100 20" width="100" height="20">
                  <path d="M5 10h80M80 10L75 5M80 10L75 15" stroke="var(--gold)" fill="none" stroke-width="2"/>
                </svg>
                <span class="relation-type">{{ relation.type }}</span>
              </div>
              <div class="relation-node target">
                <span class="node-label">{{ relation.targetName }}</span>
              </div>
            </div>
            <div class="relation-actions">
              <button class="action-btn" title="编辑" @click="editRelation(relation)">
                <svg viewBox="0 0 24 24" width="14" height="14">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" fill="none" stroke-width="1.5"/>
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" fill="none" stroke-width="1.5"/>
                </svg>
              </button>
              <button class="action-btn danger" title="取消链接" @click="removeRelation(relation.id)">
                <svg viewBox="0 0 24 24" width="14" height="14">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" fill="none" stroke-width="1.5"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 导入历史区域 -->
      <div v-if="activeTab === 'history'" class="history-panel">
        <div class="panel-header">
          <h3>导入历史</h3>
          <select v-model="historyFilter" class="filter-select">
            <option value="">全部状态</option>
            <option value="completed">已完成</option>
            <option value="failed">失败</option>
            <option value="validated">已验证</option>
          </select>
        </div>
        <div class="history-list">
          <div v-for="record in importHistory" :key="record.importId" class="history-card">
            <div class="history-header">
              <div class="history-status" :class="record.status">
                <svg v-if="record.status === 'completed'" viewBox="0 0 24 24" width="16" height="16">
                  <path d="M9 12l2 2 4-4" stroke="currentColor" fill="none" stroke-width="2"/>
                  <circle cx="12" cy="12" r="10" stroke="currentColor" fill="none" stroke-width="2"/>
                </svg>
                <svg v-else-if="record.status === 'failed'" viewBox="0 0 24 24" width="16" height="16">
                  <path d="M12 8v8M8 12h8" stroke="currentColor" fill="none" stroke-width="2"/>
                  <circle cx="12" cy="12" r="10" stroke="currentColor" fill="none" stroke-width="2"/>
                </svg>
                <span>{{ getStatusText(record.status) }}</span>
              </div>
              <span class="history-date">{{ formatDate(record.createdAt) }}</span>
            </div>
            <div class="history-info">
              <span class="history-format">{{ record.format.toUpperCase() }} 格式</span>
              <span class="history-user">操作人: {{ record.createdBy }}</span>
            </div>
            <div class="history-stats">
              <div class="stat-item">
                <span class="stat-value">{{ record.totalRecords }}</span>
                <span class="stat-label">总数</span>
              </div>
              <div class="stat-item success">
                <span class="stat-value">{{ record.successCount }}</span>
                <span class="stat-label">成功</span>
              </div>
              <div class="stat-item failed">
                <span class="stat-value">{{ record.failedCount }}</span>
                <span class="stat-label">失败</span>
              </div>
              <div class="stat-item skipped">
                <span class="stat-value">{{ record.skippedCount }}</span>
                <span class="stat-label">跳过</span>
              </div>
            </div>
            <div class="history-actions">
              <button class="btn btn-sm" @click="viewReport(record)">查看报告</button>
              <button class="btn btn-sm btn-secondary" @click="retryImport(record)">重新导入</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 导入模态框 -->
    <transition name="modal">
      <div v-if="showImportModal" class="modal-overlay" @click.self="showImportModal = false">
        <div class="modal-content">
          <div class="modal-header">
            <h3>导入知识图谱数据</h3>
            <button class="modal-close" @click="showImportModal = false">
              <svg viewBox="0 0 24 24" width="16" height="16">
                <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" fill="none" stroke-width="2"/>
              </svg>
            </button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>数据格式</label>
              <select v-model="importConfig.format" class="form-select">
                <option value="json-ld">JSON-LD</option>
                <option value="rdf-xml">RDF/XML</option>
                <option value="csv">CSV</option>
                <option value="json">JSON</option>
              </select>
            </div>
            <div class="form-group">
              <label>冲突解决策略</label>
              <select v-model="importConfig.conflictStrategy" class="form-select">
                <option value="overwrite">覆盖已有数据</option>
                <option value="skip">跳过冲突记录</option>
                <option value="prompt">提示手动处理</option>
              </select>
            </div>
            <div class="form-group">
              <label>批量大小</label>
              <input type="number" v-model.number="importConfig.batchSize" class="form-input" min="1" max="1000" />
            </div>
            <div class="form-group">
              <label>仅验证（不导入）</label>
              <label class="checkbox-label">
                <input type="checkbox" v-model="importConfig.validateOnly" />
                <span>开启验证模式</span>
              </label>
            </div>
            <div class="form-group">
              <label>数据内容</label>
              <textarea 
                v-model="importConfig.data" 
                class="form-textarea" 
                rows="8"
                placeholder="请输入知识图谱数据..."
              ></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" @click="showImportModal = false">取消</button>
            <button class="btn btn-primary" @click="executeImport" :disabled="importing">
              <svg v-if="importing" viewBox="0 0 24 24" width="16" height="16" class="spinner">
                <circle cx="12" cy="12" r="10" stroke="currentColor" fill="none" stroke-width="2" stroke-dasharray="18 6"/>
              </svg>
              {{ importing ? '导入中...' : '开始导入' }}
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- 导出模态框 -->
    <transition name="modal">
      <div v-if="showExportModal" class="modal-overlay" @click.self="showExportModal = false">
        <div class="modal-content">
          <div class="modal-header">
            <h3>导出知识图谱数据</h3>
            <button class="modal-close" @click="showExportModal = false">
              <svg viewBox="0 0 24 24" width="16" height="16">
                <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" fill="none" stroke-width="2"/>
              </svg>
            </button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>导出格式</label>
              <select v-model="exportConfig.format" class="form-select">
                <option value="json-ld">JSON-LD</option>
                <option value="csv">CSV</option>
                <option value="json">JSON</option>
              </select>
            </div>
            <div class="form-group">
              <label>导出范围</label>
              <label class="checkbox-label">
                <input type="checkbox" v-model="exportConfig.includeEntities" />
                <span>包含实体</span>
              </label>
              <label class="checkbox-label">
                <input type="checkbox" v-model="exportConfig.includeRelations" />
                <span>包含关系</span>
              </label>
            </div>
            <div class="form-group">
              <label>实体类型筛选</label>
              <select v-model="exportConfig.entityType" class="form-select">
                <option value="">全部类型</option>
                <option value="architecture">建筑</option>
                <option value="person">人物</option>
                <option value="concept">概念</option>
                <option value="location">地点</option>
              </select>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" @click="showExportModal = false">取消</button>
            <button class="btn btn-primary" @click="executeExport">导出数据</button>
          </div>
        </div>
      </div>
    </transition>

    <!-- 添加实体模态框 -->
    <transition name="modal">
      <div v-if="showAddEntityModal" class="modal-overlay" @click.self="showAddEntityModal = false">
        <div class="modal-content">
          <div class="modal-header">
            <h3>{{ editingEntity ? '编辑实体' : '添加实体' }}</h3>
            <button class="modal-close" @click="closeEntityModal">
              <svg viewBox="0 0 24 24" width="16" height="16">
                <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" fill="none" stroke-width="2"/>
              </svg>
            </button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>实体名称 *</label>
              <input type="text" v-model="entityForm.name" class="form-input" placeholder="请输入实体名称" />
            </div>
            <div class="form-group">
              <label>实体类型 *</label>
              <select v-model="entityForm.type" class="form-select">
                <option value="architecture">建筑</option>
                <option value="person">人物</option>
                <option value="concept">概念</option>
                <option value="location">地点</option>
              </select>
            </div>
            <div class="form-group">
              <label>描述</label>
              <textarea v-model="entityForm.description" class="form-textarea" rows="4" placeholder="请输入实体描述"></textarea>
            </div>
            <div class="form-group">
              <label>属性（JSON格式）</label>
              <textarea v-model="entityForm.attributes" class="form-textarea" rows="4" placeholder='{"key": "value"}'></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" @click="closeEntityModal">取消</button>
            <button class="btn btn-primary" @click="saveEntity">保存</button>
          </div>
        </div>
      </div>
    </transition>

    <!-- 添加关系模态框 -->
    <transition name="modal">
      <div v-if="showAddRelationModal" class="modal-overlay" @click.self="showAddRelationModal = false">
        <div class="modal-content">
          <div class="modal-header">
            <h3>{{ editingRelation ? '编辑关系' : '添加关系' }}</h3>
            <button class="modal-close" @click="closeRelationModal">
              <svg viewBox="0 0 24 24" width="16" height="16">
                <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" fill="none" stroke-width="2"/>
              </svg>
            </button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>源实体 *</label>
              <select v-model="relationForm.sourceId" class="form-select">
                <option value="">请选择源实体</option>
                <option v-for="entity in entities" :key="entity.id" :value="entity.id">{{ entity.name }}</option>
              </select>
            </div>
            <div class="form-group">
              <label>关系类型 *</label>
              <select v-model="relationForm.type" class="form-select">
                <option value="relatedTo">相关</option>
                <option value="influencedBy">影响</option>
                <option value="locatedIn">位于</option>
                <option value="createdBy">创建</option>
                <option value="belongsTo">属于</option>
                <option value="contains">包含</option>
              </select>
            </div>
            <div class="form-group">
              <label>目标实体 *</label>
              <select v-model="relationForm.targetId" class="form-select">
                <option value="">请选择目标实体</option>
                <option v-for="entity in entities" :key="entity.id" :value="entity.id">{{ entity.name }}</option>
              </select>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" @click="closeRelationModal">取消</button>
            <button class="btn btn-primary" @click="saveRelation">保存</button>
          </div>
        </div>
      </div>
    </transition>

    <!-- 操作提示 -->
    <transition name="toast">
      <div v-if="toast.show" class="toast" :class="toast.type">
        <svg v-if="toast.type === 'success'" viewBox="0 0 24 24" width="16" height="16">
          <path d="M9 12l2 2 4-4" stroke="currentColor" fill="none" stroke-width="2"/>
          <circle cx="12" cy="12" r="10" stroke="currentColor" fill="none" stroke-width="2"/>
        </svg>
        <svg v-else-if="toast.type === 'error'" viewBox="0 0 24 24" width="16" height="16">
          <path d="M12 8v8M8 12h8" stroke="currentColor" fill="none" stroke-width="2"/>
          <circle cx="12" cy="12" r="10" stroke="currentColor" fill="none" stroke-width="2"/>
        </svg>
        <span>{{ toast.message }}</span>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { api } from '@/services/apiFactory';

// 标签页配置
const tabs = computed(() => [
  { id: 'visualize', label: '图谱可视化', icon: '0 0 24 24', iconPath: 'M13.5 20.5C13.5 21.88 12.38 23 11 23s-2.5-1.12-2.5-2.5c0-.69.28-1.32.74-1.76l-3.54-3.54c-.78.72-1.79 1.19-2.9 1.19C3.58 16 1 13.42 1 10c0-1.11.47-2.12 1.29-2.9L8.76 8.74c.44.46 1.07.74 1.74.74h.5c.28 0 .5-.22.5-.5V4.5c0-.28.22-.5.5-.5h3c.28 0 .5.22.5.5v8.75c0 .67.28 1.3.74 1.76l3.54-3.54c.82.78 1.29 1.79 1.29 2.9 0 3.42-2.58 6-6 6z' },
  { id: 'entities', label: '实体管理', icon: '0 0 24 24', iconPath: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z', count: entities.value.length },
  { id: 'relations', label: '关系管理', icon: '0 0 24 24', iconPath: 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1', count: relations.value.length },
  { id: 'history', label: '导入历史', icon: '0 0 24 24', iconPath: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
]);

const activeTab = ref('visualize');
const currentPage = ref(1);
const totalPages = ref(5);
const searchQuery = ref('');
const relationSearch = ref('');
const entityTypeFilter = ref('');
const historyFilter = ref('');

// 模态框状态
const showImportModal = ref(false);
const showExportModal = ref(false);
const showAddEntityModal = ref(false);
const showAddRelationModal = ref(false);
const importing = ref(false);

// 表单数据
const importConfig = reactive({
  format: 'json-ld',
  conflictStrategy: 'skip',
  batchSize: 100,
  validateOnly: false,
  data: ''
});

const exportConfig = reactive({
  format: 'json-ld',
  includeEntities: true,
  includeRelations: true,
  entityType: ''
});

const entityForm = reactive({
  name: '',
  type: 'architecture',
  description: '',
  attributes: ''
});

const relationForm = reactive({
  sourceId: '',
  type: 'relatedTo',
  targetId: ''
});

const editingEntity = ref<any>(null);
const editingRelation = ref<any>(null);

// Toast提示
const toast = reactive({
  show: false,
  type: 'success' as 'success' | 'error',
  message: ''
});

function showToast(type: 'success' | 'error', message: string) {
  toast.type = type;
  toast.message = message;
  toast.show = true;
  setTimeout(() => {
    toast.show = false;
  }, 3000);
}

// 模拟数据
const entities = ref([
  { id: 1, name: '故宫', type: 'architecture', description: '北京故宫是中国明清两代的皇家宫殿', attributes: { location: '北京', year: 1420 }, relationCount: 5 },
  { id: 2, name: '梁思成', type: 'person', description: '中国著名建筑学家', attributes: { birthYear: 1901, deathYear: 1972 }, relationCount: 3 },
  { id: 3, name: '斗拱', type: 'concept', description: '中国传统建筑中的重要构件', attributes: { category: '建筑结构' }, relationCount: 8 },
  { id: 4, name: '苏州', type: 'location', description: '江南水乡名城', attributes: { province: '江苏' }, relationCount: 4 },
  { id: 5, name: '天坛', type: 'architecture', description: '明清两代皇帝祭天的场所', attributes: { location: '北京', year: 1420 }, relationCount: 3 },
]);

const relations = ref([
  { id: 1, sourceId: 1, sourceName: '故宫', type: 'locatedIn', targetId: 4, targetName: '北京' },
  { id: 2, sourceId: 3, sourceName: '斗拱', type: 'belongsTo', targetId: 1, targetName: '故宫' },
  { id: 3, sourceId: 2, sourceName: '梁思成', type: 'studied', targetId: 1, targetName: '故宫' },
  { id: 4, sourceId: 5, sourceName: '天坛', type: 'locatedIn', targetId: 4, targetName: '北京' },
]);

const importHistory = ref([
  { importId: 'import-20240115-ABC123', format: 'json-ld', status: 'completed', totalRecords: 150, successCount: 145, failedCount: 5, skippedCount: 0, createdBy: 'admin', createdAt: '2024-01-15T10:30:00Z', duration: 1250 },
  { importId: 'import-20240114-DEF456', format: 'csv', status: 'completed', totalRecords: 200, successCount: 200, failedCount: 0, skippedCount: 0, createdBy: 'admin', createdAt: '2024-01-14T14:20:00Z', duration: 890 },
  { importId: 'import-20240113-GHI789', format: 'json-ld', status: 'failed', totalRecords: 100, successCount: 0, failedCount: 100, skippedCount: 0, createdBy: 'admin', createdAt: '2024-01-13T09:15:00Z', duration: 320 },
]);

// 方法
function getEntityTypeName(type: string) {
  const types: Record<string, string> = {
    architecture: '建筑',
    person: '人物',
    concept: '概念',
    location: '地点'
  };
  return types[type] || type;
}

function getStatusText(status: string) {
  const statusMap: Record<string, string> = {
    completed: '已完成',
    failed: '失败',
    validated: '已验证'
  };
  return statusMap[status] || status;
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleString('zh-CN');
}

// 可视化操作
function zoomIn() {
  showToast('success', '放大视图');
}

function zoomOut() {
  showToast('success', '缩小视图');
}

function resetView() {
  showToast('success', '重置视图');
}

function toggleFullscreen() {
  showToast('success', '切换全屏');
}

// 实体操作
function editEntity(entity: any) {
  editingEntity.value = entity;
  entityForm.name = entity.name;
  entityForm.type = entity.type;
  entityForm.description = entity.description;
  entityForm.attributes = JSON.stringify(entity.attributes || {}, null, 2);
  showAddEntityModal.value = true;
}

function deleteEntity(id: number) {
  if (confirm('确定要删除这个实体吗？')) {
    entities.value = entities.value.filter(e => e.id !== id);
    showToast('success', '实体删除成功');
  }
}

function closeEntityModal() {
  showAddEntityModal.value = false;
  editingEntity.value = null;
  entityForm.name = '';
  entityForm.type = 'architecture';
  entityForm.description = '';
  entityForm.attributes = '';
}

function saveEntity() {
  if (!entityForm.name) {
    showToast('error', '请输入实体名称');
    return;
  }
  
  if (editingEntity.value) {
    const index = entities.value.findIndex(e => e.id === editingEntity.value.id);
    if (index !== -1) {
      entities.value[index] = {
        ...entities.value[index],
        name: entityForm.name,
        type: entityForm.type,
        description: entityForm.description,
        attributes: entityForm.attributes ? JSON.parse(entityForm.attributes) : {}
      };
    }
    showToast('success', '实体更新成功');
  } else {
    const newEntity = {
      id: Date.now(),
      name: entityForm.name,
      type: entityForm.type,
      description: entityForm.description,
      attributes: entityForm.attributes ? JSON.parse(entityForm.attributes) : {},
      relationCount: 0
    };
    entities.value.unshift(newEntity);
    showToast('success', '实体添加成功');
  }
  
  closeEntityModal();
}

// 关系操作
function editRelation(relation: any) {
  editingRelation.value = relation;
  relationForm.sourceId = relation.sourceId;
  relationForm.type = relation.type;
  relationForm.targetId = relation.targetId;
  showAddRelationModal.value = true;
}

function removeRelation(id: number) {
  if (confirm('确定要取消这个链接吗？')) {
    relations.value = relations.value.filter(r => r.id !== id);
    showToast('success', '关系已取消');
  }
}

function closeRelationModal() {
  showAddRelationModal.value = false;
  editingRelation.value = null;
  relationForm.sourceId = '';
  relationForm.type = 'relatedTo';
  relationForm.targetId = '';
}

function saveRelation() {
  if (!relationForm.sourceId || !relationForm.targetId) {
    showToast('error', '请选择源实体和目标实体');
    return;
  }
  
  const sourceEntity = entities.value.find(e => e.id === Number(relationForm.sourceId));
  const targetEntity = entities.value.find(e => e.id === Number(relationForm.targetId));
  
  if (editingRelation.value) {
    const index = relations.value.findIndex(r => r.id === editingRelation.value.id);
    if (index !== -1) {
      relations.value[index] = {
        ...relations.value[index],
        sourceId: Number(relationForm.sourceId),
        sourceName: sourceEntity?.name || '',
        type: relationForm.type,
        targetId: Number(relationForm.targetId),
        targetName: targetEntity?.name || ''
      };
    }
    showToast('success', '关系更新成功');
  } else {
    const newRelation = {
      id: Date.now(),
      sourceId: Number(relationForm.sourceId),
      sourceName: sourceEntity?.name || '',
      type: relationForm.type,
      targetId: Number(relationForm.targetId),
      targetName: targetEntity?.name || ''
    };
    relations.value.unshift(newRelation);
    showToast('success', '关系添加成功');
  }
  
  closeRelationModal();
}

// 导入导出操作
async function executeImport() {
  if (!importConfig.data.trim()) {
    showToast('error', '请输入数据内容');
    return;
  }
  
  importing.value = true;
  
  try {
    const result = await api.admin.importKnowledgeGraph({
      format: importConfig.format,
      data: importConfig.data,
      conflictStrategy: importConfig.conflictStrategy,
      validateOnly: importConfig.validateOnly,
      batchSize: importConfig.batchSize
    });
    
    if (result.success) {
      showToast('success', importConfig.validateOnly ? '数据验证通过' : '数据导入成功');
      showImportModal.value = false;
      importConfig.data = '';
    } else {
      showToast('error', result.error?.message || '导入失败');
    }
  } catch (error) {
    showToast('error', '导入失败，请检查数据格式');
  } finally {
    importing.value = false;
  }
}

function executeExport() {
  showToast('success', '数据导出功能开发中');
  showExportModal.value = false;
}

function viewReport(record: any) {
  showToast('success', `查看报告: ${record.importId}`);
}

function retryImport(record: any) {
  showToast('success', `重新导入: ${record.importId}`);
}
</script>

<style scoped>
.knowledge-graph-admin {
  min-height: 100%;
  padding-bottom: 24px;
}

/* 页面头部 */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--color-border);
}

.header-info .page-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-text);
  margin: 0 0 8px;
}

.page-description {
  font-size: 0.875rem;
  color: var(--color-text-muted);
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: var(--radius-sm);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
  border: none;
  text-decoration: none;
}

.btn-primary {
  background: var(--gold);
  color: #1A1714;
}

.btn-primary:hover {
  background: var(--gold-light);
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.06);
  color: var(--text);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.1);
}

.btn-sm {
  padding: 4px 12px;
  font-size: 0.75rem;
}

/* 标签页 */
.tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 20px;
  padding: 4px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: var(--radius-md);
}

.tab-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border: none;
  background: transparent;
  color: var(--text-muted);
  font-size: 0.875rem;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.tab-item:hover {
  color: var(--text);
  background: rgba(255, 255, 255, 0.04);
}

.tab-item.active {
  background: rgba(201, 169, 110, 0.1);
  color: var(--gold);
}

.tab-count {
  background: rgba(201, 169, 110, 0.2);
  color: var(--gold);
  font-size: 0.625rem;
  padding: 2px 6px;
  border-radius: 10px;
}

/* 主内容区 */
.main-content {
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
  overflow: hidden;
}

/* 面板通用样式 */
.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--color-border);
}

.panel-header h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text);
}

.panel-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.search-input {
  padding: 6px 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: rgba(255, 255, 255, 0.04);
  color: var(--text);
  font-size: 0.8125rem;
  width: 180px;
}

.filter-select {
  padding: 6px 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: rgba(255, 255, 255, 0.04);
  color: var(--text);
  font-size: 0.8125rem;
}

/* 可视化面板 */
.visualize-panel {
  padding: 20px;
}

.visualize-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.visualize-header h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
}

.visualize-tools {
  display: flex;
  gap: 8px;
}

.tool-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: rgba(255, 255, 255, 0.04);
  color: var(--text-muted);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.tool-btn:hover {
  background: rgba(201, 169, 110, 0.1);
  color: var(--gold);
}

.graph-canvas {
  height: 400px;
  background: rgba(0, 0, 0, 0.1);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
  overflow: hidden;
}

.graph-placeholder {
  text-align: center;
  color: var(--text-muted);
}

.graph-placeholder p {
  margin: 12px 0 4px;
  font-size: 0.875rem;
}

.graph-placeholder .hint {
  font-size: 0.75rem;
  color: var(--text-muted-light);
}

.graph-icon {
  opacity: 0.8;
}

.graph-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  justify-content: center;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
  color: var(--text-muted);
}

.legend-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.legend-line {
  width: 24px;
  height: 2px;
  background: var(--gold);
}

.legend-line.dashed {
  background: none;
  border-bottom: 2px dashed var(--gold);
}

/* 实体列表 */
.entity-list {
  padding: 16px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 12px;
}

.entity-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 16px;
  transition: all var(--transition-fast);
}

.entity-card:hover {
  border-color: rgba(201, 169, 110, 0.3);
}

.entity-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.entity-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
}

.entity-icon.architecture { color: var(--gold); background: rgba(201, 169, 110, 0.1); }
.entity-icon.person { color: #5B8FF9; background: rgba(91, 143, 249, 0.1); }
.entity-icon.concept { color: #5AD8A6; background: rgba(90, 216, 166, 0.1); }
.entity-icon.location { color: #F6BD16; background: rgba(246, 189, 22, 0.1); }

.entity-info {
  flex: 1;
}

.entity-info h4 {
  margin: 0 0 4px;
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--text);
}

.entity-type {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.entity-actions {
  display: flex;
  gap: 4px;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: var(--radius-xs);
  background: rgba(255, 255, 255, 0.04);
  color: var(--text-muted);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.action-btn:hover {
  background: rgba(201, 169, 110, 0.1);
  color: var(--gold);
}

.action-btn.danger:hover {
  background: rgba(199, 92, 58, 0.1);
  color: #C75C3A;
}

.entity-description {
  margin: 0 0 12px;
  font-size: 0.8125rem;
  color: var(--text-muted);
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.entity-meta {
  display: flex;
  gap: 16px;
  font-size: 0.75rem;
  color: var(--text-muted-light);
}

/* 分页 */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  padding: 16px;
  border-top: 1px solid var(--color-border);
}

.page-btn {
  padding: 6px 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text);
  font-size: 0.8125rem;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.page-btn:hover:not(:disabled) {
  background: rgba(201, 169, 110, 0.1);
  color: var(--gold);
}

.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.page-info {
  font-size: 0.8125rem;
  color: var(--text-muted);
}

/* 关系列表 */
.relation-list {
  padding: 16px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 12px;
}

.relation-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 16px;
}

.relation-arrow {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.relation-node {
  flex: 1;
  text-align: center;
  padding: 8px 12px;
  border-radius: var(--radius-sm);
}

.relation-node.source {
  background: rgba(201, 169, 110, 0.1);
  color: var(--gold);
}

.relation-node.target {
  background: rgba(91, 143, 249, 0.1);
  color: #5B8FF9;
}

.node-label {
  font-size: 0.8125rem;
  font-weight: 500;
}

.relation-line {
  flex: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.relation-type {
  font-size: 0.75rem;
  color: var(--text-muted);
  background: rgba(255, 255, 255, 0.06);
  padding: 2px 8px;
  border-radius: 4px;
}

.relation-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

/* 历史列表 */
.history-list {
  padding: 16px;
}

.history-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 16px;
  margin-bottom: 12px;
}

.history-card:last-child {
  margin-bottom: 0;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.history-status {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8125rem;
  font-weight: 500;
}

.history-status.completed { color: #5AD8A6; }
.history-status.failed { color: #C75C3A; }
.history-status.validated { color: #5B8FF9; }

.history-date {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.history-info {
  display: flex;
  gap: 16px;
  margin-bottom: 12px;
  font-size: 0.75rem;
  color: var(--text-muted);
}

.history-stats {
  display: flex;
  gap: 24px;
  margin-bottom: 12px;
  padding: 12px;
  background: rgba(0, 0, 0, 0.1);
  border-radius: var(--radius-sm);
}

.stat-item {
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text);
}

.stat-item.success .stat-value { color: #5AD8A6; }
.stat-item.failed .stat-value { color: #C75C3A; }
.stat-item.skipped .stat-value { color: #F6BD16; }

.stat-label {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.history-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

/* 模态框 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  width: 90%;
  max-width: 500px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--color-border);
}

.modal-header h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
}

.modal-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  border-radius: var(--radius-xs);
  transition: all var(--transition-fast);
}

.modal-close:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text);
}

.modal-body {
  padding: 20px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid var(--color-border);
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--text);
}

.form-input,
.form-select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: rgba(255, 255, 255, 0.04);
  color: var(--text);
  font-size: 0.875rem;
  box-sizing: border-box;
}

.form-textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: rgba(255, 255, 255, 0.04);
  color: var(--text);
  font-size: 0.875rem;
  font-family: monospace;
  resize: vertical;
  box-sizing: border-box;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 0.8125rem;
  color: var(--text);
}

.checkbox-label input[type="checkbox"] {
  width: 16px;
  height: 16px;
}

/* Toast提示 */
.toast {
  position: fixed;
  bottom: 24px;
  right: 24px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 20px;
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  z-index: 2000;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.toast.success {
  background: rgba(90, 216, 166, 0.15);
  color: #5AD8A6;
  border: 1px solid rgba(90, 216, 166, 0.3);
}

.toast.error {
  background: rgba(199, 92, 58, 0.15);
  color: #C75C3A;
  border: 1px solid rgba(199, 92, 58, 0.3);
}

.spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 模态框动画 */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.25s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .modal-content,
.modal-leave-active .modal-content {
  transition: transform 0.25s ease;
}

.modal-enter-from .modal-content,
.modal-leave-to .modal-content {
  transform: translateY(-20px);
}

/* Toast动画 */
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

</style>
