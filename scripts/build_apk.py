"""Build using official Android SDK + JDK only (no Gradle or Maven downloads).
Set JAVA_HOME, ANDROID_BUILD_TOOLS, ANDROID_PLATFORM, COOK_KEYSTORE, COOK_KEYSTORE_PASS.
The persistent signing key belongs outside the repository. Never commit it.
"""
import os, pathlib, subprocess, zipfile, shutil, hashlib, json
ROOT=pathlib.Path(__file__).resolve().parents[1]
OUT=pathlib.Path(os.environ.get('COOK_BUILD_DIR',str(ROOT/'build'))).resolve()
OUT.mkdir(parents=True,exist_ok=True)
def env_path(name):
    if not os.environ.get(name): raise SystemExit('Missing environment variable: '+name)
    return pathlib.Path(os.environ[name]).resolve()
J=env_path('JAVA_HOME')/'bin'; B=env_path('ANDROID_BUILD_TOOLS'); A=env_path('ANDROID_PLATFORM')/'android.jar'
KEY=env_path('COOK_KEYSTORE'); KEY.parent.mkdir(parents=True,exist_ok=True)
if not os.environ.get('COOK_KEYSTORE_PASS'): raise SystemExit('Missing COOK_KEYSTORE_PASS')
ext='.exe' if os.name=='nt' else ''
def run(*args): subprocess.run([str(x) for x in args],check=True)
if not KEY.exists():
    run(J/('keytool'+ext),'-genkeypair','-keystore',KEY,'-storetype','JKS','-storepass:env','COOK_KEYSTORE_PASS','-keypass:env','COOK_KEYSTORE_PASS','-alias','cookdaily','-keyalg','RSA','-keysize','3072','-validity','10000','-dname','CN=CookDaily Preview, O=Personal')
run(B/('aapt2'+ext),'compile','--dir',ROOT/'android/res','-o',OUT/'resources.zip')
assets=OUT/'assets/web'; assets.mkdir(parents=True,exist_ok=True)
for f in (ROOT/'web').iterdir():
    if f.is_file() and f.suffix in {'.html','.js','.css','.svg'}: shutil.copyfile(f,assets/f.name)
run(B/('aapt2'+ext),'link','-o',OUT/'base.apk','-I',A,'--manifest',ROOT/'android/AndroidManifest.xml','-A',OUT/'assets','--min-sdk-version','26','--target-sdk-version','35',OUT/'resources.zip')
classes=OUT/'classes'; classes.mkdir(exist_ok=True)
run(J/('javac'+ext),'-encoding','UTF-8','--release','8','-classpath',A,'-d',classes,*sorted((ROOT/'android/src').rglob('*.java')))
run(J/('java'+ext),'-cp',B/'lib/d8.jar','com.android.tools.r8.D8','--lib',A,'--min-api','26','--output',OUT,*sorted(classes.rglob('*.class')))
with zipfile.ZipFile(OUT/'base.apk') as base, zipfile.ZipFile(OUT/'unsigned.apk','w',compression=zipfile.ZIP_DEFLATED) as z:
    for entry in base.infolist():
        z.writestr(entry.filename,base.read(entry.filename),compress_type=zipfile.ZIP_STORED if entry.filename=='resources.arsc' else zipfile.ZIP_DEFLATED)
    z.write(OUT/'classes.dex','classes.dex')
run(B/('zipalign'+ext),'-f','4',OUT/'unsigned.apk',OUT/'aligned.apk')
APK=OUT/'cookdaily-v0.1.0.apk'
run(J/('java'+ext),'-jar',B/'lib/apksigner.jar','sign','--ks',KEY,'--ks-key-alias','cookdaily','--ks-pass','env:COOK_KEYSTORE_PASS','--key-pass','env:COOK_KEYSTORE_PASS','--out',APK,OUT/'aligned.apk')
run(J/('java'+ext),'-jar',B/'lib/apksigner.jar','verify','--verbose',APK)
run(B/('zipalign'+ext),'-c','4',APK)
digest=hashlib.sha256(APK.read_bytes()).hexdigest()
(OUT/'SHA256SUMS.txt').write_text(digest+'  '+APK.name+'\n',encoding='utf-8')
print(json.dumps({'apk':str(APK),'bytes':APK.stat().st_size,'sha256':digest}))
