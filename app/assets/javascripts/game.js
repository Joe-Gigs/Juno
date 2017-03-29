var game = new Phaser.Game(1024, 600, Phaser.AUTO, 'Juno', {
    preload: preload,
    create: create,
    update: update,
    render: render
});

var gameState = function(game) {
    var kittySprite; //player
    var redVacuum; // standard enemy
    var vacuumTimer;
    var starfield; // background
    var cursors; // movement keys
    var bullets;
    var fireButton;
    var kittyTrail; //trail object, needs work***
    var explosions;
    var player_health; // output for health
    var gameOver;
    var scoreText;
    var highScoreText;
    var blood;
    var planetfield;
    var catnip;
    var enemy_die; // audio
    var bird; 
    var birdTimer;
    // var bank;
    var music; // chiptune theme
    var powerUpSound;


};

var bulletTime = 0;
var showDebug = true;
var score = 0;
var highscore = localStorage.getItem("highscore");


function preload() {
    game.load.spritesheet('kitty', 'assets/kitty_sheet3', 190, 140);
    game.load.spritesheet('explosion', 'assets/explosion.png', 190, 140);
    game.load.spritesheet('blood', 'assets/blood_hit.png', 190, 140);
    game.load.spritesheet('bird', 'assets/bird2.png', 210, 86);

    game.load.image('space', 'assets/space.png');
    game.load.image('planet', 'assets/planet.png');
    game.load.image('bullet', 'assets/lightning_resize.png');
    game.load.image('fire', 'assets/fire.png');
    game.load.image('vacuum', 'assets/vacuum_resize.png');
    game.load.image('catnip', 'assets/catnip.png');

    game.load.audio('theme', 'assets/theme.wav');
    game.load.audio('boom_sound', 'assets/explosion.mp3');
    game.load.audio('powerup_sound', 'assets/powerup.wav');

    game.time.advancedTiming = true; //for fps

}

function create() {
    initGraphics();
}

function update() {
    starfield.tilePosition.x -= 0.5;
    planetfield.tilePosition.x -= 5;
    cursors = game.input.keyboard.createCursorKeys();


    kittySprite.body.velocity.setTo(0, 0);
    //move the kitty
    if (cursors.down.isDown) {
        kittySprite.body.velocity.y = 300;
    } else if (cursors.up.isDown) {
        kittySprite.body.velocity.y = -400;
        kittySprite.animations.play('still_right', 2);
    } else if (cursors.right.isDown) {
        kittySprite.body.velocity.x = 300;
        kittySprite.animations.play('fly_right', 2); // flying motion when going right
        kittyTrail.emitParticle();
    } else if (cursors.left.isDown) {
        kittySprite.body.velocity.x = -300;
        kittySprite.animations.play('fly_left', 2);

    }

    // keeps the kitty in bounds vertically
    if (kittySprite.y > game.height - 54) {
        kittySprite.y = game.height - 54;
    } else if (kittySprite.y < 70) {
        kittySprite.y = 70;
    }

    // keeps the kitty in bounds horizontally
    if (kittySprite.x > game.width - 80) {
        kittySprite.x = game.width - 80;
    } else if (kittySprite.x < 60) {
        kittySprite.x = 60;
    }

    //fires a bolt
    if (kittySprite.alive && (fireButton.isDown || game.input.activePointer.isDown)) {
        fire();
    }

    game.physics.arcade.collide(bullets, redVacuum, shoot_red_vaccuum, null, this);
    game.physics.arcade.overlap(kittySprite, redVacuum, kitty_enemy_collide, null, this);
    game.physics.arcade.overlap(kittySprite, catnip, kitty_gets_high, processHandler, this);


    game.physics.arcade.overlap(kittySprite, bird, kitty_enemy_collide, null, this);
    game.physics.arcade.overlap(bullets, bird, shoot_bird, null, this);


    //Game Over
    if (!kittySprite.alive && gameOver.visible === false) {
        gameOver.visible = true;
        gameOver.alpha = 0;
        var fadeInGameOver = game.add.tween(gameOver);
        fadeInGameOver.to({
            alpha: 1
        }, 1000, Phaser.Easing.Quintic.Out);
        fadeInGameOver.onComplete.add(setResetHandlers);
        fadeInGameOver.start();

        function setResetHandlers() {
            //   "click to restart" 
            tapRestart = game.input.onTap.addOnce(_restart, this);
            spaceRestart = fireButton.onDown.addOnce(_restart, this);

            function _restart() {
                tapRestart.detach();
                spaceRestart.detach();
                restart(kittySprite);
            }
        }
    }
    if (game.physics.arcade.collide(bullets, redVacuum)) {
        if (score > localStorage.getItem("highscore")) {
            localStorage.setItem("highscore", score);

        }
    }

    if (game.physics.arcade.overlap(kittySprite, redVacuum)) {
        if (score > localStorage.getItem("highscore")) {
            localStorage.setItem("highscore", score);

        }
    }

    highScoreText.content = "High Score: " + localStorage.getItem("highscore");
}

//sets graphical assets
function initGraphics() {

    //set physics
    game.physics.startSystem(Phaser.Physics.ARCADE);


    starfield = game.add.tileSprite(0, 0, 1024, 600, 'space');
    planetfield = game.add.tileSprite(0, 490, 1024, 210, 'planet');

    game.stage.backgroundColor = "#4488AA"; // for testing 

    //kitty sprite added to game field
    kittySprite = game.add.sprite(40, 300, 'kitty');
    kittySprite.anchor.set(0.5, 0.5);
    kittySprite.health = 100;
    kittySprite.events.onKilled.add(function() {
        kittyTrail.kill();
    });

    //bad guys
    redVacuum = game.add.group();
    redVacuum.enableBody = true;
    redVacuum.physicsBodyType = Phaser.Physics.ARCADE;
    redVacuum.createMultiple(3, 'vacuum');
    redVacuum.setAll('anchor.x', 0.5);
    redVacuum.setAll('anchor.y', 0.5);
    redVacuum.setAll('scale.x', 0.5);
    redVacuum.setAll('scale.y', 0.5);
    redVacuum.setAll('angle', 360);
    redVacuum.setAll('outOfBoundsKill', true);
    redVacuum.setAll('checkWorldBounds', true);
    redVacuum.scale.setTo(1.9, 1.9);

    //time for vaccuum
    game.time.events.add(1000, launchRedVacuum);

    bird = game.add.group();
    bird.enableBody = true;
    bird.physicsBodyType = Phaser.Physics.ARCADE;
    bird.createMultiple(1, 'bird');
    bird.setAll('anchor.x', 0.5);
    bird.setAll('anchor.y', 0.5);
    bird.setAll('angle', 10);
    bird.setAll('scale.x', 1.0);
    bird.setAll('scale.y', 1.0);
    bird.setAll('outOfBoundsKill', true);
    bird.setAll('checkWorldBounds', true);
    bird.callAll('animations.add', 'animations', 'attack', [0, 1], 3, true);
    bird.callAll('play', null, 'attack');
    bird.forEach(function(enemy) {
        kittySprite.damage(3);
    });

    game.time.events.add(1000, launchBird);


    catnip = game.add.group();
    catnip.enableBody = true;
    catnip.physicsBodyType = Phaser.Physics.ARCADE;
    catnip.createMultiple(1, 'catnip');
    catnip.setAll('anchor.x', 0.5);
    catnip.setAll('anchor.y', 0.5);
    catnip.setAll('scale.x', 0.4);
    catnip.setAll('scale.y', 0.4);
    catnip.setAll('outOfBoundsKill', true);
    catnip.setAll('checkWorldBounds', true);

    launchcatnip();


    // freaking laser beams
    bullets = game.add.group();
    bullets.enableBody = true;
    bullets.physicsBodyType = Phaser.Physics.ARCADE;
    bullets.createMultiple(10, 'bullet');
    bullets.setAll('anchor.x', 0.5);
    bullets.setAll('anchor.y', 1);
    bullets.setAll('outOfBoundsKill', true);
    bullets.setAll('checkWorldBounds', true);

    fireButton = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);


    kittyTrail = game.add.emitter(0, 0, 10);
    kittyTrail.width = 10;
    kittyTrail.makeParticles('fire');
    kittySprite.addChild(kittyTrail);
    kittyTrail.y = 60;
    kittyTrail.x = -80;
    kittyTrail.lifespan = 250;
    kittyTrail.maxParticleSpeed = new Phaser.Point(-100, 5);
    kittyTrail.minParticleSpeed = new Phaser.Point(-20, -50);
    kittyTrail.setRotation(50, -50);
    kittyTrail.setAlpha(0.1, 0.1);


    //explosions!
    explosions = game.add.group();
    explosions.enableBody = true;
    explosions.physicsBodyType = Phaser.Physics.ARCADE;
    explosions.createMultiple(30, 'explosion');
    explosions.setAll('anchor.x', 0.5);
    explosions.setAll('anchor.y', 0.5);
    explosions.forEach(function(explosion) {
        explosion.animations.add('explosion');
    });

    //blood
    blood = game.add.group();
    blood.enableBody = true;
    blood.physicsBodyType = Phaser.Physics.ARCADE;
    blood.createMultiple(30, 'blood');
    blood.setAll('anchor.x', 0.5);
    blood.setAll('anchor.y', 0.5);
    blood.forEach(function(bloody) {
        bloody.animations.add('blood');
    });

    //audio
    enemy_die = game.add.audio('boom_sound');
    enemy_die.volume = 0.5;

    music = game.add.audio('theme');
    music.loop = true;
    music.play();

    powerUpSound = game.add.audio('powerup_sound');
    powerUpSound.volume = 0.3;


    //health information
    player_health = game.add.text(game.world.width - 150, 10, 'Health: ' + kittySprite.health + '%', {
        font: '20px Arial',
        fill: '#fff'
    });
    player_health.render = function() {
        player_health.text = 'Health: ' + Math.max(kittySprite.health, 0) + '%';
    };

    //Game Over info
    gameOver = game.add.text(35, 40, "Game Over!(Hit Space to play again!)", {
        font: '40px Arial',
        fill: '#fff'
    });

    gameOver.visible = false;

    //sets global gravity
    game.physics.arcade.enable(kittySprite, redVacuum, bullets, catnip);
    game.physics.arcade.gravity.y = 60;

    // set animations
    kittySprite.animations.add('still_right', [0]);
    kittySprite.animations.add('still_left', [1]);
    kittySprite.animations.add('power_up_right', [2]);
    kittySprite.animations.add('power_up_left', [3]);
    kittySprite.animations.add('fly_right', [4]);
    kittySprite.animations.add('fly_left', [5]);

    kittySprite.body.setSize(120, 120);

    //  Score
    scoreText = game.add.text(10, 10, '', {
        font: '20px Arial',
        fill: '#fff'
    });
    scoreText.render = function() {
        scoreText.text = 'Score: ' + score;
    };
    scoreText.render();

    //High Score
    highScoreText = game.add.text(10, 30, '', {
        font: '20px Arial',
        fill: '#fff'
    });
    highScoreText.render = function() {
        highScoreText.text = 'High Score: ' + highscore;
    };
    highScoreText.render();

}

function debugToggle() {

    showDebug = (showDebug) ? false : true;

    if (!showDebug) {
        game.debug.reset
    }
}

function render() {

    if (showDebug) {
        // game.debug.bodyInfo(kittySprite, 32, 32);
        // game.debug.body(kittySprite);
        game.debug.text(game.time.fps || '--', 200, 14, "#00ff00"); // for fps

    }
}

function fire() {

    if (game.time.now > bulletTime) {
        var bullet = bullets.getFirstExists(false);

        if (bullet) {

            bullet.reset(kittySprite.x, kittySprite.y);

            if (cursors.right.isDown) {

                bullet.body.velocity.x = 800;
            } else if (cursors.left.isDown) {

                bullet.body.velocity.x = -800;
            } else {
                bullet.body.velocity.x = 800;
            }

            bulletTime = game.time.now + 400;
        }
    }
}

function launchRedVacuum() {
    var MIN_ENEMY_SPACING = 300;
    var MAX_ENEMY_SPACING = 1500;
    var enemy = redVacuum.getFirstExists(false);
    if (enemy) {
        enemy.reset(game.rnd.integerInRange(50, game.width), -50);
        enemy.body.velocity.x = game.rnd.integerInRange(150, -300);
        enemy.body.velocity.y = 200
        enemy.body.drag.y = -10;
        enemy.body.drag.x = 10;
    }
  vacuumTimer = game.time.events.add(game.rnd.integerInRange(MIN_ENEMY_SPACING, MAX_ENEMY_SPACING), launchRedVacuum);
}

function launchBird() {
    var start = game.rnd.integerInRange(1015, game.width, 300);
    var horizontalSpeed = -180
    var numEnemiesWave = 1;
    var timeBetweenWaves = 5000;
    var horizontalSpacing = 50;

    for (i = 0; i < numEnemiesWave; i++) {
        var enemy = bird.getFirstExists(false);
        if (enemy) {
            enemy.start = start;
            enemy.reset(game.width, -horizontalSpacing * i);
            // enemy.body.velocity.y = 100
            enemy.body.drag.y = -10;
            enemy.body.drag.x = 10;
            enemy.body.velocity.x = horizontalSpeed;
        }
        birdTimer = game.time.events.add(timeBetweenWaves, launchBird);

    }
}

function launchcatnip() {
    var min_catnip_spacing = 300;
    var max_catnip_spacing = 1500;

    var kittydrugs = catnip.getFirstExists(false);
    if (kittydrugs) {
        kittydrugs.reset(game.rnd.integerInRange(20, game.width), -20);
        // kittydrugs.body.velocity.x = game.rnd.integerInRange(150, -300);
        kittydrugs.body.velocity.y = 200;
        kittydrugs.body.drag.y = -10;
        kittydrugs.body.drag.x = 10;
    }
    game.time.events.add(game.rnd.integerInRange(min_catnip_spacing, max_catnip_spacing), launchcatnip);

}

function shoot_red_vaccuum(bullets, redVacuum) {
    var explosion = explosions.getFirstExists(false);
    explosion.reset(redVacuum.body.x + redVacuum.body.halfWidth, redVacuum.body.y + redVacuum.body.halfWidth);
    explosion.body.velocity.y = redVacuum.body.velocity.y;
    explosion.alpha = 0.8;
    explosion.play('explosion', 30, false, true);
    enemy_die.play();
    redVacuum.kill();
    bullets.kill();

    score += 20;
    scoreText.render();
    highScoreText.render();

}

function shoot_bird(bullets, bird) {
    var explosion = explosions.getFirstExists(false);
    explosion.reset(bird.body.x + bird.body.halfWidth, bird.body.y + bird.body.halfWidth);
    explosion.body.velocity.y = bird.body.velocity.y;
    explosion.alpha = 0.8;
    explosion.play('explosion', 30, false, true);
    enemy_die.play();
    bird.kill();
    bullets.kill();

    score += 40;
    scoreText.render();
    highScoreText.render();

}

function kitty_enemy_collide(kittySprite, enemy) {

    var bloodHit = blood.getFirstExists(false);
    bloodHit.reset(kittySprite.body.x + kittySprite.body.halfWidth, kittySprite.body.y);
    bloodHit.body.velocity.y = kittySprite.body.velocity.y;
    bloodHit.alpha = 0.5;
    bloodHit.play('blood', 30, false, true);
    kittySprite.damage(1);
    player_health.render();
}


function processHandler(kittySprite, catnip) {

    return true;

}


function kitty_gets_high(kittySprite, catnip) {

    powerUpSound.play();
    kittySprite.health += 10;
    player_health.render();
    catnip.kill();
}

function restart(kittySprite) {

    //restart enemies
    redVacuum.callAll("kill");
    game.time.events.remove(vacuumTimer);
    game.time.events.add(1000, launchRedVacuum);

    bird.callAll('kill');
    game.time.events.remove(birdTimer);


    //  Revive the player
    highScoreText.render();
    kittySprite.revive();
    kittyTrail.revive();
    kittySprite.health = 100;
    player_health.render();
    score = 0;
    scoreText.render();

    //  Hide the text
    gameOver.visible = false;

}