var Board = require('./Board.js');
var Hero = require('./Hero.js');
var DiamondMine = require('./DiamondMine.js');
var Unoccupied = require('./Unoccupied.js');
var Impassable = require('./Impassable.js');
var HealthWell = require('./HealthWell.js');

var DIAMOND_MINE_CAPTURE_DAMAGE = 20;
var HERO_ATTACK_DAMAGE = 30;
var HEALTH_WELL_HEAL_AMOUNT = 40;

var Game = function() {
  this.board = new Board(5);
  this.heroes = [];
  this.diamondMines = [];
  this.turn = 1;
  this.hasStarted = false;
};

//Adds a new hero to the board
//but ONLY if the game has not yet
//started
Game.prototype.addHero = function(distanceFromTop, distanceFromLeft) {
  if (this.hasStarted) {
    throw new Error('Cannot add heroes after the game has started!')
  }

  //Creates new hero object
  var hero = new Hero(distanceFromTop, distanceFromLeft);

  //Saves hero id
  hero.id = this.heroes.length;

  //Puts hero on board
  this.board.tiles[distanceFromTop][distanceFromLeft] = hero;

  //Adds hero to game data structure
  this.heroes.push(hero);
};

//Adds a diamond mine to the board
Game.prototype.addDiamondMine = function(distanceFromTop, distanceFromLeft) {
  if (this.hasStarted) {
    throw new Error('Cannot add diamond mines after the game has started!')
  }

  //Creates new diamond mine object
  var diamondMine = new DiamondMine(distanceFromTop, distanceFromLeft);

  //Saves diamondMines id
  diamondMine.id = this.diamondMines.length;

  //Puts diamondMine on board
  this.board.tiles[distanceFromTop][distanceFromLeft] = diamondMine;

  //Adds diamondMine to game data structure
  this.diamondMines.push(diamondMine);
};

//Return a reference to the hero whose turn it is
Game.prototype.activeHero = function() {
  var numHeroes = this.heroes.length;
  var activeIndex = this.turn % numHeroes;
  return this.heroes[activeIndex];
};

//Resolves the hero's turn:
//1) The active hero earns diamonds from each mine they own
//   at the start of their turn
//2) Moves the active hero in the direction specified
Game.prototype.handleHeroTurn = function(direction) {
  var hero = this.activeHero();

  //Does nothing if hero is not alive
  if (hero.dead) {
    return;
  }

  //Gives the hero diamonds for each owned mine
  this._handleHeroEarnings(hero);

  //Attempts to move the hero in the direction indicated
  this._handleHeroMove(hero, direction);

  //If hero died during their move phase...
  if (hero.dead) {
    //Remove hero from board
    this.heroDied(hero);

  //If hero is still alive after moving...
  } else {
    //Resolves all damage given and healing received at the
    //end of the hero's turn
    this._resolveHeroAttacks(hero);
  }
  
  this.turn++;
};

//Resolve diamond mine earnings
Game.prototype._handleHeroEarnings = function(hero) {
  hero.diamondsEarned += hero.minesOwned.length;
};

//Attempt to move hero in the direction indicated
Game.prototype._handleHeroMove = function(hero, direction) {
  //Gets the tile at the location that the hero wants to go to
  var tile = this.board.getTileNearby(hero.distanceFromTop, hero.distanceFromLeft, direction);

  //If tile is not on the board (invalid coordinates), don't move
  if (tile === false) {
    return;

  //If tile is occupied, move into that tile
  } else if (tile.type === 'Unoccupied') {
    //Make the soon-to-be vacated tile "unoccupied"
    this.board.tiles[hero.distanceFromTop][hero.distanceFromLeft] = 
        new Unoccupied(hero.distanceFromTop, hero.distanceFromLeft);

    //Update hero location (in hero)
    hero.distanceFromTop = tile.distanceFromTop;
    hero.distanceFromLeft = tile.distanceFromLeft;

    //Update hero location (on board)
    this.board.tiles[hero.distanceFromTop][hero.distanceFromLeft] = hero;
  
  //If tile is a diamond mine, the mine is captured, but the hero stays put
  } else if (tile.type === "DiamondMine") {
    //Hero attempts to capture mine
    hero.captureMine(tile, DIAMOND_MINE_CAPTURE_DAMAGE);

    //If capturing the mine takes the hero to 0 HP, he dies
    if (hero.dead) {
      this.heroDied(hero);
      return;

    //If he survives, he is now the owner of the mine
    } else {
      tile.owner = hero;
    }
  //Running into a health well will heal a certain amount of damage
  } else if (tile.type === "HealthWell") {
    hero.healDamage(HEALTH_WELL_HEAL_AMOUNT);
  }
};

Game.prototype._resolveHeroAttacks = function(hero) {
  //Resolve Attacks and Healing (if any):
  var directions = [
    'North',
    'East',
    'South',
    'West',
  ];

  //Loop through all tiles around the hero
  for (var i=0; i<directions.length; i++) {
    var tile = this.board.getTileNearby(hero.distanceFromTop, hero.distanceFromLeft, directions[i]);
    if (tile === false) {
      //does nothing if the tile in the given direction
      //is not on the board
    } else if (tile.type === 'Hero') {
      //from the check above, we know 'tile' points to a hero object
      var otherHero = tile;

      //Our hero (whose turn it is) will auto-hit any heroes in range,
      //so this other hero that is one space away will take damage
      hero.damageDone += otherHero.takeDamage(HERO_ATTACK_DAMAGE);
      console.log("Hero: " + otherHero.id + ', hp: ' + otherHero.health)
      if (otherHero.dead) {
        //Remove dead hero from the board
        this.heroDied(otherHero);

        //Tell our hero he killed someone
        hero.killedHero(otherHero);
      }
    }
  }
};

Game.prototype.heroDied = function(hero) {

  console.log('HERO DIED: ' + hero.id);

  //Removes a dead hero from the board
  top = hero.distanceFromTop;
  left = hero.distanceFromLeft;
  this.board.tiles[top][left] = new Unoccupied(top, left);
};


var move = function(gameData, helpers) {
  var choices = ['North', 'East', 'South', 'West', 'Stay'];
  return choices[Math.floor(Math.random()*5)];
};

var g = new Game();

var game = new Game();
game.addHero(3,0);
game.addHero(0,3);
game.addDiamondMine(3,3);
for (var i=0; i<10; i++) {
  game.handleHeroTurn(move(game));
  game.board.inspect();
}


module.exports = Game;