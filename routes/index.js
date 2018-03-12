var express = require('express');
var router = express.Router();
var privateDrawing = require('../app');
/* GET home page. */
router.get('/', function(req, res) {
  console.log('SESSION  / : ', req.session.id); 
  // req.session.song = 'mehdi';
  res.render('index', { title: 'Express' });
}); 

router.post('/',function(req,res){
  console.log('post request recieved ');
  console.log('REQUEST +>',JSON.stringify(req.body) );
  req.session.group = req.body;    
  req.session.myname = 'amarjot';
  req.session.save(); 
  console.log('GROUP : ',req.session.id,'===>',req.session.group);  
});

module.exports = router;
