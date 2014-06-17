var rewire = require('rewire');
var Laundromat;

beforeEach(function(){
  Laundromat = rewire('../lib');
});

describe('Laundromat class - `Laundromat`', function(){
  it('should exist');
  it('should be a Function');
});

describe('Laundromat instance - `laundromat`', function(){

  it('should exist');
  it('should be a Function');

  context('push() method - `laundromat.push()`', function(){

    it('should exist');
    it('should take a washing machine function and return itself - `function(req, status, url, next){...}`');
    it('should throw when passed function is not a washing machine function - `function(req, status, url, next){...}`');
    it('should push passed function to its `_washingMachines` array property');

  });

});

describe('Laundromat middleware - `laundromat()`', function(){

  it('should sequentially call `_washingMachines` functions with parameters `req`, `status`, `url` and `next` continuation function');
  it('should pass an error to the next MW when `next` callback receives an error');
  it('should pass an error to the next MW when `next` callback receives a mis-formatted modification object');
  it('should loop back to the first washing machine function when a change is performed - aka `next` callback receives a modification object');
  it('should increment its `_loopsCount` value when a new loop is performed');
  it('should pass an error when its `_loopsCount` value exceeds `_washingMachines` length');
  it('should provide `res`\'s statusCode and url as default context to the first washing machine');
  it('should provide `req` to each washing machine');
  it('should provide a modified statusCode and url when loop starts again washing machine');
  it('should perform a redirection when `status` or `url` properties have been modified');
  it('should call the next middleware when neither `status` nor `url` properties have been modified');

});