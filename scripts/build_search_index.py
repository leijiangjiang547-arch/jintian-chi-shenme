"""Optional build-time dependency: pypinyin==0.55.0 (MIT). No runtime dependency.
Run after catalog generation. Check generated readings before publishing.
"""
import json, pathlib
from pypinyin import lazy_pinyin, Style
root=pathlib.Path(__file__).resolve().parents[1]
recipes=json.loads((root/'web/recipes.json').read_text(encoding='utf-8'))
index={r['id']:' '.join(''.join(lazy_pinyin(name,style=Style.FIRST_LETTER)) for name in [r['name'],*r.get('aliases',[])]) for r in recipes}
full={r['id']:' '.join(''.join(lazy_pinyin(name)) for name in [r['name'],*r.get('aliases',[])]) for r in recipes}
(root/'web/search-index.js').write_text('window.RECIPE_INITIALS = '+json.dumps(index,ensure_ascii=False,separators=(',',':'))+';\nwindow.RECIPE_PINYIN = '+json.dumps(full,ensure_ascii=False,separators=(',',':'))+';\n',encoding='utf-8')
