# 第七版离线图片登记

使用内置 ImageGen 工具生成4张新图集；每张5列×6行、30道菜，从左到右再从上到下排列。原生成PNG复制到 `web/`，没有用 Python 修改像素。映射在 `scripts/catalog_v07_images.json`，120个菜谱ID各对应一个独立格子；`rect` 使用最终图像的实际边界，原图空白末端未纳入部分格子。

图片是AI生成的成品示意，非实拍、非厨房试做结果。已目视核对格子数量、顺序及主要食物形态；切法、配菜和装饰可能仍有差异，不能据图判断熟透，也不表示原配方作者认可。应用继续显示AI示意标签。上架前仍需核对素材与具体平台规则；此记录不表示商用或逐道厨房验证完成。

| 图集 | 对应ID（按行顺序） | 尺寸 | 字节 | SHA256 |
| --- | --- | --- | --- | --- |
| food-atlas-7.png | v7a01–v7a30 | 1145×1374 | 2748823 | 6468f6d8da107de0a171ab08a2318e9d652cd8d0b3b9b4281fb09184e6e34487 |
| food-atlas-8.png | v7a31–v7a60 | 1145×1374 | 2474199 | fbb749bac745521c2ee8f824416301ffb51376d67cb5cfeffc89308bc1c58b3f |
| food-atlas-9.png | v7b01–v7b30 | 1145×1374 | 2600812 | f2e4c956b1da799e1beb9d709b9d99a877c59ee6317f2f50dc414e6701f82651 |
| food-atlas-10.png | v7b31–v7b60 | 1145×1374 | 2402394 | 6c8eea3a5b7eb8650a383e40e14e54f55e4610c8f7ca53f2423ac3cc0f9c25fe |

## 生成原文件

原文件保留在工具生成目录。项目使用下列选定版本；不是下载平台照片。

- food-atlas-7.png：`C:/Users/HP/.codex/generated_images/01a0f618-e92e-77f0-a5d2-57c6da7aec1d/exec-7ba373c2-7e2e-471e-9825-5c6156350db7.png`
- food-atlas-8.png：`C:/Users/HP/.codex/generated_images/01a0f618-e92e-77f0-a5d2-57c6da7aec1d/exec-cd9f2591-daf5-4430-9607-e3ed82650596.png`
- food-atlas-9.png：`C:/Users/HP/.codex/generated_images/01a0f618-e92e-77f0-a5d2-57c6da7aec1d/exec-3008a1b6-38dc-4cb6-80a7-011ac05c4e8a.png`
- food-atlas-10.png：`C:/Users/HP/.codex/generated_images/01a0f618-e92e-77f0-a5d2-57c6da7aec1d/exec-5afeed58-1dbc-4717-aa80-da05ad45bf60.png`

## 核对与定点修正

- a30赛螃蟹表现为熟鱼碎和黄白炒蛋，没有画实际螃蟹；a31白切鸡为浅色熟鸡肉；a54改为去皮绿豆糕，图为致密浅黄方糕，与b52小米蒸糕区分。
- 图8的a42老北京醋溜木须初稿多画木耳/黄瓜，工具修正为蛋肉葱；a48虾酱炒鸡蛋移除额外豌豆，保留熟蛋块和少量葱。a49天津卷圈按内容核对保留圆柱素馅卷，名称“圈”不表示闭合圆环。
- 图9的b28红糟蒸鸡初稿接近粉红生肉外观，工具修正为不透明熟肉和表面红棕酱。
- b36最终命名为千张鲜肉蒸饺。图10初稿使用类似面粉饺皮，工具修正为浅黄薄千张折成包肉小包，未作为有依据的八公山地方名菜登记。
- 定点修正后再次核对30格排列和其余主体；所有示意图仍以食材表与步骤为准。

## 原始生成提示词

以下是实际用于四张初稿的提示词。清单后续文字修正及图像修订以上节和最终manifest/映射为准。

<details><summary>food-atlas-7.png 初稿</summary>

```text
Use case: product-mockup.
Asset type: offline Chinese cookbook food illustration atlas 7.
Primary request: Create ONE portrait food contact sheet EXACTLY 5 columns by 6 rows, 30 separate square cells, aspect ratio 5:6. Every cell contains ONLY ONE completed dish from the ordered list. Cells are read LEFT TO RIGHT, then TOP TO BOTTOM. Render the rows at even, identical heights and columns at even identical widths, so CSS can slice each cell. There are no drawn grid lines.
Style: realistic natural food illustration, clean overhead flat-lay, camera straight down, consistent white ceramic round plates or shallow white bowls for soup. Warm ivory background fills every cell; dishes centered with a small clean margin. Natural appetizing food texture, soft even lighting. Single bowl or plate per cell, home cooking amounts, no sides not named. Soups must look like soups; ALL meat slices must look fully cooked with opaque off-white/beige cut faces, NEVER pink or raw; eggs fully set. These are AI reference illustrations, not documentary photos.
Constraints: no text, labels, numbers, icons, banners, watermarks, borders, tablecloth, cutlery, hands, decorative flowers, duplicate dishes, collage overlaps. The image must contain all 30 specified foods in the EXACT row order, and each dish visually reflects listed visible ingredients and shape. Do not exchange, omit, or invent items. Special dish accuracy: 赛螃蟹 is yellow-and-white scrambled fully set eggs with cooked cod flakes, NO crab or seafood shells; 白切鸡 shows fully cooked chicken pieces with pale skin, NO pink cut flesh; 虾酱炒鸡蛋 is cooked light-brown egg pieces WITHOUT whole shrimp; 绿豆糕 is smooth dense peeled-mung-bean small pale yellow squares, NOT porous bread or millet cake.
Ordered cells:
1. 干锅菜花 — 菜花、五花肉、青椒、干辣椒；干香锅炒花菜小朵
2. 水煮肉片 — 薄猪肉片、豆芽、小白菜；红汤大碗
3. 蒜泥白肉 — 熟五花肉薄片、黄瓜、蒜汁；凉拌叠片
4. 盐煎肉 — 五花肉薄片、蒜苗、豆豉；炒香微卷肉片
5. 泡椒鸡胗 — 鸡胗片、泡椒、芹菜；亮色快炒
6. 干煸杏鲍菇 — 杏鲍菇条、干辣椒、芝麻；金黄干香菌菇
7. 白油冬瓜 — 冬瓜片、姜、葱；浅色薄芡熟软冬瓜
8. 鱼香烘蛋 — 厚煎鸡蛋、葱、鱼香酱汁；完整蛋饼浇红棕汁
9. 粉蒸肉 — 五花肉片、蒸肉米粉、土豆；棕色粉裹蒸肉
10. 酸菜鱼 — 去骨鱼片、酸菜、泡椒；浅黄鱼汤
11. 金钱蛋 — 熟鸡蛋圆片、青红椒、豆豉；煎香圆片蛋
12. 剁椒蒸鸡腿 — 去骨鸡腿块、红剁椒、姜；红椒覆盖浅盘鸡肉
13. 小炒黄牛肉 — 牛肉片、小米辣、香菜、泡椒；香辣炒牛肉
14. 蒸腊肉 — 正规包装腊肉薄片、姜、小葱；半透明肥瘦蒸肉片
15. 擂辣椒皮蛋 — 烤煎青椒、皮蛋、蒜；捣碎青椒皮蛋
16. 酸豆角炒肉末 — 酸豆角碎、猪肉末、干辣椒；干香碎粒炒菜
17. 农家一碗香 — 煎鸡蛋块、五花肉片、青椒；黄蛋块肉椒合炒
18. 湘味炒猪肝 — 薄猪肝片、青椒、洋葱；熟透香辣猪肝片
19. 川味啤酒鸭 — 鸭块、啤酒、青椒、干辣椒；棕红炖鸭块
20. 糖油粑粑 — 糯米小圆饼、红糖；棕金油糖汁裹圆饼
21. 葱烧海参 — 即食熟海参、大葱段；棕色薄芡海参
22. 爆炒腰花 — 猪腰花、青椒、木耳；卷曲腰花合炒
23. 大虾烧白菜 — 带壳虾、大白菜；红虾油白菜煨烧
24. 木须肉 — 猪肉片、鸡蛋、木耳、黄瓜；蛋肉木耳合炒
25. 鲁式酥焖带鱼 — 带鱼段、葱姜、醋；金黄煎鱼段棕汁焖制
26. 山东汆丸子 — 猪肉丸、小白菜、粉丝；清汤肉丸
27. 芫爆鸡丝 — 鸡肉细丝、香菜、葱；浅色熟鸡丝快炒
28. 醋椒鱼汤 — 鱼肉块、姜、葱、白胡椒；酸香白汤鱼块
29. 白菜炖豆腐 — 大白菜、北豆腐；浅色热汤白菜豆腐
30. 赛螃蟹 — 鳕鱼碎、鸡蛋、姜醋汁；黄白嫩炒蛋鱼碎
Final geometry: exactly five equally spaced dish centers across every row and exactly six equally spaced rows; each dish fits fully within its own square.
```

</details>

<details><summary>food-atlas-8.png 初稿</summary>

```text
Use case: product-mockup.
Asset type: offline Chinese cookbook food illustration atlas 8.
Primary request: Create ONE portrait food contact sheet EXACTLY 5 columns by 6 rows, 30 separate square cells, aspect ratio 5:6. Every cell contains ONLY ONE completed dish from the ordered list. Cells are read LEFT TO RIGHT, then TOP TO BOTTOM. Render the rows at even, identical heights and columns at even identical widths, so CSS can slice each cell. There are no drawn grid lines.
Style: realistic natural food illustration, clean overhead flat-lay, camera straight down, consistent white ceramic round plates or shallow white bowls for soup. Warm ivory background fills every cell; dishes centered with a small clean margin. Natural appetizing food texture, soft even lighting. Single bowl or plate per cell, home cooking amounts, no sides not named. Soups must look like soups; ALL meat slices must look fully cooked with opaque off-white/beige cut faces, NEVER pink or raw; eggs fully set. These are AI reference illustrations, not documentary photos.
Constraints: no text, labels, numbers, icons, banners, watermarks, borders, tablecloth, cutlery, hands, decorative flowers, duplicate dishes, collage overlaps. The image must contain all 30 specified foods in the EXACT row order, and each dish visually reflects listed visible ingredients and shape. Do not exchange, omit, or invent items. Special dish accuracy: 赛螃蟹 is yellow-and-white scrambled fully set eggs with cooked cod flakes, NO crab or seafood shells; 白切鸡 shows fully cooked chicken pieces with pale skin, NO pink cut flesh; 虾酱炒鸡蛋 is cooked light-brown egg pieces WITHOUT whole shrimp; 绿豆糕 is smooth dense peeled-mung-bean small pale yellow squares, NOT porous bread or millet cake.
Ordered cells:
1. 白切鸡 — 整只小鸡、姜葱蘸汁；熟鸡切块浅色鸡皮
2. 豉油鸡 — 鸡腿、酱油、姜葱；棕亮鸡腿切块
3. 广式萝卜牛腩 — 牛腩块、白萝卜、柱侯酱；棕汤焖牛腩萝卜
4. 冬瓜排骨汤 — 猪小排、冬瓜、姜；清汤熟软排骨
5. 豆腐鱼头汤 — 剖开鱼头、北豆腐、姜；乳白鱼头豆腐汤
6. 客家酿豆腐 — 北豆腐块、猪肉末、香菇；肉馅嵌豆腐棕汁
7. 咸鱼蒸肉饼 — 猪肉末、咸鱼小粒、姜；浅色薄肉饼
8. 滑蛋牛肉 — 牛肉薄片、鸡蛋、葱；完全凝固嫩蛋包牛肉
9. 干炒牛河 — 河粉、牛肉、豆芽、韭黄；棕色宽米粉快炒
10. 白灼虾 — 带壳鲜虾、姜、葱；红熟整虾配酱汁
11. 京酱肉丝 — 猪肉细丝、甜面酱、葱丝、豆腐皮；棕亮肉丝
12. 老北京醋溜木须 — 猪肉薄片、鸡蛋、葱；酸香薄芡蛋肉
13. 老北京炸酱 — 五花肉丁、黄豆酱、甜面酱；浓酱肉丁一小碗
14. 北京芥末墩 — 大白菜卷、黄芥末；浅黄白菜卷墩
15. 京味炒合菜 — 豆芽、韭菜、粉丝、鸡蛋；金蛋与蔬菜粉丝合炒
16. 天津老爆三 — 猪肉片、猪肝片、猪腰花、蒜；深棕熟透三种肉合炒
17. 贴饽饽熬小鱼 — 小鲫鱼、玉米面小饼、葱姜；浅锅鱼汤配金黄玉米饼
18. 虾酱炒鸡蛋 — 鸡蛋、虾酱、小葱；熟透浅棕鸡蛋块
19. 天津卷圈 — 春卷皮、豆腐干、豆芽、香菜；金黄圆环卷皮
20. 天津锅巴菜 — 绿豆粉煎薄饼、卤汁、香菜；小菱形饼块浇稠卤
21. 黑米红豆粥 — 黑米、红小豆；紫红色熟软杂粮粥
22. 豆沙山药卷 — 山药泥、红豆沙、芝麻；白山药裹红豆沙切段
23. 山药奶香小馒头 — 山药泥、面粉、牛奶；白色柔软小馒头
24. 绿豆糕（去皮绿豆版） — 去皮绿豆泥、黄油、白糖；浅黄米白小方糕，清楚雕纹或光面，不含小米，不画面包孔洞
25. 萝卜丝饼（烫面包馅） — 面粉、白萝卜丝、虾皮；金黄包馅煎饼
26. 豆沙锅饼 — 薄面皮、红豆沙；长方形金黄豆沙夹饼
27. 杂粮煎饼 — 玉米面、绿豆粉、鸡蛋、生菜；折叠薄饼
28. 藜麦蔬菜蛋盅 — 藜麦、鸡蛋、彩椒；浅色小碗熟蛋盅
29. 鲜虾豆腐粥 — 大米、虾仁、嫩豆腐；米白粥红虾白豆腐
30. 土豆鸡蛋沙拉 — 土豆块、全熟鸡蛋、青豆、酸奶；浅色拌沙拉
Final geometry: exactly five equally spaced dish centers across every row and exactly six equally spaced rows; each dish fits fully within its own square.
```

</details>

<details><summary>food-atlas-9.png 初稿</summary>

```text
Use case: product-mockup.
Asset type: offline Chinese cookbook food illustration atlas 9.
Primary request: Create ONE portrait food contact sheet EXACTLY 5 columns by 6 rows, 30 separate square cells, aspect ratio 5:6. Every cell contains ONLY ONE completed dish from the ordered list. Cells are read LEFT TO RIGHT, then TOP TO BOTTOM. Render the rows at even, identical heights and columns at even identical widths, so CSS can slice each cell. There are no drawn grid lines.
Style: realistic natural food illustration, clean overhead flat-lay, camera straight down, consistent white ceramic round plates or shallow white bowls for soup. Warm ivory background fills every cell; dishes centered with a small clean margin. Natural appetizing food texture, soft even lighting. Single bowl or plate per cell, home cooking amounts, no sides not named. Soups must look like soups; meat slices must be cooked, eggs fully set. These are AI reference illustrations, not documentary photos.
Constraints: no text, labels, numbers, icons, banners, watermarks, borders, tablecloth, cutlery, hands, decorative flowers, duplicate dishes, collage overlaps. The image must contain all 30 specified foods in the EXACT row order, and each dish visually reflects listed visible ingredients and shape. Do not exchange, omit, or invent items.
Ordered cells:
1. 红烧狮子头 — 大猪肉丸，酱色汤汁，青菜
2. 葱油蚕豆 — 翠绿蚕豆仁，小葱
3. 盐水鸭 — 熟鸭块，淡色鸭皮，小葱
4. 苏式熏鱼 — 酱褐色鱼块，微亮酱汁
5. 无锡酱排骨 — 深红酱汁小排骨
6. 金陵鸭血粉丝汤 — 鸭血块，细粉丝，香菜，白色清汤
7. 苏式酱汁豆干 — 酱色豆腐干方块
8. 虾米芦蒿 — 绿色芦蒿段，虾米
9. 扬州炒饭 — 米饭，虾仁，蛋，火腿，胡萝卜，豌豆
10. 葱油芋艿 — 白色小芋艿块，葱花
11. 油焖春笋 — 酱色嫩春笋块
12. 雪菜笋丝炒毛豆 — 绿色毛豆，细笋丝，雪菜
13. 笋干老鸭煲 — 鸭块，淡褐笋干，清汤
14. 西湖牛肉羹 — 细牛肉末，蛋花，香菜，稠羹
15. 宁波咸齑大汤黄鱼 — 整条黄鱼，雪菜，奶白汤
16. 温州鱼丸汤 — 不规则白鱼丸，紫菜，清汤
17. 嘉兴鲜肉粽 — 棕色粽叶打开的三角糯米肉粽
18. 葱烤鲫鱼 — 整条小鲫鱼，酱汁，长葱段
19. 梅干菜蒸肉 — 肉片，黑褐梅干菜，碗装
20. 杭州酱爆茄子 — 长紫茄子条，红褐酱汁
21. 闽南五香卷 — 豆皮包肉蔬菜卷，切斜段
22. 福州荔枝肉 — 红色糖醋猪肉球，马蹄片
23. 福州醉排骨 — 炸排骨块，甜酸蒜汁
24. 福州肉燕汤 — 白色肉燕小馄饨，葱花，清汤
25. 闽南咸饭 — 米饭，猪肉，香菇，胡萝卜，虾米
26. 沙茶牛肉 — 棕色牛肉片，绿芥蓝，沙茶酱
27. 姜母鸭 — 鸭块，大块老姜，麻油酱汁
28. 红糟蒸鸡 — 红色酒糟腌鸡块
29. 闽南蛤蜊蒸丝瓜 — 开口蛤蜊，浅绿丝瓜，白盘
30. 闽南花生汤 — 软熟白色花生，乳白汤
Final geometry: exactly five equally spaced dish centers across every row and exactly six equally spaced rows; each dish fits fully within its own square.
```

</details>

<details><summary>food-atlas-10.png 初稿</summary>

```text
Use case: product-mockup.
Asset type: offline Chinese cookbook food illustration atlas 10.
Primary request: Create ONE portrait food contact sheet EXACTLY 5 columns by 6 rows, 30 separate square cells, aspect ratio 5:6. Every cell contains ONLY ONE completed dish from the ordered list. Cells are read LEFT TO RIGHT, then TOP TO BOTTOM. Render the rows at even, identical heights and columns at even identical widths, so CSS can slice each cell. There are no drawn grid lines.
Style: realistic natural food illustration, clean overhead flat-lay, camera straight down, consistent white ceramic round plates or shallow white bowls for soup. Warm ivory background fills every cell; dishes centered with a small clean margin. Natural appetizing food texture, soft even lighting. Single bowl or plate per cell, home cooking amounts, no sides not named. Soups must look like soups; meat slices must be cooked, eggs fully set. These are AI reference illustrations, not documentary photos.
Constraints: no text, labels, numbers, icons, banners, watermarks, borders, tablecloth, cutlery, hands, decorative flowers, duplicate dishes, collage overlaps. The image must contain all 30 specified foods in the EXACT row order, and each dish visually reflects listed visible ingredients and shape. Do not exchange, omit, or invent items.
Ordered cells:
1. 徽州刀板香 — 浅褐咸肉厚片，白盘
2. 煎烧毛豆腐 — 金黄毛豆腐块，葱花酱汁
3. 笋干烧肉 — 深褐五花肉块，笋干
4. 徽州蒸蛋饺 — 黄色蛋皮饺，少量清汁
5. 绩溪挞粿 — 圆薄馅饼，金黄表面，菜肉馅
6. 八公山豆腐饺 — 浅金色豆腐皮包肉饺
7. 雪冬烧鸡 — 鸡块，冬笋，雪菜，浅褐汁
8. 问政山笋 — 笋块，香菇，火腿片，淡色汤汁
9. 蕨菜炒腊肉 — 成品蕨菜段，褐红腊肉片
10. 黄山炖鸽 — 鸽子小块，山药，清汤
11. 锅包肉 — 金黄脆猪肉大片，糖醋亮汁，胡萝卜丝
12. 排骨炖豆角 — 熟绿豆角，排骨块，酱汁
13. 小鸡炖蘑菇 — 鸡块，褐色蘑菇，细粉条
14. 酸菜白肉 — 薄五花肉片，黄白酸菜，清汤
15. 新疆大盘鸡 — 鸡块，土豆，青红椒，酱汁
16. 孜然羊肉 — 羊肉薄片，孜然，红椒粉
17. 宁夏羊肉萝卜汤 — 羊肉块，白萝卜，清汤，香菜
18. 陕西肉夹馍 — 圆白吉馍夹碎卤肉
19. 玉米面菜团子 — 黄色玉米面蒸团，绿色蔬菜馅
20. 红糖发面饼 — 圆发面饼，棕色糖馅，金黄表皮
21. 菠菜鸡蛋水晶蒸饺 — 半透明蒸饺，绿色菠菜黄色蛋馅
22. 小米蒸糕 — 黄色小米方形松软糕
23. 香蕉核桃烤松糕 — 金黄香蕉核桃小松糕
24. 烤燕麦能量棒 — 矩形金褐燕麦棒，坚果，葡萄干
25. 口蘑奶酪烘蛋 — 圆盘黄色熟烘蛋，口蘑片，奶酪
26. 豆沙糯米饼 — 白色糯米煎饼，红豆沙馅
27. 桂花酒酿小圆子 — 白糯米圆子，酒酿米粒，桂花，碗装
28. 广式萝卜糕 — 白色萝卜糕厚片，虾米点，金黄煎面
29. 咸豆浆配芝麻酥饼 — 白咸豆浆葱花虾皮，圆芝麻酥饼
30. 鲜虾小米烩饭 — 黄色小米稠饭，虾仁，青豌豆
Final geometry: exactly five equally spaced dish centers across every row and exactly six equally spaced rows; each dish fits fully within its own square.
```

</details>

## 图像编辑提示词

<details><summary>food-atlas-8.png 定点修正</summary>

```text
Use case: precise-object-edit. Edit the supplied 5-column × 6-row Chinese cookbook illustration atlas. Change ONLY TWO cells and preserve all other 28 cells, dimension, dish centers, grid boundaries, background and lighting. Row 3 column 2 (cell 12), 老北京醋溜木须: show ONLY cooked pork thin slices and fully set yellow scrambled egg pieces, a very small amount of sliced scallion and light glossy sour sauce. REMOVE ALL black wood-ear mushrooms and ALL cucumber/green vegetable slices. Do not change it to 木须肉; this Beijing version is egg-and-pork without mushroom/cucumber. Row 4 column 3 (cell 18), 虾酱炒鸡蛋: show fully set light tan/light brown scrambled egg pieces seasoned with shrimp paste and a tiny scattering of sliced scallion. REMOVE green peas and other vegetables; NO whole shrimp. Keep the same white plate, size and center. Do NOT change row 3 column 5 京味炒合菜, which legitimately has green vegetables. Every meat/egg is opaque fully cooked. NO text, labels, extra sides or decorations.
```

</details>

<details><summary>food-atlas-9.png 定点修正</summary>

```text
Use case: precise-object-edit. Edit target: the supplied 5-column by 6-row Chinese food atlas. Change ONLY row 6, column 3 (cell 28), the pink-looking chicken dish. It represents 红糟蒸鸡, fully steamed cooked chicken chunks coated with red fermented rice sauce. Replace raw pink flesh appearance with appetizing opaque fully COOKED chicken: pale beige/off-white cooked flesh visible on the cut faces, red-brown sauce only on the surface, warm natural cooked texture. No pink translucent flesh, no raw chicken. Keep the same white bowl, scale, center, ivory background, atlas dimensions and grid boundaries. Preserve EVERY other cell, ingredient, dish, plate, lighting, layout and crop exactly. No letters or text; no added decorations. It is a finished cooked dish illustration.
```

</details>

<details><summary>food-atlas-10.png 定点修正</summary>

```text
Use case: precise-object-edit. Edit target: the supplied 5-column by 6-row Chinese cookbook atlas. Change ONLY row 2 column 1 (cell 6). This dish is 千张鲜肉蒸饺: cooked minced pork enclosed in thin dried-tofu sheets, NOT wheat dough dumplings. Replace the pleated flour pastry dumplings in that plate with FIVE small steamed rectangular/envelope-fold parcels made from pale yellow thin 千张/豆腐皮, with a visibly thin fine-textured soybean sheet, flat folded edges, one piece cut in half showing opaque fully cooked minced pork. The parcels may be slightly curved rectangles but must NOT look like pleated white wheat gyoza or a white tofu mound. Keep the white plate, same dish center and scale, ivory background, camera/light. Preserve all other 29 dishes, centers, rows, columns, canvas size and geometry exactly. No text, borders, side dishes or decorations.
```

</details>
