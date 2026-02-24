import type { FastifyInstance } from 'fastify';

const VL_MODEL = 'Qwen/Qwen3-VL-235B-A22B-Instruct';

const SYSTEM_PROMPT = `你是专业的健康体检报告分析助手。分析图片中的体检报告或健康数据，严格按以下 JSON 格式返回，不要有任何额外文字或 markdown 代码块：

{
  "title": "报告标题（如：2024年度体检报告、血常规检查等）",
  "rawText": "图片中提取的完整原始文字",
  "summary": "对这份报告的整体分析总结，包括：1）异常指标解读（每个异常指标的含义和可能原因）；2）整体健康评价；3）饮食和生活方式建议。用自然语言，200-400字。",
  "groups": [
    {
      "name": "分组名称（如：基本信息、血常规、肝功能、血脂、血糖、尿常规、其他指标等）",
      "items": [
        {
          "key": "指标名称",
          "value": "检测值",
          "unit": "单位（无则空字符串）",
          "ref": "参考范围（如 3.5-5.5，无则空字符串）",
          "status": "normal 或 high 或 low 或 unknown"
        }
      ]
    }
  ]
}

规则：
- status 根据 value 与 ref 对比判断：超出上限为 high，低于下限为 low，在范围内为 normal，无法判断为 unknown
- 所有数值指标都要提取，包括参考范围
- 按检查类别分组，每组 name 用中文
- 如果是营养标签，分组为"营养成分"
- 如果是单张化验单，可以只有一个分组
- summary 必须包含对异常指标的专业解读和健康建议，语气专业但通俗易懂`;

export async function registerScanHealthRoutes(app: FastifyInstance) {
  app.post('/api/v1/scan-health', async (request, reply) => {
    const { image, mimeType = 'image/jpeg' } = request.body as {
      image: string;
      mimeType?: string;
    };

    if (!image) {
      return reply.status(400).send({ error: '缺少图片数据' });
    }

    const apiKey = process.env.MODELSCOPE_TOKEN || process.env.OPENAI_API_KEY || '';
    const apiBase = process.env.MODELSCOPE_API_URL || 'https://api-inference.modelscope.cn/v1';

    if (!apiKey) {
      return reply.status(500).send({ error: '未配置 MODELSCOPE_TOKEN' });
    }

    const base64Data = image.startsWith('data:') ? image.split(',')[1] : image;
    const imageUrl = `data:${mimeType};base64,${base64Data}`;

    const response = await fetch(`${apiBase}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: VL_MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          {
            role: 'user',
            content: [
              { type: 'image_url', image_url: { url: imageUrl } },
              { type: 'text', text: '请分析这张图片，提取所有健康数据并按要求格式返回。' },
            ],
          },
        ],
        max_tokens: 4096,
        temperature: 0.1,
      }),
      signal: AbortSignal.timeout(120_000),
    });

    if (!response.ok) {
      const errText = await response.text();
      app.log.error(`VL API error ${response.status}: ${errText}`);
      return reply.status(502).send({ error: `模型调用失败: ${response.status}` });
    }

    const data = await response.json() as {
      choices: Array<{ message: { content: string } }>;
    };

    const content = data.choices?.[0]?.message?.content ?? '';

    type Item = { key: string; value: string; unit: string; ref: string; status: string };
    type Group = { name: string; items: Item[] };
    type Parsed = { title?: string; rawText?: string; summary?: string; groups?: Group[]; structuredData?: Record<string, string> };

    let parsed: Parsed = {};
    try {
      // 去掉可能的 markdown 代码块包裹
      const clean = content.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
      parsed = JSON.parse(clean);
    } catch {
      // 尝试从文本中提取 JSON 对象
      const m = content.match(/\{[\s\S]*\}/);
      if (m) {
        try { parsed = JSON.parse(m[0]); } catch { /* ignore */ }
      }
      if (!parsed.title) {
        parsed = { title: '识别结果', rawText: content, groups: [] };
      }
    }

    // 兼容旧格式：若模型返回了 structuredData 而非 groups，转换一下
    if (!parsed.groups && parsed.structuredData) {
      parsed.groups = [{
        name: '检测指标',
        items: Object.entries(parsed.structuredData).map(([key, value]) => ({
          key, value: String(value), unit: '', ref: '', status: 'unknown',
        })),
      }];
    }

    return reply.send({
      title: parsed.title ?? '健康数据',
      rawText: parsed.rawText ?? content,
      summary: parsed.summary ?? '',
      groups: parsed.groups ?? [],
    });
  });
}
