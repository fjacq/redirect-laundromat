var _ = require('lodash'),
    sinon = require('sinon'),
    URL = require('url');

function loopLimit(n) {
  return n*(n+3)/2;
}

function Laundromat(){

  "use strict";

  this._washingMachines = [];

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

    this._statusCode = 302; // default redirect code
    this._loopsCount = 0;

    // absolutize req url
    req.url = require('url').format({
      protocol: req.protocol,
      host: req.headers.host,
      pathname: req.path,
      query: req.query
    });

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

    /**
     *  This function decides whether to continue iteration,
     *  or hand over to the next middleware
     */
    function pursue(err, index){

      // if a truthy error object is passed, stop iteration
      // and hand it over to the next MW
      if (err) {
        return next(err);
      }

      // if loops limit is reached,
      // hand over to the next MW with an error
      if(this._loopsCount > loopLimit(maxIndex)){
        return next(new Error('Laudromat loop count exceeded : ' + this._loopsCount));
      }

      // if stack is over, hand over to the next MW and pass error
      if (index === maxIndex) {

        // restore original `res.redirect` stubbed method
        this._res.restore();

        // perform redirect if url finally changed
        if (this._url !== this._initial.url){
          return res.redirect(this._statusCode, this._url);
        }

        // else hand over to the next MW
        return next();

      }

      // else, continue iteration

      return iter.call(this, index);

    }

    /**
     *  This function iterates along laudromat's middleware stack (washing machines),
     *  giving them a stubbed `res.redirect()` method
     */
    function iter(index){

      // increment loop count
      this._loopsCount++;

      // if already stubbed,restore `res`
      if(this._res && this._res.restore) {
        this._res.restore();
      }

      // replace `res.redirect` by another behavior
      this._res = sinon.stub(res, 'redirect', function(statusCode, url){

        // by default, increment index
        index++;

        var _statusCode, _url;

        // normalize depending on signature
        // `res.redirect(3xx, '/an/url');` or `res.redirect('/an/url');`
        if (2 === arguments.length && typeof statusCode === 'number') {
          _statusCode = statusCode;
          _url = url;
        } else {
          _statusCode = this._statusCode;
          _url = statusCode;
        }

        // if statusCode changes, keep track and continue
        if (_statusCode !== this._statusCode) {

          // update status code of original `res` Object
          this._statusCode = _statusCode;

        }

        // if url changes, update `req` object and loop
        if (_url !== this._url) {

          /**
           *  update original `req` Object
           *  especially `url` and some of its bound properties
           */

          var urlHash = URL.parse(_url, true);

          // url
          req.url = this._url = _url;
          // host in header
          req.headers.host = urlHash.host;
          // hash
          req.hash = urlHash.hash;
          // query
          req.query = urlHash.query;


          // loop
          index = 0;
        }

        // continue
        pursue.call(this, null, index);

      }.bind(this));

      // call WM with correct context
      this._washingMachines[index].call(this, req, res, function(err){

        // by default, increment index
        index++;

        // stick to `null` standard falsy error
        if (err === undefined) {
          err = null;
        }

        // continue
        pursue.call(this, err, index);

      }.bind(this));

    }

    // start iteration on WM stack
    iter.call(this, 0);

  }.bind(this);

}

module.exports = Laundromat;
