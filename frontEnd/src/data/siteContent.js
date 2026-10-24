export const defaultSiteContent = {
  companyName: 'Wattar Chair',
  slogan: 'تصميم يجمع الراحة والهوية',
  heroTitle: 'كراسي ومجالس فاخرة مصممة لأسلوبك',
  heroSubtitle: 'نصنع لك مقاعد مميزة بأسلوب عربي أنيق وراحة يومية.',
  welcomeMessages: [
    'حيث تلتقي الحرفية بالراحة لتصنع مساحة تشبهك.',
    'تفاصيل مدروسة، وخامات مختارة، وجودة تدوم.',
    'ابدأ رحلتك لاكتشاف تصميمك المميز.',
  ],
  welcomeSlides: [
    {
      text: 'حيث تلتقي الحرفية بالراحة لتصنع مساحة تشبهك.',
      image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80',
    },
    {
      text: 'تفاصيل مدروسة، وخامات مختارة، وجودة تدوم.',
      image: 'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80',
    },
    {
      text: 'ابدأ رحلتك لاكتشاف تصميمك المميز.',
      image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80',
    },
  ],
  aboutText:
    'نحن شركة Wattar Chair متخصصة في تصنيع الكراسي والمجالس والمفروشات بتخطيط داخلي أنيق، جودة عالية، وتجهيز حسب احتياج العميل.',
  services: [
    {
      title: 'كراسي مصممة حسب الطلب',
      description: 'كراسي أنيقة ومريحة، مناسبة للمنزل، المكتب، المطاعم، والمنتجعات.',
    },
    {
      title: 'مجالس عربية فاخرة',
      description: 'مجالس مخصصة بتفاصيل خشبية ومفروشات فاخرة تناسب أجواء الضيافة.',
    },
    {
      title: 'المفروشات والتنجيد',
      description: 'تنجيد وقطع مفروشات مخصصة باستخدام خامات عالية الجودة.',
    },
  ],
  faqs: [
    { question: 'كم تستغرق مدة التصنيع والتوصيل؟', answer: 'تختلف حسب المنتج والكمية، وغالبًا من 7 إلى 21 يوم عمل. نؤكد لك الموعد بعد تأكيد الطلب.' },
    { question: 'كيف أتابع حالة طلبي؟', answer: 'بعد تسجيل الدخول افتح صفحة "طلباتي" لمشاهدة حالة الطلب (جديد، قيد التصنيع، جاهز، تم التسليم).' },
    { question: 'هل يوجد ضمان على المنتجات؟', answer: 'نعم، نقدّم ضمانًا على عيوب التصنيع. تواصل معنا لمعرفة التفاصيل.' },
  ],
  gallery: [
    'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=900&q=80',
  ],
  testimonials: [
    { name: 'أحمد', text: 'الخدمة ممتازة والتصميم أنيق جدًا ومناسب لبيتنا.' },
    { name: 'سارة', text: 'المنتجات عالية الجودة والالتزام بالتوريد كان رائعًا.' },
    { name: 'عبدالله', text: 'المجلس الذي طلبناه كان مميزًا وجودة الخشب رائعة للغاية.' },
  ],
  socialLinks: { instagram: '', tiktok: '', facebook: '' },
  showPrices: true,
  contact: {
    phone: '+963900000000',
    whatsapp: '963900000000',
    email: 'hello@wattarchair.com',
    address: 'دمشق، سوريا',
    mapEmbed: '',
    workingHours: 'من الأحد إلى الخميس: 9:00 صباحًا - 6:00 مساءً',
  },
};

export const removeCustomOrderFaq = (faqs = []) =>
  faqs.filter((faq) => faq.question !== 'هل تقبلون تصنيع مقاسات وتصاميم خاصة؟');

export const normalizeWelcomeSlides = (settings = {}) => {
  if (Array.isArray(settings.welcomeSlides)) {
    return settings.welcomeSlides.slice(0, 3).map((slide) => ({
      text: typeof slide === 'string' ? slide : (slide?.text || ''),
      image: typeof slide === 'string' ? '' : (slide?.image || ''),
    }));
  }

  if (Array.isArray(settings.welcomeMessages)) {
    return settings.welcomeMessages.slice(0, 3).map((message, index) => ({
      text: typeof message === 'string' ? message : (message?.text || ''),
      image: typeof message === 'string'
        ? (defaultSiteContent.welcomeSlides[index]?.image || '')
        : (message?.image || ''),
    }));
  }

  return defaultSiteContent.welcomeSlides;
};

// يدمج إعدادات الخادم مع القيم الافتراضية (يُستخدم عند التحميل وبعد الحفظ من لوحة التحكم)
export const mergeSiteSettings = (settings = {}) => ({
  ...defaultSiteContent,
  ...settings,
  faqs: removeCustomOrderFaq(Array.isArray(settings.faqs) ? settings.faqs : defaultSiteContent.faqs),
  welcomeSlides: normalizeWelcomeSlides(settings),
  welcomeMessages: Array.isArray(settings.welcomeMessages)
    ? settings.welcomeMessages
    : defaultSiteContent.welcomeMessages,
  showPrices: settings.showPrices !== false,
  contact: { ...defaultSiteContent.contact, ...(settings.contact || {}) },
  socialLinks: { ...defaultSiteContent.socialLinks, ...(settings.socialLinks || {}) },
});
