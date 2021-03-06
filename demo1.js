/* 
单例模式 
1. 定义
保证一个类仅有一个实例，并提供一个访问它的全局访问点
2. 核心
确保只有一个实例，并提供全局访问
3. 实现
假设要设置一个管理员，多次调用也仅设置一次，我们可以使用闭包缓存一个内部变量来实现这个单例
*/

function SetManager(name) {
    this.manager = name;
}

SetManager.prototype.getName = function() {
    console.log(this.manager);
}

var SingletonSetManager = (function() {
    var manager = null;
    console.log('SingletonSetManager')
    return function(name) {
        if (!manager) {
            manager = new SetManager(name);
        }

        return manager;
    } 
})();

// SingletonSetManager('a').getName(); // a
// SingletonSetManager('b').getName(); // a
// SingletonSetManager('c').getName(); // a

///////////////////////////////////

// 提取出通用的单例
function getSingleton(fn) {
    console.log('getSingleton')
    var instance = null;

    return function() {
        
        if (!instance) {
            instance = fn.apply(this, arguments);
        }
        // console.log('instance',instance)
        // console.log('fn',fn)
        return instance;
    }
}

// 获取单例
var managerSingleton = getSingleton(function(name) {
    // console.log('managerSingleton')
    var manager = new SetManager(name);
    return manager;
});

// managerSingleton('a').getName(); // a
// managerSingleton('b').getName(); // a
// managerSingleton('c').getName(); // a


function createPopup(html) {
    console.log('createPopup')
    var div = document.createElement('div');
    div.innerHTML = html;
    document.body.append(div);

    return div;
}

var popupSingleton = getSingleton(function() {
    var div = createPopup.apply(this, arguments);
    return div;
});

popupSingleton('aaa').innerHTML
popupSingleton('bbb').innerHTML
popupSingleton('ccc').innerHTML