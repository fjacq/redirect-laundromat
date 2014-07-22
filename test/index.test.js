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

  function washingMachine(req, res, next){}

  beforeEach(function(){
    laundromat = new Laundromat();
  });

  it('should exist', function(){
    expect(laundromat).to.exist;
  });

  context('use() method - `laundromat.use()`', function(){

    it('should exist', function(){
      expect(laundromat).to.have.property('use');
    });
    it('should take a washing machine middleware as single parameter and return itself', function(){
      expect(laundromat.use(washingMachine)).to.be.an.instanceof(Laundromat);
    });
    it('should throw when passed parameter doesn\'t have a middleware signature (arity of 3)', function(){
      expect(function(){
        return laundromat.use('');
      }).to.throw();
      expect(function(){
        return laundromat.use(function(){});
      }).to.throw();
    });
    it('should push passed function to its `_washingMachines` array property', function(){

      laundromat
          .use(washingMachine)
          .use(washingMachine);

      expect(laundromat._washingMachines.length).to.eql(2);

      laundromat
          .use(washingMachine);

      expect(laundromat._washingMachines.length).to.eql(3);

    });

  });

});

describe('Laundromat middleware - `e.g. laundromat.wash()`', function(){

  var laundromat,
  req,
  requestUrl = 'http://so.me/stuff',
  newUrl = 'http://so.me/new/url';

  function emptyWM(req, res, next){
    next();
  }

  function brokenWM(req, res, next){
    next(new Error('Lime-scale failure'));
  }

  function throwingWM(req, res, next){
    throw new Error('Flooding error');
  }

  function cleaningWM(req, res, next){
    return res.redirect(newUrl);
  }

  beforeEach(function(){
    laundromat = new Laundromat();
    req = {
      url : requestUrl,
      originalUrl : requestUrl,
      protocol : 'http',
      xhr : false,
      host : 'so.me',
      headers : {
        host : 'so.me'
      },
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
  it('should have a middleware signature', function(){
    expect(laundromat.wash.length).to.eql(3);
  });
  it('should provide `req` and `res` context to the first washing machine', function(done){

    laundromat
      .use(function(req, res, next){
        expect(req).to.deep.eql(req);
        expect(res).to.deep.eql(res);
        return done();
      })
      .wash(req, res, function(){});

  });
  it('should provide custom (stubbed) `res.redirect` method context to the first washing machine', function(done){

    laundromat
      .use(function(req, res, next){
        expect(res.redirect).to.have.property('restore')
          .that.is.a('function');
        return done();
      })
      .wash(req, res, function(){});

  });
  it('should sequentially call `_washingMachines` functions with parameters `req`, `res` and `next` continuation function', function(done){

    var order = [];

    laundromat
      .use(function(req, res, next){
        order.push('A');
        return next();
      })
      .use(function(req, res, next){
        order.push('B');
        process.nextTick(next);
      })
      .use(function(req, res, next){
        order.push('C');
        return next();
      })
      .wash(req, res, function(){
        expect(order).to.deep.eql(['A', 'B', 'C']);
        return done();
      });

  });
  it('should pass an error to the next WM when WM passes an Error', function(done){

    laundromat
      .use(emptyWM)
      .use(brokenWM)
      .use(emptyWM)
      .wash(req, res, function(err){
        expect(err).to.be.an.instanceof(Error)
          .that.has.property('message', 'Lime-scale failure');
        return done();
      });

  });
  it('should loop back to the first washing machine function when `res.redirect` is called with a new url', function(done){

    var order = [];
    var flag = true;

    res.redirect = function(){
      expect(order).to.deep.eql(['A', 'B', 'A', 'B', 'C']);
      return done();
    };

    laundromat.use(function(req, res, next){
      order.push('A');
      return next();
    }).use(function(req, res, next){
      order.push('B');

      if(flag){
        flag = !flag;
        return res.redirect(newUrl);
      } else {
        return next();
      }

    }).use(function(req, res, next){
      order.push('C');
      return next();
    })
    .wash(req, res, function(){});

  });
  it('should increment its `_loopsCount` value when a new loop is performed', function(done){

    var flag = true;

    res.redirect = function(){
      expect(laundromat).to.have.property('_loopsCount', 5);
      return done();
    };

    laundromat
      .use(emptyWM)
      .use(function(req, res, next){
        if(flag){
          flag = !flag;
          return res.redirect(303, newUrl);
        } else {
          return next();
        }
      })
      .use(emptyWM)
      .wash(req, res, function(){});

  });
  it('should pass an error when its `_loopsCount` value exceeds max count (computed from _washingMachines count)', function(done){

    var n = 0;

    laundromat
      .use(emptyWM)
      .use(function(req, res, next){
        return res.redirect(newUrl + n++);
      })
      .wash(req, res, function(err){
        expect(err).to.be.an.instanceof(Error);
        return done();
      });

  });
  it('should provide a modified `req.url` when loop starts again washing machine', function(done){

    laundromat
      .use(function(req, res, next){
        if(req.url === newUrl) {
          return done();
        }
        return next();
      })
      .use(function(req, res, next){
        return res.redirect(307, newUrl);
      })
      .wash(req, res, function(){});

  });
  it('should pass to the next washing machine when current one do not perform any redirection', function(done){

    var order = [];

    laundromat
      .use(function(req, res, next){
        order.push('A');
        return res.redirect(307, newUrl);
      })
      .use(function(req, res, next){
        expect(order).to.deep.eql(['A', 'A']);
        return done();
      })
      .wash(req, res, function(){});

  });
  it('should perform a redirection when `statusCode` or `url` properties have been modified', function(done){

    res.redirect = function(statusCode, url){
      expect(statusCode).to.eql(303);
      return done();
    };

    laundromat
      .use(function(req, res, next){
        if(res.statusCode === 303) {
          return next();
        }
        return res.redirect(307, newUrl);
      })
      .use(function(req, res, next){
        return res.redirect(303, newUrl);
      })
      .wash(req, res, function(){});

  });
  it('should call the next middleware when no redirection has been done', function(done){

    laundromat
      .use(emptyWM)
      .use(emptyWM)
      .wash(req, res, function(){
        return done();
      });

  });
  it('should call the next middleware when request is an xhr', function(done){

    req.xhr = true;

    laundromat
      .use(emptyWM)
      .wash(req, res, function(){
        return done();
      });

  });
  it('should pass washing machine error as soon as it occurs', function(done){

    laundromat
      .use(emptyWM)
      .use(brokenWM)
      .use(emptyWM)
      .wash(req, res, function(err){
        expect(err).to.be.an.instanceof(Error)
          .that.has.property('message', 'Lime-scale failure');
        return done();
      });

  });
  it('should restore `res.redirect()` original method', function(done){

    res.redirect.flag = true;

    laundromat
      .use(emptyWM)
      .use(function(req, res, next){
        expect(res.redirect).not.to.have.property('flag');
        next();
      })
      .wash(req, res, function(err){
        expect(res.redirect).to.be.a('function')
          .that.has.not.property('restore');
        expect(res.redirect).to.have.property('flag');
        return done();
      });

  });
  it('should reset `_loopsCount` property after each call', function(done){

    var order = [];
    var shallPass = false;

    laundromat
      .use(emptyWM)
      .use(emptyWM);

    laundromat.wash(req, res, function(){
      laundromat.wash(req, res, function(){
        expect(laundromat._loopsCount).to.eql(2);
        return done();
      });
    });

  });

});
