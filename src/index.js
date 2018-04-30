import PIXI from 'expose-loader?PIXI!phaser-ce/build/custom/pixi.js';
import p2 from 'expose-loader?p2!phaser-ce/build/custom/p2.js';
import Phaser from 'expose-loader?Phaser!phaser-ce/build/custom/phaser-split.js';

const GAME_WIDTH = 1280;
const GAME_HEIGHT = 600;

var game = new Phaser.Game(
  GAME_WIDTH,
  GAME_HEIGHT,
  Phaser.AUTO,
  '2nite',
  {
    preload,
    create,
    update,
    render
  }
);

function preload () {
  game.load.image('bullet', 'assets/bullet.png');
  game.load.image('sky', 'assets/sky.png');
  game.load.image('structure', 'assets/platform.png');
  game.load.spritesheet('ground', 'assets/tiles-1.png', 100, 58.5, 1, 4);
  game.load.spritesheet('player', 'assets/dude.png', 32, 48);
  game.load.spritesheet('weapons', 'assets/weapons.gif', 105, 67);
  game.load.spritesheet('kaboom', 'assets/explosion.png', 64, 64, 23);
}

let sky;
let ground;

let explosions;

let player;
let facing = 'right';
const FRAME_PLAYER_LEFT = 0;
const FRAME_PLAYER_RIGHT = 5;

let weaponSprite;
let weapon;
let currentWeaponType;
const WEAPON_TYPE_SMG = 'SMG';
const WEAPON_TYPE_RIFLE = 'Rifle';
const WEAPON_TYPE_SHOTGUN = 'Shotgun';
const WEAPON_TYPE_SNIPER = 'Sniper';

let bullets;
let bulletsShotSMG = 0;
let bulletsShotRifle = 0;
let bulletsShotShotgun = 0;
let bulletsShotSniper = 0;
const BULLETS_SMG = 35;
const BULLETS_RIFLE = 30;
const BULLETS_SHOTGUN = 5;
const BULLETS_SNIPER = 1;
const DAMAGE_SMG = 10;
const DAMAGE_RIFLE = 25;
const DAMAGE_SHOTGUN = 75;
const DAMAGE_SNIPER = 100;
const FIRERATE_SMG = 150;
const FIRERATE_RIFLE = 300;
const FIRERATE_SHOTGUN = 700;
const FIRERATE_SNIPER = 1200;

let structures;
let newStructure;
let structurePlacement;

let structuresRemaining = 5;

let cursors;
let secUpKey;
let secLeftKey;
let secRightKey;
let jumpKey;
let reloadKey;
let wallKey;
let rampKey;
let platformKey;
let oneKey;
let twoKey;
let threeKey;
let fourKey;

const GRAVITY = 400;

function create () {
  // *** Resize game world to be a 1600 x 600 square ***
  game.world.setBounds(-GAME_WIDTH, 0, GAME_WIDTH * 2, GAME_HEIGHT);
  game.physics.arcade.gravity.y = GRAVITY;

  // *** Tiled scrolling sky ***
  sky = game.add.tileSprite(0, 0, GAME_WIDTH, GAME_HEIGHT, 'sky');
  sky.fixedToCamera = true;

  // *** Tiled scrolling ground ***
  ground = game.add.tileSprite(0, 541.5, GAME_WIDTH, 58, 'ground', 0);
  ground.fixedToCamera = true;
  game.physics.enable(ground, Phaser.Physics.ARCADE);

  ground.body.immovable = true;
  ground.body.allowGravity = false;

  // *** Player ***
  player = game.add.sprite(0, 450, 'player');
  player.anchor.setTo(0.5, 0.5);
  game.physics.enable(player, Phaser.Physics.ARCADE);

  player.body.collideWorldBounds = true;
  player.body.setSize(28, 36, 2, 12); // Hitbox/Collision model

  player.scale.set(1.5);

  player.animations.add('left', [0, 1, 2, 3], 10, true);
  player.animations.add('turn', [4], 20, true);
  player.animations.add('right', [5, 6, 7, 8], 10, true);

  // *** Default weapon - Rifle ***
  weaponSprite = game.add.sprite(0, 0, 'weapons', 0);
  weaponSprite.anchor.setTo(0.3, 0.5);
  weaponSprite.scale.set(.6);
  weaponSprite.x = player.x + 25;

  currentWeaponType = WEAPON_TYPE_RIFLE;

  // *** Bullets ***
  // Creates 30 bullets, using the 'bullet' graphic
  weapon = game.add.weapon(BULLETS_RIFLE, 'bullet');
  weapon.fireLimit = BULLETS_RIFLE;
  weapon.bulletKillType = Phaser.Weapon.KILL_CAMERA_BOUNDS;

  weapon.bullets.forEach(bullet => {
    bullet.scale.set(1.5);
  }, this)

  // No gravity on bullets
  weapon.bulletGravity.y = -GRAVITY;

  // Rotate bullets
  weapon.bulletAngleOffset = 90;

  // The speed at which the bullet is fired
  weapon.bulletSpeed = 400;

  // Speed-up the rate of fire, allowing them to shoot 1 bullet every 60ms
  weapon.fireRate = FIRERATE_RIFLE;

  // Tell the Weapon to track the 'weaponSprite' Sprite
  // But the 'true' argument tells the weapon to track sprite rotation
  weapon.trackSprite(weaponSprite, 25, -5, true);



  //  Explosion pool
  explosions = game.add.group();

  for (var i = 0; i < 10; i++) {
    var explosionAnimation = explosions.create(0, 0, 'kaboom', [0], false);
    explosionAnimation.anchor.setTo(0.5, 0.5);
    explosionAnimation.animations.add('kaboom');
  }



  // *** Structures ***
  structures = game.add.group();
  structures.enableBody = true;
  structures.physicsBodyType = Phaser.Physics.ARCADE;

  // *** Camera ***
  game.camera.follow(player);
  game.camera.deadzone = new Phaser.Rectangle(490, 150, 300, 300);

  // *** Keybinds ***
  cursors = game.input.keyboard.createCursorKeys();
  secUpKey = game.input.keyboard.addKey(Phaser.Keyboard.W);
  secLeftKey = game.input.keyboard.addKey(Phaser.Keyboard.A);
  secRightKey = game.input.keyboard.addKey(Phaser.Keyboard.D);
  jumpKey = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
  reloadKey = game.input.keyboard.addKey(Phaser.Keyboard.R);
  wallKey = game.input.keyboard.addKey(Phaser.Keyboard.Q);
  rampKey = game.input.keyboard.addKey(Phaser.Keyboard.E);
  platformKey = game.input.keyboard.addKey(Phaser.Keyboard.F);
  oneKey = game.input.keyboard.addKey(Phaser.Keyboard.ONE);
  twoKey = game.input.keyboard.addKey(Phaser.Keyboard.TWO);
  threeKey = game.input.keyboard.addKey(Phaser.Keyboard.THREE);
  fourKey = game.input.keyboard.addKey(Phaser.Keyboard.FOUR);

  // *** Fullscreen ***
  // game.input.onDown.add(toggleFullscreen, this); // Fullscreen on mouse down
  game.scale.fullScreenScaleMode = Phaser.ScaleManager.SHOW_ALL;
}

function update () {
  game.physics.arcade.collide(player, [ground, structures]);
  // game.physics.arcade.overlap(bullets, enemies[i].tank, bulletHitEnemy, null, this); // Like collide without the physics applied

  // Stops player when no movement keys are pressed
  player.body.velocity.x = 0;

  if (cursors.left.isDown || secLeftKey.isDown) {
    player.body.velocity.x = -150;

    if (facing != 'left') {
      player.animations.play('left');
      facing = 'left';
    }

    // Flips weapon to face left
    if (weaponSprite.scale.y > 0) {
      weaponSprite.scale.y *= -1;
      weapon.trackSprite(weaponSprite, 25, 5, true);
    }

    // Weapon follows player left
    weaponSprite.x = player.x - 10;
  }
  else if (cursors.right.isDown || secRightKey.isDown) {
    player.body.velocity.x = 150;

    if (facing != 'right') {
      player.animations.play('right');
      facing = 'right';
    }

    // Flips weapon to face right
    if (weaponSprite.scale.y < 0) {
      weaponSprite.scale.y *= -1;
      weapon.trackSprite(weaponSprite, 25, -5, true);
    }

    // Weapon follows player right
    weaponSprite.x = player.x + 10;
  }
  else {
    if (facing != 'idle') {
      player.animations.stop();

      if (facing == 'left') {
        player.frame = FRAME_PLAYER_LEFT;
      }
      else {
        player.frame = FRAME_PLAYER_RIGHT;
      }

      facing = 'idle';
    }
  }

  if ((cursors.up.isDown || secUpKey.isDown || jumpKey.isDown) && player.body.touching.down) {
    player.body.velocity.y = -250;
  }

  if (wallKey.isDown && structuresRemaining > 0) {
    createWallPlacement();
  }
  else if (rampKey.isDown && structuresRemaining > 0) {
    createRampPlacement();
  }
  else if (platformKey.isDown && structuresRemaining > 0) {
    createPlatformPlacement();
  }
  else if (wallKey.justReleased() && structuresRemaining > 0) {
    structurePlacement.destroy();
    createWall();
  }
  else if (rampKey.justReleased() && structuresRemaining > 0) {
    structurePlacement.destroy();
    createRamp();
  }
  else if (platformKey.justReleased() && structuresRemaining > 0) {
    structurePlacement.destroy();
    createPlatform();
  }

  if (oneKey.justReleased()) {
    currentWeaponType = WEAPON_TYPE_SMG;
    weapon.fireLimit = BULLETS_SMG;
    weapon.shots = bulletsShotSMG;
  }
  else if (twoKey.justReleased()) {
    currentWeaponType = WEAPON_TYPE_RIFLE;
    weapon.fireLimit = BULLETS_RIFLE;
    weapon.shots = bulletsShotRifle;
  }
  else if (threeKey.justReleased()) {
    currentWeaponType = WEAPON_TYPE_SHOTGUN;
    weapon.fireLimit = BULLETS_SHOTGUN;
    weapon.shots = bulletsShotShotgun;
  }
  else if (fourKey.justReleased()) {
    currentWeaponType = WEAPON_TYPE_SNIPER;
    weapon.fireLimit = BULLETS_SNIPER;
    weapon.shots = bulletsShotSniper;
  }

  if (game.input.activePointer.isDown) {
    weapon.fire();

    if (currentWeaponType === WEAPON_TYPE_SMG) {
      bulletsShotSMG = weapon.shots;
    }
    else if (currentWeaponType === WEAPON_TYPE_RIFLE) {
      bulletsShotRifle = weapon.shots;
    }
    else if (currentWeaponType === WEAPON_TYPE_SHOTGUN) {
      bulletsShotShotgun = weapon.shots;
    }
    else if (currentWeaponType === WEAPON_TYPE_SNIPER) {
      bulletsShotSniper = weapon.shots;
    }
  }

  // Environment moves with camera
  sky.tilePosition.x = -game.camera.x;
  ground.tilePosition.x = -game.camera.x;

  // Weapon positioning
  weaponSprite.y = player.y + 20;
  weaponSprite.rotation = game.physics.arcade.angleToPointer(weaponSprite);
}

function applyCommonStructurePlacementProps (structure, type) {
  if (facing === 'left' || player.frame === FRAME_PLAYER_LEFT) {
    structure.scale.x = -.25;
  }
  else {
    if(type === 'wall') {
      structure.scale.x = -.25;
    }
    else {
      structure.scale.x = .25;
    }
  }

  structure.scale.y = .3;
  structure.tint = 0x000000;
}

function applyCommonStructureProps (structure, type) {
  if (facing === 'left' || player.frame === FRAME_PLAYER_LEFT) {
    structures.set(structure, 'scale.x', -.25);
  }
  else {
    if(type === 'wall') {
      structures.set(structure, 'scale.x', -.25);
    }
    else {
      structures.set(structure, 'scale.x', .25);
    }
  }

  structures.set(structure, 'scale.y', .3);
  structures.set(structure, 'body.immovable', true);
  structures.set(structure, 'body.allowGravity', false);
}

// Need because can't rotate Arcade bodies
function swapDimensions (sprite) {
  const tempH = sprite.height;

  sprite.height = sprite.width;
  sprite.width = tempH;
}

function createWallPlacement () {
  if (structurePlacement) {
    structurePlacement.destroy();
  }

  if (facing === 'left' || player.frame === FRAME_PLAYER_LEFT) {
    structurePlacement =  game.add.sprite(player.x - 150, player.y + 36, 'structure');
  }
  else {
    structurePlacement =  game.add.sprite(player.x + 150, player.y + 36, 'structure');
  }

  applyCommonStructurePlacementProps(structurePlacement, 'wall');
  swapDimensions(structurePlacement);
}

function createRampPlacement () {
  if (structurePlacement) {
    structurePlacement.destroy();
  }

  if (facing === 'left' || player.frame === FRAME_PLAYER_LEFT) {
    structurePlacement =  game.add.sprite(player.x - 50, player.y, 'structure');
  }
  else {
    structurePlacement =  game.add.sprite(player.x + 60, player.y, 'structure');
  }

  applyCommonStructurePlacementProps(structurePlacement, 'ramp');
}

function createPlatformPlacement () {
  if (structurePlacement) {
    structurePlacement.destroy();
  }

  if (facing === 'left' || player.frame === FRAME_PLAYER_LEFT) {
    structurePlacement =  game.add.sprite(player.x - 20, player.y + 36, 'structure');
  }
  else {
    structurePlacement =  game.add.sprite(player.x + 20, player.y + 36, 'structure');
  }

  applyCommonStructurePlacementProps(structurePlacement, 'platform');
}

function createWall () {
  if (facing === 'left' || player.frame === FRAME_PLAYER_LEFT) {
    newStructure =  structures.create(player.x - 150, player.y + 36, 'structure');
  }
  else {
    newStructure =  structures.create(player.x + 150, player.y + 36, 'structure');
  }

  applyCommonStructureProps(newStructure, 'wall');
  swapDimensions(newStructure);

  structuresRemaining--;
}

function createRamp () {
  if (facing === 'left' || player.frame === FRAME_PLAYER_LEFT) {
    newStructure =  structures.create(player.x - 50, player.y, 'structure');
  }
  else {
    newStructure =  structures.create(player.x + 60, player.y, 'structure');
  }

  applyCommonStructureProps(newStructure, 'ramp');

  structuresRemaining--;
}

function createPlatform () {
  if (facing === 'left' || player.frame === FRAME_PLAYER_LEFT) {
    newStructure =  structures.create(player.x - 20, player.y + 36, 'structure');
  }
  else {
    newStructure =  structures.create(player.x + 20, player.y + 36, 'structure');
  }

  applyCommonStructureProps(newStructure, 'platform');

  structuresRemaining--;
}

function toggleFullscreen () {
  if (game.scale.isFullScreen) {
    game.scale.stopFullScreen();
  }
  else {
    game.scale.startFullScreen(false);
  }
}

function render () {
  game.debug.text(`${currentWeaponType}: ${weapon.fireLimit - weapon.shots}/${weapon.fireLimit}`, 32, 32)
  game.debug.bodyInfo(player, 32, 96);
  game.debug.cameraInfo(game.camera, 32, 200);
  // game.debug.body(player); // Hitbox/Collision model
  // structures.forEachAlive(member => { // Hitbox/Collision model
  //   game.debug.body(member);
  // }, this);
  // weapon.debug();
}

