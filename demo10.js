/* 
容器依赖管理
面向接口编程,所有模块插件化
*/

class App {
    static modules = []
    constructor(options) {
        this.options = options;
        this.init();
    }

    static use(module) {
        Array.isArray(module) ? module.map(item => App.use(item)) : App.modules.push(module);
    }

    init() {
        this.initModules();
        this.options.onReady(this);
    }

    initModules() {
        App.modules.map(module => module.init && typeof module.init == 'function' && module.init(this));
    }
}

class Model {
    constructor(options) {
        this.options = options
    }
}

const Models = {
    init(app) {
        app.model = new Model(app.options.model);
    }
}

class Control {
    constructor(options) {
        this.options = options
    }
}

const Controls = {
    init(app) {
        app.control = new Control(app.options.control);
    }
}

class View {
    constructor() {
        this.title = ''
        this.description = ''
    }

    setData(data){
        this.title = data.title
        this.description = data.description
    }
}

const Views =  {
    init(app) {
        app.view = new View();
        app.setData = data => app.view.setData(data);
    }
}

App.use([Controls, Models])

App.use(Views)

new App({
    control: {
        name: 'index',
    },
    model: {
        name: 'index',
    },
    onReady(app) {
        console.log(app)
        app.setData({
            title: 'Hello App',
            description: 'this is index view'
        });
    }
})