<template>
  <div class="admin-page">
    <!-- 消息提示 -->
    <div v-if="messageText" class="message-toast" :class="messageType">
      <svg v-if="messageType === 'success'" viewBox="0 0 24 24" width="16" height="16"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" fill="currentColor"/></svg>
      <svg v-else viewBox="0 0 24 24" width="16" height="16"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fill="currentColor"/></svg>
      {{ messageText }}
    </div>

    <div class="page-toolbar">
      <input v-model="search" @input="debounceSearch" class="atca-input search-input" :placeholder="$t('admin.searchArch') || '搜索古建筑...'" />
      <div style="display:flex;gap:8px;align-items:center">
        <div v-if="selectedIds.length > 0" class="batch-bar">
          <span>已选 {{ selectedIds.length }} 项</span>
          <button class="atca-btn atca-btn-sm atca-btn-danger" @click="batchDelete">批量删除</button>
          <button class="atca-btn atca-btn-sm atca-btn-secondary" @click="selectedIds = []">取消</button>
        </div>
        <button class="atca-btn atca-btn-primary" @click="openAdd">
          <svg viewBox="0 0 24 24" width="16" height="16"><path d="M12 4v16m8-8H4" stroke="currentColor" fill="none" stroke-width="2"/></svg>
          {{ $t('admin.add') || '添加' }}
        </button>
      </div>
    </div>

    <div class="data-table-wrapper" :class="{ loading: loading }">
      <div v-if="loading" class="loading-overlay">
        <div class="loading-spinner"></div>
        <span>加载中...</span>
      </div>
      <table class="data-table">
        <thead>
          <tr>
            <th class="col-check"><input type="checkbox" :checked="isAllSelected" @change="toggleSelectAll" /></th>
            <th class="col-img">封面</th>
            <th>ID</th>
            <th>{{ $t('admin.name') || '名称' }}</th>
            <th>{{ $t('admin.type') || '类型' }}</th>
            <th>{{ $t('admin.dynasty') || '朝代' }}</th>
            <th>{{ $t('admin.location') || '位置' }}</th>
            <th>保护级别</th>
            <th>精选</th>
            <th>{{ $t('admin.actions') || '操作' }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="arch in architectures" :key="arch.architecture_id">
            <td class="col-check"><input type="checkbox" :value="arch.architecture_id" v-model="selectedIds" /></td>
            <td class="col-img">
              <img v-if="arch.main_image_url" :src="arch.main_image_url" class="arch-thumb" alt="封面" />
              <div v-else class="arch-thumb-placeholder">
                <svg viewBox="0 0 24 24" width="16" height="16"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
              </div>
            </td>
            <td>{{ arch.architecture_id }}</td>
            <td>
              <div class="arch-name">{{ arch.chinese_name || arch.name }}</div>
              <div v-if="arch.chinese_name && arch.name && arch.chinese_name !== arch.name" class="arch-cn-name">{{ arch.name }}</div>
            </td>
            <td><span class="atca-tag">{{ arch.type }}</span></td>
            <td>{{ arch.founding_dynasty || '--' }}</td>
            <td>{{ arch.location || '--' }}</td>
            <td>{{ arch.protection_level || '--' }}</td>
            <td>
              <span class="featured-badge" v-if="arch.is_featured">&#9733;</span>
              <span v-else>--</span>
            </td>
            <td>
              <button class="btn-text" @click="viewArch(arch)">{{ $t('admin.view') || '查看' }}</button>
              <button class="btn-text" @click="editArch(arch)">{{ $t('admin.edit') || '编辑' }}</button>
              <button class="btn-text danger" @click="deleteArch(arch.architecture_id, arch.chinese_name || arch.name)">{{ $t('admin.delete') || '删除' }}</button>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-if="!architectures.length" class="empty-table">
        <div v-if="loadError" style="color:var(--color-error);margin-bottom:8px">{{ loadError }}</div>
        <div v-else>{{ $t('admin.noData') || '暂无数据' }}</div>
      </div>
    </div>

    <!-- 编辑/查看弹窗 -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-card modal-xl">
        <div class="modal-header">
          <h3>
            <template v-if="viewMode">{{ $t('admin.viewArchitecture') || '查看古建筑' }}</template>
            <template v-else-if="editingId">{{ $t('admin.editArchitecture') || '编辑古建筑' }}</template>
            <template v-else>{{ $t('admin.addArchitecture') || '添加古建筑' }}</template>
          </h3>
          <button v-if="viewMode" class="modal-close" @click="closeModal">
            <svg viewBox="0 0 24 24" width="20" height="20"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="currentColor"/></svg>
          </button>
        </div>

        <div v-if="modalLoading" class="modal-loading">
          <div class="loading-spinner"></div>
          <span>加载中...</span>
        </div>

        <template v-else>
          <div class="form-tabs">
            <button class="form-tab" :class="{ active: activeTab === 'basic' }" @click="activeTab = 'basic'">基本信息</button>
            <button class="form-tab" :class="{ active: activeTab === 'detail' }" @click="activeTab = 'detail'">详细介绍</button>
            <button class="form-tab" :class="{ active: activeTab === 'media' }" @click="activeTab = 'media'">图片与标签</button>
            <button class="form-tab" :class="{ active: activeTab === 'history' }" @click="loadSubTableData('history')">历史发展</button>
            <button class="form-tab" :class="{ active: activeTab === 'structure' }" @click="loadSubTableData('structure')">技术结构</button>
            <button class="form-tab" :class="{ active: activeTab === 'features' }" @click="loadSubTableData('features')">建筑特色</button>
            <button class="form-tab" :class="{ active: activeTab === 'culture' }" @click="loadSubTableData('culture')">文化意义</button>
            <button class="form-tab" :class="{ active: activeTab === 'experts' }" @click="loadSubTableData('experts')">专家观点</button>
          </div>

          <!-- 基本信息 -->
          <div v-show="activeTab === 'basic'" class="form-panel">
            <div class="form-grid">
              <div class="form-group">
                <label>名称 (英文) *</label>
                <input v-model="form.name" class="atca-input" :disabled="viewMode" required placeholder="如: Forbidden City" />
                <div v-if="!form.name && !viewMode && saveAttempted" class="form-error">请输入名称</div>
              </div>
              <div class="form-group">
                <label>中文名称</label>
                <input v-model="form.chinese_name" class="atca-input" :disabled="viewMode" placeholder="如: 紫禁城" />
              </div>
              <div class="form-group">
                <label>类型 *</label>
                <select v-model="form.type" class="atca-input" :disabled="viewMode" required>
                  <option value="">请选择</option>
                  <option v-for="t in typeOptions" :key="t" :value="t">{{ t }}</option>
                </select>
                <div v-if="!form.type && !viewMode && saveAttempted" class="form-error">请选择类型</div>
              </div>
              <div class="form-group">
                <label>始建朝代</label>
                <select v-model="form.founding_dynasty" class="atca-input" :disabled="viewMode">
                  <option value="">请选择</option>
                  <option v-for="d in dynasties" :key="d" :value="d">{{ d }}</option>
                </select>
              </div>
              <div class="form-group">
                <label>完成朝代</label>
                <select v-model="form.completed_dynasty" class="atca-input" :disabled="viewMode">
                  <option value="">请选择</option>
                  <option v-for="d in dynasties" :key="d" :value="d">{{ d }}</option>
                </select>
              </div>
              <div class="form-group full">
                <label>所在位置</label>
                <input v-model="form.location" class="atca-input" :disabled="viewMode" placeholder="如: 北京市东城区" />
              </div>
              <div class="form-group">
                <label>纬度</label>
                <input v-model.number="form.latitude" type="number" step="0.0001" class="atca-input" :disabled="viewMode" placeholder="如: 39.9163" />
              </div>
              <div class="form-group">
                <label>经度</label>
                <input v-model.number="form.longitude" type="number" step="0.0001" class="atca-input" :disabled="viewMode" placeholder="如: 116.3972" />
              </div>
              <div class="form-group">
                <label>建造年代</label>
                <input v-model="form.construction_date" class="atca-input" :disabled="viewMode" placeholder="如: 1406-1420" />
              </div>
              <div class="form-group">
                <label>建筑师/设计者</label>
                <input v-model="form.architect" class="atca-input" :disabled="viewMode" placeholder="如: 蒯祥" />
              </div>
              <div class="form-group">
                <label>保护级别</label>
                <select v-model="form.protection_level" class="atca-input" :disabled="viewMode">
                  <option value="">请选择</option>
                  <option value="世界文化遗产">世界文化遗产</option>
                  <option value="全国重点文物保护单位">全国重点文物保护单位</option>
                  <option value="省级文物保护单位">省级文物保护单位</option>
                  <option value="市级文物保护单位">市级文物保护单位</option>
                  <option value="县级文物保护单位">县级文物保护单位</option>
                </select>
              </div>
              <div class="form-group">
                <label>精选推荐</label>
                <select v-model="form.is_featured" class="atca-input" :disabled="viewMode">
                  <option :value="false">否</option>
                  <option :value="true">是</option>
                </select>
              </div>
            </div>
          </div>

          <!-- 详细介绍 -->
          <div v-show="activeTab === 'detail'" class="form-panel">
            <div class="form-grid single-col">
              <div class="form-group full">
                <label>简要描述</label>
                <textarea v-model="form.brief_description" class="atca-input" :disabled="viewMode" rows="3" placeholder="一句话简介..."></textarea>
              </div>
              <div class="form-group full">
                <label>详细描述</label>
                <textarea v-model="form.full_description" class="atca-input" :disabled="viewMode" rows="8" placeholder="完整建筑描述，支持多段落..."></textarea>
              </div>
              <div class="form-group full">
                <label>建筑结构特点</label>
                <textarea v-model="form.structural_features" class="atca-input" :disabled="viewMode" rows="3" placeholder="斗拱、梁架、屋顶形式等..."></textarea>
              </div>
              <div class="form-group full">
                <label>历史意义</label>
                <textarea v-model="form.historical_significance" class="atca-input" :disabled="viewMode" rows="3" placeholder="该建筑的历史文化价值..."></textarea>
              </div>
              <div class="form-group full">
                <label>现状描述</label>
                <textarea v-model="form.current_status" class="atca-input" :disabled="viewMode" rows="3" placeholder="当前保存状况..."></textarea>
              </div>
            </div>
          </div>

          <!-- 图片与标签 -->
          <div v-show="activeTab === 'media'" class="form-panel">
            <div class="form-grid single-col">
              <div class="form-group full">
                <label>封面图片URL</label>
                <input v-model="form.main_image_url" class="atca-input" :disabled="viewMode" placeholder="https://example.com/image.jpg" />
                <div v-if="form.main_image_url" class="image-preview">
                  <img :src="form.main_image_url" alt="封面预览" @error="($event.target as HTMLElement)?.style && (($event.target as HTMLElement).style.display = 'none')" />
                </div>
              </div>
              <div class="form-group full">
                <label>图片画廊URLs（每行一个）</label>
                <textarea v-model="galleryUrls" class="atca-input" :disabled="viewMode" rows="4" placeholder="https://example.com/img1.jpg&#10;https://example.com/img2.jpg"></textarea>
              </div>
              <div class="form-group full">
                <label>标签（逗号分隔）</label>
                <input v-model="form.tags" class="atca-input" :disabled="viewMode" placeholder="宫殿, 木质结构, 世界文化遗产" />
              </div>
              <div class="form-group full">
                <label>3D模型URL</label>
                <input v-model="form.model_3d_url" class="atca-input" :disabled="viewMode" placeholder="模型文件链接" />
              </div>
              <div class="form-group full">
                <label>VR全景URL</label>
                <input v-model="form.vr_panorama_url" class="atca-input" :disabled="viewMode" placeholder="全景图链接" />
              </div>
            </div>
          </div>

          <!-- 子表管理：历史发展 -->
          <div v-show="activeTab === 'history'" class="form-panel">
            <div class="subtable-header">
              <button v-if="!viewMode" class="atca-btn atca-btn-sm atca-btn-primary" @click="openSubTableForm('history')">
                <svg viewBox="0 0 24 24" width="14" height="14"><path d="M12 4v16m8-8H4" stroke="currentColor" fill="none" stroke-width="2"/></svg>
                添加历史发展
              </button>
              <button v-if="!viewMode && subTableSelection['history'].length > 0" class="atca-btn atca-btn-sm atca-btn-danger" @click="batchDeleteSubTable('history')">
                批量删除 ({{ subTableSelection['history'].length }})
              </button>
            </div>
            <div v-if="subTableLoading" class="mini-loading">
              <div class="mini-spinner"></div>
            </div>
            <div v-else-if="subTableData['history'].length === 0" class="empty-subtable">
              <svg viewBox="0 0 24 24" width="32" height="32"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
              <p>暂无历史发展数据</p>
            </div>
            <table v-else class="subtable">
              <thead>
                <tr>
                  <th class="col-check"><input type="checkbox" :checked="isSubTableAllSelected('history')" @change="toggleSubTableSelectAll('history')" /></th>
                  <th>朝代时期</th>
                  <th>标题</th>
                  <th>内容摘要</th>
                  <th>{{ $t('admin.actions') || '操作' }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in subTableData['history']" :key="item.development_id">
                  <td class="col-check"><input type="checkbox" :value="item.development_id" v-model="subTableSelection['history']" /></td>
                  <td>{{ item.dynasty_period || '--' }}</td>
                  <td>{{ item.development_title }}</td>
                  <td>{{ item.development_content?.substring(0, 50) }}{{ item.development_content?.length > 50 ? '...' : '' }}</td>
                  <td>
                    <button v-if="!viewMode" class="btn-text" @click="editSubTableItem('history', item)">编辑</button>
                    <button v-if="!viewMode" class="btn-text danger" @click="deleteSubTableItem('history', item.development_id)">删除</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- 子表管理：技术结构 -->
          <div v-show="activeTab === 'structure'" class="form-panel">
            <div class="subtable-header">
              <button v-if="!viewMode" class="atca-btn atca-btn-sm atca-btn-primary" @click="openSubTableForm('structure')">
                <svg viewBox="0 0 24 24" width="14" height="14"><path d="M12 4v16m8-8H4" stroke="currentColor" fill="none" stroke-width="2"/></svg>
                添加技术结构
              </button>
              <button v-if="!viewMode && subTableSelection['structure'].length > 0" class="atca-btn atca-btn-sm atca-btn-danger" @click="batchDeleteSubTable('structure')">
                批量删除 ({{ subTableSelection['structure'].length }})
              </button>
            </div>
            <div v-if="subTableLoading" class="mini-loading">
              <div class="mini-spinner"></div>
            </div>
            <div v-else-if="subTableData['structure'].length === 0" class="empty-subtable">
              <svg viewBox="0 0 24 24" width="32" height="32"><path d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
              <p>暂无技术结构数据</p>
            </div>
            <table v-else class="subtable">
              <thead>
                <tr>
                  <th class="col-check"><input type="checkbox" :checked="isSubTableAllSelected('structure')" @change="toggleSubTableSelectAll('structure')" /></th>
                  <th>结构名称</th>
                  <th>分类</th>
                  <th>描述摘要</th>
                  <th>{{ $t('admin.actions') || '操作' }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in subTableData['structure']" :key="item.structure_id">
                  <td class="col-check"><input type="checkbox" :value="item.structure_id" v-model="subTableSelection['structure']" /></td>
                  <td>{{ item.structure_name }}</td>
                  <td>{{ item.technical_category }}</td>
                  <td>{{ item.technical_description?.substring(0, 50) }}{{ item.technical_description?.length > 50 ? '...' : '' }}</td>
                  <td>
                    <button v-if="!viewMode" class="btn-text" @click="editSubTableItem('structure', item)">编辑</button>
                    <button v-if="!viewMode" class="btn-text danger" @click="deleteSubTableItem('structure', item.structure_id)">删除</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- 子表管理：建筑特色 -->
          <div v-show="activeTab === 'features'" class="form-panel">
            <div class="subtable-header">
              <button v-if="!viewMode" class="atca-btn atca-btn-sm atca-btn-primary" @click="openSubTableForm('features')">
                <svg viewBox="0 0 24 24" width="14" height="14"><path d="M12 4v16m8-8H4" stroke="currentColor" fill="none" stroke-width="2"/></svg>
                添加建筑特色
              </button>
              <button v-if="!viewMode && subTableSelection['features'].length > 0" class="atca-btn atca-btn-sm atca-btn-danger" @click="batchDeleteSubTable('features')">
                批量删除 ({{ subTableSelection['features'].length }})
              </button>
            </div>
            <div v-if="subTableLoading" class="mini-loading">
              <div class="mini-spinner"></div>
            </div>
            <div v-else-if="subTableData['features'].length === 0" class="empty-subtable">
              <svg viewBox="0 0 24 24" width="32" height="32"><path d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
              <p>暂无建筑特色数据</p>
            </div>
            <table v-else class="subtable">
              <thead>
                <tr>
                  <th class="col-check"><input type="checkbox" :checked="isSubTableAllSelected('features')" @change="toggleSubTableSelectAll('features')" /></th>
                  <th>特色名称</th>
                  <th>设计理念</th>
                  <th>空间组织</th>
                  <th>{{ $t('admin.actions') || '操作' }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in subTableData['features']" :key="item.feature_id">
                  <td class="col-check"><input type="checkbox" :value="item.feature_id" v-model="subTableSelection['features']" /></td>
                  <td>{{ item.feature_name }}</td>
                  <td>{{ item.design_philosophy?.substring(0, 30) }}{{ item.design_philosophy?.length > 30 ? '...' : '' }}</td>
                  <td>{{ item.spatial_organization?.substring(0, 30) }}{{ item.spatial_organization?.length > 30 ? '...' : '' }}</td>
                  <td>
                    <button v-if="!viewMode" class="btn-text" @click="editSubTableItem('features', item)">编辑</button>
                    <button v-if="!viewMode" class="btn-text danger" @click="deleteSubTableItem('features', item.feature_id)">删除</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- 子表管理：文化意义 -->
          <div v-show="activeTab === 'culture'" class="form-panel">
            <div class="subtable-header">
              <button v-if="!viewMode" class="atca-btn atca-btn-sm atca-btn-primary" @click="openSubTableForm('culture')">
                <svg viewBox="0 0 24 24" width="14" height="14"><path d="M12 4v16m8-8H4" stroke="currentColor" fill="none" stroke-width="2"/></svg>
                添加文化意义
              </button>
              <button v-if="!viewMode && subTableSelection['culture'].length > 0" class="atca-btn atca-btn-sm atca-btn-danger" @click="batchDeleteSubTable('culture')">
                批量删除 ({{ subTableSelection['culture'].length }})
              </button>
            </div>
            <div v-if="subTableLoading" class="mini-loading">
              <div class="mini-spinner"></div>
            </div>
            <div v-else-if="subTableData['culture'].length === 0" class="empty-subtable">
              <svg viewBox="0 0 24 24" width="32" height="32"><path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
              <p>暂无文化意义数据</p>
            </div>
            <table v-else class="subtable">
              <thead>
                <tr>
                  <th class="col-check"><input type="checkbox" :checked="isSubTableAllSelected('culture')" @change="toggleSubTableSelectAll('culture')" /></th>
                  <th>意义方面</th>
                  <th>文化解读</th>
                  <th>当代价值</th>
                  <th>{{ $t('admin.actions') || '操作' }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in subTableData['culture']" :key="item.significance_id">
                  <td class="col-check"><input type="checkbox" :value="item.significance_id" v-model="subTableSelection['culture']" /></td>
                  <td>{{ item.significance_aspect }}</td>
                  <td>{{ item.cultural_interpretation?.substring(0, 30) }}{{ item.cultural_interpretation?.length > 30 ? '...' : '' }}</td>
                  <td>{{ item.contemporary_value?.substring(0, 30) }}{{ item.contemporary_value?.length > 30 ? '...' : '' }}</td>
                  <td>
                    <button v-if="!viewMode" class="btn-text" @click="editSubTableItem('culture', item)">编辑</button>
                    <button v-if="!viewMode" class="btn-text danger" @click="deleteSubTableItem('culture', item.significance_id)">删除</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- 子表管理：专家观点 -->
          <div v-show="activeTab === 'experts'" class="form-panel">
            <div class="subtable-header">
              <button v-if="!viewMode" class="atca-btn atca-btn-sm atca-btn-primary" @click="openSubTableForm('experts')">
                <svg viewBox="0 0 24 24" width="14" height="14"><path d="M12 4v16m8-8H4" stroke="currentColor" fill="none" stroke-width="2"/></svg>
                添加专家观点
              </button>
              <button v-if="!viewMode && subTableSelection['experts'].length > 0" class="atca-btn atca-btn-sm atca-btn-danger" @click="batchDeleteSubTable('experts')">
                批量删除 ({{ subTableSelection['experts'].length }})
              </button>
            </div>
            <div v-if="subTableLoading" class="mini-loading">
              <div class="mini-spinner"></div>
            </div>
            <div v-else-if="subTableData['experts'].length === 0" class="empty-subtable">
              <svg viewBox="0 0 24 24" width="32" height="32"><path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
              <p>暂无专家观点数据</p>
            </div>
            <table v-else class="subtable">
              <thead>
                <tr>
                  <th class="col-check"><input type="checkbox" :checked="isSubTableAllSelected('experts')" @change="toggleSubTableSelectAll('experts')" /></th>
                  <th>专家姓名</th>
                  <th>职称</th>
                  <th>观点摘要</th>
                  <th>{{ $t('admin.actions') || '操作' }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in subTableData['experts']" :key="item.quote_id">
                  <td class="col-check"><input type="checkbox" :value="item.quote_id" v-model="subTableSelection['experts']" /></td>
                  <td>{{ item.expert_name }}</td>
                  <td>{{ item.expert_title || '--' }}</td>
                  <td>{{ item.quote_content?.substring(0, 50) }}{{ item.quote_content?.length > 50 ? '...' : '' }}</td>
                  <td>
                    <button v-if="!viewMode" class="btn-text" @click="editSubTableItem('experts', item)">编辑</button>
                    <button v-if="!viewMode" class="btn-text danger" @click="deleteSubTableItem('experts', item.quote_id)">删除</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="modal-actions" v-if="!viewMode">
            <button class="atca-btn atca-btn-secondary" @click="closeModal">{{ $t('common.cancel') || '取消' }}</button>
            <button class="atca-btn atca-btn-primary" :disabled="saving" @click="saveArch">
              <span v-if="saving" class="btn-loading"><div class="mini-spinner"></div></span>
              {{ saving ? '保存中...' : ($t('common.save') || '保存') }}
            </button>
          </div>
          <div class="modal-actions" v-else>
            <button class="atca-btn atca-btn-primary" @click="switchToEdit">{{ $t('admin.edit') || '编辑' }}</button>
            <button class="atca-btn atca-btn-secondary" @click="closeModal">{{ $t('common.close') || '关闭' }}</button>
          </div>
        </template>
      </div>
    </div>

    <!-- 子表编辑弹窗 -->
    <div v-if="showSubTableModal" class="modal-overlay" @click.self="closeSubTableModal">
      <div class="modal-card">
        <div class="modal-header">
          <h3>{{ subTableModalTitle }}</h3>
          <button class="modal-close" @click="closeSubTableModal">
            <svg viewBox="0 0 24 24" width="20" height="20"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="currentColor"/></svg>
          </button>
        </div>
        <div class="subtable-form">
          <!-- 历史发展表单 -->
          <template v-if="currentSubTable === 'history'">
            <div class="form-grid single-col">
              <div class="form-group">
                <label>朝代时期 *</label>
                <input v-model="subTableForm.dynasty_period" class="atca-input" required placeholder="如: 明朝" />
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>起始年份</label>
                  <input v-model.number="subTableForm.start_year" type="number" class="atca-input" placeholder="如: 1406" />
                </div>
                <div class="form-group">
                  <label>结束年份</label>
                  <input v-model.number="subTableForm.end_year" type="number" class="atca-input" placeholder="如: 1420" />
                </div>
              </div>
              <div class="form-group">
                <label>发展标题 *</label>
                <input v-model="subTableForm.development_title" class="atca-input" required placeholder="如: 始建时期" />
              </div>
              <div class="form-group">
                <label>发展内容 *</label>
                <textarea v-model="subTableForm.development_content" class="atca-input" rows="4" required placeholder="详细描述这一时期的发展..."></textarea>
              </div>
              <div class="form-group">
                <label>建筑变化</label>
                <textarea v-model="subTableForm.architectural_changes" class="atca-input" rows="2" placeholder="描述建筑在此时期的变化..."></textarea>
              </div>
              <div class="form-group">
                <label>历史背景</label>
                <textarea v-model="subTableForm.historical_context" class="atca-input" rows="2" placeholder="相关历史背景..."></textarea>
              </div>
            </div>
          </template>

          <!-- 技术结构表单 -->
          <template v-if="currentSubTable === 'structure'">
            <div class="form-grid single-col">
              <div class="form-group">
                <label>结构名称 *</label>
                <input v-model="subTableForm.structure_name" class="atca-input" required placeholder="如: 抬梁式结构" />
              </div>
              <div class="form-group">
                <label>技术分类 *</label>
                <input v-model="subTableForm.technical_category" class="atca-input" required placeholder="如: 木构架" />
              </div>
              <div class="form-group">
                <label>技术描述 *</label>
                <textarea v-model="subTableForm.technical_description" class="atca-input" rows="4" required placeholder="详细描述该技术结构..."></textarea>
              </div>
              <div class="form-group">
                <label>技术原理</label>
                <textarea v-model="subTableForm.technical_principles" class="atca-input" rows="2" placeholder="技术原理说明..."></textarea>
              </div>
              <div class="form-group">
                <label>历史价值</label>
                <textarea v-model="subTableForm.historical_value" class="atca-input" rows="2" placeholder="历史价值说明..."></textarea>
              </div>
              <div class="form-group">
                <label>遗产状态</label>
                <input v-model="subTableForm.heritage_status" class="atca-input" placeholder="如: 保存完好" />
              </div>
            </div>
          </template>

          <!-- 建筑特色表单 -->
          <template v-if="currentSubTable === 'features'">
            <div class="form-grid single-col">
              <div class="form-group">
                <label>特色名称 *</label>
                <input v-model="subTableForm.feature_name" class="atca-input" required placeholder="如: 重檐庑殿顶" />
              </div>
              <div class="form-group">
                <label>设计理念</label>
                <textarea v-model="subTableForm.design_philosophy" class="atca-input" rows="3" placeholder="设计理念说明..."></textarea>
              </div>
              <div class="form-group">
                <label>空间组织</label>
                <textarea v-model="subTableForm.spatial_organization" class="atca-input" rows="3" placeholder="空间布局描述..."></textarea>
              </div>
              <div class="form-group">
                <label>美学特征</label>
                <textarea v-model="subTableForm.aesthetic_characteristics" class="atca-input" rows="3" placeholder="美学特征描述..."></textarea>
              </div>
              <div class="form-group">
                <label>功能方面</label>
                <textarea v-model="subTableForm.functional_aspects" class="atca-input" rows="3" placeholder="功能描述..."></textarea>
              </div>
            </div>
          </template>

          <!-- 文化意义表单 -->
          <template v-if="currentSubTable === 'culture'">
            <div class="form-grid single-col">
              <div class="form-group">
                <label>意义方面 *</label>
                <input v-model="subTableForm.significance_aspect" class="atca-input" required placeholder="如: 皇权象征" />
              </div>
              <div class="form-group">
                <label>哲学基础</label>
                <textarea v-model="subTableForm.philosophical_basis" class="atca-input" rows="2" placeholder="哲学基础说明..."></textarea>
              </div>
              <div class="form-group">
                <label>文化解读 *</label>
                <textarea v-model="subTableForm.cultural_interpretation" class="atca-input" rows="4" required placeholder="文化解读内容..."></textarea>
              </div>
              <div class="form-group">
                <label>社会影响</label>
                <textarea v-model="subTableForm.social_influence" class="atca-input" rows="2" placeholder="社会影响描述..."></textarea>
              </div>
              <div class="form-group">
                <label>当代价值</label>
                <textarea v-model="subTableForm.contemporary_value" class="atca-input" rows="2" placeholder="当代价值说明..."></textarea>
              </div>
            </div>
          </template>

          <!-- 专家观点表单 -->
          <template v-if="currentSubTable === 'experts'">
            <div class="form-grid single-col">
              <div class="form-group">
                <label>专家姓名 *</label>
                <input v-model="subTableForm.expert_name" class="atca-input" required placeholder="如: 梁思成" />
              </div>
              <div class="form-group">
                <label>职称</label>
                <input v-model="subTableForm.expert_title" class="atca-input" placeholder="如: 建筑学家" />
              </div>
              <div class="form-group">
                <label>观点内容 *</label>
                <textarea v-model="subTableForm.quote_content" class="atca-input" rows="4" required placeholder="专家观点内容..."></textarea>
              </div>
              <div class="form-group">
                <label>来源</label>
                <input v-model="subTableForm.source" class="atca-input" placeholder="如: 《中国建筑史》" />
              </div>
            </div>
          </template>
        </div>
        <div class="modal-actions">
          <button class="atca-btn atca-btn-secondary" @click="closeSubTableModal">{{ $t('common.cancel') || '取消' }}</button>
          <button class="atca-btn atca-btn-primary" :disabled="subTableSaving" @click="saveSubTableItem">
            <span v-if="subTableSaving" class="btn-loading"><div class="mini-spinner"></div></span>
            {{ subTableSaving ? '保存中...' : ($t('common.save') || '保存') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { adminApi, http, archSubTableApi } from '@/services/api';
import { useMemoryTrack } from '@/composables/useMemoryTrack';

const memTrack = useMemoryTrack('AdminArchitecture');
const dynasties = ['先秦', '秦汉', '魏晋南北朝', '隋唐', '宋', '辽', '元', '明', '清'];
const typeOptions = ['宫殿', '寺庙', '祭祀建筑', '塔', '园林', '民居', '城墙', '桥梁', '楼阁', '石窟', '牌坊', '陵墓', '阙', '坛', '鼓楼', '戏台', '书院', '会馆'];

const architectures = ref<any[]>([]);
const loadError = ref('');
const loading = ref(false);
const saving = ref(false);
const messageText = ref('');
const messageType = ref<'success' | 'error'>('success');
const selectedIds = ref<number[]>([]);

function showMessage(text: string, type: 'success' | 'error' = 'success') {
  messageText.value = text;
  messageType.value = type;
  setTimeout(() => {
    messageText.value = '';
  }, 3000);
}
const isAllSelected = computed(() => architectures.value.length > 0 && selectedIds.value.length === architectures.value.length);
function toggleSelectAll() { if (isAllSelected.value) selectedIds.value = []; else selectedIds.value = architectures.value.map(a => a.architecture_id); }
const search = ref('');
const showModal = ref(false);
const editingId = ref<number | null>(null);
const viewMode = ref(false);
const modalLoading = ref(false);
const activeTab = ref('basic');
const galleryUrls = ref('');
const saveAttempted = ref(false);

const form = ref<any>({
  name: '',
  chinese_name: '',
  type: '',
  founding_dynasty: '',
  completed_dynasty: '',
  location: '',
  latitude: null,
  longitude: null,
  construction_date: '',
  architect: '',
  protection_level: '',
  is_featured: false,
  brief_description: '',
  full_description: '',
  structural_features: '',
  historical_significance: '',
  current_status: '',
  main_image_url: '',
  tags: '',
  model_3d_url: '',
  vr_panorama_url: '',
});

let searchTimer: ReturnType<typeof setTimeout> | null = null;

function debounceSearch() {
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = setTimeout(() => loadData(), 300);
}

async function loadData() {
  loading.value = true;
  loadError.value = '';
  try {
    const res = await adminApi.getArchitectures({ search: search.value, page: 1, limit: 50 });
    architectures.value = res.data || [];
    if (!architectures.value.length) loadError.value = '数据库中没有古建筑记录';
  } catch (e: any) {
    console.error('[Arch] 加载失败:', e);
    loadError.value = '加载失败: ' + (e.message || '网络/服务器错误');
  } finally {
    loading.value = false;
  }
}

async function batchDelete() {
  if (!selectedIds.value.length || !confirm(`确认删除 ${selectedIds.value.length} 个古建筑？此操作不可恢复。`)) return;
  loading.value = true;
  try {
    const res = await adminApi.batchDeleteArchitectures(selectedIds.value);
    if (res.success) {
      const { deleted, totalRequested, truncated, duration, errors } = res.data;
      let msg = `成功删除 ${deleted} 个古建筑`;
      if (totalRequested !== deleted) {
        msg += ` (请求: ${totalRequested}, 实际处理: ${deleted})`;
      }
      if (truncated) {
        msg += ` (由于数量限制，部分建筑未被处理)`;
      }
      if (duration) {
        msg += ` - 耗时 ${duration}ms`;
      }
      showMessage(msg);
      if (errors && errors.length > 0) {
        console.warn('批量删除部分失败:', errors);
      }
      selectedIds.value = [];
      await loadData();
    } else {
      showMessage('批量删除失败: ' + (res.error?.message || '未知错误'), 'error');
    }
  } catch (e: any) {
    console.error('批量删除失败:', e);
    showMessage('批量删除失败: ' + (e.message || '网络/服务器错误'), 'error');
  } finally {
    loading.value = false;
  }
}

function openAdd() {
  editingId.value = null;
  viewMode.value = false;
  activeTab.value = 'basic';
  galleryUrls.value = '';
  saveAttempted.value = false;
  form.value = {
    name: '', chinese_name: '', type: '', founding_dynasty: '', completed_dynasty: '', location: '',
    latitude: null, longitude: null, construction_date: '', architect: '',
    protection_level: '', is_featured: false, brief_description: '',
    full_description: '', structural_features: '', historical_significance: '',
    current_status: '', main_image_url: '', tags: '', model_3d_url: '', vr_panorama_url: '',
  };
  showModal.value = true;
}

function closeModal() {
  showModal.value = false;
  editingId.value = null;
  viewMode.value = false;
  galleryUrls.value = '';
  saveAttempted.value = false;
}

async function viewArch(arch: any) {
  modalLoading.value = true;
  editingId.value = arch.architecture_id;
  viewMode.value = true;
  activeTab.value = 'basic';
  showModal.value = true;
  try {
    const res = await adminApi.getArchitectureById(arch.architecture_id);
    if (res.success && res.data) {
      const data = { ...res.data };
      if (data.coordinates) {
        const [lat, lng] = data.coordinates.split(',').map(Number);
        data.latitude = isNaN(lat) ? null : lat;
        data.longitude = isNaN(lng) ? null : lng;
      }
      form.value = data;
      galleryUrls.value = (res.data.image_gallery || []).join('\n');
    } else {
      const data = { ...arch };
      if (data.coordinates) {
        const [lat, lng] = data.coordinates.split(',').map(Number);
        data.latitude = isNaN(lat) ? null : lat;
        data.longitude = isNaN(lng) ? null : lng;
      }
      form.value = data;
      galleryUrls.value = (arch.image_gallery || []).join('\n');
    }
  } catch (e: any) {
    console.error('[Arch] 获取详情失败:', e);
    showMessage('获取建筑详情失败: ' + (e.message || '网络/服务器错误'), 'error');
    const data = { ...arch };
    if (data.coordinates) {
      const [lat, lng] = data.coordinates.split(',').map(Number);
      data.latitude = isNaN(lat) ? null : lat;
      data.longitude = isNaN(lng) ? null : lng;
    }
    form.value = data;
    galleryUrls.value = (arch.image_gallery || []).join('\n');
  } finally {
    modalLoading.value = false;
  }
}

async function editArch(arch: any) {
  modalLoading.value = true;
  editingId.value = arch.architecture_id;
  viewMode.value = false;
  activeTab.value = 'basic';
  saveAttempted.value = false;
  showModal.value = true;
  try {
    const res = await adminApi.getArchitectureById(arch.architecture_id);
    if (res.success && res.data) {
      const data = { ...res.data };
      if (data.coordinates) {
        const [lat, lng] = data.coordinates.split(',').map(Number);
        data.latitude = isNaN(lat) ? null : lat;
        data.longitude = isNaN(lng) ? null : lng;
      }
      form.value = data;
      galleryUrls.value = (res.data.image_gallery || []).join('\n');
    } else {
      const data = { ...arch };
      if (data.coordinates) {
        const [lat, lng] = data.coordinates.split(',').map(Number);
        data.latitude = isNaN(lat) ? null : lat;
        data.longitude = isNaN(lng) ? null : lng;
      }
      form.value = data;
      galleryUrls.value = (arch.image_gallery || []).join('\n');
    }
  } catch (e: any) {
    console.error('[Arch] 获取详情失败:', e);
    showMessage('获取建筑详情失败: ' + (e.message || '网络/服务器错误'), 'error');
    const data = { ...arch };
    if (data.coordinates) {
      const [lat, lng] = data.coordinates.split(',').map(Number);
      data.latitude = isNaN(lat) ? null : lat;
      data.longitude = isNaN(lng) ? null : lng;
    }
    form.value = data;
    galleryUrls.value = (arch.image_gallery || []).join('\n');
  } finally {
    modalLoading.value = false;
  }
}

function switchToEdit() {
  viewMode.value = false;
  saveAttempted.value = false;
}

function validateForm(): boolean {
  saveAttempted.value = true;
  const errors: string[] = [];
  if (!form.value.name?.trim()) errors.push('请输入名称');
  if (!form.value.type) errors.push('请选择类型');
  if (errors.length > 0) {
    showMessage(errors.join('；'), 'error');
    return false;
  }
  return true;
}

async function saveArch() {
  if (!validateForm()) return;
  saving.value = true;
  try {
    const payload = { ...form.value };
    if (galleryUrls.value.trim()) {
      payload.image_gallery = galleryUrls.value.split('\n').map((u: string) => u.trim()).filter(Boolean);
    }
    let res;
    if (editingId.value) {
      res = await adminApi.updateArchitecture(editingId.value, payload);
    } else {
      res = await adminApi.createArchitecture(payload);
    }
    if (res.success) {
      showMessage(editingId.value ? '建筑信息更新成功' : '建筑添加成功');
      closeModal();
      http.clearCache('/admin/architectures');
      await loadData();
    } else {
      showMessage('保存失败: ' + (res.error?.message || '未知错误'), 'error');
    }
  } catch (e: any) {
    console.error('[Arch] 保存失败:', e);
    showMessage('保存失败: ' + (e.message || '网络/服务器错误'), 'error');
  } finally {
    saving.value = false;
  }
}

async function deleteArch(id: number, name: string) {
  if (!confirm(`确认删除古建筑「${name}」？此操作不可恢复。`)) return;
  try {
    const res = await adminApi.deleteArchitecture(id);
    if (res.success) {
      showMessage('删除成功');
      await loadData();
    } else {
      showMessage('删除失败: ' + (res.error?.message || '未知错误'), 'error');
    }
  } catch (e: any) {
    console.error('[Arch] 删除失败:', e);
    showMessage('删除失败: ' + (e.message || '网络/服务器错误'), 'error');
  }
}

// ============ 子表管理功能 ============
type SubTableType = 'history' | 'structure' | 'features' | 'culture' | 'experts';

const subTableData = ref<Record<SubTableType, any[]>>({
  history: [],
  structure: [],
  features: [],
  culture: [],
  experts: [],
});

const subTableSelection = ref<Record<SubTableType, number[]>>({
  history: [],
  structure: [],
  features: [],
  culture: [],
  experts: [],
});

const subTableLoading = ref(false);
const showSubTableModal = ref(false);
const currentSubTable = ref<SubTableType>('history');
const subTableEditingId = ref<number | null>(null);
const subTableSaving = ref(false);

const subTableForm = ref<any>({});

const subTableModalTitle = computed(() => {
  const titles: Record<SubTableType, string> = {
    history: subTableEditingId.value ? '编辑历史发展' : '添加历史发展',
    structure: subTableEditingId.value ? '编辑技术结构' : '添加技术结构',
    features: subTableEditingId.value ? '编辑建筑特色' : '添加建筑特色',
    culture: subTableEditingId.value ? '编辑文化意义' : '添加文化意义',
    experts: subTableEditingId.value ? '编辑专家观点' : '添加专家观点',
  };
  return titles[currentSubTable.value];
});

async function loadSubTableData(type: SubTableType) {
  if (!editingId.value) return;
  subTableLoading.value = true;
  try {
    let res;
    switch (type) {
      case 'history':
        res = await archSubTableApi.getHistory(editingId.value);
        break;
      case 'structure':
        res = await archSubTableApi.getStructure(editingId.value);
        break;
      case 'features':
        res = await archSubTableApi.getFeatures(editingId.value);
        break;
      case 'culture':
        res = await archSubTableApi.getCulture(editingId.value);
        break;
      case 'experts':
        res = await archSubTableApi.getExperts(editingId.value);
        break;
    }
    if (res?.success) {
      subTableData.value[type] = res.data || [];
    }
  } catch (e: any) {
    console.error(`[SubTable] 加载${type}数据失败:`, e);
    showMessage('加载数据失败: ' + (e.message || '网络/服务器错误'), 'error');
  } finally {
    subTableLoading.value = false;
  }
}

function isSubTableAllSelected(type: SubTableType): boolean {
  return subTableData.value[type].length > 0 && subTableSelection.value[type].length === subTableData.value[type].length;
}

function toggleSubTableSelectAll(type: SubTableType) {
  if (isSubTableAllSelected(type)) {
    subTableSelection.value[type] = [];
  } else {
    subTableSelection.value[type] = subTableData.value[type].map(item => {
      const idKeys = ['development_id', 'structure_id', 'feature_id', 'significance_id', 'quote_id'];
      for (const key of idKeys) {
        if (item[key] !== undefined) return item[key];
      }
      return 0;
    }).filter(id => id !== 0);
  }
}

function openSubTableForm(type: SubTableType) {
  currentSubTable.value = type;
  subTableEditingId.value = null;
  subTableForm.value = getEmptySubTableForm(type);
  showSubTableModal.value = true;
}

function getEmptySubTableForm(type: SubTableType): any {
  switch (type) {
    case 'history':
      return { dynasty_period: '', start_year: null, end_year: null, development_title: '', development_content: '', architectural_changes: '', historical_context: '' };
    case 'structure':
      return { structure_name: '', technical_category: '', technical_description: '', technical_principles: '', historical_value: '', heritage_status: '' };
    case 'features':
      return { feature_name: '', design_philosophy: '', spatial_organization: '', aesthetic_characteristics: '', functional_aspects: '' };
    case 'culture':
      return { significance_aspect: '', philosophical_basis: '', cultural_interpretation: '', social_influence: '', contemporary_value: '' };
    case 'experts':
      return { expert_name: '', expert_title: '', quote_content: '', source: '' };
    default:
      return {};
  }
}

function editSubTableItem(type: SubTableType, item: any) {
  currentSubTable.value = type;
  subTableEditingId.value = getItemId(item);
  subTableForm.value = { ...item };
  showSubTableModal.value = true;
}

function getItemId(item: any): number | null {
  const idKeys = ['development_id', 'structure_id', 'feature_id', 'significance_id', 'quote_id'];
  for (const key of idKeys) {
    if (item[key] !== undefined) return item[key];
  }
  return null;
}

function closeSubTableModal() {
  showSubTableModal.value = false;
  subTableEditingId.value = null;
  subTableForm.value = {};
}

async function saveSubTableItem() {
  if (!editingId.value) return;
  
  const requiredFields: Record<SubTableType, string[]> = {
    history: ['dynasty_period', 'development_title', 'development_content'],
    structure: ['structure_name', 'technical_category', 'technical_description'],
    features: ['feature_name'],
    culture: ['significance_aspect', 'cultural_interpretation'],
    experts: ['expert_name', 'quote_content'],
  };

  const missing = requiredFields[currentSubTable.value].filter(field => !subTableForm.value[field]?.trim());
  if (missing.length > 0) {
    showMessage(`请填写必填字段: ${missing.join('、')}`, 'error');
    return;
  }

  subTableSaving.value = true;
  try {
    const payload = { ...subTableForm.value };
    let res;

    if (subTableEditingId.value) {
      switch (currentSubTable.value) {
        case 'history':
          res = await archSubTableApi.updateHistory(editingId.value, subTableEditingId.value, payload);
          break;
        case 'structure':
          res = await archSubTableApi.updateStructure(editingId.value, subTableEditingId.value, payload);
          break;
        case 'features':
          res = await archSubTableApi.updateFeature(editingId.value, subTableEditingId.value, payload);
          break;
        case 'culture':
          res = await archSubTableApi.updateCulture(editingId.value, subTableEditingId.value, payload);
          break;
        case 'experts':
          res = await archSubTableApi.updateExpert(editingId.value, subTableEditingId.value, payload);
          break;
      }
    } else {
      switch (currentSubTable.value) {
        case 'history':
          res = await archSubTableApi.createHistory(editingId.value, payload);
          break;
        case 'structure':
          res = await archSubTableApi.createStructure(editingId.value, payload);
          break;
        case 'features':
          res = await archSubTableApi.createFeature(editingId.value, payload);
          break;
        case 'culture':
          res = await archSubTableApi.createCulture(editingId.value, payload);
          break;
        case 'experts':
          res = await archSubTableApi.createExpert(editingId.value, payload);
          break;
      }
    }

    if (res?.success) {
      showMessage(subTableEditingId.value ? '更新成功' : '添加成功');
      closeSubTableModal();
      await loadSubTableData(currentSubTable.value);
    } else {
      showMessage('保存失败: ' + (res?.error?.message || '未知错误'), 'error');
    }
  } catch (e: any) {
    console.error(`[SubTable] 保存${currentSubTable.value}失败:`, e);
    showMessage('保存失败: ' + (e.message || '网络/服务器错误'), 'error');
  } finally {
    subTableSaving.value = false;
  }
}

async function deleteSubTableItem(type: SubTableType, id: number) {
  if (!editingId.value) return;
  if (!confirm('确认删除此项？此操作不可恢复。')) return;

  try {
    let res;
    switch (type) {
      case 'history':
        res = await archSubTableApi.deleteHistory(editingId.value, id);
        break;
      case 'structure':
        res = await archSubTableApi.deleteStructure(editingId.value, id);
        break;
      case 'features':
        res = await archSubTableApi.deleteFeature(editingId.value, id);
        break;
      case 'culture':
        res = await archSubTableApi.deleteCulture(editingId.value, id);
        break;
      case 'experts':
        res = await archSubTableApi.deleteExpert(editingId.value, id);
        break;
    }

    if (res?.success) {
      showMessage('删除成功');
      await loadSubTableData(type);
    } else {
      showMessage('删除失败: ' + (res?.error?.message || '未知错误'), 'error');
    }
  } catch (e: any) {
    console.error(`[SubTable] 删除${type}失败:`, e);
    showMessage('删除失败: ' + (e.message || '网络/服务器错误'), 'error');
  }
}

async function batchDeleteSubTable(type: SubTableType) {
  if (!editingId.value || subTableSelection.value[type].length === 0) return;
  if (!confirm(`确认删除选中的 ${subTableSelection.value[type].length} 项？此操作不可恢复。`)) return;

  try {
    let res;
    switch (type) {
      case 'history':
        res = await archSubTableApi.batchDeleteHistory(editingId.value, subTableSelection.value[type]);
        break;
      case 'structure':
        res = await archSubTableApi.batchDeleteStructure(editingId.value, subTableSelection.value[type]);
        break;
      case 'features':
        res = await archSubTableApi.batchDeleteFeatures(editingId.value, subTableSelection.value[type]);
        break;
      case 'culture':
        res = await archSubTableApi.batchDeleteCulture(editingId.value, subTableSelection.value[type]);
        break;
      case 'experts':
        res = await archSubTableApi.batchDeleteExperts(editingId.value, subTableSelection.value[type]);
        break;
    }

    if (res?.success) {
      showMessage('批量删除成功');
      subTableSelection.value[type] = [];
      await loadSubTableData(type);
    } else {
      showMessage('批量删除失败: ' + (res?.error?.message || '未知错误'), 'error');
    }
  } catch (e: any) {
    console.error(`[SubTable] 批量删除${type}失败:`, e);
    showMessage('批量删除失败: ' + (e.message || '网络/服务器错误'), 'error');
  }
}

function handleRouteChange() { loadData(); }
window.addEventListener('admin-route-change', handleRouteChange);
memTrack.trackListener('admin-route-change', 'window');
onUnmounted(() => { memTrack.untrackListener('admin-route-change', 'window'); window.removeEventListener('admin-route-change', handleRouteChange); });
onMounted(loadData);
</script>

<style scoped>
/* 消息提示 */
.message-toast {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 12px 24px;
  border-radius: var(--r-md);
  font-size: 0.875rem;
  z-index: 1000;
  animation: slideIn 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}
.message-toast.success { background: rgba(90,123,108,0.9); color: #fff; }
.message-toast.error { background: rgba(139,58,42,0.9); color: #fff; }
@keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }

/* 表格专有样式 */
.col-img { width: 60px; text-align: center; }
.arch-thumb { width: 48px; height: 36px; object-fit: cover; border-radius: var(--r-sm); border: 1px solid var(--border); }
.arch-thumb-placeholder { width: 48px; height: 36px; border-radius: var(--r-sm); background: var(--bg-hover); display: flex; align-items: center; justify-content: center; color: var(--text-muted); border: 1px dashed var(--border); margin: 0 auto; }
.arch-name { font-weight: 500; }
.arch-cn-name { font-size: 0.75rem; color: var(--text-muted); }
.featured-badge { color: var(--gold); font-size: 1rem; }
.form-panel { max-height: 55vh; overflow-y: auto; padding-right: 4px; }
.image-preview { margin-top: 8px; max-width: 200px; }
.image-preview img { width: 100%; border-radius: var(--r-md); border: 1px solid var(--border); }

/* 加载状态 */
.data-table-wrapper.loading { position: relative; }
.loading-overlay {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(255,255,255,0.8);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  z-index: 10;
  border-radius: var(--r-lg);
}
.loading-spinner {
  width: 40px; height: 40px;
  border: 3px solid var(--border);
  border-top-color: var(--gold);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.modal-loading {
  padding: 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

/* 模态框头部 */
.modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.modal-close {
  background: none; border: none; cursor: pointer;
  padding: 4px; border-radius: var(--r-sm);
  color: var(--text-muted); transition: all var(--t-fast);
}
.modal-close:hover { background: var(--bg-hover); color: var(--text-primary); }

/* 表单错误提示 */
.form-error {
  color: #C27B7B;
  font-size: 0.75rem;
  margin-top: 4px;
  display: flex;
  align-items: center;
  gap: 4px;
}

/* 按钮加载状态 */
.btn-loading { display: inline-flex; align-items: center; margin-right: 8px; }
.mini-spinner {
  width: 14px; height: 14px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

/* 查看模式样式 */
.form-panel :deep(.atca-input:disabled) {
  background: var(--bg-hover);
  color: var(--text-muted);
  cursor: not-allowed;
  border-color: transparent;
}
.form-panel :deep(.atca-input:disabled:focus) {
  outline: none;
  box-shadow: none;
}

/* ===== 子表管理样式 ===== */

/* 子表头部 */
.subtable-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  gap: 12px;
}

/* 子表表格 */
.subtable {
  width: 100%;
  border-collapse: collapse;
  background: var(--bg-card);
  border-radius: var(--r-md);
  overflow: hidden;
}
.subtable thead {
  background: var(--bg-hover);
}
.subtable th,
.subtable td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid var(--border);
  font-size: 0.875rem;
}
.subtable th {
  font-weight: 600;
  color: var(--text-muted);
  white-space: nowrap;
}
.subtable tbody tr:hover {
  background: var(--bg-hover);
}
.subtable tbody tr:last-child td {
  border-bottom: none;
}

/* 子表空状态 */
.empty-subtable {
  text-align: center;
  padding: 40px 20px;
  color: var(--text-muted);
}
.empty-subtable svg {
  margin-bottom: 12px;
  opacity: 0.5;
}
.empty-subtable p {
  font-size: 0.875rem;
  margin: 0;
}

/* 子表加载状态 */
.mini-loading {
  display: flex;
  justify-content: center;
  padding: 40px;
}
.mini-loading .mini-spinner {
  width: 24px;
  height: 24px;
  border-color: var(--border);
  border-top-color: var(--gold);
}

/* 子表表单 */
.subtable-form {
  padding: 8px 0;
}

/* 表单行布局 */
.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

/* 表单网格单列 */
.form-grid.single-col {
  grid-template-columns: 1fr;
}
</style>