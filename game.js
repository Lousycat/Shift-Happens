var config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 300 },
            debug: true
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

var game = new Phaser.Game(config);

var level = 0;
var levelText;
var jumplimit = 2;
var canJump = true;  // Add jump cooldown flag

function preload () {
    this.load.image('sky', 'assets/sky.png');
    this.load.image('ground', 'assets/platform.png');
    this.load.image('buttonup', 'assets/buttonup.png');
    this.load.image('buttondown', 'assets/buttondown.png');
    this.load.image('stone', 'assets/stone.png');
    this.load.image('fragment', 'assets/fragment.png');
    this.load.spritesheet('dude', 'assets/dude.png', { frameWidth: 32, frameHeight: 48 });
    this.load.image('crate', 'assets/crate.png');

    this.load.audio('bgMusic', 'music/adventure1.mp3');
    this.load.audio('collectSound', 'music/coin.mp3');
}

function create () {
    cursors = this.input.keyboard.createCursorKeys();
    
    this.add.image(400, 300, 'sky');
    this.bgMusic = this.sound.add('bgMusic');
    this.collectSound = this.sound.add('collectSound');
    this.bgMusic.play();

    // platforms
    platforms = this.physics.add.staticGroup();
    platforms.create(400, 568, 'ground').setScale(2).refreshBody();
    platforms.create(600, 415, 'ground');
    platforms.create(50, 250, 'ground');
    platforms.create(750, 220, 'ground');

    // crates 
    crate = this.physics.add.sprite(230, 100, 'crate').setScale(0.2);
    crate.setBounce(0.2);
    crate.setCollideWorldBounds(true);
    crate.setFriction(1);  
    crate.setDrag(400);     
    crate.body.setGravityY(300);

    // button
    button = this.physics.add.staticSprite(270, 525, 'buttonup').setScale(0.08);
    button.body.setSize(30, 20);  
    button.body.setOffset(272, 170);  
    button.isPressed = false;  

    // stone
    stone = this.physics.add.staticGroup();
    stone.create(418, 450, 'stone').setScale(0.3).refreshBody();
    stone.create(418, 485, 'stone').setScale(0.3).refreshBody();
    stone.create(418, 520, 'stone').setScale(0.3).refreshBody();

    // Store original positions
    stone.children.iterate(function (child) {
        child.originalY = child.y;
    });

    // fragments
    fragments = this.physics.add.staticSprite(720, 480, 'fragment').setScale(1);
    fragments.body.setSize(30, 55);  
    fragments.body.setOffset(15, 10);  

    //Player
    player = this.physics.add.sprite(100, 300, 'dude');
    player.setBounce(0.2);
    player.setCollideWorldBounds(true);
    player.body.setGravityY(300);

    this.anims.create({
        key: 'left',
        frames: this.anims.generateFrameNumbers('dude', { start: 0, end: 3 }),
        frameRate: 10,
        repeat: -1
    });

    this.anims.create({
        key: 'turn',
        frames: [ { key: 'dude', frame: 4 } ],
        frameRate: 20
    });

    this.anims.create({
        key: 'right',
        frames: this.anims.generateFrameNumbers('dude', { start: 5, end: 8 }),
        frameRate: 10,
        repeat: -1
    });

    // level text
    levelText = this.add.text(16, 16, 'Level: 0', { fontSize: 48, fill: '#fff' });

    // collisions
    this.physics.add.collider(player, platforms);
    this.physics.add.collider(crate, platforms);
    this.physics.add.collider(crate, player);
    this.physics.add.collider(stone, platforms);
    this.physics.add.collider(stone, player);
    this.physics.add.collider(stone, crate);

    // Events:
    // button push
    this.physics.add.overlap(player, button, pushButton, null, this);
    this.physics.add.overlap(crate, button, pushButton, null, this);

    // collect fragments
    this.physics.add.overlap(player, fragments, collectFragment, null, this);
}

function update () {
    // player movement
    if (cursors.left.isDown) {
        player.setVelocityX(-160);
        player.anims.play('left', true);
    }
    else if (cursors.right.isDown) {
        player.setVelocityX(160);
        player.anims.play('right', true);
    }
    else {
        player.setVelocityX(0);
        player.anims.play('turn');
    }

    if (player.body.touching.down) {
        jumplimit = 2;
    }

    if (cursors.up.isDown && (player.body.touching.down || jumplimit > 0) && canJump) {
        player.setVelocityY(-330);
        jumplimit--;
        console.log(jumplimit);
        
        // Set double jump cooldown
        canJump = false;
        this.time.delayedCall(300, () => {
            canJump = true;
        });
    }

    // Check if button is still being pressed
    if (button.isPressed) {
        let playerOverlap = this.physics.overlap(player, button);
        let crateOverlap = this.physics.overlap(crate, button);
        
        if (!playerOverlap && !crateOverlap) {
            button.setTexture('buttonup');
            button.isPressed = false;
            // Move stones back up
            stone.children.iterate(function (child) {
                child.y = child.originalY;
                child.refreshBody();  // Update the physics body position
            });
        }
    }
}

function pushButton(player, button) {
    button.setTexture('buttondown');
    button.isPressed = true;
    // Move stones down
    stone.children.iterate(function (child) {
        child.y += 105;
        child.refreshBody();  // Update the physics body position
    });
}

function collectFragment(player, fragment) {
    fragment.disableBody(true, true);
    level += 1;
    levelText.setText('Level: ' + level);
    this.collectSound.play();
} 