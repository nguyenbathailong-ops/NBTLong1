import fs from 'node:fs';
import path from 'node:path';
import { getApp, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { GoogleGenAI } from '@google/genai';

interface FirebaseAppletConfig {
  projectId: string;
  firestoreDatabaseId?: string;
}

const VALID_UID_REGEX = /^[a-zA-Z0-9_-]{1,128}$/;

let cachedConfig: FirebaseAppletConfig | null = null;

function getFirebaseConfig(): FirebaseAppletConfig {
  if (cachedConfig) return cachedConfig;

  const candidates = [
    new URL('../firebase-applet-config.json', import.meta.url),
    path.resolve(process.cwd(), 'firebase-applet-config.json'),
  ];

  for (const candidate of candidates) {
    try {
      if (fs.existsSync(candidate)) {
        const parsed = JSON.parse(fs.readFileSync(candidate, 'utf8')) as FirebaseAppletConfig;
        if (parsed?.projectId) {
          cachedConfig = parsed;
          return parsed;
        }
      }
    } catch {
      // Try next candidate
    }
  }

  const envProjectId = process.env.FIREBASE_PROJECT_ID?.trim();
  const envDatabaseId = process.env.FIREBASE_DATABASE_ID?.trim();
  if (envProjectId) {
    cachedConfig = {
      projectId: envProjectId,
      firestoreDatabaseId: envDatabaseId || '(default)',
    };
    return cachedConfig;
  }

  throw new Error('MISSING_FIREBASE_CONFIG');
}

function getAdminAuth() {
  const firebaseConfig = getFirebaseConfig();
  const adminApp = getApps().length
    ? getApp()
    : initializeApp({ projectId: firebaseConfig.projectId });
  return getAuth(adminApp);
}

async function verifyAdminCaller(idToken: string): Promise<{ uid: string; email?: string }> {
  const firebaseConfig = getFirebaseConfig();
  const adminAuth = getAdminAuth();
  const decoded = await adminAuth.verifyIdToken(idToken);
  if (!decoded?.uid || !VALID_UID_REGEX.test(decoded.uid)) {
    throw new Error('INVALID_UID');
  }

  const databaseId = firebaseConfig.firestoreDatabaseId || '(default)';
  const baseUrl = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(
    firebaseConfig.projectId
  )}/databases/${encodeURIComponent(databaseId)}/documents`;

  const headers = { Authorization: `Bearer ${idToken}` };

  const [adminMarkerRes, accountRes] = await Promise.all([
    fetch(`${baseUrl}/admins/${encodeURIComponent(decoded.uid)}`, { headers }),
    fetch(`${baseUrl}/accounts/${encodeURIComponent(decoded.uid)}`, { headers }),
  ]);

  if (!adminMarkerRes.ok || !accountRes.ok) {
    const err = new Error('NOT_ADMIN');
    (err as Error & { statusCode?: number }).statusCode = 403;
    throw err;
  }

  const accountDoc = (await accountRes.json()) as {
    fields?: {
      role?: { stringValue?: string };
      active?: { booleanValue?: boolean };
    };
  };

  const role = accountDoc.fields?.role?.stringValue;
  const active = accountDoc.fields?.active?.booleanValue;

  if (role !== 'admin' || active !== true) {
    const err = new Error('NOT_ADMIN');
    (err as Error & { statusCode?: number }).statusCode = 403;
    throw err;
  }

  return { uid: decoded.uid, email: decoded.email };
}

export function sanitizeAnalysisDataset(rawDataset: unknown): Record<string, unknown> {
  if (!rawDataset || typeof rawDataset !== 'object' || Array.isArray(rawDataset)) {
    return {};
  }

  const src = rawDataset as Record<string, unknown>;
  const forbiddenKeys = new Set([
    'patientName',
    'provinceDetails',
    'images',
    'ctScanImages',
    'endoscopyImages',
    'clinicalImages',
    'dataUrl',
    'notes',
    'priorTreatmentDetails',
    'otherDiseases',
    'otherSequelaeDetails',
  ]);

  const scrub = (val: unknown, depth = 0): unknown => {
    if (depth > 5) return null;
    if (val === null || val === undefined) return null;
    if (typeof val === 'string') return val.slice(0, 240);
    if (typeof val === 'number') return Number.isFinite(val) ? val : null;
    if (typeof val === 'boolean') return val;
    if (Array.isArray(val)) {
      return val.slice(0, 300).map((item) => scrub(item, depth + 1));
    }
    if (typeof val === 'object') {
      const out: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(val as Record<string, unknown>)) {
        if (!forbiddenKeys.has(k)) {
          out[k] = scrub(v, depth + 1);
        }
      }
      return out;
    }
    return null;
  };

  return {
    summary: scrub(src.summary),
    cases: Array.isArray(src.cases) ? src.cases.slice(0, 300).map((c) => scrub(c)) : [],
  };
}

export interface AiAnalyzeResult {
  status: number;
  body: Record<string, unknown>;
}

export async function executeAdminAiAnalysis(
  authHeader: string | undefined,
  rawBody: unknown
): Promise<AiAnalyzeResult> {
  try {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        status: 401,
        body: {
          error: 'Vui lòng đăng nhập bằng tài khoản Admin để sử dụng chế độ AI.',
        },
      };
    }

    const idToken = authHeader.slice('Bearer '.length).trim();
    if (!idToken) {
      return {
        status: 401,
        body: { error: 'Thiếu mã xác thực phiên đăng nhập.' },
      };
    }

    try {
      await verifyAdminCaller(idToken);
    } catch (authErr) {
      const statusCode = (authErr as { statusCode?: number }).statusCode;
      if (statusCode === 403) {
        return {
          status: 403,
          body: {
            error: 'Chỉ tài khoản Admin mới được phép sử dụng chế độ AI phân tích số liệu.',
          },
        };
      }
      return {
        status: 401,
        body: {
          error: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.',
        },
      };
    }

    const geminiApiKey = process.env.GEMINI_API_KEY?.trim();
    if (!geminiApiKey || geminiApiKey === 'MY_GEMINI_API_KEY') {
      return {
        status: 503,
        body: {
          error:
            'Máy chủ chưa được cấu hình GEMINI_API_KEY (trong Environment Variables trên Vercel hoặc Secrets) để phân tích AI.',
        },
      };
    }

    const body =
      rawBody && typeof rawBody === 'object' && !Array.isArray(rawBody)
        ? (rawBody as { question?: unknown; dataset?: unknown })
        : undefined;

    const question = typeof body?.question === 'string' ? body.question.trim() : '';
    if (!question || question.length > 1500) {
      return {
        status: 400,
        body: {
          error: 'Nội dung câu hỏi phân tích không hợp lệ (tối đa 1500 ký tự).',
        },
      };
    }

    const sanitizedDataset = sanitizeAnalysisDataset(body?.dataset);
    const serializedDataset = JSON.stringify(sanitizedDataset);
    if (serializedDataset.length > 180000) {
      return {
        status: 400,
        body: {
          error: 'Dữ liệu gửi phân tích vượt quá giới hạn cho phép.',
        },
      };
    }

    const ai = new GoogleGenAI({
      apiKey: geminiApiKey,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
    });

    const systemInstruction = [
      'Bạn là trợ lý phân tích thống kê và nghiên cứu lâm sàng chuyên ngành Tai Mũi Họng (Mũi Xoang & Sàn sọ) cho bác sĩ Admin trên hệ thống RHINOLOG.',
      'Nhiệm vụ: Phân tích chính xác tập dữ liệu khử định danh được cung cấp (chỉ dựa trên số liệu thực tế trong JSON, không tự bịa số liệu hoặc ca bệnh không tồn tại).',
      'Khi trả lời bằng tiếng Việt:',
      '1. Trình bày rõ ràng theo các mục có tiêu đề ngắn, gạch đầu dòng súc tích, nêu rõ số lượng (n) và tỷ lệ phần trăm (%) tính từ dữ liệu.',
      '2. Đánh giá mối liên quan lâm sàng (như phân độ Chandler ổ mắt, điểm Lund-Mackay, bệnh nền đái tháo đường/tăng huyết áp, bạch cầu/CRP, tác nhân vi sinh/nấm, phác đồ kháng sinh/kháng nấm, phương pháp phẫu thuật, thời gian nằm viện, di chứng và kết cục xuất viện).',
      '3. Luôn ghi chú giới hạn cỡ mẫu nếu số ca còn nhỏ và nhắc nhở đối chiếu thống kê chuyên sâu (SPSS/R) trước khi công bố khoa học.',
      '4. Không suy đoán thông tin cá nhân bệnh nhân.',
    ].join('\n');

    const prompt = [
      `Yêu cầu phân tích từ bác sĩ Admin:\n${question}`,
      '',
      'Dữ liệu lâm sàng đã khử định danh (JSON):',
      serializedDataset,
    ].join('\n');

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: prompt,
      config: {
        systemInstruction,
      },
    });

    const analysisText = response.text?.trim();
    if (!analysisText) {
      return {
        status: 502,
        body: {
          error: 'Không nhận được nội dung phân tích từ mô hình AI. Vui lòng thử lại.',
        },
      };
    }

    return {
      status: 200,
      body: {
        analysis: analysisText,
        model: 'gemini-4-hydrogen',
        generatedAt: Date.now(),
      },
    };
  } catch (error) {
    console.error('AI analysis error:', error);
    return {
      status: 500,
      body: {
        error: 'Đã xảy ra lỗi khi phân tích số liệu bằng AI. Vui lòng thử lại sau.',
      },
    };
  }
}
