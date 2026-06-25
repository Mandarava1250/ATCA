# 华夏营造 - 客户端状态存储配置指南

## 概述

本文档详细介绍华夏营造项目中客户端状态存储系统的配置和使用方法。该系统采用双模式存储（内存 + Redis），支持 LRU 淘汰策略，提供高效的状态管理能力。

---

## 架构设计

```
┌──────────────────────────────────────────────────────────────────┐
│                    客户端状态存储架构                            │
├──────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────┐                                           │
│  │   应用层 API     │                                           │
│  │  get/set/delete  │                                           │
│  └────────┬─────────┘                                           │
│           │                                                     │
│           ▼                                                     │
│  ┌──────────────────┐                                           │
│  │   存储管理器     │  ← 路由选择、策略管理                      │
│  └────────┬─────────┘                                           │
│           │                                                     │
│     ┌─────┴─────┐                                               │
│     │           │                                               │
│     ▼           ▼                                               │
│  ┌───────┐  ┌─────────┐                                         │
│  │ 内存  │  │  Redis  │                                         │
│  │ 存储  │  │   存储   │  ← 持久化备份                          │
│  └───────┘  └─────────┘                                         │
│                                                                 │
└──────────────────────────────────────────────────────────────────┘
```

---

## 配置参数

### 基础配置

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `maxSize` | number | 1000 | 最大存储条目数 |
| `ttl` | number | 3600000 | 默认过期时间(ms) |
| `evictionPolicy` | string | 'LRU' | 淘汰策略 |
| `enablePersistence` | boolean | true | 是否启用持久化 |
| `persistenceInterval` | number | 60000 | 持久化间隔(ms) |
| `redisUrl` | string | - | Redis连接地址 |

### 淘汰策略说明

| 策略 | 说明 | 适用场景 |
|------|------|----------|
| `LRU` | 最近最少使用 | 通用场景 |
| `LFU` | 最不经常使用 | 访问频率差异大 |
| `FIFO` | 先进先出 | 时序数据 |

---

## 配置示例

### 基本配置

```typescript
// src/config/storage.ts
import { createClientStateStorage } from '@/utils/storage';

export const stateStorage = createClientStateStorage({
  maxSize: 1000,
  ttl: 3600000, // 1小时
  evictionPolicy: 'LRU',
  enablePersistence: true,
  persistenceInterval: 60000, // 1分钟
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379'
});
```

### 不同场景配置

#### 场景1：高频访问数据

```typescript
export const hotStorage = createClientStateStorage({
  maxSize: 5000,
  ttl: 1800000, // 30分钟
  evictionPolicy: 'LRU',
  enablePersistence: true
});
```

#### 场景2：临时会话数据

```typescript
export const sessionStorage = createClientStateStorage({
  maxSize: 100,
  ttl: 1800000, // 30分钟
  evictionPolicy: 'FIFO',
  enablePersistence: false // 不需要持久化
});
```

#### 场景3：用户偏好设置

```typescript
export const preferencesStorage = createClientStateStorage({
  maxSize: 100,
  ttl: 86400000 * 30, // 30天
  evictionPolicy: 'LFU',
  enablePersistence: true
});
```

---

## API 接口

### 基础操作

```typescript
// 设置值
await storage.set('key', value, { ttl: 300000 });

// 获取值
const value = await storage.get('key');

// 删除值
await storage.delete('key');

// 检查键是否存在
const exists = await storage.has('key');

// 清空所有数据
await storage.clear();

// 获取所有键
const keys = await storage.keys();
```

### 批量操作

```typescript
// 批量设置
await storage.multiSet([
  ['key1', 'value1'],
  ['key2', 'value2']
]);

// 批量获取
const values = await storage.multiGet(['key1', 'key2']);

// 批量删除
await storage.multiDelete(['key1', 'key2']);
```

### 高级操作

```typescript
// 获取并更新（原子操作）
const result = await storage.getAndUpdate('counter', (current) => {
  return (current || 0) + 1;
});

// 设置值（如果不存在）
const success = await storage.setIfNotExists('unique-key', 'value');

// 获取并删除
const value = await storage.getAndDelete('temp-key');
```

---

## 使用示例

### 场景1：用户偏好设置

```typescript
// src/stores/preferences.ts
import { stateStorage } from '@/config/storage';

export async function getUserPreferences(userId: number) {
  const key = `user:${userId}:preferences`;
  const cached = await stateStorage.get(key);
  
  if (cached) {
    return JSON.parse(cached);
  }
  
  // 从API获取
  const preferences = await fetchPreferencesFromAPI(userId);
  
  // 缓存30天
  await stateStorage.set(key, JSON.stringify(preferences), { ttl: 86400000 * 30 });
  
  return preferences;
}

export async function saveUserPreferences(userId: number, preferences: object) {
  const key = `user:${userId}:preferences`;
  await stateStorage.set(key, JSON.stringify(preferences), { ttl: 86400000 * 30 });
  await savePreferencesToAPI(userId, preferences);
}
```

### 场景2：API 响应缓存

```typescript
// src/utils/apiCache.ts
import { stateStorage } from '@/config/storage';

export async function cachedApiCall<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 300000
): Promise<T> {
  const cached = await stateStorage.get(key);
  
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {
      // 缓存数据格式错误，重新获取
    }
  }
  
  const result = await fetcher();
  await stateStorage.set(key, JSON.stringify(result), { ttl });
  
  return result;
}

// 使用示例
const buildings = await cachedApiCall(
  'architecture:list:page=1:limit=10',
  () => fetch('/api/architecture?page=1&limit=10'),
  600000 // 10分钟
);
```

### 场景3：临时表单数据

```typescript
// src/composables/useFormStorage.ts
import { ref, watch } from 'vue';
import { stateStorage } from '@/config/storage';

export function useFormStorage<T>(formId: string, initialValue: T) {
  const formData = ref<T>(initialValue);
  const storageKey = `form:${formId}`;
  
  // 初始化时加载缓存
  stateStorage.get(storageKey).then(cached => {
    if (cached) {
      try {
        formData.value = JSON.parse(cached);
      } catch {
        // 忽略解析错误
      }
    }
  });
  
  // 监听变化并缓存
  watch(formData, (newValue) => {
    stateStorage.set(storageKey, JSON.stringify(newValue), { ttl: 3600000 });
  }, { deep: true });
  
  // 清除缓存
  const clear = () => {
    stateStorage.delete(storageKey);
    formData.value = initialValue;
  };
  
  return {
    formData,
    clear
  };
}
```

---

## 监控与调试

### 监控指标

```typescript
// 获取存储统计信息
const stats = await storage.getStats();
console.log(stats);
// {
//   size: 450,
//   hits: 12500,
//   misses: 2500,
//   hitRate: 0.83,
//   evictions: 50
// }
```

### 调试模式

```typescript
// 启用调试模式
const debugStorage = createClientStateStorage({
  maxSize: 1000,
  ttl: 3600000,
  enableDebug: true, // 启用调试日志
  logLevel: 'info' // 'debug' | 'info' | 'warn' | 'error'
});
```

### 日志输出

```typescript
// 监听存储事件
storage.on('set', (key, value) => {
  console.log(`Set ${key}: ${JSON.stringify(value)}`);
});

storage.on('get', (key, value) => {
  console.log(`Get ${key}: ${JSON.stringify(value)}`);
});

storage.on('delete', (key) => {
  console.log(`Delete ${key}`);
});

storage.on('evict', (key, value) => {
  console.log(`Evict ${key}: ${JSON.stringify(value)}`);
});
```

---

## 性能优化建议

### 1. 合理设置 TTL

```typescript
// 频繁变化的数据 - 短TTL
await storage.set('real-time-data', data, { ttl: 60000 }); // 1分钟

// 相对稳定的数据 - 长TTL
await storage.set('config-data', config, { ttl: 86400000 }); // 1天
```

### 2. 使用命名空间

```typescript
// 使用命名空间避免键冲突
const userNamespace = `user:${userId}:`;
const preferencesKey = `${userNamespace}preferences`;
const sessionKey = `${userNamespace}session`;
```

### 3. 批量操作优化

```typescript
// 推荐：批量操作
await storage.multiSet([
  ['key1', 'value1'],
  ['key2', 'value2'],
  ['key3', 'value3']
]);

// 不推荐：多次单独操作
await storage.set('key1', 'value1');
await storage.set('key2', 'value2');
await storage.set('key3', 'value3');
```

### 4. 压缩大数据

```typescript
// 对大型数据进行压缩存储
import { compress, decompress } from 'lz-string';

const largeData = generateLargeData();
const compressed = compress(JSON.stringify(largeData));
await storage.set('large-data', compressed);

// 读取时解压
const cached = await storage.get('large-data');
const data = JSON.parse(decompress(cached));
```

---

## 常见问题

### Q1: 缓存数据不一致

**问题**: 修改了后端数据，但前端缓存未更新

**解决方案**:
```typescript
// 修改数据后主动删除缓存
await updateData(id, newData);
await storage.delete(`data:${id}`);
```

### Q2: 内存占用过高

**问题**: 存储条目过多导致内存占用过高

**解决方案**:
```typescript
// 减小 maxSize
const storage = createClientStateStorage({
  maxSize: 500, // 减小最大条目数
  ttl: 1800000 // 缩短过期时间
});
```

### Q3: 持久化延迟

**问题**: 数据修改后 Redis 中未立即更新

**解决方案**:
```typescript
// 关键数据使用同步持久化
await storage.set('critical-data', value, {
  ttl: 3600000,
  syncPersistence: true // 立即持久化
});
```