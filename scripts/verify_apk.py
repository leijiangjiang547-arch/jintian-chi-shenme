import pathlib,zipfile,json,hashlib
root=pathlib.Path(__file__).resolve().parents[1]
apk=root/'downloads/cookdaily-v0.3.0.apk'
with zipfile.ZipFile(apk) as z:
    assert z.testzip() is None
    assets=[f for f in (root/'web').iterdir() if f.suffix in {'.html','.js','.css','.svg'}]
    for f in assets:
        assert z.read('assets/web/'+f.name)==f.read_text(encoding='utf-8').encode('utf-8'),f.name
    assert 'classes.dex' in z.namelist()
    assert z.getinfo('resources.arsc').compress_type==zipfile.ZIP_STORED
    assert not any(n.endswith(('.jks','.keystore','.clixml','.env')) for n in z.namelist())
    data=z.read('assets/web/recipes.js').decode('utf-8').removeprefix('window.RECIPES = ').strip().removesuffix(';')
    assert len(json.loads(data))==174
expected=(root/'downloads/SHA256SUMS.txt').read_text().split()[0]
assert hashlib.sha256(apk.read_bytes()).hexdigest()==expected
print('APK: CRC, assets, 174 recipes, uncompressed resources, checksum and secret-file exclusion passed.')
