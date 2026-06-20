// 玩家精灵：内联 img（AI 直接写，编辑器里可点开可视化微调）
let player = sprites.create(img`
. . . . . . f f f f . . . . . .
. . . . . f f f f f f . . . . .
. . . . f f e e e e f f . . . .
. . . . f e f e e f e f . . . .
. . . . f e e e e e e f . . . .
. . . . f e f e e f e f . . . .
. . . . f e f f f f e f . . . .
. . . . f e e e e e e f . . . .
. . . . . f f f f f f . . . . .
. . . . . . f f f f . . . . . .
. . . . . f f . . f f . . . . .
. . . . . . . . . . . . . . . .
`, SpriteKind.Player)
controller.moveSprite(player)
player.setStayInScreen(true)

// 地图：引用命名地图 `level`。
// 编辑器首次打开会自动创建一张空地图——你在网页里点开地图编辑器画好后，
// 会自动同步回本地磁盘（tilemap.g.ts / tilemap.g.jres），并随游戏运行。
// 画格子时可直接用内置图块库（如 sprites.castle.tileGrass1），无需手画。
tiles.setTilemap(tilemap`level`)
scene.cameraFollowSprite(player)
