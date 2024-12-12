var sqlite3 = require('sqlite3');
sqlite3.verbose();
var fs = require('fs'); 

Date.prototype.Format = function (fmt) { //author: meizz 
	var o = {
	    "M+": this.getMonth() + 1, //月份 
	    "d+": this.getDate(), //日 
	    "h+": this.getHours(), //小时 
	    "m+": this.getMinutes(), //分 
	    "s+": this.getSeconds(), //秒 
	    "q+": Math.floor((this.getMonth() + 3) / 3), //季度 
	    "S": this.getMilliseconds() //毫秒 
	};
	if (/(y+)/.test(fmt))
		fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
	for (var k in o)
		if (new RegExp("(" + k + ")").test(fmt))
			fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
	return fmt;
}

function item2File(row) {
  var fileName = new Date(row.created_at).Format("yyyy-MM-dd") + "-" + row.slug  +".md" ;
  var content = "---\n\
title: "+row.title+"\n\
date: "+new Date(row.created_at).Format("yyyy-MM-dd hh:mm:ss")+"\n\
updated: "+new Date(row.updated_at).Format("yyyy-MM-dd hh:mm:ss")+"\n\
tags:\n\
---\n"+row.markdown;
  
  //console.log(content);
  fs.appendFile("./source/_posts/"+fileName, content, function(err){  
    if(err)  
      console.log("fail " + err);  
    else
      console.log(fileName);
      console.log("created the post file");  
  });  
}

var dsExport = JSON.parse(fs.readFileSync('./export.json'));
console.log(dsExport.threads);

function item2Duoshuo(row) {
  var isFound = false;

  for (var i = 0; i < dsExport.threads.length; i++) {
    var thread = dsExport.threads[i];
    if (thread.thread_key == row.slug) {
      isFound = true;
      thread.created_at = new Date(row.created_at).Format("yyyy-MM-dd hh:mm:ss");
      thread.updated_at = new Date(row.updated_at).Format("yyyy-MM-dd hh:mm:ss");
      //console.log(thread);
    }
  }
  if (!isFound){
    console.log(row.slug + " not found." );
    console.log("\"created_at\": \"" + new Date(row.created_at).Format("yyyy-MM-dd hh:mm:ss")+"\",");
    console.log("\"updated_at\": \"" + new Date(row.updated_at).Format("yyyy-MM-dd hh:mm:ss")+"\",");
  }
}



var db = new sqlite3.Database("ghost.db", sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE,
  function(err) {
    if (err) {
      console.err('FAIL on open database ' + err);
      process.exit(-1);
    }
  });

db.each("SELECT title,slug,markdown,created_at,updated_at,published_at FROM posts", [],function(err, row) {
	if (err) {
    console.err('FAIL on select database ' + err);
  }

  if (row.published_at && row.created_at > row.published_at)
  		row.created_at = row.published_at;
  if (row.published_at && row.updated_at > row.published_at)
  		row.updated_at = row.published_at;

  //item2File(row);
  item2Duoshuo(row);
    
},function(){
  var dsExportText = JSON.stringify(dsExport);
  fs.writeFileSync('./export_.json',dsExportText)
});

