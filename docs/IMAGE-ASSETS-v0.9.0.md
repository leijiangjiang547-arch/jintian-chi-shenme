# 第九版离线图片登记

使用内置 ImageGen 工具，按40道新热菜名称和主要食材生成两张5列4行的图集。未下载平台图片，不是实拍或厨房验证。保留原有300道图片的单元及文件。新素材已保存于仓库web目录；完整生成提示词见 [v09-image-prompts.json](v09-image-prompts.json)，玉米排骨汤补胡萝卜的定点编辑提示见 [v09-image-edit-prompt.txt](v09-image-edit-prompt.txt)。

实际尺寸均为1402×1122；裁切边界以目视检查后的registry为准，底部空白不进入菜谱单元。每道唯一单元，PNG内容未经脚本像素改绘。编辑后的B图集已再次检查顺序、主材、熟肉外观和边界；弃用初稿保留在开发机仓库外，不打包。界面只展示成品参考，生成素材性质在设置中统一说明。

| 文件 | 菜谱单元数 | SHA256 |
| --- | --- | --- |
| food-atlas-11.png | 20 | 0557f9d6a4178de990cbbee22aa82abf5e6291ba8e4b24d90e300ee6139b48e9 |
| food-atlas-12-v2.png | 20 | 1b1d2a7f16e41b0800a3df37e0e8fc00a1007edfc1faaf7323f4fae2c2186885 |
