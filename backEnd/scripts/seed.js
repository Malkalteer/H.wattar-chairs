require('dotenv').config();

const mongoose = require('mongoose');
const User = require('../models/User');
const Product = require('../models/Product');
const SiteSettings = require('../models/SiteSettings');

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/wattar-chair');

    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@wattarchair.com').toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminPassword || adminPassword.length < 8) {
      throw new Error('اضبط ADMIN_PASSWORD (8 أحرف على الأقل) في ملف .env قبل تشغيل seed.');
    }
    const adminExists = await User.findOne({ email: adminEmail });
    if (!adminExists) {
      await User.create({
        name: 'مدير الموقع',
        email: adminEmail,
        password: adminPassword,
        role: 'admin',
        emailVerified: true,
      });
    }

    const existingSettings = await SiteSettings.findOne();
    if (!existingSettings) {
      await SiteSettings.create({
        companyName: 'Wattar Chair',
        slogan: 'تصميم يجمع الراحة والهوية',
        heroTitle: 'كراسي ومجالس فاخرة مصممة لأسلوبك',
        heroSubtitle: 'نصنع لك مقاعد مميزة بأسلوب عربي أنيق وراحة يومية.',
        aboutText: 'نحن شركة Wattar Chair متخصصة في تصنيع الكراسي والمجالس والمفروشات حسب رغبات العملاء.',
        contact: {
          phone: '+963900000000',
          whatsapp: '963900000000',
          email: 'hello@wattarchair.com',
          address: 'دمشق، سوريا',
          workingHours: 'من الأحد إلى الخميس: 9:00 صباحًا - 6:00 مساءً',
          mapEmbed: '',
        },
        socialLinks: {
          instagram: 'https://instagram.com',
          tiktok: 'https://tiktok.com',
          facebook: 'https://facebook.com',
        },
        faqs: [
          { question: 'كم تستغرق مدة التصنيع والتوصيل؟', answer: 'تختلف حسب المنتج والكمية، وغالبًا من 7 إلى 21 يوم عمل. نؤكد لك الموعد بعد تأكيد الطلب.' },
          { question: 'هل يوجد ضمان على المنتجات؟', answer: 'نعم، نقدّم ضمانًا على عيوب التصنيع. تواصل معنا لمعرفة التفاصيل.' },
        ],
        services: [
          { title: 'تصنيع الكراسي', description: 'كراسي مريحة وعملية بتصاميم أنيقة.' },
          { title: 'تصميم المجالس', description: 'مجالس عربية فاخرة بأقمشة ووحدات مخصصة.' },
          { title: 'المفروشات', description: 'مفروشات منزلية وفاخرة حسب الطلب.' },
        ],
      });
    }

    const sampleProducts = [
      {
        name: 'كرسي الواجهة الكريم',
        description: 'كرسي فاخر بتصميم عصري ومقعد مريح، مناسب للمنزل والمكاتب.',
        price: 1280,
        category: 'كراسي',
        images: ['https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80'],
        specs: { dimensions: '90x80x95 سم', materials: 'خشب + قماش', colors: 'بني - كريمي' },
        options: { colors: [{ name: 'بني', hex: '#5f3426' }, { name: 'كريمي', hex: '#e7d1b6' }], fabrics: ['قطيفة', 'كتان'] },
        inStock: true,
        featured: true,
      },
      {
        name: 'مجلس دمشق المريح',
        description: 'مجلس عربي فاخر مع تفاصيل خشبية ومقعد واسع لأسلوب الضيافة.',
        price: 5400,
        category: 'مجالس',
        images: ['https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=900&q=80'],
        specs: { dimensions: '220x120x85 سم', materials: 'خشب مدهون + قماش', colors: 'بني داكن' },
        inStock: true,
        featured: true,
      },
      {
        name: 'مقعد فيلا الترف',
        description: 'مقعد أنيق يجمع بين التصميم العصري والراحة الكاملة.',
        price: 2200,
        category: 'مفروشات',
        images: ['https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=900&q=80'],
        specs: { dimensions: '160x70x80 سم', materials: 'مفروشات + فلين', colors: 'رمادي - بيج' },
        inStock: true,
        featured: false,
      },
      {
        name: 'كرسي لونو',
        description: 'كرسي صغير أنيق للزوايا والمكاتب المنزلية.',
        price: 900,
        category: 'كراسي',
        images: ['https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=900&q=80'],
        specs: { dimensions: '70x70x80 سم', materials: 'معدن + قماش', colors: 'أسود - ذهبي' },
        inStock: false,
        featured: false,
      },
    ];

    for (const product of sampleProducts) {
      const exists = await Product.findOne({ name: product.name });
      if (!exists) {
        await Product.create(product);
      }
    }

    console.log('Seed completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error.message);
    process.exit(1);
  }
};

seed();
