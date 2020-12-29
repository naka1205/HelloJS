/* 
事件监听
*/
class EventEmitter {
    constructor(){
        this._events={}
    }

    on(event,callback){
        let callbacks = this._events[event] || []
        callbacks.push(callback)
        this._events[event] = callbacks
        return this
    }

    off(event,callback){
        let callbacks = this._events[event]
        this._events[event] = callbacks && callbacks.filter(fn => fn !== callback)
        return this
    }

    emit(...args){
        const event = args[0]
        const params = [].slice.call(args,1)
        const callbacks = this._events[event]
        callbacks.forEach(fn => fn.apply(this, params))
        return this
    }

    once(event,callback){
        const fun = (...args) => {
            callback.apply(this,args)
            this.off(event,fun)
        }
        this.on(event,fun)
        return this
    }
}


let demo = new EventEmitter()

demo.on('update',(data)=>{
    console.log('update',data)
})


demo.emit('update','123');