function loadJS(url, callback) {
    var script = document.createElement('script')
    var fn = callback || function() {}
    script.type = 'text/javascript'
    
    //其他浏览器
    script.onload = function() {
        fn(script);
    }
    script.src = url
    document.getElementsByTagName('head')[0].appendChild(script);

}

//用法
loadJS('demo1.js',function(e) {
    console.log('loadJS')
    // Array.prototype.slice.call(document.querySelectorAll("script[src]")).forEach(printScriptTextContent);
    // console.log(require(["foo:demo1.js"]).prototype.someMethod);
});

function printScriptTextContent(script){
  var xhr = new XMLHttpRequest()
  xhr.open("GET",script.src)
  xhr.onreadystatechange = function () {
    if(xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
      console.log("the script text content is",xhr.responseText)
    }
  }
  xhr.send()
}

