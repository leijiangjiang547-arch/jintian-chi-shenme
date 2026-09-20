import pathlib,json
root=pathlib.Path(__file__).resolve().parents[1]
data=json.loads((root/'web/recipes.json').read_text(encoding='utf-8'))
(root/'web/recipes.js').write_text('window.RECIPES = '+json.dumps(data,ensure_ascii=False,separators=(',',':'))+';\n',encoding='utf-8')
print('Synced',len(data),'recipes. Run npm test before building.')
