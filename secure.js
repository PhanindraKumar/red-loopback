const _ = require('lodash');

// function setCookie(req, res) {
//   var tokenCookie = req.signedCookies && req.signedCookies.access_token;

//   if (tokenCookie === undefined) {
//     res.cookie('access_token', req.accessToken.id, {
//       maxAge: 900000,
//       signed: true
//     });
//     console.log('TOKEN cookie created successfully: ', req.accessToken.id);
//   } else {
//     // yes, cookie was already present
//     console.log('cookie exists', tokenCookie);
//   }
// }

function redRoutes(params) {
  paths = params.paths || []
  //principalType = params.principalType || "USER";

  return function (req, res, next) {
    var matched = paths.some(function(securePath){
      var regEx = new RegExp('^'+securePath)
      return req.path.match(regEx)
    });
    //var matched = req.path.match(/^\/ping/)

    //continue if path doesnt match any route
    if(!matched) {
      next();
      return;
    }

    if (!req.accessToken) {
      res.status(401).send('USER UNAUTHENTICATED!') 
      return;
    }

    const app = req.app;
    const userId = req.accessToken.userId;
    const RoleModel = app.models[params.roleModel] || app.models.Role;

    RoleModel.getRoles({'principalId': userId}, {'returnOnlyRoleNames': true}, function(err, roles){
      console.log("### ROLES : ", roles)
      if(err) {
        next(err)
        return;
      }
      const allowed = _.intersection(params.roles, roles).length > 0;
      if(!allowed) {
        res.status(401).send('USER UNAUTHORIZED!') 
        return;
      }
      next();
    })
  }
}

function setLoginCookie(context, accessToken, next) {  
    var res = context.res;
    var req = context.req;
    if (accessToken != null) {
        if (accessToken.id != null) {
            res.cookie('access_token', accessToken.id, {
                signed: true,
                maxAge: 1000 * accessToken.ttl
            });
            return next()//res.redirect('/');
        }
    }
    return next();
}

module.exports = {
  red: redRoutes,
  setLoginCookie: setLoginCookie
}

