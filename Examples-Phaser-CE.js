// Ship


var game = new Phaser.Game(800, 600, Phaser.CANVAS, 'phaser-example', { preload: preload, create: create, update: update, render: render });

function preload() {

    game.load.image('bullet', 'assets/sprites/shmup-bullet.png');
    game.load.image('ship', 'assets/sprites/thrust_ship.png');

}

var sprite;
var weapon;
var cursors;
var fireButton;

function create() {

    //  Creates 30 bullets, using the 'bullet' graphic
    weapon = game.add.weapon(30, 'bullet');

    //  The bullet will be automatically killed when it leaves the world bounds
    weapon.bulletKillType = Phaser.Weapon.KILL_WORLD_BOUNDS;

    //  The speed at which the bullet is fired
    weapon.bulletSpeed = 600;

    //  Speed-up the rate of fire, allowing them to shoot 1 bullet every 60ms
    weapon.fireRate = 100;

    sprite = this.add.sprite(400, 300, 'ship');

    sprite.anchor.set(0.5);

    game.physics.arcade.enable(sprite);

    sprite.body.drag.set(70);
    sprite.body.maxVelocity.set(200);

    //  Tell the Weapon to track the 'player' Sprite
    //  With no offsets from the position
    //  But the 'true' argument tells the weapon to track sprite rotation
    weapon.trackSprite(sprite, 0, 0, true);

    cursors = this.input.keyboard.createCursorKeys();

    fireButton = this.input.keyboard.addKey(Phaser.KeyCode.SPACEBAR);

}

function update() {

    if (cursors.up.isDown)
    {
        game.physics.arcade.accelerationFromRotation(sprite.rotation, 300, sprite.body.acceleration);
    }
    else
    {
        sprite.body.acceleration.set(0);
    }

    if (cursors.left.isDown)
    {
        sprite.body.angularVelocity = -300;
    }
    else if (cursors.right.isDown)
    {
        sprite.body.angularVelocity = 300;
    }
    else
    {
        sprite.body.angularVelocity = 0;
    }

    if (fireButton.isDown)
    {
        weapon.fire();
    }

    game.world.wrap(sprite, 16);

}

function render() {

    weapon.debug();

}


// Tanks


EnemyTank = function (index, game, player, bullets) {

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

var game = new Phaser.Game(800, 600, Phaser.AUTO, 'phaser-example', { preload: preload, create: create, update: update, render: render });

function preload () {

    game.load.atlas('tank', 'assets/games/tanks/tanks.png', 'assets/games/tanks/tanks.json');
    game.load.atlas('enemy', 'assets/games/tanks/enemy-tanks.png', 'assets/games/tanks/tanks.json');
    game.load.image('logo', 'assets/games/tanks/logo.png');
    game.load.image('bullet', 'assets/games/tanks/bullet.png');
    game.load.image('earth', 'assets/games/tanks/scorched_earth.png');
    game.load.spritesheet('kaboom', 'assets/games/tanks/explosion.png', 64, 64, 23);

}

var land;

var shadow;
var tank;
var turret;

var enemies;
var enemyBullets;
var enemiesTotal = 0;
var enemiesAlive = 0;
var explosions;

var logo;

var currentSpeed = 0;
var cursors;

var bullets;
var fireRate = 100;
var nextFire = 0;

function create () {

    //  Resize our game world to be a 2000 x 2000 square
    game.world.setBounds(-1000, -1000, 2000, 2000);

    //  Our tiled scrolling background
    land = game.add.tileSprite(0, 0, 800, 600, 'earth');
    land.fixedToCamera = true;

    //  The base of our tank
    tank = game.add.sprite(0, 0, 'tank', 'tank1');
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

    enemiesTotal = 20;
    enemiesAlive = 20;

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

    logo = game.add.sprite(0, 200, 'logo');
    logo.fixedToCamera = true;

    game.input.onDown.add(removeLogo, this);

    game.camera.follow(tank);
    game.camera.deadzone = new Phaser.Rectangle(150, 150, 500, 300);
    game.camera.focusOnXY(0, 0);

    cursors = game.input.keyboard.createCursorKeys();

}

function removeLogo () {

    game.input.onDown.remove(removeLogo, this);
    logo.kill();

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

    if (cursors.left.isDown)
    {
        tank.angle -= 4;
    }
    else if (cursors.right.isDown)
    {
        tank.angle += 4;
    }

    if (cursors.up.isDown)
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
        nextFire = game.time.now + fireRate;

        var bullet = bullets.getFirstExists(false);

        bullet.reset(turret.x, turret.y);

        bullet.rotation = game.physics.arcade.moveToPointer(bullet, 1000, game.input.activePointer, 500);
    }

}

function render () {

    // game.debug.text('Active Bullets: ' + bullets.countLiving() + ' / ' + bullets.length, 32, 32);
    game.debug.text('Enemies: ' + enemiesAlive + ' / ' + enemiesTotal, 32, 32);

}


// Dude



var game = new Phaser.Game(800, 600, Phaser.CANVAS, 'phaser-example', { preload: preload, create: create, update: update, render: render });

function preload() {

    game.load.tilemap('level1', 'assets/games/starstruck/level1.json', null, Phaser.Tilemap.TILED_JSON);
    game.load.image('tiles-1', 'assets/games/starstruck/tiles-1.png');
    game.load.spritesheet('dude', 'assets/games/starstruck/dude.png', 32, 48);
    game.load.spritesheet('droid', 'assets/games/starstruck/droid.png', 32, 32);
    game.load.image('starSmall', 'assets/games/starstruck/star.png');
    game.load.image('starBig', 'assets/games/starstruck/star2.png');
    game.load.image('background', 'assets/games/starstruck/background2.png');

}

var map;
var tileset;
var layer;
var player;
var facing = 'left';
var jumpTimer = 0;
var cursors;
var jumpButton;
var bg;

function create() {

    game.physics.startSystem(Phaser.Physics.ARCADE);

    game.stage.backgroundColor = '#000000';

    bg = game.add.tileSprite(0, 0, 800, 600, 'background');
    bg.fixedToCamera = true;

    map = game.add.tilemap('level1');

    map.addTilesetImage('tiles-1');

    map.setCollisionByExclusion([ 13, 14, 15, 16, 46, 47, 48, 49, 50, 51 ]);

    layer = map.createLayer('Tile Layer 1');

    //  Un-comment this on to see the collision tiles
    // layer.debug = true;

    layer.resizeWorld();

    game.physics.arcade.gravity.y = 250;

    player = game.add.sprite(32, 32, 'dude');
    game.physics.enable(player, Phaser.Physics.ARCADE);

    player.body.bounce.y = 0.2;
    player.body.collideWorldBounds = true;
    player.body.setSize(20, 32, 5, 16);

    player.animations.add('left', [0, 1, 2, 3], 10, true);
    player.animations.add('turn', [4], 20, true);
    player.animations.add('right', [5, 6, 7, 8], 10, true);

    game.camera.follow(player);

    cursors = game.input.keyboard.createCursorKeys();
    jumpButton = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);

}

function update() {

    game.physics.arcade.collide(player, layer);

    player.body.velocity.x = 0;

    if (cursors.left.isDown)
    {
        player.body.velocity.x = -150;

        if (facing != 'left')
        {
            player.animations.play('left');
            facing = 'left';
        }
    }
    else if (cursors.right.isDown)
    {
        player.body.velocity.x = 150;

        if (facing != 'right')
        {
            player.animations.play('right');
            facing = 'right';
        }
    }
    else
    {
        if (facing != 'idle')
        {
            player.animations.stop();

            if (facing == 'left')
            {
                player.frame = 0;
            }
            else
            {
                player.frame = 5;
            }

            facing = 'idle';
        }
    }

    if (jumpButton.isDown && player.body.onFloor() && game.time.now > jumpTimer)
    {
        player.body.velocity.y = -250;
        jumpTimer = game.time.now + 750;
    }

}

function render () {

    // game.debug.text(game.time.physicsElapsed, 32, 32);
    // game.debug.body(player);
    // game.debug.bodyInfo(player, 16, 24);

}
