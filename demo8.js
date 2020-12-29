/* 
观察者模式 
观察者模式定义了对象之间的一对多，当一个对象改变状态时，它的所有依赖者都会收到通知并自动更新。
*/

class Observer {
    constructor () {}
    update () {}
}

class Observeable {
    constructor(){
        this.objs = []
    }
    
    register(obs) {
        this.objs.push(obs);
    }

    remove(obs) {
        let idx = this.objs.findIndex(val => val.name === obs.name);
        if (idx > -1) this.objs.splice(idx, 1);
    }

    notify(...data) {
        this.objs.forEach(val => val.update(...data));
    }
}

class Display extends Observer {
    constructor () {
        super()
    }

    update ( data, status, temp) {
        console.log(temp)
        console.log(data)
        console.log(status)
    }
}

class WebData extends Observeable {
    constructor () {
        console.log('WebData')
        super()
    }
    
    change () { 
        console.log('change')
        let data = this.getData();
        let status = this.getStatus();
        this.notify(data, status);
    }

    getData(){
        return 'data'
    }

    getStatus(){
        return 'status'
    }
}

const web = new WebData()

let view1 = new Display()
let view2 = new Display()
let view3 = new Display()

web.register(view1)
web.register(view2)
web.register(view3)

web.change()