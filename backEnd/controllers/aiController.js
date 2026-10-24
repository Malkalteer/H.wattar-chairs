const { GoogleGenerativeAI } = require('@google/generative-ai');
const SiteSettings = require('../models/SiteSettings');
const { formatMoney, COUNTRY_CODE } = require('../config/locale');
const { canSeePrices } = require('../utils/pricing');
const Product = require('../models/Product');

const geminiClient = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

const MODEL_NAME = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const MAX_MESSAGE_LENGTH = 1000;
const MAX_HISTORY = 10;

// نحوّل سجل المحادثة القادم من الواجهة إلى صيغة Gemini، ونضمن أنه يبدأ برسالة مستخدم ويتناوب الأدوار
const buildHistory = (rawHistory) => {
  if (!Array.isArray(rawHistory)) return [];

  const cleaned = rawHistory
    .filter((item) => item && typeof item.text === 'string' && item.text.trim())
    .slice(-MAX_HISTORY)
    .map((item) => ({
      role: item.role === 'assistant' || item.role === 'model' ? 'model' : 'user',
      parts: [{ text: item.text.trim().slice(0, MAX_MESSAGE_LENGTH) }],
    }));

  const history = [];
  for (const entry of cleaned) {
    const last = history[history.length - 1];
    if (!last && entry.role !== 'user') continue;
    if (last && last.role === entry.role) continue;
    history.push(entry);
  }

  // آخر رسالة في السجل يجب أن تكون من النموذج لأن رسالة المستخدم الجديدة ستُرسل بعدها
  if (history.length && history[history.length - 1].role === 'user') history.pop();
  return history;
};

const chatWithAI = async (req, res) => {
  try {
    const message = String(req.body.message || '').trim();

    if (!message) {
      return res.status(400).json({ message: 'يرجى كتابة سؤال أو استفسار.' });
    }
    if (message.length > MAX_MESSAGE_LENGTH) {
      return res.status(400).json({ message: `الرسالة طويلة جدًا (الحد الأقصى ${MAX_MESSAGE_LENGTH} حرف).` });
    }

    if (!geminiClient) {
      return res.status(503).json({ message: 'خدمة الذكاء الاصطناعي غير متاحة حاليًا.' });
    }

    const settings = (await SiteSettings.findOne().lean()) || {};
    const showPrices = await canSeePrices(req);
    const products = await Product.find({}, 'name category price description inStock specs').limit(40).lean();

    const productsText = products
      .map((p) => {
        const specs = [p.specs?.materials && `الخامات: ${p.specs.materials}`, p.specs?.colors && `الألوان: ${p.specs.colors}`, p.specs?.dimensions && `الأبعاد: ${p.specs.dimensions}`]
          .filter(Boolean)
          .join('، ');
        return `- ${p.name} | ${p.category} | ${showPrices ? formatMoney(p.price) : 'السعر عند الطلب'} | ${p.inStock ? 'متوفر' : 'غير متوفر'}${specs ? ` | ${specs}` : ''}`;
      })
      .join('\n');

    const systemInstruction = `أنت المساعد العربي الرسمي لشركة Wattar Chair (وتار للكراسي)، متخصصة في تصنيع الكراسي والمجالس والمفروشات.
قواعد الإجابة:
- أجب باللغة العربية بأسلوب ودود ومختصر ومنظم (يمكنك استخدام نقاط قصيرة عند المقارنة بين المنتجات).
- اعتمد فقط على المعلومات التالية، ولا تخترع أسعارًا أو أرقامًا أو منتجات غير موجودة.
${showPrices ? '' : '- أسعار المنتجات غير معروضة حاليًا: لا تذكر أي سعر أو تقدير للسعر مطلقًا، وإن سُئلت عنه فاطلب من العميل التواصل عبر واتساب أو الهاتف.\n'}
- إذا سُئلت عن شيء خارج نطاق الشركة والمنتجات والأسعار ومعلومات التواصل، اعتذر بلطف واذكر أن مساعدتك تقتصر على معلومات الشركة.
- إذا لم تجد الجواب في المعلومات، اقترح التواصل عبر الواتساب أو الهاتف.

معلومات الشركة:
- الاسم: ${settings.companyName || 'Wattar Chair'}
- الشعار: ${settings.slogan || 'تصميم يجمع الراحة والهوية'}
- نبذة: ${settings.aboutText || 'تصنع الشركة كراسي ومجالس ومفروشات'}
- الهاتف: ${settings.contact?.phone || `+${COUNTRY_CODE}900000000`}
- الواتساب: ${settings.contact?.whatsapp || `${COUNTRY_CODE}900000000`}
- العنوان: ${settings.contact?.address || 'دمشق'}
- أوقات العمل: ${settings.contact?.workingHours || 'من الأحد إلى الخميس'}

المنتجات الحالية:
${productsText || 'لا توجد منتجات حالياً.'}`;

    const model = geminiClient.getGenerativeModel({ model: MODEL_NAME, systemInstruction });
    const chat = model.startChat({ history: buildHistory(req.body.history) });
    const result = await chat.sendMessage(message);
    const responseText = result.response.text();

    res.json({ reply: responseText || 'لا يوجد جواب متاح الآن.' });
  } catch (error) {
    console.error('Gemini error:', error.message || error);
    res.status(500).json({ message: 'تعذر معالجة السؤال في الوقت الحالي. حاول مرة أخرى.' });
  }
};

module.exports = { chatWithAI };
