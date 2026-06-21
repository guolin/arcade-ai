// Use SpriteKind.create() to create a unique kind for each Sprite
const GateKind = SpriteKind.create();
const PlayerKind = SpriteKind.create();

scene.setBackgroundColor(9);
showControls();
startGame();

function showControls() {
    // showLongText automatically pauses until A is pressed
    game.showLongText("Press A to jump\n \nTry to avoid the gates!", DialogLayout.Center);
}

function startGame() {
    // Create the player sprite using the "playerImage" asset
    const mySprite = sprites.create(assets.image`playerImage`, PlayerKind);
    mySprite.left = 4;
    mySprite.setFlag(SpriteFlag.StayInScreen, true);
    mySprite.ay = 500;

    // When A is pressed, make the player sprite jump and play a flapping animation
    controller.A.onEvent(ControllerButtonEvent.Pressed, () => {
        mySprite.vy = -100;
        animation.runImageAnimation(mySprite, assets.animation`playerAnimation`, 50)
    });

    // Spawn a gate every 2 seconds
    game.onUpdateInterval(2000, () => {
        // Create a gate with an empty image that spans the height of the screen
        const gate = sprites.create(image.create(12, screen.height), GateKind);

        // Select a y value for our gate opening to start
        const gapHeight = 50;
        const gapStart = randint(0, screen.height - gapHeight);

        // Draw the gate on the empty image
        gate.image.fillRect(2, 0, 8, screen.height, 6);
        gate.image.fillRect(2, gapStart, 8, 50, 0);
        gate.image.fillRect(0, gapStart - 5, 12, 5, 6);
        gate.image.fillRect(0, gapStart + gapHeight, 12, 5, 6);

        // Move the gate to the right side of the screen and give it velocity
        gate.left = screen.width;
        gate.vx = -50;

        // Turn on the AutoDestroy flag so that gates are automatically destroyed
        // when they leave the screen
        gate.setFlag(SpriteFlag.AutoDestroy, true);
    });

    // End the game when the player overlaps a gate
    sprites.onOverlap(PlayerKind, GateKind, (sprite, otherSprite) => {
        game.over();
    });

    // When a gate is auto destroyed, increase our score by 1
    sprites.onDestroyed(GateKind, () => {
        info.changeScoreBy(1);
    });
}

