## Redirect Laundromat

[![Build Status](https://travis-ci.org/slyg/redirect-laundromat.svg?branch=master)](https://travis-ci.org/slyg/redirect-laundromat) [![Coverage Status](https://coveralls.io/repos/slyg/redirect-laundromat/badge.png?branch=master)](https://coveralls.io/r/slyg/redirect-laundromat?branch=master) [![Code Climate](https://codeclimate.com/github/slyg/redirect-laundromat.png)](https://codeclimate.com/github/slyg/redirect-laundromat) [![NPM version](https://badge.fury.io/js/redirect-laundromat.svg)](http://badge.fury.io/js/redirect-laundromat) 

### Goal

Avoid multiple redirections when resolving seo friendly urls.

### Principle

- modular resolutions through standard middleware - named _washing machines_ (WM)
- mimic standard middleware usage
- expose a single middleware (possibly used as filter, configurable)

### Use case example

Replace the following redirections performed by several middleware functions :

  > Incoming `http://www.stu.ff/cn/?noise=1` 
  >
  > - `removeSubdomain    > 303 http://stu.ff/cn/?noise=1` 
  > - `setDefaultLanguage > 307 http://stu.ff/en/?noise=1` 
  > - `removeQueryParams  > 301 http://stu.ff/en/`

by a single redirection keeping the same middleware functions with _laundromat_.

  > Incoming `http://www.stu.ff/cn/?noise=1` 
  >
  > - `laundromat > 301 http://stu.ff/en/`

### Usage

Configure middleware by adding _washing machines_ functions :

```javascript

  var laundromat = new Laundromat();

  // Set laundromat _washing machines_ (that are actually standard middleware).
  //
  // On last _washing machine_ (WM) change,
  //  if new request (statusCode & url) is different from the current one,
  //  a redirection is performed,
  //  else continue to next middleware

  laundromat
    
     // add middleware functions, named _washing machines_ (WM)
     // to distinguish them from common Express middleware

     .use(function whirlpool(req, res, next){

      // some logic ... then ...

      // change nothing and go to the next WM
      return next();

      // stop WM execution stack 
      // and pass an error to the next middleware
      return next(new Error('Wow')); 

      // trigger a redirection
      //
      // `res.redirect` is actually a stubbed version of Express' method
      // that is restored after the laundromat has finished iterating
      //
      // in this case redirect changes `req`'s `url`,
      // then the laundromat WM stack is replayed
      // 
      return res.redirect(303, 'http://so.me/st/uff');

    })
    .use(laundromat.whites) // laundromat-attached washing machine
    .use(laundromat.delicates)
    .use(laundromat.wool)
  ;

```

Then use laundromat middleware in an Express app :


```javascript
  app.use(laundromat.wash);
```

### Schema

```
        --------
        | MW A |
        --------
           |
           v
    ----------------
    | Laudromat MW |--------------|
    |              |              v
                               -------- <-------
    |              |           | MW B |        |
                               -------- <---   |
    |              |              |        |   | 
                                  v        |   | (req, res) objects possibly looping
    |              |           --------    |   | when redirection triggered
                               | MW C |----|   | by MW B, C or C
    |              |           --------        | 
                                  |            |
    |              |              v            |
                               --------        |
    |              |           | MW D |--------|
                               --------
    |              |              |
    | Laudromat MW |<-------------|
    ----------------
           |
           v
        --------
        | MW E |
        --------
```

