/* 
代理模式 
1. 定义
为一个对象提供一个代用品或占位符，以便控制对它的访问
2. 核心
当客户不方便直接访问一个 对象或者不满足需要的时候，提供一个替身对象 来控制对这个对象的访问，客户实际上访问的是 替身对象。
替身对象对请求做出一些处理之后， 再把请求转交给本体对象
代理和本体的接口具有一致性，本体定义了关键功能，而代理是提供或拒绝对它的访问，或者在访问本体之前做一 些额外的事情
3. 实现
代理模式主要有三种：保护代理、虚拟代理、缓存代理
保护代理主要实现了访问主体的限制行为，以过滤字符作为简单的例子
*/

// 函数防抖，频繁操作中不处理，直到操作完成之后（再过 delay 的时间）才一次性处理
function debounce(fn, delay) {
    delay = delay || 200;
    
    var timer = null;

    return function() {
        var arg = arguments;
          
        // 每次操作时，清除上次的定时器
        clearTimeout(timer);
        timer = null;
        
        // 定义新的定时器，一段时间后进行操作
        timer = setTimeout(function() {
            fn.apply(this, arg);
        }, delay);
    }
};

var count = 0;

// 主体
function scrollHandle(e) {
    console.log(e.type, ++count); // scroll
}

// 代理
var proxyScrollHandle = (function() {
    return debounce(scrollHandle, 500);
})();

window.onscroll = proxyScrollHandle;