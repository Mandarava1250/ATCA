/**
 * 华夏营造 - 知识图谱服务
 * 提供知识图谱数据导入、验证、关系管理等核心功能
 * 实现 IService 接口以纳入统一服务注册体系
 */

import sql from 'mssql';
import { query, execute, isMockMode } from '../config/database';
import { logger, ErrorType } from '../utils/logger';
import { IService, ServiceState } from '../core';

// ============ 类型定义 ============

export type ImportFormat = 'json-ld' | 'rdf-xml' | 'csv' | 'json';
export type ConflictStrategy = 'overwrite' | 'skip' | 'prompt';

export interface ImportOptions {
  format: ImportFormat;
  data: string;
  conflictStrategy: ConflictStrategy;
  validateOnly: boolean;
  batchSize: number;
  userId?: number;
  userName?: string;
}

export interface ValidationResult {
  isValid: boolean;
  totalRecords: number;
  warnings: Array<{ row: number; message: string }>;
  errors: Array<{ row: number; message: string; entityId?: string }>;
}

export interface ImportResult {
  importId: string;
  status: 'validated' | 'completed' | 'failed';
  totalRecords: number;
  successCount: number;
  failedCount: number;
  skippedCount: number;
  conflicts: Array<{ entityId: string; existingId: number; strategy: ConflictStrategy }>;
  errors: Array<{ row: number; message: string; entityId?: string }>;
  report: string;
  createdAt: string;
  duration?: number;
}

export interface ImportRecord {
  importId: string;
  format: ImportFormat;
  status: 'completed' | 'failed' | 'validated';
  conflictStrategy: ConflictStrategy;
  totalRecords: number;
  successCount: number;
  failedCount: number;
  skippedCount: number;
  createdBy: string;
  createdAt: string;
  duration: number;
  errorMessage?: string;
}

export interface RelationType {
  id: number;
  name: string;
  nameEn: string;
  description?: string;
  domain?: string;
  range?: string;
}

export interface AuditLog {
  id: number;
  action: string;
  user: string;
  userId: number;
  targetType: string;
  targetId: string | null;
  details: string;
  createdAt: string;
}

export interface Topic {
  topic_id: number;
  topic_key: string;
  topic_name: string;
  category: string;
  content_zh: string;
  content_en: string | null;
  source: string;
  confidence: number;
  verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface PathResult {
  path_id: number;
  path: string;
  path_names: string;
  path_types: string;
  hop_count: number;
}

export interface Neighbor {
  relation_id: number;
  neighbor_id: number;
  neighbor_name: string;
  neighbor_category: string;
  relation_type: string;
  relation_description: string | null;
}

// ============ 服务类 ============

class KnowledgeGraphService implements IService {
  readonly serviceId = 'knowledge-graph-service';
  readonly serviceName = '知识图谱服务';

  private static instance: KnowledgeGraphService | null = null;
  private state: ServiceState = ServiceState.UNREGISTERED;

  /**
   * 私有构造函数，防止直接实例化
   */
  private constructor() {
    // 私有构造函数
  }

  /**
   * 获取单例实例
   */
  static getInstance(): KnowledgeGraphService {
    if (!KnowledgeGraphService.instance) {
      KnowledgeGraphService.instance = new KnowledgeGraphService();
    }
    return KnowledgeGraphService.instance;
  }

  /**
   * 服务工厂函数（用于服务注册中心）
   */
  static createInstance(): KnowledgeGraphService {
    return KnowledgeGraphService.getInstance();
  }

  /**
   * 初始化服务
   */
  async initialize(): Promise<void> {
    this.state = ServiceState.INITIALIZING;
    logger.info('知识图谱服务初始化...');
    this.state = ServiceState.READY;
    logger.info('知识图谱服务初始化完成');
  }

  /**
   * 获取服务状态
   */
  getState(): ServiceState {
    return this.state;
  }

  /**
   * 健康检查
   */
  async healthCheck(): Promise<boolean> {
    return this.state === ServiceState.READY;
  }

  /**
   * 销毁服务
   */
  async dispose(): Promise<void> {
    this.state = ServiceState.DISPOSED;
    logger.info('知识图谱服务已销毁');
  }

  /**
   * 生成导入ID
   */
  private generateImportId(): string {
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.random().toString(36).slice(2, 8).toUpperCase();
    return `import-${timestamp}-${random}`;
  }

  /**
   * 解析JSON-LD格式数据
   */
  private parseJsonLd(data: string): any[] {
    try {
      const parsed = JSON.parse(data);
      // JSON-LD可以是单对象或数组
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      throw new Error('无法解析JSON-LD格式数据');
    }
  }

  /**
   * 解析RDF/XML格式数据（简化实现）
   */
  private parseRdfXml(data: string): any[] {
    // 简化的RDF/XML解析
    const entities: any[] = [];
    const regex = /<rdf:Description[^>]*>([\s\S]*?)<\/rdf:Description>/g;
    let match;
    
    while ((match = regex.exec(data)) !== null) {
      const content = match[1];
      const entity: any = {};
      
      // 提取about属性
      const aboutMatch = match[0].match(/about=["']([^"']+)["']/);
      if (aboutMatch) {
        entity.id = aboutMatch[1];
      }
      
      // 提取属性
      const propRegex = /<([^>]+)>([^<]+)<\/[^>]+>/g;
      let propMatch;
      while ((propMatch = propRegex.exec(content)) !== null) {
        const propName = propMatch[1].split(':').pop() || propMatch[1];
        entity[propName] = propMatch[2].trim();
      }
      
      entities.push(entity);
    }
    
    return entities;
  }

  /**
   * 解析CSV格式数据
   */
  private parseCsv(data: string): any[] {
    const lines = data.split('\n').filter(line => line.trim());
    if (lines.length === 0) return [];
    
    const headers = lines[0].split(',').map(h => h.trim());
    const entities: any[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      const entity: any = {};
      
      headers.forEach((header, index) => {
        entity[header] = values[index]?.trim() || '';
      });
      
      entities.push(entity);
    }
    
    return entities;
  }

  /**
   * 解析JSON格式数据
   */
  private parseJson(data: string): any[] {
    try {
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      throw new Error('无法解析JSON格式数据');
    }
  }

  /**
   * 根据格式解析数据
   */
  private parseData(format: ImportFormat, data: string): any[] {
    switch (format) {
      case 'json-ld':
        return this.parseJsonLd(data);
      case 'rdf-xml':
        return this.parseRdfXml(data);
      case 'csv':
        return this.parseCsv(data);
      case 'json':
        return this.parseJson(data);
      default:
        throw new Error(`不支持的格式: ${format}`);
    }
  }

  /**
   * 验证实体数据
   */
  private validateEntity(entity: any, row: number): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // 基本验证：检查必填字段
    if (!entity.id && !entity.entityId && !entity.uri) {
      errors.push('缺少实体ID（id/entityId/uri）');
    }
    
    if (!entity.name && !entity.label) {
      errors.push('缺少实体名称（name/label）');
    }
    
    // 验证数据类型
    if (entity.confidence !== undefined && 
        (typeof entity.confidence !== 'number' || entity.confidence < 0 || entity.confidence > 1)) {
      errors.push('confidence必须是0-1之间的数字');
    }
    
    // 验证关系数据
    if (entity.relations && Array.isArray(entity.relations)) {
      entity.relations.forEach((rel: any, idx: number) => {
        if (!rel.type) {
          errors.push(`关系[${idx}]缺少类型(type)`);
        }
        if (!rel.target) {
          errors.push(`关系[${idx}]缺少目标(target)`);
        }
      });
    }
    
    return { valid: errors.length === 0, errors };
  }

  /**
   * 验证数据格式和内容
   */
  async validateData(format: ImportFormat, data: string): Promise<ValidationResult> {
    const result: ValidationResult = {
      isValid: true,
      totalRecords: 0,
      warnings: [],
      errors: [],
    };

    try {
      const entities = this.parseData(format, data);
      result.totalRecords = entities.length;

      // 如果没有数据，视为有效
      if (entities.length === 0) {
        result.warnings.push({ row: 0, message: '数据为空' });
        return result;
      }

      // 逐行验证
      entities.forEach((entity, index) => {
        const row = index + 1;
        const validation = this.validateEntity(entity, row);
        
        if (!validation.valid) {
          validation.errors.forEach(error => {
            result.errors.push({ 
              row, 
              message: error,
              entityId: entity.id || entity.entityId 
            });
          });
        }
        
        // 警告：建议添加的字段
        if (!entity.description) {
          result.warnings.push({ row, message: '建议添加description字段' });
        }
        
        if (!entity.category) {
          result.warnings.push({ row, message: '建议添加category字段' });
        }
      });

      result.isValid = result.errors.length === 0;
      
    } catch (error: any) {
      result.isValid = false;
      result.errors.push({ row: 0, message: `解析失败: ${error.message}` });
    }

    return result;
  }

  /**
   * 检测冲突
   */
  private async detectConflicts(entities: any[]): Promise<Map<string, number>> {
    const conflicts = new Map<string, number>();
    
    // Mock模式下模拟冲突检测
    if (isMockMode()) {
      // 模拟每100条记录中有2条冲突
      entities.forEach((entity, index) => {
        const entityId = entity.id || entity.entityId || `entity-${index}`;
        if (index % 50 === 0 && index > 0) {
          conflicts.set(entityId, index * 100);
        }
      });
      return conflicts;
    }

    // 实际冲突检测逻辑（检查数据库中已存在的实体）
    for (const entity of entities) {
      const entityId = entity.id || entity.entityId;
      if (entityId) {
        try {
          // 检查实体是否已存在
          const results = await query('architecture', 
            'SELECT COUNT(*) as cnt FROM [knowledge_graph_entity] WHERE [entity_id] = @entityId',
            { entityId }
          );
          const count = (results[0] as any)?.cnt || 0;
          if (count > 0) {
            conflicts.set(entityId, count);
          }
        } catch {
          // 表可能不存在，跳过
        }
      }
    }

    return conflicts;
  }

  /**
   * 记录审计日志
   */
  private async logAudit(action: string, user: string, userId: number, targetType: string, targetId: string | null, details: string): Promise<void> {
    // Mock模式下仅记录到控制台
    if (isMockMode()) {
      logger.info(`[Audit] ${action} by ${user}(${userId}) on ${targetType}:${targetId} - ${details}`);
      return;
    }

    try {
      await execute('architecture', 
        `INSERT INTO [knowledge_graph_audit_log] 
         ([action], [user], [user_id], [target_type], [target_id], [details], [created_at])
         VALUES (@action, @user, @userId, @targetType, @targetId, @details, GETDATE())`,
        { action, user, userId, targetType, targetId, details }
      );
    } catch (error: any) {
      logger.error('记录审计日志失败', { 
        errorType: ErrorType.SYSTEM_ERROR, 
        errorCode: 'KG_AUDIT_ERROR',
        message: error.message 
      });
    }
  }

  /**
   * 执行数据导入
   */
  async importData(options: ImportOptions): Promise<ImportResult> {
    const startTime = Date.now();
    const importId = this.generateImportId();
    
    const result: ImportResult = {
      importId,
      status: 'completed',
      totalRecords: 0,
      successCount: 0,
      failedCount: 0,
      skippedCount: 0,
      conflicts: [],
      errors: [],
      report: '',
      createdAt: new Date().toISOString(),
    };

    try {
      // 1. 解析数据
      const entities = this.parseData(options.format, options.data);
      result.totalRecords = entities.length;

      if (entities.length === 0) {
        throw new Error('导入数据为空');
      }

      // 2. 验证数据
      const validation = await this.validateData(options.format, options.data);
      if (!validation.isValid) {
        result.errors = validation.errors;
        result.status = 'failed';
        result.report = `数据验证失败，发现${validation.errors.length}个错误`;
        return result;
      }

      // 3. 验证模式：仅验证不导入
      if (options.validateOnly) {
        result.status = 'validated';
        result.successCount = entities.length;
        result.report = `数据验证通过，共${entities.length}条记录`;
        return result;
      }

      // 4. 检测冲突
      const conflicts = await this.detectConflicts(entities);

      // 5. 批量导入
      let successCount = 0;
      let failedCount = 0;
      let skippedCount = 0;
      const importErrors: Array<{ row: number; message: string; entityId?: string }> = [];
      const detectedConflicts: Array<{ entityId: string; existingId: number; strategy: ConflictStrategy }> = [];

      for (let i = 0; i < entities.length; i += options.batchSize) {
        const batch = entities.slice(i, i + options.batchSize);
        
        for (const [index, entity] of batch.entries()) {
          const row = i + index + 1;
          const entityId = entity.id || entity.entityId;
          
          try {
            // 检查冲突
            if (conflicts.has(entityId)) {
              detectedConflicts.push({
                entityId: entityId!,
                existingId: conflicts.get(entityId)!,
                strategy: options.conflictStrategy,
              });
              
              switch (options.conflictStrategy) {
                case 'skip':
                  skippedCount++;
                  continue;
                case 'overwrite':
                  // 覆盖模式，继续处理
                  break;
                case 'prompt':
                  // 提示模式，视为失败
                  importErrors.push({ row, message: `检测到冲突，实体ID已存在`, entityId });
                  failedCount++;
                  continue;
              }
            }

            // 导入实体（Mock模式下直接成功）
            if (!isMockMode()) {
              // 实际导入逻辑
              await this.importEntity(entity);
            }
            
            successCount++;
          } catch (error: any) {
            importErrors.push({ row, message: error.message, entityId });
            failedCount++;
          }
        }
      }

      // 6. 更新结果
      result.successCount = successCount;
      result.failedCount = failedCount;
      result.skippedCount = skippedCount;
      result.errors = importErrors;
      result.conflicts = detectedConflicts;
      result.duration = Date.now() - startTime;

      // 7. 生成报告
      result.report = this.generateReport(result, options);

      // 8. 记录审计日志
      await this.logAudit(
        'IMPORT',
        options.userName || 'unknown',
        options.userId || 0,
        'KnowledgeGraph',
        importId,
        `导入${options.format}格式数据，成功${successCount}条，失败${failedCount}条，跳过${skippedCount}条`
      );

      // 9. 记录导入历史（非Mock模式）
      if (!isMockMode()) {
        await this.recordImportHistory({
          importId,
          format: options.format,
          status: successCount > 0 && failedCount === 0 ? 'completed' : 'failed',
          conflictStrategy: options.conflictStrategy,
          totalRecords: entities.length,
          successCount,
          failedCount,
          skippedCount,
          createdBy: options.userName || 'unknown',
          createdAt: new Date().toISOString(),
          duration: result.duration || 0,
        });
      }

    } catch (error: any) {
      result.status = 'failed';
      result.errors.push({ row: 0, message: error.message });
      result.report = `导入失败: ${error.message}`;
      
      await this.logAudit(
        'IMPORT_FAILED',
        options.userName || 'unknown',
        options.userId || 0,
        'KnowledgeGraph',
        importId,
        `导入失败: ${error.message}`
      );
    }

    return result;
  }

  /**
   * 导入单个实体（实际数据库操作）
   */
  private async importEntity(entity: any): Promise<void> {
    // 简化实现，实际项目中需要根据实体类型进行不同处理
    await execute('architecture',
      `INSERT INTO [knowledge_graph_entity] 
       ([entity_id], [name], [type], [description], [data], [created_at])
       VALUES (@entityId, @name, @type, @description, @data, GETDATE())`,
      {
        entityId: entity.id || entity.entityId || entity.uri,
        name: entity.name || entity.label || '未命名',
        type: entity.type || 'Unknown',
        description: entity.description || '',
        data: JSON.stringify(entity),
      }
    );

    // 如果有关系数据，导入关系
    if (entity.relations && Array.isArray(entity.relations)) {
      for (const rel of entity.relations) {
        await execute('architecture',
          `INSERT INTO [knowledge_graph_relation]
           ([source_id], [relation_type], [target_id], [data], [created_at])
           VALUES (@sourceId, @relationType, @targetId, @data, GETDATE())`,
          {
            sourceId: entity.id || entity.entityId,
            relationType: rel.type || 'relatedTo',
            targetId: rel.target,
            data: JSON.stringify(rel),
          }
        );
      }
    }
  }

  /**
   * 生成导入报告
   */
  private generateReport(result: ImportResult, options: ImportOptions): string {
    const lines: string[] = [];
    lines.push('知识图谱数据导入报告');
    lines.push('');
    lines.push('导入信息:');
    lines.push(`- 导入ID: ${result.importId}`);
    lines.push(`- 格式: ${options.format.toUpperCase()}`);
    lines.push(`- 冲突策略: ${options.conflictStrategy}`);
    lines.push(`- 操作者: ${options.userName || 'unknown'}`);
    lines.push(`- 时间: ${result.createdAt}`);
    lines.push(`- 耗时: ${result.duration ? `${result.duration}ms` : 'N/A'}`);
    lines.push('');
    lines.push('统计信息:');
    lines.push(`- 总记录数: ${result.totalRecords}`);
    lines.push(`- 成功导入: ${result.successCount}`);
    lines.push(`- 失败: ${result.failedCount}`);
    lines.push(`- 跳过: ${result.skippedCount}`);
    lines.push('');

    if (result.errors.length > 0) {
      lines.push('失败详情:');
      result.errors.slice(0, 10).forEach((error, idx) => {
        lines.push(`${idx + 1}. 第${error.row}行 - ${error.message}`);
      });
      if (result.errors.length > 10) {
        lines.push(`... 还有${result.errors.length - 10}条错误`);
      }
    }

    return lines.join('\n');
  }

  /**
   * 记录导入历史
   */
  private async recordImportHistory(record: {
    importId: string;
    format: ImportFormat;
    status: 'completed' | 'failed' | 'validated';
    conflictStrategy: ConflictStrategy;
    totalRecords: number;
    successCount: number;
    failedCount: number;
    skippedCount: number;
    createdBy: string;
    createdAt: string;
    duration: number;
  }): Promise<void> {
    await execute('architecture',
      `INSERT INTO [knowledge_graph_import_history]
       ([import_id], [format], [status], [conflict_strategy], 
        [total_records], [success_count], [failed_count], [skipped_count],
        [created_by], [created_at], [duration])
       VALUES (@importId, @format, @status, @conflictStrategy,
               @totalRecords, @successCount, @failedCount, @skippedCount,
               @createdBy, GETDATE(), @duration)`,
      record
    );
  }

  /**
   * 获取导入历史记录
   */
  async getImportHistory(params: {
    page: number;
    limit: number;
    status?: string;
    search?: string;
  }): Promise<{ data: ImportRecord[]; meta: { total: number; page: number; limit: number } }> {
    if (isMockMode()) {
      const mockData: Array<{
        importId: string;
        format: ImportFormat;
        status: 'completed' | 'failed' | 'validated';
        conflictStrategy: ConflictStrategy;
        totalRecords: number;
        successCount: number;
        failedCount: number;
        skippedCount: number;
        createdBy: string;
        createdAt: string;
        duration: number;
      }> = [
        {
          importId: 'import-20240115-ABC123',
          format: 'json-ld' as ImportFormat,
          status: 'completed',
          conflictStrategy: 'overwrite' as ConflictStrategy,
          totalRecords: 150,
          successCount: 145,
          failedCount: 5,
          skippedCount: 0,
          createdBy: 'admin',
          createdAt: '2024-01-15T10:30:00Z',
          duration: 1250,
        },
        {
          importId: 'import-20240114-DEF456',
          format: 'csv' as ImportFormat,
          status: 'completed',
          conflictStrategy: 'skip' as ConflictStrategy,
          totalRecords: 200,
          successCount: 200,
          failedCount: 0,
          skippedCount: 0,
          createdBy: 'admin',
          createdAt: '2024-01-14T14:20:00Z',
          duration: 890,
        },
      ];
      
      let filtered = mockData;
      if (params.status) {
        filtered = filtered.filter(r => r.status === params.status);
      }
      if (params.search) {
        const searchStr = params.search;
        filtered = filtered.filter(r => 
          r.importId.includes(searchStr) || 
          r.format.includes(searchStr) || 
          r.createdBy.includes(searchStr)
        );
      }
      
      return {
        data: filtered,
        meta: { total: filtered.length, page: params.page, limit: params.limit },
      };
    }

    // 实际查询逻辑
    let whereClause = 'WHERE 1=1';
    const queryParams: any = {};

    if (params.status) {
      whereClause += ' AND [status] = @status';
      queryParams.status = params.status;
    }

    if (params.search) {
      whereClause += ' AND ([import_id] LIKE @search OR [created_by] LIKE @search)';
      queryParams.search = `%${params.search}%`;
    }

    const offset = (params.page - 1) * params.limit;

    const records = await query('architecture',
      `SELECT [import_id] as importId, [format], [status], [conflict_strategy] as conflictStrategy,
              [total_records] as totalRecords, [success_count] as successCount, 
              [failed_count] as failedCount, [skipped_count] as skippedCount,
              [created_by] as createdBy, [created_at] as createdAt, [duration], [error_message] as errorMessage
       FROM [knowledge_graph_import_history]
       ${whereClause}
       ORDER BY [created_at] DESC
       OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`,
      { ...queryParams, offset, limit: params.limit }
    );

    const countResult = await query('architecture',
      `SELECT COUNT(*) as total FROM [knowledge_graph_import_history] ${whereClause}`,
      queryParams
    );

    return {
      data: records as ImportRecord[],
      meta: { 
        total: (countResult[0] as any)?.total || 0, 
        page: params.page, 
        limit: params.limit 
      },
    };
  }

  /**
   * 获取单次导入详情
   */
  async getImportDetail(importId: string): Promise<ImportResult | null> {
    if (isMockMode()) {
      return {
        importId,
        status: 'completed',
        totalRecords: 150,
        successCount: 145,
        failedCount: 5,
        skippedCount: 0,
        conflicts: [],
        errors: [
          { row: 23, message: '无效的实体ID格式' },
          { row: 56, message: '缺少必填字段: name' },
          { row: 89, message: '关系目标不存在' },
          { row: 112, message: '数据格式错误' },
          { row: 145, message: '重复的实体ID' },
        ],
        report: `知识图谱数据导入报告\n\n导入信息:\n- 导入ID: ${importId}\n- 格式: JSON-LD\n- 策略: 覆盖\n- 时间: 2024-01-15 10:30:00\n\n统计信息:\n- 总记录数: 150\n- 成功导入: 145\n- 失败: 5\n- 跳过: 0`,
        createdAt: '2024-01-15T10:30:00Z',
        duration: 1250,
      };
    }

    const result = await query('architecture',
      `SELECT [import_id] as importId, [format], [status], [conflict_strategy] as conflictStrategy,
              [total_records] as totalRecords, [success_count] as successCount, 
              [failed_count] as failedCount, [skipped_count] as skippedCount,
              [created_by] as createdBy, [created_at] as createdAt, [duration], [report], [errors]
       FROM [knowledge_graph_import_history]
       WHERE [import_id] = @importId`,
      { importId }
    );

    if (!result || result.length === 0) return null;

    const record = result[0] as any;
    
    return {
      importId: record.importId,
      status: record.status as 'completed' | 'failed' | 'validated',
      totalRecords: record.totalRecords,
      successCount: record.successCount,
      failedCount: record.failedCount,
      skippedCount: record.skippedCount,
      conflicts: [],
      errors: record.errors ? JSON.parse(record.errors) : [],
      report: record.report || '',
      createdAt: record.createdAt,
      duration: record.duration,
    };
  }

  /**
   * 删除导入记录
   */
  async deleteImportRecord(importId: string): Promise<boolean> {
    if (isMockMode()) {
      return true;
    }

    const result = await execute('architecture',
      'DELETE FROM [knowledge_graph_import_history] WHERE [import_id] = @importId',
      { importId }
    );

    return (result as any)?.rowsAffected > 0;
  }

  /**
   * 获取关系类型列表
   */
  async getRelationTypes(): Promise<RelationType[]> {
    if (isMockMode()) {
      return [
        { id: 1, name: '属于', nameEn: 'belongsTo', description: '实体所属类别', domain: 'Architecture', range: 'Category' },
        { id: 2, name: '位于', nameEn: 'locatedAt', description: '地理位置关系', domain: 'Architecture', range: 'Location' },
        { id: 3, name: '建造于', nameEn: 'builtIn', description: '建造年代', domain: 'Architecture', range: 'Dynasty' },
        { id: 4, name: '包含', nameEn: 'contains', description: '包含关系', domain: 'Architecture', range: 'Component' },
        { id: 5, name: '使用', nameEn: 'uses', description: '使用技术/材料', domain: 'Architecture', range: 'Technique' },
        { id: 6, name: '影响', nameEn: 'influencedBy', description: '受影响于', domain: 'Architecture', range: 'Architecture' },
      ];
    }

    const result = await query('architecture',
      'SELECT [id], [name], [name_en] as nameEn, [description], [domain], [range] FROM [knowledge_graph_relation_type] ORDER BY [id]'
    );

    return result as RelationType[];
  }

  /**
   * 添加关系类型
   */
  async addRelationType(data: Omit<RelationType, 'id'>): Promise<number> {
    if (isMockMode()) {
      return Math.floor(Math.random() * 1000);
    }

    const result = await execute('architecture',
      `INSERT INTO [knowledge_graph_relation_type]
       ([name], [name_en], [description], [domain], [range])
       OUTPUT INSERTED.[id]
       VALUES (@name, @nameEn, @description, @domain, @range)`,
      data
    );

    return (result as any)?.[0]?.id || 0;
  }

  /**
   * 更新关系类型
   */
  async updateRelationType(id: number, data: Partial<Omit<RelationType, 'id'>>): Promise<boolean> {
    if (isMockMode()) {
      return true;
    }

    const fields = Object.keys(data).map(k => `[${k === 'nameEn' ? 'name_en' : k}] = @${k}`).join(', ');
    const result = await execute('architecture',
      `UPDATE [knowledge_graph_relation_type] SET ${fields} WHERE [id] = @id`,
      { ...data, id }
    );

    return (result as any)?.rowsAffected > 0;
  }

  /**
   * 删除关系类型
   */
  async deleteRelationType(id: number): Promise<boolean> {
    if (isMockMode()) {
      return true;
    }

    const result = await execute('architecture',
      'DELETE FROM [knowledge_graph_relation_type] WHERE [id] = @id',
      { id }
    );

    return (result as any)?.rowsAffected > 0;
  }

  /**
   * 获取审计日志
   */
  async getAuditLogs(params: {
    page: number;
    limit: number;
    action?: string;
    user?: string;
  }): Promise<{ data: AuditLog[]; meta: { total: number; page: number; limit: number } }> {
    if (isMockMode()) {
      const mockData: AuditLog[] = [
        {
          id: 1,
          action: 'IMPORT',
          user: 'admin',
          userId: 1,
          targetType: 'KnowledgeGraph',
          targetId: 'import-20240115-ABC123',
          details: '导入JSON-LD格式数据，成功145条，失败5条',
          createdAt: '2024-01-15T10:30:00Z',
        },
        {
          id: 2,
          action: 'VALIDATE',
          user: 'admin',
          userId: 1,
          targetType: 'KnowledgeGraph',
          targetId: null,
          details: '验证CSV数据，共200条记录通过',
          createdAt: '2024-01-15T09:45:00Z',
        },
        {
          id: 3,
          action: 'ADD_RELATION',
          user: 'admin',
          userId: 1,
          targetType: 'RelationType',
          targetId: '7',
          details: '添加关系类型: influencedBy(影响)',
          createdAt: '2024-01-14T16:20:00Z',
        },
      ];
      
      let filtered = mockData;
      if (params.action) {
        filtered = filtered.filter(l => l.action === params.action);
      }
      if (params.user) {
        const userStr = params.user;
        filtered = filtered.filter(l => l.user.includes(userStr));
      }
      
      return {
        data: filtered,
        meta: { total: filtered.length, page: params.page, limit: params.limit },
      };
    }

    let whereClause = 'WHERE 1=1';
    const queryParams: any = {};

    if (params.action) {
      whereClause += ' AND [action] = @action';
      queryParams.action = params.action;
    }

    if (params.user) {
      whereClause += ' AND [user] LIKE @user';
      queryParams.user = `%${params.user}%`;
    }

    const offset = (params.page - 1) * params.limit;

    const logs = await query('architecture',
      `SELECT [id], [action], [user], [user_id] as userId, [target_type] as targetType,
              [target_id] as targetId, [details], [created_at] as createdAt
       FROM [knowledge_graph_audit_log]
       ${whereClause}
       ORDER BY [created_at] DESC
       OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`,
      { ...queryParams, offset, limit: params.limit }
    );

    const countResult = await query('architecture',
      `SELECT COUNT(*) as total FROM [knowledge_graph_audit_log] ${whereClause}`,
      queryParams
    );

    return {
      data: logs as AuditLog[],
      meta: { 
        total: (countResult[0] as any)?.total || 0, 
        page: params.page, 
        limit: params.limit 
      },
    };
  }

  /**
   * 获取统计信息
   */
  async getStats(): Promise<{
    totalEntities: number;
    totalRelations: number;
    entityTypes: Array<{ name: string; count: number }>;
    relationTypes: number;
    totalImports: number;
    lastImportDate?: string;
  }> {
    if (isMockMode()) {
      return {
        totalEntities: 5000,
        totalRelations: 12000,
        entityTypes: [
          { name: 'Architecture', count: 500 },
          { name: 'Person', count: 200 },
          { name: 'Dynasty', count: 50 },
          { name: 'Location', count: 300 },
          { name: 'Technique', count: 150 },
          { name: 'Material', count: 100 },
        ],
        relationTypes: 25,
        totalImports: 45,
        lastImportDate: '2024-01-15T10:30:00Z',
      };
    }

    // 实际统计查询
    const [entityCount, relationCount, relationTypeCount, importCount] = await Promise.all([
      query('architecture', 'SELECT COUNT(*) as cnt FROM [knowledge_graph_entity]'),
      query('architecture', 'SELECT COUNT(*) as cnt FROM [knowledge_graph_relation]'),
      query('architecture', 'SELECT COUNT(*) as cnt FROM [knowledge_graph_relation_type]'),
      query('architecture', 'SELECT COUNT(*) as cnt, MAX(created_at) as lastDate FROM [knowledge_graph_import_history]'),
    ]);

    // 获取实体类型统计（简化）
    const entityTypes: Array<{ name: string; count: number }> = [
      { name: 'Architecture', count: 0 },
      { name: 'Person', count: 0 },
      { name: 'Dynasty', count: 0 },
      { name: 'Location', count: 0 },
    ];

    return {
      totalEntities: (entityCount[0] as any)?.cnt || 0,
      totalRelations: (relationCount[0] as any)?.cnt || 0,
      entityTypes,
      relationTypes: (relationTypeCount[0] as any)?.cnt || 0,
      totalImports: (importCount[0] as any)?.cnt || 0,
      lastImportDate: (importCount[0] as any)?.lastDate,
    };
  }

  /**
   * 查询知识主题列表（支持分页和分类过滤）
   */
  async getTopics(params: {
    category?: string;
    page: number;
    pageSize: number;
  }): Promise<{ data: Topic[]; total: number }> {
    if (isMockMode()) {
      const mockTopics: Topic[] = [
        { topic_id: 1, topic_key: 'tailiang', topic_name: '抬梁式结构', category: 'structure', content_zh: '抬梁式是中国古建筑最主要的木结构形式...', content_en: 'Tailiang is the primary structural form...', source: '华夏营造知识库', confidence: 0.98, verified: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
        { topic_id: 2, topic_key: 'chuandou', topic_name: '穿斗式结构', category: 'structure', content_zh: '穿斗式是南方常见木结构形式...', content_en: 'Chuandou style is common in southern China...', source: '华夏营造知识库', confidence: 0.98, verified: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
        { topic_id: 3, topic_key: 'wudian', topic_name: '庑殿顶', category: 'structure', content_zh: '庑殿顶是中国古建筑最高等级的屋顶形制...', content_en: 'Wudian roof is the highest-ranking roof style...', source: '华夏营造知识库', confidence: 0.99, verified: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
        { topic_id: 5, topic_key: 'dougong', topic_name: '斗拱', category: 'component', content_zh: '斗拱是中国古建筑特有的结构构件...', content_en: 'Dougong is a unique structural component...', source: '华夏营造知识库', confidence: 0.99, verified: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
        { topic_id: 8, topic_key: 'foguangsi', topic_name: '佛光寺东大殿', category: 'famous', content_zh: '佛光寺东大殿是中国现存最早的木构建筑...', content_en: 'Foguang Temple East Hall is the earliest existing wooden structure...', source: '华夏营造知识库', confidence: 0.99, verified: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
        { topic_id: 10, topic_key: 'yingxian', topic_name: '应县木塔', category: 'famous', content_zh: '应县木塔是世界现存最高最古的木塔...', content_en: 'Yingxian Wooden Pagoda is the tallest and oldest existing wooden pagoda...', source: '华夏营造知识库', confidence: 0.99, verified: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
      ];
      
      let filtered = mockTopics;
      if (params.category) {
        filtered = filtered.filter(t => t.category === params.category);
      }
      
      const start = (params.page - 1) * params.pageSize;
      const end = start + params.pageSize;
      
      return {
        data: filtered.slice(start, end),
        total: filtered.length,
      };
    }

    // 使用 execute 获取多结果集（存储过程返回两个结果集：分页数据和总数）
    const result = await execute('architecture',
      'EXEC dbo.sp_kg_get_topics @category = @category, @page = @page, @page_size = @pageSize',
      { category: params.category || null, page: params.page, pageSize: params.pageSize }
    );

    // recordsets 是数组类型，[0] 是分页数据，[1] 是总数统计
    const recordsets = result.recordsets as sql.IRecordSet<any>[];
    const topics = recordsets[0] as Topic[];
    const total = recordsets[1] && recordsets[1].length > 0
      ? (recordsets[1][0] as any).total
      : 0;

    return { data: topics, total };
  }

  /**
   * 根据ID查询单个主题
   */
  async getTopicById(id: number): Promise<Topic | null> {
    if (isMockMode()) {
      const mockTopics: Topic[] = [
        { topic_id: 1, topic_key: 'tailiang', topic_name: '抬梁式结构', category: 'structure', content_zh: '抬梁式（叠梁式）是中国古建筑最主要的木结构形式。特点：柱上承梁，梁上抬梁，逐层缩短，最上层立脊瓜柱承脊檩。适用于宫殿、庙宇等大型建筑。代表：北京故宫太和殿。', content_en: 'Tailiang (post-and-beam) is the primary structural form of traditional Chinese architecture...', source: '华夏营造知识库', confidence: 0.98, verified: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
        { topic_id: 5, topic_key: 'dougong', topic_name: '斗拱', category: 'component', content_zh: '斗拱是中国古建筑特有的结构构件，位于柱头与梁架之间，由斗、拱、昂等构件组成。功能：承托屋檐重量、传递荷载、增加出檐深度。清代称斗科。斗口为模数单位。', content_en: 'Dougong (bracket sets) is a unique structural component of Chinese architecture...', source: '华夏营造知识库', confidence: 0.99, verified: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
        { topic_id: 8, topic_key: 'foguangsi', topic_name: '佛光寺东大殿', category: 'famous', content_zh: '佛光寺东大殿（857年）位于山西五台山，是中国现存最早的木构建筑。面阔七间，进深八架椽，单檐庑殿顶。殿内有唐代彩塑、壁画和题记。梁思成、林徽因于1937年发现。', content_en: 'Foguang Temple East Hall (857 AD) at Mount Wutai, Shanxi, is the earliest existing wooden structure...', source: '华夏营造知识库', confidence: 0.99, verified: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
      ];
      return mockTopics.find(t => t.topic_id === id) || null;
    }

    const result = await query('architecture',
      'SELECT * FROM dbo.kg_topics WHERE topic_id = @id',
      { id }
    );

    return result.length > 0 ? (result[0] as Topic) : null;
  }

  /**
   * 根据ID批量查询多个主题（优化N+1查询问题）
   */
  async getTopicsByIds(ids: number[]): Promise<Topic[]> {
    if (ids.length === 0) return [];

    if (isMockMode()) {
      const mockTopics: Topic[] = [
        { topic_id: 1, topic_key: 'tailiang', topic_name: '抬梁式结构', category: 'structure', content_zh: '抬梁式（叠梁式）是中国古建筑最主要的木结构形式。特点：柱上承梁，梁上抬梁，逐层缩短，最上层立脊瓜柱承脊檩。适用于宫殿、庙宇等大型建筑。代表：北京故宫太和殿。', content_en: 'Tailiang (post-and-beam) is the primary structural form of traditional Chinese architecture...', source: '华夏营造知识库', confidence: 0.98, verified: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
        { topic_id: 2, topic_key: 'chuandou', topic_name: '穿斗式结构', category: 'structure', content_zh: '穿斗式（立贴式）是南方常见木结构形式...', content_en: 'Chuandou style...', source: '华夏营造知识库', confidence: 0.98, verified: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
        { topic_id: 5, topic_key: 'dougong', topic_name: '斗拱', category: 'component', content_zh: '斗拱是中国古建筑特有的结构构件...', content_en: 'Dougong is a unique structural component...', source: '华夏营造知识库', confidence: 0.99, verified: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
        { topic_id: 7, topic_key: 'tang_architecture', topic_name: '唐代建筑特征', category: 'period', content_zh: '唐代建筑特征...', content_en: 'Tang Dynasty architecture...', source: '华夏营造知识库', confidence: 0.99, verified: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
        { topic_id: 8, topic_key: 'foguangsi', topic_name: '佛光寺东大殿', category: 'famous', content_zh: '佛光寺东大殿（857年）...', content_en: 'Foguang Temple East Hall...', source: '华夏营造知识库', confidence: 0.99, verified: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
        { topic_id: 10, topic_key: 'yingxian', topic_name: '应县木塔', category: 'famous', content_zh: '应县木塔是世界现存最高最古的木塔...', content_en: 'Yingxian Wooden Pagoda...', source: '华夏营造知识库', confidence: 0.99, verified: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
      ];
      return mockTopics.filter(t => ids.includes(t.topic_id));
    }

    // 使用参数化查询避免SQL注入风险
    const params: Record<string, number> = {};
    ids.forEach((id, idx) => {
      params[`id${idx}`] = id;
    });
    const placeholders = ids.map((_, idx) => `@id${idx}`).join(', ');
    const result = await query('architecture',
      `SELECT * FROM dbo.kg_topics WHERE topic_id IN (${placeholders})`,
      params
    );

    return result as Topic[];
  }

  /**
   * 根据名称搜索主题
   */
  async searchTopics(name: string): Promise<Topic[]> {
    if (isMockMode()) {
      const mockTopics: Topic[] = [
        { topic_id: 1, topic_key: 'tailiang', topic_name: '抬梁式结构', category: 'structure', content_zh: '抬梁式结构...', content_en: 'Tailiang...', source: '华夏营造知识库', confidence: 0.98, verified: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
        { topic_id: 5, topic_key: 'dougong', topic_name: '斗拱', category: 'component', content_zh: '斗拱...', content_en: 'Dougong...', source: '华夏营造知识库', confidence: 0.99, verified: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
      ];
      return mockTopics.filter(t => 
        t.topic_name.includes(name) || t.topic_key.includes(name)
      );
    }

    const result = await query('architecture',
      'EXEC dbo.sp_kg_find_topic @topic_name = @name',
      { name }
    );

    return result as Topic[];
  }

  /**
   * 查询实体的直接邻居（关系查询）
   */
  async getNeighbors(topicId: number, relationType?: string): Promise<Neighbor[]> {
    if (isMockMode()) {
      const mockNeighbors: Neighbor[] = [
        { relation_id: 1, neighbor_id: 5, neighbor_name: '斗拱', neighbor_category: 'component', relation_type: 'related_to', relation_description: '抬梁式结构使用斗拱' },
        { relation_id: 8, neighbor_id: 9, neighbor_name: '榫卯', neighbor_category: 'component', relation_type: 'related_to', relation_description: '榫卯用于抬梁式结构' },
        { relation_id: 7, neighbor_id: 6, neighbor_name: '材分制', neighbor_category: 'philosophy', relation_type: 'related_to', relation_description: '材分制以斗口为基本模数' },
      ];
      if (relationType) {
        return mockNeighbors.filter(n => n.relation_type === relationType);
      }
      return mockNeighbors;
    }

    const result = await query('architecture',
      'EXEC dbo.sp_kg_get_neighbors @topic_id = @topicId, @relation_type = @relationType',
      { topicId, relationType: relationType || null }
    );

    return result as Neighbor[];
  }

  /**
   * 路径查询：查找两个主题之间的所有路径
   */
  async findPaths(fromTopicId: number, toTopicId: number, maxHops: number = 3): Promise<PathResult[]> {
    if (isMockMode()) {
      if (fromTopicId === 8 && toTopicId === 5) {
        return [
          { path_id: 1, path: '8->5', path_names: '佛光寺东大殿->斗拱', path_types: 'related_to', hop_count: 1 },
        ];
      }
      if (fromTopicId === 1 && toTopicId === 6) {
        return [
          { path_id: 1, path: '1->5->6', path_names: '抬梁式结构->斗拱->材分制', path_types: 'related_to->related_to', hop_count: 2 },
        ];
      }
      return [];
    }

    const result = await query('architecture',
      'EXEC dbo.sp_kg_find_paths @from_topic_id = @fromTopicId, @to_topic_id = @toTopicId, @max_hops = @maxHops',
      { fromTopicId, toTopicId, maxHops }
    );

    return result as PathResult[];
  }

  /**
   * 获取所有分类
   */
  async getCategories(): Promise<Array<{ name: string; count: number }>> {
    if (isMockMode()) {
      return [
        { name: 'structure', count: 4 },
        { name: 'component', count: 2 },
        { name: 'philosophy', count: 1 },
        { name: 'period', count: 1 },
        { name: 'famous', count: 2 },
      ];
    }

    const result = await query('architecture',
      'SELECT category, COUNT(*) as count FROM dbo.kg_topics GROUP BY category ORDER BY count DESC'
    );

    return result as Array<{ name: string; count: number }>;
  }
}

// 导出类和服务实例
export { KnowledgeGraphService };
export const knowledgeGraphService = KnowledgeGraphService.getInstance();

export default KnowledgeGraphService;
