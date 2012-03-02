(function() {
  // globalize underscore
  _.extend(window, _);
  _.extend(window, {
    log: function() { console.log.apply(console, arguments) },
    Events: Backbone.Events,
    Model: Backbone.Model,
    Collection: Backbone.Collection,
    Router: Backbone.Router,
    View: Backbone.View,
    json: $.getJSON
  });

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
      "Shift-Enter": CodeMirror.commands.newlineAndIndent,
      "Enter": go,
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
  });

  $('#puts').css({'max-height': $(window).height() - 126});
  $(window).bind("resize", function() {
    $('#puts').css({'max-height': $(window).height() - 126});
  });

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

    window.b = command_view;
    jscode = command.compile();

    if (jscode.type == "success") {
      try {
        var result = eval.call(null, jscode.result);

        // print result
        puts(result);
      } catch (error) {
        puts_error("Javascript error: " + result);
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
        result = JSON.stringify(result);
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
        result = '"' + result + '"';
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

})();

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
