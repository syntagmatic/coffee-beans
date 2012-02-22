var commands = new Commands();
commands.fetch();

var output_node = document.getElementById('output');

var editor = CodeMirror.fromTextArea(document.getElementById("input"), {
  mode: 'coffeescript',
  theme: 'monokai',
  extraKeys: {
    "Shift-Enter": CodeMirror.commands.newlineAndIndent,
    "Enter": go,
    "Up": up,
    "Down": down,
  }
});

editor.focus();

window.onresize = size_console;

function size_console(e) {
  // TODO
};

function up() {
  editor.setValue()
};

function down() {
  if (curr_command < command_history.length) {
    curr_command += 1;
    if (curr_command != command_history.length) {
      editor.setValue(command_history[curr_command]);
    } else {
      editor.setValue("");
    }
  }
};

function go() {
  var code = editor.getValue();
  editor.setValue("");

  var command = commands.create({
    contents: code
  });
  (new CommandView({
    model: command
  })).render();

  jscode = command.compile();

  if (jscode.type == "success") {
    // with underscore
    jscode = "with (_) {\n" + jscode.result + "}";
    try {
      var result = eval.call(null, jscode);
      // print result
      output(JSON.stringify(result));
    } catch (error) {
      output_error("Javascript error: " + result);
    }
  } else if (jscode.type == "error") {
    output_error("CoffeeScript error: " + jscode.result.message);
  }
};

function output_print(txt, className) {
  var txt_node = document.createElement('div');
  txt_node.appendChild(document.createTextNode(txt));
  txt_node.className = className;
  output_node.appendChild(txt_node);
};

function output(result) {
  //var coffee_result = Js2coffee.build(result + "");
  output_print(result, "output");
};

function output_error(result) {
  output_print(result, "error");
};

var store = {
  code: 8
};

d3.select("#store-code").on("click", function() {
  var code = editor.getValue();
  output_print("Saving...", "notice");
  localStorage.setItem("store.code" + store.code.length, code);
  
  output_print("Done", "notice");
});


