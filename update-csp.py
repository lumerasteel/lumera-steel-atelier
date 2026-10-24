#!/usr/bin/env python3
"""
بعد از هر ویرایش index.html این اسکریپت را اجرا کن:   python3 update-csp.py index.html
هش همه‌ی اسکریپت‌های داخلی را حساب می‌کند و در meta-CSP می‌نویسد.
اگر اجرا نکنی، مرورگر اسکریپت ویرایش‌شده را مسدود می‌کند (صفحه‌ی خالی).
"""
import re,sys,hashlib,base64,html
path=sys.argv[1] if len(sys.argv)>1 else 'index.html'
s=open(path,encoding='utf8').read()
if '\r' in s: s=s.replace('\r\n','\n'); 
def h(t): return "'sha256-"+base64.b64encode(hashlib.sha256(t.encode('utf8')).digest()).decode()+"'"
hashes=[]
for m in re.finditer(r'<script\b([^>]*)>(.*?)</script>',s,re.S):
    if 'src=' in m.group(1): continue
    hashes.append(h(m.group(2)))
# اسکریپت‌های داخل iframe ی data: (انیمیشن شروع)
for m in re.finditer(r'<iframe\b[^>]*\bsrc="data:text/html;base64,([A-Za-z0-9+/=]+)"',s):
    inner=base64.b64decode(m.group(1)).decode('utf8')
    for k in re.finditer(r'<script\b([^>]*)>(.*?)</script>',inner,re.S):
        if 'src=' not in k.group(1): hashes.append(h(k.group(2)))
hashes=sorted(set(hashes))
csp=("default-src 'none'; "
 "script-src "+" ".join(hashes)+" https://accounts.google.com/gsi/client; "
 "style-src 'self' 'unsafe-inline' https://accounts.google.com/gsi/style; "
 "img-src 'self' data: blob:; font-src 'self' data:; media-src 'self' data: blob:; "
 "connect-src 'self' https://accounts.google.com https://www.googleapis.com https://oauth2.googleapis.com; "
 "frame-src data: https://accounts.google.com; worker-src 'self'; manifest-src 'self'; "
 "object-src 'none'; base-uri 'none'; form-action 'none'")
tag='<meta http-equiv="Content-Security-Policy" content="'+html.escape(csp,quote=True)+'">'
if re.search(r'<meta http-equiv="Content-Security-Policy"[^>]*>',s):
    s=re.sub(r'<meta http-equiv="Content-Security-Policy"[^>]*>',lambda m:tag,s,1)
else:
    s=s.replace('<meta charset="UTF-8">','<meta charset="UTF-8">\n'+tag,1)
open(path,'w',encoding='utf8').write(s)
print('CSP updated with',len(hashes),'script hashes')
