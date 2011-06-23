/**
 *@name:codecola gradient
 *@author:zhouqicf@gmail.com
 *@site:www.zhouqicf.com
 *@version:2-0-0
 */
YUI().add('codecola-gradient', function(Y) {
    Y.codecolaGradient = Y.Base.create('codecola-gradient', Y.Widget, [], {
        initializer: function() {
        },

        renderUI: function() {
            var random = (new Date).getTime(),
                ids = {
                    panel: "codecola-gradient-panel-" + random,
                    panelWrap: "codecola-gradient-panel-wrap-" + random,
                    stops: "codecola-gradient-stops-" + random,
                    color: "codecola-gradient-color-" + random,
                    location: "codecola-gradient-location-" + random,
                    button: "codecola-gradient-stop-delete-button-" + random,
                    orientation: "codecola-gradient-orientation-" + random,
                    stopDetail: "codecola-gradient-stop-detail-" + random
                };

            var html = '<div class="codecola-gradient-wrap">'+
                        '   <div class="codecola-gradient-panel-wrap" id="' + ids.panelWrap + '">'+
                        '       <div class="codecola-gradient-panel" id="' + ids.panel + '"></div>'+
                        '   </div>' +
                        '   <div class="codecola-gradient-stops" id="' + ids.stops + '"></div>' +
                        '   <div class="codecola-gradient-orientation-wrap">' +
                        '       <label class="codecola-gradient-label" for="' + ids.orientation + '">Orientation:</label>' +
                        '	    <select class="codecola-gradient-orientation" id="' + ids.orientation + '">' +
                        '		    <option value="horizontal">horizontal</option>' +
                        '		    <option value="vertical">vertical</option>' +
                        '	    </select>' +
                        '   </div>' +
                        '   <div class="codecola-gradient-stop-detail" id="' + ids.stopDetail + '">' +
                        '	    <div class="codecola-gradient-color-wrap">' +
                        '		    <label class="codecola-gradient-label">Color:</label>' +
                        '		    <div class="codecola-gradient-color" id="' + ids.color + '"></div>' +
                        '	    </div>' +
                        '	    <div class="codecola-gradient-location-wrap">' +
                        '		    <label for="' + ids.location + '" class="codecola-gradient-label">Location:</label>' +
                        '		    <input type="text" class="codecola-gradient-location" id="' + ids.location + '"> %' +
                        '	    </div>' +
                        '	    <div class="codecola-gradient-stop-delete">' +
                        '		    <button class="codecola-gradient-stop-delete-button" id="' + ids.button + '">delete</button>' +
                        '	    </div>' +
                        '   </div>'+
                        '</div>';

            //create nodes
            var that = this;
            Y.one(that.get('wrap')).append(Y.Node.create(html));

            that.vars = {
                panel: Y.one('#'+ids.panel),
                panelWrap: Y.one('#'+ids.panelWrap),
                stops: Y.one('#'+ids.stops),
                color: Y.one('#'+ids.color),
                location: Y.one('#'+ids.location),
                button: Y.one('#'+ids.button),
                orientation: Y.one('#'+ids.orientation),
                stopDetail: Y.one('#'+ids.stopDetail),
                id: 0,
                colorControl: null,
                currentStop: null,
                disable: false,
                rule: {
                    type: "",
                    orientation: "",
                    stops: []
                }
            };

            that.vars.panelWrap.setStyle("width", that.get('panelWidth'));
            that.vars.stops.setStyle("width", that.get('panelWidth'));

            that.vars.colorControl = new Y.codecolaColor({
                wrap: '#'+ids.color,
                afterChange: function(color) {
                    var cStop = that.vars.currentStop;
                    if (!cStop || that.vars.disable) {
                        return;
                    }
                    that.vars.rule.stops[cStop.getAttribute("index")].color = color;
                    cStop.setStyle("backgroundColor", color);
                    that.updatePanel();
                }
            });
            that.vars.colorControl.render();
        },

        bindUI: function() {
            var that = this,
                vars = that.vars,
                rule = vars.rule;
            vars.orientation.on("change", function(e) {
                rule.orientation = this.get('value');
                that.updatePanel();
            });
            vars.stops.on("click", function(e) {
                if (e.target.get('nodeName') == "I" || vars.disable) {
                    return;
                }
                var s = {
                    "color": vars.colorControl.getColor(),
                    "position": that.getFloatLeft(e.clientX - vars.panel.getX() - 5)
                };
                that.addStops([s]);
                that.updatePanel();
            });
            vars.location.on("change", function(e) {
                var cStop = vars.currentStop;
                if (!cStop) {
                    return;
                }
                var left = this.get('value');
                if (!/^100$|^[1-9]\d$|^\d$/.test(left)) {
                    return;
                }
                left = that.percentToFloat(left + "%");
                rule.stops[cStop.getAttribute("index")].position = left;
                cStop.setStyle("left", that.getPixLeft(left));
                that.updatePanel();
            });
            vars.button.on("click", function(e) {
                var cStop = vars.currentStop;
                //that.vars.stops.getElementsByTagName("i").length <= 2
                if (!cStop) {
                    return;
                }
                delete rule.stops[cStop.getAttribute("index")];
                vars.stops.removeChild(cStop);
                vars.colorControl.disable();
                vars.location.set('disabled', true);
                vars.button.set('disabled', true);
                that.updatePanel();
            });
        },

        syncUI: function() {
            this.updateRule();
            this.updateContorls();
        },

        /**
         * @method init
         * @param {Event}
         * @return {Number}
         */
        updateRule: function(){
            this.removeStops();

            var
            rule = this.vars.rule,
            stops = [],
            gradient = this.get('gradient');

            if (/-webkit-gradient/.test(gradient)) {
                gradient = gradient.replace(/\s*,\s*/g, ",").replace("-webkit-gradient(", "").replace(/\)$/, "").split(/,(?=[fct])/);
                var part1 = gradient[0].split(",");
                rule.type = part1[0];
                rule.orientation = part1[1] + "," + part1[2];
                rule.orientation = rule.orientation == "0% 0%,100% 0%" ? "horizontal" : "vertical";
                for (var i = 1, j = gradient.length; i < j; i++) {
                    var c = gradient[i];
                    if (/color/.test(c)) {
                        c = c.replace("color-stop(", "").replace(/\)$/, "").split(/,(?=r)/);
                    } else if (/from/.test(c)) {
                        c = [0, c.replace(/from\(|/, "").replace(/\)$/, "")];
                    } else {
                        c = [1, c.replace(/to\(/, "").replace(/\)$/, "")];
                    }
                    stops.push({
                        "position": c[0],
                        "color": c[1]
                    });
                }
            } else {
                gradient = gradient.replace(/\s*,\s*/g, ",").replace(/-(moz|o|ms|webkit)-linear-gradient\(/, "").replace(/\)$/, "").split(/,(?=[r#])/);
                rule.type = "linear";
                rule.orientation = gradient[0];
                rule.orientation = rule.orientation == "left" ? "horizontal" : "vertical";
                for (var i = 1, j = gradient.length; i < j; i++) {
                    var c = gradient[i].split(" ");
                    stops.push({
                        "position": this.percentToFloat(c[1]),
                        "color": c[0]
                    });
                }
            }
            this.addStops(stops);
        },

        updateContorls: function() {
            this.updatePanel();
            this.updateOrientation();
        },

        updatePanel: function() {
            var that = this;
            that.vars.panel.setStyle("backgroundImage", that.getGradient(true));
            that.get('afterChange')(that.getGradient(false, that.get('isAll')));
        },

        updateOrientation: function() {
            this.vars.orientation.set('value', this.vars.rule.orientation);
        },
        setGradient: function(parms) {
            this.set('gradient', parms.gradient);
            this.updateRule();
        },
        addStops: function(stops) {
            var that = this;
            Y.each(stops, function(s) {
                var id = that.vars.id;
                that.vars.rule.stops[id] = s;
                that.createStop(s, id);
                that.vars.id++;
            });
        },
        createStop: function(s, id) {
            var
            that = this,
            i = Y.Node.create('<i class="codecola-gradient-stop" index="'+id+'"></i>'),
            p = that.getPixLeft(s.position);
            i.setStyles({
                left: p,
                backgroundColor: s.color
            });
            that.vars.stops.append(i);
            that.initStopEvent(i, id);
            that.changeCurrentStop(i);
        },
        initStopEvent: function(node, id) {
            var preX, preEventX, drag = false,
                that = this,
                doc = Y.one('html'),
                panelWidth = that.get('panelWidth');
            node.on("mousedown", function(e) {
                if (that.vars.disable) {
                    return;
                }
                doc.setStyle("webkitUserSelect", "none");
                that.changeCurrentStop(node);
                drag = true;
                preX = that.getPixLeft(that.vars.rule.stops[id].position, true);
                preEventX = e.pageX;
            });
            doc.on("mouseup", function(e) {
                if (drag || !that.vars.disable) {
                    doc.setStyle("webkitUserSelect", "");
                    drag = false;
                }
            });
            doc.on("mousemove", function(e) {
                if (!drag || that.vars.disable) {
                    return;
                }
                var left = preX + (e.pageX - preEventX);
                if (left < -5 || left > panelWidth - 5) {
                    return;
                }
                node.setStyle("left", left + "px");
                var floatLeft = that.getFloatLeft(left);
                that.vars.rule.stops[id].position = floatLeft;
                that.vars.location.set('value', that.floatToPercent(floatLeft, true));
                that.updatePanel();
            });
        },
        changeCurrentStop: function(s) {
            var that = this,
                preStop = that.vars.currentStop,
                selectClassName = "codecola-gradient-stop-select",
                cStop = that.vars.rule.stops[s.getAttribute("index")];
            if (preStop) {
                preStop.removeClass(selectClassName);
            }
            s.addClass(selectClassName);
            that.vars.currentStop = s;
            that.vars.colorControl.able();
            that.vars.location.set('disabled', false);
            that.vars.button.set('disabled', false);
            that.vars.colorControl.setColor({
                "color": cStop.color
            });
            that.vars.location.set('value', that.floatToPercent(cStop.position, true));
        },
        removeStops: function() {
            this.vars.rule.stops = [];
            this.vars.stops.empty();
        },
        getGradient: function(isPanel, isAll) {
            var rule = this.vars.rule,
                tempStops = [].concat(rule.stops),
                stops = {
                    webkit: "",
                    moz: ""
                },
                orientation = {},
                webkit, moz, o, ms;
            if (rule.orientation == "horizontal" || isPanel) {
                orientation = {
                    "webkit": "0% 0%,100% 0%",
                    "moz": "left"
                }
            } else {
                orientation = {
                    "webkit": "0% 0%,0% 100%",
                    "moz": "top"
                }
            }
            tempStops.sort(function(a, b) {
                return a.position - b.position;
            });
            for (var i = 0, j = tempStops.length; i < j; i++) {
                var cStop = tempStops[i];
                if (!cStop) {
                    continue;
                }
                var p = cStop.position,
                        c = cStop.color;
                if (p == 0) {
                    stops.webkit += ",from(" + c + ")";
                } else if (p == 1) {
                    stops.webkit += ",to(" + c + ")";
                } else {
                    stops.webkit += ",color-stop(" + p + "," + c + ")";
                }
                stops.moz += "," + c + " " + this.floatToPercent(p);
            }
            webkit = "-webkit-gradient(" + rule.type + "," + orientation.webkit + stops.webkit + ")";
            moz = "-moz-linear-gradient(" + orientation.moz + stops.moz + ")";
            o = "-o-linear-gradient(" + orientation.moz + stops.moz + ")";
            ms = "-ms-linear-gradient(" + orientation.moz + stops.moz + ")";
            if (isAll) {
                return {
                    "webkit": webkit,
                    "moz": moz,
                    "o": o,
                    "ms": ms
                };
            }

            if (Y.UA.webkit) {
                return webkit;
            } else if (Y.UA.gecko) {
                return moz;
            } else if (Y.UA.opera) {
                return o;
            } else if (Y.UA.ie) {
                return ms;
            }
        },
        getFloatLeft: function(leftPix) {
            var floatLeft = ((leftPix + 5) / this.get('panelWidth')).toFixed(2);
            if (floatLeft > 1) {
                return 1;
            }
            if (floatLeft < 0) {
                return 0;
            }
            return floatLeft;
        },
        getPixLeft: function(leftFloat, isNum) {
            var panelWidth = this.get('panelWidth'),
                pixLeft = Math.round(leftFloat * panelWidth) - 5;

            if (pixLeft > panelWidth - 5) {
                pixLeft = panelWidth - 5;
            }
            if (pixLeft < -5) {
                pixLeft = -5;
            }
            if (isNum) {
                return pixLeft;
            } else {
                return pixLeft + "px";
            }
        },
        percentToFloat: function(percent) {
            return parseInt(percent.replace("%", ""), 10) / 100;
        },
        floatToPercent: function(_float, isNum) {
            var percent = Math.round(_float * 100);
            if (isNum) {
                return percent;
            }
            return percent + "%";
        },
        disable: function() {
            var vars = this.vars;
            vars.colorControl.disable();
            vars.orientation.set('disabled', true);
            vars.location.set('disabled', true);
            vars.button.set('disabled', true);
            vars.disable = true;
        },
        able: function() {
            var vars = this.vars;
            vars.colorControl.able();
            vars.orientation.set('disabled', false);
            vars.location.set('disabled', false);
            vars.button.set('disabled', false);
            vars.disable = false;
        }
    }, {
        ATTRS:{
            wrap: {
                value: 'body',
                validator: Y.Lang.isString
            },
            gradient: {
                value: (function() {
                    if (Y.UA.webkit) {
                        return "-webkit-gradient(linear, 0% 0%, 100% 0%, from(#000), to(#fff))";
                    } else if (Y.UA.gecko) {
                        return "-moz-linear-gradient(left , #000 0%, #fff 100%)";
                    } else if (Y.UA.opera) {
                        return "-o-linear-gradient(left , #000 0%, #fff 100%)";
                    } else if ( Y.UA.ie) {
                        return "-ms-linear-gradient(left , #000 0%, #fff 100%)";
                    }
                })()
            },
            panelWidth: {
                value: 200,
                validator: Y.Lang.isNumber
            },
            isAll: {
                value: false,
                validator: Y.Lang.isBoolean
            },
            afterChange: {
                value: function() {
                },
                validator: Y.Lang.isFunction
            }
        }
    });
}, '1.0.0', {requires:['codecola-color', 'node', 'widget', 'ua', 'codecola-gradient-css']});