# النشر على VPS (Ubuntu + Nginx + PM2)

افتراضات: دومين يشير إلى IP الخادم، وواجهة وAPI على نفس الدومين (`/api`).

## 1) تجهيز الخادم
```bash
sudo apt update && sudo apt install -y nginx git curl
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt install -y nodejs
sudo npm i -g pm2
# قاعدة البيانات: إما MongoDB محلي أو MongoDB Atlas (الأسهل، ضع رابطه في MONGO_URI)
```

## 2) رفع المشروع
```bash
sudo mkdir -p /var/www/wattar
# ارفع المشروع إلى /var/www/wattar (git clone أو scp/rsync) — بدون node_modules ولا .env
sudo chown -R $USER:$USER /var/www/wattar
```
> الصور تُخزَّن داخل MongoDB (GridFS) فلا يوجد مجلد صور على الخادم.

## 3) الخادم (backEnd)
```bash
cd /var/www/wattar/backEnd && npm ci --omit=dev
cp .env.example .env && nano .env
```
قيم `.env` للإنتاج:
```
NODE_ENV=production
PORT=5000
MONGO_URI=...
JWT_SECRET=<ناتج: npm run gen-secret>
ADMIN_EMAIL=...        ADMIN_PASSWORD=<قوية وفريدة>
CLIENT_URL=https://example.com
TRUST_PROXY=1
COUNTRY_CODE=963
CURRENCY_CODE=USD
CURRENCY_SYMBOL=$
# + GEMINI_API_KEY و SMTP_* إن أردت الشات والبريد
```
```bash
pm2 start /var/www/wattar/deploy/ecosystem.config.js && pm2 save && pm2 startup
```
(عدّل المسارات داخل `deploy/ecosystem.config.js` إن اختلفت.) في أول تشغيل يُنشأ حساب المدير.

**نقل الصور القديمة إلى MongoDB (مرة واحدة)** — إن كانت لديك صور في `backEnd/uploads`:
```bash
cd /var/www/wattar/backEnd
npm run migrate:uploads            # نسخ إلى القاعدة
npm run migrate:uploads -- --delete  # (اختياري) حذف النسخ المحلية بعد التأكد
```

## 4) الواجهة (frontEnd)
```bash
cd /var/www/wattar/frontEnd && npm ci
echo "VITE_API_URL=/api" > .env      # يُدمج وقت البناء، لذلك اضبطه قبل build
# الدولة والعملة (القيم الافتراضية سوريا/دولار، ولا حاجة لإضافتها إلا لتغييرها):
# VITE_COUNTRY_CODE=963  VITE_CURRENCY_CODE=USD  VITE_CURRENCY_SYMBOL=$
npm run build
```

## 5) Nginx + HTTPS
```bash
sudo mkdir -p /var/cache/nginx/wattar && sudo chown www-data /var/cache/nginx/wattar
sudo cp /var/www/wattar/deploy/nginx.conf.example /etc/nginx/sites-available/wattar
sudo nano /etc/nginx/sites-available/wattar        # غيّر الدومين
sudo ln -s /etc/nginx/sites-available/wattar /etc/nginx/sites-enabled/ && sudo nginx -t && sudo systemctl reload nginx
sudo apt install -y certbot python3-certbot-nginx && sudo certbot --nginx -d example.com -d www.example.com
```

## 6) جدار الحماية والنسخ الاحتياطي
```bash
sudo ufw allow OpenSSH && sudo ufw allow 'Nginx Full' && sudo ufw enable   # لا تفتح 5000 ولا 27017
# نسخة يومية واحدة تشمل كل شيء بما فيه الصور (crontab -e):
0 3 * * * mongodump --uri="$MONGO_URI" --archive=/var/backups/wattar-db-$(date +\%F).gz --gzip
```

## التحديث لاحقًا
```bash
cd /var/www/wattar && git pull && (cd backEnd && npm ci --omit=dev) && (cd frontEnd && npm ci && npm run build) && pm2 restart wattar-api
```
