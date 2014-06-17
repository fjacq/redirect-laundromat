## Redirect Laundromat

## Goal

Avoid multiple redirections when resolving seo friendly urls

## Proposed solution

- expose a middleware (possibly used as filter, configurable)
- modular resolutions (washing machines)
- middleware-like architecture

## Proposed usage

```javascript

  var laundromat = new Laundromat();

  // Set laundromat washing machines.
  //
  // On last washing machine change,
  //  if new request (status & url) is different from the current one,
  //  a redirection is performed,
  //  else continue to next middleware

  laundromat
    
     // push a washing machine

     .push(function whirlpool(req, res, dry){

      // some logic ... then ...

      // change nothing and go to the next washing-machine (WM)
      return dry();

      // pass an error to the next middleware (MW)
      return dry(new Error('Wow')); 

      // pass a modification so that it loops back to the first WM
      return dry(null, {
        status : 303,
        url : 'http://so.me/st/uff'
      });

    })
    .push(laundromat.whites) // laundromat-attached washing machine
    .push(laundromat.delicates)
    .push(laundromat.wool)
  ;

  // used after customization

  app.use(laundromat()); // laundromat() returns a middleware


```

## Special rules

- If there is more loop than washing-machines an error is passed to the next Mw ... well that could change
- ...
