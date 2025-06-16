import Phaser from 'phaser';

export default class Map1 extends Phaser.Scene {
  constructor() {
    super('Map1');
  }

  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private player!: Phaser.Physics.Arcade.Sprite;
  private jumplimit = 2;
  private canJump = true;


  preload() {
    this.load.tilemapTiledJSON('Map1', 'assets/maps/Map1.tmj');
    this.load.image('tiles_fore', 'assets/tilesets/pp_f.png');
    this.load.image('tiles_back', 'assets/tilesets/pp_b.png');
    this.load.image('key', 'assets/sprites/key.png');
    this.load.image('gem', 'assets/sprites/gem.png');
    this.load.atlas('player', 'assets/sprites/player.png', 'assets/sprites/player.json');
  }

  create() {
    this.cursors = this.input.keyboard!.createCursorKeys();
    
    const map = this.make.tilemap({ key: 'Map1' });
    const tileset_fore = map.addTilesetImage('pp_f', 'tiles_fore');
    const tileset_back = map.addTilesetImage('pp_b', 'tiles_back');
    if (!tileset_fore || !tileset_back) {
      throw new Error('Failed to load tileset');
    }
    const back = map.createLayer('back', tileset_back);
    const fore = map.createLayer('fore', tileset_fore);
    const objects = map.getObjectLayer('obj')!.objects;


    if (!fore || !back || !objects) {
      throw new Error('Failed to create fore layer');
    }
    fore.setCollisionByProperty({ collides: true });

    // player
    this.player = this.physics.add.sprite(100, 100, 'player', 'penguin_walk01.png').setScale(0.3);
    this.player.setCollideWorldBounds(true);
    this.player.setBounce(0.2);
    this.physics.add.collider(this.player, fore);

    // player animations
    this.anims.create({
      key: 'walk',
      frames: this.anims.generateFrameNames('player', {
        prefix: 'penguin_walk0',
        start: 1,
        end: 4,
        suffix: '.png'
      }),
      frameRate: 10,
      repeat: -1
    }); 

    this.anims.create({
        key: 'turn',
        frames: this.anims.generateFrameNames('player', {
            prefix: 'penguin_walk0',
            start: 4,
            end: 4,
            suffix: '.png'
          }),
        frameRate: 20,
        repeat: -1
    });

    this.anims.create({
      key: 'jump',
      frames: this.anims.generateFrameNames('player', {
        prefix: 'penguin_jump0',
        start: 2,
        end: 2,
        suffix: '.png'
      }),
      frameRate: 10,
      repeat: -1
    });

    this.anims.create({
      key: 'hurt',
      frames: [{ key: 'player', frame: 'penguin_hurt.png' }],
      frameRate: 10,
      repeat: -1
    });

    // OBJECTS
    const collectibles: Phaser.GameObjects.Sprite[] = [];

    objects.forEach(obj => {
      if (obj.type === 'collectible') {
        const properties = obj.properties || [];
        const subtype = properties.find((p: { name: string }) => p.name === 'subtype')?.value || 'gem';
        const effect = properties.find((p: { name: string }) => p.name === 'effect')?.value || 'score';
    
        const collectible = this.physics.add.staticSprite(obj.x ?? 0, obj.y ?? 0, subtype);
        collectible.setData('subtype', subtype);
        collectible.setData('effect', effect);
    
        this.physics.add.overlap(this.player, collectible, this.collectCollectible as any, undefined, this);
        collectibles.push(collectible);
      }
    });
    




    this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.cameras.main.startFollow(this.player);
  }

  update() {
    // player movement
    if (!this.cursors || !this.player) return;

    const speed = 160;
    const jumpSpeed = -330;

    // flip and move player
    if (this.cursors.left.isDown) {
        this.player.setVelocityX(-speed);
        this.player.setFlipX(true);
    }
    else if (this.cursors.right.isDown) {
        this.player.setVelocityX(speed);
        this.player.setFlipX(false);
    }
    else {
        this.player.setVelocityX(0);
    }

    // animate player
    if (!this.player.body!.blocked.down) {
        this.player.anims.play('jump', true);
    }
    else if (this.cursors.left.isDown || this.cursors.right.isDown) {
        this.player.anims.play('walk', true);
    }
    else {
        this.player.anims.play('turn', true);
    }

    if (this.player.body!.blocked.down) {
        this.jumplimit = 2;
    }

    if (this.cursors.up.isDown && (this.player.body!.blocked.down || this.jumplimit > 0) && this.canJump) {
        this.player.setVelocityY(jumpSpeed);
        this.jumplimit--;
        
        // Set double jump cooldown
        this.canJump = false;
        this.time.delayedCall(300, () => {
            this.canJump = true;
        });
    }
  }

  // CUSTOM FUNCTIONS

  // collectible
  collectCollectible(player: Phaser.Types.Physics.Arcade.GameObjectWithBody, item: Phaser.Types.Physics.Arcade.GameObjectWithBody) {
    const subtype = item.getData('subtype');
    const effect = item.getData('effect');
    this.tweens.add({
      targets: item,
      y: (item as Phaser.GameObjects.Sprite).y - 30,
      alpha: 0,
      duration: 400,
      ease: 'Power1',
    });
  
    // Custom logic by subtype or effect
    // switch (subtype) {
    //   case 'key':
    //     this.hasKey = true;
    //     break;
    //   case 'coin':
    //     this.score += 10;
    //     break;
    //   case 'powerup':
    //     if (effect === 'double_jump') this.canDoubleJump = true;
    //     break;
    // }
  
    // Optional sound or animation
    //this.sound.play('collect');
  }
  
  
    // Optional: trigger sound, update inventory, unlock gate, etc.
  
  
}
