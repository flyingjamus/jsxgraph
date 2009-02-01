/*
    Copyright 2008,2009
        Matthias Ehmann,
        Michael Gerhaeuser,
        Carsten Miller,
        Bianca Valentin,
        Alfred Wassermann,
        Peter Wilfahrt

    This file is part of JSXGraph.

    JSXGraph is free software: you can redistribute it and/or modify
    it under the terms of the GNU Lesser General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    JSXGraph is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Lesser General Public License for more details.

    You should have received a copy of the GNU Lesser General Public License
    along with JSXGraph.  If not, see <http://www.gnu.org/licenses/>.

*/
JXG.IntergeoReader = new function() {
    this.board = null;
    this.objects = {};

    this.readIntergeo = function(tree,board) {
        this.board = board;
        this.board.origin = {};
        this.board.origin.usrCoords = [1, 0, 0];
        this.board.origin.scrCoords = [1, 400, 300];
        this.board.unitX = 30;
        this.board.unitY = 30;

        this.readElements(tree.getElementsByTagName("elements"));
        this.readConstraints(tree.getElementsByTagName("constraints"));
    };

    this.readElements = function(tree) {
        //$('debug').innerHTML = '';
        for (var s=0;s<tree[0].childNodes.length;s++) (function(s) {
            var node = tree[0].childNodes[s];
            if (node.nodeType>1) { return; } // not an element node
            if (node.nodeName=='point') {
                JXG.IntergeoReader.addPoint(node);
            } 
            else if (node.nodeName=='line') {
                JXG.IntergeoReader.storeLine(node);
            } 
            else {
                //$('debug').innerHTML += node.nodeName + ' ' + node.getAttribute('id') + '<br>';
            }
        })(s);
    };

    /**
     * Points are created instantly via createElement
     */
    this.addPoint = function(node) {
        var i = 0;
        var el;
        var p = node.childNodes[i];
        while (p.nodeType>1) {
            i++;
            p = node.childNodes[i];
        }
        //var id = node.getAttribute('id');
        if (p.nodeName == 'homogeneous_coordinates') {
            var c = [];
            for (var j=0;j<p.childNodes.length;j++) {
                if (p.childNodes[j].nodeType==1) {
                    if (p.childNodes[j].nodeName=='double') {
                        c.push(p.childNodes[j].firstChild.data);  // content of <double>...</double>
                    } else {
                        //$('debug').innerHTML += 'Not: '+ p.childNodes[j].nodeName + '<br>';  // <complex>
                    }
                }
            }
            for (j=0;j<3;j++) { c[j] = parseFloat(c[j]); }
            el = this.board.createElement('point',[c[2],c[0],c[1]], {name:node.getAttribute('id')});
        } else if (p.nodeName == 'euclidean_coordinates') {
            var c = [];
            for (var j=0;j<p.childNodes.length;j++) {
                if (p.childNodes[j].nodeType==1) {
                    c.push(p.childNodes[j].firstChild.data);  // content of <double>...</double>
                }
            }
            el = this.board.createElement('point',[c[0],c[1]], {name:node.getAttribute('id')});
        } else if (p.nodeName == 'polar_coordinates') {
            var c = [];
            for (var j=0;j<p.childNodes.length;j++) {
                if (p.childNodes[j].nodeType==1) {
                    c.push(p.childNodes[j].firstChild.data);  // content of <double>...</double>
                }
            }
            //alert(c[0] + ' ' +c[1]);
            el = this.board.createElement('point',[c[0]*Math.cos(c[1]),c[0]*Math.sin(c[1])],{name:node.getAttribute('id')});
        } else {
            return; //$('debug').innerHTML += "This coordinate type is not yet implemented: " +p.nodeName+'<br>';
        }
        this.objects[node.getAttribute('id')] = el;
    };

    /**
     * Line data is stored in an array
     * for further access during the reading of constraints.
     * There, id and name are needed.
     **/
    this.storeLine = function(node) {
        this.objects[node.getAttribute('id')] = {'id':node.getAttribute('id'), 'coords':null};
        var i = 0;
        var p = node.childNodes[i];
        while (p.nodeType>1) {
            i++;
            p = node.childNodes[i];
        }
        if (p.nodeName == 'homogeneous_coordinates') {
            var c = [];
            for (var j=0;j<p.childNodes.length;j++) {
                if (p.childNodes[j].nodeType==1) {
                    if (p.childNodes[j].nodeName=='double') {
                        c.push(parseFloat(p.childNodes[j].firstChild.data));  // content of <double>...</double>
                    } else {
                        //$('debug').innerHTML += 'Not: '+ p.childNodes[j].nodeName + '<br>';  // <complex>
                    }
                }
            }
            this.objects[node.getAttribute('id')].coords = c;
        }
    };

    this.readConstraints = function(tree) {
        for (var s=0;s<tree[0].childNodes.length;s++) (function(s) {
            var node = tree[0].childNodes[s];
            if (node.nodeType>1) { return; } // not an element node
            if (node.nodeName=='line_through_two_points') {
                JXG.IntergeoReader.addLineThroughTwoPoints(node);
            } 
            else if (node.nodeName=='line_parallel_to_line_through_point') {
                JXG.IntergeoReader.addLineParallelToLineThroughPoint(node);
            } 
            else if (node.nodeName=='line_perpendicular_to_line_through_point') {
                JXG.IntergeoReader.addLinePerpendicularToLineThroughPoint(node);
            } 
            else if (node.nodeName=='point_intersection_of_two_lines') {
                JXG.IntergeoReader.addPointIntersectionOfTwoLines(node);
            } 
            else if (node.nodeName=='free_point') {
                // do nothing
            } 
            else if (node.nodeName=='free_line') {
                JXG.IntergeoReader.addFreeLine(node);
            } 
            else if (node.nodeName=='point_on_line') {
                JXG.IntergeoReader.addPointOnLine(node);
            } 
            else if (node.nodeName=='angular_bisector_of_three_points') {
                JXG.IntergeoReader.addAngularBisectorOfThreePoints(node);
            } 
            else {
                //$('debug').innerHTML += 'NOT: ' + node.nodeName + '<br>';
            }
        })(s);

    };

    this.readParams = function(node) {
        var param = [];
        for (var j=0;j<node.childNodes.length;j++) {
            if (node.childNodes[j].nodeType==1) {
                param.push(node.childNodes[j].firstChild.data);
            }
        }
        return param;
    };

    this.addLineThroughTwoPoints = function(node) {
        var param = JXG.IntergeoReader.readParams(node); 
        var el = this.board.createElement('line',[this.objects[param[1]],this.objects[param[2]]], {name:param[0]});
        this.objects[param[0]] = el;
    };

    this.addLineParallelToLineThroughPoint = function(node) {
        var param = JXG.IntergeoReader.readParams(node); 
        var comp = this.board.createElement('parallel',[this.objects[param[1]].id,this.objects[param[2]].id], {name:param[0]});
        this.objects[param[0]] = comp;
    };

    this.addLinePerpendicularToLineThroughPoint = function(node) {
        var param = JXG.IntergeoReader.readParams(node); 
        var comp =this.board.createElement('perpendicular',[this.objects[param[1]].id,this.objects[param[2]].id],{name:param[0]});
        comp[0].setProperty("straightFirst:true","straightLast:true");
        comp[1].setProperty("visible:false");
        this.objects[param[0]] = comp[0];
    };

    this.addPointIntersectionOfTwoLines = function(node) {
        var param = JXG.IntergeoReader.readParams(node); 
        this.objects[param[0]].addConstraint([this.board.intersectionFunc(this.objects[param[1]],this.objects[param[2]],0)]);
    }

    this.addFreeLine = function(node) {
        var param = JXG.IntergeoReader.readParams(node); 
        var a = this.objects[param[0]].coords[0];
        var b = this.objects[param[0]].coords[1];
        var c = this.objects[param[0]].coords[2];
        var el = this.board.createElement('line',[c,a,b],{name:param[0],id:param[0]});
        this.objects[param[0]] = el;
    };

    this.addPointOnLine = function(node) {
        var param = JXG.IntergeoReader.readParams(node); 
        var el = JXG.GetReferenceFromParameter(this.board,param[0]);
        el.makeGlider(this.objects[param[1]]);
        this.objects[param[0]] = el;
    };

    this.addAngularBisectorOfThreePoints = function(node) {
        var param = JXG.IntergeoReader.readParams(node); 
        var el =this.board.createElement('bisector',[param[1],param[2],param[3]],{name:param[0],id:param[0]});
        el.setProperty("straightFirst:false","straightLast:true");
        this.objects[param[0]] = el;
    };

};


