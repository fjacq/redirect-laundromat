## Redirect Laundromat

[![Build Status](https://travis-ci.org/slyg/redirect-laundromat.svg?branch=master)](https://travis-ci.org/slyg/redirect-laundromat) [![Coverage Status](https://coveralls.io/repos/slyg/redirect-laundromat/badge.png?branch=master)](https://coveralls.io/r/slyg/redirect-laundromat?branch=master)

### Goal

Avoid multiple redirections when resolving seo friendly urls.

### Principle

- modular resolutions through standard middleware - named _washing machines_ (WM)
- mimic standard middleware usage
- expose a single middleware (possibly used as filter, configurable)

### Schema

```
      --------
      | MW A |
      --------
         |
         |
         v
  ----------------
  | Laudromat MW |--------------|
                                |
  |              |              |
                             --------
  |              |           | MW B |
                             --------
  |              |              |
                                |
  |              |              v
                             --------
  |              |           | MW C |
                             --------
  |              |              |

  | Laudromat MW |--------------|
  ----------------
         |
         |
         v
      --------
      | MW D |
      --------
```


### Usage

Configure middleware adding _washing machines_ functions :

```javascript

  var laundromat = new Laundromat();

  // Set laundromat _washing machines_ (that are actually standard middleware).
  //
  // On last washing machine (WM) change,
  //  if new request (statusCode & url) is different from the current one,
  //  a redirection is performed,
  //  else continue to next middleware

  laundromat
    
     // push middleware functions, named here _washing machines_ (WM)

     .use(function whirlpool(req, res, next){

      // some logic ... then ...

      // change nothing and go to the next washing-machine (WM)
      return next();

      // stop washing machines (WM) execution stack 
      // and pass an error to the next middleware (MW)
      return next(new Error('Wow')); 

      // pass a modification so that it loops back to the first WM
      // 
      // `res.redirect` is actually a stub version of Express' method
      //
      // in this case redirect changes `req`'s `url` and `status` properties values
      // then the laundromat WM stack is replayed
      // 
      return res.redirect(303, 'http://so.me/st/uff');

    })
    .use(laundromat.whites) // laundromat-attached washing machine
    .use(laundromat.delicates)
    .use(laundromat.wool)
  ;

```

Then use customized middleware :


```javascript
  app.use(laundromat.wash);
```
