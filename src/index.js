import PIXI from 'expose-loader?PIXI!phaser-ce/build/custom/pixi.js';
import p2 from 'expose-loader?p2!phaser-ce/build/custom/p2.js';
import Phaser from 'expose-loader?Phaser!phaser-ce/build/custom/phaser-split.js';

var game = new Phaser.Game(800, 600, Phaser.AUTO, '2nite', { preload: preload, create: create, update: update, render: render });

function preload () {

    game.load.atlas('tank', 'assets/tanks.png', 'assets/tanks.json');
    game.load.atlas('enemy', 'assets/enemy-tanks.png', 'assets/tanks.json');
    game.load.image('bullet', 'assets/bullet.png');
    game.load.image('earth', 'assets/sky.png');
    game.load.spritesheet('kaboom', 'assets/explosion.png', 64, 64, 23);
    game.load.spritesheet('player', 'assets/dude.png', 32, 48);

}

let land;

let shadow;
let tank;
let turret;

let enemies;
let enemyBullets;
let enemiesTotal = 0;
let enemiesAlive = 0;
let explosions;

let currentSpeed = 0;
let cursors;
let altUpKey;
let altLeftKey;
let altRightKey;
let jumpKey;

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

let player;
let facing = 'right'

const ROTATE_90_DEG_IN_RAD = Math.PI/2;

function create () {

    //  Resize our game world to be a 2000 x 2000 square
    game.world.setBounds(-800, -725, 1600, 800);
    game.physics.arcade.gravity.y = 400;

    //  Our tiled scrolling background
    land = game.add.tileSprite(0, 0, 800, 600, 'earth');
    land.fixedToCamera = true;

    // Player
    player = game.add.sprite(0, 0, 'player');
    game.physics.enable(player, Phaser.Physics.ARCADE);

    player.body.collideWorldBounds = true;
    player.body.setSize(26, 35, 3, 13); // Hitbox/Collision model

    player.animations.add('left', [0, 1, 2, 3], 10, true);
    player.animations.add('turn', [4], 20, true);
    player.animations.add('right', [5, 6, 7, 8], 10, true);

    //  The base of our tank
    tank = game.add.sprite(250, 0, 'tank', 'tank1');
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

    enemiesTotal = 5;
    enemiesAlive = 5;

    for (var i = 0; i < enemiesTotal; i++)
    {
        enemies.push(new EnemyTank(i, game, tank, enemyBullets));
    }

    //  A shadow below our tank
    shadow = game.add.sprite(0, 0, 'tank', 'shadow');
    shadow.anchor.setTo(0.5, 0.5);

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

    for (var i = 0; i < 10; i++)
    {
        var explosionAnimation = explosions.create(0, 0, 'kaboom', [0], false);
        explosionAnimation.anchor.setTo(0.5, 0.5);
        explosionAnimation.animations.add('kaboom');
    }

    tank.bringToTop();
    turret.bringToTop();

    game.camera.follow(player);
    game.camera.deadzone = new Phaser.Rectangle(150, 150, 500, 300);
    game.camera.focusOnXY(0, 0);

    cursors = game.input.keyboard.createCursorKeys();
    altUpKey = game.input.keyboard.addKey(Phaser.Keyboard.W);
    altLeftKey = game.input.keyboard.addKey(Phaser.Keyboard.A);
    altRightKey = game.input.keyboard.addKey(Phaser.Keyboard.D);
    jumpKey = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);

}

function update () {

    game.physics.arcade.overlap(enemyBullets, tank, bulletHitPlayer, null, this);

    enemiesAlive = 0;

    for (var i = 0; i < enemies.length; i++)
    {
        if (enemies[i].alive)
        {
            enemiesAlive++;
            game.physics.arcade.collide(tank, enemies[i].tank);
            game.physics.arcade.overlap(bullets, enemies[i].tank, bulletHitEnemy, null, this);
            enemies[i].update();
        }
    }

    if (cursors.left.isDown || altLeftKey.isDown)
    {
        tank.angle -= 4;
    }
    else if (cursors.right.isDown || altRightKey.isDown)
    {
        tank.angle += 4;
    }

    if (cursors.up.isDown || altUpKey.isDown || jumpKey.isDown)
    {
        //  The speed we'll travel at
        currentSpeed = 300;
    }
    else
    {
        if (currentSpeed > 0)
        {
            currentSpeed -= 4;
        }
    }

    if (currentSpeed > 0)
    {
        game.physics.arcade.velocityFromRotation(tank.rotation, currentSpeed, tank.body.velocity);
    }

    land.tilePosition.x = -game.camera.x;
    land.tilePosition.y = -game.camera.y;

    //  Position all the parts and align rotations
    shadow.x = tank.x;
    shadow.y = tank.y;
    shadow.rotation = tank.rotation;

    turret.x = tank.x;
    turret.y = tank.y;

    turret.rotation = game.physics.arcade.angleToPointer(turret);

    if (game.input.activePointer.isDown)
    {
        //  Boom!
        fire();
    }

}

function bulletHitPlayer (tank, bullet) {

    bullet.kill();

}

function bulletHitEnemy (tank, bullet) {

    bullet.kill();

    var destroyed = enemies[tank.name].damage();

    if (destroyed)
    {
        var explosionAnimation = explosions.getFirstExists(false);
        explosionAnimation.reset(tank.x, tank.y);
        explosionAnimation.play('kaboom', 30, false, true);
    }

}

function fire () {

    if (game.time.now > nextFire && bullets.countDead() > 0)
    {
        nextFire = game.time.now + FIRERATE_RIFLE;

        var bullet = bullets.getFirstExists(false);

        bullet.reset(turret.x, turret.y);
        bullet.scale.setMagnitude(2);
        bullet.body.allowGravity = false;
        bullet.rotation = game.physics.arcade.moveToPointer(bullet, 400, game.input.activePointer, 0) + ROTATE_90_DEG_IN_RAD;
    }

}

function render () {

    game.debug.text('Active Bullets: ' + bullets.countLiving() + ' / ' + bullets.length, 32, 64);
    game.debug.text('Enemies: ' + enemiesAlive + ' / ' + enemiesTotal, 32, 32);
    // game.debug.bodyInfo(tank, 32, 96);
    // game.debug.body(tank);
    game.debug.bodyInfo(player, 32, 96);
    game.debug.body(player);
}

const EnemyTank = function (index, game, player, bullets) {

  var x = game.world.randomX;
  var y = game.world.randomY;

  this.game = game;
  this.health = 3;
  this.player = player;
  this.bullets = bullets;
  this.fireRate = 1000;
  this.nextFire = 0;
  this.alive = true;

  this.shadow = game.add.sprite(x, y, 'enemy', 'shadow');
  this.tank = game.add.sprite(x, y, 'enemy', 'tank1');
  this.turret = game.add.sprite(x, y, 'enemy', 'turret');

  this.shadow.anchor.set(0.5);
  this.tank.anchor.set(0.5);
  this.turret.anchor.set(0.3, 0.5);

  this.tank.name = index.toString();
  game.physics.enable(this.tank, Phaser.Physics.ARCADE);
  this.tank.body.immovable = false;
  this.tank.body.collideWorldBounds = true;
  this.tank.body.bounce.setTo(1, 1);

  this.tank.angle = game.rnd.angle();

  game.physics.arcade.velocityFromRotation(this.tank.rotation, 100, this.tank.body.velocity);

};

EnemyTank.prototype.damage = function() {

  this.health -= 1;

  if (this.health <= 0)
  {
      this.alive = false;

      this.shadow.kill();
      this.tank.kill();
      this.turret.kill();

      return true;
  }

  return false;

}

EnemyTank.prototype.update = function() {

  this.shadow.x = this.tank.x;
  this.shadow.y = this.tank.y;
  this.shadow.rotation = this.tank.rotation;

  this.turret.x = this.tank.x;
  this.turret.y = this.tank.y;
  this.turret.rotation = this.game.physics.arcade.angleBetween(this.tank, this.player);

  if (this.game.physics.arcade.distanceBetween(this.tank, this.player) < 300)
  {
      if (this.game.time.now > this.nextFire && this.bullets.countDead() > 0)
      {
          this.nextFire = this.game.time.now + this.fireRate;

          var bullet = this.bullets.getFirstDead();

          bullet.reset(this.turret.x, this.turret.y);

          bullet.rotation = this.game.physics.arcade.moveToObject(bullet, this.player, 500);
      }
  }

};
