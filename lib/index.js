var _ = require('lodash');

function loopLimit(n) {
  return n*(n+3)/2;
}

function Laundromat(){

  "use strict";

  this._washingMachines = [];
  this._statusCode = 200;
  this._loopsCount = 0;

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

  this.wash = function(req, res, next){

    if(req.xhr){
      return next();
    }

    // set default status code and url value
    this._statusCode = res.statusCode || 200;
    this._url = req.url;

    // fix initial states

    this._initial = Object.create({
      statusCode : this._statusCode,
      url : this._url
    });

    // create washing machines stack iterator
    var maxIndex = this._washingMachines.length;

    function iter(index){

      // keep context reference
      var self = this;

      // increment loop count
      this._loopsCount++;

      if(this._loopsCount > loopLimit(maxIndex)){
        return next(new Error('loop count exceeded'));
      }

      this._washingMachines[index].call(self, req, self._statusCode, self._url, function(err, mod){

        // increment index
        index++;

        // stick to `null` standard falsy error
        if(err === undefined) {
          err = null;
        }

        // if a truthy error object is passed, stop iteration
        // and hand it over to the next MW
        if (err) {
          return next(err);
        }

        // pass an error if modification object is not a hash
        // `undefined` is an authorized value

        if(!_.isPlainObject(mod) && mod !== undefined){
          return next(new Error('passed modification object has wrong type'));
        }

        // if a modification is passed,
        // start washing machines stack from the beginning
        if(mod !== undefined){

          // something changed,
          // update values and loop

          if(mod.status && mod.status !== self._statusCode) {
            self._statusCode = mod.status;
            index = 0; // loop
          }

          if(mod.url && mod.url !== self._url) {
            self._url = mod.url;
            index = 0; // loop
          }

        }

        // if stack is over, hand over to the next MW with error object
        //
        // /!\ should be the last check !!!
        // --------------------------------
        //
        if (index === maxIndex) {

          if(self._statusCode !== self._initial.statusCode || self._url !== self._initial.url){
            return res.redirect(self._statusCode, self._url);
          }

          return next(err);

        }

        // continue iteration
        return iter.call(self, index);

      });

    }

    // start iteration on stack
    iter.call(this, 0);

  };

}

module.exports = Laundromat;