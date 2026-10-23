فایل‌های برنامه‌ی حساب‌داری آتلیه
================================
index.html              خود برنامه
manifest.webmanifest    تنظیمات نصب (PWA)
sw.js                   حالت آفلاین
icon-192.png / icon-512.png / icon-maskable-512.png / apple-touch-icon.png   آیکن‌ها

نکته‌ها:
1) همه‌ی فایل‌ها باید کنار هم، در یک پوشه، روی یک هاست با HTTPS آپلود شوند.
2) ورود با Face ID / Touch ID فقط روی HTTPS و در Safari (یا برنامه‌ی نصب‌شده از Safari) کار می‌کند.
3) بعد از هر تغییر در index.html، عدد VERSION در sw.js را بالا ببرید.
