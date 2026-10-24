const SiteSettings = require('../models/SiteSettings');
const { normalizeWhatsapp } = require('../utils/phone');
const { COUNTRY_CODE } = require('../config/locale');
const { invalidatePricesCache } = require('../utils/pricing');
const { removeUploads } = require('../utils/files');

const getSiteSettings = async (req, res) => {
  try {
    let settings = await SiteSettings.findOne();

    if (!settings) {
      settings = await SiteSettings.create({
        companyName: 'Wattar Chair',
        slogan: 'تصميم يجمع الراحة والهوية',
      });
    }

    res.json({ settings });
  } catch (error) {
    res.status(500).json({ message: 'تعذر تحميل إعدادات الموقع.' });
  }
};

const ALLOWED_FIELDS = ['companyName', 'slogan', 'heroTitle', 'heroSubtitle', 'welcomeMessages', 'welcomeSlides', 'aboutText', 'contact', 'socialLinks', 'services', 'faqs', 'showPrices'];

const updateSiteSettings = async (req, res) => {
  const uploadedImages = req.files || [];
  const discardUploadedImages = () => removeUploads(
    uploadedImages.map((file) => `/uploads/${file.filename}`)
  );

  try {
    let incomingSettings = req.body;
    if (typeof req.body.settings === 'string') {
      try {
        incomingSettings = JSON.parse(req.body.settings);
      } catch {
        discardUploadedImages();
        return res.status(400).json({ message: 'بيانات إعدادات الموقع غير صالحة.' });
      }
    }
    if (!incomingSettings || typeof incomingSettings !== 'object' || Array.isArray(incomingSettings)) {
      discardUploadedImages();
      return res.status(400).json({ message: 'بيانات إعدادات الموقع غير صالحة.' });
    }
    if (uploadedImages.length && incomingSettings.welcomeSlides === undefined) {
      discardUploadedImages();
      return res.status(400).json({ message: 'تعذر ربط الصور بشرائح الترحيب.' });
    }

    let settings = await SiteSettings.findOne();
    if (!settings) settings = new SiteSettings();
    const previousWelcomeImages = (settings.welcomeSlides || []).map((slide) => slide.image);

    // نقبل الحقول المعروفة فقط (حماية من تعديل حقول غير مقصودة)
    for (const key of ALLOWED_FIELDS) {
      if (incomingSettings[key] === undefined) continue;
      if (key === 'contact') {
        const incoming = incomingSettings.contact || {};
        const current = settings.contact?.toObject ? settings.contact.toObject() : { ...(settings.contact || {}) };
        const merged = { ...current, ...incoming };

        merged.whatsapp = normalizeWhatsapp(merged.whatsapp);
        if (merged.whatsapp && (merged.whatsapp.length < 8 || merged.whatsapp.length > 15)) {
          discardUploadedImages();
          return res.status(400).json({ message: `رقم الواتساب غير صحيح. اكتبه بصيغة دولية مثل ${COUNTRY_CODE}900000000.` });
        }
        merged.phone = String(merged.phone || '').trim();
        settings.set('contact', merged);
      } else if (key === 'showPrices') {
        settings.showPrices = incomingSettings.showPrices === true || incomingSettings.showPrices === 'true';
      } else if (key === 'faqs') {
        const faqs = (Array.isArray(incomingSettings.faqs) ? incomingSettings.faqs : [])
          .map((f) => ({ question: String(f?.question || '').trim(), answer: String(f?.answer || '').trim() }))
          .filter((f) => f.question && f.answer)
          .slice(0, 30);
        settings.faqs = faqs;
      } else if (key === 'welcomeMessages') {
        if (incomingSettings.welcomeSlides !== undefined) {
          settings.welcomeMessages = Array.isArray(incomingSettings.welcomeSlides)
            ? incomingSettings.welcomeSlides.map((slide) => (typeof slide?.text === 'string' ? slide.text.trim() : '')).filter(Boolean).slice(0, 3)
            : [];
        } else if (!Array.isArray(incomingSettings.welcomeMessages) || incomingSettings.welcomeMessages.length > 3) {
          return res.status(400).json({ message: 'يمكن إضافة 3 جمل كحد أقصى.' });
        } else if (incomingSettings.welcomeMessages.some((message) => typeof message !== 'string' || message.trim().length > 200)) {
          return res.status(400).json({ message: 'يجب أن تكون كل جملة نصًا لا يتجاوز 200 حرف.' });
        } else {
          settings.welcomeMessages = incomingSettings.welcomeMessages.map((message) => message.trim()).filter(Boolean);
        }
      } else if (key === 'welcomeSlides') {
        const slides = incomingSettings.welcomeSlides;
        if (!Array.isArray(slides) || slides.length > 3) {
          discardUploadedImages();
          return res.status(400).json({ message: 'يمكن إضافة 3 شرائح كحد أقصى.' });
        }

        let imageIndexes = [];
        if (req.body.welcomeImageIndexes) {
          try {
            imageIndexes = JSON.parse(req.body.welcomeImageIndexes);
          } catch {
            discardUploadedImages();
            return res.status(400).json({ message: 'ترتيب صور الشرائح غير صالح.' });
          }
        }
        if (!Array.isArray(imageIndexes) || imageIndexes.length !== uploadedImages.length) {
          discardUploadedImages();
          return res.status(400).json({ message: 'تعذر مطابقة الصور مع الشرائح.' });
        }
        const updatedSlides = slides.map((slide, index) => {
          const text = typeof slide?.text === 'string' ? slide.text.trim() : '';
          let image = typeof slide?.image === 'string' ? slide.image.trim() : '';
          const uploadIndex = imageIndexes.indexOf(index);
          if (uploadIndex !== -1) image = `/uploads/${uploadedImages[uploadIndex].filename}`;
          return { text, image };
        });
        if (slides.some((slide) => typeof slide?.text !== 'string' || slide.text.trim().length > 200)
          || updatedSlides.some((slide) => !slide.text || !slide.image || slide.image.length > 2048)
          || imageIndexes.some((index, position) => !Number.isInteger(index) || index < 0 || index >= slides.length
            || imageIndexes.indexOf(index) !== position)) {
          discardUploadedImages();
          return res.status(400).json({ message: 'يجب إدخال جملة لا تتجاوز 200 حرفًا وصورة لكل شريحة.' });
        }
        settings.welcomeSlides = updatedSlides;
      } else {
        settings.set(key, incomingSettings[key]);
      }
    }

    await settings.save();
    const retainedWelcomeImages = new Set((settings.welcomeSlides || []).map((slide) => slide.image));
    removeUploads(previousWelcomeImages.filter((image) => !retainedWelcomeImages.has(image)));
    invalidatePricesCache();
    res.json({ settings, message: 'تم تحديث إعدادات الموقع بنجاح.' });
  } catch (error) {
    discardUploadedImages();
    res.status(500).json({ message: 'تعذر تحديث إعدادات الموقع.' });
  }
};

module.exports = { getSiteSettings, updateSiteSettings };
