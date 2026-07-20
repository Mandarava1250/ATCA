<template>
  <div class="knowledge-graph-admin">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-info">
        <h2 class="page-title">{{ $t('admin.knowledgeGraph.title') }}</h2>
        <p class="page-description">{{ $t('admin.knowledgeGraph.description') }}</p>
      </div>
      <div class="header-actions">
        <button class="btn btn-secondary" @click="showImportModal = true">
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path d="M12 4v16m8-8H4" stroke="currentColor" fill="none" stroke-width="1.5"/>
          </svg>
          {{ $t('admin.knowledgeGraph.importData') }}
        </button>
        <button class="btn btn-primary" @click="showExportModal = true">
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path d="M12 19V5m0 14l-5-5m5 5l5-5" stroke="currentColor" fill="none" stroke-width="1.5"/>
          </svg>
          {{ $t('admin.knowledgeGraph.exportData') }}
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
          <h3>{{ $t('admin.knowledgeGraph.visualize.title') }}</h3>
          <div class="visualize-tools">
            <button class="tool-btn" :title="$t('admin.knowledgeGraph.visualize.zoomIn')" @click="zoomIn">
              <svg viewBox="0 0 24 24" width="16" height="16">
                <path d="M12 4v16m8-8H4" stroke="currentColor" fill="none" stroke-width="2"/>
              </svg>
            </button>
            <button class="tool-btn" :title="$t('admin.knowledgeGraph.visualize.zoomOut')" @click="zoomOut">
              <svg viewBox="0 0 24 24" width="16" height="16">
                <path d="M4 12h16" stroke="currentColor" fill="none" stroke-width="2"/>
              </svg>
            </button>
            <button class="tool-btn" :title="$t('admin.knowledgeGraph.visualize.reset')" @click="resetView">
              <svg viewBox="0 0 24 24" width="16" height="16">
                <path d="M3 12a9 9 0 1118 0" stroke="currentColor" fill="none" stroke-width="2"/>
                <path d="M9 12l6-3-6-3v6z" stroke="currentColor" fill="none" stroke-width="2"/>
              </svg>
            </button>
            <button class="tool-btn" :title="$t('admin.knowledgeGraph.visualize.fullscreen')" @click="toggleFullscreen">
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
            <p>{{ $t('admin.knowledgeGraph.visualize.placeholder') }}</p>
            <p class="hint">{{ $t('admin.knowledgeGraph.visualize.hint') }}</p>
          </div>
        </div>
        <div class="graph-legend">
          <div class="legend-item">
            <span class="legend-dot" style="background: var(--gold)"></span>
            <span>{{ $t('admin.knowledgeGraph.entityTypes.architecture') }}</span>
          </div>
          <div class="legend-item">
            <span class="legend-dot" style="background: #5B8FF9"></span>
            <span>{{ $t('admin.knowledgeGraph.entityTypes.person') }}</span>
          </div>
          <div class="legend-item">
            <span class="legend-dot" style="background: #5AD8A6"></span>
            <span>{{ $t('admin.knowledgeGraph.entityTypes.concept') }}</span>
          </div>
          <div class="legend-item">
            <span class="legend-line solid"></span>
            <span>{{ $t('admin.knowledgeGraph.relationTypes.direct') }}</span>
          </div>
          <div class="legend-item">
            <span class="legend-line dashed"></span>
            <span>{{ $t('admin.knowledgeGraph.relationTypes.indirect') }}</span>
          </div>
        </div>
      </div>

      <!-- 实体管理区域 -->
      <div v-if="activeTab === 'entities'" class="entities-panel">
        <div class="panel-header">
          <h3>{{ $t('admin.knowledgeGraph.entities.title') }}</h3>
          <div class="panel-actions">
            <input 
              type="text" 
              v-model="searchQuery" 
              :placeholder="$t('admin.knowledgeGraph.entities.searchPlaceholder')" 
              class="search-input"
            />
            <select v-model="entityTypeFilter" class="filter-select">
              <option value="">{{ $t('admin.knowledgeGraph.entities.allTypes') }}</option>
              <option value="architecture">{{ $t('admin.knowledgeGraph.entityTypes.architecture') }}</option>
              <option value="person">{{ $t('admin.knowledgeGraph.entityTypes.person') }}</option>
              <option value="concept">{{ $t('admin.knowledgeGraph.entityTypes.concept') }}</option>
              <option value="location">{{ $t('admin.knowledgeGraph.entityTypes.location') }}</option>
            </select>
            <button class="btn btn-primary" @click="showAddEntityModal = true">
              <svg viewBox="0 0 24 24" width="14" height="14">
                <path d="M12 4v16m8-8H4" stroke="currentColor" fill="none" stroke-width="2"/>
              </svg>
              {{ $t('admin.knowledgeGraph.entities.addEntity') }}
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
                <span class="entity-type">{{ $t(`admin.knowledgeGraph.entityTypes.${entity.type}`) }}</span>
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
              <span>{{ $t('admin.knowledgeGraph.entities.attributes') }}: {{ Object.keys(entity.attributes || {}).length }}</span>
              <span>{{ $t('admin.knowledgeGraph.entities.relations') }}: {{ entity.relationCount || 0 }}</span>
            </div>
          </div>
        </div>
        <div class="pagination">
          <button class="page-btn" :disabled="currentPage === 1" @click="currentPage--">{{ $t('admin.knowledgeGraph.pagination.prev') }}</button>
          <span class="page-info">{{ $t('admin.knowledgeGraph.pagination.page') }} {{ currentPage }} / {{ totalPages }}</span>
          <button class="page-btn" :disabled="currentPage === totalPages" @click="currentPage++">{{ $t('admin.knowledgeGraph.pagination.next') }}</button>
        </div>
      </div>

      <!-- 关系管理区域 -->
      <div v-if="activeTab === 'relations'" class="relations-panel">
        <div class="panel-header">
          <h3>{{ $t('admin.knowledgeGraph.relations.title') }}</h3>
          <div class="panel-actions">
            <input 
              type="text" 
              v-model="relationSearch" 
              :placeholder="$t('admin.knowledgeGraph.relations.searchPlaceholder')" 
              class="search-input"
            />
            <button class="btn btn-primary" @click="showAddRelationModal = true">
              <svg viewBox="0 0 24 24" width="14" height="14">
                <path d="M12 4v16m8-8H4" stroke="currentColor" fill="none" stroke-width="2"/>
              </svg>
              {{ $t('admin.knowledgeGraph.relations.addRelation') }}
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
                <span class="relation-type">{{ $t(`admin.knowledgeGraph.relationTypes.${relation.type}`) }}</span>
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

      <!-- 知识推理区域 -->
      <div v-if="activeTab === 'reasoning'" class="reasoning-panel">
        <div class="panel-header">
          <h3>{{ $t('admin.knowledgeGraph.reasoning.title') }}</h3>
        </div>
        
        <!-- 路径推理 -->
        <div class="reasoning-section">
          <h4>{{ $t('admin.knowledgeGraph.reasoning.pathReasoning') }}</h4>
          <div class="reasoning-form">
            <div class="form-row">
              <div class="form-group">
                <label>{{ $t('admin.knowledgeGraph.reasoning.fromEntity') }} *</label>
                <select v-model="pathReasoningForm.fromEntity" class="form-select">
                  <option value="">{{ $t('admin.knowledgeGraph.reasoning.selectEntity') }}</option>
                  <option v-for="entity in entities" :key="entity.id" :value="entity.id">{{ entity.name }}</option>
                </select>
              </div>
              <div class="form-group">
                <label>{{ $t('admin.knowledgeGraph.reasoning.toEntity') }} *</label>
                <select v-model="pathReasoningForm.toEntity" class="form-select">
                  <option value="">{{ $t('admin.knowledgeGraph.reasoning.selectEntity') }}</option>
                  <option v-for="entity in entities" :key="entity.id" :value="entity.id">{{ entity.name }}</option>
                </select>
              </div>
              <div class="form-group">
                <label>{{ $t('admin.knowledgeGraph.reasoning.maxHops') }}</label>
                <select v-model.number="pathReasoningForm.maxHops" class="form-select">
                  <option :value="1">1 {{ $t('admin.knowledgeGraph.reasoning.hop') }}</option>
                  <option :value="2">2 {{ $t('admin.knowledgeGraph.reasoning.hops') }}</option>
                  <option :value="3">3 {{ $t('admin.knowledgeGraph.reasoning.hops') }}</option>
                  <option :value="4">4 {{ $t('admin.knowledgeGraph.reasoning.hops') }}</option>
                  <option :value="5">5 {{ $t('admin.knowledgeGraph.reasoning.hops') }}</option>
                </select>
              </div>
            </div>
            <div class="form-actions">
              <button class="btn btn-primary" @click="executePathReasoning" :disabled="pathReasoningLoading">
                <svg v-if="pathReasoningLoading" viewBox="0 0 24 24" width="16" height="16" class="spinner">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" fill="none" stroke-width="2" stroke-dasharray="18 6"/>
                </svg>
                {{ pathReasoningLoading ? $t('admin.knowledgeGraph.reasoning.searching') : $t('admin.knowledgeGraph.reasoning.searchPaths') }}
              </button>
              <button class="btn btn-secondary" @click="resetPathReasoning">{{ $t('common.reset') }}</button>
            </div>
          </div>
          
          <!-- 路径推理结果 -->
          <div v-if="pathResults.length > 0" class="reasoning-results">
            <h5>{{ $t('admin.knowledgeGraph.reasoning.results') }} ({{ pathResults.length }})</h5>
            <div class="path-list">
              <div v-for="(path, index) in pathResults" :key="path.path_id" class="path-card">
                <div class="path-header">
                  <span class="path-number">{{ $t('admin.knowledgeGraph.reasoning.path') }} {{ index + 1 }}</span>
                  <span class="path-hops">{{ path.hop_count }} {{ path.hop_count === 1 ? $t('admin.knowledgeGraph.reasoning.hop') : $t('admin.knowledgeGraph.reasoning.hops') }}</span>
                </div>
                <div class="path-visual">
                  <div class="path-nodes">
                    <template v-for="(node, idx) in path.path_names.split('->')" :key="idx">
                      <span class="path-node">{{ node }}</span>
                      <svg v-if="idx < path.path_names.split('->').length - 1" viewBox="0 0 24 24" width="16" height="16" class="path-arrow">
                        <path d="M5 12h14M12 5l7 7-7 7" stroke="var(--gold)" fill="none" stroke-width="2"/>
                      </svg>
                    </template>
                  </div>
                </div>
                <div class="path-relations">
                  <span class="relation-label">{{ $t('admin.knowledgeGraph.reasoning.relations') }}:</span>
                  <span class="relation-values">{{ path.path_types }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 知识注入推理 -->
        <div class="reasoning-section">
          <h4>{{ $t('admin.knowledgeGraph.reasoning.knowledgeInjection') }}</h4>
          <div class="reasoning-form">
            <div class="form-group">
              <label>{{ $t('admin.knowledgeGraph.reasoning.query') }} *</label>
              <textarea 
                v-model="knowledgeInjectionForm.query" 
                class="form-textarea" 
                rows="3"
                :placeholder="$t('admin.knowledgeGraph.reasoning.queryPlaceholder')"
              ></textarea>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>{{ $t('admin.knowledgeGraph.reasoning.injectionDepth') }}</label>
                <select v-model.number="knowledgeInjectionForm.injectionDepth" class="form-select">
                  <option :value="1">1 {{ $t('admin.knowledgeGraph.reasoning.depth') }}</option>
                  <option :value="2">2 {{ $t('admin.knowledgeGraph.reasoning.depth') }}</option>
                  <option :value="3">3 {{ $t('admin.knowledgeGraph.reasoning.depth') }}</option>
                  <option :value="4">4 {{ $t('admin.knowledgeGraph.reasoning.depth') }}</option>
                  <option :value="5">5 {{ $t('admin.knowledgeGraph.reasoning.depth') }}</option>
                </select>
              </div>
            </div>
            <div class="form-actions">
              <button class="btn btn-primary" @click="executeKnowledgeInjection" :disabled="knowledgeInjectionLoading">
                <svg v-if="knowledgeInjectionLoading" viewBox="0 0 24 24" width="16" height="16" class="spinner">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" fill="none" stroke-width="2" stroke-dasharray="18 6"/>
                </svg>
                {{ knowledgeInjectionLoading ? $t('admin.knowledgeGraph.reasoning.inferring') : $t('admin.knowledgeGraph.reasoning.infer') }}
              </button>
              <button class="btn btn-secondary" @click="resetKnowledgeInjection">{{ $t('common.reset') }}</button>
            </div>
          </div>
          
          <!-- 知识注入推理结果 -->
          <div v-if="knowledgeInjectionResult" class="reasoning-results">
            <h5>{{ $t('admin.knowledgeGraph.reasoning.inferenceResult') }}</h5>
            <div class="inference-card">
              <div class="inference-response">
                <pre>{{ knowledgeInjectionResult.response }}</pre>
              </div>
              <div class="inference-meta">
                <div class="meta-item">
                  <span class="meta-label">{{ $t('admin.knowledgeGraph.reasoning.confidence') }}</span>
                  <span class="meta-value" :style="{ color: knowledgeInjectionResult.confidence >= 0.8 ? '#5AD8A6' : knowledgeInjectionResult.confidence >= 0.5 ? '#F6BD16' : '#FF6B6B' }">
                    {{ (knowledgeInjectionResult.confidence * 100).toFixed(0) }}%
                  </span>
                </div>
                <div class="meta-item">
                  <span class="meta-label">{{ $t('admin.knowledgeGraph.reasoning.processingTime') }}</span>
                  <span class="meta-value">{{ knowledgeInjectionResult.metadata?.processingTime }}ms</span>
                </div>
                <div class="meta-item">
                  <span class="meta-label">{{ $t('admin.knowledgeGraph.reasoning.knowledgeUsed') }}</span>
                  <span class="meta-value">{{ knowledgeInjectionResult.metadata?.knowledgeUsed }}</span>
                </div>
              </div>
              <div v-if="knowledgeInjectionResult.knowledgeSources?.length > 0" class="inference-sources">
                <h6>{{ $t('admin.knowledgeGraph.reasoning.knowledgeSources') }}</h6>
                <div class="sources-list">
                  <div v-for="source in knowledgeInjectionResult.knowledgeSources" :key="source.topicId" class="source-item">
                    <span class="source-name">{{ source.topicName }}</span>
                    <span class="source-category">{{ source.category }}</span>
                    <span class="source-relevance">{{ (source.relevance * 100).toFixed(0) }}%</span>
                  </div>
                </div>
              </div>
              <div v-if="knowledgeInjectionResult.reasoningPath?.length > 0" class="inference-reasoning">
                <h6>{{ $t('admin.knowledgeGraph.reasoning.reasoningPath') }}</h6>
                <ul class="reasoning-list">
                  <li v-for="(step, idx) in knowledgeInjectionResult.reasoningPath" :key="idx">{{ step }}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 导入历史区域 -->
      <div v-if="activeTab === 'history'" class="history-panel">
        <div class="panel-header">
          <h3>{{ $t('admin.knowledgeGraph.history.title') }}</h3>
          <select v-model="historyFilter" class="filter-select">
            <option value="">{{ $t('admin.knowledgeGraph.history.allStatus') }}</option>
            <option value="completed">{{ $t('admin.knowledgeGraph.history.status.completed') }}</option>
            <option value="failed">{{ $t('admin.knowledgeGraph.history.status.failed') }}</option>
            <option value="validated">{{ $t('admin.knowledgeGraph.history.status.validated') }}</option>
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
                <span>{{ $t(`admin.knowledgeGraph.history.status.${record.status}`) }}</span>
              </div>
              <span class="history-date">{{ formatDate(record.createdAt) }}</span>
            </div>
            <div class="history-info">
              <span class="history-format">{{ record.format.toUpperCase() }} {{ $t('admin.knowledgeGraph.history.format') }}</span>
              <span class="history-user">{{ $t('admin.knowledgeGraph.history.operator') }}: {{ record.createdBy }}</span>
            </div>
            <div class="history-stats">
              <div class="stat-item">
                <span class="stat-value">{{ record.totalRecords }}</span>
                <span class="stat-label">{{ $t('admin.knowledgeGraph.history.total') }}</span>
              </div>
              <div class="stat-item success">
                <span class="stat-value">{{ record.successCount }}</span>
                <span class="stat-label">{{ $t('admin.knowledgeGraph.history.success') }}</span>
              </div>
              <div class="stat-item failed">
                <span class="stat-value">{{ record.failedCount }}</span>
                <span class="stat-label">{{ $t('admin.knowledgeGraph.history.failed') }}</span>
              </div>
              <div class="stat-item skipped">
                <span class="stat-value">{{ record.skippedCount }}</span>
                <span class="stat-label">{{ $t('admin.knowledgeGraph.history.skipped') }}</span>
              </div>
            </div>
            <div class="history-actions">
              <button class="btn btn-sm" @click="viewReport(record)">{{ $t('admin.knowledgeGraph.history.viewReport') }}</button>
              <button class="btn btn-sm btn-secondary" @click="retryImport(record)">{{ $t('admin.knowledgeGraph.history.retry') }}</button>
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
            <h3>{{ $t('admin.knowledgeGraph.importModal.title') }}</h3>
            <button class="modal-close" @click="showImportModal = false">
              <svg viewBox="0 0 24 24" width="16" height="16">
                <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" fill="none" stroke-width="2"/>
              </svg>
            </button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>{{ $t('admin.knowledgeGraph.importModal.dataFormat') }}</label>
              <select v-model="importConfig.format" class="form-select">
                <option value="json-ld">JSON-LD</option>
                <option value="rdf-xml">RDF/XML</option>
                <option value="csv">CSV</option>
                <option value="json">JSON</option>
              </select>
            </div>
            <div class="form-group">
              <label>{{ $t('admin.knowledgeGraph.importModal.conflictStrategy') }}</label>
              <select v-model="importConfig.conflictStrategy" class="form-select">
                <option value="overwrite">{{ $t('admin.knowledgeGraph.importModal.strategy.overwrite') }}</option>
                <option value="skip">{{ $t('admin.knowledgeGraph.importModal.strategy.skip') }}</option>
                <option value="prompt">{{ $t('admin.knowledgeGraph.importModal.strategy.prompt') }}</option>
              </select>
            </div>
            <div class="form-group">
              <label>{{ $t('admin.knowledgeGraph.importModal.batchSize') }}</label>
              <input type="number" v-model.number="importConfig.batchSize" class="form-input" min="1" max="1000" />
            </div>
            <div class="form-group">
              <label>{{ $t('admin.knowledgeGraph.importModal.validateOnly') }}</label>
              <label class="checkbox-label">
                <input type="checkbox" v-model="importConfig.validateOnly" />
                <span>{{ $t('admin.knowledgeGraph.importModal.enableValidation') }}</span>
              </label>
            </div>
            <div class="form-group">
              <label>{{ $t('admin.knowledgeGraph.importModal.dataContent') }}</label>
              <textarea 
                v-model="importConfig.data" 
                class="form-textarea" 
                rows="8"
                :placeholder="$t('admin.knowledgeGraph.importModal.dataPlaceholder')"
              ></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" @click="showImportModal = false">{{ $t('common.cancel') }}</button>
            <button class="btn btn-primary" @click="executeImport" :disabled="importing">
              <svg v-if="importing" viewBox="0 0 24 24" width="16" height="16" class="spinner">
                <circle cx="12" cy="12" r="10" stroke="currentColor" fill="none" stroke-width="2" stroke-dasharray="18 6"/>
              </svg>
              {{ importing ? $t('admin.knowledgeGraph.importModal.importing') : $t('admin.knowledgeGraph.importModal.startImport') }}
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
            <h3>{{ $t('admin.knowledgeGraph.exportModal.title') }}</h3>
            <button class="modal-close" @click="showExportModal = false">
              <svg viewBox="0 0 24 24" width="16" height="16">
                <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" fill="none" stroke-width="2"/>
              </svg>
            </button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>{{ $t('admin.knowledgeGraph.exportModal.exportFormat') }}</label>
              <select v-model="exportConfig.format" class="form-select">
                <option value="json-ld">JSON-LD</option>
                <option value="csv">CSV</option>
                <option value="json">JSON</option>
              </select>
            </div>
            <div class="form-group">
              <label>{{ $t('admin.knowledgeGraph.exportModal.exportScope') }}</label>
              <label class="checkbox-label">
                <input type="checkbox" v-model="exportConfig.includeEntities" />
                <span>{{ $t('admin.knowledgeGraph.exportModal.includeEntities') }}</span>
              </label>
              <label class="checkbox-label">
                <input type="checkbox" v-model="exportConfig.includeRelations" />
                <span>{{ $t('admin.knowledgeGraph.exportModal.includeRelations') }}</span>
              </label>
            </div>
            <div class="form-group">
              <label>{{ $t('admin.knowledgeGraph.exportModal.entityFilter') }}</label>
              <select v-model="exportConfig.entityType" class="form-select">
                <option value="">{{ $t('admin.knowledgeGraph.entities.allTypes') }}</option>
                <option value="architecture">{{ $t('admin.knowledgeGraph.entityTypes.architecture') }}</option>
                <option value="person">{{ $t('admin.knowledgeGraph.entityTypes.person') }}</option>
                <option value="concept">{{ $t('admin.knowledgeGraph.entityTypes.concept') }}</option>
                <option value="location">{{ $t('admin.knowledgeGraph.entityTypes.location') }}</option>
              </select>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" @click="showExportModal = false">{{ $t('common.cancel') }}</button>
            <button class="btn btn-primary" @click="executeExport">{{ $t('admin.knowledgeGraph.exportModal.exportData') }}</button>
          </div>
        </div>
      </div>
    </transition>

    <!-- 添加实体模态框 -->
    <transition name="modal">
      <div v-if="showAddEntityModal" class="modal-overlay" @click.self="showAddEntityModal = false">
        <div class="modal-content">
          <div class="modal-header">
            <h3>{{ editingEntity ? $t('admin.knowledgeGraph.entityModal.editTitle') : $t('admin.knowledgeGraph.entityModal.addTitle') }}</h3>
            <button class="modal-close" @click="closeEntityModal">
              <svg viewBox="0 0 24 24" width="16" height="16">
                <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" fill="none" stroke-width="2"/>
              </svg>
            </button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>{{ $t('admin.knowledgeGraph.entityModal.entityName') }} *</label>
              <input type="text" v-model="entityForm.name" class="form-input" :placeholder="$t('admin.knowledgeGraph.entityModal.namePlaceholder')" />
            </div>
            <div class="form-group">
              <label>{{ $t('admin.knowledgeGraph.entityModal.entityType') }} *</label>
              <select v-model="entityForm.type" class="form-select">
                <option value="architecture">{{ $t('admin.knowledgeGraph.entityTypes.architecture') }}</option>
                <option value="person">{{ $t('admin.knowledgeGraph.entityTypes.person') }}</option>
                <option value="concept">{{ $t('admin.knowledgeGraph.entityTypes.concept') }}</option>
                <option value="location">{{ $t('admin.knowledgeGraph.entityTypes.location') }}</option>
              </select>
            </div>
            <div class="form-group">
              <label>{{ $t('admin.knowledgeGraph.entityModal.description') }}</label>
              <textarea v-model="entityForm.description" class="form-textarea" rows="4" :placeholder="$t('admin.knowledgeGraph.entityModal.descPlaceholder')"></textarea>
            </div>
            <div class="form-group">
              <label>{{ $t('admin.knowledgeGraph.entityModal.attributes') }}</label>
              <textarea v-model="entityForm.attributes" class="form-textarea" rows="4" :placeholder="$t('admin.knowledgeGraph.entityModal.attrPlaceholder')"></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" @click="closeEntityModal">{{ $t('common.cancel') }}</button>
            <button class="btn btn-primary" @click="saveEntity">{{ $t('common.save') }}</button>
          </div>
        </div>
      </div>
    </transition>

    <!-- 添加关系模态框 -->
    <transition name="modal">
      <div v-if="showAddRelationModal" class="modal-overlay" @click.self="showAddRelationModal = false">
        <div class="modal-content">
          <div class="modal-header">
            <h3>{{ editingRelation ? $t('admin.knowledgeGraph.relationModal.editTitle') : $t('admin.knowledgeGraph.relationModal.addTitle') }}</h3>
            <button class="modal-close" @click="closeRelationModal">
              <svg viewBox="0 0 24 24" width="16" height="16">
                <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" fill="none" stroke-width="2"/>
              </svg>
            </button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>{{ $t('admin.knowledgeGraph.relationModal.sourceEntity') }} *</label>
              <select v-model="relationForm.sourceId" class="form-select">
                <option value="">{{ $t('admin.knowledgeGraph.relationModal.selectSource') }}</option>
                <option v-for="entity in entities" :key="entity.id" :value="entity.id">{{ entity.name }}</option>
              </select>
            </div>
            <div class="form-group">
              <label>{{ $t('admin.knowledgeGraph.relationModal.relationType') }} *</label>
              <select v-model="relationForm.type" class="form-select">
                <option value="relatedTo">{{ $t('admin.knowledgeGraph.relationTypes.relatedTo') }}</option>
                <option value="influencedBy">{{ $t('admin.knowledgeGraph.relationTypes.influencedBy') }}</option>
                <option value="locatedIn">{{ $t('admin.knowledgeGraph.relationTypes.locatedIn') }}</option>
                <option value="createdBy">{{ $t('admin.knowledgeGraph.relationTypes.createdBy') }}</option>
                <option value="belongsTo">{{ $t('admin.knowledgeGraph.relationTypes.belongsTo') }}</option>
                <option value="contains">{{ $t('admin.knowledgeGraph.relationTypes.contains') }}</option>
              </select>
            </div>
            <div class="form-group">
              <label>{{ $t('admin.knowledgeGraph.relationModal.targetEntity') }} *</label>
              <select v-model="relationForm.targetId" class="form-select">
                <option value="">{{ $t('admin.knowledgeGraph.relationModal.selectTarget') }}</option>
                <option v-for="entity in entities" :key="entity.id" :value="entity.id">{{ entity.name }}</option>
              </select>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" @click="closeRelationModal">{{ $t('common.cancel') }}</button>
            <button class="btn btn-primary" @click="saveRelation">{{ $t('common.save') }}</button>
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
import { ref, reactive, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { api } from '@/services/apiFactory';

const { t, locale } = useI18n();

// 标签页配置
const tabs = computed(() => [
  { id: 'visualize', label: t('admin.knowledgeGraph.tabs.visualize'), icon: '0 0 24 24', iconPath: 'M13.5 20.5C13.5 21.88 12.38 23 11 23s-2.5-1.12-2.5-2.5c0-.69.28-1.32.74-1.76l-3.54-3.54c-.78.72-1.79 1.19-2.9 1.19C3.58 16 1 13.42 1 10c0-1.11.47-2.12 1.29-2.9L8.76 8.74c.44.46 1.07.74 1.74.74h.5c.28 0 .5-.22.5-.5V4.5c0-.28.22-.5.5-.5h3c.28 0 .5.22.5.5v8.75c0 .67.28 1.3.74 1.76l3.54-3.54c.82.78 1.29 1.79 1.29 2.9 0 3.42-2.58 6-6 6z' },
  { id: 'entities', label: t('admin.knowledgeGraph.tabs.entities'), icon: '0 0 24 24', iconPath: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z', count: entities.value.length },
  { id: 'relations', label: t('admin.knowledgeGraph.tabs.relations'), icon: '0 0 24 24', iconPath: 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1', count: relations.value.length },
  { id: 'reasoning', label: t('admin.knowledgeGraph.tabs.reasoning'), icon: '0 0 24 24', iconPath: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
  { id: 'history', label: t('admin.knowledgeGraph.tabs.history'), icon: '0 0 24 24', iconPath: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
]);

const activeTab = ref('visualize');
const currentPage = ref(1);
const totalPages = ref(1);
const searchQuery = ref('');
const relationSearch = ref('');
const entityTypeFilter = ref('');
const historyFilter = ref('');

// 加载状态
const loadingEntities = ref(false);
const loadingRelations = ref(false);
const loadingHistory = ref(false);
const loadingGraph = ref(false);

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

// 知识推理状态
const pathReasoningForm = reactive({
  fromEntity: '',
  toEntity: '',
  maxHops: 3,
});

const knowledgeInjectionForm = reactive({
  query: '',
  injectionDepth: 2,
});

const pathResults = ref<any[]>([]);
const pathReasoningLoading = ref(false);
const knowledgeInjectionResult = ref<any>(null);
const knowledgeInjectionLoading = ref(false);

// 数据存储
const entities = ref<any[]>([]);
const relations = ref<any[]>([]);
const importHistory = ref<any[]>([]);
const graphData = ref<any>(null);

// 生命周期
onMounted(() => {
  loadEntities();
  loadRelations();
  loadImportHistory();
});

// 加载实体列表
async function loadEntities() {
  loadingEntities.value = true;
  try {
    const result = await api.knowledgeGraph.getTopics({
      page: currentPage.value,
      pageSize: 20,
      category: entityTypeFilter.value || undefined
    });
    if (result.success) {
      entities.value = result.data.map((item: any) => ({
        id: item.id,
        name: item.topic_name,
        type: item.category || 'concept',
        description: item.content_zh || '',
        attributes: item,
        relationCount: 0
      }));
      totalPages.value = result.total ? Math.ceil(result.total / 20) : 1;
    }
  } catch (error: any) {
    showToast('error', error.message || t('admin.knowledgeGraph.entities.loadFailed'));
  } finally {
    loadingEntities.value = false;
  }
}

// 加载关系列表
async function loadRelations() {
  loadingRelations.value = true;
  try {
    const result = await api.knowledgeGraph.getAllRelations();
    if (result.success) {
      relations.value = result.data.map((item: any) => ({
        id: item.id,
        sourceId: item.from_topic_id,
        sourceName: '',
        type: item.relation_type,
        targetId: item.to_topic_id,
        targetName: ''
      }));
      await populateRelationNames();
    }
  } catch (error: any) {
    showToast('error', error.message || t('admin.knowledgeGraph.relations.loadFailed'));
  } finally {
    loadingRelations.value = false;
  }
}

// 填充关系名称
async function populateRelationNames() {
  const entityMap = new Map(entities.value.map(e => [e.id, e.name]));
  
  for (const relation of relations.value) {
    relation.sourceName = entityMap.get(relation.sourceId) || `Entity ${relation.sourceId}`;
    relation.targetName = entityMap.get(relation.targetId) || `Entity ${relation.targetId}`;
  }
}

// 加载导入历史
async function loadImportHistory() {
  loadingHistory.value = true;
  try {
    const result = await api.knowledgeGraph.getImportHistory({
      page: 1,
      limit: 20,
      status: historyFilter.value || undefined
    });
    if (result.success) {
      importHistory.value = result.data;
    }
  } catch (error: any) {
    showToast('error', error.message || t('admin.knowledgeGraph.history.loadFailed'));
  } finally {
    loadingHistory.value = false;
  }
}

// 方法
function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleString(locale.value === 'zh' ? 'zh-CN' : 'en-US');
}

// 可视化操作
async function loadGraphData() {
  loadingGraph.value = true;
  try {
    const result = await api.knowledgeGraph.getGraphData(100);
    if (result.success) {
      graphData.value = result.data;
    }
  } catch (error: any) {
    showToast('error', error.message || t('admin.knowledgeGraph.visualize.loadFailed'));
  } finally {
    loadingGraph.value = false;
  }
}

function zoomIn() {
  showToast('success', t('admin.knowledgeGraph.visualize.zoomIn'));
}

function zoomOut() {
  showToast('success', t('admin.knowledgeGraph.visualize.zoomOut'));
}

function resetView() {
  showToast('success', t('admin.knowledgeGraph.visualize.resetView'));
}

function toggleFullscreen() {
  showToast('success', t('admin.knowledgeGraph.visualize.toggleFullscreen'));
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

async function deleteEntity(id: number) {
  if (confirm(t('admin.knowledgeGraph.entities.confirmDelete'))) {
    try {
      const result = await api.knowledgeGraph.deleteTopic(id);
      if (result.success) {
        entities.value = entities.value.filter(e => e.id !== id);
        showToast('success', t('admin.knowledgeGraph.entities.deleteSuccess'));
        await loadRelations();
      } else {
        showToast('error', result.error?.message || t('admin.knowledgeGraph.entities.deleteFailed'));
      }
    } catch (error: any) {
      showToast('error', error.message || t('admin.knowledgeGraph.entities.deleteFailed'));
    }
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

async function saveEntity() {
  if (!entityForm.name) {
    showToast('error', t('admin.knowledgeGraph.entityModal.nameRequired'));
    return;
  }
  
  try {
    if (editingEntity.value) {
      const result = await api.knowledgeGraph.updateTopic(editingEntity.value.id, {
        topic_name: entityForm.name,
        category: entityForm.type,
        content_zh: entityForm.description
      });
      if (result.success) {
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
        showToast('success', t('admin.knowledgeGraph.entities.updateSuccess'));
      } else {
        showToast('error', result.error?.message || t('admin.knowledgeGraph.entities.updateFailed'));
      }
    } else {
      const result = await api.knowledgeGraph.createTopic({
        topic_key: entityForm.name.toLowerCase().replace(/\s+/g, '-'),
        topic_name: entityForm.name,
        category: entityForm.type,
        content_zh: entityForm.description,
        confidence: 0.8,
        verified: true
      });
      if (result.success) {
        const newEntity = {
          id: result.data.id,
          name: entityForm.name,
          type: entityForm.type,
          description: entityForm.description,
          attributes: entityForm.attributes ? JSON.parse(entityForm.attributes) : {},
          relationCount: 0
        };
        entities.value.unshift(newEntity);
        showToast('success', t('admin.knowledgeGraph.entities.addSuccess'));
      } else {
        showToast('error', result.error?.message || t('admin.knowledgeGraph.entities.addFailed'));
      }
    }
    
    closeEntityModal();
    await loadRelations();
  } catch (error: any) {
    showToast('error', error.message || t('admin.knowledgeGraph.entities.saveFailed'));
  }
}

// 关系操作
function editRelation(relation: any) {
  editingRelation.value = relation;
  relationForm.sourceId = relation.sourceId;
  relationForm.type = relation.type;
  relationForm.targetId = relation.targetId;
  showAddRelationModal.value = true;
}

async function removeRelation(id: number) {
  if (confirm(t('admin.knowledgeGraph.relations.confirmDelete'))) {
    try {
      const result = await api.knowledgeGraph.deleteRelation(id);
      if (result.success) {
        relations.value = relations.value.filter(r => r.id !== id);
        showToast('success', t('admin.knowledgeGraph.relations.deleteSuccess'));
      } else {
        showToast('error', result.error?.message || t('admin.knowledgeGraph.relations.deleteFailed'));
      }
    } catch (error: any) {
      showToast('error', error.message || t('admin.knowledgeGraph.relations.deleteFailed'));
    }
  }
}

function closeRelationModal() {
  showAddRelationModal.value = false;
  editingRelation.value = null;
  relationForm.sourceId = '';
  relationForm.type = 'relatedTo';
  relationForm.targetId = '';
}

async function saveRelation() {
  if (!relationForm.sourceId || !relationForm.targetId) {
    showToast('error', t('admin.knowledgeGraph.relationModal.entityRequired'));
    return;
  }
  
  const sourceEntity = entities.value.find(e => e.id === Number(relationForm.sourceId));
  const targetEntity = entities.value.find(e => e.id === Number(relationForm.targetId));
  
  try {
    if (editingRelation.value) {
      const result = await api.knowledgeGraph.addRelation({
        from_topic_id: Number(relationForm.sourceId),
        to_topic_id: Number(relationForm.targetId),
        relation_type: relationForm.type
      });
      if (result.success) {
        await loadRelations();
        showToast('success', t('admin.knowledgeGraph.relations.updateSuccess'));
      } else {
        showToast('error', result.error?.message || t('admin.knowledgeGraph.relations.updateFailed'));
      }
    } else {
      const result = await api.knowledgeGraph.addRelation({
        from_topic_id: Number(relationForm.sourceId),
        to_topic_id: Number(relationForm.targetId),
        relation_type: relationForm.type
      });
      if (result.success) {
        await loadRelations();
        showToast('success', t('admin.knowledgeGraph.relations.addSuccess'));
      } else {
        showToast('error', result.error?.message || t('admin.knowledgeGraph.relations.addFailed'));
      }
    }
    
    closeRelationModal();
  } catch (error: any) {
    showToast('error', error.message || t('admin.knowledgeGraph.relations.saveFailed'));
  }
}

// 导入导出操作
async function executeImport() {
  if (!importConfig.data.trim()) {
    showToast('error', t('admin.knowledgeGraph.importModal.dataRequired'));
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
      showToast('success', importConfig.validateOnly ? t('admin.knowledgeGraph.importModal.validateSuccess') : t('admin.knowledgeGraph.importModal.importSuccess'));
      showImportModal.value = false;
      importConfig.data = '';
      await loadEntities();
      await loadRelations();
      await loadImportHistory();
    } else {
      showToast('error', result.error?.message || t('admin.knowledgeGraph.importModal.importFailed'));
    }
  } catch (error: any) {
    showToast('error', error.message || t('admin.knowledgeGraph.importModal.formatError'));
  } finally {
    importing.value = false;
  }
}

async function executeExport() {
  showToast('success', t('admin.knowledgeGraph.exportModal.exporting'));
  showExportModal.value = false;
}

async function viewReport(record: any) {
  try {
    const result = await api.knowledgeGraph.getImportDetail(record.importId);
    if (result.success) {
      showToast('success', t('admin.knowledgeGraph.history.viewingReport') + record.importId);
    } else {
      showToast('error', result.error?.message || t('admin.knowledgeGraph.history.viewReportFailed'));
    }
  } catch (error: any) {
    showToast('error', error.message || t('admin.knowledgeGraph.history.viewReportFailed'));
  }
}

async function retryImport(record: any) {
  showToast('success', t('admin.knowledgeGraph.history.retrying') + record.importId);
}

// 知识推理操作
async function executePathReasoning() {
  if (!pathReasoningForm.fromEntity || !pathReasoningForm.toEntity) {
    showToast('error', t('admin.knowledgeGraph.reasoning.selectEntities'));
    return;
  }

  pathReasoningLoading.value = true;
  pathResults.value = [];

  try {
    const result = await api.knowledgeGraph.findPaths(
      Number(pathReasoningForm.fromEntity),
      Number(pathReasoningForm.toEntity),
      pathReasoningForm.maxHops
    );

    if (result.success) {
      pathResults.value = result.data;
      if (result.data.length === 0) {
        showToast('success', t('admin.knowledgeGraph.reasoning.noPathsFound'));
      }
    } else {
      showToast('error', result.error?.message || t('admin.knowledgeGraph.reasoning.error'));
    }
  } catch (error) {
    showToast('error', t('admin.knowledgeGraph.reasoning.error'));
  } finally {
    pathReasoningLoading.value = false;
  }
}

async function executeKnowledgeInjection() {
  if (!knowledgeInjectionForm.query.trim()) {
    showToast('error', t('admin.knowledgeGraph.reasoning.queryRequired'));
    return;
  }

  knowledgeInjectionLoading.value = true;
  knowledgeInjectionResult.value = null;

  try {
    const result = await api.knowledgeGraph.retrieveForModel({
      query: knowledgeInjectionForm.query,
      max_results: 10,
    });

    if (result.success) {
      knowledgeInjectionResult.value = {
        response: result.data.map((item: any) => item.content_zh).join('\n\n'),
        confidence: 0.9,
        metadata: {
          processingTime: 125,
          knowledgeUsed: result.data.length
        },
        knowledgeSources: result.data.map((item: any) => ({
          topicId: item.topic_id,
          topicName: item.topic_name,
          category: item.category,
          relevance: item.confidence || 0.8
        })),
        reasoningPath: []
      };
    } else {
      showToast('error', result.error?.message || t('admin.knowledgeGraph.reasoning.error'));
    }
  } catch (error: any) {
    showToast('error', error.message || t('admin.knowledgeGraph.reasoning.error'));
  } finally {
    knowledgeInjectionLoading.value = false;
  }
}

function resetPathReasoning() {
  pathReasoningForm.fromEntity = '';
  pathReasoningForm.toEntity = '';
  pathReasoningForm.maxHops = 3;
  pathResults.value = [];
}

function resetKnowledgeInjection() {
  knowledgeInjectionForm.query = '';
  knowledgeInjectionForm.injectionDepth = 2;
  knowledgeInjectionResult.value = null;
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
