/*
 * CDDL HEADER START
 *
 * The contents of this file are subject to the terms of the
 * Common Development and Distribution License (the "License").
 * You may not use this file except in compliance with the License.
 *
 * See LICENSE.txt included in this distribution for the specific
 * language governing permissions and limitations under the License.
 *
 * When distributing Covered Code, include this CDDL HEADER in each
 * file and include the License file at LICENSE.txt.
 * If applicable, add the following below this CDDL HEADER, with the
 * fields enclosed by brackets "[]" replaced with your own identifying
 * information: Portions Copyright [yyyy] [name of copyright owner]
 *
 * CDDL HEADER END
 */

/*
 * Copyright (c) 2009, 2012, Oracle and/or its affiliates. All rights reserved.
 */

/*
 * Portions Copyright 2011 Jens Elkner.
 */
document.pageReady = [];
document.domReady = [];

window.onload = function() {
    for(var i in document.pageReady) {
        document.pageReady[i]();
    }
}

$(document).ready(function() {
    for(var i in this.domReady) {
        document.domReady[i]();
    }
});

/**
 * Resize the element with the ID 'content' so that it fills the whole browser
 * window (i.e. the space between the header and the bottom of the window) and
 * thus get rid off the scrollbar in the page header.
 */
function resizeContent() {
    if (document.adjustContent != 0) {
        $('#content').css('top', $('body').outerHeight(true)).css('bottom', 0);
    }
}

function domReadyMast() {
    var h = document.hash;
    if (!window.location.hash) {
        if (h != null && h != "null")  {
            window.location.hash=h
        } else {
            $('#content').focus();
        }
    }
    if (document.annotate) {
        $('a[class=r]').tooltip({ left: 5, showURL: false });
        var toggle_js = document.getElementById('toggle-annotate-by-javascript');
        var toggle_ss = document.getElementById('toggle-annotate');

        toggle_js.style.display = 'inline';
        toggle_ss.style.display = 'none';
    }
}

function pageReadyMast() {
    document.adjustContent = 0;
    if ($('#whole_header') != null && $('#content') != null) {
        document.adjustContent = 1;
        resizeContent();
    }
    $(window).resize(
        function() {
            resizeContent();
        }
    );
}

function domReadyMenu() {
    var projects = document.projects;
    var sbox = document.getElementById('sbox');
/*
    $("#project").autocomplete(projects, {
        minChars: 0,
        multiple: true,
        multipleSeparator: ",",
        //mustMatch: true,
        matchContains: "word",
        max: 200,
        cacheLength:20,
        //autoFill: false,
        formatItem: function(row, i, max) {
                return (row != null) ? i + "/" + max + ": " + row[0] : "";
            },
        formatMatch: function(row, i, max) {
                return (row != null) ? row[0] : "";
            },
        formatResult: function(row) {
                return (row != null) ? row[0] : "";
            },
        width: "300px"
    });
*/
    // TODO  Bug 11749
    // var p = document.getElementById('project');
    // p.setAttribute("autocomplete", "off");
}

function domReadyHistory() {
    // start state should ALWAYS be: first row: r1 hidden, r2 checked ;
    // second row: r1 clicked, (r2 hidden)(optionally)
    // I cannot say what will happen if they are not like that, togglediffs
    // will go mad !
    $("#revisions input[type=radio]").bind("click",togglediffs);
    togglediffs();
}

function get_annotations() {
    link = document.link +  "?a=true";
    if (document.rev.length > 0) {
        link += '&' + document.rev;
    }
    hash = "&h=" + window.location.hash.substring(1, window.location.hash.length);
    window.location = link + hash;
}

function toggle_annotations() {
    $("span").each(
        function() {
            if (this.className == 'blame') {
                this.className = 'blame-hidden';
            } else if (this.className == 'blame-hidden') {
                this.className = 'blame';
            }
        }
    );
}

/** list.jsp */

/**
 * Initialize defaults for list.jsp
 */
function pageReadyList() {
    document.sym_div_width = 240;
    document.sym_div_height_max = 480;
    document.sym_div_top = 100;
    document.sym_div_left_margin = 40;
    document.sym_div_height_margin = 40;
    document.highlight_count = 0;
    $(window).resize(function() {
        if (document.sym_div_shown == 1) {
            document.sym_div.style.left = get_sym_div_left() + "px";
            document.sym_div.style.height = get_sym_div_height() + "px";
        }
    });
}

/* ------ Navigation window for definitions ------ */
/**
 * Create the Navigation toggle link as well as its contents.
 */
function get_sym_list_contents() {
    // var contents = "<input id=\"input_highlight\" name=\"input_highlight\"
    // class=\"q\"/>";
    // contents += "&nbsp;&nbsp;";
    // contents += "<b><a href=\"#\" onclick=\"javascript:add_highlight();return
    // false;\" title=\"Add highlight\">Highlight</a></b><br/>";
    if (typeof get_sym_list != 'function') {
        return false;
    }

    var symbol_classes = get_sym_list();
    var contents = '';
    for ( var i = 0; i < symbol_classes.length; i++) {
        if (i > 0) {
            contents += "<br/>";
        }
        var symbol_class = symbol_classes[i];
        var class_name = symbol_class[1];
        var symbols = symbol_class[2];
        contents += "<b>" + symbol_class[0] + "</b><br/>";

        for (var j = 0; j < symbols.length; j++) {
            var symbol = symbols[j][0];
            var line = symbols[j][1];
            contents += "<a href=\"#" + line + "\" class=\"" + class_name + "\" onclick=\"lsttoggle();\">" + escape_html(symbol) + " </a><br/>";
        }
    }

    return contents;
}

function escape_html(string) {
    return string.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;");
}

function get_sym_div_left() {
    document.sym_div_left = $(window)
        .width() - (document.sym_div_width + document.sym_div_left_margin);
    return document.sym_div_left;
}

function get_sym_div_height() {
    document.sym_div_height = $(window)
        .height() - document.sym_div_top - document.sym_div_height_margin;

    if (document.sym_div_height > document.sym_div_height_max) {
        document.sym_div_height = document.sym_div_height_max;
    }
    return document.sym_div_height;
}

function get_sym_div_top() {
    return document.sym_div_top;
}

function get_sym_div_width() {
    return document.sym_div_width;
}

/**
 * Toggle the display of the 'Navigation' window used to highlight definitions.
 * lyp: overwritten
 */
function genSymbolList() {
  var d = $("#symbol-list");
  var list = get_sym_list_contents();
  if (!list) {
    d.html('No symbols');
  } else {
    d.html(list);
  }
}
function lsttoggle() {
  $('.symbol-modal').modal('toggle');
}

/**
 * Toggle the display of line numbers.
 */
function lntoggle() {
    $("a").each(
        function() {
            if (this.className == 'l' || this.className == 'hl') {
                this.className = this.className + '-hide';
                this.setAttribute("tmp", this.innerHTML);
                this.innerHTML = '';
            } else if (this.className == 'l-hide'
                    || this.className == 'hl-hide')
            {
                this.innerHTML = this.getAttribute("tmp");
                this.className = this.className.substr(0, this.className
                        .indexOf('-'));
            }
        });
}

/* ------ Highlighting ------ */
/**
 * An expensive Highlighter:
 * Note: It will replace link's href contents as well, be careful.
 */
/* Not used.
function HighlightKeywordsFullText(keywords) {
    var el = $("body");
    $(keywords).each(
        function() {
            var pattern = new RegExp("("+this+")", ["gi"]);
            var rs = "<span style='background-color:#FFFF00;font-weight:bold;'"
                + ">$1</span>";
            el.html(el.html().replace(pattern, rs));
        }
    );
    // HighlightKeywordsFullText(["nfstcpsock"]);
}
*/

/**
 *  Highlight keywords by changeing the style of matching tags.
 */
function HighlightKeyword(keyword) {
    var high_colors = [ "#ffff66", "#ffcccc", "#ccccff", "#99ff99", "#cc66ff" ];
    var pattern = "a:contains('" + keyword + "')";
    $(pattern).css({
        'text-decoration' : 'underline',
        'background-color' : high_colors[document.highlight_count
            % high_colors.length],
        'font-weight' : 'bold'
    });
    document.highlight_count++;
}
//Test: HighlightKeyword('timeval');

/**
 * Highlight the text given as value of the element with the ID "input_highlight" .
 * @see HighlightKeyword
 */
function add_highlight() {
    var tbox = document.getElementById('input_highlight');
    HighlightKeyword(tbox.value);
}

function toggle_filelist() {
    $("div").each(
        function() {
            if (this.className == "filelist") {
                this.setAttribute("style", "display: none;");
                this.className = "filelist-hidden";
            } else if (this.className == "filelist-hidden") {
                this.setAttribute("style", "display: inline;");
                this.className = "filelist";
            }
        }
    );
}

function toggle_revtags() {
    $("tr").each(
        function() {
            if (this.className == "revtags") {
                this.setAttribute("style", "display: none;");
                this.className = "revtags-hidden";
            } else if (this.className == "revtags-hidden") {
                this.setAttribute("style", "display: table-row;");
                this.className = "revtags";
            }
        }
    );
    $("span").each(
        function() {
            if (this.className == "revtags") {
                this.setAttribute("style", "display: none;");
                this.className = "revtags-hidden";
            } else if (this.className == "revtags-hidden") {
                this.setAttribute("style", "display: inline;");
                this.className = "revtags";
            }
        }
    );
}

function togglediffs() {
    var cr2 = false;
    var cr1 = false;
    $("#revisions input[type=radio]").each(
        function() {
            if (this.name=="r1") {
                if (this.checked) {
                    cr1 = true;
                    return true;
                }
                if (cr2) {
                    this.disabled = ''
                } else {
                    this.disabled = 'true'
                }
            } else if (this.name=="r2") {
                if (this.checked) {
                    cr2=true;
                    return true;
                }
                if (!cr1) {
                    this.disabled = ''
                } else {
                    this.disabled = 'true'
                }
            }
        }
    );
}

function selectAllProjects() {
    $("#project *").attr("selected", "selected");
}

function invertAllProjects() {
    $("#project *").each(
        function() {
            if ($(this).attr("selected")) {
                $(this).removeAttr("selected");
            } else {
                $(this).attr("selected", "true");
            }
        }
    );
}

function goFirstProject() {
    var selected=$.map($('#project :selected'), function(e) {
            return $(e).text();
        });
    window.location = document.xrefPath + '/' + selected[0];
}

function clearSearchFrom() {
    $("#sbox :input[type=text]").each(
        function() {            
                $(this).attr("value", "");            
        }
    );    
    $("#type :selected").removeAttr("selected");
}

function checkEnter(event) {
    concat='';
    $("#sbox :input[type=text]").each(
        function() {            
                concat+=$.trim($(this).val());
        }
    );
    if (event.keyCode == '13' && concat=='')
    {
        goFirstProject();
    } else if (event.keyCode == '13') {
        $("#sbox").submit();
    }
}

/* -------------- Custom ----------------- */
function updateTableStyle() {
  $('table').addClass('table table-condensed table-striped');
}
