//Fixed 修复对注释的解析
//Fixed 对input img替换元素的支持
//Add 支持if else-if else指令
//Add 增加n-model双向绑定
(function(global, Component) {
	//CMD
	if (typeof module == 'object' && typeof module.exports == 'object' && exports) {
		module.exports = Component;
	} else if (typeof define == 'function' && define.amd) {
		//AMD
		define([], function() {
			return Component
		});
	}
	//browser or node
	global.Component = Component;
})(this, (function() {
	function mutateArray(array) {
		var mutator = Object.create(Array.prototype);
		Object.defineProperties(mutator, {
			mutateFns: {
				value: {},
				enumberable: false
			},
			$inject: {
				value: function(type, injector) {
					(this.mutateFns[type] === undefined) ? this.mutateFns[type] = []: undefined;
					this.mutateFns[type].push(injector);
				},
				enumberable: false
			},
			pop: {
				value: function() {
					[].pop.call(this);
					console.log('The length of the array has decreased');
				},
				enumberable: false
			},
			push: {
				value: function(v) {
					var item = mutateVar(this.length, v);
					new Observer(item);
					Object.defineProperty(this, this.length, {
						get: function() {
							return item;
						},
						set: function(newVal) {
							item = newVal;
						}
					})
					this.length++;
					// [].push.call(this, item);
					console.log('The length of the array has increased');
					if (!this.mutateFns['push']) {
						return;
					}
					for (var i = 0; i < this.mutateFns['push'].length; i++) {
						this.mutateFns['push'][i](item);
					};
				},
				enumberable: false
			}
		})

		function mutateVar(i, value) {
			var item = {
				id: i
			};
			if (typeof value == 'object') {
				Object.assign(item, value)
			} else {
				item['val'] = value;
			}
			return item;
		}
		for (var i = 0; i < array.length; i++) {
			var value = array[i];
			mutator[i] = mutateVar(i, value);
		};
		Object.defineProperty(mutator, 'length', {
			enumberable: false,
			get: function() {
				return i;
			},
			set: function(newVal) {
				i = newVal;
			}
		})
		return mutator;
	}

	function Watcher(cb) {
		this.cb = cb || function() {};
		this.dep = 0;
		this.diff = 0;
	}
	var Observer = function Observer(v) {
		this.v = v;
		this.walk(v);
	}
	Observer.prototype.walk = function walk(value) {
		for (var k in value) {
			if (value.hasOwnProperty(k)) {
				if ((typeof value[k]) == 'object' && !Array.isArray(value[k])) {
					new Observer(value[k]);
				} else if (Array.isArray(value[k])) {
					value[k] = mutateArray(value[k]);
					new Observer(value[k]);
				}
				this.convert(k, value[k]);
			}
		}
		Object.defineProperty(this.v, '__observer__', {
			value: this,
			enumberable: false
		})
		// this.v.__observer__ = this;
	}
	Observer.prototype.convert = function convert(k, v) {
		var o = this.v;
		var self = this;
		Object.defineProperty(o, k, {
			get: function() {
				return v;
			},
			set: function(newVal) {
				if (typeof newVal == 'object') {
					new Observer(newVal)
				}
				v = newVal;
				self.nofity(k, newVal);
			}
		})
	}
	Observer.prototype.watch = function watch(ev, callback) {
		this[ev] ? undefined : this[ev] = [];
		//Fixed
		if (callback instanceof Watcher) {
			this[ev].splice(this.dep, 0, callback);
		} else {
			this[ev].push(callback);
		}
	}
	Observer.prototype.nofity = function notify(k, v) {
		if (this[k]) {
			for (var i = 0; i < this[k].length; i++) {
				if (this[k][i] instanceof Watcher) {
					this[k][i].cb(v);
					continue;
				}
				this[k][i](v);
			};
		}
	}
	/**
	 * [VNode constructor]
	 */
	var VNode = function() {
		this.tag = '',
			this.props = {};
		this.methods = {};
		this.children = [];
	}
	VNode.prototype.render = function() {
		//TODO...
		var tnode;
		if (this.tag != '#text') {
			tnode = document.createElement(this.tag);
			for (var p in this.props) {
				tnode.setAttribute(p, this.props[p]);
			}
			for (var i = 0; i < this.children.length; i++) {
				tnode.appendChild(this.children[i].render());
			};
			//Add 双向绑定
			if (this.biBind) {
				if (this.tag != 'input' && this.tag !== 'textarea') {
					console.warn('ele which n-model are not input or textarea');
				} else {
					var self = this;
					tnode.value = this.initVal;
					self.$p.__observer__.watch(self.biBind, new Watcher(function(v) {
						self.initVal = v;
						tnode.value = v;
					}));
					//tnode注册onkeyup事件
					tnode.onkeyup = function(e) {
						self.$p[self.biBind] = tnode.value;
					}
				}
			}
			return tnode;
		} else if (this.tag == '#text') {
			tnode = document.createTextNode(this.tag);
			tnode.nodeValue = this.content;
		}
		return tnode;
	}
	VNode.prototype.clone = function() {
		var vnode = new VNode();
		vnode.tag = this.tag;
		if (this.tag == '#text') {
			vnode.content = this.content;
		}
		for (var p in this.props) {
			vnode.props[p] = this.props[p];
		}
		for (var m in this.methods) {
			vnode.methods[m] = this.methods[m];
		}
		for (var i = 0; i < this.children.length; i++) {
			vnode.children.push(this.children[i].clone());
		};
		return vnode;
	}
	VNode.prototype.removeChild = function(child) {
		//TODO...
	}
	//删除第index个子元素
	VNode.prototype.remove = function(index) {
		this.children.splice(index, 1);
	}
	//在index处插入元素
	VNode.prototype.insert = function(index, vnode) {
		this.children.splice(index, 0, vnode);
	}
	VNode.prototype.insertBefore = function(newVNode, refVNode) {
		//TODO...
	}
	/*
	 * [diff]
	 * @param  {old virtual} oldVNode 
	 * @param  {new virtual node} newVNode
	 * @return {patches}
	 * D delete opreate
	 * I insert opreate
	 * S substitute opreate
	 * PROP props change
	 * S-TEXT
	 */
	function diff(oldVNode, newVNode) {
		if (typeof oldVNode == 'undefined') {
			throw new Error('missing the first parameter');
		}
		if (typeof newVNode == 'undefined') {
			throw new Error('missing the second parameter');
		}
		var patches = [];
		var walker = {
			index: 0
		}
		diffWalk(oldVNode, newVNode, patches, walker);
		return patches;
	}

	function diffWalk(oldVNode, newVNode, patches, walker) {
		if (oldVNode.tag != newVNode.tag) {
			//if tag of old root vnode different from tag of new root vnode
			patches[walker.index] = [{
				type: 'S',
				from: oldVNode,
				to: newVNode
			}];
			return patches;
		} else {
			var patch;
			if (oldVNode.tag == '#text' && newVNode.tag == '#text') {
				if (oldVNode.content != newVNode.content) {
					patch = {
						type: 'S-TEXT',
						node: oldVNode,
						content: newVNode.content
					};
				}
				insertPatch(patches, walker.index, patch);
			} else if (oldVNode.tag != '#text' && newVNode.tag == '#text') {
				patch = {
					type: 'S',
					from: oldVNode,
					to: newVNode,
				};
				insertPatch(patches, walker.index, patch);
			} else if (oldVNode.tag == '#text' && newVNode.tag != '#text') {
				patch = {
					type: 'S',
					from: oldVNode,
					to: newVNode,
				};
				insertPatch(patches, walker.index, patch);
			} else {
				//diff props
				var patch = diffProps(oldVNode, newVNode);
				insertPatch(patches, walker.index, patch);
				diffChildren(oldVNode.children, newVNode.children, patches, walker);
			}
		}
	}

	function insertPatch(patches, index, patch) {
		if (patch && isArray(patches[index])) {
			patches[index].push(patch);
		} else if (patch && !isArray(patches[index])) {
			patches[index] = [];
			patches[index].push(patch);
		} else if (!patch && !isArray(patches[index])) {
			patches[index] = void undefined;
		}
	}
	/**
	 * [diffChildren]
	 * @param  {array of old virtual child} oldChildren 
	 * @param  {array of new virtual child} newChildren 
	 * @param  {[]} patches
	 */
	function diffChildren(oldChildren, newChildren, patches, walker) {
		var listDiff = diffList(oldChildren, newChildren);
		var notAlter = listDiff.notAlter;
		var moves = listDiff.patches;;
		if (oldChildren.length) {
			for (var i = 0; i < oldChildren.length; i++) {
				walker.index++;
				if (moves[i]) {
					//if moves[i] exsit
					patches[walker.index] = moves[i];
				}
				if (notAlter[i]) {
					diffWalk(oldChildren[notAlter[i].oldIndex], newChildren[notAlter[i].newIndex], patches, walker);
				}
			};
		} else {
			walker.index++;
			if (moves[i]) {
				//if moves[i] exsit
				patches[walker.index] = moves[i];
			}
			if (notAlter[i]) {
				diffWalk(oldChildren[notAlter[i].oldIndex], newChildren[notAlter[i].newIndex], patches, walker.index);
				return
			}
			// Fixed 修复 如果moves[i]与notAlter[i]都不存在,walker.index回退
			walker.index--;
		}
	}

	/**
	 * [diffProps description]
	 * @param  {old virtual node} oldVNode [description]
	 * @param  {new virtual node} newVNode [description]
	 * @return {diff props}          [description]
	 */
	function diffProps(oldVNode, newVNode) {
		var type = 'PROP';
		var patches = [];
		var oldProps = oldVNode.props;
		var newProps = newVNode.props;
		var allProps = Object.keys(Object.assign({}, oldProps, newProps));
		for (var i = 0; i < allProps.length; i++) {
			if (!oldProps[allProps[i]] && newProps[allProps[i]]) {
				patches.push({
					type: 'I',
					prop: allProps[i],
					value: newProps[allProps[i]]
				})
			} else if (oldProps[allProps[i]] && !newProps[allProps[i]]) {
				patches.push({
					type: 'D',
					prop: allProps[i],
					value: oldProps[allProps[i]]
				})
			} else {
				if (oldProps[allProps[i]] != newProps[allProps[i]]) {
					patches.push({
						type: 'S',
						prop: allProps[i],
						value: newProps[allProps[i]]
					})
				}
			}
		};
		if (patches.length) {
			return {
				type: type,
				patches: patches
			}
		}
	}

	function diffList(oldList, newList) {
		//check if old list has key
		var oldKeys = keySet(oldList);
		var newKeys = keySet(newList);
		var M = oldKeys.length;
		var N = newKeys.length;
		var notAlter = []; // the nodes not alter
		var D = [];
		var patches = []; //list move patches
		//init
		for (var i = 0; i <= M; i++) {
			D[i] = [];
			D[i][0] = i;
		};
		for (var i = 0; i <= N; i++) {
			D[0][i] = i;
		};

		for (var i = 1; i <= M; i++) {
			for (var j = 1; j <= N; j++) {
				if (oldKeys[i - 1] == newKeys[j - 1] && oldList[i - 1].tag == newList[j - 1].tag) {
					D[i][j] = Math.min.apply(null, [D[i - 1][j] + 1, D[i][j - 1] + 1, D[i - 1][j - 1]]);
				} else {
					D[i][j] = Math.min.apply(null, [D[i - 1][j] + 1, D[i][j - 1] + 1, D[i - 1][j - 1] + 2]);
				}
			};
		};
		//calcuate patch
		function calcuPatch(m, n) {
			var nextM, nextN;
			var type, from, to, oldIndex, newIndex, min;
			if (m == 0 || n == 0) {
				return;
			}
			if (oldKeys[m - 1] == newKeys[n - 1]) {
				min = D[m - 1][n - 1];
				nextM = m - 1;
				nextN = n - 1;
				type = 'N';
			}
			if (D[m][n] == D[m - 1][n - 1] + 2) {
				if (D[m - 1][n] < min || min === undefined) {
					min = D[m - 1][n - 1];
					nextM = m - 1;
					nextN = n - 1;
					type = 'S';
					from = oldList[m - 1];
					to = newList[n - 1];
				}
			}
			if (D[m][n] == D[m - 1][n] + 1) {
				if (D[m - 1][n] < min || min === undefined) {
					min = D[m - 1][n];
					nextM = m - 1;
					nextN = n;
					type = 'D';
					from = oldList[m - 1];
					to = null;
				}
			}
			if (D[m][n] == D[m][n - 1] + 1) {
				if (D[m][n - 1] < min || min === undefined) {
					nextM = m;
					nextN = n - 1;
					type = 'I';
					from = null;
					to = newList[n - 1];
				}
			}
			oldIndex = m - 1;
			newIndex = n - 1;
			if (type != 'N') {
				patches.push({
					type: type,
					from: from,
					to: to,
					index: oldIndex
				});
			} else {
				notAlter.push({
					oldIndex: oldIndex,
					newIndex: newIndex
				});
			}
			calcuPatch(nextM, nextN);
		}
		calcuPatch(M, N);
		//get not alter vnode
		//arrange pathces and notAlter
		var currentPatches = {};
		var currentNotAlter = {};
		patches.reverse().forEach(function(item) {
			if (!currentPatches[item.index]) {
				currentPatches[item.index] = [];
				currentPatches[item.index].push(item);
			} else {
				currentPatches[item.index].push(item);
			}
		});
		notAlter.reverse().forEach(function(item) {
			currentNotAlter[item.oldIndex] = item;
		})
		return {
			patches: currentPatches,
			notAlter: currentNotAlter
		}
	}

	function keySet(items) {
		var set = [];
		for (var i = 0; i < items.length; i++) {
			var key = getKey(items[i]);
			set.push(key);
		};
		return set;
	}

	function getKey(item) {
		if (item.key) {
			return item.key;
		}
		return void 666;
	}

	function isArray(o) {
		return Array.isArray ? Array.isArray(o) : Object.prototype.toString.call(o) == '[object Array]';
	}
	/**
	 * applyPatches function
	 * @param  {old virtual node} oldVNode
	 * @param  {array  of patch} patches
	 */
	function toApplyPaches(oldNode, patches) {
		var walker = {
			index: 0
		};
		dfsApplyWalk(oldNode, patches, walker);
	}

	function dfsApplyWalk(oldNode, patches, walker) {
		//if paches[walker.index]
		var childs = oldNode.childNodes;
		var step = 0;
		if (patches[walker.index]) {
			patches[walker.index].forEach(function(patch) {
				step += applyPatch(oldNode, patch);
			});
		}
		walker.index++;
		if (childs) {
			for (var i = 0, len = childs.length; i < len; i++) {
				i += dfsApplyWalk(childs[i], patches, walker);
				//update len;
				len = childs.length;
			};
		}
		return step;
	}

	function applyPatch(oldNode, patch) {
		switch (patch.type) {
			case 'I':
				var ele = renderElement(patch.to);
				oldNode.parentNode.insertBefore(ele, oldNode.nextSibling);
				return 1;
			case 'D':
				oldNode.parentNode.removeChild(oldNode);
				return -1;
			case 'S':
				var newNode = renderElement(patch.to);
				oldNode.parentNode.replaceChild(newNode, oldNode);
				return 0;
			case 'S-TEXT':
				console.log(oldNode.parentNode)
				oldNode.textContent = patch.content;
				return 0;
			case 'PROP':
				setProps(oldNode, patch.patches);
				return 0;
			default:
				throw new Error('type is error')
		}

	}
	/**
	 * [renderElement]
	 * @param  {virtual node} vNode
	 * @return {DOM}
	 */
	function renderElement(vNode) {
		var ele;
		if (vNode.tag != '#text') {
			ele = document.createElement(vNode.tag);
		} else {
			ele = document.createTextNode(vNode.content)
		}
		for (var prop in vNode.props) {
			ele.setAttribute(prop, vNode.props[prop]);
		}
		vNode.children.forEach(function(child) {
			ele.appendChild(renderElement(child));
		});
		return ele;
	}
	/**
	 * [setProps]
	 * @param {old dom} oldNode
	 * @param {props patches} propPatches
	 */
	function setProps(oldNode, propPatches) {
		propPatches.forEach(function(patch) {
			switch (patch.type) {
				case 'S':
					oldNode.setAttribute(patch.prop, patch.value);
					break;
				case 'I':
					oldNode.setAttribute(patch.prop, patch.value);
					break;
				case 'D':
					oldNode.removeAttribute(patch.prop);
					break;
				default:
					throw new Error('prop type is error');
			}
		});
	}

	function Path(data, root) {
		this.data = data;
		this.cache = {};
		this.root = root;
	}
	Path.prototype.find = function(untreatKey, alias, exp) {

		if (this.cache[untreatKey]) {
			return this.cache[untreatKey];
		}
		if (untreatKey.charAt(0) == '.') {
			alias === undefined ? untreatKey += 'this' : untreatKey += alias;
		}
		var o = this.data;
		var p = this.data;
		var ks = untreatKey.split('.');
		if (alias != undefined && ks[0] != alias) {
			return new Path(this.root, this.root).find(untreatKey);
		}
		for (var i = 0; i < ks.length; i++) {
			if (ks[0] == 'this' || ks[0] == alias) {
				continue;
			}
			p = o;
			o = o[ks[i]];
		};
		this.cache[untreatKey] = {
			p: p,
			o: (o == undefined ? '' : o),
			arg: ks[ks.length - 1]
		}
		if (exp) {
			this.cache[untreatKey].exp = exp;
		}
		//如果o为空字符串
		//尝试把untreatKey能作为表达式运行
		if (o === undefined) {
			try {
				return {
					arg: (new Function([], 'return ' + untreatKey))(),
					recalcu: true
				}
			} catch (err) {
				//如果运行错误
				var mayVar = this.resolveErr(err.toString());
				if (mayVar != untreatKey) {
					return this.find(mayVar, undefined, untreatKey);
				} else {
					return this.cache[untreatKey];
				}
			}
		} else {
			return this.cache[untreatKey];
		}
	}
	//解析错获取未定义的变量的名字
	Path.prototype.resolveErr = function(err) {
		return err.replace(/ReferenceError\s*:\s*/g, '').match(/^\S*\s/)[0].trim();
	}

	function parseHTML(html) {
		var commentReg = /<!--\s*.*\s*-->/g;
		var startEndReg = /(<[^\/][^<]+("[^\n]*")*>|<\/[^\/>]+>)/g;
		var startReg = /<[^\/][^<]+("[^\n]*")*>/;
		var endReg = /<\/[^\/>]+>/;
		var tagReg = /^<\/?([^\s]+)(>|\s)/;
		var propReg = /\s*(((n-bind|n-on)?:[^\s=]+)="([^\s=]+)")|(([^\s=]+)="([^\r\t\n"]+)")|(n-else)/g;
		//Fixed 去掉了=号的约束 
		//Fixed "号导致的BUG,这样导致如果在n-if等中表达式涉及字符串的话使用单引号
		var mustachReg = /\{\{\s*([^\s]*)\s*\}\}/g;
		var startMatch;
		var lastIndex = 0;
		var tagStack = [];
		var root;
		//Fixed 去掉注释
		html = html.replace(commentReg, '');
		while ((startMatch = startEndReg.exec(html))) {
			var tag;
			var attrMap = {};
			if (lastIndex == 0) {
				lastIndex = startMatch.index + startMatch[0].length;
			} else {
				var inline = html.substring(lastIndex, startMatch.index);
				inline = inline.replace(/\n/g, '\\n').replace(/\t/g, '\\t');
				var text = inline;
				var expression = '\"' + inline.replace(mustachReg, function($1) {
					return '\" + s(\"' + $1.replace(/(\{|\{|\s)/g, '').replace(/(\}|\}|\s)/g, '') + '\") + \"';
				}) + '\"';
				var textNode = {
					tag: '#text',
					text: text,
					expression: expression
				}
				if (tagStack.length) {
					tagStack[tagStack.length - 1].children.push(textNode);
				} else {
					root.children.push(textNode)
				}
				lastIndex = startMatch.index + startMatch[0].length;
			}
			if (startReg.test(startMatch[0])) {
				tag = startMatch[0].match(tagReg)[1];
				if (startMatch[0].match(propReg)) {
					startMatch[0].match(propReg).forEach(function(boundProp) {
						if (boundProp == 'n-else') {
							attrMap[boundProp] = 'n-else';
							return;
						}
						var seg = boundProp.indexOf('=');
						attrMap[boundProp.substring(0, seg).trim()] = boundProp.substring(seg + 1, boundProp.length).replace(/"/g, '');
					})
				}
				var astNode = {
					tag: tag,
					attrMap: attrMap,
					children: [],
					parent: null
				}
				if (tagStack.length) {
					astNode.parent = tagStack[tagStack.length - 1];
					tagStack[tagStack.length - 1].children.push(astNode);
					if (astNode.tag != 'img' && astNode.tag != 'input') {
						tagStack.push(astNode);
					}
				}
				if (!tagStack.length && !root) {
					root = astNode;
					tagStack.push(astNode);
				}
			} else if (endReg.test(startMatch[0])) {
				tag = startMatch[0].match(tagReg)[1];
				var popAstNode = tagStack.pop();
				if (tag != popAstNode.tag) {
					throw new Error('err');
				}
			}
		}
		return root;
	}

	function parse(ast, options, parent) {
		var ob = new Observer(options.data);
		//向mutatorArray注入push
		function compileToPush(p, ast, dfsFn, mutatorArray, alias) {
			ast.ignoreFor = true;
			mutatorArray.$inject('push', function(v) {
				var child = dfsFn(ast, {
					data: v,
					alias: alias,
					root: options.root
				}, p)
				var text = p.children.pop();
				p.children.push(child);
				p.children.push(text);
			});
			mutatorArray.$inject('push', function() {
				options.root.diff();
			});
		}
		//if托管 单例
		//iftor []
		//ifblock {keyword, ast, parent, path} [if语句块]
		var IfTrustee = {
			cur: 0,
			iftors: [],
			valve: true,
			put: function(iftor) {
				this.iftors.push(iftor);
				this.valve = false;
			},
			signal: function(ast) {
				if (this.iftors[this.cur] && !this.valve) {
					this.valve = true;
					this.compileIftor();
					this.cur++;
				}
			},
			insert: function(keyword, ifblock) {
				if (!this.iftors[this.cur]) {
					return;
				}
				this.iftors[this.cur].push({
					keyword: keyword,
					ifblock: ifblock
				});
			},
			compileIftor: function() {
				var fnBody = '';
				var k = -1;
				var asts = [];
				var arg, order, parent, p, o, root, recalcu;
				this.iftors[this.cur].forEach(function(item) {
					k++;
					var ifb = item.ifblock;
					var ifr = ifb.path.find(ifb.ast.attrMap['n-' + item.keyword]);
					if (ifr.recalcu) {
						recalcu = ifr.recalcu;
					}
					if (!p) {
						p = ifr.p;
						o = ifr.o;
					}
					if (!arg) {
						arg = ifr.arg;
					}
					if (!parent) {
						parent = ifb.parent;
					}
					if (!order) {
						order = ifb.order;
					}
					if (!root) {
						root = ifb.options.root;
					}
					asts.push({
						ast: ifb.ast,
						options: ifb.options
					});
					switch (item.keyword) {
						case 'if':
							fnBody += 'if (' + (ifr.exp ? ifr.exp : ifr.arg) + ') {\n' +
								'\tvar i = ' + k + ';\n' +
								'\treturn ' + 'new dfsfn(asts[i].ast, asts[i].options, parent, order);\n' +
								'}';
							break;
						case 'else-if':
							fnBody += 'else if (' + (ifr.exp ? ifr.exp : ifr.arg) + ') {\n' +
								'\tvar i = ' + k + ';\n' +
								'\t' + 'return ' + 'new dfsfn(asts[i].ast, asts[i].options, parent, order);\n' +
								'}';
							break;
						case 'else':
							fnBody += 'else {\n' +
								'\tvar i = ' + k + ';\n' +
								'\t' + 'return ' + 'new dfsfn(asts[i].ast, asts[i].options, parent, order);\n' +
								'}';
							break;
						default:
							throw new Error(item.keyword + ' is not one of [if, else-if, else]');
					}
				});
				if (recalcu) {
					var _fn = new Function('arg', 'asts', 'dfsfn', 'options', 'parent', 'order', fnBody);
				} else {
					var _fn = new Function(arg, 'asts', 'dfsfn', 'options', 'parent', 'order', fnBody);
				}

				function ifRecalucte(v) {
					return _fn(v, asts, dfsToCreateVNode, parent, order);
				}
				var child = ifRecalucte(o);
				if (child) {
					parent.insert(order, child)
				}
				if (recalcu) {
					return;
				}
				var preChild = child;
				p.__observer__.watch(arg, function(v) {
					//Fixed 当n-if绑定的值不变时,不进行处理v
					if (o == v) {
						console.log(arg + ' is not change');
						return;
					} else {
						var child = ifRecalucte(v);
						if (typeof child == 'undefined' && typeof preChild != 'undefined') {
							//remove
							parent.remove(order);
							root.diff.bind(root)();
						} else if (typeof preChild == 'undefined' && typeof child != 'undefined') {
							//replace
							parent.insert(order, child);
							//触发diff
							root.diff.bind(root)();
						}
						o = v;
						preChild = child;
					}
				});
			}
		}

		function dfsToCreateVNode(ast, options, parent, order) {
			var path = new Path(options.data, options.root);
			var vnode = new VNode();
			vnode.tag = ast.tag;
			vnode.order = order;
			vnode.parent = parent;
			if (ast.tag == '#text') {
				if (!ast.text.trim()) {
					IfTrustee.signal(ast); //向if托管器发送终结信号
				}
				vnode.text = ast.text;
				vnode.content = '';
				if (ast.expression) {
					var isBind = {};
					var _i = 0;

					function calculate() {
						function s(args) {
							var r = path.find(args, options.alias);
							if (!r.o) {
								return '';
							}
							var ob = r.p.__observer__;
							if (!isBind[r.arg]) {
								isBind[r.arg] = true;
								ob.watch(r.arg, new Watcher(calculate));
								if (!ob.diff) {
									//Fixed 修复 保证diff操作只加载一次
									ob.watch(r.arg, options.root.diff.bind(options.root));
									ob.diff = 1;
								}
							}
							return ob.v[r.arg];
						}
						var fn = new Function(['s'], 'return ' + ast.expression);
						vnode.content = fn(s);
					}
					calculate();
				}
				return vnode;
			}
			if (ast.attrMap['n-for'] && !ast.ignoreFor) {
				IfTrustee.signal(); //向if托管器发送终结信号
				var forAttr = ast.attrMap['n-for'].match(/\s*([^\s]+)\s+in\s+([^\s]+)\s*/)[2];
				var alias = ast.attrMap['n-for'].match(/\s*([^\s]+)\s+in\s+([^\s]+)\s*/)[1];
				var vnodes = [];
				var functionBody = 'for (var ' + ast.attrMap['n-for'] + ')' + '{\n' +
					'vnodes.push(' + 'new VNode()' + ');\n' +
					'}';
				var ff = new Function(forAttr, 'vnodes', 'VNode', functionBody);
				var forObj = path.find(forAttr).o;
				ff(forObj, vnodes, VNode);
				for (var i = 0; i < vnodes.length; i++) {
					vnodes[i].parent = parent;
					vnodes[i].order = i + 1;
					vnodes[i].tag = ast.tag;
					for (var p in ast.attrMap) {
						if (p != 'n-for') {
							vnodes[i].props[p] = ast.attrMap[p];
						}
					}
					for (var j = 0; j < ast.children.length; j++) {
						var child = dfsToCreateVNode(ast.children[j], {
							data: forObj[i],
							alias: alias,
							root: options.root
						}, vnodes[i], j);
						if (Array.isArray(child)) {
							vnodes[i].children = vnodes[i].children.concat(child);
						} else if (child !== null) {
							vnodes[i].children.push(child);
						}
					};
				};
				compileToPush(parent, ast, dfsToCreateVNode, forObj, alias, i + 1);
				return vnodes;
			}
			if (ast.attrMap['n-if'] && !ast.ignoreIf) {
				IfTrustee.signal(); //向if托管器发送终结信号
				IfTrustee.put([]); //插入新的iftor
				//构造ifblock
				/*keyword, ast, parent, path*/
				IfTrustee.insert('if', {
					ast: ast,
					parent: parent,
					path: path,
					options: options,
					order: order
				});
				ast.ignoreIf = true;
				return null;
			}
			if (ast.attrMap['n-else'] && !ast.ignoreElse) {
				//构造ifblock
				///*keyword, ast, parent, path*/
				if (!IfTrustee.valve) {
					IfTrustee.insert('else', {
						ast: ast,
						parent: parent,
						path: path,
						options: options,
						order: order
					});
					ast.ignoreElse = true;
					IfTrustee.signal(); //向if托管器发送终结信号
					return null;
				}
			}
			if (ast.attrMap['n-else-if'] && !ast.ignoreElseIf) {
				IfTrustee.insert('else-if', {
					ast: ast,
					parent: parent,
					path: path,
					options: options,
					order: order
				});
				ast.ignoreElseIf = true;
				return null;
			}
			if (ast.tag == 'input') {
				console.log(order)
			}
			//对虚拟node进行属性赋值
			var ifFlag = false;
			for (var prop in ast.attrMap) {
				if (prop == 'n-for') {
					continue;
				}
				if (prop == 'n-if' || prop == 'n-else') {
					ifFlag = true;
					continue;
				}
				if (/(^:\S*|^n-bind:\S*|n-model)/.test(prop)) {
					var _pv = ast.attrMap[prop];
					var _p = prop.split(':')[1];
					var r = path.find(_pv);
					var ob = r.p.__observer__;
					if (prop == 'n-model') {
						vnode.biBind = 'message';
						vnode.$p = r.p; //获取的上一层对象
						vnode.initVal = r.o;
						continue;
					}

					function setBindAttr() {
						vnode.props[_p] = ob.v[_pv];
						options.root
					}
					ob.watch(_pv, setBindAttr);
					ob.watch(_pv, options.root.diff.bind(options.root));
					vnode.props[_p] = r.o;
					continue;
				}
				vnode.props[prop] = ast.attrMap[prop];
			}
			for (var i = 0; i < ast.children.length; i++) {
				var child = dfsToCreateVNode(ast.children[i], {
					data: options.data,
					alias: options.alias,
					root: options.root
				}, vnode, i);
				if (Array.isArray(child)) {
					vnode.children = vnode.children.concat(child);
				} else if (child !== null) {
					vnode.children.push(child);
				}
			};
			if (!ifFlag) {
				IfTrustee.signal(); //向if托管器发送终结信号
			}
			return vnode;
		}
		// function 
		var vtree = dfsToCreateVNode(ast, options, null, 0);
		return vtree;
	}
	/**
	 * [Component 组件]
	 * @param options [object]
	 */
	var Component = function(options) {
		if (!options.el) {
			throw new Error('el must be a not empty string');
		}
		//如果options.data属性存在且为object,那么将它绑定到Component实例上
		if (Object.prototype.toString.call(options.data) == '[object Object]') {
			Object.assign(this, options.data);
		}
		//如果options.method属性存在且为object,那么将它绑定到Component实例上
		if (Object.prototype.toString.call(options.method) == '[object Object]') {
			Object.assign(this, {
				$method: options.method
			});
		}
		this.id = '';
		this.initVComponent(options.el);
	}
	Component.prototype.initVComponent = function(el) {
		var _el;
		if (/^#/.test(el)) {
			_el = el.replace(/^#/, '');
		}
		var html = document.getElementById(_el).outerHTML;
		var root = parse(parseHTML(html), {
			data: this,
			alias: undefined,
			root: this
		});
		this.$newVNode = root;
		console.log(root)
		this.$oldVNode = root.clone();
		var oldRoot = document.getElementById(_el);
		oldRoot.parentNode.insertBefore(root.render(), oldRoot)
		oldRoot.parentNode.removeChild(oldRoot);
	}
	Component.prototype.diff = function() {
		var patches = diff(this.$oldVNode, this.$newVNode);
		console.log(patches)
		this.$oldVNode = this.$newVNode.clone();
		toApplyPaches(document.getElementById('app'), patches);
	}

	return Component;
})());
