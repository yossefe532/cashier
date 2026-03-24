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

## 2) النشر على Render
- افتح Render واختر **Blueprint**.
- اربط Repository.
- اختر الملف `render.yaml`.
- سيقوم Render بإنشاء:
  - خدمة Backend: `educon-pos-api`
  - خدمة Frontend: `educon-pos-web`
  - قاعدة بيانات PostgreSQL: `educon-pos-db`

## 3) ربط واجهة الويب بالباكند
- بعد أول Deploy، افتح خدمة `educon-pos-web`.
- تأكد أن المتغير `VITE_API_BASE_URL` يساوي رابط خدمة الباكند النهائي، مثل:
  - `https://educon-pos-api.onrender.com`
- أعد Deploy للواجهة.

## 4) اختبار بعد النشر
- افتح:
  - `https://<frontend-domain>`
  - `https://<backend-domain>/docs`
- جرّب إضافة طالب + كتاب + عملية بيع + طباعة إيصال.

## 5) ملاحظات إنتاج مهمة
- الحذف للطلاب والكتب معطّل على الباكند لحماية البيانات.
- عند SQLite محليًا يتم أخذ نسخة احتياطية تلقائية.
- في الإنتاج على Render يتم استخدام PostgreSQL عبر `DATABASE_URL`.
