/* jshint -W030 */

var expect = require('chai').expect;
var rewire = require('rewire');
var Laundromat;

beforeEach(function(){
  Laundromat = rewire('../lib');
});

describe('Laundromat class - `Laundromat`', function(){
  it('should exist', function(){
    expect(Laundromat).to.be.ok;
  });
  it('should be a Function', function(){
    expect(Laundromat).to.be.a('function');
  });
});

describe('Laundromat instance - `laundromat`', function(){

  var laundromat;

  function washingMachine(req, statusCode, url, next){}

  beforeEach(function(){
    laundromat = new Laundromat();
  });

  it('should exist', function(){
    expect(laundromat).to.exist;
  });

  context('push() method - `laundromat.push()`', function(){

    it('should exist', function(){
      expect(laundromat).to.have.property('push');
    });
    it('should take a washing machine function and return itself', function(){
      expect(laundromat.push(washingMachine)).to.be.an.instanceof(Laundromat);
    });
    it('should throw when passed parameter doesn\'t have a washing machine signature (arity of 4)', function(){
      expect(function(){
        return laundromat.push('');
      }).to.throw();
      expect(function(){
        return laundromat.push(function(){});
      }).to.throw();
    });
    it('should push passed function to its `_washingMachines` array property', function(){

      laundromat
          .push(washingMachine)
          .push(washingMachine);

      expect(laundromat._washingMachines.length).to.eql(2);

      laundromat
          .push(washingMachine);

      expect(laundromat._washingMachines.length).to.eql(3);

    });

  });

});

describe('Laundromat middleware - `e.g. laundromat.wash()`', function(){

  var laundromat,
  req,
  requestUrl = 'http://so.me/stuff';

  function emptyWM(req, statusCode, url, next){
    next();
  }

  function brokenWM(req, statusCode, url, next){
    next(new Error('Lime-scale failure'));
  }

  function cleaningWM(req, statusCode, url, next){
    next(null, {
      statusCode : 307,
      url : 'http://so.me/new/stuff'
    });
  }

  beforeEach(function(){
    laundromat = new Laundromat();
    req = {
      url : requestUrl,
      originalUrl : requestUrl,
      protocol : 'http',
      xhr : false,
      host : 'so.me',
      path : '/stuff',
      ip : '127.0.0.1'
    };
    res = {
      statusCode : 200,
      status : function(statusCode){
        res.statusCode = statusCode;
      },
      redirect : function(){}
    };
  });

  it('should exist', function(){
    expect(laundromat).to.have.property('wash')
      .that.is.a('function');
  });
  it('should be signed as a middleware', function(){
    expect(laundromat.wash.length).to.eql(3);
  });
  it('should provide `res`\'s statusCode and url as default context to the first washing machine', function(done){

    laundromat.push(function(req, statusCode, url, next){
      expect(statusCode).to.eql(200);
      expect(url).to.eql(requestUrl);
      return done();
    });

    laundromat.wash(req, res, function(){});

  });
  it('should provide statusCode 200 by default as context to the first washing machine', function(done){

    res.statusCode = undefined;

    laundromat.push(function(req, statusCode, url, next){
      expect(statusCode).to.eql(200);
      expect(url).to.eql(requestUrl);
      return done();
    });

    laundromat.wash(req, res, function(){});

  });
  it('should sequentially call `_washingMachines` functions with parameters `req`, `statusCode`, `url` and `next` continuation function', function(done){

    var order = [];

    laundromat.push(function(req, statusCode, url, next){
      order.push('A');
      next();
    }).push(function(req, statusCode, url, next){
      order.push('B');
      process.nextTick(next);
    }).push(function(req, statusCode, url, next){
      order.push('C');
      next();
    });

    laundromat.wash(req, res, function(){
      expect(order).to.deep.eql(['A', 'B', 'C']);
      return done();
    });

  });
  it('should pass an error to the next MW when `next` callback receives an error', function(done){

    laundromat
      .push(emptyWM)
      .push(brokenWM)
      .push(emptyWM);

    laundromat.wash(req, res, function(err){
      expect(err).to.be.an.instanceof(Error);
      done();
    });

  });
  it('should pass an error to the next MW when `next` callback receives a mis-formatted modification object', function(done){

    laundromat
      .push(emptyWM)
      .push(function(req, statusCode, url, next){
        next(null, 'coucou');
      });

    laundromat.wash(req, res, function(err){
      expect(err).to.be.an.instanceof(Error);
      done();
    });

  });
  it('should loop back to the first washing machine function when a change is performed - aka `next` callback receives a modification object', function(done){

    var order = [];
    var flag = true;

    laundromat.push(function(req, statusCode, url, next){
      order.push('A');
      next();
    }).push(function(req, statusCode, url, next){
      order.push('B');

      if(flag){
        flag = !flag;
        next(null, {
          statusCode : 303,
          url : 'http://so.me/new/url'
        });
      } else {
        next();
      }

    }).push(function(req, statusCode, url, next){
      order.push('C');
      next();
    });

    res.redirect = function(){
      expect(order).to.deep.eql(['A', 'B', 'A', 'B', 'C']);
      return done();
    };

    laundromat.wash(req, res, function(){});

  });
  it('should increment its `_loopsCount` value when a new loop is performed', function(done){

    var flag = true;

    laundromat
      .push(emptyWM)
      .push(function(req, statusCode, url, next){
        if(flag){
          flag = !flag;
          return next(null, {
            statusCode : 303
          });
        } else {
          next();
        }
      })
      .push(emptyWM);

    res.redirect = function(){
      expect(laundromat).to.have.property('_loopsCount', 5);
      return done();
    };

    laundromat.wash(req, res, function(){});

  });
  it('should pass an error when its `_loopsCount` value exceeds max count (computed from _washingMachines count)', function(done){

    var n = 0;

    laundromat
      .push(emptyWM)
      .push(function(req, statusCode, url, next){
        return next(null, {
          statusCode: 300 + n++
        });
      });

    laundromat.wash(req, res, function(err){
      expect(err).to.be.an.instanceof(Error);
      done();
    });

  });
  it('should provide a modified statusCode and url when loop starts again washing machine', function(done){

    laundromat
      .push(function(req, statusCode, url, next){
        if(statusCode === 307) {
          return done();
        }
        return next();
      })
      .push(function(req, statusCode, url, next){
        return next(null, {
          statusCode: 307
        });
      });

    laundromat.wash(req, res, function(){});

  });
  it('should pass to the next washing machine when current one do not change statusCode or url values', function(done){

    laundromat
      .push(function(req, statusCode, url, next){
        return next(null, {
          statusCode: 307
        });
      })
      .push(function(req, statusCode, url, next){
        return done();
      });

    laundromat.wash(req, res, function(){});

  });
  it('should perform a redirection when `statusCode` or `url` properties have been modified', function(done){

    res.redirect = function(statusCode, url){
      return done();
    };

    laundromat
      .push(function(req, statusCode, url, next){

        if(statusCode !== 307) {

          return next(null, {
            statusCode: 307
          });

        } else {
          return next();
        }
      });

    laundromat.wash(req, res, function(){});

  });
  it('should call the next middleware when neither `statusCode` nor `url` properties have been modified', function(done){

    laundromat
      .push(emptyWM)
      .push(emptyWM);

    laundromat.wash(req, res, function(){
      done();
    });

  });
  it('should call the next middleware when request is an xhr', function(done){

    req.xhr = true;

    laundromat
      .push(emptyWM);

    laundromat.wash(req, res, function(){
      done();
    });

  });
  it('should pass washing machine error as soon as it occurs', function(done){

    laundromat
      .push(emptyWM)
      .push(brokenWM)
      .push(emptyWM);

    laundromat.wash(req, res, function(err){
      expect(err).to.be.an.instanceof(Error)
        .that.has.property('message', 'Lime-scale failure');
      done();
    });

  });

});