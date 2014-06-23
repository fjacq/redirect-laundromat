var _ = require('lodash'),
    sinon = require('sinon');

function loopLimit(n) {
  return n*(n+3)/2;
}

function Laundromat(){

  "use strict";

  this._washingMachines = [];
  this._statusCode = 200;
  this._loopsCount = 0;

  this.use = function(wm){

    // sanity check - wm is a function
    if(typeof wm !== 'function'){
      throw new Error('provided washing machine middleware is not a function');
    }

    // sanity check - wm is a middleware
    if(wm.length !== 3){
      throw new Error('provided washing machine has not a middleware signature');
    }

    this._washingMachines.push(wm);

    return this;
  };

  this.wash = function(req, res, next){

    if(req.xhr){
      return next();
    }

    // set default status code and url values
    this._statusCode = res.statusCode;
    this._url = req.url;

    // fix initial state
    this._initial = Object.create({
      statusCode : this._statusCode,
      url : this._url
    });

    // create washing machines stack iterator
    var maxIndex = this._washingMachines.length;

    function iter(index){

      // increment loop count
      this._loopsCount++;

      // if loop limit is reached, fail
      if(this._loopsCount > loopLimit(maxIndex)){
        return next(new Error('loop count exceeded'));
      }

      // if already stubbed,restore `res`
      if(this._res && this._res.restore) {
        this._res.restore();
      }

      // replace `res.redirect` by another behavior
      this._res = sinon.stub(res, 'redirect', function(statusCode, url){

        // by default increment index
        index++;

        // something needs to be changed,
        // update values and loop
        if (statusCode !== this._statusCode) {

          // update status code of original `res` Object
          res.statusCode = this._statusCode = statusCode;

          // loop
          index = 0;
        }

        if (url !== this.url) {

          // update url of original `req` Object
          req.url = this._url = url;

          // loop
          index = 0;
        }

        // if stack is over, hand over to the next MW and pass error
        if (index === maxIndex) {

          // restore original `res.redirect` property
          this._res.restore();

          // perform redirect if something finally changed
          if (this._statusCode !== this._initial.statusCode || this._url !== this._initial.url){
            return res.redirect(this._statusCode, this._url);
          }

          // else hand over to the next MW
          return next(err);

        }

        // continue iteration
        return iter.call(this, index);

      }.bind(this));

      try {

        // call WM with correct context
        this._washingMachines[index].call(this, req, res, function(err){

          // if a truthy error object is passed, stop iteration
          // and hand it over to the next MW
          if (err) {
            return next(err);
          }

          // increment index
          index++;

          // stick to `null` standard falsy error
          if (err === undefined) {
            err = null;
          }

          // if stack is over, hand over to the next MW and pass error
          if (index === maxIndex) {

            // restore original `res.redirect` property
            this._res.restore();

            // perform redirect if something finally changed
            if (this._statusCode !== this._initial.statusCode || this._url !== this._initial.url){
              return res.redirect(this._statusCode, this._url);
            }

            // else hand over to the next MW
            return next(err);

          }

          // nothing changed, and WM stack can continue
          // so go ahead onto the next washing machine middleware
          iter.call(this, index);

        }.bind(this));

      } catch(err){
        return next(err);
      }

    }

    // start iteration on WM stack
    iter.call(this, 0);

  };

}

module.exports = Laundromat;