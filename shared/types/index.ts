// ============================================
// 华夏营造 - 共享类型定义
// ============================================

// 通用响应包装
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

// 用户相关类型
export interface User {
  userId: number;
  username: string;
  nickname: string | null;
  email: string;
  avatar: string;
  points: number;
  level: number;
  role: 'user' | 'admin' | 'moderator';
  isActive: boolean;
  createdAt: string;
  lastLogin: string | null;
}

export interface UserProfile extends User {
  bio?: string;
  location?: string;
  interests?: string[];
  socialLinks?: Record<string, string>;
  notificationPreferences?: Record<string, boolean>;
  visibility?: 'public' | 'friends' | 'private';
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  password: string;
  email: string;
  nickname?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface JwtPayload {
  userId: number;
  username: string;
  role: string;
  iat?: number;
  exp?: number;
  type?: 'access' | 'refresh';
}

// 建筑相关类型
export interface Architecture {
  architectureId: number;
  name: string;
  chineseName: string | null;
  location: string | null;
  coordinates: string | null;
  type: string;
  foundingDynasty: string | null;
  completedDynasty: string | null;
  protectionLevel: string | null;
  briefDescription: string | null;
  fullDescription: string | null;
  mainImageUrl: string | null;
  createdAt: string;
  updatedAt: string;
  viewCount?: number;
  favoriteCount?: number;
  isFavorited?: boolean;
}

export interface ArchitectureDetail extends Architecture {
  historicalDevelopments: HistoricalDevelopment[];
  technicalStructures: TechnicalStructure[];
  architecturalFeatures: ArchitecturalFeature[];
  culturalSignificances: CulturalSignificance[];
  expertQuotes: ExpertQuote[];
  relatedArchitectures: RelatedArchitecture[];
  styleMappings: ArchitectureStyleMapping[];
}

export interface HistoricalDevelopment {
  developmentId: number;
  architectureId: number;
  dynastyPeriod: string;
  startYear: number | null;
  endYear: number | null;
  developmentTitle: string;
  developmentContent: string;
  architecturalChanges: string | null;
  historicalContext: string | null;
}

export interface TechnicalStructure {
  structureId: number;
  architectureId: number;
  structureName: string;
  technicalCategory: string;
  technicalDescription: string;
  technicalPrinciples: string | null;
  historicalValue: string | null;
  heritageStatus: string | null;
}

export interface ArchitecturalFeature {
  featureId: number;
  architectureId: number;
  featureName: string;
  designPhilosophy: string | null;
  spatialOrganization: string | null;
  aestheticCharacteristics: string | null;
  functionalAspects: string | null;
}

export interface CulturalSignificance {
  significanceId: number;
  architectureId: number;
  significanceAspect: string;
  philosophicalBasis: string | null;
  culturalInterpretation: string;
  socialInfluence: string | null;
  contemporaryValue: string | null;
}

export interface ExpertQuote {
  quoteId: number;
  architectureId: number;
  expertName: string;
  expertTitle: string | null;
  quoteContent: string;
  source: string | null;
}

export interface RelatedArchitecture {
  relationId: number;
  primaryArchitectureId: number;
  relatedArchitectureId: number;
  relationType: string;
  relationDescription: string | null;
  relatedArchitecture?: Architecture;
}

export interface ArchitectureStyleMapping {
  mappingId: number;
  architectureId: number;
  styleName: string;
  styleDescription: string | null;
  period: string | null;
  region: string | null;
  characteristics: string | null;
}

export interface ArchitectureFilters {
  type?: string;
  dynasty?: string;
  location?: string;
  protectionLevel?: string;
  search?: string;
  sortBy?: 'name' | 'dynasty' | 'popularity' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// 竞赛相关类型
export interface CompetitionMode {
  modeId: string;
  title: string;
  description: string | null;
  difficulty: string | null;
  timeLimit: number;
  icon: string | null;
  isActive: boolean;
  sortOrder: number;
}

export interface Question {
  questionId: number;
  externalBuildingId: number;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string | null;
  optionD: string | null;
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  explanation: string | null;
  difficulty: string;
  points: number;
  category: string | null;
}

export interface QuizSession {
  sessionId: string;
  modeId: string;
  questions: Question[];
  startTime: string;
  timeLimit: number;
  currentIndex: number;
  answers: Record<number, string>;
}

export interface AnswerSubmission {
  questionId: number;
  selectedAnswer: 'A' | 'B' | 'C' | 'D';
  timeSpent: number;
}

export interface QuizResult {
  sessionId: string;
  totalQuestions: number;
  correctAnswers: number;
  totalPoints: number;
  earnedPoints: number;
  accuracy: number;
  timeSpent: number;
  details: {
    questionId: number;
    isCorrect: boolean;
    correctAnswer: string;
    yourAnswer: string;
    points: number;
    explanation: string | null;
    questionText?: string;
    options?: { key: string; value: string }[];
  }[];
}

export interface UserCompetitionPoints {
  recordId: number;
  externalUserId: number;
  totalPoints: number;
  entryPoints: number;
  basicPoints: number;
  challengePoints: number;
  advancedPoints: number;
  expertPoints: number;
  currentLevel: number;
  gamesPlayed: number;
  totalCorrect: number;
  totalQuestions: number;
  updatedAt: string;
}

export interface LeaderboardEntry {
  rank: number;
  userId: number;
  username: string;
  nickname: string | null;
  avatar: string;
  totalPoints: number;
  currentLevel: number;
  gamesPlayed: number;
  accuracy: number;
}

// 3D模型相关类型
export interface UserModel {
  modelId: number;
  userId: number;
  modelName: string;
  modelData: string | null;
  thumbnailUrl: string | null;
  isPublic: boolean;
  downloadCount: number;
  createdAt: string;
  updatedAt: string;
  componentCount?: number;
}

export interface ModelComponentDefinition {
  definitionId: number;
  type: string;
  category: string;
  name: string;
  description: string | null;
  dimensions: string | null;
  material: string | null;
  snapPoints: string | null;
  era: string | null;
  complexity: string;
  tags: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface ModelComponentInstance {
  instanceId: number;
  modelId: number;
  definitionId: number;
  instanceUuid: string;
  position: string;
  rotation: string;
  scale: string;
  customMaterial: string | null;
  parentInstanceId: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface BuildingTemplate {
  templateId: number;
  templateName: string;
  description: string | null;
  category: string;
  buildingType: string;
  era: string | null;
  complexityLevel: number;
  thumbnailUrl: string | null;
  templateStructure: string;
  defaultDimensions: string | null;
  isFeatured: boolean;
  isActive: boolean;
  createdBy: number | null;
  createdAt: string;
  updatedAt: string;
  components?: TemplateComponent[];
}

export interface TemplateComponent {
  id: number;
  templateId: number;
  definitionId: number;
  componentRole: string;
  buildOrder: number;
  buildStage: string;
  relativePosition: string;
  relativeRotation: string;
  scale: string;
  isRequired: boolean;
  placementHint: string | null;
}

export interface BuildStep {
  stepId: number;
  modelId: number;
  userId: number;
  stepNumber: number;
  actionType: string;
  componentType: string | null;
  componentId: string | null;
  definitionId: number | null;
  positionBefore: string | null;
  positionAfter: string | null;
  rotationBefore: string | null;
  rotationAfter: string | null;
  scaleBefore: string | null;
  scaleAfter: string | null;
  buildStage: string | null;
  stepDescription: string | null;
  isValidated: boolean;
  validationMessage: string | null;
  createdAt: string;
}

export interface ComponentRelation {
  relationId: number;
  currentComponentType: string;
  currentCategory: string;
  recommendedComponentType: string;
  recommendedCategory: string;
  recommendedDefinitionId: number | null;
  buildStage: string;
  relationType: string;
  priority: number;
  reason: string | null;
  conditionDescription: string | null;
  isActive: boolean;
  createdAt: string;
}

// 3D场景类型
export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface SceneComponent {
  uuid: string;
  definitionId: number;
  type: string;
  category: string;
  name: string;
  position: Vector3D;
  rotation: Vector3D;
  scale: Vector3D;
  material?: MaterialConfig;
  visible: boolean;
  locked: boolean;
  parentUuid?: string | null;
  snapPoints?: SnapPoint[];
}

export interface MaterialConfig {
  type: string;
  color: number;
  roughness: number;
  metalness: number;
  transparent?: boolean;
  opacity?: number;
}

export interface SnapPoint {
  id: string;
  localPosition: [number, number, number];
  type: 'mortise' | 'tenon' | 'any';
}

export interface SceneState {
  components: SceneComponent[];
  camera: {
    position: Vector3D;
    target: Vector3D;
    zoom: number;
  };
  gridVisible: boolean;
  backgroundColor: string;
}

export interface ExportData {
  version: string;
  modelName: string;
  createdAt: string;
  components: SceneComponent[];
  metadata?: Record<string, unknown>;
}

// 活动相关类型
export interface Activity {
  activityId: number;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string;
  activityType: string;
  bannerUrl: string | null;
  rewardPoints: number;
  maxParticipants: number | null;
  currentParticipants: number;
  isActive: boolean;
  createdAt: string;
}

export interface Achievement {
  achievementId: number;
  achievementName: string;
  description: string | null;
  achievementType: string;
  requiredPoints: number;
  requiredActions: string | null;
  icon: string;
  badgeUrl: string | null;
  createdAt: string;
}

export interface UserAchievement {
  achievementRecordId: number;
  externalUserId: number;
  achievementId: number;
  obtainedAt: string;
  achievement?: Achievement;
}

export interface DailyTask {
  taskId: number;
  taskName: string;
  description: string | null;
  pointsReward: number;
  requiredAction: string | null;
  actionCount: number;
  createdAt: string;
}

// AI助手相关类型
export interface AIChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  provider?: string;
  model?: string;
}

export interface AIChatRequest {
  message: string;
  provider?: string;
  model?: string;
  history?: AIChatMessage[];
  stream?: boolean;
}

export interface AIChatResponse {
  message: string;
  provider: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

// 个人资料相关类型
export interface ProfileSettings {
  settingId: number;
  userId: number;
  visibility: 'public' | 'friends' | 'private';
  bio: string | null;
  location: string | null;
  interests: string | null;
  socialLinks: string | null;
  notificationPreferences: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PointsTransaction {
  transactionId: number;
  userId: number;
  pointsChange: number;
  transactionType: string;
  referenceId: string | null;
  description: string | null;
  createdAt: string;
}

export interface UserFavorite {
  favoriteId: number;
  userId: number;
  architectureId: number;
  favoriteTime: string;
  architecture?: Architecture;
}

// 搜索相关
export interface SearchResult {
  architectures: Architecture[];
  questions: Question[];
  suggestions: string[];
}

export interface PopularSearchTerm {
  termId: number;
  term: string;
  searchCount: number;
  lastSearched: string;
  category: string | null;
}
