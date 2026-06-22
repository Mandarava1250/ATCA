/**
 * 服务模块入口
 * 导出所有服务类
 */

export { KnowledgeRetriever } from './KnowledgeRetriever';
export { ConflictDetector } from './ConflictDetector';
export { DeviationAnalyzer } from './DeviationAnalyzer';
export { KnowledgeGraphAnalyzer } from './KnowledgeGraphAnalyzer';

export type { KnowledgeEntry, RAGQueryResult } from './KnowledgeRetriever';
export type { Conflict, ConflictReport, ConflictType } from './ConflictDetector';
export type { DeviationAnalysisResult, QualityAssessmentResult } from './DeviationAnalyzer';
export type { KnowledgeEntity, Relation, DomainRule, AnalyzedConflict, ConflictAnalysisReport } from './KnowledgeGraphAnalyzer';