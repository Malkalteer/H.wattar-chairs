const mongoose = require('mongoose');

const siteSettingsSchema = new mongoose.Schema(
  {
    companyName: { type: String, default: 'Wattar Chair' },
    slogan: { type: String, default: 'تصميم يجمع الراحة والهوية' },
    heroTitle: { type: String, default: 'كراسي وفضاءات مخصصة لأجواءك' },
    heroSubtitle: { type: String, default: 'نصنع لك المجالس والمنتجات المريحة بتفاصيل فاخرة.' },
    welcomeMessages: {
      type: [String],
      default: [
        'حيث تلتقي الحرفية بالراحة لتصنع مساحة تشبهك.',
        'تفاصيل مدروسة، وخامات مختارة، وجودة تدوم.',
        'ابدأ رحلتك لاكتشاف تصميمك المميز.',
      ],
    },
    welcomeSlides: {
      type: [
        {
          _id: false,
          text: { type: String, default: '' },
          image: { type: String, default: '' },
        },
      ],
      default: undefined,
    },
    aboutText: { type: String, default: 'نحن شركة Wattar Chair متخصصة في تصنيع الكراسي والمجالس والمفروشات.' },
    // عرض أسعار المنتجات لكل الزوار (يتحكم به المدير)
    showPrices: { type: Boolean, default: true },
    contact: {
      phone: { type: String, default: '+963900000000' },
      whatsapp: { type: String, default: '963900000000' },
      email: { type: String, default: 'hello@wattarchair.com' },
      address: { type: String, default: 'دمشق، سوريا' },
      workingHours: { type: String, default: 'من الأحد إلى الخميس: 9:00 صباحًا - 6:00 مساءً' },
      mapEmbed: { type: String, default: '' },
    },
    socialLinks: {
      instagram: { type: String, default: 'https://instagram.com' },
      tiktok: { type: String, default: 'https://tiktok.com' },
      facebook: { type: String, default: 'https://facebook.com' },
    },
    faqs: [
      {
        _id: false,
        question: { type: String, default: '' },
        answer: { type: String, default: '' },
      },
    ],
    services: [
      {
        title: { type: String, default: 'تصنيع الكراسي' },
        description: { type: String, default: 'منتجات فاخرة وفق المقاسات والمواد المطلوبة.' },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('SiteSettings', siteSettingsSchema);
