function Laundromat(){

  "use strict";

  this._washingMachines = [];

  this.push = function(wm){

    if(typeof wm !== 'function'){
      throw new Error('provided washing machine function is not a function');
    }

    if(wm.length < 4){
      throw new Error('provided washing machine function has not a correct signature');
    }

    this._washingMachines.push(wm);
    return this;
  };

}

module.exports = Laundromat;