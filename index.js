module.exports = class FormValidatorES6{
	constructor(form, valid_class="valid_field", error_class="error_field", feedback_class="feedback_field", extra_methods=null, feedback_method=null){
		this.form = (form.tagName) ? form : form[0];
		this.valid_class = valid_class;
		this.error_class = error_class;
		this.feedback_class = feedback_class;

		for(var callback in extra_methods){
			this[callback] = extra_methods[callback];
		}

		if (feedback_method){
			this.feedback = feedback_method;
		}else{
			this.feedback = (el, cont, message) => {
				if (el.type=='checkbox'){
					console.log(el, cont, message);
				}
				var feedback_div = el.parentNode.querySelector('div.validation-feedback-message');
				if (feedback_div){
					feedback_div.parentNode.removeChild(feedback_div);
				}
				if (!cont){
					feedback_div = document.createElement('div');
					feedback_div.className = "validation-feedback-message "+this.feedback_class;
					feedback_div.innerHTML = message;
					el.parentNode.appendChild(feedback_div);
				}
			};
		}
	}
	
	validate(){
		var cont = true;
		var errs = [];
		var elements = this.form.querySelectorAll('*[data-validation]');
		for(var i in elements){
			var toCheckCont;
			var toCheck = elements[i];
			if (typeof(toCheck)=='object'){
				var attr = this._getAllValidationData(toCheck);
				var haveToValidate = true;
				if (attr['validation-condition']){
					haveToValidate = this._call_user_function(attr['validation-condition'], window, toCheck);
				}
				if (haveToValidate){
					var value = (toCheck.type && toCheck.type=='checkbox') ? toCheck.checked : toCheck.value;
					if (typeof(this[attr.validation])=='function'){
						toCheckCont = this[attr.validation](value, attr);
					}else{
						toCheckCont = this.fill(value, attr);
					}
					toCheck.className = toCheck.className.replace(new RegExp("\\b"+this.valid_class+"\\b"), "");
					toCheck.className = toCheck.className.replace(new RegExp("\\b"+this.error_class+"\\b"), "");
					if (!toCheckCont){
						cont = false;
						toCheck.className+=" "+this.error_class;
						this.feedback(toCheck, toCheckCont, attr['validation-message']);
						errs.push(attr['validation-message']);
					}else{
						toCheck.className+=" "+this.valid_class;
						this.feedback(toCheck, toCheckCont, attr['validation-message']);
					}
				}
			}
		}
		return cont;
	}

	/* Public methods */
	
	checked(value, attr){
		attr['validation-message'] = "Flag is mandatory.";
		return value;
	}

	
	date(value, attr){
		var regexp;
		if (attr['validation-date-format']){
			regexp = attr['validation-date-format'];
			regexp = regexp.replace("d", "[0-3][0-9]");
			regexp = regexp.replace("m", "[0-1][0-9]");
			regexp = regexp.replace("Y", "[1-2][0-9]{3}");
		}else{
			regexp = "^[1-2][0-9]{3}-[0-1][0-9]-[0-3][0-9]$";
		}
		attr['validation-regexp'] = regexp;
		return this.fill(value, attr);
	}

	
	number(value, attr){
		if (!attr['validation-regexp']){
			attr['validation-regexp'] = "^[0-9.,]+$";
		}
		
		return this.fill(value, attr);
	}

	
	email(value, attr){
		attr['validation-regexp'] = "^\\w+([\\.-]?\\w+)*@\\w+([\\.-]?\w+)*(\\.\\w{2,3})+$";
		return this.fill(value, attr);
	}
	
	fill(value, attr){
		var length = value.length;
		var regexp_validator = true;
		var minlen_validator = true;
		var maxlen_validator = true;
		var mandatory_validator = true;
		var message = attr['validation-message'];
		var default_message = [];
		if (length > 0 && attr['validation-regexp']){
			let match = value.match(new RegExp(attr['validation-regexp']));
			regexp_validator = (match && match.length > 0);
			if (!regexp_validator) default_message.push("The value is not in the correct format");
		}
		if (length > 0 && attr['validation-minlength']){
			minlen_validator = length>=attr['validation-minlength'];
			if (!minlen_validator) default_message.push("The value must be at least "+attr['validation-minlength']+" characters");
		}
		if (length > 0 && attr['validation-maxlength']){
			maxlen_validator = length<=attr['validation-maxlength'];	
			if (!maxlen_validator) default_message.push("The value must be up to "+attr['validation-maxlength']+" characters");
		}
		if (!attr['validation-optional']){
			mandatory_validator = length>0;
			if (!mandatory_validator && default_message.length === 0){
				default_message.push("Value is mandatory");
			}
		}
		if (!message) attr['validation-message'] = default_message[0];
		return regexp_validator && minlen_validator && maxlen_validator && mandatory_validator;
	}

	/* Private method */
	_getAllValidationData(el){
		return {
			'validation': el.getAttribute('data-validation'),
			'validation-regexp': el.getAttribute('data-validation-regexp'),
			'validation-message': el.getAttribute('data-validation-message'),
			'validation-condition': el.getAttribute('data-validation-condition'),
			'validation-minlength': el.getAttribute('data-validation-minlength'),
			'validation-maxlength': el.getAttribute('data-validation-maxlength'),
			'validation-date-format': el.getAttribute('data-validation-date-format'),
			'validation-group': el.getAttribute('data-validation-group'),
			'validation-optional': el.getAttribute('data-validation-optional'),
		};
	}

	_call_user_function(functionName, context /*, args */) {
		if (!context) context = window;
		var args = Array.prototype.slice.call(arguments, 2);
		
		namespaces.split(".");
		var func = namespaces.pop();
		for(var i = 0; i < namespaces.length; i++) {
			context = context[namespaces[i]];
		}
		return context[func].apply(context, args);
	}
}