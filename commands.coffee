do ->
  curr_command = -1

  window.Command = Backbone.Model.extend
    defaults:
      'index': 0
      'contents': ""
    compile: ->
      try
        jscode = CoffeeScript.compile(@get('contents'))

        # remove wrapping closure
        jscode = jscode.substring(16)
        jscode = jscode.substring(0,jscode.length-16)
        return {
          type: 'success'
          result: jscode
        }
      catch error
        return {
          type: 'error'
          result: error
        }

  window.Commands = Backbone.Collection.extend
    model: Command
    localStorage: new Store("command")

  window.CommandView = Backbone.View.extend
    tagName: "div"
    className: "input"
    render: ->
      $(@el).text(@model.get('contents'))
      $('#output').append(this.el)
