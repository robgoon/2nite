console.clear();

var colors = window.colors;

var game = new Phaser.Game({
  // antialias:               true,
  // backgroundColor:         0x000000,
  // disableVisibilityChange: false,
  // enableDebug:             true,
  // height:                  600,
  // renderer:                Phaser.AUTO,
  // resolution:              1,
  // scaleMode:               Phaser.ScaleManager.NO_SCALE,
  // transparent:             false,
  // width:                   800,
  state: {

    init: function() {

    },

    preload: function() {
      // This is equivalent to <https://examples.phaser.io/assets/>.
      this.load.baseURL = 'https://cdn.jsdelivr.net/gh/samme/phaser-examples-assets@v2.0.0/assets/';
      this.load.crossOrigin = 'anonymous';
      this.load.image('dude', 'sprites/phaser-dude.png');
    },

    create: function() {
      var sprite = this.add.sprite(this.world.centerX, this.world.centerY, 'dude');
      // this.physics.enable(sprite);
    },

    update: function() {

    },

    render: function() {
      var debug = this.game.debug;
      debug.phaser(10, 580);
    },

    shutdown: function() {

    }

  }
});
