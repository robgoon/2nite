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
  game.load.atlas('tank', 'assets/tanks.png', 'assets/tanks.json');
  game.load.atlas('enemy', 'assets/enemy-tanks.png', 'assets/tanks.json');
  game.load.image('bullet', 'assets/bullet.png');
  game.load.image('sky', 'assets/sky.png');
  game.load.spritesheet('ground', 'assets/tiles-1.png', 100, 58.5, 1, 4);
  game.load.spritesheet('kaboom', 'assets/explosion.png', 64, 64, 23);
  game.load.spritesheet('player', 'assets/dude.png', 32, 48);
  game.load.spritesheet('weapons', 'assets/weapons.gif', 105, 67);
}

let sky;
let ground;

let tank;
let turret;

let enemies;
let enemyBullets;
let enemiesTotal = 0;
let enemiesAlive = 0;
let explosions;

let player;
let facing = 'right'

let weaponSprite;
let weapon;

let bullets;
let nextFire = 0;
let DAMAGE_SMG = 10;
let DAMAGE_RIFLE = 25;
let DAMAGE_SHOTGUN = 75;
let DAMAGE_SNIPER = 100;
let FIRERATE_SMG = 150;
let FIRERATE_RIFLE = 300;
let FIRERATE_SHOTGUN = 700;
let FIRERATE_SNIPER = 1200;

let currentSpeed = 0;
let cursors;
let altUpKey;
let altLeftKey;
let altRightKey;
let jumpKey;

const GRAVITY = 400;
const ROTATE_90_DEG_IN_RAD = Math.PI/2;

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


  //  The base of our tank
  tank = game.add.sprite(250, 450, 'tank', 'tank1');
  tank.anchor.setTo(0.5, 0.5);
  tank.animations.add('move', ['tank1', 'tank2', 'tank3', 'tank4', 'tank5', 'tank6'], 20, true);

  //  This will force it to decelerate and limit its speed
  game.physics.enable(tank, Phaser.Physics.ARCADE);
  tank.body.drag.set(0.2);
  tank.body.maxVelocity.setTo(400, 400);
  tank.body.collideWorldBounds = true;

  //  Finally the turret that we place on-top of the tank body
  turret = game.add.sprite(0, 0, 'tank', 'turret');
  turret.anchor.setTo(0.3, 0.5);


  // *** Default weapon ***
  weaponSprite = game.add.sprite(0, 0, 'weapons', 0);
  weaponSprite.anchor.setTo(0.3, 0.5);
  weaponSprite.scale.set(.6);
  weaponSprite.x = player.x + 25;

  // *** Bullets ***
  // Creates 30 bullets, using the 'bullet' graphic
  weapon = game.add.weapon(30, 'bullet');
  weapon.bullets.forEach(bullet => {
    bullet.scale.set(1.5)
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


  //  The enemies bullet group
  enemyBullets = game.add.group();
  enemyBullets.enableBody = true;
  enemyBullets.physicsBodyType = Phaser.Physics.ARCADE;
  enemyBullets.createMultiple(100, 'bullet');

  enemyBullets.setAll('anchor.x', 0.5);
  enemyBullets.setAll('anchor.y', 0.5);
  enemyBullets.setAll('outOfBoundsKill', true);
  enemyBullets.setAll('checkWorldBounds', true);

  //  Create some baddies to waste :)
  enemies = [];

  enemiesTotal = 0;
  enemiesAlive = 5;

  for (var i = 0; i < enemiesTotal; i++) {
    enemies.push(new EnemyTank(i, game, tank, enemyBullets));
  }

  //  Our bullet group
  bullets = game.add.group();
  bullets.enableBody = true;
  bullets.physicsBodyType = Phaser.Physics.ARCADE;
  bullets.createMultiple(30, 'bullet', 0, false);
  bullets.setAll('anchor.x', 0.5);
  bullets.setAll('anchor.y', 0.5);
  bullets.setAll('outOfBoundsKill', true);
  bullets.setAll('checkWorldBounds', true);

  //  Explosion pool
  explosions = game.add.group();

  for (var i = 0; i < 10; i++) {
    var explosionAnimation = explosions.create(0, 0, 'kaboom', [0], false);
    explosionAnimation.anchor.setTo(0.5, 0.5);
    explosionAnimation.animations.add('kaboom');
  }

  // *** Camera ***
  game.camera.follow(player);
  game.camera.deadzone = new Phaser.Rectangle(490, 150, 300, 300);

  // *** Keybinds ***
  cursors = game.input.keyboard.createCursorKeys();
  altUpKey = game.input.keyboard.addKey(Phaser.Keyboard.W);
  altLeftKey = game.input.keyboard.addKey(Phaser.Keyboard.A);
  altRightKey = game.input.keyboard.addKey(Phaser.Keyboard.D);
  jumpKey = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
}

function update () {
  game.physics.arcade.collide(player, [ground, tank]);
  game.physics.arcade.overlap(enemyBullets, tank, bulletHitPlayer, null, this);

  enemiesAlive = 0;

  for (var i = 0; i < enemies.length; i++) {
    if (enemies[i].alive) {
      enemiesAlive++;
      game.physics.arcade.collide(player, enemies[i].tank);
      game.physics.arcade.collide(tank, enemies[i].tank);
      game.physics.arcade.overlap(bullets, enemies[i].tank, bulletHitEnemy, null, this); // Like collide without the physics applied
      enemies[i].update();
    }
  }

  // Stops player when no movement keys are pressed
  player.body.velocity.x = 0;

  if (cursors.left.isDown || altLeftKey.isDown)
  {
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
  else if (cursors.right.isDown || altRightKey.isDown) {
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
        player.frame = 0;
      }
      else {
        player.frame = 5;
      }

      facing = 'idle';
    }
  }

  if ((cursors.up.isDown || altUpKey.isDown || jumpKey.isDown) && player.body.touching.down) {
    player.body.velocity.y = -250;
  }

  // Environment moves with camera
  sky.tilePosition.x = -game.camera.x;
  ground.tilePosition.x = -game.camera.x;

  turret.x = tank.x;
  turret.y = tank.y;

  turret.rotation = game.physics.arcade.angleToPointer(turret);

  // Weapon positioning
  weaponSprite.y = player.y + 20;
  weaponSprite.rotation = game.physics.arcade.angleToPointer(weaponSprite);

  if (game.input.activePointer.isDown) {
    //  Boom!
    weapon.fire();
    // fire();
  }
}

function bulletHitPlayer (tank, bullet) {
  bullet.kill();
}

function bulletHitEnemy (tank, bullet) {
  bullet.kill();

  var destroyed = enemies[tank.name].damage();

  if (destroyed) {
    var explosionAnimation = explosions.getFirstExists(false);
    explosionAnimation.reset(tank.x, tank.y);
    explosionAnimation.play('kaboom', 30, false, true);
  }
}

function fire () {
  if (game.time.now > nextFire && bullets.countDead() > 0) {
    nextFire = game.time.now + FIRERATE_RIFLE;

    var bullet = bullets.getFirstExists(false);

    bullet.reset(turret.x, turret.y);
    bullet.scale.setMagnitude(2);
    bullet.body.allowGravity = false;
    bullet.rotation = game.physics.arcade.moveToPointer(bullet, 400, game.input.activePointer, 0) + ROTATE_90_DEG_IN_RAD;
  }
}

function render () {
  game.debug.bodyInfo(player, 32, 96);
  game.debug.cameraInfo(game.camera, 32, 200);
  // game.debug.body(player); // Hitbox/Collision model
  game.debug.body(ground); // Hitbox/Collision model
  weapon.debug()
}

