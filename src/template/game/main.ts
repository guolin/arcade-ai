let player = sprites.create(img`
. . . . . . . . . . . . . . . .
. . . . . . . f f . . . . . . .
. . . . . . f 4 4 f . . . . . .
. . . . . . f 4 4 f . . . . . .
. . . . . f 4 4 4 4 f . . . . .
. . . . f 4 4 4 4 4 4 f . . . .
. . . . f 4 4 4 4 4 4 f . . . .
. . . . f 4 4 4 4 4 4 f . . . .
`, SpriteKind.Player)
controller.moveSprite(player)
player.setStayInScreen(true)
