var express = require('express');
var router = express.Router();
var privateDrawing = require('../app');


/* GET home page. */
router.get('/', function(req, res) {
  console.log('SESSION  /drawing : ',req.session.id,'----------->',req.session.group); 
  console.log('groupId', req.session.group.groupId);
  if(req.session.group.groupId){
    // res.render('')
  }
  res.render('drawing', { title: 'Drawing' });  
});


module.exports = router;
 