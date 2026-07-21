/**
 * 服务模块入口
 * 导出所有服务类
 */

export { KnowledgeRetriever } from './KnowledgeRetriever';
export { ConflictDetector } from './ConflictDetector';
export { DeviationAnalyzer } from './DeviationAnalyzer';
export { KnowledgeGraphAnalyzer } from './KnowledgeGraphAnalyzer';
export { DataSyncService, dataSyncService } from './DataSyncService';

export type { KnowledgeEntry, RAGQueryResult } from './KnowledgeRetriever';
export type { Conflict, ConflictReport, ConflictType } from './ConflictDetector';
export type { DeviationAnalysisResult, QualityAssessmentResult } from './DeviationAnalyzer';
export type { KnowledgeEntity, Relation, DomainRule, AnalyzedConflict, ConflictAnalysisReport } from './KnowledgeGraphAnalyzer';
export type { SyncEntityType, SyncOperationType, SyncStatus, ConflictResolutionStrategy, SyncRecord, SyncConflict, ValidationResult, SyncResult, SyncStatusInfo } from './DataSyncService';