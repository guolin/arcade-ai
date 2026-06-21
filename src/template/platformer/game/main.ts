// Use SpriteKind.create() to create a unique kind for each sprite
const PlayerKind = SpriteKind.create();
const EnemyKind = SpriteKind.create();

// The Y acceleration of the player and enemies in pixel/second^2
const GRAVITY = 1000;

// The move speed of the player in pixels/second
const MOVE_SPEED = 100;

// The jump height in pixels
const JUMP_HEIGHT = 32;

// The height the player bounces when they jump on an enemy
const BOUNCE_HEIGHT = 16;

// The move speed of enemies in pixels/second
const ENEMY_SPEED = 50;

let player: Sprite;
startGame();

function startGame() {
    // Set the background color to cyan
    scene.setBackgroundColor(9);

    loadTilemap();
    createPlayer();
    registerEvents();
}

function loadTilemap () {
    // Load the tilemap asset
    scene.setTileMapLevel(assets.tilemap`level`);
    
    // Loop over all enemySpawn tiles and create enemy sprites at
    // those locations
    for (let location of tiles.getTilesByType(assets.tile`enemySpawn`)) {
        const enemy = sprites.create(assets.image`enemyImage`, EnemyKind);
        enemy.x = location.x;
        enemy.y = location.y;
        enemy.ay = GRAVITY;
        
        // Hide the enemy spawn tile
        tiles.setTileAt(location, assets.tile`transparency16`);
        
        // Randomly make the enemy move left or right
        if (Math.percentChance(50)) {
            enemy.vx = ENEMY_SPEED;
        } else {
            enemy.vx = 0 - ENEMY_SPEED;
        }
    }
}

function createPlayer() {
    // Create the player sprite using the playerImage asset
    player = sprites.create(assets.image`playerImage`, PlayerKind);

    // Set the acceleration in the Y direction equal to our gravity
    player.ay = GRAVITY;

    // Move the sprite with buttons, but only in the X direction
    controller.moveSprite(player, MOVE_SPEED, 0);

    // Follow the player with the camera. The camera is automatically
    // boxed within the tilemap
    scene.cameraFollowSprite(player);

    // Place the player on top of the playerSpawn tile
    tiles.placeOnRandomTile(player, assets.tile`playerSpawn`);

    // Hide the player spawn tile
    tiles.setTileAt(player.tilemapLocation(), assets.tile`transparency16`);
}

function registerEvents () {
    // Jump on A button press
    controller.A.onEvent(ControllerButtonEvent.Pressed, () => {
        // First make sure the player is on the ground
        if (player.isHittingTile(CollisionDirection.Bottom)) {
            doJump(player, JUMP_HEIGHT);
        }
    });
    
    // When the player overlaps lava, end the game
    scene.onOverlapTile(PlayerKind, assets.tile`lava`, (sprite, location) => {
        onPlayerDied();
    });
    
    // When the player overlaps the treasure chest, win the game
    scene.onOverlapTile(PlayerKind, assets.tile`treasureChest`, (sprite, location) => {
        game.over(true);
    });

    // Handle player overlapping with an enemy
    sprites.onOverlap(PlayerKind, EnemyKind, (sprite, otherSprite) => {
        // Check to see if the player is jumping on the enemy
        if (sprite.vy > 0 && sprite.bottom < otherSprite.top + 8) {
            // Destroy the enemy and bounce the player
            otherSprite.destroy();
            doJump(sprite, BOUNCE_HEIGHT);
        }
        else {
            // If the player isn't jumping on top of the enemy, take damage
            onPlayerDied();
        }
    });

    // Bounce enemies off of each other when they overlap
    sprites.onOverlap(EnemyKind, EnemyKind, (sprite, otherSprite) => {
        if (sprite.x < otherSprite.x) {
            sprite.right = otherSprite.left;
            sprite.vx = -ENEMY_SPEED;
            otherSprite.vx = ENEMY_SPEED;
        }
        else {
            otherSprite.right = sprite.left;
            otherSprite.vx = -ENEMY_SPEED;
            sprite.vx = ENEMY_SPEED;
        }
    });

    // Also bounce enemies off of walls
    scene.onHitWall(EnemyKind, (sprite, location) => {
        if (sprite.isHittingTile(CollisionDirection.Left)) {
            sprite.vx = ENEMY_SPEED;
        }
        else if (sprite.isHittingTile(CollisionDirection.Right)) {
            sprite.vx = -ENEMY_SPEED;
        }
    });
}

function doJump (sprite: Sprite, height: number) {
    sprite.vy = -Math.sqrt(2 * height * GRAVITY);
}

function onPlayerDied () {
    game.reset();
}
