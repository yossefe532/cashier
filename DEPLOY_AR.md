# نشر Educon POS على الإنترنت

## 1) تجهيز GitHub
- أنشئ Repository جديد على GitHub.
- من داخل المشروع ارفع الكود:

```bash
git init
git add .
git commit -m "Prepare production deployment"
git branch -M main
git remote add origin https://github.com/<USERNAME>/<REPO>.git
git push -u origin main
```

## 2) النشر على Railway
- افتح Railway ثم **New Project**.
- اختر **Deploy from GitHub repo** وحدد نفس المستودع.
- أضف خدمة قاعدة بيانات: **PostgreSQL**.
- أنشئ خدمة Backend من نفس الريبو بالإعدادات التالية:
  - Root Directory: `/`
  - Build Command: `pip install -r requirements.txt`
  - Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
  - متغيرات البيئة:
    - `DATABASE_URL=${{Postgres.DATABASE_URL}}`
- أنشئ خدمة Frontend من نفس الريبو بالإعدادات التالية:
  - Root Directory: `pos-frontend`
  - Build Command: `npm ci && npm run build`
  - Start Command: `npm run preview -- --host 0.0.0.0 --port $PORT`
  - متغيرات البيئة:
    - `VITE_API_BASE_URL=https://<backend-domain>.up.railway.app`

## 3) ربط الدومينات
- فعّل Public Domain لخدمة الباكند وخدمة الواجهة من Railway.
- ضع دومين الباكند النهائي في متغير `VITE_API_BASE_URL` داخل خدمة الواجهة.
- أعد Deploy للواجهة بعد تحديث المتغير.

## 4) اختبار بعد النشر
- افتح:
  - `https://<frontend-domain>`
  - `https://<backend-domain>/docs`
- جرّب إضافة طالب + كتاب + عملية بيع + طباعة إيصال.

## 5) ملاحظات إنتاج مهمة
- الحذف للطلاب والكتب معطّل على الباكند لحماية البيانات.
- عند SQLite محليًا يتم أخذ نسخة احتياطية تلقائية.
- في الإنتاج على Railway يتم استخدام PostgreSQL عبر `DATABASE_URL`.

## 6) ملفات مضافة لتسهيل Railway
- [Procfile](file:///e:/شغل/شغل/project/Procfile) لخدمة الباكند.
- [railway.json](file:///e:/شغل/شغل/project/railway.json) لخدمة الباكند.
- [pos-frontend/Procfile](file:///e:/شغل/شغل/project/pos-frontend/Procfile) لخدمة الواجهة.
- [pos-frontend/railway.json](file:///e:/شغل/شغل/project/pos-frontend/railway.json) لخدمة الواجهة.
