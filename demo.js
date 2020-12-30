/* 
基于 DOM 的模板引擎

const compiled = Compile(template: String|Node, data: Object);
compiled.view // => compiled template
*/

function domify(DOMString) {
    const html = document.implementation.createHTMLDocument();

    html.body.innerHTML = DOMString;

    return html.body.children;
}

function walk(el, action, done) {
    const nodes = el.childNodes && [].slice.call(el.childNodes);

    done = done || function () {};
    action = action || function () {};

    function next(skip) {
        if (skip || nodes.length === 0) return done();
        walk(nodes.shift(), action, next);
    }

    action(el, next);
}

function Compile(template, data) {
    if (!(this instanceof Compile)) return new Compile(template, data);

    this.options = {};
    this.data = data;

    if (template instanceof Node) {
        this.options.template = template;
    } else if (typeof template === 'string') {
        this.options.template = domify(template);
    } else {
        console.error(`"template" only accept DOM node or string template`);
    }

    template = this.options.template;

    walk(template, (node, next) => {
        if (node.nodeType === 1) {
            // compile element node
            this.compile.elementNodes.call(this, node);
            return next();
        } else if (node.nodeType === 3) {
            // compile text node
            this.compile.textNodes.call(this, node);
        }
        next();
    });

    this.view = template;
    template = null;
}

Compile.compile = {};

Compile.compile.elementNodes = function (node) {
    const bindSymbol = `:`;
    let attributes = [].slice.call(node.attributes),
        attrName = ``,
        attrValue = ``,
        directiveName = ``;

    attributes.map(attribute => {
        attrName = attribute.name;
        attrValue = attribute.value.trim();

        if (attrName.indexOf(bindSymbol) === 0 && attrValue !== '') {
            directiveName = attrName.slice(bindSymbol.length);

            this.bindDirective({
                node,
                expression: attrValue,
                name: directiveName,
            });
            node.removeAttribute(attrName);
        } else {
            this.bindAttribute(node, attribute);
        }
    });
};


Compile.prototype.bindDirective = function (options) {
    new Directive({
        ...options,
        compile: this,
    });
};

Compile.prototype.bindAttribute = function (node, attribute) {
    if (!hasInterpolation(attribute.value) || attribute.value.trim() == '') return false;

    this.bindDirective({
        node,
        name: 'attribute',
        expression: parse.text(attribute.value),
        attrName: attribute.name,
    });
};

Compile.compile.textNodes = function (node) {
    if (node.textContent.trim() === '') return false;

    this.bindDirective({
        node,
        name: 'text',
        expression: parse.text(node.textContent),
    });
};


const each = {
    beforeUpdate() {
        this.placeholder = document.createComment(`:each`);
        this.node.parentNode.replaceChild(this.placeholder, this.node);
    },
    update() {
        if (data && !Array.isArray(data)) return;

        const fragment = document.createDocumentFragment();

        data.map((item, index) => {
            const compiled = Compile(this.node.cloneNode(true), { item, index, });
            fragment.appendChild(compiled.view);
        });

        this.placeholder.parentNode.replaceChild(fragment, this.placeholder);
    },
}

const forin = {
    beforeUpdate() {
        this.placeholder = document.createComment(`:each`);
        this.node.parentNode.replaceChild(this.placeholder, this.node);

        // parse alias
        this.itemName = `item`;
        this.indexName = `index`;
        this.dataName = this.expression;

        if (this.expression.indexOf(' in ') != -1) {
            const bracketRE = /\(((?:.|\n)+?)\)/g;
            const [item, data] = this.expression.split(' in ');
            let matched = null;

            if (matched = bracketRE.exec(item)) {
                const [item, index] = matched[1].split(',');
                index ? this.indexName = index.trim() : '';
                this.itemName = item.trim();
            } else {
                this.itemName = item.trim();
            }

            this.dataName = data.trim();
        }

        this.expression = this.dataName;
    },
    update() {
        if (data && !Array.isArray(data)) return;

        const fragment = document.createDocumentFragment();

        data.map((item, index) => {
            const compiled = Compile(this.node.cloneNode(true), {
                [this.itemName]: item,
                [this.indexName]: index,
            });
            fragment.appendChild(compiled.view);
        });

        this.placeholder.parentNode.replaceChild(fragment, this.placeholder);
    },
}

const directives = {
    // directive `:show`
    show: {
        beforeUpdate() {},
        update(show) {
            this.node.style.display = show ? `block` : `none`;
        },
    },
    // directive `:text`
    text: {
        beforeUpdate() {},
        update(value) {
            this.node.textContent = value;
        },
    },
    each:each,
    forin:forin
}

const tagRE = /\{\{((?:.|\n)+?)\}\}/g;
function parse(text) {
    if (!tagRE.test(text)) return JSON.stringify(text);

    const tokens = [];
    let lastIndex = tagRE.lastIndex = 0;
    let index, matched;

    while (matched = tagRE.exec(text)) {
        index = matched.index;
        if (index > lastIndex) {
            tokens.push(JSON.stringify(text.slice(lastIndex, index)));
        }
        tokens.push(matched[1].trim());
        lastIndex = index + matched[0].length;
    }

    if (lastIndex < text.length) tokens.push(JSON.stringify(text.slice(lastIndex)));

    return tokens.join('+');
}

// parse(`Hi {{ user.name }}, {{ colon }} is awesome.`);
// => 'Hi ' + user.name + ', ' + colon + ' is awesome.'

const dependencyRE = /"[^"]*"|'[^']*'|\.\w*[a-zA-Z$_]\w*|\w*[a-zA-Z$_]\w*:|(\w*[a-zA-Z$_]\w*)/g;
const globals = [
    'true', 'false', 'undefined', 'null', 'NaN', 'isNaN', 'typeof', 'in',
    'decodeURI', 'decodeURIComponent', 'encodeURI', 'encodeURIComponent', 'unescape',
    'escape', 'eval', 'isFinite', 'Number', 'String', 'parseFloat', 'parseInt',
];

function extractDependencies(expression) {
    const dependencies = [];

    expression.replace(dependencyRE, (match, dependency) => {
        if (
            dependency !== undefined &&
            dependencies.indexOf(dependency) === -1 &&
            globals.indexOf(dependency) === -1
        ) {
            dependencies.push(dependency);
        }
    });

    return dependencies;
}

// extractDependencies(`typeof String(name) === 'string'  && 'Hello ' + world + '! ' + hello.split('').join('') + '.'`);
// => ["name", "world", "hello"]

function generate(expression) {
    const dependencies = extractDependencies(expression);
    let dependenciesCode = '';

    dependencies.map(dependency => dependenciesCode += `var ${dependency} = this.get("${dependency}"); `);

    return new Function(`data`, `${dependenciesCode}return ${expression};`);
}

function Directive(options = {}) {
    Object.assign(this, options);
    Object.assign(this, directives[this.name]);
    this.beforeUpdate && this.beforeUpdate();
    this.update && this.update(generate(this.expression)(this.compile.options.data));
}


const compiled = Compile(`<h1>Hey  , {{ content }}</h1>`, {
    content: `Hello World`,
})

compiled.view


Compile(`<li :each="comments" data-index="{{ index }}">{{ item.content }}</li>`, {
    comments: [
        {content: `Hello World.`},
        {content: `Just Awesome.`},
        {content: `WOW, Just WOW!`}
    ]
});

//<li data-index="0">Hello World.</li>
//<li data-index="1">Just Awesome.</li>
//<li data-index="2">WOW, Just WOW!</li>

Compile(`<li :forin="(item, key) in comments" data-index="{{ key }}">{{ item.content }}</li>`, {
    comments: [
        {content: `Hello World.`},
        {content: `Just Awesome.`},
        {content: `WOW, Just WOW!`}
    ]
});