//polyfill bind
function polyfill() {
	if (Function.prototype.bind) {
		Function.prototype.bind = function(o) {
			var self = this;
			var args = Array.prototype.slice.call(arguments, 1) || [];
			var bound = function() {
				return self.apply((
					(!this || this == window || this == global) ? o : this
				), args.concat(Array.prototype.slice.call(arguments, 1)));
			}

			return bound;
		}
	}
}
