Right-to-left select

Starts with self-invoking anonymous function (standard jQuery structure).

a.k.a. immediately invoked function expression

(function($)
   . . .
)(jquery);

Means:  take the global window.jquery variable, pass it in referencing it with $ variable in the function (i.e. jQuery style).

You create the plugin object with the tunaselect() call and that's where you pass in your option settings.  Note the $.extend call which will merge your options with the defaults.

userContainer is the enclosing <div> for the widget.  At line 265, we use $.fn to make tunaSelect() a method on all HTML objects.  So I can invoke it with $("#myDiv").tunaSelect()

Line 37:  you attach the JSON data to populate the left/right sides using the HTML5 data attribute of the containing div.

The var section declares private variables.

var defaults define the properties that can be passed in

Assumes there are HTML elements with id's of 'leftSelect' and 'rightSelect'

Scroll down to line 257:  these are the functions that will be publicly exposed.

The methods are defined starting at line 38.

Several of these methods call paint().  We are following a separation of model and view here.  Most of the exposed functions are making operations on the model data.  Only when paint() is called is it rendered to the browser.
