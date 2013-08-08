(function($) {

    function tunaSelect(opts) {
        var userContainer = this;
        var htmlSelectsProvided = false;
        var jsonProvided = false;
        var options;
        var selectContainerLeft;
        var pluginAddedProperties = ["tunaVisible", "tunaIdx"];

        if($(this).data("tunaSelect")) {
            return $(this).data("tunaSelect");
        }
        var defaults = {
            container : "#tuneSelectContainer",
            fieldNames: {selected: "selected", value: "value", text: "text"},
            leftSelect: null,
            rightSelect: null,
            searchField: null,
            jsonData: null,
            onMoveEvent: null
        };
        options = $.extend(defaults, opts);
        if (optionElementExists('leftSelect') && optionElementExists('rightSelect')) {
            if ($(options.leftSelect).is('select') && $(options.rightSelect).is('select')) {
                htmlSelectsProvided = true;
                $(options.leftSelect).hide();
                $(options.rightSelect).hide();
            }
        }
        if (!htmlSelectsProvided && optionExists('jsonData')) {
            jsonProvided = true;
        }
        if (!htmlSelectsProvided && !jsonProvided) {
            return;
        }
        $(this).data("tunaSelect", { 
            addAll: function() {
                var model = $(selectContainerLeft).data("model");
                $.each(model, function(i, record) {
                    if (record.tunaVisible) {
                        // Don't add an item which is invisible (i.e. was excluded by search)
                        record[options.fieldNames.selected] = true;
                    }
                });
                paint();
            },
            removeAll: function() {
                var model = $(selectContainerLeft).data("model");
                $.each(model, function(i, record) {
                    if (record.tunaVisible) {
                    record[options.fieldNames.selected] = false;
                    }
                });
                paint();
            },
            getResult: function() {
                var model = $(selectContainerLeft).data("model");
                var result = new Array();
                $.each(model, function(i, record) {
                    if (record[options.fieldNames.selected]) {
                        // Get rid of stuff we added...user does not want to see it.
                        var cloned = $.extend({}, record);
                        $.each(pluginAddedProperties, function(j, property) {
                            delete cloned[property];
                        }); 
                        result.push(cloned);
                    }
                });
                return result;
            },        
            clearSearch: function() {
                if (!optionElementExists('searchField')) return;
                var model = $(selectContainerLeft).data("model");
                $(options.searchField).val("");
                $.each(model, function(i, record) {
                    if (!record[options.fieldNames.selected]) {
                        record.tunaVisible = true;
                    }
                });
                paint();
            },
            loadNewData: function(newFieldNames, jsonData) {
                var model = new Array();
                var idx = 0;
                options.fieldNames = newFieldNames;
                $.each(jsonData, function(i, record) {
                    record.tunaIdx = idx++;
                    record.tunaVisible = true;
                    model[record.tunaIdx] = record;
                });
                $(selectContainerLeft).data("model", model);
                paint();
            }
        });
        if (optionElementExists('searchField')) {
            var timer = false;
            $(options.searchField).keydown(function() {
                if (timer) clearTimeout(timer);
                timer = setTimeout(function() {
                    var searchText = $(options.searchField).val();
                    var filter = $.jsonFilter('contains', options.fieldNames.text, searchText);
                    var model = $(selectContainerLeft).data("model");
                    var leftSideData = new Array();
                    $.each(model, function(i, record) {
                        if (!record[options.fieldNames.selected]) {
                            record.tunaVisible = false;
                            leftSideData.push(record);
                        }
                    });
                    var filteredData = $.jsonFilter(leftSideData, filter);
                    $.each(filteredData, function(i, record) {
                        var idx = record.tunaIdx;
                        model[idx].tunaVisible = true;
                    });
                    paint();
                });
            });
        }
        init();
        function init() {
            var model = new Array();
            selectContainerLeft = $("<div>").addClass("tunaBox tunaBoxHeader").text("Select one or more value(s)");
            var selectContainerRight = $("<div>").addClass("tunaBox tunaBoxHeader").html("Values selected: <span id='tunaValuesSelected'>0</span>");
            $(userContainer).append(selectContainerLeft).append(selectContainerRight);
            var optionsContainerLeft = $("<div>").addClass("tunaBox tunaBelectBox tunaLeftBox");
            var optionsContainerRight = $("<div>").addClass("tunaBox tunaSelectBox tunaRightBox");
            $(userContainer).append(optionsContainerLeft).append(optionsContainerRight);
            if (options.boxWidth) $('.tunaBox').css('width', options.boxWidth + "px");
            if (options.boxHeight) $('.tunaBox').css('height', options.boxHeight + "px");
            if (htmlSelectsProvided) {
                    var idx = 0;
                    $(options.leftSelect + " option").each(
                        function() {
                            model[idx] = {tunaIdx: idx++, selected: false, value: $(this).val(), text: $(this).text()};    
                        }
                    );
                    $(options.rightSelect + " option").each(
                        function() {
                            model[idx] = {tunaIdx: idx++, selected: true, value: $(this).val(), text: $(this).text()};    
                        }
                    );
            } else if (jsonProvided) {
                    var idx = 0;
                    $(options.jsonData).each(function(i, record) {
                        record.tunaIdx = idx++;
                        record.tunaVisible = true;
                        model[record.tunaIdx] = record;
                    });
            }    
            $(selectContainerLeft).data("model", model);
            paint();
        }
        function paint() {
            $(userContainer).find('.tunaLeftBox table').remove();
            $(userContainer).find('.tunaRightBox table').remove();
            var model = $(selectContainerLeft).data("model");
            var valuesSelectedCount = 0;
            $.each(model, function(i, optionData) {
                /* Handle the items on the left */
                if (!optionData[options.fieldNames.selected] && optionData.tunaVisible) {
                        var table = $('<table>').attr("cellpadding", "0").attr("cellspacing","0")
                            .append($('<tbody>')
                                .append($('<tr>')
                                    .data("json", optionData)
                                    .append($('<td>')
                                        .text(optionData[options.fieldNames.text])
                                        .click(switchSide)
                                    )
                                )
                            );
                        $(userContainer).find('.tunaLeftBox').append(table);
                } else if (optionData[options.fieldNames.selected]) {
                  /* Handle the items on the right */
                        ++valuesSelectedCount;                        
                        /* $.after() doesn't work in IE so we have an un-jQuery solution for the two td's */
                        var rowCells = 
                          "<td>" + optionData[options.fieldNames.text] + "</td>" +
                          "<td>&nbsp;</td>";
                        var table = $('<table>')
                          .attr("cellpadding", "0").attr("cellspacing","0")
                          .append($('<tbody>')
                              .append($("<tr>")
                                  .data("json", optionData)
                                  .append(rowCells)
                              )
                          );
                        $(userContainer).find('.tunaRightBox').append(table);

                }
            });
            $('#tunaValuesSelected').text(valuesSelectedCount);
            $(userContainer).find(
                '.tunaRightBox table:nth-child(odd)').addClass('tunaRightSelectRowOdd');
            $(userContainer).find(
                '.tunaRightBox table:nth-child(even)').addClass('tunaRightSelectRowEven');
            $(userContainer).find(
                '.tunaRightBox table tbody tr td:nth-child(1)')
                .addClass('tunaRightLabel');
            /* For the right side items, we attach the click action here instead of in the loop
              ...a consequence of the IE $.after() bug */
            $(userContainer).find('.tunaRightBox table tbody tr td:nth-child(2)')
                .addClass('tunaRightDelete')
                .click(switchSide);
            if (options.onMoveEvent) {
                options.onMoveEvent($('#tunaValuesSelected').text());
            }
        }
        function switchSide() {
            var json = $(this).parent().data("json");
            // Find the matching model record
            var idx = json.tunaIdx;
            var model = $(selectContainerLeft).data("model");
            model[idx][options.fieldNames.selected] = !model[idx][options.fieldNames.selected];
            paint();
        }
        /*    A convenience method.    Return true if the option exists, and there is an element
         *    in the DOM having this name as an id.    */
        function optionElementExists(idName) {
            var result = optionExists(idName) && $('#' + idName).length > 0;
            return result;
        }
        /*    A convenience method.    Return true if we have an options object, and
         *    the property is a field in that object.    */
        function optionExists(property) {
            return options && typeof options[property] != 'undefined';
        }
    }
    /* Externally exposed method which delegates to the same-named internal method. */
    function addAll(tunaSelect) {
        $(this).click(function() {
            tunaSelect.addAll();
        });
    }
    /* Externally exposed method which delegates to the same-named internal method. */
    function removeAll(tunaSelect) {
        $(this).click(function() {
            tunaSelect.removeAll();
        });
    }
    /* Externally exposed method which delegates to the same-named internal method. */
    function getResult(tunaSelect) {
        $(this).click(function() {
            tunaSelect.getResult();
        });
    }
    function clearSearch(tunaSelect) {
        $(this).click(function() {
            tunaSelect.clearSearch();
        });
    }
    function loadNewData(tunaSelect, newFieldNames, jsonData) {
        $(this).click(function() {
            tunaSelect.loadNewData(newFieldNames, jsonData);
        });
    }
    var exposedMethods = {
        addAll: addAll,
        removeAll: removeAll,
        getResult: getResult,
        clearSearch: clearSearch,
        loadNewData: loadNewData
    };

    $.fn.tunaSelect = function(method) {
        if(exposedMethods[method]) {
                return exposedMethods[method].apply(this, Array.prototype.slice.call(arguments, 1));
        } else {
                return tunaSelect.apply(this, arguments);
        }
    }
})(jQuery);
