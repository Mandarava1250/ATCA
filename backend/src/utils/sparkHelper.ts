/**
 * 讯飞星火 WebSocket 鉴权 & 调用工具
 * 文档: https://www.xfyun.cn/doc/spark/Web.html
 * 鉴权: https://www.xfyun.cn/doc/spark/general_url_authentication.html
 */

import * as crypto from 'crypto';
import * as https from 'https';
import * as net from 'net';

// ============================================================
// 版本映射
// ============================================================

interface SparkVerCfg { domain: string; path: string; maxTokens: number; }

const SPARK_VERSION_MAP: Record<string, SparkVerCfg> = {
  lite:          { domain: 'lite',          path: '/v1.1/chat',      maxTokens: 4096 },
  generalv3:     { domain: 'generalv3',     path: '/v3.1/chat',      maxTokens: 8192 },
  'pro-128k':    { domain: 'pro-128k',      path: '/chat/pro-128k',  maxTokens: 131072 },
  generalv3_5:   { domain: 'generalv3.5',   path: '/v3.5/chat',      maxTokens: 8192 },
  generalv3dot5: { domain: 'generalv3.5',   path: '/v3.5/chat',      maxTokens: 8192 },
  'generalv3.5': { domain: 'generalv3.5',   path: '/v3.5/chat',      maxTokens: 8192 },
  'max-32k':     { domain: 'max-32k',       path: '/chat/max-32k',   maxTokens: 32768 },
  '4.0Ultra':    { domain: '4.0Ultra',      path: '/v4.0/chat',      maxTokens: 32768 },
  '4.0ultra':    { domain: '4.0Ultra',      path: '/v4.0/chat',      maxTokens: 32768 },
  'Ultra':       { domain: '4.0Ultra',      path: '/v4.0/chat',      maxTokens: 32768 },
  'ultra':       { domain: '4.0Ultra',      path: '/v4.0/chat',      maxTokens: 32768 },
  'kjwx':        { domain: 'kjwx',          path: '/v1.1/chat_kjwx', maxTokens: 4096 },
};

export function getSparkEndpoint(model: string): { endpoint: string; domain: string; maxTokens: number } {
  const cfg = SPARK_VERSION_MAP[model];
  if (cfg) return { endpoint: `wss://spark-api.xf-yun.com${cfg.path}`, domain: cfg.domain, maxTokens: cfg.maxTokens };
  const m = model.toLowerCase();
  if (model.includes('4.0') || m.includes('ultra')) return { endpoint: 'wss://spark-api.xf-yun.com/v4.0/chat', domain: '4.0Ultra', maxTokens: 32768 };
  if (model.includes('3.5') || m.includes('max')) return { endpoint: 'wss://spark-api.xf-yun.com/v3.5/chat', domain: 'generalv3.5', maxTokens: 8192 };
  if (model.includes('3.1') || m.includes('pro')) return { endpoint: 'wss://spark-api.xf-yun.com/v3.1/chat', domain: 'generalv3', maxTokens: 8192 };
  if (m.includes('kjwx')) return { endpoint: 'wss://spark-openapi-n.cn-huabei-1.xf-yun.com/v1.1/chat_kjwx', domain: 'kjwx', maxTokens: 4096 };
  return { endpoint: 'wss://spark-api.xf-yun.com/v1.1/chat', domain: 'lite', maxTokens: 4096 };
}

function clampTemperature(t: number): number { return t <= 0 ? 0.5 : t > 1 ? 1 : t; }
function clampMaxTokens(t: number, max: number): number { return t <= 0 ? 4096 : t > max ? max : t; }

// ============================================================
// 鉴权 URL 生成
// ============================================================

function rfc1123Date(): string {
  const d = new Date();
  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${days[d.getUTCDay()]}, ${String(d.getUTCDate()).padStart(2,'0')} ${months[d.getUTCMonth()]} ${d.getUTCFullYear()} ${String(d.getUTCHours()).padStart(2,'0')}:${String(d.getUTCMinutes()).padStart(2,'0')}:${String(d.getUTCSeconds()).padStart(2,'0')} GMT`;
}

function urlEncodeForm(str: string): string { return encodeURIComponent(str).replace(/%20/g, '+'); }

export function buildSparkAuthUrl(wssUrl: string, apiKey: string, apiSecret: string): string {
  const url = new URL(wssUrl);
  const host = url.host;
  const path = url.pathname + url.search;
  const date = rfc1123Date();
  const tmp = `host: ${host}\ndate: ${date}\nGET ${path} HTTP/1.1`;
  const hmac = crypto.createHmac('sha256', apiSecret);
  hmac.update(tmp, 'utf-8');
  const signature = hmac.digest('base64');
  const authOrigin = `api_key="${apiKey}", algorithm="hmac-sha256", headers="host date request-line", signature="${signature}"`;
  const authorization = Buffer.from(authOrigin, 'utf-8').toString('base64');
  const params = `authorization=${urlEncodeForm(authorization)}&date=${urlEncodeForm(date)}&host=${urlEncodeForm(host)}`;
  const sep = wssUrl.includes('?') ? '&' : '?';
  return `${wssUrl}${sep}${params}`;
}

// ============================================================
// WebSocket 帧编解码
// ============================================================

/** 编码客户端 TEXT 帧（MASK=1，RFC6455 强制要求） */
function encodeClientFrame(opcode: number, payload: Buffer): Buffer {
  const len = payload.length;
  const maskKey = crypto.randomBytes(4);
  let frame: Buffer;
  let offset: number;

  if (len < 126) {
    frame = Buffer.allocUnsafe(2 + 4 + len);
    frame[0] = 0x80 | opcode;
    frame[1] = 0x80 | len;
    offset = 2;
  } else if (len < 65536) {
    frame = Buffer.allocUnsafe(4 + 4 + len);
    frame[0] = 0x80 | opcode;
    frame[1] = 0x80 | 126;
    frame.writeUInt16BE(len, 2);
    offset = 4;
  } else {
    frame = Buffer.allocUnsafe(10 + 4 + len);
    frame[0] = 0x80 | opcode;
    frame[1] = 0x80 | 127;
    frame.writeBigUInt64BE(BigInt(len), 2);
    offset = 10;
  }
  maskKey.copy(frame, offset);
  offset += 4;
  for (let i = 0; i < len; i++) frame[offset + i] = payload[i] ^ maskKey[i % 4];
  return frame;
}

function encodeClientTextFrame(text: string): Buffer {
  return encodeClientFrame(0x01, Buffer.from(text, 'utf-8'));
}

/** 解析服务器帧（unmasked） */
function parseServerFrame(buf: Buffer) {
  if (buf.length < 2) return null;
  const isFin = (buf[0] & 0x80) !== 0;
  const opcode = buf[0] & 0x0f;
  const isMasked = (buf[1] & 0x80) !== 0;
  let payloadLen = buf[1] & 0x7f;
  let offset = 2;

  if (payloadLen === 126) {
    if (buf.length < 4) return null;
    payloadLen = buf.readUInt16BE(2);
    offset = 4;
  } else if (payloadLen === 127) {
    if (buf.length < 10) return null;
    payloadLen = Number(buf.readBigUInt64BE(2));
    offset = 10;
  }

  if (isMasked) {
    if (buf.length < offset + 4) return null;
    const maskKey = buf.slice(offset, offset + 4);
    offset += 4;
    if (buf.length < offset + payloadLen) return null;
    let payload = buf.slice(offset, offset + payloadLen);
    for (let i = 0; i < payload.length; i++) payload[i] ^= maskKey[i % 4];
    return { payload, remaining: buf.slice(offset + payloadLen), opcode, isFin };
  }

  if (buf.length < offset + payloadLen) return null;
  return { payload: buf.slice(offset, offset + payloadLen), remaining: buf.slice(offset + payloadLen), opcode, isFin };
}

// ============================================================
// WebSocket 调用（使用 Node.js upgrade 事件，正确处理 WS 升级）
// ============================================================

const SPARK_WS_TIMEOUT_MS = 25000;

export async function callSparkWebSocket(
  authUrl: string, appId: string, domain: string,
  systemPrompt: string, userMessage: string,
  temperature: number, maxTokens: number, modelVersion?: string,
): Promise<string> {
  // 参数校正
  const temp = clampTemperature(temperature);
  const verCfg = modelVersion ? SPARK_VERSION_MAP[modelVersion] : null;
  const maxAllowed = verCfg ? verCfg.maxTokens : 4096;
  const maxTk = clampMaxTokens(maxTokens, maxAllowed);

  const messages: Array<{ role: string; content: string }> = [];
  if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
  messages.push({ role: 'user', content: userMessage });

  const requestBody = {
    header: { app_id: appId, uid: 'atca_user' },
    parameter: { chat: { domain, temperature: temp, max_tokens: maxTk } },
    payload: { message: { text: messages } },
  };
  const requestJson = JSON.stringify(requestBody);

  console.log(`[Spark WS] domain=${domain}, temp=${temp}, max_tokens=${maxTk}`);
  console.log(`[Spark WS] 请求: ${requestJson.slice(0, 250)}...`);

  return new Promise((resolve, reject) => {
    let isDone = false;
    let socketRef: net.Socket | null = null;
    let upgradeReceived = false;

    function safeResolve(v: string) { if (isDone) return; isDone = true; clearTimeout(timer); try { socketRef?.destroy(); } catch {} resolve(v); }
    function safeReject(e: Error) { if (isDone) return; isDone = true; clearTimeout(timer); try { socketRef?.destroy(); } catch {} reject(e); }

    const timer = setTimeout(() => {
      safeReject(new Error(
        `讯飞星火WebSocket调用超时（${SPARK_WS_TIMEOUT_MS}ms）。` +
        `upgrade=${upgradeReceived}, socket=${socketRef ? '有' : '无'}\n` +
        `请检查: 1) APIKey和APISecret是否正确 2) Lite模型Websocket权限是否开通 3) 防火墙是否允许wss连接`
      ));
    }, SPARK_WS_TIMEOUT_MS);

    const url = new URL(authUrl);
    const wsKey = crypto.randomBytes(16).toString('base64');

    const options: https.RequestOptions = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname + url.search,
      method: 'GET',
      timeout: 15000,
      headers: {
        'Connection': 'Upgrade',
        'Upgrade': 'websocket',
        'Sec-WebSocket-Version': '13',
        'Sec-WebSocket-Key': wsKey,
        'Host': url.hostname,
      },
    };

    // ===== WebSocket 数据处理 =====
    let buffer = Buffer.alloc(0);
    let fullText = '';

    function processWsData(chunk: Buffer) {
      buffer = Buffer.concat([buffer, chunk]);
      while (!isDone) {
        const r = parseServerFrame(buffer);
        if (!r) break;
        buffer = r.remaining;

        if (r.opcode === 8) { // close
          console.log(`[Spark WS] close帧, 累计=${fullText.length}字符`);
          safeResolve(fullText);
          return;
        }
        if (r.opcode === 1 || r.opcode === 0) {
          try {
            const text = r.payload.toString('utf-8');
            console.log(`[Spark WS] 收到帧(${text.length}字符): ${text.slice(0, 150)}`);
            const data = JSON.parse(text);
            if (data.header?.code !== 0 && data.header?.code !== undefined) {
              safeReject(new Error(`讯飞星火API错误[${data.header.code}]: ${data.header.message || JSON.stringify(data)}`));
              return;
            }
            if (data.payload?.choices?.text) {
              for (const t of data.payload.choices.text as Array<{ content: string }>) {
                if (t.content) fullText += t.content;
              }
            }
            if (data.header?.status === 2) {
              console.log(`[Spark WS] 完成(status=2), 总=${fullText.length}字符`);
              // 发送close
              if (socketRef) {
                try { socketRef.write(encodeClientFrame(0x08, Buffer.alloc(0))); } catch {}
              }
              safeResolve(fullText);
              return;
            }
          } catch { /* 非JSON帧 */ }
        }
        if (r.opcode === 9 && socketRef) { // ping → pong
          try { socketRef.write(encodeClientFrame(0x0a, r.payload)); } catch {}
        }
      }
    }

    // ===== 使用 upgrade 事件（Node.js 正确处理 WS 升级的方式）=====
    const req = https.request(options);

    req.on('upgrade', (res, socket, head) => {
      upgradeReceived = true;
      console.log(`[Spark WS] HTTP ${res.statusCode} Upgrade成功`);

      // 验证 Sec-WebSocket-Accept
      const accept = res.headers['sec-websocket-accept'];
      const expected = crypto.createHash('sha1').update(wsKey + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');
      if (accept && accept !== expected) {
        socket.destroy();
        safeReject(new Error(`Sec-WebSocket-Accept不匹配: got=${accept}, expected=${expected}`));
        return;
      }

      socketRef = socket;

      // 处理初始数据（head）
      if (head && head.length > 0) {
        console.log(`[Spark WS] 初始数据: ${head.length}字节`);
        processWsData(head);
      }

      socket.on('data', processWsData);
      socket.on('error', (err) => { console.error(`[Spark WS] socket错误: ${err.message}`); safeReject(err); });
      socket.on('close', (hadError) => {
        console.log(`[Spark WS] socket关闭 hadError=${hadError} 累计=${fullText.length}字符`);
        if (!isDone) safeResolve(fullText);
      });
      socket.on('end', () => {
        console.log(`[Spark WS] socket end 累计=${fullText.length}字符`);
        if (!isDone) safeResolve(fullText);
      });

      // 发送请求
      try {
        const frame = encodeClientTextFrame(requestJson);
        console.log(`[Spark WS] 发送请求帧(${frame.length}字节)`);
        socket.write(frame);
      } catch (err: any) {
        safeReject(new Error(`发送失败: ${err.message}`));
      }
    });

    // ===== response 事件（非 upgrade 时触发）=====
    req.on('response', (res) => {
      console.log(`[Spark WS] HTTP ${res.statusCode} 响应(非upgrade)`);
      let body = '';
      res.on('data', (c) => { body += c; });
      res.on('end', () => {
        safeReject(new Error(`WebSocket握手失败: HTTP ${res.statusCode} - ${body || '(无body)'}`));
      });
      res.on('aborted', () => {
        safeReject(new Error(`WebSocket响应被中断: HTTP ${res.statusCode}`));
      });
    });

    req.on('error', (err) => safeReject(new Error(`HTTP请求错误: ${err.message}`)));
    req.on('timeout', () => { req.destroy(); safeReject(new Error('HTTP握手超时(15s)')); });

    req.end();
  });
}
