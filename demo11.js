/* 
模板引擎

const compiled = Compile(template: String|Node, data: Object);
compiled.view // => compiled template
*/

const hasInterpolation = text => /\{?\{\{(.+?)\}\}\}?/g.test(text)

const configure = {
    identifier: {
        bind: `:`,
    },
    priority: [
        'forin',
        'each'
    ]
}

function domify(DOMString) {
    const html = document.implementation.createHTMLDocument()
    html.body.innerHTML = DOMString
    return html.body
}

function walk(el, action, done) {
    
    const nodes = el.childNodes && [].slice.call(el.childNodes)

    done = done || function () {}
    action = action || function () {}

    function next(skip) {
        if (skip || nodes.length === 0) return done()
        walk(nodes.shift(), action, next)
    }

    action(el, next)
}

function Compile(template, data) {
    if (!(this instanceof Compile)) return new Compile(template, data)

    this.options = {}
    this.data = data
    
    if (template instanceof Node) {
        this.options.template = template
    } else if (typeof template === 'string') {
        this.options.template = domify(template)
    } else {
        console.error(`"template" only accept DOM node or string template`)
    }
    
    template = this.options.template
    
    walk(template, (node, next) => {
        if (node.nodeType === 1) {
            return next(this.compile.elementNodes.call(this, node) === false)
        } else if (node.nodeType === 3) {
            this.compile.textNodes.call(this, node)
        }
        next()
    })

    this.view = template
    template = null
}

Compile.prototype.compile = {}

Compile.prototype.compile.elementNodes = function (node) {
    if (node.hasAttributes() && this.bindPriority(node)) return false
    
    const attributes = [].slice.call(node.attributes)
    attributes.map(attribute => {
        const attributeName = attribute.name
        const attributeValue = attribute.value.trim()

        if (attributeName.indexOf(configure.identifier.bind) === 0 && attributeValue !== '') {
            const directiveName = attributeName.slice(configure.identifier.bind.length)

            this.bindDirective({
                node,
                expression: attributeValue,
                name: directiveName,
            });
            node.removeAttribute(attributeName)
        } else {
            this.bindAttribute(node, attribute)
        }
    })
}


Compile.prototype.compile.textNodes = function (node) {
    if (node.textContent.trim() === '') return false

    this.bindDirective({
        node,
        name: 'text',
        expression: parseText(node.textContent),
    })
}

Compile.prototype.bindDirective = function (options) {
    new Directive({
        ...options,
        compile: this,
    })
}

Compile.prototype.bindAttribute = function (node, attribute) {
    if (!hasInterpolation(attribute.value) || attribute.value.trim() == '') return false

    this.bindDirective({
        node,
        name: 'attribute',
        expression: parseText(attribute.value),
        attrName: attribute.name,
    })
}

Compile.prototype.bindPriority = function(node) {
    for (let i = 0; i < configure.priority.length; i++) {
        const directive = configure.priority[i]
        let attributeValue = node.getAttribute(`${configure.identifier.bind}${directive}`)

        if (attributeValue) {
            attributeValue = attributeValue.trim()
            if (!attributeValue) return false

            node.removeAttribute(`${configure.identifier.bind}${directive}`)
            this.bindDirective({
                node,
                name: directive,
                expression: attributeValue,
            });

            return true
        } 
    }

    return false
}

const each = {
    beforeUpdate() {
        this.placeholder = document.createComment(`:each`)
        this.node.parentNode && this.node.parentNode.replaceChild(this.placeholder, this.node)
    },
    update(data) {
        if (data && !Array.isArray(data)) return

        const fragment = document.createDocumentFragment()

        data.map((item, index) => {
            const compiled = Compile(this.node.cloneNode(true), { item:item, index:index })
            fragment.appendChild(compiled.view)
        })
        
        this.placeholder.parentNode.replaceChild(fragment, this.placeholder)
    }
}

const forin = {
    beforeUpdate() {
        this.placeholder = document.createComment(`:forin`)
        this.node.parentNode && this.node.parentNode.replaceChild(this.placeholder, this.node)

        this.itemName = `item`
        this.indexName = `index`
        this.dataName = this.expression

        if (this.expression.indexOf(' in ') != -1) {
            const bracketRE = /\(((?:.|\n)+?)\)/g;
            const [item, data] = this.expression.split(' in ')
            const matched = bracketRE.exec(item)

            if (matched) {
                const [item, index] = matched[1].split(',')
                index ? this.indexName = index.trim() : ''
                this.itemName = item.trim()
            } else {
                this.itemName = item.trim()
            }

            this.dataName = data.trim()
        }

        this.expression = this.dataName
    },
    update(data) {
        if (data && !Array.isArray(data)) return

        const fragment = document.createDocumentFragment()

        data.map((item, index) => {
            const compiled = Compile(this.node.cloneNode(true), {
                [this.itemName]: item,
                [this.indexName]: index,
            })
            fragment.appendChild(compiled.view)
        })
        
        this.placeholder.parentNode.replaceChild(fragment, this.placeholder)
    }
}

const directives = {
    show: {
        beforeUpdate() {},
        update(show) {
            this.node.style.display = show ? `block` : `none`
        },
    },
    text: {
        beforeUpdate() {},
        update(value) {
            this.node.textContent = value
        },
    },
    attribute : {
        beforeUpdate() {},
        update(value) {
            this.node.setAttribute(this.attrName, value)
        },
    },
    each:each,
    forin:forin
}

// 注册指令（`Object.assign(this, directives[this.name])`）
// 计算指令表达式的实际值（`generate(this.expression)(this.compile.options.data)`）
function Directive(options = {}) {
    if (!(this instanceof Directive)) return new Directive(options);
    Object.assign(this, options);
    Object.assign(this, directives[this.name]);
    this.beforeUpdate && this.beforeUpdate();
    this.update && this.update(generate(this.expression)(this.compile.data));
}

// parseText(`Hi {{ data.name }}, {{ value }} is demo.`);
// => 'Hi ' + data.name + ', ' + value + ' is demo.'
const tagRE = /\{\{((?:.|\n)+?)\}\}/g;
function parseText(text) {
    if (!tagRE.test(text)) return JSON.stringify(text)

    const tokens = []
    let lastIndex = tagRE.lastIndex = 0
    let index, matched

    while (matched = tagRE.exec(text)) {
        index = matched.index
        if (index > lastIndex) {
            tokens.push(JSON.stringify(text.slice(lastIndex, index)))
        }
        tokens.push(matched[1].trim())
        lastIndex = index + matched[0].length
    }

    if (lastIndex < text.length) tokens.push(JSON.stringify(text.slice(lastIndex)))

    return tokens.join('+')
}

const dependencyRE = /"[^"]*"|'[^']*'|\.\w*[a-zA-Z$_]\w*|\w*[a-zA-Z$_]\w*:|(\w*[a-zA-Z$_]\w*)/g
const globals = [
    'true', 'false', 'undefined', 'null', 'NaN', 'isNaN', 'typeof', 'in',
    'decodeURI', 'decodeURIComponent', 'encodeURI', 'encodeURIComponent', 'unescape',
    'escape', 'eval', 'isFinite', 'Number', 'String', 'parseFloat', 'parseInt',
]

// 标签解析成 JavaScript 表达式 `<h1>Hey , {{ value }}</h1>` => `'Hey , ' + value`
// 提取其中的依赖变量并取得所在 `data` 中的对应值
// 利用 `new Function()` 来创建一个匿名函数来返回这个表达式
function generate(expression) {
    const dependencies = extractDependencies(expression);
    const dependenciesCode = dependencies.reduce((prev, current) => {
        prev += `var ${current} = data["${current}"]; `
        return prev;
    }, '')
    return new Function(`data`, `${dependenciesCode}return ${expression};`)
}


// extractDependencies(`typeof String(name) === 'string'  && 'Hello ' + world + '! ' + hello.split('').join('') + '.'`);
// => ["name", "world", "hello"]
function extractDependencies(expression) {
    const dependencies = [];

    expression.replace(dependencyRE, (match, dependency) => {
        const isDefined = dependency => dependency !== undefined;
        const hasDependency = (dependencies, dependency) => dependencies.includes(dependency);
        const hasGlobal = (globals, dependency) => globals.includes(dependency);

        if (isDefined(dependency) && !hasDependency(dependencies, dependency) && !hasGlobal(globals, dependency)) {
            dependencies.push(dependency);
        }
    });

    return dependencies;
}

// const compiled = Compile(`<h1>Hey  , {{ content }}</h1>`, {
//     content: `Hello World`,
// })

// compiled.view

// let template = `<li :each="list" data-index="{{ index }}">{{ item.value }}</li>`
// const compiled = Compile(template, {
//     list: [
//         {value: `Hello World.`},
//         {value: `This is Each.`},
//         {value: `Template Demo!`}
//     ]
// })

// compiled.view

// console.log(compiled.view)

//<li data-index="0">Hello World.</li>
//<li data-index="1">Just Awesome.</li>
//<li data-index="2">WOW, Just WOW!</li>

let template = `<h1>Hey  , {{ content }}</h1><li :forin="(item, key) in list" data-index="{{ key }}">{{ item.value }}</li>`
const compiled = Compile(template, {
    content: 'Template',
    list: [
        {value: `Hello World.`},
        {value: `This is ForIn.`},
        {value: `Template Demo!`}
    ]
})

document.body.appendChild(compiled.view)