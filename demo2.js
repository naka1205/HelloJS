/* 
享元模式 
1. 定义
享元（flyweight）模式是一种用于性能优化的模式，它的目标是尽量减少共享对象的数量
2. 核心
运用共享技术来有效支持大量细粒度的对象。
强调将对象的属性划分为内部状态（属性）与外部状态（属性）。内部状态用于对象的共享，通常不变；而外部状态则剥离开来，由具体的场景决定。
3. 实现
在程序中使用了大量的相似对象时，可以利用享元模式来优化，减少对象的数量
举个栗子，要对某个班进行身体素质测量，仅测量身高体重来评判
*/

// 健康测量
function Fitness(name, sex, age, height, weight) {
    this.name = name;
    this.sex = sex;
    this.age = age;
    this.height = height;
    this.weight = weight;
}

// 开始评判
Fitness.prototype.judge = function() {
    var ret = this.name + ': ';

    if (this.sex === 'male') {
        ret += this.judgeMale();
    } else {
        ret += this.judgeFemale();
    }

    console.log(ret);
};

// 男性评判规则
Fitness.prototype.judgeMale = function() {
    var ratio = this.height / this.weight;

    return this.age > 20 ? (ratio > 3.5) : (ratio > 2.8);
};

// 女性评判规则
Fitness.prototype.judgeFemale = function() {
    var ratio = this.height / this.weight;
    
    return this.age > 20 ? (ratio > 4) : (ratio > 3);
};


// var a = new Fitness('A', 'male', 18, 160, 80);
// var b = new Fitness('B', 'male', 21, 180, 70);
// var c = new Fitness('C', 'female', 28, 160, 80);
// var d = new Fitness('D', 'male', 18, 170, 60);
// var e = new Fitness('E', 'female', 18, 160, 40);

// // 开始评判
// a.judge(); // A: false
// b.judge(); // B: false
// c.judge(); // C: false
// d.judge(); // D: true
// e.judge(); // E: true

//////////////////////////////////

// 健康测量
function Fitnesse(sex) {
    this.sex = sex;
}

// 工厂，创建可共享的对象
var FitnessFactory = {
    objs: [],

    create: function(sex) {
        if (!this.objs[sex]) {
            this.objs[sex] = new Fitnesse(sex);
        }

        return this.objs[sex];
    }
};

// 管理器，管理非共享的部分
var FitnessManager = {
    fitnessData: {},
    
    // 添加一项
    add: function(name, sex, age, height, weight) {
        var fitness = FitnessFactory.create(sex);
        
        // 存储变化的数据
        this.fitnessData[name] = {
            age: age,
            height: height,
            weight: weight
        };

        return fitness;
    },
    
    // 从存储的数据中获取，更新至当前正在使用的对象
    updateFitnessData: function(name, obj) {
        var fitnessData = this.fitnessData[name];

        for (var item in fitnessData) {
            if (fitnessData.hasOwnProperty(item)) {
                obj[item] = fitnessData[item];
            }
        }
    }
};

// 开始评判
Fitnesse.prototype.judge = function(name) {
    // 操作前先更新当前状态（从外部状态管理器中获取）
    FitnessManager.updateFitnessData(name, this);

    var ret = name + ': ';

    if (this.sex === 'male') {
        ret += this.judgeMale();
    } else {
        ret += this.judgeFemale();
    }

    console.log(ret);
};

// 男性评判规则
Fitnesse.prototype.judgeMale = function() {
    var ratio = this.height / this.weight;

    return this.age > 20 ? (ratio > 3.5) : (ratio > 2.8);
};

// 女性评判规则
Fitnesse.prototype.judgeFemale = function() {
    var ratio = this.height / this.weight;
    
    return this.age > 20 ? (ratio > 4) : (ratio > 3);
};


var a = FitnessManager.add('A', 'male', 18, 160, 80);
var b = FitnessManager.add('B', 'male', 21, 180, 70);
var c = FitnessManager.add('C', 'female', 28, 160, 80);
var d = FitnessManager.add('D', 'male', 18, 170, 60);
var e = FitnessManager.add('E', 'female', 18, 160, 40);

// 开始评判
a.judge('A'); // A: false
b.judge('B'); // B: false
c.judge('C'); // C: false
d.judge('D'); // D: true
e.judge('E'); // E: true