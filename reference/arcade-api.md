# MakeCode Arcade API — AI Reference
# Source: pxt-common-packages TypeScript declarations
# Format: signature  // note  ⚠=gotcha ⭐=non-obvious

---
## COLOR PALETTE (game.Color enum)
0=Transparent 1=White 2=Red 3=Pink 4=Orange 5=Yellow 6=Teal 7=Green
8=Blue 9=LightBlue 10=Purple 11=LightPurple 12=DarkPurple 13=Tan 14=Brown 15=Black
Use game.Color.Red not magic number 2.

---
## SPRITE CLASS

### Physics (all r/w)
sprite.x  sprite.y                        // center position
sprite.left  sprite.right  sprite.top  sprite.bottom  // ⭐ edge coords
sprite.vx  sprite.vy                      // velocity px/s
sprite.ax  sprite.ay                      // acceleration (ay=350 for gravity)
sprite.fx  sprite.fy                      // friction (slows velocity)
sprite.z                                  // render depth, higher=front
sprite.layer                              // ⭐ collision bitmask, default 1; collide only if layerA & layerB ≠ 0
sprite.lifespan                           // ⭐ ms until auto-destroy; undefined=permanent
sprite.data                               // ⭐ any object, attach custom properties freely

### Identity & Image
sprite.image: Image                       // current image (r/w)
sprite.kind(): number
sprite.setKind(k: number)
sprite.setImage(img: Image)
sprite.setPosition(x, y)
sprite.setVelocity(vx, vy)

### Flags — sprite.setFlag(SpriteFlag.X, bool)
SpriteFlag.FlipX / FlipY                 // ⚠ use setFlag, NOT sprite.flipX=true
SpriteFlag.AutoDestroy                    // destroy when off screen
SpriteFlag.DestroyOnWall                 // ⭐ good for bullets
SpriteFlag.BounceOnWall
SpriteFlag.Invisible
SpriteFlag.StayInScreen
SpriteFlag.RelativeToCamera              // ⭐ HUD mode: position in screen space
SpriteFlag.GhostThroughWalls             // skip wall collision
SpriteFlag.GhostThroughSprites           // skip sprite overlap events
SpriteFlag.GhostThroughTiles             // skip tile overlap events
SpriteFlag.Ghost = all three Ghost flags combined

### Collision & Detection
sprite.overlapsWith(other: Sprite): boolean        // ⭐ instant check, not event-based
sprite.isHittingTile(CollisionDirection.X): boolean // Bottom=on ground, use in jump handler
sprite.tilemapLocation(): tiles.Location
sprite.tileKindAt(TileDirection.X, tile: Image): boolean  // ⭐ check adjacent tile

### Behavior
sprite.setStayInScreen(bool)
sprite.setBounceOnWall(bool)
sprite.follow(target, speed?, turnRate?)  // ⭐ built-in AI follow; turnRate=momentum
sprite.unfollow()
sprite.setScale(value, ScaleAnchor.Center)
sprite.changeScale(delta, ScaleAnchor.Center)
sprite.sayText(text, ms?, animated?, textColor?, boxColor?)  // ⭐ speech bubble
sprite.startEffect(effects.X, ms?)
sprite.onDestroyed(fn)                   // ⭐ per-sprite (vs sprites.onDestroyed = per-kind)
sprite.destroy(effect?, ms?)

---
## SPRITES NAMESPACE

sprites.create(img: Image, kind?: number): Sprite
sprites.createProjectileFromSprite(img, sprite, vx, vy): Sprite  // ⭐ auto-destroy offscreen
sprites.createProjectileFromSide(img, vx, vy): Sprite            // ⭐ spawns at screen edge
sprites.allOfKind(kind): Sprite[]         // ⚠ live array; avoid calling inside onUpdate every frame
sprites.destroyAllSpritesOfKind(kind, effect?, ms?)
sprites.onCreated(kind, (s)=>void)
sprites.onDestroyed(kind, (s)=>void)
sprites.onOverlap(k1, k2, (s1,s2)=>void) // ⚠ fires once per pair per frame, not continuously

### Sprite Data (ECS pattern, no external lib needed)
sprites.setDataNumber(s, "key", val)
sprites.readDataNumber(s, "key"): number
sprites.setDataBoolean(s, "key", bool)
sprites.readDataBoolean(s, "key"): boolean
sprites.setDataString(s, "key", str)
sprites.readDataString(s, "key"): string
// ⭐ Alternative: (sprite.data as any).hp = 100  — simpler, same result

### SpriteKind
namespace SpriteKind { export const Coin = SpriteKind.create() }  // extend at top level
// Built-in: Player Projectile Food Enemy

---
## GAME NAMESPACE

game.onUpdate(fn)                         // every frame
game.onUpdateInterval(ms, fn)             // every N ms
game.forever(fn)                          // ⭐ parallel fiber, loops ~20ms; non-blocking
game.onPaint(fn)                          // ⭐ draw BEFORE sprites (z=-20), e.g. floor
game.onShade(fn)                          // ⭐ draw AFTER sprites (z=80), e.g. weather overlay
game.runtime(): number                    // ⭐ ms since scene start (use for timers/animation)

### Scene Stack (for pause menus / sub-screens)
game.pushScene()                          // ⭐ push new empty scene, preserves current world
game.popScene()                           // ⭐ restore previous scene
game.addScenePushHandler((old)=>void)
game.addScenePopHandler((old)=>void)

### Dialogs
game.splash(title, subtitle?)             // ⭐ blocking splash, press A to dismiss
game.showDialog(title, subtitle, footer?) // non-blocking, renders one frame
game.showLongText(str, DialogLayout.Bottom) // paginated, blocking
game.setDialogFrame(img)                  // custom border
game.setDialogTextColor(color)
// DialogLayout: Bottom Left Right Top Center Full

### Game Over
game.over(win: boolean, effect?)
game.onGameOver((win)=>void)              // ⭐ intercept and replace game-over screen
game.setGameOverMessage(win, "msg ${PLAYER}") // ⭐ ${PLAYER} ${WINNER} tokens

### Debug
game.debug = true   // show hitboxes
game.stats = true   // show perf counters

---
## SCENE NAMESPACE

scene.setBackgroundColor(color)           // ⚠ NOT game.setBackgroundColor
scene.setBackgroundImage(img)
scene.addBackgroundLayer(img, distance?, alignment?)  // ⭐ built-in parallax, no extension

### Camera
scene.cameraFollowSprite(sprite)
scene.centerCameraAt(x, y)
scene.cameraShake(amplitude, ms)
scene.cameraProperty(CameraProperty.X/Y/Left/Right/Top/Bottom): number  // ⭐ world coords

### Collision Events
scene.onOverlapTile(kind, tile, (sprite, loc)=>void)
scene.onHitWall(kind, (sprite, loc)=>void)  // ⚠ NOT sprites.onHitWall

### Custom Rendering
scene.createRenderable(z, (screen: Image, camera)=>void)  // ⭐ draw at any z depth

---
## TILES NAMESPACE

tiles.setCurrentTilemap(tilemap)          // ⚠ NOT tiles.setTilemap
tiles.getTileLocation(col, row): Location
tiles.getTilesByType(tile): Location[]    // ⭐ all matching tiles; use for spawn points
tiles.getRandomTileByType(tile): Location // ⭐ single random match
tiles.placeOnTile(sprite, loc)
tiles.placeOnRandomTile(sprite, tile)
tiles.setTileAt(loc, tile)               // ⭐ dynamically replace tile
tiles.setWallAt(loc, bool)               // ⭐ toggle wall collision
tiles.tileAtLocationEquals(loc, tile): boolean
tiles.tileAtLocationIsWall(loc): boolean
tiles.locationXY(loc, tiles.XY.row): number   // ⭐ get row from Location
tiles.locationXY(loc, tiles.XY.column): number // ⭐ get col from Location
tiles.addEventListener(TileMapEvent.Loaded, fn)  // ⭐ fires after map switch

### tiles.Location class
loc.column  loc.row
loc.x  loc.y                             // world pixel center
loc.left  loc.top  loc.right  loc.bottom
loc.isWall(): boolean
loc.getImage(): Image
loc.getNeighboringLocation(CollisionDirection.X): Location  // ⭐ adjacent tile
loc.place(sprite)                        // center sprite on tile

### TileScale enum
TileScale.Four(4px) Eight(8px) Sixteen(16px) ThirtyTwo(32px)

---
## INFO NAMESPACE (HUD auto-renders on first call — no custom UI needed)

info.setScore(n)  info.changeScoreBy(n)  info.score(): number   // ⚠ score() not score
info.setLife(n)   info.changeLifeBy(n)   info.life(): number    // ⚠ life() not lives
info.highScore(): number                 // ⭐ built-in persistent high score from settings
info.onScore(n, fn)                      // ⭐ fires when score crosses n (either direction)
info.onLifeZero(fn)                      // override default game-over
info.setLifeImage(img)                   // ⭐ custom heart icon
info.startCountdown(seconds)
info.countdown(): number                 // ⭐ remaining seconds
info.changeCountdownBy(seconds)          // ⭐ add/subtract time
info.stopCountdown()
info.onCountdownEnd(fn)
info.showScore(bool)  info.showLife(bool)  info.showCountdown(bool)
info.setBorderColor(c)  info.setFontColor(c)

### Multiplayer HUD
info.player1.setScore(n)  info.player1.score()
info.player2.setLife(n)   info.player2.life()
info.player1.onLifeZero(fn)
info.winningPlayer(): PlayerInfo          // ⭐ highest score
info.playersWithScores(): PlayerInfo[]

---
## CONTROLLER NAMESPACE

controller.A  controller.B  controller.left  controller.right  controller.up  controller.down  controller.menu

### Button methods
button.isPressed(): boolean
button.pressureLevel(): number           // ⭐ analog 0-512
button.onEvent(ControllerButtonEvent.X, fn)       // replaces handler
button.addEventListener(event, fn)       // ⭐ additive; use in extensions
button.removeEventListener(event, fn)
button.repeatDelay                       // ⭐ ms before repeat fires (per-button override)
button.repeatInterval                    // ⭐ ms between repeats
// ControllerButtonEvent: Pressed Released Repeated

controller.moveSprite(sprite, vx?, vy?) // default speed 100; vx=100,vy=0 locks Y axis
controller.dx()  controller.dy()         // analog tilt values
controller.configureRepeatEventDefaults(delay, interval)
controller.combos.attachCombo("aabbabab", fn)  // ⭐ secret code / Konami code

### Multiplayer
controller.player1.A.isPressed()
controller.player2.left.onEvent(...)

---
## IMAGE CLASS

### Create
image.create(w, h): Image
img``  // inline literal; . = transparent pixel

### Pixel Operations
img.width  img.height
img.setPixel(x, y, color)
img.getPixel(x, y): number
img.fill(color)
img.clone(): Image
img.equals(other): boolean
img.revision(): number                   // ⭐ increments on change; use for dirty check

### Transform
img.flipX()  img.flipY()                 // ⚠ mutates in place; clone first if needed
img.scroll(dx, dy)                       // ⭐ wrapping pixel scroll
img.replace(fromColor, toColor)          // ⭐ color swap / skin system
img.rotated(deg): Image                  // ⭐ returns NEW image rotated ±90/180/270

### Draw
img.drawLine(x0,y0,x1,y1,color)
img.drawRect(x,y,w,h,color)
img.fillRect(x,y,w,h,color)
img.drawCircle(cx,cy,r,color)
img.fillCircle(cx,cy,r,color)            // ⭐
img.fillTriangle(x0,y0,x1,y1,x2,y2,c)  // ⭐
img.drawTransparentImage(src, x, y)      // composite with alpha
img.drawImage(src, x, y)                 // composite, no alpha
img.blit(xD,yD,wD,hD, src, xS,yS,wS,hS, transparent, check) // ⭐ stretch-blit

### Utilities
image.font5  image.font8                 // ⭐ built-in fonts
image.getFontForText(str): Font
image.repeatY(n, img): Image             // ⭐ stack vertically n times
image.concatY(imgs[]): Image             // ⭐ vertical concat

---
## MUSIC NAMESPACE

music.play(playable, PlaybackMode.X)
music.melodyPlayable(melody): Playable
music.stringPlayable("C D E F G", bpm): Playable
// PlaybackMode: UntilDone InBackground LoopingInBackground
// Built-in melodies: baDing pewPew jumpUp powerUp powerDown wawawawaa funeral knock

music.stopAllSounds()
music.setTempo(bpm)  music.tempo(): number
music.ringTone(hz)   music.rest(ms)

### Sound Synthesis (no audio files needed)
music.createSoundEffect(wave, startHz, endHz, startVol, endVol, ms, effect, curve): SoundEffect
// WaveShape: Square Sawtooth Triangle Noise
// SoundExpressionEffect: None Warble Vibrato Tremolo
// InterpolationCurve: Linear Curve Logarithmic

### LFO Modulation (advanced)
let s = sound.create()
sound.addPart(s, sound.Waveform.Cycle48, durationMs, startHz, endHz, startVol, endVol)
sound.applyFrequencyModulation(s, sound.createLFO(sound.LFOWaveform.Square, hz), sound.semitoneScaleFactor(n))
sound.play(s, false)

---
## SETTINGS NAMESPACE (persistent, scoped per game automatically)

settings.writeNumber(key, n)   settings.readNumber(key): number|undefined
settings.writeString(key, s)   settings.readString(key): string|undefined
settings.writeJSON(key, obj)   settings.readJSON(key): any     // ⭐ store objects directly
settings.writeNumberArray(key, arr)  settings.readNumberArray(key): number[]|undefined
settings.exists(key): boolean
settings.remove(key)
settings.list(prefix?): string[]   // ⭐ enumerate keys
settings.clear()                   // ⭐ wipe all saves for this game
settings.runNumber(): number       // ⭐ how many times game has run (onboarding use)

---
## EFFECTS NAMESPACE

### Sprite Particle Effects
effects.spray  effects.trail  effects.fountain
sprite.startEffect(effects.trail)
effects.clearParticles(sprite)

### Screen Effects
effects.confetti  effects.hearts  effects.smiles  effects.starField  effects.fire  effects.bubbles
effects.fire.startScreenEffect(ms?, rate?)
effects.fire.endScreenEffect()

### Image Effects (mutate sprite image)
effects.dissolve  effects.melt  effects.slash  effects.splatter
effects.dissolve.applyTo(sprite)           // ⭐ modifies sprite.image in place

### Custom Particle Source
let src = particles.createParticleSource(sprite, particlesPerSecond)
src.setAcceleration(ax, ay)               // particle gravity
src.setEnabled(bool)
src.setRate(n)
src.lifespan = ms                         // ⭐ source auto-destroys after ms
src.clear()   src.destroy()

---
## ANIMATION EXTENSIONS

### animation ("animation": "*")
animation.runImageAnimation(sprite, frames[], ms, loop)
animation.runMovementAnimation(sprite, pathStr, ms, loop)
// Built-in paths: animation.animationPresets(animation.shake/flyToCenter/bounceRight/
//   bounceLeft/bobbing/bobbingRight/easeRight/easeLeft/easeDown/easeUp/waveRight/waveLeft)
animation.stopAnimation(AnimationTypes.All, sprite)
// AnimationTypes: All ImageAnimation MovementAnimation

### characterAnimations ("characterAnimations": "*")
characterAnimations.loopFrames(sprite, frames[], ms, rule)
characterAnimations.rule(Predicate.MovingRight, Predicate.HittingWallDown): rule
characterAnimations.setCharacterAnimationsEnabled(sprite, bool)  // ⭐ disable during attack
// Predicate: Moving NotMoving MovingLeft MovingRight MovingUp MovingDown
//   FacingLeft FacingRight HittingWallLeft HittingWallRight HittingWallUp HittingWallDown

---
## TIMER EXTENSION ("timer": "*")

timer.after(ms, fn)                       // ⚠ never call unconditionally inside onUpdate
timer.background(fn)                      // ⭐ parallel fiber; use pause(ms) inside for sequencing
timer.debounce("key", ms, fn)             // ⭐ rate-limit; key=unique string per debounce
// Use debounce for: onOverlap damage, button spam, overlap tile effects

---
## OTHER EXTENSIONS

### StatusBars ("pxt-status-bar": "*")
statusbars.create(w, h, StatusBarKind.Health): StatusBar
bar.setColor(fg, bg)  bar.max = n  bar.value = n
bar.attachToSprite(sprite, dy, dx)

### TextSprite ("textsprite": "*")
textsprite.create(text, bgColor, borderColor): TextSprite
label.setOutline(n, color)  label.setPosition(x, y)

### Story ("story": "*")
story.startCutscene(fn)
story.printDialog(text, x, y, w, h, bgColor, borderColor, speed)
// story.TextSpeed: Normal Fast Slow

### Scroller ("scroller": "*")
scroller.setLayerImage(scroller.BackgroundLayer.Layer0, img)

### Sprite Scaling ("sprite-scaling": "*")
scaling.scaleToPercent(sprite, pct, direction?, anchor?)   // e.g. 150 = 150%
scaling.scaleToPixels(sprite, px, direction?, anchor?, proportional?)

### Sprite Utils ("spriteutils": "*")
spriteutils.distanceBetween(a, b): number

### SpriteTileMaps ("spriteTileMaps": "*") — per-sprite collision layers
spriteTileMaps.getTileMapForSprite(sprite)
spriteTileMaps.setTileMapForSprite(sprite, map)
tileUtil.cloneMap(map)
tileUtil.setWallAt(map, loc, bool)

---
## ENUMS QUICK REFERENCE

CollisionDirection: Left Right Top Bottom
TileDirection: Left Right Top Bottom Center
ScaleAnchor: Middle Top Left Right Bottom TopLeft TopRight BottomLeft BottomRight
ScaleDirection: Vertically Horizontally Uniformly
BackgroundAlignment: Left Right Top Bottom Center
CameraProperty: X Y Left Right Top Bottom
TileMapEvent: Loaded Unloaded
ControllerButtonEvent: Pressed Released Repeated
DialogLayout: Bottom Left Right Top Center Full
AnimationTypes: All ImageAnimation MovementAnimation
