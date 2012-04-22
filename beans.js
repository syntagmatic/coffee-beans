var CoffeeBeans = function() {
  var beans = {};

  var commands = new Commands();
  commands.fetch();
  var curr = commands.size();  // current command
  var error_state = false;

  var puts_node = document.getElementById('puts');

  window.editor = CodeMirror.fromTextArea(document.getElementById("input"), {
    mode: 'coffeescript',
    theme: 'idle',
    onChange: test_compile,
    extraKeys: {
      "Enter": CodeMirror.commands.newlineAndIndent,
      "Shift-Enter": go,
      "Up": up,
      "Down": down,
      "Tab": autocomplete,
      "Shift-Right": CodeMirror.commands.indentMore,
      "Shift-Left": CodeMirror.commands.indentLess
    }
  });

  editor.focus();

  // highlight examples
  $('.highlight').each(function() {
    var code = $(this).text();
    highlight_coffee(this, code);
    code_buttons(this, code);
  });


  function code_buttons(el, code) {
    $(el).append('<div class="buttons"><svg class="button copier"><path transform="scale(0.6)" d="M10.129,22.186 16.316,15.999 10.129,9.812 13.665,6.276 23.389,15.999 13.665,25.725z"></svg></div>');
    $(el).children('.buttons').children('.copier').on('click', function() {
      editor.setValue(code);
      editor.focus();
    });
  }

  function autocomplete(cm) {
    CodeMirror.simpleHint(cm, CodeMirror.coffeescriptHint);
  }

  function test_compile(cm) {
    try {
      error_state = false;
      CoffeeScript.compile(editor.getValue());
      $('#coffee-error').hide();
    } catch (err) {
      error_state = true;
      $('#coffee-error').removeClass('tried');
      $('#coffee-error #compile-error').text(err.message);
      $('#coffee-error').show();
    }
  }

  function up(cm) {
    if (curr > 0 && topline()) {
      curr -= 1;
      var command = commands.at(curr);
      editor.setValue(command.get('contents'));
    } else {
      CodeMirror.commands.goLineUp(cm);
    }
  };

  function down(cm) {
    if (curr < commands.size() && botline()) {
      curr += 1;
      if (curr != commands.size()) {
        var command = commands.at(curr);
        editor.setValue(command.get('contents'));
      } else {
        editor.setValue("");
      }
    } else {
      CodeMirror.commands.goLineDown(cm);
    }
  };
  
  function topline() {
    return coords().line == 0;
  };

  function botline() {
    var lines = editor.lineCount();
    return coords().line == lines - 1;
  };

  function coords() {
    var cursor = editor.cursorCoords();
    return editor.coordsChar(cursor);
  };

  function go() {
    if (error_state) {
      $('#coffee-error').addClass('tried');
      return;
    }

    var code = editor.getValue();
    editor.setValue("");

    var command = commands.create({
      contents: code
    });

    var command_view = new CommandView({
      model: command
    });

    command_view.render();

    jscode = command.compile();

    if (jscode.type == "success") {
      try {
        var result = eval.call(null, jscode.result);
        try {
          puts(result);
        } catch (error) {
          puts_error("Result: " + result);
          puts_error("Puts error: " + error.message);
        }
      } catch (error) {
        puts_error("Result: " + result);
        puts_error("Javascript error: " + error.message);
      }
    } else if (jscode.type == "error") {
      puts_error("CoffeeScript error: " + jscode.result.message);
    }

    curr = commands.size();
  };

  function puts_print(txt, className) {
    var txt_node = document.createElement('pre');
    txt_node.className = className;
    puts_node.appendChild(txt_node);

    if (className == 'input' || className == 'puts') {
      highlight_js(txt_node, txt);
    } else if (className == 'beans-puts-coffee') {
      highlight_coffee(txt_node, txt);
    } else {
      $(txt_node).text(txt);
    }

    toBottom();
  };

  function toBottom() {
    // scroll to bottom
    $('#puts').animate({scrollTop: $('#puts')[0].scrollHeight}, 0);
  };

  window.puts = function(result) {

    switch (type(result)) {
      case "array":
        try {
          result = JSON.stringify(result);
        } catch (error) {
          result = result.toString();
        }
        break;
      case "function":
        result = js2coffee(result);
        puts_print(result, "beans-puts-coffee");
        return;
      case "object":
        try {
          result = JSON.stringify(result);
        } catch (err) {
          puts_error("Print error: " + err.message);
          return;
        }
        break;
      case "number":
        result = result.toString();
        break;
      case "boolean":
        result = result.toString();
        break;
      case "string":
        result = result;
        break;
      case "undefined":
        result = "undefined";
        return;                  // do nothing
      case "null":
        result = "null";
        break;
      case "NaN":
        result = "NaN";
        break;
      case "date":
        result = result.toString();
        break;
      case "RegExp":
        result = result.toString();
        break;
      case "element":
        $(puts_node).append(result);
        setTimeout(function() { toBottom(); }, 40);
        return;
        break;
      default:
        result = result.toString();
    }

    //var coffee_result = Js2coffee.build(result + "");
    puts_print(result, "puts");
  };

  function puts_error(result) {
    puts_print(result, "error");
  };

  function highlight_coffee(node, code) {
    $(node).addClass('cm-s-idle');
    CodeMirror.runMode(code, "coffeescript", node);
  };

  function highlight_js(node, code) {
    $(node).addClass('cm-s-idle');
    CodeMirror.runMode(code, "javascript", node);
  };

  var globals = {
    //log: function() { console.log.apply(console, arguments) },
    after: '_.after',
    all: '_.all',
    any: '_.any',
    bindAll: '_.bindAll',
    bind: '_.bind',
    clone: '_.clone',
    coffee2js: coffee2js,
    Collection: 'Backbone.Collection',
    compact: '_.compact',
    compose: '_.compose',
    debounce: '_.debounce',
    defaults: '_.defaults',
    defer: '_.defer',
    delay: '_.delay',
    difference: '_.difference',
    each: '_.each',
    'escape': '_.escape',
    Events: 'Backbone.Events',
    extend: '_.extend',
    filter: '_.filter',
    find: '_.find',
    first: '_.first',
    flatten: '_.flatten',
    functions: '_.functions',
    groupBy: '_.groupBy',
    has: '_.has',
    html: html,
    identity: '_.identity',
    include: '_.include',
    indexOf: '_.indexOf',
    initial: '_.initial',
    intersection: '_.intersection',
    invoke: '_.invoke',
    isArguments: '_.isArguments',
    isArray: '_.isArray',
    isBoolean: '_.isBoolean',
    isDate: '_.isDate',
    isElement: '_.isElement',
    isEmpty: '_.isEmpty',
    isEqual: '_.isEqual',
    isFunction: '_.isFunction',
    isNaN: '_.isNaN',
    isNull: '_.isNull',
    isNumber: '_.isNumber',
    isRegExp: '_.isRegExp',
    isString: '_.isString',
    isUndefined: '_.isUndefined',
    js2coffee: js2coffee,
    json: '$.getJSON',
    keys: '_.keys',
    lastIndexOf: '_.lastIndexOf',
    last: '_.last',
    map: '_.map',
    max: '_.max',
    memoize: '_.memoize',
    min: '_.min',
    Model: 'Backbone.Model',
    once: '_.once',
    pluck: '_.pluck',
    pretty: pretty,
    range: '_.range',
    reduce: '_.reduce',
    reduceRight: '_.reduceRight',
    reject: '_.reject',
    repeat: repeat,
    rest: '_.rest',
    Router: 'Backbone.Router',
    shuffle: '_.shuffle',
    size: '_.size',
    sortBy: '_.sortBy',
    sortedIndex: '_.sortedIndex',
    tap: '_.tap',
    template: '_.template',
    throttle: '_.throttle',
    times: '_.times',
    toArray: '_.toArray',
    type: type,
    union: '_.union',
    uniq: '_.uniq',
    values: '_.values',
    View: 'Backbone.View',
    without: '_.without',
    wrap: '_.wrap',
    zip: '_.zip'
  };

  /* global functions */

  function type(object) {
    if (_.isFunction(object)) return "function";
    if (_.isArray(object)) return "array";
    if (_.isElement(object)) return "element";
    if (_.isNull(object)) return "null";
    if (_.isNaN(object)) return "NaN";
    if (_.isDate(object)) return "date";
    if (_.isArguments(object)) return "arguments";
    if (_.isUndefined(object)) return "undefined";
    if (_.isRegExp(object)) {
      return "RegExp";
    } else {
      return typeof object;
    }
  };

  function html(str) {
    return $(str)[0];
  };

  function pretty(obj) {
    return JSON.stringify(obj, undefined, 2);
  };

  function repeat(func, interval) {
    func();
    setTimeout(function() {
      repeat(func, interval);
    }, interval);
  };

  function js2coffee(obj) {
    if ('function' == type(obj)) {
      var str = "var $_$_$ = " + obj.toString();
      var compiled = Js2coffee.build(str);
      return compiled.slice(8)
    }
  };

  function coffee2js(str) {
    return CoffeeScript.compile(str).slice(16,-17);
  };

  beans.addGlobal = function(v,k) {
    if (_.isString(v)) {
      var func = eval(v);
      window[k] = function() { return func.apply(this, arguments); };
      window[k].toString = function() { return v; } ;
      return;
    }
    if (_.isFunction(v)) {
      window[k] = v;
    }
  };

  // forgive me
  _(globals).each(beans.addGlobal);

  // log
  window['log'] = function() { console.log.apply(console, arguments); };
  window['log'].toString = function() { return "console.log"; };

  return beans;
};
